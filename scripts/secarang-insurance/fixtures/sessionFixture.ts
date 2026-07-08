import { test as base, BrowserContext, Page } from '@playwright/test';
import { CONFIG } from '../data/config';
import { REGRESSION } from '../data/regression';

// ── Session fixtures ────────────────────────────────────────
// Secarang has no user login — the closest thing is the staging site's
// password gate, which the flows pass via SiteGatePage (the regression run
// records it as an explicit reported step, so it stays in the flow).
// These fixtures centralise the session/browser-context setup instead:
//   • newCheckerSession — factory for parallel checker workers
//   • regressionPage    — a page pre-configured with the regression timeouts
// Teardown always runs, even when a test fails.

type SessionFixtures = {
  newCheckerSession: () => Promise<{ page: Page }>;
  regressionPage: Page;
};

export const test = base.extend<SessionFixtures>({
  newCheckerSession: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];

    const factory = async (): Promise<{ page: Page }> => {
      const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      contexts.push(ctx);
      // Clear any inherited Authorization header (site uses its own gate)
      await ctx.setExtraHTTPHeaders({ 'Authorization': '' });
      const page = await ctx.newPage();
      page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);
      page.setDefaultTimeout(30000);
      return { page };
    };

    await use(factory);

    for (const ctx of contexts) {
      await ctx.close().catch(() => { /* already closed */ });
    }
  },

  regressionPage: async ({ page }, use) => {
    page.setDefaultNavigationTimeout(REGRESSION.navTimeout);
    page.setDefaultTimeout(REGRESSION.stepTimeout);
    await use(page);
  },
});

export { expect } from '@playwright/test';
