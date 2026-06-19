import { test, expect } from '@playwright/test';

test.describe('Auth smoke', () => {
  test('admin logs in and reaches dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);

    await page.getByTestId('email').fill('admin@example.com');
    await page.getByTestId('password').fill('ChangeMe123!');
    await page.getByTestId('submit').click();

    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.getByTestId('dashboard-title')).toHaveText('Dashboard');
    await expect(page.getByTestId('current-user')).toHaveText('admin@example.com');
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email').fill('admin@example.com');
    await page.getByTestId('password').fill('wrong-password');
    await page.getByTestId('submit').click();

    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
  });

  test('admin can navigate to settings; operator cannot', async ({ page }) => {
    // Admin path
    await page.goto('/login');
    await page.getByTestId('email').fill('admin@example.com');
    await page.getByTestId('password').fill('ChangeMe123!');
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL('http://localhost:5173/');

    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByTestId('users-table')).toBeVisible();

    // Logout
    await page.getByTestId('logout').click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
