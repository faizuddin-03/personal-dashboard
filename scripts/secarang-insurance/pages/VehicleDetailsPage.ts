import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class VehicleDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async isShown(): Promise<boolean> {
    // Detect by the Angular component element — body text is unreliable
    // because "Get quotation" also appears on the home page submit button.
    return (await this.page.locator('app-confirm-details').count()) > 0;
  }

  async proceed(): Promise<void> {
    console.log('   📋 Vehicle details page — waiting for it to fully load…');

    // Step 1: wait for the component to be visible
    await this.page.locator('app-confirm-details').waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {
      console.log('   ⚠️  app-confirm-details not visible — continuing');
    });

    // Step 2: wait for the insurance API to populate the vehicle data table.
    // While loading, table cells contain "-". Wait until at least one cell
    // has real content (more than a single dash character).
    console.log('   ⏳ Waiting for vehicle data to load from insurance API…');
    await this.page.waitForFunction(() => {
      const cells = Array.from(document.querySelectorAll('app-confirm-details td'));
      return cells.length > 4 && cells.some(c => {
        const t = (c.textContent || '').trim();
        return t.length > 1 && t !== '-';
      });
    }, { timeout: 60_000 }).catch(() => {
      console.log('   ⚠️  Vehicle table may not be fully loaded — proceeding anyway');
    });

    // Step 3: 2-second buffer after data loads
    console.log('   ✅ Vehicle data loaded — waiting 2 seconds before clicking…');
    await this.wait(2_000);

    // Tick any declaration checkboxes
    const cbs = this.page.locator('input[type="checkbox"]');
    for (let i = 0; i < (await cbs.count()); i++) await cbs.nth(i).check({ force: true }).catch(() => {});

    // Step 4: click Get quotation
    const ctaSel = 'app-confirm-details button:has-text("Get quotation")';
    let btn = this.page.locator(ctaSel).last();
    if ((await btn.count()) === 0) btn = this.page.locator('app-confirm-details button.primary-btn').last();
    console.log('   🖱️  Clicking "Get quotation" on vehicle details page');
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click({ timeout: 8_000 }).catch(async () => {
      await btn.click({ force: true }).catch(() => {});
    });
  }
}
