/**
 * FLOW: Inbox — Ticket-Based Queue Management
 *
 * Covers the dual-mode inbox introduced in the WA-Blaster redesign:
 *  - Mode toggle: Auto-replied (AI audit) vs Needs Human (ticket queue)
 *  - Needs Human: ticket queue (Active/Closed tabs), resolve flow,
 *    agent-assist panel (suggest-draft, agent-context-card, saved-replies)
 *  - Sidebar escalation badge
 *  - Canned replies CRUD via Settings
 *
 * Ticket seeding uses the Admin Simulator (/api/sim/inbound), which runs
 * the chatbot synchronously and — when the engine escalates — creates an
 * AutopilotEvent + Ticket that appear in the Needs Human queue.
 *
 * ⚠️  Ticket-dependent tests require the server to run with:
 *       SIMULATOR_ENABLED=true   WHATSAPP_MOCK_MODE=true
 */
import { test, expect, request, type APIRequestContext, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!';
const API_BASE       = process.env.API_BASE            ?? 'http://localhost:3000';
const FLOW = 'flow-inbox-complete';

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

/**
 * Inject a message via the admin simulator. The chatbot runs synchronously;
 * if it escalates, an AutopilotEvent + Ticket are created immediately.
 * Requires SIMULATOR_ENABLED=true + WHATSAPP_MOCK_MODE=true on the server.
 */
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

// ─── Mode toggle ───────────────────────────────────────────────────────────────

test.describe('Inbox mode toggle', () => {
  test('inbox shows Auto-replied and Needs Human mode buttons', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByRole('button', { name: /auto.replied/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /needs.human/i })).toBeVisible();
    await snap(page, FLOW, 'mode_01_two_mode_buttons');
  });

  test('switching to Auto-replied mode shows AI conversations or empty state', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await page.getByRole('button', { name: /auto.replied/i }).click();
    await expect(
      page.getByText(/no auto-replied conversations yet/i)
        .or(page.getByText(/fully auto-handled/i)),
    ).toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'mode_02_auto_replied_content');
  });

  test('Needs Human mode shows Active and Closed tab buttons', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    // Needs Human is the default mode (Inbox.tsx initialises mode to 'needs')
    await expect(page.getByRole('button', { name: /^Active/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /^Closed/i })).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'mode_03_needs_human_tabs');
  });
});

// ─── Ticket queue ──────────────────────────────────────────────────────────────

test.describe('Ticket queue', () => {
  test('escalation via simulator creates a ticket and Resolve/Close buttons appear', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(
      token,
      '+60111000401',
      `E2E escalation ${Date.now()} — unusual ownership dispute and refund request`,
    );

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');

    // NeedsHumanMode auto-selects the first active ticket; resolve-ticket button
    // appears in the ticket detail pane once a ticket is selected.
    await expect(page.getByTestId('resolve-ticket')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('close-ticket')).toBeVisible();
    await snap(page, FLOW, 'queue_01_resolve_close_visible');
  });

  test('resolve ticket: picks SKIP disposition → modal closes → toast appears', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(
      token,
      '+60111000402',
      `E2E resolve-test ${Date.now()} — complaint about portal access issue`,
    );

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');

    await expect(page.getByTestId('resolve-ticket')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('resolve-ticket').click();

    // SaveToKnowledgeModal opens
    await expect(page.getByTestId('save-kb-modal')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'queue_02_save_kb_modal');

    // Select "Don't save" and confirm
    await page.getByTestId('disposition-SKIP').click();
    await page.getByTestId('kb-confirm').click();

    // Modal closes; toast "Ticket resolved" appears
    await expect(page.getByTestId('save-kb-modal')).toHaveCount(0, { timeout: 8_000 });
    await expect(page.getByText('Ticket resolved')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'queue_03_ticket_resolved_toast');
  });

  test('resolved ticket moves to the Closed tab', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(
      token,
      '+60111000403',
      `E2E closed-tab ${Date.now()} — sensitive account deletion inquiry`,
    );

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');

    await expect(page.getByTestId('resolve-ticket')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('resolve-ticket').click();
    await expect(page.getByTestId('save-kb-modal')).toBeVisible({ timeout: 8_000 });
    await page.getByTestId('disposition-SKIP').click();
    await page.getByTestId('kb-confirm').click();
    await expect(page.getByTestId('save-kb-modal')).toHaveCount(0, { timeout: 8_000 });

    // Switch to Closed tab — resolved ticket should be there
    await page.getByRole('button', { name: /^Closed/i }).click();
    // At least one ticket exists in the closed list
    await expect(page.locator('[style*="border"]').filter({ hasText: /Closed|Resolved/i }).first())
      .toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'queue_04_ticket_in_closed_tab');
  });
});

// ─── Agent assist ──────────────────────────────────────────────────────────────

test.describe('Agent assist panel', () => {
  test('active ticket with open window shows suggest-draft and agent-context-card', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(
      token,
      '+60111000404',
      `E2E agent-assist ${Date.now()} — complex credit pricing dispute query`,
    );

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');

    // suggest-draft is always rendered in the active-ticket composer (windowOpen && !isClosed)
    await expect(page.getByTestId('suggest-draft')).toBeVisible({ timeout: 15_000 });
    // agent-context-card is rendered when agentCtx returns data for the ticket
    await expect(page.getByTestId('agent-context-card')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'assist_01_agent_panel_visible');
  });

  test('saved-replies dropdown visible when canned replies exist', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Ensure at least one canned reply exists
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Canned replies' }).click();
    await expect(page.getByTestId('canned-replies-list')).toBeVisible();
    const listText = await page.getByTestId('canned-replies-list').textContent();
    if (!listText || listText.trim() === '') {
      await page.getByTestId('add-canned-reply').click();
      await page.getByPlaceholder('Title').fill('E2E Test Saved Reply');
      await page.getByPlaceholder('Reply body').fill('This is a canned reply used in E2E testing.');
      await page.getByRole('button', { name: 'Add' }).click();
      await expect(page.getByPlaceholder('Title')).toBeHidden({ timeout: 8_000 });
    }

    const token = await adminToken();
    await seedEscalation(
      token,
      '+60111000405',
      `E2E saved-replies ${Date.now()} — need help with low confidence JPJ query`,
    );

    await page.goto('/inbox');
    await expect(page.getByTestId('suggest-draft')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('saved-replies')).toBeVisible({ timeout: 8_000 });
    await snap(page, FLOW, 'assist_02_saved_replies_dropdown');
  });
});

// ─── Sidebar badge ─────────────────────────────────────────────────────────────

test.describe('Sidebar badge', () => {
  test('sidebar inbox badge is visible when active tickets exist', async ({ page }) => {
    const token = await adminToken();
    await seedEscalation(
      token,
      '+60111000406',
      `E2E badge-test ${Date.now()} — unusual refund request outside policy`,
    );

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/');
    await expect(page.getByTestId('sidebar-inbox-badge')).toBeVisible({ timeout: 20_000 });
    await snap(page, FLOW, 'badge_01_sidebar_badge_visible');
  });
});

// ─── Canned replies ────────────────────────────────────────────────────────────

test.describe('Canned replies', () => {
  test('create → edit → delete via Settings', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Canned replies' }).click();
    await expect(page.getByTestId('canned-replies-list')).toBeVisible();
    await snap(page, FLOW, 'canned_01_list');

    const suffix = Date.now().toString().slice(-6);
    const title  = `E2E Canned ${suffix}`;
    const body   = `Automated test reply ${suffix}`;

    await page.getByTestId('add-canned-reply').click();
    await page.getByPlaceholder('Title').fill(title);
    await page.getByPlaceholder('Reply body').fill(body);
    await snap(page, FLOW, 'canned_02_form_filled');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByPlaceholder('Title')).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId('canned-replies-list')).toContainText(title);
    await snap(page, FLOW, 'canned_03_added');

    const row = page.getByTestId('canned-replies-list').locator('div').filter({ hasText: title }).first();
    await row.getByRole('button', { name: 'Edit' }).click();
    await page.getByPlaceholder('Reply body').clear();
    await page.getByPlaceholder('Reply body').fill(`Updated reply ${suffix}`);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByPlaceholder('Reply body')).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId('canned-replies-list')).toContainText('Updated reply');
    await snap(page, FLOW, 'canned_04_edited');

    const updatedRow = page.getByTestId('canned-replies-list').locator('div').filter({ hasText: title }).first();
    page.once('dialog', (d) => d.accept());
    await updatedRow.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByTestId('canned-replies-list')).not.toContainText(title, { timeout: 8_000 });
    await snap(page, FLOW, 'canned_05_deleted');
  });

  test('Add button is disabled until both title and body are filled', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Canned replies' }).click();

    await page.getByTestId('add-canned-reply').click();
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();
    await snap(page, FLOW, 'canned_06_add_btn_disabled_empty');

    await page.getByPlaceholder('Title').fill('Title only');
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();

    await page.getByPlaceholder('Reply body').fill('Now both fields filled');
    await expect(page.getByRole('button', { name: 'Add' })).toBeEnabled();
    await snap(page, FLOW, 'canned_07_add_btn_enabled_filled');
  });
});
