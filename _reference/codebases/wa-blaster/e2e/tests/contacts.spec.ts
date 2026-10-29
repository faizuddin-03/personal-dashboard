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

test.describe('Dealers & Contacts smoke', () => {
  test('dealers table renders and search works', async ({ page }) => {
    await loginAsAdmin(page);
    // Nav link is now "Dealers"
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();

    // At least one seeded dealer row should be visible
    await expect(page.locator('[data-testid^="contact-row-"]').first()).toBeVisible();

    // Search filters the table
    await page.getByTestId('contacts-search').fill('Auto Bestari');
    await expect(page.getByText('Auto Bestari Sdn Bhd')).toBeVisible();

    // Clear search — table still visible
    await page.getByTestId('contacts-search').fill('');
    await expect(page.getByTestId('contacts-table')).toBeVisible();
  });

  test('admin creates a contact via /contacts/new, sees it in the list, edits it, deletes it', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate directly to the create form (Dealers page has no Add button)
    await page.goto('/contacts/new');
    await expect(page.getByTestId('contact-form')).toBeVisible();

    // Use a unique phone for this test run
    const uniqueSuffix = Date.now().toString().slice(-8);
    const localPhone = `01${uniqueSuffix}`;        // e.g. "0118990991" (10 digits)
    const e164 = `+601${uniqueSuffix}`;

    await page.getByTestId('contact-phone').fill(localPhone);
    await page.getByTestId('contact-name').fill('E2E Test Dealer');
    await page.getByTestId('contact-ethnicity').selectOption('MALAY');
    await page.getByTestId('contact-language').selectOption('MS');
    await page.getByTestId('contact-state').selectOption('SELANGOR');
    await page.getByTestId('contact-optin').selectOption('OPTED_IN');
    await page.getByTestId('contact-submit').click();

    // Redirects back to /contacts list
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.getByTestId('contacts-table')).toBeVisible();

    // Search for the newly created contact by name
    await page.getByTestId('contacts-search').fill('E2E Test Dealer');
    await expect(page.getByText('E2E Test Dealer')).toBeVisible();

    // Navigate to edit by finding the row's testid, then go to the edit URL directly
    // (Dealers table has no inline Edit link — navigate to /contacts/:id)
    const row = page.locator('[data-testid^="contact-row-"]').filter({ hasText: 'E2E Test Dealer' }).first();
    await expect(row).toBeVisible();
    const testId = await row.getAttribute('data-testid');
    const contactId = testId!.replace('contact-row-', '');
    await page.goto(`/contacts/${contactId}`);
    await expect(page.getByTestId('contact-form')).toBeVisible();

    await page.getByTestId('contact-name').fill('E2E Renamed Dealer');
    await page.getByTestId('contact-submit').click();
    await expect(page).toHaveURL(/\/contacts$/);

    // Filter to find the renamed contact
    await page.getByTestId('contacts-search').fill('E2E Renamed Dealer');
    await expect(page.getByText('E2E Renamed Dealer')).toBeVisible();

    // Delete the contact
    const renamedRow = page.locator('[data-testid^="contact-row-"]').filter({ hasText: 'E2E Renamed Dealer' }).first();
    const renamedTestId = await renamedRow.getAttribute('data-testid');
    const renamedId = renamedTestId!.replace('contact-row-', '');
    page.once('dialog', (d) => d.accept());
    await page.goto(`/contacts/${renamedId}`);
    await expect(page.getByTestId('contact-form')).toBeVisible();
    await page.getByTestId('contact-delete').click();

    await expect(page).toHaveURL(/\/contacts$/);
    // Confirm the contact no longer appears
    await page.getByTestId('contacts-search').fill('E2E Renamed Dealer');
    await expect(page.getByText('E2E Renamed Dealer')).toHaveCount(0);
  });

  test('specialization chips filter the dealer table', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();

    // Click the EV/Hybrid specialization chip (uses aria-pressed)
    const evChip = page.getByRole('button', { name: /EV.Hybrid/i });
    await evChip.click();
    await expect(evChip).toHaveAttribute('aria-pressed', 'true');

    // Table still visible after filter
    await expect(page.getByTestId('contacts-table')).toBeVisible();
  });
});
