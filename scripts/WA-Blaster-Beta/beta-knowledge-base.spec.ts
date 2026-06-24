/**
 * BETA SUITE 10 — Knowledge Base
 *
 * Tests the Knowledge Base disposition choices available when resolving a
 * ticket: SKIP (don't save), IMPORT_LIVE (save as approved article), and
 * SAVE_DRAFT (save as KB draft). Uses the admin simulator to seed escalations.
 *
 * Requires SIMULATOR_ENABLED=true + WHATSAPP_MOCK_MODE=true on the server.
 */
import { test, expect, request, type APIRequestContext, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL     = process.env.E2E_ADMIN_EMAIL     ?? 'admin@example.com';
const ADMIN_PASSWORD  = process.env.E2E_ADMIN_PASSWORD  ?? 'ChangeMe123!';
const API_BASE        = process.env.API_BASE             ?? 'http://localhost:3000';
const KB_PHONE_PREFIX = process.env.E2E_KB_PHONE_PREFIX ?? '+6011120040';
const FLOW = 'beta-knowledge-base';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

async function adminToken(): Promise<string> {
  const ctx: APIRequestContext = await request.newContext();
  try {
    const res = await ctx.post(`${API_BASE}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(res.ok()).toBeTruthy();
    const { accessToken } = await res.json();
    return accessToken;
  } finally {
    await ctx.dispose();
  }
}

async function seedEscalation(token: string, phone: string, text: string): Promise<void> {
  const ctx: APIRequestContext = await request.newContext();
  try {
    const res = await ctx.post(`${API_BASE}/api/sim/inbound`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { phone, text },
    });
    expect(res.status()).toBeLessThan(300);
  } finally {
    await ctx.dispose();
  }
}

// ─── SaveToKnowledgeModal dispositions ───────────────────────────────────────

test.describe('Knowledge Base disposition modal', () => {
  test('SaveToKnowledgeModal offers SKIP, IMPORT_LIVE, and SAVE_DRAFT options', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(token, `${KB_PHONE_PREFIX}1`,
      `BETA KB modal ${Date.now()} — unusual refund outside policy`);

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByTestId('resolve-ticket')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('resolve-ticket').click();

    await expect(page.getByTestId('save-kb-modal')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId('disposition-SKIP')).toBeVisible();
    await expect(page.getByTestId('disposition-IMPORT_LIVE')).toBeVisible();
    await expect(page.getByTestId('disposition-SAVE_DRAFT')).toBeVisible();
    await snap(page, FLOW, 'modal_01_all_options');
  });

  test('SKIP disposition closes modal and shows resolved toast', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(token, `${KB_PHONE_PREFIX}2`,
      `BETA KB skip ${Date.now()} — account access question`);

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByTestId('resolve-ticket')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('resolve-ticket').click();

    await expect(page.getByTestId('save-kb-modal')).toBeVisible({ timeout: 8_000 });
    await page.getByTestId('disposition-SKIP').click();
    await page.getByTestId('kb-confirm').click();

    await expect(page.getByTestId('save-kb-modal')).toHaveCount(0, { timeout: 8_000 });
    await expect(page.getByText('Ticket resolved')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'modal_02_skip_resolved');
  });

  test('SAVE_DRAFT disposition closes modal and shows resolved toast', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(token, `${KB_PHONE_PREFIX}3`,
      `BETA KB draft ${Date.now()} — portal login issue`);

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByTestId('resolve-ticket')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('resolve-ticket').click();

    await expect(page.getByTestId('save-kb-modal')).toBeVisible({ timeout: 8_000 });
    await page.getByTestId('disposition-SAVE_DRAFT').click();
    await page.getByTestId('kb-confirm').click();

    await expect(page.getByTestId('save-kb-modal')).toHaveCount(0, { timeout: 8_000 });
    await expect(page.getByText('Ticket resolved')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'modal_03_draft_resolved');
  });

  test('IMPORT_LIVE disposition closes modal and shows resolved toast', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(token, `${KB_PHONE_PREFIX}4`,
      `BETA KB import ${Date.now()} — credit pricing query`);

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByTestId('resolve-ticket')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('resolve-ticket').click();

    await expect(page.getByTestId('save-kb-modal')).toBeVisible({ timeout: 8_000 });
    await page.getByTestId('disposition-IMPORT_LIVE').click();
    await page.getByTestId('kb-confirm').click();

    await expect(page.getByTestId('save-kb-modal')).toHaveCount(0, { timeout: 8_000 });
    await expect(page.getByText('Ticket resolved')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'modal_04_import_resolved');
  });

  test('kb-confirm button is disabled until a disposition is selected', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(token, `${KB_PHONE_PREFIX}5`,
      `BETA KB confirm ${Date.now()} — vehicle registration help`);

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByTestId('resolve-ticket')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('resolve-ticket').click();

    await expect(page.getByTestId('save-kb-modal')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId('kb-confirm')).toBeDisabled();
    await page.getByTestId('disposition-SKIP').click();
    await expect(page.getByTestId('kb-confirm')).toBeEnabled();
    await snap(page, FLOW, 'modal_05_confirm_enables');
  });
});
