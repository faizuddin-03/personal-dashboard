import { Page } from '@playwright/test';
import { CONFIG } from '../data/config';

export interface JpjXmlLogRow {
  vehicleNo: string;
  transactionNo: string;
  type: string;
  submittedAt: string;
  requestData: string;
  respondedAt: string;
  responseData: string;
}

// ── BO "JPJ XML Log" — search + results (EAINT-9306) ────────────────
// Shared search form (Vehicle No. / Transaction Ref No. radio, #to-search)
// and results table shape for BOTH JPJ XML Log pages relevant to this
// ticket: Deregistration (`/view/dereg/jpj/log`) and eDereg Pre-Checking
// (`/view/dereg/precheck/jpj/log/main.do`) — confirmed from
// `EAINT-9306-bo-jpj-xml-log-dereg.html` and
// `EAINT-9306-bo-jpj-xml-log-precheck.html` (pasted by Faizuddin,
// 2026-08-24). Requires a BO login (BoLoginPage) first — this is a
// Back-Office page, a completely separate login from the AATF account this
// suite otherwise uses. NEVER exercised live via automation.
//
// The two pages' results tables differ by ONE column: eDereg Pre-Checking's
// has an extra "Search By" column (who ran the search) between Transaction
// No. and Type that the Deregistration log doesn't have. Detected by cell
// count (9 vs 8) rather than hardcoded per `basePath`, so this stays one
// shared reader instead of two near-duplicate classes.
export class JpjXmlLogPage {
  constructor(private readonly page: Page, private readonly basePath: string) {}

  async open(envSegment: string): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrlFor(envSegment)}${this.basePath}`);
    // Settle before any input — per knowledge/automation-playbook.md "Page-load
    // timing." Faizuddin observed live 2026-09-02 that typing a vehicle no. on
    // this eDereg Pre-Checking log page can switch the page into "DEREG
    // Transaction Enquiry" instead — a plausible symptom of acting before this
    // page's own client-side setup (which log type it's showing) has settled.
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  async searchByVehicleNo(vehicleNo: string): Promise<JpjXmlLogRow[]> {
    await this.page.locator('#type[value="vehicleNo"]').check();
    await this.page.locator('#vehicleNo').fill(vehicleNo);
    await this.page.locator('#to-search').click();
    return this.readRows();
  }

  async searchByRefNo(refNo: string): Promise<JpjXmlLogRow[]> {
    await this.page.locator('#type[value="refNo"]').check();
    await this.page.locator('#refNo').fill(refNo);
    await this.page.locator('#to-search').click();
    return this.readRows();
  }

  private async readRows(): Promise<JpjXmlLogRow[]> {
    await this.page.waitForLoadState('domcontentloaded');
    // #result renders "&nbsp;" (no table at all) when a search finds
    // nothing, per both captured blank-form states — guard against that
    // rather than letting the row locator time out.
    const anyTable = await this.page.locator('#result table').count();
    if (anyTable === 0) return [];

    const rows = this.page.locator('#result table tbody tr:not(.header)');
    const count = await rows.count();
    const result: JpjXmlLogRow[] = [];
    for (let i = 0; i < count; i++) {
      const texts = (await rows.nth(i).locator('td').allTextContents()).map(t => t.trim());
      // 9 columns = eDereg Pre-Checking's extra "Search By" column at index 3.
      const offset = texts.length === 9 ? 1 : 0;
      result.push({
        vehicleNo: texts[1] ?? '',
        transactionNo: texts[2] ?? '',
        type: texts[3 + offset] ?? '',
        submittedAt: texts[4 + offset] ?? '',
        requestData: texts[5 + offset] ?? '',
        respondedAt: texts[6 + offset] ?? '',
        responseData: texts[7 + offset] ?? '',
      });
    }
    // The search result table is displaying right now — hold before the
    // next search navigates away, per Faizuddin 2026-08-24
    // (knowledge/flow-edereg.md §12). No PrecheckSession here (this class
    // is used from a separate BO context), so pause directly.
    await this.page.waitForTimeout(CONFIG.detailsPauseMs).catch(() => { /* ignore */ });
    return result;
  }
}
