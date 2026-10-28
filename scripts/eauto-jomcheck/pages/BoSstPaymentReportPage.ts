import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { pickDatepickerDate } from '../utils/datepicker';

export interface SstRow {
  /** Column header (line breaks collapsed) → cell text. The two "SST (8%)"
   *  columns are keyed "SST (8%)" (eAuto) and "SST (8%) EZAUTO ASIA". */
  cells: Record<string, string>;
  index: number;
}

/**
 * BackOffice "SST Payment Report (JomCheck)" — `/view/jomcheck/sst-payment-report`
 * (`_reference/html/eauto/bo-sst-payment-report-jomcheck-generated.html`).
 * Reached from BO home's Reports column. The report renders into
 * `#report-content` only after "Generate »" (`#generate-summary`).
 * Every row also has "Cancel »" (Cancel Invoice) — never clicked here.
 */
export class BoSstPaymentReportPage extends BasePage {
  private menuLink      = () => this.page.locator('a[href$="/view/jomcheck/sst-payment-report"]').first();
  private fromDate      = () => this.page.locator('#summary-form input[name="fromDate"]');
  private toDate        = () => this.page.locator('#summary-form input[name="toDate"]');
  private txNoInput     = () => this.page.locator('#summary-form input[name="transactionRefNo"]');
  private jomcheckBox   = () => this.page.locator('#summary-form input[name="transactionType"][value="JCK"]');
  private generateBtn   = () => this.page.locator('#generate-summary');
  private reportTable   = () => this.page.locator('#report-content table.report-body');

  constructor(page: Page) { super(page); }

  /** Opens the report from BO home. Returns false when this login has no
   *  link to it (finance-only page). */
  async goto(): Promise<boolean> {
    if (!(await this.menuLink().count())) {
      await this.page.goto(`${CONFIG.baseUrl}${CONFIG.boHome}`, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
      await this.settleAfterLoad();
      await this.dismissBanners();
    }
    if (!(await this.menuLink().count())) return false;
    await this.demoHighlight(this.menuLink());
    await this.menuLink().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    return true;
  }

  /** Created Date from/to = `date`, Transaction No = `txNo`, JomCheck ticked, Generate. */
  async generateFor(date: Date, txNo: string): Promise<string> {
    await this.demoHighlight(this.fromDate());
    const from = await pickDatepickerDate(this.page, this.fromDate(), date);
    await this.demoHighlight(this.toDate());
    const to = await pickDatepickerDate(this.page, this.toDate(), date);
    await this.demoHighlight(this.txNoInput());
    await this.txNoInput().fill(txNo);
    if (!(await this.jomcheckBox().isChecked())) {
      await this.demoHighlight(this.jomcheckBox());
      await this.jomcheckBox().check();
    }
    await this.demoPause();
    await this.demoHighlight(this.generateBtn());
    await this.generateBtn().click();
    await this.reportTable().waitFor({ state: 'visible', timeout: CONFIG.navigationTimeout });
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
    return `${from} to ${to}`;
  }

  private async headers(): Promise<string[]> {
    const raw = (await this.reportTable().locator('thead tr').first().locator('td').allInnerTexts())
      .map(t => t.replace(/\s+/g, ' ').trim());
    let sstSeen = 0;
    return raw.map(h => (/^SST \(8%\)$/i.test(h) && sstSeen++ > 0 ? 'SST (8%) EZAUTO ASIA' : h));
  }

  async readRows(): Promise<SstRow[]> {
    const heads = await this.headers();
    const rows = this.reportTable().locator('tbody tr');
    const out: SstRow[] = [];
    for (let i = 0; i < (await rows.count()); i++) {
      const texts = (await rows.nth(i).locator('td').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim());
      out.push({ index: i, cells: Object.fromEntries(heads.map((h, k) => [h, texts[k] ?? ''])) });
    }
    return out;
  }

  /** tfoot "Grand Total" amounts, keyed by the same headers as the rows. */
  async readGrandTotal(): Promise<Record<string, string>> {
    const heads = await this.headers();
    const cells = (await this.reportTable().locator('tfoot tr').first().locator('td').allInnerTexts()).map(t => t.trim());
    // First cell spans the 17 non-amount columns (colspan="17").
    const amountHeads = heads.slice(17, 17 + 7);
    return Object.fromEntries(amountHeads.map((h, k) => [h, cells[1 + k] ?? '']));
  }

  async highlightRow(index: number): Promise<void> {
    await this.demoHighlight(this.reportTable().locator('tbody tr').nth(index), { color: 'green' });
  }

  async captureReport(label: string): Promise<void> {
    await this.captureEvidence(label, this.reportTable());
  }
}
