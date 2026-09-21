import { Page, Dialog } from '@playwright/test';
import { CONFIG } from '../data/config';

export interface BoPrecheckListingRow {
  companyName: string;
  companyRoc: string;
  vehicleNo: string;
  transactionNo: string;
  createdAt: string;
  payment: string;
  jpjPreChecking: string;
  trxStatus: string;
  lhdnResponseStatus: string;
  remarks: string;
  specialRemarks: string;
}

// ── BackOffice "eDereg Pre-Checking Transaction Listing" — search + results
// + cancel, added 2026-08-27 for MU_TS9's BO cancel step (EAINT-9306) ──
// `/view/dereg/precheck/enquiry/main.do` — inferred from the "View" links'
// own href in the capture (`/view/dereg/precheck/enquiry/view.do?id=<uuid>`),
// same no-`/aatf/`-segment pattern as both JpjXmlLogPage BO routes.
// Confirmed from `EAINT-9306-bo-precheck-transaction-listing.html` (pasted
// by Faizuddin 2026-08-27 — THE CORRECT page for this step; he'd originally
// pasted the DEREGISTRATION Transaction listing by mistake, kept separately
// as `BoDeregTransactionListingPage`/its own capture, a real page just not
// the one this ticket's MU_TS9 needs).
//
// 13-column table — a DIFFERENT shape from both the AATF-side
// PrecheckEnquiryPage listing reader and the BO Deregistration listing (16
// columns, no "Special Remarks"). Search fields: `#companyName`,
// `#vehicleNo`, `#refNo`, `#fromDate`/`#toDate` (jQuery UI datepicker,
// "Date Created" — "From" compulsory before Search, same confirmed rule as
// the other BO listing), `#status` (Trx Status — NOTE: `#status`, not
// `#to-filter` like the Deregistration listing's equivalent field),
// `#paymentStatus`, payment date range, LHDN status, `#to-search`. NO
// "Includes Draft Trx" checkbox here — not needed, a Pre-Checking
// transaction is a top-level record from creation.
//
// **The "Cancel" action's markup is CONFIRMED, for real, from this
// capture** — every row with Trx Status Pending or Failed (non-terminal)
// shows `<a href="#" class="to-cancel" txid="<uuid>" title="to cancel
// <refNo>">Cancel</a>` right after "View" (` | ` separated). Every
// Approved/Expired row has NO Cancel link (checked across all 39 rows in
// the capture) — Cancel is only offered while still cancellable, exactly
// what MU_TS9 needs. `href="#"` — a JS click handler keyed off `txid`, not
// real navigation. **STILL UNCONFIRMED: the handler's own behaviour** (does
// it raise a native `confirm()` before actually cancelling? does it reload
// the row via AJAX or the whole page?) — the capture's own trimmed
// `<script>` block only had the generic per-page header script, not this
// page's own handler. `cancelFirstMatchingRow()` defensively listens for a
// native dialog (accepts it if one fires) but doesn't require one.
export class BoPrecheckTransactionListingPage {
  constructor(private readonly page: Page) {}

  async open(envSegment: string): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrlFor(envSegment)}/view/dereg/precheck/enquiry/main.do`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Opens the shared jQuery UI datepicker off `fieldId` and picks TODAY,
   *  then verifies the field actually got a value — added 2026-08-27 after
   *  a second live run found 0 rows for a vehicle known to have a real
   *  Failed record, with the exact same code that found rows fine on the
   *  FIRST live run. No screenshot of the BO page exists for either run
   *  (`boPage` isn't the fixture-tracked page Playwright auto-snapshots on
   *  failure, so the failure's own error-context capture showed User A's
   *  page instead, not boPage) — the leading theory is a datepicker
   *  click race (the widget not yet open/rendered when `.ui-datepicker-today`
   *  was clicked, silently leaving the field blank), not a selector bug,
   *  since nothing in this class changed between the two runs. This method
   *  now THROWS with a clear message if the field is still empty after the
   *  click, instead of silently proceeding to a search that may not even
   *  submit. */
  private async selectDateToday(fieldId: string): Promise<void> {
    const field = this.page.locator(fieldId);
    await field.click();
    const today = this.page.locator('#ui-datepicker-div .ui-datepicker-today a');
    await today.waitFor({ state: 'visible', timeout: 10_000 });
    await today.click();

    const value = await field.inputValue().catch(() => '');
    if (!value) {
      throw new Error(`${fieldId} is still empty after selecting today's date in the datepicker — the click likely missed the widget.`);
    }
  }

  /** Selects today as BOTH "From" and "To" (this page's own form marks
   *  BOTH with a required `*`, unlike the Deregistration listing where
   *  Faizuddin confirmed only "From" is enforced — filling both here rather
   *  than assuming the same single-field rule applies verbatim), fills
   *  Vehicle No., clicks Search.
   *
   *  **CORRECTED 2026-08-27, third live run** — `#to-search` on THIS page
   *  is an AJAX call, NOT a full page reload like the sibling
   *  `DeregTransactionListingPage`/`BoDeregTransactionListingPage` (a wrong
   *  assumption carried over from those, never actually verified here).
   *  The first two live runs both found 0 rows for a vehicle known to have
   *  a real record — a screenshot taken on the second failure (added that
   *  same day) finally showed why: the page still displayed a "Working..."
   *  blockUI overlay, with BOTH date fields correctly filled (ruling out
   *  the earlier datepicker-race theory entirely) — `waitForLoadState
   *  ('domcontentloaded')` resolves almost immediately with no real
   *  navigation to wait for, so the row read ran before the AJAX response
   *  ever arrived. Fixed: wait for a "View" link to appear in `#result`
   *  instead (same wait target `PrecheckEnquiryPage`'s own listing readers
   *  already use for an AJAX/rendered-in-place search), tolerating a
   *  genuinely empty result via the timeout -> `readRows()`'s own
   *  no-table-found fallback. */
  async searchByVehicleNo(vehicleRegNo: string): Promise<BoPrecheckListingRow[]> {
    await this.selectDateToday('#fromDate');
    await this.selectDateToday('#toDate');
    await this.page.locator('#vehicleNo').fill(vehicleRegNo);

    await this.page.locator('#to-search').click();
    await this.page.locator('#result table a', { hasText: 'View' }).first()
      .waitFor({ state: 'visible', timeout: 20_000 }).catch(() => { /* genuinely empty — readRows() handles this */ });

    return this.readRows();
  }

  private async readRows(): Promise<BoPrecheckListingRow[]> {
    const anyTable = await this.page.locator('#result table').count();
    if (anyTable === 0) return [];

    const rows = this.page.locator('#result table tbody tr:not(.header)');
    const count = await rows.count();
    const result: BoPrecheckListingRow[] = [];
    for (let i = 0; i < count; i++) {
      const texts = (await rows.nth(i).locator('td').allTextContents()).map(t => t.trim());
      result.push({
        companyName: texts[1] ?? '',
        companyRoc: texts[2] ?? '',
        vehicleNo: texts[3] ?? '',
        transactionNo: texts[4] ?? '',
        createdAt: texts[5] ?? '',
        payment: texts[6] ?? '',
        jpjPreChecking: texts[7] ?? '',
        trxStatus: texts[8] ?? '',
        lhdnResponseStatus: texts[9] ?? '',
        remarks: texts[10] ?? '',
        specialRemarks: texts[11] ?? '',
      });
    }
    return result;
  }

  /** Clicks the CONFIRMED `a.to-cancel` link on the FIRST row that has one
   *  (a search already scoped to one vehicle no., so this is normally the
   *  single Pending/Failed row MU_TS9 needs — takes the first match rather
   *  than requiring exactly one, same "first row" convention as
   *  `PrecheckEnquiryPage.openViaListingAndResubmit()`). Listens for a
   *  native dialog defensively (see this class's own header note — the
   *  click handler's own behaviour past the selector itself is
   *  unconfirmed) and accepts it if one fires, but doesn't require one. */
  async cancelFirstMatchingRow(): Promise<{ found: boolean; dialogMessage: string }> {
    const cancelLink = this.page.locator('a.to-cancel').first();
    const found = await cancelLink.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false);
    if (!found) return { found: false, dialogMessage: '' };

    let dialogMessage = '';
    const onDialog = (dialog: Dialog) => {
      dialogMessage = dialog.message();
      dialog.accept().catch(() => {});
    };
    this.page.on('dialog', onDialog);
    try {
      await cancelLink.click();
      await this.page.waitForLoadState('domcontentloaded').catch(() => { /* may not navigate at all */ });
    } finally {
      this.page.off('dialog', onDialog);
    }
    return { found: true, dialogMessage };
  }

  /** Cancels EVERY cancellable row for a vehicle no. — added 2026-08-27 for
   *  MU_TS10 (EAINT-9306), the DIFFERENT-company sibling of MU_TS9: since
   *  each company gets its OWN separate Pre-Checking record for the same
   *  vehicle (confirmed isolation, MU_TS3/MU_TS5, §21/§23), a search by
   *  vehicle no. here can return TWO cancellable rows (one per company),
   *  both of which need cancelling for MU_TS10's own scenario. Re-runs
   *  `searchByVehicleNo()` between each cancel to get a fresh row list
   *  rather than trusting the DOM after a click whose own AJAX-vs-reload
   *  behaviour on THIS action is still unconfirmed (§27's own note on
   *  `cancelFirstMatchingRow()`) — belt-and-suspenders, costs one extra
   *  search per row. */
  async cancelAllMatchingRows(vehicleRegNo: string, maxRows = 5): Promise<{ found: boolean; dialogMessage: string }[]> {
    const results: { found: boolean; dialogMessage: string }[] = [];
    for (let i = 0; i < maxRows; i++) {
      await this.searchByVehicleNo(vehicleRegNo);
      const anyCancellable = await this.page.locator('a.to-cancel').count();
      if (anyCancellable === 0) break;
      const result = await this.cancelFirstMatchingRow();
      results.push(result);
      if (!result.found) break;
    }
    return results;
  }
}
