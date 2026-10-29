import { type Page, expect, test } from "@playwright/test";
import { BasePage } from "../BasePage";
import { PATHS } from "../../utils/config";

/**
 * eAuto Back Office Portal > Account Management > Company Management.
 * Used by EAINT-12166 TS03's DO snapshot-rule test: edit a company's
 * address/phone AFTER a DO has been generated, then confirm a re-download
 * of the same DO still shows the original values (REQ-008).
 *
 * Selectors confirmed against real captures:
 *  - _reference/tickets/EAINT-12166/EAINT-12166-company-management-edit-details-uat1-2026-09-23.html
 */
export class CompanyManagementPage extends BasePage {
  // Search/listing page
  readonly nameFilterInput = this.page.locator('input[name="name"]#name');
  readonly searchBtn = this.page.locator("#to-search");
  readonly resultRows = this.page.locator("table tbody tr");

  // Edit page — Company Details block
  readonly companyNameInput = this.page.locator("input#name");
  readonly companyRegNoInput = this.page.locator("input#registrationCompany");
  readonly addressTextarea = this.page.locator("textarea#address");
  readonly postCodeInput = this.page.locator("input#postCode");
  readonly phoneInput = this.page.locator("input#phone");
  readonly updateBtn = this.page.locator("#to-update-company");

  constructor(page: Page) {
    super(page);
  }

  async navigateToListing() {
    await this.goto(PATHS.companyListing);
  }

  async navigateToEdit(companyAccountId: string) {
    await this.goto(PATHS.companyEdit(companyAccountId));
  }

  /** Search by company name on the listing page and open the first matching result's edit page. */
  async searchAndOpen(companyName: string) {
    await test.step(`Search Company Management for "${companyName}" and open it`, async () => {
      await this.navigateToListing();
      await this.nameFilterInput.fill(companyName);
      await this.demoHighlight(this.searchBtn);
      await this.searchBtn.click();
      await this.waitForNav();
      const link = this.page.locator(`a[href*="/view/account/company/edit.get"]`, { hasText: companyName }).first();
      await this.demoHighlight(link, { color: "green" });
      await link.click();
      await this.waitForNav();
      await this.demoPause();
    });
  }

  async getAddress(): Promise<string> {
    const value = (await this.addressTextarea.inputValue()).trim();
    await this.demoHighlight(this.addressTextarea, { color: "green" });
    await test.step(`Company Management: read Address = "${value}"`, async () => {});
    return value;
  }

  async getPhone(): Promise<string> {
    const value = (await this.phoneInput.inputValue()).trim();
    await this.demoHighlight(this.phoneInput, { color: "green" });
    await test.step(`Company Management: read Phone = "${value}"`, async () => {});
    return value;
  }

  async setAddress(address: string) {
    await test.step(`Company Management: set Address = "${address}"`, async () => {
      await this.addressTextarea.fill(address);
      await this.demoHighlight(this.addressTextarea);
    });
  }

  async setPhone(phone: string) {
    await test.step(`Company Management: set Phone = "${phone}"`, async () => {
      await this.phoneInput.fill(phone);
      await this.demoHighlight(this.phoneInput);
    });
  }

  /** Save via the toolbar's Update button (posts to /view/account/company/update.do). */
  async save() {
    await test.step("Save Company Details", async () => {
      await this.demoHighlight(this.updateBtn);
      await this.updateBtn.click();
      await this.waitForNav();
      await this.demoPause();
    });
  }
}
