/**
 * FLOW: Contact & Segment Management
 *
 * Combines: contacts.spec.ts + dealers-add.spec.ts + dealers-segment.spec.ts
 *           + wa-blaster-contacts-import.spec.ts
 *
 * Covers the full contact lifecycle — bulk import via CSV, manual add, search,
 * specialization filtering, edit, delete — and then segment creation from a
 * dealer selection, finishing with using that segment inside the blast wizard.
 */
import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL    = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';
const SEED_TEMPLATE  = 'sample_promo_2026';
const FLOW = 'flow-contacts-and-segments';

const VALID_CSV   = path.join(__dirname, 'fixtures', 'valid-contacts.csv');
const INVALID_CSV = path.join(__dirname, 'fixtures', 'invalid-contacts.csv');

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

test.describe('CSV contact import', () => {
  test('Import button disabled until file selected', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/import');
    await expect(page.getByTestId('import-form')).toBeVisible();
    await snap(page, FLOW, 'import_01_page_no_file');
    await expect(page.getByTestId('csv-submit')).toBeDisabled();
  });

  test('valid CSV imports and shows result; Back to contacts returns to list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/import');
    await snap(page, FLOW, 'import_02_valid_csv_ready');

    await page.getByTestId('csv-file').setInputFiles(VALID_CSV);
    await expect(page.getByTestId('csv-submit')).toBeEnabled();
    await page.getByTestId('csv-submit').click();

    await expect(page.getByTestId('import-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Imported')).toBeVisible();
    await expect(page.getByText('Skipped (duplicates)')).toBeVisible();
    await snap(page, FLOW, 'import_03_valid_csv_result');

    await page.getByRole('button', { name: 'Back to contacts' }).click();
    await expect(page).toHaveURL(/\/contacts$/);
    await snap(page, FLOW, 'import_04_back_to_contacts');
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
    await snap(page, FLOW, 'import_05_invalid_csv_errors');
  });

  test('Cancel on the import page navigates back to contacts', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/import');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/contacts$/);
    await snap(page, FLOW, 'import_06_cancel_returns_to_list');
  });
});

// ─── Dealers table & manual add ───────────────────────────────────────────────

test.describe('Dealer management', () => {
  test('dealers table renders; search filters; specialization chip works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await snap(page, FLOW, 'dealer_01_table');

    await expect(page.locator('[data-testid^="contact-row-"]').first()).toBeVisible();

    await page.getByTestId('contacts-search').fill('Auto Bestari');
    await expect(page.getByText('Auto Bestari Sdn Bhd')).toBeVisible();
    await snap(page, FLOW, 'dealer_02_search_result');

    await page.getByTestId('contacts-search').fill('');
    await expect(page.getByTestId('contacts-table')).toBeVisible();

    const evChip = page.getByRole('button', { name: /EV.Hybrid/i });
    await evChip.click();
    await expect(evChip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await snap(page, FLOW, 'dealer_03_ev_hybrid_filter');
  });

  test('admin adds dealer via modal → searchable in table; duplicate phone shows error', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('add-dealer')).toBeVisible();

    const suffix = Date.now().toString().slice(-7);
    const name   = `E2E Dealer ${suffix}`;
    const phone  = `+6012${suffix}`;

    await page.getByTestId('add-dealer').click();
    await snap(page, FLOW, 'dealer_04_add_modal');
    await page.getByTestId('add-dealer-name').fill(name);
    await page.getByTestId('add-dealer-phone').fill(phone);
    await page.getByTestId('add-dealer-tier').selectOption('GOLD');
    await page.getByTestId('add-dealer-vehicleSpecialization').selectOption('EV_HYBRID');
    await page.getByTestId('add-dealer-submit').click();

    await expect(page.getByTestId('add-dealer-submit')).toBeHidden();

    await page.getByTestId('contacts-search').fill(name);
    await expect(page.getByTestId('contacts-table')).toContainText(name);
    await expect(page.getByTestId('contacts-table')).toContainText('Gold');
    await expect(page.getByTestId('contacts-table')).toContainText('EV/Hybrid');
    await snap(page, FLOW, 'dealer_05_added_in_table');

    await page.getByTestId('add-dealer').click();
    await page.getByTestId('add-dealer-name').fill(`E2E Dup ${suffix}`);
    await page.getByTestId('add-dealer-phone').fill(phone);
    await page.getByTestId('add-dealer-submit').click();
    await expect(page.getByTestId('add-dealer-error')).toBeVisible();
    await expect(page.getByTestId('add-dealer-error')).toContainText('already exists');
    await snap(page, FLOW, 'dealer_06_duplicate_phone_error');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('add-dealer-submit')).toBeHidden();
  });
});

// ─── Manual contact create → edit → delete ────────────────────────────────────

test.describe('Manual contact lifecycle', () => {
  test('create → verify in list → edit → delete', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts/new');
    await expect(page.getByTestId('contact-form')).toBeVisible();
    await snap(page, FLOW, 'contact_01_new_form');

    const suffix = Date.now().toString().slice(-8);
    const localPhone = `01${suffix}`;

    await page.getByTestId('contact-phone').fill(localPhone);
    await page.getByTestId('contact-name').fill('E2E Test Contact');
    await page.getByTestId('contact-ethnicity').selectOption('MALAY');
    await page.getByTestId('contact-language').selectOption('MS');
    await page.getByTestId('contact-state').selectOption('SELANGOR');
    await page.getByTestId('contact-optin').selectOption('OPTED_IN');
    await snap(page, FLOW, 'contact_02_form_filled');
    await page.getByTestId('contact-submit').click();

    await expect(page).toHaveURL(/\/contacts$/);
    await page.getByTestId('contacts-search').fill('E2E Test Contact');
    await expect(page.getByText('E2E Test Contact')).toBeVisible();
    await snap(page, FLOW, 'contact_03_in_list');

    // Edit
    const row = page.locator('[data-testid^="contact-row-"]').filter({ hasText: 'E2E Test Contact' }).first();
    const testId = await row.getAttribute('data-testid');
    const contactId = testId!.replace('contact-row-', '');
    await page.goto(`/contacts/${contactId}`);
    await expect(page.getByTestId('contact-form')).toBeVisible();
    await page.getByTestId('contact-name').fill('E2E Renamed Contact');
    await page.getByTestId('contact-submit').click();
    await expect(page).toHaveURL(/\/contacts$/);
    await page.getByTestId('contacts-search').fill('E2E Renamed Contact');
    await expect(page.getByText('E2E Renamed Contact')).toBeVisible();
    await snap(page, FLOW, 'contact_04_renamed_in_list');

    // Delete
    const renamedRow = page.locator('[data-testid^="contact-row-"]').filter({ hasText: 'E2E Renamed Contact' }).first();
    const renamedId = (await renamedRow.getAttribute('data-testid'))!.replace('contact-row-', '');
    page.once('dialog', (d) => d.accept());
    await page.goto(`/contacts/${renamedId}`);
    await snap(page, FLOW, 'contact_05_before_delete');
    await page.getByTestId('contact-delete').click();
    await expect(page).toHaveURL(/\/contacts$/);
    await page.getByTestId('contacts-search').fill('E2E Renamed Contact');
    await expect(page.getByText('E2E Renamed Contact')).toHaveCount(0);
    await snap(page, FLOW, 'contact_06_deleted_from_list');
  });
});

// ─── Segment creation → use in blast wizard ───────────────────────────────────

test.describe('Segment creation and use', () => {
  test('segment builder page shows filter options', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/segments');
    await expect(page).toHaveURL(/\/segments$/);
    await expect(page.getByTestId('filter-tier-GOLD')).toBeVisible();
    await snap(page, FLOW, 'segment_01_builder_page');
  });

  test('select all dealers → save as segment → success toast shown', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();

    await page.getByTestId('select-all').check();
    await expect(page.getByTestId('selection-bar')).toBeVisible();
    await snap(page, FLOW, 'segment_02_dealers_selected');
    await page.getByTestId('save-as-segment').click();

    const segmentName = `E2E Segment ${Date.now().toString().slice(-6)}`;
    await page.getByTestId('segment-name-input').fill(segmentName);
    await snap(page, FLOW, 'segment_03_name_dialog');
    await page.getByRole('button', { name: /^save$/i }).click();

    await expect(page.getByText(/saved with \d+ dealers/i)).toBeVisible();
    await snap(page, FLOW, 'segment_04_save_toast');
  });

  test('saved segment is selectable in the blast wizard audience step', async ({ page }) => {
    await loginAsAdmin(page);

    // Create a segment first
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await page.getByTestId('select-all').check();
    await expect(page.getByTestId('selection-bar')).toBeVisible();
    await page.getByTestId('save-as-segment').click();
    const segmentName = `E2E Blast Seg ${Date.now().toString().slice(-6)}`;
    await page.getByTestId('segment-name-input').fill(segmentName);
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(/saved with \d+ dealers/i)).toBeVisible();

    // Now use it in the blast wizard
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await page.getByTestId('new-blast').click();
    await expect(page.getByTestId('blast-wizard')).toBeVisible();
    await snap(page, FLOW, 'segment_05_wizard_audience_step');

    await expect(page.getByTestId('blast-segment')).toBeVisible();
    await page.getByTestId('blast-segment').selectOption({ label: segmentName });

    await expect(page.getByText(/\d+ recipients/)).toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'segment_06_wizard_segment_selected');
  });
});
