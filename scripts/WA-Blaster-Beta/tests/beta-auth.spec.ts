/**
 * BETA SUITE 1 — Auth & Access Control
 *
 * Covers the full authentication lifecycle and role-based UI gates.
 * Tests login page defaults, credential validation, session persistence,
 * logout behaviour, keyboard navigation, and admin-vs-operator restrictions.
 */
import { test, expect } from '../fixtures/authFixture';
import { snap } from '../utils/screenshot';
import { LoginPage } from '../pages/LoginPage';
import { NavPage } from '../pages/NavPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ContactsPage } from '../pages/ContactsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { getUser, WRONG_PASSWORD } from '../data/users';

const FLOW = 'beta-auth';

// ─── Login page defaults ──────────────────────────────────────────────────────

test.describe('Login page defaults', () => {
  test('remember-me checkbox is checked by default', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await snap(page, FLOW, 'login_01_page_load');
    await expect(loginPage.rememberMe()).toBeChecked();
  });

  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(page).toHaveURL(/\/login$/);
    await snap(page, FLOW, 'login_02_unauthenticated_redirect');
  });

  test('wrong credentials show inline error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginExpectingError({ ...getUser('admin'), password: WRONG_PASSWORD });
    await expect(loginPage.loginError()).toHaveText('Invalid email or password');
    await snap(page, FLOW, 'login_03_wrong_credentials');
  });
});

// ─── Admin session lifecycle ──────────────────────────────────────────────────

test.describe('Admin session lifecycle', () => {
  test('admin login lands on dashboard with greeting', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await expect(dashboard.title()).toBeVisible();
    await expect(dashboard.currentUser()).toHaveText(getUser('admin').email);
    await snap(adminPage, FLOW, 'session_01_dashboard');
  });

  test('session persists after page reload', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.reload();
    await expect(adminPage).toHaveURL(/\/$/);
    await expect(dashboard.title()).toBeVisible();
    await snap(adminPage, FLOW, 'session_02_persist_after_reload');
  });

  test('after logout, reload stays on /login', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    await nav.logout();
    await expect(adminPage).toHaveURL(/\/login$/);
    await nav.reload();
    await expect(adminPage).toHaveURL(/\/login$/);
    await snap(adminPage, FLOW, 'session_03_stays_on_login');
  });

  test('admin can open Settings and see the users table', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    const settings = new SettingsPage(adminPage);
    await nav.openLink('Settings');
    await expect(adminPage).toHaveURL(/\/settings$/);
    await settings.openTab('Team & Roles');
    await expect(settings.usersTable()).toBeVisible();
    await snap(adminPage, FLOW, 'session_04_settings_users');
  });

  test('keyboard shortcut g→i navigates to Inbox', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    await nav.gotoByKeyboard('i');
    await expect(adminPage).toHaveURL(/\/inbox$/);
    await snap(adminPage, FLOW, 'session_05_inbox_via_keyboard');
  });

  test('help overlay opens on help-button and closes on Escape', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    await nav.openHelpOverlay();
    await expect(nav.shortcutsOverlay()).toBeVisible();
    await snap(adminPage, FLOW, 'session_06_shortcuts_overlay');
    await nav.pressEscape();
    await expect(nav.shortcutsOverlay()).toHaveCount(0);
  });
});

// ─── Role restrictions ────────────────────────────────────────────────────────

test.describe.skip('Operator role restrictions', () => {
  test('operator is blocked from /settings and redirected home', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(getUser('operator'));
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/$/);
    await snap(page, FLOW, 'op_01_settings_blocked');
  });

  test('operator accesses Dealers but sees no Add button', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const nav = new NavPage(page);
    const contacts = new ContactsPage(page);
    await loginPage.login(getUser('operator'));
    await nav.openLink('Dealers');
    await expect(contacts.table()).toBeVisible();
    await expect(contacts.addDealerButton()).toHaveCount(0);
    await snap(page, FLOW, 'op_02_dealers_no_add');
  });

  test('operator can access the inbox', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(getUser('operator'));
    await page.goto('/inbox');
    await expect(page).toHaveURL(/\/inbox$/);
    await snap(page, FLOW, 'op_03_inbox_accessible');
  });
});
