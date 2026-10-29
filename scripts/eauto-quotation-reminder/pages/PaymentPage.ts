import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';

/**
 * Insurance step 3 — and the click that buys.
 *
 * **Payment in eAuto is a simple click, the same as the eSTM flow's payment
 * step: a button plus its confirmation popups.** There is no gateway page to
 * drive, no bank login, no TAC, and no QR — QR payment is not implemented in
 * eAuto at all, and when it is it will be one module's feature, not this one.
 * `[from Faizuddin, 2026-08-18]` So this page object clicks Pay Now, clears
 * whatever dialogs come up, and waits for `complete.do`. Nothing else.
 *
 * Two properties of `body#payment` worth knowing:
 *  - it runs `noBack()` on load and re-arms it on `onpageshow`, so it actively
 *    defeats browser Back — use `#backBtn`, never `page.goBack()`.
 *  - `#pricing-changed-dialog` is expected, not an error: the price can
 *    legitimately change between steps and the page says so.
 */
export class PaymentPage extends BasePage {
  private payBtn = () => this.page.locator('a#to-pay button.payBtn, a#to-pay, button.payBtn').first();

  private dialogBtn = () => this.page.locator(
    '#proceed-payment-dialog:visible button, #pricing-changed-dialog:visible button, ' +
    '.ui-dialog:visible button:has-text("OK"), .ui-dialog:visible button:has-text("Yes"), ' +
    '.ui-dialog:visible button:has-text("Proceed"), .ui-dialog:visible button:has-text("Confirm")',
  ).first();

  async expectHere(timeout = 60_000): Promise<void> {
    await expect(this.page.locator('body#payment'), 'Not on the insurance payment step').toBeVisible({ timeout });
  }

  /** "Reference No: B68004339" — how a tester matches this run to the record. */
  async referenceNo(): Promise<string> {
    const raw = (await this.page.locator('#refNo').textContent().catch(() => '')) ?? '';
    return (raw.match(/[A-Z]\d{5,}/)?.[0] ?? raw.replace(/reference no:?/i, '')).trim();
  }

  async totalAmount(): Promise<string> {
    const el = this.page.locator('#totalAmount, #amount').first();
    return ((await el.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Click Pay Now, clear the confirmation dialogs, wait for `complete.do`.
   *
   * A loop rather than a single `waitForURL` because PAY NOW hits a real
   * insurer API (~40s is normal) and can raise a dialog mid-flight, so the run
   * has to keep confirming while it waits. Not reaching `complete.do` inside
   * the window is a real failure — usually the known NCD/underwriting referral
   * loop, which is a property of the vehicle number, not of this script.
   */
  async payNow(timeoutMs = 150_000): Promise<void> {
    await this.expectHere();
    this.step(`Paying — ref ${await this.referenceNo()}, total ${await this.totalAmount()}`);
    await this.payBtn().click();

    const start = Date.now();
    let seenReferral = false;
    while (Date.now() - start < timeoutMs) {
      if (/complete\.do/.test(this.page.url())) {
        this.step(`Payment completed — ${this.page.url()}`);
        return;
      }
      if ((await this.dialogBtn().count()) && await this.dialogBtn().isVisible().catch(() => false)) {
        const text = await this.page
          .locator('.ui-dialog:visible, #proceed-payment-dialog:visible, #pricing-changed-dialog:visible')
          .first().innerText().catch(() => '');
        if (/refer|NCD Response|Motor UW/i.test(text)) {
          seenReferral = true;
          console.log(`[warn] Referral/underwriting dialog during payment: ${text.replace(/\s+/g, ' ').slice(0, 200)}`);
        }
        await this.dialogBtn().click().catch(() => { /* it can vanish as we click */ });
      }
      await this.page.waitForTimeout(1_500);
    }

    throw new Error(
      `Payment did not reach complete.do within ${Math.round(timeoutMs / 1000)}s for ${CONFIG.vehicleNo}. ` +
      (seenReferral
        ? 'A referral/underwriting dialog was shown — this vehicle number is stuck in the known NCD referral loop. Try another one.'
        : `Last URL: ${this.page.url()}`),
    );
  }
}
