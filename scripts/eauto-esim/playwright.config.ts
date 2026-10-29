import { defineConfig, devices } from '@playwright/test';

// eSIM is served over HTTPS from a bare internal IP, so its certificate never
// matches a hostname — ignoreHTTPSErrors is required, not optional. It is also
// only reachable on the VPN; the dashboard asks the user to confirm that before
// spawning this suite.
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  timeout: 5 * 60 * 1000,
  retries: 0,
  workers: 1,

  reporter: [['list']],

  use: {
    headless: process.env.ESIM_HEADLESS === '1',
    ignoreHTTPSErrors: true,
    viewport: { width: 1600, height: 950 },
    navigationTimeout: 45_000,
    actionTimeout: 20_000,
    screenshot: 'only-on-failure',
    // No video. This is a data-setup tool, not a test — there is no evidence to
    // produce. A screenshot on failure is kept because it costs nothing and is
    // the fastest way to see where a run stopped.
    video: 'off',
  },

  projects: [
    {
      name: 'esim',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
