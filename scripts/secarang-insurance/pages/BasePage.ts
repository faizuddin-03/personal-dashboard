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
  ): Promise<boolean> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await fn()) return true;
      await this.page.waitForTimeout(POLL_INTERVAL);
    }
    return false;
  }

  protected async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}
