/**
 * FLOW: Inbox — Full Conversation Management
 *
 * Combines: inbox.spec.ts + inbox-agent-assist.spec.ts + wa-blaster-canned-replies.spec.ts
 *
 * Covers the complete inbox workflow: seeding inbound messages, managing
 * conversations through their lifecycle (await → reply → resolve → reopen),
 * search, keyboard navigation, window-closed handling, sidebar badge, AI-assist
 * controls, and the canned replies that support agents in the inbox.
 */
import { test, expect, request, type APIRequestContext, type Page } from './helpers/fixtures';
import { createHmac } from 'crypto';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL       = process.env.E2E_ADMIN_EMAIL       ?? 'admin@example.com';
const ADMIN_PASSWORD    = process.env.E2E_ADMIN_PASSWORD    ?? 'ChangeMe123!';
const OPERATOR_EMAIL    = process.env.E2E_OPERATOR_EMAIL    ?? 'support@example.com';
const OPERATOR_PASSWORD = process.env.E2E_OPERATOR_PASSWORD ?? 'ChangeMe123!';
const REPLY_MESSAGE     = process.env.E2E_REPLY_MESSAGE     ?? 'I will help you shortly.';

const APP_SECRET =
  process.env.WHATSAPP_APP_SECRET ??
  process.env.META_APP_SECRET ??
  '3056575083ca35ce9aab0ddc07a705e0';
const API_BASE = process.env.API_BASE ?? 'http://localhost:3000';
const FLOW = 'flow-inbox-complete';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

async function seedInboundMessage(
  contactPhone: string,
  body: string,
  receivedAtSec?: number,
) {
  const ctx: APIRequestContext = await request.newContext();
  const waId = contactPhone.replace(/^\+/, '');
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'wba',
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '60123456000', phone_number_id: 'pn-test' },
          contacts: [{ wa_id: waId, profile: { name: 'E2E Sender' } }],
          messages: [{
            from: waId,
            id: `wamid.e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            timestamp: String(receivedAtSec ?? Math.floor(Date.now() / 1000)),
            type: 'text',
            text: { body },
          }],
        },
      }],
    }],
  };
  const raw       = JSON.stringify(payload);
  const signature = 'sha256=' + createHmac('sha256', APP_SECRET).update(raw).digest('hex');
  const res = await ctx.post(`${API_BASE}/api/webhooks/meta`, {
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
    data: raw,
  });
  expect(res.status(), `webhook POST failed: ${await res.text()}`).toBe(201);
  await ctx.dispose();
}

async function ensureCleanConversation(page: Page, contactPhone: string) {
  const waId  = contactPhone.replace(/^\+/, '');
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  const ctx   = await request.newContext();
  try {
    const search = await ctx.get(
      `${API_BASE}/api/contacts?search=${encodeURIComponent(waId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!search.ok()) return;
    const body = await search.json();
    const contact = (body.items ?? []).find(
      (c: { phoneE164: string; id: string }) =>
        c.phoneE164 === contactPhone || c.phoneE164.replace(/^\+/, '') === waId,
    );
    if (!contact) return;
    await ctx.post(
      `${API_BASE}/api/inbox/conversations/${contact.id}/reopen`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } finally {
    await ctx.dispose();
  }
}

// ─── Core conversation flow ───────────────────────────────────────────────────

test.describe('Conversation lifecycle', () => {
  test('inbound message appears in Awaiting tab', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const marker = `Hello from E2E ${Date.now()}`;
    await seedInboundMessage('+60123456789', marker);
    await page.goto('/inbox');
    await page.getByTestId('inbox-tab-awaiting').click();
    await expect(page.getByText(marker)).toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'conv_01_awaiting_tab_message');
  });

  test('replying to a message moves it to Replied and auto-resolves', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const phone  = '+60123456789';
    await ensureCleanConversation(page, phone);
    const marker = `Need help ${Date.now()}`;
    await seedInboundMessage(phone, marker);

    await page.goto('/inbox');
    await page.getByTestId('inbox-tab-awaiting').click();
    await page.getByText(marker).first().click();
    await snap(page, FLOW, 'conv_02_conversation_open');

    await page.getByTestId('inbox-composer').fill(REPLY_MESSAGE);
    await page.getByTestId('inbox-send-button').click();

    await page.getByTestId('inbox-tab-replied').click();
    await expect(page.getByText(marker)).toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'conv_03_moved_to_replied');

    await page.getByTestId('inbox-tab-all').click();
    await page.getByTestId('inbox-show-resolved-toggle').click();
    await expect(page.getByText(marker)).toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'conv_04_show_resolved_toggle');
  });

  test('manually mark resolved → hidden from active tabs → reopen restores it', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const phone  = '+60145678901'; // Priya Devi (seeded)
    await ensureCleanConversation(page, phone);
    const marker = `Manual resolve ${Date.now()}`;
    await seedInboundMessage(phone, marker);

    await page.goto('/inbox');
    await page.getByText(marker).first().click();
    await snap(page, FLOW, 'conv_05_conversation_before_resolve');
    await page.getByTestId('inbox-mark-resolved').click();

    await expect(page.getByText(marker)).toHaveCount(0, { timeout: 10_000 });
    await snap(page, FLOW, 'conv_06_resolved_hidden');

    await page.getByTestId('inbox-show-resolved-toggle').click();
    await page.getByText(marker).first().click();
    await page.getByTestId('inbox-reopen').click();
    await page.getByTestId('inbox-show-resolved-toggle').click();
    await expect(page.getByText(marker)).toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'conv_07_reopened');
  });

  test('window-closed: composer is locked and re-engage CTA appears', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const phone  = '+60198765432'; // Tan Wei Ming (seeded)
    const dayAgo = Math.floor(Date.now() / 1000) - 25 * 3600;
    const marker = `Old window ${Date.now()}`;
    await seedInboundMessage(phone, marker, dayAgo);

    await page.goto('/inbox');
    await page.getByTestId('inbox-tab-awaiting').click();
    await page.getByText(marker).first().click();

    await expect(page.getByTestId('inbox-composer-closed')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('inbox-composer')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /blasts/i }).first()).toBeVisible();
    await snap(page, FLOW, 'conv_08_window_closed_locked');
  });
});

// ─── Inbox navigation & search ────────────────────────────────────────────────

test.describe('Inbox navigation and search', () => {
  test('search filter narrows and then clears conversation list', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await seedInboundMessage('+60123456789', `search probe ${Date.now()}`);
    await page.goto('/inbox');
    await snap(page, FLOW, 'nav_01_inbox_list');

    await page.getByTestId('inbox-search').fill('Ahmad');
    await page.waitForTimeout(400);
    await expect(page.getByText(/Ahmad Bin Razak/i)).toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'nav_02_search_narrowed');

    await page.getByTestId('inbox-search').fill('definitely-no-such-name-xyzzy');
    await page.waitForTimeout(400);
    await expect(page.getByText(/Ahmad Bin Razak/i)).toHaveCount(0);
    await snap(page, FLOW, 'nav_03_search_empty');
  });

  test('keyboard shortcut j navigates into the first conversation', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await seedInboundMessage('+60123456789', `kb A ${Date.now()}`);
    await seedInboundMessage('+60198765432', `kb B ${Date.now()}`);
    await page.goto('/inbox');

    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid^="inbox-conversation-row-"]').length >= 2,
      undefined,
      { timeout: 10_000 },
    );
    await snap(page, FLOW, 'nav_04_two_conversations');
    await page.keyboard.press('j');
    await expect(page).toHaveURL(/\/inbox\/[a-f0-9-]+/i, { timeout: 5_000 });
    await snap(page, FLOW, 'nav_05_keyboard_j_opened_conv');
  });

  test('sidebar badge appears for unresolved inbound messages', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await seedInboundMessage('+60167891234', `badge ${Date.now()}`);
    await page.goto('/inbox');
    await expect(page.getByTestId('sidebar-inbox-badge')).toBeVisible({ timeout: 35_000 });
    await snap(page, FLOW, 'nav_06_sidebar_badge');
  });

  test('AI tabs (Auto-replied, Escalated) show Coming Soon without hitting inbox API', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await page.waitForLoadState('networkidle');

    let aiCalls = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/inbox/conversations')) aiCalls++;
    });

    await page.getByTestId('inbox-tab-auto').click();
    await expect(page.getByText(/coming soon/i)).toBeVisible();
    await snap(page, FLOW, 'nav_07_ai_auto_tab_coming_soon');
    await page.getByTestId('inbox-tab-esc').click();
    await expect(page.getByText(/coming soon/i)).toBeVisible();
    await snap(page, FLOW, 'nav_08_ai_esc_tab_coming_soon');
    await page.waitForTimeout(500);

    expect(aiCalls, 'AI tabs must not hit the conversations API').toBe(0);
  });

  test('operator can access and use the inbox', async ({ page }) => {
    test.skip(true, 'Skipped — no operator credentials yet. Set E2E_OPERATOR_EMAIL / E2E_OPERATOR_PASSWORD to enable.');
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByRole('heading', { name: /inbox/i })).toBeVisible();
    expect(page.url()).toContain('/inbox');
    await snap(page, FLOW, 'nav_09_operator_inbox');
  });
});

// ─── Agent assist & canned replies ───────────────────────────────────────────

test.describe('Agent assist and canned replies', () => {
  test('needs-human mode shows suggest-draft and agent-context-card', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    const needsHuman = page.getByRole('button', { name: /needs[ -]?human/i });
    if (await needsHuman.count()) await needsHuman.first().click();
    await expect(page.getByTestId('suggest-draft')).toBeVisible();
    await expect(page.getByTestId('agent-context-card')).toBeVisible();
    await snap(page, FLOW, 'assist_01_needs_human_panel');
  });

  test('canned replies: create → edit → delete via settings', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Canned replies' }).click();
    await expect(page.getByTestId('canned-replies-list')).toBeVisible();
    await snap(page, FLOW, 'assist_02_canned_replies_list');

    const suffix = Date.now().toString().slice(-6);
    const title  = `E2E Canned ${suffix}`;
    const body   = `Automated test reply ${suffix}`;

    await page.getByTestId('add-canned-reply').click();
    await page.getByPlaceholder('Title').fill(title);
    await page.getByPlaceholder('Reply body').fill(body);
    await snap(page, FLOW, 'assist_03_add_form_filled');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByPlaceholder('Title')).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId('canned-replies-list')).toContainText(title);
    await snap(page, FLOW, 'assist_04_canned_reply_added');

    const row = page.getByTestId('canned-replies-list').locator('div').filter({ hasText: title }).first();
    await row.getByRole('button', { name: 'Edit' }).click();
    await page.getByPlaceholder('Reply body').clear();
    await page.getByPlaceholder('Reply body').fill(`Updated reply ${suffix}`);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByPlaceholder('Reply body')).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId('canned-replies-list')).toContainText(`Updated reply`);
    await snap(page, FLOW, 'assist_05_canned_reply_edited');

    const updatedRow = page.getByTestId('canned-replies-list').locator('div').filter({ hasText: title }).first();
    page.once('dialog', (d) => d.accept());
    await updatedRow.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByTestId('canned-replies-list')).not.toContainText(title, { timeout: 8_000 });
    await snap(page, FLOW, 'assist_06_canned_reply_deleted');
  });

  test('Add canned reply button disabled until title and body filled', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Canned replies' }).click();

    await page.getByTestId('add-canned-reply').click();
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();
    await snap(page, FLOW, 'assist_07_add_btn_disabled_empty');

    await page.getByPlaceholder('Title').fill('Title only');
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();

    await page.getByPlaceholder('Reply body').fill('Now both filled');
    await expect(page.getByRole('button', { name: 'Add' })).toBeEnabled();
    await snap(page, FLOW, 'assist_08_add_btn_enabled_filled');
  });
});
