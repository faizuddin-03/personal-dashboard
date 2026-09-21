import { defineConfig, devices } from '@playwright/test';

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
    video: 'on',

    // Precautionary, not proven necessary the way it is for eSTM (see that
    // suite's own config comment) — this flow's jQuery UI dialogs confirm
    // with a plain "Yes" label that doesn't collide with any page control's
    // own text (ENQUIRE NOW / NEXT), so the eSTM race shouldn't reproduce
    // here. Kept anyway to give jQuery time to render each dialog before the
    // next locator call runs.
    //
    // launchOptions below chase the Deregistration MyKad screens' "Dermalog
    // Biometric Device — Update Required" gate — see knowledge/
    // mykad-emulator.md § "Update Required" gate for the full history
    // (browser-binary and navigator.webdriver theories were both tried and
    // ruled out before this one). Confirmed 2026-08-22 root cause: Chrome's
    // console showed `net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS` —
    // the AATF page's own script (mykad-websocket-v2.js) tries to open
    // `ws://localhost:7878/IDCard` from the public `staging.eauto.my`
    // origin, and Chrome's Local Network Access feature blocks that
    // connection outright unless the origin has been granted permission.
    // `--disable-blink-features=AutomationControlled` +
    // `ignoreDefaultArgs: ['--enable-automation']` are kept — they fixed a
    // real, separate `navigator.webdriver` tell — but neither one touches
    // this. The `--disable-features=...` list below disables LNA
    // enforcement for the test run; multiple candidate feature names are
    // listed since Chrome has renamed this feature across versions and an
    // unrecognized name is a silent no-op.
    launchOptions: {
      slowMo: 400,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults,BlockInsecurePrivateNetworkRequests',
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    },
  },

  // Each ticket case gets its own project, scoped to its own spec file via
  // testMatch — otherwise a bare '**/*.spec.ts' testDir match runs every spec
  // together under whichever project name is picked, mangling the dashboard
  // route's single-test PROGRESS:/RESULT: parsing (app/api/eauto-edereg-precheck/
  // run/route.ts assumes exactly one test per run).
  projects: [
    {
      name: 'edereg-precheck',
      testMatch: 'edereg-precheck.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-vehicle-not-exist',
      testMatch: 'edereg-precheck-vehicle-not-exist.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-rhb-api-down',
      testMatch: 'edereg-precheck-rhb-api-down.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts3',
      testMatch: 'edereg-precheck-ts3-jpj-error.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-step2-first-approved',
      testMatch: 'edereg-precheck-step2-first-approved.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-step2-first-vehicle-not-exist',
      testMatch: 'edereg-precheck-step2-first-vehicle-not-exist.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-step2-first-retry-approved',
      testMatch: 'edereg-precheck-step2-first-retry-approved.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts4-part1',
      testMatch: 'edereg-precheck-ts4-part1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts4-part2',
      testMatch: 'edereg-precheck-ts4-part2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts5-part1',
      testMatch: 'edereg-precheck-ts5-part1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts5-part2',
      testMatch: 'edereg-precheck-ts5-part2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts6-part1',
      testMatch: 'edereg-precheck-ts6-part1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts6-part2',
      testMatch: 'edereg-precheck-ts6-part2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts10-part1',
      testMatch: 'edereg-precheck-ts10-part1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts10-part2',
      testMatch: 'edereg-precheck-ts10-part2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts11-part1',
      testMatch: 'edereg-precheck-ts11-part1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts11-part2',
      testMatch: 'edereg-precheck-ts11-part2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts12-part1',
      testMatch: 'edereg-precheck-ts12-part1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ts12-part2',
      testMatch: 'edereg-precheck-ts12-part2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-am',
      testMatch: 'edereg-precheck-am.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-of',
      testMatch: 'edereg-precheck-of.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-of-ts5',
      testMatch: 'edereg-precheck-of-ts5.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-of-ts4',
      testMatch: 'edereg-precheck-of-ts4.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts1',
      testMatch: 'edereg-precheck-mu-ts1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts2',
      testMatch: 'edereg-precheck-mu-ts2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts3',
      testMatch: 'edereg-precheck-mu-ts3.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts4',
      testMatch: 'edereg-precheck-mu-ts4.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts5',
      testMatch: 'edereg-precheck-mu-ts5.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts6',
      testMatch: 'edereg-precheck-mu-ts6.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts7',
      testMatch: 'edereg-precheck-mu-ts7.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts8',
      testMatch: 'edereg-precheck-mu-ts8.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts9',
      testMatch: 'edereg-precheck-mu-ts9.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts9b',
      testMatch: 'edereg-precheck-mu-ts9b.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts10',
      testMatch: 'edereg-precheck-mu-ts10.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts11',
      testMatch: 'edereg-precheck-mu-ts11.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-mu-ts12',
      testMatch: 'edereg-precheck-mu-ts12.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-cj-ts1-part1',
      testMatch: 'edereg-precheck-cj-ts1-part1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-cj-ts1-part2',
      testMatch: 'edereg-precheck-cj-ts1-part2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-cj-ts2-part1',
      testMatch: 'edereg-precheck-cj-ts2-part1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-cj-ts2-part2',
      testMatch: 'edereg-precheck-cj-ts2-part2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-cj-ts3-part1',
      testMatch: 'edereg-precheck-cj-ts3-part1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-cj-ts3-part2',
      testMatch: 'edereg-precheck-cj-ts3-part2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-cj-ts4-part1',
      testMatch: 'edereg-precheck-cj-ts4-part1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-cj-ts4-part2',
      testMatch: 'edereg-precheck-cj-ts4-part2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-cj-ts5-part1',
      testMatch: 'edereg-precheck-cj-ts5-part1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-cj-ts5-part2',
      testMatch: 'edereg-precheck-cj-ts5-part2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ec-ts1',
      testMatch: 'edereg-precheck-ec-ts1.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ec-ts2',
      testMatch: 'edereg-precheck-ec-ts2.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ec-ts4',
      testMatch: 'edereg-precheck-ec-ts4.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-ec-ts5',
      testMatch: 'edereg-precheck-ec-ts5.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      name: 'edereg-precheck-custom',
      testMatch: 'edereg-precheck-custom.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
    {
      // "JPJ Code Checker" tab — a data-gathering sweep over ~100 JPJ
      // response codes, not a test case. `video: 'off'` overrides the
      // top-level `use.video: 'on'` deliberately: this run can last hours
      // and a single continuous recording of it would be enormous and of no
      // evidential value (the deliverable is the code -> note table it
      // writes to jpj-code-results.json, not a film of 100 popups).
      name: 'edereg-precheck-jpj-codes',
      testMatch: 'edereg-precheck-jpj-code-checker.spec.ts',
      use: { ...devices['Desktop Chrome'], headless: false, video: 'off' },
    },
  ],
});
