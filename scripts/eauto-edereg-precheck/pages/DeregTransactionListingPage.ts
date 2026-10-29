import { Page } from '@playwright/test';
import { PrecheckSession } from '../utils/session';
import { CONFIG } from '../data/config';

// ── Deregistration Transaction Listing (EAINT-9306) ──
// `/view/aatf/dereg/enquiry/main.do` — confirmed live HTML,
// EAINT-9306-dereg-details-and-listing.html (captured 2026-08-21). Search
// form `#search-form` (`#vehicleNo` + `#to-search`), results `#result
// table`. DISTINCT from the Pre-Checking listing
// (`/dereg/precheck/enquiry/main.do`, PrecheckEnquiryPage's own listing
// lookup) — this one lists DEREGISTRATION transactions, not Pre-Checking
// ones.
export class DeregTransactionListingPage {
  constructor(private readonly page: Page, private readonly session: PrecheckSession) {}

  /** Searches by Vehicle No. and returns how many transaction rows came
   *  back. Per Faizuddin 2026-08-26 (MU_TS1): a Deregistration transaction
   *  only shows up here once it reaches Step 3 — the transaction record
   *  itself "actually starts" at Step 3, not at creation/Step 1/Step 2. A
   *  transaction that stops at Step 2 (e.g. after just the inline
   *  pre-check purchase, `DeregTransactionPage.resolveVehicleGate()`'s
   *  own stopping point) will NOT appear here at all — this corrects the
   *  test plan's own MU_TS1 row, which expected 2 rows here assuming
   *  BOTH users' transactions would show regardless of how far each got.
   *
   *  BUG, confirmed live 2026-08-26: `#to-search` is a real `type="submit"`
   *  inside `#search-form` — clicking it triggers a full page reload, not
   *  an AJAX update. The original code did `.click()` then a SEPARATE
   *  `waitForDomReady()` call, which races the reload: by the time
   *  `waitForDomReady()` runs, Playwright may already consider the OLD
   *  page's `domcontentloaded` satisfied and resolve immediately, so the
   *  row count got read off a page still mid-reload (an empty, freshly
   *  reset form — confirmed from the run's own video, captured mid-reload
   *  showing a BLANK Vehicle No. field and the pristine "please click to
   *  show record(s)" placeholder). The real result (1 row, correct) only
   *  rendered a couple seconds later — after this method had already
   *  returned 0. Fixed by pairing the click with the load-state wait via
   *  `Promise.all()` (Playwright's own recommended pattern for
   *  click-triggers-navigation), so the wait starts before the click can
   *  race it. */
  async countTransactionsForVehicle(envSegment: string, vehicleRegNo: string): Promise<number> {
    const p = await this.session.waitForActivePage();
    await p.goto(`${CONFIG.baseUrlFor(envSegment)}/view/aatf/dereg/enquiry/main.do`);
    await this.session.waitForDomReady();
    await this.session.closeBanners();

    await p.locator('#vehicleNo').fill(vehicleRegNo);
    await Promise.all([
      p.waitForLoadState('domcontentloaded'),
      p.locator('#to-search').click(),
    ]);
    await this.session.waitForDomReady();
    // Belt-and-suspenders past the reload-race fix above — confirm the
    // Vehicle No. field actually shows the searched value (it's blank
    // during the brief mid-reload window) before trusting the row count.
    await p.locator('#vehicleNo').getAttribute('value').then(async (v) => {
      if (v === vehicleRegNo) return;
      await p.waitForFunction(
        (expected) => (document.querySelector('#vehicleNo') as HTMLInputElement | null)?.value === expected,
        vehicleRegNo,
        { timeout: 10_000 },
      ).catch(() => { /* fall through to the row count below regardless */ });
    });

    // tbody includes the header row too (same trap as the Pre-Checking
    // listing, PrecheckEnquiryPage.verifyPrecheckingYesLink's own note) —
    // exclude it so an empty result doesn't falsely count as "has rows".
    const rowCount = await p.locator('#result table tbody tr:not(.header)').count();
    this.session.progress('dereg-listing-count', `Deregistration listing for ${vehicleRegNo}: ${rowCount} transaction(s)`);
    // The listing is on screen right now — hold before moving on, per
    // Faizuddin 2026-08-24 (knowledge/flow-edereg.md §12).
    await this.session.pauseForDetails();
    return rowCount;
  }
}
