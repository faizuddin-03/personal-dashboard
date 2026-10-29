import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// The "phone" side of DuitNow QR: Fiuu's public simulator page that the TS says
// to "Open on phone". Capture: _reference/html/fiuu/duitnow-viewqr.html
// (2026-10-21). It is an html5-qrcode scanner:
//   #launchScannerButton "Launch Scanner" → scanner UI in #reader, which offers
//   "Scan an Image File" (#html5-qrcode-anchor-scan-type-change) and
//   "Choose Image" (#html5-qrcode-button-file-selection) besides the camera.
//   A read QR opens #paymentModal: amount in #amountDisplay ("MYR 108.00",
//   EMVCo tag 54), buttons Approve (.approve-button, userChoice 1) /
//   Reject (.reject-button, userChoice 2) → POST /duitnow/process-qr-data.
// Instead of a phone camera, the QR picture taken from the eAuto screen is
// given to "Choose Image" — the scanner's own image option.

export const VIEWQR_URL = 'https://bank-simulator.fiuu.com/duitnow/viewqr';

export class FiuuDuitNowPage extends BasePage {
  constructor(page: Page) { super(page); }

  async open(): Promise<void> {
    await this.page.goto(VIEWQR_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await this.page.locator('#launchScannerButton').waitFor({ state: 'visible', timeout: 30_000 });
    console.log('DETAIL: Opened the Fiuu DuitNow scanner page (viewqr)');
  }

  /** Launch Scanner → Scan an Image File → Choose Image → the QR picture. Returns the amount shown. */
  async scanImage(file: string): Promise<string> {
    const launch = this.page.locator('#launchScannerButton');
    await this.demoHighlight(launch);
    await launch.click();
    const imageMode = this.page.locator('#html5-qrcode-anchor-scan-type-change');
    await imageMode.waitFor({ state: 'visible', timeout: 30_000 });
    // The link toggles camera ↔ image; only switch when it offers the image mode.
    if (/image/i.test(await imageMode.innerText())) {
      await this.demoHighlight(imageMode);
      await imageMode.click();
    }
    const choose = this.page.locator('#html5-qrcode-button-file-selection');
    await choose.waitFor({ state: 'visible', timeout: 15_000 });
    await this.demoHighlight(choose);
    const [chooser] = await Promise.all([this.page.waitForEvent('filechooser', { timeout: 15_000 }), choose.click()]);
    await chooser.setFiles(file);
    const modal = this.page.locator('#paymentModal');
    await modal.waitFor({ state: 'visible', timeout: 30_000 }).catch(async () => {
      const said = this.clean(await this.page.locator('#reader').innerText().catch(() => ''));
      throw new Error(`The scanner did not read the QR picture${said ? ` — it says: ${said.slice(0, 160)}` : ''}.`);
    });
    const amount = this.clean(await this.page.locator('#amountDisplay').innerText());
    await this.demoHighlight(this.page.locator('#amountDisplay'), { color: 'green' });
    await this.captureEvidence('duitnow-viewqr-scanned');
    console.log(`DETAIL: QR read on the Fiuu scanner — amount ${amount}`);
    return amount;
  }

  /** Approve (TS "Payment = Success") or Reject (TS "Payment = Rejected"). */
  async decide(approve: boolean): Promise<string> {
    const btn = this.page.locator(approve ? '.approve-button' : '.reject-button');
    await this.demoHighlight(btn);
    await Promise.all([
      this.page.waitForURL(/process-qr-data/, { timeout: 60_000 }).catch(() => undefined),
      btn.click(),
    ]);
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    const said = this.clean(await this.page.locator('body').innerText().catch(() => '')).slice(0, 200);
    await this.captureEvidence(`duitnow-viewqr-${approve ? 'approved' : 'rejected'}`);
    console.log(`DETAIL: Clicked ${approve ? 'Approve' : 'Reject'} — the scanner page says: ${said || '(nothing)'}`);
    return said;
  }

  /** The submit's HTML, kept for _reference (the result page is not captured yet). */
  async html(): Promise<string> { return this.page.content().catch(() => ''); }
}
