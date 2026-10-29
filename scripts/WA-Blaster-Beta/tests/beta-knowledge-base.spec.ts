/**
 * BETA SUITE 10 — Knowledge Base
 *
 * Tests the Knowledge Base disposition choices available when resolving a
 * ticket: SKIP (don't save), IMPORT_LIVE (save as approved article), and
 * SAVE_DRAFT (save as KB draft). Uses the admin simulator to seed escalations.
 *
 * Requires SIMULATOR_ENABLED=true + WHATSAPP_MOCK_MODE=true on the server.
 */
import { test, expect } from '../fixtures/authFixture';
import { snap } from '../utils/screenshot';
import { adminToken, seedEscalation } from '../utils/api';
import { InboxPage } from '../pages/InboxPage';
import { KNOWLEDGE_BASE } from '../data/testData';

const FLOW = 'beta-knowledge-base';

// ─── SaveToKnowledgeModal dispositions ───────────────────────────────────────

test.describe('Knowledge Base disposition modal', () => {
  test('SaveToKnowledgeModal offers SKIP, IMPORT_LIVE, and SAVE_DRAFT options', async ({ adminPage }) => {
    const token = await adminToken();
    await seedEscalation(token, `${KNOWLEDGE_BASE.phonePrefix}1`,
      `BETA KB modal ${Date.now()} — unusual refund outside policy`);

    const inbox = new InboxPage(adminPage);
    await inbox.goto();
    await expect(inbox.resolveButton()).toBeVisible({ timeout: 15_000 });
    await inbox.resolveTicket();

    await expect(inbox.saveKbModal()).toBeVisible({ timeout: 8_000 });
    await expect(inbox.disposition('SKIP')).toBeVisible();
    await expect(inbox.disposition('IMPORT_LIVE')).toBeVisible();
    await expect(inbox.disposition('SAVE_DRAFT')).toBeVisible();
    await snap(adminPage, FLOW, 'modal_01_all_options');
  });

  test('SKIP disposition closes modal and shows resolved toast', async ({ adminPage }) => {
    const token = await adminToken();
    await seedEscalation(token, `${KNOWLEDGE_BASE.phonePrefix}2`,
      `BETA KB skip ${Date.now()} — account access question`);

    const inbox = new InboxPage(adminPage);
    await inbox.goto();
    await expect(inbox.resolveButton()).toBeVisible({ timeout: 15_000 });
    await inbox.resolveTicket();

    await expect(inbox.saveKbModal()).toBeVisible({ timeout: 8_000 });
    await inbox.selectDisposition('SKIP');
    await inbox.confirmKb();

    await expect(inbox.saveKbModal()).toHaveCount(0, { timeout: 8_000 });
    await expect(inbox.resolvedToast()).toBeVisible({ timeout: 8_000 });
    await snap(adminPage, FLOW, 'modal_02_skip_resolved');
  });

  test('SAVE_DRAFT disposition closes modal and shows resolved toast', async ({ adminPage }) => {
    const token = await adminToken();
    await seedEscalation(token, `${KNOWLEDGE_BASE.phonePrefix}3`,
      `BETA KB draft ${Date.now()} — portal login issue`);

    const inbox = new InboxPage(adminPage);
    await inbox.goto();
    await expect(inbox.resolveButton()).toBeVisible({ timeout: 15_000 });
    await inbox.resolveTicket();

    await expect(inbox.saveKbModal()).toBeVisible({ timeout: 8_000 });
    await inbox.selectDisposition('SAVE_DRAFT');
    await inbox.confirmKb();

    await expect(inbox.saveKbModal()).toHaveCount(0, { timeout: 8_000 });
    await expect(inbox.resolvedToast()).toBeVisible({ timeout: 8_000 });
    await snap(adminPage, FLOW, 'modal_03_draft_resolved');
  });

  test('IMPORT_LIVE disposition closes modal and shows resolved toast', async ({ adminPage }) => {
    const token = await adminToken();
    await seedEscalation(token, `${KNOWLEDGE_BASE.phonePrefix}4`,
      `BETA KB import ${Date.now()} — credit pricing query`);

    const inbox = new InboxPage(adminPage);
    await inbox.goto();
    await expect(inbox.resolveButton()).toBeVisible({ timeout: 15_000 });
    await inbox.resolveTicket();

    await expect(inbox.saveKbModal()).toBeVisible({ timeout: 8_000 });
    await inbox.selectDisposition('IMPORT_LIVE');
    await inbox.confirmKb();

    await expect(inbox.saveKbModal()).toHaveCount(0, { timeout: 8_000 });
    await expect(inbox.resolvedToast()).toBeVisible({ timeout: 8_000 });
    await snap(adminPage, FLOW, 'modal_04_import_resolved');
  });

  test('kb-confirm button is disabled until a disposition is selected', async ({ adminPage }) => {
    const token = await adminToken();
    await seedEscalation(token, `${KNOWLEDGE_BASE.phonePrefix}5`,
      `BETA KB confirm ${Date.now()} — vehicle registration help`);

    const inbox = new InboxPage(adminPage);
    await inbox.goto();
    await expect(inbox.resolveButton()).toBeVisible({ timeout: 15_000 });
    await inbox.resolveTicket();

    await expect(inbox.saveKbModal()).toBeVisible({ timeout: 8_000 });
    await expect(inbox.kbConfirm()).toBeDisabled();
    await inbox.selectDisposition('SKIP');
    await expect(inbox.kbConfirm()).toBeEnabled();
    await snap(adminPage, FLOW, 'modal_05_confirm_enables');
  });
});
