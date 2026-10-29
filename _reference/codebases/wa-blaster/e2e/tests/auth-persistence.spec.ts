import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

test.describe('Auth persistence', () => {
  test('admin stays logged in after a page reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email').fill(ADMIN_EMAIL);
    await page.getByTestId('password').fill(ADMIN_PASSWORD);
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();

    // The whole point of Phase 6: this reload should NOT bounce to /login.
    await page.reload();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByTestId('current-user')).toHaveText(ADMIN_EMAIL);
  });

  test('admin gets bounced to /login after logout, even on reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email').fill(ADMIN_EMAIL);
    await page.getByTestId('password').fill(ADMIN_PASSWORD);
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByTestId('logout').click();
    await expect(page).toHaveURL(/\/login$/);

    // After logout the refresh cookie is cleared on the server. Reload should stay on /login.
    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
  });
});
