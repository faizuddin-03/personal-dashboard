import { Page, Download } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import pdfParse from 'pdf-parse';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';

/**
 * UCD JomCheck purchase flow — see
 * `_reference/html/eauto/ucd-jomcheck-purchase-*.html` for the 3 captured
 * states this is built from (form -> vehicle found -> paid).
 *
 * NOTE the share-with-FI checkbox class changes between states on the SAME
 * page: `.share-cc-pay` before payment, `.share-cc` after — don't reuse one
 * selector across both.
 */
export class UcdJomCheckPurchasePage extends BasePage {
  // Home dashboard tile — _reference/html/eauto/ucd-home-page-uat1-2026-09-24.html:
  // `<button class="dashboard-menu-item-btn" id="jomcheck">JOMCHECK</button>`,
  // click handler does `window.location = ".../jomcheck/view.do"`.
  private jomcheckHomeTile = () => this.page.locator('#jomcheck').first();
  // Menu page (_reference/html/eauto/ucd-jomcheck-report-menu.html):
  // `<button id="create-tx" class="btn-blue-outline">PURCHASE JOMCHECK REPORT</button>`.
  private purchaseMenuBtn = () => this.page.locator('#create-tx').first();

  private vehicleNoRadio   = () => this.page.locator('#vehicleNoRadio').first();
  private chassisNoRadio   = () => this.page.locator('#chassisNoRadio').first();
  private vehicleRegNoInput = () => this.page.locator('#vehicleRegNo').first();
  private chassisNoInput    = () => this.page.locator('#vehicleChassisNo').first();
  private submitBtn         = () => this.page.locator('#to-check-vehicle').first();
  private payNowBtn         = () => this.page.locator('#to-pay').first();
  private downloadReportBtn = () => this.page.locator('#to-view-report').first();
  private searchAnotherBtn  = () => this.page.locator('#to-search-new-vehicle').first();
  private resultText        = () => this.page.locator('#result').first();
  private shareCheckboxesPrePayment = () => this.page.locator('.share-cc-pay');
  private shareCheckboxesPostPayment = () => this.page.locator('.share-cc');

  constructor(page: Page) { super(page); }

  /**
   * Reaches the purchase form by clicking through the real UI — UCD home's
   * "JOMCHECK" dashboard tile, then the menu page's "PURCHASE JOMCHECK
   * REPORT" button — not a direct `page.goto()` to the deep path
   * (Faizuddin, 2026-09-30: navigate via clicks, not URLs). Login already
   * lands on UCD home, so `CONFIG.ucdHome` is only loaded directly as a
   * fallback when the tile isn't already on screen (e.g. this is the first
   * navigation this session) — a genuine fallback, not a shortcut past a
   * known click path.
   */
  async goto(): Promise<void> {
    if (!(await this.jomcheckHomeTile().count())) {
      await this.page.goto(`${CONFIG.baseUrl}${CONFIG.ucdHome}`, {
        waitUntil: 'load',
        timeout: CONFIG.navigationTimeout,
      });
      await this.settleAfterLoad();
      await this.dismissBanners();
    }

    await this.demoHighlight(this.jomcheckHomeTile());
    await this.jomcheckHomeTile().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    await this.dismissBanners();

    await this.demoHighlight(this.purchaseMenuBtn());
    await this.purchaseMenuBtn().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    await this.dismissBanners();
  }

  async submitVehicleNo(vehicleNo: string): Promise<void> {
    if (!(await this.vehicleNoRadio().isChecked())) {
      await this.demoHighlight(this.vehicleNoRadio());
      await this.vehicleNoRadio().check();
    }
    await this.demoHighlight(this.vehicleRegNoInput());
    await this.vehicleRegNoInput().fill(vehicleNo);
    await this.demoPause();
    await this.demoHighlight(this.submitBtn());
    await this.submitBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  async submitChassisNo(chassisNo: string): Promise<void> {
    await this.demoHighlight(this.chassisNoRadio());
    await this.chassisNoRadio().check();
    await this.demoHighlight(this.chassisNoInput());
    await this.chassisNoInput().fill(chassisNo);
    await this.demoPause();
    await this.demoHighlight(this.submitBtn());
    await this.submitBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  /** Checks a bank/credit-company share checkbox by its visible name, before payment. */
  async shareWithBeforePayment(companyName: string): Promise<void> {
    const checkbox = this.shareCheckboxBeforePayment(companyName);
    await this.demoHighlight(checkbox);
    await checkbox.check();
  }

  /** One company's pre-payment share checkbox, found by its visible name —
   *  `_reference/html/eauto/ucd-jomcheck-purchase-share-list-vehicle-found.html`
   *  (uat1 list: mfxstar, X STAR TECHNOLOGY MALAYSIA SDN BHD, YI LINK TEST SDN BHD). */
  private shareCheckboxBeforePayment = (companyName: string) =>
    this.page.locator(`div:has(> .share-cc-pay):has-text("${companyName}") .share-cc-pay`).first();

  async isSharedWithBeforePayment(companyName: string): Promise<boolean> {
    return this.shareCheckboxBeforePayment(companyName).isChecked();
  }

  /**
   * Clicking "Pay Now" opens a jQuery UI "Payment" confirm dialog ("Are you
   * sure you want to proceed with this payment?") — see
   * `_reference/html/eauto/ucd-jomcheck-purchase-payment-confirm-dialog.html`,
   * captured 2026-10-02 after this was missing and the flow silently never
   * advanced past "Vehicle number found." Must accept it for the purchase
   * to actually complete.
   *
   * Waits for the "Download Report" button (`#to-view-report`) to become
   * visible as the actual completion signal — NOT for `#result`'s text to
   * change. Revised 2026-10-03, Faizuddin: "after clicking pay now, the
   * automation still checks the wording for Vehicle Number Found. by right,
   * shouldnt check that anymore." The previous version polled for `#result`
   * to differ from its pre-click text, which assumed a real API-connected
   * payment eventually rewrites that text (e.g. to "...successfully") the
   * same way eSim's near-instant stub does — but `#result` isn't a reliable
   * completion signal for the real flow, which can keep showing stale text
   * throughout. The "Download Report" button is reliable instead: it is
   * ABSENT from the pre-payment "vehicle found" state and only appears in
   * the post-payment "paid" state (confirmed from both captured HTML states,
   * `ucd-jomcheck-purchase-vehicle-found.html` vs `-paid.html`) — so waiting
   * for it is both the true success signal AND the thing every downstream
   * step (the report download itself) needs anyway. Polls up to
   * `CONFIG.paymentProcessingTimeout` (5 minutes, Faizuddin confirmed a real
   * payment takes around 2).
   */
  async payNow(): Promise<void> {
    await this.demoHighlight(this.payNowBtn());
    await this.payNowBtn().click();
    await this.waitForDialog();
    await this.acceptConfirmDialog();
    await this.downloadReportBtn().waitFor({ state: 'visible', timeout: CONFIG.paymentProcessingTimeout });
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  /**
   * Pay Now when the purchase is EXPECTED TO FAIL (eSim Result = Failed,
   * TS31): payment goes through, then UCD shows an error "something like
   * 'unable to generate report'" (Faizuddin, 2026-10-05) instead of the
   * Download Report button, and the transaction lists as Payment OK / Tx
   * Failed. Waits for that error — in the page's own `#custom-dialog`
   * (`#custom-field` text), any jQuery UI dialog, or `#result` turning
   * red/failed — and returns its text. Dismisses the dialog so the page can
   * be navigated on.
   * [unconfirmed: the exact error wording and where it renders — never seen
   * live. The first TS31 run prints it as a DETAIL line; capture the page
   * then, per the standing HTML rule.]
   */
  async payNowExpectingFailure(): Promise<string> {
    await this.demoHighlight(this.payNowBtn());
    await this.payNowBtn().click();
    await this.waitForDialog();
    await this.acceptConfirmDialog();
    const customField = this.page.locator('#custom-dialog:visible #custom-field, .ui-dialog:visible .ui-dialog-content');
    const resultFailed = this.page.locator('#result', { hasText: /fail|unable|error|not generated/i });
    const deadline = Date.now() + CONFIG.paymentProcessingTimeout;
    let message = '';
    while (Date.now() < deadline) {
      if (await customField.count() && await customField.first().isVisible()) { message = (await customField.first().innerText()).trim(); break; }
      if (await resultFailed.count()) { message = (await resultFailed.innerText()).trim(); break; }
      if (await this.downloadReportBtn().isVisible().catch(() => false)) {
        throw new Error('The purchase SUCCEEDED (Download Report is shown) — eSim Result was not "Failed" for this vehicle\'s prefix.');
      }
      await this.page.waitForTimeout(CONFIG.pollingInterval);
    }
    if (!message) throw new Error('No failure message appeared after Pay Now within the payment timeout.');
    await this.demoHighlight(customField.first().or(resultFailed), { color: 'red' });
    await this.demoPause();
    // Close whichever dialog is up (OK / confirm button, else Escape).
    const ok = this.page.locator('.ui-dialog:visible .confirm-dialog-btn, .ui-dialog:visible button:has-text("Ok"), .ui-dialog:visible button:has-text("OK")').first();
    if (await ok.count()) await ok.click({ timeout: 10_000 }).catch(() => {});
    else await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
    return message;
  }

  /** True once the "Download Report" button is on screen — the real
   *  post-payment completion signal `payNow()` itself already waits on.
   *  Exposed so specs can assert it explicitly as their own
   *  "payment completed" step, instead of matching `#result` wording. */
  async isReportReady(): Promise<boolean> {
    return this.downloadReportBtn().isVisible();
  }

  async getResultText(): Promise<string> {
    await this.demoHighlight(this.resultText(), { color: 'green' });
    return (await this.resultText().innerText()).trim();
  }

  /**
   * The FULL prompt text — `#result` ("Vehicle number found.") plus the
   * adjoining `#desc` span ("Pay now (RM20.00 + 8% Service Tax) to purchase
   * the report."), both inside the same `<p>`. TS04 checks this exact
   * combined wording; `getResultText()` alone only returns the `#result`
   * half. See `_reference/html/eauto/ucd-jomcheck-purchase-vehicle-found.html`.
   */
  async getFullPromptText(): Promise<string> {
    const paragraph = this.resultText().locator('xpath=..');
    await this.demoHighlight(paragraph, { color: 'green' });
    return (await paragraph.innerText()).replace(/\s+/g, ' ').trim();
  }

  /** The internal transaction UUID — `<input type="hidden" name="transactionId">`
   *  on this same form, populated once the vehicle no. has been submitted
   *  (see `_reference/html/eauto/ucd-jomcheck-purchase-paid.html`). */
  async getTransactionId(): Promise<string> {
    return this.page.locator('input[name="transactionId"]').inputValue();
  }

  /** Triggers the report PDF download; caller handles the Playwright download event. */
  async clickDownloadReport(): Promise<void> {
    await this.demoHighlight(this.downloadReportBtn());
    await this.downloadReportBtn().click();
  }

  /** Clicks "Download Report" and waits for the actual download event — use
   *  this (not `clickDownloadReport()`) when the test needs to confirm a
   *  file genuinely came down, e.g. TS01's "report downloaded reflects
   *  correctly". */
  async downloadReport(): Promise<Download> {
    await this.demoHighlight(this.downloadReportBtn());
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadReportBtn().click(),
    ]);
    return download;
  }

  /**
   * Clicks "Download Report" and returns its extracted, whitespace-
   * normalised, UPPERCASE text — for crosschecking the Report PDF against
   * the BO JomCheck Report Listing (the workbook's own Golden Rule #1/#2).
   * Same `pdf-parse` approach as
   * `scripts/secarang-insurance/pages/PaymentSuccessPage.ts`.
   *
   * ALSO persists the PDF itself as evidence (via `PW_EVIDENCE_DIR`, same as
   * `BasePage.saveDownloadAsEvidence()`) rather than discarding it after
   * parsing — Faizuddin, 2026-10-03: "for all JomCheck API ts, make sure it
   * downloads and save the report, whatever the scenario is. Since the
   * download from JomCheck is limited, we need to make sure we get all
   * details possible in case need to refer in the future." `label` should
   * be unique per scenario+vehicle (e.g. `"TS02-report-HXA0007A"`) — several
   * scenarios can share one run's evidence folder, so a generic label would
   * let one overwrite another's saved report. Falls back to a one-off temp
   * file (deleted after parsing) when `PW_EVIDENCE_DIR` isn't set, e.g. a
   * bare CLI run with no dashboard behind it.
   */
  async downloadReportAsText(label: string): Promise<string> {
    const download = await this.downloadReport();
    const evidenceDir = process.env.PW_EVIDENCE_DIR;
    const ext = path.extname(download.suggestedFilename()) || '.pdf';
    const persisted = !!evidenceDir;
    const filePath = persisted
      ? path.join(evidenceDir!, `${label.replace(/[^\w.-]+/g, '_')}${ext}`)
      : path.join(os.tmpdir(), `jomcheck-report-${Date.now()}${ext}`);
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

  async searchAnotherVehicle(): Promise<void> {
    await this.demoHighlight(this.searchAnotherBtn());
    await this.searchAnotherBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }
}
