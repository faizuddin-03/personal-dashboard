import { test, expect, request, type APIRequestContext, type Page } from '@playwright/test';

// Credentials match apps/api/prisma/seed.ts.
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';
// The seeded Customer Support (OPERATOR) user — no API bootstrap needed.
const OPERATOR_EMAIL = 'support@example.com';
const OPERATOR_PASSWORD = 'ChangeMe123!';

const API_BASE = process.env.API_BASE ?? 'http://localhost:3000';

// Seed facts this spec relies on (apps/api/prisma/seed.ts):
//  - Template "sample_promo_2026" has APPROVED variants in EN + MS only
//    (no ZH, no TA).
//  - Seeded opted-in PHONE dealers by state:
//    SELANGOR: Auto Bestari (MS), EV Hub Motors (EN), Klang Valley Cars (ZH)
//    KUALA_LUMPUR: KL Premium Motors (ZH), Cahaya Auto Trading (MS)
//    PENANG: Penang Auto Mart (EN)  [Northern Auto Gallery is LANE — excluded]
//    JOHOR: JB Used Cars (MS)       [Southern Auto Hub is LANE — excluded]
//    NEGERI_SEMBILAN: Seremban Auto Niaga (MS)
//    PERAK: Ipoh Motor (opted-out — excluded)
const SEED_TEMPLATE = 'sample_promo_2026';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

/** Logs in via the API and returns an admin bearer token. */
async function adminToken(ctx: APIRequestContext): Promise<string> {
  const res = await ctx.post(`${API_BASE}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(res.ok(), `admin login failed: ${await res.text()}`).toBeTruthy();
  const { accessToken } = await res.json();
  return accessToken;
}

/**
 * Deterministically sets (or clears) a state→language mapping via the
 * admin-only API so each test starts from a known mapping configuration
 * regardless of execution order. Passing an empty array clears the mapping.
 */
async function setMapping(
  token: string,
  state: string,
  languages: string[],
): Promise<void> {
  const ctx = await request.newContext();
  try {
    if (languages.length === 0) {
      await ctx.delete(`${API_BASE}/api/state-language-mappings/${state}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      const res = await ctx.put(
        `${API_BASE}/api/state-language-mappings/${state}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { languages },
        },
      );
      expect(res.ok(), `set mapping ${state} failed: ${await res.text()}`).toBeTruthy();
    }
  } finally {
    await ctx.dispose();
  }
}

// ---------------------------------------------------------------------------
// Shared wizard helper: navigates the 3-step wizard to step 1 (Template).
//
// Step 0 (Audience): optionally click state chips by their visible label,
// then click Continue.
// Returns the page at step 1.
// ---------------------------------------------------------------------------
async function wizardGoToTemplateStep(
  page: Page,
  stateLabels: string[] = [],
): Promise<void> {
  await page.goto('/blasts/new');
  await expect(page.getByTestId('blast-wizard')).toBeVisible();

  // Step 0 — Audience
  for (const label of stateLabels) {
    await page.getByRole('button', { name: label }).click();
  }
  // Wait for audience count to be non-zero before continuing
  await expect(page.getByText(/\d+ recipients/)).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Continue' }).click();
}

test.describe('State-based language blasting', () => {
  // ---------------------------------------------------------------------------
  // 1. Admin configures the state→language mapping in Settings.
  // ---------------------------------------------------------------------------
  test('admin configures Penang and Kelantan mappings in Settings', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/settings');
    await expect(page.getByTestId('state-lang-table')).toBeVisible();

    // Penang → ZH + EN.
    const penangRow = page.getByTestId('state-lang-row-PENANG');
    await penangRow.getByRole('button', { name: 'Edit' }).click();
    const penangPicker = penangRow.getByTestId('state-lang-multiselect');
    await penangPicker.getByTestId('state-lang-opt-ZH').check();
    await penangPicker.getByTestId('state-lang-opt-EN').check();
    await penangRow.getByTestId('state-lang-save').click();
    // Row leaves edit mode once the mutation resolves.
    await expect(penangRow.getByTestId('state-lang-multiselect')).toHaveCount(0);

    // Kelantan → MS.
    const kelantanRow = page.getByTestId('state-lang-row-KELANTAN');
    await kelantanRow.getByRole('button', { name: 'Edit' }).click();
    await kelantanRow
      .getByTestId('state-lang-multiselect')
      .getByTestId('state-lang-opt-MS')
      .check();
    await kelantanRow.getByTestId('state-lang-save').click();
    await expect(kelantanRow.getByTestId('state-lang-multiselect')).toHaveCount(0);

    // Reload and assert the persisted pills.
    await page.reload();
    const penangReloaded = page.getByTestId('state-lang-row-PENANG');
    await expect(penangReloaded.getByText('ZH', { exact: true })).toBeVisible();
    await expect(penangReloaded.getByText('EN', { exact: true })).toBeVisible();
    await expect(
      page.getByTestId('state-lang-row-KELANTAN').getByText('MS', { exact: true }),
    ).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 2. STATE-mode wizard preview renders a messages/contacts summary.
  // ---------------------------------------------------------------------------
  test('STATE-mode wizard shows the preview summary', async ({ page }) => {
    // Ensure at least one mapped state covered by an approved language so the
    // preview is non-trivial. Selangor has 3 opted-in PHONE dealers → MS mapping
    // works because sample_promo_2026 has an APPROVED MS variant.
    const ctx = await request.newContext();
    const token = await adminToken(ctx);
    await setMapping(token, 'SELANGOR', ['MS']);
    await ctx.dispose();

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // ── Step 0: Audience — select Selangor chip ──
    await wizardGoToTemplateStep(page, ['Selangor']);

    // ── Step 1: Template ──
    await page.getByTestId('blast-template').selectOption(SEED_TEMPLATE);
    await page.getByTestId('blast-default-language').selectOption('EN');
    await page.getByTestId('blast-language-mode-state').check();

    const preview = page.getByTestId('blast-state-preview');
    await expect(preview).toBeVisible({ timeout: 10_000 });
    // Summary line: "X messages to Y contacts".
    await expect(preview.getByText(/messages to .* contacts/i)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 3. Gap blocker: a mapped state needs a language with no approved variant.
  // ---------------------------------------------------------------------------
  test('gap blocker disables create when a required variant is missing', async ({ page }) => {
    // Penang (Penang Auto Mart) → ZH + EN. The seed template has no APPROVED ZH
    // variant, so previewing must surface a gap and block creation.
    const ctx = await request.newContext();
    const token = await adminToken(ctx);
    await setMapping(token, 'PENANG', ['ZH', 'EN']);
    await ctx.dispose();

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // ── Step 0: Audience — select Penang chip ──
    await wizardGoToTemplateStep(page, ['Penang']);

    // ── Step 1: Template ──
    await page.getByTestId('blast-template').selectOption(SEED_TEMPLATE);
    await page.getByTestId('blast-default-language').selectOption('EN');
    await page.getByTestId('blast-language-mode-state').check();

    await expect(page.getByTestId('blast-state-gaps')).toBeVisible({ timeout: 10_000 });
    // Continue button is disabled when gaps exist (can't proceed to step 2)
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // 4. Happy path: a STATE-mode blast whose required languages are all approved.
  // ---------------------------------------------------------------------------
  test('happy path: STATE-mode blast creates and lands on the detail page', async ({ page }) => {
    // Restrict the mapping to EN/MS only (both APPROVED in the seed template)
    // so there are no gaps. Clear Penang's ZH requirement, map Selangor → MS.
    const ctx = await request.newContext();
    const token = await adminToken(ctx);
    await setMapping(token, 'PENANG', []); // clear (default-language fallback)
    await setMapping(token, 'SELANGOR', ['MS']);
    await ctx.dispose();

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // ── Step 0: Audience — select Selangor chip ──
    await wizardGoToTemplateStep(page, ['Selangor']);

    // ── Step 1: Template ──
    await page.getByTestId('blast-template').selectOption(SEED_TEMPLATE);
    await page.getByTestId('blast-default-language').selectOption('EN');
    await page.getByTestId('blast-language-mode-state').check();

    // Preview present, no gaps → Continue is enabled.
    await expect(page.getByTestId('blast-state-preview')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('blast-state-gaps')).toHaveCount(0);

    // Map the single template variable so creation succeeds.
    await page.getByTestId('variable-1').selectOption('contact.name');

    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 2: Review ──
    const blastName = `STATE happy ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);
    await expect(page.getByTestId('blast-create')).toBeEnabled();
    await page.getByTestId('blast-create').click();

    // Lands on the blast detail page.
    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i, { timeout: 10_000 });
    await expect(page.getByText(blastName)).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 5. PREFERENCE-mode regression: a preference blast still creates.
  // ---------------------------------------------------------------------------
  test('PREFERENCE-mode blast still creates successfully', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // ── Step 0: Audience — no chip selection (all dealers) ──
    await wizardGoToTemplateStep(page);

    // ── Step 1: Template ──
    await page.getByTestId('blast-template').selectOption(SEED_TEMPLATE);
    await page.getByTestId('blast-default-language').selectOption('EN');
    // PREFERENCE is the default mode; assert it explicitly anyway.
    await expect(page.getByTestId('blast-language-mode-preference')).toBeChecked();
    await page.getByTestId('variable-1').selectOption('contact.name');

    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 2: Review ──
    const blastName = `PREFERENCE ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);
    await page.getByTestId('blast-create').click();

    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i, { timeout: 10_000 });
    await expect(page.getByText(blastName)).toBeVisible();
    await expect(page.getByTestId('blast-counters')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 6. Operator cannot see the mapping (Settings is ADMIN-gated).
  // ---------------------------------------------------------------------------
  test('operator cannot access the state→language mapping', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await page.goto('/settings');
    // ProtectedRoute requireRole="ADMIN" redirects non-admins to "/".
    await expect(page).toHaveURL(/\/$/);
    // The mapping table must not be present anywhere for an operator.
    await expect(page.getByTestId('state-lang-table')).toHaveCount(0);
  });
});
