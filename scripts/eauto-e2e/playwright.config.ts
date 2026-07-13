import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

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
    // Record a video of the whole run — the server copies it into the
    // run's artifact folder after the context closes (see reporting.ts note).
    video: 'on',
  },

  projects: [
    {
      name: 'insurance-e2e',
      use: { ...devices['Desktop Chrome'], headless: false },
    },
  ],
});
