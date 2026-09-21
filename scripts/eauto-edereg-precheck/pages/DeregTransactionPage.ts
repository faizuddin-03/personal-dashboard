import { Page, Dialog } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrecheckSession } from '../utils/session';
import { PrecheckInputs, DeregVehicleInputs, CONFIG } from '../data/config';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { writeWaitStatus, clearWaitStatus } from '../utils/waitStatus';

export interface JpjCheckResult {
  jpjStatus: string;
  responseCode: string;
}

export interface DeregisterResult {
  jpjDeregistrationStatus: string;
  transactionId: string;
}

export interface PrecheckingLinkCheck {
  href: string;
  listingVehicleNoValue: string;
  listingHasRows: boolean;
  deregRefNo: string;
}

export interface VehicleGateResult {
  /** true = #precheck-result shows green success, vehicle no. stays filled,
   *  ready to continue with the rest of Step 2. false = the inline retry's
   *  outcome was Failed and the form reset #vehicleRegNo to blank instead
   *  (CPC_E2E_TS2/TS8's dead-end shape) — nothing further to fill. */
  satisfied: boolean;
  /** false when the gate was already green on first fill (no prior-pre-check
   *  vehicle path, e.g. CPC_E2E_TS1) — true when the inline
   *  #precheck-popup/#payment-result round trip actually ran. */
  usedInlinePrecheck: boolean;
  jpjStatus?: string;
  responseDesc?: string;
  /** Whether #vehicleRegNo was confirmed blank after the inline retry's
   *  dialog closed — logged for reference on both shapes, not part of any
   *  pass/fail condition (Close doing nothing further on the
   *  'closed-direct' shape is itself correct — see dialogShape below). */
  vehicleFieldBlank?: boolean;
  /** Which dialog shape actually appeared. 'paid' = the full round trip
   *  (Cancel/Next payment popup -> pay -> result, "Close") — the FIRST time
   *  a vehicle no. is checked, with no prior pre-check on file at all.
   *  'closed-direct' = a single result-only dialog with just "Close", no
   *  payment step — CORRECT, per Faizuddin 2026-09-02, when the vehicle
   *  ALREADY has a Failed pre-check on file: the system just pulls up and
   *  displays that existing failed result; Close does nothing further.
   *  (EAINT-12268 was raised on a mis-reading of the SRD that treated this
   *  shape as the bug; that QA issue has since been DROPPED FOR GOOD — it
   *  came out of miscommunication, not a defect. See flow-edereg.md §41.)
   *
   *  NARROWED 2026-09-04 (flow-edereg.md §40): this reshow is PER-CODE, not
   *  universal. `VEL000100E` (VEHICLE RECORD NOT EXIST) instead offers a
   *  fresh purchase and creates a NEW precheck transaction each time, so
   *  'closed-direct' is NOT the expected shape for that code. Callers that
   *  care about the distinction should use utils/repurchaseProbe.ts rather
   *  than reading `dialogShape` alone — this method returns as soon as it
   *  sees a Close button and so cannot tell "reshow, permanently" from
   *  "reshow once, then repurchase on the next entry". */
  dialogShape?: 'paid' | 'closed-direct';
}

export interface PaymentAttemptResult {
  /** true = the payment was declined (RHB "IF"/"RE") — `#precheck-popup`
   *  re-rendered with a Payment History list, ready for another
   *  `attemptInlinePayment()` call. false = a terminal `#payment-result`
   *  outcome (Approved or JPJ-Failed), already Closed. */
  declined: boolean;
  jpjStatus?: string;
  responseDesc?: string;
  /** The native `confirm()` dialog's own message text (added 2026-08-26 for
   *  OF_TS4, EAINT-9306) — every declined attempt fires this dialog
   *  (`withNativeConfirmCapture()`'s doc comment), and its wording varies
   *  by scenario (IF/RE's standard decline text vs. OF_TS4's dev-reset
   *  "Rhb payment internal error, please try again later."). `''` if none
   *  fired. */
  dialogMessage: string;
}

// Every file upload on this page (#aatfConsent, #photo1-3) uses the same
// real PDF, per standing instruction — a 1x1 placeholder PNG worked for
// none of these fields (confirmed live 2026-08-22: #aatfConsent needed a
// real file, and the same placeholder-PNG approach for photo1-3 silently
// failed to attach), so don't fabricate test evidence when a real file is
// available.
const DUMMY_UPLOAD_PATH = path.resolve(process.cwd(), '..', '..', '_reference', 'dummies', 'Test PDF.pdf');

// Fallback used when the NEW "Perakuan eDereg Pre-Checking - AATF" consent
// declaration's email field (#dpc-consent-email) shows up blank — see
// fillConsentEmailIfPresent()'s doc comment.
const FALLBACK_CONSENT_EMAIL = 'tester@email.com';

// ── Deregistration transaction — creation flow (EAINT-9306) ──
// Category select -> step 1 Owner (MyKad auth) -> step 2 Vehicle (compulsory
// pre-checking gate) -> step 3 AATF (owner-copy consent + auth, AATF-copy
// consent + rep auth) -> step 4 JPJ Check (native confirm) -> step 5 Payment
// (native confirm) -> step 6 Deregister result. Selectors and step order are
// confirmed from live HTML — see the EAINT-9306-dereg-* captures under
// _reference/codebases/AATF/ and knowledge/flow-edereg.md §3/§4.
//
// Assumes the vehicle already has an Approved/Paid/JPJ-Approved pre-check
// within the last 6 months (the "pre-check done in enquiry" entry point,
// §2) — i.e. this runs right after PrecheckEnquiryPage's happy path for the
// SAME vehicle no., so step 2's #precheck-result gate is expected to show
// the green success state immediately, with no inline pay-to-unblock detour.
export class DeregTransactionPage {
  constructor(
    private readonly page: Page,
    private readonly session: PrecheckSession,
    private readonly mykad: MykadEmulatorClient,
  ) {}

  /** AATF home -> eDEREG menu -> Create Deregistration Transaction -> owner
   *  category -> confirm. Assumes the active page is already on AATF home
   *  (or a page with the #home-link nav button). `category` defaults to
   *  MyKad (the only one confirmed live so far, EAINT-9306's original
   *  happy path). MyPR's category link renders the same doubled image+text
   *  shape (EAINT-9306-dereg-create-category-select.html STATE 1, category
   *  "0" vs MyKad's "1") and the confirmation dialog uses the same "YA"
   *  label — but MyPR's OWN owner-auth widget (post-confirm) has never been
   *  captured or run live; this assumes it's the identical MyKad/thumbprint
   *  widget (§4's "IDENTICAL structure... across all three auth points" was
   *  only confirmed for the MyKad category) and needs live verification. */
  async createFromHome(category: 'MYKAD' | 'MYPR' = 'MYKAD'): Promise<void> {
    let p = await this.session.waitForActivePage();
    await p.locator('#home-link').click();
    await this.session.waitForDomReady();
    await this.session.closeBanners();

    p = await this.session.waitForActivePage();
    await p.locator('#DEREGISTRATION').click();
    await this.session.waitForDomReady();
    await this.session.closeBanners();

    p = await this.session.waitForActivePage();
    await p.locator('#deregTransaction').click();
    await this.session.waitForDomReady();
    await this.session.closeBanners();

    p = await this.session.waitForActivePage();
    // The category-select page renders TWO `.owner-category[category="1"]`
    // (or `="0"` for MyPR) links for the same category — an image link and
    // a text link, side by side in adjacent <td>s
    // (EAINT-9306-dereg-create-category-select.html STATE 1) — so a plain
    // class+attribute locator is a strict-mode violation (matches 2
    // elements). Both fire the identical click handler; naming the text
    // link is just more self-documenting.
    const categoryName = category === 'MYKAD' ? 'Orang Awam Malaysia (MyKad)' : 'Penduduk Tetap Malaysia (MyPR)';
    await p.getByRole('link', { name: categoryName }).click();
    // "YA" (Malay), not "Yes" — see confirmDialog()'s confirmLabel note.
    const confirmed = await this.session.confirmDialog(15_000, 'YA');
    if (!confirmed) throw new Error(`Expected the category-confirmation dialog after selecting ${category}, none appeared.`);
    this.session.progress('dereg-category', `Deregistration transaction created — ${category} category`);
  }

  /** One MyKad/thumbprint auth screen: accept the PERINGATAN consent if
   *  present (owner step 1 only), insert the emulator's card, wait for the
   *  auto-read to complete, click Next. Shared shape across all three auth
   *  points (knowledge/flow-edereg.md §4 — identical widget structure). */
  private async runMykadAuth(step: string, label: string): Promise<void> {
    const p = await this.session.waitForActivePage();

    const peringatanYes = p.locator('#agreePeringatanConsent');
    if (await peringatanYes.isVisible().catch(() => false)) {
      await peringatanYes.click();
    }

    await p.locator('#mykad-control-container').waitFor({ state: 'visible', timeout: 15_000 });
    await this.mykad.insertCard();

    // hSmart__Card__Ready triggers an auto-read; #continueButton only
    // becomes clickable once photoReady/dataReady/verified are all set —
    // budget real time for the round trip, not the default action timeout.
    const continueBtn = p.locator('#continueButton');
    await continueBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await p.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLButtonElement | null;
        return !!el && !el.disabled;
      },
      '#continueButton',
      { timeout: 30_000 },
    );
    await continueBtn.click();
    await this.session.waitForDomReady();
    this.session.progress(step, label);
  }

  /** Step 1: Owner MyKad authentication. */
  async authenticateOwner(): Promise<void> {
    await this.runMykadAuth('dereg-step1-owner-auth', 'Step 1: Owner MyKad authentication');
  }

  /** Fills the NEW "Perakuan eDereg Pre-Checking - AATF" consent declaration's
   *  email field (`#dpc-consent-email`) if it's present on the currently-open
   *  dialog — added 2026-09-11 (EAINT-9306, SRD V1.2 §2.2.4-2.2.6). The
   *  declaration was inserted into the SAME "Vehicle and Payment Details"
   *  screen every `resolveVehicleGate()`/`attemptInlinePayment()`/
   *  `attemptInlineRetryAfterCancellation()` Next-click already drives — it is
   *  NOT a separate popup — so this is called right before each of those
   *  clicks rather than added as a new flow step.
   *
   *  Per REQ-007, the declaration only shows ONCE per new transaction (RHB
   *  payment status Pending) and never again on a retry/resubmit — but that
   *  is enforced by the app itself, not by this method: it just no-ops when
   *  `#dpc-consent-email` isn't on the current dialog, so every call site
   *  stays correct whether or not the declaration happens to be showing.
   *
   *  Per REQ-004/005, the email is mandatory and editable, and is
   *  prepopulated from the AATF company's DB record when one exists —
   *  sometimes blank if not. Leaves a prepopulated value untouched; fills
   *  `FALLBACK_CONSENT_EMAIL` when blank, since Next would otherwise get
   *  stuck on the field's own validation message
   *  (`#dpc-consent-email-invalid`). */
  private async fillConsentEmailIfPresent(): Promise<void> {
    const p = await this.session.waitForActivePage();
    const dialog = p.locator('.ui-dialog:visible').last();
    // The popup can still be rendering asynchronously right after the
    // gate-check/decline that triggers it (same class of timing gap as
    // fillVehicleRegNoAndCheckGate's own settle-before-fill note) — wait for
    // it rather than checking #dpc-consent-email a beat too early and
    // wrongly concluding the declaration isn't showing this time.
    await dialog.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
    const emailField = dialog.locator('#dpc-consent-email');
    if (await emailField.count() === 0) return;

    const current = await emailField.inputValue().catch(() => '');
    if (current.trim() !== '') {
      this.session.progress('dereg-consent-email', `Consent declaration email prepopulated: ${current}`);
      return;
    }
    await emailField.fill(FALLBACK_CONSENT_EMAIL);
    this.session.progress('dereg-consent-email', `Consent declaration email was blank — filled with fallback: ${FALLBACK_CONSENT_EMAIL}`);
  }

  /** Step 2's compulsory-gate check on `#vehicleRegNo` — shared by BOTH
   *  Deregistration entry points (flow-edereg.md §2). Fills + blurs the
   *  field (the gate check is off-click, confirmed live 2026-08-22 — filling
   *  alone never triggers it), then branches on what `#precheck-result`
   *  shows:
   *    - `.success` (green) immediately — a qualifying pre-check already
   *      exists (the "pre-check done in enquiry" entry point, e.g.
   *      CPC_E2E_TS1). Nothing more to do.
   *    - `.error` (red) — no qualifying pre-check exists (the "pre-check
   *      done in step 2" entry point, e.g. CPC_E2E_TS7/TS8/TS9). Drives the
   *      inline purchase: `#precheck-popup` (a jQuery UI dialog, RM10.40 fee
   *      summary) — Next pays and retrieves the result via `#payment-result`
   *      (also a jQuery UI dialog, single Close button) — REGARDLESS of
   *      whether the outcome turns out Approved or Failed, per
   *      flow-edereg.md §4. After Close: Approved -> `#precheck-result`
   *      turns green and `#vehicleRegNo` stays filled, ready to continue.
   *      Failed -> the form resets `#vehicleRegNo` to blank instead
   *      (CPC_E2E_TS2/TS8's dead-end shape) and there's nothing further to
   *      fill. `#payment-result`'s result block reuses the id
   *      `responseDesc` for BOTH "JPJ Pre-Checking Status" and "Enquiry
   *      Response" (confirmed from the captured HTML) — unlike the
   *      standalone enquiry's `#result-container`, which has only one, so
   *      JPJ status is read off the unambiguous `#jpjStatusLabel` hidden
   *      input instead, taking the LAST `#responseDesc` match for the
   *      response text. */
  async resolveVehicleGate(vehicleRegNo: string): Promise<VehicleGateResult> {
    const alreadySatisfied = await this.fillVehicleRegNoAndCheckGate(vehicleRegNo);
    if (alreadySatisfied) {
      this.session.progress('dereg-step2-gate', 'Vehicle gate already satisfied — no inline pre-check needed');
      return { satisfied: true, usedInlinePrecheck: false };
    }

    // Wrapped in withNativeConfirm() defensively — harmless no-op if no
    // native dialog fires (confirmed true for the Approved/JPJ-Failed shapes
    // this method has been run against so far), but a real browser
    // confirm() DOES fire on any attempt that gets DECLINED (RHB "IF"/"RE"
    // codes, see attemptInlinePayment()'s doc comment) — without this wrap,
    // that would auto-dismiss and look exactly like "the click did
    // nothing," the same failure mode #to-continue had (flow-edereg.md §8).
    // Not every "not satisfied" outcome goes through a payment step first —
    // TWO different dialog shapes have been observed live, 2026-09-02, and
    // BOTH are correct depending on setup (confirmed by Faizuddin directly,
    // after an earlier same-day pass mis-read the SRD and wrongly flagged
    // one of them as a bug — see knowledge/flow-edereg.md §33):
    //  - 'paid' — the full round trip (Cancel/Next payment popup -> pay ->
    //    result, "Close"). Correct when the vehicle has NO prior pre-check
    //    on file at all — a genuinely first-time check.
    //  - 'closed-direct' — a single result-only dialog with just "Close",
    //    no payment step. Correct when the vehicle ALREADY has a Failed
    //    pre-check on file (e.g. CPC_E2E_TS2's setup): the system just
    //    pulls up and displays that existing failed result; Close does
    //    nothing further.
    // Detect which shape actually appeared and report it via `dialogShape`
    // so callers can assert against whichever is correct for their setup.
    const dialogAppeared = await this.session.withNativeConfirm(async () => {
      const ap = await this.session.waitForActivePage();
      const dialog = ap.locator('.ui-dialog:visible').last();
      try {
        await dialog.waitFor({ state: 'visible', timeout: 20_000 });
      } catch {
        return null;
      }
      const closeOnly = await dialog.getByRole('button', { name: 'Close' }).count() > 0;
      if (closeOnly) {
        await dialog.getByRole('button', { name: 'Close' }).first().click({ timeout: 10_000 });
        await dialog.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
        return 'closed-direct' as const;
      }
      await this.fillConsentEmailIfPresent();
      await dialog.getByRole('button', { name: 'Next' }).first().click({ timeout: 10_000 });
      await dialog.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
      return 'paid' as const;
    });
    if (!dialogAppeared) throw new Error('Expected the inline #precheck-popup dialog ("Next" or "Close"), none appeared.');

    if (dialogAppeared === 'closed-direct') {
      const p2 = await this.session.waitForActivePage();
      // Give the field a moment to reset before reading it — the same class
      // of race already found elsewhere in this suite (dialog-capture
      // timing, AJAX-wait timing): don't read state the instant a dialog
      // closes, in case the reset is an async follow-up rather than
      // synchronous with the click.
      await p2.waitForFunction(() => {
        const veh = document.querySelector('#vehicleRegNo') as HTMLInputElement | null;
        return veh?.value === '';
      }, { timeout: 5_000 }).catch(() => { /* fall through — may genuinely stay filled */ });
      const vehicleFieldBlank = await p2.locator('#vehicleRegNo').inputValue().then(v => v === '').catch(() => false);
      this.session.progress('dereg-step2-inline-precheck-closed', `Vehicle No. field blank after Close: ${vehicleFieldBlank}`);
      return { satisfied: false, usedInlinePrecheck: true, vehicleFieldBlank, dialogShape: 'closed-direct' };
    }

    const p2 = await this.session.waitForActivePage();
    // :visible-scoped per the duplicate-id trap confirmed live 2026-08-26 on
    // attemptInlinePayment()'s own #payment-result wait — this page carries a
    // hidden/stale #payment-result node, so an unscoped selector risks
    // resolving to that instead of the real one. This call has only ever hit
    // the Approved/JPJ-Failed shape so far (never a decline here), but scope
    // it defensively the same way.
    await p2.locator('#payment-result:visible').waitFor({ state: 'visible', timeout: 90_000 });
    const jpjStatus = (await p2.locator('#jpjStatusLabel').getAttribute('value').catch(() => '')) ?? '';
    const responseDesc = (await p2.locator('#responseDesc').last().textContent().catch(() => ''))?.trim() ?? '';
    this.session.progress('dereg-step2-inline-precheck', `Inline pre-check result: ${jpjStatus} / ${responseDesc}`);
    // The result popup is displaying its verdict right now — hold before
    // Close, per Faizuddin 2026-08-24 (knowledge/flow-edereg.md §12).
    await this.session.pauseForDetails();

    const closed = await this.session.confirmDialog(15_000, 'Close');
    if (!closed) throw new Error('Expected the #payment-result dialog ("Close") after the inline payment, none appeared.');

    await p2.waitForFunction(() => {
      const success = document.querySelector('#precheck-result .success');
      const veh = document.querySelector('#vehicleRegNo') as HTMLInputElement | null;
      return (success && (success as HTMLElement).offsetParent !== null) || veh?.value === '';
    }, { timeout: 15_000 }).catch(() => { /* fall through to the explicit check below */ });

    const satisfied = await p2.locator('#precheck-result .success').isVisible().catch(() => false);
    const vehicleFieldBlank = await p2.locator('#vehicleRegNo').inputValue().then(v => v === '').catch(() => false);
    this.session.progress('dereg-step2-inline-precheck-closed', `Gate ${satisfied ? 'satisfied' : 'not satisfied'} after Close, Vehicle No. field blank: ${vehicleFieldBlank}`);

    return { satisfied, usedInlinePrecheck: true, jpjStatus, responseDesc, vehicleFieldBlank, dialogShape: 'paid' };
  }

  /** Fills + blurs `#vehicleRegNo` and waits for the compulsory-gate div to
   *  resolve, returning whether it's already `.success` (true) or `.error`
   *  (false, no qualifying pre-check — an inline flow is needed next).
   *  Shared by `resolveVehicleGate()` and `beginInlinePaymentFlow()`. Made
   *  public 2026-08-26 for `OtherFunctionsPage` (OF_TS1/OF_TS2, EAINT-9306)
   *  — those cases stop right at this gate-check (Cancel the inline popup,
   *  or submit with the field blank) instead of continuing into a real
   *  inline pre-check purchase. */
  async fillVehicleRegNoAndCheckGate(vehicleRegNo: string): Promise<boolean> {
    // Settle before filling — confirmed live 2026-09-02: filling this field
    // immediately on domcontentloaded surfaced a DIFFERENT popup/message
    // than the same manual action, because the page's own gate-check JS
    // wasn't done initializing yet. See knowledge/automation-playbook.md
    // "Page-load timing."
    const p = await this.session.waitForPageSettled();
    await p.locator('#vehicleRegNo').fill(vehicleRegNo);
    await p.locator('#vehicleRegNo').blur();
    await p.locator('#precheck-result .success, #precheck-result .error').first()
      .waitFor({ state: 'visible', timeout: 20_000 });
    return await p.locator('#precheck-result .success').isVisible().catch(() => false);
  }

  /** ONE attempt at the inline pre-check's payment, handling all three
   *  popup shapes seen so far at `#precheck-popup`/`#payment-result`:
   *    - Approved / JPJ-Failed (`resolveVehicleGate`'s already-confirmed
   *      shape) — `#payment-result` renders with a single Close button.
   *    - DECLINED payment (RHB "IF"/"RE" codes, CPC_E2E_TS5/TS6/TS3/TS11/
   *      TS12 — NEVER confirmed live, built from
   *      `EAINT-9306-dereg-step2-precheck-payment-failed-retry.html`) —
   *      `#precheck-popup` re-renders instead, with a `#payment-history-
   *      portion` list of prior failed attempts and Next/Cancel buttons
   *      (no Close). Per that capture's own header note (Faizuddin, live):
   *      "a native browser confirm() popup fires BEFORE this page renders
   *      on a failed payment... clicking this dialog's Next button redoes
   *      the payment (re-triggering that same native confirm())." The
   *      native dialog's "OK" IS the test plan's "payment failed message
   *      popup > Click [OK]" step — `withNativeConfirm()` auto-accepts it,
   *      so no separate handling is needed for that step.
   *  Call this again to retry after a decline — same method for the first
   *  attempt and every retry, since it's always just "click Next on
   *  whichever dialog is currently open." */
  async attemptInlinePayment(): Promise<PaymentAttemptResult> {
    const p = await this.session.waitForActivePage();
    await this.fillConsentEmailIfPresent();
    const { result: paid, dialogMessage } = await this.session.withNativeConfirmCapture(
      () => this.session.confirmDialog(20_000, 'Next'),
    );
    if (!paid) throw new Error('Expected the #precheck-popup payment dialog ("Next"), none appeared.');
    if (dialogMessage) this.session.progress('dereg-step2-payment-dialog', `Native dialog: "${dialogMessage}"`);

    // Race both outcomes, scoped to :visible — checking #payment-history-portion
    // with a bare isVisible() right after the confirm() click was a real bug
    // (confirmed live 2026-08-26): on a decline, that div can take a moment to
    // render, so the immediate check caught "not visible yet" and hung 90s
    // waiting on #payment-result instead. The FIRST fix for that (a plain
    // `.first()` over both selectors, no :visible) hit the SAME duplicate-id
    // trap flow-ucd-shell.md documents for the UCD-side portals — confirmed
    // live 2026-08-26 too: this page also carries a hidden/stale #payment-result
    // node earlier in DOM order, so `.first()` locked onto that hidden copy
    // and timed out the full 90s even while the real, visible
    // #payment-history-portion decline popup was on screen the whole time.
    await p.locator('#payment-history-portion:visible, #payment-result:visible').first()
      .waitFor({ state: 'visible', timeout: 90_000 });
    const declined = await p.locator('#payment-history-portion:visible').isVisible().catch(() => false);
    if (declined) {
      this.session.progress('dereg-step2-payment-declined', 'Inline payment declined — Payment History popup shown');
      // The Payment History (declined) popup is on screen right now — hold
      // before the caller's next Next-click retry, per Faizuddin 2026-08-24
      // (knowledge/flow-edereg.md §12).
      await this.session.pauseForDetails();
      return { declined: true, dialogMessage };
    }

    const jpjStatus = (await p.locator('#jpjStatusLabel').getAttribute('value').catch(() => '')) ?? '';
    const responseDesc = (await p.locator('#responseDesc').last().textContent().catch(() => ''))?.trim() ?? '';
    this.session.progress('dereg-step2-payment-result', `Inline payment result: ${jpjStatus} / ${responseDesc}`);
    // The result popup is displaying its verdict right now — hold before
    // Close, per Faizuddin 2026-08-24 (knowledge/flow-edereg.md §12).
    await this.session.pauseForDetails();

    const closed = await this.session.confirmDialog(15_000, 'Close');
    if (!closed) throw new Error('Expected the #payment-result dialog ("Close") after the payment succeeded, none appeared.');

    return { declined: false, jpjStatus, responseDesc, dialogMessage };
  }

  /** Retries payment on the still-open inline `#precheck-popup`
   *  (`#payment-history-portion` visible, Next/Cancel buttonpane) AFTER
   *  BackOffice has cancelled the underlying transaction — added
   *  2026-08-27 for MU_TS10 (EAINT-9306). Deliberately does NOT reuse
   *  `attemptInlinePayment()`'s own post-click wait (which requires either
   *  `#payment-history-portion` or `#payment-result` to appear) — a
   *  cancelled transaction may redirect somewhere else entirely instead of
   *  either shape, and asserting on the wrong one would throw before the
   *  caller ever sees the captured dialog message. Reports whatever native
   *  dialog fired (if any) and the resulting URL; the caller verifies the
   *  final state via the listing rather than any specific DOM shape here.
   *
   *  **CORRECTED 2026-08-27, first live run** — the original version wrapped
   *  the click in `session.withNativeConfirmCapture()`, whose listener only
   *  stays attached for the duration of the action it wraps (here,
   *  `confirmDialog()`'s own click-and-return). That's the SAME root cause
   *  already found and fixed for MU_TS9's `reloadAndCaptureDialog()` — the
   *  app's own "Transaction Cancelled" dialog can fire as a separate,
   *  asynchronous follow-up AFTER the click itself resolves, not bundled
   *  into it. Confirmed live: User A's retry happened to be fast enough to
   *  catch (`dialogMessage: "Transaction Cancelled"`), User B's — same
   *  code, same action, no cross-user race involved (the two run
   *  sequentially, never concurrently) — came back empty. Not a real
   *  behavioural difference between the two companies; a per-request
   *  capture-timing gap on MY OWN side. **Fixed**: listens for the dialog
   *  manually with an EXTRA grace window after the click (matching
   *  `reloadAndCaptureDialog()`'s own fix), and holds it open for
   *  `CONFIG.detailsPauseMs` before accepting so it's actually visible in
   *  the recording too (matching that same fix's second half). NOT yet
   *  re-run to confirm this resolves User B's own empty result. */
  async attemptInlineRetryAfterCancellation(extraWaitMs = 10_000): Promise<{ dialogMessage: string; urlAfter: string }> {
    const p = await this.session.waitForActivePage();
    // Was missing here despite fillConsentEmailIfPresent()'s own doc comment
    // already claiming this call site — found 2026-09-14 while propagating
    // the 2026-09-11 consent-email handling to every Next-click on this
    // dialog. MU_TS9/TS10/TS12 (the only callers) drive this same "Vehicle
    // and Payment Details" screen, so they were silently missing it too.
    await this.fillConsentEmailIfPresent();
    let dialogMessage = '';
    const onDialog = (dialog: Dialog) => {
      dialogMessage = dialog.message();
      setTimeout(() => { dialog.accept().catch(() => {}); }, CONFIG.detailsPauseMs);
    };
    p.on('dialog', onDialog);
    try {
      await this.session.confirmDialog(20_000, 'Next');
      await p.waitForTimeout(extraWaitMs);
    } finally {
      p.off('dialog', onDialog);
    }
    await this.session.waitForDomReady();
    return { dialogMessage, urlAfter: p.url() };
  }

  /** Fills `#vehicleRegNo`, confirms the gate is BLOCKED (throws if it's
   *  already satisfied — the wrong precondition for a payment-decline
   *  scenario), then makes the first payment attempt. */
  async beginInlinePaymentFlow(vehicleRegNo: string): Promise<PaymentAttemptResult> {
    const alreadySatisfied = await this.fillVehicleRegNoAndCheckGate(vehicleRegNo);
    if (alreadySatisfied) {
      throw new Error(
        'Expected the vehicle gate to be BLOCKED (no qualifying pre-check) so the inline payment-decline flow '
        + 'could run — it was already satisfied instead. Wrong precondition for this test case (the vehicle '
        + 'likely still has a non-expired pre-check).',
      );
    }
    return this.attemptInlinePayment();
  }

  /** Whether `#precheck-result` currently shows the green success state —
   *  the same check `resolveVehicleGate()` does internally, exposed for
   *  callers (e.g. CPC_E2E_TS5) that resolve a decline-then-retry sequence
   *  manually via `beginInlinePaymentFlow()`/`attemptInlinePayment()`
   *  instead of `resolveVehicleGate()`. */
  async isVehicleGateSatisfiedNow(): Promise<boolean> {
    const p = await this.session.waitForActivePage();
    return await p.locator('#precheck-result .success').isVisible().catch(() => false);
  }

  /** Waits out CPC_E2E_TS5/TS11's RHB "RE" reset countdown before a retry
   *  can succeed — **confirmed by Faizuddin, 2026-08-24: a fixed 6 minutes,
   *  enforced by the payment gateway itself, not just a UI countdown** (a
   *  retry attempted before it elapses won't succeed even after re-steering
   *  eSIM to the happy-path code). 30s padding past the 6-minute mark so a
   *  retry never races the exact boundary.
   *
   *  BUG, confirmed live 2026-08-24: this previously tried to detect
   *  completion off the countdown widget's own DOM
   *  (`#reset-timer`/`#clockdiv`'s `.minutes`/`.seconds` reaching "00"/"00"
   *  — a pure guess, never confirmed against real markup). That guess had a
   *  real logic bug on top of being unconfirmed: `if (!timer ...) return
   *  true` treated "the guessed selector found nothing" as "the countdown
   *  is already done," so `waitForFunction` resolved in well under a
   *  second instead of anything close to 6 minutes — the run proceeded to
   *  retry almost immediately, shutting the whole flow down way too early.
   *  Fixed by dropping the DOM guess entirely and waiting the confirmed
   *  fixed duration instead.
   *
   *  Also writes a wait-status marker for the dashboard's VPN reminder
   *  (utils/waitStatus.ts) — this idle period is exactly when Faizuddin's
   *  VPN tends to disconnect, and the automation needs it again right
   *  after, to re-steer eSIM before retrying payment. Per Faizuddin,
   *  2026-08-24. */
  async waitOutPaymentResetTimer(waitMs = 6 * 60_000 + 30_000): Promise<void> {
    const p = await this.session.waitForActivePage();
    writeWaitStatus('RHB "RE" payment reset-timer', waitMs);
    try {
      await p.waitForTimeout(waitMs);
    } finally {
      clearWaitStatus();
    }
  }

  /** Best-effort read of the `#reset-timer` countdown's DISPLAYED
   *  remaining time — added 2026-08-26 for MU_TS3/MU_TS4's own "is this
   *  the same countdown shared across two users, or two independent
   *  ones" check. NOT used to control any wait — `waitOutPaymentResetTimer()`
   *  above always waits the confirmed fixed duration regardless, per the
   *  bug/fix already documented for it (flow-edereg.md §14). Markup
   *  (`#clockdiv .minutes`/`.seconds`) confirmed from
   *  `EAINT-9306-dereg-step2-precheck-payment-failed-retry.html`, but
   *  never read live before this — returns `null` on ANY parse failure
   *  instead of throwing, since this is diagnostic-only and must never be
   *  the reason a test fails. */
  async readResetTimerRemaining(): Promise<{ minutes: number; seconds: number } | null> {
    const p = await this.session.waitForActivePage();
    try {
      const minutesText = await p.locator('#clockdiv .minutes').textContent({ timeout: 5_000 });
      const secondsText = await p.locator('#clockdiv .seconds').textContent({ timeout: 5_000 });
      const minutes = Number(minutesText);
      const seconds = Number(secondsText);
      if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
      return { minutes, seconds };
    } catch {
      return null;
    }
  }

  /** Step 2, the owner/contact fields that don't depend on the gate outcome
   *  — split out from `fillVehicleDetails()` so a scenario needing to retry
   *  `resolveVehicleGate()` (e.g. CPC_E2E_TS9's Failed-then-Approved-retry)
   *  doesn't have to re-fill these every attempt. */
  async fillOwnerContactFields(vehicle: DeregVehicleInputs): Promise<void> {
    const p = await this.session.waitForActivePage();
    await p.locator('#contactNo').fill(vehicle.contactNo);
    await p.locator('#email').fill(vehicle.ownerEmail);
    await p.locator('#pbtCompanyId').selectOption({ value: '-1' }); // INDIVIDU
  }

  /** Step 2, everything AFTER the gate is satisfied — the rest of the
   *  vehicle fields, all 4 file uploads, and the submit. Split out from
   *  `fillVehicleDetails()` for the same reason as `fillOwnerContactFields`
   *  — a caller that resolved the gate itself (possibly after a retry) just
   *  calls this directly instead of re-running the gate check. */
  async submitVehicleDetails(vehicle: DeregVehicleInputs): Promise<void> {
    const p = await this.session.waitForActivePage();

    if (!fs.existsSync(DUMMY_UPLOAD_PATH)) {
      throw new Error(`Dummy upload PDF not found at ${DUMMY_UPLOAD_PATH} — needed for #aatfConsent/#photo1-3.`);
    }

    await p.locator('#vehicleEngineNo').fill(vehicle.vehicleEngineNo);
    await p.locator('#vehicleChassisNo').fill(vehicle.vehicleChassisNo);
    await p.locator('#vehicleMake').selectOption({ value: 'OTHER' });
    await p.locator('#otherVehicleMakeText').fill(vehicle.otherVehicleMake);
    await p.locator('#vehicleModel').selectOption({ value: 'OTHER' });
    await p.locator('#otherVehicleModelText').fill(vehicle.otherVehicleModel);
    await p.locator('#vehicleYear').selectOption({ value: vehicle.vehicleYear });

    // Attach every file LAST, right before submitting — #vehicleMake/#vehicleModel
    // switching to "Others" reveals the two free-text fields above via a DOM
    // update, which can wipe out an already-set sibling file input. Confirmed
    // live 2026-08-24: #aatfConsent was set before those selects and the form
    // silently failed to submit (#to-continue never navigated to step 3, no
    // exception, no visible error — the same step-2 page just stayed put).
    await p.locator('#aatfConsent').setInputFiles(DUMMY_UPLOAD_PATH);
    await p.locator('#photo1').setInputFiles(DUMMY_UPLOAD_PATH);
    await p.locator('#photo2').setInputFiles(DUMMY_UPLOAD_PATH);
    await p.locator('#photo3').setInputFiles(DUMMY_UPLOAD_PATH);

    // #to-continue likely triggers a native confirm() on submit, same as
    // #to-enquiry/#to-payment on later steps (session.withNativeConfirm's own
    // doc comment) — an unhandled native dialog auto-dismisses in Playwright
    // (as if Cancel was clicked), which looks identical to "the click did
    // nothing": no exception, no visible error, the form just silently stays
    // put. Confirmed live 2026-08-24 with every required field (including a
    // real file in all four uploads) correctly filled — manual testing with
    // the exact same field values submits fine, so the difference has to be
    // an unhandled dialog, not a validation rule.
    await this.session.withNativeConfirm(() => p.locator('#to-continue').click());
    // Confirm the page actually left step 2 here, rather than letting the
    // next step's locator time out two calls later with a confusing,
    // unrelated error.
    await p.locator('#aatfConsent').waitFor({ state: 'detached', timeout: 15_000 }).catch(() => {
      throw new Error(
        'Step 2: #to-continue did not navigate to step 3 — the "Owner & Vehicle Details" '
        + 'form is still showing, even with a native-dialog handler now in place. '
        + 'Re-check the required fields themselves — file uploads, or #pbtCompanyId/'
        + '#vehicleMake/#vehicleModel/#vehicleYear selections.',
      );
    });
    await this.session.waitForDomReady();
    this.session.progress('dereg-step2-vehicle', 'Step 2: Vehicle details submitted, gate passed');
  }

  /** Step 2: Vehicle Details, the single-attempt shape. Fills the owner/
   *  contact fields, resolves the compulsory gate once (`resolveVehicleGate`
   *  — works for either Deregistration entry point), then submits the rest
   *  if satisfied. Throws if the gate resolves to Failed/not-satisfied on
   *  this one attempt — that outcome has nothing left to fill (call
   *  `resolveVehicleGate` directly instead for a scenario that expects it,
   *  e.g. CPC_E2E_TS2/TS8; for a scenario that RETRIES the gate with a
   *  different eSIM code after a Failed attempt, e.g. CPC_E2E_TS9, compose
   *  `fillOwnerContactFields` + `resolveVehicleGate` (as many times as
   *  needed) + `submitVehicleDetails` directly instead of calling this). */
  async fillVehicleDetails(inputs: PrecheckInputs, vehicle: DeregVehicleInputs): Promise<VehicleGateResult> {
    await this.fillOwnerContactFields(vehicle);

    const gate = await this.resolveVehicleGate(inputs.vehicleRegNo);
    if (!gate.satisfied) {
      throw new Error(
        `Step 2: vehicle gate not satisfied after the inline pre-check (JPJ ${gate.jpjStatus} / ${gate.responseDesc}) `
        + '— the form has reset #vehicleRegNo to blank and there is nothing further to submit. Call '
        + 'resolveVehicleGate() directly instead of fillVehicleDetails() for a scenario expecting this outcome.',
      );
    }

    await this.submitVehicleDetails(vehicle);
    return gate;
  }

  /** Step 3, sub-screen A: owner's-copy consent + owner MyKad/thumbprint
   *  re-authentication. Ends redirected onto sub-screen B (AATF's copy). */
  async ownerConsentAndAuth(): Promise<void> {
    const p = await this.session.waitForActivePage();
    await p.locator('#owner-consent').check();
    await this.runMykadAuth('dereg-step3-owner-consent', 'Step 3: Owner consent + re-authentication');
  }

  /** Step 3, sub-screen B + C: AATF's-copy consent, then the AATF rep's own
   *  MyKad/thumbprint authentication. Ends redirected onto step 4 JPJ Check. */
  async aatfConsentAndAuth(): Promise<void> {
    const p = await this.session.waitForActivePage();
    await p.locator('#aatf-consent').check();
    // #to-auth-aatf carries class="hidden" even after ticking — an inline
    // style toggle overrides it, so wait on computed visibility, not the class.
    const next = p.locator('#to-auth-aatf');
    await next.waitFor({ state: 'visible', timeout: 10_000 });
    await next.click();
    await this.session.waitForDomReady();
    this.session.progress('dereg-step3-aatf-consent', 'Step 3: AATF consent ticked');

    await this.runMykadAuth('dereg-step3-aatf-auth', 'Step 3: AATF rep MyKad authentication');
  }

  /** Step 4: JPJ Check — declaration checkbox, Next (native confirm), read
   *  the inline JPJ result, then Make Payment (a second native confirm). */
  async jpjCheck(): Promise<JpjCheckResult> {
    const p = await this.session.waitForActivePage();
    await p.locator('#to-agree').check();
    await this.session.withNativeConfirm(() => p.locator('#to-enquiry').click());
    await this.session.waitForDomReady();

    await p.locator('#jpj-enquiry').waitFor({ state: 'visible', timeout: 60_000 });
    const result: JpjCheckResult = {
      jpjStatus: (await p.locator('.jpjStatus').first().textContent().catch(() => ''))?.trim() ?? '',
      responseCode: (await p.locator('.responseCodeLabel').first().textContent().catch(() => ''))?.trim() ?? '',
    };
    this.session.progress('dereg-step4-jpj-check', `Step 4: JPJ check ${result.jpjStatus} / ${result.responseCode}`);
    // The JPJ check result is displaying right now — hold before Make
    // Payment, per Faizuddin 2026-08-24 (knowledge/flow-edereg.md §12).
    await this.session.pauseForDetails();

    await this.session.withNativeConfirm(() => p.locator('#to-payment').click({ timeout: 20_000 }));
    await this.session.waitForDomReady();
    return result;
  }

  /** Step 5 -> 6: pay (native confirm), read the final JPJ Deregistration
   *  result, Done -> transaction details view. */
  async payAndDeregister(): Promise<DeregisterResult> {
    const p = await this.session.waitForActivePage();
    await this.session.withNativeConfirm(() => p.locator('#to-payment').click({ timeout: 20_000 }));
    await this.session.waitForDomReady();

    await p.locator('#jpj-submission').waitFor({ state: 'visible', timeout: 90_000 });
    const jpjDeregistrationStatus = (await p.locator('.jpjStatus').first().textContent().catch(() => ''))?.trim() ?? '';
    this.session.progress('dereg-step5-payment', `Step 5/6: Payment + JPJ Deregistration ${jpjDeregistrationStatus}`);
    // Step 6's final result is displaying right now — hold before Done,
    // per Faizuddin 2026-08-24 (knowledge/flow-edereg.md §12).
    await this.session.pauseForDetails();

    await p.getByRole('button', { name: 'Done' }).click();
    await this.session.waitForDomReady();
    const detailsPage = await this.session.waitForActivePage();
    const transactionId = new URL(detailsPage.url()).searchParams.get('id') ?? '';
    this.session.progress('dereg-done', 'Deregistration transaction details view');
    // The full Deregistration transaction Details page is on screen right
    // now — hold before anything navigates away, per Faizuddin 2026-08-24
    // (knowledge/flow-edereg.md §12).
    await this.session.pauseForDetails();

    return { jpjDeregistrationStatus, transactionId };
  }

  /** Verifies the "eDereg Pre-Checking: Yes" hyperlink on the Deregistration
   *  transaction's own Details page (the page `payAndDeregister()` lands on
   *  after Done) — SRD checklist item for CPC_E2E_TS1. Positioned directly
   *  under "e-Invoice Validation Date:" in the same row grid (confirmed
   *  layout, `EAINT-9306-dereg-details-and-listing.html`). Clicking it
   *  redirects to the "eDereg Pre-Checking Transaction Listing"
   *  (`.../precheck/enquiry/main.do?vehicleNo=<VN>&autoSearch=true`) with
   *  the Vehicle No. field auto-filled and the listing auto-searched for
   *  that vehicle — "the listing will show all existing transactions" is
   *  read as "every pre-checking transaction for THIS vehicle", not every
   *  transaction system-wide (the `autoSearch` URL param is vehicle-scoped,
   *  per §3 URL map). Assumes this is called with the active page already on
   *  the Deregistration Details view. */
  async verifyPrecheckingYesLink(vehicleRegNo: string): Promise<PrecheckingLinkCheck> {
    const p = await this.session.waitForActivePage();

    // "(Ref No.: D680000560)" in the title bar — the human-readable ref
    // this Deregistration transaction's own JPJ XML Log entries are keyed
    // by, distinct from `payAndDeregister()`'s own `?id=<uuid>`.
    const titleText = (await p.locator('td.title1').textContent().catch(() => '')) ?? '';
    const deregRefNo = titleText.match(/Ref No\.:\s*([A-Za-z0-9]+)/)?.[1] ?? '';

    const link = p.locator('tr:has-text("eDereg Pre-Checking:") a', { hasText: 'Yes' });
    await link.waitFor({ state: 'visible', timeout: 15_000 });

    const href = (await link.getAttribute('href')) ?? '';
    if (!href.includes('/precheck/enquiry/main.do') || !href.includes(`vehicleNo=${vehicleRegNo}`) || !href.includes('autoSearch=true')) {
      throw new Error(`"eDereg Pre-Checking: Yes" link href unexpected: "${href}" (expected .../precheck/enquiry/main.do?vehicleNo=${vehicleRegNo}&autoSearch=true).`);
    }

    await link.click();
    await this.session.waitForDomReady();
    const listingPage = await this.session.waitForActivePage();

    const listingVehicleNoValue = await listingPage.locator('#vehicleNo').inputValue().catch(() => '');
    if (listingVehicleNoValue !== vehicleRegNo) {
      throw new Error(`Listing's Vehicle No. field shows "${listingVehicleNoValue}", expected auto-filled "${vehicleRegNo}".`);
    }
    // tbody includes the header row too (confirmed shape, EAINT-9306-precheck-
    // details-and-listing.html) — exclude it so an empty result doesn't
    // falsely count as "has rows".
    const listingHasRows = (await listingPage.locator('#result table tbody tr:not(.header)').count()) > 0;

    this.session.progress(
      'dereg-details-precheck-link',
      `"eDereg Pre-Checking: Yes" link verified — listing auto-filled + ${listingHasRows ? 'has rows' : 'EMPTY'}`,
    );
    // This listing (auto-filled + searched by the Yes link) is on screen
    // right now — hold before anything navigates away next, per Faizuddin
    // 2026-08-24 (knowledge/flow-edereg.md §12). Note: the Deregistration
    // Details page THIS method clicked away from already got its own pause
    // inside payAndDeregister(), right before it returned — no need to
    // pause on it again here.
    await this.session.pauseForDetails();
    return { href, listingVehicleNoValue, listingHasRows, deregRefNo };
  }
}
