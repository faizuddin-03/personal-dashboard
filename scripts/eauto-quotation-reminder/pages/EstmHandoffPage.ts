import { Page } from '@playwright/test';
// ── scripts/eauto-estm logic, ported to run under THIS project's Playwright ──
// TS02/TS03/TS06 need something TS04's spawned-child-process approach cannot
// give: the SAME logged-in browser session that creates the eSTM has to
// carry straight into insurance when the eSTM auto-redirects there. A child
// process can't hand a live page back across the process boundary, so this
// drives eSTM creation in this same test run instead.
//
// Importing scripts/eauto-estm's page objects directly does NOT work:
// Playwright refuses to load a second `@playwright/test` install in the same
// process ("Requiring @playwright/test second time") the moment two files
// backed by different `node_modules/@playwright/test` copies are both
// required — which every eauto-estm page object is, since each imports
// `Page`/`expect` from its own install. `scripts/eauto-estm` itself is left
// completely untouched; instead, `pages/estmPort/` holds a VERBATIM port of
// the classes this needs, built against quotation-reminder's own
// `@playwright/test`. `data/config.ts` and `utils/overlay.ts` have no
// Playwright dependency, so those two are imported directly rather than
// ported. `[from Faizuddin, 2026-08-18]`
import { EstmSession } from './estmPort/EstmSession';
import { EstmLoginPage } from './estmPort/EstmLoginPage';
import { EstmCreateTransactionPage } from './estmPort/EstmCreateTransactionPage';
import { EstmBuyerDetailsPage } from './estmPort/EstmBuyerDetailsPage';
import { EstmPaymentPage } from './estmPort/EstmPaymentPage';
import { OVERLAY_INIT_SCRIPT } from '../../eauto-estm/utils/overlay';
import type { EstmInputs } from '../../eauto-estm/data/config';
import { CONFIG } from '../data/config';
import { envSegment } from '../utils/estm';

/**
 * Drives eSTM creation ourselves (login → create transaction → buyer/vehicle
 * details, exactly as `scripts/eauto-estm/tests/estm.spec.ts` does) and stops
 * short of paying it — for the two entries into insurance that start from
 * MID-eSTM-creation rather than from a finished eSTM's details-page banner:
 *
 * - **"eSTM entry" (TS02, TS06):** untick eLKM on the eSTM's own Payment step
 *   (step 5 — reached by clicking `#to-payment` on step 4's JPJ-result page,
 *   NOT automatic), which auto-redirects into insurance. TS02 continues in
 *   insurance from there; TS06 presets the e-simulator's Response Code
 *   FIRST — right after the JPJ result lands on step 4, before clicking
 *   `#to-payment` (see `utils/esim.ts`) — turning the same redirect into a
 *   forced purchase.
 * - **"Banner entry" (TS03):** same untick-and-redirect, but the tester
 *   abandons that first entry (goes Home), goes back to the eSTM's own
 *   listing, and finds the SAME transaction already Approved — the untick
 *   already finished it, no separate "resume and pay" step needed (an
 *   earlier guess to the contrary is gone; see `EstmBannerPage`, which
 *   covers this second half: listing search → View → the details page's
 *   "Buy Insurance" banner). `[verified: live HTML from uat1, 2026-08-19]`
 *
 * `[from Faizuddin, 2026-08-18]` — this is new information, not previously
 * captured in knowledge/flow-estm.md. The exact mechanism by which unticking
 * eLKM triggers the redirect is not documented or verified against live HTML;
 * this waits for arrival at `body#insurancePlan` with a generous timeout
 * rather than asserting a specific network call. If a run reports the
 * timeout, capture the eSTM Payment-step HTML right after unticking eLKM and
 * write down what actually fires, per the standing HTML-capture rule.
 *
 * Getting from step 4 to step 5 alone took three attempts to get right — see
 * knowledge/flow-estm.md § Step 4 — JPJ Check for the full history (a missed
 * confirmation dialog, then a missed `#to-payment` click, since step 4's JPJ
 * result and step 5's Payment form turned out to be two different renders on
 * two different clicks, not one).
 */
export class EstmHandoffPage {
  private session: EstmSession;

  constructor(private readonly page: Page) {
    this.session = new EstmSession(page.context(), page);
  }

  private inputs(): EstmInputs {
    return {
      envSegment: envSegment(),
      vehicleRegNo: CONFIG.vehicleNo,
      emailAddress: CONFIG.estmBuyerEmail,
      mobileNo: CONFIG.estmMobile,
    };
  }

  /**
   * Login → create the eSTM → buyer/vehicle details+bypasses → confirm the
   * JPJ check → wait for the JPJ RESULT (not step 5 — see
   * `waitForJpjResult()`). Returns the currently-active page — eSTM closes
   * and reopens pages on nearly every field, so the fixture's original `page`
   * object may no longer be the live one by this point.
   *
   * This is where TS06's e-simulator call belongs: right after the JPJ
   * result lands, before clicking Make Payment. `[from Faizuddin, 2026-08-18]`
   */
  private async createToJpjResult(): Promise<Page> {
    await this.page.context().addInitScript(OVERLAY_INIT_SCRIPT);
    if (CONFIG.estmUser) process.env.ESTM_USERNAME = CONFIG.estmUser;
    if (CONFIG.estmPass) process.env.ESTM_PASSWORD = CONFIG.estmPass;
    if (CONFIG.estmBypassSlot) process.env.ESTM_BYPASS_SLOT = CONFIG.estmBypassSlot;

    const inputs = this.inputs();
    const login = new EstmLoginPage(this.page, this.session);
    await login.login(inputs);
    this.session.logUrl('after eSTM login');
    await this.session.closeBanners();

    const createPage = new EstmCreateTransactionPage(this.page, this.session);
    await createPage.openAndCreate();
    await createPage.selectIdType();

    const buyerDetails = new EstmBuyerDetailsPage(this.session);
    await buyerDetails.fillAndBypass(inputs);

    this.session.progress('jpj_check', 'JPJ Check');
    return this.waitForJpjResult();
  }

  /**
   * From step 4 (JPJ Check) to the JPJ RESULT rendered on that SAME page —
   * NOT step 5. `[verified: live HTML, 2026-08-18 —
   * _reference/html/eauto/estm-step4-jpj-check-submit-dialog.html,
   * estm-step4-jpj-passed-payment-summary.html]`
   *
   * Landing on step 4 shows a "Submit to JPJ for checking?" dialog
   * immediately (`#to-retry-dialog`, confirmed via `.confirm-dialog-btn`
   * "Yes"). Once the enquiry resolves, the SAME page (same URL — this is not
   * a navigation) renders a read-only Payment Summary and a **`#to-payment`
   * ("Make Payment")** button — there is no `#lkm-addson-checkbox` anywhere
   * on this page; that only exists on the REAL Payment step, reached by
   * clicking `#to-payment`. Two earlier attempts got this wrong: one never
   * confirmed the dialog at all, the next confirmed it but then polled for
   * `#lkm-addson-checkbox` forever, since it doesn't exist here — nothing
   * was clicking `#to-payment` to get to the page where it does.
   *
   * A single dialog confirm wasn't reliably enough either, so this polls:
   * confirm whatever dialog is showing, check for `#to-payment`, repeat.
   * `EstmSession.confirmDialog()` is the SAME mechanism `scripts/eauto-estm`'s
   * own `submitPayment()` relies on for this class of dialog — reused here
   * rather than re-derived, per "copy the flow, don't reinvent it."
   */
  private async waitForJpjResult(timeoutMs = 180_000): Promise<Page> {
    const deadline = Date.now() + timeoutMs;
    let confirmCount = 0;
    while (Date.now() < deadline) {
      const ap = this.session.active();
      if (!ap.isClosed() && await ap.locator('#to-payment').isVisible().catch(() => false)) {
        if (confirmCount) console.log(`[estm-handoff] JPJ passed after confirming the dialog ${confirmCount} time(s).`);
        return ap;
      }
      const confirmed = await this.session.confirmDialog(3_000).catch(() => false);
      if (confirmed) {
        confirmCount++;
        console.log(`[estm-handoff] Confirmed the JPJ dialog (attempt ${confirmCount}).`);
        await this.session.waitForDomReady();
      } else {
        await new Promise((r) => setTimeout(r, 1_000));
      }
    }

    const ap = this.session.active();
    throw new Error(
      `Never saw the JPJ result (#to-payment) within ${Math.round(timeoutMs / 1000)}s. ` +
      `Last URL: ${ap.isClosed() ? '(page closed)' : ap.url()}. JPJ dialog confirmed ${confirmCount} time(s). ` +
      'Capture the eSTM page HTML at this point — the JPJ enquiry may be failing rather than just slow.',
    );
  }

  /**
   * Click `#to-payment` ("Make Payment") to leave the JPJ-result page, then
   * confirm the "Sure to continue?" dialog that follows
   * (`#sure-to-continue-payment`, `.confirm-dialog-btn` "Yes") — reaching the
   * real Payment step (step 5), where `#lkm-addson-checkbox` actually lives.
   * `[verified: live HTML, 2026-08-18 —
   * _reference/html/eauto/estm-step4-jpj-passed-payment-summary.html;
   * the confirm dialog itself from Faizuddin, 2026-08-18]`
   *
   * Polls rather than assuming one confirm suffices — the JPJ dialog earlier
   * in this same flow needed more than one on at least one run, so the same
   * caution applies here rather than repeating that mistake.
   */
  private async advanceToPaymentStep(timeoutMs = 60_000): Promise<Page> {
    let ap = this.session.active();
    await ap.locator('#to-payment').click();
    await this.session.waitForDomReady();

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      ap = this.session.active();
      if (!ap.isClosed() && await ap.locator('#lkm-addson-checkbox').isVisible().catch(() => false)) {
        this.session.progress('payment_step', 'Payment Step');
        return ap;
      }
      const confirmed = await this.session.confirmDialog(3_000).catch(() => false);
      if (!confirmed) await new Promise((r) => setTimeout(r, 1_000));
    }

    const last = this.session.active();
    throw new Error(
      `Never reached the Payment step (#lkm-addson-checkbox) within ${Math.round(timeoutMs / 1000)}s ` +
      `after clicking Make Payment. Last URL: ${last.isClosed() ? '(page closed)' : last.url()}. ` +
      'Capture the eSTM page HTML at this point.',
    );
  }

  /**
   * Untick eLKM on the Payment step, click Next, then confirm through to the
   * redirect into insurance — genuine completion triggers it, NOT the untick
   * alone (see the earlier "unconfirmed mechanism" note this replaces).
   *
   * This does NOT reuse `EstmPaymentPage.submitPayment()` — that sequence is
   * a hardcoded chase for specific button names ("Yes", then "Make Payment"
   * text, then "Yes" again, then "Next") that TS06 happens to satisfy because
   * it never touches an add-on, so the amount never changes. Toggling eLKM
   * DOES change the payable amount, and that pops a dialog `submitPayment()`
   * was never built for: **"Sure to make this payment now?"**
   * (`#fis-amount-different-dialog`, confirm button labelled **"OK"**, not
   * "Yes"). Every one of `submitPayment()`'s hardcoded lookups quietly
   * no-ops against it (each wrapped in `.catch()`), and its last-resort
   * `getByText('Next', {exact:true})` tries to click the underlying page's
   * `#to-payment` while a modal overlay sits on top of it — blocked, silent
   * timeout, run stalls exactly where a human had to step in.
   * `[verified: live HTML from uat1, 2026-08-19 —
   * _reference/html/eauto/estm-step5-payment-fis-amount-different-dialog.html]`
   *
   * Fixed by driving this generically instead: click `#to-payment`, then
   * repeatedly confirm whatever dialog is actually showing
   * (`EstmSession.confirmDialog()`, which matches `.confirm-dialog-btn`
   * regardless of its label) until either the insurance redirect lands or a
   * `Done` button appears — the same resilient-polling shape already used by
   * `waitForJpjResult()` and `advanceToPaymentStep()` above.
   * `[from Faizuddin, 2026-08-19]`
   *
   * Returns the active page, now on insurance step 1 (`body#insurancePlan`),
   * and the buyer's MyKad (read from `#refId` before the redirect carries it
   * away) — the IC the insurance quote must use, same reasoning as TS04's
   * `BUYER_IC` line.
   */
  private async untickElkmAndAwaitRedirect(ap: Page): Promise<{ page: Page; buyerIc: string }> {
    // advanceToPaymentStep() already guarantees #lkm-addson-checkbox is
    // present on `ap`, or threw with a clear reason before this was called.
    const buyerIc = (await ap.locator('#refId').inputValue().catch(() => '')).trim();
    if (buyerIc) console.log(`[estm-handoff] Buyer IC: ${buyerIc}`);

    const box = ap.locator('#lkm-addson-checkbox');

    if (!(await box.isChecked().catch(() => false))) {
      console.log('[estm-handoff] eLKM already unticked — nothing to toggle.');
    } else {
      const [response] = await Promise.all([
        ap.waitForResponse((r) => r.url().includes('addon-fee.get'), { timeout: 12_000 }).catch(() => null),
        ap.evaluate((sel) => {
          const input = document.querySelector<HTMLInputElement>(sel);
          if (!input) return;
          input.checked = false;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, '#lkm-addson-checkbox'),
      ]);
      if (!response) console.log('[estm-handoff] WARNING: unticking eLKM never got an addon-fee.get response.');
      await ap.waitForTimeout(500);
      this.session.progress('elkm_untick', 'Untick eLKM');
    }

    await ap.locator('#to-payment').click({ timeout: 10_000 }).catch(() => {});
    await this.session.waitForDomReady();
    this.session.progress('payment_submit', 'Submit Payment');

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      const current = this.session.active();
      if (current.isClosed()) break;
      if (await current.locator('body#insurancePlan').isVisible().catch(() => false)) {
        this.session.progress('estm_to_insurance', 'Redirected to Insurance');
        return { page: current, buyerIc };
      }

      if (await this.session.confirmDialog(2_000).catch(() => false)) continue;

      const done = current.getByText('Done', { exact: true }).first();
      if (await done.isVisible().catch(() => false)) {
        await done.click().catch(() => {});
        continue;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    const last = this.session.active();
    throw new Error(
      'Submitted the payment after unticking eLKM, but never saw the redirect to insurance within 60s ' +
      `(expected body#insurancePlan). Last known URL: ${last.isClosed() ? '(page closed)' : last.url()}. ` +
      'Capture the eSTM page HTML at this point.',
    );
  }

  /** The whole handoff: create the eSTM, untick eLKM, land on insurance step 1. */
  async enterInsurance(): Promise<{ page: Page; buyerIc: string }> {
    await this.createToJpjResult();
    const onPaymentStep = await this.advanceToPaymentStep();
    return this.untickElkmAndAwaitRedirect(onPaymentStep);
  }

  /**
   * TS06 (69E) only. **Nothing about the eSTM flow itself differs from the
   * ordinary Create eSTM flow** — same login, same buyer/vehicle details, same
   * JPJ check, same eLKM untick, same full payment submission through to
   * Done. The ONE insertion point is the e-simulator call, placed
   * **immediately after the JPJ result lands — before clicking `#to-payment`
   * ("Make Payment")** — not "right before eLKM is unticked" as an earlier
   * reading assumed. `[from Faizuddin, 2026-08-18]` After that, the eSTM
   * proceeds completely normally (Make Payment → Payment step → untick eLKM
   * → submit → Done) and the redirect into insurance follows once that
   * finishes.
   *
   * `runEsim` is injected rather than imported directly to avoid a circular
   * import between this file and `utils/esim.ts` (which itself has no reason
   * to know about page objects); the caller (the TS06 test) passes
   * `setEsimResponseCode` straight through.
   */
  async completeEstmWithForcedInsurance(
    prefix: string,
    code: string,
    runEsim: (prefix: string, code: string) => Promise<{ ok: boolean; reason?: string }>,
  ): Promise<{ page: Page; buyerIc: string }> {
    await this.createToJpjResult();

    // ── The one insertion point: right after JPJ passes, before Make Payment ──
    const set = await runEsim(prefix, code);
    if (!set.ok) throw new Error(set.reason ?? 'Could not set the e-simulator Response Code before completing the eSTM.');

    let ap = await this.advanceToPaymentStep();
    const buyerIc = (await ap.locator('#refId').inputValue().catch(() => '')).trim();
    if (buyerIc) console.log(`[estm-handoff] Buyer IC: ${buyerIc}`);

    const payment = new EstmPaymentPage(this.session);
    await payment.completePayment();

    // The redirect fires after the eSTM genuinely finishes (untick + submit +
    // Done), not on the toggle — so this waits AFTER completePayment(), not
    // instead of it.
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      ap = this.session.active();
      if (!ap.isClosed() && await ap.locator('body#insurancePlan').isVisible().catch(() => false)) {
        this.session.progress('estm_to_insurance', 'Redirected to Insurance');
        return { page: ap, buyerIc };
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    throw new Error(
      'The eSTM completed but never redirected to insurance within 60s (expected body#insurancePlan). ' +
      `Last known URL: ${ap.isClosed() ? '(page closed)' : ap.url()}. ` +
      `Confirm the vehicle prefix's Response Code is genuinely ${code}, and capture the eSTM completion page's HTML.`,
    );
  }

}
