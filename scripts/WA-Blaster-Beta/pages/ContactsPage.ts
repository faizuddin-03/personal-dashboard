import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Dealers / contacts list (/contacts) ─────────────────────
export class ContactsPage extends BasePage {
  // locators (private — specs never access these)
  private searchInput     = () => this.page.getByTestId('contacts-search');
  private addDealerName   = () => this.page.getByTestId('add-dealer-name');
  private addDealerPhone  = () => this.page.getByTestId('add-dealer-phone');
  private addDealerTier   = () => this.page.getByTestId('add-dealer-tier');
  private addDealerSpec   = () => this.page.getByTestId('add-dealer-vehicleSpecialization');
  private selectAllBox    = () => this.page.getByTestId('select-all');
  private saveAsSegmentBtn = () => this.page.getByTestId('save-as-segment');
  private saveSegmentBtn  = () => this.page.getByRole('button', { name: /^save$/i });

  // locator getters for spec assertions
  table              = () => this.page.getByTestId('contacts-table');
  rows               = () => this.page.locator('[data-testid^="contact-row-"]');
  rowByText          = (text: string) => this.rows().filter({ hasText: text }).first();
  addDealerButton    = () => this.page.getByTestId('add-dealer');
  addDealerError     = () => this.page.getByTestId('add-dealer-error');
  addDealerSubmit    = () => this.page.getByTestId('add-dealer-submit');
  selectionBar       = () => this.page.getByTestId('selection-bar');
  segmentNameInput   = () => this.page.getByTestId('segment-name-input');
  specializationChip = (name: string | RegExp) => this.page.getByRole('button', { name });

  constructor(page: Page) { super(page); }

  async search(term: string): Promise<void> {
    await this.searchInput().fill(term);
  }

  async clickSpecializationChip(name: string | RegExp): Promise<void> {
    await this.specializationChip(name).click();
  }

  /** Open the add-dealer modal, fill it, and submit. Tier/spec are optional. */
  async addDealer(dealer: { name: string; phone: string; tier?: string; spec?: string }): Promise<void> {
    await this.addDealerButton().click();
    await this.addDealerName().fill(dealer.name);
    await this.addDealerPhone().fill(dealer.phone);
    if (dealer.tier) await this.addDealerTier().selectOption(dealer.tier);
    if (dealer.spec) await this.addDealerSpec().selectOption(dealer.spec);
    await this.addDealerSubmit().click();
  }

  /** Resolve a contact row's id from its visible text (data-testid="contact-row-<id>"). */
  async contactIdOf(text: string): Promise<string> {
    const testId = await this.rowByText(text).getAttribute('data-testid');
    return testId!.replace('contact-row-', '');
  }

  async selectAll(): Promise<void> {
    await this.selectAllBox().check();
  }

  async saveAsSegment(): Promise<void> {
    await this.saveAsSegmentBtn().click();
  }

  async fillSegmentName(name: string): Promise<void> {
    await this.segmentNameInput().fill(name);
  }

  /** Confirm the save-as-segment dialog (the "Save" button). */
  async confirmSaveSegment(): Promise<void> {
    await this.saveSegmentBtn().click();
  }
}
