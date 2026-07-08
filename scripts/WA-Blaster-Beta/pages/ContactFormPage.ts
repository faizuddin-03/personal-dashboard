import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Contact create/edit form (/contacts/new, /contacts/:id) ─
export class ContactFormPage extends BasePage {
  // locators (private — specs never access these)
  private phoneInput      = () => this.page.getByTestId('contact-phone');
  private nameInput       = () => this.page.getByTestId('contact-name');
  private ethnicitySelect = () => this.page.getByTestId('contact-ethnicity');
  private languageSelect  = () => this.page.getByTestId('contact-language');
  private stateSelect     = () => this.page.getByTestId('contact-state');
  private optinSelect     = () => this.page.getByTestId('contact-optin');
  private submitBtn       = () => this.page.getByTestId('contact-submit');
  private deleteBtn       = () => this.page.getByTestId('contact-delete');

  // locator getters for spec assertions
  form = () => this.page.getByTestId('contact-form');

  constructor(page: Page) { super(page); }

  async gotoNew(): Promise<void> {
    await this.page.goto('/contacts/new');
  }

  async gotoEdit(id: string): Promise<void> {
    await this.page.goto(`/contacts/${id}`);
  }

  async fillPhone(phone: string): Promise<void> {
    await this.phoneInput().fill(phone);
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput().fill(name);
  }

  async selectEthnicity(value: string): Promise<void> {
    await this.ethnicitySelect().selectOption(value);
  }

  async selectLanguage(value: string): Promise<void> {
    await this.languageSelect().selectOption(value);
  }

  async selectState(value: string): Promise<void> {
    await this.stateSelect().selectOption(value);
  }

  async selectOptin(value: string): Promise<void> {
    await this.optinSelect().selectOption(value);
  }

  async submit(): Promise<void> {
    await this.submitBtn().click();
  }

  async deleteContact(): Promise<void> {
    await this.deleteBtn().click();
  }
}
