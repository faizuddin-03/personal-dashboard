import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BoJomCheckTransactionEnquiryPage } from '../pages/BoJomCheckTransactionEnquiryPage';
import { BoJomCheckTransactionDetailsPage } from '../pages/BoJomCheckTransactionDetailsPage';
import { BoJomCheckReportListingPage } from '../pages/BoJomCheckReportListingPage';
import { UcdJomCheckPurchasePage } from '../pages/UcdJomCheckPurchasePage';
import { getUser } from '../data/users';
import { crosscheckPdfWithListing } from '../utils/pdfCrosscheck';
import { lookUpTransactionNo } from '../utils/transactionLookup';

// EAINT-12339 — TS36 (section E, "BACKOFFICE — JOMCHECK TRANSACTION
// DETAILS"). Faizuddin's revised wording, 2026-10-03, adds a step ("Using
// the same VN, crosscheck the details with Jomcheck Report Listing") and an
// updated expected result beyond what the workbook file on disk currently
// shows — built to the revised text, not the stale file.
//
// Creates its OWN fresh transaction through the real JomCheck API first
// (Faizuddin, 2026-10-01: "make the automation create new jomcheck through
// JomCheck API, and crosscheck that pdf with report listing"). It used to
// reuse the old HXJ0001 transaction, whose pre-push PDF prints raw
// mileage/parts figures that can never match the Listing's v2.0 ranges
// (knowledge/flow-jomcheck.md §7j). The Enquiry is searched by this
// purchase's Transaction No. and the Listing row is found by it, so both
// steps read the SAME transaction even on a real vehicle with older rows.
// Needs staging connected to the JomCheck API, not eSim — an eSim-connected
// run gets a dummy PDF.
test('12339_TS36: Verify BackOffice JomCheck Details Page download reflects API v2.0 data', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS36_VEHICLE_NO
    || `HXA${String((Date.now() + 27) % 10000).padStart(4, '0')}A`;

  const login = new LoginPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);
  const enquiry = new BoJomCheckTransactionEnquiryPage(page);
  const details = new BoJomCheckTransactionDetailsPage(page);
  const listing = new BoJomCheckReportListingPage(page);

  await test.step('Log in to UCD', async () => {
    await login.login(getUser('ucd'));
  });

  await test.step('Open the JomCheck purchase page', async () => {
    await purchase.goto();
  });

  await test.step(`Enter vehicle number ${vehicleNo} and submit`, async () => {
    await purchase.submitVehicleNo(vehicleNo);
  });

  await test.step('Confirm the vehicle was found', async () => {
    expect(await purchase.getResultText()).toContain('Vehicle number found');
  });

  await test.step('Click Pay Now', async () => {
    await purchase.payNow();
  });

  await test.step('Confirm the payment completed', async () => {
    expect(await purchase.isReportReady()).toBe(true);
  });

  const tx = await lookUpTransactionNo(page, purchase, { vehicleNo });

  await test.step('Log out of UCD', async () => {
    await login.logout();
  });

  await test.step('Log in to BackOffice', async () => {
    await login.login(getUser('bo'));
  });

  await test.step('Open the JomCheck Transaction Enquiry', async () => {
    await enquiry.goto();
  });

  await test.step(`Search by Transaction No. ${tx}`, async () => {
    await enquiry.searchByTransactionNo(tx);
  });

  await test.step('Confirm only this transaction shows up', async () => {
    expect(await enquiry.getResultCount()).toBe(1);
  });

  await test.step('Open the Transaction Details', async () => {
    await enquiry.openResult(0);
  });

  await test.step('Confirm no layout change — Invoice and Report buttons are present (e-Invoice not checked — appears only after approval)', async () => {
    expect(await details.areActionButtonsVisible()).toBe(true);
  });

  const pdfText = await test.step('Download the report and extract its text', async () => {
    return details.downloadReportAsText(`12339_TS36-report-${vehicleNo}`);
  });

  await test.step('Open the JomCheck Report Listing', async () => {
    await listing.goto();
  });

  await test.step(`Search by vehicle number ${vehicleNo}`, async () => {
    await listing.searchByVehicleNo(vehicleNo);
  });

  await test.step(`Confirm transaction ${tx} shows up in the listing`, async () => {
    expect(await listing.findRowIndexByTransactionNo(tx), `Transaction ${tx} is not in the listing`).toBeGreaterThanOrEqual(0);
  });

  await test.step('Crosscheck the Report PDF against the JomCheck Report Listing', async () => {
    await crosscheckPdfWithListing(listing, pdfText, vehicleNo, tx);
  });
});
