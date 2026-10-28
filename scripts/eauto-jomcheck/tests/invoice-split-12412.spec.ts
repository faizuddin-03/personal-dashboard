import { test, expect, Page, Download } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import pdfParse from 'pdf-parse';
import { LoginPage } from '../pages/LoginPage';
import { UcdJomCheckPurchasePage } from '../pages/UcdJomCheckPurchasePage';
import { UcdJomCheckTransactionListingPage } from '../pages/UcdJomCheckTransactionListingPage';
import { UcdJomCheckTransactionDetailsPage } from '../pages/UcdJomCheckTransactionDetailsPage';
import { BoJomCheckTransactionEnquiryPage } from '../pages/BoJomCheckTransactionEnquiryPage';
import { BoJomCheckTransactionDetailsPage } from '../pages/BoJomCheckTransactionDetailsPage';
import { BoSstPaymentReportPage } from '../pages/BoSstPaymentReportPage';
import { BoEInvoiceListingPage } from '../pages/BoEInvoiceListingPage';
import { UcdReportsPage } from '../pages/UcdReportsPage';
import { getUser, UserCredentials } from '../data/users';
import { CONFIG } from '../data/config';
import { lookUpTransactionNo } from '../utils/transactionLookup';
import { registerEsimRestoreHook, setResultFailedAndBuy } from '../utils/esimPurchase';
import { readZip } from '../utils/zipReader';
import { parseListingDate } from '../utils/datepicker';
import { capturePdfWithHighlights } from '../utils/pdfHighlight';
import {
  expectTwoLineBreakdown, expectSingleLineBreakdown, expectSameLines, expectClassificationCodes,
  expectSameDocument, logEInvoiceHeader, PdfDownload, InvoiceLayout, buildHighlightSpec,
} from '../utils/invoicePdf';

// EAINT-12412 — [eAuto-UCD & BackOffice] JomCheck: Split Invoice & e-Invoice
// Charge into 2 line items (RM18.00 "JomCheck report" + RM2.00 "JomCheck
// service charge", 8% SST each, total still RM21.60). Workbook:
// _reference/tickets/EAINT-12412/EAINT-12412 - ....xlsx (12 TS, renumbered
// ascending 2026-10-19 — old→new map in the ticket's NOTES.md). Automated
// here: TS01, TS03, TS04, TS05, TS06, TS08, TS09, TS10, TS11. Not automated:
// TS02 (Wholesale chatbot, manual by choice), TS07 (MyInvois — no login
// known), TS12 Insurance (TS12 eSTM: estm-invoice-12412.spec.ts). See knowledge/flow-jomcheck.md
// §9f / §9h.
//
// One page per test (UCD, logout, BO) so each TS is one recording. Every
// PDF is saved as evidence under its TS label. Titles are matched exactly
// by app/eauto/12412/page.tsx.

const detail = (label: string, value: string) => console.log(`DETAIL:${JSON.stringify({ label, value })}`);

/** Opens the UCD details page of the newest transaction for `vehicleNo`
 *  whose Tx Status matches `status` (listing is newest-first). */
async function openUcdDetails(page: Page, vehicleNo: string, status: RegExp): Promise<UcdJomCheckTransactionDetailsPage> {
  const listing = new UcdJomCheckTransactionListingPage(page);
  await test.step(`Open the UCD JomCheck Transaction Listing and search ${vehicleNo}`, async () => {
    await listing.goto();
    await listing.searchByVehicleNo(vehicleNo);
  });
  await test.step(`Open the newest ${status.source} transaction of ${vehicleNo}`, async () => {
    const rows = await listing.readRows();
    const row = rows.find(r => status.test(r.txStatus));
    expect(row, `No ${status.source} transaction listed for ${vehicleNo} (rows: ${rows.map(r => `${r.transactionNo}/${r.txStatus}`).join(', ') || 'none'})`).toBeTruthy();
    detail('UCD row', `${row!.transactionNo || '-'} · ${row!.createdAt} · ${row!.payment} / ${row!.txStatus} · e-Invoice ${row!.eInvoiceStatus || '-'}`);
    await listing.highlightRow(row!.index);
    await listing.openResult(row!.index);
  });
  return new UcdJomCheckTransactionDetailsPage(page);
}

/** Same for BackOffice (Transaction Enquiry lists every company). */
async function openBoDetails(page: Page, vehicleNo: string, status: RegExp): Promise<BoJomCheckTransactionDetailsPage> {
  const enquiry = new BoJomCheckTransactionEnquiryPage(page);
  await test.step(`Open the BackOffice JomCheck Transaction Enquiry and search ${vehicleNo}`, async () => {
    await enquiry.goto();
    await enquiry.searchByVehicleNo(vehicleNo);
  });
  await test.step(`Open the newest ${status.source} transaction of ${vehicleNo} in BackOffice`, async () => {
    const rows = await enquiry.readRows();
    const row = rows.find(r => status.test(r.txStatus));
    expect(row, `No ${status.source} transaction in the BO enquiry for ${vehicleNo} (rows: ${rows.map(r => `${r.transactionNo}/${r.txStatus}`).join(', ') || 'none'})`).toBeTruthy();
    detail('BO row', `${row!.transactionNo || '-'} · ${row!.companyName} · ${row!.createdAt} · ${row!.payment} / ${row!.txStatus}`);
    await enquiry.highlightRow(row!.index);
    await enquiry.openResult(row!.index);
  });
  return new BoJomCheckTransactionDetailsPage(page);
}

interface Docs { invoice: PdfDownload; eInvoice?: PdfDownload }

/** Downloads Invoice + e-Invoice from whichever details page is open. */
async function downloadBoth(
  details: UcdJomCheckTransactionDetailsPage | BoJomCheckTransactionDetailsPage,
  side: 'UCD' | 'BO', tsLabel: string, vehicleNo: string, opts: { waitForEInvoice: boolean; layout?: InvoiceLayout },
): Promise<Docs> {
  const invoice = await test.step(`${side}: click Invoice and save the PDF`, async () =>
    details.downloadInvoiceAsText(`${tsLabel}-${side.toLowerCase()}-invoice-${vehicleNo}`, opts.layout));
  const ready = await test.step(`${side}: ${opts.waitForEInvoice ? 'wait for the e-Invoice button (LHDN validation)' : 'check the e-Invoice button is present'}`, async () =>
    opts.waitForEInvoice ? details.waitForEInvoiceButton() : details.isEInvoiceButtonVisible());
  if (!ready) {
    detail(`${side} e-Invoice`, 'button not present — e-Invoice not downloaded');
    return { invoice };
  }
  const eInvoice = await test.step(`${side}: click e-Invoice and save the PDF`, async () =>
    details.downloadEInvoiceAsText(`${tsLabel}-${side.toLowerCase()}-einvoice-${vehicleNo}`, opts.layout));
  logEInvoiceHeader(eInvoice.text, `${side} e-Invoice`);
  detail(`${side} LHDN Response Status`, await details.getLhdnResponseStatus());
  return { invoice, eInvoice };
}

// ── TS01 ──────────────────────────────────────────────────────────────────
test('12412_TS01: Verify a new JomCheck transaction from UCD shows the fee in 2 lines on the invoice and e-Invoice', async ({ page }) => {
  test.setTimeout(25 * 60_000);
  const vehicleNo = process.env.JOMCHECK_12412_TS01_VEHICLE_NO;
  if (!vehicleNo) throw new Error('JOMCHECK_12412_TS01_VEHICLE_NO is required for this scenario.');

  const login = new LoginPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);
  const listing = new UcdJomCheckTransactionListingPage(page);
  const details = new UcdJomCheckTransactionDetailsPage(page);

  await test.step('Log in to UCD', async () => { await login.login(getUser('ucd')); });
  await test.step('Open the JomCheck purchase page', async () => { await purchase.goto(); });
  await test.step(`Enter vehicle number ${vehicleNo} and submit`, async () => { await purchase.submitVehicleNo(vehicleNo); });
  await test.step('Confirm the vehicle was found and the price prompt still reads "RM20.00 + 8% Service Tax" (screens unchanged, SRD §2.1.2 item 4)', async () => {
    const prompt = await purchase.getFullPromptText();
    detail('Price prompt', prompt);
    expect(prompt).toContain('Vehicle number found');
    expect(prompt).toContain('RM20.00 + 8% Service Tax');
  });
  await test.step('Click Pay Now', async () => { await purchase.payNow(); });
  await test.step('Confirm the payment completed', async () => { expect(await purchase.isReportReady()).toBe(true); });

  const tx = await lookUpTransactionNo(page, purchase, { vehicleNo });
  detail('Vehicle No.', vehicleNo);

  await test.step(`Open the details of transaction ${tx}`, async () => {
    await listing.searchByTransactionNo(tx);
    await listing.openResult(0);
    await details.captureEvidence(`12412_TS01-ucd-details-${vehicleNo}`);
  });
  await test.step('Confirm the transaction is Approved', async () => {
    const status = await details.getStatus();
    detail('Transaction status', status);
    expect(status).toMatch(/Approved/i);
  });

  const docs = await downloadBoth(details, 'UCD', '12412_TS01', vehicleNo, { waitForEInvoice: true });

  await test.step('Invoice: line 1 "JomCheck report" RM18.00 + RM1.44 = RM19.44, line 2 "JomCheck service charge" RM2.00 + RM0.16 = RM2.16, totals RM20.00 / RM1.60 / RM21.60', async () => {
    expectTwoLineBreakdown(docs.invoice.text, 'UCD Invoice');
  });
  await test.step('e-Invoice: same 2 lines as the Invoice, Total Payable Amount RM21.60, classification code 022 on both lines', async () => {
    expect(docs.eInvoice, 'The e-Invoice button never appeared within the LHDN wait — e-Invoice not checked').toBeTruthy();
    expectTwoLineBreakdown(docs.eInvoice!.text, 'UCD e-Invoice');
    expectClassificationCodes(docs.eInvoice!.text, 2, 'UCD e-Invoice');
    expectSameLines(docs.invoice.text, docs.eInvoice!.text, 'Invoice vs e-Invoice');
  });
});

// ── TS05 ──────────────────────────────────────────────────────────────────
test('12412_TS05: Verify the BackOffice invoice and e-Invoice match the UCD copies for the same transaction', async ({ page }) => {
  test.setTimeout(25 * 60_000);
  const vehicleNo = process.env.JOMCHECK_12412_TS05_VEHICLE_NO;
  if (!vehicleNo) throw new Error('JOMCHECK_12412_TS05_VEHICLE_NO is required — pick a "New purchase, after deployment" record.');

  const login = new LoginPage(page);
  await test.step('Log in to UCD', async () => { await login.login(getUser('ucd')); });
  const ucd = await openUcdDetails(page, vehicleNo, /Approved/i);
  const ucdDocs = await downloadBoth(ucd, 'UCD', '12412_TS05', vehicleNo, { waitForEInvoice: true });

  await test.step('Log out of UCD and log in to BackOffice', async () => {
    await login.logout();
    await login.login(getUser('bo'));
  });
  const bo = await openBoDetails(page, vehicleNo, /Approved/i);
  await test.step('Confirm the BackOffice transaction is Approved', async () => {
    expect(await bo.getStatusText()).toMatch(/Approved/i);
  });
  const boDocs = await downloadBoth(bo, 'BO', '12412_TS05', vehicleNo, { waitForEInvoice: false });

  await test.step('Invoice: BackOffice copy has identical line items and totals to the UCD copy (REQ-005)', async () => {
    expectTwoLineBreakdown(boDocs.invoice.text, 'BO Invoice');
    expectSameDocument(ucdDocs.invoice.text, boDocs.invoice.text, 'Invoice');
  });
  await test.step('e-Invoice: BackOffice copy identical to the UCD copy, classification code 022 on both lines', async () => {
    expect(ucdDocs.eInvoice, 'UCD e-Invoice was not available').toBeTruthy();
    expect(boDocs.eInvoice, 'BackOffice e-Invoice button is not present').toBeTruthy();
    expectTwoLineBreakdown(boDocs.eInvoice!.text, 'BO e-Invoice');
    expectClassificationCodes(boDocs.eInvoice!.text, 2, 'BO e-Invoice');
    expectSameDocument(ucdDocs.eInvoice!.text, boDocs.eInvoice!.text, 'e-Invoice');
  });
});

// ── TS08 ──────────────────────────────────────────────────────────────────
test('12412_TS08: Verify an existing approved JomCheck transaction keeps the single-line invoice and e-Invoice', async ({ page }) => {
  test.setTimeout(20 * 60_000);
  const vehicleNo = process.env.JOMCHECK_12412_TS08_VEHICLE_NO;
  if (!vehicleNo) throw new Error('JOMCHECK_12412_TS08_VEHICLE_NO is required — pick an "Approved, before deployment" record.');

  const login = new LoginPage(page);
  await test.step('Log in to UCD', async () => { await login.login(getUser('ucd')); });
  const ucd = await openUcdDetails(page, vehicleNo, /Approved/i);
  const ucdDocs = await downloadBoth(ucd, 'UCD', '12412_TS08', vehicleNo, { waitForEInvoice: false, layout: 'one-line' });

  await test.step('Invoice (downloaded again after deployment): still 1 line "JomCheck service charge" RM20.00 + RM1.60 = RM21.60 (REQ-001 Example 2)', async () => {
    expectSingleLineBreakdown(ucdDocs.invoice.text, 'UCD Invoice');
  });
  await test.step('e-Invoice: still 1 line, same as the Invoice; header logged for the MyInvois "not resubmitted" check', async () => {
    expect(ucdDocs.eInvoice, 'UCD e-Invoice button is not present on this pre-deployment transaction').toBeTruthy();
    expectSingleLineBreakdown(ucdDocs.eInvoice!.text, 'UCD e-Invoice');
    expectClassificationCodes(ucdDocs.eInvoice!.text, 1, 'UCD e-Invoice');
    expectSameLines(ucdDocs.invoice.text, ucdDocs.eInvoice!.text, 'Invoice vs e-Invoice');
  });

  await test.step('Log out of UCD and log in to BackOffice', async () => {
    await login.logout();
    await login.login(getUser('bo'));
  });
  const bo = await openBoDetails(page, vehicleNo, /Approved/i);
  const boDocs = await downloadBoth(bo, 'BO', '12412_TS08', vehicleNo, { waitForEInvoice: false, layout: 'one-line' });

  await test.step('BackOffice Invoice and e-Invoice: identical to the UCD copies, still 1 line', async () => {
    expectSingleLineBreakdown(boDocs.invoice.text, 'BO Invoice');
    expectSameDocument(ucdDocs.invoice.text, boDocs.invoice.text, 'Invoice');
    expect(boDocs.eInvoice, 'BackOffice e-Invoice button is not present').toBeTruthy();
    expectSingleLineBreakdown(boDocs.eInvoice!.text, 'BO e-Invoice');
    expectSameDocument(ucdDocs.eInvoice!.text, boDocs.eInvoice!.text, 'e-Invoice');
  });
  // MyInvois ("e-Invoice unchanged, no new submission") is checked by a
  // person — no MyInvois login is known. The UIN / Submission Date DETAIL
  // lines above are what to compare there.
});

// ── TS09 ──────────────────────────────────────────────────────────────────
test('12412_TS09: Verify an existing failed JomCheck transaction resubmitted from BackOffice gets the 2-line invoice and e-Invoice', async ({ page }) => {
  test.setTimeout(30 * 60_000);
  const vehicleNo = process.env.JOMCHECK_12412_TS09_VEHICLE_NO;
  if (!vehicleNo) throw new Error('JOMCHECK_12412_TS09_VEHICLE_NO is required — pick a "Failed, before deployment" record.');

  const login = new LoginPage(page);
  const enquiry = new BoJomCheckTransactionEnquiryPage(page);
  await test.step('Log in to BackOffice', async () => { await login.login(getUser('bo')); });
  await test.step(`Open the BackOffice JomCheck Transaction Enquiry and search ${vehicleNo}`, async () => {
    await enquiry.goto();
    await enquiry.searchByVehicleNo(vehicleNo);
  });

  // "Resubmit" sits in the listing's Action column, on Failed rows only —
  // not on the details page (Faizuddin, 2026-10-15; capture
  // _reference/html/eauto/bo-jomcheck-transaction-enquiry-failed-resubmit.html).
  const failedTx = await test.step('Find the Failed transaction (Payment OK, Tx Status Failed) and its Resubmit link', async () => {
    const rows = await enquiry.readRows();
    const row = rows.find(r => /Fail/i.test(r.txStatus) && r.canResubmit);
    expect(row, `No Failed row with a Resubmit link for ${vehicleNo} (rows: ${rows.map(r => `${r.transactionNo}/${r.txStatus}${r.canResubmit ? '/resubmit' : ''}`).join(', ') || 'none'})`).toBeTruthy();
    await enquiry.highlightRow(row!.index);
    detail('Before resubmit', `${row!.transactionNo} · ${row!.payment} / ${row!.txStatus} · LHDN ${row!.lhdnStatus || '-'} · ${row!.remarks || 'no remarks'}`);
    expect(row!.payment).toMatch(/OK/i);
    await enquiry.captureEvidence(`12412_TS09-bo-enquiry-before-resubmit-${vehicleNo}`);
    return row!;
  });

  await test.step(`Click Resubmit on ${failedTx.transactionNo} and answer any prompt`, async () => {
    const messages = await enquiry.resubmitRow(failedTx.index);
    detail('Prompts after Resubmit', messages.join(' | ') || 'none');
    await enquiry.captureEvidence(`12412_TS09-bo-enquiry-after-resubmit-click-${vehicleNo}`);
  });

  const approvedIndex = await test.step(`Search again until ${failedTx.transactionNo} reads Approved`, async () => {
    const deadline = Date.now() + CONFIG.resubmitProcessingTimeout;
    let last = '';
    while (Date.now() < deadline) {
      await enquiry.searchByVehicleNo(vehicleNo);
      const rows = await enquiry.readRows();
      const same = rows.find(r => r.transactionNo === failedTx.transactionNo);
      last = same ? `${same.payment} / ${same.txStatus} · LHDN ${same.lhdnStatus || '-'}` : 'row not listed';
      if (same && /Approved/i.test(same.txStatus)) {
        await enquiry.highlightRow(same.index);
        detail('After resubmit', `${same.transactionNo} · ${last}`);
        // TS v2 (19_10_26) expected 2: "Action shows [View] only" — Resubmit
        // hides once BO resubmits successfully (EAINT-9203 v2, row 9).
        expect.soft(same.canResubmit, `${same.transactionNo}: Resubmit link still shown after Approved`).toBe(false);
        return same.index;
      }
      await page.waitForTimeout(CONFIG.eInvoicePollInterval);
    }
    detail('After resubmit', `${failedTx.transactionNo} · ${last} (timed out)`);
    throw new Error(`${failedTx.transactionNo} did not become Approved within ${CONFIG.resubmitProcessingTimeout / 60000} min after Resubmit (last: ${last}).`);
  });

  const bo = new BoJomCheckTransactionDetailsPage(page);
  await test.step(`Open ${failedTx.transactionNo} in BackOffice`, async () => {
    await enquiry.openResult(approvedIndex);
    await bo.captureEvidence(`12412_TS09-bo-details-after-resubmit-${vehicleNo}`);
  });
  const boDocs = await downloadBoth(bo, 'BO', '12412_TS09', vehicleNo, { waitForEInvoice: true });

  await test.step('BackOffice Invoice: 2 lines (created before deployment, approved after — REQ-001 Example 3)', async () => {
    expectTwoLineBreakdown(boDocs.invoice.text, 'BO Invoice');
  });
  await test.step('BackOffice e-Invoice: same 2 lines, classification code 022 on both', async () => {
    expect(boDocs.eInvoice, 'The e-Invoice button never appeared within the LHDN wait').toBeTruthy();
    expectTwoLineBreakdown(boDocs.eInvoice!.text, 'BO e-Invoice');
    expectClassificationCodes(boDocs.eInvoice!.text, 2, 'BO e-Invoice');
  });

  await test.step('Log out of BackOffice and log in to UCD', async () => {
    await login.logout();
    await login.login(getUser('ucd'));
  });
  const ucd = await openUcdDetails(page, vehicleNo, /Approved/i);
  const ucdDocs = await downloadBoth(ucd, 'UCD', '12412_TS09', vehicleNo, { waitForEInvoice: false });
  await test.step('UCD Invoice and e-Invoice: identical to the BackOffice copies', async () => {
    expectTwoLineBreakdown(ucdDocs.invoice.text, 'UCD Invoice');
    expectSameDocument(boDocs.invoice.text, ucdDocs.invoice.text, 'Invoice');
    expect(ucdDocs.eInvoice, 'UCD e-Invoice button is not present').toBeTruthy();
    expectSameDocument(boDocs.eInvoice!.text, ucdDocs.eInvoice!.text, 'e-Invoice');
  });
});

// ── TS03 (added in TS v2, 19_10_26) ───────────────────────────────────────
// A UCD with an invalid TIN still gets the 2-line invoice, and NO e-Invoice
// is generated for it — Faizuddin, 2026-10-19: "if the account has invalid
// TIN, it will not generate any e-Invoice". Inputs typed on the dashboard
// (no fallbacks): JOMCHECK_12412_TS03_VEHICLE_NO (fresh, from the counter),
// JOMCHECK_12412_TS03_UCD_USERNAME, JOMCHECK_12412_TS03_UCD_PASSWORD.
test('12412_TS03: Verify a new JomCheck transaction by a UCD with an invalid TIN shows the fee in 2 lines on the invoice', async ({ page }) => {
  test.setTimeout(20 * 60_000);
  const vehicleNo = process.env.JOMCHECK_12412_TS03_VEHICLE_NO;
  const username = process.env.JOMCHECK_12412_TS03_UCD_USERNAME;
  const password = process.env.JOMCHECK_12412_TS03_UCD_PASSWORD;
  if (!vehicleNo) throw new Error('JOMCHECK_12412_TS03_VEHICLE_NO is required for this scenario.');
  if (!username || !password) throw new Error('JOMCHECK_12412_TS03_UCD_USERNAME / _PASSWORD are required — a UCD whose company has an invalid TIN.');

  const login = new LoginPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);
  const listing = new UcdJomCheckTransactionListingPage(page);
  const details = new UcdJomCheckTransactionDetailsPage(page);

  await test.step(`Log in to UCD as ${username} (invalid TIN)`, async () => { await login.login({ username, password, role: 'ucd' }); });
  await test.step('Open the JomCheck purchase page', async () => { await purchase.goto(); });
  await test.step(`Enter vehicle number ${vehicleNo} and submit`, async () => { await purchase.submitVehicleNo(vehicleNo); });
  await test.step('Click Pay Now', async () => { await purchase.payNow(); });
  await test.step('Confirm the payment completed', async () => { expect(await purchase.isReportReady()).toBe(true); });

  const tx = await lookUpTransactionNo(page, purchase, { vehicleNo });
  await test.step(`Open the details of transaction ${tx}`, async () => {
    await listing.searchByTransactionNo(tx);
    await listing.openResult(0);
    await details.captureEvidence(`12412_TS03-ucd-details-${vehicleNo}`);
  });

  const invoice = await test.step('Click Invoice and save the PDF', async () =>
    details.downloadInvoiceAsText(`12412_TS03-ucd-invoice-${vehicleNo}`));
  await test.step('Invoice: line 1 "JomCheck report" RM19.44, line 2 "JomCheck service charge" RM2.16, total RM21.60', async () => {
    expectTwoLineBreakdown(invoice.text, 'UCD Invoice (invalid TIN)');
  });

  // No e-Invoice: reload until LHDN reports a failure (the TIN check), or the
  // LHDN window ends — the e-Invoice button must never appear on the way.
  await test.step('Confirm no e-Invoice is generated (invalid TIN)', async () => {
    const deadline = Date.now() + CONFIG.eInvoiceApprovalTimeout;
    let status = '';
    let appeared = false;
    while (Date.now() < deadline) {
      appeared = await details.isEInvoiceButtonVisible();
      status = (await details.getLhdnResponseStatus()) || '-';
      if (appeared || /fail/i.test(status)) break;
      await page.waitForTimeout(CONFIG.eInvoicePollInterval);
      await page.reload({ waitUntil: 'load', timeout: CONFIG.navigationTimeout });
    }
    detail('LHDN Response Status', status);
    await details.captureEvidence(`12412_TS03-ucd-no-einvoice-${vehicleNo}`);
    expect(appeared, `An e-Invoice was generated for a UCD with an invalid TIN (LHDN status "${status}")`).toBe(false);
  });
});

// ── TS04 (added in TS v2, 19_10_26) ───────────────────────────────────────
// A paid JomCheck that ends Failed still has an [Invoice]
// (system chatbot, prod code, 2026-10-19). Checks that invoice splits.
// The Failed transaction is MADE by this test — Faizuddin, 2026-10-19:
// "shouldnt the automation change the settings in the eSim and create a
// failed transaction?" — eSim Report Result = "Failed" for the fresh vehicle
// no.'s prefix, buy (pays, report fails), eSim restored afterwards. Needs the
// VPN. Inputs from the dashboard:
//   JOMCHECK_12412_TS04_VEHICLE_NO            — fresh, from the counter.
// No Cancelled case: a JomCheck transaction is never set to Cancelled
// (system chatbot, prod code, 2026-10-19 — knowledge/flow-jomcheck.md §9h item 12).
registerEsimRestoreHook();

test('12412_TS04: Verify a paid JomCheck transaction that ends Failed shows the fee in 2 lines on the invoice', async ({ page }) => {
  test.setTimeout(25 * 60_000);
  const failedVn = process.env.JOMCHECK_12412_TS04_VEHICLE_NO;
  if (!failedVn) throw new Error('JOMCHECK_12412_TS04_VEHICLE_NO is required — the fresh vehicle no. this test buys a Failed JomCheck on.');

  // Leaves the page logged in to UCD on the purchase screen.
  const { errorMessage } = await setResultFailedAndBuy(page, failedVn);
  detail('UCD error after Pay Now', errorMessage);

  const cases: { label: string; vehicleNo: string; status: RegExp }[] = [
    { label: 'Failed', vehicleNo: failedVn, status: /Fail/i },
  ];

  for (const c of cases) {
    const listing = new UcdJomCheckTransactionListingPage(page);
    const details = new UcdJomCheckTransactionDetailsPage(page);
    await test.step(`${c.label}: search ${c.vehicleNo} on the UCD JomCheck Transaction Listing`, async () => {
      await listing.goto();
      await listing.searchByVehicleNo(c.vehicleNo);
    });
    await test.step(`${c.label}: open the newest transaction with Payment OK and Tx Status ${c.label}`, async () => {
      const rows = await listing.readRows();
      const row = rows.find(r => c.status.test(r.txStatus) && /OK/i.test(r.payment));
      expect(row, `No Payment OK / ${c.label} transaction for ${c.vehicleNo} (rows: ${rows.map(r => `${r.transactionNo}/${r.payment}/${r.txStatus}`).join(', ') || 'none'})`).toBeTruthy();
      detail(`${c.label} row`, `${row!.transactionNo || '-'} · ${row!.createdAt} · ${row!.payment} / ${row!.txStatus}`);
      await listing.highlightRow(row!.index);
      await listing.openResult(row!.index);
      await details.captureEvidence(`12412_TS04-${c.label.toLowerCase()}-details-${c.vehicleNo}`);
    });
    const invoice = await test.step(`${c.label}: click Invoice and save the PDF`, async () =>
      details.downloadInvoiceAsText(`12412_TS04-${c.label.toLowerCase()}-invoice-${c.vehicleNo}`));
    await test.step(`${c.label}: invoice shows 2 lines, "JomCheck report" and "JomCheck service charge", total RM21.60`, async () => {
      expectTwoLineBreakdown(invoice.text, `UCD Invoice (${c.label})`);
    });
  }
});

// ── Finance reports (TS06, TS10, TS11) — pages captured 2026-10-19 ────────
// knowledge/flow-jomcheck.md §9h item 13. Each takes a "New purchase, after
// deployment" record (normally TS01's vehicle no.) picked on the dashboard.

/** The "eAuto Account" BackOffice login typed on the TS06 / TS10 rows — its
 *  own fields, separate from the shared BO login (Faizuddin, 2026-10-19), since
 *  only it has the SST Payment Report (JomCheck) and e-Invoice listing links. */
function eautoAccountLogin(): UserCredentials {
  const username = process.env.JOMCHECK_12412_EAUTO_ACCOUNT_USERNAME;
  const password = process.env.JOMCHECK_12412_EAUTO_ACCOUNT_PASSWORD;
  if (!username || !password) throw new Error('JOMCHECK_12412_EAUTO_ACCOUNT_USERNAME / _PASSWORD are required — the eAuto Account login on the TS06 / TS10 row.');
  return { username, password, role: 'bo' };
}

/** Newest Approved transaction of `vehicleNo` in the BackOffice Transaction
 *  Enquiry — gives the transaction no., company and date the reports filter by. */
async function findBoApprovedRow(page: Page, vehicleNo: string) {
  const enquiry = new BoJomCheckTransactionEnquiryPage(page);
  await test.step(`Open the BackOffice JomCheck Transaction Enquiry and search ${vehicleNo}`, async () => {
    await enquiry.goto();
    await enquiry.searchByVehicleNo(vehicleNo);
  });
  return test.step(`Read the newest Approved transaction of ${vehicleNo}`, async () => {
    const rows = await enquiry.readRows();
    const row = rows.find(r => /Approved/i.test(r.txStatus));
    expect(row, `No Approved transaction in the BO enquiry for ${vehicleNo} (rows: ${rows.map(r => `${r.transactionNo}/${r.txStatus}`).join(', ') || 'none'})`).toBeTruthy();
    await enquiry.highlightRow(row!.index);
    detail('Transaction', `${row!.transactionNo} · ${row!.companyName} · ${row!.createdAt}`);
    return { txNo: row!.transactionNo, company: row!.companyName, date: parseListingDate(row!.createdAt) };
  });
}

/** Saves a report PDF (evidence when kept) and returns its text, with a
 *  highlighted screenshot of the rows checked. */
async function savePdf(page: Page, download: Download, label: string, highlight: string[]): Promise<string> {
  const evidenceDir = process.env.PW_EVIDENCE_DIR;
  const safe = label.replace(/[^\w.-]+/g, '_');
  const file = evidenceDir ? path.join(evidenceDir, `${safe}.pdf`) : path.join(os.tmpdir(), `${safe}-${Date.now()}.pdf`);
  if (evidenceDir) fs.mkdirSync(evidenceDir, { recursive: true });
  await download.saveAs(file);
  const text = (await pdfParse(fs.readFileSync(file))).text;
  if (evidenceDir) {
    const shot = await capturePdfWithHighlights(page, file, `${safe}-checked`, { expected: highlight }, `${label} — green = the transaction checked.`);
    detail(`${label} — highlighted screenshot`, shot.saved ? `saved; ${shot.found.length} green${shot.missing.length ? `; not found: ${shot.missing.join(', ')}` : ''}` : `not saved — ${shot.error}`);
  } else fs.rmSync(file, { force: true });
  return text;
}

// ── TS06 ──────────────────────────────────────────────────────────────────
test('12412_TS06: Verify the SST Payment Report shows the same amounts for the new transaction', async ({ page }) => {
  test.setTimeout(10 * 60_000);
  const vehicleNo = process.env.JOMCHECK_12412_TS06_VEHICLE_NO;
  if (!vehicleNo) throw new Error('JOMCHECK_12412_TS06_VEHICLE_NO is required — pick a "New purchase, after deployment" record.');

  const login = new LoginPage(page);
  const eautoAccount = eautoAccountLogin();
  await test.step(`Log in to BackOffice as ${eautoAccount.username}`, async () => { await login.login(eautoAccount); });
  const tx = await findBoApprovedRow(page, vehicleNo);

  const report = new BoSstPaymentReportPage(page);
  await test.step('Open Reports > SST Payment Report (JomCheck)', async () => {
    expect(await report.goto(), `BackOffice login "${eautoAccount.username}" has no "SST Payment Report (JomCheck)" link on its home menu — use the eAuto Account login`).toBe(true);
  });
  await test.step(`Set Created Date to the transaction date, Transaction No ${tx.txNo}, tick JomCheck and click Generate`, async () => {
    detail('Created Date', await report.generateFor(tx.date, tx.txNo));
  });

  const rows = await test.step(`Locate transaction ${tx.txNo} in the report`, async () => {
    const all = await report.readRows();
    const mine = all.filter(r => r.cells['Transaction No'] === tx.txNo);
    expect(mine.length, `Rows for ${tx.txNo} in the SST Payment Report (all rows: ${all.map(r => r.cells['Transaction No']).join(', ') || 'none'})`).toBe(1);
    await report.highlightRow(mine[0].index);
    await report.captureReport(`12412_TS06-sst-report-${vehicleNo}`);
    return mine;
  });

  const c = rows[0].cells;
  const expected: Record<string, string> = {
    'Amount (RM)': '20.00', 'Total Service Tax Amount (RM)': '1.60', 'Total Amount (RM)': '21.60',
    'EAUTO (RM)': '6.00', 'SST (8%)': '0.48', 'EZAUTO ASIA (RM)': '14.00',
  };
  await test.step('Amount 20.00, Total Service Tax 1.60, Total 21.60, EAUTO 6.00, SST (8%) 0.48', async () => {
    detail('Row amounts', Object.keys(expected).map(k => `${k} ${c[k] ?? '-'}`).join(' · '));
    for (const k of ['Amount (RM)', 'Total Service Tax Amount (RM)', 'Total Amount (RM)', 'EAUTO (RM)', 'SST (8%)']) {
      expect.soft(c[k], `SST Payment Report: ${k}`).toBe(expected[k]);
    }
  });
  await test.step('ezAUTO Asia RM14.00', async () => {
    expect.soft(c['EZAUTO ASIA (RM)'], 'SST Payment Report: EZAUTO ASIA (RM)').toBe('14.00');
  });
  await test.step('Grand Total includes the transaction (one-transaction report, so it equals the row)', async () => {
    const total = await report.readGrandTotal();
    detail('Grand Total', Object.entries(total).map(([k, v]) => `${k} ${v}`).join(' · '));
    for (const k of ['Amount (RM)', 'Total Service Tax Amount (RM)', 'Total Amount (RM)', 'EAUTO (RM)', 'SST (8%)']) {
      expect.soft(total[k], `Grand Total: ${k}`).toBe(expected[k]);
    }
  });
});

// ── TS10 ──────────────────────────────────────────────────────────────────
test('12412_TS10: Verify the finance reports still show one row per JomCheck transaction with the same totals', async ({ page }) => {
  test.setTimeout(15 * 60_000);
  const vehicleNo = process.env.JOMCHECK_12412_TS10_VEHICLE_NO;
  if (!vehicleNo) throw new Error('JOMCHECK_12412_TS10_VEHICLE_NO is required — pick a "New purchase, after deployment" record.');

  const login = new LoginPage(page);
  const eautoAccount = eautoAccountLogin();
  await test.step(`Log in to BackOffice as ${eautoAccount.username}`, async () => { await login.login(eautoAccount); });
  const tx = await findBoApprovedRow(page, vehicleNo);

  const listing = new BoEInvoiceListingPage(page);
  await test.step('Open Proforma Invoice / e-Invoice > e-Invoice / Consolidated e-Invoice Listing', async () => {
    expect(await listing.goto(), `BackOffice login "${eautoAccount.username}" has no "e-Invoice / Consolidated e-Invoice Listing" link on its home menu — use the eAuto Account login`).toBe(true);
  });
  await test.step(`Search Company Name "${tx.company}", Type JomCheck, Payment Date = the transaction date`, async () => {
    detail('Payment Date', await listing.search(tx.company, tx.date));
    detail('Listing', await listing.totalText());
  });
  await test.step(`e-Invoice / Consolidated e-Invoice Listing: 1 row for ${vehicleNo}, Total Including Tax (RM) 21.60`, async () => {
    const hits = await listing.findByVehicle(vehicleNo);
    detail('Listing rows', hits.map(h => `${h.documentCode} · ${h.netAmount} / ${h.taxAmount} / ${h.totalIncludingTax} · LHDN ${h.lhdnStatus}`).join(' | ') || 'none');
    await listing.captureListing(`12412_TS10-einvoice-listing-${vehicleNo}`);
    expect(hits.length, `Rows for ${vehicleNo} in the e-Invoice / Consolidated e-Invoice Listing`).toBe(1);
    expect.soft(hits[0].totalIncludingTax, 'Total Including Tax (RM)').toBe('21.60');
    expect.soft(hits[0].netAmount, 'Total Net Amount (RM)').toBe('20.00');
    expect.soft(hits[0].taxAmount, 'Total Tax Amount (RM)').toBe('1.60');
  });

  const reports = new UcdReportsPage(page);
  await test.step('Log out of BackOffice and log in to UCD', async () => {
    await login.logout();
    await login.login(getUser('ucd'));
  });
  await test.step('Open Reports > Payment Breakdown Report', async () => { await reports.gotoPaymentBreakdown(); });
  await test.step('Set the payment date to the transaction date and Transaction Type JomCheck', async () => {
    detail('Payment Date', await reports.setBreakdownFilter(tx.date));
  });
  const text = await test.step('Click Download and save the PDF', async () => {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: CONFIG.invoiceDownloadTimeout }),
      reports.breakdownDownloadButton().click(),
    ]);
    return savePdf(page, download, `12412_TS10-payment-breakdown-${vehicleNo}`, [tx.txNo]);
  });
  await test.step(`Payment Breakdown Report: 1 row for ${tx.txNo}, eAuto 20.00 + Service Tax 1.60 = RM21.60`, async () => {
    const t = text.replace(/\s+/g, ' ').toUpperCase();
    const count = t.split(tx.txNo.toUpperCase()).length - 1;
    // A row runs from its transaction no. to the next one (or "Jumlah").
    const start = t.indexOf(tx.txNo.toUpperCase());
    const rest = start >= 0 ? t.slice(start + tx.txNo.length) : '';
    const end = rest.search(/J\d{9}|JUMLAH/);
    const row = start >= 0 ? t.slice(start, start + tx.txNo.length + (end >= 0 ? end : rest.length)) : '';
    detail('Breakdown row', row || 'not found');
    expect(count, `Rows for ${tx.txNo} in the Payment Breakdown Report PDF`).toBe(1);
    expect.soft(row, 'Breakdown row: transaction type JomCheck').toContain('JOMCHECK');
    expect.soft(row, 'Breakdown row: eAuto 20.00 then Service Tax 1.60').toMatch(/20\.00\s*1\.60/);
  });
});

// ── TS11 ──────────────────────────────────────────────────────────────────
// Download Payment Document offers only weeks that have ended — the run is
// skipped (not failed) while the transaction's week is still open.
test('12412_TS11: Verify the Download Payment Document zip carries the 2-line invoice and e-Invoice', async ({ page }) => {
  test.setTimeout(15 * 60_000);
  const vehicleNo = process.env.JOMCHECK_12412_TS11_VEHICLE_NO;
  if (!vehicleNo) throw new Error('JOMCHECK_12412_TS11_VEHICLE_NO is required — pick a "New purchase, after deployment" record.');

  const login = new LoginPage(page);
  const listing = new UcdJomCheckTransactionListingPage(page);
  await test.step('Log in to UCD', async () => { await login.login(getUser('ucd')); });
  await test.step(`Open the UCD JomCheck Transaction Listing and search ${vehicleNo}`, async () => {
    await listing.goto();
    await listing.searchByVehicleNo(vehicleNo);
  });
  const tx = await test.step(`Read the newest Approved transaction of ${vehicleNo}`, async () => {
    const rows = await listing.readRows();
    const row = rows.find(r => /Approved/i.test(r.txStatus));
    expect(row, `No Approved transaction listed for ${vehicleNo}`).toBeTruthy();
    await listing.highlightRow(row!.index);
    detail('Transaction', `${row!.transactionNo} · ${row!.createdAt}`);
    return { txNo: row!.transactionNo, date: parseListingDate(row!.createdAt) };
  });

  const reports = new UcdReportsPage(page);
  await test.step('Open Reports > Download Payment Document', async () => { await reports.gotoPaymentDocument(); });
  await test.step('Set Payment Month and Year of the transaction, select JomCheck and click Generate', async () => {
    await reports.generatePaymentDocuments(tx.date);
  });
  const week = await test.step('Find the week of the transaction', async () => {
    const weeks = await reports.readWeeks();
    detail('Weeks', weeks.map(w => `${w.period} (${w.totalTransactions.trim()})${w.hasDownload ? '' : ' no link'}`).join(' | '));
    const w = weeks.find(x => tx.date >= x.start && tx.date <= x.end);
    expect(w, `No week row covers ${tx.date.toDateString()}`).toBeTruthy();
    await reports.highlightWeek(w!.index);
    return w!;
  });
  test.skip(!week.hasDownload, `The week ${week.period} has not ended — Download Payment Document only offers past weeks. Run TS11 after ${week.end.toDateString()}.`);

  const entries = await test.step(`Click Download on ${week.period} and save the zip`, async () => {
    const download = await reports.downloadWeek(week.index);
    await reports.saveDownloadAsEvidence(download, `12412_TS11-payment-documents-${vehicleNo}`);
    const tmp = path.join(os.tmpdir(), `12412-ts11-${Date.now()}.zip`);
    await download.saveAs(tmp);
    try { return readZip(fs.readFileSync(tmp)); } finally { fs.rmSync(tmp, { force: true }); }
  });

  const docs = await test.step(`Zip: Invoice PDF and e-Invoice PDF of ${vehicleNo}`, async () => {
    detail('Zip files', `${entries.length} (${entries.filter(e => /_Invoice\.pdf$/i.test(e.name)).length} Invoice, ${entries.filter(e => /_e-Invoice\.pdf$/i.test(e.name)).length} e-Invoice)`);
    const ref = new RegExp(`JOM\\d{6,}-${vehicleNo}`, 'i');
    let invoice: { name: string; data: Buffer; text: string } | undefined;
    for (const e of entries.filter(x => /_Invoice\.pdf$/i.test(x.name))) {
      const text = (await pdfParse(e.data)).text;
      if (ref.test(text.replace(/\s+/g, ''))) { invoice = { ...e, text }; break; }
    }
    expect(invoice, `No Invoice PDF in the zip carries payment reference JOM…-${vehicleNo}`).toBeTruthy();
    const code = /(EA-[A-Z]{2}-\d{4}-\d+)_/.exec(invoice!.name)?.[1] ?? '';
    const eEntry = entries.find(x => x.name.includes(`${code}_`) && /_e-Invoice\.pdf$/i.test(x.name));
    detail('Files', `${invoice!.name.split('/').pop()} · ${eEntry ? eEntry.name.split('/').pop() : 'no e-Invoice file'}`);
    expect(eEntry, `The zip has no e-Invoice PDF for ${code}`).toBeTruthy();
    const eText = (await pdfParse(eEntry!.data)).text;

    // Keep both PDFs and a highlighted screenshot of each in evidence.
    const dir = process.env.PW_EVIDENCE_DIR;
    if (dir) {
      fs.mkdirSync(dir, { recursive: true });
      for (const [kind, data, t, isE] of [['invoice', invoice!.data, invoice!.text, false], ['einvoice', eEntry!.data, eText, true]] as const) {
        const file = path.join(dir, `12412_TS11-zip-${kind}-${vehicleNo}.pdf`);
        fs.writeFileSync(file, data);
        await capturePdfWithHighlights(page, file, `12412_TS11-zip-${kind}-${vehicleNo}-checked`,
          buildHighlightSpec(t.replace(/\s+/g, ' ').toUpperCase(), isE, 'two-line'),
          `${code} ${isE ? 'e-Invoice' : 'Invoice'} from the zip — expected 2 lines. Green = correct, red = wrong or missing.`);
      }
    }
    return { invoice: invoice!.text, eInvoice: eText };
  });

  await test.step('Invoice PDF: line 1 "JomCheck report" RM18.00 + RM1.44 = RM19.44, line 2 "JomCheck service charge" RM2.00 + RM0.16 = RM2.16', async () => {
    expectTwoLineBreakdown(docs.invoice, 'Zip Invoice');
  });
  await test.step('e-Invoice PDF: same 2 lines as the Invoice PDF, code 022 on each line', async () => {
    expectTwoLineBreakdown(docs.eInvoice, 'Zip e-Invoice');
    expectSameLines(docs.invoice, docs.eInvoice, 'Zip Invoice vs e-Invoice');
    expectClassificationCodes(docs.eInvoice, 2, 'Zip e-Invoice');
  });
});
