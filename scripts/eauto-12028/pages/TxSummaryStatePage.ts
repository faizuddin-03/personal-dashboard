import { Page } from '@playwright/test';
import { AplBase } from './AplBase';
import { CONFIG } from '../data/config';
import { readTable, TableData } from '../utils/table';
import { pickDatepickerDate } from '../utils/datepicker';

// BackOffice Reports → Transaction Summary Report (State) — the cross-check
// source for 12028_TS33 / TS34 (dev QA guide REQ-004 P1).
// [unconfirmed] Only the menu link is captured (_reference/html/eauto/
// bo-home-hub-admin-eauto-account-2026-10-19.html line 68). The report page
// itself — its date fields, Search button, and how the STMS / eSTM / APT car
// and motorcycle counts are laid out per state — is NOT captured. This page
// object assumes the eAuto report convention (two readonly jQuery UI date
// fields, a [Search] button, one table with a state column) and reads the
// count columns by header words; it throws, listing the headers it saw, when
// the layout differs. Capture the page (blank and after Search) to settle it.
export class TxSummaryStatePage extends AplBase {
  // [unconfirmed] eAuto report convention: readonly jQuery UI date fields (class "hasDatepicker")
  dateFields = () => this.page.locator('input.hasDatepicker');
  // [unconfirmed] same "Search" button text as the other BO reports
  searchBtn = () => this.page.getByRole('button', { name: 'Search', exact: true });
  table = () => this.page.locator('table').filter({ hasText: /Johor/i }).first();

  constructor(page: Page) { super(page); }

  async searchMonth(year: number, monthIndex: number): Promise<TableData> {
    const fields = this.dateFields();
    if ((await fields.count()) < 2) throw new Error(`Transaction Summary Report (State): expected a From and a To date field, found ${await fields.count()} (page not captured yet).`);
    await pickDatepickerDate(this.page, fields.nth(0), new Date(year, monthIndex, 1));
    await pickDatepickerDate(this.page, fields.nth(1), new Date(year, monthIndex + 1, 0));
    const btn = this.searchBtn();
    if (!(await btn.count())) throw new Error('Transaction Summary Report (State): no [Search] button.');
    await this.demoHighlight(btn);
    await btn.click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.waitForWorkingDone();
    if (!(await this.waitForCondition(async () => (await this.table().count()) > 0))) throw new Error('Transaction Summary Report (State): no table with state rows after Search.');
    return readTable(this.table());
  }

  /**
   * Per state code, the sum of every column whose header names the vehicle
   * type and one of STMS / eSTM / APT (e.g. "STMS Car"). [unconfirmed] layout.
   */
  countsByState(data: TableData, vehicle: 'Car' | 'Motorcycle'): Map<string, number> {
    const want = vehicle === 'Car' ? /\bcar\b/i : /motor ?cycle|bike/i;
    const cols = data.headers.map((h, i) => ({ h, i })).filter(x => want.test(x.h) && /stms|estm|apt/i.test(x.h) && !/rm|amount/i.test(x.h));
    if (!cols.length) throw new Error(`Transaction Summary Report (State): no STMS / eSTM / APT ${vehicle} count columns. Headers: ${data.headers.map(h => `"${h}"`).join(', ')}`);
    const out = new Map<string, number>();
    for (const r of data.rows) {
      const code = /\((\d{2})\)/.exec(r.text)?.[1];
      if (!code) continue;
      let sum = 0;
      for (const c of cols) sum += Number((r.byCol[c.i]?.text ?? '0').replace(/,/g, '')) || 0;
      out.set(code, sum);
    }
    if (!out.size) throw new Error('Transaction Summary Report (State): no rows with a state code "(NN)".');
    return out;
  }
}
