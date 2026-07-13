import { Page } from '@playwright/test';
import { EstmSession } from '../utils/session';
import { CONFIG, EstmInputs, escapeRegex } from '../data/config';

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

  async login(inputs: EstmInputs): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrlFor(inputs.envSegment)}/public/login/`);
    await this.maximize();
    await this.usernameInput().fill(CONFIG.username);
    await this.usernameInput().press('Tab');
    await this.passwordInput().fill(CONFIG.password);
    await Promise.all([
      this.page.waitForURL(new RegExp(`/${escapeRegex(inputs.envSegment)}/view/ucd/home(\\.do)?`), {
        waitUntil: 'domcontentloaded', timeout: 20000,
      }),
      this.loginBtn().click(),
    ]);
    this.session.progress('login', 'Login');
  }
}
