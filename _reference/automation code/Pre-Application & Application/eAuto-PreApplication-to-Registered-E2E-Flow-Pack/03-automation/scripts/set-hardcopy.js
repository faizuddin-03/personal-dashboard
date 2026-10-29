/**
 * Set Hardcopy & Acc Created on a record — the field that gates Create Account.
 *
 * WHY THIS EXISTS. `Pending Assignee` is the value that makes the Create Account
 * button appear in the page header (measured 30-08-2026 by
 * probe-create-account-states.js: it shows on Pending Assignee and on no other value).
 * Create Account is how a record reaches `Registered`, which is what TS01.8, TS37,
 * TS40 and E2E_TS10 need. handback.js says the harness cannot get there; it inferred
 * that from the dropdown not offering `Registered` directly, and never checked what
 * Pending Assignee reveals.
 *
 * ONLY THE ASSIGNEE CAN MOVE THIS FIELD — Charmain, 30-08-2026. So this logs in as the
 * ASSIGNEE role (hubadmin_bochar) by default, not the approver. A record assigned to
 * somebody else cannot be moved by us at all, and this says so rather than reporting a
 * silent no-op.
 *
 * NEVER SETS `Registered` HERE. That value is not on the dropdown anyway, but if it
 * ever appears: R9 removes the Extend control permanently, so reaching Registered is a
 * deliberate act performed by the take that films it, not a setup convenience.
 *
 *   node scripts/set-hardcopy.js --app-no NA68001120 --to "Pending Assignee"
 *   node scripts/set-hardcopy.js --app-no NA68001130 --to "Pending Assignee" --as approver
 *   node scripts/set-hardcopy.js --app-no NA68001130 --read-only
 */
const { chromium } = require('@playwright/test');
const { login } = require('../src/login');
const { ROLES } = require('../src/env');
const listing = require('../src/listing');
const application = require('../src/application');

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1]; };
const flag = (n) => argv.includes('--' + n);

const APP_NO = opt('app-no', null);
const TO = opt('to', 'Pending Assignee');
const AS = opt('as', 'assignee');
const READ_ONLY = flag('read-only');
const line = (s = '') => console.log(s);

(async () => {
  if (!APP_NO) { line('  --app-no is required'); process.exit(2); }
  if (/registered/i.test(TO)) {
    line('  REFUSED: this script never sets Registered. R9 removes the Extend control');
    line('  permanently, so that step belongs to the take that films it, not to setup.');
    process.exit(2);
  }
  const role = ROLES[AS] || AS;
  const browser = await chromium.launch({ headless: !flag('headed') });
  const page = await (await browser.newContext()).newPage();
  try {
    await login(page, role);
    const row = await listing.findByApplicationNo(page, APP_NO);
    const uuid = await listing.openApplication(page, APP_NO);
    await application.goto(page, uuid, application.TAB.regDocs);

    const sel = page.locator('#hardcopyStatus');
    if (!(await sel.count())) {
      throw new Error(`#hardcopyStatus is not on ${APP_NO}'s Registration Documents page as ${role}. ` +
        'If this record is assigned to someone else, only its assignee can move the field.');
    }
    const before = await sel.inputValue().catch(() => '');
    const options = await sel.locator('option')
      .evaluateAll((os) => os.map((o) => ({ v: o.value, t: (o.textContent || '').trim() })));
    line('');
    line(`  ${APP_NO}   as ${role}`);
    line(`  assignee on the record : ${row.assignee || row.assigneeUcd || row.approverAssignee || '(not in the listing row)'}`);
    line(`  Hardcopy now           : "${before}"`);
    line(`  dropdown offers        : ${options.map((o) => o.t).filter(Boolean).join(' | ')}`);

    const target = options.find((o) => o.t.toLowerCase() === TO.toLowerCase() || o.v === TO);
    if (!target) {
      throw new Error(`"${TO}" is not on this dropdown. It offers: ${options.map((o) => o.t).join(' | ')}`);
    }
    if (READ_ONLY) { line('  --read-only: nothing was changed.'); return; }

    // "Already at the target" still gets VERIFIED. Returning early here skipped the
    // approver-side check on three records (30-08-2026) and reported them ready on the
    // strength of a stored field value alone — which is the thing the check exists to
    // not trust.
    if (before === target.v) {
      line(`  already "${target.t}" — no write needed; verifying anyway.`);
      await verifyApprover(browser, uuid);
      return;
    }

    await sel.selectOption(target.v);
    // The Update button sits under the dropdown in the sidebar. Save is the FORM's
    // button and is a different control — pressing the wrong one leaves the field set
    // in the DOM and unsaved, which reads exactly like a build that ignored the change.
    const update = page.locator('button, a').filter({ hasText: /^\s*update\s*$/i }).first();
    if (!(await update.count())) throw new Error('the Update button under Hardcopy Doc is not on the page');
    await update.click();
    await page.waitForTimeout(2500);

    // READ IT BACK OFF A FRESH LOAD. Re-reading the control we just set proves only
    // that we set it; the question is whether the server kept it.
    await application.goto(page, uuid, application.TAB.regDocs);
    const after = await page.locator('#hardcopyStatus').inputValue().catch(() => '');
    line(`  Hardcopy after reload  : "${after}"`);
    if (after !== target.v) {
      throw new Error(`it did not stick: wanted "${target.v}", the page reloaded holding "${after}"`);
    }
    line(`  ok — ${APP_NO} is now "${target.t}"`);

    // Did it actually reveal Create Account? That is the whole point of the change, so
    // it is checked here rather than assumed by whatever runs next.
    // CHECK IT AS THE APPROVER, IN A SEPARATE SESSION. Create Account is role-gated:
    // Charmain, 30-08-2026 — "you can access the create acc button with jasons acc".
    // The field can only be MOVED by the assignee and the button can only be SEEN by
    // the approver, so one session can never observe both halves. Checking it on this
    // page reported false on three good records (30-08-2026) purely because BOChar
    // cannot see it — an absence measured by a reader that was never able to see a
    // presence, which is not evidence of anything.
    if (/pending assignee/i.test(target.t)) await verifyApprover(browser, uuid);
  } catch (e) {
    line(`  FAILED: ${e.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

/**
 * Is Create Account visible TO THE APPROVER? It is role-gated — Charmain, 30-08-2026:
 * "you can access the create acc button with jasons acc". The field can only be MOVED
 * by the assignee and the button can only be SEEN by the approver, so one session can
 * never observe both halves. Checking it on the assignee's own page reported false on
 * three good records, which is an absence measured by a reader that could never have
 * seen a presence.
 */
async function verifyApprover(browser, uuid) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  let visible = false;
  try {
    await login(p, ROLES.approver);
    await application.goto(p, uuid, application.TAB.regDocs);
    await p.locator('button, a').filter({ hasText: /create account/i }).first()
      .waitFor({ state: 'visible', timeout: 15_000 });
    visible = true;
  } catch { visible = false; } finally { await ctx.close(); }
  line(`  Create Account (as ${ROLES.approver}) : ${visible}`);
  if (!visible) {
    line('  !! Pending Assignee is set but the approver cannot see Create Account —');
    line('     do not treat this record as ready for TS01.8 / TS37 / TS40 / E2E_TS10.');
    process.exitCode = 3;
  }
  return visible;
}
