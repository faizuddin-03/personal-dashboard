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
    // The site gate is a password box on its own. A page that also has a
    // text / tel box is a real form — the Fiuu card form (CVV is a password
    // box) or the bank simulator login — and must not get the site password
    // (live 2026-10-19: "Please fill in required credit card details").
    const otherBoxes = await this.page.locator('input[type="text"]:visible, input[type="tel"]:visible, input[type="email"]:visible').count();
    if (otherBoxes > 0) return;

    console.log('   🔒 Password gate — entering…');
    await pwField.fill(sitePassword);
    const submit = this.page.locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Enter"), button:has-text("Login"), button:has-text("Access")').first();
    if ((await submit.count()) > 0) await submit.click();
    else await pwField.press('Enter');
    await this.page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => {});
    await this.wait(500);
  }
}
