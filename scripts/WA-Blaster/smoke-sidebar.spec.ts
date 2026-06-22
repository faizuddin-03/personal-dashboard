/**
 * SMOKE: Sidebar Navigation
 *
 * Logs in as admin, visits every sidebar page in sequence,
 * waits 5 seconds on the final page, then closes.
 *
 * Use this to confirm the app is reachable and credentials are correct
 * before running the full test suites.
 */
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!';

const NAV_LINKS = [
  'Dashboard',
  'Dealers',
  'Inbox',
  'Templates',
  'Campaigns',
  'Settings',
  'Knowledge',
];

test('smoke: login then visit all sidebar pages', async ({ page }) => {
  // Give plenty of time for 7 navigations + 5 s pause
  test.setTimeout(120_000);

  // Login
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();

  // Just confirm we left the login page (app may redirect to /dashboard or /)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

  // Visit each sidebar page in order
  for (const name of NAV_LINKS) {
    const link = page.getByRole('link', { name, exact: false }).first();
    await link.waitFor({ state: 'visible', timeout: 10_000 });
    await link.click();
    // domcontentloaded is reliable; networkidle can hang on apps with websockets/polling
    await page.waitForLoadState('domcontentloaded');
    console.log(`✓ ${name}`);
  }

  // Pause on the last page for 5 seconds before closing
  await page.waitForTimeout(5_000);
});
