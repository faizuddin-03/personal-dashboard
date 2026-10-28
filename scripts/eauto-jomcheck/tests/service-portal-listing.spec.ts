import { test, expect, Page } from '@playwright/test';
import * as fs from 'node:fs';
import JSZip from 'jszip';
import pdfParse from 'pdf-parse';
import { LoginPage } from '../pages/LoginPage';
import { ServicePortalLoginPage } from '../pages/ServicePortalLoginPage';
import { ServicePortalJomCheckListingPage, parseSeverityCounters } from '../pages/ServicePortalJomCheckListingPage';
import { getUser } from '../data/users';
import { CONFIG } from '../data/config';
import { readExport, baseHeader } from '../utils/exportReader';
import { registerEsimRestoreHook, setClaimsAndBuy, vehicleNoFor } from '../utils/esimPurchase';

// EAINT-12339, section F ("SERVICE PORTAL — JOMCHECK REPORT LISTING"), TS37-TS39.
//
// Each test BUYS ITS OWN REPORT and shares it (Faizuddin, 2026-10-05: "user
// will need to do Jomcheck purchase ... Automation will need to select
// 'X STAR TECHNOLOGY MALAYSIA SDN BHD'. only after that can it make
// payment"). Flow: eSim sets 2 claims (CATASTROPHIC + MEDIUM, so the
// Severity counters are known) → UCD purchase, tick the share checkbox for
// CONFIG.shareCompany BEFORE Pay Now → log out → Service Portal → search the
// vehicle no. with Shared Date = today. The Service Portal listing only
// shows SHARED reports (required Shared Date filter, "JomCheck Report
// Sharing Date" column — _reference/html/eauto/service-portal-home-and-jomcheck-listing.html),
// and a From/To search accepts at most one month (knowledge/quirks.md → Dates).
//
// This supersedes the 2026-10-04 "no purchase, no sharing" build.
//
// Counter ORDER is never asserted — SRD vs mockup differ (OQ-07). Only the
// 6 band names and their counts are.

registerEsimRestoreHook();

const BANDS = ['Catastrophic', 'Critical', 'High', 'Low', 'Medium', 'Severe'];
const COUNTER_COLUMN = 'Count(s) of Incidents Severity Scale';
/** One CATASTROPHIC and one MEDIUM claim → Catastrophic 1, Medium 1, rest 0. */
const CLAIMS = [
  { 'Claims Type (ICAP code)': '1', Severity: 'CATASTROPHIC' },
  { 'Claims Type (ICAP code)': '1', Severity: 'MEDIUM' },
];
const EXPECTED_COUNTERS = [
  { band: 'Catastrophic', count: 1 }, { band: 'Critical', count: 0 }, { band: 'High', count: 0 },
  { band: 'Low', count: 0 }, { band: 'Medium', count: 1 }, { band: 'Severe', count: 0 },
];
const detail = (label: string, value: string) => console.log(`DETAIL:${JSON.stringify({ label, value })}`);
const counterText = (c: Array<{ band: string; count: number }>) => c.map(x => `${x.band} - ${x.count}`).join(', ');
const sortedCounters = (c: Array<{ band: string; count: number }>) => [...c].sort((a, b) => a.band.localeCompare(b.band));

/** Buys + shares a report for `vehicleNo`, then opens the Service Portal
 *  listing searched by that vehicle (Shared Date = today). Returns the
 *  listing and the index of the row this run created. */
async function buyShareAndOpenListing(page: Page, vehicleNo: string): Promise<{ listing: ServicePortalJomCheckListingPage; rowIndex: number; tx: string }> {
  const { tx } = await setClaimsAndBuy(page, vehicleNo, CLAIMS, {}, { shareWith: CONFIG.shareCompany });
  detail('Transaction No.', tx);

  const ucdLogin = new LoginPage(page);
  const spLogin = new ServicePortalLoginPage(page);
  const listing = new ServicePortalJomCheckListingPage(page);

  await test.step('Log out of UCD and log in to Service Portal', async () => {
    await ucdLogin.logout();
    await spLogin.login(getUser('servicePortal'));
  });

  await test.step('Open the JomCheck Report Listing', async () => {
    await listing.goto();
  });

  const rowIndex = await test.step(`Search by vehicle number ${vehicleNo}, Shared Date today to today`, async () => {
    await listing.search({ vehicleNo });
    detail('Shared Date range', await listing.getSharedDateRange());
    const count = await listing.getResultCount();
    detail('Rows listed', String(count));
    expect(count, `${vehicleNo} is not on the Service Portal listing after sharing with ${CONFIG.shareCompany}`).toBeGreaterThan(0);
    // Newest first is not guaranteed — take the row whose vehicle no. matches.
    for (let i = 0; i < count; i++) {
      const row = await listing.readRow(i);
      if ((row['Search by Vehicle No.'] ?? '').toUpperCase() === vehicleNo.toUpperCase()) return i;
    }
    throw new Error(`No listed row carries vehicle no. ${vehicleNo}`);
  });

  return { listing, rowIndex, tx };
}

test('12339_TS37: Verify Service Portal JomCheck Report Listing Export & bulk download reflect the updated Severity ranges', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS37_VEHICLE_NO || vehicleNoFor('0137');
  const { listing, rowIndex } = await buyShareAndOpenListing(page, vehicleNo);

  const row = await test.step('Read the new report\'s row', async () => {
    const r = await listing.readRow(rowIndex);
    detail('Listing counters', counterText(parseSeverityCounters(r[COUNTER_COLUMN] ?? '')));
    return r;
  });

  const sheet = await test.step('Export XLSX', async () => {
    const file = await listing.downloadExport('12339_TS37-export');
    return readExport(file, COUNTER_COLUMN);
  });

  await test.step(`Excel carries a "${COUNTER_COLUMN}" column and no Possible Total Loss / Possible BER column`, async () => {
    const headers = sheet.headers.map(baseHeader);
    detail('Export headers', headers.join(' | '));
    expect(headers).toContain(COUNTER_COLUMN);
    expect(headers).not.toContain('Possible Total Loss');
    expect(headers).not.toContain('Possible BER');
  });

  await test.step('Excel counters for the new report carry all 6 bands and match the listing', async () => {
    const headers = sheet.headers.map(baseHeader);
    const col = (h: string) => headers.indexOf(h);
    const vnCol = col('Search by Vehicle No.');
    expect(vnCol, 'Export has no "Search by Vehicle No." column').toBeGreaterThanOrEqual(0);
    const exportRow = sheet.rows.find(r => (r[vnCol]?.text ?? '').toUpperCase() === vehicleNo.toUpperCase());
    expect(exportRow, `${vehicleNo} is not in the export`).toBeTruthy();
    const listed = parseSeverityCounters(row[COUNTER_COLUMN] ?? '');
    const exported = parseSeverityCounters(exportRow![col(COUNTER_COLUMN)]?.text ?? '');
    detail('Export counters', counterText(exported));
    expect(exported.map(c => c.band).sort(), 'Export does not carry all 6 bands').toEqual(BANDS);
    expect(sortedCounters(exported), 'Export counts differ from the listing').toEqual(sortedCounters(listed));
  });

  await test.step('Tick Download on the new report\'s row', async () => {
    await listing.checkDownload(rowIndex);
    expect(await listing.getBulkDownloadLabel()).toBe('Download files (1)');
  });

  await test.step('Bulk download — the ZIP holds 1 readable PDF report', async () => {
    const zipPath = await listing.downloadBulk('12339_TS37-bulk-download');
    const zip = await JSZip.loadAsync(fs.readFileSync(zipPath));
    const pdfs = Object.values(zip.files).filter(f => !f.dir && /\.pdf$/i.test(f.name));
    detail('ZIP contents', pdfs.map(f => f.name).join(', ') || 'no PDF');
    expect(pdfs.length).toBe(1);
    const text = (await pdfParse(await pdfs[0].async('nodebuffer'))).text.replace(/\s+/g, ' ').trim();
    expect(text.length, `${pdfs[0].name} has no text`).toBeGreaterThan(0);
    // Vehicle no. in the PDF is logged only — an eSim-connected report is a
    // dummy PDF that prints another vehicle (Golden Rule #1).
    detail(`${vehicleNo} printed in the PDF`, text.toUpperCase().includes(vehicleNo.toUpperCase()) ? 'yes' : 'no (eSim dummy PDF)');
  });
});

test('12339_TS38: Verify Service Portal Severity counters show correctly from the eAuto Sdn Bhd (superadmin) account view', async ({ page }) => {
  // The default Service Portal account (data/users.ts) is the superadmin.
  const vehicleNo = process.env.JOMCHECK_TS38_VEHICLE_NO || vehicleNoFor('0138');
  const { listing, rowIndex } = await buyShareAndOpenListing(page, vehicleNo);

  await test.step('Superadmin sees all 6 counters with the correct counts for the report', async () => {
    const row = await listing.readRow(rowIndex);
    const counters = parseSeverityCounters(row[COUNTER_COLUMN] ?? '');
    detail('Counters (order as shown, OQ-07)', counterText(counters));
    expect(counters.map(c => c.band).sort(), 'Not all 6 bands are shown').toEqual(BANDS);
    expect(sortedCounters(counters)).toEqual(EXPECTED_COUNTERS);
  });
});

test('12339_TS39: Verify Service Portal JomCheck Report Listing shows no Possible Total Loss/BER, Type of Claim, Odometer Reading or Parts column', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_TS39_VEHICLE_NO || vehicleNoFor('0139');
  const { listing, rowIndex } = await buyShareAndOpenListing(page, vehicleNo);

  const headers = await test.step('Read every column header', async () => {
    const h = (await listing.getColumnHeaders()).map(x => x.trim());
    detail('Headers', h.join(' | '));
    return h;
  });

  for (const absent of ['Possible Total Loss', 'Possible BER', 'Type of Claim', 'Odometer Reading', 'Total No. of Parts Approved']) {
    await test.step(`"${absent}" column is not displayed`, async () => {
      expect(headers.some(h => h.toLowerCase().includes(absent.toLowerCase()))).toBe(false);
    });
  }

  await test.step('Total Loss History is still displayed', async () => {
    expect(headers).toContain('Total Loss History');
    const value = (await listing.readRow(rowIndex))['Total Loss History'];
    detail('Total Loss History (new report)', value);
    expect(value, 'Total Loss History is blank').not.toBe('');
  });
});
