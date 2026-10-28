import { Page } from '@playwright/test';
import { AplBase } from './AplBase';
import { CONFIG } from '../data/config';
import { UserCredentials } from '../data/users';
import { watchDialogs } from '../utils/dialogs';

// BO login. Field selectors copied from scripts/eauto-jomcheck/pages/LoginPage.ts
// (same UCD/BO login form); the logged-in name from _reference/html/eauto/
// bo-home-mfared-uat4.html line 1204 (`<span class="user-name">Muhammad Fared</span>`);
// the Logout link from the same capture, lines 1126-1128 and 1206
// (`<a href="#" class="logout">`, confirm("Sure to logout?")).
export class LoginPage extends AplBase {
  // copied from scripts/eauto-jomcheck/pages/LoginPage.ts
  usernameInput = () => this.page.locator('input[name="username"], input[placeholder="Username"]').first();
  // copied from scripts/eauto-jomcheck/pages/LoginPage.ts
  private passwordInput = () => this.page.locator('input[name="password"], input[placeholder="Password"]').first();
  // copied from scripts/eauto-jomcheck/pages/LoginPage.ts
  private loginBtn = () => this.page.locator('button:has-text("Login"), input[type="submit"], button[type="submit"]').first();
  // from _reference/html/eauto/bo-home-mfared-uat4.html line 1204
  userName = () => this.page.locator('span.user-name').first();
  // from _reference/html/eauto/bo-home-mfared-uat4.html line 1206
  logoutLink = () => this.page.locator('a.logout').first();

  constructor(page: Page) { super(page); }

  async isLoginFormVisible(): Promise<boolean> {
    return this.usernameInput().isVisible();
  }

  /**
   * Automation lesson 16: before any password is typed, the page must be on
   * the configured host AND instance (staging.eauto.my/eauto, not another
   * instance on the same host). Throws on a mismatch.
   */
  assertOnConfiguredEnvironment(): void {
    const here = new URL(this.page.url());
    const want = new URL(CONFIG.host);
    if (here.host !== want.host || !here.pathname.startsWith(`/${CONFIG.instance}/`)) {
      throw new Error(`Refusing to type a password: the page is on ${here.host}${here.pathname}, not ${want.host}/${CONFIG.instance}/.`);
    }
  }

  /** Opens the login page and signs in. Returns the name the BO header shows. */
  async login(user: UserCredentials): Promise<string> {
    await this.page.goto(CONFIG.loginUrl, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    if (!(await this.isLoginFormVisible())) {
      if (await this.userName().isVisible()) throw new Error(`Already logged in as "${await this.userName().innerText()}" when ${user.label} was needed — log out first.`);
      throw new Error(`No login form at ${this.page.url()}.`);
    }
    this.assertOnConfiguredEnvironment();
    await this.demoHighlight(this.usernameInput());
    await this.usernameInput().fill(user.username);
    await this.demoHighlight(this.passwordInput());
    await this.passwordInput().fill(user.password);
    await this.demoHighlight(this.loginBtn());
    await this.loginBtn().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    await this.dismissBanners();
    // Lesson 4: a refused login is reported, never retried into a lockout.
    if (!(await this.userName().isVisible())) {
      const why = (await this.bodyText()).match(/invalid[^\n]*|incorrect[^\n]*|locked[^\n]*/i)?.[0] ?? 'still on the login page';
      throw new Error(`Login refused for ${user.label} (${user.username}): ${why}. Not retried (repeated logins look like a wrong password).`);
    }
    const name = (await this.userName().innerText()).replace(/,\s*$/, '').trim();
    console.log(`✅ Logged in as ${user.label} — header shows "${name}"`);
    return name;
  }

  /** Ends the session by loading the logout address (no confirm dialog) — copied from
   *  scripts/eauto-jomcheck/pages/LoginPage.ts logout(); used to switch roles in one recording. */
  async logout(): Promise<void> {
    await this.page.goto(CONFIG.logoutUrl, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  /** The real header Logout link, answering its "Sure to logout?" confirm as a person does. */
  async logoutByLink(): Promise<void> {
    const link = this.logoutLink();
    if (!(await link.count())) throw new Error(`No "Logout" link (a.logout) on ${this.page.url()}.`);
    watchDialogs(this.page); // answers "Sure to logout?" with OK
    await this.demoHighlight(link);
    await link.click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }
}
