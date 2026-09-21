import { EstmSession } from '../utils/session';
import { CONFIG } from '../data/config';

// ── Final eSTM stretch: add-ons → confirm → Make Payment → Done ──
export class PaymentPage {
  constructor(private readonly session: EstmSession) {}

  /**
   * Set one add-on checkbox to `want` and wait for the page to re-price.
   *
   * Toggling is not just setting `.checked`. The page recalculates fees inside
   * a jQuery `change` handler (`doEstmAddonEnq()`), and that handler is what
   * updates the `shouldSubmitLkm` / `shouldSubmitEvoc` globals — which are the
   * flags the submit actually reads, not the checkboxes. Set the property
   * without dispatching `change` and the box *looks* unticked while the
   * transaction still submits the add-on and still charges for it.
   *
   * We wait on the `addon-fee.get` response rather than on the total changing:
   * unticking eVOC when eLKM already failed can leave the total identical, and
   * a total-based wait would then blow its timeout on a perfectly good run.
   */
  private async setAddon(id: string, label: string, want: boolean): Promise<boolean> {
    const ap = await this.session.waitForActivePage();
    const box = ap.locator(`#${id}`);
    if (!(await box.count().catch(() => 0))) return false;

    const isOn = await box.isChecked().catch(() => false);
    if (isOn === want) {
      console.log(`${label}: already ${want ? 'ticked' : 'unticked'}`);
      return false;
    }

    const totalBefore = ((await ap.locator('#grandTotalAmount').textContent().catch(() => '')) ?? '').trim();
    const [response] = await Promise.all([
      ap.waitForResponse(r => r.url().includes('addon-fee.get'), { timeout: 12_000 }).catch(() => null),
      ap.evaluate(({ sel, checked }) => {
        const input = document.querySelector<HTMLInputElement>(sel);
        if (!input) return;
        input.checked = checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, { sel: `#${id}`, checked: want }),
    ]);

    if (!response) {
      console.log(`WARNING: ${label} toggled but the addon-fee enquiry never responded — the fee may not have been recalculated.`);
    }
    // The handler rewrites the summary from the response; give it a beat to paint.
    await ap.waitForTimeout(500);

    const nowOn = await box.isChecked().catch(() => false);
    const totalAfter = ((await ap.locator('#grandTotalAmount').textContent().catch(() => '')) ?? '').trim();
    console.log(`${label}: ${isOn ? 'ticked' : 'unticked'} -> ${nowOn ? 'ticked' : 'unticked'}; total ${totalBefore} -> ${totalAfter}`);
    if (nowOn !== want) {
      console.log(`WARNING: ${label} did not stay ${want ? 'ticked' : 'unticked'} — the page may have forced it (eLKM is force-unticked when its enquiry fails).`);
    }
    return true;
  }

  /**
   * Apply both add-on choices. The portal ticks eLKM and eVOC on load, so a
   * default-on run does nothing here; only a deliberate untick costs a round
   * trip. No-op when the add-ons block isn't on screen.
   */
  async setAddons(): Promise<void> {
    const ap = await this.session.waitForActivePage();
    if (!(await ap.locator('#estm-adds-on').count().catch(() => 0))) return;

    // One at a time — each dispatch fires its own addon-fee enquiry, and firing
    // both at once races two responses onto the same summary.
    await this.setAddon('lkm-addson-checkbox', 'eLKM', CONFIG.elkm);
    await this.setAddon('evoc-addson-checkbox', 'eVOC', CONFIG.evoc);

    const err = await ap.locator('#lkm-error-msg:visible, #evoc-error-msg:visible').allTextContents().catch(() => []);
    for (const e of err.filter(t => t.trim())) console.log(`Add-on error shown on page: ${e.trim()}`);

    this.session.progress('addons', 'Add-ons');
  }

  /**
   * Submit the Payment step — a VERBATIM PORT of the original script's payment
   * stretch (_reference/automation code/eSTM Bypass/estm-bypass-test.spec.ts,
   * lines 422-443), with only `page` swapped for the session helper.
   *
   * Restored 2026-08-17 after a class-based rewrite (confirmDialog) never got a
   * transaction through. This sequence has. Do not "clean it up" — the calls
   * that look redundant are what make it work. Traced against the three step-5
   * captures in _reference/html/eauto/:
   *
   *   1 getByText('Make Payment')      no-op — no such text on this page
   *   2 clickYesAndWait()              no-op — no "Yes" button here
   *   3 paymentNextInDialog -> count 0 (no dialog yet), so the ELSE branch runs:
   *     clickNextButtonOrText() falls through getByRole('button') — #to-payment
   *     is a DIV — to getByText('Next').first(), which IS #to-payment.
   *                                    ==> opens dialog 1
   *   4 clickNextButtonOrText()        now a real <button> "Next" exists, in
   *                                    dialog 1. ==> opens dialog 2
   *   5 getByRole('button','OK')       dialog 2's confirm. ==> submits payment
   *   6 getByText('Done')
   *
   * So step 3 lands on the page control and step 4 on the dialog's, purely by
   * DOM order and by the page control not being a button. Reordering or
   * de-duplicating these breaks that.
   */
  private async submitPayment(): Promise<void> {
    await this.session.clickYesAndWait();

    let ap = await this.session.waitForActivePage();
    await ap.getByText('Make Payment').click().catch(() => {});
    await this.session.waitForDomReady();

    await this.session.clickYesAndWait();

    ap = await this.session.waitForActivePage();
    const paymentNextInDialog = ap
      .getByRole('dialog', { name: /Payment/i })
      .getByRole('button', { name: 'Next' }).first();
    if ((await paymentNextInDialog.count().catch(() => 0)) > 0) {
      await paymentNextInDialog.click({ timeout: 7000 }).catch(() => {});
    } else {
      await this.session.clickNextButtonOrText();
    }

    await this.session.clickNextButtonOrText();
    this.session.progress('payment_submit', 'Submit Payment');

    ap = await this.session.waitForActivePage();
    await ap.getByRole('button', { name: 'OK' }).click().catch(() => {});
    ap = await this.session.waitForActivePage();
    await ap.getByText('Done').click().catch(() => {});
  }

  async completePayment(): Promise<void> {
    // Announce arrival BEFORE doing anything slow. Without this the step list
    // jumps from "UCD Consent" to nothing when the payment stretch stalls, and
    // "it got to step 5 and stopped" is indistinguishable from "it never got
    // to step 5".
    this.session.progress('payment_page', 'Payment Page');

    // Step 5 shows the buyer's MyKad (the bypass slot's IC). Emit it so a
    // caller chaining eSTM -> Get Free Quote can pick up the vehicle/IC pair
    // without hardcoding the slot's IC. Read here because #refId only exists on
    // this page — by the time RESULT is printed the flow has left it.
    const ic = await (await this.session.waitForActivePage())
      .locator('#refId').inputValue().catch(() => '');
    if (ic) console.log(`BUYER_IC:${ic.trim()}`);

    await this.setAddons();
    await this.submitPayment();

    // Everything below is OBSERVATION ONLY. The original script ends at Done;
    // these steps must never be able to fail a run that actually paid, so
    // nothing here throws.

    // "Payment is in process. Please do not refresh or close the browser."
    // (#dialog) has no buttons — it clears itself when the bank call returns.
    let ap = await this.session.waitForActivePage();
    const processing = ap.locator('#dialog:visible');
    if (await processing.count().catch(() => 0)) {
      console.log('Payment processing — waiting for the bank call to return.');
      await processing.waitFor({ state: 'hidden', timeout: 120_000 })
        .catch(() => console.log('WARNING: the payment-processing dialog is still up after 2 minutes.'));
    }

    // Did we leave step 5? That is the honest success signal — the step header
    // stops marking 5 as active. Reported, NOT enforced: an earlier version
    // threw here, which risks failing a run whose payment went through and
    // whose page merely lingered.
    ap = await this.session.waitForActivePage();
    const movedOn = await ap.waitForFunction(() => {
      const active = document.querySelector('.header-element-active .txn-header-div');
      return !active || (active.textContent ?? '').trim() !== '5';
    }, undefined, { timeout: 60_000 }).then(() => true).catch(() => false);

    if (movedOn) {
      this.session.progress('payment_submitted', 'Payment Submitted');
    } else {
      console.log('WARNING: still on step 5 after the payment sequence — check the video and the page for an add-on or JPJ error banner.');
    }
    this.session.progress('payment_done', 'Payment & Done');
  }
}
