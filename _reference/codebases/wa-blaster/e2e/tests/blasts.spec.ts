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

test.describe('Blasts smoke', () => {
  test('admin schedules a blast and sees progress in detail page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await page.getByTestId('new-blast').click();

    await expect(page.getByTestId('blast-wizard')).toBeVisible();

    // ── Step 0: Audience ──────────────────────────────────────────────────────
    // Leave all chips unselected (all states, all specializations) so the
    // audience defaults to ALL opted-in PHONE dealers (seeded: ≥8 records).
    // Wait for the audience count to appear (any number > 0 from seed data).
    await expect(page.getByText(/\d+ recipients/)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 1: Template ──────────────────────────────────────────────────────
    // The seeded sample_promo_2026 template (APPROVED, EN + MS) is the only option.
    // Use the hidden compat select to set it programmatically.
    await page.getByTestId('blast-template').selectOption('sample_promo_2026');
    await page.getByTestId('blast-default-language').selectOption('EN');
    // Variable mapping for the single variable in sample_promo_2026
    await page.getByTestId('variable-1').selectOption('contact.name');
    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 2: Review ────────────────────────────────────────────────────────
    const blastName = `E2E Blast ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);
    // "Send now" chip is selected by default — no schedule needed.
    await page.getByTestId('blast-create').click();

    // ── Detail page ───────────────────────────────────────────────────────────
    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i, { timeout: 10_000 });
    await expect(page.getByText(blastName)).toBeVisible();
    await expect(page.getByTestId('blast-counters')).toBeVisible();

    // Counter UI should render (counter-sent replaces counter-failed from old UI)
    await expect(page.getByTestId('counter-sent')).toBeVisible();
    await expect(page.getByTestId('counter-delivered')).toBeVisible();
    await expect(page.getByTestId('counter-read')).toBeVisible();
    // counter-replied replaced counter-failed in the new design
    await expect(page.getByTestId('counter-replied')).toBeVisible();
  });

  test('blasts list shows heading and new-campaign button', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Campaigns' }).click();
    // List heading is "Campaigns" in the new design
    await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible();
    // New campaign button should be present
    await expect(page.getByTestId('new-blast')).toBeVisible();
  });
});
