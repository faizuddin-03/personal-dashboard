import { defineConfig, devices } from '@playwright/test';

// Same demo-mode contract as scripts/eauto-jomcheck/playwright.config.ts and
// app/eauto/12166's run route — PW_HEADED / PW_VIDEO / PW_DETAILED, wired
// from the dashboard page's Headless/Detailed checkboxes.
const headed = process.env.PW_HEADED === '1';
const videoOn = process.env.PW_VIDEO === '1';
const detailedMode = process.env.PW_DETAILED === '1';
// A full Secarang purchase (home form → vehicle details → quotation cards →
// add-ons → confirmation → Fiuu sandbox popup → success page → receipt PDF)
// is ~25 highlighted steps; quotation cards alone can take a minute on
// staging. Detailed mode adds ~1.4s per step.
const timeout = detailedMode ? 480_000 : 360_000;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  timeout,
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['json', { outputFile: process.env.PW_JSON_REPORT || '' }],
    // Per-test step tree for the dashboard's step list (the json reporter
    // omits steps) — same convention as every other eauto-* project.
    ['./reporters/step-reporter.ts', {}],
  ],

  outputDir: process.env.PW_OUTPUT_DIR || './test-results',

  use: {
    headless: !headed,
    viewport: { width: 1920, height: 1080 },
    navigationTimeout: 90000,
    actionTimeout: 30000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    // ⚠ A bare 'on' lets Playwright downscale the recording to fit 800x800
    // (confirmed 2026-10-03, EAINT-12339). The object form with an explicit
    // size matching the viewport records at full resolution.
    video: videoOn ? { mode: 'on', size: { width: 1920, height: 1080 } } : 'off',
  },

  projects: [
    {
      name: 'secarang-12107',
      // devices["Desktop Chrome"] carries its own 1280x720 viewport which
      // silently overrides the top-level one — set it again after the spread.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
  ],
});
