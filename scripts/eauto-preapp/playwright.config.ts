import { defineConfig, devices } from '@playwright/test';

// Same demo-mode contract as scripts/eauto-12107/playwright.config.ts —
// PW_HEADED / PW_VIDEO / PW_DETAILED, wired from the dashboard page's
// Headless / Detailed checkboxes (app/eauto/preapp/page.tsx). Copied from
// scripts/eauto-12153/playwright.config.ts (2026-10-21).
const headed = process.env.PW_HEADED === '1';
const videoOn = process.env.PW_VIDEO === '1';
const detailedMode = process.env.PW_DETAILED === '1';
// Pre-Application only (eSIM seed, reCAPTCHA by a person, one Fiuu payment): 20 min, 30 detailed.
const timeout = (detailedMode ? 30 : 20) * 60_000;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  timeout,
  retries: 0,
  // Every run spends a real company in eSIM and a sandbox payment — never parallel.
  workers: 1,

  reporter: [
    ['list'],
    ['json', { outputFile: process.env.PW_JSON_REPORT || '' }],
    ['./reporters/step-reporter.ts', {}],
  ],

  outputDir: process.env.PW_OUTPUT_DIR || './test-results',

  use: {
    headless: !headed,
    viewport: { width: 1920, height: 1080 },
    navigationTimeout: 90_000,
    actionTimeout: 30_000,
    // eSIM is HTTPS on a bare IP — the certificate can never match.
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    // ⚠ A bare 'on' downscales the recording to fit 800x800 (EAINT-12339,
    // 2026-10-03). The object form with an explicit size keeps 1920x1080.
    video: videoOn ? { mode: 'on', size: { width: 1920, height: 1080 } } : 'off',
  },

  projects: [
    {
      name: 'eauto-preapp',
      // devices["Desktop Chrome"] carries its own 1280x720 viewport — set it again after the spread.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true },
    },
  ],
});
