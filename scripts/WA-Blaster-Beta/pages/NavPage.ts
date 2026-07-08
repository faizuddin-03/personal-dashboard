import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── App chrome: sidebar, user menu, keyboard nav, help ──────
export class NavPage extends BasePage {
  // locators (private — specs never access these)
  private userMenuBtn = () => this.page.locator('button.usermenu');
  private logoutBtn   = () => this.page.getByTestId('logout');
  private navLink     = (name: string) => this.page.getByRole('link', { name });

  // locator getters for spec assertions
  inboxBadge        = () => this.page.getByTestId('sidebar-inbox-badge');
  helpButton        = () => this.page.getByTestId('help-button');
  shortcutsOverlay  = () => this.page.getByTestId('shortcuts-overlay');

  constructor(page: Page) { super(page); }

  async openLink(name: string): Promise<void> {
    await this.navLink(name).click();
  }

  async logout(): Promise<void> {
    await this.userMenuBtn().click();
    await this.logoutBtn().click();
  }

  /** g→<key> style keyboard navigation (e.g. gotoByKeyboard('i') for Inbox). */
  async gotoByKeyboard(key: string): Promise<void> {
    await this.page.keyboard.press('g');
    await this.page.keyboard.press(key);
  }

  async openHelpOverlay(): Promise<void> {
    await this.helpButton().click();
  }

  async pressEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
