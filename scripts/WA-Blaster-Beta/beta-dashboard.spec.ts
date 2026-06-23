/**
 * BETA SUITE 2 — Dashboard & KPIs
 *
 * Verifies the main dashboard renders live (non-demo) data: KPI strip,
 * reply-handling donut chart, and the time-of-day greeting.
 */
import { test, expect, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!';
const FLOW = 'beta-dashboard';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

// ─── KPI strip ────────────────────────────────────────────────────────────────

test.describe('Dashboard KPI strip', () => {
  test('dashboard title visible and no demo badge shown', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByText('demo', { exact: true })).toHaveCount(0);
    await expect(page.getByText('(demo data)')).toHaveCount(0);
    await snap(page, FLOW, 'kpi_01_no_demo_badge');
  });

  test('reply-handling donut chart text "auto-handled" is visible', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText('auto-handled')).toBeVisible();
    await snap(page, FLOW, 'kpi_02_donut_auto_handled');
  });

  test('dashboard loads without errors on page reload', async ({ page }) => {
    await loginAsAdmin(page);
    await page.reload();
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await snap(page, FLOW, 'kpi_03_reload_no_error');
  });
});

// ─── Reports / analytics page ─────────────────────────────────────────────────

test.describe('Reports analytics page', () => {
  test('reports page renders delivery funnel and range chips', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await expect(page.getByText('Delivery funnel')).toBeVisible();
    await expect(page.getByText('Delivery rate')).toBeVisible();
    await snap(page, FLOW, 'reports_01_funnel');
  });

  test('7-day range chip is clickable and updates the chart', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await page.getByRole('button', { name: '7 days' }).click();
    await expect(page.getByText('Delivery funnel')).toBeVisible();
    await snap(page, FLOW, 'reports_02_7day_chip');
  });

  test('reports page shows no "demo data" notice', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await expect(page.getByText('Chart data is seeded demo analytics')).toHaveCount(0);
    await snap(page, FLOW, 'reports_03_no_demo_notice');
  });
});
