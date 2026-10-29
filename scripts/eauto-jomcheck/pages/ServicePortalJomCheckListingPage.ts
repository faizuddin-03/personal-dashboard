import { Page, Locator } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';

/**
 * Service Portal JomCheck Report Listing — TS37-TS39 target (Severity
 * counters, absence of the BackOffice-only columns). See
 * `_reference/html/eauto/service-portal-home-and-jomcheck-listing.html`.
 *
 * Severity counter cell renders as one <td> with:
 * "Severe - N<br>High - N<br>Medium - N<br>Low - N<br>Critical - N<br>Catastrophic - N"
 * — confirmed live (this page) AND from the SRD mockup as the SAME order,
 * which conflicts with SRD REQ-008's stated text order. See
 * knowledge/flow-jomcheck.md §6/§7c — unresolved, needs a BA decision before
 * asserting a specific order is "correct".
 */
export class ServicePortalJomCheckListingPage extends BasePage {
  // Home menu link (_reference/html/eauto/service-portal-home-and-jomcheck-listing.html):
  // <a href="/uat1/credit/home/jomcheck-report-listing/main.do">JomCheck Report Listing</a>
  // under the "Hire Purchase Ownership" category — a real anchor, click it.
  private jomcheckListingLink = () => this.page.getByRole('link', { name: 'JomCheck Report Listing' }).first();

  private vehicleNoInput     = () => this.page.locator('#vehicleNo').first();
  private chassisNoInput     = () => this.page.locator('#chassisNo').first();
  private sharedDateFromInput = () => this.page.locator('#sharedDateFrom').first();
  private sharedDateToInput   = () => this.page.locator('#sharedDateTo').first();
  private searchBtn           = () => this.page.locator('#to-search').first();
  private exportLink          = () => this.page.locator('#to-export').first();
  private bulkDownloadLink    = () => this.page.locator('#jc-bulk-dl').first();
  private headerCells         = () => this.page.locator('table thead tr.header th, table tr.header th');
  private dataRows            = () => this.page.locator('table tbody tr.odd, table tbody tr.even');

  constructor(page: Page) { super(page); }

  /**
   * Reaches the listing by clicking the "JomCheck Report Listing" link from
   * the Service Portal home menu — not a direct `page.goto()` to the deep
   * path (Faizuddin, 2026-09-30: navigate via clicks, not URLs). Login
   * already lands on the home menu, so this only loads a URL directly if
   * that link isn't there yet (e.g. called right after construction, before
   * any navigation happened this session) — a genuine fallback, not a
   * shortcut past a known click path.
   */
  async goto(): Promise<void> {
    if (!(await this.jomcheckListingLink().count())) {
      await this.page.goto(`${CONFIG.servicePortalBaseUrl}${CONFIG.servicePortalHomePath}`, {
        waitUntil: 'load',
        timeout: CONFIG.navigationTimeout,
      });
      await this.settleAfterLoad();
    }
    await this.demoHighlight(this.jomcheckListingLink());
    await this.jomcheckListingLink().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  // ── Shared Date From/To (required, READONLY jQuery UI datepickers) ──
  // `.fill()` cannot type into a readonly field. Clicking through the open
  // calendar also failed live (2026-10-05, Faizuddin: "it was unable to pick
  // a date in this page. the automation did not do anything") — the widget
  // stayed on Jan 2026 (_reference/html/eauto/service-portal-jomcheck-listing-datepicker-open.html).
  // So the date is set through the widget's own jQuery UI call
  // (`datepicker('setDate', ...)`), which fills the field exactly as picking
  // a day would, in the page's own date format. The calendar is opened first
  // so the recording shows which field is being set.
  private datepicker = () => this.page.locator('#ui-datepicker-div');

  /** Sets a datepicker field (clamped by the widget to its own min/max) and
   *  returns the value the field ends up with.
   *
   *  ⚠ From/To may be at most ONE MONTH apart. eAuto default rule for every
   *  module unless stated otherwise (Faizuddin, 2026-10-05). A wider range is
   *  rejected on Search with "Shared Date range must not exceed one month."
   *  and the table shows no rows — the first live run (05/10/2016 →
   *  05/10/2026) failed exactly like that. The widget's year list going back
   *  to 2016 says nothing about what Search accepts. knowledge/quirks.md → Dates. */
  private async setDate(input: Locator, date: Date): Promise<string> {
    // ⚠ Picked through the widget's own selects + a REAL day click, not
    // datepicker('setDate'). setDate fills the field but does not fire the
    // From picker's onSelect, and that onSelect is what widens the To
    // picker's range: until it runs, To allows ONLY today (min = max = today
    // — every other day disabled, Prev/Next disabled), so a setDate of 31 Jan
    // on To was clamped to today and the search was rejected for exceeding
    // one month (From 01/01/2026, To 05/10/2026). [verified: pasted HTML,
    // _reference/html/eauto/service-portal-jomcheck-listing-one-month-error.html,
    // and the TS37 failure screenshot, 2026-10-05]
    const year = String(date.getFullYear());
    const month = String(date.getMonth()); // jQuery UI month option values are 0-11
    const day = String(date.getDate());
    const label = `${day}/${date.getMonth() + 1}/${year}`;
    await this.demoHighlight(input);
    await input.click();
    await this.datepicker().waitFor({ state: 'visible', timeout: CONFIG.navigationTimeout });
    await this.demoPause();
    await this.datepicker().locator('select.ui-datepicker-year').selectOption(year);
    await this.datepicker().locator('select.ui-datepicker-month').selectOption(month);
    const dayCell = this.datepicker()
      .locator('td:not(.ui-datepicker-other-month):not(.ui-datepicker-unselectable) a', { hasText: new RegExp(`^${day}$`) })
      .first();
    if (!(await dayCell.count())) {
      throw new Error(`${await input.getAttribute('id')}: ${label} is not selectable in the calendar — the widget's allowed range does not include it.`);
    }
    await this.demoHighlight(dayCell);
    await dayCell.click();
    const value = await input.inputValue();
    if (!value) throw new Error(`Could not set ${await input.getAttribute('id')} — the field is still empty.`);
    await this.demoHighlight(input, { color: 'green' });
    return value;
  }

  /**
   * Searches with Shared Date From = To = today by default — TS37-TS39 buy
   * and share their own report in the same run (Faizuddin, 2026-10-05), so
   * it is shared today. Pass `from`/`to` for another window; keep them at
   * most one month apart (eAuto default rule, knowledge/quirks.md → Dates).
   * Vehicle/Chassis No. optional.
   */
  async search(opts: { vehicleNo?: string; chassisNo?: string; from?: Date; to?: Date } = {}): Promise<void> {
    if (opts.vehicleNo) { await this.demoHighlight(this.vehicleNoInput()); await this.vehicleNoInput().fill(opts.vehicleNo); }
    if (opts.chassisNo) { await this.demoHighlight(this.chassisNoInput()); await this.chassisNoInput().fill(opts.chassisNo); }
    const today = new Date();
    await this.setDate(this.sharedDateFromInput(), opts.from ?? today);
    await this.setDate(this.sharedDateToInput(), opts.to ?? today);
    await this.demoPause();
    await this.demoHighlight(this.searchBtn());
    await this.searchBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  /** The Shared Date range actually used, for the DETAIL log. */
  async getSharedDateRange(): Promise<string> {
    return `${await this.sharedDateFromInput().inputValue()} to ${await this.sharedDateToInput().inputValue()}`;
  }

  /** One row's cells keyed by header text (after a search). */
  async readRow(rowIndex: number): Promise<Record<string, string>> {
    const headers = (await this.headerCells().allInnerTexts()).map(h => h.trim());
    const cells = (await this.dataRows().nth(rowIndex).locator('td').allInnerTexts()).map(t => t.trim());
    await this.demoHighlight(this.dataRows().nth(rowIndex), { color: 'green' });
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
  }

  /** Clicks Export (shown after a search) and saves the file — under
   *  `PW_EVIDENCE_DIR` as `<label>.<ext>` when set, else a temp file. */
  async downloadExport(label: string): Promise<string> {
    await this.demoHighlight(this.exportLink());
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: CONFIG.navigationTimeout }),
      this.exportLink().click(),
    ]);
    return this.saveDownload(download, label, 'sp-export', '.xlsx');
  }

  /** Clicks "Download files (N)" and saves the ZIP of PDFs. */
  async downloadBulk(label: string): Promise<string> {
    await this.demoHighlight(this.bulkDownloadLink());
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: CONFIG.navigationTimeout }),
      this.bulkDownloadLink().click(),
    ]);
    return this.saveDownload(download, label, 'sp-bulk', '.zip');
  }

  private async saveDownload(download: import('@playwright/test').Download, label: string, tmpPrefix: string, fallbackExt: string): Promise<string> {
    const ext = path.extname(download.suggestedFilename()) || fallbackExt;
    const evidenceDir = process.env.PW_EVIDENCE_DIR;
    const filePath = evidenceDir
      ? path.join(evidenceDir, `${label.replace(/[^\w.-]+/g, '_')}${ext}`)
      : path.join(os.tmpdir(), `jomcheck-${tmpPrefix}-${Date.now()}${ext}`);
    if (evidenceDir) fs.mkdirSync(evidenceDir, { recursive: true });
    await download.saveAs(filePath);
    return filePath;
  }

  async getColumnHeaders(): Promise<string[]> {
    await this.demoHighlight(this.headerCells().first(), { color: 'green' });
    return this.headerCells().allInnerTexts();
  }

  async getResultCount(): Promise<number> {
    return this.dataRows().count();
  }

  /** Parses "Severe - 1<br>High - 0<br>..." into a band -> count map, preserving DOM order. */
  async readSeverityCounters(rowIndex: number): Promise<Array<{ band: string; count: number }>> {
    // Column 15 (0-based): Count(s) of Incidents Severity Scale.
    const cell = this.dataRows().nth(rowIndex).locator('td').nth(15);
    await this.demoHighlight(cell, { color: 'green' });
    const raw = await cell.innerText();
    return parseSeverityCounters(raw);
  }

  async checkDownload(rowIndex: number): Promise<void> {
    const checkbox = this.dataRows().nth(rowIndex).locator('.jc-dl');
    await this.demoHighlight(checkbox);
    await checkbox.check();
  }

  async getBulkDownloadLabel(): Promise<string> {
    return (await this.bulkDownloadLink().innerText()).trim();
  }
}


/** "Severe - 1<newline>High - 0 ..." → [{band, count}] in text order. "-" → []. */
export function parseSeverityCounters(raw: string): Array<{ band: string; count: number }> {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== '-')
    .map((line) => {
      const [band, count] = line.split(' - ');
      return { band: (band ?? '').trim(), count: Number(count) };
    });
}
