import { Page } from '@playwright/test';

const POLL_INTERVAL = 200;
const STEP_TIMEOUT  = 30_000;

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  protected clean(s: string): string {
    return s.replace(/[\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  protected async poll(
    fn: () => Promise<boolean>,
    timeout = STEP_TIMEOUT,
    interval = POLL_INTERVAL,
  ): Promise<boolean> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await fn()) return true;
      await this.page.waitForTimeout(interval);
    }
    return false;
  }

  protected async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  protected async bodyText(): Promise<string> {
    return this.page.locator('body').innerText().catch(() => '');
  }

  /**
   * Detect and dismiss any error modal (app-info-modal).
   * Returns the modal's title/message if one was found, or null if none.
   */
  async checkAndDismissErrorModal(): Promise<string | null> {
    const modal = this.page.locator('app-info-modal').first();
    if ((await modal.count()) === 0 || !await modal.isVisible().catch(() => false)) return null;

    const title = this.clean(await modal.locator('h5.title, h5, h4').first().textContent().catch(() => '') || '');
    const sub   = this.clean(await modal.locator('h6').first().textContent().catch(() => '') || '');
    const msg   = [title, sub].filter(Boolean).join(' — ') || 'Error modal detected';

    console.log(`   🚫 Error modal: "${msg}"`);

    // Dismiss: prefer the OK button, fall back to the ✕ close button
    const ok = modal.locator('button:has-text("OK"), button:has-text("Ok"), button:has-text("ok")').first();
    if ((await ok.count()) > 0) {
      await ok.click().catch(() => {});
    } else {
      const close = modal.locator('button.close, button:has-text("×"), button:has-text("✕")').first();
      await close.click().catch(() => {});
    }
    await this.wait(300);
    return msg;
  }
}
