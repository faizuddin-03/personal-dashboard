import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class VehicleDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async isShown(): Promise<boolean> {
    return (await this.page.locator('app-confirm-details').count()) > 0;
  }

  async proceed(): Promise<void> {
    // Wait for the component to appear after the post-submit loading process
    console.log('   📋 Waiting for vehicle details page to load…');
    await this.page.locator('app-confirm-details').waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {
      console.log('   ⚠️  app-confirm-details not visible — continuing');
    });

    // Wait 5 seconds after the page loads before clicking
    console.log('   ⏳ Vehicle details page loaded — waiting 5 seconds…');
    await this.wait(5_000);

    // Tick any declaration checkboxes
    const cbs = this.page.locator('input[type="checkbox"]');
    for (let i = 0; i < (await cbs.count()); i++) await cbs.nth(i).check({ force: true }).catch(() => {});

    // Click Get quotation
    const ctaSel = 'app-confirm-details button:has-text("Get quotation")';
    let btn = this.page.locator(ctaSel).last();
    if ((await btn.count()) === 0) btn = this.page.locator('app-confirm-details button.primary-btn').last();
    console.log('   🖱️  Clicking "Get quotation"');
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click({ timeout: 8_000 }).catch(async () => {
      await btn.click({ force: true }).catch(() => {});
    });
  }
}
