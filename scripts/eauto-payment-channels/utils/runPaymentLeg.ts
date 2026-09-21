import { Page } from '@playwright/test';
import { PaymentChannelPage } from '../pages/ucd/PaymentChannelPage';
import { FpxBankLoginPage } from '../pages/ucd/FpxBankLoginPage';
import { FpxBankTacPage } from '../pages/ucd/FpxBankTacPage';
import { CardPaymentPage } from '../pages/ucd/CardPaymentPage';
import { PaymentOutcomePage } from '../pages/ucd/PaymentOutcomePage';
import { PaymentLegConfig } from '../data/types';

// ── One payment leg, either outcome ─────────────────────────
// Every TS3-TS6 scenario has the SAME shape for each leg: a "Failed" outcome
// in the sheet always means "decline once, observe the error, then redo the
// SAME payment until it succeeds" (sheet wording: "Redo Payment until
// Payment Status = Success") — never a dead end. This runner encodes that
// two-attempt shape once instead of repeating it per TS spec.
//
// `context` picks which redirect/listing-status assertions apply (see
// PaymentOutcomePage — Pre-Application and Application legs redirect to
// different pages on failure and check different listing fields on
// success).

export async function runPaymentLeg(
  page: Page,
  leg: PaymentLegConfig,
  context: 'pre-application' | 'application',
): Promise<void> {
  const channelPage = new PaymentChannelPage(page);
  const outcomePage = new PaymentOutcomePage(page);

  if (leg.channel === 'qr') {
    throw new Error('QR Code (TS7/TS8) has no steps in the sheet yet — not implemented by design, see data/scenarios.ts');
  }

  // Explicit positive checks for both branches — TS doesn't narrow a union
  // member out of the `else` branch when its discriminant property is
  // itself a union of literals (FpxLegConfig.channel is 'fpx-b2b'|'fpx-b2c',
  // not a single literal), so `if (fpx) {} else {}` would leave `leg` typed
  // as FpxLegConfig|CardLegConfig in the else branch instead of narrowing
  // to CardLegConfig alone.
  if (leg.channel === 'fpx-b2b' || leg.channel === 'fpx-b2c') {
    if (leg.outcome === 'Failed') {
      await runOneFpxAttempt(page, channelPage, leg.bank, 'Failed');
      await outcomePage.expectUnsuccessfulPaymentRedirect(context);
      // Sheet: "Redo Payment until Payment Status = Success"
      await runOneFpxAttempt(page, channelPage, leg.bank, 'Success');
    } else {
      await runOneFpxAttempt(page, channelPage, leg.bank, 'Success');
    }
  } else if (leg.channel === 'card-credit' || leg.channel === 'card-debit') {
    if (leg.outcome === 'Failed') {
      await runOneCardAttempt(page, channelPage, leg.channel, leg.cardType, 'Failed');
      await outcomePage.expectUnsuccessfulPaymentRedirect(context);
      // Sheet: "Redo payment until Payment Status = Success"
      await runOneCardAttempt(page, channelPage, leg.channel, leg.cardType, 'Success');
    } else {
      await runOneCardAttempt(page, channelPage, leg.channel, leg.cardType, 'Success');
    }
  }

  if (context === 'pre-application') {
    await outcomePage.expectPreApplicationSubmittedForReview();
  } else {
    await outcomePage.expectApplicationPaymentSuccess();
  }

  const { invoicePath, eInvoicePath } = await outcomePage.downloadInvoiceAndEInvoice();
  await outcomePage.verifyInvoiceEInvoiceDetails(invoicePath, eInvoicePath);

  if (context === 'pre-application') {
    await outcomePage.expectPreApplicationListingStatusApproved();
  } else {
    await outcomePage.expectApplicationListingStatusApprovedAndFeeOk();
  }
}

async function runOneFpxAttempt(
  page: Page,
  channelPage: PaymentChannelPage,
  bank: string,
  outcome: 'Success' | 'Failed',
): Promise<void> {
  await channelPage.selectBank(bank);
  const popup = await channelPage.submitAndPay();
  await new FpxBankLoginPage(popup).login(
    process.env.EAUTO_FPX_BANK_USERNAME || '',
    process.env.EAUTO_FPX_BANK_PASSWORD || '',
  );
  const tac = new FpxBankTacPage(popup);
  await tac.chooseOutcomeAndRequestTac(outcome);
  await tac.enterOtpAndPay();
  await tac.waitForClose();
}

async function runOneCardAttempt(
  page: Page,
  channelPage: PaymentChannelPage,
  channel: 'card-credit' | 'card-debit',
  cardType: 'VISA' | 'Mastercard',
  outcome: 'Success' | 'Failed',
): Promise<void> {
  const cardPage = new CardPaymentPage(page);
  const valid = outcome === 'Success';
  const [number, cvv] = cardType === 'VISA'
    ? [
        valid ? (process.env.EAUTO_CARD_VISA_NUMBER || '4111111111111111') : '4111111111111110',
        process.env.EAUTO_CARD_VISA_CVV || '111',
      ]
    : [
        valid ? (process.env.EAUTO_CARD_MASTERCARD_NUMBER || '5105105105105100') : '5555555555554440',
        process.env.EAUTO_CARD_MASTERCARD_CVV || '444',
      ];
  await cardPage.enterCardDetails(number, cvv);
  await cardPage.clickPay();
}
