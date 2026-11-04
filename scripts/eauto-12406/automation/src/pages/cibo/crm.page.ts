/**
 * CIBO — CRM (`/cibo/crm`, "Customer Relationship Management (CRM)"): one record per insured ID No, with that
 * person's vehicles [walk 28.10.2026].
 * Filters: `ownershipType` (Company, Private), Latest Coverage Expires `fromDate` / `toDate`, `search`.
 * Columns: # · Insured (name link over ID) · Contact Details · Vehicle · Ownership Type · Latest Coverage
 * Period · Last Update. ~3,900 customers (195 pages); a search takes ~9 s.
 * Customer Details (`/cibo/crm/customer-details/i/<ID No>`, the IC is in the address): name, ID No, gender, then
 * one card per vehicle (plate, make, model, year … latest policy, email, mobile, address, Last Updated By).
 * A customer record links to NO insurer, transaction or payment.
 *
 * READ ONLY. Each vehicle card also has **Edit** (Save update), **Duplicate** (Save Update) and two **Send
 * quotation link** buttons that send an email / WhatsApp: none of them is ever pressed here.
 * The details page scrolls inside its own box (a full-page screenshot comes out blank: use viewport shots).
 * Everything on these pages is personal data.
 */

import { expect, type Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { CiboPage, clean, type CiboRow } from "./cibo.page";

export interface CiboCrmFilter {
  ownershipType?: ("Company" | "Private")[];
  from?: Date;
  till?: Date;
  /** Free text: name, ID No or plate (what the box matches has not been pinned down). */
  text?: string;
}

export class CiboCrmPage extends CiboPage {
  constructor(page: Page) {
    super(page);
  }

  @step("Search the CIBO CRM listing")
  async searchListing(f: CiboCrmFilter = {}): Promise<CiboRow[]> {
    await this.settle();
    if (f.ownershipType) await this.pick("ownershipType", f.ownershipType);
    if (f.till) await this.pickDate("toDate", f.till);
    if (f.from) await this.pickDate("fromDate", f.from);
    if (f.text !== undefined) await this.searchText(f.text);
    const status = await this.search();
    if (await this.searchFailed(status)) throw new Error(`CIBO CRM search answered HTTP ${status}.`);
    return this.readTable("Insured");
  }

  /** Open a row's Customer Details (its Insured link, `a[href*="customer-details"]`), 0-based among visible rows. */
  @step("Open CIBO CRM Customer Details")
  async openCustomer(index = 0): Promise<void> {
    const link = this.page.locator("table tbody tr a[href*='customer-details']").filter({ visible: true }).nth(index);
    await this.requireVisible(link, `CRM row ${index + 1} Insured link`);
    await link.click();
    await expect(this.page).toHaveURL(/\/crm\/customer-details\//, { timeout: 60_000 });
    await this.settle();
  }

  /**
   * Customer Details as read: the header text up to "VEHICLE & INSURANCE POLICY DETAILS", and how many vehicle
   * cards (counted by their Edit buttons, which are only counted, never pressed). Reads only.
   */
  @step("Read CIBO CRM Customer Details")
  async readCustomer(): Promise<{ header: string; vehicleCards: number }> {
    await this.page.getByText(/VEHICLE & INSURANCE POLICY DETAILS/i).first().waitFor({ timeout: 60_000 });
    const body = await this.page.locator("body").innerText();
    const k = body.search(/VEHICLE & INSURANCE POLICY DETAILS/i);
    const header = clean(body.slice(Math.max(0, body.lastIndexOf("Full Name", k)), k));
    const vehicleCards = await this.page.getByRole("button", { name: /^\s*Edit\s*$/ }).count();
    return { header, vehicleCards };
  }
}
