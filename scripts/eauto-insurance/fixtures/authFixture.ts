import { test as base, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { EnquiryPage } from '../pages/EnquiryPage';
import { getUser } from '../data/users';
import { CONFIG } from '../data/config';

// ── Auth fixture ────────────────────────────────────────────
// Login lives here — one place, reused everywhere. The checker runs
// several parallel workers, so instead of a single authenticated page
// this fixture hands out a FACTORY that creates independently
// authenticated sessions (one browser context + login each).
// Teardown closes every context it created, even when the test fails.

export interface AuthSession {
  enquiryPage: EnquiryPage;
}

type AuthFixtures = {
  newAuthenticatedSession: () => Promise<AuthSession>;
};

export const test = base.extend<AuthFixtures>({
  newAuthenticatedSession: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];

    const factory = async (): Promise<AuthSession> => {
      const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      contexts.push(ctx);
      const page = await ctx.newPage();
      page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);
      page.setDefaultTimeout(30000);

      const creds = getUser('bo');
      const loginPage = new LoginPage(page);
      await loginPage.login(creds);

      return { enquiryPage: new EnquiryPage(page, loginPage, creds) };
    };

    await use(factory);

    // Teardown: always runs, even if the test fails
    for (const ctx of contexts) {
      await ctx.close().catch(() => { /* already closed */ });
    }
  },
});

export { expect } from '@playwright/test';
