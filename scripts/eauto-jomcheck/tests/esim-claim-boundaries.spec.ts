import { test, expect } from '@playwright/test';
import { BoJomCheckReportListingPage } from '../pages/BoJomCheckReportListingPage';
import { LoginPage } from '../pages/LoginPage';
import { UcdJomCheckPurchasePage } from '../pages/UcdJomCheckPurchasePage';
import { getUser } from '../data/users';
import { registerEsimRestoreHook, setClaimsAndPurchase, vehicleNoFor } from '../utils/esimPurchase';
import { ICAP_DESCRIPTIONS, icapDescription } from '../data/icapCodes';

// EAINT-12339, section B ("BACKOFFICE — JOMCHECK REPORT LISTING"), TS06-TS20
// (TS17/TS18 excluded — already correctly automated in
// ucd-purchase-to-bo-listing.spec.ts, neither depends on an exact claim
// value). Faizuddin, 2026-10-03: "can you create the automation for TS06 -
// TS20. not that for these ones, it will need to use eSim, not jomcheck
// API. since it needs specific details, which will be inserted through the
// eSim" — these TS assert EXACT boundary values (mileage/parts counts right
// either side of a bucket edge, specific claim codes, multi-claim ordering)
// that a real JomCheck API purchase cannot reliably produce (the workbook's
// own Golden Rule #3: API results are random). Only eSim's JomCheck Report
// "Claim Records" sub-form (see `utils/esim.ts`, `EsimPages.ts`) lets a test
// set those values deterministically before purchasing.
//
// eSim is driven in the test's own page (`utils/esimPurchase.ts`,
// `pages/EsimJomCheckPage.ts`), so the set-up and restore are in the video.
// PREFIX: the vehicle no.'s first 2 characters. Each test saves that
// prefix's Enquiry Result and claim records first and writes them back in
// afterEach, pass or fail. If a run is killed first, the saved state is in
// the log as "[esim] <prefix> snapshot:" — put it back by hand.
//
// RESOLVED, 2026-10-04 (Faizuddin, after QA review of the 01.10.2026
// workbook): "the view will always show range in text" — eAuto does NOT
// compute the Odometer Reading / Total No. of Parts Approved bucket itself;
// MileageRange/TotalPartsChanged are shown exactly as given (the banding is
// done upstream, by ezAuto in the real API, or typed directly into eSim's
// text fields here). TS08-TS11/TS19 therefore set the FINAL, already-
// bucketed string straight into eSim's "Mileage Range"/"Total Parts
// Changed" fields (both confirmed plain `<input>` text fields, not
// dropdowns — `_reference/html/esim/jomcheck-report-edit.html`) and assert
// the Listing shows that exact string back, unmodified. This makes TS08-
// TS11/TS19 pass-through-fidelity checks, not banding-algorithm checks —
// there is no banding algorithm inside eAuto to test. Exact band wording
// (e.g. "0 to 10,000 km", "1 to 10 parts") is taken verbatim from
// `_reference/tickets/EAINT-12339/Mockup_EAINT-12339_JomCheck_Report_Listing_20260928.html`'s
// own sample data, not invented.
//
// Tests run one at a time (`workers: 1` in playwright.config.ts) because
// they all edit the same eSim record.

registerEsimRestoreHook();

/** Possible Total Loss / Possible BER: position (between the right
 *  neighbours), value, and a single value — not numbered per claim. Shared
 *  by every Total Loss / BER scenario in the reviewed workbook. */
async function checkTotalLossColumns(listing: BoJomCheckReportListingPage, tx: string, totalLoss: 'Yes' | 'No', ber: 'Yes' | 'No'): Promise<void> {
  const headers = await test.step('Read the listing headers', async () => (await listing.getColumnHeaders()).map(h => h.trim()));

  await test.step(`Possible Total Loss sits between Total Loss History (Actual) and (BER), and shows "${totalLoss}"`, async () => {
    const at = headers.indexOf('Possible Total Loss');
    expect(headers[at - 1]).toBe('Total Loss History (Actual)');
    expect(headers[at + 1]).toBe('Total Loss History (BER)');
    const value = await listing.readRawCell(tx, 'Possible Total Loss');
    console.log(`DETAIL:${JSON.stringify({ label: 'Possible Total Loss', value })}`);
    expect(value).toBe(totalLoss);
  });

  await test.step(`Possible BER sits between Total Loss History (BER) and Make / Brand, and shows "${ber}"`, async () => {
    const at = headers.indexOf('Possible BER');
    expect(headers[at - 1]).toBe('Total Loss History (BER)');
    expect(headers[at + 1]).toBe('Make / Brand');
    const value = await listing.readRawCell(tx, 'Possible BER');
    console.log(`DETAIL:${JSON.stringify({ label: 'Possible BER', value })}`);
    expect(value).toBe(ber);
  });
}

// ⚠ CLAIM ORDER IS NOT FIXED. Live run 2026-10-01 (uat1): claims saved in eSim
// as A,B,C came back on the listing as C,A,B (TS09), C,B,A (TS11), and 4
// claims as B,D,A,C (TS10); 2 dated claims came back newest-first (TS19).
// So a test never assumes "line n = the n-th claim set". It either compares
// the lines as a set (`sorted`), or tags each claim with its own mileage band
// (`tagBand`) and pairs every line back to its claim through that tag.
const sorted = (a: readonly string[]) => [...a].sort();
/** i-th 10,000 km band: 0 -> "0 to 10,000 km", 1 -> "10,001 to 20,000 km", ... */
const tagBand = (i: number) =>
  `${(i === 0 ? 0 : i * 10000 + 1).toLocaleString('en-US')} to ${((i + 1) * 10000).toLocaleString('en-US')} km`;
/** Reads several columns of one row as per-claim lines: [{col: value}, ...]. */
async function readClaimRows(listing: BoJomCheckReportListingPage, tx: Parameters<BoJomCheckReportListingPage['readMultiClaimColumn']>[0], cols: Parameters<BoJomCheckReportListingPage['readMultiClaimColumn']>[1][]) {
  const byCol = await Promise.all(cols.map(c => listing.readMultiClaimColumn(tx, c)));
  const n = Math.max(...byCol.map(v => v.length));
  return Array.from({ length: n }, (_, i) => Object.fromEntries(cols.map((c, k) => [c, byCol[k][i] ?? ''])) as Record<string, string>);
}

// ⚠ Display format for exactly 1 claim is unconfirmed — workbook Remarks:
// "Single-claim display format ('1. <value>' or '<value>') to be confirmed
// - OQ-13." Faizuddin, 2026-10-04: "For now, make it so that it will show
// numbered '1. ...'" — asserting the NUMBERED form as the working
// assumption until OQ-13 resolves one way or the other. If OQ-13 settles on
// the bare (non-numbered) form instead, flip this assertion back.
test('12339_TS06: single claim shows as a numbered line ("1. ...")', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS06_VEHICLE_NO || vehicleNoFor('0005');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Mileage Range': '10,001 to 20,000 km', 'Total Parts Changed': '1 to 10 parts', 'Claims Type (ICAP code)': '11' },
  ]);

  await test.step('Confirm Odometer Reading / Type of Claim / Total No. of Parts show ONE numbered value each', async () => {
    const odometer = await listing.readMultiClaimColumn(tx, 'Odometer Reading');
    const typeOfClaim = await listing.readMultiClaimColumn(tx, 'Type of Claim');
    const partsApproved = await listing.readMultiClaimColumn(tx, 'Total No. of Parts Approved for Change');

    expect(odometer.length).toBe(1);
    expect(typeOfClaim.length).toBe(1);
    expect(partsApproved.length).toBe(1);

    const rawOdometer = await listing.readRawCell(tx, 'Odometer Reading');
    expect(rawOdometer).toMatch(/^1\./);
    expect(odometer[0]).toBe('10,001 to 20,000 km');
    expect(typeOfClaim[0]).toBe('Windscreen (WS)'); // ClaimsType 11 per SRD 2.2.5
    expect(partsApproved[0]).toBe('1 to 10 parts');

    console.log(`DETAIL:${JSON.stringify({ label: 'Odometer Reading', value: odometer[0], inPdf: true })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Type of Claim', value: typeOfClaim[0], inPdf: true })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Total No. of Parts Approved for Change', value: partsApproved[0], inPdf: true })}`);
  });
});

test('12339_TS07: 2+ claims show as a numbered multi-line list', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS07_VEHICLE_NO || vehicleNoFor('0006');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Mileage Range': '10,001 to 20,000 km', 'Total Parts Changed': '1 to 10 parts', 'Claims Type (ICAP code)': '11' },
    { 'Mileage Range': '40,001 to 50,000 km', 'Total Parts Changed': '1 to 10 parts', 'Claims Type (ICAP code)': '16' },
  ]);

  await test.step('Confirm the columns show 2 numbered lines ("1. ...<br>2. ...")', async () => {
    const odometer = await listing.readMultiClaimColumn(tx, 'Odometer Reading');
    const typeOfClaim = await listing.readMultiClaimColumn(tx, 'Type of Claim');
    const partsApproved = await listing.readMultiClaimColumn(tx, 'Total No. of Parts Approved for Change');
    const rawOdometer = await listing.readRawCell(tx, 'Odometer Reading');

    // "multiple lines, 1 line per claim, numbered 1., 2." — the whole cell:
    // line 1 starts "1.", line 2 starts "2.", one claim per line.
    const twoNumberedLines = /^1\.\s*[^\n]+\n\s*2\.\s*[^\n]+$/;
    expect(rawOdometer).toMatch(twoNumberedLines);
    expect(await listing.readRawCell(tx, 'Type of Claim')).toMatch(twoNumberedLines);
    expect(await listing.readRawCell(tx, 'Total No. of Parts Approved for Change')).toMatch(twoNumberedLines);
    expect(odometer.length).toBe(2);
    expect(typeOfClaim.length).toBe(2);
    expect(partsApproved.length).toBe(2);

    console.log(`DETAIL:${JSON.stringify({ label: 'Odometer Reading (both lines)', value: odometer.join(' | ') })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Type of Claim (both lines)', value: typeOfClaim.join(' | ') })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Total No. of Parts Approved (both lines)', value: partsApproved.join(' | ') })}`);
  });
});

// TS08-TS11 are pass-through-fidelity checks, not banding-algorithm checks
// — see the file header. Each sets the FINAL bucketed string into eSim's
// "Mileage Range"/"Total Parts Changed" fields and confirms the Listing
// shows it back unmodified. Wording taken verbatim from the mockup's own
// sample data (Mockup_EAINT-12339_JomCheck_Report_Listing_20260928.html).
test('12339_TS08: mileage buckets at the 10,000km boundary', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS08_VEHICLE_NO || vehicleNoFor('0007');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Mileage Range': '0 to 10,000 km', 'Claims Type (ICAP code)': '11' },
    { 'Mileage Range': '0 to 10,000 km', 'Claims Type (ICAP code)': '11' },
    { 'Mileage Range': '10,001 to 20,000 km', 'Claims Type (ICAP code)': '11' },
  ]);

  await test.step('Confirm 9,999/10,000 both show "0 to 10,000 km" and 10,001 shows "10,001 to 20,000 km"', async () => {
    const odometer = await listing.readMultiClaimColumn(tx, 'Odometer Reading');
    console.log(`DETAIL:${JSON.stringify({ label: 'Odometer Reading (9999 / 10000 / 10001)', value: odometer.join(' | ') })}`);

    expect(sorted(odometer)).toEqual(sorted(['0 to 10,000 km', '0 to 10,000 km', '10,001 to 20,000 km']));
  });
});

// ⚠ Boundary corrected per the 01.10.2026 QA review: 300,000km itself still
// falls INSIDE the preceding 10,000km band ("290,001 to 300,000 km") —
// "More than 300,000 km" applies strictly ABOVE 300,000, starting at
// 300,001. The original draft had 300,000 itself showing "More than
// 300,000 km", which the review marked as a correction.
test('12339_TS09: mileage buckets at the 300,000km ceiling and the null case', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS09_VEHICLE_NO || vehicleNoFor('0008');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Mileage Range': '290,001 to 300,000 km', 'Claims Type (ICAP code)': '11' },
    { 'Mileage Range': 'More than 300,000 km', 'Claims Type (ICAP code)': '11' },
    { 'Mileage Range': 'Not Specified', 'Claims Type (ICAP code)': '11' },
  ]);

  await test.step('Confirm 300,000 shows "290,001 to 300,000 km", 300,001 shows "More than 300,000 km", blank shows "Not Specified"', async () => {
    const odometer = await listing.readMultiClaimColumn(tx, 'Odometer Reading');
    console.log(`DETAIL:${JSON.stringify({ label: 'Odometer Reading (300000 / 300001 / blank)', value: odometer.join(' | ') })}`);

    expect(sorted(odometer)).toEqual(sorted(['290,001 to 300,000 km', 'More than 300,000 km', 'Not Specified']));
  });
});

test('12339_TS10: parts-changed buckets at the 10/20 part boundaries', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS10_VEHICLE_NO || vehicleNoFor('0009');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Total Parts Changed': '1 to 10 parts', 'Claims Type (ICAP code)': '11' },
    { 'Total Parts Changed': '11 to 20 parts', 'Claims Type (ICAP code)': '11' },
    { 'Total Parts Changed': '11 to 20 parts', 'Claims Type (ICAP code)': '11' },
    { 'Total Parts Changed': '21 to 30 parts', 'Claims Type (ICAP code)': '11' },
  ]);

  await test.step('Confirm 10 -> "1 to 10 parts", 11 & 20 -> "11 to 20 parts", 21 -> "21 to 30 parts"', async () => {
    const parts = await listing.readMultiClaimColumn(tx, 'Total No. of Parts Approved for Change');
    console.log(`DETAIL:${JSON.stringify({ label: 'Total No. of Parts Approved (10 / 11 / 20 / 21)', value: parts.join(' | ') })}`);

    expect(sorted(parts)).toEqual(sorted(['1 to 10 parts', '11 to 20 parts', '11 to 20 parts', '21 to 30 parts']));
  });
});

test('12339_TS11: parts-changed at the 100-part ceiling and the blank case', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS11_VEHICLE_NO || vehicleNoFor('0010');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Total Parts Changed': '91 to 100 parts', 'Claims Type (ICAP code)': '11' },
    { 'Total Parts Changed': 'More than 100 parts', 'Claims Type (ICAP code)': '11' },
    { 'Total Parts Changed': 'No information available.', 'Claims Type (ICAP code)': '11' },
  ]);

  await test.step('Confirm 100 -> "91 to 100 parts", 101 -> "More than 100 parts", blank -> "No information available."', async () => {
    const parts = await listing.readMultiClaimColumn(tx, 'Total No. of Parts Approved for Change');
    console.log(`DETAIL:${JSON.stringify({ label: 'Total No. of Parts Approved (100 / 101 / blank)', value: parts.join(' | ') })}`);

    expect(sorted(parts)).toEqual(sorted(['91 to 100 parts', 'More than 100 parts', 'No information available.']));
  });
});

// ⚠ Item 2 is ON HOLD per the 01.10.2026 QA review — Remarks: "Item 2 ON
// HOLD - OQ-04. SRD only confirms '-' for a vehicle with no claim history."
// A null ClaimsType on ONE claim within an otherwise-populated claim list
// (this test's case) is NOT the same thing the SRD confirms (TS15's case:
// the WHOLE vehicle has zero claims) — asserting "-" here is a reasonable
// extrapolation, not a confirmed fact. Checked the mockup
// (Mockup_EAINT-12339_JomCheck_Report_Listing_20260928.html) for a settling
// example: its `typ` sample data hardcodes "Own Damage (OD)" for every row
// and claim — it does not demonstrate a null-code case at all, so it does
// NOT resolve OQ-04 either. Left as-is pending that answer.
test('12339_TS12: claim code 11 resolves to "Windscreen (WS)"; blank resolves to "-"', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS12_VEHICLE_NO || vehicleNoFor('0011');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    // Each claim carries a mileage tag: live run 2026-10-01 showed a claim
    // with EVERY field blank does not come back at all (1 line, not 2).
    { 'Claims Type (ICAP code)': '11', 'Mileage Range': tagBand(0) },
    { 'Claims Type (ICAP code)': '', 'Mileage Range': tagBand(1) },
  ], {}, { noDefault: true }); // blank ClaimsType must stay blank, not fall back to default data

  await test.step('Confirm code 11 -> "Windscreen (WS)" and blank -> "-"', async () => {
    const rows = await readClaimRows(listing, tx, ['Odometer Reading', 'Type of Claim']);
    console.log(`DETAIL:${JSON.stringify({ label: 'Type of Claim (code 11 / blank)', value: rows.map(r => `${r['Odometer Reading']} → ${r['Type of Claim']}`).join(' | ') })}`);

    expect(rows.length).toBe(2);
    const typeFor = (band: string) => rows.find(r => r['Odometer Reading'] === band)?.['Type of Claim'];
    expect(typeFor(tagBand(0))).toBe('Windscreen (WS)'); // exact, code in brackets
    expect(typeFor(tagBand(1))).toBe('-');
  });
});

test('12339_TS13: Possible Total Loss / Possible BER roll up to Yes when ANY claim is Yes', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS13_VEHICLE_NO || vehicleNoFor('0012');

  // Reviewed workbook: claim 1 = OD-ATL (TL yes, BER no), claim 2 = OD-CTL (TL no, BER yes), vehicle level both yes.
  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Claims Type (ICAP code)': '16', 'Possible Total Loss': 'Yes', 'Possible BER': 'No' },
    { 'Claims Type (ICAP code)': '15', 'Possible Total Loss': 'No', 'Possible BER': 'Yes' },
  ], { 'Possible Total Loss': 'Yes', 'Possible BER': 'Yes' });

  await checkTotalLossColumns(listing, tx, 'Yes', 'Yes');
});

test('12339_TS14: Possible Total Loss / Possible BER stay No when every claim is No', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS14_VEHICLE_NO || vehicleNoFor('0013');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Claims Type (ICAP code)': '1', 'Possible Total Loss': 'No', 'Possible BER': 'No' },
    { 'Claims Type (ICAP code)': '1', 'Possible Total Loss': 'No', 'Possible BER': 'No' },
  ], { 'Possible Total Loss': 'No', 'Possible BER': 'No' });

  await checkTotalLossColumns(listing, tx, 'No', 'No');
});

test('12339_TS15: no prior claim history shows "-" on the Listing', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS15_VEHICLE_NO || vehicleNoFor('0014');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [], { 'Possible Total Loss': 'No', 'Possible BER': 'No' },
    // With "No Default" off, zero claim records fall back to default claims.
    { noDefault: true });

  await test.step('Confirm Type of Claim (and the other claim-derived columns) show "-", not blank/N/A/null', async () => {
    const typeOfClaim = await listing.readRawCell(tx, 'Type of Claim');
    console.log(`DETAIL:${JSON.stringify({ label: 'Type of Claim (no claim history)', value: typeOfClaim })}`);

    expect(typeOfClaim).toBe('-');
  });

  // The workbook also expects an advisory message in the downloaded Report
  // PDF's "RESEARCHED INFORMATION" section in place of claim rows. Its EXACT
  // wording hasn't been confirmed against a live PDF yet — logged for manual
  // review rather than asserted on, to avoid failing on a guessed string.
  await test.step('Log in to UCD and download the Report PDF for manual advisory-message review', async () => {
    const login = new LoginPage(page);
    await login.logout();
    await login.login(getUser('ucd'));
    const purchase = new UcdJomCheckPurchasePage(page);
    await purchase.goto();
    await purchase.submitVehicleNo(vehicleNo);
    await purchase.payNow();
    const pdfText = await purchase.downloadReportAsText(`12339_TS15-report-${vehicleNo}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Report PDF text (manual review — no asserted wording yet)', value: pdfText.slice(0, 500) })}`);
  });
});

test('12339_TS16: Windscreen claim with no severity shows "NOT RELEVANT / NO SUM INSURED PROVIDED"', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS16_VEHICLE_NO || vehicleNoFor('0015');

  // ezAuto Technical Spec 2.0 p.9 (EAINT-12339-ezAuto-Technical-Spec-2.0.pdf):
  // Severity 'Returns "NOT RELEVANT / NO SUM INSURED PROVIDED" where the
  // vehicle has no sum insured, and for windscreen claims.' eAuto passes
  // Severity through without mapping (SRD REQ-006), so the eSim claim carries
  // that exact text. A blank Severity showed "1. -" on the live run
  // 2026-10-01 — not what the real API sends.
  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Claims Type (ICAP code)': '11', Severity: 'NOT RELEVANT / NO SUM INSURED PROVIDED' },
  ]);

  await test.step('Confirm Incidents Severity Scale shows the NOT RELEVANT advisory text', async () => {
    const severity = await listing.readRawCell(tx, 'Incidents Severity Scale');
    console.log(`DETAIL:${JSON.stringify({ label: 'Incidents Severity Scale', value: severity })}`);

    expect(severity.toUpperCase()).toContain('NOT RELEVANT');
    expect(severity.toUpperCase()).toContain('NO SUM INSURED');
  });
});

test('12339_TS19: 2 claims stay aligned line-by-line across Odometer/Type/Parts', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS19_VEHICLE_NO || vehicleNoFor('0018');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Mileage Range': '0 to 10,000 km', 'Total Parts Changed': '1 to 10 parts', 'Claims Type (ICAP code)': '11', 'Loss Date': '01 Jan 2024', Severity: 'LOW' },
    { 'Mileage Range': '10,001 to 20,000 km', 'Total Parts Changed': '11 to 20 parts', 'Claims Type (ICAP code)': '16', 'Loss Date': '15 Mar 2024', Severity: 'HIGH' },
  ]);

  await test.step('Confirm line 1 and line 2 each pair the right Odometer/Type/Parts together', async () => {
    const odometer = await listing.readMultiClaimColumn(tx, 'Odometer Reading');
    const typeOfClaim = await listing.readMultiClaimColumn(tx, 'Type of Claim');
    const parts = await listing.readMultiClaimColumn(tx, 'Total No. of Parts Approved for Change');

    console.log(`DETAIL:${JSON.stringify({ label: 'Odometer Reading (line 1 | line 2)', value: odometer.join(' | ') })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Type of Claim (line 1 | line 2)', value: typeOfClaim.join(' | ') })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Total No. of Parts Approved (line 1 | line 2)', value: parts.join(' | ') })}`);

    expect(odometer.length).toBe(2);
    expect(typeOfClaim.length).toBe(2);
    expect(parts.length).toBe(2);

    // Line order is not fixed (see the note above sorted/tagBand), so each
    // LINE must hold one whole claim: claim 1's values together on one line,
    // claim 2's on the other — whichever line number each lands on.
    const lines = odometer.map((o, i) => [o, parts[i], typeOfClaim[i]].join(' | '));
    expect(sorted(lines)).toEqual(sorted([
      ['0 to 10,000 km', '1 to 10 parts', icapDescription('11')].join(' | '),
      ['10,001 to 20,000 km', '11 to 20 parts', icapDescription('16')].join(' | '),
    ]));
  });

  await test.step('Confirm Date of Loss and Incidents Severity Scale also have 2 lines, each on its own claim\'s line', async () => {
    const dateOfLoss = await listing.readMultiClaimColumn(tx, 'Date of Loss');
    const severity = await listing.readMultiClaimColumn(tx, 'Incidents Severity Scale');
    console.log(`DETAIL:${JSON.stringify({ label: 'Date of Loss (line 1 | line 2)', value: dateOfLoss.join(' | ') })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Incidents Severity Scale (line 1 | line 2)', value: severity.join(' | ') })}`);
    expect(dateOfLoss.length).toBe(2);
    expect(severity.length).toBe(2);
    // Same pairing rule, across all 5 columns. Date format follows the BO
    // listing capture ("22 Nov 2019"); Severity is passed through without
    // mapping (SRD 2.2.2 #3), so the case must match too.
    const rows = await readClaimRows(listing, tx, ['Date of Loss', 'Odometer Reading', 'Total No. of Parts Approved for Change', 'Incidents Severity Scale']);
    const lines = rows.map(r => [r['Date of Loss'], r['Odometer Reading'], r['Total No. of Parts Approved for Change'], r['Incidents Severity Scale']].join(' | '));
    expect(sorted(lines)).toEqual(sorted([
      '01 Jan 2024 | 0 to 10,000 km | 1 to 10 parts | LOW',
      '15 Mar 2024 | 10,001 to 20,000 km | 11 to 20 parts | HIGH',
    ]));
  });
});

// ⚠ Line 2's "-" expectation is ON HOLD per the same OQ-04 as TS12 above —
// Remarks: "Line 2 expected '-' is ON HOLD - OQ-04." Same caveat applies.
test('12339_TS20: 3 claims (code 11 / blank / code 11) stay aligned with Date of Loss', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS20_VEHICLE_NO || vehicleNoFor('0019');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Claims Type (ICAP code)': '11', 'Loss Date': '01 Jan 2024' },
    { 'Claims Type (ICAP code)': '', 'Loss Date': '15 Mar 2024' },
    { 'Claims Type (ICAP code)': '11', 'Loss Date': '30 Jun 2024' },
  ], {}, { noDefault: true }); // blank ClaimsType must stay blank, not fall back to default data

  await test.step('Confirm Type of Claim reads Windscreen / "-" / Windscreen, aligned with Date of Loss', async () => {
    const typeOfClaim = await listing.readMultiClaimColumn(tx, 'Type of Claim');
    const dateOfLoss = await listing.readMultiClaimColumn(tx, 'Date of Loss');

    console.log(`DETAIL:${JSON.stringify({ label: 'Type of Claim (3 lines)', value: typeOfClaim.join(' | ') })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Date of Loss (3 lines)', value: dateOfLoss.join(' | ') })}`);

    expect(typeOfClaim.length).toBe(3);
    expect(dateOfLoss.length).toBe(3);
    // "check numbering stays aligned with Date of Loss" — each date on the
    // same line as its own claim's Type of Claim, whatever the line order.
    const lines = dateOfLoss.map((d, i) => `${d} | ${typeOfClaim[i]}`);
    expect(sorted(lines)).toEqual(sorted(['01 Jan 2024 | Windscreen (WS)', '15 Mar 2024 | -', '30 Jun 2024 | Windscreen (WS)']));
  });
});

// ── New rows from the 01.10.2026 QA review (Azila) ─────────────────────────

// Descriptions copied character for character from the reviewed workbook's
// expected result (SRD 2.2.5), incl. "ODKFK/Third Party...", "Lost-of-Use"
// and codes 30/31 sharing one description. All 21 codes on one vehicle; if
// eSim caps the number of claim records, split across vehicles (workbook
// allows it) — a cap would show as the listing returning fewer lines.
// ICAP_DESCRIPTIONS (SRD 2.2.5) now lives in data/icapCodes.ts, shared with TS18.

test('12339_TS21: Verify Type of Claim maps every ICAP code to the exact description in SRD 2.2.5', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS21_VEHICLE_NO || vehicleNoFor('0039');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo,
    ICAP_DESCRIPTIONS.map(([code], i) => ({ 'Claims Type (ICAP code)': code, 'Mileage Range': tagBand(i) })));

  await test.step(`Confirm each of the ${ICAP_DESCRIPTIONS.length} Type of Claim lines shows its exact description`, async () => {
    const rows = await readClaimRows(listing, tx, ['Odometer Reading', 'Type of Claim']);
    expect(rows.length, 'Number of Type of Claim lines').toBe(ICAP_DESCRIPTIONS.length);
    const mismatches: string[] = [];
    // Each code was saved with its own mileage band, so its line is found by band, not by position.
    ICAP_DESCRIPTIONS.forEach(([code, expected], i) => {
      const got = rows.find(r => r['Odometer Reading'] === tagBand(i))?.['Type of Claim'] ?? '(line missing)';
      console.log(`DETAIL:${JSON.stringify({ label: `Code ${code}`, value: got, expected })}`);
      if (got !== expected) mismatches.push(`code ${code}: "${got}" (expected "${expected}")`);
    });
    expect(mismatches, 'Codes not showing the exact SRD 2.2.5 description').toEqual([]);
  });
});

test('12339_TS22: Verify Possible Total Loss = "Yes" and Possible BER = "No" when only an Actual Total Loss claim exists', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS22_VEHICLE_NO || vehicleNoFor('0040');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Claims Type (ICAP code)': '16', 'Possible Total Loss': 'Yes', 'Possible BER': 'No' },
    { 'Claims Type (ICAP code)': '1', 'Possible Total Loss': 'No', 'Possible BER': 'No' },
  ], { 'Possible Total Loss': 'Yes', 'Possible BER': 'No' });

  await checkTotalLossColumns(listing, tx, 'Yes', 'No');
});

test('12339_TS23: Verify Possible Total Loss = "No" and Possible BER = "Yes" when only a Constructive Total Loss (BER) claim exists', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS23_VEHICLE_NO || vehicleNoFor('0041');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Claims Type (ICAP code)': '1', 'Possible Total Loss': 'No', 'Possible BER': 'No' },
    { 'Claims Type (ICAP code)': '15', 'Possible Total Loss': 'No', 'Possible BER': 'Yes' },
  ], { 'Possible Total Loss': 'No', 'Possible BER': 'Yes' });

  await checkTotalLossColumns(listing, tx, 'No', 'Yes');
});

// OQ-14's precondition holds: eSim's JomCheck Report has its own top-level
// "Possible Total Loss" / "Possible BER" selects, separate from each claim
// record's (_reference/html/esim/jomcheck-report-edit.html).
test('12339_TS24: Verify Possible Total Loss / Possible BER are taken from the vehicle-level flags, not recalculated by eAuto from the claims', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS24_VEHICLE_NO || vehicleNoFor('0042');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo, [
    { 'Claims Type (ICAP code)': '1', 'Possible Total Loss': 'No', 'Possible BER': 'No' },
  ], { 'Possible Total Loss': 'Yes', 'Possible BER': 'No' });

  await checkTotalLossColumns(listing, tx, 'Yes', 'No');
});

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'SEVERE', 'CRITICAL', 'CATASTROPHIC'];

test('12339_TS26: Verify BackOffice Incidents Severity Scale value passes through and displays correctly for each of the 6 ranges', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS26_VEHICLE_NO || vehicleNoFor('0028');

  const { listing, tx } = await setClaimsAndPurchase(page, vehicleNo,
    SEVERITIES.map(severity => ({ 'Claims Type (ICAP code)': '1', Severity: severity })));

  await test.step('Confirm Incidents Severity Scale shows LOW, MEDIUM, HIGH, SEVERE, CRITICAL and CATASTROPHIC', async () => {
    const severity = await listing.readMultiClaimColumn(tx, 'Incidents Severity Scale');
    console.log(`DETAIL:${JSON.stringify({ label: 'Incidents Severity Scale', value: severity.join(' | ') })}`);
    // Passed through without mapping (SRD 2.2.2 #3) — exact, case included.
    expect(sorted(severity)).toEqual(sorted(SEVERITIES));
  });
});
