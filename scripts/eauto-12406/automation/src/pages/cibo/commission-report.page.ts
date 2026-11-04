/**
 * CIBO — Commission Report (`/cibo/commission-report`) [walk 28.10.2026].
 * Filters: `platform` (only eAuto and Secarang here), `insuranceComp` (agency groups), Insurance Created
 * `fromDate` / `toDate`, `roadTax`, `search`.
 * After Search: "Summary Report for <from> - <till>", then # · Vehicle No. · Reference No. · Company Name / PIC ·
 * Insurance Company (insurer + agency badge) · Insurance Creation Date · e-Certificate No. · Gross (RM) ·
 * Service Tax · Stamp Duty · Total Premium · Road Tax · Processing/Delivery Fee · Discount (+ code) ·
 * Total Amount · Commission (RM).
 * Seen, not a rule: each row's commission = Gross × the Commission % of its discount code, and the report
 * seems to list only rows with a code [unconfirmed] (knowledge/portals/cibo/portal.md).
 */

import type { Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { CiboPage, type CiboRow } from "./cibo.page";

export interface CiboCommissionFilter {
  platform?: string[];
  insuranceCompany?: string[];
  from?: Date;
  till?: Date;
  roadTax?: string[];
  text?: string;
}

export class CiboCommissionReportPage extends CiboPage {
  constructor(page: Page) {
    super(page);
  }

  @step("Search the CIBO Commission Report")
  async searchReport(f: CiboCommissionFilter = {}): Promise<{ summary: { period: string; text: string }; rows: CiboRow[] }> {
    await this.settle();
    if (f.platform) await this.pick("platform", f.platform);
    if (f.insuranceCompany) await this.pick("insuranceComp", f.insuranceCompany);
    if (f.till) await this.pickDate("toDate", f.till);
    if (f.from) await this.pickDate("fromDate", f.from);
    if (f.roadTax) await this.pick("roadTax", f.roadTax);
    if (f.text !== undefined) await this.searchText(f.text);
    const status = await this.search();
    if (await this.searchFailed(status)) throw new Error(`CIBO Commission Report search answered HTTP ${status}.`);
    return { summary: await this.summary(), rows: await this.readTable("Vehicle No.") };
  }
}
