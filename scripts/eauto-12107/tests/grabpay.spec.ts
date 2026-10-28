import { test, expect, type Page } from '@playwright/test';
import { SCENARIO_DATA } from '../data/users';
import { driveToPaymentMethod, verifyPaymentSuccess } from '../utils/secarangFlow';
import { verifyPaymentFailed } from '../utils/verifyPaymentFailed';
import { FiuuSandboxPage } from '../pages/FiuuSandboxPage';
import { PaymentFailedPage } from '../pages/PaymentFailedPage';
import { PaymentTypePage } from '../pages/PaymentTypePage';

// EAINT-12107 — [Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay
// and GrabPay. GrabPay "Full Amount" is the only new option the Fiuu sandbox
// can run (SRD v1.1 §2.2.8), so these two TS cover the new channel end to
// end on Secarang. Their CIBO legs (Transaction Management, Payment
// Management, Payment Report, Payment Reference ID "EW") stay manual — no
// CIBO page objects or captured HTML exist yet.
//
// Test script: _reference/tickets/EAINT-12107/EAINT-12107 + EAINT-12327 -
// Combined TS - ...xlsx, rows 12107_TS01 and 12107_TS02.
//
// ⚠ The GrabPay tile, the "Full Amount" sub-option and the Fiuu e-wallet
// sandbox popup are driven by UNCONFIRMED selectors (see PaymentTypePage.ts
// and FiuuSandboxPage.ts). The first run logs everything it sees; capture
// the HTML of those two screens and tighten the selectors before trusting
// a pass.

test.describe('EAINT-12107 — GrabPay (Full Amount)', () => {
  async function payWithGrabPay(page: Page, ts: string, outcome: 'success' | 'failed') {
    const data = outcome === 'success' ? SCENARIO_DATA.ts01 : SCENARIO_DATA.ts03;
    const { confirmation, paymentType } = await driveToPaymentMethod(page, data, ts);

    let popup: Page | null = null;
    await test.step('Select GrabPay — the Fiuu GrabPay page pops up', async () => {
      popup = await paymentType.selectGrabPay();
    });
    if (!popup) {
      await test.step('Select Full Amount', async () => {
        popup = await paymentType.selectFullAmount();
      });
    }
    if (!popup) {
      await test.step('Click Pay — the Fiuu GrabPay browser pops up', async () => {
        popup = await paymentType.clickPayAndWaitForPopup();
      });
    }
    const sandbox = new FiuuSandboxPage(popup!);
    await test.step('Fiuu GrabPay sandbox: read the page', async () => {
      await sandbox.logPage();
      await sandbox.captureEvidence(`${ts}-fiuu-grabpay-popup`);
    });
    await test.step(`Set Payment Status = ${outcome === 'success' ? 'Success' : 'Failed'}`, async () => {
      await sandbox.setPaymentStatus(outcome);
    });
    await test.step('Click [Pay]', async () => {
      await sandbox.clickPay();
      await sandbox.waitForClose();
    });
    return { confirmation, data };
  }

  test('12107_TS01: Successful Pay With Grab (Full Amount) — private car, Lonpac', async ({ page }) => {
    const ts = '12107_TS01';
    const { confirmation, data } = await payWithGrabPay(page, ts, 'success');
    await verifyPaymentSuccess(page, ts, confirmation, data, /grab\s*pay|e-?wallet/i);
  });

  // TS v3 (20_10_26): the failed GrabPay payment is 12107_TS03, private car
  // (12107_TS02 is now the successful ShopeePay payment — tests/shopeepay.spec.ts).
  test('12107_TS03: Failed Pay With Grab (Full Amount) — private car, Lonpac', async ({ page }) => {
    const ts = '12107_TS03';
    await payWithGrabPay(page, ts, 'failed');
    await verifyPaymentFailed(page, ts);
  });

  // TS v2 (19_10_26), SRD 12107 REQ-008: "Cancelling at either new channel
  // returns the customer to the payment page with the quotation retained."
  // [unconfirmed] the Fiuu sandbox's cancel control (FiuuSandboxPage.cancel).
  test('12107_TS09: Cancelled Pay With Grab (Full Amount) — private car, Lonpac', async ({ page }) => {
    const ts = '12107_TS09';
    const data = SCENARIO_DATA.ts09;
    const { paymentType } = await driveToPaymentMethod(page, data, ts);

    const before = await test.step('Read the vehicle and premium on the Select Payment Method page', async () => {
      const bar = await paymentType.readPriceTopbar();
      console.log('DETAIL:' + JSON.stringify({ label: `${ts} before cancel`, value: `${bar.vehicle} · ${bar.premium}` }));
      return bar;
    });

    let popup: Page | null = null;
    await test.step('Select GrabPay — the Fiuu GrabPay page pops up', async () => { popup = await paymentType.selectGrabPay(); });
    if (!popup) await test.step('Select Full Amount', async () => { popup = await paymentType.selectFullAmount(); });
    if (!popup) {
      await test.step('Click Pay — the Fiuu GrabPay browser pops up', async () => { popup = await paymentType.clickPayAndWaitForPopup(); });
    }
    const sandbox = new FiuuSandboxPage(popup!);
    await test.step('Fiuu GrabPay sandbox: read the page', async () => {
      await sandbox.logPage();
      await sandbox.captureEvidence(`${ts}-fiuu-grabpay-popup`);
    });
    await test.step('Cancel the payment on the Fiuu GrabPay page', async () => {
      const how = await sandbox.cancel();
      console.log('DETAIL:' + JSON.stringify({ label: `${ts} cancel`, value: how }));
      await sandbox.waitForClose();
    });

    const failed = new PaymentFailedPage(page);
    await test.step('Confirm the system returns to the Select Payment Method page', async () => {
      const how = await failed.returnToPaymentMethods();
      console.log('DETAIL:' + JSON.stringify({ label: `${ts} return to Select Payment Method`, value: how ?? 'not reached' }));
      await paymentType.captureEvidence(`${ts}-back-on-select-payment-method`);
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
