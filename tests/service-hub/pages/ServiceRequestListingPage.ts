import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PATHS } from "../utils/config";

export type ServiceType = "ALL" | "BIOMETRIC_PURCHASE" | "SOFTWARE_INSTALLATION" | "CHANGE_MAIN_USER";
export type TxStatus = "ALL" | "NEW" | "PENDING" | "APPROVED" | "COMPLETED" | "FAILED" | "CANCELLED";

export class ServiceRequestListingPage extends BasePage {
  // Filter panel
  readonly referenceNoInput = this.page.locator('input[name="referenceNo"], input[placeholder*="Reference"]').first();
  readonly serviceTypeSelect = this.page.locator('select[name="serviceType"]').first();
  readonly statusSelect = this.page.locator('select[name="status"]').first();
  readonly dateFromInput = this.page.locator('input[name="dateRequestedFrom"]').first();
  readonly dateToInput = this.page.locator('input[name="dateRequestedTo"]').first();
  readonly searchBtn = this.page.getByText("Search Now", { exact: false });
  readonly resetBtn = this.page.getByText("Reset", { exact: false });

  // Results table
  readonly resultsTable = this.page.locator("table").first();

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.listing);
  }

  async searchByReferenceNo(refNo: string) {
    await this.referenceNoInput.fill(refNo);
    await this.searchBtn.click();
    await this.waitForNav();
  }

  async searchWithFilters(opts: {
    referenceNo?: string;
    serviceType?: ServiceType;
    status?: TxStatus;
    dateFrom?: string;
    dateTo?: string;
  }) {
    if (opts.referenceNo) await this.referenceNoInput.fill(opts.referenceNo);
    if (opts.serviceType) await this.serviceTypeSelect.selectOption(opts.serviceType);
    if (opts.status) await this.statusSelect.selectOption(opts.status);
    if (opts.dateFrom) await this.dateFromInput.fill(opts.dateFrom);
    if (opts.dateTo) await this.dateToInput.fill(opts.dateTo);
    await this.searchBtn.click();
    await this.waitForNav();
  }

  /** Get all result rows */
  async getResultRows(): Promise<Locator[]> {
    return await this.resultsTable.locator("tbody tr").all();
  }

  /** Get the status text from a specific row */
  async getRowStatus(row: Locator): Promise<string> {
    return (await row.locator("td").nth(5).textContent())?.trim() ?? "";
  }

  /** Get the remarks text from a specific row */
  async getRowRemarks(row: Locator): Promise<string> {
    return (await row.locator("td").nth(7).textContent())?.trim() ?? "";
  }

  /** Click "View" action on a row */
  async clickView(row: Locator) {
    await row.getByText("View", { exact: false }).click();
    await this.waitForNav();
  }

  /** Click "Reschedule" action on a row */
  async clickReschedule(row: Locator) {
    await row.getByText("Reschedule", { exact: false }).click();
    await this.waitForNav();
  }

  /** Check if "Reschedule" link exists on a row */
  async hasRescheduleAction(row: Locator): Promise<boolean> {
    return await row.getByText("Reschedule", { exact: false }).count() > 0;
  }

  /** Navigate to reschedule page for a specific txnId */
  async goToReschedule(txnId: string) {
    await this.goto(PATHS.reschedule(txnId));
  }

  /** Find first row matching a reference number */
  async findRowByRefNo(refNo: string): Promise<Locator | null> {
    const rows = await this.getResultRows();
    for (const row of rows) {
      const text = (await row.textContent()) ?? "";
      if (text.includes(refNo)) return row;
    }
    return null;
  }
}
