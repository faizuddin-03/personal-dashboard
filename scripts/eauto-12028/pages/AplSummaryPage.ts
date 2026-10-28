import { Locator, Page } from '@playwright/test';
import { AplBase } from './AplBase';
import { CONFIG, MONTHS } from '../data/config';
import { readTable, colOf, cellText, cellLocator, rowLocator, TableData, TableRow } from '../utils/table';

// Association Payment Listing — Summary page.
// [unconfirmed] NOT captured live: every handle is the 31.07 mock-up's
// (_reference/tickets/Studying/EAINT-12028/association-payment-listing-mockup_20260731.html):
// heading line 184, `#sel-year` line 188, Search button line 190,
// `#tbl-summary` line 195 (columns built at line 585), View link line 458,
// total row line 601. Capture the live Summary (blank and after Search) to confirm.
export class AplSummaryPage extends AplBase {
  // mock-up line 184 `<h1 class="report-title">Association Payment Listing</h1>`
  heading = () => this.page.getByRole('heading', { name: 'Association Payment Listing', exact: true });
  // mock-up line 188
  yearSelect = () => this.page.locator('#sel-year');
  // mock-up line 190 `<button class="btn" onclick="applySearch()">Search</button>`
  searchBtn = () => this.page.getByRole('button', { name: 'Search', exact: true });
  // mock-up line 195
  table = () => this.page.locator('#tbl-summary');

  constructor(page: Page) { super(page); }

  async isShown(): Promise<boolean> {
    return (await this.heading().isVisible()) && (await this.yearSelect().isVisible());
  }

  async expectShown(): Promise<void> {
    const shown = await this.heading().waitFor({ state: 'visible', timeout: CONFIG.maxWaitForResult }).then(() => true, () => false);
    if (!shown) {
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
    await sel.selectOption({ label: String(year) });
    const btn = this.searchBtn();
    if (!(await btn.count())) throw new Error('No [Search] button on the Summary page.');
    await this.demoHighlight(btn);
    await btn.click();
    await this.waitForWorkingDone();
    const ok = await this.waitForCondition(async () => {
      const t = this.table();
      return (await t.count()) > 0 && (await t.locator('tr').count()) > 1;
    });
    if (!ok) throw new Error(`The Summary table (#tbl-summary) shows no rows after Search for ${year}.`);
    return this.read();
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

  /** The year-to-date / full-year total row (mock-up line 601: label cell "YEAR TO DATE (Jan–Jun)" / "FULL YEAR TOTAL"). */
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

  /** mock-up line 458 `<a class='view' onclick='showDetails(m)'>View »</a>` */
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
