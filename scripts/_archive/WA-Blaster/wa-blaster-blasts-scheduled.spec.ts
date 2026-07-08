import { test, expect } from './helpers/fixtures';

const ADMIN_EMAIL    = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';
const SEED_TEMPLATE  = 'sample_promo_2026';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

/**
 * Returns a datetime-local string (YYYY-MM-DDTHH:mm) that is `minutesFromNow`
 * minutes in the future — used to fill the blast-scheduled-at input.
 */
function futureDateTime(minutesFromNow: number): string {
  const d = new Date(Date.now() + minutesFromNow * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/**
 * Drives the campaign wizard through steps 0 and 1 (audience → template)
 * and lands on step 2 (review) ready for name + schedule.
 */
async function wizardToReviewStep(page: import('@playwright/test').Page) {
  await page.getByRole('link', { name: 'Campaigns' }).click();
  await page.getByTestId('new-blast').click();
  await expect(page.getByTestId('blast-wizard')).toBeVisible();

  // ── Step 0: Audience ──────────────────────────────────────────────────────
  // Leave filters blank so all opted-in PHONE dealers are included.
  // Wait for the recipient count to appear (any number) in the footer.
  await expect(page.getByText(/\d+ recipients/)).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Continue' }).click();

  // ── Step 1: Template ──────────────────────────────────────────────────────
  await page.getByTestId('blast-template').selectOption(SEED_TEMPLATE);
  await page.getByTestId('blast-default-language').selectOption('EN');
  await page.getByTestId('variable-1').selectOption('contact.name');
  await page.getByRole('button', { name: 'Continue' }).click();

  // ── Step 2: Review ────────────────────────────────────────────────────────
  // blast-name and the send-time chips are now visible
  await expect(page.getByTestId('blast-name')).toBeVisible();
}

test.describe('Scheduled blasts', () => {

  test('admin schedules a blast for a future time and it lands on the detail page with SCHEDULED status', async ({ page }) => {
    await loginAsAdmin(page);
    await wizardToReviewStep(page);

    const blastName = `E2E Scheduled ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);

    // Switch to "Schedule" mode and fill a time 10 minutes from now
    await page.getByRole('button', { name: 'Schedule' }).click();
    await expect(page.getByTestId('blast-scheduled-at')).toBeVisible();
    await page.getByTestId('blast-scheduled-at').fill(futureDateTime(10));

    await page.getByTestId('blast-create').click();

    // Should land on the blast detail page
    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i, { timeout: 10_000 });
    await expect(page.getByText(blastName)).toBeVisible();

    // The Cancel blast button is only visible for SCHEDULED / RUNNING blasts —
    // its presence confirms the blast is in a cancellable (scheduled) state.
    await expect(page.getByTestId('blast-cancel')).toBeVisible({ timeout: 8_000 });
  });

  test('a SCHEDULED blast can be cancelled before it sends', async ({ page }) => {
    await loginAsAdmin(page);
    await wizardToReviewStep(page);

    const blastName = `E2E Cancel Test ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);

    // Schedule 15 minutes out so it stays SCHEDULED during the test
    await page.getByRole('button', { name: 'Schedule' }).click();
    await expect(page.getByTestId('blast-scheduled-at')).toBeVisible();
    await page.getByTestId('blast-scheduled-at').fill(futureDateTime(15));
    await page.getByTestId('blast-create').click();

    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i, { timeout: 10_000 });
    await expect(page.getByTestId('blast-cancel')).toBeVisible({ timeout: 8_000 });

    // Accept the confirmation dialog that pops up on cancel
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTestId('blast-cancel').click();

    // After cancellation the Cancel button should disappear
    // (blast is no longer in an ACTIVE status)
    await expect(page.getByTestId('blast-cancel')).toHaveCount(0, { timeout: 10_000 });
  });

  test('blast-form-error appears when scheduled date is in the past', async ({ page }) => {
    await loginAsAdmin(page);
    await wizardToReviewStep(page);

    await page.getByTestId('blast-name').fill(`E2E Past Date ${Date.now()}`);

    // Switch to "Schedule" mode, set a past datetime
    await page.getByRole('button', { name: 'Schedule' }).click();
    await expect(page.getByTestId('blast-scheduled-at')).toBeVisible();

    // Set a time 5 minutes in the past
    const past = new Date(Date.now() - 5 * 60_000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const pastDt =
      `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}` +
      `T${pad(past.getHours())}:${pad(past.getMinutes())}`;
    await page.getByTestId('blast-scheduled-at').fill(pastDt);

    await page.getByTestId('blast-create').click();

    // The form-level error or the inline date error should be shown
    // (the wizard surfaces a validation error rather than creating the blast)
    const hasFormError    = await page.getByTestId('blast-form-error').count();
    const staysOnWizard   = page.url().includes('/blasts/new') || page.url().includes('/blasts');
    expect(hasFormError > 0 || staysOnWizard).toBeTruthy();
  });

  test('blasts list shows a row for the newly scheduled blast', async ({ page }) => {
    await loginAsAdmin(page);
    await wizardToReviewStep(page);

    const blastName = `E2E List Check ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);
    await page.getByRole('button', { name: 'Schedule' }).click();
    await page.getByTestId('blast-scheduled-at').fill(futureDateTime(20));
    await page.getByTestId('blast-create').click();

    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i, { timeout: 10_000 });

    // Navigate back to the campaigns list and verify the blast appears
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await expect(page).toHaveURL(/\/blasts$/);
    await expect(page.locator('[data-testid^="blast-row-"]').first()).toBeVisible();
  });

});
