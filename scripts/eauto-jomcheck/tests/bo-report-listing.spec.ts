import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BoJomCheckReportListingPage, REPORT_LISTING_COLUMNS } from '../pages/BoJomCheckReportListingPage';
import { getUser } from '../data/users';

// EAINT-12339 — BackOffice JomCheck Report Listing.
// Starting point per Faizuddin, 2026-09-30: "lets start with creating jomcheck
// first" — this spec covers what's automatable against EXISTING data (any
// transaction already in the listing), without needing a fresh v2.0-connected
// transaction.
//
// TS19/TS20 USED to live here too, against the shared "known multi-claim
// vehicle" HXJ0001 — with no control over its exact claim values, so it could
// only prove "claims stay aligned", never the SPECIFIC boundary values (e.g.
// TS20's code-11/blank/code-11 sequence) the workbook actually asks for.
// Faizuddin, 2026-10-03, asked for TS06-TS20 to be rebuilt deterministically
// via eSim — moved to `esim-claim-boundaries.spec.ts`, which sets the exact
// claim records needed rather than hoping a shared fixture vehicle still has
// the right shape.
//
// Every user-visible action gets its own test.step() with a plain-language
// title — Faizuddin, 2026-10-02: "i want the steps to be similar to 9306,
// where it lists out one by one... its literally the human language for
// what it did."

test.describe('12339 — BO JomCheck Report Listing', () => {
  test('12339_TS17: Report Listing shows all 29 columns in the documented order', async ({ page }) => {
    const login = new LoginPage(page);
    const listing = new BoJomCheckReportListingPage(page);

    // The blank listing has no <table> at all — its header row only renders
    // after a search returns at least one row
    // (_reference/html/eauto/bo-jomcheck-report-listing.html: STATE 1 has no
    // table, STATE 2 does). Search by a known-good vehicle first; override
    // via JOMCHECK_MULTI_CLAIM_VEHICLE_NO if that record ever stops existing.
    const vehicleNo = process.env.JOMCHECK_MULTI_CLAIM_VEHICLE_NO || 'HXJ0001';

    await test.step('Log in to BackOffice', async () => {
      await login.login(getUser('bo'));
    });

    await test.step('Open the JomCheck Report Listing', async () => {
      await listing.goto();
    });

    await test.step(`Search by vehicle number ${vehicleNo}`, async () => {
      await listing.searchByVehicleNo(vehicleNo);
    });

    await test.step('Read the column headers', async () => {
      const headers = await listing.getColumnHeaders();
      expect(headers).toEqual([...REPORT_LISTING_COLUMNS]);
    });
  });

  // EAINT-12339 — TS45 (section I, Regression). BO only, no purchase.
  // "Greys out" = the `disabled` attribute on the unused filter. Confirmed
  // for Chassis No. after a Vehicle No. search:
  // _reference/html/eauto/bo-jomcheck-report-listing-vehicle-filter-active.html
  // (Faizuddin, 2026-10-04). That capture is AFTER clicking SEARCH, so each
  // filter is searched before the other is checked. Faizuddin, 2026-10-04:
  // the reverse holds too, and the field is disabled only after SEARCH, not
  // while typing.
  test('12339_TS45: Verify BackOffice JomCheck Report Listing filters and no-match message are unchanged', async ({ page }) => {
    const login = new LoginPage(page);
    const listing = new BoJomCheckReportListingPage(page);
    // A vehicle no. that cannot exist — "NOREC" + a per-run number.
    const noMatchVehicleNo = `NOREC${String(Date.now() % 100000).padStart(5, '0')}`;

    await test.step('Log in to BackOffice', async () => {
      await login.login(getUser('bo'));
    });

    await test.step('Open the JomCheck Report Listing', async () => {
      await listing.goto();
    });

    await test.step('Filter by vehicle number HXJ0001 and search', async () => {
      await listing.typeFilter('vehicleNo', 'HXJ0001');
      await listing.clickSearch();
    });

    await test.step('Confirm the Chassis No. filter is disabled', async () => {
      console.log(`DETAIL:${JSON.stringify({ label: 'Chassis No. after a Vehicle No. search', value: JSON.stringify(await listing.filterState('chassisNo')) })}`);
      expect(await listing.isFilterDisabled('chassisNo'), 'Chassis No. is not disabled').toBe(true);
    });

    await test.step('Click Reset', async () => {
      await listing.resetFilters();
    });

    await test.step('Filter by chassis number HXA00J00C00K01MTA and search', async () => {
      await listing.typeFilter('chassisNo', 'HXA00J00C00K01MTA');
      await listing.clickSearch();
    });

    await test.step('Confirm the Vehicle No. filter is disabled', async () => {
      console.log(`DETAIL:${JSON.stringify({ label: 'Vehicle No. after a Chassis No. search', value: JSON.stringify(await listing.filterState('vehicleNo')) })}`);
      expect(await listing.isFilterDisabled('vehicleNo'), 'Vehicle No. is not disabled').toBe(true);
    });

    await test.step('Click Reset', async () => {
      await listing.resetFilters();
    });

    await test.step(`Search vehicle number ${noMatchVehicleNo}, which has no record`, async () => {
      await listing.typeFilter('vehicleNo', noMatchVehicleNo);
      await listing.clickSearch();
    });

    await test.step('Confirm the listing shows "No records found. Please ensure there are existing JomCheck report purchase records."', async () => {
      const message = await listing.getNoMatchMessage();
      console.log(`DETAIL:${JSON.stringify({ label: 'No-match message', value: message })}`);
      expect(message).toBe('No records found. Please ensure there are existing JomCheck report purchase records.');
      await listing.captureEvidence('12339_TS45-no-match');
    });
  });
});
