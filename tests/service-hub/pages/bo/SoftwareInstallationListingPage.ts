import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "../BasePage";
import { PATHS } from "../../utils/config";

export type InstallationStatus =
  | "ALL"
  | "NEW"
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

/**
 * eAuto Back Office Portal > Biometric Device Purchase & Software
 * Installation Listing (SRD 2.3.2.5).
 *
 * NOTE: BO selectors are inferred from the SRD structure and must be
 * verified against the actual BO portal HTML, then tightened.
 *
 * Listing columns (0-indexed) per SRD 2.3.2.5 #2:
 *   0 #  | 1 Reference No | 2 Date Requested | 3 Company Name |
 *   4 Company ROC | 5 Device | 6 Delivery Date | 7 Installation Request |
 *   8 Appointment Date | 9 Time Slot | 10 Payment Status |
 *   11 LHDN Response Status | 12 Delivery Status | 13 Installation Status |
 *   14 Date Completed | 15 Remarks | 16 Special Remarks | 17 Action
 */
export class SoftwareInstallationListingPage extends BasePage {
  static readonly COL = {
    num: 0,
    referenceNo: 1,
    dateRequested: 2,
    companyName: 3,
    companyRoc: 4,
    device: 5,
    deliveryDate: 6,
    installationRequest: 7,
    appointmentDate: 8,
    timeSlot: 9,
    paymentStatus: 10,
    lhdnResponseStatus: 11,
    deliveryStatus: 12,
    installationStatus: 13,
    dateCompleted: 14,
    remarks: 15,
    specialRemarks: 16,
    action: 17,
  } as const;

  // Filter panel (SRD 2.3.2.5 #1)
  readonly referenceNoInput = this.page.locator('input[name="referenceNo"]').first();
  readonly companyNameInput = this.page.locator('input[name="companyName"]').first();
  readonly dateRequestedFromInput = this.page.locator('input[name="dateRequestedFrom"]').first();
  readonly dateRequestedToInput = this.page.locator('input[name="dateRequestedTo"]').first();
  readonly companyRocInput = this.page.locator('input[name="companyRoc"]').first();
  readonly deliveryDateFromInput = this.page.locator('input[name="deliveryDateFrom"]').first();
  readonly deliveryDateToInput = this.page.locator('input[name="deliveryDateTo"]').first();
  readonly deliveryStatusSelect = this.page.locator('select[name="deliveryStatus"]').first();
  readonly appointmentDateFromInput = this.page.locator('input[name="appointmentDateFrom"]').first();
  readonly appointmentDateToInput = this.page.locator('input[name="appointmentDateTo"]').first();
  readonly installationStatusSelect = this.page.locator('select[name="installationStatus"]').first();
  readonly timeSlotMorningCheckbox = this.page.locator('input[type="checkbox"][value*="10"]').first();
  readonly timeSlotAfternoonCheckbox = this.page.locator('input[type="checkbox"][value*="2"]').first();
  readonly paymentStatusSelect = this.page.locator('select[name="paymentStatus"]').first();
  readonly lhdnResponseStatusSelect = this.page.locator('select[name="lhdnResponseStatus"]').first();

  readonly searchBtn = this.page.getByText("Search", { exact: false }).first();
  readonly exportBtn = this.page.getByText("Export", { exact: false }).first();
  readonly resetBtn = this.page.getByText("Reset", { exact: false }).first();
  readonly appointmentCalendarBtn = this.page.getByText("Appointment Calendar", { exact: false }).first();

  readonly resultsTable = this.page.locator("table").first();

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.boSoftwareInstallationListing);
  }

  async searchWithFilters(opts: {
    referenceNo?: string;
    companyName?: string;
    companyRoc?: string;
    dateRequestedFrom?: string;
    dateRequestedTo?: string;
    appointmentDateFrom?: string;
    appointmentDateTo?: string;
    installationStatus?: InstallationStatus;
    paymentStatus?: string;
    lhdnResponseStatus?: string;
  }) {
    if (opts.referenceNo) await this.referenceNoInput.fill(opts.referenceNo);
    if (opts.companyName) await this.companyNameInput.fill(opts.companyName);
    if (opts.companyRoc) await this.companyRocInput.fill(opts.companyRoc);
    if (opts.dateRequestedFrom) await this.dateRequestedFromInput.fill(opts.dateRequestedFrom);
    if (opts.dateRequestedTo) await this.dateRequestedToInput.fill(opts.dateRequestedTo);
    if (opts.appointmentDateFrom) await this.appointmentDateFromInput.fill(opts.appointmentDateFrom);
    if (opts.appointmentDateTo) await this.appointmentDateToInput.fill(opts.appointmentDateTo);
    if (opts.installationStatus) await this.installationStatusSelect.selectOption(opts.installationStatus);
    if (opts.paymentStatus) await this.paymentStatusSelect.selectOption(opts.paymentStatus);
    if (opts.lhdnResponseStatus) await this.lhdnResponseStatusSelect.selectOption(opts.lhdnResponseStatus);
    await this.searchBtn.click();
    await this.waitForNav();
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
    return await this.resultsTable.locator("tbody tr").all();
  }

  private async cellText(row: Locator, colIndex: number): Promise<string> {
    return (await row.locator("td").nth(colIndex).textContent())?.trim() ?? "";
  }

  async getRowReferenceNo(row: Locator): Promise<string> {
    return this.cellText(row, SoftwareInstallationListingPage.COL.referenceNo);
  }

  async getRowCompanyName(row: Locator): Promise<string> {
    return this.cellText(row, SoftwareInstallationListingPage.COL.companyName);
  }

  async getRowInstallationStatus(row: Locator): Promise<string> {
    return this.cellText(row, SoftwareInstallationListingPage.COL.installationStatus);
  }

  async getRowPaymentStatus(row: Locator): Promise<string> {
    return this.cellText(row, SoftwareInstallationListingPage.COL.paymentStatus);
  }

  async getRowRemarks(row: Locator): Promise<string> {
    return this.cellText(row, SoftwareInstallationListingPage.COL.remarks);
  }

  /** Click "View" on a row → BO Software Installation Details Page */
  async clickView(row: Locator) {
    await row.getByText("View", { exact: false }).click();
    await this.waitForNav();
  }

  /**
   * Click "Cancel" on a row and confirm the "Sure to cancel?" popup
   * (SRD 2.3.2.5 #2 action ii).
   */
  async cancelRequest(row: Locator, confirm: boolean = true) {
    await row.getByText("Cancel", { exact: false }).click();
    await this.waitForDialog();
    if (confirm) {
      await this.acceptConfirmDialog();
    } else {
      await this.dismissConfirmDialog();
    }
    await this.waitForNav();
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

  /** Click Export and return the resulting download's suggested filename. */
  async exportAndGetFilename(): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.exportBtn.click(),
    ]);
    return download.suggestedFilename();
  }
}
