import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  timeout: 0,
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    headless: false,
    viewport: { width: 1920, height: 1080 },
    navigationTimeout: 90000,
    actionTimeout: 30000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'secarang-checker',
      use: { ...devices['Desktop Chrome'], headless: false },
      testMatch: '**/secarang-checker.spec.ts',
    },
    {
      name: 'secarang-regression',
      // video only on this project — the checker runs many vehicles in parallel
      // contexts and recording all of them is pure overhead.
      use: { ...devices['Desktop Chrome'], headless: false, video: 'on' },
      testMatch: '**/secarang-regression.spec.ts',
    },
  ],
});
