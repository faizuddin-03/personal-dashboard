import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 40_000,
  expect: { timeout: 8_000 },
  retries: 0,
  globalTeardown: './helpers/teardown',
  reporter: [
    ['list'],
    // Absolute path so the reporter always writes to the right place
    // regardless of what cwd the runner inherits.
    ['json', { outputFile: path.resolve(__dirname, 'results', 'report.json') }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Bypass the ngrok browser-warning interstitial page.
    // Ignored by non-ngrok servers, so this is safe for all environments.
    extraHTTPHeaders: {
      'ngrok-skip-browser-warning': 'true',
    },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
