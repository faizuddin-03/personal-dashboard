import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { PATHS } from '../utils/paths';

export class LoginPage extends BasePage {
  private username = () => this.page.locator('input[name="username"], input[placeholder*="Username" i]').first();
  private password = () => this.page.locator('input[name="password"], input[placeholder*="Password" i]').first();
  private submit = () => this.page.locator('button:has-text("Login"), button[type="submit"], input[type="submit"]').first();

  /**
   * Login kicks off a redirect chain. Returning before it settles lets the next
   * goto() race the in-flight redirect and land on home instead of the target,
   * so wait until the URL has actually left /public/login.
   */
  async login(user = CONFIG.ucdUser, pass = CONFIG.ucdPass): Promise<void> {
    this.step(`Logging in as ${user}`);
    // Must precede the first navigation, so the dialog-chain flags are already
    // set when the home page runs its `ready` handler. Login is always the
    // first navigation, which makes this the right place for it.
    await BasePage.suppressPopups(this.page);
    await this.page.goto(PATHS.login(), { waitUntil: 'domcontentloaded' });
    await this.username().fill(user);
    await this.password().fill(pass);
    await Promise.all([
      this.page.waitForURL((u) => !/\/public\/login/.test(u.toString()), { timeout: 30_000 }).catch(() => { /* asserted below */ }),
      this.submit().click(),
    ]);
    await this.page.waitForLoadState('domcontentloaded').catch(() => { /* ignore */ });

    expect(this.page.url(), `Login did not leave the login page — check the ${user} credentials.`)
      .not.toMatch(/\/public\/login/);

    await this.dismissBanners();
    this.step(`Logged in as ${user}`);
  }
}
