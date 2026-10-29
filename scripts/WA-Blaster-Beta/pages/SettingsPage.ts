import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Settings (/settings): team, canned replies, languages ───
export class SettingsPage extends BasePage {
  // locators (private — specs never access these)
  private tab                 = (name: string) => this.page.getByRole('tab', { name });
  private inviteMemberBtn     = () => this.page.getByTestId('invite-member-btn');
  private newUserEmail        = () => this.page.getByTestId('new-user-email');
  private newUserName         = () => this.page.getByTestId('new-user-name');
  private newUserPassword     = () => this.page.getByTestId('new-user-password');
  private newUserRole         = () => this.page.getByTestId('new-user-role');
  private newUserSubmit       = () => this.page.getByTestId('new-user-submit');
  private resetPasswordInput  = () => this.page.getByTestId('reset-password-input');
  private resetPasswordSubmit = () => this.page.getByTestId('reset-password-submit');
  private addCannedReplyBtn   = () => this.page.getByTestId('add-canned-reply');
  private saveReplyBtn        = () => this.page.getByRole('button', { name: 'Save' });
  private stateLangSave       = (state: string) => this.stateRow(state).getByTestId('state-lang-save');
  private stateEditBtn        = (state: string) => this.stateRow(state).getByRole('button', { name: 'Edit' });
  private langOption          = (state: string, lang: string) =>
    this.multiselect(state).getByTestId(`state-lang-opt-${lang}`);

  // locator getters for spec assertions
  usersTable        = () => this.page.getByTestId('users-table');
  addUserForm       = () => this.page.getByTestId('add-user-form');
  addUserError      = () => this.page.getByTestId('add-user-error');
  userRow           = (email: string) => this.usersTable().locator('tr').filter({ hasText: email });
  resetPasswordForm = () => this.page.getByTestId('reset-password-form');
  cannedRepliesList = () => this.page.getByTestId('canned-replies-list');
  titleInput        = () => this.page.getByPlaceholder('Title');
  bodyInput         = () => this.page.getByPlaceholder('Reply body');
  addConfirm        = () => this.page.getByRole('button', { name: 'Add' });
  replyRowByText    = (text: string) =>
    this.cannedRepliesList().locator('div').filter({ hasText: text }).first();
  stateLangTable    = () => this.page.getByTestId('state-lang-table');
  stateRow          = (state: string) => this.page.getByTestId(`state-lang-row-${state}`);
  multiselect       = (state: string) => this.stateRow(state).getByTestId('state-lang-multiselect');
  stateLangText     = (state: string, lang: string) => this.stateRow(state).getByText(lang, { exact: true });

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto('/settings');
  }

  async openTab(name: string): Promise<void> {
    await this.tab(name).click();
  }

  // ── Team management ───────────────────────────────────────

  /** Open the invite form and submit a new team member (matches old inviteUser). */
  async inviteMember(email: string, name: string, password: string, role = 'OPERATOR'): Promise<void> {
    await this.inviteMemberBtn().click();
    await this.addUserForm().waitFor({ state: 'visible' });
    await this.newUserEmail().fill(email);
    await this.newUserName().fill(name);
    await this.newUserPassword().fill(password);
    await this.newUserRole().selectOption(role);
    await this.newUserSubmit().click();
  }

  async openResetPassword(email: string): Promise<void> {
    await this.userRow(email).getByRole('button', { name: 'Reset password' }).click();
  }

  async fillResetPassword(password: string): Promise<void> {
    await this.resetPasswordInput().fill(password);
  }

  async submitResetPassword(): Promise<void> {
    await this.resetPasswordSubmit().click();
  }

  /** Delete a team member — accepts the confirm dialog. */
  async deleteUser(email: string): Promise<void> {
    this.acceptNextDialog();
    await this.userRow(email).getByRole('button', { name: 'Delete' }).click();
  }

  // ── Canned replies ────────────────────────────────────────

  async clickAddCannedReply(): Promise<void> {
    await this.addCannedReplyBtn().click();
  }

  async fillCannedTitle(title: string): Promise<void> {
    await this.titleInput().fill(title);
  }

  async fillCannedBody(body: string): Promise<void> {
    await this.bodyInput().fill(body);
  }

  /** Clear the body field then fill it (edit flow). */
  async replaceCannedBody(body: string): Promise<void> {
    await this.bodyInput().clear();
    await this.bodyInput().fill(body);
  }

  async clickAddConfirm(): Promise<void> {
    await this.addConfirm().click();
  }

  async editReply(text: string): Promise<void> {
    await this.replyRowByText(text).getByRole('button', { name: 'Edit' }).click();
  }

  async saveReply(): Promise<void> {
    await this.saveReplyBtn().click();
  }

  /** Delete a canned reply row — accepts the confirm dialog. */
  async deleteReply(text: string): Promise<void> {
    this.acceptNextDialog();
    await this.replyRowByText(text).getByRole('button', { name: 'Delete' }).click();
  }

  // ── State → language mapping ──────────────────────────────

  async editState(state: string): Promise<void> {
    await this.stateEditBtn(state).click();
  }

  async checkLangOption(state: string, lang: string): Promise<void> {
    await this.langOption(state, lang).check();
  }

  async saveState(state: string): Promise<void> {
    await this.stateLangSave(state).click();
  }
}
