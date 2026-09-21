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

test.describe('Performance analytics', () => {
  test('renders real (non-demo) analytics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');

    // The seed-data footnote must be gone now that data is real
    await expect(page.getByText('Chart data is seeded demo analytics')).toHaveCount(0);

    // KPI strip + funnel render
    await expect(page.getByText('Delivery rate')).toBeVisible();
    await expect(page.getByText('Delivery funnel')).toBeVisible();

    // Range chips drive the page; clicking 7 days keeps it functional
    await page.getByRole('button', { name: '7 days' }).click();
    await expect(page.getByText('Delivery funnel')).toBeVisible();
  });
});
