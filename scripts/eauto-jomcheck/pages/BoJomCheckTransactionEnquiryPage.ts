import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';

export interface EnquiryRow {
  index: number;
  /** "Company Name" column — the UCD company that made the transaction. The
   *  Enquiry lists EVERY company's transactions; a UCD login only sees its own. */
  companyName: string;
  vehicleNo: string;
  transactionNo: string;
  createdAt: string;
  payment: string;
  txStatus: string;
  /** "LHDN Response Status" column (OK / Failed / - / N/A). */
  lhdnStatus: string;
  /** "Remarks" column — "Failed to retrieve report" on a failed purchase. */
  remarks: string;
  /** The row's Action column carries "Resubmit" (Failed rows only). */
  canResubmit: boolean;
}

/**
 * BackOffice JomCheck Transaction Enquiry — `/view/jomcheck/enquiry`. See
 * `_reference/html/eauto/bo-jomcheck-transaction-enquiry.html`. Columns: # |
 * Company Name | Company ROC | Vehicle | Chassis No | Transaction No. |
 * Created At | Method | Payment | Tx Status | LHDN Response Status |
 * Remarks | Special Remarks | Action (a "View" link into
 * BoJomCheckTransactionDetailsPage, opens in a new tab per the captured
 * `target="_blank"`).
 */
export class BoJomCheckTransactionEnquiryPage extends BasePage {
  // BO home's "Transactions Relevant" category ->
  // _reference/html/eauto/bo-home-hub-admin.html: `<a href="/view/jomcheck/enquiry">Jomcheck Transaction</a>`.
  private transactionEnquiryLink = () => this.page.getByRole('link', { name: 'Jomcheck Transaction' }).first();

  private vehicleNoInput = () => this.page.locator('#vehicleNo').first();
  private chassisNoInput = () => this.page.locator('#chassisNo').first();
  private refNoInput     = () => this.page.locator('#refNo').first();
  private searchBtn      = () => this.page.locator('#to-search').first();
  private dataRows       = () => this.page.locator('table tbody tr.odd, table tbody tr.even');

  constructor(page: Page) { super(page); }

  /** Reaches the listing via BO home's "Jomcheck Transaction" link — not a
   *  direct `page.goto()` (Faizuddin, 2026-09-30: navigate via clicks). */
  async goto(): Promise<void> {
    if (!(await this.transactionEnquiryLink().count())) {
      await this.page.goto(`${CONFIG.baseUrl}${CONFIG.boHome}`, {
        waitUntil: 'load',
        timeout: CONFIG.navigationTimeout,
      });
      await this.settleAfterLoad();
      await this.dismissBanners();
    }

    await this.demoHighlight(this.transactionEnquiryLink());
    await this.transactionEnquiryLink().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    await this.dismissBanners();
  }

  /**
   * Searches by vehicle no. and NOTHING ELSE — deliberately leaves
   * `#fromDate`/`#toDate` untouched.
   *
   * ⚠ Do not "helpfully" set a date range here. Confirmed live,
   * 2026-10-01, by capturing the page on load
   * (`_reference/html/eauto/bo-jomcheck-transaction-enquiry-datepicker.html`):
   * **both date fields are EMPTY on load and are optional filters** — an
   * empty range searches all time, which is exactly what a
   * search-by-vehicle-no. wants. Two earlier attempts both broke this:
   *
   * 1. `.fill()` on `#fromDate` — impossible. These are READONLY inputs
   *    driven by a jQuery UI datepicker (`class="hasDatepicker"`), and
   *    `.fill()` cannot type into a readonly field at all; it timed out
   *    after 30s on "element to be editable" and never reached the Search
   *    click (the "automation did not click Search" symptom, 2026-10-03).
   * 2. Clicking `.ui-datepicker-today a` for BOTH fields — "worked", but
   *    pinned the range to today..today, so any vehicle whose transaction
   *    predates today returned **0 rows**. Confirmed live 2026-10-01: the
   *    shared fixture `HXJ0001` searched with From=To=01/10/2026 gave
   *    "0 record(s) in total". That was imported from
   *    `BoDeregTransactionListingPage` (EAINT-9306), where the From date
   *    genuinely IS required — this page is not that page, and the
   *    requirement was never verified here.
   *
   * If a future TS ever does need a bounded range, the captured widget has
   * real `.ui-datepicker-month` / `.ui-datepicker-year` `<select>`s (years
   * 2016-2026) plus a `.ui-datepicker-prev` arrow, so it can be navigated
   * without hacking around the readonly attribute — see the capture.
   */
  async searchByVehicleNo(vehicleNo: string): Promise<void> {
    await this.demoHighlight(this.vehicleNoInput());
    await this.vehicleNoInput().fill(vehicleNo);
    await this.demoPause();
    await this.demoHighlight(this.searchBtn());
    await this.searchBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  /** Searches by Transaction No. (`#refNo`) only — returns just that one
   *  transaction, so the run never has to assume "row 0 is ours". Dates
   *  left untouched, same reason as searchByVehicleNo(). */
  async searchByTransactionNo(txNo: string): Promise<void> {
    await this.demoHighlight(this.refNoInput());
    await this.refNoInput().fill(txNo);
    await this.demoPause();
    await this.demoHighlight(this.searchBtn());
    await this.searchBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  async getResultCount(): Promise<number> {
    return this.dataRows().count();
  }

  // ── Bounded date range + Tx Status filter (TS31 finds its own failed
  //    transaction — Faizuddin, 2026-10-05: "go to BO, filter the
  //    transactions to before September with transaction failed, and will
  //    do it until it gets a transaction") ─────────────────────────────────
  private fromDateInput = () => this.page.locator('#fromDate').first();
  private toDateInput   = () => this.page.locator('#toDate').first();
  private statusSelect  = () => this.page.locator('select#to-filter').first();
  private datepicker    = () => this.page.locator('#ui-datepicker-div');

  /** Picks `date` in a readonly jQuery UI datepicker field the way a person
   *  does: open it, choose the year and month in the widget's own selects
   *  (2016-2026 — `_reference/html/eauto/bo-jomcheck-transaction-enquiry-datepicker.html`),
   *  click the day. A real click fires the widget's own handlers; `.fill()`
   *  cannot type into these readonly fields (see searchByVehicleNo). */
  private async pickDate(input: Locator, date: Date): Promise<string> {
    const label = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    await this.demoHighlight(input);
    await input.click();
    await this.datepicker().waitFor({ state: 'visible', timeout: CONFIG.navigationTimeout });
    await this.datepicker().locator('select.ui-datepicker-year').selectOption(String(date.getFullYear()));
    await this.datepicker().locator('select.ui-datepicker-month').selectOption(String(date.getMonth()));
    const dayCell = this.datepicker()
      .locator('td:not(.ui-datepicker-other-month):not(.ui-datepicker-unselectable) a', { hasText: new RegExp(`^${date.getDate()}$`) })
      .first();
    if (!(await dayCell.count())) throw new Error(`${await input.getAttribute('id')}: ${label} is not selectable in the calendar.`);
    await dayCell.click();
    const value = await input.inputValue();
    if (!value) throw new Error(`Could not set ${await input.getAttribute('id')} to ${label} — the field is still empty.`);
    await this.demoHighlight(input, { color: 'green' });
    return value;
  }

  /** Searches Created At `from`..`to` (keep them at most one month apart —
   *  eAuto default rule, knowledge/quirks.md → Dates) with the given
   *  Transaction Status (select#to-filter: New | Pending | Approved | Failed).
   *  Returns the From/To values as the page shows them. */
  async searchByStatusBetween(from: Date, to: Date, status: 'New' | 'Pending' | 'Approved' | 'Failed'): Promise<string> {
    const f = await this.pickDate(this.fromDateInput(), from);
    const t = await this.pickDate(this.toDateInput(), to);
    await this.demoHighlight(this.statusSelect());
    await this.statusSelect().selectOption(status);
    await this.demoPause();
    await this.demoHighlight(this.searchBtn());
    await this.searchBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
    return `${f} to ${t}`;
  }

  /** Every result row, by column (header order from the captured page:
   *  # | Company Name | Company ROC | Vehicle | Chassis No | Transaction No. |
   *  Created At | Method | Payment | Tx Status | ...). */
  async readRows(): Promise<EnquiryRow[]> {
    const out: EnquiryRow[] = [];
    const n = await this.dataRows().count();
    for (let i = 0; i < n; i++) {
      const row = this.dataRows().nth(i);
      const cells = (await row.locator('td').allInnerTexts()).map(t => t.trim());
      out.push({
        index: i, companyName: cells[1] ?? '', vehicleNo: cells[3] ?? '', transactionNo: cells[5] ?? '',
        createdAt: cells[6] ?? '', payment: cells[8] ?? '', txStatus: cells[9] ?? '',
        lhdnStatus: cells[10] ?? '', remarks: cells[11] ?? '',
        canResubmit: (await row.locator('a.to-resubmit').count()) > 0,
      });
    }
    return out;
  }

  // ── EAINT-12412 TS07: "Resubmit" on a Failed row ──────────────────────
  // The control is on THIS listing, in the Action column beside "View", and
  // only on Failed rows — not on the Transaction Details page (Faizuddin,
  // 2026-10-15: "the resubmit button is here, not after BO user click
  // 'View'"). Markup, from
  // _reference/html/eauto/bo-jomcheck-transaction-enquiry-failed-resubmit.html:
  //   <a href="#" class="to-resubmit" txid="<uuid>" title="to resubmit J600008508">Resubmit</a>
  // Seen by a HubAdmin login ("Ong Hong Kee"); other roles unknown.
  private resubmitLink = (rowIndex: number) => this.dataRows().nth(rowIndex).locator('a.to-resubmit').first();

  /**
   * Clicks a row's "Resubmit" and answers whatever the page asks, the way a
   * person does. What follows the click was never captured [unconfirmed], so
   * every prompt is handled and its text returned for the DETAIL log:
   *   - a native confirm()/alert() → accepted (the person clicks OK);
   *   - the page's own jQuery UI confirm (.confirm-dialog-btn) → Yes;
   *   - a message in #custom-dialog / any jQuery UI dialog → read, then OK.
   */
  async resubmitRow(rowIndex: number): Promise<string[]> {
    const messages: string[] = [];
    const onDialog = async (d: import('@playwright/test').Dialog) => {
      messages.push(`${d.type()}: ${d.message()}`);
      await d.accept().catch(() => {});
    };
    this.page.on('dialog', onDialog);
    try {
      await this.demoHighlight(this.resubmitLink(rowIndex));
      await this.resubmitLink(rowIndex).click();

      const uiDialog = this.page.locator('.ui-dialog:visible').first();
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (await uiDialog.isVisible().catch(() => false)) {
          const text = (await uiDialog.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
          messages.push(`page dialog: ${text}`);
          await this.demoHighlight(uiDialog, { color: 'green' });
          const yes = uiDialog.locator('.confirm-dialog-btn').first();
          const ok = uiDialog.locator('button:has-text("OK"), button:has-text("Ok"), button:has-text("Close")').first();
          if (await yes.isVisible().catch(() => false)) await yes.click();
          else if (await ok.isVisible().catch(() => false)) await ok.click();
          else break; // a dialog with no button we know — leave it for the log/screenshot
          await this.page.waitForTimeout(1_000);
          continue; // a confirm may be followed by a result message
        }
        await this.page.waitForTimeout(CONFIG.pollingInterval);
      }
      await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout }).catch(() => {});
      await this.settleAfterLoad();
    } finally {
      this.page.off('dialog', onDialog);
    }
    return messages;
  }

  async highlightRow(rowIndex: number): Promise<void> {
    await this.demoHighlight(this.dataRows().nth(rowIndex), { color: 'green' });
  }

  /** Moves to the next page of search results, if there is one. Returns
   *  false on the last (or only) page.
   *  [unconfirmed: the pager's exact markup — the 2026-09-30 capture trimmed
   *  the 42-row result to 3 rows and dropped the pager. The form carries
   *  `<input type="hidden" name="pageNo">`, so the pager is expected to be
   *  links/buttons after the table; the usual eAuto shapes are tried.
   *  Capture the page the first time a month returns more than one page.] */
  async nextResultsPage(): Promise<boolean> {
    const next = this.page.locator([
      'a:has-text("Next")', 'a:has-text("»")', 'a:has-text(">")', 'a[title="Next"]',
      'input[type="button"][value*="Next" i]', '.pagination a.next', 'a.next',
    ].join(', ')).first();
    if (!(await next.count()) || !(await next.isVisible()) || /disabled/.test((await next.getAttribute('class')) ?? '')) return false;
    const firstBefore = await this.dataRows().first().innerText().catch(() => '');
    await this.demoHighlight(next);
    await next.click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
    const firstAfter = await this.dataRows().first().innerText().catch(() => '');
    return firstAfter !== firstBefore; // same first row = the click did nothing
  }

  /**
   * Opens a given row's (0-based) Transaction Details — the real "View" link
   * carries `target="_blank"` (a new tab), which would split the run across
   * two video files and break the "one recording per test" rule. Instead,
   * this reads the link's real `href` out of the DOM (still a genuine,
   * discovered-from-the-page URL, not a guessed/hardcoded path) and
   * `page.goto()`s it on the SAME page, landing on
   * BoJomCheckTransactionDetailsPage without ever opening a second tab.
   */
  async openResult(rowIndex = 0): Promise<void> {
    const link = this.dataRows().nth(rowIndex).locator('a:has-text("View")').first();
    await this.demoHighlight(link);
    const href = await link.getAttribute('href');
    if (!href) throw new Error('The "View" link has no href — cannot open Transaction Details.');
    await this.page.goto(new URL(href, this.page.url()).toString(), {
      waitUntil: 'load',
      timeout: CONFIG.navigationTimeout,
    });
    await this.settleAfterLoad();
    await this.dismissBanners();
  }
}
