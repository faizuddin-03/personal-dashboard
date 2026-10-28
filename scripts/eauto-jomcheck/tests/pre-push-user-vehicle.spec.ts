import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import pdfParse from 'pdf-parse';
import { LoginPage } from '../pages/LoginPage';
import { UcdJomCheckPurchasePage } from '../pages/UcdJomCheckPurchasePage';
import { UcdJomCheckTransactionListingPage, UcdListingRow } from '../pages/UcdJomCheckTransactionListingPage';
import { UcdJomCheckTransactionDetailsPage } from '../pages/UcdJomCheckTransactionDetailsPage';
import { BoJomCheckReportListingPage, REPORT_LISTING_COLUMNS } from '../pages/BoJomCheckReportListingPage';
import { BoJomCheckTransactionEnquiryPage, EnquiryRow } from '../pages/BoJomCheckTransactionEnquiryPage';
import { BoJomCheckTransactionDetailsPage } from '../pages/BoJomCheckTransactionDetailsPage';
import { getUser } from '../data/users';
import { PRE_PUSH_REPORTS } from '../data/prePushTransaction';
import { lookUpTransactionNo } from '../utils/transactionLookup';
import { registerEsimRestoreHook, setResultFailedAndBuy, setClaimsAndBuy, vehicleNoFor } from '../utils/esimPurchase';

// TS31 edits eSim (Result = Failed, then back) — restore after every test.
registerEsimRestoreHook();

// EAINT-12339 — TS05 (section A), TS27 and TS31 (section C). All three need
// a transaction made BEFORE the CR was pushed to staging. None is recorded in
// the repo except HXJ0001, so the person types the vehicle no. in the
// dashboard (Faizuddin, 2026-10-04: "allow user to input vehicle number for
// the automation to check"). Each reads its own env var and fails at once
// when it is missing — there is no safe default.
//
// How each test picks the pre-push row out of everything the vehicle has:
//  TS05 — the vehicle's saved pre-push report (PRE_PUSH_REPORTS) names its
//         Transaction No.; otherwise the OLDEST "Approved" row.
//  TS27 — a BO listing row whose Possible Total Loss is "N/A" (pre-push
//         behaviour, the same marker TS29 asserts) with ONE claim.
//  TS31 — the OLDEST row with Payment "OK" and Tx Status "Failed".
// The row picked is printed as a DETAIL line so a reviewer can confirm it.

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

function vehicleNoFrom(envVar: string): string {
  const v = (process.env[envVar] || '').trim().toUpperCase();
  if (!v) throw new Error(`${envVar} is not set — type the vehicle no. of a pre-push transaction in the dashboard.`);
  return v;
}

const detail = (label: string, value: string) => console.log(`DETAIL:${JSON.stringify({ label, value })}`);
const describeRow = (r: UcdListingRow) =>
  `${r.transactionNo} | ${r.createdAt} | Payment ${r.payment} | Tx ${r.txStatus}`;

// ── TS05 ─────────────────────────────────────────────────────────────────
// Expected result #2 ("identical to the copy saved before the push") is
// checked two ways:
//  a) when a saved pre-push PDF exists for this vehicle (HXJ0001 only), the
//     downloaded text must equal it exactly;
//  b) always: the PDF must still print the PRE-CR claim table ("MILEAGE **"
//     header), not the v2.0 one ("FILLING CATEGORY" / "INCIDENTS SEVERITY
//     SCALE" — seen on a post-push PDF, knowledge/flow-jomcheck.md §7j). A
//     report with no claims prints no table, so (b) is skipped with a note.
test('12339_TS05: Verify UCD Report button for a JomCheck transaction purchased BEFORE the CR was pushed downloads the report as originally generated', async ({ page }) => {
  const vehicleNo = vehicleNoFrom('JOMCHECK_TS05_VEHICLE_NO');
  const saved = PRE_PUSH_REPORTS[vehicleNo];

  const login = new LoginPage(page);
  const ucdListing = new UcdJomCheckTransactionListingPage(page);
  const details = new UcdJomCheckTransactionDetailsPage(page);

  await test.step('Log in to UCD', async () => {
    await login.login(getUser('ucd'));
  });

  await test.step(`Open the JomCheck Transaction Listing and search by vehicle number ${vehicleNo}`, async () => {
    await ucdListing.goto();
    await ucdListing.searchByVehicleNo(vehicleNo);
  });

  const target = await test.step('Pick the pre-push transaction and record its Transaction No. and purchase date', async () => {
    const rows = await ucdListing.readRows();
    expect(rows.length, `No UCD transaction found for ${vehicleNo}`).toBeGreaterThan(0);
    const row = saved
      ? rows.find(r => r.transactionNo === saved.transactionNo)
      : [...rows].reverse().find(r => r.txStatus === 'Approved');
    expect(row, saved
      ? `Saved pre-push transaction ${saved.transactionNo} is not in the listing for ${vehicleNo}`
      : `${vehicleNo} has no "Approved" transaction`).toBeTruthy();
    await ucdListing.highlightRow(row!.index);
    detail('Transaction No.', row!.transactionNo);
    detail('Purchase date', row!.createdAt);
    detail('Picked by', saved ? 'saved pre-push report' : 'oldest Approved row');
    return row!;
  });

  await test.step(`Open transaction ${target.transactionNo}`, async () => {
    await ucdListing.openResult(target.index);
  });

  await test.step('Confirm the Invoice and Report buttons are still there (no layout change)', async () => {
    expect(await details.getStatus()).toContain('Approved');
    expect(await details.areActionButtonsVisible()).toBe(true);
  });

  const report = await test.step('Click Report and save the downloaded report', async () => {
    return details.downloadReportAsText(`12339_TS05-report-${vehicleNo}`);
  });

  await test.step('Confirm the report downloaded as a PDF', async () => {
    detail('Downloaded file', `${report.fileName} (${report.bytes} bytes)`);
    expect(report.fileName.toLowerCase()).toMatch(/\.pdf$/);
    expect(report.text.length, 'The report PDF has no text').toBeGreaterThan(0);
  });

  if (saved) {
    await test.step('Compare the report with the copy saved before the push', async () => {
      const buf = fs.readFileSync(path.join(REPO_ROOT, saved.pdf));
      const savedText = (await pdfParse(buf)).text.replace(/\s+/g, ' ').trim().toUpperCase();
      detail('Saved copy', saved.pdf);
      if (report.text !== savedText) {
        let at = 0;
        while (at < report.text.length && report.text[at] === savedText[at]) at++;
        detail('First difference', `downloaded: "${report.text.slice(at, at + 80)}" | saved: "${savedText.slice(at, at + 80)}"`);
      }
      expect(report.text === savedText, 'The downloaded report differs from the copy saved before the push').toBe(true);
    });
  }

  await test.step('Confirm the report still prints the pre-CR claim table, not the v2.0 one', async () => {
    if (report.text.includes('NO PREVIOUSLY APPROVED HISTORY')) {
      detail('Claim table', 'none — the report has no claims, so the table-format check does not apply');
      return;
    }
    const v20 = ['FILLING CATEGORY', 'INCIDENTS SEVERITY SCALE', 'ODOMETER READING **'].filter(h => report.text.includes(h));
    detail('Claim table header', v20.length ? `v2.0 (${v20.join(', ')})` : 'pre-CR ("MILEAGE **")');
    expect(v20, 'The report prints the v2.0 claim table — it was regenerated').toEqual([]);
    expect(report.text, 'The report has no pre-CR "MILEAGE **" claim table').toContain('MILEAGE **');
  });
});

// ── Finding a pre-push transaction ───────────────────────────────────────
// TS27 and TS31 take the vehicle no. TYPED in the dashboard (required). The
// search for a usable pre-push transaction is a separate, headless, fast run
// behind the "Find data" button on each row — tests/find-pre-push-data.spec.ts
// + utils/prePushFinder.ts — whose result the person pastes into the field.
// Faizuddin, 2026-10-05: "revert the TS27 and 31 to accept value, and run the
// checking" (the in-test search made the TS itself too slow).

// ── TS27 ─────────────────────────────────────────────────────────────────
// "Value recorded in step 1 (DB or pre-push evidence)" — no stored values
// exist for a 1-claim pre-push transaction, so the test checks the EXISTING
// behaviour instead: one bare value per column (no "1." numbering), not
// blank, and in the pre-CR form — a raw figure for Odometer Reading and
// Parts, never a v2.0 band ("x to y km" / "x to y parts"). The values read
// are printed so they can be compared with DB/evidence by hand.
test('12339_TS27: Verify an existing (pre-push) transaction with 1 claim keeps the existing single-value display', async ({ page }) => {
  const vehicleNo = vehicleNoFrom('JOMCHECK_TS27_VEHICLE_NO');
  const login = new LoginPage(page);
  const listing = new BoJomCheckReportListingPage(page);
  const claimColumns = ['Odometer Reading', 'Type of Claim', 'Total No. of Parts Approved for Change'] as const;

  await test.step('Log in to BackOffice', async () => {
    await login.login(getUser('bo'));
  });

  await test.step('Open the JomCheck Report Listing', async () => {
    await listing.goto();
  });

  await test.step(`Search by vehicle number ${vehicleNo}`, async () => {
    await listing.searchByVehicleNo(vehicleNo);
    expect(await listing.getResultCount(), `No listing row for ${vehicleNo}`).toBeGreaterThan(0);
  });

  const row = await test.step('Find the pre-push transaction with 1 claim (Possible Total Loss "N/A", no numbering)', async () => {
    const count = await listing.getResultCount();
    const seen: string[] = [];
    for (let i = 0; i < count; i++) {
      const r = await listing.readRow(i);
      const numbered = claimColumns.some(c => /^1\./.test(r[c]));
      seen.push(`${r['Transaction Number']} (Possible Total Loss ${r['Possible Total Loss']}, ${numbered ? '2+ claims' : '1 claim'})`);
      if (r['Possible Total Loss'] === 'N/A' && !numbered && r['Odometer Reading'] !== '-') return r;
    }
    throw new Error(`${vehicleNo} has no pre-push 1-claim row. Rows found: ${seen.join('; ')}`);
  });

  await test.step(`Record transaction ${row['Transaction Number']}'s stored values`, async () => {
    detail('Transaction No.', row['Transaction Number']);
    detail('Date & Time', row['Date & Time']);
    for (const c of claimColumns) detail(c, row[c]);
  });

  for (const c of claimColumns) {
    await test.step(`${c} shows one bare value — not blank, not numbered`, async () => {
      expect(row[c], `${c} is blank`).not.toBe('');
      expect(row[c], `${c} is numbered`).not.toMatch(/^\d+\.\s/);
      expect(row[c].split('\n').length, `${c} has more than one line`).toBe(1);
    });
  }

  await test.step('Odometer Reading and Total No. of Parts keep the raw pre-CR figure, not a v2.0 range', async () => {
    expect(row['Odometer Reading'], 'Odometer Reading shows a v2.0 range').not.toMatch(/ to .* km$|^More than/i);
    expect(row['Total No. of Parts Approved for Change'], 'Parts shows a v2.0 range').not.toMatch(/ parts$|^No information/i);
  });

  await test.step('Possible Total Loss and Possible BER stay "N/A"', async () => {
    expect(row['Possible Total Loss']).toBe('N/A');
    expect(row['Possible BER']).toBe('N/A');
  });
});

// ── TS31 ─────────────────────────────────────────────────────────────────
// No pre-push data needed any more. The failed transaction is CREATED in the
// same run: eSim Result = "Failed" for the vehicle's prefix → UCD purchase
// pays but cannot generate the report (UCD shows an error; the listing shows
// Payment OK / Tx Failed) → eSim Result back to passing with one claim → a
// second purchase on the same vehicle succeeds. Faizuddin, 2026-10-05:
// "instead of searching a transaction, you can make it being changing the
// result to 'Failed' in the eSim. the field is literally called 'Result'" /
// "after clicking pay, it will show an error message, something like 'unable
// to generate report'. but after that, if we go to the listing page from UCD
// side, it will show payment okay, but transaction failed". The old failed
// row is re-found by its UUID, since a failed row can show "-" as its
// Transaction No. eSim is restored after the test (registerEsimRestoreHook).
//
// OQ-03 asks whether failed transactions appear in the BO Report Listing at
// all — so the test only REPORTS whether the old one is there, it does not
// assert either way.
test('12339_TS31: Verify an existing failed transaction remains unchanged after a new transaction is created for the same vehicle', async ({ page }) => {
  test.setTimeout(20 * 60_000);
  const vehicleNo = process.env.JOMCHECK_TS31_VEHICLE_NO || vehicleNoFor('0031');

  const login = new LoginPage(page);
  const ucdListing = new UcdJomCheckTransactionListingPage(page);
  const details = new UcdJomCheckTransactionDetailsPage(page);
  const listing = new BoJomCheckReportListingPage(page);

  await setResultFailedAndBuy(page, vehicleNo);

  await test.step(`Open the JomCheck Transaction Listing and search by vehicle number ${vehicleNo}`, async () => {
    await ucdListing.goto();
    await ucdListing.searchByVehicleNo(vehicleNo);
  });

  const before = await test.step('Confirm the failed transaction shows Payment OK, Tx Status Failed, and record it', async () => {
    const rows = await ucdListing.readRows();
    const failed = rows.find(r => r.payment === 'OK' && r.txStatus === 'Failed');
    expect(failed, `${vehicleNo} has no transaction with Payment "OK" and Tx Status "Failed" after the failed purchase. Rows: ${rows.map(describeRow).join('; ') || 'none'}`).toBeTruthy();
    expect(failed!.id, 'The failed row has no View link').not.toBe('');
    await ucdListing.highlightRow(failed!.index);
    detail('Failed transaction (before)', describeRow(failed!));
    return failed!;
  });

  await test.step('Open the failed transaction and confirm it has no report', async () => {
    await ucdListing.openResult(before.index);
    detail('Status (before)', await details.getStatus());
    expect(await details.isReportButtonVisible(), 'The failed transaction has a Report button').toBe(false);
  });

  // Second purchase, same vehicle: eSim Result back to passing with one
  // claim (setClaimsAndBuy sets Result + claims, keeps the FIRST snapshot).
  const { tx } = await setClaimsAndBuy(page, vehicleNo, [
    { 'Mileage Range': '10,001 to 20,000 km', 'Total Parts Changed': '1 to 10 parts', 'Claims Type (ICAP code)': '11' },
  ]);



  await test.step('Confirm the old failed transaction is unchanged in the UCD listing', async () => {
    const after = (await ucdListing.readRows()).find(r => r.id === before.id);
    expect(after, 'The old failed transaction is gone from the UCD listing').toBeTruthy();
    await ucdListing.highlightRow(after!.index);
    detail('Failed transaction (after)', describeRow(after!));
    const { index: _b, ...was } = before;
    const { index: _a, ...now } = after!;
    expect(now).toEqual(was);
  });

  await test.step('Open the old failed transaction again and confirm it still has no report', async () => {
    const after = (await ucdListing.readRows()).find(r => r.id === before.id)!;
    await ucdListing.openResult(after.index);
    const status = await details.getStatus();
    detail('Status (after)', status);
    expect(await details.isReportButtonVisible(), 'The failed transaction now has a Report button').toBe(false);
  });

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

  await test.step(`Confirm new transaction ${tx} shows up`, async () => {
    expect(await listing.findRowIndexByTransactionNo(tx), `Transaction ${tx} is not in the BO listing`).toBeGreaterThanOrEqual(0);
  });

  await test.step('Report whether the old failed transaction is in the BO listing (OQ-03)', async () => {
    const inListing = before.transactionNo !== '-' && (await listing.findRowIndexByTransactionNo(before.transactionNo)) >= 0;
    detail('Old failed transaction in BO listing', inListing ? `yes (${before.transactionNo})` : 'no');
  });

  const fiveColumns = ['Odometer Reading', 'Type of Claim', 'Total No. of Parts Approved for Change', 'Possible Total Loss', 'Possible BER'] as const satisfies readonly (typeof REPORT_LISTING_COLUMNS)[number][];
  for (const c of fiveColumns) {
    await test.step(`New transaction: ${c} shows a new re-sourced value`, async () => {
      const value = await listing.readRawCell(tx, c);
      detail(`New — ${c}`, value);
      expect(value, `${c} is blank`).not.toBe('');
      expect(value.toUpperCase(), `${c} shows N/A/null`).not.toMatch(/^(N\/A|NULL)$/);
    });
  }
});

// ── TS31 — EXISTING failed transaction, checked from BackOffice ─────────────
// Variant for a pre-push failed transaction made by ANOTHER UCD company
// (e.g. NH4566 / J680008308), whose UCD login we do not have. Faizuddin,
// 2026-10-05: "make it check whatever we can check through my current UCD
// and BO side. because i dont have the creds for the original account that
// made the failed transaction". So the failed row is read in BO Transaction
// Enquiry (any company) and its details page (no REPORT button); the new
// purchase is made from OUR UCD on the same vehicle; the old row is
// re-checked in BO. The vehicle no. is typed in the dashboard (the TS31
// "Find data" button lists failed transactions of every company).
const describeEnquiryRow = (r: EnquiryRow) =>
  `${r.transactionNo} | ${r.createdAt} | ${r.companyName} | Payment ${r.payment} | Tx ${r.txStatus}`;

test('12339_TS31 (existing failed transaction): Verify an existing failed transaction remains unchanged after a new transaction is created for the same vehicle', async ({ page }) => {
  test.setTimeout(15 * 60_000);
  const vehicleNo = vehicleNoFrom('JOMCHECK_TS31X_VEHICLE_NO');

  const login = new LoginPage(page);
  const enquiry = new BoJomCheckTransactionEnquiryPage(page);
  const boDetails = new BoJomCheckTransactionDetailsPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);
  const listing = new BoJomCheckReportListingPage(page);

  await test.step('Log in to BackOffice', async () => {
    await login.login(getUser('bo'));
  });

  await test.step(`Open the JomCheck Transaction Enquiry and search by vehicle number ${vehicleNo}`, async () => {
    await enquiry.goto();
    await enquiry.searchByVehicleNo(vehicleNo);
  });

  const before = await test.step('Find the failed transaction (Payment OK, Tx Status Failed) and record it', async () => {
    const rows = await enquiry.readRows();
    const failed = [...rows].reverse().find(r => r.payment === 'OK' && r.txStatus === 'Failed');
    expect(failed, `${vehicleNo} has no transaction with Payment "OK" and Tx Status "Failed" in BackOffice. Rows: ${rows.map(describeEnquiryRow).join('; ') || 'none'}`).toBeTruthy();
    await enquiry.highlightRow(failed!.index);
    detail('Failed transaction (before)', describeEnquiryRow(failed!));
    return failed!;
  });

  await test.step('Open the failed transaction in BackOffice and confirm it has no REPORT button', async () => {
    await enquiry.openResult(before.index);
    expect(await boDetails.isReportButtonVisible(), 'The failed transaction has a REPORT button').toBe(false);
  });

  await test.step('Log out of BackOffice and log in to UCD', async () => {
    await login.logout();
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

  await test.step('Log out of UCD and log in to BackOffice', async () => {
    await login.logout();
    await login.login(getUser('bo'));
  });

  await test.step(`Transaction Enquiry: the old failed transaction ${before.transactionNo} is unchanged`, async () => {
    await enquiry.goto();
    await enquiry.searchByVehicleNo(vehicleNo);
    const rows = await enquiry.readRows();
    const after = rows.find(r => r.transactionNo === before.transactionNo && r.createdAt === before.createdAt);
    expect(after, `The old failed transaction is gone from the Enquiry. Rows: ${rows.map(describeEnquiryRow).join('; ') || 'none'}`).toBeTruthy();
    await enquiry.highlightRow(after!.index);
    detail('Failed transaction (after)', describeEnquiryRow(after!));
    const { index: _b, ...was } = before;
    const { index: _a, ...now } = after!;
    expect(now).toEqual(was);
    const fresh = rows.find(r => r.transactionNo === tx);
    detail('New transaction in Enquiry', fresh ? describeEnquiryRow(fresh) : `${tx} not listed`);
  });

  await test.step('Open the old failed transaction again and confirm it still has no REPORT button', async () => {
    const rows = await enquiry.readRows();
    const after = rows.find(r => r.transactionNo === before.transactionNo && r.createdAt === before.createdAt)!;
    await enquiry.openResult(after.index);
    expect(await boDetails.isReportButtonVisible(), 'The failed transaction now has a REPORT button').toBe(false);
  });

  await test.step('Open the JomCheck Report Listing', async () => {
    await listing.goto();
  });

  await test.step(`Search by vehicle number ${vehicleNo}`, async () => {
    await listing.searchByVehicleNo(vehicleNo);
  });

  await test.step(`Confirm new transaction ${tx} shows up`, async () => {
    expect(await listing.findRowIndexByTransactionNo(tx), `Transaction ${tx} is not in the BO listing`).toBeGreaterThanOrEqual(0);
  });

  await test.step('Report whether the old failed transaction is in the BO listing (OQ-03)', async () => {
    const inListing = before.transactionNo !== '-' && (await listing.findRowIndexByTransactionNo(before.transactionNo)) >= 0;
    detail('Old failed transaction in BO listing', inListing ? `yes (${before.transactionNo})` : 'no');
  });

  const fiveColumns = ['Odometer Reading', 'Type of Claim', 'Total No. of Parts Approved for Change', 'Possible Total Loss', 'Possible BER'] as const satisfies readonly (typeof REPORT_LISTING_COLUMNS)[number][];
  for (const c of fiveColumns) {
    await test.step(`New transaction: ${c} shows a new re-sourced value`, async () => {
      const value = await listing.readRawCell(tx, c);
      detail(c, value);
      expect(value, `${c} is blank`).not.toBe('');
      expect(value, `${c} is "N/A" — the new transaction should carry a v2.0 value`).not.toBe('N/A');
    });
  }
});
