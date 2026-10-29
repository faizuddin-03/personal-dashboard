/**
 * BackOffice user roles — reading them, and switching one.
 *
 * This build has exactly THREE roles: the user-account listing's `userRole`
 * filter and the edit screen's `role` radios both offer **Admin · HubAdmin ·
 * Probation** and nothing else. What the team calls a "superadmin" / "supermin"
 * account is `jasons` (Charmain, 26-08-2026) — a HubAdmin, already swept by TS15.
 * "CSE", "Ops" and "Finance" are the credential store's labels for whose login
 * it is; the system does not know them.
 *
 * Probation is the only role that cannot reach the Application module, so it is
 * the only one worth switching an account to — and QA has no Probation login, so
 * testing it means changing a SHARED account's role and putting it back.
 *
 * Extracted from scripts/probe-bo-roles.js so the script and the spec drive the
 * same code. Everything here is read-only except `setRole`.
 *
 * Measured column order on the user-account listing, 26-08-2026:
 *   0 #  1 Login ID  2 Name  3 User Role  4 Account status
 *   5 Created On  6 Assignee  7 Created By  8 Action
 * Reading Login ID out of cell 0 matches nothing — cell 0 is the row NUMBER, and
 * that mistake hung the first version of the probe with no output at all.
 */
const { BASE, INSTANCE } = require('./env');

/** The three roles this build offers. */
const ROLES = ['Admin', 'HubAdmin', 'Probation'];

/** The one role that cannot reach the Application module (R17). */
const NO_MODULE_ROLE = 'Probation';

const userListingUrl = () => BASE + '/' + INSTANCE + '/view/account/user';
const userEditUrl = (loginId, company = '99000') =>
  BASE + '/' + INSTANCE + '/view/account/user/edit.get?id=' + company + '/' + loginId;

/**
 * One filtered search on the user-account listing. Read-only.
 * Returns rows as cell arrays, so callers index by the measured column order.
 */
async function search(page, { loginId = '', userRole = '' } = {}) {
  await page.goto(userListingUrl(), { waitUntil: 'domcontentloaded', timeout: 40_000 });
  await page.locator('input[name="loginId"]').first().fill(loginId);
  if (userRole) await page.locator('select[name="userRole"]').first().selectOption(userRole).catch(() => {});
  await Promise.all([
    page.waitForLoadState('domcontentloaded', { timeout: 40_000 }).catch(() => {}),
    page.locator('#to-search').first().click({ timeout: 20_000 }),
  ]);
  await page.waitForTimeout(400);
  return page.locator('table tbody tr').evaluateAll((trs) =>
    trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.innerText.trim()))
       .filter((cells) => cells.length >= 5));
}

/**
 * One account's row, matched EXACTLY on login id. `BOChar1` is a different
 * account from `BOChar` and it already sits on Probation, so a substring match
 * silently reads — or worse, writes — the wrong user.
 */
async function readRow(page, loginId) {
  const rows = await search(page, { loginId });
  const row = rows.find((c) => (c[1] || '').trim().toLowerCase() === loginId.trim().toLowerCase());
  return row
    ? { found: true, cells: row, loginId: row[1], name: row[2], role: row[3], accountStatus: row[4], assignee: row[6] }
    : { found: false, cells: [], loginId: '', name: '', role: '', accountStatus: '', assignee: '' };
}

/**
 * The edit screen's radio state — the role AND the `isOnboardingAssignee` flag,
 * which no role test may move. The edit screen carries no login-id field, which
 * is why callers must cross-check identity against the listing row.
 */
async function readEditState(page, loginId, company) {
  await page.goto(userEditUrl(loginId, company), { waitUntil: 'domcontentloaded', timeout: 40_000 });
  const radios = await page.locator('input[type=radio]').evaluateAll((els) =>
    els.map((e) => ({ name: e.name, value: e.value, checked: e.checked })));
  const pick = (name) => (radios.find((r) => r.name === name && r.checked) || {}).value || '';
  return {
    role: pick('role'),
    isOnboardingAssignee: pick('isOnboardingAssignee'),
    rolesOffered: radios.filter((r) => r.name === 'role').map((r) => r.value),
    radios,
  };
}

/**
 * WRITE. Set one account's role and read it back from both surfaces.
 *
 * Refuses if the listing does not hold the account, or if the build does not
 * offer the role. Returns `{ ok, editScreen, listing, assigneeMoved }` — callers
 * must check `ok` before drawing any conclusion, because a save that silently
 * failed looks identical to one that worked.
 */
async function setRole(page, loginId, role, { company, baseline } = {}) {
  const row = await readRow(page, loginId);
  if (!row.found) throw new Error(loginId + ' is not on the user listing — refusing to save');
  const before = await readEditState(page, loginId, company);
  if (!before.rolesOffered.includes(role)) {
    throw new Error('this build offers no role "' + role + '" (offers ' + before.rolesOffered.join(', ') + ')');
  }
  await page.locator('input[type=radio][name="role"][value="' + role + '"]').first().check();
  // `.catch` is load-bearing: another leg may already have a dialog handler
  // registered (logout() leaves one behind when it finds no logout link), and
  // then THIS accept throws "already handled" AFTER the save has succeeded —
  // which reads as a failed role change and, on a restore, as a shared account
  // left broken. Measured 27-08-2026: it left BOChar on Probation.
  page.once('dialog', (d) => d.accept().catch(() => {}));
  await page.locator('#edit-user').first().click({ timeout: 20_000 });   // input[type=button], value "Update »"
  await page.waitForLoadState('domcontentloaded', { timeout: 40_000 }).catch(() => {});
  await page.waitForTimeout(500);
  const after = await readEditState(page, loginId, company);
  const row2 = await readRow(page, loginId);
  const ref = baseline || before;
  return {
    asked: role,
    editScreen: after.role,
    listing: row2.role,
    isOnboardingAssignee: after.isOnboardingAssignee,
    assigneeMoved: after.isOnboardingAssignee !== ref.isOnboardingAssignee,
    ok: after.role === role && String(row2.role).toLowerCase() === role.toLowerCase(),
  };
}

/**
 * Does this account see the Application module in the BackOffice menu?
 *
 * The MENU is the measurement, and here that is the point rather than a means:
 * R17 is a claim about what a role can SEE, so the thing to read is the menu the
 * app renders for it. A direct hit on an /obs URL answers a different question —
 * /obs is a separate application needing a session handoff (src/obs.js), so it
 * refuses direct entry for EVERY role: the 26-08 Probation take got HTTP 403 and
 * so did the HubAdmin control run straight after the restore.
 *
 * Note for anyone reading this next to src/obs.js (27-08-2026): the takes no
 * longer CLICK the menu to enter /obs — they navigate the handoff URL the menu
 * item points at. This function still reads the rendered menu, deliberately.
 */
async function moduleVisible(page) {
  const text = await page.locator('body').innerText().catch(() => '');
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  return {
    onboarding: /onboarding/i.test(text),
    applicationListing: /ucd application listing|application listing/i.test(text),
    matched: lines.filter((l) => /onboard|application listing|pre-?application/i.test(l)).slice(0, 10),
  };
}

module.exports = {
  ROLES, NO_MODULE_ROLE,
  userListingUrl, userEditUrl,
  search, readRow, readEditState, setRole, moduleVisible,
};
