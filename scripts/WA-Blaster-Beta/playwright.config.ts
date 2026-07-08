import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  timeout: 40_000,
  expect: { timeout: 8_000 },
  retries: 0,
  globalSetup: './utils/setup',
  globalTeardown: './utils/teardown',
  reporter: [
    ['list'],
    ['json', { outputFile: path.resolve(__dirname, 'results', 'report.json') }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: {
      'ngrok-skip-browser-warning': 'true',
    },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
