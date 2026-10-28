import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { pickDatepickerDate } from '../utils/datepicker';

export interface EInvoiceListingRow {
  page: number;
  index: number;
  companyName: string;
  documentCode: string;
  vehicle: string;
  type: string;
  netAmount: string;
  taxAmount: string;
  totalIncludingTax: string;
  paymentDate: string;
  lhdnStatus: string;
}

/**
 * BackOffice "e-Invoice / Consolidated e-Invoice Listing" — `/view/einvoice/enquiry/`
 * (`_reference/html/eauto/bo-einvoice-consolidated-listing-search-results.html`).
 * No Vehicle / Document Code / Transaction No filter: search by Company Name +
 * Type + Payment Date (required), then match the Vehicle column. 50 rows a page.
 * Columns: # | Company Name | BRN | Document Code | Vehicle | Type |
 * Total Net Amount | Total Tax Amount | Total Including Tax | Payment Date |
 * Latest e-Invoice Submission Date | LHDN e-Invoice Status | ...
 */
export class BoEInvoiceListingPage extends BasePage {
  private menuLink     = () => this.page.locator('a[href$="/view/einvoice/enquiry/"]').first();
  private companyInput = () => this.page.locator('#companyName');
  private typeSelect   = () => this.page.locator('select#type');
  private payFrom      = () => this.page.locator('#paymentDateFrom');
  private payTo        = () => this.page.locator('#paymentDateTo');
  private searchBtn    = () => this.page.locator('#to-search');
  private dataRows     = () => this.page.locator('#result table tbody tr');
  private nextLink     = () => this.page.locator('#result .pagination a.next');

  constructor(page: Page) { super(page); }

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

  /** Company Name, Type JomCheck, Payment Date from/to = `date`, Search Now. */
  async search(companyName: string, date: Date): Promise<string> {
    await this.demoHighlight(this.companyInput());
    await this.companyInput().fill(companyName);
    await this.demoHighlight(this.typeSelect());
    await this.typeSelect().selectOption('JCK');
    await this.demoHighlight(this.payFrom());
    const from = await pickDatepickerDate(this.page, this.payFrom(), date);
    await this.demoHighlight(this.payTo());
    const to = await pickDatepickerDate(this.page, this.payTo(), date);
    await this.demoPause();
    await this.demoHighlight(this.searchBtn());
    await this.searchBtn().click();
    await this.page.locator('#result table').first().waitFor({ state: 'visible', timeout: CONFIG.navigationTimeout });
    await this.page.waitForTimeout(CONFIG.waitAfterSearch);
    return `${from} to ${to}`;
  }

  async totalText(): Promise<string> {
    return ((await this.page.locator('#result > div').first().innerText().catch(() => '')) || '').trim();
  }

  private async readPage(pageNo: number): Promise<EInvoiceListingRow[]> {
    const out: EInvoiceListingRow[] = [];
    const n = await this.dataRows().count();
    for (let i = 0; i < n; i++) {
      const c = (await this.dataRows().nth(i).locator('td').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim());
      if (c.length < 12) continue;
      out.push({
        page: pageNo, index: i, companyName: c[1], documentCode: c[3], vehicle: c[4], type: c[5],
        netAmount: c[6], taxAmount: c[7], totalIncludingTax: c[8], paymentDate: c[9], lhdnStatus: c[11],
      });
    }
    return out;
  }

  /** Every row whose Vehicle is `vehicleNo`, across all result pages. Leaves
   *  the listing on the page holding the last match. */
  async findByVehicle(vehicleNo: string, maxPages = 30): Promise<EInvoiceListingRow[]> {
    const hits: EInvoiceListingRow[] = [];
    await this.suppressDemo(async () => {
      for (let p = 1; p <= maxPages; p++) {
        hits.push(...(await this.readPage(p)).filter(r => r.vehicle.toUpperCase() === vehicleNo.toUpperCase()));
        if (!(await this.nextLink().count())) break;
        await this.nextLink().click();
        await this.page.waitForTimeout(CONFIG.waitAfterSearch);
      }
    });
    return hits;
  }

  async highlightRow(index: number): Promise<void> {
    await this.demoHighlight(this.dataRows().nth(index), { color: 'green' });
  }

  async captureListing(label: string): Promise<void> {
    await this.captureEvidence(label);
  }
}
