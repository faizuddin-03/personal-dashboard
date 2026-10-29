import { defineConfig, devices } from '@playwright/test';

// EAINT-12153 — UCD onboarding payment channels. Each TS gets its own
// project scoped to its own spec file via testMatch, same convention as
// scripts/eauto-edereg-precheck/playwright.config.ts — keeps a future
// dashboard run route's single-test PROGRESS:/RESULT: parsing simple (one
// test per run) if/when this gets wired up the same way.
//
// TS1/TS2 (FPX B2B) are deliberately absent — being reworked separately for
// the B2B pending-approval flow (REQ-004-007). TS7/TS8 (QR Code) have
// projects here for completeness but their specs are `test.skip` — the
// sheet has no steps for them yet.

export default defineConfig({
  testDir: './tests',

  timeout: 0,
  retries: 0,
  workers: 1,

  reporter: [['list']],

  use: {
    headless: false,
    viewport: { width: 1920, height: 1080 },
    navigationTimeout: 60000,
    actionTimeout: 30000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    { name: 'ts3', testMatch: 'ts3.spec.ts', use: { ...devices['Desktop Chrome'], headless: false } },
    { name: 'ts4', testMatch: 'ts4.spec.ts', use: { ...devices['Desktop Chrome'], headless: false } },
    { name: 'ts5', testMatch: 'ts5.spec.ts', use: { ...devices['Desktop Chrome'], headless: false } },
    { name: 'ts6', testMatch: 'ts6.spec.ts', use: { ...devices['Desktop Chrome'], headless: false } },
    { name: 'ts7', testMatch: 'ts7.spec.ts', use: { ...devices['Desktop Chrome'], headless: false } },
    { name: 'ts8', testMatch: 'ts8.spec.ts', use: { ...devices['Desktop Chrome'], headless: false } },
  ],
});
