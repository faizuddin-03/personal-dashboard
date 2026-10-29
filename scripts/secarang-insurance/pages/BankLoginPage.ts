import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SiteGatePage } from './SiteGatePage';

export class BankLoginPage extends BasePage {
  constructor(popup: Page) {
    super(popup);
  }

  async login(sitePassword: string, username: string, password: string): Promise<void> {
    // The staging gateway sometimes shows the same site password gate
    const siteGate = new SiteGatePage(this.page);
    await siteGate.passSiteGate(sitePassword);
    await this.wait(1000);

    // Wait for a login form (username + password fields)
    const loginAppeared = await this.poll(async () =>
      (await this.page.locator('input[type="text"], input[type="email"], input[name*="user" i], input[id*="user" i]').count()) > 0 &&
      (await this.page.locator('input[type="password"]').count()) > 0,
    );
    if (!loginAppeared) throw new Error('Bank login page did not appear');

    // Log what's on the page before filling
    const snippet = (await this.page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 300);
    console.log(`   🔑 Bank login page: "${snippet}"`);

    // Fill username
    const usernameField = this.page.locator(
      'input[name*="user" i], input[id*="user" i], input[placeholder*="user" i], input[type="text"]'
    ).first();
    await usernameField.scrollIntoViewIfNeeded().catch(() => {});
    await usernameField.click();
    await usernameField.fill(username);
    await this.wait(500);
    console.log(`   ✏️  Username: "${username}"`);

    // Fill password
    const passwordField = this.page.locator('input[type="password"]').first();
    await passwordField.scrollIntoViewIfNeeded().catch(() => {});
    await passwordField.click();
    await passwordField.fill(password);
    await this.wait(500);
    console.log('   ✏️  Password: [filled]');

    // Click Login / Sign In / Submit
    for (const label of ['Login', 'Log In', 'Sign In', 'Submit', 'Enter']) {
      const btn = this.page.locator(`button:has-text("${label}"), input[type="submit"][value*="${label}" i]`).first();
      if ((await btn.count()) > 0 && await btn.isVisible().catch(() => false)) {
        console.log(`   🖱️  Clicking "${label}"`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click();
        await this.wait(1000);
        return;
      }
    }
    // Fallback: press Enter on password field
    console.log('   🖱️  No Login button found — pressing Enter on password field');
    await passwordField.press('Enter');
    await this.wait(1000);
  }
}
