import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async selectVehicleAndOwner(vehicleType: string, ownerType: string): Promise<void> {
    const vtLower = vehicleType.toLowerCase();
    const otLower = ownerType.toLowerCase();

    // ── Vehicle type: Car / Motorcycle ───────────────────────────
    const vehicleLabel = vtLower.includes('motor') || vtLower.includes('bike')
      ? ['Motorcycle', 'Motorbike', 'Motor']
      : ['Car'];

    for (const label of vehicleLabel) {
      const btn = this.page.locator(
        `button:has-text("${label}"), [role="radio"]:has-text("${label}"), label:has-text("${label}")`
      ).first();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   🚗 Selecting vehicle type: "${label}"`);
        await btn.click();
        await this.wait(800);
        break;
      }
    }

    // ── Owner type: Private / Company ────────────────────────────
    const ownerLabels = otLower.includes('company') || otLower.includes('commercial')
      ? ['Company Car', 'Commercial', 'Company', 'Corporate']
      : ['Private Car', 'Private', 'Individual'];

    for (const label of ownerLabels) {
      const btn = this.page.locator(
        `button:has-text("${label}"), label:has-text("${label}"), [role="radio"]:has-text("${label}")`
      ).first();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   👤 Selecting owner type: "${label}"`);
        await btn.click();
        await this.wait(800);
        return;
      }
    }

    // Fallback: click first radio
    const radio = this.page.locator('input[type="radio"]').first();
    if ((await radio.count()) > 0) {
      console.log('   ℹ️  Owner type fallback: clicking first radio');
      await radio.click({ force: true }).catch(() => {});
    }
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
