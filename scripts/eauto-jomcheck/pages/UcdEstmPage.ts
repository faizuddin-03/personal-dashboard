import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';

/**
 * eSTM transaction details for 12412_TS12 — the Invoice / e-Invoice buttons
 * (`_reference/html/eauto/estm-details-with-buy-insurance-banner.html`).
 * The eSTM purchase itself is the copied original flow in pages/estm/.
 */
export class UcdEstmPage extends BasePage {
  private clickWhenVisible = async (target: import('@playwright/test').Locator, timeout = 15_000) => {
    await target.waitFor({ state: 'visible', timeout });
    await this.demoHighlight(target);
    await target.click();
  };

  constructor(page: Page) { super(page); }

  // ── Transaction details (`_reference/html/eauto/estm-details-with-buy-insurance-banner.html`) ──
  private listingLink   = () => this.page.locator('.breadcrumb a', { hasText: 'eSTM Transaction Listing' });
  invoiceButton         = () => this.page.locator('#to-print-invoice');
  /** Shows beside Invoice once the e-Invoice is validated (Faizuddin, 2026-10-19:
   *  "should be same like invoice button, but it will show e-Invoice"). */
  eInvoiceButton        = () => this.page.locator('.trx-details-header button', { hasText: /e-Invoice/i }).first();

  /** Opens the details page of the newest eSTM for `vehicleNo` from the eSTM
   *  Transaction Listing (`_reference/html/eauto/estm-listing-with-approved-row.html`). */
  async openDetails(vehicleNo: string): Promise<string> {
    if (!(await this.invoiceButton().isVisible().catch(() => false))) {
      if (!(await this.listingLink().count())) {
        await this.page.goto(`${CONFIG.baseUrl}/view/ucd/estm/enquiry/main.do`, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
      } else {
        await this.listingLink().click();
      }
      await this.settleAfterLoad();
      await this.dismissBanners();
      await this.demoHighlight(this.page.locator('#vehicleNo'));
      await this.page.locator('#vehicleNo').fill(vehicleNo);
      await this.clickWhenVisible(this.page.locator('#to-search'));
      await this.page.waitForTimeout(CONFIG.waitAfterSearch);
      const view = this.page.locator('table tbody tr').filter({ hasText: vehicleNo }).first().getByRole('link', { name: 'View' });
      await this.clickWhenVisible(view, CONFIG.navigationTimeout);
      await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
      await this.settleAfterLoad();
    }
    await this.invoiceButton().waitFor({ state: 'visible', timeout: CONFIG.navigationTimeout });
    const ref = ((await this.page.locator('.ref-no').innerText().catch(() => '')) || '').trim();
    const status = ((await this.page.locator('.trx-details-status').innerText().catch(() => '')) || '').trim();
    console.log(`DETAIL:${JSON.stringify({ label: 'eSTM transaction', value: `${vehicleNo} ${ref} · ${status}` })}`);
    return status;
  }

  /** "LHDN Response Status" per e-Invoice section — e.g. { eSTM: "Failed", eLKM: "Failed", eVOC: "Failed" }
   *  (`_reference/html/eauto/estm-details-approved-lhdn-failed.html`). */
  async lhdnStatuses(): Promise<Record<string, string>> {
    return this.page.evaluate(() => {
      const out: Record<string, string> = {};
      document.querySelectorAll('.box').forEach(box => {
        const title = box.querySelector('h3.subtitle')?.textContent ?? '';
        const m = /e-Invoice \((.+?)\)/.exec(title);
        if (!m) return;
        box.querySelectorAll('.flex.flex-row').forEach(row => {
          if (/LHDN Response Status/i.test(row.textContent ?? '')) out[m[1]] = (row.querySelector('.data')?.textContent ?? '').replace(/\s+/g, ' ').trim();
        });
      });
      return out;
    });
  }

  /** Reloads the details page until the e-Invoice button shows, up to
   *  CONFIG.eInvoiceApprovalTimeout — same wait as the JomCheck TS. LHDN can
   *  read "Failed" right after payment and still turn OK later (Faizuddin,
   *  2026-10-19: "the e-Invoice will take time to display"), so a Failed
   *  status does not end the wait; the last statuses seen are returned. */
  async waitForEInvoiceButton(): Promise<{ ready: boolean; statuses: Record<string, string> }> {
    const deadline = Date.now() + CONFIG.eInvoiceApprovalTimeout;
    let statuses: Record<string, string> = {};
    while (Date.now() < deadline) {
      if (await this.eInvoiceButton().isVisible().catch(() => false)) return { ready: true, statuses: await this.lhdnStatuses() };
      statuses = await this.lhdnStatuses().catch(() => ({}));
      await this.page.waitForTimeout(CONFIG.eInvoicePollInterval);
      await this.page.reload({ waitUntil: 'load', timeout: CONFIG.navigationTimeout });
      await this.settleAfterLoad();
    }
    return { ready: false, statuses };
  }
}
