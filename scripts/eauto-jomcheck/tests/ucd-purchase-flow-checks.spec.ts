import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { UcdJomCheckPurchasePage } from '../pages/UcdJomCheckPurchasePage';
import { UcdJomCheckTransactionListingPage } from '../pages/UcdJomCheckTransactionListingPage';
import { UcdJomCheckTransactionDetailsPage } from '../pages/UcdJomCheckTransactionDetailsPage';
import { BoJomCheckReportListingPage } from '../pages/BoJomCheckReportListingPage';
import { getUser } from '../data/users';
import { crosscheckPdfWithListing } from '../utils/pdfCrosscheck';
import { lookUpTransactionNo } from '../utils/transactionLookup';

// EAINT-12339 — TS01, TS02, TS03, TS04 (section A of the 37-scenario
// workbook, "UCD — JOMCHECK PURCHASE & REPORT"). Each is its own independent
// test — same reasoning as the TS06/TS18 split: they check different
// things, so they stay separately selectable and each gets its own fresh
// vehicle no. (or chassis no., for TS03) to avoid colliding when run
// together.

/** TS01 / TS03 expected result #2: a NEW transaction shows real v2.0 values
 *  in the 3 re-sourced columns (never blank, never the deprecated-field
 *  "N/A") and Yes/No in the 2 new columns (Field Reference sheet). */
async function expectNewTransactionFields(listing: BoJomCheckReportListingPage, tx: string): Promise<void> {
  for (const column of ['Odometer Reading', 'Type of Claim', 'Total No. of Parts Approved for Change'] as const) {
    for (const value of await listing.readMultiClaimColumn(tx, column)) {
      expect(value, `${column} is blank`).not.toBe('');
      expect(value.toUpperCase(), `${column} shows N/A/null`).not.toMatch(/^(N\/A|NULL)$/);
    }
  }
  expect(await listing.readRawCell(tx, 'Possible Total Loss')).toMatch(/^(Yes|No)$/);
  expect(await listing.readRawCell(tx, 'Possible BER')).toMatch(/^(Yes|No)$/);
}

test('12339_TS01: Verify UCD able to purchase JomCheck and the details are displayed correctly', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS01_VEHICLE_NO
    || `HXA${String(Date.now() % 10000).padStart(4, '0')}A`;

  const login = new LoginPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);
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
    const afterSubmit = await purchase.getResultText();
    expect(afterSubmit).toContain('Vehicle number found');
  });

  await test.step('Click Pay Now', async () => {
    await purchase.payNow();
  });

  await test.step('Confirm the payment completed', async () => {
    // payNow() itself already waits for the "Download Report" button to
    // appear (the real completion signal) — this just asserts that
    // explicitly as its own step, rather than matching #result wording,
    // which isn't reliable for a real API-connected payment. Faizuddin,
    // 2026-10-03: "after clicking pay now, the automation still checks the
    // wording for Vehicle Number Found. by right, shouldnt check that
    // anymore."
    expect(await purchase.isReportReady()).toBe(true);
  });

  await test.step('Download the report', async () => {
    const download = await purchase.downloadReport();
    expect(download.suggestedFilename()).toBeTruthy();
  });

  const tx = await lookUpTransactionNo(page, purchase, { vehicleNo });

  await test.step('Log out of UCD and log in to BackOffice', async () => {
    await login.logout();
    await login.login(getUser('bo'));
  });

  await test.step('Open the JomCheck Report Listing', async () => {
    await listing.goto();
  });

  await test.step(`Search by vehicle number ${vehicleNo}`, async () => {
    await listing.searchByVehicleNo(vehicleNo);
  });

  await test.step('Confirm the transaction shows up in the listing', async () => {
    expect(await listing.findRowIndexByTransactionNo(tx), `Transaction ${tx} is not in the listing`).toBeGreaterThanOrEqual(0);
  });

  await test.step('Read the 5 re-sourced/new fields for this transaction', async () => {
    const odometer = await listing.readRawCell(tx, 'Odometer Reading');
    const typeOfClaim = await listing.readRawCell(tx, 'Type of Claim');
    const partsApproved = await listing.readRawCell(tx, 'Total No. of Parts Approved for Change');
    const possibleTotalLoss = await listing.readRawCell(tx, 'Possible Total Loss');
    const possibleBer = await listing.readRawCell(tx, 'Possible BER');
    console.log(`DETAIL:${JSON.stringify({ label: 'Odometer Reading', value: odometer })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Type of Claim', value: typeOfClaim })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Total No. of Parts Approved', value: partsApproved })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Possible Total Loss', value: possibleTotalLoss })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Possible BER', value: possibleBer })}`);
    await expectNewTransactionFields(listing, tx);
  });
});

// TS02's own precondition is "Must connect to JomCheck API" — per the
// workbook's Golden Rule #1/#2, that's exactly the mode where the
// downloaded Report PDF carries REAL details worth cross-checking (an
// eSim-connected run gets a dummy PDF, which is why TS01/TS18/etc. cross-
// check against eSim instead of the PDF). So the hard `toContain` assertions
// below assume this precondition holds — if the environment isn't actually
// API-connected, expect this test to fail for a reason outside the
// automation's control, not a script bug.
//
// Faizuddin, 2026-10-03: "values returned from JomCheck API is random and
// cannot be set. so only crosscheck the details from the PDF and the
// JomCheck Report Listing" — this test never asserts a specific EXPECTED
// value for any field; every check here is PDF-vs-Listing agreement, never
// "field X should equal Y". And: "since the data used is real Vehicles,
// its possible that the listing will show multiple rows, transactions made
// by other users" — the listing search can return more than one row for
// reasons beyond this suite's own reruns, because these are REAL, shared
// vehicles other testers' systems may also transact against. So the row is
// found by this purchase's Transaction No. (looked up in the UCD listing
// from the purchase form's transaction ID), never by position.
test('12339_TS02: Verify UCD JomCheck reports are displayed correctly', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS02_VEHICLE_NO
    || `HXA${String((Date.now() + 4) % 10000).padStart(4, '0')}A`;

  const login = new LoginPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);
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
    const afterSubmit = await purchase.getResultText();
    expect(afterSubmit).toContain('Vehicle number found');
  });

  await test.step('Click Pay Now', async () => {
    await purchase.payNow();
  });

  await test.step('Confirm the payment completed', async () => {
    // payNow() itself already waits for the "Download Report" button to
    // appear (the real completion signal) — this just asserts that
    // explicitly as its own step, rather than matching #result wording,
    // which isn't reliable for a real API-connected payment. Faizuddin,
    // 2026-10-03: "after clicking pay now, the automation still checks the
    // wording for Vehicle Number Found. by right, shouldnt check that
    // anymore."
    expect(await purchase.isReportReady()).toBe(true);
  });

  const pdfText = await test.step('Download the report and extract its text', async () => {
    return purchase.downloadReportAsText(`12339_TS02-report-${vehicleNo}`);
  });

  const tx = await lookUpTransactionNo(page, purchase, { vehicleNo });

  await test.step('Log out of UCD and log in to BackOffice', async () => {
    await login.logout();
    await login.login(getUser('bo'));
  });

  await test.step('Open the JomCheck Report Listing', async () => {
    await listing.goto();
  });

  await test.step(`Search by vehicle number ${vehicleNo}`, async () => {
    await listing.searchByVehicleNo(vehicleNo);
  });

  await test.step('Confirm the transaction shows up in the listing', async () => {
    // A real vehicle can carry many rows (earlier runs, other testers), so
    // the row is found by this purchase's Transaction No., never row 0.
    expect(await listing.findRowIndexByTransactionNo(tx), `Transaction ${tx} is not in the listing`).toBeGreaterThanOrEqual(0);
  });

  await test.step('Crosscheck the Report PDF against the JomCheck Report Listing', async () => {
    await crosscheckPdfWithListing(listing, pdfText, vehicleNo, tx);
  });

  // Reviewed workbook, expected result #3: no "N/A" in the PDF from the
  // deprecated fields (ClaimType, ApprovedParts, Mileage). The live v2.0 PDF
  // (VML4392, 2026-10-01) has no "N/A" anywhere, so any "N/A" token is a fail.
  await test.step('Confirm the Report PDF shows no "N/A" from the deprecated fields', async () => {
    const hits = pdfText.match(/(^|[^A-Z])N\/A([^A-Z]|$)/g) ?? [];
    console.log(`DETAIL:${JSON.stringify({ label: '"N/A" in the Report PDF', value: String(hits.length) })}`);
    expect(hits.length, '"N/A" found in the Report PDF').toBe(0);
  });
});

test('12339_TS03: Verify JomCheck report purchased by Chassis No. shows the same re-sourced fields as purchase by Vehicle No.', async ({ page }) => {
  const chassisNo = process.env.JOMCHECK_TS03_CHASSIS_NO;
  if (!chassisNo) throw new Error('JOMCHECK_TS03_CHASSIS_NO is required for this scenario.');

  const login = new LoginPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);
  const listing = new BoJomCheckReportListingPage(page);

  await test.step('Log in to UCD', async () => {
    await login.login(getUser('ucd'));
  });

  await test.step('Open the JomCheck purchase page', async () => {
    await purchase.goto();
  });

  await test.step(`Enter chassis number ${chassisNo} and submit`, async () => {
    await purchase.submitChassisNo(chassisNo);
  });

  await test.step('Confirm the vehicle was found', async () => {
    // A chassis-no submission replies "Chassis number found." — NOT "Vehicle
    // number found." like the vehicle-no path. Confirmed live, 2026-10-03,
    // after TS03 failed asserting the vehicle-no wording here. See
    // knowledge/flow-jomcheck.md § chassis-no result wording.
    const afterSubmit = await purchase.getResultText();
    expect(afterSubmit).toContain('Chassis number found');
  });

  await test.step('Click Pay Now', async () => {
    await purchase.payNow();
  });

  await test.step('Confirm the payment completed', async () => {
    // payNow() itself already waits for the "Download Report" button to
    // appear (the real completion signal) — this just asserts that
    // explicitly as its own step, rather than matching #result wording,
    // which isn't reliable for a real API-connected payment. Faizuddin,
    // 2026-10-03: "after clicking pay now, the automation still checks the
    // wording for Vehicle Number Found. by right, shouldnt check that
    // anymore."
    expect(await purchase.isReportReady()).toBe(true);
  });

  await test.step('Download the report', async () => {
    const download = await purchase.downloadReport();
    expect(download.suggestedFilename()).toBeTruthy();
  });

  const tx = await lookUpTransactionNo(page, purchase, { chassisNo });

  await test.step('Log out of UCD and log in to BackOffice', async () => {
    await login.logout();
    await login.login(getUser('bo'));
  });

  await test.step('Open the JomCheck Report Listing', async () => {
    await listing.goto();
  });

  await test.step(`Search by chassis number ${chassisNo}`, async () => {
    await listing.searchByChassisNo(chassisNo);
  });

  await test.step('Confirm the transaction shows up in the listing', async () => {
    // A reused chassis no. can carry earlier rows, so the row is found by
    // this purchase's Transaction No., never row 0.
    expect(await listing.findRowIndexByTransactionNo(tx), `Transaction ${tx} is not in the listing`).toBeGreaterThanOrEqual(0);
  });

  await test.step('Confirm the same re-sourced columns show correctly as a Vehicle No. purchase', async () => {
    const odometer = await listing.readRawCell(tx, 'Odometer Reading');
    const typeOfClaim = await listing.readRawCell(tx, 'Type of Claim');
    const partsApproved = await listing.readRawCell(tx, 'Total No. of Parts Approved for Change');
    const possibleTotalLoss = await listing.readRawCell(tx, 'Possible Total Loss');
    const possibleBer = await listing.readRawCell(tx, 'Possible BER');
    console.log(`DETAIL:${JSON.stringify({ label: 'Odometer Reading', value: odometer })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Type of Claim', value: typeOfClaim })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Total No. of Parts Approved', value: partsApproved })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Possible Total Loss', value: possibleTotalLoss })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Possible BER', value: possibleBer })}`);
    await expectNewTransactionFields(listing, tx);
  });
});

test('12339_TS04: Verify UCD JomCheck purchase flow, price prompt and e-Invoice/report buttons are unchanged', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS04_VEHICLE_NO
    || `HXA${String((Date.now() + 2) % 10000).padStart(4, '0')}A`;

  const login = new LoginPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);
  const listing = new UcdJomCheckTransactionListingPage(page);
  const details = new UcdJomCheckTransactionDetailsPage(page);

  await test.step('Log in to UCD', async () => {
    await login.login(getUser('ucd'));
  });

  await test.step('Open the JomCheck purchase page', async () => {
    await purchase.goto();
  });

  await test.step(`Enter vehicle number ${vehicleNo} and submit`, async () => {
    await purchase.submitVehicleNo(vehicleNo);
  });

  await test.step('Check the Pay Now prompt wording', async () => {
    const prompt = await purchase.getFullPromptText();
    expect(prompt).toBe('Vehicle number found. Pay now (RM20.00 + 8% Service Tax) to purchase the report.');
  });

  await test.step('Click Pay Now', async () => {
    await purchase.payNow();
  });

  await test.step('Confirm the payment completed', async () => {
    // payNow() itself already waits for the "Download Report" button to
    // appear (the real completion signal) — this just asserts that
    // explicitly as its own step, rather than matching #result wording,
    // which isn't reliable for a real API-connected payment. Faizuddin,
    // 2026-10-03: "after clicking pay now, the automation still checks the
    // wording for Vehicle Number Found. by right, shouldnt check that
    // anymore."
    expect(await purchase.isReportReady()).toBe(true);
  });

  // Opens the listing and searches by vehicle no. on the way.
  const tx = await lookUpTransactionNo(page, purchase, { vehicleNo });

  await test.step(`Search by Transaction No. ${tx}`, async () => {
    await listing.searchByTransactionNo(tx);
  });

  await test.step('Confirm only this transaction shows up in the listing', async () => {
    expect(await listing.getResultCount()).toBe(1);
  });

  await test.step('Open the Transaction Details', async () => {
    await listing.openResult(0);
  });

  // e-Invoice ignored for now — it only appears after approval, minutes after
  // payment (see UcdJomCheckTransactionDetailsPage.areActionButtonsVisible).
  await test.step('Confirm the Invoice and Report buttons are present (e-Invoice not checked — appears only after approval)', async () => {
    expect(await details.areActionButtonsVisible()).toBe(true);
  });
});
