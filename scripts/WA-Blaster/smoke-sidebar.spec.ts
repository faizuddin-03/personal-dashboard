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
  // Login
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);

  // Visit each sidebar page in order
  for (const name of NAV_LINKS) {
    await page.getByRole('link', { name, exact: true }).click();
    await page.waitForLoadState('networkidle');
    console.log(`✓ ${name}`);
  }

  // Pause on the last page for 5 seconds before closing
  await page.waitForTimeout(5_000);
});
