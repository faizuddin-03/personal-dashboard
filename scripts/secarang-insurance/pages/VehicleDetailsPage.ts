import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class VehicleDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async isShown(): Promise<boolean> {
    const body = await this.page.locator('body').innerText().catch(() => '');
    return /are these your vehicle details|get quotation/i.test(body);
  }

  async proceed(): Promise<void> {
    console.log('   📋 Vehicle details step');

    // Tick any declaration checkboxes
    const cbs = this.page.locator('input[type="checkbox"]');
    for (let i = 0; i < (await cbs.count()); i++) await cbs.nth(i).check({ force: true }).catch(() => {});

    // Wait for "Get quotation" button to be enabled
    const ctaSel = 'button:has-text("Get quotation")';
    await this.poll(async () => {
      const c = this.page.locator(ctaSel).last();
      return (await c.count()) > 0 && await c.isEnabled().catch(() => false);
    }, 12_000);

    let btn = this.page.locator(ctaSel).last();
    if ((await btn.count()) === 0) btn = this.page.locator('button.primary-btn').last();
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click({ timeout: 8_000 }).catch(async () => {
      await btn.click({ force: true }).catch(() => {});
    });
  }
}
