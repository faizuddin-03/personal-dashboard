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

test.describe('Shell polish', () => {
  test('login has a Remember-me checkbox, checked by default', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('remember-me')).toBeChecked();
  });

  test('the help button opens the keyboard-shortcuts overlay; Escape closes it', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('help-button').click();
    await expect(page.getByTestId('shortcuts-overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shortcuts-overlay')).toHaveCount(0);
  });

  test('g then i navigates to the inbox', async ({ page }) => {
    await loginAsAdmin(page);
    await page.keyboard.press('g');
    await page.keyboard.press('i');
    await expect(page).toHaveURL(/\/inbox$/);
  });
});
