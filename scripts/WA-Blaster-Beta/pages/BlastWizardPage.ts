import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Blast creation wizard (/blasts/new) ─────────────────────
export class BlastWizardPage extends BasePage {
  // locators (private — specs never access these)
  private templateSelect        = () => this.page.getByTestId('blast-template');
  private defaultLanguageSelect = () => this.page.getByTestId('blast-default-language');
  private variable1Select       = () => this.page.getByTestId('variable-1');
  private scheduledAtInput      = () => this.page.getByTestId('blast-scheduled-at');
  private continueBtn           = () => this.page.getByRole('button', { name: 'Continue' });
  private scheduleBtn           = () => this.page.getByRole('button', { name: 'Schedule' });

  // locator getters for spec assertions
  wizard             = () => this.page.getByTestId('blast-wizard');
  recipientsCount    = () => this.page.getByText(/\d+ recipients/);
  nameInput          = () => this.page.getByTestId('blast-name');
  createButton       = () => this.page.getByTestId('blast-create');
  formError          = () => this.page.getByTestId('blast-form-error');
  stateChip          = (name: string) => this.page.getByRole('button', { name });
  specializationChip = (name: string | RegExp) => this.page.getByRole('button', { name });

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto('/blasts/new');
  }

  async continue(): Promise<void> {
    await this.continueBtn().click();
  }

  async selectTemplate(template: string): Promise<void> {
    await this.templateSelect().selectOption(template);
  }

  async selectDefaultLanguage(language: string): Promise<void> {
    await this.defaultLanguageSelect().selectOption(language);
  }

  async selectVariable1(value: string): Promise<void> {
    await this.variable1Select().selectOption(value);
  }

  async clickStateChip(name: string): Promise<void> {
    await this.stateChip(name).click();
  }

  async clickSpecializationChip(name: string | RegExp): Promise<void> {
    await this.specializationChip(name).click();
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput().fill(name);
  }

  async clickSchedule(): Promise<void> {
    await this.scheduleBtn().click();
  }

  async fillScheduledAt(dateTime: string): Promise<void> {
    await this.scheduledAtInput().fill(dateTime);
  }

  async create(): Promise<void> {
    await this.createButton().click();
  }

  /**
   * Drive the wizard from /blasts/new through audience + template steps to
   * the review step (blast-name visible). Mirrors the old wizardToReview().
   */
  async toReview(seedTemplate: string): Promise<void> {
    await this.goto();
    await this.wizard().waitFor({ state: 'visible' });

    // Audience step — no state filter, targets all
    await this.recipientsCount().waitFor({ state: 'visible', timeout: 10_000 });
    await this.continue();

    // Template step
    await this.selectTemplate(seedTemplate);
    await this.selectDefaultLanguage('EN');
    await this.selectVariable1('contact.name');
    await this.continue();

    await this.nameInput().waitFor({ state: 'visible' });
  }
}
