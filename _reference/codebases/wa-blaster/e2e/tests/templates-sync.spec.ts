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

test.describe('Templates — Sync with Meta', () => {
  test('the Sync button triggers a request and shows a result toast', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Templates' }).click();
    await expect(page).toHaveURL(/\/templates$/);

    await page.getByRole('button', { name: /sync with meta/i }).click();
    // Toast renders with role="status" and data-testid="toast-success" or "toast-error".
    // Success copy: "Synced with Meta — checked N, M updated"  (r.checked > 0)
    //            or "No pending templates to sync"              (r.checked === 0)
    // Error copy:  "Sync with Meta failed"
    // We assert the toast is visible and matches either the success or error outcome.
    await expect(
      page.getByRole('status').filter({
        hasText: /no pending templates to sync|synced with meta|sync with meta failed/i,
      }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
