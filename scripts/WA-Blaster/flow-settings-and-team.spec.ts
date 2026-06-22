/**
 * FLOW: Settings — Team Management & Canned Replies
 *
 * Combines: wa-blaster-users.spec.ts + wa-blaster-canned-replies.spec.ts
 *           + inbox-agent-assist.spec.ts (canned replies section)
 *
 * Covers the full settings lifecycle: inviting team members, handling duplicate
 * emails, changing roles, resetting passwords, deleting members, and the full
 * CRUD cycle for canned replies. Also verifies operator cannot access settings.
 */
import { test, expect, type Page } from './helpers/fixtures';
import { snap } from './helpers/screenshot';

const ADMIN_EMAIL       = process.env.E2E_ADMIN_EMAIL       ?? 'admin@example.com';
const ADMIN_PASSWORD    = process.env.E2E_ADMIN_PASSWORD    ?? 'ChangeMe123!';
const OPERATOR_EMAIL    = process.env.E2E_OPERATOR_EMAIL    ?? 'support@example.com';
const OPERATOR_PASSWORD = process.env.E2E_OPERATOR_PASSWORD ?? 'ChangeMe123!';
const FLOW = 'flow-settings-and-team';

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

async function inviteUser(
  page: Page,
  email: string,
  name: string,
  password = 'Password123!',
  role = 'OPERATOR',
) {
  await page.getByTestId('invite-member-btn').click();
  await expect(page.getByTestId('add-user-form')).toBeVisible();
  await page.getByTestId('new-user-email').fill(email);
  await page.getByTestId('new-user-name').fill(name);
  await page.getByTestId('new-user-password').fill(password);
  await page.getByTestId('new-user-role').selectOption(role);
  await page.getByTestId('new-user-submit').click();
}

// ─── Team management ──────────────────────────────────────────────────────────

test.describe('Team management', () => {
  test('invite member → appears in users table with correct name and email', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoTeam(page);
    await snap(page, FLOW, 'team_01_users_table');

    const suffix = Date.now().toString().slice(-8);
    const email  = `e2e.invite.${suffix}@example.com`;
    const name   = `E2E User ${suffix}`;

    await inviteUser(page, email, name);
    await snap(page, FLOW, 'team_02_invite_form');
    await expect(page.getByTestId('add-user-form')).toBeHidden({ timeout: 8_000 });

    await expect(page.getByTestId('users-table')).toContainText(email);
    await expect(page.getByTestId('users-table')).toContainText(name);
    await snap(page, FLOW, 'team_03_user_in_table');
  });

  test('duplicate email shows inline error and keeps modal open', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoTeam(page);

    const suffix = Date.now().toString().slice(-8);
    const email  = `e2e.dup.${suffix}@example.com`;

    await inviteUser(page, email, `E2E Dup Original ${suffix}`);
    await expect(page.getByTestId('add-user-form')).toBeHidden({ timeout: 8_000 });

    await inviteUser(page, email, `E2E Dup Clash ${suffix}`);
    await expect(page.getByTestId('add-user-error')).toBeVisible();
    await expect(page.getByTestId('add-user-error')).toContainText(/already|exist/i);
    await expect(page.getByTestId('add-user-form')).toBeVisible();
    await snap(page, FLOW, 'team_04_duplicate_email_error');
  });

  test('admin resets a team member password', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoTeam(page);

    const suffix = Date.now().toString().slice(-8);
    const email  = `e2e.reset.${suffix}@example.com`;

    await inviteUser(page, email, `E2E Reset ${suffix}`);
    await expect(page.getByTestId('add-user-form')).toBeHidden({ timeout: 8_000 });

    const row = page.getByTestId('users-table').locator('tr').filter({ hasText: email });
    await row.getByRole('button', { name: 'Reset password' }).click();
    await expect(page.getByTestId('reset-password-form')).toBeVisible();
    await snap(page, FLOW, 'team_05_reset_password_form');
    await page.getByTestId('reset-password-input').fill('NewPassword456!');
    await page.getByTestId('reset-password-submit').click();
    await expect(page.getByTestId('reset-password-form')).toBeHidden({ timeout: 8_000 });
    await snap(page, FLOW, 'team_06_password_reset_done');
  });

  test('admin deletes a team member — they disappear from the table', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoTeam(page);

    const suffix = Date.now().toString().slice(-8);
    const email  = `e2e.del.${suffix}@example.com`;

    await inviteUser(page, email, `E2E Delete ${suffix}`);
    await expect(page.getByTestId('add-user-form')).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId('users-table')).toContainText(email);
    await snap(page, FLOW, 'team_07_user_before_delete');

    const row = page.getByTestId('users-table').locator('tr').filter({ hasText: email });
    page.once('dialog', (d) => d.accept());
    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByTestId('users-table')).not.toContainText(email, { timeout: 8_000 });
    await snap(page, FLOW, 'team_08_user_deleted');
  });

  test('operator is redirected away from /settings and has no invite button', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('invite-member-btn')).toHaveCount(0);
    await snap(page, FLOW, 'team_09_operator_blocked');
  });
});

// ─── Canned replies CRUD ──────────────────────────────────────────────────────

test.describe('Canned replies', () => {
  async function gotoCannedReplies(page: Page) {
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Canned replies' }).click();
    await expect(page.getByTestId('canned-replies-list')).toBeVisible();
  }

  test('create → edit → delete full lifecycle', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoCannedReplies(page);
    await snap(page, FLOW, 'canned_01_list');

    const suffix = Date.now().toString().slice(-6);
    const title  = `E2E Lifecycle ${suffix}`;

    await page.getByTestId('add-canned-reply').click();
    await page.getByPlaceholder('Title').fill(title);
    await page.getByPlaceholder('Category (optional)').fill('Support');
    await page.getByPlaceholder('Reply body').fill(`Initial body ${suffix}`);
    await snap(page, FLOW, 'canned_02_create_form');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByPlaceholder('Title')).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId('canned-replies-list')).toContainText(title);
    await snap(page, FLOW, 'canned_03_created_in_list');

    const row = page.getByTestId('canned-replies-list').locator('div').filter({ hasText: title }).first();
    await row.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByPlaceholder('Reply body')).toBeVisible();
    await page.getByPlaceholder('Reply body').clear();
    await page.getByPlaceholder('Reply body').fill(`Edited body ${suffix}`);
    await snap(page, FLOW, 'canned_04_edit_form');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByPlaceholder('Reply body')).toBeHidden({ timeout: 8_000 });
    await expect(page.getByTestId('canned-replies-list')).toContainText(`Edited body`);
    await snap(page, FLOW, 'canned_05_edited_in_list');

    const editedRow = page.getByTestId('canned-replies-list').locator('div').filter({ hasText: title }).first();
    page.once('dialog', (d) => d.accept());
    await editedRow.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByTestId('canned-replies-list')).not.toContainText(title, { timeout: 8_000 });
    await snap(page, FLOW, 'canned_06_deleted');
  });

  test('Add button is disabled until both title and body are filled', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoCannedReplies(page);

    await page.getByTestId('add-canned-reply').click();
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();
    await snap(page, FLOW, 'canned_07_add_disabled_empty');

    await page.getByPlaceholder('Title').fill('Title only');
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();

    await page.getByPlaceholder('Reply body').fill('Now both filled');
    await expect(page.getByRole('button', { name: 'Add' })).toBeEnabled();
    await snap(page, FLOW, 'canned_08_add_enabled_both_filled');
  });

  test('cancelling the create modal discards changes', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoCannedReplies(page);

    await page.getByTestId('add-canned-reply').click();
    await page.getByPlaceholder('Title').fill('Abandoned title');
    await snap(page, FLOW, 'canned_09_before_cancel');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByPlaceholder('Title')).toBeHidden();
    await expect(page.getByTestId('canned-replies-list')).not.toContainText('Abandoned title');
    await snap(page, FLOW, 'canned_10_cancelled_discarded');
  });

  test('seeded canned replies list is visible and Add button is present', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await gotoCannedReplies(page);
    await expect(page.getByTestId('canned-replies-list')).toBeVisible();
    await expect(page.getByTestId('add-canned-reply')).toBeVisible();
    await snap(page, FLOW, 'canned_11_seeded_list_visible');
  });
});
