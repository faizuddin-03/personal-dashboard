import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { USERS } from '../data/config';

// Fiuu sandbox popup — both rails the onboarding pages open.
//
// FPX bank simulator (captures _reference/html/fiuu/bank-simulator-mb2u-*.html,
// 2026-10-21): login `#username` / `#password` / `#login-btn`; then
// `select#status_code` (00 Approved, 51 Insufficient Funds, 99 "Pending for
// Authorization (Applicable for B2B Model)", BC cancelled, …), `#tac-btn`
// "Request TAC" fills the readonly `#otp`; the code is typed into `#tac_no`;
// `#pay-btn` "Pay Now".
//
// Card form (12107, live 2026-10-20 on /ia): `input#cardnumber`, `#expdate`,
// `#cvv-flip`, `button#pay-online-btn`, then a 3D Secure page that prints
// "For testing: use OTP 123456". [unverified on /obs onboarding]
//
// Credentials are typed ONLY when the window's host is exactly
// bank-simulator.fiuu.com (Azila's guard, fiuu.page.ts) — any other password
// form is treated as a real bank and the run stops.

export const SIMULATOR_HOST = 'bank-simulator.fiuu.com';

/** Status codes the TS needs. "Failed (any failed status)" → 51 Insufficient Funds. */
export const FPX_STATUS = { approved: '00', failed: '51', pendingB2B: '99' } as const;

export class FiuuPage extends BasePage {
  constructor(popup: Page) { super(popup); }

  private host(): string {
    try { return new URL(this.page.url()).hostname; } catch { return ''; }
  }

  /** Wait until the popup has left about:blank / the redirect hop. */
  async waitForSandbox(): Promise<string> {
    await this.poll(async () => /fiuu|razer|molpay/i.test(this.host()), 90_000, 500);
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    console.log(`DETAIL: Fiuu window opened at ${this.page.url().split('?')[0]}`);
    return this.page.url();
  }

  /** The simulator's own channel name (e.g. MB2U0227) — proves which bank's portal opened (TS E1/H1). */
  channel(): string {
    try { return new URL(this.page.url()).pathname.split('/').filter(Boolean)[0] ?? ''; } catch { return ''; }
  }

  async isCardForm(): Promise<boolean> {
    return (await this.page.locator('input#cardnumber').count()) > 0;
  }

  // ── FPX bank simulator ────────────────────────────────────────────────

  /**
   * B2C popups open on Fiuu's in-between page first
   * (sandbox-payment.fiuu.com/RMS/rms_fpx.php) and only then reach the bank's
   * simulator login. 12153_TS05 (2026-10-23) ran this on the in-between page,
   * saw no login form, skipped, and the RHB login sat untouched (capture
   * _reference/html/fiuu/bank-simulator-rhb-login.html). So: wait for the
   * simulator host AND either its login form or its status list, then sign in.
   */
  async loginToSimulator(): Promise<void> {
    const user = this.page.locator('#username');
    const status = this.page.locator('select#status_code');
    const deadline = Date.now() + 90_000;
    for (;;) {
      if (this.host() === SIMULATOR_HOST
        && ((await user.isVisible().catch(() => false)) || (await status.isVisible().catch(() => false)))) break;
      if (!/fiuu/i.test(this.host()) && (await this.page.locator('input[type=password]:visible').count().catch(() => 0))) {
        throw new Error(`The payment window is a real bank login (${this.host()}), not the Fiuu sandbox — stopping without typing anything.`);
      }
      if (Date.now() > deadline) throw new Error(`The Fiuu bank simulator never showed its login or status page (window at ${this.page.url().split('?')[0]}).`);
      await this.page.waitForTimeout(500);
    }
    if (await status.isVisible().catch(() => false)) {
      console.log(`DETAIL: Fiuu bank simulator already signed in (${this.channel()})`);
      return;
    }
    if (!USERS.fiuu.password) throw new Error('Fiuu sandbox password is blank — type it on the dashboard (Payment section).');
    await this.demoHighlight(user);
    await user.click();
    await user.fill(USERS.fiuu.username);
    await this.page.locator('#password').fill(USERS.fiuu.password);
    const btn = this.page.locator('#login-btn');
    await this.demoHighlight(btn);
    await btn.click();
    // verify-login answers by AJAX: the status page, or a SweetAlert "Wrong username or password".
    const wrong = this.page.getByText(/wrong username or password/i).first();
    await Promise.race([
      status.waitFor({ state: 'visible', timeout: 60_000 }),
      wrong.waitFor({ state: 'visible', timeout: 60_000 }),
    ]).catch(() => undefined);
    if (await wrong.isVisible().catch(() => false)) {
      throw new Error(`The Fiuu simulator refused the login "${USERS.fiuu.username}" — "Wrong username or password". Check the Fiuu login on the dashboard (Payment section).`);
    }
    await status.waitFor({ state: 'visible', timeout: 5_000 });
    console.log(`DETAIL: Signed in to the Fiuu bank simulator (${this.channel()})`);
  }


  /** Choose the status, Request TAC, copy the shown TAC into "Enter TAC", Pay Now. */
  async payFpx(statusCode: string): Promise<string> {
    const status = this.page.locator('select#status_code');
    await status.waitFor({ state: 'visible', timeout: 60_000 });
    await this.demoHighlight(status);
    await status.selectOption(statusCode);
    const statusText = this.clean(await status.locator('option:checked').innerText().catch(() => statusCode));
    console.log(`DETAIL: Payment status chosen: ${statusCode} ${statusText}`);

    const tacBtn = this.page.locator('#tac-btn');
    await this.demoHighlight(tacBtn);
    await tacBtn.click();
    const otp = this.page.locator('#otp');
    if (!(await this.poll(async () => /^\d{4,8}$/.test((await otp.inputValue().catch(() => '')).trim()), 30_000))) {
      throw new Error('Request TAC was clicked but no TAC appeared in the simulator.');
    }
    const tac = (await otp.inputValue()).trim();
    await this.demoHighlight(otp, { color: 'green' });
    const box = this.page.locator('#tac_no');
    await this.demoHighlight(box);
    await box.click();
    await box.fill(tac);
    console.log(`DETAIL: TAC ${tac} copied into "Enter TAC"`);
    await this.captureEvidence(`fiuu-${this.channel()}-${statusCode}`);
    const pay = this.page.locator('#pay-btn');
    await this.demoHighlight(pay);
    await pay.click();
    return `${statusCode} ${statusText}`;
  }

  // ── Card form ─────────────────────────────────────────────────────────

  async payByCard(card: { number: string; expiry: string; cvv: string }, label: string): Promise<void> {
    await this.page.locator('input#cardnumber').waitFor({ state: 'visible', timeout: 60_000 });
    const num = this.page.locator('input#cardnumber');
    const exp = this.page.locator('input#expdate');
    const cvv = this.page.locator('input#cvv-flip');
    for (const [box, value] of [[num, card.number], [exp, card.expiry.replace(/\D/g, '')], [cvv, card.cvv]] as const) {
      await this.demoHighlight(box);
      await box.click();
      await box.press('Control+A').catch(() => undefined);
      await box.press('Backspace').catch(() => undefined);
      await box.pressSequentially(value, { delay: 40 });
    }
    console.log(`DETAIL: ${label} card entered — ending ${card.number.slice(-4)}, expiry ${card.expiry}`);
    const pay = this.page.locator('button#pay-online-btn');
    const payText = this.clean(await pay.innerText().catch(() => 'Pay'));
    await this.demoHighlight(pay);
    await pay.click();
    console.log(`DETAIL: Clicked "${payText}"`);
  }

  /** True when the 3D Secure page ("For testing: use OTP nnnnnn") shows within the timeout. */
  async on3dSecure(timeout = 30_000): Promise<boolean> {
    return this.page.getByText(/use OTP\s*\d{4,8}/i).first().waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false);
  }

  /**
   * 3D Secure page: read "use OTP nnnnnn" off the page, type it, PAY. Returns false when no 3DS page came.
   * `wrongOtp` types that instead (the failed card attempt, 2026-10-26).
   */
  async complete3dSecure(wrongOtp?: string): Promise<boolean> {
    if (!(await this.on3dSecure())) return false;
    const hint = this.page.getByText(/use OTP\s*\d{4,8}/i).first();
    const shown = /use OTP\s*(\d{4,8})/i.exec(await hint.innerText())![1];
    const otp = wrongOtp ?? shown;
    const box = this.page.locator('input:visible').first();
    await this.demoHighlight(box);
    await box.click();
    await box.press('Control+A').catch(() => undefined);
    await box.press('Backspace').catch(() => undefined);
    await box.pressSequentially(otp, { delay: 60 });
    await this.captureEvidence(wrongOtp ? 'fiuu-card-3ds-wrong-otp' : 'fiuu-card-3ds-otp');
    const pay = this.page.getByRole('button', { name: /^\s*PAY\s*$/i }).first();
    await this.demoHighlight(pay);
    await pay.click();
    console.log(wrongOtp
      ? `DETAIL: 3D Secure — wrong OTP ${otp} typed (the page shows ${shown}), PAY clicked`
      : `DETAIL: 3D Secure OTP ${otp} entered (shown on the page), PAY clicked`);
    return true;
  }

  /** Any error the card form shows in place (invalid card). '' when none. */
  async cardError(): Promise<string> {
    const err = this.page.locator('.error:visible, .alert:visible, [class*="error"]:visible, [role="alert"]:visible').first();
    return (await err.count()) ? this.clean(await err.innerText().catch(() => '')) : '';
  }

  async waitForClose(timeout = 60_000): Promise<boolean> {
    if (this.page.isClosed()) return true;
    return this.page.waitForEvent('close', { timeout }).then(() => true).catch(() => false);
  }
}
