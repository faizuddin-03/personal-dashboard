/**
 * BackOffice login for a specific eAuto instance.
 *
 * Gotcha this guards against (from the eauto-credentials skill): reaching the
 * login page by redirect lands on the CENTRAL login at www.eauto.my, and a
 * successful submit there does NOT produce an instance session — every later
 * navigation quietly bounces back to the form while the script still reports
 * "logged in". So we always go to the instance login directly, and we assert we
 * are off the form afterwards.
 */
const { expect } = require('@playwright/test');
const { discoverAccounts } = require('./accounts');
const { BASE, INSTANCE } = require('./env');

const loginUrl = () => `${BASE}/${INSTANCE}/public/login/`;
const homeUrl = () => `${BASE}/${INSTANCE}/home/`;

/** Look up one account by key, e.g. 'ops_jasons'. Throws with a safe message. */
function account(key) {
  const all = discoverAccounts();
  const a = all[key.toLowerCase()];
  if (!a) {
    throw new Error(
      `No account "${key}" in the shared store. Known: ${Object.keys(all).join(', ') || '(none — is ~/.claude/secrets/eauto.env present?)'}`
    );
  }
  return a;
}

/**
 * Paint an opaque curtain over the whole viewport, and return a remover.
 *
 * For a take that re-authenticates ON CAMERA — TS48 switches a role as one
 * account, looks as a second and restores as the first, all in the one pinned
 * window — the login form is unavoidable and the credentials on it must not be.
 * The curtain is the same device as eaint-12131's `reAuthOffCamera`: it does not
 * hide the fact that a login happened (the caption says so), only the characters.
 *
 * It survives nothing: it is painted AFTER the navigation to the login page and
 * torn down once the form is gone, so a curtain left up by a thrown error dies
 * with the next page load rather than blinding the rest of the take.
 */
async function veil(page, label) {
  await page.evaluate((text) => {
    const el = document.createElement('div');
    el.id = '__qa_reauth_veil';
    Object.assign(el.style, {
      position: 'fixed', inset: '0', zIndex: '2147483646',
      background: '#0b1020', color: '#e5e7eb', display: 'flex',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      font: '600 22px/1.6 system-ui, Segoe UI, sans-serif', letterSpacing: '.01em',
    });
    el.textContent = text;
    document.documentElement.appendChild(el);
  }, label).catch(() => {});
  return async () => {
    await page.evaluate(() => document.getElementById('__qa_reauth_veil')?.remove()).catch(() => {});
  };
}

/**
 * Log in as the named account. The password is read from the shared store and
 * typed by Playwright — it is never logged and never returned.
 *
 * `{ veiled: true }` runs the same login behind the curtain above. ONE
 * implementation, not two: the assertions below are the load-bearing part (a
 * silent auth failure reads as "the screen doesn't exist"), and a second copy of
 * them for the filmed case is exactly the drift this project keeps paying for.
 *
 * The submit is DISPATCHED rather than clicked when veiled. `fill()` does not
 * require an unoccluded element, but `click()` runs a hit-target check that an
 * opaque overlay can never pass — it would retry for the full actionTimeout and
 * then fail, on camera, having filmed a curtain.
 */
async function login(page, key, { veiled = false, veilLabel } = {}) {
  const a = account(key);
  await page.goto(loginUrl(), { waitUntil: 'domcontentloaded' });

  const drop = veiled
    ? await veil(page, veilLabel || 'Re-authenticating — credentials are never filmed')
    : null;
  try {
    await page.getByRole('textbox', { name: /username/i }).fill(a.user);
    await page.locator('input[type="password"]').first().fill(a.pass);
    if (veiled) {
      await page.getByRole('button', { name: /^login$/i }).first()
        .dispatchEvent('click');
    } else {
      await page.getByRole('button', { name: /^login$/i }).click();
    }

    // A silent auth failure otherwise reads as "the screen doesn't exist".
    await expect(page.locator('input[type="password"]'), `login as ${a.key} left us on the form`)
      .toHaveCount(0, { timeout: 20_000 });
    await expect(page).not.toHaveURL(/public\/login/);
  } finally {
    if (drop) await drop();
  }

  return { key: a.key, user: a.user, label: a.label, kind: a.kind };
}

/** Log out if a session is open. Best-effort — used between role switches. */
async function logout(page) {
  // Register the handler ONLY when there is something to click, and take it off
  // again afterwards. A `page.once('dialog')` that never fires stays armed for the
  // rest of the session, and the next leg that raises a dialog has TWO handlers:
  // this one accepts, the other throws "Cannot accept dialog which is already
  // handled" — after its own action succeeded. That is how a TS48 take reported a
  // failed restore on a role change that had actually gone through, and left a
  // shared account on Probation (27-08-2026).
  const link = page.getByRole('link', { name: /^logout$/i });
  if (!(await link.count())) return;
  const accept = (d) => d.accept().catch(() => {});
  page.on('dialog', accept);
  try {
    await link.first().click();
    await page.waitForLoadState('domcontentloaded');
  } finally {
    page.off('dialog', accept);
  }
}

module.exports = { login, logout, account, loginUrl, homeUrl, veil };
