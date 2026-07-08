import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Templates list + draft form + AI wizard (/templates) ────
export class TemplatesPage extends BasePage {
  // locators (private — specs never access these)
  private addTemplateBtn      = () => this.page.getByTestId('add-template');
  private nameInput           = () => this.page.getByTestId('template-name');
  private categorySelect      = () => this.page.getByTestId('template-category');
  private bodyInput           = () => this.page.getByTestId('variant-body');
  private footerInput         = () => this.page.getByTestId('variant-footer');
  private addLanguageSelect   = () => this.page.getByTestId('add-language-select');
  private languageTab         = (lang: string) => this.page.getByTestId(`language-tab-${lang}`);
  private submitDraftBtn      = () => this.page.getByTestId('template-submit-draft');
  private briefInput          = () => this.page.getByTestId('wizard-brief');
  private generateBtn         = () => this.page.getByRole('button', { name: 'Generate suggestions' });
  private continueBtn         = () => this.page.getByRole('button', { name: 'Continue' });
  private editContentBtn      = () => this.page.getByTestId('wizard-edit-content');
  private editBodyEnInput     = () => this.page.getByTestId('wizard-edit-body-EN');
  private applyEditsBtn       = () => this.page.getByTestId('wizard-apply-edits');
  private saveDraftBtn        = () => this.page.getByTestId('wizard-save-draft');
  private closeWizardBtn      = () => this.page.getByLabel('close');

  // locator getters for spec assertions
  templateGroups   = () => this.page.locator('[data-testid^="template-group-"]');
  templateGroup    = (name: string) => this.page.getByTestId(`template-group-${name}`);
  statusFilterChip = (status: string) => this.page.getByTestId(`filter-status-${status}`);
  statusBadge      = (status: string) => this.page.getByTestId(`status-badge-${status}`);
  wizardName       = () => this.page.getByTestId('wizard-name');
  backdrop         = () => this.page.getByTestId('wizard-backdrop');

  constructor(page: Page) { super(page); }

  async clickStatusFilterChip(status: string): Promise<void> {
    await this.statusFilterChip(status).click();
  }

  async addTemplate(): Promise<void> {
    await this.addTemplateBtn().click();
  }

  async openTemplateGroup(name: string): Promise<void> {
    await this.templateGroup(name).click();
  }

  // ── Draft form ────────────────────────────────────────────

  async fillName(name: string): Promise<void> {
    await this.nameInput().fill(name);
  }

  async selectCategory(category: string): Promise<void> {
    await this.categorySelect().selectOption(category);
  }

  async fillBody(body: string): Promise<void> {
    await this.bodyInput().fill(body);
  }

  async fillFooter(footer: string): Promise<void> {
    await this.footerInput().fill(footer);
  }

  async addLanguage(lang: string): Promise<void> {
    await this.addLanguageSelect().selectOption(lang);
  }

  async openLanguageTab(lang: string): Promise<void> {
    await this.languageTab(lang).click();
  }

  async submitDraft(): Promise<void> {
    await this.submitDraftBtn().click();
  }

  // ── AI wizard ─────────────────────────────────────────────

  /** Intercept the AI generate call with a fixed suggestion payload. */
  async mockGenerateSuggestions(): Promise<void> {
    await this.page.route('**/templates/generate', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            language: 'EN',
            name: 'service_reminder',
            category: 'UTILITY',
            body: 'Hi {{1}}, your service is due on {{2}}.',
            variables: ['name', 'date'],
            approvalLikelihood: 'HIGH',
            rationale: 'Transactional reminder with clear variables.',
          },
        ]),
      }),
    );
  }

  async fillBrief(brief: string): Promise<void> {
    await this.briefInput().fill(brief);
  }

  async generateSuggestions(): Promise<void> {
    await this.generateBtn().click();
  }

  async continue(): Promise<void> {
    await this.continueBtn().click();
  }

  async fillWizardName(name: string): Promise<void> {
    await this.wizardName().fill(name);
  }

  async editContent(): Promise<void> {
    await this.editContentBtn().click();
  }

  async fillEditBodyEN(body: string): Promise<void> {
    await this.editBodyEnInput().fill(body);
  }

  async applyEdits(): Promise<void> {
    await this.applyEditsBtn().click();
  }

  async saveDraft(): Promise<void> {
    await this.saveDraftBtn().click();
  }

  async closeWizard(): Promise<void> {
    await this.closeWizardBtn().click();
  }
}
