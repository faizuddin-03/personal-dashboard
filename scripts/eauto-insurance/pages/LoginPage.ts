import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { UserCredentials } from '../data/users';

// ── Login page (staging + production variants) ─────────────
export class LoginPage extends BasePage {
  // locators (private — specs never access these)
  private usernameInput = () => this.page.locator('input[name="username"], input[placeholder="Username"]').first();
  private passwordInput = () => this.page.locator('input[name="password"], input[placeholder="Password"]').first();
  private loginBtn      = () => this.page.locator('button:has-text("Login"), input[type="submit"], button[type="submit"]').first();

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto(CONFIG.stagingLoginUrl, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  /** True when a login form is present on the current page. */
  async isLoginFormVisible(): Promise<boolean> {
    return (await this.usernameInput().count()) > 0;
  }

  /** Fill and submit the login form on whatever page we're currently on. */
  async submitCredentials(creds: UserCredentials): Promise<void> {
    await this.usernameInput().fill(creds.username);
    await this.passwordInput().fill(creds.password);
    await this.loginBtn().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  /**
   * Full session bootstrap: open the login page, authenticate, and land on
   * the enquiry page — retrying once if the site bounces us back to /login.
   */
  async login(creds: UserCredentials): Promise<void> {
    console.log('🔐 Logging in...');
    await this.goto();
    console.log(`   Landed on: ${this.page.url()}`);

    if (!(await this.isLoginFormVisible())) {
      console.log('   No login form — already logged in?');
      return;
    }

    await this.submitCredentials(creds);
    console.log(`   Post-login: ${this.page.url()}`);
    await this.dismissBanners();

    await this.openEnquiryPage();

    // If redirected to login again, try once more on whatever page we're on
    if (this.page.url().includes('/login')) {
      console.log('   Still on login — trying again on current page...');
      if (await this.isLoginFormVisible()) {
        await this.submitCredentials(creds);
        await this.dismissBanners();
        await this.openEnquiryPage();
      }
    }

    console.log(`✅ Login done. URL: ${this.page.url()}`);
  }

  private async openEnquiryPage(): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrl}${CONFIG.enquiryPath}`, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }
}
