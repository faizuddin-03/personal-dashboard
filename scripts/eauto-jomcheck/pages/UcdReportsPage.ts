import { Page, Download } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { pickDatepickerDate } from '../utils/datepicker';

export interface PaymentDocumentWeek {
  index: number;
  period: string;
  start: Date;
  end: Date;
  totalTransactions: string;
  /** False for the current and future weeks — no Download link yet. */
  hasDownload: boolean;
}

const MON: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const parseDayMonYear = (s: string): Date => {
  const m = /(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{4})/.exec(s);
  if (!m) throw new Error(`Unrecognised period date "${s}".`);
  return new Date(Number(m[3]), MON[m[2].toLowerCase()], Number(m[1]));
};

/**
 * UCD top bar REPORTS (`/view/ucd/report/view.do`,
 * `_reference/html/eauto/ucd-reports-menu.html`) and the two reports 12412
 * checks:
 *   1. PAYMENT BREAKDOWN REPORT (`/view/ucd/report/e-statement`) — form
 *      `#summary-form`: readonly `#startDate` / `#endDate`, select
 *      `#transactionType` (JomCheck = "JCK"), `#download` = PDF
 *      (`_reference/html/eauto/ucd-payment-breakdown-report.html`). Dates
 *      start empty. The opened calendar is not captured yet, so its shape is
 *      handled both ways (utils/datepicker.ts). Sample PDF:
 *      `_reference/tickets/EAINT-12412/paymentbreakdownreport_example.pdf`.
 *   2. DOWNLOAD PAYMENT DOCUMENT (`/view/ucd/report/download-payment-document`,
 *      `_reference/html/eauto/ucd-download-payment-document.html`).
 */
export class UcdReportsPage extends BasePage {
  private reportsTab      = () => this.page.locator('#reports-link');
  private breakdownBtn    = () => this.page.getByRole('button', { name: 'PAYMENT BREAKDOWN REPORT' });
  private paymentDocBtn   = () => this.page.getByRole('button', { name: 'DOWNLOAD PAYMENT DOCUMENT' });

  // Payment Breakdown Report
  private startDate       = () => this.page.locator('#startDate');
  private endDate         = () => this.page.locator('#endDate');
  private typeSelect      = () => this.page.locator('select#transactionType');
  private downloadBtn     = () => this.page.locator('#download');

  // Download Payment Document
  private monthSelect     = () => this.page.locator('#search-form select#month');
  private yearSelect      = () => this.page.locator('#search-form select[name="year"]');
  private txnTrigger      = () => this.page.locator('#txn-dropdown-trigger');
  private txnPanel        = () => this.page.locator('#txn-dropdown-panel');
  private jomcheckBox     = () => this.page.locator('#txn-dropdown-panel input[name="transactionType"][value="JCK"]');
  // `has` is matched inside each label, so it takes a selector relative to the
  // label — the panel-scoped jomcheckBox() never matches there (TS11 timed out
  // on it, 2026-10-19).
  private jomcheckLabel   = () => this.page.locator('#txn-dropdown-panel label.txn-opt', { has: this.page.locator('input[value="JCK"]') });
  private generateBtn     = () => this.page.locator('#to-generate');
  private weekRows        = () => this.page.locator('#result table#data tr:not(.header)');

  constructor(page: Page) { super(page); }

  private async openReports(): Promise<void> {
    if (!(await this.reportsTab().count())) {
      await this.page.goto(`${CONFIG.baseUrl}${CONFIG.ucdHome}`, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
      await this.settleAfterLoad();
      await this.dismissBanners();
    }
    await this.demoHighlight(this.reportsTab());
    await this.reportsTab().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  async gotoPaymentBreakdown(): Promise<void> {
    await this.openReports();
    await this.demoHighlight(this.breakdownBtn());
    await this.breakdownBtn().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  /** Payment date from/to = `date`, Transaction Type JomCheck. Returns the range shown. */
  async setBreakdownFilter(date: Date): Promise<string> {
    await this.demoHighlight(this.startDate());
    const from = await pickDatepickerDate(this.page, this.startDate(), date);
    await this.demoHighlight(this.endDate());
    const to = await pickDatepickerDate(this.page, this.endDate(), date);
    await this.demoHighlight(this.typeSelect());
    await this.typeSelect().selectOption('JCK');
    await this.demoPause();
    return `${from} to ${to}`;
  }

  breakdownDownloadButton() { return this.downloadBtn(); }

  async gotoPaymentDocument(): Promise<void> {
    await this.openReports();
    await this.demoHighlight(this.paymentDocBtn());
    await this.paymentDocBtn().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  /** Payment Month / Year of `date`, Transaction Type JomCheck, Generate. */
  async generatePaymentDocuments(date: Date): Promise<void> {
    await this.demoHighlight(this.monthSelect());
    await this.monthSelect().selectOption(String(date.getMonth() + 1).padStart(2, '0'));
    await this.demoHighlight(this.yearSelect());
    await this.yearSelect().selectOption(String(date.getFullYear()));

    if (!(await this.txnPanel().isVisible())) {
      await this.demoHighlight(this.txnTrigger());
      await this.txnTrigger().click();
    }
    if (!(await this.jomcheckBox().isChecked())) {
      await this.demoHighlight(this.jomcheckLabel());
      await this.jomcheckLabel().click();
    }
    await this.demoHighlight(this.jomcheckLabel(), { color: 'green' });
    // Close the panel the way a person does — click the trigger again.
    if (await this.txnPanel().isVisible()) await this.txnTrigger().click();

    await this.demoPause();
    await this.demoHighlight(this.generateBtn());
    await this.generateBtn().click();
    await this.page.locator('#result table#data').waitFor({ state: 'visible', timeout: CONFIG.navigationTimeout });
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  async readWeeks(): Promise<PaymentDocumentWeek[]> {
    const out: PaymentDocumentWeek[] = [];
    const n = await this.weekRows().count();
    for (let i = 0; i < n; i++) {
      const row = this.weekRows().nth(i);
      const c = (await row.locator('td').allInnerTexts()).map(t => t.trim());
      if (c.length < 3) continue;
      const [a, b] = c[0].split(/\s+-\s+/);
      out.push({
        index: i, period: c[0], start: parseDayMonYear(a), end: parseDayMonYear(b ?? a),
        totalTransactions: c[1], hasDownload: (await row.locator('a', { hasText: 'Download' }).count()) > 0,
      });
    }
    return out;
  }

  async highlightWeek(index: number): Promise<void> {
    await this.demoHighlight(this.weekRows().nth(index), { color: 'green' });
  }

  async downloadWeek(index: number): Promise<Download> {
    const link = this.weekRows().nth(index).locator('a', { hasText: 'Download' });
    await this.demoHighlight(link);
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 5 * 60_000 }),
      link.click(),
    ]);
    return download;
  }
}
