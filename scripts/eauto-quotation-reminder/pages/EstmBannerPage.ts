import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { PATHS } from '../utils/paths';

/**
 * The "Banner" entry (TS03): eSTM listing → find the transaction by vehicle
 * number → details page → buy insurance → insurance step 1.
 *
 * NOT the campaign banner on UCD home — that is marketing furniture that
 * intercepts clicks and offers nothing.
 */
export class EstmBannerPage extends BasePage {
  async openListing(): Promise<void> {
    await this.page.goto(PATHS.estmListing(), { waitUntil: 'domcontentloaded' });
    await this.dismissBanners();
  }

  /**
   * Search by vehicle number and open the matching transaction. The Action link
   * carries the id as an attribute, so there is no URL to scrape.
   * Note the details page takes ?id= — NOT ?transactionId=, unlike insurance.
   */
  async openTransaction(vehicleNo: string): Promise<void> {
    await this.openListing();
    await this.page.locator('#search-form input[name=vehicleNo]').fill(vehicleNo);
    await this.page.locator('#to-search').click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => { /* ignore */ });
    await this.page.waitForTimeout(1_500);

    const action = this.page.locator('a[href*="enquiry/view.do?id="]').first();
    await expect(action, `No eSTM transaction found for ${vehicleNo}. Create one first — the automation does not create it yet.`)
      .toHaveCount(1, { timeout: 20_000 });

    await action.click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => { /* ignore */ });
    this.step(`Opened the eSTM details page for ${vehicleNo}`);
  }

  /**
   * Click the buy-insurance banner and confirm the dialog. Lands on insurance
   * step 1, skipping the Get Free Quote form — the eSTM already holds the
   * vehicle and owner, so there is nothing to key in.
   */
  async buyInsurance(): Promise<void> {
    const banner = this.page.locator(
      '#to-buy-insurance, [id*="buy-insurance"]:not(#buy-insurance-dialog), a:has-text("Buy Insurance"), button:has-text("Buy Insurance")',
    ).first();
    await expect(banner, 'No buy-insurance banner on the eSTM details page').toBeVisible({ timeout: 20_000 });
    await banner.click();

    // Confirmation dialog: #toProceed ("YES") → redirectInsuranceQuote().
    const proceed = this.page.locator('#toProceed');
    if (await proceed.count()) {
      await proceed.click();
      this.step('Confirmed the buy-insurance dialog');
    }
  }
}
