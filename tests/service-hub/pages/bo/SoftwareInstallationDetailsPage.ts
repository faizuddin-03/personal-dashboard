import { type Page, type Locator, expect, test } from "@playwright/test";
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
  // 1. Page header — verified against the real BO Details HTML:
  //   "Installation Failed »"    → button.btn-fail    (onclick opFailOpen())
  //   "Installation Completed »" → button.btn-success (onclick opSuccess())
  readonly backBtn = this.page.getByText("Back", { exact: false }).first();
  readonly serviceRequestNo = this.page.locator("text=/Service Request #/i").first();
  readonly installationFailedBtn = this.page.locator(".btn-fail").first();
  readonly installationCompletedBtn = this.page.locator(".btn-success").first();

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

  async navigate(txnId: string, apptId: string) {
    await this.goto(PATHS.boSoftwareInstallationDetails(txnId, apptId));
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
    await test.step("Mark installation Completed", async () => {
      await this.installationCompletedBtn.click();
      await this.clickDialogButton("Installation Completed", confirm ? "Yes" : "No");
      await this.waitForNav();
    });
  }

  /**
   * Click a Yes/No button in a jQuery UI dialog identified by its title.
   * The Details-page popups render their buttons as plain
   * .ui-dialog-buttonpane <button> ("Yes"/"No") — they do NOT get the
   * .confirm-dialog-btn / .cancel-dialog-btn classes that the UCD dialogs
   * use, so acceptConfirmDialog()/dismissConfirmDialog() don't apply here.
   */
  private async clickDialogButton(titleText: string, label: "Yes" | "No") {
    const dialog = this.page.locator(".ui-dialog", {
      has: this.page.locator(".ui-dialog-title", { hasText: titleText }),
    });
    await dialog.waitFor({ state: "visible", timeout: 8000 });
    await dialog.locator(".ui-dialog-buttonpane button", { hasText: new RegExp(`^${label}$`) }).first().click();
  }

  /**
   * SRD 2.3.2.6 #7 — Mark Failed:
   *   "Installation Failed »" → popup
   *   "Please select the reason causing the installation failed:"
   *   radio: Reappointment / Laptop/PC Issues / Other
   *   (Other → free-text box) → [No] [Yes] → Appointment Status = "Failed".
   */
  async markFailed(reason: FailedReason, otherText?: string, confirm: boolean = true) {
    await test.step(`Mark installation Failed — reason: ${reason}`, () =>
      this.markFailedImpl(reason, otherText, confirm));
  }

  private async markFailedImpl(reason: FailedReason, otherText?: string, confirm: boolean = true) {
    await this.installationFailedBtn.click();
    const dialog = this.page.locator(".ui-dialog", {
      has: this.page.locator(".ui-dialog-title", { hasText: "Installation Failed" }),
    });
    await dialog.waitFor({ state: "visible", timeout: 8000 });

    // Reason radio: input[name="op-fail-reason"] with values Reappointment /
    // LaptopIssue / Other (note the value differs from the visible label).
    const reasonValue = reason === "Laptop/PC Issues" ? "LaptopIssue" : reason;
    await dialog.locator(`input[name="op-fail-reason"][value="${reasonValue}"]`).check();
    if (reason === "Other" && otherText) {
      await dialog.locator('textarea, input[type="text"]').first().fill(otherText);
    }

    await dialog.locator(".ui-dialog-buttonpane button", { hasText: new RegExp(`^${confirm ? "Yes" : "No"}$`) }).first().click();
    await this.waitForNav();
  }

  async isCompleted(): Promise<boolean> {
    return (await this.getAppointmentStatus()).toLowerCase().includes("complete");
  }

  async isFailed(): Promise<boolean> {
    return (await this.getAppointmentStatus()).toLowerCase().includes("fail");
  }
}
