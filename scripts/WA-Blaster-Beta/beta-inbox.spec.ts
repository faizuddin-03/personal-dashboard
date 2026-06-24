/**
 * BETA SUITE 4 — Inbox
 *
 * Ticket-based dual-mode inbox: mode toggle UI, ticket queue (escalation via
 * simulator, resolve flow with SaveToKnowledgeModal, Closed tab), agent-assist
 * panel, sidebar badge, and canned replies CRUD.
 *
 * Requires server running with SIMULATOR_ENABLED=true + WHATSAPP_MOCK_MODE=true
 */
import { test, expect, request, type APIRequestContext, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL         = process.env.E2E_ADMIN_EMAIL         ?? 'admin@example.com';
const ADMIN_PASSWORD      = process.env.E2E_ADMIN_PASSWORD      ?? 'ChangeMe123!';
const API_BASE            = process.env.API_BASE                ?? 'http://localhost:3000';
const INBOX_PHONE_PREFIX  = process.env.E2E_INBOX_PHONE_PREFIX  ?? '+6011110040';
const CANNED_REPLY_TITLE  = process.env.E2E_CANNED_REPLY_TITLE  ?? 'BETA Saved Reply';
const CANNED_REPLY_BODY   = process.env.E2E_CANNED_REPLY_BODY   ?? 'This is a BETA canned reply.';
const FLOW = 'beta-inbox';

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
    expect(res.ok(), `admin login failed: ${await res.text()}`).toBeTruthy();
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
    expect(res.status(), `sim/inbound failed (${res.status()}): ${await res.text()}`).toBeLessThan(300);
  } finally {
    await ctx.dispose();
  }
}

// ─── Mode toggle ──────────────────────────────────────────────────────────────

test.describe('Inbox mode toggle', () => {
  test('inbox shows Auto-replied and Needs Human mode buttons', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByRole('button', { name: /auto.replied/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /needs.human/i })).toBeVisible();
    await snap(page, FLOW, 'mode_01_toggle_buttons');
  });

  test('switching to Auto-replied mode shows AI conversations or empty state', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await page.getByRole('button', { name: /auto.replied/i }).click();
    await expect(
      page.getByText(/no auto-replied conversations yet/i)
        .or(page.getByText(/fully auto-handled/i)),
    ).toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'mode_02_auto_replied');
  });

  test('Needs Human mode shows Active and Closed tab buttons', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByRole('button', { name: /^Active/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /^Closed/i })).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'mode_03_active_closed_tabs');
  });
});

// ─── Ticket queue ──────────────────────────────────────────────────────────────

test.describe('Ticket queue', () => {
  test('escalation creates a ticket — Resolve and Close buttons appear', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(token, `${INBOX_PHONE_PREFIX}1`,
      `BETA escalation ${Date.now()} — unusual ownership dispute and refund request`);

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');

    await expect(page.getByTestId('resolve-ticket')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('close-ticket')).toBeVisible();
    await snap(page, FLOW, 'queue_01_resolve_close_visible');
  });

  test('resolve → SKIP disposition → modal closes → toast shown', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(token, `${INBOX_PHONE_PREFIX}2`,
      `BETA resolve ${Date.now()} — complaint about portal access`);

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');

    await expect(page.getByTestId('resolve-ticket')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('resolve-ticket').click();

    await expect(page.getByTestId('save-kb-modal')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'queue_02_kb_modal');
    await page.getByTestId('disposition-SKIP').click();
    await page.getByTestId('kb-confirm').click();

    await expect(page.getByTestId('save-kb-modal')).toHaveCount(0, { timeout: 8_000 });
    await expect(page.getByText('Ticket resolved')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'queue_03_resolved_toast');
  });

  test('resolved ticket moves to the Closed tab', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(token, `${INBOX_PHONE_PREFIX}3`,
      `BETA closed-tab ${Date.now()} — sensitive account deletion inquiry`);

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');

    await expect(page.getByTestId('resolve-ticket')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('resolve-ticket').click();
    await expect(page.getByTestId('save-kb-modal')).toBeVisible({ timeout: 8_000 });
    await page.getByTestId('disposition-SKIP').click();
    await page.getByTestId('kb-confirm').click();
    await expect(page.getByTestId('save-kb-modal')).toHaveCount(0, { timeout: 8_000 });

    await page.getByRole('button', { name: /^Closed/i }).click();
    await expect(
      page.locator('[style*="border"]').filter({ hasText: /Closed|Resolved/i }).first()
    ).toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'queue_04_in_closed_tab');
  });
});

// ─── Agent assist ──────────────────────────────────────────────────────────────

test.describe('Agent assist panel', () => {
  test('active ticket shows suggest-draft and agent-context-card', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(token, `${INBOX_PHONE_PREFIX}4`,
      `BETA agent-assist ${Date.now()} — complex credit pricing dispute`);

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');

    await expect(page.getByTestId('suggest-draft')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('agent-context-card')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'assist_01_panel');
  });

  test('saved-replies dropdown visible when canned replies exist', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Canned replies' }).click();
    await expect(page.getByTestId('canned-replies-list')).toBeVisible();
    const listText = await page.getByTestId('canned-replies-list').textContent();
    if (!listText || listText.trim() === '') {
      await page.getByTestId('add-canned-reply').click();
      await page.getByPlaceholder('Title').fill(CANNED_REPLY_TITLE);
      await page.getByPlaceholder('Reply body').fill(CANNED_REPLY_BODY);
      await page.getByRole('button', { name: 'Add' }).click();
      await expect(page.getByPlaceholder('Title')).toBeHidden({ timeout: 8_000 });
    }

    const token = await adminToken();
    await seedEscalation(token, `${INBOX_PHONE_PREFIX}5`,
      `BETA saved-replies ${Date.now()} — low confidence JPJ query`);

    await page.goto('/inbox');
    await expect(page.getByTestId('suggest-draft')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('saved-replies')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'assist_02_saved_replies');
  });
});

// ─── Sidebar badge ─────────────────────────────────────────────────────────────

test.describe('Sidebar badge', () => {
  test('sidebar inbox badge is visible when active tickets exist', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(token, `${INBOX_PHONE_PREFIX}6`,
      `BETA badge ${Date.now()} — unusual refund outside policy`);

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/');
    await expect(page.getByTestId('sidebar-inbox-badge')).toBeVisible({ timeout: 20_000 });
    await snap(page, FLOW, 'badge_01_visible');
  });
});

// ─── Canned replies ────────────────────────────────────────────────────────────

test.describe('Canned replies', () => {
  test('create → edit → delete via Settings', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Canned replies' }).click();
    await expect(page.getByTestId('canned-replies-list')).toBeVisible();

    const suffix = Date.now().toString().slice(-6);
    const title  = `BETA Canned ${suffix}`;

    await page.getByTestId('add-canned-reply').click();
    await page.getByPlaceholder('Title').fill(title);
    await page.getByPlaceholder('Reply body').fill(`BETA test reply ${suffix}`);
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByPlaceholder('Title')).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId('canned-replies-list')).toContainText(title);
    await snap(page, FLOW, 'canned_01_created');

    const row = page.getByTestId('canned-replies-list').locator('div').filter({ hasText: title }).first();
    await row.getByRole('button', { name: 'Edit' }).click();
    await page.getByPlaceholder('Reply body').clear();
    await page.getByPlaceholder('Reply body').fill(`Updated ${suffix}`);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByPlaceholder('Reply body')).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId('canned-replies-list')).toContainText('Updated');
    await snap(page, FLOW, 'canned_02_edited');

    const updatedRow = page.getByTestId('canned-replies-list').locator('div').filter({ hasText: title }).first();
    page.once('dialog', (d) => d.accept());
    await updatedRow.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByTestId('canned-replies-list')).not.toContainText(title, { timeout: 8_000 });
    await snap(page, FLOW, 'canned_03_deleted');
  });

  test('Add button disabled until both title and body are filled', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Canned replies' }).click();
    await page.getByTestId('add-canned-reply').click();
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();
    await page.getByPlaceholder('Title').fill('Title only');
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();
    await page.getByPlaceholder('Reply body').fill('Now both filled');
    await expect(page.getByRole('button', { name: 'Add' })).toBeEnabled();
    await snap(page, FLOW, 'canned_04_validation');
  });
});
