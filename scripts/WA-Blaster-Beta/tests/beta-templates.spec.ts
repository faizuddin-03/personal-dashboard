/**
 * BETA SUITE 7 — Templates
 *
 * Template list, status filter chips, creating a multi-language draft,
 * the AI wizard flow (mock generate → edit → save as draft), and the
 * discard-warning gate when closing the wizard mid-flow.
 *
 * ⚠️  "submit to Meta" tests are disabled by default (metaRisk = true).
 */
import { test, expect, type Page } from '../fixtures/authFixture';
import { snap } from '../utils/screenshot';
import { NavPage } from '../pages/NavPage';
import { TemplatesPage } from '../pages/TemplatesPage';
import { TEMPLATES } from '../data/testData';

const FLOW = 'beta-templates';

async function gotoTemplates(page: Page) {
  const nav = new NavPage(page);
  await nav.openLink('Templates');
  await expect(page).toHaveURL(/\/templates$/);
}

// ─── Template list ────────────────────────────────────────────────────────────

test.describe('Template list', () => {
  test('template list loads with rows visible', async ({ adminPage }) => {
    const templates = new TemplatesPage(adminPage);
    await gotoTemplates(adminPage);
    await expect(templates.templateGroups().first()).toBeVisible();
    await snap(adminPage, FLOW, 'list_01_templates');
  });

  test('PENDING status filter chip marks itself as active', async ({ adminPage }) => {
    const templates = new TemplatesPage(adminPage);
    await gotoTemplates(adminPage);
    await templates.clickStatusFilterChip('PENDING');
    await expect(templates.statusFilterChip('PENDING')).toHaveAttribute('aria-pressed', 'true');
    await snap(adminPage, FLOW, 'list_02_pending_filter_active');
  });

  test('APPROVED status filter chip marks itself as active', async ({ adminPage }) => {
    const templates = new TemplatesPage(adminPage);
    await gotoTemplates(adminPage);
    await templates.clickStatusFilterChip('APPROVED');
    await expect(templates.statusFilterChip('APPROVED')).toHaveAttribute('aria-pressed', 'true');
    await snap(adminPage, FLOW, 'list_03_approved_filter_active');
  });
});

// ─── Draft creation ───────────────────────────────────────────────────────────

test.describe('Draft template creation', () => {
  test('create multi-language draft — appears in list with DRAFT status', async ({ adminPage }) => {
    const templates = new TemplatesPage(adminPage);
    await gotoTemplates(adminPage);

    const uniqueName = `${TEMPLATES.namePrefix}_${Date.now().toString().slice(-8)}`;

    await templates.addTemplate();
    await snap(adminPage, FLOW, 'draft_01_add_form');

    await templates.fillName(uniqueName);
    await templates.selectCategory(TEMPLATES.category);
    await templates.fillBody(TEMPLATES.bodyEn);
    await templates.fillFooter('Reply STOP to unsubscribe');
    await templates.addLanguage(TEMPLATES.langVariant);
    await templates.openLanguageTab(TEMPLATES.langVariant);
    await templates.fillBody(TEMPLATES.bodyMs);
    await snap(adminPage, FLOW, 'draft_02_ms_variant');

    await templates.submitDraft();
    await expect(adminPage).toHaveURL(/\/templates$/);
    await expect(templates.templateGroup(uniqueName)).toBeVisible();
    await snap(adminPage, FLOW, 'draft_03_in_list');

    await templates.openTemplateGroup(uniqueName);
    await expect(templates.statusBadge('DRAFT').first()).toBeVisible();
    await snap(adminPage, FLOW, 'draft_04_detail_draft_badge');
  });
});

// ─── AI wizard ────────────────────────────────────────────────────────────────

async function openWizardToReview(page: Page, templates: TemplatesPage) {
  await templates.mockGenerateSuggestions();

  const nav = new NavPage(page);
  await nav.openLink('Templates');
  await templates.addTemplate();
  await templates.fillBrief(TEMPLATES.wizardBrief);
  await templates.generateSuggestions();
  await templates.continue();
  await expect(templates.wizardName()).toBeVisible();
}

test.describe('AI wizard', () => {
  test('edit content, save as draft, draft appears in list with edits', async ({ adminPage }) => {
    const templates = new TemplatesPage(adminPage);
    await openWizardToReview(adminPage, templates);
    await snap(adminPage, FLOW, 'wizard_01_review');

    const tplName = `${TEMPLATES.namePrefix}_wizard_${Date.now().toString().slice(-8)}`;
    await templates.fillWizardName(tplName);
    await templates.editContent();
    await templates.fillEditBodyEN('Hi {{1}}, BETA service on {{2}}. Book via eAuto.');
    await templates.applyEdits();
    await snap(adminPage, FLOW, 'wizard_02_edited');

    await templates.saveDraft();
    await expect(templates.backdrop()).toBeHidden();
    await expect(templates.templateGroup(tplName)).toBeVisible();
    await snap(adminPage, FLOW, 'wizard_03_saved');

    await templates.openTemplateGroup(tplName);
    await expect(templates.statusBadge('DRAFT').first()).toBeVisible();
    await expect(templates.text('BETA service on').first()).toBeVisible();
    await snap(adminPage, FLOW, 'wizard_04_detail');
  });

  test('closing wizard at review step warns before discarding', async ({ adminPage }) => {
    const templates = new TemplatesPage(adminPage);
    await openWizardToReview(adminPage, templates);

    templates.dismissNextDialog();
    await templates.closeWizard();
    await expect(templates.backdrop()).toBeVisible();
    await snap(adminPage, FLOW, 'wizard_05_still_open_after_dismiss');

    templates.acceptNextDialog();
    await templates.closeWizard();
    await expect(templates.backdrop()).toBeHidden();
    await snap(adminPage, FLOW, 'wizard_06_closed_after_accept');
  });
});
