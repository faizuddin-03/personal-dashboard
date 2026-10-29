import { EstmSession } from './EstmSession';
import { CONFIG } from '../../../eauto-estm/data/config';

/**
 * VERBATIM PORT of `scripts/eauto-estm/pages/PaymentPage.ts` — see
 * `EstmSession.ts` in this directory for why. `submitPayment()`'s ordering is
 * exactly as fragile here as it is in the original; the original's warning
 * ("do not clean it up") applies unchanged.
 */
export class EstmPaymentPage {
  constructor(private readonly session: EstmSession) {}

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
    await ap.waitForTimeout(500);

    const nowOn = await box.isChecked().catch(() => false);
    const totalAfter = ((await ap.locator('#grandTotalAmount').textContent().catch(() => '')) ?? '').trim();
    console.log(`${label}: ${isOn ? 'ticked' : 'unticked'} -> ${nowOn ? 'ticked' : 'unticked'}; total ${totalBefore} -> ${totalAfter}`);
    if (nowOn !== want) {
      console.log(`WARNING: ${label} did not stay ${want ? 'ticked' : 'unticked'} — the page may have forced it (eLKM is force-unticked when its enquiry fails).`);
    }
    return true;
  }

  async setAddons(): Promise<void> {
    const ap = await this.session.waitForActivePage();
    if (!(await ap.locator('#estm-adds-on').count().catch(() => 0))) return;

    await this.setAddon('lkm-addson-checkbox', 'eLKM', CONFIG.elkm);
    await this.setAddon('evoc-addson-checkbox', 'eVOC', CONFIG.evoc);

    const err = await ap.locator('#lkm-error-msg:visible, #evoc-error-msg:visible').allTextContents().catch(() => []);
    for (const e of err.filter(t => t.trim())) console.log(`Add-on error shown on page: ${e.trim()}`);

    this.session.progress('addons', 'Add-ons');
  }

  /**
   * Public in this port (private in the original — see the class doc): TS02/TS03
   * need the click-through alone, WITHOUT `setAddons()` first. `setAddons()`
   * re-syncs both add-ons to `CONFIG.elkm`/`CONFIG.evoc`, which are frozen at
   * module-import time from whatever `ESTM_ELKM`/`ESTM_EVOC` env vars this
   * process happened to have then — NOT anything the quotation-reminder run can
   * still influence in-process (unlike TS04's spawned-child-process eSTM, where
   * setting the env before spawning actually works). Calling `setAddons()` here
   * would silently re-tick the eLKM box `EstmHandoffPage` just unticked by direct
   * DOM manipulation. `[from Faizuddin, 2026-08-19]`
   */
  async submitPayment(): Promise<void> {
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
    this.session.progress('payment_page', 'Payment Page');

    const ic = await (await this.session.waitForActivePage())
      .locator('#refId').inputValue().catch(() => '');
    if (ic) console.log(`BUYER_IC:${ic.trim()}`);

    await this.setAddons();
    await this.submitPayment();

    let ap = await this.session.waitForActivePage();
    const processing = ap.locator('#dialog:visible');
    if (await processing.count().catch(() => 0)) {
      console.log('Payment processing — waiting for the bank call to return.');
      await processing.waitFor({ state: 'hidden', timeout: 120_000 })
        .catch(() => console.log('WARNING: the payment-processing dialog is still up after 2 minutes.'));
    }

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
