import { Locator, Page } from '@playwright/test';

// ── Shared helpers all page objects extend ──────────────────
export class BasePage {
  constructor(protected readonly page: Page) {}

  /** Generic text locator for spec assertions — keeps page.getByText out of specs. */
  text(text: string | RegExp, opts?: { exact?: boolean }): Locator {
    return this.page.getByText(text, opts);
  }

  /** Generic role-button locator for one-off buttons that belong to no specific widget. */
  button(name: string | RegExp): Locator {
    return this.page.getByRole('button', { name });
  }

  url(): string {
    return this.page.url();
  }

  /** Full body text — for blank-screen smoke assertions in specs. */
  async bodyText(): Promise<string | null> {
    return this.page.locator('body').textContent();
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  /** Accept the next native dialog (confirm/alert) before a click triggers it. */
  acceptNextDialog(): void {
    this.page.once('dialog', (d) => d.accept());
  }

  /** Dismiss the next native dialog. */
  dismissNextDialog(): void {
    this.page.once('dialog', (d) => d.dismiss());
  }
}
