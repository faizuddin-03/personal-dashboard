import { test, expect } from '@playwright/test';
import { BoJomCheckReportListingPage, REPORT_LISTING_COLUMNS } from '../pages/BoJomCheckReportListingPage';
import { PRE_PUSH } from '../data/prePushTransaction';
import { registerEsimRestoreHook, setClaimsAndPurchase, vehicleNoFor } from '../utils/esimPurchase';
import { readExport, exportRowByTransactionNo, baseHeader, claimLines, ExportCell } from '../utils/exportReader';

// EAINT-12339 — TS30 (section C) and TS32/TS33 (section D, "BACKOFFICE —
// JOMCHECK REPORT LISTING EXPORT"). Each creates its new transaction through
// eSim on the HX prefix (Faizuddin, 2026-10-01: "note that this will use
// eSim"), so the values are known in advance. Needs the VPN and staging
// connected to eSim. eSim is set up in the test's own page (in the video);
// the prefix's original state is restored after each test.
//
// ⚠ The real export file has never been captured. `utils/exportReader.ts`
// follows the SRD mock-up (.xlsx, 1 header row, multi-claim in 1 cell) and
// fails with the file's actual first bytes if it is something else. The
// export is kept as run evidence either way.

registerEsimRestoreHook();

type Column = (typeof REPORT_LISTING_COLUMNS)[number];
const AFFECTED: Column[] = [
  'Odometer Reading', 'Type of Claim', 'Total No. of Parts Approved for Change', 'Possible Total Loss', 'Possible BER',
];

const isNum = (v: string) => /^-?\d+(\.\d+)?$/.test(v.replace(/,/g, ''));
/** Listing text vs export text: same claim lines; "19172.0" equals 19172. */
function sameValue(listingText: string, exportText: string): boolean {
  const a = claimLines(listingText), b = claimLines(exportText);
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i] || (isNum(v) && isNum(b[i]) && Number(v.replace(/,/g, '')) === Number(b[i].replace(/,/g, ''))));
}

/** Every listing column that the export also has, compared. Returns mismatches. */
function compareListingToExport(
  listingRow: Record<Column, string>,
  exportRow: Record<string, ExportCell>,
  columns: readonly Column[],
): string[] {
  const out: string[] = [];
  for (const col of columns) {
    const exp = exportRow[col];
    if (!exp) { out.push(`${col}: missing from the export`); continue; }
    const ok = sameValue(listingRow[col], exp.text);
    // `value` is what the dashboard shows; a DETAIL line without it is dropped.
    console.log(`DETAIL:${JSON.stringify({ label: col, value: `listing: ${listingRow[col]} | export: ${exp.text} | ${ok ? 'match' : 'MISMATCH'}`, listing: listingRow[col], export: exp.text, match: ok })}`);
    if (!ok) out.push(`${col}: listing "${listingRow[col]}" vs export "${exp.text}"`);
  }
  return out;
}

async function exportFor(listing: BoJomCheckReportListingPage, label: string) {
  const file = await listing.downloadExport(label);
  console.log(`DETAIL:${JSON.stringify({ label: 'Export saved', value: file })}`);
  return readExport(file);
}

// TS30 buys the new JomCheck on the SAME vehicle as the existing pre-push
// transaction (Faizuddin, 2026-10-01: "the same VN with existing JomCheck,
// create a new Jomcheck, make sure the details are correct"). The vehicle no.
// is therefore always PRE_PUSH.vehicleNo — a JOMCHECK_TS30_VEHICLE_NO from
// the dashboard is ignored. Both rows come back in one search and one export.
// Same vehicle → the vehicle-detail columns must be identical between the two.
const VEHICLE_DETAIL_COLUMNS: Column[] = [
  'Vehicle Number', 'Chassis Number', 'Make / Brand', 'Model', 'Year Make', 'Variant', 'Engine CC', 'Transmission',
  'Avg. Market Value / Avg. Retail Price', 'Approx. New Car Price / Recommended Trade Price',
];
// Different per transaction by nature, so never compared old vs new.
const PER_TRANSACTION_COLUMNS: Column[] = ['#', 'Date & Time', 'Transaction Number'];

test('12339_TS30: Verify BackOffice listing and export behave identically for an existing (pre-push) transaction and a new transaction, except the 5 affected columns', async ({ page }) => {
  const vehicleNo = PRE_PUSH.vehicleNo;

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Mileage Range': '40,001 to 50,000 km', 'Total Parts Changed': '1 to 10 parts', 'Claims Type (ICAP code)': '1', 'Possible Total Loss': 'No', 'Possible BER': 'No' },
    { 'Mileage Range': '10,001 to 20,000 km', 'Total Parts Changed': '11 to 20 parts', 'Claims Type (ICAP code)': '1', 'Possible Total Loss': 'No', 'Possible BER': 'No' },
  ], // Vehicle-level flags set too, so the result does not depend on what
     // another tester left on the shared HX prefix.
  { 'Possible Total Loss': 'No', 'Possible BER': 'No' });

  const newRow = await test.step(`Read the new transaction row (${tx})`, async () => listing.readRow(tx));
  const oldRow = await test.step(`Read the existing pre-push transaction row (${PRE_PUSH.transactionNo})`, async () => listing.readRow(PRE_PUSH.transactionNo));
  const sheet = await test.step('Export XLSX (both transactions)', async () => exportFor(listing, `12339_TS30-export-${vehicleNo}`));

  await test.step('Existing transaction: 3 re-sourced columns = stored values; Possible Total Loss / BER = "N/A"', async () => {
    for (const [col, stored] of Object.entries(PRE_PUSH.claims) as [Column, readonly string[]][]) {
      expect(claimLines(oldRow[col]), col).toEqual([...stored]);
    }
    expect(oldRow['Possible Total Loss']).toBe('N/A');
    expect(oldRow['Possible BER']).toBe('N/A');
  });

  await test.step('New transaction: values from MileageRange / ClaimsType / TotalPartsChanged; Possible Total Loss / BER = Yes or No', async () => {
    // Claim line order is not fixed (live run 2026-10-01) — compare as sets.
    expect([...claimLines(newRow['Odometer Reading'])].sort()).toEqual(['10,001 to 20,000 km', '40,001 to 50,000 km']);
    expect([...claimLines(newRow['Total No. of Parts Approved for Change'])].sort()).toEqual(['1 to 10 parts', '11 to 20 parts']);
    // ICAP code 1 on both claims → exactly "Own Damage (OD)" (SRD 2.2.5).
    expect(claimLines(newRow['Type of Claim'])).toEqual(['Own Damage (OD)', 'Own Damage (OD)']);
    // Vehicle-level flags were set to No above.
    expect(newRow['Possible Total Loss']).toBe('No');
    expect(newRow['Possible BER']).toBe('No');
  });

  await test.step('Same vehicle: the vehicle details match between the existing and the new transaction', async () => {
    const diffs: string[] = [];
    for (const col of VEHICLE_DETAIL_COLUMNS) {
      const same = newRow[col] === oldRow[col];
      console.log(`DETAIL:${JSON.stringify({ label: col, value: `existing: ${oldRow[col]} | new: ${newRow[col]} | ${same ? 'match' : 'MISMATCH'}` })}`);
      if (!same) diffs.push(`${col}: existing "${oldRow[col]}" vs new "${newRow[col]}"`);
    }
    expect(diffs, 'Vehicle details differ between the two transactions').toEqual([]);
  });

  const unaffected = REPORT_LISTING_COLUMNS.filter(c => !AFFECTED.includes(c));

  await test.step('Other unaffected columns: filled in for both (history and claim columns can differ by design)', async () => {
    for (const col of unaffected.filter(c => !VEHICLE_DETAIL_COLUMNS.includes(c) && !PER_TRANSACTION_COLUMNS.includes(c))) {
      console.log(`DETAIL:${JSON.stringify({ label: col, value: `existing: ${oldRow[col]} | new: ${newRow[col]}` })}`);
    }
    const blanks = unaffected.flatMap(c => [
      ...(newRow[c] === '' ? [`new: ${c}`] : []),
      ...(oldRow[c] === '' ? [`existing: ${c}`] : []),
    ]);
    expect(blanks, 'Blank cells in unaffected columns').toEqual([]);
  });

  await test.step('Export matches the listing for both transactions, every column', async () => {
    const newExp = exportRowByTransactionNo(sheet, tx);
    const oldExp = exportRowByTransactionNo(sheet, PRE_PUSH.transactionNo);
    expect(newExp, `New transaction ${tx} is not in the export`).toBeTruthy();
    expect(oldExp, `Pre-push transaction ${PRE_PUSH.transactionNo} is not in the export`).toBeTruthy();
    const columns = REPORT_LISTING_COLUMNS.filter(c => c !== '#');
    const mismatches = [
      ...compareListingToExport(newRow, newExp!, columns).map(m => `new — ${m}`),
      ...compareListingToExport(oldRow, oldExp!, columns).map(m => `existing — ${m}`),
    ];
    expect(mismatches, 'Listing vs export mismatches').toEqual([]);
  });
});

test('12339_TS32: Verify BackOffice JomCheck Report Listing Export matches the listing display', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS32_VEHICLE_NO || vehicleNoFor('0025');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Mileage Range': '0 to 10,000 km', 'Total Parts Changed': '1 to 10 parts', 'Claims Type (ICAP code)': '16', 'Possible Total Loss': 'Yes', 'Possible BER': 'No' },
    { 'Mileage Range': '290,001 to 300,000 km', 'Total Parts Changed': '21 to 30 parts', 'Claims Type (ICAP code)': '11', 'Possible Total Loss': 'No', 'Possible BER': 'No' },
  ], // Vehicle-level flags set explicitly (claim 1 is OD-ATL, so Total Loss
     // Yes) instead of whatever the shared HX prefix was left with.
  { 'Possible Total Loss': 'Yes', 'Possible BER': 'No' });

  const listingHeaders = await test.step('Read the listing headers', async () => (await listing.getColumnHeaders()).map(h => h.trim()));
  const row = await test.step('Read the new transaction row', async () => listing.readRow(tx));

  await test.step('Listing shows the eSim values in the 3 re-sourced and 2 new columns', async () => {
    // If listing and export were BOTH wrong the same way, listing = export
    // alone would still pass — so tie the listing to what eSim was given.
    expect(claimLines(row['Odometer Reading'])).toEqual(['0 to 10,000 km', '290,001 to 300,000 km']);
    expect(claimLines(row['Total No. of Parts Approved for Change'])).toEqual(['1 to 10 parts', '21 to 30 parts']);
    expect(claimLines(row['Type of Claim'])).toEqual(['Own Damage - Actual Total Loss (OD-ATL)', 'Windscreen (WS)']);
    expect(row['Possible Total Loss']).toBe('Yes');
    expect(row['Possible BER']).toBe('No');
  });
  const sheet = await test.step('Export XLSX', async () => exportFor(listing, `12339_TS32-export-${vehicleNo}`));

  await test.step('Export has 29 columns in the same order as the listing, labels matching', async () => {
    const exportHeaders = sheet.headers.map(baseHeader);
    const suffixed = sheet.headers.filter(h => /\((UPDATED|NEW)\)\s*$/i.test(h));
    console.log(`DETAIL:${JSON.stringify({ label: 'Export headers', value: sheet.headers.join(' | ') })}`);
    // OQ-09: the mock-up adds "(UPDATED)"/"(NEW)" suffixes and colour fills — still open. Logged, not asserted.
    console.log(`DETAIL:${JSON.stringify({ label: 'Headers with (UPDATED)/(NEW) suffix — OQ-09', value: suffixed.join(' | ') || 'none' })}`);
    expect(exportHeaders.length).toBe(29);
    expect(exportHeaders).toEqual(listingHeaders);
  });

  const exportRow = exportRowByTransactionNo(sheet, row['Transaction Number']);

  await test.step('3 re-sourced and 2 new columns match the listing, multi-claim lines included', async () => {
    expect(exportRow, `Transaction ${row['Transaction Number']} is not in the export`).toBeTruthy();
    expect(compareListingToExport(row, exportRow!, AFFECTED), 'Affected-column mismatches').toEqual([]);
    expect(claimLines(exportRow!['Odometer Reading'].text)).toHaveLength(2);
  });

  await test.step('Every other column matches the listing', async () => {
    const others = REPORT_LISTING_COLUMNS.filter(c => c !== '#' && !AFFECTED.includes(c));
    expect(compareListingToExport(row, exportRow!, others), 'Other-column mismatches').toEqual([]);
  });
});

test('12339_TS33: Verify exported range values keep text format and are not auto-converted by Excel', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS33_VEHICLE_NO || vehicleNoFor('0026');

  // Band examples taken verbatim from the TS33 row of the reviewed workbook.
  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Mileage Range': '40,001 to 50,000 km', 'Total Parts Changed': '1 to 10 parts', 'Claims Type (ICAP code)': '1' },
  ]);

  const row = await test.step('Read the new transaction row', async () => listing.readRow(tx));
  const sheet = await test.step('Export XLSX', async () => exportFor(listing, `12339_TS33-export-${vehicleNo}`));

  await test.step('Odometer Reading and Total No. of Parts Approved are text cells holding the range', async () => {
    const exportRow = exportRowByTransactionNo(sheet, row['Transaction Number']);
    expect(exportRow, `Transaction ${row['Transaction Number']} is not in the export`).toBeTruthy();
    for (const [col, band] of [['Odometer Reading', '40,001 to 50,000 km'], ['Total No. of Parts Approved for Change', '1 to 10 parts']] as const) {
      const cell = exportRow![col];
      console.log(`DETAIL:${JSON.stringify({ label: col, value: cell?.text, cellType: cell?.type })}`);
      expect(cell, `${col} missing from the export`).toBeTruthy();
      expect(cell.type, `${col} is not stored as text`).toBe('string');
      expect(claimLines(cell.text)).toEqual([band]);
    }
  });
});
