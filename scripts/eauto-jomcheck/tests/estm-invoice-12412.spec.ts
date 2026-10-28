import { test, expect, Page, Locator } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import pdfParse from 'pdf-parse';
import { UcdEstmPage } from '../pages/UcdEstmPage';
import { getUser } from '../data/users';
import { CONFIG } from '../data/config';
// Copies of the original eSTM flow (scripts/eauto-estm); only the two URL
// bypasses are replaced by the MyKad emulator. (Hand read tried on 2026-10-20,
// back to the emulator the same day — Faizuddin: "use the emulator again".)
import { EstmSession } from '../pages/estm/EstmSession';
import { MykadEmulatorClient } from '../pages/estm/mykadEmulator';
import { OVERLAY_INIT_SCRIPT } from '../pages/estm/overlay';
import { LoginPage as EstmLoginPage } from '../pages/estm/LoginPage';
import { CreateTransactionPage } from '../pages/estm/CreateTransactionPage';
import { BuyerDetailsPage } from '../pages/estm/BuyerDetailsPage';
import { PaymentPage } from '../pages/estm/PaymentPage';
import { EstmInputs } from '../pages/estm/estmConfig';
import { capturePdfWithHighlights } from '../utils/pdfHighlight';

// EAINT-12412_TS12 — invoices of other products keep their current layout.
// Automated for eSTM only: Insurance has no e-Invoice (knowledge/flow-jomcheck.md
// §9h item 14) and stays manual. Runs in its own Playwright project
// ("estm-emulator", playwright.config.ts): headed, with Chrome's local-network
// checks off so the page can reach the MyKad reader service on localhost.
//
// Baseline = Faizuddin's 28 Sep samples, before the CR was pushed to staging
// (_reference/tickets/EAINT-12412/ESTM_Invoice (3).pdf, ESTM_e-Invoice.pdf):
// one document per product, ONE line each, 8% service tax, e-Invoice code 022.
const BASELINE = [
  { product: 'eSTM', line: 'ESERAHAN TUKAR MILIK ("ESTM") SERVICE CHARGE', amounts: ['35.00', '2.80', '37.80'] },
  { product: 'eLKM', line: 'E-LESEN KENDERAAN MOTOR ("ELKM") SERVICE CHARGE', amounts: ['2.75', '0.22', '2.97'] },
  { product: 'eVOC', line: 'E-VEHICLE OWNERSHIP CERTIFICATE ("EVOC") SERVICE CHARGE', amounts: ['10.00', '0.80', '10.80'] },
] as const;

const detail = (label: string, value: string) => console.log(`DETAIL:${JSON.stringify({ label, value })}`);
const norm = (t: string) => t.replace(/\s+/g, ' ').trim().toUpperCase();

/** Random buyer contact (Faizuddin, 2026-10-19: each email / mobile has a weekly use limit). */
function randomContact(): { emailAddress: string; mobileNo: string } {
  const tag = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
  return { emailAddress: `ts12.${tag}@mailinator.com`, mobileNo: `01${1 + Math.floor(Math.random() * 9)}${digits(7)}` };
}

async function downloadPdf(page: Page, button: Locator, label: string, expected: string[]): Promise<string> {
  const dir = process.env.PW_EVIDENCE_DIR;
  const safe = label.replace(/[^\w.-]+/g, '_');
  const file = dir ? path.join(dir, `${safe}.pdf`) : path.join(os.tmpdir(), `${safe}-${Date.now()}.pdf`);
  if (dir) fs.mkdirSync(dir, { recursive: true });
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: CONFIG.invoiceDownloadTimeout }),
    button.click(),
  ]);
  await download.saveAs(file);
  const text = (await pdfParse(fs.readFileSync(file))).text;
  if (dir) {
    const shot = await capturePdfWithHighlights(page, file, `${safe}-checked`, { expected }, `${label} — green = the line items and amounts checked.`);
    detail(`${label} — highlighted screenshot`, shot.saved ? `saved; ${shot.found.length} green${shot.missing.length ? `; not found: ${shot.missing.join(', ')}` : ''}` : `not saved — ${shot.error}`);
  } else fs.rmSync(file, { force: true });
  return text;
}

/** One line per document, same descriptions and amounts as the baseline. */
function expectBaselineLayout(text: string, what: string, isEInvoice: boolean): void {
  const t = norm(text);
  const lines = (t.match(/SERVICE CHARGE/g) ?? []).length;
  const present = BASELINE.filter(b => t.includes(b.line));
  detail(`${what} — line items`, present.map(b => b.product).join(' + ') || 'none of the baseline lines');
  expect(present.length, `${what}: none of the eSTM / eLKM / eVOC lines found`).toBeGreaterThan(0);
  for (const b of present) {
    for (const a of isEInvoice ? b.amounts.slice(0, 2) : b.amounts) {
      expect.soft(t, `${what}: ${b.product} amount RM${a} is missing`).toContain(a);
    }
    if (isEInvoice) expect.soft(new RegExp(`(?<!\\d)022\\s*${b.line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t), `${what}: ${b.product} line has no classification code 022`).toBe(true);
  }
  expect.soft(lines, `${what}: ${lines} "service charge" lines for ${present.length} document(s) — each document should still have one line`).toBe(present.length);
  expect.soft(t, `${what}: a JomCheck line appeared on another product's document`).not.toContain('JOMCHECK');
}

test('12412_TS12: Verify invoices of other products keep their current layout', async ({ page, context }) => {
  test.setTimeout(30 * 60_000);
  const vehicleNo = (process.env.JOMCHECK_12412_TS12_VEHICLE_NO || '').toUpperCase();
  if (!vehicleNo) throw new Error('JOMCHECK_12412_TS12_VEHICLE_NO is required — a vehicle in the logged-in UCD company\'s stock.');
  const nric = process.env.JOMCHECK_12412_TS12_MYKAD_NRIC || '';
  const name = process.env.JOMCHECK_12412_TS12_MYKAD_NAME || '';
  if (!nric || !name) throw new Error('JOMCHECK_12412_TS12_MYKAD_NRIC / _NAME are required — the login user\'s MyKad for the emulator.');

  const envSegment = new URL(CONFIG.baseUrl).pathname.split('/').filter(Boolean)[0];
  const inputs: EstmInputs = { envSegment, vehicleRegNo: vehicleNo, ...randomContact() };
  detail('Buyer contact (random)', `${inputs.emailAddress} · ${inputs.mobileNo}`);

  // Same set-up as the eSTM fixture (scripts/eauto-estm/fixtures/sessionFixture.ts)
  // plus the eDereg permission grant (scripts/eauto-edereg-precheck/fixtures/sessionFixture.ts).
  await context.addInitScript(OVERLAY_INIT_SCRIPT);
  await context.grantPermissions(['camera', 'microphone', 'midi', 'midi-sysex'], { origin: new URL(CONFIG.baseUrl).origin }).catch(() => {});
  const session = new EstmSession(context, page);
  // Same card at Buyer and Seller authentication — the 19 Oct capture shows
  // buyer and seller rep as one identity (estm-step3-seller-mykad-auth.html).
  const mykad = new MykadEmulatorClient(context, { nric, name });

  // The original flow, step for step (scripts/eauto-estm/tests/estm.spec.ts).
  await test.step('Log in to UCD', async () => {
    await new EstmLoginPage(page, session).login(inputs, getUser('ucd'));
    session.logUrl('after login');
    await session.closeBanners();
  });
  await test.step('Open eSERAHAN, create a new eSTM transaction and choose MALAYSIAN', async () => {
    const createPage = new CreateTransactionPage(page, session);
    await createPage.openAndCreate();
    await createPage.selectIdType();
  });
  await test.step(`Buyer and vehicle details for ${vehicleNo}, MyKad ${nric} through the emulator at Buyer and Seller authentication`, async () => {
    await new BuyerDetailsPage(session, mykad).fillAndBypass(inputs);
  });
  await test.step('Payment: eLKM and eVOC ticked, make payment, Done', async () => {
    await new PaymentPage(session).completePayment();
  });

  const active = await session.waitForActivePage();
  const estm = new UcdEstmPage(active);
  await test.step(`Open the eSTM transaction details of ${vehicleNo}`, async () => {
    const status = await estm.openDetails(vehicleNo);
    await estm.captureEvidence(`12412_TS12-estm-details-${vehicleNo}`);
    expect.soft(status, 'eSTM transaction status').toMatch(/Approved/i);
  });

  // The PDF wraps each description over two lines ("...service" / "charge"), so the
  // screenshot boxes the part before the bracket; the text check still uses the full line.
  const expected = BASELINE.flatMap(b => [b.line.split(' (')[0], ...b.amounts]);
  const invoice = await test.step('Click Invoice and save the PDF', async () =>
    downloadPdf(active, estm.invoiceButton(), `12412_TS12-estm-invoice-${vehicleNo}`, expected));
  await test.step('Invoice: eSTM, eLKM and eVOC documents each keep 1 line, same amounts as before this CR was pushed to staging', async () => {
    expectBaselineLayout(invoice, 'eSTM Invoice', false);
  });

  const wait = await test.step('Wait for the e-Invoice button (LHDN validation)', async () => estm.waitForEInvoiceButton());
  detail('LHDN Response Status', Object.entries(wait.statuses).map(([k, v]) => `${k} ${v}`).join(' · ') || '(not shown)');
  expect(wait.ready, `The e-Invoice button did not appear within ${CONFIG.eInvoiceApprovalTimeout / 60_000} minutes (last LHDN Response Status: ${Object.entries(wait.statuses).map(([k, v]) => `${k} ${v}`).join(', ') || 'not shown'})`).toBe(true);
  const eInvoice = await test.step('Click e-Invoice and save the PDF', async () =>
    downloadPdf(active, estm.eInvoiceButton(), `12412_TS12-estm-einvoice-${vehicleNo}`, expected));
  await test.step('e-Invoice: each document keeps 1 line with code 022, same amounts as before this CR was pushed to staging', async () => {
    expectBaselineLayout(eInvoice, 'eSTM e-Invoice', true);
  });
});
