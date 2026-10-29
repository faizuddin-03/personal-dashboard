import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { FpxOutcome } from '../../data/types';
import { pending } from '../../utils/pendingHtml';

// ── FPX sandbox TAC/status page (popup) ────────────────────
// Ported shape from scripts/secarang-insurance/pages/BankTACPage.ts — the
// decisive page in the whole chain. That script selects the desired outcome
// from `select#status_code` BEFORE requesting the TAC, then reads the OTP
// out of the DOM (`div.otp` / `[class*="otp"]`) and submits it. Per
// knowledge/eauto-payments.md, this module uses the SAME Fiuu sandbox, so
// the same selectors are the first thing to try once HTML is captured —
// left as a stub (not copied verbatim) so that assumption gets verified,
// not silently inherited.
export class FpxBankTacPage extends BasePage {
  constructor(popup: Page) { super(popup); }

  /** Sheet: "Complete TAC and choose Payment Status = <outcome>". */
  async chooseOutcomeAndRequestTac(outcome: FpxOutcome): Promise<void> {
    pending(`FpxBankTacPage.chooseOutcomeAndRequestTac("${outcome}") — verify select#status_code + Request TAC button against scripts/secarang-insurance/pages/BankTACPage.ts`);
  }

  /** Sheet: "Complete payment" — enter the sandbox-rendered OTP and pay. */
  async enterOtpAndPay(): Promise<void> {
    pending('FpxBankTacPage.enterOtpAndPay — verify OTP DOM extraction + Pay Now button against scripts/secarang-insurance/pages/BankTACPage.ts');
  }

  async waitForClose(): Promise<void> {
    pending('FpxBankTacPage.waitForClose — popup close-wait pattern from scripts/secarang-insurance/pages/BankTACPage.ts#waitForClose');
  }
}
