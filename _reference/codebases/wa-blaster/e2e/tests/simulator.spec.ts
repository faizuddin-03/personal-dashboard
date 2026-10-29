import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

test.describe('Simulator smoke', () => {
  test('admin can send a message and see it in the thread', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email').fill(ADMIN_EMAIL);
    await page.getByTestId('password').fill(ADMIN_PASSWORD);
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/simulator');
    await expect(page.getByTestId('simulator-page')).toBeVisible();

    await page.getByTestId('sim-message-input').fill('stop');
    await page.getByTestId('sim-send').click();

    // The inbound (phone -> business) bubble should render our text.
    const outgoing = page.locator('[data-testid="sim-bubble"][data-direction="outgoing"]').filter({ hasText: 'stop' });
    await expect(outgoing.first()).toBeVisible();
  });
});
