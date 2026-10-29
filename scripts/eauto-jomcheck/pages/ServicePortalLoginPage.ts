import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { UserCredentials } from '../data/users';

/**
 * Service Portal login — a SEPARATE app from UCD/BO with its own host path
 * and DIFFERENT field names: `name="name"` / `name="pass"`, not
 * `username`/`password`. Confirmed from a live capture,
 * `_reference/html/eauto/service-portal-login.html`.
 *
 * Login URL: `CONFIG.servicePortalLoginUrl` = `<base>/bank/login/`,
 * confirmed by Faizuddin, 2026-10-05.
 */
export class ServicePortalLoginPage extends BasePage {
  private usernameInput = () => this.page.locator('input[name="name"]').first();
  private passwordInput = () => this.page.locator('input[name="pass"]').first();
  private loginBtn      = () => this.page.locator('input.to-login, input[type="submit"]').first();

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto(CONFIG.servicePortalLoginUrl, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
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

  async login(creds: UserCredentials): Promise<void> {
    console.log('🔐 Logging in (Service Portal)...');
    await this.goto();

    // No login form is only fine when the Service Portal home is already on
    // screen. Anything else (an error page, a wrong URL) must fail here, not
    // be skipped as "already logged in" — 2026-10-05, TS37 hit a "URL not
    // found" page, skipped login and failed 30s later on a missing link.
    if (!(await this.isLoginFormVisible())) {
      if (await this.isLoggedIn()) {
        console.log('   Already logged in to Service Portal.');
        return;
      }
      throw new Error(`Service Portal login page did not load at ${this.page.url()} — no login form and no Service Portal home.`);
    }

    await this.submitCredentials(creds);
    if (await this.isLoginFormVisible()) {
      throw new Error(`Service Portal login failed — the login form is still shown (URL: ${this.page.url()}). Check the Service Portal username/password.`);
    }
    console.log(`✅ Login done. URL: ${this.page.url()}`);
  }

  /** Service Portal home shows "Hire Purchase Ownership" with the JomCheck
   *  Report Listing link (_reference/html/eauto/service-portal-home-and-jomcheck-listing.html). */
  private async isLoggedIn(): Promise<boolean> {
    return this.page.getByRole('link', { name: 'JomCheck Report Listing' }).first().isVisible().catch(() => false);
  }
}
