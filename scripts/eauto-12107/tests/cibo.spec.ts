import { test, expect, type Page } from '@playwright/test';
import {
  CiboLoginPage, CiboListingPage, CiboPaymentManagementPage, CiboPaymentReportPage, CiboTransactionDetailsPage,
  parseCiboCsv, type ListingRow,
} from '../pages/cibo/CiboPages';
import {
  CIBO, CIBO_REFS, PAYMENT_MODE, FIUU_EWALLET_GROUP, FIUU_EWALLET_OPTIONS, required,
} from '../data/cibo';
import { findBlankRefs, isTyped, type RefKind } from '../utils/ciboRefFinder';
import { INSURANCE_DATES, resolveInsuranceDates, lastWeek, weekFrom } from '../utils/insuranceDates';

// CIBO leg of EAINT-12107 (12107_TS06, Payment Channel filter) and all of
// EAINT-12327 (Payment Mode column format). Test script: the combined
// workbook, rows 9-15 and 20-27.
//
// Selectors from the live staging capture of 2026-10-16
// (_reference/html/cibo/). That capture was taken BEFORE 12107 / 12327 were
// pushed to staging, so the points below are the pre-push baseline, not
// defects — recheck after the push:
//   - No "ShopeePay - SPayLater" option under "Fiuu - eWallet" — correct:
//     SPayLater shows as ShopeePay (dev, 2026-10-19; 12107_TS06 step 12).
//   - BoldPay FPX rows show "BoldPay | Online Banking – FPX" with no bank.
//   - The dev-patched ShopeePay row shows "Fiuu | eWallet – ShopeePay"
//     without "– Full Amount – Single Payment".
//   - Fiuu card / FPX rows show bare "Fiuu" ((Open) in the TS).
//   - Payment Report rows never loaded (summary POST hung > 60 s).
//   - In the Transaction Management export, Payment Mode sits between
//     "Discount Code" and "Payment Amount (RM)".
//
// Transaction refs come from the dashboard (CIBO_REF_*). A ref left blank is
// found on CIBO by the run itself (utils/ciboRefFinder.ts — Faizuddin,
// 2026-10-19: "any values that the automation should decide by itself").
// A kind with no matching transaction on CIBO logs "not found" for that
// line and the TS checks the rest.

const detail = (label: string, value: string) => console.log('DETAIL:' + JSON.stringify({ label, value }));

/** The EW rule (SRD 12107 v1.1 REQ-014, 11.09.2026) applies to new data only.
 *  Dev, relayed by Faizuddin 2026-10-20: "yes, existing data will not change.
 *  only new data will" — e.g. BR69005754-58, paid 07-08 Sep 2026, keep SFX. */
const EW_FROM = '2026-09-11';
/** True when a "… dd-mm-yyyy hh:mm" payment cell is dated before EW_FROM. */
function paidBeforeEw(cell: string | undefined): boolean {
  const m = /(\d{2})-(\d{2})-(\d{4})/.exec(cell ?? '');
  return !!m && `${m[3]}-${m[2]}-${m[1]}` < EW_FROM;
}

/** Transaction Listing headers as seen on staging 2026-10-16 (with the new column). */
const TXN_LISTING_HEADERS = [
  '#', 'Transaction Ref. No.', 'Transaction Created Date', 'Insurance Created Date', 'UCD', 'UCD Name',
  'Vehicle No', 'Vehicle Type', 'Insured', 'Payment', 'Payment Mode', 'Discount Code', 'Road Tax',
  'Ins. Co.', 'Transaction Status', 'JPJ', 'Remark',
];
/** Payment Report headers as seen on staging 2026-10-16. */
const PAYMENT_REPORT_HEADERS = [
  '#', 'UCD company / PIC', 'UCD Name', 'Recipient Reference', 'State', 'Insurance Company', 'Reference No',
  'System Ref No', 'Invoice / Receipt No.', 'Invoice / Receipt Date', 'Vehicle No', 'eCertificate No',
  'Payment Ref ID', 'Payment Mode', 'Payment To', 'Gross Premium (RM)', 'Service Tax (RM)', 'Stamp Duty (RM)',
  'Total Premium (RM)', 'Road Tax (RM)', 'Processing/Delivery Fee (RM)', 'Discount (RM)', 'Total Amount (RM)',
  'Commission Amount (RM)',
];

/** The 7 lines of 12327_TS12, each with its ref and expected value. */
function paymentModeCases(): { label: string; ref: string; expected: string | RegExp }[] {
  return [
    { label: 'BoldPay TouchNGo', ref: CIBO_REFS.boldPayTng, expected: PAYMENT_MODE.boldPayTng },
    // FPX is Fiuu, not BoldPay; format from the SA (2026-10-20):
    // "Fiuu | Online Banking – FPX-Bank Name".
    { label: 'Fiuu FPX', ref: CIBO_REFS.fiuuFpx, expected: PAYMENT_MODE.fiuuFpx },
    { label: 'BoldPay Credit/Debit Card', ref: CIBO_REFS.boldPayCard, expected: PAYMENT_MODE.boldPayCard },
    { label: 'Fiuu ShopeePay', ref: CIBO_REFS.shopeePay, expected: PAYMENT_MODE.shopeePay },
    { label: 'Fiuu GrabPay', ref: CIBO_REFS.grabPay, expected: PAYMENT_MODE.grabPay },
    { label: 'Fiuu PayLater by Grab', ref: CIBO_REFS.grabPayLater, expected: PAYMENT_MODE.grabPayLater },
  ];
}

/** The 6 payment-method refs 12327_TS12 / TS13-TS15 look up. SPayLater was
 *  dropped in TS v3 (20_10_26): it shows the same value as ShopeePay. */
const METHOD_KINDS: RefKind[] = ['boldPayTng', 'fiuuFpx', 'boldPayCard', 'shopeePay', 'grabPay', 'grabPayLater'];

/** 12327_TS12 / TS13-TS15 need at least one of the 6 payment-method refs. */
function anyCase() {
  const given = paymentModeCases().filter(c => c.ref);
  if (!given.length) throw new Error('No payment-method transaction typed on /eauto/12107 or found on CIBO.');
  return given;
}

function softMatch(actual: string, expected: string | RegExp, msg: string) {
  if (typeof expected === 'string') expect.soft(actual, msg).toBe(expected);
  else expect.soft(actual, msg).toMatch(expected);
}

const matches = (actual: string | undefined, expected: string | RegExp) =>
  typeof expected === 'string' ? actual === expected : expected.test(actual ?? '');

/** Red box on `ref`'s `header` cell in the rows on screen, plus a caption —
 *  failure evidence (Faizuddin, 2026-10-20). */
async function flagCell(listing: CiboListingPage, ref: string, header: string, label: string, note: string): Promise<void> {
  const rows = await listing.rows().catch(() => [] as ListingRow[]);
  const i = rows.findIndex(r => Object.values(r).some(v => v.startsWith(ref)));
  await listing.captureIssue(label, i >= 0 ? await listing.cell(i, header) : listing.headerCell(header), note);
}

/** Logs in, fills any blank refs in `kinds` from CIBO, then opens `menu`. */
/** reportDates: true = Payment Report on the last 7 days (refs insured that
 *  week); 'perRef' = a week from each ref's own Insurance Created Date
 *  (12327_TS19 — its eAuto / RMS rows are years old; Faizuddin, 2026-10-19:
 *  "limit the range to 1 week only"). */
async function loginAndOpen(page: Page, menu: string, kinds: RefKind[] = [], reportDates: boolean | 'perRef' = false): Promise<CiboLoginPage> {
  reportWindow = reportDates === 'perRef' ? 'perRef' : 'lastWeek';
  required(CIBO.loginId, 'CIBO login ID');
  required(CIBO.password, 'CIBO password');
  const login = new CiboLoginPage(page);
  await test.step('Open the CIBO login page', async () => { await login.open(); });
  await test.step('Log in to CIBO', async () => { await login.login(); });
  if (kinds.some(k => !isTyped(k))) await findBlankRefs(page, login, kinds, menu, reportDates === true);
  else await test.step(`Open the ${menu} page`, async () => { await login.openMenu(menu); });
  // TS that read Payment Report need each ref's Insurance Created Date to
  // narrow the search to one week (Faizuddin, 2026-10-19).
  if (reportDates) await resolveInsuranceDates(page, login, kinds.map(k => CIBO_REFS[k].trim()).filter(Boolean), menu);
  return login;
}

const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/** Payment Report pages already set to the one-week window. */
const narrowedReports = new WeakSet<CiboListingPage>();
let reportWindow: 'lastWeek' | 'perRef' = 'lastWeek';
/** Refs left out of a Payment Report check because they are older than the window. */
const skippedRefs = new Set<string>();

/** Sets Insurance Created From / Till on Payment Report (one week at most). */
async function narrowReport(report: CiboPaymentReportPage, w: { from: Date; till: Date }): Promise<void> {
  await test.step(`Set Insurance Created From ${fmtDate(w.from)} and Till ${fmtDate(w.till)}`, async () => {
    await report.setInsuranceCreatedRange(w.from, w.till);
  });
}

/** Search one ref on a listing and return its row (or fail the step). */
async function findRow(listing: CiboListingPage, ref: string, where: string): Promise<{ row: ListingRow; index: number }> {
  return (await findRowOrSkip(listing, ref, where, false))!;
}

/** Like findRow, but with soft = true a ref that is not listed fails softly
 *  and returns null, so the next ref is still checked. Payment Report only
 *  lists insured transactions — a failed-payment ref is not there
 *  (2026-10-19). */
async function findRowOrSkip(listing: CiboListingPage, ref: string, where: string, soft = true): Promise<{ row: ListingRow; index: number } | null> {
  let found: { row: ListingRow; index: number } | null = null;
  // A ref already on screen is read from there: one Payment Report search
  // takes up to 2 minutes on staging (2026-10-19).
  let onScreen = (await listing.rows().catch(() => [])).findIndex(r => Object.values(r).some(v => v.startsWith(ref)));
  if (listing instanceof CiboPaymentReportPage) {
    const date = INSURANCE_DATES[ref];
    if (date === null) {
      // No Insurance Created Date on CIBO = never insured = not on Payment Report.
      if (soft) expect.soft(null, `${ref} should be listed on ${where} (it has no Insurance Created Date)`).not.toBeNull();
      else throw new Error(`${ref} has no Insurance Created Date, so it cannot be on ${where}`);
      return null;
    }
    // Payment Report is always searched on the 7 days up to today (Faizuddin,
    // 2026-10-19: "search for a week from the current date"). A ref created
    // earlier cannot show there, so it is reported instead of searched.
    if (reportWindow === 'perRef' && date) {
      await narrowReport(listing, weekFrom(date));
      onScreen = -1;
    } else {
    const week = lastWeek();
    if (date && date < week.from) {
      const msg = `${ref} got insurance on ${fmtDate(date)}, before the one-week Payment Report window (${fmtDate(week.from)} - ${fmtDate(week.till)})`;
      if (!soft) throw new Error(`${msg} — type a newer ref on /eauto/12107`);
      console.log('DETAIL:' + JSON.stringify({ label: `${ref} on ${where}`, value: `not checked — ${msg}` }));
      skippedRefs.add(ref);
      return null;
    }
    if (!narrowedReports.has(listing)) { await narrowReport(listing, week); narrowedReports.add(listing); onScreen = -1; }
    }
  }
  await test.step(onScreen >= 0 ? `Find ${ref} on the ${where} rows already shown` : `Search ${ref} on ${where}`, async () => {
    if (onScreen < 0) {
      try { await listing.search(ref); } catch (e) { if (!soft) throw e; }
    }
    const rows = await listing.rows().catch(() => []);
    const index = rows.findIndex(r => Object.values(r).some(v => v.startsWith(ref)));
    found = index < 0 ? null : { row: rows[index], index };
    if (soft) expect.soft(found, `${ref} should be listed on ${where}`).not.toBeNull();
    else expect(found, `${ref} should be listed on ${where}`).not.toBeNull();
  });
  return found;
}

async function readPaymentMode(listing: CiboListingPage, ref: string, where: string, ts: string): Promise<string> {
  const { row, index } = await findRow(listing, ref, where);
  let value = '';
  await test.step(`Read Payment Mode for ${ref}`, async () => {
    await listing.highlightCell(index, 'Payment Mode');
    value = row['Payment Mode'] ?? '';
    detail(`${ts} ${where} Payment Mode ${ref}`, value);
  });
  return value;
}

test.describe('EAINT-12327 — CIBO Payment Mode column', () => {
  // Payment Report takes up to a minute per search on staging and several TS
  // search one ref after another (12327_TS15 / TS15 ran out at 6 minutes,
  // 2026-10-19). Kept under the 12107 run route's 20-minute cap.
  test.describe.configure({ timeout: 1_080_000 });

  test('12327_TS11: New Payment Mode column in Transaction Listing', async ({ page }) => {
    const ts = '12327_TS11';
    await loginAndOpen(page, 'Transaction Management', ['grabPay']);
    const listing = new CiboListingPage(page);
    const value = await readPaymentMode(listing, required(CIBO_REFS.grabPay, 'GrabPay Full Amount (12107_TS01)'), 'Transaction Listing', ts);

    await test.step('Confirm Payment Mode sits between Payment and Discount Code', async () => {
      const h = await listing.headers();
      const pm = h.indexOf('Payment Mode');
      expect(pm, 'Payment Mode column is shown').toBeGreaterThan(-1);
      expect.soft(h[pm - 1], 'Column before Payment Mode').toBe('Payment');
      expect.soft(h[pm + 1], 'Column after Payment Mode').toBe('Discount Code');
      if (h[pm - 1] !== 'Payment' || h[pm + 1] !== 'Discount Code') await listing.captureIssue(`${ts}-column-position`,
        listing.headerCell('Payment Mode'), `Payment Mode sits between "${h[pm - 1]}" and "${h[pm + 1]}"`);
    });
    await test.step('Confirm the value format is "<gateway> | <method> – <details>"', async () => {
      expect.soft(value).toMatch(/^\S+ \| .+ – .+$/);
      if (!/^\S+ \| .+ – .+$/.test(value)) await flagCell(listing, CIBO_REFS.grabPay, 'Payment Mode', `${ts}-format`, `Expected "<gateway> | <method> – <details>"`);
    });
    await test.step('Confirm all other columns are unchanged', async () => {
      expect.soft(await listing.headers()).toEqual(TXN_LISTING_HEADERS);
      await listing.captureEvidence(`${ts}-transaction-listing`);
    });
  });

  test('12327_TS12: Payment Mode value per payment method (7 strings)', async ({ page }) => {
    const ts = '12327_TS12';
    await loginAndOpen(page, 'Transaction Management', METHOD_KINDS);
    const listing = new CiboListingPage(page);
    anyCase();
    for (const c of paymentModeCases()) {
      if (!c.ref) { await test.step(`${c.label}: no transaction typed or found on CIBO — not checked`, async () => detail(`${ts} ${c.label}`, 'not found')); continue; }
      const value = await readPaymentMode(listing, c.ref, 'Transaction Listing', ts);
      await test.step(`Confirm ${c.label} shows ${typeof c.expected === 'string' ? `"${c.expected}"` : '"Fiuu | Online Banking – FPX-<Bank Name>"'}`, async () => {
        softMatch(value, c.expected, `${c.label} (${c.ref})`);
        await listing.captureEvidence(`${ts}-${c.ref}`);
        if (!matches(value, c.expected)) await flagCell(listing, c.ref, 'Payment Mode', `${ts}-${c.ref}`,
          `Expected ${typeof c.expected === 'string' ? `"${c.expected}"` : '"Fiuu | Online Banking – FPX-<Bank Name>"'}`);
      });
    }
  });

  test('12327_TS13: Transaction with no payment shows "-"', async ({ page }) => {
    const ts = '12327_TS13';
    await loginAndOpen(page, 'Transaction Management', ['noPayment']);
    const listing = new CiboListingPage(page);
    const value = await readPaymentMode(listing, required(CIBO_REFS.noPayment, 'No payment (12327_TS13)'), 'Transaction Listing', ts);
    await test.step('Confirm Payment Mode shows "-"', async () => {
      await listing.captureEvidence(`${ts}-${CIBO_REFS.noPayment}`);
      if (value !== '-') await flagCell(listing, CIBO_REFS.noPayment, 'Payment Mode', `${ts}-${CIBO_REFS.noPayment}`, 'Expected "-"');
      expect(value).toBe('-');
    });
  });

  test('12327_TS14: Transaction Listing export', async ({ page }) => {
    const ts = '12327_TS14';
    await loginAndOpen(page, 'Transaction Management', [...METHOD_KINDS, 'noPayment']);
    const listing = new CiboListingPage(page);
    const cases = [
      ...anyCase(),
      { label: 'No payment', ref: required(CIBO_REFS.noPayment, 'No payment (12327_TS13)'), expected: '-' as string | RegExp },
    ];
    let headerChecked = false;
    for (const c of cases) {
      const onPage = await readPaymentMode(listing, c.ref, 'Transaction Listing', ts);
      let exported: Record<string, string> | undefined;
      await test.step(`Click [Export] for ${c.ref} and open the file`, async () => {
        const { text } = await listing.exportAsText(`${ts}-export-${c.ref}`);
        const csv = parseCiboCsv(text, 'Payment Mode');
        exported = csv.rows.find(r => r['Transaction Ref. No.'] === c.ref);
        expect(exported, `${c.ref} is in the export`).toBeTruthy();
        if (!headerChecked) {
          headerChecked = true;
          const i = csv.header.indexOf('Payment Mode');
          detail(`${ts} export columns around Payment Mode`, `${csv.header[i - 1]} | Payment Mode | ${csv.header[i + 1]}`);
          expect.soft(csv.header[i - 1], 'Export: column before Payment Mode').toMatch(/^Payment/);
          expect.soft(csv.header[i + 1], 'Export: column after Payment Mode').toBe('Discount Code');
          // The file has no screenshot: the box goes on the column on screen,
          // the caption says where the file puts it.
          if (!/^Payment/.test(csv.header[i - 1] ?? '') || csv.header[i + 1] !== 'Discount Code') await listing.captureIssue(`${ts}-export-column-position`,
            listing.headerCell('Payment Mode'), `In the exported file, Payment Mode sits between "${csv.header[i - 1]}" and "${csv.header[i + 1]}"`);
        }
      });
      await test.step(`Confirm the exported Payment Mode for ${c.ref} matches the listing`, async () => {
        detail(`${ts} export Payment Mode ${c.ref}`, exported?.['Payment Mode'] ?? '');
        expect.soft(exported?.['Payment Mode'], `${c.label} export vs listing`).toBe(onPage);
        if (c.expected === '-') expect.soft(exported?.['Payment Mode'], 'No-payment row shows "-"').toBe('-');
        if (exported?.['Payment Mode'] !== onPage) await flagCell(listing, c.ref, 'Payment Mode', `${ts}-export-${c.ref}`,
          `Exported file shows "${exported?.['Payment Mode'] ?? '(row missing)'}"`);
      });
    }
  });

  test('12327_TS15: Payment Report Payment Mode format', async ({ page }) => {
    const ts = '12327_TS15';
    await loginAndOpen(page, 'Payment Report', METHOD_KINDS, true);
    const report = new CiboPaymentReportPage(page);
    // One week at most (Faizuddin, 2026-10-19): the 7 days up to today.
    await narrowReport(report, lastWeek());
    narrowedReports.add(report);
    await test.step('Click [Search]', async () => { await report.clickSearch(); });
    await test.step('Show 100 items per page', async () => { await report.choosePageSize(100); });
    await test.step('Confirm the Payment Mode column position is unchanged', async () => {
      const h = await report.headers();
      expect.soft(h).toEqual(PAYMENT_REPORT_HEADERS);
    });
    await test.step('Confirm no row shows "BoldPay" or "Fiuu" alone', async () => {
      const modes = (await report.rows()).map(r => r['Payment Mode']);
      detail(`${ts} Payment Mode values on page 1`, [...new Set(modes)].join(' / '));
      // Bare "Fiuu" is right for Fiuu card (Faizuddin, 2026-10-19: "it should
      // show just Fiuu"); only a bare BoldPay is wrong here. Fiuu FPX has its
      // own format since 2026-10-20 (SA) — checked on the FPX ref below.
      expect.soft(modes.filter(m => /^Bold ?Pay$/.test(m))).toEqual([]);
      await report.captureEvidence(`${ts}-payment-report`);
    });
    for (const c of anyCase()) {
      const hit = await findRowOrSkip(report, c.ref, 'Payment Report');
      if (!hit) { if (!skippedRefs.has(c.ref)) detail(`${ts} Payment Report Payment Mode ${c.ref}`, 'not listed on Payment Report'); continue; }
      const value = hit.row['Payment Mode'] ?? '';
      await test.step(`Read Payment Mode for ${c.ref}`, async () => {
        await report.highlightCell(hit.index, 'Payment Mode');
        detail(`${ts} Payment Report Payment Mode ${c.ref}`, value);
      });
      await test.step(`Confirm ${c.label} shows the new format`, async () => {
        softMatch(value, c.expected, `${c.label} (${c.ref})`);
        if (!matches(value, c.expected)) await flagCell(report, c.ref, 'Payment Mode', `${ts}-${c.ref}`,
          `Expected ${typeof c.expected === 'string' ? `"${c.expected}"` : '"Fiuu | Online Banking – FPX-<Bank Name>"'}`);
      });
    }
  });

  test('12327_TS16: Payment Report export', async ({ page }) => {
    const ts = '12327_TS16';
    await loginAndOpen(page, 'Payment Report', METHOD_KINDS, true);
    const report = new CiboPaymentReportPage(page);
    for (const c of anyCase()) {
      const hit = await findRowOrSkip(report, c.ref, 'Payment Report');
      if (!hit) { if (!skippedRefs.has(c.ref)) detail(`${ts} Payment Report ${c.ref}`, 'not listed on Payment Report'); continue; }
      const { row: pageRow, index } = hit;
      const onPage = pageRow['Payment Mode'] ?? '';
      const refOnPage = pageRow['Payment Ref ID'] ?? '';
      await test.step(`Read Payment Mode and Payment Ref ID for ${c.ref}`, async () => {
        await report.highlightCell(index, 'Payment Mode');
        await report.highlightCell(index, 'Payment Ref ID');
        detail(`${ts} Payment Report ${c.ref}`, `${onPage} · ${refOnPage}`);
      });
      await test.step(`Click [Export] for ${c.ref} and confirm Payment Mode and Payment Reference ID are identical`, async () => {
        const { text } = await report.exportAsText(`${ts}-export-${c.ref}`);
        const csv = parseCiboCsv(text, 'Payment Mode');
        const row = csv.rows.find(r => Object.values(r).some(v => v.startsWith(c.ref)));
        expect(row, `${c.ref} is in the export`).toBeTruthy();
        const refCol = csv.header.find(h => /Payment Ref/i.test(h));
        detail(`${ts} export ${c.ref}`, `${row?.['Payment Mode'] ?? ''} · ${refCol ? row?.[refCol] : 'no Payment Ref column'}`);
        expect.soft(row?.['Payment Mode'], `${c.label} export vs page`).toBe(onPage);
        if (row?.['Payment Mode'] !== onPage) await flagCell(report, c.ref, 'Payment Mode', `${ts}-export-${c.ref}`,
          `Exported file shows "${row?.['Payment Mode'] ?? '(row missing)'}"`);
        if (refCol && row?.[refCol] !== refOnPage) await flagCell(report, c.ref, 'Payment Ref ID', `${ts}-export-ref-${c.ref}`,
          `Exported file shows "${row?.[refCol] ?? '(row missing)'}"`);
        // TS v2 (19_10_26) expected 3-4: SRD 12107 REQ-015 e — the updated
        // Payment Reference ID is in the exported Payment Report file.
        expect.soft(refCol, 'Export has a Payment Reference ID column').toBeTruthy();
        if (refCol) {
          expect.soft(row?.[refCol], `${c.label} Payment Reference ID export vs page`).toBe(refOnPage);
          if (onPage.startsWith('Fiuu | eWallet')) expect.soft(row?.[refCol] ?? '', `${c.label} Payment Reference ID contains EW`).toContain('EW');
        }
      });
    }
  });

  test('12327_TS17: Same value on all 4 pages', async ({ page }) => {
    const ts = '12327_TS17';
    const login = await loginAndOpen(page, 'Transaction Management', ['grabPay'], true);
    const ref = required(CIBO_REFS.grabPay, 'GrabPay Full Amount (12107_TS01)');
    const listing = new CiboListingPage(page);
    const listed = await readPaymentMode(listing, ref, 'Transaction Listing', ts);
    await test.step('Confirm Transaction Listing shows the GrabPay Full Amount string', async () => {
      expect.soft(listed).toBe(PAYMENT_MODE.grabPay);
      if (listed !== PAYMENT_MODE.grabPay) await flagCell(listing, ref, 'Payment Mode', `${ts}-txn`, `Expected "${PAYMENT_MODE.grabPay}"`);
    });
    await test.step('Click [Export] and confirm the exported Transaction Listing', async () => {
      const csv = parseCiboCsv((await listing.exportAsText(`${ts}-txn-export`)).text, 'Payment Mode');
      const got = csv.rows.find(r => r['Transaction Ref. No.'] === ref)?.['Payment Mode'];
      expect.soft(got).toBe(PAYMENT_MODE.grabPay);
      if (got !== PAYMENT_MODE.grabPay) await flagCell(listing, ref, 'Payment Mode', `${ts}-txn-export`, `Exported file shows "${got ?? '(row missing)'}"`);
    });
    await test.step('Open the Payment Report page', async () => { await login.openMenu('Payment Report'); });
    const report = new CiboPaymentReportPage(page);
    const reported = await readPaymentMode(report, ref, 'Payment Report', ts);
    await test.step('Confirm Payment Report shows the GrabPay Full Amount string', async () => {
      expect.soft(reported).toBe(PAYMENT_MODE.grabPay);
      if (reported !== PAYMENT_MODE.grabPay) await flagCell(report, ref, 'Payment Mode', `${ts}-report`, `Expected "${PAYMENT_MODE.grabPay}"`);
    });
    await test.step('Click [Export] and confirm the exported Payment Report', async () => {
      const csv = parseCiboCsv((await report.exportAsText(`${ts}-report-export`)).text, 'Payment Mode');
      const got = csv.rows.find(r => Object.values(r).some(v => v.startsWith(ref)))?.['Payment Mode'];
      expect.soft(got).toBe(PAYMENT_MODE.grabPay);
      if (got !== PAYMENT_MODE.grabPay) await flagCell(report, ref, 'Payment Mode', `${ts}-report-export`, `Exported file shows "${got ?? '(row missing)'}"`);
    });
  });

  test('12327_TS18: Existing transactions show the new format', async ({ page }) => {
    const ts = '12327_TS18';
    const login = await loginAndOpen(page, 'Transaction Management', ['existing'], true);
    const ref = required(CIBO_REFS.existing, 'Existing, pre-push (12327_TS18)');
    const newFormat = /^(BoldPay|Fiuu) \| .+ – .+$/;
    const listing = new CiboListingPage(page);
    const listed = await readPaymentMode(listing, ref, 'Transaction Listing', ts);
    await test.step('Confirm Transaction Listing shows the new format', async () => {
      expect.soft(listed).toMatch(newFormat);
      if (!newFormat.test(listed)) await flagCell(listing, ref, 'Payment Mode', `${ts}-txn`, 'Old format — expected "<gateway> | <method> – <details>"');
    });
    await test.step('Open the Payment Report page', async () => { await login.openMenu('Payment Report'); });
    const report = new CiboPaymentReportPage(page);
    const reported = await readPaymentMode(report, ref, 'Payment Report', ts);
    await test.step('Confirm Payment Report shows the new format', async () => {
      expect.soft(reported).toMatch(newFormat);
      if (!newFormat.test(reported)) await flagCell(report, ref, 'Payment Mode', `${ts}-report`, 'Old format — expected "<gateway> | <method> – <details>"');
    });
  });

  // TS v2 (19_10_26): CIBO lists eAuto (RHB) and pre-cutoff Secarang (RMS)
  // rows too (EAINT-11541, knowledge cibo.md § Payment Mode column format);
  // the 12327 SRD gives them no format string, so the TS checks a value is
  // shown and is the same on all 4 surfaces.
  test('12327_TS19: Payment Mode for eAuto (RHB) and Secarang before cutoff (RMS) transactions', async ({ page }) => {
    const ts = '12327_TS19';
    const login = await loginAndOpen(page, 'Transaction Management', ['eautoRhb', 'secarangRms'], 'perRef');
    const refs = [
      { label: 'eAuto (RHB)', ref: required(CIBO_REFS.eautoRhb, 'Existing eAuto (RHB) ref (12327_TS19)') },
      { label: 'Secarang before cutoff (RMS)', ref: required(CIBO_REFS.secarangRms, 'Existing Secarang RMS ref (12327_TS19)') },
    ];
    const listing = new CiboListingPage(page);
    const listed: Record<string, string> = {};
    for (const r of refs) {
      const value = await readPaymentMode(listing, r.ref, 'Transaction Listing', ts);
      listed[r.ref] = value;
      await test.step(`Confirm ${r.label} shows a Payment Mode value on the Transaction Listing`, async () => {
        expect.soft(value, `${r.label} Payment Mode`).not.toMatch(/^\s*$/);
      });
      await test.step(`Click [Export] for ${r.ref} and confirm the same value`, async () => {
        const csv = parseCiboCsv((await listing.exportAsText(`${ts}-txn-export-${r.ref}`)).text, 'Payment Mode');
        const got = csv.rows.find(x => x['Transaction Ref. No.'] === r.ref)?.['Payment Mode'];
        expect.soft(got, `${r.label} Transaction Listing export`).toBe(value);
        if (got !== value) await flagCell(listing, r.ref, 'Payment Mode', `${ts}-txn-export-${r.ref}`, `Exported file shows "${got ?? '(row missing)'}"`);
      });
    }
    await test.step('Open the Payment Report page', async () => { await login.openMenu('Payment Report'); });
    const report = new CiboPaymentReportPage(page);
    for (const r of refs) {
      const value = await readPaymentMode(report, r.ref, 'Payment Report', ts);
      await test.step(`Confirm ${r.label} shows the same Payment Mode on the Payment Report`, async () => {
        expect.soft(value, `${r.label} Payment Report vs Transaction Listing`).toBe(listed[r.ref]);
        if (value !== listed[r.ref]) await flagCell(report, r.ref, 'Payment Mode', `${ts}-report-${r.ref}`, `Transaction Listing shows "${listed[r.ref]}"`);
      });
      await test.step(`Click [Export] for ${r.ref} and confirm the same value`, async () => {
        const csv = parseCiboCsv((await report.exportAsText(`${ts}-report-export-${r.ref}`)).text, 'Payment Mode');
        const got = csv.rows.find(x => Object.values(x).some(v => v.startsWith(r.ref)))?.['Payment Mode'];
        // The Payment Report export adds " – eAuto" for eAuto rows ("RHB – eAuto"
        // vs "RHB" on the page). Faizuddin, 2026-10-20: "RHB - eAuto -- considered
        // pass. this is the existing behaviour".
        const ok = [listed[r.ref], `${listed[r.ref]} – eAuto`];
        expect.soft(ok, `${r.label} Payment Report export ("${got}")`).toContain(got);
        if (!ok.includes(got ?? '')) await flagCell(report, r.ref, 'Payment Mode', `${ts}-report-export-${r.ref}`, `Exported file shows "${got ?? '(row missing)'}"`);
      });
    }
  });
});

test.describe('EAINT-12107 — CIBO display of the PayLater by Grab patch', () => {
  // 12107_TS05: dev patched a GrabPay transaction to PayLater by Grab
  // (Instalment) — BR60006259 on 2026-10-19 (knowledge/cibo.md). Faizuddin,
  // 2026-10-20: "dev already patched. can you make the automation script check
  // it in CIBO". The ref comes from the dashboard box "PayLater by Grab
  // (12107_TS05 patch)" or is found on CIBO (Payment Mode "… BNPL – Installment").
  // Payment Method / Payment Channel read "Fiuu eWallet GrabPay" — accepted
  // (Faizuddin, 2026-10-20: "we will accept this behaviour as pass").
  test.describe.configure({ timeout: 1_080_000 });

  test('12107_TS05: CIBO display different payment method', async ({ page }) => {
    const ts = '12107_TS05';
    const login = await loginAndOpen(page, 'Transaction Management', ['grabPayLater'], 'perRef');
    const ref = required(CIBO_REFS.grabPayLater, 'PayLater by Grab (12107_TS05 patch)');
    const listing = new CiboListingPage(page);
    const money = (s: string) => (/RM[\d,]+\.\d{2}/.exec(s) ?? [''])[0];
    const grabChannel = /^Fiuu eWallet( -| \|)? GrabPay( - PayLater by Grab)?$/;

    // ── Transaction Management ──
    const { row, index } = await findRow(listing, ref, 'Transaction Listing');
    const amount = money(row['Payment'] ?? '');
    await test.step('Transaction Management: confirm insurance created', async () => {
      detail(`${ts} Transaction Status`, row['Transaction Status'] ?? '');
      expect.soft(row['Transaction Status'] ?? '', 'Transaction Status').toMatch(/^Insurance created/);
      if (!/^Insurance created/.test(row['Transaction Status'] ?? '')) await flagCell(listing, ref, 'Transaction Status', `${ts}-txn-status`, 'Expected "Insurance created"');
    });
    await test.step('Transaction Management: confirm the payment amount with Status = Paid', async () => {
      await listing.highlightCell(index, 'Payment');
      detail(`${ts} Transaction Listing Payment`, row['Payment'] ?? '');
      expect.soft(amount, 'Payment amount shown').not.toBe('');
      expect.soft(row['Payment'] ?? '', 'Payment status').toMatch(/Paid\b/);
      await listing.captureEvidence(`${ts}-transaction-listing`);
      if (!/Paid\b/.test(row['Payment'] ?? '')) await flagCell(listing, ref, 'Payment', `${ts}-txn-payment`, 'Expected "Paid"');
    });

    // ── Transaction Details ──
    const details = new CiboTransactionDetailsPage(page);
    await test.step(`Open the Transaction Details of ${ref}`, async () => { await details.openFromListing(ref); });
    await test.step('Transaction Details: confirm Payment Method = Fiuu eWallet GrabPay, Paid', async () => {
      const method = await details.read('Payment Method');
      detail(`${ts} Transaction Details Payment Method`, method);
      const name = method.replace(/\s*Paid$/, '');
      expect.soft(name, 'Payment Method').toMatch(grabChannel);
      expect.soft(method, 'Payment Method status').toMatch(/Paid$/);
      await details.demoHighlight(details.value('Payment Method'), { color: 'green' });
      if (!grabChannel.test(name) || !/Paid$/.test(method)) await details.captureIssue(`${ts}-details-method`, details.value('Payment Method'), 'Expected "Fiuu eWallet - GrabPay" + Paid');
    });
    await test.step('Transaction Details: confirm the amount', async () => {
      const total = money(await details.read('Total Premium'));
      detail(`${ts} Transaction Details Total Premium`, total);
      expect.soft(total, 'Total Premium vs Transaction Listing').toBe(amount);
      if (total !== amount) await details.captureIssue(`${ts}-details-amount`, details.value('Total Premium'), `Transaction Listing shows ${amount}`);
    });
    await test.step('Transaction Details: confirm the Payment Reference ID contains EW', async () => {
      const payRef = await details.read('Payment Ref ID');
      detail(`${ts} Transaction Details Payment Ref ID`, payRef);
      expect.soft(payRef, 'Payment Ref ID').toContain('EW');
      await details.captureEvidence(`${ts}-transaction-details`);
      if (!payRef.includes('EW')) await details.captureIssue(`${ts}-details-ref`, details.value('Payment Ref ID'), 'Expected "EW" in the Payment Ref ID');
    });

    // ── Payment Management, filter = GrabPay - PayLater by Grab ──
    await test.step('Open the Payment Management page', async () => { await login.openMenu('Payment Management'); });
    const pm = new CiboPaymentManagementPage(page);
    await test.step('Tick Payment Channel = GrabPay - PayLater by Grab and click [Search]', async () => {
      await pm.clearAll();
      await pm.openChannelFilter();
      await pm.click(pm.option(FIUU_EWALLET_GROUP, 'GrabPay - PayLater by Grab'));
      await pm.captureFilter(`${ts}-paylater-filter`);
      await pm.closeChannelFilter();
      await pm.clickSearch();
    });
    await test.step(`Payment Management: confirm ${ref} is listed, Paid, Fiuu eWallet GrabPay, Payment Ref ID with EW`, async () => {
      const rows = await pm.rows();
      const i = rows.findIndex(r => (r['Transaction Ref. No.'] ?? '').startsWith(ref));
      expect(i, `${ref} is listed under GrabPay - PayLater by Grab`).toBeGreaterThan(-1);
      const r = rows[i];
      detail(`${ts} Payment Management`, `${r['Payment Channel']} · ${r['Payment']} · ${r['Payment Ref ID']}`);
      await pm.highlightCell(i, 'Payment Channel');
      expect.soft(money(r['Payment'] ?? ''), 'Payment Management amount').toBe(amount);
      expect.soft(r['Payment'] ?? '', 'Payment Management status').toMatch(/Paid\b/);
      expect.soft(r['Payment Channel'] ?? '', 'Payment Channel').toMatch(grabChannel);
      expect.soft(r['Payment Ref ID'] ?? '', 'Payment Ref ID').toContain('EW');
      await pm.captureEvidence(`${ts}-payment-management`);
      if (!grabChannel.test(r['Payment Channel'] ?? '')) await pm.captureIssue(`${ts}-pm-channel`, await pm.cell(i, 'Payment Channel'), 'Expected "Fiuu eWallet GrabPay"');
      if (money(r['Payment'] ?? '') !== amount || !/Paid\b/.test(r['Payment'] ?? '')) await pm.captureIssue(`${ts}-pm-payment`, await pm.cell(i, 'Payment'), `Expected ${amount} Paid`);
      if (!(r['Payment Ref ID'] ?? '').includes('EW')) await pm.captureIssue(`${ts}-pm-ref`, await pm.cell(i, 'Payment Ref ID'), 'Expected "EW" in the Payment Ref ID');
    });

    // ── Payment Report ──
    await test.step('Open the Payment Report page', async () => { await login.openMenu('Payment Report'); });
    const report = new CiboPaymentReportPage(page);
    const hit = await findRowOrSkip(report, ref, 'Payment Report');
    if (hit) {
      await test.step(`Payment Report: confirm Payment Mode = "${PAYMENT_MODE.grabPayLater}", amount and EW`, async () => {
        const r = hit.row;
        detail(`${ts} Payment Report`, `${r['Payment Mode']} · ${r['Total Premium (RM)']} · ${r['Payment Ref ID']}`);
        await report.highlightCell(hit.index, 'Payment Mode');
        softMatch(r['Payment Mode'] ?? '', PAYMENT_MODE.grabPayLater, 'Payment Report Payment Mode');
        expect.soft(`RM${r['Total Premium (RM)'] ?? ''}`.replace(/\s/g, ''), 'Payment Report Total Premium').toBe(amount);
        expect.soft(r['Payment Ref ID'] ?? '', 'Payment Report Payment Ref ID').toContain('EW');
        await report.captureEvidence(`${ts}-payment-report`);
        if (r['Payment Mode'] !== PAYMENT_MODE.grabPayLater) await flagCell(report, ref, 'Payment Mode', `${ts}-report-mode`, `Expected "${PAYMENT_MODE.grabPayLater}"`);
        if (`RM${r['Total Premium (RM)'] ?? ''}`.replace(/\s/g, '') !== amount) await flagCell(report, ref, 'Total Premium (RM)', `${ts}-report-amount`, `Transaction Listing shows ${amount}`);
        if (!(r['Payment Ref ID'] ?? '').includes('EW')) await flagCell(report, ref, 'Payment Ref ID', `${ts}-report-ref`, 'Expected "EW" in the Payment Ref ID');
      });
    }
  });
});

test.describe('EAINT-12107 — CIBO Payment Channel filter', () => {
  test('12107_TS06: CIBO Payment Channel filter', async ({ page }) => {
    const ts = '12107_TS06';
    await loginAndOpen(page, 'Payment Management');
    const pm = new CiboPaymentManagementPage(page);

    /** One filter block: tick → Search → check listing → Export → check file. */
    async function filterBlock(steps: string, option: string, allowed: string[]) {
      let listed = false;
      let rowCount = 0;
      await test.step(`${steps}. Clear the filters, then tick Payment Channel = ${option}`, async () => {
        await pm.clearAll();
        await pm.openChannelFilter();
        const opt = pm.option(FIUU_EWALLET_GROUP, option);
        listed = (await opt.count()) === 1;
        // Soft: a missing option fails this block
        // but lets the remaining steps run.
        expect.soft(listed, `"${option}" is listed under ${FIUU_EWALLET_GROUP}`).toBe(true);
        if (listed) await pm.click(opt);
        else await pm.captureFilter(`${ts}-${option.replace(/\W+/g, '-')}-missing`);
        await pm.closeChannelFilter();
      });
      if (!listed) return;
      await test.step('Click [Search]', async () => { await pm.clickSearch(); });
      await test.step(`Confirm the listing only shows Payment Channel = ${option}`, async () => {
        const rows = await pm.rows();
        rowCount = rows.length;
        detail(`${ts} ${option} rows`, String(rows.length));
        const bad = rows.filter(r => !allowed.includes(r['Payment Channel']));
        expect.soft(bad.map(r => `${r['Transaction Ref. No.']}: ${r['Payment Channel']}`)).toEqual([]);
        const noEwAll = rows.filter(r => !(r['Payment Ref ID'] ?? '').includes('EW'));
        const noEw = noEwAll.filter(r => !paidBeforeEw(r['Payment']));
        const old = noEwAll.filter(r => paidBeforeEw(r['Payment']));
        if (old.length) detail(`${ts} ${option} existing rows without EW (expected, paid before ${EW_FROM})`, old.map(r => `${r['Transaction Ref. No.']}: ${r['Payment Ref ID']}`).join(' / '));
        expect.soft(noEw.map(r => `${r['Transaction Ref. No.']}: ${r['Payment Ref ID']}`), 'Payment Ref ID contains EW').toEqual([]);
        await pm.captureEvidence(`${ts}-${option.replace(/\W+/g, '-')}-listing`);
        if (bad.length) await pm.captureIssue(`${ts}-${option.replace(/\W+/g, '-')}-wrong-channel`,
          await Promise.all(bad.map(r => pm.cell(rows.indexOf(r), 'Payment Channel'))),
          `Filter = ${option}, but these rows show another Payment Channel`);
        if (noEw.length) await pm.captureIssue(`${ts}-${option.replace(/\W+/g, '-')}-no-EW`,
          await Promise.all(noEw.map(r => pm.cell(rows.indexOf(r), 'Payment Ref ID'))),
          'Payment Ref ID without "EW"');
      });
      // An empty listing gives no file to download (live 2026-10-19: PayLater
      // by Grab had 0 rows and Export never downloaded).
      if (!rowCount) { detail(`${ts} ${option} export`, 'not checked — the listing has no rows'); return; }
      await test.step('Click [Export] and confirm the file shows the same channel', async () => {
        const { text } = await pm.exportAsText(`${ts}-${option.replace(/\W+/g, '-')}-export`);
        // The file calls the column "Payment Reference ID" (the page says
        // "Payment Ref ID") — live export 2026-10-19.
        const csv = parseCiboCsv(text, 'Payment Channel');
        detail(`${ts} ${option} export columns`, csv.header.join(' | '));
        const refCol = csv.header.find(h => /^Payment Ref(erence)? ID$/i.test(h)) ?? 'Payment Reference ID';
        const noEw = csv.rows.filter(r => !(r[refCol] ?? '').includes('EW') && !paidBeforeEw(r['Payment Date']));
        expect.soft(noEw.map(r => `${r['Transaction Ref. No.']}: ${r[refCol]}`), `Export: every Payment Ref ID paid from ${EW_FROM} contains EW`).toEqual([]);
      });
    }

    const channel = (o: string) => `Fiuu eWallet ${o}`;
    await filterBlock('1-5', 'GrabPay', [channel('GrabPay')]);
    // A PayLater by Grab row keeps Payment Channel "Fiuu eWallet GrabPay": PayLater
    // is not a separate channel (dev, Teams 2026-09-03), the filter matches on the
    // Fiuu indicator. Faizuddin, 2026-10-20: "we will accept this behaviour as pass".
    await filterBlock('6-8', 'GrabPay - PayLater by Grab', [channel('GrabPay - PayLater by Grab'), channel('GrabPay')]);
    // SPayLater shows as ShopeePay — Fiuu cannot tell them apart (dev,
    // 2026-10-19; TS06 updated 2026-10-20).
    await filterBlock('9-11', 'ShopeePay', [channel('ShopeePay')]);

    await test.step(`12. Open the Payment Channel filter and observe the options under ${FIUU_EWALLET_GROUP}`, async () => {
      await pm.clearAll();
      await pm.openChannelFilter();
      const listed = await pm.optionsUnder(FIUU_EWALLET_GROUP);
      detail(`${ts} options under ${FIUU_EWALLET_GROUP}`, listed.join(' / '));
      expect.soft(listed, 'No separate "ShopeePay - SPayLater" option').toEqual(FIUU_EWALLET_OPTIONS);
      await pm.captureFilter(`${ts}-options`);
      await pm.closeChannelFilter();
    });

    await test.step(`13-14. Click [Clear all], then tick Payment Channel = ${FIUU_EWALLET_GROUP}`, async () => {
      await pm.clearAll();
      await pm.openChannelFilter();
      await pm.click(pm.group(FIUU_EWALLET_GROUP));
    });
    await test.step(`Confirm the filter selects all 3 options under ${FIUU_EWALLET_GROUP}`, async () => {
      const listed = await pm.optionsUnder(FIUU_EWALLET_GROUP);
      detail(`${ts} options under ${FIUU_EWALLET_GROUP}`, listed.join(' / '));
      expect.soft(listed).toEqual(FIUU_EWALLET_OPTIONS);
      for (const o of listed) expect.soft(await pm.isTicked(pm.option(FIUU_EWALLET_GROUP, o)), `${o} ticked`).toBe(true);
      await pm.captureFilter(`${ts}-group-ticked`);
      await pm.closeChannelFilter();
    });
    await test.step('15. Click [Search] and confirm the listing shows only Fiuu eWallet methods', async () => {
      await pm.clickSearch();
      const rows = await pm.rows();
      const seen = [...new Set(rows.map(r => r['Payment Channel']))];
      detail(`${ts} channels with ${FIUU_EWALLET_GROUP} ticked`, seen.join(' / '));
      await pm.captureEvidence(`${ts}-group-listing`);
      expect.soft(seen.filter(c => !c.startsWith('Fiuu eWallet'))).toEqual([]);
      const other = rows.filter(r => !r['Payment Channel'].startsWith('Fiuu eWallet'));
      if (other.length) await pm.captureIssue(`${ts}-group-wrong-channel`,
        await Promise.all(other.map(r => pm.cell(rows.indexOf(r), 'Payment Channel'))),
        `Filter = ${FIUU_EWALLET_GROUP}, but these rows are not Fiuu eWallet`);
    });
    await test.step('16. Click [Export]', async () => {
      const csv = parseCiboCsv((await pm.exportAsText(`${ts}-group-export`)).text, 'Payment Channel');
      detail(`${ts} group export rows`, String(csv.rows.length));
    });
    await test.step('17. Untick ShopeePay; Fiuu - eWallet unticks, the other 2 options stay ticked', async () => {
      await pm.openChannelFilter();
      await pm.click(pm.option(FIUU_EWALLET_GROUP, 'ShopeePay'));
      for (const o of await pm.optionsUnder(FIUU_EWALLET_GROUP)) {
        expect.soft(await pm.isTicked(pm.option(FIUU_EWALLET_GROUP, o)), `${o} ticked`).toBe(o !== 'ShopeePay');
      }
      // Faizuddin, 2026-10-20: "If untick one of the nested items, the main
      // option will be unticked, leaving the other 2 nested items ticked."
      const parentTicked = await pm.isTicked(pm.group(FIUU_EWALLET_GROUP));
      detail(`${ts} ${FIUU_EWALLET_GROUP} ticked after unticking ShopeePay`, String(parentTicked));
      expect.soft(parentTicked, `${FIUU_EWALLET_GROUP} becomes unticked after unticking ShopeePay`).toBe(false);
      await pm.captureFilter(`${ts}-shopeepay-unticked`);
      if (parentTicked) await pm.captureIssue(`${ts}-parent-still-ticked`, pm.group(FIUU_EWALLET_GROUP), `${FIUU_EWALLET_GROUP} should be unticked after unticking ShopeePay`);
    });
    await test.step(`18. Untick ${FIUU_EWALLET_GROUP}; every option under it is cleared`, async () => {
      // Seen live 2026-10-16: after step 17 the group header is already
      // unticked, so the first click re-ticks all options and only the
      // second click clears them. Click until the header shows ticked, then
      // once more to untick.
      if (!(await pm.isTicked(pm.group(FIUU_EWALLET_GROUP)))) {
        await pm.click(pm.group(FIUU_EWALLET_GROUP));
        detail(`${ts} first click on ${FIUU_EWALLET_GROUP} after step 17`, 're-ticked every option');
      }
      await pm.click(pm.group(FIUU_EWALLET_GROUP));
      for (const o of await pm.optionsUnder(FIUU_EWALLET_GROUP)) {
        expect.soft(await pm.isTicked(pm.option(FIUU_EWALLET_GROUP, o)), `${o} ticked`).toBe(false);
      }
      await pm.captureFilter(`${ts}-group-unticked`);
    });
  });
});
