import { test, expect, type Page } from '@playwright/test';
import { PaymentFailedPage } from '../pages/PaymentFailedPage';
import { PaymentTypePage } from '../pages/PaymentTypePage';

/**
 * Secarang expected results of a failed e-wallet payment — 12107_TS03
 * (GrabPay) and 12107_TS04 (ShopeePay), TS v3 (20_10_26): failed /
 * unsuccessful message, no success page, no receipt, back on Select Payment
 * Method with another method selectable (SRD 12107 REQ-007). Same checks the
 * old 12107_TS02 (Failed Pay With Grab) ran until 2026-10-20.
 */
export async function verifyPaymentFailed(page: Page, ts: string): Promise<void> {
  const failed = new PaymentFailedPage(page);
  await test.step('Payment Failed page: confirm the failed / unsuccessful message is shown', async () => {
    const outcome = await failed.waitForOutcome();
    await failed.captureEvidence(`${ts}-payment-failed-page`);
    if (outcome.successShown || !outcome.failedShown) await failed.captureIssue(`${ts}-no-failed-message`, page.locator('main, body').first(),
      outcome.successShown ? 'Payment Success page shown for Status = Failed' : 'No failed / unsuccessful message');
    expect(outcome.successShown, 'Status = Failed must not reach the Payment Success page').toBe(false);
    expect(outcome.failedShown, 'A payment failed / unsuccessful message should be shown').toBe(true);
    await failed.highlightMessage();
  });
  await test.step('Confirm no receipt is generated', async () => {
    expect(await failed.hasReceiptButton(), 'No Receipt button on a failed payment').toBe(false);
  });
  await test.step('Confirm the system returns to the Select Payment Method page and another payment method can be selected', async () => {
    const how = await failed.returnToPaymentMethods();
    console.log('DETAIL:' + JSON.stringify({ label: `${ts} return to Select Payment Method`, value: how ?? 'not reached' }));
    expect(how, 'Select Payment Method page was not shown after the failed payment').not.toBeNull();
    const paymentType = new PaymentTypePage(page);
    const options = await paymentType.logPaymentOptions();
    await paymentType.captureEvidence(`${ts}-back-on-select-payment-method`);
    expect(options.length, 'Payment method options are selectable again').toBeGreaterThan(1);
  });
}
