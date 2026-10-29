import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { UserCredentials } from '../data/users';

// ── Login page — lands on the Manage Company Accounts listing ──
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
    await this.usernameInput().fill(creds.username);
    await this.passwordInput().fill(creds.password);
    await this.loginBtn().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  /**
   * Full session bootstrap: open the login page, authenticate, and land on
   * the Manage Company Accounts listing — retrying once if bounced to /login.
   */
  async login(creds: UserCredentials): Promise<void> {
    console.log('🔐 Logging in...');
    await this.goto();

    if (!(await this.isLoginFormVisible())) {
      console.log('   No login form — already logged in?');
      await this.openCompanyListing();
      return;
    }

    await this.submitCredentials(creds);
    await this.dismissBanners();
    await this.openCompanyListing();

    if (this.page.url().includes('/login')) {
      console.log('   Still on login — trying again on current page...');
      if (await this.isLoginFormVisible()) {
        await this.submitCredentials(creds);
        await this.dismissBanners();
        await this.openCompanyListing();
      }
    }

    console.log(`✅ Login done. URL: ${this.page.url()}`);
  }

  private async openCompanyListing(): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrl}${CONFIG.companyListingPath}`, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    await this.dismissBanners();
  }
}
