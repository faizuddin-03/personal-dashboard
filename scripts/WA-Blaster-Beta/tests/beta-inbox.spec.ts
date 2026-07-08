/**
 * BETA SUITE 4 — Inbox
 *
 * Ticket-based dual-mode inbox: mode toggle UI, ticket queue (escalation via
 * simulator, resolve flow with SaveToKnowledgeModal, Closed tab), agent-assist
 * panel, sidebar badge, and canned replies CRUD.
 *
 * Requires server running with SIMULATOR_ENABLED=true + WHATSAPP_MOCK_MODE=true
 */
import { test, expect } from '../fixtures/authFixture';
import { snap } from '../utils/screenshot';
import { adminToken, seedEscalation } from '../utils/api';
import { InboxPage } from '../pages/InboxPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NavPage } from '../pages/NavPage';
import { DashboardPage } from '../pages/DashboardPage';
import { INBOX } from '../data/testData';

const FLOW = 'beta-inbox';

// ─── Mode toggle ──────────────────────────────────────────────────────────────

test.describe('Inbox mode toggle', () => {
  test('inbox shows Auto-replied and Needs Human mode buttons', async ({ adminPage }) => {
    const inbox = new InboxPage(adminPage);
    await inbox.goto();
    await expect(inbox.autoRepliedButton()).toBeVisible();
    await expect(inbox.needsHumanButton()).toBeVisible();
    await snap(adminPage, FLOW, 'mode_01_toggle_buttons');
  });

  test('switching to Auto-replied mode shows AI conversations or empty state', async ({ adminPage }) => {
    const inbox = new InboxPage(adminPage);
    await inbox.goto();
    await inbox.clickAutoReplied();
    await expect(inbox.autoRepliedEmptyState()).toBeVisible({ timeout: 10_000 });
    await snap(adminPage, FLOW, 'mode_02_auto_replied');
  });

  test('Needs Human mode shows Active and Closed tab buttons', async ({ adminPage }) => {
    const inbox = new InboxPage(adminPage);
    await inbox.goto();
    await expect(inbox.activeTab()).toBeVisible({ timeout: 8_000 });
    await expect(inbox.closedTab()).toBeVisible({ timeout: 8_000 });
    await snap(adminPage, FLOW, 'mode_03_active_closed_tabs');
  });
});

// ─── Ticket queue ──────────────────────────────────────────────────────────────

test.describe('Ticket queue', () => {
  test('escalation creates a ticket — Resolve and Close buttons appear', async ({ adminPage }) => {
    const token = await adminToken();
    await seedEscalation(token, `${INBOX.phonePrefix}1`,
      `BETA escalation ${Date.now()} — unusual ownership dispute and refund request`);

    const inbox = new InboxPage(adminPage);
    await inbox.goto();

    await expect(inbox.resolveButton()).toBeVisible({ timeout: 15_000 });
    await expect(inbox.closeButton()).toBeVisible();
    await snap(adminPage, FLOW, 'queue_01_resolve_close_visible');
  });

  test('resolve → SKIP disposition → modal closes → toast shown', async ({ adminPage }) => {
    const token = await adminToken();
    await seedEscalation(token, `${INBOX.phonePrefix}2`,
      `BETA resolve ${Date.now()} — complaint about portal access`);

    const inbox = new InboxPage(adminPage);
    await inbox.goto();

    await expect(inbox.resolveButton()).toBeVisible({ timeout: 15_000 });
    await inbox.resolveTicket();

    await expect(inbox.saveKbModal()).toBeVisible({ timeout: 8_000 });
    await snap(adminPage, FLOW, 'queue_02_kb_modal');
    await inbox.selectDisposition('SKIP');
    await inbox.confirmKb();

    await expect(inbox.saveKbModal()).toHaveCount(0, { timeout: 8_000 });
    await expect(inbox.text('Ticket resolved')).toBeVisible({ timeout: 8_000 });
    await snap(adminPage, FLOW, 'queue_03_resolved_toast');
  });

  test('resolved ticket moves to the Closed tab', async ({ adminPage }) => {
    const token = await adminToken();
    await seedEscalation(token, `${INBOX.phonePrefix}3`,
      `BETA closed-tab ${Date.now()} — sensitive account deletion inquiry`);

    const inbox = new InboxPage(adminPage);
    await inbox.goto();

    await expect(inbox.resolveButton()).toBeVisible({ timeout: 15_000 });
    await inbox.resolveTicket();
    await expect(inbox.saveKbModal()).toBeVisible({ timeout: 8_000 });
    await inbox.selectDisposition('SKIP');
    await inbox.confirmKb();
    await expect(inbox.saveKbModal()).toHaveCount(0, { timeout: 8_000 });

    await inbox.clickClosedTab();
    await expect(inbox.closedTicketIndicator()).toBeVisible({ timeout: 10_000 });
    await snap(adminPage, FLOW, 'queue_04_in_closed_tab');
  });
});

// ─── Agent assist ──────────────────────────────────────────────────────────────

test.describe('Agent assist panel', () => {
  test('active ticket shows suggest-draft and agent-context-card', async ({ adminPage }) => {
    const token = await adminToken();
    await seedEscalation(token, `${INBOX.phonePrefix}4`,
      `BETA agent-assist ${Date.now()} — complex credit pricing dispute`);

    const inbox = new InboxPage(adminPage);
    await inbox.goto();

    await expect(inbox.suggestDraft()).toBeVisible({ timeout: 15_000 });
    await expect(inbox.agentContextCard()).toBeVisible({ timeout: 8_000 });
    await snap(adminPage, FLOW, 'assist_01_panel');
  });

  test('saved-replies dropdown visible when canned replies exist', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    const inbox = new InboxPage(adminPage);
    await settings.goto();
    await settings.openTab('Canned replies');
    await expect(settings.cannedRepliesList()).toBeVisible();
    const listText = await settings.cannedRepliesList().textContent();
    if (!listText || listText.trim() === '') {
      await settings.clickAddCannedReply();
      await settings.fillCannedTitle(INBOX.cannedReplyTitle);
      await settings.fillCannedBody(INBOX.cannedReplyBody);
      await settings.clickAddConfirm();
      await expect(settings.titleInput()).toBeHidden({ timeout: 8_000 });
    }

    const token = await adminToken();
    await seedEscalation(token, `${INBOX.phonePrefix}5`,
      `BETA saved-replies ${Date.now()} — low confidence JPJ query`);

    await inbox.goto();
    await expect(inbox.suggestDraft()).toBeVisible({ timeout: 15_000 });
    await expect(inbox.savedReplies()).toBeVisible({ timeout: 8_000 });
    await snap(adminPage, FLOW, 'assist_02_saved_replies');
  });
});

// ─── Sidebar badge ─────────────────────────────────────────────────────────────

test.describe('Sidebar badge', () => {
  test('sidebar inbox badge is visible when active tickets exist', async ({ adminPage }) => {
    const token = await adminToken();
    await seedEscalation(token, `${INBOX.phonePrefix}6`,
      `BETA badge ${Date.now()} — unusual refund outside policy`);

    const dashboard = new DashboardPage(adminPage);
    const nav = new NavPage(adminPage);
    await dashboard.goto();
    await expect(nav.inboxBadge()).toBeVisible({ timeout: 20_000 });
    await snap(adminPage, FLOW, 'badge_01_visible');
  });
});

// ─── Canned replies ────────────────────────────────────────────────────────────

test.describe('Canned replies', () => {
  test('create → edit → delete via Settings', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto();
    await settings.openTab('Canned replies');
    await expect(settings.cannedRepliesList()).toBeVisible();

    const suffix = Date.now().toString().slice(-6);
    const title  = `BETA Canned ${suffix}`;

    await settings.clickAddCannedReply();
    await settings.fillCannedTitle(title);
    await settings.fillCannedBody(`BETA test reply ${suffix}`);
    await settings.clickAddConfirm();
    await expect(settings.titleInput()).toBeHidden({ timeout: 8_000 });
    await expect(settings.cannedRepliesList()).toContainText(title);
    await snap(adminPage, FLOW, 'canned_01_created');

    await settings.editReply(title);
    await settings.replaceCannedBody(`Updated ${suffix}`);
    await settings.saveReply();
    await expect(settings.bodyInput()).toBeHidden({ timeout: 8_000 });
    await expect(settings.cannedRepliesList()).toContainText('Updated');
    await snap(adminPage, FLOW, 'canned_02_edited');

    await settings.deleteReply(title);
    await expect(settings.cannedRepliesList()).not.toContainText(title, { timeout: 8_000 });
    await snap(adminPage, FLOW, 'canned_03_deleted');
  });

  test('Add button disabled until both title and body are filled', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto();
    await settings.openTab('Canned replies');
    await settings.clickAddCannedReply();
    await expect(settings.addConfirm()).toBeDisabled();
    await settings.fillCannedTitle('Title only');
    await expect(settings.addConfirm()).toBeDisabled();
    await settings.fillCannedBody('Now both filled');
    await expect(settings.addConfirm()).toBeEnabled();
    await snap(adminPage, FLOW, 'canned_04_validation');
  });
});
