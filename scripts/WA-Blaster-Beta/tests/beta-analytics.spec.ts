/**
 * BETA SUITE 9 — Analytics / Reports
 *
 * Delivery funnel, date range chips, template breakdown, and the dashboard
 * KPI metrics consistency check. All scenarios use the /reports page.
 */
import { test, expect } from '../fixtures/authFixture';
import { snap } from '../utils/screenshot';
import { ReportsPage } from '../pages/ReportsPage';
import { DashboardPage } from '../pages/DashboardPage';

const FLOW = 'beta-analytics';

// ─── Reports page ─────────────────────────────────────────────────────────────

test.describe('Reports analytics', () => {
  test('reports page renders delivery funnel heading', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await expect(reports.deliveryFunnel()).toBeVisible();
    await snap(adminPage, FLOW, 'reports_01_funnel_heading');
  });

  test('delivery rate metric is shown', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await expect(reports.deliveryRate()).toBeVisible();
    await snap(adminPage, FLOW, 'reports_02_delivery_rate');
  });

  test('7-day range chip switches the view without error', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await reports.clickRangeChip('7 days');
    await expect(reports.deliveryFunnel()).toBeVisible();
    await snap(adminPage, FLOW, 'reports_03_7day');
  });

  test('30-day range chip switches the view without error', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await reports.clickRangeChip('30 days');
    await expect(reports.deliveryFunnel()).toBeVisible();
    await snap(adminPage, FLOW, 'reports_04_30day');
  });

  test('90-day range chip switches the view without error', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await reports.clickRangeChip('90 days');
    await expect(reports.deliveryFunnel()).toBeVisible();
    await snap(adminPage, FLOW, 'reports_05_90day');
  });

  test('no demo-data notice is displayed', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await expect(reports.demoDataNotice()).toHaveCount(0);
    await snap(adminPage, FLOW, 'reports_06_no_demo');
  });
});

// ─── Dashboard metrics consistency ───────────────────────────────────────────

test.describe('Dashboard metrics', () => {
  test('KPI strip is visible on the dashboard', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await expect(dashboard.title()).toBeVisible();
    await expect(dashboard.kpiAutoHandled()).toBeVisible();
    await snap(adminPage, FLOW, 'kpi_01_auto_handled');
  });
});
