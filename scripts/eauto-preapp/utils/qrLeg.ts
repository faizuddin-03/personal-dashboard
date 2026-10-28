import { Page, test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PaymentPage, type Where, type Outcome, type QrScreen } from '../pages/PaymentPage';
import { QR_VALIDITY_MS, UNSUCCESSFUL_PAYMENT, type Leg } from '../data/scenarios';
import { CONFIG } from '../data/config';
import { FiuuDuitNowPage, VIEWQR_URL } from '../pages/FiuuDuitNowPage';
import * as os from 'node:os';

// EAINT-12257 DuitNow QR leg (TS columns D/E or G/H, TS1–TS5).
//
// The outcome is set on the "phone": the Fiuu page
// https://bank-simulator.fiuu.com/duitnow/viewqr (official TS v19, every QR row).
// The run opens that page in its own tab, gives the QR picture to the
// scanner's "Choose Image" option and clicks Approve / Reject
// (pages/FiuuDuitNowPage.ts; Faizuddin 2026-10-21: "try scan the QR yourself").
// If that fails, it falls back to a person scanning with a real phone.
// Timer end, Cancel and closing the QR window all leave the payment Failed with
// the existing "Unsuccessful Payment" message (Faiz's Note rows 19–23).
//
// Nothing of the DuitNow screen has been captured — it is not on staging
// (2026-10-21). The QR screen's HTML is saved to the evidence folder on the
// first run so the selectors can be confirmed.

const VIEWQR = VIEWQR_URL;

/** The QR picture on the eAuto/Fiuu screen: the largest visible img/canvas. */
async function qrPicture(qr: QrScreen, label: string): Promise<string> {
  const items = qr.box.locator('img:visible, canvas:visible');
  let best = -1, area = 0;
  for (let i = 0; i < await items.count(); i++) {
    const b = await items.nth(i).boundingBox();
    if (b && b.width * b.height > area) { area = b.width * b.height; best = i; }
  }
  if (best < 0) throw new Error('No QR picture found on the QR screen.');
  const dir = process.env.PW_EVIDENCE_DIR || os.tmpdir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${label}-qr-code.png`);
  await items.nth(best).screenshot({ path: file });
  return file;
}

function banner(lines: string[]): void {
  const width = Math.max(...lines.map(l => l.length)) + 4;
  console.log(`\n${'='.repeat(width)}\n${lines.map(l => `  ${l}`).join('\n')}\n${'='.repeat(width)}\n`);
}

async function saveQrHtml(qr: QrScreen, label: string): Promise<void> {
  const dir = process.env.PW_EVIDENCE_DIR;
  if (!dir) return;
  try {
    const html = qr.window ? await qr.window.content() : await qr.box.evaluate(e => e.outerHTML);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${label}-duitnow-qr.html`), html);
  } catch { /* best effort */ }
}

async function timerText(qr: QrScreen): Promise<string> {
  const t = await qr.box.innerText().catch(() => '');
  return /Scan QR in\s*\d{1,2}:\d{2}/i.exec(t)?.[0] ?? '';
}

type Ending = 'scan-success' | 'scan-rejected' | 'cancel' | 'close' | 'timer';

/**
 * Cancel Transaction and closing the QR window follow the existing behaviour:
 * no "Unsuccessful Payment" message (Faizuddin, 2026-10-26; EAINT-12625 closed).
 * Same as scripts/eauto-12257/utils/qrLeg.ts.
 */
const NO_MESSAGE: Ending[] = ['cancel', 'close'];

/** After Cancel / close: wait until eAuto is back on the payment page, then read it. */
async function waitForReturn(page: Page, qr: QrScreen): Promise<Outcome> {
  const pay = new PaymentPage(page);
  if (qr.window && !qr.window.isClosed()) await qr.window.waitForEvent('close', { timeout: 30_000 }).catch(() => undefined);
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline && /pending-approval/i.test(page.url())) await page.waitForTimeout(1_000);
  await page.waitForLoadState('load').catch(() => undefined);
  const settle = Date.now() + 10_000;
  while (Date.now() < settle) {
    if (page.isClosed()) return { kind: 'unknown', text: 'main window closed' };
    const err = await pay.paymentError();
    if (err) return { kind: 'failed', text: err };
    await page.waitForTimeout(1_000);
  }
  return { kind: 'unknown', text: `back on ${page.url().split('?')[0]} with no Unsuccessful Payment message` };
}

async function attempt(page: Page, where: Where, leg: Leg, ending: Ending, n: number, label: string): Promise<Outcome> {
  const pay = new PaymentPage(page);
  await test.step(`DuitNow QR attempt ${n}: select DuitNow QR`, () => pay.chooseMethod(leg));
  const qr = await test.step('Click "Submit and Pay" — the DuitNow QR code is displayed', async () => {
    const screen = await pay.submitForQr(where);
    const img = screen.box.locator('img, canvas').first();
    await pay.demoHighlight(img, { color: 'green' });
    expect.soft(await img.isVisible().catch(() => false), 'TS E1/H1: the Fiuu sandbox displays the DuitNow QR code').toBe(true);
    console.log(`DETAIL: QR screen text: ${(await screen.box.innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 200)}`);
    await saveQrHtml(screen, `${label}-${n}`);
    if (screen.window) await new PaymentPage(screen.window).captureEvidence(`${label}-${n}-duitnow-qr`);
    else await pay.captureEvidence(`${label}-${n}-duitnow-qr`);
    return screen;
  });

  await test.step(ending === 'scan-success' ? `Scan the QR on the ${leg.phone} phone with Payment = Success (a person)`
    : ending === 'scan-rejected' ? `Scan the QR on the ${leg.phone} phone with Payment = Rejected (a person)`
    : ending === 'cancel' ? 'Click the Cancel Transaction button'
    : ending === 'close' ? 'Close the QR Code window'
    : 'Wait until the timer expires', async () => {
    if (ending === 'scan-success' || ending === 'scan-rejected') {
      const want = ending === 'scan-success' ? 'Success' : 'Rejected';
      try {
        const picture = await qrPicture(qr, `${label}-${n}`);
        const phone = new FiuuDuitNowPage(await page.context().newPage());
        await phone.open();
        const amount = await phone.scanImage(picture);
        const fee = where === 'preapp' ? CONFIG.preAppFee : CONFIG.registrationFee;
        expect.soft(amount.replace(/,/g, ''), `The QR carries the fee RM ${fee}`).toContain(Number(fee).toFixed(2));
        await phone.decide(want === 'Success');
        const dir = process.env.PW_EVIDENCE_DIR;
        if (dir) fs.writeFileSync(path.join(dir, `${label}-${n}-viewqr-result.html`), await phone.html());
        return;
      } catch (e) {
        console.log(`DETAIL: Scanning by the Fiuu page failed (${(e as Error).message}) — falling back to a person with a phone`);
      }
      banner([
        'ACTION NEEDED — SCAN THE DUITNOW QR NOW',
        `1. On the ${leg.phone ?? 'phone'}, open ${VIEWQR}`,
        `2. Choose Payment = ${want}`,
        '3. Scan the QR code shown in the browser window',
        `You have ${Math.round(QR_VALIDITY_MS / 60_000)} minutes (the QR timer).`,
      ]);
      console.log(`DETAIL: Waiting for a person to scan with Payment = ${want} (${await timerText(qr) || 'timer not read'})`);
      return;
    }
    if (ending === 'cancel') {
      const cancel = qr.box.getByRole('button', { name: /cancel/i }).or(qr.box.locator('a, button', { hasText: /cancel/i })).first();
      await pay.demoHighlight(cancel);
      await cancel.click();
      const ok = (qr.window ?? page).getByRole('button', { name: /^\s*(ok|yes)\s*$/i }).first();
      if (await ok.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false)) {
        console.log('DETAIL: Cancel asked for confirmation — clicked OK');
        await ok.click();
      }
      return;
    }
    if (ending === 'close') {
      if (qr.window) {
        // A person closes the window with its own close control.
        await qr.window.close();
        console.log('DETAIL: QR window closed');
      } else {
        const x = qr.box.locator('[aria-label*="close" i], .close, button:has-text("×"), .ui-dialog-titlebar-close').first();
        await pay.demoHighlight(x);
        await x.click();
        console.log('DETAIL: QR dialog closed');
      }
      return;
    }
    console.log(`DETAIL: Not scanning — waiting for the QR timer to run out (${await timerText(qr) || 'timer not read'})`);
  });

  // Timer expiry: keep the QR window (and its countdown) in front while waiting
  // (Faizuddin, 2026-10-27).
  if (ending === 'timer' && qr.window && !qr.window.isClosed()) await qr.window.bringToFront().catch(() => undefined);
  const budget = ending === 'timer' || ending.startsWith('scan') ? QR_VALIDITY_MS + 90_000 : 120_000;
  // When the QR window closes, show the eAuto tab — the one being waited on — not the scanner tab.
  if (qr.window && !qr.window.isClosed()) qr.window.once('close', () => { void page.bringToFront().catch(() => undefined); });
  else await page.bringToFront().catch(() => undefined);
  const outcome = NO_MESSAGE.includes(ending)
    ? await test.step('Wait for eAuto to return to the payment page', () => waitForReturn(page, qr))
    : await test.step('Wait for eAuto to show the result', () => pay.waitForOutcome(where, budget));
  console.log(`DETAIL: eAuto shows: ${outcome.kind.toUpperCase()} — ${outcome.text}`);
  if (qr.window && !qr.window.isClosed()) await qr.window.waitForEvent('close', { timeout: 30_000 }).catch(() => undefined);
  return outcome;
}

const FIRST_ENDING: Record<string, Ending> = {
  'qr-rejected-then-success': 'scan-rejected',
  'qr-cancel-then-success': 'cancel',
  'qr-close-then-success': 'close',
  'qr-timer-then-success': 'timer',
};

/**
 * Run the QR leg up to a successful payment. `onFailed` is the TS step
 * "Check the transaction payment status in BO" (D5 / D4), run between the
 * failed attempt and the retry.
 */
export async function runQrLeg(page: Page, where: Where, leg: Leg, label: string, onFailed?: () => Promise<void>): Promise<Outcome> {
  let n = 0;
  const first = FIRST_ENDING[leg.outcome];
  if (first) {
    const failed = await attempt(page, where, leg, first, ++n, label);
    if (NO_MESSAGE.includes(first)) {
      // Rule changed 2026-10-27 (Faizuddin): Cancel and closing the QR window both show
      // "Unsuccessful Payment" — that is a pass. The no-message / unticked-declaration
      // checks of 2026-10-26 are dropped.
      await test.step('Observe the error message', async () => {
        const pay = new PaymentPage(page);
        console.log(`DETAIL: eAuto shows: ${failed.text}`);
        expect.soft(failed.kind, `TS: Unsuccessful Payment message after Cancel / closing the QR window (saw: ${failed.text})`).toBe('failed');
        if (failed.kind === 'failed') await pay.demoHighlight(pay.errorBox(), { color: 'green' });
        else console.log(`DETAIL: FAIL — "Unsuccessful Payment" message not shown (${failed.text}); carrying on with the next step`);
        expect.soft(failed.text).toContain(UNSUCCESSFUL_PAYMENT.heading);
        expect.soft(failed.text.replace(/[’']/g, "'")).toContain(UNSUCCESSFUL_PAYMENT.body.replace(/[’']/g, "'"));
        await pay.captureEvidence(`${label}-unsuccessful-payment`);
      });
      // No BO payment status check for these rows (Faizuddin, 2026-10-26).
      return attempt(page, where, { ...leg, outcome: 'success' }, 'scan-success', ++n, label);
    }
    await test.step('Observe the error message', async () => {
      const pay = new PaymentPage(page);
      // A missing message is a failed check, not a stop: the run carries on with the
      // next TS step (Faizuddin, 2026-10-23, after 12257_TS03/TS05 stopped here).
      expect.soft(failed.kind, `TS: the payment fails with the existing message (saw: ${failed.text})`).toBe('failed');
      if (failed.kind === 'failed') await pay.demoHighlight(pay.errorBox(), { color: 'green' });
      else console.log(`DETAIL: FAIL — "Unsuccessful Payment" message not shown (${failed.text}); carrying on with the next step`);
      expect.soft(failed.text).toContain(UNSUCCESSFUL_PAYMENT.heading);
      expect.soft(failed.text.replace(/[’']/g, "'")).toContain(UNSUCCESSFUL_PAYMENT.body.replace(/[’']/g, "'"));
      await pay.captureEvidence(`${label}-unsuccessful-payment`);
    });
    if (onFailed) await onFailed();
  }
  return attempt(page, where, { ...leg, outcome: 'success' }, 'scan-success', ++n, label);
}
