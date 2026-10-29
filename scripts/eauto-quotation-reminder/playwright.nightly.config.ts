import { defineConfig, devices } from '@playwright/test';

// Nightly quotation — the OVERNIGHT half of the EAINT-11864 split.
//
// Run it explicitly:   npx playwright test -c playwright.nightly.config.ts
//
// Separate config, separate testDir. The interactive suite's config
// (playwright.config.ts) has testDir './tests', so it never sees tests-nightly/
// and this never sees tests/. That matters because the dashboard route spawns
// `playwright test --grep <titles>` against the DEFAULT config with no
// --project filter: without the split, every dashboard run would become a
// candidate for the nightly spec.
//
// Nothing in the interactive config is changed by this file.
export default defineConfig({
  testDir: './tests-nightly',
  testMatch: '**/*.spec.ts',

  // Real JPJ and insurer calls behind every step. Generous but bounded — an
  // unattended job must fail rather than hang until the Actions job timeout.
  timeout: 15 * 60_000,

  // One retry on CI. Staging hiccups are common and a missed night cannot be
  // redone; repeating is harmless (a second quotation for the same vehicle is
  // still just an unpurchased quotation).
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    // Headless by default — there is no display on a runner. Set NQ_HEADED=1
    // to watch it locally, which is how this gets proven before the cron is
    // switched on. Never set NQ_HEADED in CI.
    headless: process.env.NQ_HEADED !== '1',
    viewport: { width: 1920, height: 1080 },
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'nightly-quotation',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
