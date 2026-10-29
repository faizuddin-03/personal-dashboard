import { defineConfig, devices } from '@playwright/test';

// Same demo-mode contract as scripts/eauto-12107/playwright.config.ts —
// PW_HEADED / PW_VIDEO / PW_DETAILED, wired from the dashboard page's
// Headless / Detailed checkboxes (app/eauto/12153/page.tsx).
const headed = process.env.PW_HEADED === '1';
const videoOn = process.env.PW_VIDEO === '1';
const detailedMode = process.env.PW_DETAILED === '1';
// One TS = one full onboarding chain: eSIM seed → reCAPTCHA (a person, up to
// E12153_GATE_MINUTES) → Pre-Application → Fiuu → BO approve → Application
// steps 1–3 → BO submit/approve (two BO users) → Registration Documents → BO
// Verified → registration fee → Fiuu → listing check. Staging pages take
// 10–20 s each; a failed-then-redo leg doubles a payment. 60 min ceiling.
const timeout = (detailedMode ? 75 : 60) * 60_000;

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
      name: 'eauto-12153',
      // devices["Desktop Chrome"] carries its own 1280x720 viewport — set it again after the spread.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true },
    },
  ],
});
