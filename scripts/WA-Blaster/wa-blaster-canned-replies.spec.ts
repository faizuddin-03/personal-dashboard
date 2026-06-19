import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL    = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

async function gotoCannedReplies(page: Page) {
  await page.goto('/settings');
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByRole('tab', { name: 'Canned replies' }).click();
  await expect(page.getByTestId('canned-replies-list')).toBeVisible();
}

/** Opens the create modal, fills the form, and clicks Add. */
async function createCannedReply(
  page: Page,
  title: string,
  body: string,
  category = '',
) {
  await page.getByTestId('add-canned-reply').click();

  // Modal opens — the form fields use placeholder text (no testids)
  await expect(page.getByPlaceholder('Title')).toBeVisible();
  await page.getByPlaceholder('Title').fill(title);
  if (category) await page.getByPlaceholder('Category (optional)').fill(category);
  await page.getByPlaceholder('Reply body').fill(body);

  // Click the Add button inside the modal
  await page.getByRole('button', { name: 'Add' }).click();

  // Modal closes on success
  await expect(page.getByPlaceholder('Title')).toBeHidden({ timeout: 8_000 });
}

test.describe('Canned replies', () => {

  test('admin creates a new canned reply and it appears in the list', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoCannedReplies(page);

    const suffix = Date.now().toString().slice(-6);
    const title  = `E2E Reply ${suffix}`;
    const body   = `This is an automated test reply ${suffix}.`;

    await createCannedReply(page, title, body, 'Test');

    // The new reply should be visible in the list
    await expect(page.getByTestId('canned-replies-list')).toContainText(title);
    await expect(page.getByTestId('canned-replies-list')).toContainText(body.slice(0, 30));
  });

  test('admin edits a canned reply and the updated text appears in the list', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoCannedReplies(page);

    const suffix     = Date.now().toString().slice(-6);
    const title      = `E2E Edit ${suffix}`;
    const origBody   = `Original body ${suffix}`;
    const updatedBody = `Updated body ${suffix}`;

    await createCannedReply(page, title, origBody);
    await expect(page.getByTestId('canned-replies-list')).toContainText(title);

    // Find the row by title and click Edit
    const replyRow = page
      .getByTestId('canned-replies-list')
      .locator('div')
      .filter({ hasText: title })
      .first();
    await replyRow.getByRole('button', { name: 'Edit' }).click();

    // Edit modal opens pre-filled with the current body
    await expect(page.getByPlaceholder('Reply body')).toBeVisible();
    await page.getByPlaceholder('Reply body').clear();
    await page.getByPlaceholder('Reply body').fill(updatedBody);

    // Save changes
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByPlaceholder('Reply body')).toBeHidden({ timeout: 8_000 });

    // Updated body now visible in the list
    await expect(page.getByTestId('canned-replies-list')).toContainText(updatedBody.slice(0, 30));
  });

  test('admin deletes a canned reply and it is removed from the list', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoCannedReplies(page);

    const suffix = Date.now().toString().slice(-6);
    const title  = `E2E Delete ${suffix}`;

    await createCannedReply(page, title, `Body to delete ${suffix}`);
    await expect(page.getByTestId('canned-replies-list')).toContainText(title);

    // Find the row and delete
    const replyRow = page
      .getByTestId('canned-replies-list')
      .locator('div')
      .filter({ hasText: title })
      .first();

    page.once('dialog', (dialog) => dialog.accept());
    await replyRow.getByRole('button', { name: 'Delete' }).click();

    // The reply should be gone from the list
    await expect(page.getByTestId('canned-replies-list')).not.toContainText(title, { timeout: 8_000 });
  });

  test('Add button is disabled when title or body is empty', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoCannedReplies(page);

    await page.getByTestId('add-canned-reply').click();
    await expect(page.getByPlaceholder('Title')).toBeVisible();

    // Both fields empty — Add should be disabled
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();

    // Fill only title — still disabled
    await page.getByPlaceholder('Title').fill('Title only');
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();

    // Fill body too — now enabled
    await page.getByPlaceholder('Reply body').fill('Some reply body text');
    await expect(page.getByRole('button', { name: 'Add' })).toBeEnabled();
  });

  test('cancelling the create modal discards changes and closes the modal', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoCannedReplies(page);

    await page.getByTestId('add-canned-reply').click();
    await expect(page.getByPlaceholder('Title')).toBeVisible();

    await page.getByPlaceholder('Title').fill('Abandoned reply');
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal is gone
    await expect(page.getByPlaceholder('Title')).toBeHidden();

    // The abandoned title should not appear in the list
    await expect(page.getByTestId('canned-replies-list')).not.toContainText('Abandoned reply');
  });

});
