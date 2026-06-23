/**
 * BETA SUITE 8 — Settings & Team
 *
 * Team member CRUD (invite, duplicate guard, password reset, delete),
 * state-to-language mapping configuration, and canned replies CRUD.
 */
import { test, expect, request, type APIRequestContext, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!';
const API_BASE       = process.env.API_BASE            ?? 'http://localhost:3000';
const FLOW = 'beta-settings';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

async function gotoTeam(page: Page) {
  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Team & Roles' }).click();
  await expect(page.getByTestId('users-table')).toBeVisible();
}

async function inviteUser(page: Page, email: string, name: string, password = 'Password123!') {
  await page.getByTestId('invite-member-btn').click();
  await expect(page.getByTestId('add-user-form')).toBeVisible();
  await page.getByTestId('new-user-email').fill(email);
  await page.getByTestId('new-user-name').fill(name);
  await page.getByTestId('new-user-password').fill(password);
  await page.getByTestId('new-user-role').selectOption('OPERATOR');
  await page.getByTestId('new-user-submit').click();
}

async function adminToken(ctx: APIRequestContext): Promise<string> {
  const res = await ctx.post(`${API_BASE}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  const { accessToken } = await res.json();
  return accessToken;
}

// ─── Team management ──────────────────────────────────────────────────────────

test.describe('Team management', () => {
  test('invite member → appears in users table', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoTeam(page);
    await snap(page, FLOW, 'team_01_users_table');

    const suffix = Date.now().toString().slice(-8);
    const email  = `beta.invite.${suffix}@example.com`;
    const name   = `BETA User ${suffix}`;

    await inviteUser(page, email, name);
    await expect(page.getByTestId('add-user-form')).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId('users-table')).toContainText(email);
    await expect(page.getByTestId('users-table')).toContainText(name);
    await snap(page, FLOW, 'team_02_user_in_table');
  });

  test('duplicate email shows inline error and keeps modal open', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoTeam(page);

    const suffix = Date.now().toString().slice(-8);
    const email  = `beta.dup.${suffix}@example.com`;

    await inviteUser(page, email, `BETA Dup A ${suffix}`);
    await expect(page.getByTestId('add-user-form')).toBeHidden({ timeout: 8_000 });

    await inviteUser(page, email, `BETA Dup B ${suffix}`);
    await expect(page.getByTestId('add-user-error')).toBeVisible();
    await expect(page.getByTestId('add-user-error')).toContainText(/already|exist/i);
    await snap(page, FLOW, 'team_03_dup_error');
  });

  test('admin resets a team member password', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoTeam(page);

    const suffix = Date.now().toString().slice(-8);
    const email  = `beta.reset.${suffix}@example.com`;

    await inviteUser(page, email, `BETA Reset ${suffix}`);
    await expect(page.getByTestId('add-user-form')).toBeHidden({ timeout: 8_000 });

    const row = page.getByTestId('users-table').locator('tr').filter({ hasText: email });
    await row.getByRole('button', { name: 'Reset password' }).click();
    await expect(page.getByTestId('reset-password-form')).toBeVisible();
    await page.getByTestId('reset-password-input').fill('BetaNew456!');
    await page.getByTestId('reset-password-submit').click();
    await expect(page.getByTestId('reset-password-form')).toBeHidden({ timeout: 8_000 });
    await snap(page, FLOW, 'team_04_password_reset');
  });

  test('admin deletes a team member — removed from table', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoTeam(page);

    const suffix = Date.now().toString().slice(-8);
    const email  = `beta.del.${suffix}@example.com`;

    await inviteUser(page, email, `BETA Del ${suffix}`);
    await expect(page.getByTestId('add-user-form')).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId('users-table')).toContainText(email);

    const row = page.getByTestId('users-table').locator('tr').filter({ hasText: email });
    page.once('dialog', (d) => d.accept());
    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByTestId('users-table')).not.toContainText(email, { timeout: 8_000 });
    await snap(page, FLOW, 'team_05_deleted');
  });
});

// ─── State → language mappings ────────────────────────────────────────────────

test.describe('State → language mapping', () => {
  async function setMapping(token: string, state: string, languages: string[]) {
    const ctx = await request.newContext();
    try {
      if (languages.length === 0) {
        await ctx.delete(`${API_BASE}/api/state-language-mappings/${state}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const res = await ctx.put(`${API_BASE}/api/state-language-mappings/${state}`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { languages },
        });
        expect(res.ok()).toBeTruthy();
      }
    } finally {
      await ctx.dispose();
    }
  }

  test('state-language table is visible on the Languages tab', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Languages' }).click();
    await expect(page.getByTestId('state-lang-table')).toBeVisible();
    await snap(page, FLOW, 'lang_01_table');
  });

  test('Penang (ZH+EN) and Kelantan (MS) mappings persist after reload', async ({ page }) => {
    const ctx   = await request.newContext();
    const token = await adminToken(ctx);
    await ctx.dispose();

    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Languages' }).click();
    await expect(page.getByTestId('state-lang-table')).toBeVisible();

    // Penang → ZH + EN
    const penangRow = page.getByTestId('state-lang-row-PENANG');
    await penangRow.getByRole('button', { name: 'Edit' }).click();
    const picker = penangRow.getByTestId('state-lang-multiselect');
    await picker.getByTestId('state-lang-opt-ZH').check();
    await picker.getByTestId('state-lang-opt-EN').check();
    await penangRow.getByTestId('state-lang-save').click();
    await expect(penangRow.getByTestId('state-lang-multiselect')).toHaveCount(0);

    // Kelantan → MS
    const kelantanRow = page.getByTestId('state-lang-row-KELANTAN');
    await kelantanRow.getByRole('button', { name: 'Edit' }).click();
    await kelantanRow.getByTestId('state-lang-multiselect').getByTestId('state-lang-opt-MS').check();
    await kelantanRow.getByTestId('state-lang-save').click();
    await snap(page, FLOW, 'lang_02_both_saved');

    await page.reload();
    await page.getByRole('tab', { name: 'Languages' }).click();
    await expect(page.getByTestId('state-lang-row-PENANG').getByText('ZH', { exact: true })).toBeVisible();
    await expect(page.getByTestId('state-lang-row-PENANG').getByText('EN', { exact: true })).toBeVisible();
    await expect(page.getByTestId('state-lang-row-KELANTAN').getByText('MS', { exact: true })).toBeVisible();
    await snap(page, FLOW, 'lang_03_persisted');

    // Cleanup
    await setMapping(token, 'PENANG', []);
    await setMapping(token, 'KELANTAN', []);
  });
});
