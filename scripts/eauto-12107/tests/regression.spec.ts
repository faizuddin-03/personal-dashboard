import { test, type Page } from '@playwright/test';
import { SCENARIO_DATA, FIUU } from '../data/users';
import { CONFIG } from '../data/config';
import { driveToPaymentMethod, verifyPaymentSuccess } from '../utils/secarangFlow';
import { FiuuSandboxPage } from '../pages/FiuuSandboxPage';
import { BankLoginPage } from '../pages/BankLoginPage';
import { BankTACPage } from '../pages/BankTACPage';

// EAINT-12107 REGRESSION — the existing Fiuu rails still work after the
// ShopeePay/GrabPay change: 12107_TS07 (Credit or Debit Card) and
// 12107_TS08 (FPX, RHB). The CIBO leg (incl. "Payment Reference ID does not
// contain EW") stays manual.
//
// TS08 is the chain scripts/secarang-insurance's regression already drives
// (FPX bank simulator: login, status "00", Request TAC, OTP, Pay Now).
// ⚠ TS07's Fiuu card sandbox popup has never been captured — it goes through
// the generic FiuuSandboxPage (status select + Pay), logs the page, and will
// need its real selectors once seen.

test.describe('EAINT-12107 — regression of existing payment methods', () => {
  test('12107_TS07: Payment method = Credit or Debit Card — private car, Lonpac', async ({ page }) => {
    const ts = '12107_TS07';
    const data = SCENARIO_DATA.ts07;
    const { confirmation, paymentType } = await driveToPaymentMethod(page, data, ts);

    let popup: Page | null = null;
    await test.step('Select Credit or Debit Card — the Fiuu card page pops up', async () => {
      popup = await paymentType.selectCreditDebitCard();
    });
    if (!popup) {
      await test.step('Click Pay — the Fiuu card sandbox pops up', async () => {
        popup = await paymentType.clickPayAndWaitForPopup();
      });
    }
    const sandbox = new FiuuSandboxPage(popup!);
    await test.step('Fiuu card sandbox: read the page', async () => {
      await sandbox.logPage();
      await sandbox.captureEvidence(`${ts}-fiuu-card-popup`);
    });
    if (await sandbox.isCardForm()) {
      // Fiuu shows its real card form; pay with the sandbox test card typed on
      // the dashboard (Faizuddin, 2026-10-19).
      await test.step('Enter the test card (number, expiry, CVV) and click [Pay]', async () => {
        if (!FIUU.cardNumber || !FIUU.cardExpiry || !FIUU.cardCvv) throw new Error('Test card is blank — fill it on /eauto/12107');
        await sandbox.payByCard({ number: FIUU.cardNumber, expiry: FIUU.cardExpiry, cvv: FIUU.cardCvv });
        await sandbox.waitForClose();
      });
    } else {
      await test.step('Set Payment Status = Success', async () => {
        await sandbox.setPaymentStatus('success');
      });
      await test.step('Click [Pay]', async () => {
        await sandbox.clickPay();
        await sandbox.waitForClose();
      });
    }

    await verifyPaymentSuccess(page, ts, confirmation, data, /card|credit|debit|fiuu/i);
  });

  test('12107_TS08: Payment method = FPX (RHB) — private car, Lonpac', async ({ page }) => {
    const ts = '12107_TS08';
    const data = SCENARIO_DATA.ts08;
    const { confirmation, paymentType } = await driveToPaymentMethod(page, data, ts);

    let popup: Page | null = null;
    await test.step('Select FPX Online banking', async () => {
      await paymentType.selectFPX();
      await paymentType.logAvailableBanks();
    });
    await test.step(`Select bank ${FIUU.bankValue || FIUU.bankName} — the Fiuu FPX simulator pops up`, async () => {
      popup = await paymentType.selectBank(FIUU.bankValue, FIUU.bankName);
    });
    await test.step('FPX simulator: log in', async () => {
      await new BankLoginPage(popup!).login(CONFIG.sitePassword, FIUU.bankUsername, FIUU.bankPassword);
    });
    const tac = new BankTACPage(popup!);
    await test.step('Set Payment Status = Success (00) and request TAC', async () => {
      await tac.logOptionsAndRequestTAC(FIUU.fpxStatusOk);
    });
    await test.step('Enter the OTP and click Pay Now', async () => {
      await tac.enterOTPAndPay();
      await tac.waitForClose();
    });

    await verifyPaymentSuccess(page, ts, confirmation, data, /fpx|online banking|rhb|fiuu/i);
  });
});
