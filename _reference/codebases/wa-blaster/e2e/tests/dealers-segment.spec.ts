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

test.describe('Dealer segment targeting', () => {
  test('segment builder shows dealer columns', async ({ page }) => {
    await loginAsAdmin(page);
    // "Segments" has no sidebar nav link — navigate directly
    await page.goto('/segments');
    await expect(page).toHaveURL(/\/segments$/);
    // FilterBuilder is rendered unconditionally inside the "Create segment" card;
    // no reveal button is needed.
    await expect(page.getByTestId('filter-tier-GOLD')).toBeVisible();
  });

  test('selecting dealers and saving as a segment shows a result toast', async ({ page }) => {
    await loginAsAdmin(page);
    // "Dealers" nav link routes to /contacts
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page).toHaveURL(/\/contacts$/);

    // Wait for the dealers table to load before interacting with checkboxes
    await expect(page.getByTestId('contacts-table')).toBeVisible();

    // select-all is an <input type="checkbox"> — .check() is correct
    await page.getByTestId('select-all').check();
    await expect(page.getByTestId('selection-bar')).toBeVisible();
    await page.getByTestId('save-as-segment').click();
    await page.getByTestId('segment-name-input').fill('E2E picked dealers');
    // The save button inside the inline form has accessible text "Save" (idle)
    await page.getByRole('button', { name: /^save$/i }).click();

    // Success toast: Segment "X" saved with N dealers
    await expect(page.getByText(/saved with \d+ dealers/i)).toBeVisible();
  });
});
