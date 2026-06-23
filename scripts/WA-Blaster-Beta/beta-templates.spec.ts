/**
 * BETA SUITE 7 — Templates
 *
 * Template list, status filter chips, creating a multi-language draft,
 * the AI wizard flow (mock generate → edit → save as draft), and the
 * discard-warning gate when closing the wizard mid-flow.
 *
 * ⚠️  "submit to Meta" tests are disabled by default (metaRisk = true).
 */
import { test, expect, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL           = process.env.E2E_ADMIN_EMAIL           ?? 'admin@example.com';
const ADMIN_PASSWORD        = process.env.E2E_ADMIN_PASSWORD        ?? 'ChangeMe123!';
const TEMPLATE_CATEGORY     = process.env.E2E_TEMPLATE_CATEGORY     ?? 'MARKETING';
const TEMPLATE_LANG_VARIANT = process.env.E2E_TEMPLATE_LANG_VARIANT ?? 'MS';
const FLOW = 'beta-templates';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

async function gotoTemplates(page: Page) {
  await page.getByRole('link', { name: 'Templates' }).click();
  await expect(page).toHaveURL(/\/templates$/);
}

// ─── Template list ────────────────────────────────────────────────────────────

test.describe('Template list', () => {
  test('template list loads with rows visible', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoTemplates(page);
    await expect(page.locator('[data-testid^="template-group-"]').first()).toBeVisible();
    await snap(page, FLOW, 'list_01_templates');
  });

  test('PENDING status filter chip marks itself as active', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoTemplates(page);
    await page.getByTestId('filter-status-PENDING').click();
    await expect(page.getByTestId('filter-status-PENDING')).toHaveAttribute('aria-pressed', 'true');
    await snap(page, FLOW, 'list_02_pending_filter_active');
  });

  test('APPROVED status filter chip marks itself as active', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoTemplates(page);
    await page.getByTestId('filter-status-APPROVED').click();
    await expect(page.getByTestId('filter-status-APPROVED')).toHaveAttribute('aria-pressed', 'true');
    await snap(page, FLOW, 'list_03_approved_filter_active');
  });
});

// ─── Draft creation ───────────────────────────────────────────────────────────

test.describe('Draft template creation', () => {
  test('create multi-language draft — appears in list with DRAFT status', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoTemplates(page);

    const uniqueName = `beta_tpl_${Date.now().toString().slice(-8)}`;

    await page.getByTestId('add-template').click();
    await snap(page, FLOW, 'draft_01_add_form');

    await page.getByTestId('template-name').fill(uniqueName);
    await page.getByTestId('template-category').selectOption(TEMPLATE_CATEGORY);
    await page.getByTestId('variant-body').fill('Hello {{1}}!');
    await page.getByTestId('variant-footer').fill('Reply STOP to unsubscribe');
    await page.getByTestId('add-language-select').selectOption(TEMPLATE_LANG_VARIANT);
    await page.getByTestId(`language-tab-${TEMPLATE_LANG_VARIANT}`).click();
    await page.getByTestId('variant-body').fill('Salam {{1}}!');
    await snap(page, FLOW, 'draft_02_ms_variant');

    await page.getByTestId('template-submit-draft').click();
    await expect(page).toHaveURL(/\/templates$/);
    await expect(page.getByTestId(`template-group-${uniqueName}`)).toBeVisible();
    await snap(page, FLOW, 'draft_03_in_list');

    await page.getByTestId(`template-group-${uniqueName}`).click();
    await expect(page.getByTestId('status-badge-DRAFT').first()).toBeVisible();
    await snap(page, FLOW, 'draft_04_detail_draft_badge');
  });
});

// ─── AI wizard ────────────────────────────────────────────────────────────────

async function openWizardToReview(page: Page) {
  await page.route('**/templates/generate', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          language: 'EN',
          name: 'service_reminder',
          category: 'UTILITY',
          body: 'Hi {{1}}, your service is due on {{2}}.',
          variables: ['name', 'date'],
          approvalLikelihood: 'HIGH',
          rationale: 'Transactional reminder with clear variables.',
        },
      ]),
    }),
  );

  await page.getByRole('link', { name: 'Templates' }).click();
  await page.getByTestId('add-template').click();
  await page.getByTestId('wizard-brief').fill('Service reminder for BETA testing');
  await page.getByRole('button', { name: 'Generate suggestions' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('wizard-name')).toBeVisible();
}

test.describe('AI wizard', () => {
  test('edit content, save as draft, draft appears in list with edits', async ({ page }) => {
    await loginAsAdmin(page);
    await openWizardToReview(page);
    await snap(page, FLOW, 'wizard_01_review');

    const tplName = `beta_wizard_${Date.now().toString().slice(-8)}`;
    await page.getByTestId('wizard-name').fill(tplName);
    await page.getByTestId('wizard-edit-content').click();
    await page.getByTestId('wizard-edit-body-EN').fill('Hi {{1}}, BETA service on {{2}}. Book via eAuto.');
    await page.getByTestId('wizard-apply-edits').click();
    await snap(page, FLOW, 'wizard_02_edited');

    await page.getByTestId('wizard-save-draft').click();
    await expect(page.getByTestId('wizard-backdrop')).toBeHidden();
    await expect(page.getByTestId(`template-group-${tplName}`)).toBeVisible();
    await snap(page, FLOW, 'wizard_03_saved');

    await page.getByTestId(`template-group-${tplName}`).click();
    await expect(page.getByTestId('status-badge-DRAFT').first()).toBeVisible();
    await expect(page.getByText('BETA service on').first()).toBeVisible();
    await snap(page, FLOW, 'wizard_04_detail');
  });

  test('closing wizard at review step warns before discarding', async ({ page }) => {
    await loginAsAdmin(page);
    await openWizardToReview(page);

    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByLabel('close').click();
    await expect(page.getByTestId('wizard-backdrop')).toBeVisible();
    await snap(page, FLOW, 'wizard_05_still_open_after_dismiss');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByLabel('close').click();
    await expect(page.getByTestId('wizard-backdrop')).toBeHidden();
    await snap(page, FLOW, 'wizard_06_closed_after_accept');
  });
});
