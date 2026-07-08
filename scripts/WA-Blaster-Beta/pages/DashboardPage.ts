import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Dashboard (/) ───────────────────────────────────────────
export class DashboardPage extends BasePage {
  // locator getters for spec assertions
  title           = () => this.page.getByTestId('dashboard-title');
  currentUser     = () => this.page.getByTestId('current-user');
  kpiAutoHandled  = () => this.page.getByText('Auto-handled today').first();

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}
