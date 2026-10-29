import { defineConfig, devices } from '@playwright/test';

// eSIM uses a bare internal IP with a self-signed certificate, so
// ignoreHTTPSErrors is required. VPN-only.
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
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
  },
  projects: [{ name: 'esim', use: { ...devices['Desktop Chrome'] } }],
});
