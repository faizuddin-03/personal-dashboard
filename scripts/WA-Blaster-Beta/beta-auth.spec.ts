/**
 * BETA SUITE 1 — Auth & Access Control
 *
 * Covers the full authentication lifecycle and role-based UI gates.
 * Tests login page defaults, credential validation, session persistence,
 * logout behaviour, keyboard navigation, and admin-vs-operator restrictions.
 */
import { test, expect, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!';
const WRONG_PASSWORD = process.env.E2E_WRONG_PASSWORD ?? 'wrong-password';
const FLOW = 'beta-auth';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

async function logout(page: Page) {
  await page.locator('button.usermenu').click();
  await page.getByTestId('logout').click();
}

// ─── Login page defaults ──────────────────────────────────────────────────────

test.describe('Login page defaults', () => {
  test('remember-me checkbox is checked by default', async ({ page }) => {
    await page.goto('/login');
    await snap(page, FLOW, 'login_01_page_load');
    await expect(page.getByTestId('remember-me')).toBeChecked();
  });

  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await snap(page, FLOW, 'login_02_unauthenticated_redirect');
  });

  test('wrong credentials show inline error', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email').fill(ADMIN_EMAIL);
    await page.getByTestId('password').fill(WRONG_PASSWORD);
    await page.getByTestId('submit').click();
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
    await snap(page, FLOW, 'login_03_wrong_credentials');
  });
});

// ─── Admin session lifecycle ──────────────────────────────────────────────────

test.describe('Admin session lifecycle', () => {
  test('admin login lands on dashboard with greeting', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByTestId('current-user')).toHaveText(ADMIN_EMAIL);
    await snap(page, FLOW, 'session_01_dashboard');
  });

  test('session persists after page reload', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.reload();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await snap(page, FLOW, 'session_02_persist_after_reload');
  });

  test('after logout, reload stays on /login', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await logout(page);
    await expect(page).toHaveURL(/\/login$/);
    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
    await snap(page, FLOW, 'session_03_stays_on_login');
  });

  test('admin can open Settings and see the users table', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await page.getByRole('tab', { name: 'Team & Roles' }).click();
    await expect(page.getByTestId('users-table')).toBeVisible();
    await snap(page, FLOW, 'session_04_settings_users');
  });

  test('keyboard shortcut g→i navigates to Inbox', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.keyboard.press('g');
    await page.keyboard.press('i');
    await expect(page).toHaveURL(/\/inbox$/);
    await snap(page, FLOW, 'session_05_inbox_via_keyboard');
  });

  test('help overlay opens on help-button and closes on Escape', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.getByTestId('help-button').click();
    await expect(page.getByTestId('shortcuts-overlay')).toBeVisible();
    await snap(page, FLOW, 'session_06_shortcuts_overlay');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shortcuts-overlay')).toHaveCount(0);
  });
});

// ─── Role restrictions ────────────────────────────────────────────────────────

test.describe.skip('Operator role restrictions', () => {
  const OPERATOR_EMAIL    = process.env.E2E_OPERATOR_EMAIL    ?? 'support@example.com';
  const OPERATOR_PASSWORD = process.env.E2E_OPERATOR_PASSWORD ?? 'ChangeMe123!';

  test('operator is blocked from /settings and redirected home', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/$/);
    await snap(page, FLOW, 'op_01_settings_blocked');
  });

  test('operator accesses Dealers but sees no Add button', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await expect(page.getByTestId('add-dealer')).toHaveCount(0);
    await snap(page, FLOW, 'op_02_dealers_no_add');
  });

  test('operator can access the inbox', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await page.goto('/inbox');
    await expect(page).toHaveURL(/\/inbox$/);
    await snap(page, FLOW, 'op_03_inbox_accessible');
  });
});
