/**
 * FLOW: Authentication & Role-Based Access
 *
 * Combines: login.spec.ts + auth-persistence.spec.ts + operator.spec.ts + shell-polish.spec.ts
 *
 * Covers the full session lifecycle — login, session persistence across reloads,
 * logout behaviour, keyboard shortcuts, and role-based UI restrictions for the
 * operator (support) role vs the admin role.
 */
import { test, expect, type Page } from '@playwright/test';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL    = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';
const OPERATOR_EMAIL = 'support@example.com';
const OPERATOR_PASSWORD = 'ChangeMe123!';
const FLOW = 'flow-auth-and-roles';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

// ─── Login page ───────────────────────────────────────────────────────────────

test.describe('Login page', () => {
  test('remember-me checkbox is checked by default', async ({ page }) => {
    await page.goto('/login');
    await snap(page, FLOW, 'login_01_page');
    await expect(page.getByTestId('remember-me')).toBeChecked();
  });

  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await snap(page, FLOW, 'login_02_unauthenticated_redirect');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('wrong password shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email').fill(ADMIN_EMAIL);
    await page.getByTestId('password').fill('wrong-password');
    await page.getByTestId('submit').click();
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
    await snap(page, FLOW, 'login_03_wrong_password_error');
  });
});

// ─── Admin session lifecycle ──────────────────────────────────────────────────

test.describe('Admin session lifecycle', () => {
  test('admin logs in, sees dashboard, navigates with keyboard, opens help overlay, then logs out', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await snap(page, FLOW, 'session_01_dashboard_after_login');

    await expect(page.getByTestId('dashboard-title')).toHaveText('Dashboard');
    await expect(page.getByTestId('current-user')).toHaveText(ADMIN_EMAIL);

    // Keyboard shortcut g → i navigates to Inbox
    await page.keyboard.press('g');
    await page.keyboard.press('i');
    await expect(page).toHaveURL(/\/inbox$/);
    await snap(page, FLOW, 'session_02_inbox_via_keyboard');

    // Help button opens the keyboard-shortcuts overlay; Escape closes it
    await page.getByTestId('help-button').click();
    await expect(page.getByTestId('shortcuts-overlay')).toBeVisible();
    await snap(page, FLOW, 'session_03_shortcuts_overlay');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shortcuts-overlay')).toHaveCount(0);

    // Logout and land on /login
    await page.getByTestId('logout').click();
    await expect(page).toHaveURL(/\/login$/);
    await snap(page, FLOW, 'session_04_after_logout');
  });

  test('session persists across page reload', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await snap(page, FLOW, 'persist_01_dashboard_before_reload');

    await page.reload();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByTestId('current-user')).toHaveText(ADMIN_EMAIL);
    await snap(page, FLOW, 'persist_02_dashboard_after_reload');
  });

  test('after logout, reload stays on /login', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.getByTestId('logout').click();
    await expect(page).toHaveURL(/\/login$/);

    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
    await snap(page, FLOW, 'logout_01_stays_on_login');
  });

  test('admin can access /settings and see users table', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByTestId('users-table')).toBeVisible();
    await snap(page, FLOW, 'admin_01_settings_page');
  });
});

// ─── Operator role restrictions ───────────────────────────────────────────────

test.describe('Operator role restrictions', () => {
  test('operator sees the correct nav items and is blocked from admin-only pages', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await snap(page, FLOW, 'op_01_dashboard_nav_items');

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dealers' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inbox' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Templates' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Campaigns' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Knowledge' })).toHaveCount(0);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/$/);
    await snap(page, FLOW, 'op_02_settings_blocked_redirect');
  });

  test('operator can access Dealers but has no Add dealer button', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();
    await expect(page.getByTestId('add-dealer')).toHaveCount(0);
    await snap(page, FLOW, 'op_03_dealers_no_add_button');
  });

  test('operator can access the inbox', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByRole('heading', { name: /inbox/i })).toBeVisible();
    expect(page.url()).toContain('/inbox');
    await snap(page, FLOW, 'op_04_inbox_accessible');
  });
});
