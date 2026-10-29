#!/usr/bin/env node
/**
 * DOES "Create Account" APPEAR FOR THE APPROVER ONCE HARDCOPY IS "Pending Assignee"?
 *
 *   node scripts/probe-create-account-visible.js NA68001158
 *
 * TS18.2's `regr-account` was rewritten on 31-08-2026 to set that field in the take's own
 * assignee session and then READ the control in an approver session, because
 * src/createAccount.js says it needs BOTH: Hardcopy & Acc Created = "Pending Assignee"
 * AND an approver session — the assignee cannot see it.
 *
 * That premise must not first be tested by a take. TS18.2's other leg, `regr-revert`,
 * CONSUMES its own spare, so a take that discovers this is wrong burns a record for
 * nothing. This asks first, on the record regr-account will actually use.
 *
 * WRITES the hardcopy field and PUTS IT BACK, reading it back rather than claiming it.
 */
const { chromium } = require('@playwright/test');
const { login } = require('../src/login');
const { ROLES } = require('../src/env');
const listing = require('../src/listing');
const application = require('../src/application');

const APP_NO = process.argv[2] || '';
if (!APP_NO) { console.error('usage: probe-create-account-visible.js <NA...>'); process.exit(2); }

const openAs = async (browser, role) => {
  const page = await (await browser.newContext()).newPage();
  await login(page, ROLES[role]);
  const uuid = await listing.openApplication(page, APP_NO);
  if (!uuid) throw new Error(`the listing did not return ${APP_NO} for ${role}`);
  await application.goto(page, uuid, application.TAB.regDocs).catch(() => {});
  await page.waitForTimeout(1500);
  return page;
};
const countCA = (page) => page.locator('button, a').filter({ hasText: /create account/i }).count().catch(() => 0);

(async () => {
  const browser = await chromium.launch({ headless: !process.argv.includes('--headed') });
  let asg = null; let was = null;
  try {
    asg = await openAs(browser, 'assignee');
    const sel = asg.locator('#hardcopyStatus');
    if (!(await sel.count())) throw new Error('no #hardcopyStatus on this page');
    was = await sel.inputValue().catch(() => '');
    console.log(`\n  ${APP_NO} — hardcopy BEFORE: ${JSON.stringify(was)}`);
    if (/registered/i.test(was)) throw new Error('Hardcopy is "Registered" — terminal, and not ours to move');

    // ---- the CONTROL: is it invisible to the approver BEFORE the change? -----------
    let ops = await openAs(browser, 'approver');
    const before = await countCA(ops);
    console.log(`  approver sees "Create Account" BEFORE the change: ${before}`);
    await ops.context().close();

    // ---- set Pending Assignee, in the assignee session that is allowed to ----------
    await sel.selectOption('PENDING_ASSIGNEE');
    await asg.waitForTimeout(700);
    const upd = asg.locator('#update-hardcopy-status');
    await upd.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
    if (!(await upd.count())) throw new Error('#update-hardcopy-status never appeared — the field cannot be saved');
    await upd.click({ timeout: 15_000 });
    await asg.waitForTimeout(2000);
    await asg.reload({ waitUntil: 'domcontentloaded' });
    await asg.waitForTimeout(1200);
    const now = await asg.locator('#hardcopyStatus').inputValue().catch(() => '');
    console.log(`  hardcopy AFTER the change: ${JSON.stringify(now)} — ${/pending[_ ]assignee/i.test(now) ? 'set' : '*** DID NOT SET ***'}`);
    const asgSees = await countCA(asg);
    console.log(`  the ASSIGNEE sees "Create Account": ${asgSees}   (expected 0 — it is an approver's control)`);

    // ---- the question -------------------------------------------------------------
    ops = await openAs(browser, 'approver');
    const after = await countCA(ops);
    console.log(`  the APPROVER sees "Create Account": ${after}`);
    await ops.context().close();

    console.log('\n  ---- verdict ----');
    if (after > 0) console.log('    THE PREMISE HOLDS. regr-account can film Create Account in an approver session.');
    else console.log('    *** THE PREMISE FAILS — Create Account is not visible to the approver even at\n'
      + '    "Pending Assignee". regr-account cannot tick as rewritten; do NOT spend NA68001156 on it.');
  } catch (e) {
    console.error(`\n  probe failed: ${String(e.message || e).split('\n')[0]}`);
    process.exitCode = 1;
  } finally {
    // ---- RESTORE, read back, and say so honestly ----------------------------------
    if (asg && was && !/registered/i.test(was)) {
      try {
        await asg.reload({ waitUntil: 'domcontentloaded' });
        await asg.waitForTimeout(1200);
        const cur = await asg.locator('#hardcopyStatus').inputValue().catch(() => '');
        if (cur !== was) {
          await asg.locator('#hardcopyStatus').selectOption(was).catch(() => {});
          await asg.waitForTimeout(700);
          const undo = asg.locator('#update-hardcopy-status');
          if (await undo.count()) { await undo.click({ timeout: 15_000 }).catch(() => {}); await asg.waitForTimeout(2000); }
          await asg.reload({ waitUntil: 'domcontentloaded' });
          await asg.waitForTimeout(1200);
        }
        const back = await asg.locator('#hardcopyStatus').inputValue().catch(() => '');
        console.log(`  restore read back: ${JSON.stringify(back)} (wanted ${JSON.stringify(was)}) — ${back === was ? 'RESTORED' : '*** NOT RESTORED ***'}`);
        if (back !== was) process.exitCode = 3;
      } catch (e) {
        console.error(`  restore failed: ${String(e.message || e).split('\n')[0]} — CHECK THIS RECORD BY HAND`);
        process.exitCode = 3;
      }
    }
    await browser.close();
  }
})();
