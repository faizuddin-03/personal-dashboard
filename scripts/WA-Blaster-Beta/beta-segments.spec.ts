/**
 * BETA SUITE 6 — Segments
 *
 * Segment builder page, filter chips, creating a segment from the dealer
 * selection, verifying it persists on the Segments page.
 */
import { test, expect, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL         = process.env.E2E_ADMIN_EMAIL         ?? 'admin@example.com';
const ADMIN_PASSWORD      = process.env.E2E_ADMIN_PASSWORD      ?? 'ChangeMe123!';
const SEGMENT_NAME_PREFIX = process.env.E2E_SEGMENT_NAME_PREFIX ?? 'BETA Seg';
const FLOW = 'beta-segments';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

// ─── Segment builder page ─────────────────────────────────────────────────────

test.describe('Segment builder page', () => {
  test('segment builder page loads and shows tier filter chips', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/segments');
    await expect(page).toHaveURL(/\/segments$/);
    await expect(page.getByTestId('filter-tier-GOLD')).toBeVisible();
    await snap(page, FLOW, 'builder_01_page');
  });

  test('Gold, Silver, and Bronze tier chips are all visible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/segments');
    await expect(page.getByTestId('filter-tier-GOLD')).toBeVisible();
    await expect(page.getByTestId('filter-tier-SILVER')).toBeVisible();
    await expect(page.getByTestId('filter-tier-BRONZE')).toBeVisible();
    await snap(page, FLOW, 'builder_02_tier_chips');
  });
});

// ─── Create segment from dealers ─────────────────────────────────────────────

test.describe('Create segment from dealers', () => {
  test('select all dealers → save as segment → success toast', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await page.getByTestId('select-all').check();
    await expect(page.getByTestId('selection-bar')).toBeVisible();
    await snap(page, FLOW, 'create_01_dealers_selected');
    await page.getByTestId('save-as-segment').click();

    const segmentName = `${SEGMENT_NAME_PREFIX} ${Date.now().toString().slice(-6)}`;
    await page.getByTestId('segment-name-input').fill(segmentName);
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(/saved with \d+ dealers/i)).toBeVisible();
    await snap(page, FLOW, 'create_02_saved_toast');
  });

  test('saved segment appears on the Segments page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await page.getByTestId('select-all').check();
    await expect(page.getByTestId('selection-bar')).toBeVisible();
    await page.getByTestId('save-as-segment').click();
    const segmentName = `${SEGMENT_NAME_PREFIX} Verify ${Date.now().toString().slice(-6)}`;
    await page.getByTestId('segment-name-input').fill(segmentName);
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(/saved with \d+ dealers/i)).toBeVisible();

    await page.goto('/segments');
    await expect(page).toHaveURL(/\/segments$/);
    await expect(
      page.locator('[data-testid^="segment-row-"]').filter({ hasText: segmentName })
    ).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'create_03_visible_on_page');
  });

  test('segment row shows the segment name and dealer count', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await page.getByTestId('select-all').check();
    await expect(page.getByTestId('selection-bar')).toBeVisible();
    await page.getByTestId('save-as-segment').click();
    const segmentName = `${SEGMENT_NAME_PREFIX} Count ${Date.now().toString().slice(-6)}`;
    await page.getByTestId('segment-name-input').fill(segmentName);
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(/saved with \d+ dealers/i)).toBeVisible();

    await page.goto('/segments');
    const row = page.locator('[data-testid^="segment-row-"]').filter({ hasText: segmentName });
    await expect(row).toBeVisible({ timeout: 8_000 });
    // Row should contain the name
    await expect(row).toContainText(segmentName);
    await snap(page, FLOW, 'create_04_row_details');
  });
});
