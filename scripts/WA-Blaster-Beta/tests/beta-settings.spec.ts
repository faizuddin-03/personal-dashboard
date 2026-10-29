/**
 * BETA SUITE 8 — Settings & Team
 *
 * Team member CRUD (invite, duplicate guard, password reset, delete)
 * and state-to-language mapping configuration.
 */
import { test, expect, type Page } from '../fixtures/authFixture';
import { snap } from '../utils/screenshot';
import { adminToken, setStateLanguageMapping } from '../utils/api';
import { SettingsPage } from '../pages/SettingsPage';
import { SETTINGS } from '../data/testData';
import { INVITE_PASSWORD, RESET_PASSWORD } from '../data/users';

const FLOW = 'beta-settings';

async function gotoTeam(page: Page): Promise<SettingsPage> {
  const settings = new SettingsPage(page);
  await settings.goto();
  await settings.openTab('Team & Roles');
  await expect(settings.usersTable()).toBeVisible();
  return settings;
}

// ─── Team management ──────────────────────────────────────────────────────────

test.describe('Team management', () => {
  test('invite member → appears in users table', async ({ adminPage }) => {
    const settings = await gotoTeam(adminPage);
    await snap(adminPage, FLOW, 'team_01_users_table');

    const suffix = Date.now().toString().slice(-8);
    const email  = `${SETTINGS.inviteEmailPrefix}.${suffix}@example.com`;
    const name   = `${SETTINGS.inviteNamePrefix} ${suffix}`;

    await settings.inviteMember(email, name, INVITE_PASSWORD);
    await expect(settings.addUserForm()).toBeHidden({ timeout: 8_000 });
    await expect(settings.usersTable()).toContainText(email);
    await expect(settings.usersTable()).toContainText(name);
    await snap(adminPage, FLOW, 'team_02_user_in_table');
  });

  test('duplicate email shows inline error and keeps modal open', async ({ adminPage }) => {
    const settings = await gotoTeam(adminPage);

    const suffix = Date.now().toString().slice(-8);
    const email  = `${SETTINGS.inviteEmailPrefix}.dup.${suffix}@example.com`;

    await settings.inviteMember(email, `${SETTINGS.inviteNamePrefix} Dup A ${suffix}`, INVITE_PASSWORD);
    await expect(settings.addUserForm()).toBeHidden({ timeout: 8_000 });

    await settings.inviteMember(email, `${SETTINGS.inviteNamePrefix} Dup B ${suffix}`, INVITE_PASSWORD);
    await expect(settings.addUserError()).toBeVisible();
    await expect(settings.addUserError()).toContainText(/already|exist/i);
    await snap(adminPage, FLOW, 'team_03_dup_error');
  });

  test('admin resets a team member password', async ({ adminPage }) => {
    const settings = await gotoTeam(adminPage);

    const suffix = Date.now().toString().slice(-8);
    const email  = `${SETTINGS.inviteEmailPrefix}.reset.${suffix}@example.com`;

    await settings.inviteMember(email, `${SETTINGS.inviteNamePrefix} Reset ${suffix}`, INVITE_PASSWORD);
    await expect(settings.addUserForm()).toBeHidden({ timeout: 8_000 });

    await settings.openResetPassword(email);
    await expect(settings.resetPasswordForm()).toBeVisible();
    await settings.fillResetPassword(RESET_PASSWORD);
    await settings.submitResetPassword();
    await expect(settings.resetPasswordForm()).toBeHidden({ timeout: 8_000 });
    await snap(adminPage, FLOW, 'team_04_password_reset');
  });

  test('admin deletes a team member — removed from table', async ({ adminPage }) => {
    const settings = await gotoTeam(adminPage);

    const suffix = Date.now().toString().slice(-8);
    const email  = `${SETTINGS.inviteEmailPrefix}.del.${suffix}@example.com`;

    await settings.inviteMember(email, `${SETTINGS.inviteNamePrefix} Del ${suffix}`, INVITE_PASSWORD);
    await expect(settings.addUserForm()).toBeHidden({ timeout: 8_000 });
    await expect(settings.usersTable()).toContainText(email);

    await settings.deleteUser(email);
    await expect(settings.usersTable()).not.toContainText(email, { timeout: 8_000 });
    await snap(adminPage, FLOW, 'team_05_deleted');
  });
});

// ─── State → language mappings ────────────────────────────────────────────────

test.describe('State → language mapping', () => {
  test('state-language table is visible on the Languages tab', async ({ adminPage }) => {
    const settings = new SettingsPage(adminPage);
    await settings.goto();
    await settings.openTab('Languages');
    await expect(settings.stateLangTable()).toBeVisible();
    await snap(adminPage, FLOW, 'lang_01_table');
  });

  test('Penang (ZH+EN) and Kelantan (MS) mappings persist after reload', async ({ adminPage }) => {
    const token = await adminToken();

    const settings = new SettingsPage(adminPage);
    await settings.goto();
    await settings.openTab('Languages');
    await expect(settings.stateLangTable()).toBeVisible();

    // State 1 → Lang 1 + Lang 2
    await settings.editState(SETTINGS.mappingState1);
    await settings.checkLangOption(SETTINGS.mappingState1, SETTINGS.mappingLang1a);
    await settings.checkLangOption(SETTINGS.mappingState1, SETTINGS.mappingLang1b);
    await settings.saveState(SETTINGS.mappingState1);
    await expect(settings.multiselect(SETTINGS.mappingState1)).toHaveCount(0);

    // State 2 → its single language
    await settings.editState(SETTINGS.mappingState2);
    await settings.checkLangOption(SETTINGS.mappingState2, SETTINGS.mappingLang2);
    await settings.saveState(SETTINGS.mappingState2);
    await snap(adminPage, FLOW, 'lang_02_both_saved');

    await settings.reload();
    await settings.openTab('Languages');
    await expect(settings.stateLangText(SETTINGS.mappingState1, SETTINGS.mappingLang1a)).toBeVisible();
    await expect(settings.stateLangText(SETTINGS.mappingState1, SETTINGS.mappingLang1b)).toBeVisible();
    await expect(settings.stateLangText(SETTINGS.mappingState2, SETTINGS.mappingLang2)).toBeVisible();
    await snap(adminPage, FLOW, 'lang_03_persisted');

    // Cleanup
    await setStateLanguageMapping(token, SETTINGS.mappingState1, []);
    await setStateLanguageMapping(token, SETTINGS.mappingState2, []);
  });
});
