import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "../BasePage";
import { PATHS } from "../../utils/config";

export type FailedReason = "Reappointment" | "Laptop/PC Issues" | "Other";

/**
 * eAuto Back Office Portal > Software Installation Details Page
 * (SRD 2.3.2.6).
 *
 * NOTE: BO selectors are inferred from the SRD structure and must be
 * verified against the actual BO portal HTML, then tightened.
 */
export class SoftwareInstallationDetailsPage extends BasePage {
  // 1. Page header
  readonly backBtn = this.page.getByText("Back", { exact: false }).first();
  readonly serviceRequestNo = this.page.locator("text=/Service Request #/i").first();
  readonly installationFailedBtn = this.page.getByText("Installation Failed", { exact: false }).first();
  readonly installationCompletedBtn = this.page.getByText("Installation Completed", { exact: false }).first();

  // 2. Request Details
  readonly invoiceBtn = this.page.getByRole("button", { name: /^Invoice$/i }).first();
  readonly eInvoiceBtn = this.page.getByRole("button", { name: /e-?Invoice/i }).first();

  // 3. Appointment Details
  readonly appointmentStatus = this.page.locator("[class*='appt-status'], .appointment-status").first();

  // 5. Special Remark
  readonly specialRemarkInput = this.page.locator('textarea[name="specialRemark"], textarea[placeholder*="Remark"]').first();
  readonly updateSpecialRemarkBtn = this.page.getByText("Update Special Remark", { exact: false }).first();

  constructor(page: Page) {
    super(page);
  }

  async navigate(txnId: string) {
    await this.goto(PATHS.boSoftwareInstallationDetails(txnId));
  }

  async goBack() {
    await this.backBtn.click();
    await this.waitForNav();
  }

  async getAppointmentStatus(): Promise<string> {
    return (await this.appointmentStatus.textContent())?.trim() ?? "";
  }

  /** SRD 2.3.2.6 #5 — enter and save a special remark. */
  async updateSpecialRemark(remark: string) {
    await this.specialRemarkInput.fill(remark);
    await this.updateSpecialRemarkBtn.click();
    await this.waitForNav();
  }

  /**
   * SRD 2.3.2.6 #6 — Mark Completed:
   *   "Installation Completed »" → popup
   *   "Are you sure want to mark the installation appointment as completed?"
   *   [No] [Yes]  → Appointment Status = "Completed".
   */
  async markCompleted(confirm: boolean = true) {
    await this.installationCompletedBtn.click();
    await this.waitForDialog();
    if (confirm) {
      await this.acceptConfirmDialog();
    } else {
      await this.dismissConfirmDialog();
    }
    await this.waitForNav();
  }

  /**
   * SRD 2.3.2.6 #7 — Mark Failed:
   *   "Installation Failed »" → popup
   *   "Please select the reason causing the installation failed:"
   *   radio: Reappointment / Laptop/PC Issues / Other
   *   (Other → free-text box) → [No] [Yes] → Appointment Status = "Failed".
   */
  async markFailed(reason: FailedReason, otherText?: string, confirm: boolean = true) {
    await this.installationFailedBtn.click();
    await this.waitForDialog();

    // Select the reason radio by its visible label.
    await this.page.getByText(reason, { exact: false }).first().click();
    if (reason === "Other" && otherText) {
      await this.page
        .locator('.ui-dialog textarea, .ui-dialog input[type="text"]')
        .first()
        .fill(otherText);
    }

    if (confirm) {
      await this.acceptConfirmDialog();
    } else {
      await this.dismissConfirmDialog();
    }
    await this.waitForNav();
  }

  async isCompleted(): Promise<boolean> {
    return (await this.getAppointmentStatus()).toLowerCase().includes("complete");
  }

  async isFailed(): Promise<boolean> {
    return (await this.getAppointmentStatus()).toLowerCase().includes("fail");
  }
}
