/**
 * Does the stored password actually WORK on this instance?
 *
 *   npm run check:login                 # every account in the store
 *   npm run check:login hubadmin_bochar # just one
 *
 * Prints `key · login-id · OK|FAIL`. Never prints a password.
 *
 * Worth running before any sweep: a stale credential is indistinguishable from
 * a permission defect once a suite is going, and an unauthenticated API replay
 * gets refused — which reads as "the unauthorised role was correctly blocked"
 * and manufactures a green tick on a security case.
 */
const { chromium } = require('@playwright/test');
const { discoverAccounts } = require('../src/accounts');
const { login } = require('../src/login');
const { INSTANCE } = require('../src/env');

(async () => {
  const wanted = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const all = discoverAccounts();
  const keys = wanted.length ? wanted.map((k) => k.toLowerCase()) : Object.keys(all);

  if (!Object.keys(all).length) {
    console.error('\n  No accounts found. Is C:\\Users\\<you>\\.claude\\secrets\\eauto.env present?\n');
    process.exit(1);
  }

  console.log(`\n  Checking ${keys.length} account(s) against ${INSTANCE}\n`);
  const browser = await chromium.launch();
  let failures = 0;

  for (const key of keys) {
    const a = all[key];
    if (!a) { console.log(`  ${key.padEnd(20)} ${'—'.padEnd(18)} UNKNOWN KEY`); failures++; continue; }
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await login(page, key);
      console.log(`  ${a.key.padEnd(20)} ${a.user.padEnd(18)} OK`);
    } catch (err) {
      console.log(`  ${a.key.padEnd(20)} ${a.user.padEnd(18)} FAIL  (${err.message.split('\n')[0].slice(0, 80)})`);
      failures++;
    } finally {
      await ctx.close();
    }
  }

  await browser.close();
  console.log(`\n  ${keys.length - failures}/${keys.length} usable\n`);
  process.exitCode = failures ? 1 : 0;
})();
