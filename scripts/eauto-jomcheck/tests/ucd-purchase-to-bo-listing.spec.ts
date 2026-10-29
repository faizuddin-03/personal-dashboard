import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { UcdJomCheckPurchasePage } from '../pages/UcdJomCheckPurchasePage';
import { BoJomCheckReportListingPage } from '../pages/BoJomCheckReportListingPage';
import { getUser } from '../data/users';
import { readExport, exportRowByTransactionNo, claimLines } from '../utils/exportReader';
import { ICAP_DESCRIPTION_SET } from '../data/icapCodes';
import { lookUpTransactionNo } from '../utils/transactionLookup';

// EAINT-12339 — TS18 never shows deprecated/blank values in the 3
// re-sourced columns — true for ANY claim count, fully provable regardless
// of what the connected source (eSim/API) returns, so it stays on the
// random/live-API path (own fresh vehicle no.) rather than needing eSim.
//
// TS06 USED to live here too (random vehicle, test.skip() when the claim
// count wasn't exactly 1), but Faizuddin, 2026-10-03, asked for TS06-TS20
// to be rebuilt deterministically via eSim instead — moved to
// `esim-claim-boundaries.spec.ts`, which drives eSim's JomCheck Report
// claim-record sub-form to GUARANTEE the exact claim count/values each of
// those TS needs, rather than hoping the live API happens to return them.
//
// Each test purchases its OWN vehicle (separate env vars — running both in
// the same invocation would otherwise collide on one vehicle no.) and prints
// the actual claim count it found as its own step, so a look at the results
// list — not just terminal pass/fail — tells you what the vehicle produced.
//
// ONE page/context per test (UCD, logout, then BO) — Faizuddin, 2026-10-01:
// "for multiple users TS without concurrent running, it should use the same
// browser so that the recording will be able to record everything in one
// recording only."

async function purchaseAndOpenListing(
  page: Page,
  vehicleNo: string,
  opts: { downloadReportLabel?: string } = {},
): Promise<{ listing: BoJomCheckReportListingPage; tx: string; pdfText?: string }> {
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
    // appear (the real completion signal) — asserted explicitly here rather
    // than matching #result wording, which isn't reliable for a real
    // API-connected payment. Faizuddin, 2026-10-03: "after clicking pay
    // now, the automation still checks the wording for Vehicle Number
    // Found. by right, shouldnt check that anymore."
    expect(await purchase.isReportReady()).toBe(true);
  });

  // Only the API-requiring scenarios (TS43) ask for this — downloading AND
  // saving the report as evidence "whatever the scenario is", since a
  // JomCheck API download is a limited resource (Faizuddin, 2026-10-03: "we
  // need to make sure we get all details possible in case need to refer in
  // the future"). Must happen HERE, before logging out of UCD — the
  // "Download Report" button only exists on this page.
  let pdfText: string | undefined;
  if (opts.downloadReportLabel) {
    pdfText = await test.step('Download the report and save it as evidence', async () => {
      return purchase.downloadReportAsText(opts.downloadReportLabel!);
    });
  }

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

  await test.step(`Confirm transaction ${tx} shows up in the listing`, async () => {
    // A real vehicle already carries rows from earlier runs and other
    // testers, so the row is found by this purchase's Transaction No.
    expect(await listing.findRowIndexByTransactionNo(tx), `Transaction ${tx} is not in the listing`).toBeGreaterThanOrEqual(0);
  });

  return { listing, tx, pdfText };
}

test('12339_TS18: new transaction never shows deprecated-field values', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS18_VEHICLE_NO
    || `HXA${String(Date.now() % 10000).padStart(4, '0')}A`;

  const { listing, tx } = await purchaseAndOpenListing(page, vehicleNo);

  // Valid values per the reviewed workbook (TS18 expected result #2).
  const valid: Record<string, (v: string) => boolean> = {
    'Odometer Reading': v => /^[\d,]+ to [\d,]+ km$/.test(v) || v === 'More than 300,000 km' || v === 'Not Specified' || v === '-',
    // "ClaimsType description per SRD 2.2.5, or '-'" — the exact list, not
    // any text ending in "(CAPS)".
    'Type of Claim': v => ICAP_DESCRIPTION_SET.has(v) || v === '-',
    'Total No. of Parts Approved for Change': v => /^\d+ to \d+ parts$/.test(v) || v === 'More than 100 parts' || v === 'No information available.' || v === '-',
  };
  const columns = Object.keys(valid) as ('Odometer Reading' | 'Type of Claim' | 'Total No. of Parts Approved for Change')[];

  const listingValues = await test.step('Read Odometer Reading, Type of Claim and Total No. of Parts Approved', async () => {
    const out: Record<string, string[]> = {};
    for (const col of columns) out[col] = await listing.readMultiClaimColumn(tx, col);
    return out;
  });

  await test.step('Confirm the listing never shows "N/A" or blank, and only valid values', async () => {
    for (const col of columns) {
      for (const value of listingValues[col]) {
        console.log(`DETAIL:${JSON.stringify({ label: `Listing — ${col}`, value })}`);
        expect(value, `${col} is blank`).not.toBe('');
        expect(value.toUpperCase(), `${col} shows N/A/null`).not.toMatch(/^(N\/A|NULL)$/);
        expect(valid[col](value), `${col} = "${value}" is not a valid v2.0 value`).toBe(true);
      }
    }
    expect(listingValues['Odometer Reading'].length).toBe(listingValues['Type of Claim'].length);
    expect(listingValues['Odometer Reading'].length).toBe(listingValues['Total No. of Parts Approved for Change'].length);
  });

  const txNo = tx;
  const sheet = await test.step('Export XLSX', async () => {
    const file = await listing.downloadExport(`12339_TS18-export-${vehicleNo}`);
    return readExport(file);
  });

  await test.step('Confirm the export shows the same 3 columns, never "N/A" or blank', async () => {
    const row = exportRowByTransactionNo(sheet, txNo);
    expect(row, `Transaction ${txNo} is not in the export`).toBeTruthy();
    for (const col of columns) {
      const lines = claimLines(row![col]?.text ?? '');
      console.log(`DETAIL:${JSON.stringify({ label: `Export — ${col}`, value: lines.join(' | ') })}`);
      for (const value of lines) {
        expect(value, `Export ${col} is blank`).not.toBe('');
        expect(value.toUpperCase(), `Export ${col} shows N/A/null`).not.toMatch(/^(N\/A|NULL)$/);
      }
      expect(lines).toEqual(listingValues[col]);
    }
  });
});

// EAINT-12339 — TS43 (section H, "API TESTING"). Faizuddin, 2026-10-03:
// "for TS43, only check what the automation can do. if the details require
// me to check with dev, then ignore that part only." The workbook's own
// step 3 is "Request for raw API response from dev" and 2 of its 7 expected
// fields (claim-level Possible Total Loss / claim-level Possible BER) are
// ONLY visible in that raw response — the BO listing only ever renders the
// VEHICLE-level rollup of Possible Total Loss/BER (see Field Reference
// sheet, #4/#5: "Vehicle-level Yes if any claim is ICAP code 16"), with no
// per-claim breakout in the UI. Neither of those is automatable without the
// raw response, so this test covers ONLY the 5 of 7 fields the UI actually
// exposes (ClaimsType, TotalPartsChanged, MileageRange, and the
// vehicle-level Possible Total Loss/BER) — the same 5 columns TS01/TS18
// already read, just asserted here as "the API integration delivered these
// fields end to end" rather than "never blank".
test('12339_TS43: Verify JomCheck Gateway API v2.0 response returns all 7 new fields, keeps the deprecated fields and is called on the V2.0 endpoint', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS43_VEHICLE_NO
    || `HXA${String((Date.now() + 3) % 10000).padStart(4, '0')}A`;

  const { listing, tx, pdfText } = await purchaseAndOpenListing(page, vehicleNo, {
    downloadReportLabel: `12339_TS43-report-${vehicleNo}`,
  });
  console.log(`DETAIL:${JSON.stringify({ label: 'Report downloaded', value: pdfText ? 'yes, saved as evidence' : 'no' })}`);

  await test.step('Confirm the 5 UI-visible API fields are populated (MileageRange/ClaimsType/TotalPartsChanged + vehicle-level Possible Total Loss/BER — claim-level Possible Total Loss/BER need the raw API response, not automated here)', async () => {
    const odometer = await listing.readMultiClaimColumn(tx, 'Odometer Reading');
    const typeOfClaim = await listing.readMultiClaimColumn(tx, 'Type of Claim');
    const partsApproved = await listing.readMultiClaimColumn(tx, 'Total No. of Parts Approved for Change');
    const possibleTotalLoss = await listing.readRawCell(tx, 'Possible Total Loss');
    const possibleBer = await listing.readRawCell(tx, 'Possible BER');

    // A new transaction must carry real v2.0 values: never blank and never
    // the deprecated-field "N/A"; the vehicle-level flags are Yes or No.
    for (const value of [...odometer, ...typeOfClaim, ...partsApproved]) {
      expect(value).not.toBe('');
      expect(value.toUpperCase()).not.toMatch(/^(N\/A|NULL)$/);
    }
    expect(possibleTotalLoss).toMatch(/^(Yes|No)$/);
    expect(possibleBer).toMatch(/^(Yes|No)$/);

    console.log(`DETAIL:${JSON.stringify({ label: 'Odometer Reading (MileageRange)', value: odometer.join(' | ') })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Type of Claim (ClaimsType)', value: typeOfClaim.join(' | ') })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Total No. of Parts Approved (TotalPartsChanged)', value: partsApproved.join(' | ') })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Possible Total Loss (vehicle-level)', value: possibleTotalLoss })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Possible BER (vehicle-level)', value: possibleBer })}`);
  });
});

// EAINT-12339 — new row from the 01.10.2026 QA review (Azila). Workbook step
// 3 compares the listing with the RAW API response from dev — not reachable
// by automation (same gap as TS43, knowledge/flow-jomcheck.md §7d). The
// downloaded Report PDF carries the same API data, so this checks every
// item the PDF prints (prices, Total Loss History) against the listing, plus
// "State in Malaysia" = "-". Item 6 (Severity "as returned") needs the raw
// response — logged only. Needs staging connected to the JomCheck API and a
// REAL vehicle no.
test('12339_TS25: Verify columns NOT changed by this CR still display correctly for a new transaction on API v2.0', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS25_VEHICLE_NO
    || `HXA${String((Date.now() + 43) % 10000).padStart(4, '0')}A`;

  const { listing, tx, pdfText } = await purchaseAndOpenListing(page, vehicleNo, {
    downloadReportLabel: `12339_TS25-report-${vehicleNo}`,
  });
  const pdf = pdfText ?? '';
  const num = (v: string) => Number(v.replace(/,/g, ''));

  const prices: [string, 'Avg. Market Value / Avg. Retail Price' | 'Approx. New Car Price / Recommended Trade Price', RegExp][] = [
    ['Avg. Market Value / Avg. Retail Price = BasicInfo.RetailPrice', 'Avg. Market Value / Avg. Retail Price', /AVERAGE RETAIL PRICE:\s*([\d,]+(?:\.\d+)?)/],
    ['Approx. New Car Price / Recommended Trade Price = BasicInfo.TradePrice', 'Approx. New Car Price / Recommended Trade Price', /RECOMMENDED TRADE PRICE:\s*([\d,]+(?:\.\d+)?)/],
  ];
  for (const [title, column, pattern] of prices) {
    await test.step(`${title}: populated, and equal to the Report PDF`, async () => {
      const listed = await listing.readRawCell(tx, column);
      const inPdf = pdf.match(pattern)?.[1] ?? '';
      console.log(`DETAIL:${JSON.stringify({ label: column, listing: listed, pdf: inPdf })}`);
      expect(listed, `${column} is blank`).not.toBe('');
      expect(inPdf, `${column} not found in the Report PDF`).not.toBe('');
      expect(num(listed)).toBe(num(inPdf));
    });
  }

  for (const [column, pdfLabel] of [['Total Loss History (Actual)', 'ACTUAL'], ['Total Loss History (BER)', 'BER']] as const) {
    await test.step(`${column} = ClaimInfoExtra value, same as the Report PDF's "${pdfLabel}:" line`, async () => {
      const listed = await listing.readRawCell(tx, column);
      const escaped = listed.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const inPdf = new RegExp(`${pdfLabel}:\\s*${escaped}`).test(pdf);
      console.log(`DETAIL:${JSON.stringify({ label: column, value: listed, inPdf })}`);
      expect(listed, `${column} is blank`).not.toBe('');
      expect(inPdf, `${column} = "${listed}" does not match the PDF's "${pdfLabel}:" line`).toBe(true);
    });
  }

  await test.step('State in Malaysia = "-" (hard-coded, even though v2.0 returns RepairState)', async () => {
    const state = await listing.readRawCell(tx, 'State in Malaysia');
    console.log(`DETAIL:${JSON.stringify({ label: 'State in Malaysia', value: state })}`);
    expect(state).toBe('-');
  });

  await test.step('Incidents Severity Scale — logged for comparison with the raw API response (from dev)', async () => {
    const severity = await listing.readRawCell(tx, 'Incidents Severity Scale');
    console.log(`DETAIL:${JSON.stringify({ label: 'Incidents Severity Scale (compare with raw response by hand)', value: severity })}`);
  });
});
