import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';

// ── UCD login → lands on the UCD home dashboard ─────────────
export class LoginPage extends BasePage {
  private usernameInput = () => this.page.locator('input[name="username"], input[placeholder*="Username" i]').first();
  private passwordInput = () => this.page.locator('input[name="password"], input[placeholder*="Password" i]').first();
  private loginBtn      = () => this.page.locator('button:has-text("Login"), input[type="submit"], button[type="submit"]').first();

  async login(): Promise<void> {
    this.reporter.progress('login', 'running', 'Login');
    await this.page.goto(`${CONFIG.baseUrl}/public/login/`, { waitUntil: 'domcontentloaded' });
    await this.announce(`Logging in to ${CONFIG.env} as ${CONFIG.username}`);
    await this.usernameInput().fill(CONFIG.username);
    await this.passwordInput().fill(CONFIG.password);
    await Promise.all([
      this.page.waitForURL(/\/view\/ucd\/home(\.do)?/, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {}),
      this.loginBtn().click(),
    ]);
    await this.page.waitForTimeout(1500);
    await this.closePopup();
    if (!/\/view\/ucd\/home/.test(this.page.url())) {
      await this.page.goto(`${CONFIG.baseUrl}/view/ucd/home.do`, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await this.closePopup();
    }
    await this.shot('login-home', `Logged in as ${CONFIG.username} — UCD home`, [{ text: CONFIG.username.toUpperCase(), label: 'Logged-in user' }]);
    this.reporter.progress('login', 'done');
  }
}
