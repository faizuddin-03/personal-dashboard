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

test.describe('Campaign per-recipient delivery', () => {
  test('opens a campaign and shows the recipients table with a status filter', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Campaigns' }).click();

    // Campaign rows in Campaigns.tsx are <div role="button" data-testid="blast-row-{id}">
    // that use onClick/navigate — they are NOT <a href="/blasts/..."> elements.
    // Click the first rendered card using the testid prefix pattern.
    await page.locator('[data-testid^="blast-row-"]').first().click();
    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i);

    // Recipients section: status filter + table render
    await expect(page.getByTestId('recipient-status-filter')).toBeVisible();
    await expect(page.getByTestId('recipients-table')).toBeVisible();

    // Filtering to Failed surfaces failed rows (seeded ~3.5% failures) with a Retry button
    await page.getByTestId('recipient-status-filter').getByRole('button', { name: 'Failed' }).click();
    await expect(page.getByTestId('retry-message').first()).toBeVisible();
  });
});
