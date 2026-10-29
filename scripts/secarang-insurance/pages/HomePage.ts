import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export interface FormFillResult {
  plateFilled:    boolean;
  icFilled:       boolean;
  postcodeFilled: boolean;
}

export class HomePage extends BasePage {
  // locators (private — specs never access these)
  // Secarang renders 3 bare text inputs with no name/id/placeholder, in DOM order:
  //   [0] Vehicle Plate No.   [1] Owner IC / Company SSM   [2] Postal Code
  private visibleTextInputs = () => this.page.locator('input[type="text"]:visible, input:not([type]):visible');
  private radios            = () => this.page.locator('input[type="radio"]');

  constructor(page: Page) {
    super(page);
  }

  async selectVehicleAndOwner(vehicleType: string, ownerType: string): Promise<void> {
    const vtLower = vehicleType.toLowerCase();
    const otLower = ownerType.toLowerCase();

    // ── Vehicle type: Car / Motorcycle ───────────────────────────
    const vehicleLabels = vtLower.includes('motor') || vtLower.includes('bike')
      ? ['Motorcycle', 'Motorbike', 'Motor']
      : ['Car'];

    let vehicleSelected = false;
    for (const label of vehicleLabels) {
      const btn = this.page.locator(
        `button:has-text("${label}"), [role="radio"]:has-text("${label}"), label:has-text("${label}")`
      ).first();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   🚗 Selecting vehicle type: "${label}"`);
        await btn.click();
        vehicleSelected = true;
        await this.wait(800);
        break;
      }
    }
    if (!vehicleSelected) {
      const btns = await this.page.locator('button, [role="radio"]').allTextContents();
      console.log(`   ⚠️  Could not find "${vehicleLabels[0]}" button. Available buttons: ${btns.slice(0, 10).join(' | ')}`);
    }

    // ── Owner type: Private / Company ────────────────────────────
    const isCompany = otLower.includes('company') || otLower.includes('commercial');
    const ownerLabels = isCompany
      ? ['Company Car', 'Company Motorcycle', 'Commercial', 'Company', 'Corporate', 'Business']
      : ['Private Car', 'Private Motorcycle', 'Private', 'Individual'];

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

    // Fallback: radio inputs by index (radio #0 = Private, radio #1 = Company).
    // Radios may be visually hidden behind a styled label — force the click.
    const idx = isCompany ? 1 : 0;
    const rc = await this.radios().count();
    if (rc > idx) {
      console.log(`   👤 Selecting owner type via radio #${idx} (${ownerType})`);
      await this.radios().nth(idx).click({ force: true }).catch(async () => {
        await this.radios().nth(idx).check({ force: true }).catch(() => {});
      });
      await this.wait(800);
    } else {
      console.log(`   ⚠️  Could not select owner type (found ${rc} radios)`);
    }
  }

  /**
   * Fill the 3 positional form fields (plate / IC / postcode), verifying each
   * value stuck. `perFieldWaitMs` preserves the slower cadence the regression
   * flow uses; the checker passes 0 for speed.
   */
  async fillForm(
    vehicleNumber: string,
    icNumber: string,
    postcode: string,
    opts: { perFieldWaitMs?: number } = {},
  ): Promise<FormFillResult> {
    const perFieldWait = opts.perFieldWaitMs ?? 1000;
    console.log(`   📝 Filling form: VN=${vehicleNumber} IC=${icNumber} PC=${postcode}`);

    const inputs = this.visibleTextInputs();
    const n = await inputs.count();
    console.log(`   🔢 Found ${n} visible text input(s)`);
    if (n < 3) {
      console.log(`   ⚠️  Expected 3 text inputs, found ${n}. Filling what is available.`);
    }

    const values = [vehicleNumber, icNumber, postcode];
    const labels = ['Plate', 'IC/SSM', 'Postcode'];
    const filled = [false, false, false];

    for (let i = 0; i < Math.min(3, n); i++) {
      try {
        const el = inputs.nth(i);
        await el.click();
        await el.fill('');
        await el.fill(values[i]);
        const got = await el.inputValue().catch(() => '');
        filled[i] = got.replace(/\s/g, '') === values[i].replace(/\s/g, '');
        console.log(`   ${filled[i] ? '✅' : '⚠️'} ${labels[i]} [input #${i}] = "${got}"`);
      } catch (err) {
        console.log(`   ❌ ${labels[i]} [input #${i}] failed: ${err}`);
      }
      if (perFieldWait > 0) await this.wait(perFieldWait);
    }

    await this.wait(500);
    return { plateFilled: filled[0], icFilled: filled[1], postcodeFilled: filled[2] };
  }

  async submit(): Promise<void> {
    const submitLabels = ['Get Quotation', 'Get Quote', 'Check Now', 'Submit', 'Proceed', 'Search'];
    for (const label of submitLabels) {
      const btn = this.page.locator(`button:has-text("${label}"), input[value="${label}"]`).first();
      if ((await btn.count()) > 0) {
        console.log(`   🚀 Clicking submit: "${label}"`);
        await btn.click();
        return;
      }
    }
    const fallback = this.page.locator('button[type="submit"], input[type="submit"]').first();
    if ((await fallback.count()) > 0) {
      console.log('   🚀 Clicking fallback submit button');
      await fallback.click();
      return;
    }
    throw new Error('Could not find submit/Get Quotation button on the form page');
  }
}
