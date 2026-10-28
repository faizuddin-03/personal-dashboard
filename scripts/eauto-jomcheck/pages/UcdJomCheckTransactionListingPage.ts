import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';

/** One UCD listing row. Columns per the listing capture: # | Vehicle |
 *  Chassis No | Transaction No | Created At | Payment | Tx Status |
 *  e-Invoice Status | Remarks | Action. */
export interface UcdListingRow {
  index: number;
  vehicle: string;
  chassisNo: string;
  transactionNo: string;
  createdAt: string;
  payment: string;
  txStatus: string;
  eInvoiceStatus: string;
  remarks: string;
  /** Internal UUID from the row's "View" link. */
  id: string;
}

/**
 * UCD JomCheck Transaction Listing — `/view/ucd/jomcheck/enquiry/`. See
 * `_reference/html/eauto/ucd-jomcheck-transaction-listing.html` (blank
 * search form + a 17-row result state). Columns: # | Vehicle | Chassis No |
 * Transaction No | Created At | Payment | Tx Status | e-Invoice Status |
 * Remarks | Action (a "View" link into UcdJomCheckTransactionDetailsPage).
 */
export class UcdJomCheckTransactionListingPage extends BasePage {
  // Menu page (_reference/html/eauto/ucd-jomcheck-report-menu.html):
  // `<button onclick="window.location='.../jomcheck/enquiry/'">JOMCHECK TRANSACTION LISTING</button>`.
  private listingMenuBtn = () => this.page.getByRole('button', { name: 'JOMCHECK TRANSACTION LISTING' }).first();
  // The purchase flow's breadcrumb carries a real click back to the menu
  // page — reused here so a test that just finished a purchase doesn't need
  // to go all the way back out to UCD home first.
  private menuBreadcrumbLink = () => this.page.locator('.breadcrumb a:has-text("JomCheck Report")').first();
  private jomcheckHomeTile = () => this.page.locator('#jomcheck').first();

  private vehicleNoInput = () => this.page.locator('#vehicleNo').first();
  private chassisNoInput = () => this.page.locator('#chassisNo').first();
  private refNoInput     = () => this.page.locator('#refNo').first();
  private searchBtn      = () => this.page.locator('#to-search').first();
  private dataRows       = () => this.page.locator('table tbody tr.odd, table tbody tr.even');

  constructor(page: Page) { super(page); }

  /**
   * Reaches the listing by clicking real UI controls (Faizuddin, 2026-09-30:
   * navigate via clicks, not page.goto()) — prefers the breadcrumb's
   * "JomCheck Report" link (fastest path back from a purchase flow already
   * on this host), falls back to UCD home's tile when neither the listing
   * button nor that breadcrumb is already on screen.
   */
  async goto(): Promise<void> {
    if (!(await this.listingMenuBtn().count())) {
      if (await this.menuBreadcrumbLink().count()) {
        await this.demoHighlight(this.menuBreadcrumbLink());
        await this.menuBreadcrumbLink().click();
      } else {
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
      }
      await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
      await this.settleAfterLoad();
      await this.dismissBanners();
    }

    await this.demoHighlight(this.listingMenuBtn());
    await this.listingMenuBtn().click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    await this.dismissBanners();
  }

  async searchByVehicleNo(vehicleNo: string): Promise<void> {
    await this.demoHighlight(this.vehicleNoInput());
    await this.vehicleNoInput().fill(vehicleNo);
    await this.demoPause();
    await this.demoHighlight(this.searchBtn());
    await this.searchBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  async searchByChassisNo(chassisNo: string): Promise<void> {
    await this.demoHighlight(this.chassisNoInput());
    await this.chassisNoInput().fill(chassisNo);
    await this.demoPause();
    await this.demoHighlight(this.searchBtn());
    await this.searchBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  async searchByTransactionNo(refNo: string): Promise<void> {
    await this.demoHighlight(this.refNoInput());
    await this.refNoInput().fill(refNo);
    await this.demoPause();
    await this.demoHighlight(this.searchBtn());
    await this.searchBtn().click();
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
  }

  /**
   * Transaction No. ("J69…") of the row whose "View" link points at
   * `transactionId` (the purchase form's hidden UUID). Each row's link is
   * `/view/ucd/jomcheck/enquiry/view.do?id=<transactionId>` with
   * `title="to view <Transaction No>"` — see the listing capture. Run a
   * search first so the row is on the page.
   */
  async transactionNoForId(transactionId: string): Promise<string> {
    const link = this.page.locator(`table tbody a[href*="id=${transactionId}"]`).first();
    await link.waitFor({ state: 'attached', timeout: CONFIG.navigationTimeout });
    const row = link.locator('xpath=ancestor::tr[1]');
    await this.demoHighlight(row, { color: 'green' });
    // Column 4 is "Transaction No" (# | Vehicle | Chassis No | Transaction No | …).
    return (await row.locator('td').nth(3).innerText()).trim();
  }

  async getResultCount(): Promise<number> {
    return this.dataRows().count();
  }

  /**
   * Every result row on the page, in listing order (newest first). `id` is
   * the transaction's internal UUID from its "View" link — the one value that
   * identifies a row even when its Transaction No. is "-". Used by TS05/TS31
   * to pick a pre-push transaction and re-find it after a new purchase.
   */
  async readRows(): Promise<UcdListingRow[]> {
    return this.suppressDemo(async () => {
      const out: UcdListingRow[] = [];
      const count = await this.dataRows().count();
      for (let i = 0; i < count; i++) {
        const row = this.dataRows().nth(i);
        const cells = (await row.locator('td').allInnerTexts()).map(t => t.trim());
        // A no-match search renders one body row "No record found. Try again."
        // — not a transaction (live, 2026-10-05, NH4566 under another company).
        if (cells.length < 5 || cells.some(c => /No record found/i.test(c))) continue;
        const href = (await row.locator('a:has-text("View")').first().getAttribute('href').catch(() => null)) ?? '';
        out.push({
          index: i,
          vehicle: cells[1] ?? '',
          chassisNo: cells[2] ?? '',
          transactionNo: cells[3] ?? '',
          createdAt: cells[4] ?? '',
          payment: cells[5] ?? '',
          txStatus: cells[6] ?? '',
          eInvoiceStatus: cells[7] ?? '',
          remarks: cells[8] ?? '',
          id: /[?&]id=([^&]+)/.exec(href)?.[1] ?? '',
        });
      }
      return out;
    });
  }

  /** Highlights one row (green) — for the recording, at the moment it is read. */
  async highlightRow(rowIndex: number): Promise<void> {
    await this.demoHighlight(this.dataRows().nth(rowIndex), { color: 'green' });
  }

  /** Clicks the "View" link in a given row (0-based) — lands on
   *  UcdJomCheckTransactionDetailsPage. */
  async openResult(rowIndex = 0): Promise<void> {
    const link = this.dataRows().nth(rowIndex).locator('a:has-text("View")').first();
    await this.demoHighlight(link);
    await link.click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
    await this.dismissBanners();
  }
}
