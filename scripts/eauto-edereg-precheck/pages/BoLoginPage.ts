import { Page } from '@playwright/test';
import { CONFIG, escapeRegex } from '../data/config';

// ── eAuto login → lands on BO/Hub Admin home ────────────────────────
// Same shared eAuto login page as the AATF account (pages/LoginPage.ts) —
// only the account + post-login redirect differ. BO/Hub Admin accounts land
// on `/<segment>/home/` (confirmed from EAINT-9306-bo-home-menu.html's own
// `#home-link` nav, `href="/uat1/home/"`), not `/view/aatf/home`. Runs in
// its OWN browser context (a separate login session from the AATF one this
// suite otherwise uses throughout) — see JpjXmlLogPage's caller for how it's
// opened/closed. NEVER exercised live via automation.
export class BoLoginPage {
  constructor(private readonly page: Page) {}

  private usernameInput = () => this.page.getByRole('textbox', { name: 'Username ' });
  private passwordInput = () => this.page.getByRole('textbox', { name: 'Password ' });
  private loginBtn      = () => this.page.getByRole('button', { name: 'Login' });

  async login(envSegment: string): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrlFor(envSegment)}/public/login/`);
    await this.usernameInput().fill(CONFIG.boUsername);
    await this.usernameInput().press('Tab');
    await this.passwordInput().fill(CONFIG.boPassword);
    await Promise.all([
      this.page.waitForURL(new RegExp(`/${escapeRegex(envSegment)}/home/?$`), {
        waitUntil: 'domcontentloaded', timeout: 20000,
      }),
      this.loginBtn().click(),
    ]);
  }
}
