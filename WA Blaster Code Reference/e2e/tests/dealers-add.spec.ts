import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

async function gotoDealers(page: Page) {
  await page.getByRole('link', { name: 'Dealers' }).click();
  await expect(page.getByTestId('add-dealer')).toBeVisible();
}

async function addDealer(page: Page, name: string, phone: string) {
  await page.getByTestId('add-dealer').click();
  await page.getByTestId('add-dealer-name').fill(name);
  await page.getByTestId('add-dealer-phone').fill(phone);
  await page.getByTestId('add-dealer-tier').selectOption('GOLD');
  await page.getByTestId('add-dealer-vehicleSpecialization').selectOption('EV_HYBRID');
  await page.getByTestId('add-dealer-submit').click();
}

test.describe('Manual add dealer', () => {
  test('admin adds a dealer and sees it in the table', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoDealers(page);

    const suffix = Date.now().toString().slice(-7);
    const name = `E2E Dealer ${suffix}`;
    const phone = `+6012${suffix}`;

    await addDealer(page, name, phone);

    // Success closes the modal
    await expect(page.getByTestId('add-dealer-submit')).toBeHidden();

    // New dealer is findable via search and shows tier + specialization
    await page.getByTestId('contacts-search').fill(name);
    const table = page.getByTestId('contacts-table');
    await expect(table).toContainText(name);
    await expect(table).toContainText('Gold');
    await expect(table).toContainText('EV/Hybrid');
  });

  test('duplicate phone shows inline error and modal stays open', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoDealers(page);

    const suffix = Date.now().toString().slice(-7);
    const phone = `+6013${suffix}`;

    // Create the original dealer first (success closes the modal)
    await addDealer(page, `E2E Dup Original ${suffix}`, phone);
    await expect(page.getByTestId('add-dealer-submit')).toBeHidden();

    // Re-open and submit a different name with the same phone
    await addDealer(page, `E2E Dup Clash ${suffix}`, phone);

    await expect(page.getByTestId('add-dealer-error')).toBeVisible();
    await expect(page.getByTestId('add-dealer-error')).toContainText('already exists');
    // Modal stays open so the user can correct the phone
    await expect(page.getByTestId('add-dealer-submit')).toBeVisible();

    // Close via Escape; modal goes away
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('add-dealer-submit')).toBeHidden();
  });
});
