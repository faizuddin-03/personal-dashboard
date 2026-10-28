import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SiteGatePage } from './SiteGatePage';
import { CONFIG } from '../data/config';

// Secarang's page after a declined / failed gateway payment (12107_TS02).
// The TS expects: a payment failed / unsuccessful message, a way to retry or
// go back to the payment method page, and no receipt.
//
// ⚠ Wording and controls are unconfirmed — the existing regression only ever
// proved "the success page did not appear" for a declined FPX status. This
// page object records what it sees so the first failed run captures it.

export class PaymentFailedPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private static FAILED_RE = /payment (was )?(failed|unsuccessful|declined|not successful)|unsuccessful|declined|failed/i;
  private static SUCCESS_RE = /payment successful|thank you for your purchase/i;

  async waitForOutcome(): Promise<{ failedShown: boolean; successShown: boolean; snippet: string }> {
    const gate = new SiteGatePage(this.page);
    await gate.passSiteGate(CONFIG.sitePassword);
    let snippet = '';
    await this.poll(async () => {
      snippet = this.clean(await this.bodyText());
      return PaymentFailedPage.FAILED_RE.test(snippet) || PaymentFailedPage.SUCCESS_RE.test(snippet);
    }, CONFIG.paymentOutcomeTimeout, 500);
    const failedShown = PaymentFailedPage.FAILED_RE.test(snippet);
    const successShown = PaymentFailedPage.SUCCESS_RE.test(snippet);
    console.log(`   📋 Outcome page: failed=${failedShown} success=${successShown}\n${snippet.slice(0, 500)}`);
    console.log('DETAIL:' + JSON.stringify({ label: 'Outcome page text', value: snippet.slice(0, 300) }));
    return { failedShown, successShown, snippet };
  }

  /** The visible failure message element, for highlighting. */
  async highlightMessage(): Promise<void> {
    const el = this.page.locator('h1, h2, h3, h4, h5, p, div').filter({ hasText: PaymentFailedPage.FAILED_RE }).last();
    if ((await el.count()) > 0) await this.demoHighlight(el, { color: 'red' });
  }

  /** Whether a retry / back-to-payment control is offered (logged, not
   *  asserted — the control's wording is not in the SRD). */
  async retryControlText(): Promise<string | null> {
    const ctl = this.page.locator('button, a').filter({ hasText: /retry|try again|back|payment method|pay again/i }).first();
    if ((await ctl.count()) === 0 || !(await ctl.isVisible().catch(() => false))) return null;
    const t = this.clean((await ctl.innerText().catch(() => '')) || '');
    await this.demoHighlight(ctl, { color: 'green' });
    return t || null;
  }

  /**
   * SRD 12107 REQ-007: a failed payment "returns the customer to the payment
   * page and allows another payment channel to be selected". Waits for the
   * payment-method tiles (input[formcontrolname="paymentType"], confirmed in
   * _reference/html/secarang/payment-methods.html); when they are not shown
   * on their own, clicks the retry / back control like a customer would.
   * Returns how the page was reached, or null when it never was.
   */
  async returnToPaymentMethods(): Promise<'shown' | `via "${string}"` | null> {
    const tiles = this.page.locator('input[formcontrolname="paymentType"]');
    if (await this.poll(async () => (await tiles.count()) > 0, 15_000)) return 'shown';
    const ctl = this.page.locator('button, a').filter({ hasText: /retry|try again|back|payment method|pay again/i }).first();
    if ((await ctl.count()) === 0 || !(await ctl.isVisible().catch(() => false))) return null;
    const label = this.clean((await ctl.innerText().catch(() => '')) || '');
    await this.demoHighlight(ctl);
    await ctl.click();
    return (await this.poll(async () => (await tiles.count()) > 0, 30_000)) ? `via "${label}"` : null;
  }

  async hasReceiptButton(): Promise<boolean> {
    const btn = this.page.locator('button:has-text("Receipt"), a:has-text("Receipt")').first();
    return (await btn.count()) > 0 && (await btn.isVisible().catch(() => false));
  }
}
