import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PaymentTypePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async waitForPage(): Promise<void> {
    const appeared = await this.poll(async () =>
      (await this.page.locator('input[formcontrolname="paymentType"]').count()) > 0,
    );
    if (!appeared) throw new Error('Payment type options did not appear');
  }

  async selectFPX(): Promise<void> {
    const fpxLabel = this.page.locator('label').filter({ hasText: /FPX/i }).first();
    if ((await fpxLabel.count()) === 0 || !(await fpxLabel.isVisible().catch(() => false))) {
      throw new Error('FPX Online banking label not found');
    }
    console.log('   🖱️  Selecting "FPX Online banking"');
    await fpxLabel.scrollIntoViewIfNeeded().catch(() => {});
    await fpxLabel.click();
    await this.wait(1000);
  }

  async logAvailableBanks(): Promise<void> {
    await this.poll(async () =>
      (await this.page.locator('input[formcontrolname="bank"]').count()) > 0,
      10_000,
    );

    // Read bank names from img alt — desktop grid only to avoid responsive duplicates
    const bankInputs = this.page.locator('.d-md-block input[formcontrolname="bank"]');
    const bankCount = await bankInputs.count();
    console.log(`   🏦 ${bankCount} bank option(s) available:`);
    for (let i = 0; i < bankCount; i++) {
      const value = await bankInputs.nth(i).getAttribute('value').catch(() => '');
      const alt   = await bankInputs.nth(i).locator('xpath=ancestor::label//img').first().getAttribute('alt').catch(() => '');
      console.log(`      [${i + 1}] value="${value}" name="${alt}"`);
    }
  }

  async selectBank(bankValue: string): Promise<Page> {
    const bankLabels = this.page.locator('label').filter({
      has: this.page.locator(`input[formcontrolname="bank"][value="${bankValue}"]`),
    });
    let bankLabel: ReturnType<typeof this.page.locator> | null = null;
    for (let i = 0; i < await bankLabels.count(); i++) {
      if (await bankLabels.nth(i).isVisible().catch(() => false)) {
        bankLabel = bankLabels.nth(i);
        break;
      }
    }
    if (!bankLabel) throw new Error(`Bank "${bankValue}" not found or not visible`);

    const alt = await bankLabel.locator('img').getAttribute('alt').catch(() => bankValue);
    console.log(`   🖱️  Selecting bank: "${alt}" — waiting for popup…`);

    // Register listener BEFORE the click so the event is never missed
    const popupPromise = this.page.context().waitForEvent('page', { timeout: 30_000 });
    await bankLabel.scrollIntoViewIfNeeded().catch(() => {});
    await bankLabel.click();

    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded', { timeout: 90_000 }).catch(() => {});
    await popup.waitForTimeout(1500);
    console.log(`   🪟  Popup opened: ${popup.url()}`);

    return popup;
  }
}
