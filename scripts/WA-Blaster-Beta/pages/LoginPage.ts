import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { UserCredentials } from '../data/users';

// ── Login page (/login) ─────────────────────────────────────
export class LoginPage extends BasePage {
  // locators (private — specs never access these)
  private emailInput    = () => this.page.getByTestId('email');
  private passwordInput = () => this.page.getByTestId('password');
  private submitBtn     = () => this.page.getByTestId('submit');

  // locator getters for spec assertions (POMs return locators, specs assert)
  rememberMe = () => this.page.getByTestId('remember-me');
  loginError = () => this.page.getByTestId('login-error');

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /** Log in and wait for the dashboard redirect. */
  async login(creds: UserCredentials): Promise<void> {
    await this.goto();
    await this.emailInput().fill(creds.email);
    await this.passwordInput().fill(creds.password);
    await this.submitBtn().click();
    await this.page.waitForURL(/\/$/);
  }

  /** Submit credentials without waiting for a redirect — caller asserts the error. */
  async loginExpectingError(creds: { email: string; password: string }): Promise<void> {
    await this.goto();
    await this.emailInput().fill(creds.email);
    await this.passwordInput().fill(creds.password);
    await this.submitBtn().click();
  }
}
