import { defineConfig, devices } from '@playwright/test';

// Same demo-mode contract as scripts/eauto-jomcheck/playwright.config.ts (and
// tests/service-hub) — PW_HEADED / PW_VIDEO / PW_DETAILED, wired from the
// /eauto/12028 runner page's Headless / Detailed checkboxes.
const headed = process.env.PW_HEADED === '1';
const videoOn = process.env.PW_VIDEO === '1';
const detailedMode = process.env.PW_DETAILED === '1';
// A workflow TS logs in up to three roles and reads two tables; detailed mode
// adds ~1.4 s per highlighted step. TS that wait for month-close or a session
// timeout raise their own limit with test.setTimeout().
const timeout = detailedMode ? 15 * 60_000 : 10 * 60_000;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  // Checks the environment answers before any TS starts (automation lesson 19).
  globalSetup: require.resolve('./global-setup'),

  timeout,
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['json', { outputFile: process.env.PW_JSON_REPORT || '' }],
    // Per-test step tree for the dashboard (same as scripts/eauto-jomcheck).
    ['./reporters/step-reporter.ts', {}],
  ],

  outputDir: process.env.PW_OUTPUT_DIR || './test-results',

  use: {
    headless: !headed,
    viewport: { width: 1920, height: 1080 },
    navigationTimeout: 60000,
    actionTimeout: 30000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    acceptDownloads: true,
    // 12028_TS37 pastes a date from the clipboard, as a person would.
    permissions: ['clipboard-read', 'clipboard-write'],
    // Object form with an explicit size — the bare 'on' string downscales the
    // recording to fit 800x800 (scaffold skill §1, video-resolution trap).
    video: videoOn ? { mode: 'on', size: { width: 1920, height: 1080 } } : 'off',
  },

  projects: [
    {
      name: 'association-payment-listing',
      // Viewport set again after the spread — devices['Desktop Chrome'] carries
      // 1280x720 and would override the top-level value (scaffold skill §1).
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
  ],
});
