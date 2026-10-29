import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── CSV contact import (/contacts/import) ───────────────────
export class ContactImportPage extends BasePage {
  // locators (private — specs never access these)
  private csvFileInput      = () => this.page.getByTestId('csv-file');
  private backToContactsBtn = () => this.page.getByRole('button', { name: 'Back to contacts' });
  private cancelBtn         = () => this.page.getByRole('button', { name: 'Cancel' });

  // locator getters for spec assertions
  importForm       = () => this.page.getByTestId('import-form');
  csvSubmit        = () => this.page.getByTestId('csv-submit');
  importResult     = () => this.page.getByTestId('import-result');
  importErrors     = () => this.page.getByTestId('import-errors');
  importErrorItems = () => this.importErrors().locator('li');

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto('/contacts/import');
  }

  async setCsvFile(filePath: string): Promise<void> {
    await this.csvFileInput().setInputFiles(filePath);
  }

  async submitCsv(): Promise<void> {
    await this.csvSubmit().click();
  }

  async backToContacts(): Promise<void> {
    await this.backToContactsBtn().click();
  }

  async cancel(): Promise<void> {
    await this.cancelBtn().click();
  }
}
