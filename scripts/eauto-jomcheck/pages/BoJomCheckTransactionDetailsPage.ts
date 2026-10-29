import { Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import pdfParse from 'pdf-parse';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { downloadPdfViaButton, PdfDownload, InvoiceLayout } from '../utils/invoicePdf';

/**
 * BackOffice JomCheck Transaction Details —
 * `/view/jomcheck/enquiry/view.do?id=<id>&back=false`, reached via
 * `BoJomCheckTransactionEnquiryPage.openResult()`. See
 * `_reference/html/eauto/bo-jomcheck-transaction-details.html`: Invoice /
 * e-Invoice / Report buttons (`#to-print-invoice`/`#to-print-e-invoice`/
 * `#to-print-report`), status banner, payment details, Special Remark.
 */
export class BoJomCheckTransactionDetailsPage extends BasePage {
  private statusLabel = () => this.page.locator('.approved, [class*="status"]').first();
  private invoiceBtn  = () => this.page.locator('#to-print-invoice').first();
  private eInvoiceBtn = () => this.page.locator('#to-print-e-invoice').first();
  private reportBtn   = () => this.page.locator('#to-print-report').first();

  constructor(page: Page) { super(page); }

  // e-Invoice is IGNORED for now (Faizuddin, 2026-10-01: "it will take a couple
  // minutes until it is approved, so for all TS, ignore the e-invoice button for
  // now"). The button only appears once the e-Invoice is approved, minutes after
  // payment — TS04 failed on it in the 2026-10-01 bulk run. Put it back here
  // when it should be checked again.
  async areActionButtonsVisible(): Promise<boolean> {
    return (
      (await this.invoiceBtn().isVisible()) &&
      (await this.reportBtn().isVisible())
    );
  }

  /** REPORT button present — false on a failed transaction (no report was
   *  generated). Used by the TS31 "existing failed transaction" variant,
   *  which checks the failed row from BackOffice because its UCD company's
   *  login is not available (Faizuddin, 2026-10-05). */
  async isReportButtonVisible(): Promise<boolean> {
    return this.reportBtn().isVisible().catch(() => false);
  }

  /** Clicks "REPORT" and waits for the actual download event. */
  async downloadReport() {
    await this.demoHighlight(this.reportBtn());
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.reportBtn().click(),
    ]);
    return download;
  }

  /**
   * Same `pdf-parse` crosscheck pattern as
   * `UcdJomCheckPurchasePage.downloadReportAsText()` — see
   * knowledge/flow-jomcheck.md §7d and
   * .claude/skills/eauto-automation-scaffold/SKILL.md for why this exists
   * (TS02/TS36's "crosscheck the Report PDF against the listing"). ALSO
   * persists the PDF as evidence (`PW_EVIDENCE_DIR`) rather than discarding
   * it — Faizuddin, 2026-10-03: "for all JomCheck API ts, make sure it
   * downloads and save the report... the download from JomCheck is
   * limited." `label` should be unique per scenario+vehicle so it doesn't
   * collide with another scenario's saved report in the same run.
   */
  async downloadReportAsText(label: string): Promise<string> {
    const download = await this.downloadReport();
    const evidenceDir = process.env.PW_EVIDENCE_DIR;
    const ext = path.extname(download.suggestedFilename()) || '.pdf';
    const persisted = !!evidenceDir;
    const filePath = persisted
      ? path.join(evidenceDir!, `${label.replace(/[^\w.-]+/g, '_')}${ext}`)
      : path.join(os.tmpdir(), `jomcheck-bo-report-${Date.now()}${ext}`);
    if (persisted) fs.mkdirSync(evidenceDir!, { recursive: true });
    await download.saveAs(filePath);
    try {
      const buf = fs.readFileSync(filePath);
      const data = await pdfParse(buf);
      return data.text.replace(/\s+/g, ' ').trim().toUpperCase();
    } finally {
      if (!persisted) fs.rmSync(filePath, { force: true });
    }
  }
  // ── EAINT-12412: invoice / e-Invoice split into 2 line items ──────────

  /** The status word in the title row — `<td class="title1">…</td><td><span
   *  class="approved">Approved</span></td>` in the capture. Read from the
   *  cell, not the class, so a Failed transaction (class never captured)
   *  still reads. */
  private statusCell = () => this.page.locator('td.title1').first().locator('xpath=following-sibling::td[1]');

  async getStatusText(): Promise<string> {
    await this.demoHighlight(this.statusCell(), { color: 'green' });
    return (await this.statusCell().innerText()).replace(/\s+/g, ' ').trim();
  }

  async downloadInvoiceAsText(label: string, layout: InvoiceLayout = 'two-line'): Promise<PdfDownload> {
    await this.demoHighlight(this.invoiceBtn());
    return downloadPdfViaButton(this.page, this.invoiceBtn(), label, layout);
  }

  async downloadEInvoiceAsText(label: string, layout: InvoiceLayout = 'two-line'): Promise<PdfDownload> {
    await this.demoHighlight(this.eInvoiceBtn());
    return downloadPdfViaButton(this.page, this.eInvoiceBtn(), label, layout);
  }

  async isEInvoiceButtonVisible(): Promise<boolean> {
    return this.eInvoiceBtn().isVisible().catch(() => false);
  }

  /** Same reload-until-visible wait as the UCD page — see
   *  UcdJomCheckTransactionDetailsPage.waitForEInvoiceButton(). */
  async waitForEInvoiceButton(): Promise<boolean> {
    const deadline = Date.now() + CONFIG.eInvoiceApprovalTimeout;
    while (Date.now() < deadline) {
      if (await this.isEInvoiceButtonVisible()) return true;
      await this.page.waitForTimeout(CONFIG.eInvoicePollInterval);
      await this.page.reload({ waitUntil: 'load', timeout: CONFIG.navigationTimeout });
      await this.settleAfterLoad();
      await this.dismissBanners();
    }
    return false;
  }

  /** "LHDN Response Status:" — `<td><b>LHDN Response Status:</b></td><td>…</td>`
   *  (`_reference/html/eauto/bo-jomcheck-transaction-details.html` line 35). */
  async getLhdnResponseStatus(): Promise<string> {
    const value = this.page.locator('td:has-text("LHDN Response Status")').first().locator('xpath=following-sibling::td[1]');
    if (!(await value.count())) return '';
    await this.demoHighlight(value, { color: 'green' });
    return (await value.innerText()).replace(/\s+/g, ' ').trim();
  }

  // The JomCheck "Resubmit" is NOT on this page — it is on the Transaction
  // Enquiry listing (Faizuddin, 2026-10-15). See
  // BoJomCheckTransactionEnquiryPage.resubmitRow().
}
