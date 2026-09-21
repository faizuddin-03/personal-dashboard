import { defineConfig, devices } from '@playwright/test';

// EAINT-11864. Cases wait out real cronjob hours, so there is no per-test
// timeout — the dashboard route owns the ceiling (4h) and kills the process.
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  timeout: 0,
  retries: 0,
  // Scenarios share one vehicle number and one staging quotation. Running them
  // concurrently would have them fight over the same record.
  workers: 1,

  reporter: [['list']],

  use: {
    headless: process.env.QR_HEADLESS === '1',
    viewport: { width: 1920, height: 1080 },
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
    screenshot: 'only-on-failure',
    video: 'on',
  },

  projects: [
    {
      name: 'quotation-reminder',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
