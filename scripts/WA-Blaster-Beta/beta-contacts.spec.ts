/**
 * BETA SUITE 5 — Dealers / Contacts
 *
 * CSV bulk import, dealer table UI (search + specialization chip), manual
 * dealer add with duplicate-phone guard, and full manual contact lifecycle
 * (create → edit → delete).
 */
import { test, expect, type Page } from './helpers/fixtures';
import path from 'path';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!';
const DEALER_TIER    = process.env.E2E_DEALER_TIER    ?? 'GOLD';
const DEALER_SPEC    = process.env.E2E_DEALER_SPEC    ?? 'EV_HYBRID';
const FLOW = 'beta-contacts';

const VALID_CSV   = path.join(__dirname, 'fixtures', 'valid-contacts.csv');
const INVALID_CSV = path.join(__dirname, 'fixtures', 'invalid-contacts.csv');

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

// ─── CSV import ───────────────────────────────────────────────────────────────

test.describe('CSV contact import', () => {
  test('Import button disabled until file selected', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/import');
    await expect(page.getByTestId('import-form')).toBeVisible();
    await expect(page.getByTestId('csv-submit')).toBeDisabled();
    await snap(page, FLOW, 'import_01_no_file');
  });

  test('valid CSV imports successfully — shows Imported count', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/import');
    await page.getByTestId('csv-file').setInputFiles(VALID_CSV);
    await expect(page.getByTestId('csv-submit')).toBeEnabled();
    await page.getByTestId('csv-submit').click();
    await expect(page.getByTestId('import-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Imported')).toBeVisible();
    await expect(page.getByText('Skipped (duplicates)')).toBeVisible();
    await snap(page, FLOW, 'import_02_valid_result');

    await page.getByRole('button', { name: 'Back to contacts' }).click();
    await expect(page).toHaveURL(/\/contacts$/);
    await snap(page, FLOW, 'import_03_back_to_list');
  });

  test('CSV with invalid rows surfaces the error list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/import');
    await page.getByTestId('csv-file').setInputFiles(INVALID_CSV);
    await page.getByTestId('csv-submit').click();
    await expect(page.getByTestId('import-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('import-errors')).toBeVisible();
    const errorItems = page.getByTestId('import-errors').locator('li');
    await expect(errorItems).toHaveCount(2);
    await snap(page, FLOW, 'import_04_errors_listed');
  });

  test('Cancel on import page returns to contacts list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/import');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/contacts$/);
    await snap(page, FLOW, 'import_05_cancel_returns');
  });
});

// ─── Dealers table ────────────────────────────────────────────────────────────

test.describe('Dealers table', () => {
  test('dealers table renders with rows', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await expect(page.locator('[data-testid^="contact-row-"]').first()).toBeVisible();
    await snap(page, FLOW, 'dealer_01_table');
  });

  test('search filters the dealer list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await page.getByTestId('contacts-search').fill('Auto Bestari');
    await expect(page.getByText('Auto Bestari Sdn Bhd')).toBeVisible();
    await snap(page, FLOW, 'dealer_02_search');
  });

  test('EV/Hybrid specialization chip filters without crashing', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    const chip = page.getByRole('button', { name: /EV.Hybrid/i });
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await snap(page, FLOW, 'dealer_03_ev_hybrid_filter');
  });

  test('admin adds dealer via modal — appears in table', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('add-dealer')).toBeVisible();

    const suffix = Date.now().toString().slice(-7);
    const name   = `BETA Dealer ${suffix}`;
    const phone  = `+6013${suffix}`;

    await page.getByTestId('add-dealer').click();
    await page.getByTestId('add-dealer-name').fill(name);
    await page.getByTestId('add-dealer-phone').fill(phone);
    await page.getByTestId('add-dealer-tier').selectOption(DEALER_TIER);
    await page.getByTestId('add-dealer-vehicleSpecialization').selectOption(DEALER_SPEC);
    await page.getByTestId('add-dealer-submit').click();
    await expect(page.getByTestId('add-dealer-submit')).toBeHidden();

    await page.getByTestId('contacts-search').fill(name);
    await expect(page.getByTestId('contacts-table')).toContainText(name);
    await snap(page, FLOW, 'dealer_04_added');
  });

  test('duplicate phone number shows error in add-dealer modal', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();

    const suffix = Date.now().toString().slice(-7);
    const phone  = `+6014${suffix}`;

    // First add
    await page.getByTestId('add-dealer').click();
    await page.getByTestId('add-dealer-name').fill(`BETA Dup First ${suffix}`);
    await page.getByTestId('add-dealer-phone').fill(phone);
    await page.getByTestId('add-dealer-tier').selectOption(DEALER_TIER);
    await page.getByTestId('add-dealer-vehicleSpecialization').selectOption(DEALER_SPEC);
    await page.getByTestId('add-dealer-submit').click();
    await expect(page.getByTestId('add-dealer-submit')).toBeHidden();

    // Duplicate attempt
    await page.getByTestId('add-dealer').click();
    await page.getByTestId('add-dealer-name').fill(`BETA Dup Second ${suffix}`);
    await page.getByTestId('add-dealer-phone').fill(phone);
    await page.getByTestId('add-dealer-submit').click();
    await expect(page.getByTestId('add-dealer-error')).toBeVisible();
    await expect(page.getByTestId('add-dealer-error')).toContainText('already exists');
    await snap(page, FLOW, 'dealer_05_duplicate_error');
  });
});

// ─── Manual contact lifecycle ─────────────────────────────────────────────────

test.describe('Manual contact lifecycle', () => {
  test('create contact → verify in list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/new');
    await expect(page.getByTestId('contact-form')).toBeVisible();

    const suffix     = Date.now().toString().slice(-8);
    const localPhone = `01${suffix}`;

    await page.getByTestId('contact-phone').fill(localPhone);
    await page.getByTestId('contact-name').fill('BETA Contact');
    await page.getByTestId('contact-ethnicity').selectOption('MALAY');
    await page.getByTestId('contact-language').selectOption('MS');
    await page.getByTestId('contact-state').selectOption('SELANGOR');
    await page.getByTestId('contact-optin').selectOption('OPTED_IN');
    await page.getByTestId('contact-submit').click();

    await expect(page).toHaveURL(/\/contacts$/);
    await page.getByTestId('contacts-search').fill('BETA Contact');
    await expect(page.getByText('BETA Contact')).toBeVisible();
    await snap(page, FLOW, 'contact_01_created');
  });

  test('edit contact name then delete', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/new');
    const suffix     = Date.now().toString().slice(-8);
    const localPhone = `02${suffix}`;

    await page.getByTestId('contact-phone').fill(localPhone);
    await page.getByTestId('contact-name').fill('BETA Edit Me');
    await page.getByTestId('contact-ethnicity').selectOption('MALAY');
    await page.getByTestId('contact-language').selectOption('EN');
    await page.getByTestId('contact-state').selectOption('KL');
    await page.getByTestId('contact-optin').selectOption('OPTED_IN');
    await page.getByTestId('contact-submit').click();
    await expect(page).toHaveURL(/\/contacts$/);

    const row = page.locator('[data-testid^="contact-row-"]').filter({ hasText: 'BETA Edit Me' }).first();
    const testId    = await row.getAttribute('data-testid');
    const contactId = testId!.replace('contact-row-', '');
    await page.goto(`/contacts/${contactId}`);
    await page.getByTestId('contact-name').fill('BETA Renamed');
    await page.getByTestId('contact-submit').click();
    await expect(page).toHaveURL(/\/contacts$/);
    await page.getByTestId('contacts-search').fill('BETA Renamed');
    await expect(page.getByText('BETA Renamed')).toBeVisible();
    await snap(page, FLOW, 'contact_02_renamed');

    const renamedRow = page.locator('[data-testid^="contact-row-"]').filter({ hasText: 'BETA Renamed' }).first();
    const renamedId  = (await renamedRow.getAttribute('data-testid'))!.replace('contact-row-', '');
    page.once('dialog', (d) => d.accept());
    await page.goto(`/contacts/${renamedId}`);
    await page.getByTestId('contact-delete').click();
    await expect(page).toHaveURL(/\/contacts$/);
    await page.getByTestId('contacts-search').fill('BETA Renamed');
    await expect(page.getByText('BETA Renamed')).toHaveCount(0);
    await snap(page, FLOW, 'contact_03_deleted');
  });
});
