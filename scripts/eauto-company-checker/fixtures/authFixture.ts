import { test as base, BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CompanyListingPage } from '../pages/CompanyListingPage';
import { getUser } from '../data/users';
import { CONFIG } from '../data/config';

// ── Auth fixture ────────────────────────────────────────────
// ONE login for the whole run, however many workers are checking rows in
// parallel. `authedContext` logs in exactly once on a throwaway bootstrap
// page, then `newWorkerSession` hands out additional PAGES within that SAME
// BrowserContext — cookies live at the context level, so every extra page
// is already authenticated and just navigates straight to the listing.
// Per Faizuddin, 2026-09-02: bring back concurrent workers, but never make
// a worker log in on its own.

export interface AuthSession {
  listingPage: CompanyListingPage;
}

type AuthFixtures = {
  authedContext: BrowserContext;
  newWorkerSession: () => Promise<AuthSession>;
};

export const test = base.extend<AuthFixtures>({
  authedContext: async ({ browser }, use) => {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

    const bootstrapPage = await ctx.newPage();
    bootstrapPage.setDefaultNavigationTimeout(CONFIG.navigationTimeout);
    bootstrapPage.setDefaultTimeout(30000);
    const creds = getUser('bo');
    await new LoginPage(bootstrapPage).login(creds);
    await bootstrapPage.close();

    await use(ctx);
    await ctx.close().catch(() => { /* already closed */ });
  },

  newWorkerSession: async ({ authedContext }, use) => {
    const pages: Page[] = [];

    const factory = async (): Promise<AuthSession> => {
      const page = await authedContext.newPage();
      pages.push(page);
      page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);
      page.setDefaultTimeout(30000);

      const listingPage = new CompanyListingPage(page);
      await listingPage.goto(); // already authenticated via the shared context — no login here
      return { listingPage };
    };

    await use(factory);

    for (const page of pages) {
      await page.close().catch(() => { /* already closed */ });
    }
  },
});

export { expect } from '@playwright/test';
