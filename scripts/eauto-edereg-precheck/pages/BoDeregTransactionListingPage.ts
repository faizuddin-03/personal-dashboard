import { Page } from '@playwright/test';
import { CONFIG } from '../data/config';

export interface BoDeregListingRow {
  companyName: string;
  companyRoc: string;
  vehicleNo: string;
  transactionNo: string;
  ownerName: string;
  createdAt: string;
  method: string;
  jpjEnquiry: string;
  payment: string;
  jpjDereg: string;
  trxStatus: string;
  cod: string;
  lhdnResponseStatus: string;
  remarks: string;
}

// ── BackOffice "Deregistration Transaction Enquiry" — search + results
// (EAINT-9306) ──
// `/view/dereg/enquiry/main.do` — inferred from the "View" links'
// own href in the captured HTML (`/view/dereg/enquiry/view.do?id=<uuid>`,
// same pattern JpjXmlLogPage's two BO routes follow: no `/aatf/` segment,
// unlike the AATF-side equivalent's `/view/aatf/dereg/enquiry/main.do`) —
// the search form's own action URL was never directly confirmed, only
// inferred. Confirmed from `EAINT-9306-bo-dereg-transaction-listing.html`
// (pasted by Faizuddin 2026-08-27, BOTH before/after states in one capture).
// 16-column table: Company Name/ROC, Vehicle, Transaction No., Owner Name,
// Created At, Method, THREE separate status columns (JPJ Enquiry / Payment
// / JPJ Dereg), Tx Status, COD, LHDN Response Status, Remarks, Action.
//
// **NOT the page MU_TS9 (or anything else in this ticket, currently) uses.**
// Originally captured/built for MU_TS9's BackOffice cancel step, but
// Faizuddin corrected 2026-08-27: he'd pasted THIS page by mistake — the
// step actually needs the "eDereg Pre-Checking Transaction Listing" instead
// (`BoPrecheckTransactionListingPage`, which also carries the real,
// CONFIRMED `a.to-cancel` markup this class never had). Kept as-is (a real,
// working capture/page object) since it may be useful for a future
// Deregistration-side BO scenario — just isn't wired into any test today.
//
// **"From" date is COMPULSORY before Search can be clicked** — confirmed
// directly by Faizuddin: "in order to search, will need to first choose
// 'From' date. Only after that can click search." `#fromDate`/`#toDate` are
// readonly text inputs driven by a jQuery UI datepicker
// (`#ui-datepicker-div`) — the same mechanism `BoPrecheckTransactionListingPage`
// also uses. `selectFromDateToday()` clicks `#fromDate` to open the widget,
// then `.ui-datepicker-today a` — jQuery UI always marks the CURRENT
// calendar day with `ui-datepicker-today` regardless of which month is
// showing, confirmed from the capture's own markup (today, 27-08-2026,
// rendered with `class="... ui-datepicker-current-day ui-datepicker-today"`
// wrapping `<a>27</a>`) — reliable regardless of what "today" actually is
// when this runs. Only "From" is filled, per Faizuddin's own statement that
// only that one is required (the "To" field's visual `*` in the markup is
// NOT treated as compulsory here, per his explicit direction over the
// visual asterisk).
//
// **"Includes Draft Trx" (`#includeDraft`)** — per MU_TS1's own established
// finding (§19), a Deregistration that hasn't reached Step 3 does not
// appear in this listing by default; this checkbox is the only visible
// affordance that could plausibly reveal a Step-2 Draft record. Still
// UNCONFIRMED live either way — `searchByVehicleNo()` always ticks it, but
// no test currently exercises this class at all so it's untested in
// practice too.
//
// **The "Cancel" action's markup on THIS page is STILL a blind guess** — no
// capture of this listing has ever shown a Pending/Failed row (only
// Approved rows, plain "View" links). `cancelFirstRow()` guesses a text
// link named "Cancel", matching this page's own "View" link shape — since
// nothing calls this method today, this guess has never even been
// exercised, let alone confirmed or refuted.
export class BoDeregTransactionListingPage {
  constructor(private readonly page: Page) {}

  async open(envSegment: string): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrlFor(envSegment)}/view/dereg/enquiry/main.do`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  private async selectFromDateToday(): Promise<void> {
    await this.page.locator('#fromDate').click();
    const today = this.page.locator('#ui-datepicker-div .ui-datepicker-today a');
    await today.waitFor({ state: 'visible', timeout: 10_000 });
    await today.click();
  }

  /** Ticks "Includes Draft Trx" (see this class's own header note — UNCONFIRMED
   *  whether this actually surfaces a Step-2 Draft Deregistration), selects
   *  today as "From", fills Vehicle No., clicks Search. Reload-race guarded
   *  the same way `DeregTransactionListingPage.countTransactionsForVehicle()`
   *  already confirmed live (`#to-search` is a real submit -> full page
   *  reload, not AJAX) — click paired with the load-state wait via
   *  `Promise.all()`. */
  async searchByVehicleNo(vehicleRegNo: string): Promise<BoDeregListingRow[]> {
    await this.selectFromDateToday();
    await this.page.locator('#includeDraft').check();
    await this.page.locator('#vehicleNo').fill(vehicleRegNo);

    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.page.locator('#to-search').click(),
    ]);
    await this.page.locator('#vehicleNo').getAttribute('value').then(async (v) => {
      if (v === vehicleRegNo) return;
      await this.page.waitForFunction(
        (expected) => (document.querySelector('#vehicleNo') as HTMLInputElement | null)?.value === expected,
        vehicleRegNo,
        { timeout: 10_000 },
      ).catch(() => { /* fall through to the row read below regardless */ });
    });

    return this.readRows();
  }

  private async readRows(): Promise<BoDeregListingRow[]> {
    const anyTable = await this.page.locator('#result table').count();
    if (anyTable === 0) return [];

    const rows = this.page.locator('#result table tbody tr:not(.header)');
    const count = await rows.count();
    const result: BoDeregListingRow[] = [];
    for (let i = 0; i < count; i++) {
      const texts = (await rows.nth(i).locator('td').allTextContents()).map(t => t.trim());
      result.push({
        companyName: texts[1] ?? '',
        companyRoc: texts[2] ?? '',
        vehicleNo: texts[3] ?? '',
        transactionNo: texts[4] ?? '',
        ownerName: texts[5] ?? '',
        createdAt: texts[6] ?? '',
        method: texts[7] ?? '',
        jpjEnquiry: texts[8] ?? '',
        payment: texts[9] ?? '',
        jpjDereg: texts[10] ?? '',
        trxStatus: texts[11] ?? '',
        cod: texts[12] ?? '',
        lhdnResponseStatus: texts[13] ?? '',
        remarks: texts[14] ?? '',
      });
    }
    return result;
  }

  /** Clicks the (GUESSED, see header note) "Cancel" link on the FIRST result
   *  row, confirming any dialog that appears. Returns whether a Cancel
   *  control was even found, so the caller can fail with a clear message
   *  rather than a raw locator timeout. */
  async cancelFirstRow(): Promise<{ found: boolean; dialogMessage: string }> {
    const cancelLink = this.page.locator('#result table tbody tr:not(.header)').first()
      .getByRole('link', { name: 'Cancel' });
    const found = await cancelLink.waitFor({ state: 'visible', timeout: 10_000 }).then(() => true).catch(() => false);
    if (!found) return { found: false, dialogMessage: '' };

    let dialogMessage = '';
    const onDialog = (dialog: import('@playwright/test').Dialog) => {
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
}
