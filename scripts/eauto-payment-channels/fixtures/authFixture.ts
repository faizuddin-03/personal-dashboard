import { test as base, BrowserContext } from '@playwright/test';
import { BoLoginPage } from '../pages/bo/BoLoginPage';
import { getBoUser, BoCredentials } from '../data/users';
import { CONFIG } from '../data/config';

// ── Auth fixture ────────────────────────────────────────────
// The UCD (Pre-Application/Application) side of every TS3-TS8 flow is
// PUBLIC — no login. Only the Continuation Steps' BO actions need a session,
// and they need TWO distinct named accounts (mfared, jasons — see
// data/users.ts) acting one after another, never concurrently, so this
// hands out one authenticated context per named BO role rather than a
// single shared session the way scripts/eauto-company-checker's workers do.

type AuthFixtures = {
  newBoSession: (role: BoCredentials['role']) => Promise<BrowserContext>;
};

export const test = base.extend<AuthFixtures>({
  newBoSession: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];

    const factory = async (role: BoCredentials['role']): Promise<BrowserContext> => {
      const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      contexts.push(ctx);
      const page = await ctx.newPage();
      page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);
      page.setDefaultTimeout(30000);

      await new BoLoginPage(page).login(getBoUser(role));

      return ctx;
    };

    await use(factory);

    for (const ctx of contexts) {
      await ctx.close().catch(() => { /* already closed */ });
    }
  },
});

export { expect } from '@playwright/test';
