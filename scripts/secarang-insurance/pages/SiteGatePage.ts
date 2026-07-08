import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SiteGatePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async passSiteGate(sitePassword: string): Promise<void> {
    const pwField = this.page.locator('input[type="password"]').first();
    const hasGate = await this.poll(async () =>
      (await pwField.count()) > 0 || (await this.page.locator('button:has-text("Car")').count()) > 0,
      5_000,
    );
    if (!hasGate || (await pwField.count()) === 0) return;

    console.log('   🔒 Password gate — entering…');
    await pwField.fill(sitePassword);
    const submit = this.page.locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Enter"), button:has-text("Login"), button:has-text("Access")').first();
    if ((await submit.count()) > 0) await submit.click();
    else await pwField.press('Enter');
    await this.page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => {});
    await this.wait(500);
  }
}
