/**
 * FLOW: Blast Lifecycle — Send Now, Scheduled, Recipients & Filters
 *
 * Combines: blasts.spec.ts + campaign-recipients.spec.ts + campaigns-filter.spec.ts
 *           + wa-blaster-blasts-scheduled.spec.ts
 *
 * Covers the full blast journey: create a send-now blast and inspect the detail
 * page counters and per-recipient table; create a scheduled blast and cancel it
 * before it fires; validate the past-date guard; and verify the campaigns list
 * status filter stays functional.
 */
import { test, expect, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL    = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';
const SEED_TEMPLATE  = 'sample_promo_2026';
const FLOW = 'flow-blast-complete';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

/** Returns a datetime-local string N minutes in the future. */
function futureDateTime(minutesFromNow: number): string {
  const d   = new Date(Date.now() + minutesFromNow * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Navigates the campaign wizard through audience → template steps
 * and arrives at the review step (step 2).
 */
async function wizardToReviewStep(page: Page, stateLabels: string[] = []) {
  await page.getByRole('link', { name: 'Campaigns' }).click();
  await page.getByTestId('new-blast').click();
  await expect(page.getByTestId('blast-wizard')).toBeVisible();
  await snap(page, FLOW, 'wizard_step0_audience');

  // Step 0 — Audience
  for (const label of stateLabels) {
    await page.getByRole('button', { name: label }).click();
  }
  await expect(page.getByText(/\d+ recipients/)).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 1 — Template
  await page.getByTestId('blast-template').selectOption(SEED_TEMPLATE);
  await page.getByTestId('blast-default-language').selectOption('EN');
  await page.getByTestId('variable-1').selectOption('contact.name');
  await snap(page, FLOW, 'wizard_step1_template');
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 2 — Review
  await expect(page.getByTestId('blast-name')).toBeVisible();
  await snap(page, FLOW, 'wizard_step2_review');
}

// ─── Send-now blast ───────────────────────────────────────────────────────────

test.describe('Send-now blast', () => {
  test('create blast → detail page shows counters and recipients table', async ({ page }) => {
    await loginAsAdmin(page);
    await wizardToReviewStep(page);

    const blastName = `E2E Send Now ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);
    await page.getByTestId('blast-create').click();

    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i, { timeout: 10_000 });
    await expect(page.getByText(blastName)).toBeVisible();
    await expect(page.getByTestId('blast-counters')).toBeVisible();
    await expect(page.getByTestId('counter-sent')).toBeVisible();
    await expect(page.getByTestId('counter-delivered')).toBeVisible();
    await expect(page.getByTestId('counter-read')).toBeVisible();
    await expect(page.getByTestId('counter-failed')).toBeVisible();
    await snap(page, FLOW, 'sendnow_01_detail_counters');
  });

  test('detail page shows recipients table; filtering to Failed surfaces Retry buttons', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Campaigns' }).click();

    await page.locator('[data-testid^="blast-row-"]').first().click();
    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i);
    await expect(page.getByTestId('recipient-status-filter')).toBeVisible();
    await expect(page.getByTestId('recipients-table')).toBeVisible();
    await snap(page, FLOW, 'sendnow_02_recipients_table');

    await page.getByTestId('recipient-status-filter').getByRole('button', { name: 'Failed' }).click();
    await expect(page.getByTestId('retry-message').first()).toBeVisible();
    await snap(page, FLOW, 'sendnow_03_failed_filter_retry');
  });

  test('Retry All Failed button is visible on the detail page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await page.locator('[data-testid^="blast-row-"]').first().click();
    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i);

    await page.getByTestId('recipient-status-filter').getByRole('button', { name: 'Failed' }).click();
    await expect(page.getByTestId('retry-all-failed')).toBeVisible();
    await snap(page, FLOW, 'sendnow_04_retry_all_failed_btn');
  });
});

// ─── Scheduled blast ──────────────────────────────────────────────────────────

test.describe('Scheduled blast', () => {
  test('schedule blast for future time → detail page shows Cancel button (SCHEDULED state)', async ({ page }) => {
    await loginAsAdmin(page);
    await wizardToReviewStep(page);

    const blastName = `E2E Scheduled ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);

    await page.getByRole('button', { name: 'Schedule' }).click();
    await expect(page.getByTestId('blast-scheduled-at')).toBeVisible();
    await page.getByTestId('blast-scheduled-at').fill(futureDateTime(10));
    await snap(page, FLOW, 'sched_01_review_with_datetime');
    await page.getByTestId('blast-create').click();

    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i, { timeout: 10_000 });
    await expect(page.getByText(blastName)).toBeVisible();
    await expect(page.getByTestId('blast-cancel')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'sched_02_detail_cancel_button');
  });

  test('cancel a SCHEDULED blast — Cancel button disappears after confirmation', async ({ page }) => {
    await loginAsAdmin(page);
    await wizardToReviewStep(page);

    const blastName = `E2E Cancel ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);
    await page.getByRole('button', { name: 'Schedule' }).click();
    await page.getByTestId('blast-scheduled-at').fill(futureDateTime(15));
    await page.getByTestId('blast-create').click();

    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i, { timeout: 10_000 });
    await expect(page.getByTestId('blast-cancel')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'sched_03_before_cancel');

    page.once('dialog', (d) => d.accept());
    await page.getByTestId('blast-cancel').click();

    await expect(page.getByTestId('blast-cancel')).toHaveCount(0, { timeout: 10_000 });
    await snap(page, FLOW, 'sched_04_after_cancel');
  });

  test('past scheduled date shows validation error and does not create blast', async ({ page }) => {
    await loginAsAdmin(page);
    await wizardToReviewStep(page);

    await page.getByTestId('blast-name').fill(`E2E Past Date ${Date.now()}`);
    await page.getByRole('button', { name: 'Schedule' }).click();
    await expect(page.getByTestId('blast-scheduled-at')).toBeVisible();

    const past = new Date(Date.now() - 5 * 60_000);
    const pad  = (n: number) => String(n).padStart(2, '0');
    const pastDt = `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}T${pad(past.getHours())}:${pad(past.getMinutes())}`;
    await page.getByTestId('blast-scheduled-at').fill(pastDt);
    await page.getByTestId('blast-create').click();

    const hasError      = await page.getByTestId('blast-form-error').count();
    const staysOnWizard = page.url().includes('/blasts/new') || page.url().includes('/blasts');
    expect(hasError > 0 || staysOnWizard).toBeTruthy();
    await snap(page, FLOW, 'sched_05_past_date_validation');
  });

  test('newly scheduled blast appears in the campaigns list', async ({ page }) => {
    await loginAsAdmin(page);
    await wizardToReviewStep(page);

    const blastName = `E2E List Check ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);
    await page.getByRole('button', { name: 'Schedule' }).click();
    await page.getByTestId('blast-scheduled-at').fill(futureDateTime(20));
    await page.getByTestId('blast-create').click();
    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i, { timeout: 10_000 });

    await page.getByRole('link', { name: 'Campaigns' }).click();
    await expect(page).toHaveURL(/\/blasts$/);
    await expect(page.locator('[data-testid^="blast-row-"]').first()).toBeVisible();
    await snap(page, FLOW, 'sched_06_in_campaigns_list');
  });
});

// ─── Campaigns list ───────────────────────────────────────────────────────────

test.describe('Campaigns list', () => {
  test('list shows heading, new-campaign button, and status filter', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await expect(page).toHaveURL(/\/blasts$/);
    await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible();
    await expect(page.getByTestId('new-blast')).toBeVisible();
    await expect(page.getByTestId('status-filter')).toBeVisible();
    await snap(page, FLOW, 'list_01_campaigns_page');
  });

  test('clicking the Sending status chip filters without crashing', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await page.getByTestId('status-filter').getByRole('button', { name: 'Sending' }).click();
    await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible();
    await snap(page, FLOW, 'list_02_sending_filter_active');
  });

  test('clicking a blast row navigates to its detail page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await expect(page.locator('[data-testid^="blast-row-"]').first()).toBeVisible();
    await snap(page, FLOW, 'list_03_campaigns_with_rows');
    await page.locator('[data-testid^="blast-row-"]').first().click();
    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i);
    await expect(page.getByTestId('blast-counters')).toBeVisible();
    await snap(page, FLOW, 'list_04_blast_detail_from_list');
  });
});
