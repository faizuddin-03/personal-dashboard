import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Campaigns / blasts list (/blasts) ───────────────────────
export class CampaignsPage extends BasePage {
  // locators (private — specs never access these)
  private statusFilterChip = (name: string) =>
    this.statusFilter().getByRole('button', { name });

  // locator getters for spec assertions
  heading        = () => this.page.getByRole('heading', { name: 'Campaigns' });
  newBlastButton = () => this.page.getByTestId('new-blast');
  statusFilter   = () => this.page.getByTestId('status-filter');
  blastRows      = () => this.page.locator('[data-testid^="blast-row-"]');

  constructor(page: Page) { super(page); }

  /** Click a status chip inside the status filter (e.g. 'Sending'). */
  async clickStatusChip(name: string): Promise<void> {
    await this.statusFilterChip(name).click();
  }

  async openFirstBlast(): Promise<void> {
    await this.blastRows().first().click();
  }
}
