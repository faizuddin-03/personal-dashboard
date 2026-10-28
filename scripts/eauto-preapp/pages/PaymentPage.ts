import { Page, Download, Locator } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { BANKS, type Leg } from '../data/scenarios';

// The eAuto side of a payment — identical markup on the Pre-Application
// review (Business Info Review) and Application step 5. Captures:
// obs-preonb-review-*.html, obs-application-step5-*.html,
// obs-preonb-summary-paid-sdn-bhd.html, obs-application-payment-success.html.
//
//   tiles  label[for=payment-credit]        "Credit or Debit Card"
//          label[for=payment-fpx-personal]  "Online Banking (Personal)"
//          (an empty "Online Banking (Business)" slot exists in the markup —
//           the B2B tile is NOT rendered on staging, 2026-10-21)
//   banks  #bank-selection-personal > label.bank-card[for=bank-b2c-N] (logo only, no caption)
//   error  Application step 5: #payment-error-message; Pre-Application review:
//          div.unsuccessful-payment-container (no id) — "Unsuccessful Payment …",
//          hidden until a failed payment (12257_TS2, 2026-10-22: only the id was
//          checked, so a failed Pre-Application payment was never seen)
//   pay    Pre-Application #nextSubmitBtn "Submit and Pay" · step 5 #to-submit-and-pay "Submit & Pay"

export type Where = 'preapp' | 'application';
export type Outcome = { kind: 'success' | 'failed' | 'pending' | 'unknown'; text: string };

/**
 * Pages whose "Unsuccessful Payment" box was already showing when Submit was
 * clicked (a retry after a failed attempt). That box is from the earlier
 * attempt, not the result of this one (12257_TS2, 2026-10-22: the retry was
 * Approved and eAuto showed "Pre-Application Submitted for Review", but the run
 * read the old box and reported FAILED).
 */
const staleError = new WeakMap<Page, boolean>();

export class B2BNotAvailable extends Error {}
export class DuitNowNotAvailable extends Error {}

/** Where the DuitNow QR shows: a Fiuu window, or a dialog on the eAuto page. [unconfirmed which] */
export interface QrScreen { window: Page | null; box: Locator }

export class PaymentPage extends BasePage {
  constructor(page: Page) { super(page); }

  /** Click the method tile and, for FPX, the bank tile — what a person clicks (the radios are hidden). */
  async chooseMethod(leg: Leg): Promise<string> {
    // After a failed payment the review page can reload with the declaration
    // unticked and the payment tiles hidden (12257_TS05, 2026-10-23). A person
    // ticks it again before choosing a method.
    const terms = this.page.locator('#agreeTerms');
    if (await terms.isVisible().catch(() => false) && !(await terms.isChecked().catch(() => true))) {
      await this.demoHighlight(terms);
      await terms.check();
      await this.page.locator('#payment-method-section').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined);
      console.log('DETAIL: Declaration ticked again — payment methods shown');
    }
    if (leg.method === 'duitnow-qr') return this.chooseDuitNow();
    if (leg.method === 'fpx-b2b') {
      const tile = this.page.locator('label.payment-method-card', { hasText: /Online Banking \(Business\)/i }).first();
      if (!(await tile.isVisible().catch(() => false))) {
        const offered = (await this.page.locator('label.payment-method-card').allInnerTexts()).map(t => this.clean(t)).join(' | ');
        await this.captureIssue('b2b-tile-missing', this.page.locator('.payment-methods'), 'No "Online Banking (Business)" tile');
        throw new B2BNotAvailable(
          `FPX (B2B) is not offered on this page — tiles shown: ${offered || '(none)'}. ` +
          'The B2B tile is not deployed on staging (checked 2026-10-21); this TS cannot run until it is.',
        );
      }
      // Never captured — assumed to mirror the B2C markup (#bank-selection-business, bank-b2b-N). [unconfirmed]
      await this.demoHighlight(tile);
      await tile.click();
      return this.chooseBank('#bank-selection-business', leg);
    }
    if (leg.method === 'fpx-b2c') {
      const tile = this.page.locator('label[for="payment-fpx-personal"]');
      await this.demoHighlight(tile);
      await tile.click();
      return this.chooseBank('#bank-selection-personal', leg);
    }
    const tile = this.page.locator('label[for="payment-credit"]');
    await this.demoHighlight(tile);
    await tile.click();
    if (!(await this.page.locator('#payment-credit').isChecked())) throw new Error('Clicked the card tile but it is not selected.');
    console.log('DETAIL: Payment method: Credit or Debit Card');
    return 'Credit or Debit Card';
  }

  /**
   * EAINT-12257 TS1 D1: "Select Online Banking (Personal), then select DuitNow QR".
   * Not on staging (2026-10-21), never captured — so DuitNow is looked for both
   * as its own method tile and as a tile in the Personal bank list. [unconfirmed]
   */
  async chooseDuitNow(): Promise<string> {
    const own = this.page.locator('label.payment-method-card', { hasText: /duitnow/i }).first();
    if (await own.isVisible().catch(() => false)) {
      await this.demoHighlight(own);
      await own.click();
      console.log('DETAIL: Payment method: DuitNow QR (its own tile)');
      return 'DuitNow QR';
    }
    const personal = this.page.locator('label[for="payment-fpx-personal"]');
    if (await personal.isVisible().catch(() => false)) {
      await this.demoHighlight(personal);
      await personal.click();
      await this.page.locator('#bank-selection-personal').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined);
      const tile = this.page.locator('#bank-selection-personal label.bank-card')
        .filter({ has: this.page.locator('img[alt*="duitnow" i], img[src*="duitnow" i]') })
        .or(this.page.locator('#bank-selection-personal label.bank-card', { hasText: /duitnow/i }))
        .first();
      if (await tile.isVisible().catch(() => false)) {
        await this.demoHighlight(tile);
        await tile.click();
        console.log('DETAIL: Payment method: Online Banking (Personal) → DuitNow QR');
        return 'DuitNow QR';
      }
    }
    const offered = (await this.page.locator('label.payment-method-card').allInnerTexts()).map(t => this.clean(t)).join(' | ');
    await this.captureIssue('duitnow-tile-missing', this.page.locator('.payment-methods'), 'No DuitNow QR option');
    throw new DuitNowNotAvailable(
      `DuitNow QR is not offered on this page — tiles shown: ${offered || '(none)'}, and no DuitNow tile in the Personal bank list. ` +
      'It is not deployed on staging (checked 2026-10-21); this TS cannot run until it is.',
    );
  }

  /** Submit and Pay for DuitNow: wait for the QR, in a Fiuu window or a dialog on this page. */
  async submitForQr(where: Where): Promise<QrScreen> {
    const btn = this.page.locator(where === 'preapp' ? '#nextSubmitBtn' : '#to-submit-and-pay');
    staleError.set(this.page, !!(await this.paymentError()));
    const popup = this.page.context().waitForEvent('page', { timeout: 90_000 }).catch(() => null);
    await this.demoHighlight(btn);
    await btn.click();
    const dialog = this.page.locator('[role=dialog]:visible, .modal:visible, .ui-dialog:visible').filter({ hasText: /duitnow|scan/i }).first();
    const inPage = dialog.waitFor({ state: 'visible', timeout: 90_000 }).then(() => 'dialog' as const).catch(() => null);
    const got = await Promise.race([popup, inPage]);
    if (!got) throw new Error('"Submit and Pay" showed no DuitNow QR within 90 s (no Fiuu window, no QR dialog).');
    if (got === 'dialog') {
      console.log('DETAIL: DuitNow QR shown in a dialog on the eAuto page');
      return { window: null, box: dialog };
    }
    const win = got as Page;
    await win.waitForLoadState('domcontentloaded').catch(() => undefined);
    await this.growWindow(win);
    console.log(`DETAIL: DuitNow QR shown in a Fiuu window: ${win.url().split('?')[0]}`);
    return { window: win, box: win.locator('body') };
  }

  private async chooseBank(section: string, leg: Leg): Promise<string> {
    if (!leg.bank) throw new Error('FPX leg without a bank.');
    const value = BANKS[leg.bank];
    await this.page.locator(section).waitFor({ state: 'visible', timeout: 15_000 });
    const input = this.page.locator(`${section} input[name="bankSelection"][value="${value}"]`);
    if (!(await input.count())) throw new Error(`${leg.bank} (${value}) is not in the bank list ${section}.`);
    const id = await input.getAttribute('id');
    const card = this.page.locator(`label[for="${id}"]`);
    await this.demoHighlight(card);
    await card.click();
    if (!(await input.isChecked())) throw new Error(`Clicked the ${leg.bank} tile but it is not selected.`);
    const alt = await card.locator('img').getAttribute('alt').catch(() => '');
    console.log(`DETAIL: Bank chosen: ${alt || leg.bank} (${value})`);
    return alt || leg.bank;
  }

  /** "Submit and Pay" / "Submit & Pay". Returns the Fiuu window (a popup, or this tab if it navigated). */
  async submitAndPay(where: Where): Promise<Page> {
    const btn = this.page.locator(where === 'preapp' ? '#nextSubmitBtn' : '#to-submit-and-pay');
    staleError.set(this.page, !!(await this.paymentError()));
    const label = this.clean(await btn.innerText().catch(() => 'Submit and Pay'));
    const host = new URL(this.page.url()).host;
    const popup = this.page.context().waitForEvent('page', { timeout: 90_000 }).catch(() => null);
    const sameTab = this.page
      .waitForURL(u => new URL(u.toString()).host !== host, { timeout: 90_000, waitUntil: 'commit' })
      .then(() => this.page)
      .catch(() => null);
    await this.demoHighlight(btn);
    await btn.click();
    console.log(`DETAIL: Clicked "${label}"`);
    const win = await Promise.race([popup, sameTab]);
    if (!win) {
      const err = await this.paymentError();
      throw new Error(`"${label}" opened no payment window within 90 s${err ? ` — page says: ${err}` : ''}.`);
    }
    await this.growWindow(win);
    return win;
  }

  /** The red "Unsuccessful Payment" block, whichever page it is on (visible one only). */
  errorBox() {
    return this.page.locator('#payment-error-message:visible, .unsuccessful-payment-container:visible').first();
  }

  /** The red "Unsuccessful Payment" block, when shown. */
  async paymentError(): Promise<string> {
    const box = this.errorBox();
    if (!(await box.isVisible().catch(() => false))) return '';
    // The box can vanish between the two reads (a retry that succeeds clears it:
    // 12257_TS05, 2026-10-27 waited 30 s on a gone box and crashed a paid run).
    return this.clean(await box.innerText({ timeout: 2_000 }).catch(() => ''));
  }

  /**
   * eAuto opens Fiuu at width=800,height=600, which cuts off the QR and bank pages.
   * Make the window as tall as the screen; best effort, never fails the run.
   */
  private async growWindow(win: Page): Promise<void> {
    if (win === this.page) return;
    try {
      const cdp = await win.context().newCDPSession(win);
      // Let the page follow the real window size instead of the 1920x1080 emulation.
      await cdp.send('Emulation.clearDeviceMetricsOverride');
      const { windowId, bounds: start } = await cdp.send('Browser.getWindowForTarget');
      // screen.availHeight reported the window's 600 (12257_TS05, 2026-10-27), so
      // maximise once to learn the real screen height, then go back to 800 wide.
      await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'maximized' } });
      await win.waitForTimeout(500);
      const { bounds: full } = await cdp.send('Browser.getWindowBounds', { windowId });
      const height = full.height ?? 0;
      await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'normal' } });
      await cdp.send('Browser.setWindowBounds', { windowId, bounds: { left: start.left, width: start.width, top: full.top ?? 0, height } });
      await cdp.detach();
      console.log(`DETAIL: Payment window made ${height}px tall`);
    } catch (e) {
      console.log(`DETAIL: Could not resize the payment window (${(e as Error).message.split('\n')[0]})`);
    }
  }

  /** Wait for the eAuto page to settle on a result after the Fiuu window hands back. */
  async waitForOutcome(where: Where, timeout = CONFIG.paymentOutcomeTimeout): Promise<Outcome> {
    const deadline = Date.now() + timeout;
    // A box left over from the previous attempt is ignored until it has gone
    // (hidden, or the page navigated); after that, a box means this attempt failed.
    let stale = staleError.get(this.page) ?? false;
    const startUrl = this.page.url();
    let lastErr = '';
    while (Date.now() < deadline) {
      if (this.page.isClosed()) return { kind: 'unknown', text: 'main window closed' };
      const body = this.clean(await this.page.locator('body').innerText().catch(() => ''));
      if (where === 'preapp' && /Pre-Application Submitted for Review/i.test(body)) return this.settled({ kind: 'success', text: 'Pre-Application Submitted for Review' });
      if (where === 'application' && (await this.page.locator('#payment-success').isVisible().catch(() => false))) {
        return this.settled({ kind: 'success', text: 'Application Payment Success' });
      }
      if (/Payment is Pending Approval/i.test(body)) return this.settled({ kind: 'pending', text: 'Payment is Pending Approval' });
      const err = await this.paymentError();
      if (stale && (!err || this.page.url() !== startUrl)) stale = false;
      if (err && !stale) return this.settled({ kind: 'failed', text: err });
      lastErr = err;
      await this.page.waitForTimeout(1_000);
    }
    if (stale && lastErr) {
      return this.settled({ kind: 'failed', text: `${lastErr} (the message from the earlier attempt never cleared — no new result in ${Math.round(timeout / 1000)} s)` });
    }
    return this.settled({ kind: 'unknown', text: `no result after ${Math.round(timeout / 1000)} s at ${this.page.url().split('?')[0]}` });
  }

  /** The result is read: the next Submit decides afresh whether a box is left over. */
  private settled(o: Outcome): Outcome {
    staleError.delete(this.page);
    return o;
  }


  /** "Payment Details" block as label → value (Payment ID, Method, Status, …). */
  async paymentDetails(): Promise<Record<string, string>> {
    const body = this.clean(await this.page.locator('body').innerText());
    const out: Record<string, string> = {};
    const labels = ['Pre-Application No', 'Payment ID', 'Payment Method', 'Payment Date Time', 'Payment Status', 'Business Registered Name', 'Pre-Application Fee'];
    for (const l of labels) {
      const m = new RegExp(`${l.replace(/[()]/g, '\\$&')}:\\s*(.+?)(?=\\s+(?:${labels.join('|')}|Payment Document|Admin In Charge|SSM Document|Showroom|Business Type|Tax Identification)\\b|$)`).exec(body);
      if (m) out[l] = m[1].trim();
    }
    return out;
  }

  /**
   * Click a download button and keep the file as evidence. Handles a direct
   * download and a new tab that shows the PDF (fetched with the tab's own
   * session). Returns the saved path, or '' when nothing came.
   */
  async downloadFrom(button: string | ReturnType<Page['locator']>, label: string): Promise<string> {
    const btn = typeof button === 'string' ? this.page.locator(button).first() : button.first();
    if (!(await btn.isVisible().catch(() => false))) return '';
    const dl = this.page.waitForEvent('download', { timeout: 60_000 }).catch(() => null);
    const tab = this.page.context().waitForEvent('page', { timeout: 60_000 }).catch(() => null);
    await this.demoHighlight(btn);
    await btn.click();
    const got = await Promise.race([dl, tab]);
    const dir = process.env.PW_EVIDENCE_DIR || path.join(__dirname, '..', 'test-results', 'downloads');
    fs.mkdirSync(dir, { recursive: true });
    if (got && 'saveAs' in got) {
      const d = got as Download;
      const file = path.join(dir, `${label}${path.extname(d.suggestedFilename()) || '.pdf'}`);
      await d.saveAs(file);
      console.log(`DETAIL: Downloaded ${d.suggestedFilename()} → ${path.basename(file)}`);
      return file;
    }
    if (got) {
      const p = got as Page;
      await p.waitForLoadState('domcontentloaded').catch(() => undefined);
      const res = await p.request.get(p.url()).catch(() => null);
      const file = path.join(dir, `${label}.pdf`);
      if (res && res.ok()) fs.writeFileSync(file, await res.body());
      await p.close().catch(() => undefined);
      if (fs.existsSync(file)) { console.log(`DETAIL: Opened in a new tab and saved → ${path.basename(file)}`); return file; }
    }
    return '';
  }
}
