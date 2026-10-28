import { type Locator } from "@playwright/test";
import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import type { SoftwareInstallationListingPage } from "../pages/bo/SoftwareInstallationListingPage";

/**
 * 12166_67_E2E_TS05 — pre-release legacy Device Purchase transaction.
 *
 * Previously excluded from automation: a fresh run can only ever create NEW
 * records, and this scenario specifically needs a REAL transaction that
 * predates the 12166/12167 release. CHANGED 2026-09-24 per Faizuddin —
 * instead of a fixed reference, this searches the real BO listing for
 * whatever pre-release Biometric Device Purchase records genuinely exist,
 * and skips a leg gracefully if no qualifying record exists rather than
 * inventing one. Per Faizuddin: "if its possible to not change the status,
 * avoid changing it" — every check here is read-only (View + assert), so no
 * record's status is ever advanced.
 *
 * BO-SIDE ONLY for now, per Faizuddin 2026-09-24 — his environment has no
 * transactions from the previous month, so the UCD-side leg (which needs a
 * legacy record scoped to the UCD test account's own company — BO can see
 * every company's transactions, UCD only its own) and the >40-quantity leg
 * (which needs a UCD login) are both dropped from this pass. No company
 * filter is applied either, for the same reason — nothing here reuses a
 * reference on the UCD side anymore, so there's nothing to scope it for.
 * See knowledge/flow-device-purchase.md for the full reasoning if these get
 * re-added later.
 *
 * **The BO listing's Date Requested filter has real behaviour that shapes
 * this whole search strategy** (per Faizuddin, 2026-09-24, confirmed system
 * default — not yet captured live, add a capture next time this runs):
 *  - Selecting a "From" date auto-sets "To" = From + 1 month. There's no way
 *    to search a wide multi-year range in one shot — the effective window
 *    is capped at one month.
 *  - Results sort latest-first. So "From = 15/9, To auto-set" still puts
 *    TODAY'S record at the top of the list if today falls inside that
 *    auto-set window — which it will, for any recent From date. A search
 *    that doesn't account for this picks a brand-new record while believing
 *    it picked a legacy one.
 *
 * findPreReleaseRow() below steps backward one month at a time, ENDING each
 * window at or before the release cutoff, until a window actually returns a
 * matching row — so the returned row's own Date Requested is verified
 * in-window rather than assumed from the filter.
 *
 * RELEASE_CUTOFF is the day before the 12166/12167 go-live (2026-09-15) —
 * update this if the confirmed go-live date turns out to differ.
 *
 * Click-chain source: combined study artifact, 12166_67_DOSN_TS05.
 */
const RELEASE_CUTOFF = new Date(2026, 8, 14); // 14-09-2026 (month is 0-indexed)
const MAX_WINDOWS_BACK = 24; // up to 2 years back, one month at a time, before giving up

function fmtDdMmYyyy(d: Date): string {
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${p2(d.getDate())}-${p2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function oneMonthBefore(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, d.getDate());
}

/** Parses the listing's "dd-MM-yyyyHH:mm" cell text (cellText() collapses
 *  the space between date and time) back into a comparable Date, using only
 *  the date part. Returns null if the leading 10 chars don't match. */
function parseListingDate(cellText: string): Date | null {
  const m = cellText.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

interface FoundRow {
  row: Locator;
  ref: string;
  requested: string;
}

/**
 * Steps backward one real-month-wide window at a time, ending each window
 * at or before `cutoff`, until one actually returns a Biometric Device
 * Purchase row — matching the listing's own From->To auto-fill behaviour
 * instead of fighting it. Returns the latest (top) row of the first
 * non-empty window, or null if nothing qualifies within MAX_WINDOWS_BACK.
 */
async function findPreReleaseRow(
  boListingPage: SoftwareInstallationListingPage,
  cutoff: Date,
  deliveryStatus?: string,
): Promise<FoundRow | null> {
  let windowEnd = new Date(cutoff);
  for (let i = 0; i < MAX_WINDOWS_BACK; i++) {
    const windowStart = oneMonthBefore(windowEnd);
    await boListingPage.navigate();
    await boListingPage.searchWithFilters({
      requestedFrom: fmtDdMmYyyy(windowStart),
      requestedTo: fmtDdMmYyyy(windowEnd),
      serviceType: "BIOMETRIC_PURCHASE",
      ...(deliveryStatus !== undefined ? { deliveryStatus } : {}),
    });
    const rows = await boListingPage.getResultRows();
    if (rows.length > 0) {
      const row = rows[0];
      const ref = await boListingPage.getRowReferenceNo(row);
      const requested = await boListingPage.getRowDateRequested(row);
      return { row, ref, requested };
    }
    windowEnd = windowStart;
  }
  return null;
}

test.describe("12166/12167 E2E — TS05 pre-release legacy transaction (BO-side only)", () => {
  test("12166_67_E2E_TS05", async ({ loginPage, boListingPage, boDevicePurchaseDetailsPage }) => {
    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);

    await test.step("Any pre-release Biometric Device Purchase — opens normally, old DO number if any, but no [DO] button", async () => {
      const found = await findPreReleaseRow(boListingPage, RELEASE_CUTOFF);
      if (!found) {
        test.skip(true, `No pre-release Biometric Device Purchase record found within ${MAX_WINDOWS_BACK} months before ${fmtDdMmYyyy(RELEASE_CUTOFF)}.`);
        return;
      }
      await test.step(`Picked ${found.ref} (Date Requested: ${found.requested})`, async () => {});
      const pickedDate = parseListingDate(found.requested);
      expect(
        pickedDate && pickedDate <= RELEASE_CUTOFF,
        `picked row's Date Requested (${found.requested}) is not before the cutoff (${fmtDdMmYyyy(RELEASE_CUTOFF)})`,
      ).toBeTruthy();
      await boListingPage.clickView(found.row);
      expect(
        await boDevicePurchaseDetailsPage.isDoButtonPresent(),
        "legacy pre-release orders must never show [DO] — old DO number (if any) is fine, the button is not",
      ).toBe(false);
    });

    await test.step("Pre-release + Delivery Status = New — DO Number shows '-', no [DO] button", async () => {
      const found = await findPreReleaseRow(boListingPage, RELEASE_CUTOFF, "New");
      if (!found) {
        test.skip(true, `No pre-release New-status Biometric Device Purchase record found within ${MAX_WINDOWS_BACK} months before ${fmtDdMmYyyy(RELEASE_CUTOFF)}.`);
        return;
      }
      await test.step(`Picked ${found.ref} (Date Requested: ${found.requested})`, async () => {});
      const pickedDate = parseListingDate(found.requested);
      expect(
        pickedDate && pickedDate <= RELEASE_CUTOFF,
        `picked row's Date Requested (${found.requested}) is not before the cutoff (${fmtDdMmYyyy(RELEASE_CUTOFF)})`,
      ).toBeTruthy();
      await boListingPage.clickView(found.row);
      expect(await boDevicePurchaseDetailsPage.getDeliveryOrderNumber()).toBe("-");
      expect(await boDevicePurchaseDetailsPage.isDoButtonPresent()).toBe(false);
    });

    await test.step("Biometric Device Purchase & Software Installation Listing shows a Device Serial No. column at any transaction age", async () => {
      // CORRECTED 2026-09-24 — the combined study artifact's click-chain
      // ("Ensure no Serial Number column is shown regardless of transaction
      // age") is stale. The listing's own capture
      // (_reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html,
      // 2026-09-22) already confirmed live that a "Device Serial No." column
      // DOES exist, per REQ-011 — that capture resolved an earlier
      // SRD-vs-dev-guide contradiction in favour of the column existing.
      // Asserting its absence here would just reassert the stale claim.
      // This check is about the column header, not any specific row's age,
      // so it doesn't need the windowed search above — any search that
      // returns the table (even zero rows) renders the real <thead>.
      await boListingPage.navigate();
      await boListingPage.searchWithFilters({
        requestedFrom: fmtDdMmYyyy(oneMonthBefore(RELEASE_CUTOFF)),
        requestedTo: fmtDdMmYyyy(RELEASE_CUTOFF),
        serviceType: "BIOMETRIC_PURCHASE",
      });
      const headers = await boListingPage.resultsTable.locator("thead tr th").allTextContents();
      expect(
        headers.some((h) => /serial/i.test(h)),
        "the listing must show a Device Serial No. column, per REQ-011 (confirmed live 2026-09-22)",
      ).toBe(true);
    });
  });
});
