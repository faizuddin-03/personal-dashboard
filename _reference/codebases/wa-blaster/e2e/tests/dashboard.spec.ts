import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('Dashboard analytics', () => {
  test('KPI strip has no demo badge and reply-handling donut renders', async ({ page }) => {
    await loginAsAdmin(page); // lands on the dashboard

    await expect(page.getByTestId('dashboard-title')).toBeVisible();

    // The 'demo' KPI badge and '(demo data)' label are gone now
    await expect(page.getByText('demo', { exact: true })).toHaveCount(0);
    await expect(page.getByText('(demo data)')).toHaveCount(0);

    // Reply-handling donut (its center sub-label) renders
    await expect(page.getByText('auto-handled')).toBeVisible();
  });
});
