import { Page, Dialog } from '@playwright/test';
import { PrecheckSession } from '../utils/session';
import { PrecheckInputs, CONFIG } from '../data/config';

export interface PrecheckResult {
  vehicleRegNo: string;
  jpjStatusLabel: string;
  responseDesc: string;
  transactionId: string;
}

export interface PrecheckDetailsCheck {
  vehicleRegNo: string;
  /** The overall Trx Status span at the top-right of the Details page
   *  ("Approved"/etc.) — NOT the same thing as `PrecheckResult.jpjStatusLabel`
   *  ('OK'/'Failed'), which only exists on the Step 3 Result screen, not
   *  here. See `verifyDetailsPage()`'s own doc comment. */
  trxStatus: string;
  responseDesc: string;
  paymentRowCount: number;
  paymentRowsAllOk: boolean;
  refNo: string;
}

// ── eDereg Pre-Checking Enquiry — standalone entry point ────
// 1 Vehicle -> 2 Payment -> 3 Result, all rendered on the SAME url via
// SPA-style content swap (no navigation between steps). Selectors and flow
// confirmed from live HTML — see _reference/codebases/AATF/
// EAINT-9306-precheck-step1-vehicle-consent.html and
// EAINT-9306-precheck-payment-and-result.html, and
// knowledge/flow-edereg.md §2/§3/§4.
export class PrecheckEnquiryPage {
  constructor(private readonly page: Page, private readonly session: PrecheckSession) {}

  /** AATF home -> eDEREG menu -> eDereg Pre-Checking Enquiry. */
  async openFromHome(): Promise<void> {
    const p = await this.session.waitForActivePage();
    await p.locator('#DEREGISTRATION').click();
    await this.session.waitForDomReady();
    await this.session.closeBanners();

    const menuPage = await this.session.waitForActivePage();
    await menuPage.locator('#precheck-transaction').click();
    await this.session.waitForDomReady();
    this.session.progress('open-precheck-enquiry', 'Open eDereg Pre-Checking Enquiry');
  }

  /** Step 1: fill vehicle no. + JPJ receipt email, tick consent. */
  async fillVehicleAndConsent(inputs: PrecheckInputs): Promise<void> {
    const p = await this.session.waitForActivePage();
    await p.locator('#vehicleRegNo').fill(inputs.vehicleRegNo);
    await p.locator('#jpjReceiptEmail').fill(inputs.jpjReceiptEmail);
    // Ticking this reveals #form-container (loses its "hidden" class) and
    // makes the two inputs above readonly — confirmed, STATE 2 of the step-1
    // capture. #to-enquiry lives inside that now-visible container.
    await p.locator('#aatf-consent').check();
    this.session.progress('vehicle-and-consent', 'Vehicle no. + consent ticked');
  }

  /** Step 1 -> Step 2: ENQUIRE NOW, confirm the "Yes" dialog. */
  async enquireNow(): Promise<void> {
    const p = await this.session.waitForActivePage();
    await p.locator('#to-enquiry').click();
    const confirmed = await this.session.confirmDialog();
    if (!confirmed) throw new Error('Expected #enquire-dialog after ENQUIRE NOW, none appeared.');
    this.session.progress('enquire-now', 'ENQUIRE NOW confirmed');
  }

  /** Step 2 -> Step 3: NEXT (pay), confirm the "Yes" dialog. This is the
   *  real bank + JPJ round trip, so give it real time before/after the
   *  click rather than the default action timeout. */
  async pay(): Promise<void> {
    const p = await this.session.waitForActivePage();
    await p.locator('#to-payment').click({ timeout: 20_000 });
    const confirmed = await this.session.confirmDialog(20_000);
    if (!confirmed) throw new Error('Expected #payment-dialog after NEXT, none appeared.');
    this.session.progress('payment', 'Payment confirmed');
  }

  /** Same Step 2 -> Step 3 transition as `pay()`, but DECLINE-AWARE — added
   *  2026-08-27 for MU_TS9B (the "same scenario, standalone flow instead of
   *  the Deregistration-embedded inline popup" comparison build,
   *  EAINT-9306). `pay()` itself only ever handles the happy path (every
   *  prior standalone-flow test — CPC_E2E_TS1, MU_TS7's User B leg — was
   *  Approved-only); this suite has NEVER observed live what the
   *  standalone flow's own FIRST payment attempt does on an RHB decline
   *  (IF/RE) — only the RETRY button reached via listing Resubmit is
   *  confirmed (MU_TS4, §22: native `confirm()` fires with the decline
   *  message, then the page re-renders with `#to-retry-rhb` + a
   *  `#payment-history-portion` list instead of reaching
   *  `#result-container`).
   *
   *  **GENUINELY UNCONFIRMED, best-effort based on that RETRY evidence**:
   *  since `openViaListingAndResubmit()` lands on this EXACT SAME page/step
   *  (MU_TS4's own finding — "reuses the SAME inner ids... same underlying
   *  template, just rendered standalone" — Resubmit is just a different
   *  ENTRY POINT into the identical Step 2 screen, not a different page),
   *  this method assumes the FIRST attempt's decline shape is identical to
   *  the RETRY button's already-confirmed one — clicking `#to-payment`
   *  ("NEXT") should behave the same as clicking `#to-retry-rhb` ("RETRY")
   *  once a decline happens, just with no Payment History to show yet on
   *  attempt #1. Flagged rather than guessed silently: if the real shape
   *  differs (e.g. `#result-container` renders directly with a
   *  Failed-but-not-retryable result instead), this method's `declined`
   *  branch will simply never trigger and the 90s wait will time out —
   *  informative on its own for the comparison this build exists for. */
  async attemptStandalonePayment(): Promise<{
    declined: boolean;
    dialogMessage: string;
    resultVehicleNo?: string;
    resultResponseDesc?: string;
  }> {
    const p = await this.session.waitForActivePage();
    const { result: confirmed, dialogMessage } = await this.session.withNativeConfirmCapture(
      () => p.locator('#to-payment').click({ timeout: 20_000 }).then(() => this.session.confirmDialog(20_000)),
    );
    if (!confirmed) throw new Error('Expected #payment-dialog ("Are you sure to make payment?") after NEXT, none appeared.');

    const which = await Promise.race([
      p.locator('#result-container').waitFor({ state: 'visible', timeout: 90_000 }).then(() => 'result' as const),
      p.locator('#to-retry-rhb:visible, #payment-history-portion:visible').first()
        .waitFor({ state: 'visible', timeout: 90_000 }).then(() => 'declined' as const),
    ]).catch(() => null);
    if (!which) {
      throw new Error('Expected either #result-container (success) or #to-retry-rhb/#payment-history-portion (declined) after the standalone flow\'s first payment attempt, neither appeared within 90s.');
    }

    if (which === 'declined') {
      this.session.progress('precheck-standalone-payment-declined', `Standalone first payment attempt declined — native dialog: "${dialogMessage}"`);
      await this.session.pauseForDetails();
      return { declined: true, dialogMessage };
    }

    const resultVehicleNo = (await p.locator('#responseVehicleNo').textContent().catch(() => ''))?.trim() ?? '';
    const resultResponseDesc = (await p.locator('#responseDesc').textContent().catch(() => ''))?.trim() ?? '';
    this.session.progress('precheck-standalone-payment-result', `Standalone first payment attempt succeeded — ${resultResponseDesc}`);
    await this.session.pauseForDetails();
    return { declined: false, dialogMessage, resultVehicleNo, resultResponseDesc };
  }

  /** Step 3: read the JPJ enquiry result off #result-container. */
  async readResult(): Promise<PrecheckResult> {
    const p = await this.session.waitForActivePage();
    // The bank + JPJ round trip runs behind the payment confirm's blockUI
    // overlay — budget real time for it rather than the default 30s action
    // timeout used elsewhere in this suite.
    await p.locator('#result-container').waitFor({ state: 'visible', timeout: 90_000 });

    const result: PrecheckResult = {
      vehicleRegNo: (await p.locator('#responseVehicleNo').textContent().catch(() => ''))?.trim() ?? '',
      jpjStatusLabel: (await p.locator('#jpjStatusLabel').getAttribute('value').catch(() => '')) ?? '',
      responseDesc: (await p.locator('#responseDesc').textContent().catch(() => ''))?.trim() ?? '',
      transactionId: '',
    };
    this.session.progress('result', `JPJ result: ${result.responseDesc}`);
    // This screen is DISPLAYING the result — hold on it for the recording,
    // per Faizuddin 2026-08-24 (knowledge/flow-edereg.md §12).
    await this.session.pauseForDetails();
    return result;
  }

  /** Step 3: Done -> transaction details view, extract the transaction id
   *  from the redirect URL (?id=<uuid>). */
  async done(): Promise<string> {
    const p = await this.session.waitForActivePage();
    await p.locator('#to-view').click();
    await this.session.waitForDomReady();
    const detailsPage = await this.session.waitForActivePage();
    const url = new URL(detailsPage.url());
    const transactionId = url.searchParams.get('id') ?? '';
    this.session.progress('done', 'Transaction details view');
    return transactionId;
  }

  /** Verifies the Pre-Checking transaction Details page (reached via
   *  `done()`, `view.do?id=<transactionId>`) shows the enquiry result and
   *  payment details correctly — the SRD's "Pre-checking details" /
   *  "Payment details" checklist items for CPC_E2E_TS1.
   *
   *  **Corrected 2026-08-24 from a live capture
   *  (`EAINT-9306-precheck-details-live-2026-08-24.html`) — this page does
   *  NOT reuse the standalone flow's `#responseVehicleNo`/`#jpjStatusLabel`/
   *  `#responseDesc` ids.** An earlier capture
   *  (`EAINT-9306-precheck-details-and-listing.html`) had elided this whole
   *  section with a comment ("same 12-attribute block as STATE 3") instead
   *  of real markup, and that assumption was wrong, not just incomplete —
   *  it cost two rounds of guessing (`#result-container`, then
   *  `#responseVehicleNo`), both of which timed out and silently killed the
   *  run right after the Pre-Checking leg. What actually exists here:
   *    - Vehicle no. is the first `<span>` inside `td.title1` (plain text,
   *      no id) — the title bar reads `<span style="color:red">HXA030</span>
   *      (Ref No.: PC68001157) - Transaction Details`.
   *    - The overall Trx Status ("Approved") is a `<span>` in `td.title1`'s
   *      immediate next sibling `<td>` — NOT the same value as
   *      `PrecheckResult.jpjStatusLabel` ('OK'/'Failed'), which only exists
   *      on the Step 3 Result screen.
   *    - "Enquiry Response:" (e.g. "GLB000000I - TRANSACTION SUCCESSFUL")
   *      is a plain `<span>` in a table row, no id either — read via the
   *      row's own label text.
   *    - `#validAsAt`/`#vehicleRecord`/`#vehicleStatus`/`#verifiedStatus`/
   *      `#usageCode`/`#jpjBlacklist`/`#jsjBlacklist`/`#agencyBlacklist`/
   *      `#claimOwnership`/`#vehicleInInvestigation`/`#vehicleCondition` DO
   *      exist and match — just not the 3 fields this method actually reads.
   *    - **The live page reuses `id="verifiedStatus"` a SECOND time** on the
   *      unrelated "Note: Able to proceed for eDereg" row — a real
   *      duplicate-id bug in the page itself. Not read by this method, but
   *      relevant if anything ever needs to target `#verifiedStatus`
   *      precisely (it will match 2 elements).
   *  Payment Details is a plain numbered list under the `Payment Details`
   *  `.title2` heading — each row's text is checked for "OK" (this ticket's
   *  only Approved-payment shape ever captured; a Failed-payment row's exact
   *  text is unconfirmed, so `paymentRowsAllOk` is only meaningful for the
   *  happy path — TS2's own Failed run never reaches this details page at
   *  all, since its inline retry resets `#vehicleRegNo` instead of
   *  continuing). Throws if the vehicle no. shown doesn't match, or if the
   *  Enquiry Response text never renders. */
  async verifyDetailsPage(vehicleRegNo: string): Promise<PrecheckDetailsCheck> {
    const p = await this.session.waitForActivePage();
    await p.locator('td.title1').waitFor({ state: 'visible', timeout: 20_000 });

    const shownVehicleNo = (await p.locator('td.title1 span').first().textContent().catch(() => ''))?.trim() ?? '';
    if (shownVehicleNo !== vehicleRegNo) {
      throw new Error(`Pre-Checking details page shows vehicle no. "${shownVehicleNo}", expected "${vehicleRegNo}" — enquiry details not shown correctly.`);
    }

    const trxStatus = (await p.locator('td.title1 + td span').textContent().catch(() => ''))?.trim() ?? '';
    const responseDesc = (await p.locator('tr:has-text("Enquiry Response:") td').nth(1).textContent().catch(() => ''))?.trim() ?? '';
    if (!responseDesc) {
      throw new Error('Pre-Checking details page: "Enquiry Response:" text is empty — enquiry details not shown.');
    }

    const paymentRows = p.locator('div.title2:has-text("Payment Details") + table tr');
    const paymentRowCount = await paymentRows.count();
    const paymentRowTexts = paymentRowCount > 0 ? await paymentRows.allTextContents() : [];
    const paymentRowsAllOk = paymentRowCount > 0 && paymentRowTexts.every(t => /\bOK\b/.test(t));

    // "(Ref No.: PC68001111)" in the title bar — the human-readable ref
    // JPJ XML Log searches by "Transaction Ref. ID", distinct from the
    // `?id=<uuid>` this class's own `done()` extracts.
    const titleText = (await p.locator('td.title1').textContent().catch(() => '')) ?? '';
    const refNo = titleText.match(/Ref No\.:\s*([A-Za-z0-9]+)/)?.[1] ?? '';

    this.session.progress(
      'precheck-details-verified',
      `Details page verified — Trx Status ${trxStatus}, enquiry response "${responseDesc}", ${paymentRowCount} payment row(s), all OK: ${paymentRowsAllOk}`,
    );
    // The whole Details page is on screen right now — hold before whatever
    // navigates away next, per Faizuddin 2026-08-24 (knowledge/flow-edereg.md §12).
    await this.session.pauseForDetails();
    return { vehicleRegNo: shownVehicleNo, trxStatus, responseDesc, paymentRowCount, paymentRowsAllOk, refNo };
  }

  /** Looks up a vehicle's Pre-Checking transaction ID via the "eDereg
   *  Pre-Checking Transaction Listing" page, filtered by vehicle no. — for
   *  entry points that never render their own Details/"Done" view, i.e. the
   *  inline pre-check triggered from Deregistration Step 2
   *  (CPC_E2E_TS10/TS11/TS12's Part 1). Confirmed URL param
   *  (`?vehicleNo=<plate>&autoSearch=true`, §3 URL map) and the listing
   *  table's "View" link shape from
   *  `_reference/codebases/AATF/EAINT-9306-precheck-details-and-listing.html`
   *  (captured 2026-08-21, only 1 row existed there) — NEVER exercised live
   *  via automation. Takes the FIRST row's link, so this assumes the vehicle
   *  has exactly one pre-checking transaction at the time of the call (true
   *  right after TS10/11/12 Part 1's inline pre-check, before any Part 2
   *  attempt exists) — if a vehicle can have multiple, this needs a real
   *  row-selection strategy instead of `.first()`. */
  async findTransactionIdByVehicleNo(envSegment: string, vehicleRegNo: string): Promise<string> {
    const p = await this.session.waitForActivePage();
    await p.goto(`${CONFIG.baseUrlFor(envSegment)}/view/aatf/dereg/precheck/enquiry/main.do?vehicleNo=${encodeURIComponent(vehicleRegNo)}&autoSearch=true`);
    await this.session.waitForDomReady();

    const viewLink = p.locator('#result table a', { hasText: 'View' }).first();
    const found = await viewLink.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false);
    if (!found) {
      this.session.progress('precheck-listing-lookup', `No pre-checking transaction found for ${vehicleRegNo}`);
      return '';
    }

    const href = await viewLink.getAttribute('href');
    const transactionId = href ? new URL(href, p.url()).searchParams.get('id') ?? '' : '';
    this.session.progress('precheck-listing-lookup', `Looked up pre-checking transaction ID for ${vehicleRegNo}: ${transactionId || '(none found in href)'}`);
    // The listing table is on screen right now — hold before navigating
    // into the details view, per Faizuddin 2026-08-24 (knowledge/flow-edereg.md §12).
    await this.session.pauseForDetails();
    return transactionId;
  }

  /** Same listing/URL as `findTransactionIdByVehicleNo()`, but returns how
   *  many Pre-Checking transaction rows came back instead of the first
   *  one's id — added 2026-08-26 for MU_TS2 (a vehicle CAN have more than
   *  one Pre-Checking transaction when different companies each buy their
   *  own, unlike MU_TS1's same-company reuse case). Uses the confirmed
   *  `autoSearch=true` query param rather than a manual fill+click, so
   *  there's no click-triggers-reload race to guard against here (see
   *  DeregTransactionListingPage.countTransactionsForVehicle()'s own doc
   *  comment for that bug on the OTHER listing, which lacks an
   *  autoSearch-by-URL option). */
  async countTransactionsForVehicle(envSegment: string, vehicleRegNo: string): Promise<number> {
    const p = await this.session.waitForActivePage();
    await p.goto(`${CONFIG.baseUrlFor(envSegment)}/view/aatf/dereg/precheck/enquiry/main.do?vehicleNo=${encodeURIComponent(vehicleRegNo)}&autoSearch=true`);
    await this.session.waitForDomReady();

    // Wait for the search to actually resolve (a row, or confirm there's
    // genuinely none) before counting — matches findTransactionIdByVehicleNo's
    // own wait shape.
    await p.locator('#result table a', { hasText: 'View' }).first()
      .waitFor({ state: 'visible', timeout: 15_000 }).catch(() => { /* genuinely empty — fall through to count 0 below */ });

    const rowCount = await p.locator('#result table tbody tr:not(.header)').count();
    this.session.progress('precheck-listing-count', `Pre-Checking listing for ${vehicleRegNo}: ${rowCount} transaction(s)`);
    await this.session.pauseForDetails();
    return rowCount;
  }

  /** Same listing/URL again, but reads the FIRST row's "JPJ Pre-Checking"/
   *  "Trx Status"/"Payment" column text instead of just a row count — added
   *  2026-08-26 for MU_TS6, which checks that a same-company vehicle's
   *  EXISTING Failed Pre-Checking record updates in place to OK rather than
   *  a new row appearing alongside it (the corrected test plan's own "ensure
   *  the same failed pre-check changes to OK", as opposed to MU_TS2/TS3's
   *  different-company case where a genuinely NEW row is expected instead).
   *  Column order confirmed from a live listing snapshot (MU_TS5's own first
   *  run, 2026-08-26): # / Vehicle / Transaction No. / Created At / Payment /
   *  JPJ Pre-Checking / Trx Status / e-Invoice Status / Remarks / Action.
   *  Takes the FIRST row, same one-row assumption `countTransactionsForVehicle`
   *  callers already rely on for this scenario. Confirmed live 2026-08-26 —
   *  the reading itself works (correctly reported `rowCount: 2`, the
   *  original Failed row plus a new separate Approved one), it's the
   *  "updates in place" ASSUMPTION that turned out wrong — see MU_TS6's own
   *  spec header comment and knowledge/flow-edereg.md §24.
   *
   *  `remarks` (column index 8) added 2026-08-27 for CJ_TS1–5 — the
   *  cronjob's own "Remarks = Transaction Expired" expected result (§5.5)
   *  needed a real reader instead of just Trx Status. */
  async getListingStatusForVehicle(envSegment: string, vehicleRegNo: string): Promise<{
    rowCount: number;
    paymentStatus: string;
    jpjPreChecking: string;
    trxStatus: string;
    remarks: string;
  }> {
    const p = await this.session.waitForActivePage();
    await p.goto(`${CONFIG.baseUrlFor(envSegment)}/view/aatf/dereg/precheck/enquiry/main.do?vehicleNo=${encodeURIComponent(vehicleRegNo)}&autoSearch=true`);
    await this.session.waitForDomReady();

    await p.locator('#result table a', { hasText: 'View' }).first()
      .waitFor({ state: 'visible', timeout: 15_000 }).catch(() => { /* genuinely empty — fall through below */ });

    const rows = p.locator('#result table tbody tr:not(.header)');
    const rowCount = await rows.count();
    let paymentStatus = '';
    let jpjPreChecking = '';
    let trxStatus = '';
    let remarks = '';
    if (rowCount > 0) {
      const texts = (await rows.first().locator('td').allTextContents()).map(t => t.trim());
      paymentStatus = texts[4] ?? '';
      jpjPreChecking = texts[5] ?? '';
      trxStatus = texts[6] ?? '';
      remarks = texts[8] ?? '';
    }
    this.session.progress('precheck-listing-status', `Pre-Checking listing for ${vehicleRegNo}: ${rowCount} row(s), JPJ Pre-Checking "${jpjPreChecking}", Trx Status "${trxStatus}", Remarks "${remarks}"`);
    await this.session.pauseForDetails();
    return { rowCount, paymentStatus, jpjPreChecking, trxStatus, remarks };
  }

  /** Opens the Pre-Checking listing, finds `vehicleRegNo`'s row, clicks
   *  "Resubmit" — added 2026-08-26 for MU_TS4. Lands on the standalone
   *  "eDereg Pre-Checking Enquiry" flow's OWN Step 2 (Payment) page — a
   *  FULL PAGE (own header/wizard, `#custom-header`), NOT the inline
   *  `#precheck-popup` shown mid-Deregistration-Step-2 — confirmed live
   *  2026-08-26 via a real HTML capture
   *  (`EAINT-9306-precheck-resubmit-standalone.html`). The "Resubmit" link
   *  itself is confirmed to exist (a live MU_TS3 screenshot's Action
   *  column, "View | Resubmit"). */
  async openViaListingAndResubmit(envSegment: string, vehicleRegNo: string): Promise<void> {
    const p = await this.session.waitForActivePage();
    await p.goto(`${CONFIG.baseUrlFor(envSegment)}/view/aatf/dereg/precheck/enquiry/main.do?vehicleNo=${encodeURIComponent(vehicleRegNo)}&autoSearch=true`);
    await this.session.waitForDomReady();

    const resubmitLink = p.getByRole('link', { name: 'Resubmit' }).first();
    await resubmitLink.waitFor({ state: 'visible', timeout: 15_000 });
    await resubmitLink.click();
    await this.session.waitForDomReady();
    this.session.progress('precheck-listing-resubmit', `Clicked Resubmit for ${vehicleRegNo} from the Pre-Checking listing`);
  }

  /** Same navigation as `openViaListingAndResubmit()`, but for a record
   *  BackOffice has ALREADY cancelled — added 2026-08-27 for MU_TS10
   *  (EAINT-9306). **GENUINELY UNCONFIRMED whether the "Resubmit" link even
   *  still renders on a Cancelled row.** `BoPrecheckTransactionListingPage`'s
   *  own "Cancel" link is confirmed gated to Pending/Failed rows only
   *  (§27) — this AATF-side listing's "Resubmit" link may or may not follow
   *  the same rule; no capture of a Cancelled row's Action column exists
   *  either way. Tolerant of both outcomes: if Resubmit is missing, reports
   *  that directly (`resubmitLinkFound: false`) instead of throwing a
   *  generic timeout that would obscure what actually happened; if it IS
   *  clickable, captures whatever native dialog fires during the click. */
  async openViaListingAndResubmitExpectingCancellation(envSegment: string, vehicleRegNo: string): Promise<{
    resubmitLinkFound: boolean;
    dialogMessage: string;
  }> {
    const p = await this.session.waitForActivePage();
    await p.goto(`${CONFIG.baseUrlFor(envSegment)}/view/aatf/dereg/precheck/enquiry/main.do?vehicleNo=${encodeURIComponent(vehicleRegNo)}&autoSearch=true`);
    await this.session.waitForDomReady();

    const resubmitLink = p.getByRole('link', { name: 'Resubmit' }).first();
    const resubmitLinkFound = await resubmitLink.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false);
    if (!resubmitLinkFound) {
      this.session.progress('precheck-listing-resubmit-cancelled', `No "Resubmit" link found for ${vehicleRegNo} — the Cancelled row may not offer one.`);
      return { resubmitLinkFound: false, dialogMessage: '' };
    }

    const { dialogMessage } = await this.session.withNativeConfirmCapture(
      () => resubmitLink.click().then(() => this.session.waitForDomReady()),
    );
    this.session.progress('precheck-listing-resubmit-cancelled', `Clicked Resubmit for ${vehicleRegNo} on the (BO-cancelled) record — dialog: "${dialogMessage}"`);
    return { resubmitLinkFound: true, dialogMessage };
  }

  /** Retries payment on the standalone page `openViaListingAndResubmit()`
   *  lands on. Confirmed live 2026-08-26 (WINNING side of a race): click
   *  `#to-retry-rhb` ("RETRY") -> a jQuery UI dialog opens (`#payment-dialog`,
   *  "Are you sure to make payment?", Yes/No — NOT the `#confirm-reset-dialog`
   *  checkbox NOTIFICATION this suite originally worried about; that one
   *  never actually fired) -> click "Yes" -> lands on `#result-container`
   *  (Step 3 Result), same shape `readResult()` already parses.
   *
   *  The LOSING side of the race is UNCONFIRMED — never observed live yet
   *  (this capture happened to be the winner). Per the test plan and
   *  Faizuddin's own description, the loser is expected to get a native
   *  `confirm()`/`alert()` ("Payment Paid"-ish), then possibly get
   *  redirected away from this page entirely (to the listing) rather than
   *  reaching `#result-container` at all. Handled defensively: if
   *  `#result-container` never appears within the timeout, this returns
   *  `outcome: 'declined-or-redirected'` with whatever dialog message was
   *  captured, rather than throwing — MU_TS4's own pass condition (per
   *  Faizuddin) only needs the two concurrent callers' outcomes to differ
   *  from each other, not a specific shape for the loser. */
  async attemptResubmitPayment(): Promise<{
    outcome: 'approved' | 'declined-or-redirected';
    dialogMessage: string;
    resultVehicleNo?: string;
    resultResponseDesc?: string;
  }> {
    const p = await this.session.waitForActivePage();

    const retryBtn = p.locator('#to-retry-rhb');
    await retryBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await retryBtn.click();

    const { result: confirmed, dialogMessage } = await this.session.withNativeConfirmCapture(
      () => this.session.confirmDialog(20_000, 'Yes'),
    );
    if (!confirmed) {
      throw new Error('Expected the #payment-dialog confirmation ("Are you sure to make payment?") after RETRY, none appeared.');
    }

    const wonRace = await p.locator('#result-container').waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true).catch(() => false);

    if (wonRace) {
      const resultVehicleNo = (await p.locator('#responseVehicleNo').textContent().catch(() => ''))?.trim() ?? '';
      const resultResponseDesc = (await p.locator('#responseDesc').textContent().catch(() => ''))?.trim() ?? '';
      this.session.progress('precheck-resubmit-payment', `Resubmit payment reached the result screen — ${resultResponseDesc}`);
      await this.session.pauseForDetails();
      return { outcome: 'approved', dialogMessage, resultVehicleNo, resultResponseDesc };
    }

    this.session.progress('precheck-resubmit-payment', `Resubmit payment did NOT reach the result screen — dialog was: "${dialogMessage}"`);
    return { outcome: 'declined-or-redirected', dialogMessage };
  }

  /** Same standalone Step 2 page `openViaListingAndResubmit()` lands on,
   *  but for a PENDING record that's never had ANY payment attempt yet —
   *  added 2026-08-26 for MU_TS7 (User A abandons the inline
   *  `#precheck-popup` on Deregistration Step 2 without clicking Next, so
   *  the record sits Pending/unpaid; later resumed via the listing's
   *  Resubmit link instead of re-triggering the Deregistration form's own
   *  gate again).
   *
   *  **UNCONFIRMED which button actually renders.** Every other Resubmit
   *  case built so far (MU_TS4/TS6) is for a record that already had a
   *  payment ATTEMPT (declined or JPJ-rejected), which renders
   *  `#to-retry-rhb` ("RETRY") with a Payment History block — that shape is
   *  confirmed live. A genuinely Pending/never-attempted record may instead
   *  render the standalone flow's ordinary first-attempt button
   *  (`#to-payment`, "NEXT" — the same one `pay()` uses on a fresh Step 1→2
   *  walkthrough), since there's no history to show yet. Checks for EITHER
   *  and clicks whichever is visible — expect this to need adjusting (or
   *  collapsing into one method) once the real markup is seen; per the
   *  standing HTML-capture rule, save it and update this +
   *  knowledge/flow-edereg.md in the same change once confirmed. */
  async resumePendingPayment(): Promise<{
    resultVehicleNo: string;
    resultResponseDesc: string;
  }> {
    const p = await this.session.waitForActivePage();

    const retryBtn = p.locator('#to-retry-rhb');
    const nextBtn = p.locator('#to-payment');
    const which = await Promise.race([
      retryBtn.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'retry' as const),
      nextBtn.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'next' as const),
    ]).catch(() => null);
    if (!which) throw new Error('Expected either #to-retry-rhb ("RETRY") or #to-payment ("NEXT") on the resumed Pending record\'s Step 2, neither appeared.');

    this.session.progress('precheck-resume-pending', `Resuming Pending record — found "${which === 'retry' ? 'RETRY' : 'NEXT'}" button`);
    await (which === 'retry' ? retryBtn : nextBtn).click({ timeout: 20_000 });

    const confirmed = await this.session.confirmDialog(20_000, 'Yes');
    if (!confirmed) throw new Error('Expected a payment confirmation dialog after resuming the Pending record, none appeared.');

    await p.locator('#result-container').waitFor({ state: 'visible', timeout: 90_000 });
    const resultVehicleNo = (await p.locator('#responseVehicleNo').textContent().catch(() => ''))?.trim() ?? '';
    const resultResponseDesc = (await p.locator('#responseDesc').textContent().catch(() => ''))?.trim() ?? '';
    this.session.progress('precheck-resume-pending-result', `Resumed Pending record's payment result: ${resultResponseDesc}`);
    await this.session.pauseForDetails();

    return { resultVehicleNo, resultResponseDesc };
  }

  /** Race-safe sibling of `resumePendingPayment()` — added 2026-08-27 for
   *  MU_TS8, where User B reaches this same standalone Step 2 page via
   *  Resubmit and clicks pay AT THE SAME TIME as User A's own inline
   *  `#precheck-popup` attempt (`DeregTransactionPage.attemptInlinePayment()`).
   *  `resumePendingPayment()` itself THROWS if no result screen appears —
   *  correct for MU_TS7's solo (uncontested) resume, wrong here, where the
   *  LOSING side of the race is an expected, not exceptional, outcome.
   *
   *  Per the test plan's own step 5, the loser should see a native dialog:
   *  "Duplicate RHB payment requests have been detected. This RHB payment
   *  request will not be sent. Please refresh the page to view the payment
   *  details." — **UNCONFIRMED VERBATIM, never observed live.** MU_TS4's own
   *  race (knowledge/flow-edereg.md §22) predicted this same message from
   *  the test plan but got "Transaction Approved" instead live — so this
   *  method captures whatever text actually fires via
   *  `withNativeConfirmCapture()` and logs it, rather than asserting the
   *  literal wording. Mirrors `attemptResubmitPayment()`'s shape exactly. */
  async attemptResumePendingPayment(): Promise<{
    outcome: 'approved' | 'declined-or-redirected';
    dialogMessage: string;
    resultVehicleNo?: string;
    resultResponseDesc?: string;
  }> {
    const p = await this.session.waitForActivePage();

    const retryBtn = p.locator('#to-retry-rhb');
    const nextBtn = p.locator('#to-payment');
    const which = await Promise.race([
      retryBtn.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'retry' as const),
      nextBtn.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'next' as const),
    ]).catch(() => null);
    if (!which) throw new Error('Expected either #to-retry-rhb ("RETRY") or #to-payment ("NEXT") on the resumed Pending record\'s Step 2, neither appeared.');
    this.session.progress('precheck-resume-pending-race', `Racing payment via "${which === 'retry' ? 'RETRY' : 'NEXT'}" button`);

    const { result: confirmed, dialogMessage } = await this.session.withNativeConfirmCapture(
      () => (which === 'retry' ? retryBtn : nextBtn).click({ timeout: 20_000 }).then(() => this.session.confirmDialog(20_000, 'Yes')),
    );
    if (!confirmed) {
      throw new Error('Expected a payment confirmation dialog after resuming the Pending record, none appeared.');
    }

    const wonRace = await p.locator('#result-container').waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true).catch(() => false);

    if (wonRace) {
      const resultVehicleNo = (await p.locator('#responseVehicleNo').textContent().catch(() => ''))?.trim() ?? '';
      const resultResponseDesc = (await p.locator('#responseDesc').textContent().catch(() => ''))?.trim() ?? '';
      this.session.progress('precheck-resume-pending-race-result', `Won the race — reached the result screen: ${resultResponseDesc}`);
      await this.session.pauseForDetails();
      return { outcome: 'approved', dialogMessage, resultVehicleNo, resultResponseDesc };
    }

    this.session.progress('precheck-resume-pending-race-result', `Lost the race — no result screen; native dialog was: "${dialogMessage}"`);
    return { outcome: 'declined-or-redirected', dialogMessage };
  }

  /** Actively RETRIES payment on the standalone Step 2 page AFTER
   *  BackOffice has cancelled the underlying transaction — added
   *  2026-08-27 for MU_TS9, to match `DeregTransactionPage.
   *  attemptInlineRetryAfterCancellation()`'s own mechanic (an ACTIVE
   *  retry attempt, not a passive page refresh). Confirmed live via
   *  MU_TS10: a plain `page.reload()` on the Deregistration-embedded
   *  inline flow stays completely silent (knowledge/flow-edereg.md §27),
   *  but ACTIVELY attempting to pay/retry against an already-cancelled
   *  record is a real submit hitting the server, which is where a
   *  "Transaction Cancelled" rejection would actually make sense to fire
   *  — Faizuddin's own reasoning for why MU_TS9 should be rebuilt this
   *  way instead of refreshing.
   *
   *  Checks for EITHER `#to-retry-rhb` ("RETRY", if payment history
   *  already exists) or `#to-payment` ("NEXT", if genuinely never
   *  attempted) — same either-or uncertainty `resumePendingPayment()`/
   *  `attemptResumePendingPayment()` already handle, since which one
   *  renders depends on the record's exact history at the moment this is
   *  called. Does NOT throw if the "Are you sure to make payment?"
   *  confirm dialog never appears — a cancelled record may skip straight
   *  to a rejection instead of that normal confirm step, so treating its
   *  absence as fatal would be the wrong failure mode here. Listens for a
   *  native dialog with an EXTRA grace window and holds it open for
   *  `CONFIG.detailsPauseMs` before accepting — the SAME capture-timing
   *  fix `attemptInlineRetryAfterCancellation()` needed after its own
   *  first live run, applied here from the start rather than repeating
   *  that mistake. */
  async attemptStandaloneRetryAfterCancellation(extraWaitMs = 10_000): Promise<{
    buttonClicked: 'retry' | 'next' | 'none';
    dialogMessage: string;
    urlAfter: string;
  }> {
    const p = await this.session.waitForActivePage();
    const retryBtn = p.locator('#to-retry-rhb');
    const nextBtn = p.locator('#to-payment');
    const which = await Promise.race([
      retryBtn.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'retry' as const),
      nextBtn.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'next' as const),
    ]).catch(() => null);
    if (!which) {
      this.session.progress('precheck-standalone-retry-cancelled', 'Neither #to-retry-rhb nor #to-payment appeared — nothing to click.');
      return { buttonClicked: 'none', dialogMessage: '', urlAfter: p.url() };
    }

    let dialogMessage = '';
    const onDialog = (dialog: Dialog) => {
      dialogMessage = dialog.message();
      setTimeout(() => { dialog.accept().catch(() => {}); }, CONFIG.detailsPauseMs);
    };
    p.on('dialog', onDialog);
    try {
      await (which === 'retry' ? retryBtn : nextBtn).click({ timeout: 20_000 });
      // The "Are you sure to make payment?" jQuery dialog may or may not
      // still appear on an already-cancelled record — confirm it if it
      // does, don't treat its absence as an error if it doesn't.
      await this.session.confirmDialog(20_000, 'Yes').catch(() => false);
      await p.waitForTimeout(extraWaitMs);
    } finally {
      p.off('dialog', onDialog);
    }
    this.session.progress('precheck-standalone-retry-cancelled', `Clicked "${which === 'retry' ? 'RETRY' : 'NEXT'}" on the (BO-cancelled) record — dialog: "${dialogMessage}"`);
    return { buttonClicked: which, dialogMessage, urlAfter: p.url() };
  }
}
