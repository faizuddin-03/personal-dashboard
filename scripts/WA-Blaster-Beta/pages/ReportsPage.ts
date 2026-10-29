import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Reports / analytics page (/reports) ─────────────────────
export class ReportsPage extends BasePage {
  // locators (private — specs never access these)
  private rangeChip = (name: string) => this.page.getByRole('button', { name });

  // locator getters for spec assertions
  deliveryFunnel = () => this.page.getByText('Delivery funnel');
  deliveryRate   = () => this.page.getByText('Delivery rate');
  demoDataNotice = () => this.page.getByText('Chart data is seeded demo analytics');

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto('/reports');
  }

  /** Click one of the date-range chips (e.g. '7 days', '30 days', '90 days'). */
  async clickRangeChip(name: string): Promise<void> {
    await this.rangeChip(name).click();
  }
}
