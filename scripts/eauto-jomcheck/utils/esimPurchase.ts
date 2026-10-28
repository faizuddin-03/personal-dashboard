import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { UcdJomCheckPurchasePage } from '../pages/UcdJomCheckPurchasePage';
import { BoJomCheckReportListingPage } from '../pages/BoJomCheckReportListingPage';
import { EsimJomCheckPage, JomCheckEsimState } from '../pages/EsimJomCheckPage';
import { getUser } from '../data/users';
import { lookUpTransactionNo } from './transactionLookup';

// Shared by every eSim-driven spec (TS06-TS16/TS19/TS20 in
// esim-claim-boundaries.spec.ts; TS30/TS32/TS33 in esim-listing-export.spec.ts).
//
// eSim is driven in the TEST'S OWN PAGE, so the set-up and the restore are
// both in the run's video (Faizuddin, 2026-10-01: "the eSim must also be open
// in the same browser as the main testing"). The eSim prefix is the vehicle
// no.'s first 2 characters (eSim prefixes are always 2 characters; Faizuddin,
// 2026-10-01: "it will always use any prefix that is set in the 'fresh
// vehicle number' field").
//
// Flow per test: open eSim → save the prefix's current Enquiry Result and
// claim records → set the test's claims → purchase in UCD → BO listing.
// `registerEsimRestoreHook()` then writes the saved state back in
// `afterEach`, on the same page, pass or fail.

/** eSim prefix for a vehicle no. — always its first 2 characters. */
export const esimPrefixOf = (vehicleNo: string) => vehicleNo.trim().toUpperCase().slice(0, 2);

/** Vehicle no. when run outside the dashboard (no env var set). */
export const vehicleNoFor = (suffix: string) => `HX${suffix}`;

let pendingRestore: { prefix: string; state: JomCheckEsimState } | undefined;

/** Call once at the top of an eSim spec file. Restores the prefix the test
 *  changed, in the same page, after every test — pass or fail. If a run is
 *  killed first, the saved state is in the log as "[esim] <prefix> snapshot:". */
export function registerEsimRestoreHook(): void {
  test.afterEach(async ({ page }, testInfo) => {
    if (!pendingRestore) return;
    const { prefix, state } = pendingRestore;
    pendingRestore = undefined;
    testInfo.setTimeout(testInfo.timeout + 3 * 60_000);
    await test.step(`Restore eSim prefix ${prefix} (${state.claims.length} claim record(s), Enquiry Result "${state.enquiryResult}")`, async () => {
      await new EsimJomCheckPage(page).applyState(prefix, state);
    });
  });
}

/** eSim's "Simulator Details Only (No Default)". With "No", fields left
 *  blank on eSim are filled with default data (Faizuddin, 2026-10-01: "some
 *  of the details left blank will fall to default data"). A TS that needs a
 *  field to stay truly blank (no claims, a claim with no ClaimsType) passes
 *  `noDefault: true`; every other run sets it to "No" so the result never
 *  depends on what another tester left there. */
export const NO_DEFAULT_FIELD = 'Simulator Details Only (No Default)';

export interface EsimPurchase {
  listing: BoJomCheckReportListingPage;
  /** Transaction No. of the purchase this run made — read rows by this, not by index. */
  tx: string;
}

export interface EsimBuyOptions {
  noDefault?: boolean;
  /** Visible name of the bank/credit company to tick under "Share Report
   *  with Financial Institution" BEFORE Pay Now — the only way a report
   *  reaches the Service Portal listing (TS37-TS39). Faizuddin, 2026-10-05:
   *  "Automation will need to select 'X STAR TECHNOLOGY MALAYSIA SDN BHD'.
   *  only after that can it make payment". */
  shareWith?: string;
}

/** Sets exact claim records (and optionally the vehicle-level flags, e.g.
 *  { "Possible Total Loss": "Yes", "Possible BER": "No" }) on eSim, buys
 *  JomCheck in UCD for `vehicleNo`, looks up the new Transaction No., then
 *  opens the BO Report Listing searched by that vehicle. */
export async function setClaimsAndPurchase(
  page: Page,
  vehicleNo: string,
  claimRecords: Record<string, string>[],
  vehicleFlags: Record<string, string> = {},
  opts: EsimBuyOptions = {},
): Promise<EsimPurchase> {
  const { tx } = await setClaimsAndBuy(page, vehicleNo, claimRecords, vehicleFlags, opts);
  const login = new LoginPage(page);
  const listing = new BoJomCheckReportListingPage(page);

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

  await test.step(`Confirm transaction ${tx} shows up`, async () => {
    expect(await listing.findRowIndexByTransactionNo(tx), `Transaction ${tx} is not in the BO listing for ${vehicleNo}`).toBeGreaterThanOrEqual(0);
  });

  return { listing, tx };
}

/** Saves the prefix's current eSim state for the afterEach restore, once per
 *  prefix per test (no-op if already saved). */
export async function snapshotEsim(page: Page, vehicleNo: string): Promise<void> {
  const prefix = esimPrefixOf(vehicleNo);
  if (pendingRestore?.prefix === prefix) return;
  const esim = new EsimJomCheckPage(page);
  await test.step(`Open eSim and save the current set-up of prefix ${prefix}`, async () => {
    const state = await esim.readState(prefix);
    pendingRestore = { prefix, state };
    console.log(`[esim] ${prefix} snapshot: ${JSON.stringify(state)}`);
  });
}

/** TS31 precondition: eSim REPORT Result = "Failed" for the vehicle's prefix, then a
 *  UCD purchase that pays but cannot generate the report. Returns the UCD
 *  error text. Faizuddin, 2026-10-05: "instead of searching a transaction,
 *  you can make it being changing the result to 'Failed' in the eSim ...
 *  after clicking pay, it will show an error message, something like 'unable
 *  to generate report'. but after that, if we go to the listing page from
 *  UCD side, it will show payment okay, but transaction failed". */
export async function setResultFailedAndBuy(page: Page, vehicleNo: string): Promise<{ purchase: UcdJomCheckPurchasePage; errorMessage: string }> {
  const prefix = esimPrefixOf(vehicleNo);
  await snapshotEsim(page, vehicleNo);
  const esim = new EsimJomCheckPage(page);
  await test.step(`Set eSim prefix ${prefix}: Report Result "Failed"`, async () => {
    await esim.setReportResult(prefix, 'Failed');
  });

  const login = new LoginPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);
  await test.step('Log in to UCD', async () => { await login.login(getUser('ucd')); });
  await test.step('Open the JomCheck purchase page', async () => { await purchase.goto(); });
  await test.step(`Enter vehicle number ${vehicleNo} and submit`, async () => { await purchase.submitVehicleNo(vehicleNo); });
  await test.step('Confirm the vehicle was found', async () => {
    expect(await purchase.getResultText()).toContain('Vehicle number found');
  });
  const errorMessage = await test.step('Click Pay Now — the report cannot be generated (eSim Result = Failed)', async () => {
    const msg = await purchase.payNowExpectingFailure();
    console.log(`DETAIL:${JSON.stringify({ label: 'UCD error after Pay Now', value: msg })}`);
    return msg;
  });
  return { purchase, errorMessage };
}

/** The eSim set-up + UCD purchase half of setClaimsAndPurchase(), without the
 *  BackOffice listing — for TS that go to the Service Portal next. Leaves
 *  the page logged in to UCD on the paid purchase screen. */
export async function setClaimsAndBuy(
  page: Page,
  vehicleNo: string,
  claimRecords: Record<string, string>[],
  vehicleFlags: Record<string, string> = {},
  opts: EsimBuyOptions = {},
): Promise<{ purchase: UcdJomCheckPurchasePage; tx: string }> {
  const prefix = esimPrefixOf(vehicleNo);
  const esim = new EsimJomCheckPage(page);

  // A test that buys twice on one prefix (TS44, TS31) keeps the FIRST
  // snapshot — a second one would only capture the first purchase's own set-up.
  await snapshotEsim(page, vehicleNo);

  // Report Result "Success" every time, so a purchase after TS31's
  // "Failed" step (or another tester's leftover) generates a report.
  const reportFields = { [NO_DEFAULT_FIELD]: opts.noDefault ? 'Yes' : 'No', Result: 'Success', ...vehicleFlags };
  const flagText = Object.entries(reportFields).map(([k, v]) => `${k} ${v}`).join(', ');
  await test.step(`Set eSim prefix ${prefix}: Enquiry Result "Yes", ${claimRecords.length} claim record(s), ${flagText}`, async () => {
    await esim.applyState(prefix, { enquiryResult: 'Yes', claims: claimRecords, reportFields });
  });

  const login = new LoginPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);

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

  if (opts.shareWith) {
    const company = opts.shareWith;
    await test.step(`Tick "Share Report with Financial Institution" for ${company}`, async () => {
      await purchase.shareWithBeforePayment(company);
      expect(await purchase.isSharedWithBeforePayment(company), `${company} is not ticked`).toBe(true);
    });
  }

  await test.step('Click Pay Now', async () => {
    await purchase.payNow();
  });

  await test.step('Confirm the payment completed', async () => {
    expect(await purchase.isReportReady()).toBe(true);
  });

  const tx = await lookUpTransactionNo(page, purchase, { vehicleNo });
  return { purchase, tx };
}
