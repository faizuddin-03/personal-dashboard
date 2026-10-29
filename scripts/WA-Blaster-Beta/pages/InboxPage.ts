import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Inbox (/inbox): dual-mode ticket queue + agent assist ───
export class InboxPage extends BasePage {
  // locators (private — specs never access these)
  private dispositionBtn = (name: string) => this.page.getByTestId(`disposition-${name}`);
  private kbConfirmBtn   = () => this.page.getByTestId('kb-confirm');

  // locator getters for spec assertions
  autoRepliedButton = () => this.page.getByRole('button', { name: /auto.replied/i });
  needsHumanButton  = () => this.page.getByRole('button', { name: /needs.human/i });
  activeTab         = () => this.page.getByRole('button', { name: /^Active/i });
  closedTab         = () => this.page.getByRole('button', { name: /^Closed/i });
  resolveButton     = () => this.page.getByTestId('resolve-ticket');
  closeButton       = () => this.page.getByTestId('close-ticket');
  saveKbModal       = () => this.page.getByTestId('save-kb-modal');
  disposition       = (name: string) => this.dispositionBtn(name);
  kbConfirm         = () => this.kbConfirmBtn();
  suggestDraft      = () => this.page.getByTestId('suggest-draft');
  resolvedToast     = () => this.page.getByText('Ticket resolved');
  agentContextCard  = () => this.page.getByTestId('agent-context-card');
  savedReplies      = () => this.page.getByTestId('saved-replies');
  /** Empty-state copy for the Auto-replied mode (either variant). */
  autoRepliedEmptyState = () =>
    this.page.getByText(/no auto-replied conversations yet/i)
      .or(this.page.getByText(/fully auto-handled/i));
  /** First closed/resolved ticket card in the Closed tab. */
  closedTicketIndicator = () =>
    this.page.locator('[style*="border"]').filter({ hasText: /Closed|Resolved/i }).first();

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto('/inbox');
  }

  async clickAutoReplied(): Promise<void> {
    await this.autoRepliedButton().click();
  }

  async clickClosedTab(): Promise<void> {
    await this.closedTab().click();
  }

  async resolveTicket(): Promise<void> {
    await this.resolveButton().click();
  }

  async selectDisposition(name: string): Promise<void> {
    await this.dispositionBtn(name).click();
  }

  async confirmKb(): Promise<void> {
    await this.kbConfirmBtn().click();
  }
}
