import { test, expect, type Page } from '@playwright/test';
import { SCENARIO_DATA } from '../data/users';
import { driveToPaymentMethod, verifyPaymentSuccess } from '../utils/secarangFlow';
import { FiuuSandboxPage } from '../pages/FiuuSandboxPage';
import { verifyPaymentFailed } from '../utils/verifyPaymentFailed';
import { PaymentFailedPage } from '../pages/PaymentFailedPage';

// EAINT-12107 — ShopeePay, end to end on Secarang /ia.
// Faizuddin, 2026-10-20: "for TS02, can you make it shopee pay passed
// private, instead of the current TS" (TS02 was a failed GrabPay payment on a
// company car; no Secarang insurer quotes a company car).
//
// The "SPayLater" tile (logo alt "ShopeePay") opens Fiuu's QR page. A tester
// scans the QR with a phone; here the QR picture is decoded and its link
// opened in a new tab — the Fiuu ShopeePay simulator — then Success + "PROCEED
// TO PAY". Flow: knowledge/flow-secarang-insurance.md §7 item 17.

test.describe('EAINT-12107 — ShopeePay', () => {
  async function payWithShopeePay(page: Page, ts: string, outcome: 'success' | 'failed') {
    const data = outcome === 'success' ? SCENARIO_DATA.ts02 : SCENARIO_DATA.ts04;
    const { confirmation, paymentType } = await driveToPaymentMethod(page, data, ts);

    let popup: Page | null = null;
    await test.step('Select ShopeePay — the Fiuu ShopeePay QR code pops up', async () => {
      popup = await paymentType.selectShopeePay();
      if (!popup) throw new Error('No Fiuu popup opened after selecting ShopeePay');
    });
    const qr = new FiuuSandboxPage(popup!);
    await test.step('Fiuu ShopeePay QR page: read the page', async () => {
      await qr.logPage();
      await qr.captureEvidence(`${ts}-fiuu-shopeepay-qr`);
    });
    let simPage!: Page;
    await test.step('Scan the QR code — the ShopeePay simulator opens in a new tab', async () => {
      simPage = await qr.openQrLink();
    });
    const sim = new FiuuSandboxPage(simPage);
    await test.step(`Set Payment Status = ${outcome === 'success' ? 'Success' : 'Failed'}`, async () => {
      await sim.setPaymentStatus(outcome);
      await sim.captureEvidence(`${ts}-shopeepay-simulator`);
    });
    await test.step('Click [PROCEED TO PAY]', async () => {
      await sim.clickPay();
      await qr.waitForClose();
      // The simulator tab ends on a Secarang login page; the result shows in
      // the main window.
      await simPage.close().catch(() => {});
    });
    return { confirmation, data };
  }

  test('12107_TS02: Successful Pay With ShopeePay — private car, Lonpac', async ({ page }) => {
    const ts = '12107_TS02';
    const { confirmation, data } = await payWithShopeePay(page, ts, 'success');
    await verifyPaymentSuccess(page, ts, confirmation, data, /shopee\s*pay|e-?wallet/i);
  });

  // TS v3 (20_10_26): "both shopee pay and grab pay does not have failed
  // scenarios" (Faizuddin, 2026-10-20).
  test('12107_TS04: Failed Pay With ShopeePay — private car, Lonpac', async ({ page }) => {
    const ts = '12107_TS04';
    await payWithShopeePay(page, ts, 'failed');
    await verifyPaymentFailed(page, ts);
  });

  // Faizuddin, 2026-10-20: "i thought i told you to make 2 cancel payments" —
  // TS09 cancels GrabPay, this one ShopeePay. SRD 12107 REQ-008: "Cancelling
  // at either new channel returns the customer to the payment page with the
  // quotation retained." Same checks as 12107_TS09. The cancel control is the
  // QR page's "Cancel the transaction" button (live 2026-10-20).
  test('12107_TS10: Cancelled Pay With ShopeePay — private car, Lonpac', async ({ page }) => {
    const ts = '12107_TS10';
    const { paymentType } = await driveToPaymentMethod(page, SCENARIO_DATA.ts10, ts);

    const before = await test.step('Read the vehicle and premium on the Select Payment Method page', async () => {
      const bar = await paymentType.readPriceTopbar();
      console.log('DETAIL:' + JSON.stringify({ label: `${ts} before cancel`, value: `${bar.vehicle} · ${bar.premium}` }));
      return bar;
    });

    let popup: Page | null = null;
    await test.step('Select ShopeePay — the Fiuu ShopeePay QR code pops up', async () => {
      popup = await paymentType.selectShopeePay();
      if (!popup) throw new Error('No Fiuu popup opened after selecting ShopeePay');
    });
    const qr = new FiuuSandboxPage(popup!);
    await test.step('Fiuu ShopeePay QR page: read the page', async () => {
      await qr.logPage();
      await qr.captureEvidence(`${ts}-fiuu-shopeepay-qr`);
    });
    await test.step('Click [Cancel the transaction] on the QR page', async () => {
      const how = await qr.cancel();
      console.log('DETAIL:' + JSON.stringify({ label: `${ts} cancel`, value: how }));
      await qr.waitForClose();
    });

    const failed = new PaymentFailedPage(page);
    await test.step('Confirm the system returns to the Select Payment Method page', async () => {
      const how = await failed.returnToPaymentMethods();
      console.log('DETAIL:' + JSON.stringify({ label: `${ts} return to Select Payment Method`, value: how ?? 'not reached' }));
      await paymentType.captureEvidence(`${ts}-back-on-select-payment-method`);
      if (!how) await paymentType.captureIssue(`${ts}-not-back`, page.locator('main, body').first(), 'Not back on Select Payment Method after cancelling');
      expect(how, 'Select Payment Method page was not shown after cancelling').not.toBeNull();
    });
    await test.step('Confirm the quotation is retained (same vehicle and premium)', async () => {
      const after = await paymentType.readPriceTopbar();
      console.log('DETAIL:' + JSON.stringify({ label: `${ts} after cancel`, value: `${after.vehicle} · ${after.premium}` }));
      expect.soft(after.vehicle, 'Vehicle in the price bar').toBe(before.vehicle);
      expect.soft(after.premium, 'Premium in the price bar').toBe(before.premium);
    });
    await test.step('Confirm another payment method can be selected', async () => {
      const options = await paymentType.logPaymentOptions();
      expect(options.length, 'Payment method options are selectable again').toBeGreaterThan(1);
    });
  });
});
