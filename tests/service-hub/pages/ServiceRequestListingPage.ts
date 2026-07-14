import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PATHS } from "../utils/config";

export type ServiceType = "ALL" | "BIOMETRIC_PURCHASE" | "SOFTWARE_INSTALLATION" | "CHANGE_MAIN_USER";
export type TxStatus = "ALL" | "NEW" | "PENDING" | "APPROVED" | "COMPLETED" | "FAILED" | "CANCELLED";

/**
 * eAuto UCD Portal > Service Hub > Service Request Listing (SRD 2.3.2.2).
 *
 * Listing columns (0-indexed):
 *   0 #  | 1 Reference No | 2 Service Type | 3 Date Requested |
 *   4 Payment | 5 Tx Status | 6 e-Invoice Status | 7 Remarks | 8 Action
 */
export class ServiceRequestListingPage extends BasePage {
  // Column index map — kept as a single source of truth for the getters.
  static readonly COL = {
    num: 0,
    referenceNo: 1,
    serviceType: 2,
    dateRequested: 3,
    payment: 4,
    txStatus: 5,
    eInvoiceStatus: 6,
    remarks: 7,
    action: 8,
  } as const;

  // Filter panel (SRD 2.3.2.2 #1)
  readonly referenceNoInput = this.page.locator('input[name="referenceNo"], input[placeholder*="Reference"]').first();
  readonly serviceTypeSelect = this.page.locator('select[name="serviceType"]').first();
  readonly statusSelect = this.page.locator('select[name="status"]').first();
  readonly dateRequestedFromInput = this.page.locator('input[name="dateRequestedFrom"]').first();
  readonly dateRequestedToInput = this.page.locator('input[name="dateRequestedTo"]').first();
  readonly paymentDateFromInput = this.page.locator('input[name="paymentDateFrom"]').first();
  readonly paymentDateToInput = this.page.locator('input[name="paymentDateTo"]').first();
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
    dateRequestedFrom?: string;
    dateRequestedTo?: string;
    paymentDateFrom?: string;
    paymentDateTo?: string;
  }) {
    if (opts.referenceNo) await this.referenceNoInput.fill(opts.referenceNo);
    if (opts.serviceType) await this.serviceTypeSelect.selectOption(opts.serviceType);
    if (opts.status) await this.statusSelect.selectOption(opts.status);
    if (opts.dateRequestedFrom) await this.dateRequestedFromInput.fill(opts.dateRequestedFrom);
    if (opts.dateRequestedTo) await this.dateRequestedToInput.fill(opts.dateRequestedTo);
    if (opts.paymentDateFrom) await this.paymentDateFromInput.fill(opts.paymentDateFrom);
    if (opts.paymentDateTo) await this.paymentDateToInput.fill(opts.paymentDateTo);
    await this.searchBtn.click();
    await this.waitForNav();
  }

  async resetFilters() {
    await this.resetBtn.click();
    await this.waitForNav();
  }

  /**
   * Data rows only. The results table renders its header inside <tbody> as a
   * <th> row (no <td>), so `tbody tr:has(td)` skips it — otherwise per-cell
   * getters would wait out their timeout on a non-existent <td>.
   */
  async getResultRows(): Promise<Locator[]> {
    return await this.resultsTable.locator("tbody tr:has(td)").all();
  }

  private async cellText(row: Locator, colIndex: number): Promise<string> {
    const cell = row.locator("td").nth(colIndex);
    if ((await cell.count()) === 0) return ""; // row has no such cell — don't hang
    return (await cell.textContent())?.trim() ?? "";
  }

  async getRowReferenceNo(row: Locator): Promise<string> {
    return this.cellText(row, ServiceRequestListingPage.COL.referenceNo);
  }

  async getRowServiceType(row: Locator): Promise<string> {
    return this.cellText(row, ServiceRequestListingPage.COL.serviceType);
  }

  async getRowDateRequested(row: Locator): Promise<string> {
    return this.cellText(row, ServiceRequestListingPage.COL.dateRequested);
  }

  async getRowPayment(row: Locator): Promise<string> {
    return this.cellText(row, ServiceRequestListingPage.COL.payment);
  }

  /** Tx Status — "Pending" (blue) / "Completed" (green) etc. */
  async getRowStatus(row: Locator): Promise<string> {
    return this.cellText(row, ServiceRequestListingPage.COL.txStatus);
  }

  async getRowEInvoiceStatus(row: Locator): Promise<string> {
    return this.cellText(row, ServiceRequestListingPage.COL.eInvoiceStatus);
  }

  async getRowRemarks(row: Locator): Promise<string> {
    return this.cellText(row, ServiceRequestListingPage.COL.remarks);
  }

  /** Click "View" action on a row → Service Request Details Page */
  async clickView(row: Locator) {
    await row.getByText("View", { exact: false }).click();
    await this.waitForNav();
  }

  /** Click "Reschedule" action link on a row (a.sc-resubmit) */
  async clickReschedule(row: Locator) {
    await row.locator("a.sc-resubmit").click();
    await this.waitForNav();
  }

  /**
   * SRD 2.3.2.2 #3: "Reschedule" is shown only for Software Installation
   * requests whose Tx Status = "PENDING". A row qualifies when the action
   * link is present.
   */
  async hasRescheduleAction(row: Locator): Promise<boolean> {
    return (await row.locator("a.sc-resubmit").count()) > 0;
  }

  /**
   * Verify the SRD rule that Reschedule is only offered when Tx Status is
   * Pending — a row with a non-pending status must not expose the action.
   */
  async assertRescheduleOnlyWhenPending(row: Locator) {
    const status = (await this.getRowStatus(row)).toLowerCase();
    const hasReschedule = await this.hasRescheduleAction(row);
    if (!status.includes("pending")) {
      expect(hasReschedule).toBe(false);
    }
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
