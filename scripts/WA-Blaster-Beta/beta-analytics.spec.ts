/**
 * BETA SUITE 9 — Analytics / Reports
 *
 * Delivery funnel, date range chips, template breakdown, and the dashboard
 * KPI metrics consistency check. All scenarios use the /reports page.
 */
import { test, expect, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!';
const FLOW = 'beta-analytics';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

// ─── Reports page ─────────────────────────────────────────────────────────────

test.describe('Reports analytics', () => {
  test('reports page renders delivery funnel heading', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await expect(page.getByText('Delivery funnel')).toBeVisible();
    await snap(page, FLOW, 'reports_01_funnel_heading');
  });

  test('delivery rate metric is shown', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await expect(page.getByText('Delivery rate')).toBeVisible();
    await snap(page, FLOW, 'reports_02_delivery_rate');
  });

  test('7-day range chip switches the view without error', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await page.getByRole('button', { name: '7 days' }).click();
    await expect(page.getByText('Delivery funnel')).toBeVisible();
    await snap(page, FLOW, 'reports_03_7day');
  });

  test('30-day range chip switches the view without error', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await page.getByRole('button', { name: '30 days' }).click();
    await expect(page.getByText('Delivery funnel')).toBeVisible();
    await snap(page, FLOW, 'reports_04_30day');
  });

  test('90-day range chip switches the view without error', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await page.getByRole('button', { name: '90 days' }).click();
    await expect(page.getByText('Delivery funnel')).toBeVisible();
    await snap(page, FLOW, 'reports_05_90day');
  });

  test('no demo-data notice is displayed', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await expect(page.getByText('Chart data is seeded demo analytics')).toHaveCount(0);
    await snap(page, FLOW, 'reports_06_no_demo');
  });
});

// ─── Dashboard metrics consistency ───────────────────────────────────────────

test.describe('Dashboard metrics', () => {
  test('KPI strip is visible on the dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByText('auto-handled')).toBeVisible();
    await snap(page, FLOW, 'kpi_01_auto_handled');
  });
});
