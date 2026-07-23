import { type Page, type Locator, expect, test } from "@playwright/test";
import { BasePage } from "../BasePage";
import { PATHS } from "../../utils/config";

export type InstallationStatus =
  | ""
  | "NEW"
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

/**
 * eAuto Back Office Portal > Biometric Device Purchase & Software
 * Installation Listing.
 *
 * Selectors confirmed against the real BO portal HTML:
 *  - Filter form #sc-filter-form (GET → /api/admin/service-hub/listing/list.get).
 *    Field names: referenceNo, companyName, requestedFrom, requestedTo, roc,
 *    deliveryDateFrom, deliveryDateTo, deliveryStatus, appointmentDateFrom,
 *    appointmentDateTo, status (Installation Status), timeSlot (two
 *    checkboxes: 1000_1200 / 1400_1600), paymentStatus, lhdnStatus. All date
 *    inputs are readonly datepickers.
 *  - Buttons: #sc-search, #sc-export (hidden until a search runs), #sc-reset,
 *    #sc-appt-cal.
 *  - Results table #sc-combined-tbl (18 columns). Action cell has
 *    <a href="detail.do?txnId=X&apptId=Y">View</a> and
 *    <a onclick="scCancel(apptId)">Cancel</a>; Cancel opens the
 *    #sc-cancel-dialog ("Sure to cancel?").
 */
export class SoftwareInstallationListingPage extends BasePage {
  static readonly COL = {
    num: 0,
    referenceNo: 1,
    serviceType: 2,
    dateRequested: 3,
    companyName: 4,
    companyRoc: 5,
    device: 6,
    deliveryDate: 7,
    installationRequest: 8,
    appointmentDate: 9,
    timeSlot: 10,
    paymentStatus: 11,
    lhdnResponseStatus: 12,
    deliveryStatus: 13,
    installationStatus: 14,
    dateCompleted: 15,
    remarks: 16,
    specialRemarks: 17,
    action: 18,
  } as const;

  // Filter panel
  readonly referenceNoInput = this.page.locator('input[name="referenceNo"]');
  readonly companyNameInput = this.page.locator('input[name="companyName"]');
  readonly requestedFromInput = this.page.locator('input[name="requestedFrom"]');
  readonly requestedToInput = this.page.locator('input[name="requestedTo"]');
  readonly rocInput = this.page.locator('input[name="roc"]');
  readonly appointmentDateFromInput = this.page.locator('input[name="appointmentDateFrom"]');
  readonly appointmentDateToInput = this.page.locator('input[name="appointmentDateTo"]');
  readonly installationStatusSelect = this.page.locator('select[name="status"]');
  readonly paymentStatusSelect = this.page.locator('select[name="paymentStatus"]');
  readonly lhdnStatusSelect = this.page.locator('select[name="lhdnStatus"]');
  readonly timeSlotMorningCheckbox = this.page.locator('input[name="timeSlot"][value="1000_1200"]');
  readonly timeSlotAfternoonCheckbox = this.page.locator('input[name="timeSlot"][value="1400_1600"]');

  readonly searchBtn = this.page.locator("#sc-search");
  readonly exportBtn = this.page.locator("#sc-export");
  readonly resetBtn = this.page.locator("#sc-reset");
  readonly appointmentCalendarBtn = this.page.locator("#sc-appt-cal");

  readonly resultsTable = this.page.locator("#sc-combined-tbl");

  private headerIndexCache: Record<string, number> | null = null;

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.boSoftwareInstallationListing);
    // Guard against a redirect race landing us on the portal home instead of
    // the listing (the filter's Search button won't be there) — retry once.
    if ((await this.searchBtn.count()) === 0) {
      await this.goto(PATHS.boSoftwareInstallationListing);
    }
    await this.searchBtn.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  }

  /** Set a readonly datepicker input's value directly (bypasses the widget). */
  private async setDateInput(input: Locator, value: string) {
    await input.evaluate((el, v) => {
      (el as HTMLInputElement).value = v as string;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  }

  /**
   * Search. Date values are in the datepicker's display format (DD-MM-YYYY).
   * Date Requested From/To are mandatory per the SRD.
   */
  async searchWithFilters(opts: {
    referenceNo?: string;
    companyName?: string;
    roc?: string;
    requestedFrom?: string;
    requestedTo?: string;
    appointmentDateFrom?: string;
    appointmentDateTo?: string;
    installationStatus?: InstallationStatus;
    paymentStatus?: string;
    lhdnStatus?: string;
  }) {
    if (opts.referenceNo) await this.referenceNoInput.fill(opts.referenceNo);
    if (opts.companyName) await this.companyNameInput.fill(opts.companyName);
    if (opts.roc) await this.rocInput.fill(opts.roc);
    if (opts.requestedFrom) await this.setDateInput(this.requestedFromInput, opts.requestedFrom);
    if (opts.requestedTo) await this.setDateInput(this.requestedToInput, opts.requestedTo);
    if (opts.appointmentDateFrom) await this.setDateInput(this.appointmentDateFromInput, opts.appointmentDateFrom);
    if (opts.appointmentDateTo) await this.setDateInput(this.appointmentDateToInput, opts.appointmentDateTo);
    if (opts.installationStatus !== undefined) await this.installationStatusSelect.selectOption(opts.installationStatus);
    if (opts.paymentStatus) await this.paymentStatusSelect.selectOption(opts.paymentStatus);
    if (opts.lhdnStatus) await this.lhdnStatusSelect.selectOption(opts.lhdnStatus);

    // Search fires an AJAX GET to the listing API (#sc-filter-form →
    // .../listing/list.*), not a full page navigation — waitForNav()'s
    // networkidle can resolve before that fetch/render actually completes,
    // since #sc-combined-tbl already exists (with the PREVIOUS search's rows)
    // and so is already "visible" the instant we check. Wait for the actual
    // list response before treating the search as done.
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => /listing\/list/i.test(res.url()), { timeout: 15000 }).catch(() => null),
      this.searchBtn.click(),
    ]);
    if (!response) {
      // Endpoint didn't match what we expected — fall back to best-effort waits.
      await this.waitForNav();
    }
    await this.resultsTable.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  }

  async resetFilters() {
    await this.resetBtn.click();
    await this.waitForNav();
  }

  async goToAppointmentCalendar() {
    await this.appointmentCalendarBtn.click();
    await this.waitForNav();
  }

  async getResultRows(): Promise<Locator[]> {
    // Data rows only — the header renders as a <th> row inside <tbody>.
    return await this.resultsTable.locator("tbody tr:has(td)").all();
  }

  private normalizeHeader(text: string): string {
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  }

  private async getHeaderIndexMap(): Promise<Record<string, number>> {
    if (this.headerIndexCache) return this.headerIndexCache;
    const map: Record<string, number> = {};
    const headers = await this.resultsTable.locator("thead tr th").allTextContents();
    headers.forEach((h, i) => {
      map[this.normalizeHeader(h)] = i;
    });
    this.headerIndexCache = map;
    return map;
  }

  private async cellTextByHeader(row: Locator, headerLabel: string): Promise<string> {
    const map = await this.getHeaderIndexMap();
    const idx = map[this.normalizeHeader(headerLabel)];
    if (idx === undefined) return "";
    return this.cellText(row, idx);
  }

  /**
   * Some deployments add/remove leading columns in #sc-combined-tbl,
   * shifting the fixed indices. Anchor on the row's Reference No. cell and
   * derive a per-row offset so Company/Payment/Installation Request still map
   * to the intended logical columns.
   */
  private async getColOffset(row: Locator): Promise<number> {
    const cells = row.locator("td");
    const n = await cells.count();
    for (let i = 0; i < n; i++) {
      const text = ((await cells.nth(i).textContent()) ?? "").trim().replace(/\s+/g, " ");
      if (/^SR[A-Za-z]*\d+$/.test(text)) {
        return i - SoftwareInstallationListingPage.COL.referenceNo;
      }
    }
    return 0;
  }

  private async cellTextByBaseCol(row: Locator, baseColIndex: number): Promise<string> {
    const offset = await this.getColOffset(row);
    return this.cellText(row, baseColIndex + offset);
  }

  private async cellText(row: Locator, colIndex: number): Promise<string> {
    const cell = row.locator("td").nth(colIndex);
    if ((await cell.count()) === 0) return "";
    return (await cell.textContent())?.trim().replace(/\s+/g, " ") ?? "";
  }

  /**
   * Search by company name and return the newest request's Reference No.
   * (the listing is sorted latest-first). This is how a CSE looks up the
   * reference to feed into Add Appointment › Existing Record — e.g. after a
   * UCD biometric purchase, the freshly-created request is the top row.
   * Returns null if the company has no requests.
   */
  async getLatestReferenceForCompany(company: string): Promise<string | null> {
    await this.searchWithFilters({ companyName: company });
    const rows = await this.getResultRows();
    for (const row of rows) {
      const ref = await this.getRowReferenceNo(row);
      // Real references are SR + a type letter(s) + digits, e.g. SRI67000109
      // (Installation), SRB67000105 (Biometric) — not bare "SR" + digits.
      if (/^SR[A-Za-z]*\d+/.test(ref)) return ref;
    }
    return null;
  }

  async getRowReferenceNo(row: Locator): Promise<string> {
    const byHeader = await this.cellTextByHeader(row, "Reference No.");
    if (/^SR[A-Za-z]*\d+$/.test(byHeader)) return byHeader;

    const byOffset = await this.cellTextByBaseCol(row, SoftwareInstallationListingPage.COL.referenceNo);
    if (/^SR[A-Za-z]*\d+$/.test(byOffset)) return byOffset;

    // Last resort: scan the row for a reference-like token.
    const cells = row.locator("td");
    const n = await cells.count();
    for (let i = 0; i < n; i++) {
      const text = ((await cells.nth(i).textContent()) ?? "").trim().replace(/\s+/g, " ");
      if (/^SR[A-Za-z]*\d+$/.test(text)) return text;
    }
    return "";
  }

  async getRowCompanyName(row: Locator): Promise<string> {
    const byHeader = await this.cellTextByHeader(row, "Company Name");
    if (byHeader) return byHeader;
    return this.cellTextByBaseCol(row, SoftwareInstallationListingPage.COL.companyName);
  }

  async getRowInstallationStatus(row: Locator): Promise<string> {
    const byHeader = await this.cellTextByHeader(row, "Installation Status");
    if (byHeader) return byHeader;
    return this.cellTextByBaseCol(row, SoftwareInstallationListingPage.COL.installationStatus);
  }

  async getRowPaymentStatus(row: Locator): Promise<string> {
    const byHeader = await this.cellTextByHeader(row, "Payment Status");
    if (byHeader) return byHeader;
    return this.cellTextByBaseCol(row, SoftwareInstallationListingPage.COL.paymentStatus);
  }

  async getRowInstallationRequest(row: Locator): Promise<string> {
    const byHeader = await this.cellTextByHeader(row, "Installation Request");
    if (byHeader) return byHeader;
    return this.cellTextByBaseCol(row, SoftwareInstallationListingPage.COL.installationRequest);
  }

  async getRowRemarks(row: Locator): Promise<string> {
    const byHeader = await this.cellTextByHeader(row, "Remarks");
    if (byHeader) return byHeader;
    return this.cellTextByBaseCol(row, SoftwareInstallationListingPage.COL.remarks);
  }

  /** The View link's detail URL for a row (detail.do?txnId=X&apptId=Y). */
  async getRowDetailHref(row: Locator): Promise<string | null> {
    return await row.locator('a[href*="detail.do"]').first().getAttribute("href");
  }

  /** Click "View" → BO Software Installation Details Page. */
  async clickView(row: Locator) {
    // The View link opens target="_blank" — a real new tab. Page objects in
    // this suite hold a single fixed `page` reference (constructed once and
    // reused, e.g. `new SoftwareInstallationDetailsPage(boPage)`), so a click
    // that opens a *different* tab leaves `this.page` stuck on the listing
    // forever, and every subsequent Details-page action times out waiting on
    // an element that's actually on the other tab. Strip the target so the
    // navigation happens in this same page instead.
    const link = row.locator('a[href*="detail.do"]').first();
    await link.evaluate((el) => el.removeAttribute("target"));
    // waitForNav()'s networkidle can resolve before the details page has
    // actually replaced the listing DOM (same premature-resolution pattern
    // as searchWithFilters()) — wait for the URL to actually reach
    // detail.do rather than trusting network idleness alone.
    await Promise.all([
      this.page.waitForURL(/detail\.do/, { timeout: 15000 }).catch(() => null),
      link.click(),
    ]);
    await this.waitForNav();
  }

  /**
   * Click "Cancel" (a[onclick*="scCancel"]) and confirm the "Sure to cancel?"
   * popup (#sc-cancel-dialog, opened as a jQuery UI dialog).
   */
  async cancelRequest(row: Locator, confirm: boolean = true) {
    await test.step('Cancel the request (confirm "Sure to cancel?")', async () => {
      await row.locator('a[onclick*="scCancel"]').first().click();
      const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#sc-cancel-dialog") });
      await dialog.waitFor({ state: "visible", timeout: 8000 });
      const label = confirm ? /yes|ok|confirm/i : /no|cancel/i;
      const btn = dialog.locator(".ui-dialog-buttonpane button").filter({ hasText: label }).first();
      if (await btn.count()) {
        await btn.click();
      } else {
        // Fallback: first button is typically the affirmative action.
        await dialog.locator(".ui-dialog-buttonpane button").first().click();
      }
      await this.waitForNav();
    });
  }

  /**
   * SRD 2.3.2.5 #3 — expected export filename for a given date.
   * Format: Biometric_Device_Installation_List_YYYYMMDD.xlsx
   */
  static expectedExportFilename(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `Biometric_Device_Installation_List_${y}${m}${d}.xlsx`;
  }

  /** Click Export (visible only after a search) and return the filename. */
  async exportAndGetFilename(): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.exportBtn.click(),
    ]);
    return download.suggestedFilename();
  }
}
