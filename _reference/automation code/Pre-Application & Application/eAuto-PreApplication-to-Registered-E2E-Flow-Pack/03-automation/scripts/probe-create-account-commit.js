/**
 * DRIVE CREATE ACCOUNT ALL THE WAY THROUGH — ON A RECORD WE CAN AFFORD TO LOSE.
 *
 *   node scripts/probe-create-account-commit.js NA68001142 --yes-i-mean-it
 *
 * WHY THIS EXISTS. The dry probe stops before submit(), because submit() is
 * irreversible. That left exactly one step untested, and on 30-08-2026 that step is
 * where the driver failed twice inside real takes: the Yes button is clicked, and the
 * record never becomes Registered.
 *
 *   "the form was submitted but the record never read Registered on the server:
 *    Hardcopy never became Registered within 60000ms (last read "Pending Assignee")"
 *
 * Verified afterwards: the record really was still Pending Assignee, so the commit
 * genuinely did not happen — this is not a slow read or a broken verifier.
 *
 * The step cannot be tested for free, but it CAN be tested cheaply, on a record whose
 * extension is already spent and which is therefore worthless for every row that needs
 * an unspent one. Registering such a record costs nothing we still need. That is what
 * this script is for, and it refuses to run without an explicit record and an explicit
 * flag, because "cheap on the right record" and "cheap" are different claims.
 *
 * IT REPORTS WHAT HAPPENED, not just whether it worked: the network calls the click
 * produced, anything the dialog said afterwards, and the record's state on the server.
 * The last attempt failed silently, which is the part worth fixing.
 */
const { chromium } = require('@playwright/test');
const { login } = require('../src/login');
const { ROLES } = require('../src/env');
const listing = require('../src/listing');
const app = require('../src/application');
const createAccount = require('../src/createAccount');
const companyAccount = require('../src/companyAccount');

const argv = process.argv.slice(2);
const APP_NO = (argv.find((a) => /^NA[0-9A-Z]+$/i.test(a)) || '').trim();
const MEANT = argv.includes('--yes-i-mean-it');

if (!APP_NO || !MEANT) {
  console.error('usage: node scripts/probe-create-account-commit.js <NA...> --yes-i-mean-it');
  console.error('');
  console.error('This COMMITS Create Account and cannot be undone. R9 then hides the Extend');
  console.error('control on that record for ever. Name a record whose extension is already');
  console.error('spent — it is worthless to every row that needs an unspent one, so');
  console.error('registering it costs nothing that is still needed.');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const calls = [];
  page.on('response', (r) => {
    const u = r.url();
    if (/account|register|create/i.test(u) && !/\.(js|css|png|jpg|svg|woff2?)$/i.test(u)) {
      calls.push(`${r.status()} ${r.request().method()} ${u.slice(0, 130)}`);
    }
  });

  try {
    console.log(`\nCREATE ACCOUNT — FULL COMMIT on ${APP_NO}, as ${ROLES.approver}\n`);
    await login(page, ROLES.approver);
    const uuid = await listing.openApplication(page, APP_NO);
    if (!uuid) throw new Error(`${APP_NO} did not open`);
    await app.goto(page, uuid, app.TAB.regDocs).catch(() => {});
    await page.waitForTimeout(1200);

    const side = await app.readSidebar(page).catch(() => ({}));
    console.log(`  BEFORE  hardcopy=${JSON.stringify(side.hardcopyDoc)} status=${JSON.stringify(side.applicationStatus)}`);
    if (/registered/i.test(String(side.hardcopyDoc || ''))) {
      console.log('  It is ALREADY Registered — nothing to prove here.');
      return;
    }

    if (!(await createAccount.available(page))) throw new Error('the Create Account button is not available');
    const opened = await createAccount.open(page);
    console.log(`  dialog  kind=${opened.kind}`);
    const text = (await opened.root.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    console.log(`  says    ${JSON.stringify(text.slice(0, 160))}`);

    const btn = createAccount.submitButton(opened.root);
    console.log(`  commit  ${JSON.stringify((await btn.innerText().catch(() => '')).trim())}`);

    const res = await createAccount.submit(opened.root, page);
    console.log(`  CLICKED ${JSON.stringify(res && res.clicked)}`);

    // STEP 2 — Yes NAVIGATES to the Create New Company Account form. This is the half
    // the driver did not know about: it clicked Yes and then polled for Registered,
    // which is a state reached by SAVING this form, not by dismissing the dialog.
    await page.waitForURL(/company-obs\/new\.do/i, { timeout: 30_000 }).catch(() => {});
    console.log(`  navigated to: ${page.url()}`);
    if (!companyAccount.onForm(page)) {
      throw new Error('Yes did not lead to the company-account form — nothing was created, the record is '
        + 'untouched, and the driver has no second step to run.');
    }

    const touched = await companyAccount.fillCompanyForm(page, { appNo: APP_NO });
    console.log(`  filled: ${JSON.stringify(touched)}`);
    const saved = await companyAccount.saveCompanyForm(page);
    console.log(`  saved:  ${JSON.stringify(saved)}`);

    const alerts = await page.locator('.alert, .toast, .swal2-popup, [class*="error"]').allInnerTexts().catch(() => []);
    const shown = alerts.map((a) => a.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 4);
    console.log(`  messages on screen: ${JSON.stringify(shown)}`);
    console.log(`  network: ${calls.length ? JSON.stringify(calls.slice(0, 6), null, 1) : '(no account/register call seen)'}`);

    // The server is the authority, not the dialog.
    let landed = null;
    for (let i = 0; i < 15; i += 1) {
      await page.waitForTimeout(4000);
      const fresh = await listing.search(page, {}).catch(() => null);
      const row = fresh ? fresh.rows.find((r) => r.applicationNo === APP_NO) : null;
      const hc = String((row && (row.hardcopyAccCreated || row.hardcopyDoc || row.stage5Status)) || '');
      if (/registered/i.test(hc)) { landed = hc; break; }
      if (i === 0 || i === 7 || i === 14) console.log(`  poll ${i}: hardcopy = ${JSON.stringify(hc || '(not read)')}`);
    }
    console.log(landed
      ? `\n  REGISTERED — the flow works end to end (hardcopy now ${JSON.stringify(landed)}).\n`
      : '\n  NOT REGISTERED after 60s of polling. The click landed on the right control and the '
        + 'record did not move — read the network and message lines above before changing the driver.\n');
    process.exitCode = landed ? 0 : 1;
  } catch (e) {
    console.log(`\n  THREW: ${String((e && e.message) || e).split('\n')[0]}\n`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
