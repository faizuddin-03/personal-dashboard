import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { hasAnyQuotationCard } from './QuotationPage';

export class VehicleDetailsPage extends BasePage {
  // locators (private — specs never access these)
  private confirmDetails = () => this.page.locator('app-confirm-details');
  private checkboxes     = () => this.page.locator('input[type="checkbox"]');
  private variantSelect  = () => this.page.locator('select').first();
  private variantCombo   = () => this.page.locator('mat-select, ng-select, [class*="variant" i] [role="combobox"]').first();

  constructor(page: Page) {
    super(page);
  }

  async isShown(): Promise<boolean> {
    return (await this.confirmDetails().count()) > 0;
  }

  /** True when the "Are these your vehicle details?" confirmation step is showing (text heuristic). */
  async isDetailsStep(): Promise<boolean> {
    const t = (await this.bodyText()).toLowerCase();
    return t.includes('are these your vehicle details')
      || (t.includes('get quotation') && /plate no|chassis|engine no|seat\b/.test(t));
  }

  /**
   * Wait until the flow settles after the home-page submit: quotation cards,
   * this details step, an error modal, or an error message — whichever first.
   */
  async waitUntilDetailsOrCards(timeoutMs = 60_000): Promise<void> {
    await this.poll(async () => {
      if (await hasAnyQuotationCard(this.page)) return true;
      if ((await this.confirmDetails().count()) > 0) return true;
      const modal = this.page.locator('app-info-modal').first();
      if ((await modal.count()) > 0 && await modal.isVisible().catch(() => false)) return true;
      const t = (await this.bodyText()).toLowerCase();
      return /are these your vehicle|vehicle not found|no record|invalid plate|something went wrong/.test(t);
    }, timeoutMs);
  }

  /**
   * Regression flow: wait for the component, tick declarations, click
   * "Get quotation". (Fixed settle delay — proven stable for the E2E run.)
   */
  async proceed(): Promise<void> {
    // Wait for the component to appear after the post-submit loading process
    console.log('   📋 Waiting for vehicle details page to load…');
    await this.confirmDetails().waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {
      console.log('   ⚠️  app-confirm-details not visible — continuing');
    });

    // Wait 5 seconds after the page loads before clicking
    console.log('   ⏳ Vehicle details page loaded — waiting 5 seconds…');
    await this.wait(5_000);

    await this.tickDeclarations();

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

  /**
   * Checker flow: pick the first variant (if a variant dropdown exists), tick
   * declarations, wait for the CTA to enable, then proceed.
   * Returns the variant label chosen ('' when no variant step was needed).
   * Throws when the page shows an error or has no proceed button.
   */
  async selectVariantAndProceed(): Promise<string> {
    const text = await this.bodyText();
    if (/not found|no record|vehicle not|unable to find|error/i.test(text)) {
      throw new Error(`Vehicle details error: ${text.slice(0, 200)}`);
    }

    let selectedVariant = '';

    // Variant dropdown. Only a real <select> or a variant-labelled custom
    // control — never generic nav dropdowns. Most cars have no variant,
    // so this is usually skipped instantly.
    const variantSelect = this.variantSelect();
    if ((await variantSelect.count()) > 0) {
      const optionEls = await variantSelect.locator('option').all();
      const valid: { value: string; label: string }[] = [];
      for (const o of optionEls) {
        const label = this.clean(await o.textContent() || '');
        const value = (await o.getAttribute('value')) ?? '';
        if (label && !/^(select|choose|--|please)/i.test(label) && value !== '') valid.push({ value, label });
      }
      if (valid.length > 0) {
        const pick = valid[0];
        selectedVariant = pick.label;
        console.log(`   🔧 Variant select: choosing "${pick.label}" (of ${valid.length})`);
        await variantSelect.selectOption(pick.value).catch(async () => {
          await variantSelect.selectOption({ label: pick.label }).catch(() => {});
        });
      }
    } else {
      const mat = this.variantCombo();
      if ((await mat.count()) > 0 && await mat.isVisible().catch(() => false)) {
        await mat.click().catch(() => {});
        const option = this.page.locator('mat-option, .ng-option, [role="option"]').first();
        if (await option.count().then(c => c > 0).catch(() => false)) {
          selectedVariant = this.clean(await option.textContent() || '');
          console.log(`   🔧 Variant dropdown: choosing "${selectedVariant}"`);
          await option.click().catch(() => {});
        }
      }
    }

    await this.tickDeclarations();

    // The "Get quotation" CTA starts disabled while the details validate.
    // Wait until it's enabled before clicking (avoids a wasted no-op click).
    const ctaSel = 'button:has-text("Get quotation")';
    await this.poll(async () => {
      const c = this.page.locator(ctaSel).last();
      return (await c.count()) > 0 && await c.isEnabled().catch(() => false);
    }, 12_000, 150);

    // Prefer the explicit "Get quotation" CTA; fall back to the primary button.
    let proceed = this.page.locator(ctaSel);
    if ((await proceed.count()) === 0) proceed = this.page.locator('button.primary-btn');
    const target = proceed.last();
    if ((await target.count()) > 0) {
      const label = this.clean(await target.textContent().catch(() => '') || 'Get quotation');
      console.log(`   ➡️  Clicking proceed: "${label}"`);
      await target.scrollIntoViewIfNeeded().catch(() => {});
      // Real click first (proper mouse events that Angular needs); then force; then JS.
      await target.click({ timeout: 8000 }).catch(async () => {
        await target.click({ force: true, timeout: 4000 }).catch(async () => {
          await target.evaluate((el: HTMLElement) => el.click()).catch(() => {});
        });
      });
      return selectedVariant;
    }
    console.log('   ⚠️  No proceed button found on vehicle details page');
    throw new Error('Could not find proceed button on vehicle details page');
  }

  /** Tick any declaration checkbox that might gate the CTA. */
  private async tickDeclarations(): Promise<void> {
    const cbs = this.checkboxes();
    const count = await cbs.count();
    for (let i = 0; i < count; i++) {
      await cbs.nth(i).check({ force: true }).catch(() => {});
    }
  }
}
