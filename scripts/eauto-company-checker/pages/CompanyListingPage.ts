import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { CompanyRowInput, CompanyRowResult, ColumnStatus } from '../data/types';

// ── Manage Company Accounts — search page object ───────────
// See knowledge/flow-ucd-company-listing.md for the full DOM/decision-point
// writeup. The core rule this page object exists to enforce: the listing
// search is AND-only across every populated field, so ROC / New ROC / TIN
// must each be searched ALONE — never together — to get an independent
// presence signal per column.
export class CompanyListingPage extends BasePage {
  private rocInput    = () => this.page.locator('input[name="registrationCompany"]').first();
  private newRocInput = () => this.page.locator('input[name="newRegistrationCompany"]').first();
  private tinInput    = () => this.page.locator('input[name="tinNo"]').first();
  private searchBtn   = () => this.page.locator('#to-search').first();
  private resetLink   = () => this.page.locator('a.to-reset').first();
  private resultRows  = () => this.page.locator('#result table tbody tr');
  private resultTable = () => this.page.locator('#result table');

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto(`${CONFIG.baseUrl}${CONFIG.companyListingPath}`, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    await this.dismissBanners();
  }

  /** Clear every filter field via the page's own Reset control. */
  private async resetForm(): Promise<void> {
    if (await this.resetLink().count()) {
      await this.resetLink().click().catch(() => {});
      await this.page.waitForTimeout(300);
    }
    // Belt-and-suspenders: Reset is a client-side handler on this legacy
    // portal and isn't guaranteed to clear every field type — clear the three
    // inputs we actually use directly as well.
    for (const input of [this.rocInput(), this.newRocInput(), this.tinInput()]) {
      if (await input.count()) await input.fill('');
    }
  }

  /**
   * Search exactly one column, leaving the other two blank, and report
   * whether the listing returned any matching row.
   */
  async checkColumn(column: 'roc' | 'newRoc' | 'tin', value: string): Promise<ColumnStatus> {
    if (!value.trim()) return 'ABSENT'; // nothing to check — treat blank as not-in-use

    await this.resetForm();

    const input = column === 'roc' ? this.rocInput() : column === 'newRoc' ? this.newRocInput() : this.tinInput();
    await input.fill(value.trim());
    await this.searchBtn().click();

    const appeared = await this.waitForCondition(async () => (await this.resultTable().count()) > 0);
    if (!appeared) throw new Error(`Result table never appeared after searching ${column}="${value}"`);

    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
    const rowCount = await this.resultRows().count();
    return rowCount > 0 ? 'PRESENT' : 'ABSENT';
  }

  /** Check all three columns for one candidate row, independently. */
  async checkRow(row: CompanyRowInput): Promise<CompanyRowResult> {
    const rocStatus    = await this.checkColumn('roc', row.roc);
    const newRocStatus = await this.checkColumn('newRoc', row.newRoc);
    const tinStatus     = await this.checkColumn('tin', row.tin);

    const allAbsent = [rocStatus, newRocStatus, tinStatus].every(s => s === 'ABSENT');
    return {
      roc: row.roc, newRoc: row.newRoc, tin: row.tin,
      rocStatus, newRocStatus, tinStatus,
      overall: allAbsent ? 'PASS' : 'FAIL',
    };
  }
}
