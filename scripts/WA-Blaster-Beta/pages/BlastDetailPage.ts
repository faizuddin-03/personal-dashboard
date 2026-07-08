import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Blast detail page (/blasts/:id) ─────────────────────────
export class BlastDetailPage extends BasePage {
  // locators (private — specs never access these)
  private recipientStatusChip = (name: string) =>
    this.recipientStatusFilter().getByRole('button', { name });
  private retryAllFailedBtn   = () => this.page.getByTestId('retry-all-failed');

  // locator getters for spec assertions
  counters              = () => this.page.getByTestId('blast-counters');
  counterSent           = () => this.page.getByTestId('counter-sent');
  counterDelivered      = () => this.page.getByTestId('counter-delivered');
  counterRead           = () => this.page.getByTestId('counter-read');
  counterFailed         = () => this.page.getByTestId('counter-failed');
  recipientsTable       = () => this.page.getByTestId('recipients-table');
  recipientStatusFilter = () => this.page.getByTestId('recipient-status-filter');
  retryMessageFirst     = () => this.page.getByTestId('retry-message').first();
  retryAllFailed        = () => this.retryAllFailedBtn();
  cancelButton          = () => this.page.getByTestId('blast-cancel');

  constructor(page: Page) { super(page); }

  /** Click a status chip inside the recipient status filter (e.g. 'Failed'). */
  async clickRecipientStatusChip(name: string): Promise<void> {
    await this.recipientStatusChip(name).click();
  }

  /** Cancel a SCHEDULED blast — accepts the confirm dialog first. */
  async cancelBlast(): Promise<void> {
    this.acceptNextDialog();
    await this.cancelButton().click();
  }
}
