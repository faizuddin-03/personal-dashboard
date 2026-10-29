import { defineConfig, devices } from '@playwright/test';

// Same demo-mode contract as tests/service-hub/playwright.config.ts and
// app/eauto/12166's run route — PW_HEADED / PW_VIDEO / PW_DETAILED, wired
// from the dashboard page's Headless/Detailed checkboxes.
const headed = process.env.PW_HEADED === '1';
const videoOn = process.env.PW_VIDEO === '1';
const detailedMode = process.env.PW_DETAILED === '1';
// Detailed mode adds a ~1400ms pause per highlighted step — same reasoning
// as service-hub's config: a login + search + multi-column read easily racks
// up enough highlighted steps to blow through a fixed 60s timeout.
//
// Raised 2026-10-03 (Faizuddin: bump the real-API payment wait to 5 minutes,
// see data/config.ts's paymentProcessingTimeout) — any TS that calls
// payNow() against a REAL JomCheck-API-connected environment (TS02/TS36/
// TS43) can now legitimately spend up to 5 minutes just polling for the
// payment to complete, which alone exceeds the old 60s/180s ceiling. Budget
// enough headroom above that for everything else in the flow (login,
// navigation, download, BO crosscheck, plus demo-mode step pauses).
const timeout = detailedMode ? 480_000 : 420_000;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  timeout,
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['json', { outputFile: process.env.PW_JSON_REPORT || '' }],
    // Emits the per-test step tree to PW_STEP_REPORT for the dashboard's
    // step-by-step pass/fail checklist (the json reporter omits steps) — same
    // convention as tests/service-hub/playwright.config.ts.
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
    // eSim (TS06-TS33 set-up) is served over HTTPS from a bare internal IP
    // whose certificate never matches — required since eSim now runs in the
    // test's own page (pages/EsimJomCheckPage.ts), not a separate process.
    ignoreHTTPSErrors: true,
    // ⚠ Passing `video` as a bare 'on'/'off' string lets Playwright pick its
    // OWN video size, which defaults to the viewport SCALED DOWN to fit an
    // 800x800 box — 1920x1080 becomes ~800x450, visibly pixelated next to
    // the actual 1920x1080 session. Confirmed live, 2026-10-03 (Faizuddin:
    // "even though my viewport is 1920x1080, the recording is pixelated").
    // Passing `size` explicitly, matching the real viewport below, forces
    // full-resolution recording with no silent downscale.
    video: videoOn ? { mode: 'on', size: { width: 1920, height: 1080 } } : 'off',
  },

  projects: [
    {
      name: 'jomcheck-checker',
      // devices["Desktop Chrome"] carries its own 1280x720 viewport, which
      // would silently override the 1920x1080 set at the top-level `use` —
      // set it here, after the spread, so it actually takes effect (same
      // trap tests/service-hub/playwright.config.ts already documents).
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
      testIgnore: '**/estm-invoice-12412.spec.ts',
    },
    {
      // 12412_TS12 — eSTM purchase through the MyKad emulator. The eSTM
      // authentication widget opens ws://localhost:7878 from the public
      // staging origin, which Chrome's Local Network Access checks block
      // ("Update Required" screen) — same fix as
      // scripts/eauto-edereg-precheck/playwright.config.ts
      // (knowledge/mykad-emulator.md). Kept to this one spec so no other
      // test runs with these flags.
      name: 'estm-emulator',
      testMatch: '**/estm-invoice-12412.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Same as scripts/eauto-edereg-precheck: always headed, 400 ms slowMo.
        headless: false,
        launchOptions: {
          slowMo: 400,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults,BlockInsecurePrivateNetworkRequests',
          ],
          ignoreDefaultArgs: ['--enable-automation'],
        },
      },
    },
  ],
});
