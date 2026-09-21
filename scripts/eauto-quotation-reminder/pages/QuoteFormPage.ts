import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { PATHS } from '../utils/paths';

/**
 * Get Free Quote — the vehicle-no + IC form. `form#tx-form` posts to
 * save-form.do and lands on step 1 (insurer cards).
 *
 * Ids come from live uat4 HTML. This supersedes the positional
 * `input[type=text]:visible >> nth=0/1` locators in scripts/eauto-e2e, which
 * were written before the ids were known and break the moment a field is added.
 */
export class QuoteFormPage extends BasePage {
  private vehicleRegNo = () => this.page.locator('#vehicleRegNo');
  private icOrRoc = () => this.page.locator('#buyerRefIdCompanyROC');
  private showResult = () => this.page.locator('#to-show-result');

  async open(): Promise<void> {
    this.step('Opening Get Free Quote');
    // #freeQuote runs validateTransactionRestriction() before navigating, so go
    // through the tile rather than deep-linking the form.
    await this.page.goto(PATHS.insuranceMain(), { waitUntil: 'domcontentloaded' });
    await this.dismissBanners();
    const tile = this.page.locator('#freeQuote');
    if (await tile.count()) {
      await tile.click();
    } else {
      await this.page.goto(PATHS.quoteForm(), { waitUntil: 'domcontentloaded' });
    }
    await expect(this.page.locator('form#tx-form'), 'Get Free Quote form did not render').toBeVisible({ timeout: 30_000 });
  }

  async fill(vehicleNo = CONFIG.vehicleNo, ic = CONFIG.ic): Promise<void> {
    this.step(`Vehicle ${vehicleNo}, IC ${ic}`);
    await this.vehicleRegNo().fill(vehicleNo);
    await this.icOrRoc().fill(ic);
  }

  /**
   * Submit. THIS is the click whose timing the cron keys on, so it is kept
   * separate from fill() — the caller holds until the scheduled minute, then
   * calls this and nothing else.
   */
  async showMyResult(): Promise<void> {
    this.step(`Clicking "Show My Result" at ${new Date().toISOString()}`);
    await this.showResult().click();
  }
}
