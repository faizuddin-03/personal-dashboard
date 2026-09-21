import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { pending } from '../../utils/pendingHtml';

// ── Card payment (Credit/Debit) ────────────────────────────
// Biggest open item in the whole ticket study: whether the Fiuu sandbox's
// 3DS/card OTP is readable in the DOM the way the FPX TAC page is. If yes,
// this automates the same way FpxBankTacPage does. If it's a real ACS with
// an SMS OTP, TS5/TS6's card legs stay manual and this page object should
// stop at `submitPayment()` and let a human complete the challenge.
// TODO: confirm on first contact with the real page, once HTML is captured.
export class CardPaymentPage extends BasePage {
  constructor(page: Page) { super(page); }

  /** Sheet: "Enter correct/invalid card details (<Credit|Debit> Card Details)". */
  async enterCardDetails(cardNumber: string, cvv: string): Promise<void> {
    pending(`CardPaymentPage.enterCardDetails — card field selectors unknown (cardNumber="${cardNumber}")`);
  }

  /** Sheet: "Click 'Pay MYR XXX.XX'". */
  async clickPay(): Promise<void> {
    pending('CardPaymentPage.clickPay — pay button selector/label unknown');
  }

  /** Only relevant if the 3DS challenge turns out to be DOM-readable (see class doc above). */
  async completeThreeDsChallenge(): Promise<void> {
    pending('CardPaymentPage.completeThreeDsChallenge — unknown whether this is even automatable; confirm on first contact with the real sandbox');
  }
}
