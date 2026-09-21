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

test.describe('Templates smoke', () => {
  test('admin creates a multi-language draft, submits to Meta (mock), sees PENDING', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Templates' }).click();

    const uniqueSuffix = Date.now().toString().slice(-8);
    const templateName = `e2e_promo_${uniqueSuffix}`;

    // Create draft
    await page.getByTestId('add-template').click();
    await page.getByTestId('template-name').fill(templateName);
    await page.getByTestId('template-category').selectOption('MARKETING');
    await page.getByTestId('variant-body').fill('Hello {{1}}!');
    await page.getByTestId('variant-footer').fill('Reply STOP to unsubscribe');
    // Add a second language (MS)
    await page.getByTestId('add-language-select').selectOption('MS');
    await page.getByTestId('language-tab-MS').click();
    await page.getByTestId('variant-body').fill('Salam {{1}}!');

    await page.getByTestId('template-submit-draft').click();
    await expect(page).toHaveURL(/\/templates$/);
    await expect(page.getByTestId(`template-group-${templateName}`)).toBeVisible();

    // Open it
    await page.getByTestId(`template-group-${templateName}`).click();
    await expect(page.getByTestId('status-badge-DRAFT').first()).toBeVisible();

    // Submit to Meta (mock mode returns PENDING)
    await page.getByTestId('template-submit-meta').click();
    await expect(page.getByTestId('status-badge-PENDING').first()).toBeVisible({ timeout: 5000 });

    // Clean up: deletion of PENDING is blocked by the API, so just leave it for the next run.
    // The next run will create a different name (unique by timestamp) and won't conflict.
  });

  test('template list shows status filter', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Templates' }).click();
    await page.getByTestId('filter-status-PENDING').click();
    // Verify the filter chip is now active (aria-pressed is a styling-agnostic signal).
    await expect(page.getByTestId('filter-status-PENDING')).toHaveAttribute('aria-pressed', 'true');
  });
});
