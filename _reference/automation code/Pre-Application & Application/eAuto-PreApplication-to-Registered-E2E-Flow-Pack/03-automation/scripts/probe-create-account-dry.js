/**
 * DRIVE CREATE ACCOUNT UP TO — BUT NOT THROUGH — THE SUBMIT.
 *
 *   node scripts/probe-create-account-dry.js NA68001143
 *
 * WHY THIS EXISTS. On 30-08-2026 the Create Account driver was run for the first time
 * inside a real take, on TS37. It failed on its very first call with
 * "root.locator is not a function" — open() returns { kind, root } and the caller
 * passed the whole wrapper to describe(). The take fell back to a human, the budget
 * lapsed twice, and NA68001142's one extension was spent for no usable evidence.
 *
 * Every part of that failure was reachable without spending anything. available(),
 * open(), describe() and fill() all run before submit(), and only submit() is
 * irreversible. So this exercises the whole chain and STOPS.
 *
 * It clicks Create Account, which opens the dialog. That creates nothing — the record
 * is only registered when the form is submitted — but it is not a pure read either, so
 * it is a probe you run deliberately, not a health check you run in a loop.
 *
 * NOTHING HERE SUBMITS. There is no --submit flag on purpose: a probe that can spend
 * the thing it is protecting is not a probe.
 */
const { chromium } = require('@playwright/test');
const { login } = require('../src/login');
const { ROLES } = require('../src/env');
const listing = require('../src/listing');
const app = require('../src/application');
const createAccount = require('../src/createAccount');

const APP_NO = (process.argv[2] || '').trim();
if (!APP_NO) { console.error('usage: node scripts/probe-create-account-dry.js NA6800XXXX'); process.exit(1); }

const results = [];
const check = (name, ok, detail) => {
  results.push(ok);
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  try {
    console.log(`\nCREATE ACCOUNT — dry run on ${APP_NO}, as ${ROLES.approver}\n`);
    await login(page, ROLES.approver);
    const uuid = await listing.openApplication(page, APP_NO);
    check('the record opens in the approver session', !!uuid, uuid || 'not found');
    if (!uuid) return;
    await app.goto(page, uuid, app.TAB.regDocs).catch(() => {});
    await page.waitForTimeout(1200);

    const avail = await createAccount.available(page);
    check('the Create Account button is visible and enabled', avail,
      avail ? '' : 'needs Hardcopy & Acc Created = Pending Assignee AND the approver session');
    if (!avail) return;

    const opened = await createAccount.open(page);
    check('open() returns a { kind, root } wrapper', !!opened && 'kind' in opened && 'root' in opened,
      opened ? `kind=${opened.kind}` : String(opened));

    // THE BUG THIS PROBE EXISTS FOR: the wrapper is not a Locator, and passing it
    // straight to describe() is what broke the first real run.
    let wrapperRefused = false;
    try { await createAccount.describe(opened); } catch (e) { wrapperRefused = /RESULT/.test(e.message); }
    check('describe() REFUSES the wrapper with a message that names the fix', wrapperRefused);

    // ZERO CONTROLS IS THE CORRECT ANSWER HERE, and this assertion said otherwise
    // until it was measured. The dialog is a CONFIRMATION — "Are you sure you want to
    // proceed for company account creation?" over No / Yes — so there is no form and
    // there are no mandatory fields, whatever the module header, the memory note and
    // the instructions given to the operator have been saying all day.
    //
    // It is still read rather than skipped: if the dialog ever grows a field, this
    // prints it and the count stops being zero, which is the moment to look again.
    const fields = await createAccount.describe(opened.root);
    check('describe(root) reads the dialog', Array.isArray(fields),
      `${Array.isArray(fields) ? fields.length : '?'} control(s) — 0 is expected: it is a confirmation, not a form`);
    const required = (fields || []).filter((f) => f.required);
    if (required.length) {
      console.log(`        required: ${JSON.stringify(required.map((f) => f.name || f.id || f.label))}`);
      console.log('        ^ THE DIALOG HAS GROWN FIELDS. It was field-less on 30-08-2026; look again.');
    }

    const filled = await createAccount.fill(opened.root);
    check('fill(root) fills every required control', !!filled && Array.isArray(filled.filled),
      `${filled.filled.length} filled`);
    console.log(`        filled: ${JSON.stringify(filled.filled)}`);

    // THE COMMIT CONTROL, FOUND BUT NOT CLICKED. This is the only free test of an
    // irreversible step: prove the button exists and is the right one. The dialog is a
    // CONFIRMATION (No / Yes), so the control that commits reads "Yes" — and "No" is the
    // one button here that must never be pressed.
    const btn = createAccount.submitButton(opened.root);
    const n = await btn.count();
    const label = n ? (await btn.innerText().catch(() => '')).trim() : '(none)';
    check('submit() can FIND the commit control', n > 0, JSON.stringify(label));
    check('and it is not the cancel button', !/^\s*no\s*$/i.test(label), JSON.stringify(label));

    console.log('\n  STOPPING HERE. submit() is the irreversible step and this probe never calls it.');
    console.log('  The dialog is left open and abandoned; closing the browser discards it.\n');
  } catch (e) {
    console.log(`\n  THREW: ${String((e && e.message) || e).split('\n')[0]}\n`);
    results.push(false);
  } finally {
    await browser.close();
    const bad = results.filter((r) => !r).length;
    console.log(`${results.length - bad}/${results.length} passed\n`);
    process.exitCode = bad ? 1 : 0;
  }
})();
