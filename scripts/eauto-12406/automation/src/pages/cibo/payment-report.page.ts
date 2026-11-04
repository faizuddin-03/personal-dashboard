/**
 * CIBO — Payment Report (`/cibo/payment-report`): INSURED transactions only, with money [walk 28.10.2026;
 * team doc §8].
 * Filters: `platform`, `insuranceComp` (agency groups), Insurance Created `fromDate` / `toDate`, `state`,
 * `roadTax`, `discountCode`, `coverageType`, `search`.
 * After Search: "Summary Report for <from> - <till>" with the totals, then 24 columns (# · UCD company / PIC ·
 * UCD Name · Recipient Reference · State · Insurance Company · Reference No · System Ref No · Invoice / Receipt
 * No. · Invoice / Receipt Date · Vehicle No · eCertificate No · Payment Ref ID · Payment Mode · Payment To ·
 * money columns … · Commission Amount (RM)).
 * Trap: broad searches take ~2 minutes; narrow to one week of Insurance Created dates, or one insurer
 * (Allianz alone answered in ~3 s) [team doc §8, §10; walk].
 */

import type { Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { CiboPage, type CiboRow } from "./cibo.page";

export interface CiboPaymentReportFilter {
  platform?: string[];
  insuranceCompany?: string[];
  from?: Date;
  till?: Date;
  state?: string[];
  roadTax?: string[];
  discountCode?: string[];
  coverageType?: string[];
  text?: string;
}

export class CiboPaymentReportPage extends CiboPage {
  constructor(page: Page) {
    super(page);
  }

  @step("Search the CIBO Payment Report")
  async searchReport(f: CiboPaymentReportFilter = {}): Promise<{ summary: { period: string; text: string }; rows: CiboRow[] }> {
    await this.settle();
    if (f.platform) await this.pick("platform", f.platform);
    if (f.insuranceCompany) await this.pick("insuranceComp", f.insuranceCompany);
    if (f.till) await this.pickDate("toDate", f.till);
    if (f.from) await this.pickDate("fromDate", f.from);
    if (f.state) await this.pick("state", f.state);
    if (f.roadTax) await this.pick("roadTax", f.roadTax);
    if (f.discountCode) await this.pick("discountCode", f.discountCode);
    if (f.coverageType) await this.pick("coverageType", f.coverageType);
    if (f.text !== undefined) await this.searchText(f.text);
    const status = await this.search();
    if (await this.searchFailed(status)) throw new Error(`CIBO Payment Report search answered HTTP ${status}.`);
    return { summary: await this.summary(), rows: await this.readTable("Vehicle No") };
  }
}
