import { Locator, Page } from '@playwright/test';
import { AplBase } from './AplBase';
import { CONFIG, MONTHS } from '../data/config';
import { readTable, colOf, cellText, cellLocator, rowLocator, TableData, TableRow } from '../utils/table';

// Association Payment Listing — Summary page.
// Live capture (staging uat1, 2026-11-03, new build):
//   SUMMARY = _reference/html/eauto/bo-association-payment-listing-summary-2026-11-03.html
// (the 2026-11-02 capture, bo-association-payment-listing-summary.html, had an <h1>, a header name
// and a module Logout; the 2026-11-03 build has none of them and loads Search results without a reload).
// The module is its own app under /backoffice (form action /backoffice/admin/association, line 80).
export class AplSummaryPage extends AplBase {
  // from SUMMARY lines 73-75 `<div class="page-title"><span class="app-title">Association Payment Listing</span></div>`
  // — a span, not a heading. The old `<h1 class="report-title">` is kept as a fallback.
  heading = () => this.page.locator('.page-title .app-title, h1.report-title').filter({ hasText: /^\s*Association Payment Listing\s*$/ });
  // from SUMMARY line 82 `<select id="sel-year" name="year" …>`
  yearSelect = () => this.page.locator('#sel-year');
  // from SUMMARY line 85 `<button class="btn" id="btn-search" type="submit">Search</button>`
  searchBtn = () => this.page.getByRole('button', { name: 'Search', exact: true });
  // from SUMMARY line 86 `<span id="search-error" class="search-error" role="alert" hidden="">`
  searchError = () => this.page.locator('#search-error');
  // from SUMMARY lines 89-91 `<div class="header-text"><span>Association Payment Listing — 2026 Monthly Summary</span>`
  caption = () => this.page.locator('.header-text span');
  // from SUMMARY lines 92-94 `<span id="listing-count">12</span> record(s) in total`
  recordCount = () => this.page.locator('#listing-count');
  // from SUMMARY line 97
  table = () => this.page.locator('#tbl-summary');

  constructor(page: Page) { super(page); }

  async isShown(): Promise<boolean> {
    return (await this.heading().isVisible()) && (await this.yearSelect().isVisible());
  }

  async expectShown(): Promise<void> {
    const shown = await this.heading().waitFor({ state: 'visible', timeout: CONFIG.maxWaitForResult }).then(() => true, () => false);
    if (!shown) {
      await this.captureIssue('summary-not-shown', this.page.locator('main, body').first(), 'No "Association Payment Listing" title on this page');
      throw new Error(`The Association Payment Listing Summary did not open (no "Association Payment Listing" heading) at ${this.page.url()}.`);
    }
  }

  async yearOptions(): Promise<string[]> {
    const sel = this.yearSelect();
    if (!(await sel.count())) throw new Error('No Year filter (#sel-year) on the Summary page.');
    return (await sel.locator('option').allInnerTexts()).map(t => t.trim());
  }

  /** Picks the Year and presses Search; waits for the month rows (automation lesson 2: read only after Search). */
  async search(year = CONFIG.year): Promise<TableData> {
    const sel = this.yearSelect();
    if (!(await sel.count())) throw new Error('No Year filter (#sel-year) on the Summary page.');
    await this.demoHighlight(sel);
    // SUMMARY line 82: #sel-year onchange calls form.requestSubmit(); the page script (line 480)
    // catches the submit and loads the year from /backoffice/admin/association/api/summary, redrawing
    // only the table, caption and count — no page reload. selectOption fires change even for the year
    // already shown, so only pick a different year, then wait for that load before pressing [Search].
    const shown = (await sel.locator('option:checked').innerText()).trim();
    if (shown !== String(year)) {
      const loaded = this.summaryLoad();
      await sel.selectOption({ label: String(year) });
      await loaded;
      await this.waitForYearShown(year);
    }
    const btn = this.searchBtn();
    if (!(await btn.count())) throw new Error('No [Search] button on the Summary page.');
    await this.demoHighlight(btn);
    const loaded = this.summaryLoad();
    await btn.click();
    await loaded;
    await this.waitForYearShown(year);
    const ok = await this.waitForCondition(async () => {
      const t = this.table();
      return (await t.count()) > 0 && (await t.locator('tr').count()) > 1;
    });
    if (!ok) throw new Error(`The Summary table (#tbl-summary) shows no rows after Search for ${year}.`);
    return this.read();
  }

  /** The Search data call (SUMMARY line 395 `API = "/backoffice/admin/association/api/summary"`). Never rejects. */
  private summaryLoad(): Promise<unknown> {
    return this.page
      .waitForResponse(r => r.url().includes('/backoffice/admin/association/api/summary'), { timeout: CONFIG.navigationTimeout })
      .catch(() => null);
  }

  /**
   * The load is done when [Search] is enabled again (the script disables it while loading, lines 459/477)
   * and the caption names `year` (line 450). A shown #search-error ("Could not load …") fails the step.
   */
  private async waitForYearShown(year: number | string): Promise<void> {
    const ok = await this.waitForCondition(async () => {
      if (await this.searchBtn().isDisabled().catch(() => true)) return false;
      return (await this.caption().innerText().catch(() => '')).includes(String(year));
    });
    const err = this.searchError();
    if (await err.isVisible().catch(() => false)) {
      const text = (await err.innerText().catch(() => '')).trim();
      await this.captureIssue(`search-error-${year}`, err, text);
      throw new Error(`Search for ${year} showed "${text}".`);
    }
    if (!ok) throw new Error(`The Summary caption did not change to ${year} after Search (caption: "${(await this.caption().innerText().catch(() => '')).trim()}").`);
  }

  async read(): Promise<TableData> {
    return readTable(this.table());
  }

  monthCol = (data: TableData) => colOf(data, /^Month\b/i);

  /** Month rows in page order. */
  monthRows(data: TableData): { month: string; row: TableRow }[] {
    const c = this.monthCol(data);
    return data.rows
      .map(row => ({ month: row.byCol[c]?.text ?? '', row }))
      .filter(r => MONTHS.includes(r.month));
  }

  monthRow(data: TableData, month: string): TableRow {
    const r = this.monthRows(data).find(x => x.month === month);
    if (!r) throw new Error(`No "${month}" row in the Summary table.`);
    return r.row;
  }

  /** The year-to-date / full-year total row — SUMMARY line 377 label "YEAR TO DATE TOTAL" (mock-up line 601 had "YEAR TO DATE (Jan–Jun)"). */
  totalRow(data: TableData): TableRow {
    const row = data.rows.find(r => /^(YEAR TO DATE|FULL YEAR TOTAL|TOTAL)\b/i.test(r.text));
    if (!row) throw new Error('No total row (YEAR TO DATE / FULL YEAR TOTAL) in the Summary table.');
    return row;
  }

  totalLabel(row: TableRow): string {
    return (Object.values(row.byCol)[0]?.text ?? '').trim();
  }

  cell(data: TableData, row: TableRow, header: string | RegExp): string { return cellText(data, row, header); }
  cellAt(data: TableData, row: TableRow, header: string | RegExp): Locator { return cellLocator(this.table(), data, row, header); }
  rowAt(row: TableRow): Locator { return rowLocator(this.table(), row); }

  /** from SUMMARY line 311 `<a class="view" href="/backoffice/admin/association/2026/9">View</a>` */
  viewLink(row: TableRow): Locator {
    return this.rowAt(row).locator('a, button', { hasText: /^\s*View\b/ });
  }

  /** The three statuses and the payment date of a month, as the Summary shows them. */
  monthStatus(data: TableData, month: string) {
    const row = this.monthRow(data, month);
    return {
      drafter: this.cell(data, row, 'Drafter Status'),
      reviewer: this.cell(data, row, 'Reviewer Status'),
      approver: this.cell(data, row, 'Approver Status'),
      paymentDate: this.cell(data, row, 'Payment Date'),
    };
  }

  monthFigures(data: TableData, month: string) {
    const row = this.monthRow(data, month);
    return {
      cars: this.cell(data, row, 'Car Transactions'),
      carsRm: this.cell(data, row, 'Cars (RM)'),
      bikes: this.cell(data, row, 'Motorcycle Transactions'),
      bikesRm: this.cell(data, row, 'Motorcycles (RM)'),
    };
  }

  async openMonth(data: TableData, month: string): Promise<void> {
    const link = this.viewLink(this.monthRow(data, month));
    if (!(await link.count())) throw new Error(`No View link on the ${month} ${CONFIG.year} row — is the month closed?`);
    await this.demoHighlight(link.first());
    await link.first().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }
}
