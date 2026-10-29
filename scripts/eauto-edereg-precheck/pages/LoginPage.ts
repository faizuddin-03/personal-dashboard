import { Page } from '@playwright/test';
import { PrecheckSession } from '../utils/session';
import { CONFIG, PrecheckInputs, escapeRegex } from '../data/config';

// ── eAuto login → lands on AATF home ────────────────────────
// The login form itself is inferred from eSTM's (scripts/eauto-estm/pages/
// LoginPage.ts) — same eAuto shared login page — since no AATF-specific
// login HTML has been captured. Only the post-login redirect target is
// confirmed different: AATF accounts land on /view/aatf/home, not
// /view/ucd/home. If this selector set turns out wrong on first real run,
// capture the AATF login page per AGENTS.md and correct it here.
export class LoginPage {
  constructor(private readonly page: Page, private readonly session: PrecheckSession) {}

  private usernameInput = () => this.page.getByRole('textbox', { name: 'Username ' });
  private passwordInput = () => this.page.getByRole('textbox', { name: 'Password ' });
  private loginBtn      = () => this.page.getByRole('button', { name: 'Login' });

  async maximize(): Promise<void> {
    const cdp = await this.page.context().newCDPSession(this.page);
    const { windowId } = await cdp.send('Browser.getWindowForTarget');
    await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'maximized' } }).catch(() => {});
  }

  /** `credentials` defaults to the main account (`CONFIG.username`/
   *  `password`) — pass `{ username: CONFIG.subUsername, password:
   *  CONFIG.subPassword }` for the AATF Multiple Users sub-account (User B,
   *  MU_TS1 onward), added 2026-08-26. Runs in whatever browser context
   *  `this.page` belongs to — for a second, concurrent user, construct this
   *  page object against a SEPARATE context/page, same pattern
   *  `BoLoginPage` already uses for the BO account. */
  async login(inputs: PrecheckInputs, credentials?: { username: string; password: string }): Promise<void> {
    const { username, password } = credentials ?? { username: CONFIG.username, password: CONFIG.password };
    await this.page.goto(`${CONFIG.baseUrlFor(inputs.envSegment)}/public/login/`);
    await this.maximize();
    await this.usernameInput().fill(username);
    await this.usernameInput().press('Tab');
    await this.passwordInput().fill(password);
    await Promise.all([
      this.page.waitForURL(new RegExp(`/${escapeRegex(inputs.envSegment)}/view/aatf/home(\\.do)?`), {
        waitUntil: 'domcontentloaded', timeout: 20000,
      }),
      this.loginBtn().click(),
    ]);
    this.session.progress('login', 'Login');
  }
}
