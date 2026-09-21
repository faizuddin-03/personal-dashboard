import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';
// The seeded Customer Support (OPERATOR) user — no API bootstrap needed.
const SUPPORT_EMAIL = 'support@example.com';
const SUPPORT_PASSWORD = 'ChangeMe123!';

async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('Operator role coverage', () => {
  test('support user sees Dashboard/Dealers/Inbox/Templates/Campaigns but NOT Settings or Knowledge', async ({ page }) => {
    await loginAs(page, SUPPORT_EMAIL, SUPPORT_PASSWORD);
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dealers' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inbox' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Templates' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Campaigns' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Knowledge' })).toHaveCount(0);
  });

  test('support user gets bounced from /settings via direct nav', async ({ page }) => {
    await loginAs(page, SUPPORT_EMAIL, SUPPORT_PASSWORD);
    // Direct navigation should bounce back to root (because Phase 6 made auth persistent across reloads).
    await page.goto('/settings');
    // The ProtectedRoute will see role !== 'ADMIN' and redirect to /.
    await expect(page).toHaveURL(/\/$/);
  });

  test('support user can view Dealers but does NOT see the Add dealer button', async ({ page }) => {
    await loginAs(page, SUPPORT_EMAIL, SUPPORT_PASSWORD);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await expect(page.getByTestId('add-dealer')).toHaveCount(0);
  });
});
