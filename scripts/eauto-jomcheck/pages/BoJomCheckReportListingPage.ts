import { Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';

/**
 * BackOffice JomCheck Report Listing — the primary EAINT-12339 automation
 * target (29-column table). See
 * `_reference/html/eauto/bo-jomcheck-report-listing.html` and
 * `knowledge/flow-jomcheck.md` §7c for the captured shape this is built from.
 *
 * The table has no per-column `id`s — column identity is positional, read
 * off the `<th>` header row. Multi-claim cells render as
 * `1. <value><br>2. <value><br>` inside ONE `<td>`, not one `<tr>` per claim —
 * `readColumn()` / `readMultiClaimColumn()` below split on that pattern.
 */
export const REPORT_LISTING_COLUMNS = [
  '#',
  'Date & Time',
  'Vehicle Number',
  'Chassis Number',
  'Transaction Number',
  'Total Loss History (Actual)',
  'Possible Total Loss',
  'Total Loss History (BER)',
  'Possible BER',
  'Make / Brand',
  'Model',
  'Year Make',
  'Variant',
  'Engine CC',
  'Transmission',
  'Avg. Market Value / Avg. Retail Price',
  'Approx. New Car Price / Recommended Trade Price',
  'Flood History',
  'Windscreen Claim',
  'Multiple Registration of Car Plate / Chassis No.',
  'Last Mileage Recorded',
  'Accident Record',
  'Date of Loss',
  'Date of Authorized',
  'Odometer Reading',
  'Type of Claim',
  'Total No. of Parts Approved for Change',
  'State in Malaysia',
  'Incidents Severity Scale',
] as const;

/** A listing row: its 0-based index, or its Transaction Number ("J69…").
 *  Pass the Transaction Number wherever the run made the transaction, so a
 *  vehicle with older rows (earlier runs, other testers) can't be misread. */
export type RowRef = number | string;

export class BoJomCheckReportListingPage extends BasePage {
  // Home menu link (_reference/html/eauto/bo-home-hub-admin.html), under
  // "Settings (Hub Admin)": <a href="/uat1/view/jomcheck/report-listing/index.do">JomCheck Report Listing</a>
  private jomcheckReportListingLink = () => this.page.getByRole('link', { name: 'JomCheck Report Listing' }).first();

  private vehicleNoInput = () => this.page.locator('#vehicleNo').first();
  private chassisNoInput = () => this.page.locator('#chassisNo').first();
  private searchBtn      = () => this.page.locator('#to-search').first();
  private exportLink     = () => this.page.locator('#to-export').first();
  private headerCells    = () => this.page.locator('table thead tr.header th, table tr.header th');
  private dataRows        = () => this.page.locator('table tbody tr.odd, table tbody tr.even');

  constructor(page: Page) { super(page); }

  /**
   * Reaches the listing by clicking "JomCheck Report Listing" from BO home's
   * "Settings (Hub Admin)" category — not a direct `page.goto()` to the deep
   * path (Faizuddin, 2026-09-30: navigate via clicks, not URLs). Login
   * already lands on BO home, so `CONFIG.boHome` is only loaded directly as
   * a fallback when the link isn't already on screen.
   */
  async goto(): Promise<void> {
    // Guard on VISIBILITY, not `count()`. Confirmed live 2026-10-01 (TS36):
    // arriving here from the Transaction Details page, the "JomCheck Report
    // Listing" link IS in the DOM (so `count()` was > 0 and this skipped the
    // fallback) but is not actually on screen, so the click below sat there
    // and timed out after 30s. `count()` only proves the markup exists.
    if (!(await this.jomcheckReportListingLink().isVisible().catch(() => false))) {
      await this.page.goto(`${CONFIG.baseUrl}${CONFIG.boHome}`, {
        waitUntil: 'load',
        timeout: CONFIG.navigationTimeout,
      });
      await this.settleAfterLoad();
      await this.dismissBanners();
    }

    // Fail loudly and accurately when the account simply doesn't have this
    // menu entry, instead of sitting in a 30s click timeout that reads like
    // a bad selector. Confirmed live 2026-10-01: a BO account whose
    // "Settings (Hub Admin)" category lists only the JPJ XML Logs / batch
    // invoice / display-message entries — no "JomCheck Report Listing" —
    // is a PERMISSIONS difference, not a broken locator (see
    // knowledge/quirks.md's "rule out tester setup before blaming code").
    if (!(await this.jomcheckReportListingLink().isVisible().catch(() => false))) {
      throw new Error(
        'BO home has no visible "JomCheck Report Listing" link for this account. ' +
        'This menu entry lives under "Settings (Hub Admin)" and is permission-gated — ' +
        'the account currently logged in does not have it. Use a BO account that does ' +
        '(the dashboard\'s BO username/password fields), rather than the fallback in data/users.ts.',
      );
    }

    await this.demoHighlight(this.jomcheckReportListingLink());
    await this.jomcheckReportListingLink().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    await this.dismissBanners();
  }

  async searchByVehicleNo(vehicleNo: string): Promise<void> {
    await this.demoHighlight(this.vehicleNoInput());
    await this.vehicleNoInput().fill(vehicleNo);
    await this.demoPause();
    await this.demoHighlight(this.searchBtn());
    await this.searchBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  async searchByChassisNo(chassisNo: string): Promise<void> {
    await this.demoHighlight(this.chassisNoInput());
    await this.chassisNoInput().fill(chassisNo);
    await this.demoPause();
    await this.demoHighlight(this.searchBtn());
    await this.searchBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  // ── TS45: filters and the no-match message ──────────────────────
  private resetLink     = () => this.page.locator('#to-reset').first();
  private resultSummary = () => this.page.locator('#result-summary').first();

  /** Types into one filter key by key (fires keyup/input, unlike fill()),
   *  so whatever script greys out the other filter actually runs. */
  async typeFilter(which: 'vehicleNo' | 'chassisNo', value: string): Promise<void> {
    const input = which === 'vehicleNo' ? this.vehicleNoInput() : this.chassisNoInput();
    await this.demoHighlight(input);
    await input.click();
    await input.pressSequentially(value, { delay: 40 });
    await this.demoPause();
  }

  /** Whether a filter is greyed out. The page greys out the unused filter
   *  with the `disabled` attribute — confirmed for Chassis No. after a
   *  Vehicle No. search in
   *  `_reference/html/eauto/bo-jomcheck-report-listing-vehicle-filter-active.html`. */
  async isFilterDisabled(which: 'vehicleNo' | 'chassisNo'): Promise<boolean> {
    const input = which === 'vehicleNo' ? this.vehicleNoInput() : this.chassisNoInput();
    await this.demoHighlight(input, { color: 'green' });
    return input.isDisabled();
  }

  /** Raw state of a filter, for the DETAIL log (how it is greyed out). */
  async filterState(which: 'vehicleNo' | 'chassisNo'): Promise<{ value: string; disabled: boolean; readonly: boolean; background: string }> {
    const input = which === 'vehicleNo' ? this.vehicleNoInput() : this.chassisNoInput();
    return input.evaluate((el: HTMLInputElement) => ({
      value: el.value,
      disabled: el.disabled,
      readonly: el.readOnly,
      background: getComputedStyle(el).backgroundColor,
    }));
  }

  /** Clicks "Reset" — clears both filters. */
  async resetFilters(): Promise<void> {
    await this.demoHighlight(this.resetLink());
    await this.resetLink().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  /** Clicks SEARCH with whatever is already typed. */
  async clickSearch(): Promise<void> {
    await this.demoHighlight(this.searchBtn());
    await this.searchBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  /** `#result-summary` text, e.g. "1 record(s) in total". Only shown when
   *  a search has results — on a no-match search the div stays empty and
   *  hidden (`data-count="0"`), so use getNoMatchMessage() for that case. */
  async getResultSummary(): Promise<string> {
    await this.resultSummary().waitFor({ state: 'visible', timeout: CONFIG.navigationTimeout });
    await this.demoHighlight(this.resultSummary(), { color: 'green' });
    return (await this.resultSummary().innerText()).trim();
  }

  /** The single body row a no-match search renders in place of data rows.
   *  [verified: live run 2026-10-05, TS45 — "No records found. Please ensure
   *  there are existing JomCheck report purchase records."] */
  // Exact text match, NOT "a td containing it": the listing table sits inside
  // a layout table, so the first td *containing* the message was the outer
  // layout cell — its innerText was the whole listing (note + 29 headers +
  // message), which failed TS45 live on 2026-10-05.
  private noMatchRow = () => this.page.getByText('No records found. Please ensure there are existing JomCheck report purchase records.', { exact: true }).first();

  async getNoMatchMessage(): Promise<string> {
    await this.noMatchRow().waitFor({ state: 'visible', timeout: CONFIG.navigationTimeout });
    await this.demoHighlight(this.noMatchRow(), { color: 'green' });
    return (await this.noMatchRow().innerText()).trim();
  }

  /** TS17: confirm all 29 columns are present, in the documented order. */
  async getColumnHeaders(): Promise<string[]> {
    await this.demoHighlight(this.headerCells().first(), { color: 'green' });
    return this.headerCells().allInnerTexts();
  }

  async getResultCount(): Promise<number> {
    return this.dataRows().count();
  }

  /** Row index for a RowRef; a Transaction Number that is not on the page throws. */
  async rowIndexOf(row: RowRef): Promise<number> {
    if (typeof row === 'number') return row;
    const i = await this.findRowIndexByTransactionNo(row);
    if (i === -1) throw new Error(`Transaction ${row} is not in the listing results.`);
    return i;
  }

  /** Reads one column's raw cell text for a row (index or Transaction Number). */
  async readRawCell(rowRef: RowRef, columnName: (typeof REPORT_LISTING_COLUMNS)[number]): Promise<string> {
    const colIndex = REPORT_LISTING_COLUMNS.indexOf(columnName);
    if (colIndex === -1) throw new Error(`Unknown column: ${columnName}`);
    const row = this.dataRows().nth(await this.rowIndexOf(rowRef));
    const cell = row.locator('td').nth(colIndex);
    await this.demoHighlight(cell, { color: 'green' });
    return (await cell.innerText()).trim();
  }

  /**
   * Splits a multi-claim cell ("1. X<br>2. Y<br>") into an ordered array,
   * one entry per claim line. Single-claim cells (no leading "1. ") return
   * as a single-element array with the raw text.
   */
  async readMultiClaimColumn(rowRef: RowRef, columnName: (typeof REPORT_LISTING_COLUMNS)[number]): Promise<string[]> {
    const raw = await this.readRawCell(rowRef, columnName);
    if (!/^1\./.test(raw)) return [raw];
    return raw
      .split(/\n?\d+\.\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async exportListing(): Promise<void> {
    await this.exportLink().click();
  }

  /** Row index (0-based) whose Transaction Number is `txNo`, or -1. Used
   *  where a search returns several rows and one KNOWN transaction is
   *  needed (TS28-TS30's pre-push J690008380), not "row 0 is newest". */
  async findRowIndexByTransactionNo(txNo: string): Promise<number> {
    const col = REPORT_LISTING_COLUMNS.indexOf('Transaction Number');
    const count = await this.dataRows().count();
    for (let i = 0; i < count; i++) {
      const value = (await this.dataRows().nth(i).locator('td').nth(col).innerText()).trim();
      if (value === txNo) return i;
    }
    return -1;
  }

  /** Every cell of one row, keyed by column name (raw innerText, trimmed). */
  async readRow(rowRef: RowRef): Promise<Record<(typeof REPORT_LISTING_COLUMNS)[number], string>> {
    const rowIndex = await this.rowIndexOf(rowRef);
    const cells = this.dataRows().nth(rowIndex).locator('td');
    await this.demoHighlight(this.dataRows().nth(rowIndex), { color: 'green' });
    const out = {} as Record<(typeof REPORT_LISTING_COLUMNS)[number], string>;
    for (let i = 0; i < REPORT_LISTING_COLUMNS.length; i++) {
      out[REPORT_LISTING_COLUMNS[i]] = (await cells.nth(i).innerText()).trim();
    }
    return out;
  }

  /**
   * Clicks Export (only shown after a search) and saves the file. Kept as
   * evidence under `PW_EVIDENCE_DIR` when set, else a temp file. Returns
   * the saved path. The export's real format has not been captured yet —
   * `utils/exportReader.ts` checks it rather than assuming .xlsx.
   */
  async downloadExport(label: string): Promise<string> {
    await this.demoHighlight(this.exportLink());
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: CONFIG.navigationTimeout }),
      this.exportLink().click(),
    ]);
    const ext = path.extname(download.suggestedFilename()) || '.xlsx';
    const evidenceDir = process.env.PW_EVIDENCE_DIR;
    const filePath = evidenceDir
      ? path.join(evidenceDir, `${label.replace(/[^\w.-]+/g, '_')}${ext}`)
      : path.join(os.tmpdir(), `jomcheck-export-${Date.now()}${ext}`);
    if (evidenceDir) fs.mkdirSync(evidenceDir, { recursive: true });
    await download.saveAs(filePath);
    return filePath;
  }
}
