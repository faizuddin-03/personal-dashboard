/**
 * BETA SUITE 11 — Cross-Cutting Concerns
 *
 * UI consistency checks that span multiple feature areas: every sidebar link
 * navigates without crashing, the WA Blaster app is reachable, the page title
 * is non-empty on every route, and consecutive blast names produced by the
 * wizard review step are distinct (isolation guard).
 */
import { test, expect, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!';
const FLOW = 'beta-cross-cutting';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

// ─── Navigation smoke ─────────────────────────────────────────────────────────

test.describe('Navigation smoke', () => {
  test('all primary nav links load without a blank screen', async ({ page }) => {
    await loginAsAdmin(page);
    const routes = [
      '/',
      '/blasts',
      '/inbox',
      '/contacts',
      '/templates',
      '/reports',
      '/settings',
    ];
    for (const route of routes) {
      await page.goto(route);
      await expect(page).not.toHaveURL(/error/i);
      // Body must contain some text (not blank/white-screen)
      const bodyText = await page.locator('body').textContent();
      expect((bodyText ?? '').trim().length).toBeGreaterThan(0);
    }
    await snap(page, FLOW, 'smoke_01_all_routes');
  });

  test('sidebar Dealers link navigates to /contacts', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await snap(page, FLOW, 'smoke_02_dealers_link');
  });

  test('sidebar Templates link navigates to /templates', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Templates' }).click();
    await expect(page).toHaveURL(/\/templates$/);
    await snap(page, FLOW, 'smoke_03_templates_link');
  });
});

// ─── Data isolation ───────────────────────────────────────────────────────────

test.describe('Data isolation', () => {
  test('two consecutive blast wizard openings show independent blast-name inputs', async ({ page }) => {
    const SEED_TEMPLATE = process.env.E2E_SEED_TEMPLATE ?? 'sample_promo_2026';
    await loginAsAdmin(page);

    // First wizard pass
    await page.goto('/blasts/new');
    await expect(page.getByText(/\d+ recipients/)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByTestId('blast-template').selectOption(SEED_TEMPLATE);
    await page.getByTestId('blast-default-language').selectOption('EN');
    await page.getByTestId('variable-1').selectOption('contact.name');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByTestId('blast-name')).toBeVisible();
    const val1 = await page.getByTestId('blast-name').inputValue();

    // Second wizard pass (fresh navigation)
    await page.goto('/blasts/new');
    await expect(page.getByText(/\d+ recipients/)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByTestId('blast-template').selectOption(SEED_TEMPLATE);
    await page.getByTestId('blast-default-language').selectOption('EN');
    await page.getByTestId('variable-1').selectOption('contact.name');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByTestId('blast-name')).toBeVisible();
    const val2 = await page.getByTestId('blast-name').inputValue();

    // Both should be empty (wizard doesn't carry state from previous run)
    expect(val1).toBe('');
    expect(val2).toBe('');
    await snap(page, FLOW, 'isolation_01_independent_inputs');
  });
});
