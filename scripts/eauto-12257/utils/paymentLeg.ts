import { Page, test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { PaymentPage, type Where, type Outcome } from '../pages/PaymentPage';
import { FiuuPage, FPX_STATUS } from '../pages/FiuuPage';
import { CARDS, CONFIG } from '../data/config';
import { UNSUCCESSFUL_PAYMENT, type Leg } from '../data/scenarios';

/** Typed on the 3D Secure page to fail a card payment (confirmed by Faizuddin, 2026-10-26). */
const WRONG_OTP = '000000';
import { runQrLeg } from './qrLeg';
import { focus } from './focusTimeline';
import { b2bChecker } from './b2bChecker';

// One payment leg (TS columns D/E or G/H): choose the method, Submit and Pay,
// drive the Fiuu window, check the eAuto result; for "Failed" legs, check the
// Unsuccessful Payment message and pay again.

const legName = (w: Where) => (w === 'preapp' ? 'Pre-Application' : 'Application');

async function attempt(page: Page, where: Where, leg: Leg, fail: boolean, n: number): Promise<Outcome> {
  const pay = new PaymentPage(page);
  const what = leg.method.startsWith('card') ? `${leg.card} card` : leg.bank!;
  await test.step(`${legName(where)} payment, attempt ${n}: choose ${leg.method === 'fpx-b2b' ? 'Online Banking (Business)' : leg.method === 'fpx-b2c' ? 'Online Banking (Personal)' : 'Credit or Debit Card'}${leg.bank ? ` and ${leg.bank}` : ''}`, async () => {
    await pay.chooseMethod(leg);
  });
  const win = await test.step(`Click "Submit and Pay"`, async () => pay.submitAndPay(where));
  const fiuu = new FiuuPage(win);
  let orderId = '';
  let decideCode: string | undefined;

  return test.step(`Complete the ${what} payment on the Fiuu sandbox — ${fail ? 'FAILED status' : 'success'}`, async () => {
    await fiuu.waitForSandbox();
    if (await fiuu.isCardForm()) {
      if (fail) {
        // The valid Mastercard, failed with a wrong OTP on the 3D Secure page —
        // the confirmed way to simulate a failed card payment (Faizuddin, 2026-10-26).
        const what = 'wrong OTP';
        await fiuu.payByCard(CARDS.invalid, 'Failing (wrong OTP)');
        if (!(await fiuu.complete3dSecure(WRONG_OTP))) {
          console.log('DETAIL: No 3D Secure page came — the wrong OTP could not be typed');
        }
        const closed = await fiuu.waitForClose(45_000);
        if (!closed) {
          const err = await fiuu.cardError();
          console.log(`DETAIL: Fiuu kept its window open after the ${what} — error shown: "${err || '(none visible)'}" at ${win.url()}`);
          await fiuu.captureEvidence(`${where}-card-invalid-error`);
          expect.soft(closed, 'TS: a failed card payment returns to eAuto with "Unsuccessful Payment" — Fiuu kept its own form open instead').toBe(true);
          return { kind: 'failed', text: `Fiuu card form error: ${err || '(none)'}` } as Outcome;
        }
      } else {
        await fiuu.payByCard(leg.method === 'card-debit' ? CARDS.debit : CARDS.credit, leg.method === 'card-debit' ? 'Debit' : 'Credit');
        await fiuu.complete3dSecure();
      }
    } else if (leg.method === 'fpx-b2b') {
      // No login, no status list: Authorize (→ pending, checker approves later) or Reject (failed).
      orderId = await fiuu.b2bMaker(!fail);
      if (!fail) decideCode = (await fiuu.b2bAuthorized())?.decideCode;
    } else {
      await fiuu.loginToSimulator();
      console.log(`DETAIL: Sandbox portal opened: ${fiuu.channel()} (TS: the ${leg.bank} sandbox portal)`);
      const code = fail ? FPX_STATUS.failed : leg.outcome.includes('authorise') ? FPX_STATUS.pendingB2B : FPX_STATUS.approved;
      await fiuu.payFpx(code);
    }
    await fiuu.waitForClose(90_000);
    focus(page);
    const outcome = await pay.waitForOutcome(where);
    console.log(`DETAIL: eAuto shows: ${outcome.kind.toUpperCase()} — ${outcome.text}`);
    return orderId ? { ...outcome, orderId, decideCode } : outcome;
  });
}

/** Runs after a failed attempt; a returned Page replaces the current one for the retry. */
export type OnFailed = () => Promise<Page | void>;

/** `page` is the tab the leg ended on — a B2B revisit closes the original tab. */
export interface LegResult { details: Record<string, string>; invoice: string; attempts: number; page: Page }

/**
 * `onFailed` runs between the failed attempt and the retry (12257 TS2–TS5 and the
 * payment-retry TS: check BO, or reopen the link in a new browser). When it
 * returns a Page, the retry continues on that page.
 * `onPending` runs while the payment sits on "Payment is Pending Approval"
 * (12153 TS3: BO Registration Fee = Pending UCD).
 */
export async function runPaymentLeg(page: Page, where: Where, leg: Leg, label: string, onFailed?: OnFailed, onPending?: () => Promise<void>): Promise<LegResult> {
  let pay = new PaymentPage(page);
  let attempts = 0;
  let outcome: Outcome = { kind: 'unknown', text: '' };

  if (leg.method === 'duitnow-qr') {
    ({ outcome, page } = await runQrLeg(page, where, leg, label, onFailed));
    pay = new PaymentPage(page);
  } else {
  if (leg.outcome === 'failed-then-success' || leg.outcome === 'failed-then-authorise') {
    const first = await attempt(page, where, leg, true, ++attempts);
    await test.step(`Check the "Unsuccessful Payment" message on ${where === 'preapp' ? 'Business Info Review' : 'Application page 5'}`, async () => {
      if (first.text.startsWith('Fiuu card form error')) {
        // Redo inside the same Fiuu window — the eAuto page never received the failure.
        return;
      }
      // A missing message is a failed check, not a stop: the run carries on with the
      // next TS step (Faizuddin, 2026-10-23, after 12257_TS03/TS05 stopped here).
      expect.soft(first.kind, `After a failed payment eAuto should show Unsuccessful Payment (saw: ${first.text})`).toBe('failed');
      if (first.kind === 'failed') await pay.demoHighlight(new PaymentPage(page).errorBox(), { color: 'green' });
      else console.log(`DETAIL: FAIL — "Unsuccessful Payment" message not shown (${first.text}); carrying on with the next step`);
      expect.soft(first.text).toContain(UNSUCCESSFUL_PAYMENT.heading);
      expect.soft(first.text.replace(/[’']/g, "'")).toContain(UNSUCCESSFUL_PAYMENT.body.replace(/[’']/g, "'"));
      await pay.captureEvidence(`${label}-unsuccessful-payment`);
    });
    if (first.text.startsWith('Fiuu card form error')) {
      // Same window, valid card this time.
      const win = page.context().pages().find(p => p !== page && /fiuu|razer|molpay/i.test(p.url()));
      if (win) {
        const fiuu = new FiuuPage(win);
        await test.step('Redo the payment with a valid card in the same Fiuu window', async () => {
          // Still on 3D Secure (wrong CVV/expiry accepted, or wrong OTP kept the page): the right OTP.
          if (!(await fiuu.on3dSecure(5_000))) await fiuu.payByCard(leg.method === 'card-debit' ? CARDS.debit : CARDS.credit, 'Valid');
          await fiuu.complete3dSecure();
          await fiuu.waitForClose(90_000);
        });
        attempts++;
      }
    } else if (onFailed) {
      const next = await onFailed();
      if (next) { page = next; pay = new PaymentPage(page); }
    }
  }

  if (attempts < 2) outcome = await attempt(page, where, leg, false, ++attempts);
  else outcome = await pay.waitForOutcome(where);
  }

  if (outcome.kind === 'pending') {
    // TS3 / TS4 (B2B). Staging shows the page in the system itself — the
    // "email link" in the TS is production behaviour (Faizuddin, 2026-10-21).
    await test.step('Check the "Payment is Pending Approval" page', async () => {
      const head = page.getByText('Payment is Pending Approval').first();
      await pay.demoHighlight(head, { color: 'green' });
      await pay.captureEvidence(`${label}-pending-approval`);
      const body = await page.locator('body').innerText();
      expect.soft(body, 'Payment Status = Pending Approval').toMatch(/Payment Status:?\s*Pending Approval/i);
    });
    if (onPending) await onPending();
    if (leg.outcome === 'pending-then-authorise') page = await test.step('Close the tab and reopen the page (revisit while pending)', async () => {
      const url = page.url();
      const fresh = await page.context().newPage();
      await page.close();
      await fresh.goto(url, { waitUntil: 'commit', timeout: CONFIG.navigationTimeout });
      await fresh.getByText('Payment is Pending Approval').first().waitFor({ state: 'visible', timeout: 60_000 });
      console.log(`DETAIL: Reopened ${url.split('?')[0]} — still on "Payment is Pending Approval"`);
      return fresh;
    });
    pay = new PaymentPage(page);
    await pay.captureEvidence(`${label}-pending-approval-revisit`);
    const orderId = outcome.orderId;
    if (!orderId) throw new Error('The payment is Pending Approval but no FPX B2B Order ID was read from the Fiuu page.');
    await test.step(`Checker: open the FPX B2B pending page, search Order ID ${orderId} and approve`, () => b2bChecker(page, orderId, label, outcome.decideCode));
    await test.step('Refresh the eAuto page', async () => {
      await page.reload({ waitUntil: 'commit' });
      outcome = await pay.waitForOutcome(where);
    });
  }

  await test.step(`Check the ${legName(where)} payment succeeded`, async () => {
    expect(outcome.kind, `Payment result: ${outcome.text}`).toBe('success');
    const ok = where === 'preapp' ? page.getByText('Pre-Application Submitted for Review').first() : page.locator('#payment-success');
    await pay.demoHighlight(ok, { color: 'green' });
    await pay.captureEvidence(`${label}-payment-success`);
  });

  const details = await test.step('Read the Payment Details', async () => {
    const d = await pay.paymentDetails();
    console.log(`DETAIL: Payment Details — ${Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(' · ')}`);
    expect.soft(d['Payment Status'] ?? '', 'Payment Status').toMatch(/paid/i);
    return d;
  });

  const invoice = await test.step('Download the invoice and e-Invoice', async () => {
    const inv = await pay.downloadFrom(page.locator('button.btn-download[onclick*="downloadInvoice"], button:has-text("Invoice")'), `${label}-invoice`);
    expect.soft(inv, 'Invoice download').not.toBe('');
    if (inv && inv.endsWith('.pdf')) {
      const pdf = (await import('pdf-parse')).default;
      // 12257_TS05, 2026-10-27: the Pre-App invoice failed with "bad XRef entry" on
      // every read inside the test, yet the same file reads fine in a fresh Node
      // process. So: try here once, then read it in a separate process.
      let text = '';
      try { text = (await pdf(fs.readFileSync(inv))).text.replace(/\s+/g, ' '); }
      catch (e) {
        console.log(`DETAIL: Could not read the invoice PDF in the test (${(e as Error).message}) — reading it in a separate process`);
        try {
          const js = `require(${JSON.stringify(require.resolve('pdf-parse'))})(require('fs').readFileSync(process.argv[1])).then(r => process.stdout.write(r.text))`;
          text = execFileSync(process.execPath, ['-e', js, inv], { encoding: 'utf8', timeout: 30_000 }).replace(/\s+/g, ' ');
        } catch (e2) { console.log(`DETAIL: Could not read the invoice PDF in a separate process either: ${(e2 as Error).message.split('\n')[0]}`); }
      }
      expect.soft(text, 'Invoice PDF can be read').not.toBe('');
      const fee = where === 'preapp' ? CONFIG.preAppFee : CONFIG.registrationFee;
      const feeShown = Number(fee).toLocaleString('en-MY', { minimumFractionDigits: 2 });
      console.log(`DETAIL: Invoice text (first 300): ${text.slice(0, 300)}`);
      expect.soft(text.includes(fee) || text.includes(feeShown), `Invoice shows RM ${feeShown}`).toBe(true);
    }
    const eInv = page.locator('button:has-text("e-Invoice"), a:has-text("e-Invoice")').first();
    const hasEInvoice = await eInv.isVisible().catch(() => false);
    if (hasEInvoice) await pay.downloadFrom(eInv, `${label}-e-invoice`);
    else console.log('DETAIL: No e-Invoice download on the page — the page says the e-Invoice is emailed');
    // No e-Invoice on staging is expected: it cannot be issued because of a TIN issue
    // (Faizuddin, 2026-10-22: "ignore that. consider it PASS"). Logged, not failed.
    return inv;
  });

  return { details, invoice, attempts, page };
}
