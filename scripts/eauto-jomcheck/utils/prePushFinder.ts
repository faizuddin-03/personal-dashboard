import { Page } from '@playwright/test';
import { BoJomCheckTransactionEnquiryPage, EnquiryRow } from '../pages/BoJomCheckTransactionEnquiryPage';
import { BoJomCheckReportListingPage } from '../pages/BoJomCheckReportListingPage';
import { CONFIG } from '../data/config';

// Finds a PRE-PUSH transaction for TS27 in BackOffice (TS31 used to share
// this; since 2026-10-05 it creates its own failed transaction via eSim), so the person
// does not have to know one. Run by the dashboard's "Find data" button as its
// own headless, fast Playwright run (tests/find-pre-push-data.spec.ts); the
// result is shown in the TS row for the person to paste into the vehicle no.
// field. Faizuddin, 2026-10-05: "TS27 and 32 [sic] is taking too long. can
// you make for these both TS to have a button in their row, where it will
// check for available data headless and fast in the background. after
// finishing, it will display the data to be used, so i can copy and paste in
// the main handling up top in the dashboard" / "revert the TS27 and 31 to
// accept value, and run the checking".
//
// Search rule (knowledge/automation-playbook.md → "Searching for existing
// data"): one calendar month per Enquiry search (eAuto's one-month date-range
// rule), starting with August 2026 — the month before September — and an
// OLDER month only when the month has nothing usable. ALL companies are
// considered (Faizuddin, 2026-10-05: "make the data checker does not check
// for my company only. it will check for all available company. same goes
// for TS27 checker"); the company is shown with the result, because TS31's
// UCD half only sees the UCD login's own company (live, 2026-10-05: NH4566
// from another company gave "No record found. Try again." in UCD) — pick a
// result whose company matches the UCD login you will run TS31 with.

export const PRE_PUSH_SEARCH_BEFORE = new Date(2026, 8, 1); // 1 Sep 2026 — windows end before this
export const PRE_PUSH_MAX_MONTHS_BACK = 12;

export interface MonthWindow { from: Date; to: Date; name: string }

/** Month windows [from, to] going back from the month before PRE_PUSH_SEARCH_BEFORE. */
export function monthWindowsBefore(): MonthWindow[] {
  const out: MonthWindow[] = [];
  for (let back = 0; back < PRE_PUSH_MAX_MONTHS_BACK; back++) {
    const from = new Date(PRE_PUSH_SEARCH_BEFORE.getFullYear(), PRE_PUSH_SEARCH_BEFORE.getMonth() - 1 - back, 1);
    const to = new Date(from.getFullYear(), from.getMonth() + 1, 0); // last day of that month
    out.push({ from, to, name: from.toLocaleString('en-GB', { month: 'long', year: 'numeric' }) });
  }
  return out;
}

export interface FoundData {
  /** Which TS this is for. */
  scenario: 'TS27' | 'TS31';
  vehicleNo: string;
  transactionNo: string;
  createdAt: string;
  companyName: string;
  /** Month window the record was found in, as the page showed it. */
  searched: string;
  /** Extra columns worth seeing before pasting (TS27: the 3 claim columns). */
  extra: Record<string, string>;
}

export const detail = (label: string, value: string) => console.log(`DETAIL:${JSON.stringify({ label, value })}`);

/** Every Enquiry row of one month window with the given status, across all
 *  result pages, any company. */
async function enquiryRowsFor(enquiry: BoJomCheckTransactionEnquiryPage, w: MonthWindow, status: 'Approved' | 'Failed'): Promise<{ rows: EnquiryRow[]; total: number; range: string; pages: number }> {
  await enquiry.goto();
  const range = await enquiry.searchByStatusBetween(w.from, w.to, status);
  const rows: EnquiryRow[] = [];
  let total = 0;
  let pages = 0;
  do {
    pages++;
    const page = await enquiry.readRows();
    total += page.length;
    rows.push(...page.filter(r => r.payment === 'OK' && r.txStatus === status && r.vehicleNo && r.vehicleNo !== '-'));
  } while (await enquiry.nextResultsPage());
  return { rows, total, range, pages };
}

const TS27_CLAIM_COLUMNS = ['Odometer Reading', 'Type of Claim', 'Total No. of Parts Approved for Change'] as const;
type ListingRow = Awaited<ReturnType<BoJomCheckReportListingPage['readRow']>>;

/** Opens a NEW tab in the same (logged-in) context, searches the BO Report
 *  Listing for `vehicleNo` and returns its pre-push 1-claim row, if any,
 *  plus a description of every row seen. Closes the tab. */
async function checkVehicleForOneClaimRow(page: Page, vehicleNo: string): Promise<{ row?: ListingRow; seen: string[] }> {
  const tab = await page.context().newPage();
  try {
    const listing = new BoJomCheckReportListingPage(tab);
    await listing.goto();
    await listing.searchByVehicleNo(vehicleNo);
    const count = await listing.getResultCount();
    const seen: string[] = [];
    for (let i = 0; i < count; i++) {
      const r = await listing.readRow(i);
      const numbered = TS27_CLAIM_COLUMNS.some(c => /^1\./.test(r[c]));
      seen.push(`${r['Transaction Number']} (Possible Total Loss ${r['Possible Total Loss']}, ${numbered ? '2+ claims' : '1 claim'})`);
      if (r['Possible Total Loss'] === 'N/A' && !numbered && r['Odometer Reading'] !== '-') return { row: r, seen };
    }
    return { seen };
  } finally {
    await tab.close().catch(() => {});
  }
}

/** TS27: an Approved pre-push transaction whose BO Report Listing row has ONE
 *  claim (Possible Total Loss "N/A", no "1." numbering, Odometer not "-").
 *  Checks every approved vehicle of the month; older month only when the
 *  whole month has no match. */
export async function findOneClaimPrePushVehicle(page: Page): Promise<FoundData> {
  const enquiry = new BoJomCheckTransactionEnquiryPage(page);
  const listing = new BoJomCheckReportListingPage(page);
  const tried = new Set<string>();

  for (const w of monthWindowsBefore()) {
    const { rows, total, range, pages } = await enquiryRowsFor(enquiry, w, 'Approved');
    const vehicles = [...new Set(rows.map(r => r.vehicleNo.toUpperCase()))].filter(v => !tried.has(v));
    detail(`${w.name} (${range}) — approved`, `${total} row(s) on ${pages} page(s); ${vehicles.length} vehicle(s), all companies: ${vehicles.join(', ') || 'none'}`);
    if (!vehicles.length) continue;

    // Check the vehicles CONFIG.findConcurrency at a time, each in its own
    // tab of the same logged-in browser context (same pattern as
    // defaultConcurrency's "parallel worker pages sharing the one login").
    // Faizuddin, 2026-10-05: "make it open 10 tabs at once, but of course,
    // headless so that i cant see it".
    for (let start = 0; start < vehicles.length; start += CONFIG.findConcurrency) {
      const batch = vehicles.slice(start, start + CONFIG.findConcurrency);
      batch.forEach(v => tried.add(v));
      detail(`${w.name} — checking ${batch.length} vehicle(s) in parallel`, batch.join(', '));
      const results = await Promise.all(batch.map(v => checkVehicleForOneClaimRow(page, v)));
      for (let i = 0; i < batch.length; i++) {
        const v = batch[i];
        const { row: r, seen } = results[i];
        detail(`${v} rows`, seen.join('; ') || 'none');
        if (r) {
          const src = rows.find(x => x.vehicleNo.toUpperCase() === v && x.transactionNo === r['Transaction Number']) ?? rows.find(x => x.vehicleNo.toUpperCase() === v)!;
          return {
            scenario: 'TS27', vehicleNo: v, transactionNo: r['Transaction Number'], createdAt: r['Date & Time'] || src.createdAt,
            companyName: src.companyName, searched: `${w.name} (${range})`,
            extra: Object.fromEntries(TS27_CLAIM_COLUMNS.map(c => [c, r[c]])),
          };
        }
      }
    }
    detail(w.name, `none of the ${vehicles.length} approved vehicle(s) has a pre-push 1-claim row — trying the older month`);
  }
  throw new Error(`No pre-push 1-claim transaction in the ${PRE_PUSH_MAX_MONTHS_BACK} months before ${PRE_PUSH_SEARCH_BEFORE.toLocaleDateString('en-GB')}. Vehicles checked: ${[...tried].join(', ') || 'none'}`);
}

/** TS31 (existing failed transaction): a Failed pre-push transaction with
 *  Payment "OK", ANY company (Faizuddin, 2026-10-05: "it will check for all
 *  available company"). The company is shown with the result — the TS checks
 *  that row from BackOffice, so another company's is fine. Older month only
 *  when the month has none. */
export async function findFailedPrePushVehicle(page: Page): Promise<FoundData> {
  const enquiry = new BoJomCheckTransactionEnquiryPage(page);
  for (const w of monthWindowsBefore()) {
    const { rows, total, range, pages } = await enquiryRowsFor(enquiry, w, 'Failed');
    detail(`${w.name} (${range}) — failed`, `${total} row(s) on ${pages} page(s); ${rows.length} with Payment OK, all companies: ${rows.map(r => `${r.vehicleNo} ${r.transactionNo} ${r.createdAt} (${r.companyName})`).join('; ') || 'none'}`);
    if (!rows.length) continue;
    const hit = rows[0];
    return {
      scenario: 'TS31', vehicleNo: hit.vehicleNo.toUpperCase(), transactionNo: hit.transactionNo, createdAt: hit.createdAt,
      companyName: hit.companyName, searched: `${w.name} (${range})`, extra: { Payment: hit.payment, 'Tx Status': hit.txStatus },
    };
  }
  throw new Error(`No failed transaction with Payment "OK" in the ${PRE_PUSH_MAX_MONTHS_BACK} months before ${PRE_PUSH_SEARCH_BEFORE.toLocaleDateString('en-GB')}.`);
}
