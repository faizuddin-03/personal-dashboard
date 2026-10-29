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

test.describe('Campaigns status filter', () => {
  test('list has a status filter that stays functional when clicked', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await expect(page).toHaveURL(/\/blasts$/);

    await expect(page.getByTestId('status-filter')).toBeVisible();
    // The RUNNING chip renders with the label "Sending" (see STATUS_CFG in Campaigns.tsx)
    await page.getByTestId('status-filter').getByRole('button', { name: 'Sending' }).click();
    await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible();
  });
});
