import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { UcdJomCheckPurchasePage } from '../pages/UcdJomCheckPurchasePage';
import { UcdJomCheckTransactionListingPage } from '../pages/UcdJomCheckTransactionListingPage';
import { UcdJomCheckTransactionDetailsPage } from '../pages/UcdJomCheckTransactionDetailsPage';
import { getUser } from '../data/users';
import { lookUpTransactionNo } from '../utils/transactionLookup';
import { registerEsimRestoreHook, setResultFailedAndBuy } from '../utils/esimPurchase';
import { extractInvoiceFacts, logEInvoiceHeader } from '../utils/invoicePdf';

// EAINT-12412 — test data that must exist BEFORE the CR reaches staging.
// SRD v1.0 REQ-001: the breakdown applies by APPROVAL date/time, so the
// "approved before deployment" (TS08) and "created before, approved after"
// (TS09) cases cannot be made once the code is on the env. Run these on the
// chosen env before the dev push.
//
// NOT tied to any TS (Faizuddin, 2026-10-15: "for every test data
// preparation, it will not automatically connect it to any TS ... so if the
// first run failed, i have multiple test data i can choose from"). Each
// passed run adds one record to the dashboard's test data pool (read from the
// "Vehicle No." / "Transaction No." / "Transaction ID" DETAIL lines — keep
// those labels exact); the person picks which record a TS uses. The
// dashboard can queue several runs of one setup, each on its own vehicle no.
//
// Setup runs do not record; they print DETAIL lines (vehicle no.,
// transaction no., transaction id) and save the pre-deployment invoice /
// e-Invoice PDFs as evidence so the "before" copy exists for comparison.

const detail = (label: string, value: string) => console.log(`DETAIL:${JSON.stringify({ label, value })}`);

test('12412_SETUP_APPROVED: create an Approved JomCheck transaction (pre-deployment test data)', async ({ page }) => {
  test.setTimeout(25 * 60_000);
  const vehicleNo = process.env.JOMCHECK_12412_SETUP_APPROVED_VEHICLE_NO;
  if (!vehicleNo) throw new Error('JOMCHECK_12412_SETUP_APPROVED_VEHICLE_NO is required for this scenario.');

  const login = new LoginPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);
  const listing = new UcdJomCheckTransactionListingPage(page);
  const details = new UcdJomCheckTransactionDetailsPage(page);

  await test.step('Log in to UCD', async () => { await login.login(getUser('ucd')); });
  await test.step('Open the JomCheck purchase page', async () => { await purchase.goto(); });
  await test.step(`Enter vehicle number ${vehicleNo} and submit`, async () => { await purchase.submitVehicleNo(vehicleNo); });
  await test.step('Confirm the vehicle was found', async () => {
    expect(await purchase.getResultText()).toContain('Vehicle number found');
  });
  await test.step('Click Pay Now', async () => { await purchase.payNow(); });
  await test.step('Confirm the payment completed', async () => {
    expect(await purchase.isReportReady()).toBe(true);
  });

  const transactionId = await purchase.getTransactionId();
  const tx = await lookUpTransactionNo(page, purchase, { vehicleNo });
  detail('Vehicle No.', vehicleNo);
  detail('Transaction ID', transactionId);

  await test.step(`Open the details of transaction ${tx}`, async () => {
    await listing.searchByTransactionNo(tx);
    await listing.openResult(0);
  });
  await test.step('Confirm the transaction is Approved', async () => {
    const status = await details.getStatus();
    detail('Transaction status', status);
    expect(status).toMatch(/Approved/i);
  });
  await test.step('Download the pre-deployment Invoice and save it as evidence', async () => {
    const inv = await details.downloadInvoiceAsText(`12412_SETUP_APPROVED-invoice-before-${vehicleNo}`, 'one-line');
    const facts = extractInvoiceFacts(inv.text);
    detail('Pre-deployment invoice — document code', facts.documentCode || '-');
    detail('Pre-deployment invoice — line items', `${facts.hasLine1 ? 'JomCheck report + ' : ''}${facts.hasLine2 ? 'JomCheck service charge' : '(none recognised)'}`);
  });
  await test.step('Wait for the e-Invoice button (LHDN validation) and save the pre-deployment e-Invoice', async () => {
    const ready = await details.waitForEInvoiceButton();
    if (!ready) {
      detail('Pre-deployment e-Invoice', 'button did not appear within the wait — download it by hand later');
      return;
    }
    const einv = await details.downloadEInvoiceAsText(`12412_SETUP_APPROVED-einvoice-before-${vehicleNo}`, 'one-line');
    logEInvoiceHeader(einv.text, 'Pre-deployment e-Invoice');
    detail('LHDN Response Status', await details.getLhdnResponseStatus());
  });
});

// Failed transaction: eSim REPORT Result = "Failed" for the vehicle's
// prefix, then a UCD purchase that pays but cannot generate the report
// (same precondition as 12339_TS31, knowledge/flow-jomcheck.md §7y). Needs
// the VPN. eSim is restored after the test, pass or fail.
registerEsimRestoreHook();

test('12412_SETUP_FAILED: create a Failed JomCheck transaction (pre-deployment test data, eSim Result = Failed)', async ({ page }) => {
  test.setTimeout(20 * 60_000);
  const vehicleNo = process.env.JOMCHECK_12412_SETUP_FAILED_VEHICLE_NO;
  if (!vehicleNo) throw new Error('JOMCHECK_12412_SETUP_FAILED_VEHICLE_NO is required for this scenario.');

  const { purchase, errorMessage } = await setResultFailedAndBuy(page, vehicleNo);
  detail('Vehicle No.', vehicleNo);
  detail('UCD error after Pay Now', errorMessage);
  const transactionId = await purchase.getTransactionId().catch(() => '');
  if (transactionId) detail('Transaction ID', transactionId);

  const listing = new UcdJomCheckTransactionListingPage(page);
  await test.step(`Open the UCD JomCheck Transaction Listing and search ${vehicleNo}`, async () => {
    await listing.goto();
    await listing.searchByVehicleNo(vehicleNo);
  });
  await test.step('Confirm the newest row shows Payment OK and Transaction Status Failed', async () => {
    const rows = await listing.readRows();
    expect(rows.length, `No transaction listed for ${vehicleNo}`).toBeGreaterThan(0);
    const row = rows[0];
    await listing.highlightRow(row.index);
    detail('Transaction No.', row.transactionNo || '-');
    detail('Payment', row.payment);
    detail('Tx Status', row.txStatus);
    expect(row.payment).toMatch(/OK|Success|Paid/i);
    expect(row.txStatus).toMatch(/Fail/i);
  });
});
