import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SiteGatePage } from './SiteGatePage';

export class BankLoginPage extends BasePage {
  constructor(popup: Page) {
    super(popup);
  }

  async login(sitePassword: string, username: string, password: string): Promise<void> {
    // The staging gateway sometimes shows the same site password gate
    // Only a password-only page is that gate: the Fiuu Bank Simulator's own
    // login also has a password box, and filling the site password there
    // gave "Wrong username or password" (live 2026-10-19).
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.wait(1000);
    const userBox = this.page.locator('input[type="text"], input[type="email"], input[name*="user" i], input[id*="user" i]');
    if ((await userBox.count()) === 0) {
      const siteGate = new SiteGatePage(this.page);
      await siteGate.passSiteGate(sitePassword);
      await this.wait(1000);
    }

    // Wait for a login form (username + password fields)
    const loginAppeared = await this.poll(async () =>
      (await this.page.locator('input[type="text"], input[type="email"], input[name*="user" i], input[id*="user" i]').count()) > 0 &&
      (await this.page.locator('input[type="password"]').count()) > 0,
    );
    if (!loginAppeared) throw new Error('Bank login page did not appear');

    // Log what's on the page before filling
    const snippet = (await this.page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 300);
    console.log(`   🔑 Bank login page: "${snippet}"`);

    const fields = await this.page.locator('input').evaluateAll(els => els.map(e => {
      const i = e as HTMLInputElement;
      return `${i.type}#${i.id || '-'}[${i.name || '-'}]${i.offsetParent ? '' : '(hidden)'}`;
    }));
    console.log(`   🔎 Bank login inputs: ${fields.join(', ')}`);

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
        await this.wait(1500);
        // The simulator answers a rejected login with an "Oops... Wrong
        // username or password" box (live 2026-10-19).
        if (await this.page.getByText(/wrong username or password/i).first().isVisible().catch(() => false)) {
          throw new Error(`FPX simulator rejected the login "${username}" — check the FPX simulator login on /eauto/12107`);
        }
        return;
      }
    }
    // Fallback: press Enter on password field
    console.log('   🖱️  No Login button found — pressing Enter on password field');
    await passwordField.press('Enter');
    await this.wait(1000);
  }
}
