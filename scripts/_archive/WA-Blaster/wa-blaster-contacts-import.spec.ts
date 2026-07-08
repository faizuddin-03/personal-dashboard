import { test, expect } from './helpers/fixtures';
import path from 'path';

const ADMIN_EMAIL    = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

const VALID_CSV   = path.join(__dirname, 'fixtures', 'valid-contacts.csv');
const INVALID_CSV = path.join(__dirname, 'fixtures', 'invalid-contacts.csv');

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('Contact CSV import', () => {

  test('Import button is disabled until a file is selected', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/import');
    await expect(page.getByTestId('import-form')).toBeVisible();

    // Submit button must be disabled before any file is chosen
    await expect(page.getByTestId('csv-submit')).toBeDisabled();
  });

  test('valid CSV uploads successfully and shows import result', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/import');
    await expect(page.getByTestId('import-form')).toBeVisible();

    // Attach the valid CSV file
    await page.getByTestId('csv-file').setInputFiles(VALID_CSV);

    // Submit button becomes enabled once a file is selected
    await expect(page.getByTestId('csv-submit')).toBeEnabled();
    await page.getByTestId('csv-submit').click();

    // Import result section should appear (some rows imported, skipped, or both)
    await expect(page.getByTestId('import-result')).toBeVisible({ timeout: 15_000 });

    // The result shows imported + skipped counts (no errors section for a valid file)
    await expect(page.getByText('Imported')).toBeVisible();
    await expect(page.getByText('Skipped (duplicates)')).toBeVisible();

    // A "Back to contacts" button lets the user return to the contacts list
    await page.getByRole('button', { name: 'Back to contacts' }).click();
    await expect(page).toHaveURL(/\/contacts$/);
  });

  test('CSV with missing/invalid phone rows shows the error list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/import');
    await expect(page.getByTestId('import-form')).toBeVisible();

    // Attach the CSV that has 2 bad rows
    await page.getByTestId('csv-file').setInputFiles(INVALID_CSV);
    await page.getByTestId('csv-submit').click();

    // The import should complete and surface the error list
    await expect(page.getByTestId('import-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('import-errors')).toBeVisible();

    // At least 2 error entries (missing phone + invalid phone)
    const errorItems = page.getByTestId('import-errors').locator('li');
    await expect(errorItems).toHaveCount(2);
  });

  test('cancelling the import navigates back to contacts', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/import');
    await expect(page.getByTestId('import-form')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/contacts$/);
  });

});
