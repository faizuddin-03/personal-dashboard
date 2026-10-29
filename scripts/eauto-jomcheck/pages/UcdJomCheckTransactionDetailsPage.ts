import { Page, Download } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import pdfParse from 'pdf-parse';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { downloadPdfViaButton, PdfDownload, InvoiceLayout } from '../utils/invoicePdf';

/**
 * UCD JomCheck Transaction Details — `/view/ucd/jomcheck/enquiry/view.do?id=<id>`,
 * reached via `UcdJomCheckTransactionListingPage.openResult()`. See
 * `_reference/html/eauto/ucd-jomcheck-transaction-details.html`: Invoice /
 * e-Invoice / Report action buttons, status banner, payment history.
 */
export class UcdJomCheckTransactionDetailsPage extends BasePage {
  private statusLabel = () => this.page.locator('.trx-details-status').first();
  private invoiceBtn  = () => this.page.locator('#to-print-invoice').first();
  private eInvoiceBtn = () => this.page.locator('#to-print-e-invoice').first();
  private reportBtn   = () => this.page.locator('#to-print-report').first();

  constructor(page: Page) { super(page); }

  async getStatus(): Promise<string> {
    await this.demoHighlight(this.statusLabel(), { color: 'green' });
    return (await this.statusLabel().innerText()).trim();
  }

  /** TS04: confirms the Invoice/e-Invoice/Report action buttons are all
   *  present — "no change to UCD screen layout". */
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

  /** TS31: a failed transaction has no report to download. */
  async isReportButtonVisible(): Promise<boolean> {
    return this.reportBtn().isVisible().catch(() => false);
  }

  /** Clicks "e-Invoice" and waits for the actual download event. */
  async downloadEInvoice(): Promise<Download> {
    await this.demoHighlight(this.eInvoiceBtn());
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.eInvoiceBtn().click(),
    ]);
    return download;
  }

  /**
   * TS05: clicks "Report" (downloads the PDF directly — see the capture's
   * header note) and returns the saved file plus its normalised text. Saved
   * under `PW_EVIDENCE_DIR` as `<label>.pdf` when set, else a temp file that
   * is deleted after parsing. Same pattern as
   * `UcdJomCheckPurchasePage.downloadReportAsText()`.
   */
  async downloadReportAsText(label: string): Promise<{ fileName: string; bytes: number; text: string }> {
    await this.demoHighlight(this.reportBtn());
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: CONFIG.navigationTimeout }),
      this.reportBtn().click(),
    ]);
    const evidenceDir = process.env.PW_EVIDENCE_DIR;
    const ext = path.extname(download.suggestedFilename()) || '.pdf';
    const persisted = !!evidenceDir;
    const filePath = persisted
      ? path.join(evidenceDir!, `${label.replace(/[^\w.-]+/g, '_')}${ext}`)
      : path.join(os.tmpdir(), `jomcheck-ucd-report-${Date.now()}${ext}`);
    if (persisted) fs.mkdirSync(evidenceDir!, { recursive: true });
    await download.saveAs(filePath);
    try {
      const buf = fs.readFileSync(filePath);
      const data = await pdfParse(buf);
      return {
        fileName: download.suggestedFilename(),
        bytes: buf.length,
        text: data.text.replace(/\s+/g, ' ').trim().toUpperCase(),
      };
    } finally {
      if (!persisted) fs.rmSync(filePath, { force: true });
    }
  }
  // ── EAINT-12412: invoice / e-Invoice split into 2 line items ──────────
  // Same buttons the capture already lists (#to-print-invoice,
  // #to-print-e-invoice). How each hands over its PDF (download vs new tab)
  // was never captured — utils/invoicePdf.ts handles both and reports which.

  /** Clicks "Invoice" and returns the saved PDF + its normalised text. */
  async downloadInvoiceAsText(label: string, layout: InvoiceLayout = 'two-line'): Promise<PdfDownload> {
    await this.demoHighlight(this.invoiceBtn());
    return downloadPdfViaButton(this.page, this.invoiceBtn(), label, layout);
  }

  /** Clicks "e-Invoice" and returns the saved PDF + its normalised text.
   *  Call `waitForEInvoiceButton()` first on a transaction that was just
   *  paid — the button only exists once LHDN validated the submission. */
  async downloadEInvoiceAsText(label: string, layout: InvoiceLayout = 'two-line'): Promise<PdfDownload> {
    await this.demoHighlight(this.eInvoiceBtn());
    return downloadPdfViaButton(this.page, this.eInvoiceBtn(), label, layout);
  }

  async isEInvoiceButtonVisible(): Promise<boolean> {
    return this.eInvoiceBtn().isVisible().catch(() => false);
  }

  /**
   * Reloads this details page until the e-Invoice button is on screen
   * (LHDN validation takes "a couple minutes" — Faizuddin, 2026-10-01), up
   * to CONFIG.eInvoiceApprovalTimeout. A reload keeps the page the test
   * already clicked its way to — it is not a deep-link navigation. Returns
   * false (never throws) when the time runs out, so the caller decides.
   */
  async waitForEInvoiceButton(): Promise<boolean> {
    const deadline = Date.now() + CONFIG.eInvoiceApprovalTimeout;
    let attempts = 0;
    while (Date.now() < deadline) {
      if (await this.isEInvoiceButtonVisible()) {
        if (attempts) console.log(`[12412] e-Invoice button appeared after ${attempts} reload(s)`);
        return true;
      }
      attempts++;
      await this.page.waitForTimeout(CONFIG.eInvoicePollInterval);
      await this.page.reload({ waitUntil: 'load', timeout: CONFIG.navigationTimeout });
      await this.settleAfterLoad();
      await this.dismissBanners();
    }
    return false;
  }

  /** "LHDN Response Status:" value (e.g. "OK") —
   *  `_reference/html/eauto/ucd-jomcheck-transaction-details.html` line 59:
   *  the label h6 is followed by an h6.data holding the value. */
  async getLhdnResponseStatus(): Promise<string> {
    const value = this.page.locator('h6:has-text("LHDN Response Status")').first().locator('xpath=following-sibling::h6[1]');
    if (!(await value.count())) return '';
    await this.demoHighlight(value, { color: 'green' });
    return (await value.innerText()).replace(/\s+/g, ' ').trim();
  }
}
