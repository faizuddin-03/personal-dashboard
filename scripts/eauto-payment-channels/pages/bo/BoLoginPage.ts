import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { CONFIG } from '../../data/config';
import { BoCredentials } from '../../data/users';
import { pending } from '../../utils/pendingHtml';

// ── BO login ────────────────────────────────────────────────
// Structurally the same "login, land on the target BO screen" shape as
// scripts/eauto-company-checker/pages/LoginPage.ts, but that script's exact
// selectors are for the Manage Company Accounts login — reused as a
// starting guess only, not assumed identical.
export class BoLoginPage extends BasePage {
  constructor(page: Page) { super(page); }

  async login(creds: BoCredentials): Promise<void> {
    pending(`BoLoginPage.login("${creds.role}") — BO login form selectors unknown; see scripts/eauto-company-checker/pages/LoginPage.ts for the shape to reuse`);
  }
}
