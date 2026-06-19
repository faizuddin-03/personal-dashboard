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

test.describe('Inbox agent-assist', () => {
  test('settings lists seeded canned replies', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    // The Settings Tabs component renders <button role="tab"> items, so use getByRole('tab')
    await page.getByRole('tab', { name: 'Canned replies' }).click();
    await expect(page.getByTestId('canned-replies-list')).toBeVisible();
    await expect(page.getByTestId('add-canned-reply')).toBeVisible();
  });

  test('needs-human composer shows the agent context card + assist controls', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/inbox');
    // Inbox defaults to mode='needs' (NeedsHumanMode), but click the toggle if not already active.
    // The mode toggle is a plain <button> (no role override) with text "Needs Human".
    const needsHuman = page.getByRole('button', { name: /needs[ -]?human/i });
    if (await needsHuman.count()) await needsHuman.first().click();
    await expect(page.getByTestId('suggest-draft')).toBeVisible();
    await expect(page.getByTestId('agent-context-card')).toBeVisible();
  });
});
