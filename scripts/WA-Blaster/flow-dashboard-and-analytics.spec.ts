/**
 * FLOW: Dashboard, Analytics & Templates
 *
 * Combines: dashboard.spec.ts + performance.spec.ts + templates.spec.ts
 *           + templates-sync.spec.ts + templates-wizard.spec.ts
 *
 * Covers the analytics surface (dashboard KPI strip, reports delivery
 * funnel) and the full template lifecycle: list, status filter, sync with
 * Meta, manual draft creation, and the AI wizard flow (generate → edit →
 * save as draft / discard warning).
 */
import { test, expect, type Page } from '@playwright/test';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL            = process.env.E2E_ADMIN_EMAIL            ?? 'admin@example.com';
const ADMIN_PASSWORD         = process.env.E2E_ADMIN_PASSWORD         ?? 'ChangeMe123!';
const TEMPLATE_CATEGORY      = process.env.E2E_TEMPLATE_CATEGORY      ?? 'MARKETING';
const TEMPLATE_LANG_VARIANT  = process.env.E2E_TEMPLATE_LANG_VARIANT  ?? 'MS';
const FLOW = 'flow-dashboard-and-analytics';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

// ─── Dashboard analytics ──────────────────────────────────────────────────────

test.describe('Dashboard analytics', () => {
  test('KPI strip has no demo badge and reply-handling donut renders', async ({ page }) => {
    await loginAsAdmin(page);
    await snap(page, FLOW, 'dashboard_01_home');

    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByText('demo', { exact: true })).toHaveCount(0);
    await expect(page.getByText('(demo data)')).toHaveCount(0);
    await expect(page.getByText('auto-handled')).toBeVisible();

    await snap(page, FLOW, 'dashboard_02_kpi_strip');
  });
});

// ─── Performance / reports analytics ─────────────────────────────────────────

test.describe('Performance analytics', () => {
  test('renders real (non-demo) analytics with delivery funnel and range chips', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');
    await snap(page, FLOW, 'perf_01_reports_page');

    await expect(page.getByText('Chart data is seeded demo analytics')).toHaveCount(0);
    await expect(page.getByText('Delivery rate')).toBeVisible();
    await expect(page.getByText('Delivery funnel')).toBeVisible();

    await page.getByRole('button', { name: '7 days' }).click();
    await expect(page.getByText('Delivery funnel')).toBeVisible();
    await snap(page, FLOW, 'perf_02_7day_filter');
  });
});

// ─── Templates list ───────────────────────────────────────────────────────────

test.describe('Templates list and status filter', () => {
  test('template list loads and status filter marks chip as active', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Templates' }).click();
    await expect(page).toHaveURL(/\/templates$/);
    await snap(page, FLOW, 'templates_01_list');

    await page.getByTestId('filter-status-PENDING').click();
    await expect(page.getByTestId('filter-status-PENDING')).toHaveAttribute('aria-pressed', 'true');
    await snap(page, FLOW, 'templates_02_filter_pending');
  });

  test('admin creates a multi-language draft, submits to Meta (mock), sees PENDING', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Templates' }).click();

    const uniqueSuffix = Date.now().toString().slice(-8);
    const templateName = `e2e_promo_${uniqueSuffix}`;

    // Create draft
    await page.getByTestId('add-template').click();
    await snap(page, FLOW, 'templates_03_add_form');

    await page.getByTestId('template-name').fill(templateName);
    await page.getByTestId('template-category').selectOption(TEMPLATE_CATEGORY);
    await page.getByTestId('variant-body').fill('Hello {{1}}!');
    await page.getByTestId('variant-footer').fill('Reply STOP to unsubscribe');
    // Add MS language variant
    await page.getByTestId('add-language-select').selectOption(TEMPLATE_LANG_VARIANT);
    await page.getByTestId(`language-tab-${TEMPLATE_LANG_VARIANT}`).click();
    await page.getByTestId('variant-body').fill('Salam {{1}}!');
    await snap(page, FLOW, 'templates_04_ms_variant');

    await page.getByTestId('template-submit-draft').click();
    await expect(page).toHaveURL(/\/templates$/);
    await expect(page.getByTestId(`template-group-${templateName}`)).toBeVisible();
    await snap(page, FLOW, 'templates_05_draft_in_list');

    // Open template and verify DRAFT status
    await page.getByTestId(`template-group-${templateName}`).click();
    await expect(page.getByTestId('status-badge-DRAFT').first()).toBeVisible();
    await snap(page, FLOW, 'templates_06_draft_detail');

    // Submit to Meta (mock returns PENDING)
    await page.getByTestId('template-submit-meta').click();
    await expect(page.getByTestId('status-badge-PENDING').first()).toBeVisible({ timeout: 5_000 });
    await snap(page, FLOW, 'templates_07_pending_status');
  });
});

// ─── Templates — Sync with Meta ───────────────────────────────────────────────

test.describe('Templates — Sync with Meta', () => {
  test('Sync button triggers a request and shows a result toast', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Templates' }).click();
    await expect(page).toHaveURL(/\/templates$/);
    await snap(page, FLOW, 'sync_01_templates_list');

    await page.getByRole('button', { name: /sync with meta/i }).click();
    await expect(
      page.getByRole('status').filter({
        hasText: /no pending templates to sync|synced with meta|sync with meta failed/i,
      }),
    ).toBeVisible({ timeout: 10_000 });
    await snap(page, FLOW, 'sync_02_toast_result');
  });
});

// ─── AI Wizard ────────────────────────────────────────────────────────────────

/** Mock the LLM endpoint and drive the wizard to the review step. */
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
  await page.getByTestId('wizard-brief').fill('Service reminder for customers');
  await page.getByRole('button', { name: 'Generate suggestions' }).click();
  // Step 2: first suggestion is auto-picked
  await page.getByRole('button', { name: 'Continue' }).click();
  // Step 3: name input visible
  await expect(page.getByTestId('wizard-name')).toBeVisible();
}

test.describe('AI wizard draft persistence', () => {
  test('edit content, save as draft, draft appears in list with edits', async ({ page }) => {
    await loginAsAdmin(page);
    await openWizardToReview(page);
    await snap(page, FLOW, 'wizard_01_review_step');

    const templateName = `e2e_wizard_${Date.now().toString().slice(-8)}`;
    await page.getByTestId('wizard-name').fill(templateName);

    await page.getByTestId('wizard-edit-content').click();
    await page
      .getByTestId('wizard-edit-body-EN')
      .fill('Hi {{1}}, your car service is due on {{2}}. Book via eAuto.');
    await page.getByTestId('wizard-apply-edits').click();
    await snap(page, FLOW, 'wizard_02_edited_content');

    await page.getByTestId('wizard-save-draft').click();
    await expect(page.getByTestId('wizard-backdrop')).toBeHidden();
    await expect(page.getByTestId(`template-group-${templateName}`)).toBeVisible();
    await snap(page, FLOW, 'wizard_03_draft_saved_in_list');

    await page.getByTestId(`template-group-${templateName}`).click();
    await expect(page.getByTestId('status-badge-DRAFT').first()).toBeVisible();
    await expect(page.getByText('Book via eAuto').first()).toBeVisible();
    await expect(page.getByTestId('template-submit-meta')).toBeVisible();
    await snap(page, FLOW, 'wizard_04_draft_detail_verified');
  });

  test('closing the wizard at review step warns before discarding', async ({ page }) => {
    await loginAsAdmin(page);
    await openWizardToReview(page);
    await snap(page, FLOW, 'wizard_discard_01_review_step');

    // Dismissing the confirm keeps the wizard open
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByLabel('close').click();
    await expect(page.getByTestId('wizard-backdrop')).toBeVisible();
    await snap(page, FLOW, 'wizard_discard_02_still_open');

    // Accepting the confirm closes the wizard
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByLabel('close').click();
    await expect(page.getByTestId('wizard-backdrop')).toBeHidden();
    await snap(page, FLOW, 'wizard_discard_03_closed');
  });
});
