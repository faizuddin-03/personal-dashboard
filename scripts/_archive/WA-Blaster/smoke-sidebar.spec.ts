/**
 * SMOKE: Sidebar Navigation
 *
 * Logs in as admin, visits every sidebar page in sequence,
 * waits 5 seconds on the final page, then closes.
 *
 * Use this to confirm the app is reachable and credentials are correct
 * before running the full test suites.
 */
import { test, expect } from './helpers/fixtures';

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!';

// Order matches the actual sidebar top-to-bottom
const NAV_LINKS = [
  'Dashboard',
  'Campaigns',
  'Inbox',
  'Dealers',
  'Templates',
  'Performance',
  'Knowledge',
  'Settings',
];

test('smoke: login then visit all sidebar pages', async ({ page }) => {
  // Give plenty of time for 7 navigations + 5 s pause
  test.setTimeout(120_000);

  // ── Login ──────────────────────────────────────────────────────────────────
  await page.goto('/login');

  // Use generic selectors so this works regardless of whether the app uses
  // data-testid, name, type, or placeholder attributes on the login form.
  const emailInput    = page.locator('input[type="email"], input[name="email"], input[id="email"], [data-testid="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"], input[id="password"], [data-testid="password"]').first();
  const submitButton  = page.locator('button[type="submit"], input[type="submit"], [data-testid="submit"]').first();

  await emailInput.waitFor({ state: 'visible', timeout: 15_000 });
  await emailInput.fill(ADMIN_EMAIL);
  await passwordInput.fill(ADMIN_PASSWORD);
  await submitButton.click();

  // Confirm we left the login page — the app may redirect to / or /dashboard
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

  // ── Navigate through every sidebar page ───────────────────────────────────
  for (const name of NAV_LINKS) {
    const link = page.getByRole('link', { name, exact: false }).first();
    await link.waitFor({ state: 'visible', timeout: 10_000 });
    await link.click();
    await page.waitForLoadState('domcontentloaded');
    console.log(`✓ ${name}`);
  }

  // Pause on the last page for 5 seconds before closing
  await page.waitForTimeout(5_000);
});
