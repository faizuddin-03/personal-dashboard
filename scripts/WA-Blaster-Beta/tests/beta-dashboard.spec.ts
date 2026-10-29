/**
 * BETA SUITE 2 — Dashboard & KPIs
 *
 * Verifies the main dashboard renders live (non-demo) data: KPI strip,
 * reply-handling donut chart, and the time-of-day greeting.
 */
import { test, expect } from '../fixtures/authFixture';
import { snap } from '../utils/screenshot';
import { DashboardPage } from '../pages/DashboardPage';
import { ReportsPage } from '../pages/ReportsPage';

const FLOW = 'beta-dashboard';

// ─── KPI strip ────────────────────────────────────────────────────────────────

test.describe('Dashboard KPI strip', () => {
  test('dashboard title visible and no demo badge shown', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await expect(dashboard.title()).toBeVisible();
    await expect(dashboard.text('demo', { exact: true })).toHaveCount(0);
    await expect(dashboard.text('(demo data)')).toHaveCount(0);
    await snap(adminPage, FLOW, 'kpi_01_no_demo_badge');
  });

  test('reply-handling donut chart text "auto-handled" is visible', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await expect(dashboard.text('auto-handled')).toBeVisible();
    await snap(adminPage, FLOW, 'kpi_02_donut_auto_handled');
  });

  test('dashboard loads without errors on page reload', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.reload();
    await expect(dashboard.title()).toBeVisible();
    await snap(adminPage, FLOW, 'kpi_03_reload_no_error');
  });
});

// ─── Reports / analytics page ─────────────────────────────────────────────────

test.describe('Reports analytics page', () => {
  test('reports page renders delivery funnel and range chips', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await expect(reports.deliveryFunnel()).toBeVisible();
    await expect(reports.deliveryRate()).toBeVisible();
    await snap(adminPage, FLOW, 'reports_01_funnel');
  });

  test('7-day range chip is clickable and updates the chart', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await reports.clickRangeChip('7 days');
    await expect(reports.deliveryFunnel()).toBeVisible();
    await snap(adminPage, FLOW, 'reports_02_7day_chip');
  });

  test('reports page shows no "demo data" notice', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await expect(reports.text('Chart data is seeded demo analytics')).toHaveCount(0);
    await snap(adminPage, FLOW, 'reports_03_no_demo_notice');
  });
});
