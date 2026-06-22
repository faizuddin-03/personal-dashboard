/**
 * FLOW: Send Campaign — hand-pick a specific dealer and fire immediately
 *
 * ⚠️  WARNING: This test sends a real WhatsApp message to a real phone number.
 *     It is SKIPPED by default. Set E2E_SEND_CAMPAIGN=true to enable it.
 *
 * Steps:
 *  1. Login as admin
 *  2. Open Campaigns → New campaign
 *  3. Switch audience mode to "Pick specific dealers"
 *  4. Search for the target contact and select them
 *  5. Pick a template and language
 *  6. Review and send (Send Now)
 *  7. Verify blast detail page with counters
 *
 * Configurable via env vars:
 *   E2E_SEND_CAMPAIGN       — must be "true" to run (safety guard)
 *   E2E_CAMPAIGN_CONTACT    — dealer name to search for (default: Muhammad Faizuddin)
 *   E2E_CAMPAIGN_TEMPLATE   — approved template name to use (default: first available)
 *   E2E_CAMPAIGN_LANGUAGE   — language code, e.g. EN / MS / ZH (default: EN)
 */
import { test, expect, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!';
const CONTACT_NAME   = process.env.E2E_CAMPAIGN_CONTACT  ?? 'Muhammad Faizuddin';
const TEMPLATE_NAME  = process.env.E2E_CAMPAIGN_TEMPLATE ?? '';
const LANGUAGE       = process.env.E2E_CAMPAIGN_LANGUAGE ?? 'EN';
const FLOW           = 'flow-send-campaign';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

// ─── Send campaign to a specific dealer ───────────────────────────────────────

test.describe('Send campaign to specific dealer', () => {
  test.beforeEach(({ skip }) => {
    skip(
      process.env.E2E_SEND_CAMPAIGN !== 'true',
      '⚠️  Skipped — this test sends a real WhatsApp message. Set E2E_SEND_CAMPAIGN=true to enable.',
    );
  });

  test(`send campaign to ${CONTACT_NAME}`, async ({ page }) => {
    await loginAsAdmin(page);
    await snap(page, FLOW, 'send_00_logged_in');

    // ── Step 0: Audience ──────────────────────────────────────────────────────

    await page.getByRole('link', { name: 'Campaigns' }).click();
    await expect(page).toHaveURL(/\/blasts$/);
    await snap(page, FLOW, 'send_01_campaigns_page');

    await page.getByTestId('new-blast').click();
    await expect(page.getByTestId('blast-wizard')).toBeVisible();
    await snap(page, FLOW, 'send_02_wizard_audience_step');

    // Switch to "Pick specific dealers" mode
    await page.getByRole('button', { name: 'Pick specific dealers' }).click();
    await expect(page.getByTestId('audience-manual')).toBeVisible();
    await snap(page, FLOW, 'send_03_manual_mode_selected');

    // Search for the target dealer
    await page.getByTestId('dealer-search').fill(CONTACT_NAME);

    // Wait for debounce (300ms) + network
    await expect(
      page.locator('[data-testid^="dealer-row-"]').filter({ hasText: CONTACT_NAME }),
    ).toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'send_04_dealer_search_results');

    // Select the dealer by clicking their row
    await page.locator('[data-testid^="dealer-row-"]').filter({ hasText: CONTACT_NAME }).click();

    // Confirm selection is shown in the count and chips
    await expect(page.getByTestId('dealer-picker-count')).toContainText('1 dealer selected');
    await snap(page, FLOW, 'send_05_dealer_selected');

    // Continue to template step
    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 1: Template ──────────────────────────────────────────────────────

    await expect(page.getByTestId('blast-wizard')).toBeVisible();
    await snap(page, FLOW, 'send_06_wizard_template_step');

    if (TEMPLATE_NAME) {
      // Use the specified template
      await page.getByTestId('blast-template').selectOption(TEMPLATE_NAME);
    } else {
      // Pick the first available approved template card
      const firstCard = page.locator('[data-testid^="blast-template-card-"]').first();
      await expect(firstCard).toBeVisible({ timeout: 8_000 });
      await firstCard.click();
    }

    // Set language
    await page.getByTestId('blast-default-language').selectOption(LANGUAGE);
    await snap(page, FLOW, 'send_07_template_selected');

    // Map any template variables to contact.name if the field exists
    const variableField = page.getByTestId('variable-1');
    if (await variableField.isVisible()) {
      await variableField.selectOption('contact.name');
    }

    // Continue to review step
    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 2: Review ────────────────────────────────────────────────────────

    await expect(page.getByTestId('blast-name')).toBeVisible();
    await snap(page, FLOW, 'send_08_wizard_review_step');

    const blastName = `E2E Send to ${CONTACT_NAME} ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);
    await snap(page, FLOW, 'send_09_review_filled');

    // Send now (default mode — no schedule needed)
    await page.getByTestId('blast-create').click();

    // ── Result ────────────────────────────────────────────────────────────────

    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i, { timeout: 15_000 });
    await expect(page.getByText(blastName)).toBeVisible();
    await expect(page.getByTestId('blast-counters')).toBeVisible();
    await snap(page, FLOW, 'send_10_blast_detail');

    await expect(page.getByTestId('counter-sent')).toBeVisible();
    await expect(page.getByTestId('counter-delivered')).toBeVisible();
    await snap(page, FLOW, 'send_11_counters_visible');
  });
});
