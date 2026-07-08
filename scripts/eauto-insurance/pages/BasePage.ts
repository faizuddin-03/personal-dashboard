import { Page } from '@playwright/test';
import { CONFIG } from '../data/config';

// ── Shared helpers every page object extends ───────────────
export class BasePage {
  constructor(protected readonly page: Page) {}

  /** Poll until "Working..." text disappears from the page. */
  protected async waitForWorkingDone(): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < CONFIG.maxWaitForResult) {
      const text = await this.page.locator('body').innerText().catch(() => '');
      if (!text.includes('Working...')) return;
      await this.page.waitForTimeout(CONFIG.pollingInterval);
    }
    console.log('   ⚠️ Timed out waiting for Working...');
  }

  /** Poll until a condition is true on the page (or maxWait elapses). */
  protected async waitForCondition(
    checkFn: () => Promise<boolean>,
    maxWait: number = CONFIG.maxWaitForResult,
  ): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      if (await checkFn()) return true;
      await this.page.waitForTimeout(CONFIG.pollingInterval);
    }
    return false;
  }

  protected async bodyText(): Promise<string> {
    return this.page.locator('body').innerText().catch(() => '');
  }

  async settleAfterLoad(): Promise<void> {
    await this.page.waitForTimeout(CONFIG.waitAfterPageLoad);
  }
}
