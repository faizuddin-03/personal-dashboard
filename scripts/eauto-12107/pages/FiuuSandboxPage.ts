import { Page } from '@playwright/test';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { BasePage } from './BasePage';
import { SiteGatePage } from './SiteGatePage';
import { CONFIG } from '../data/config';

// Fiuu sandbox popup for the e-wallet (GrabPay / ShopeePay) and card rails.
//
// ⚠ ENTIRELY UNCONFIRMED — no capture of this popup exists yet. The only
// Fiuu sandbox page this repo has driven is the FPX bank simulator
// (BankLoginPage + BankTACPage: login "Gaara", `select#status_code`,
// "Request TAC", OTP, "Pay Now"). The TS for 12107 says the GrabPay popup
// has "Set Payment Status = Success / Failed" then "[Pay]", which matches
// the FPX simulator's `#status_code` + pay button shape, so that is the
// first thing tried. Everything on the page is logged on the first run so
// the real selectors can be captured and fixed. Faizuddin to paste the
// popup HTML (standing rule: ask, never invent).

export type SandboxOutcome = 'success' | 'failed';

export class FiuuSandboxPage extends BasePage {
  constructor(popup: Page) {
    super(popup);
  }

  /** Logs what the popup shows — headings, selects, buttons — so the first
   *  live run tells us the real structure. */
  async logPage(): Promise<void> {
    await this.wait(1000);
    const siteGate = new SiteGatePage(this.page);
    await siteGate.passSiteGate(CONFIG.sitePassword);
    const text = this.clean(await this.bodyText());
    console.log(`   📋 Fiuu popup (${this.page.url()}):\n${text.slice(0, 800)}`);
    const selects = this.page.locator('select');
    for (let i = 0; i < await selects.count(); i++) {
      const id = await selects.nth(i).getAttribute('id').catch(() => '');
      const name = await selects.nth(i).getAttribute('name').catch(() => '');
      const opts = await selects.nth(i).locator('option').allTextContents().catch(() => []);
      console.log(`   🔽 select#${id} name="${name}": ${opts.map(o => this.clean(o)).join(' / ')}`);
    }
    const btns = this.page.locator('button, input[type="submit"], input[type="button"]');
    const names: string[] = [];
    for (let i = 0; i < await btns.count(); i++) {
      const t = this.clean(((await btns.nth(i).textContent().catch(() => '')) || (await btns.nth(i).getAttribute('value').catch(() => '')) || ''));
      if (t) names.push(t);
    }
    console.log(`   🔘 buttons: ${names.join(' | ')}`);
  }

  /**
   * Sets the simulated outcome. Tries, in order: a `#status_code`-style
   * select (choose "00" for success, the first non-"00" option for failed);
   * any select whose options mention success/fail; a radio/button labelled
   * Success / Failed. Throws if none exists so the run fails loudly rather
   * than paying with an unknown status.
   */
  async setPaymentStatus(outcome: SandboxOutcome): Promise<string> {
    const wantSuccess = outcome === 'success';

    // GrabPay simulator (live 2026-10-19): "Please set payment status below" is
    // a select with Success / Failed, ids unknown — so any select holding a
    // "Success" option also counts.
    const statusSelect = this.page.locator('select#status_code, select[name*="status" i], select[id*="status" i]')
      .or(this.page.locator('select').filter({ has: this.page.locator('option', { hasText: /success/i }) }))
      .first();
    if ((await statusSelect.count()) > 0) {
      const options = statusSelect.locator('option');
      const n = await options.count();
      let chosen: string | null = null;
      for (let i = 0; i < n; i++) {
        const value = (await options.nth(i).getAttribute('value')) ?? '';
        const text = this.clean((await options.nth(i).textContent()) ?? '');
        const isOk = value === '00' || /success|approved|paid/i.test(text);
        if (wantSuccess ? isOk : (value && !isOk)) { chosen = value; break; }
      }
      if (chosen === null) throw new Error(`No ${outcome} option found in the status select`);
      await this.demoHighlight(statusSelect);
      await statusSelect.selectOption(chosen);
      console.log(`   💳 Payment status set to "${chosen}" (${outcome})`);
      return chosen;
    }

    const choice = this.page.locator('label, button, [role="radio"]').filter({ hasText: wantSuccess ? /success|approve|paid/i : /fail|decline|unsuccess/i }).first();
    if ((await choice.count()) > 0 && (await choice.isVisible().catch(() => false))) {
      const t = this.clean((await choice.innerText().catch(() => '')) || outcome);
      await this.demoHighlight(choice);
      await choice.click();
      console.log(`   💳 Payment status chosen: "${t}"`);
      return t;
    }

    // Live /ia 2026-10-19: the card tile opens Fiuu's real card form (Card
    // Number / Expiry Date / CVV, "Pay MYR …") with no status control.
    if (await this.page.getByText(/Card Number/i).first().isVisible().catch(() => false)) {
      throw new Error('The Fiuu popup is a card entry form (Card Number, Expiry Date, CVV) with no payment status control — a Fiuu sandbox test card is needed to pay; not automated');
    }
    throw new Error('Could not find a payment status control on the Fiuu popup — capture its HTML (see FiuuSandboxPage.ts)');
  }

  /** True when the popup is Fiuu's card form (live /ia, 2026-10-19). */
  async isCardForm(): Promise<boolean> {
    return (await this.page.locator('input#cardnumber').count()) > 0;
  }

  /**
   * Fills Fiuu's card form and clicks "Pay MYR …". Fields from the capture
   * _reference/html/secarang/fiuu-card-form.html: input#cardnumber (tel,
   * spaces added by the page), input#expdate ("MM / YY"), input#cvv-flip,
   * button#pay-online-btn. Typed key by key so the page's own formatting runs.
   */
  async payByCard(card: { number: string; expiry: string; cvv: string }): Promise<void> {
    const num = this.page.locator('input#cardnumber');
    const exp = this.page.locator('input#expdate');
    const cvv = this.page.locator('input#cvv-flip');
    const digits = card.expiry.replace(/\D/g, '');
    for (const [box, value, what] of [[num, card.number, 'card number'], [exp, digits, 'expiry'], [cvv, card.cvv, 'CVV']] as const) {
      await this.demoHighlight(box);
      await box.click();
      await box.pressSequentially(value, { delay: 40 });
      console.log(`   ✏️  ${what} entered`);
    }
    // Test-card values only — logged so a rejected card can be told apart from a typing fault.
    console.log(`   🔎 Card form holds: number "${await num.inputValue()}", expiry "${await exp.inputValue()}", CVV ${(await cvv.inputValue()).length} digit(s)`);
    const pay = this.page.locator('button#pay-online-btn');
    await this.demoHighlight(pay);
    console.log(`   🖱️  Clicking "${this.clean((await pay.innerText().catch(() => '')) || 'Pay')}"`);
    await pay.click();
    await this.complete3dSecure();
  }

  /**
   * Fiuu card simulator, live 2026-10-20 (VISA 4456 5300 0000 1096): after
   * Pay, a "3D Secure Authentication" page asks "Enter One-Time Password
   * (OTP)" and shows "For testing: use OTP 123456", with [PAY] / [CANCEL].
   * The OTP is read from that line (as a tester would) and typed, then [PAY].
   * A rejected card (P10, e.g. 4111 1111 1111 1111) never shows this page.
   */
  private async complete3dSecure(): Promise<void> {
    const hint = this.page.getByText(/use OTP\s*\d{4,8}/i).first();
    if (!(await hint.waitFor({ state: 'visible', timeout: 30_000 }).then(() => true).catch(() => false))) {
      const body = this.clean(await this.page.locator('body').innerText().catch(() => ''));
      console.log(`   ℹ️  No 3D Secure OTP page — popup shows: ${body.slice(0, 200)}`);
      return;
    }
    const otp = /use OTP\s*(\d{4,8})/i.exec(await hint.innerText())![1];
    console.log(`   🔐 3D Secure page — test OTP shown on the page: ${otp}`);
    await this.saveHtml('fiuu-card-3ds-otp');
    const box = this.page.locator('input:visible').first();
    await this.demoHighlight(box);
    await box.click();
    await box.pressSequentially(otp, { delay: 60 });
    await this.captureEvidence('fiuu-card-3ds-otp');
    const pay = this.page.getByRole('button', { name: /^\s*PAY\s*$/i }).first();
    await this.demoHighlight(pay);
    console.log('   🖱️  Clicking "PAY" on the 3D Secure page');
    await pay.click();
  }

  /** Saves the page's HTML next to the evidence (for _reference captures). */
  private async saveHtml(label: string): Promise<void> {
    const dir = process.env.PW_EVIDENCE_DIR;
    if (!dir) return;
    try {
      const fs = await import('node:fs'); const path = await import('node:path');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${label}.html`), await this.page.content());
    } catch { /* best effort */ }
  }

  /**
   * ShopeePay (live /ia, 2026-10-20): the popup only shows "Kindly scan the
   * QR code below to proceed with payment." A tester scans it with a phone and
   * Chrome opens the Fiuu ShopeePay simulator. Here the QR picture
   * (img#qrcode_img) is read with jsQR and its link opened in a new tab of
   * the same browser — the simulator then works like the GrabPay one
   * (select#status_code + "PROCEED TO PAY"). Captures:
   * _reference/html/secarang/fiuu-shopeepay-qr.html / -simulator.html.
   */
  async openQrLink(): Promise<Page> {
    const img = this.page.locator('img#qrcode_img, img.qrcode-img').first();
    await img.waitFor({ state: 'visible', timeout: 30_000 });
    await this.demoHighlight(img);
    const png = PNG.sync.read(await img.screenshot());
    const link = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? '';
    if (!/^https?:\/\//i.test(link)) throw new Error(`The QR code did not decode to a web link (got "${link}")`);
    console.log(`   📷 QR code reads: ${link}`);
    const sim = await this.page.context().newPage();
    await sim.goto(link, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await sim.locator('select#status_code').waitFor({ state: 'visible', timeout: 30_000 });
    console.log(`   🪟  Simulator opened: ${sim.url()}`);
    return sim;
  }

  /** Clicks the pay/submit button on the popup. */
  async clickPay(): Promise<void> {
    for (const re of [/^pay now$/i, /^pay$/i, /pay/i, /submit|confirm|proceed/i]) {
      const btn = this.page.locator('button, input[type="submit"], input[type="button"]').filter({ hasText: re }).first();
      if ((await btn.count()) > 0 && (await btn.isVisible().catch(() => false))) {
        const t = this.clean((await btn.innerText().catch(() => '')) || 'Pay');
        console.log(`   🖱️  Clicking "${t}"`);
        await this.demoHighlight(btn);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click();
        return;
      }
    }
    const byValue = this.page.locator('input[type="submit"][value*="pay" i]').first();
    if ((await byValue.count()) > 0) { await byValue.click(); return; }
    throw new Error('Pay button not found on the Fiuu popup');
  }

  /**
   * 12107_TS09 (SRD REQ-008): the customer cancels on the Fiuu page.
   * [unconfirmed] the sandbox's cancel control — clicks a visible button or
   * link reading Cancel / Back / Close; when there is none, closes the popup
   * window the way a customer would. Returns what it did, for the log.
   */
  async cancel(): Promise<string> {
    const ctl = this.page.locator('button, a, input[type="button"], input[type="submit"]').filter({ hasText: /cancel|back to merchant|close/i }).first();
    if ((await ctl.count()) > 0 && (await ctl.isVisible().catch(() => false))) {
      const t = this.clean((await ctl.innerText().catch(() => '')) || 'Cancel');
      console.log(`   🖱️  Clicking "${t}" on the Fiuu popup`);
      await this.demoHighlight(ctl);
      await ctl.click();
      // The ShopeePay QR page asks "Are you sure? Cancel this payment." with
      // [OK] / [Cancel] (live 2026-10-20). Without [OK] nothing is cancelled.
      const ok = this.page.getByRole('button', { name: /^\s*OK\s*$/ }).first();
      if (await ok.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)) {
        const dialog = this.clean(await this.page.locator('body').innerText().catch(() => ''));
        console.log(`   💬 Confirm shown: ${/Are you sure\?[^.]*\.?\s*[^.]*\./.exec(dialog)?.[0] ?? 'OK / Cancel'}`);
        await this.captureEvidence('fiuu-cancel-confirm');
        console.log('   🖱️  Clicking "OK"');
        await this.demoHighlight(ok);
        await ok.click();
        return `clicked "${t}", then "OK"`;
      }
      return `clicked "${t}"`;
    }
    console.log('   ℹ️  No cancel control on the Fiuu popup — closing the window');
    await this.page.close();
    return 'closed the popup window';
  }

  /** The popup closes on its own once Fiuu redirects Secarang; waits for
   *  that so the main window is the only page left. */
  async waitForClose(): Promise<void> {
    if (!this.page.isClosed()) {
      const closed = await this.page.waitForEvent('close', { timeout: 30_000 }).then(() => true).catch(() => false);
      if (!closed) {
        console.log('   ℹ️  Popup did not close within 30 s — continuing on the main window');
        await this.captureIssue('fiuu-popup-still-open', this.page.locator('body'), 'Fiuu window still open 30 s after Pay');
      }
    }
  }
}
