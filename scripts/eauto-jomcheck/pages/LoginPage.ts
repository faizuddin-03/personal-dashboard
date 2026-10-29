import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { UserCredentials } from '../data/users';

// ── UCD/BO login (shared host, same login form as other eauto-* scripts) ──
export class LoginPage extends BasePage {
  private usernameInput = () => this.page.locator('input[name="username"], input[placeholder="Username"]').first();
  private passwordInput = () => this.page.locator('input[name="password"], input[placeholder="Password"]').first();
  private loginBtn      = () => this.page.locator('button:has-text("Login"), input[type="submit"], button[type="submit"]').first();

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto(CONFIG.stagingLoginUrl, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  async isLoginFormVisible(): Promise<boolean> {
    return (await this.usernameInput().count()) > 0;
  }

  async submitCredentials(creds: UserCredentials): Promise<void> {
    await this.demoHighlight(this.usernameInput());
    await this.usernameInput().fill(creds.username);
    await this.demoHighlight(this.passwordInput());
    await this.passwordInput().fill(creds.password);
    await this.demoHighlight(this.loginBtn());
    await this.loginBtn().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  /** Full session bootstrap: open the login page and authenticate. */
  async login(creds: UserCredentials): Promise<void> {
    console.log('🔐 Logging in (UCD/BO)...');
    await this.goto();

    if (!(await this.isLoginFormVisible())) {
      console.log('   No login form — already logged in?');
      return;
    }

    await this.submitCredentials(creds);
    await this.dismissBanners();

    if (this.page.url().includes('/login')) {
      console.log('   Still on login — trying again on current page...');
      if (await this.isLoginFormVisible()) {
        await this.submitCredentials(creds);
        await this.dismissBanners();
      }
    }

    console.log(`✅ Login done. URL: ${this.page.url()}`);
  }

  /**
   * Ends the current session by loading the logout URL directly — bypasses
   * the "Sure to logout?" native `confirm()` the real logout link triggers,
   * which is simpler and more reliable to automate than handling a dialog.
   * Use this to switch accounts WITHIN one page/context (e.g. UCD -> BO in
   * the same test), so the whole flow stays in one video recording instead
   * of two separate context recordings — Faizuddin, 2026-10-01: "for
   * multiple users TS without concurrent running, it should use the same
   * browser so that the recording will be able to record everything in one
   * recording only."
   */
  async logout(): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrl}${CONFIG.logoutPath}`, {
      waitUntil: 'load',
      timeout: CONFIG.navigationTimeout,
    });
    await this.settleAfterLoad();
  }
}
