import { Page } from '@playwright/test';
import { EstmSession } from './EstmSession';
import { CONFIG, EstmInputs, escapeRegex } from './estmConfig';

// ── eAuto login → lands on UCD home ─────────────────────────
export class LoginPage {
  constructor(private readonly page: Page, private readonly session: EstmSession) {}

  private usernameInput = () => this.page.getByRole('textbox', { name: 'Username ' });
  private passwordInput = () => this.page.getByRole('textbox', { name: 'Password ' });
  private loginBtn      = () => this.page.getByRole('button', { name: 'Login' });

  async maximize(): Promise<void> {
    const cdp = await this.page.context().newCDPSession(this.page);
    const { windowId } = await cdp.send('Browser.getWindowForTarget');
    await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'maximized' } }).catch(() => {});
  }

  /** Same as scripts/eauto-estm, with the UCD login passed in (the 12412
   *  dashboard's UCD fields) instead of that suite's own default. */
  async login(inputs: EstmInputs, creds: { username: string; password: string }): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrlFor(inputs.envSegment)}/public/login/`);
    await this.maximize();
    await this.usernameInput().fill(creds.username);
    await this.usernameInput().press('Tab');
    await this.passwordInput().fill(creds.password);
    await Promise.all([
      this.page.waitForURL(new RegExp(`/${escapeRegex(inputs.envSegment)}/view/ucd/home(\\.do)?`), {
        waitUntil: 'domcontentloaded', timeout: 20000,
      }),
      this.loginBtn().click(),
    ]);
    this.session.progress('login', 'Login');
  }
}
