import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { pending } from '../../utils/pendingHtml';

// ── FPX sandbox bank login (popup) ─────────────────────────
// Ported shape from scripts/secarang-insurance/pages/BankLoginPage.ts — same
// Fiuu sandbox per knowledge/eauto-payments.md, so this is expected to be a
// near-verbatim port once confirmed against this module's actual popup.
// Left as a stub rather than copied verbatim because the exact field
// selectors should be re-verified against THIS module's popup HTML, not
// assumed identical.
export class FpxBankLoginPage extends BasePage {
  constructor(popup: Page) { super(popup); }

  async login(username: string, password: string): Promise<void> {
    pending('FpxBankLoginPage.login — verify against scripts/secarang-insurance/pages/BankLoginPage.ts once this module\'s popup HTML is captured');
  }
}
