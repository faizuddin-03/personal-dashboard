import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async selectCarPrivate(): Promise<void> {
    // Car
    const car = this.page.locator('button:has-text("Car"), [role="radio"]:has-text("Car"), label:has-text("Car")').first();
    if ((await car.count()) > 0) { await car.click(); await this.wait(1000); }

    // Private
    for (const label of ['Private Car', 'Private', 'Individual']) {
      const ctrl = this.page.locator(`button:has-text("${label}"), label:has-text("${label}")`).first();
      if ((await ctrl.count()) > 0 && await ctrl.isVisible().catch(() => false)) {
        await ctrl.click(); await this.wait(1000); return;
      }
    }
    const radio = this.page.locator('input[type="radio"]').first();
    if ((await radio.count()) > 0) await radio.click({ force: true }).catch(() => {});
  }

  async fillForm(vehicleNumber: string, icNumber: string, postcode: string): Promise<void> {
    const inputs = this.page.locator('input[type="text"]:visible, input:not([type]):visible');
    const n = await inputs.count();
    console.log(`   🔢 ${n} visible text input(s)`);

    const values = [vehicleNumber, icNumber, postcode];
    for (let i = 0; i < Math.min(3, n); i++) {
      const el = inputs.nth(i);
      await el.click();
      await el.fill('');
      await el.fill(values[i]);
      console.log(`   ✏️  input[${i}] = "${await el.inputValue()}"`);
      await this.wait(1000);
    }
  }

  async submit(): Promise<void> {
    for (const label of ['Get Quotation', 'Get Quote', 'Check Now', 'Submit', 'Proceed', 'Search']) {
      const btn = this.page.locator(`button:has-text("${label}")`).first();
      if ((await btn.count()) > 0) { await btn.click(); return; }
    }
    const fallback = this.page.locator('button[type="submit"]').first();
    if ((await fallback.count()) > 0) { await fallback.click(); return; }
    throw new Error('Submit button not found');
  }
}
