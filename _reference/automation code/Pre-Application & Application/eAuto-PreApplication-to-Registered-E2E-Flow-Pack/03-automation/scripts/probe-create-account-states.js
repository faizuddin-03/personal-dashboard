/**
 * WHERE does "Create Account" appear? A sweep that carries its own positive control.
 *
 * probe-create-account.js read two fresh fixtures and found no control on either. That
 * is not reportable on its own: "not offered on these two" and "this reader cannot see
 * it anywhere" are indistinguishable from a pair of falses. So this samples Approved
 * records ACROSS every Hardcopy & Acc Created value and reports where the control turns
 * up. If it appears nowhere, the reader is the suspect; if it appears somewhere, that
 * row is the positive control and its state is the precondition TS37/TS40/TS01.8/
 * E2E_TS10 actually need.
 *
 * Reads only. Clicks nothing.
 */
const { chromium } = require('@playwright/test');
const { login } = require('../src/login');
const { ROLES } = require('../src/env');
const listing = require('../src/listing');
const application = require('../src/application');

const PER_STATE = Number(process.env.PER_STATE || 2);
const line = (s = '') => console.log(s);

(async () => {
  const browser = await chromium.launch({ headless: !process.argv.includes('--headed') });
  const page = await (await browser.newContext()).newPage();
  try {
    await login(page, ROLES.approver);
    const { records } = await listing.searchAll(page, { applicationStatus: 'Approved' });
    const byState = new Map();
    for (const r of records || []) {
      const k = (r.stage5Status || '(blank)').trim() || '(blank)';
      if (!byState.has(k)) byState.set(k, []);
      byState.get(k).push(String(r.applicationNumber || '').trim());
    }
    line('');
    line('  CREATE ACCOUNT — where does it appear?   ' + new Date().toISOString());
    line(`  Approved population ${(records || []).length}; Hardcopy values: ` +
         [...byState.entries()].map(([k, v]) => `${k}=${v.length}`).join('  '));
    line('');

    let anyFound = false;
    for (const [state, apps] of byState) {
      for (const appNo of apps.slice(0, PER_STATE)) {
        if (!appNo) continue;
        try {
          const uuid = await listing.openApplication(page, appNo);
          const hits = [];
          for (const [name, tab] of [['regDocs', application.TAB.regDocs], ['app', application.TAB.app]]) {
            await application.goto(page, uuid, tab).catch(() => {});
            const loc = page.locator('button, a, label').filter({ hasText: /create account/i }).first();
            if (await loc.count()) {
              const st = await loc.evaluate((el) => ({
                text: (el.textContent || '').trim().slice(0, 30),
                visible: !!(el.offsetParent || el.getClientRects().length),
                disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
              })).catch(() => null);
              if (st && st.visible) hits.push(`${name}:${st.disabled ? 'DISABLED' : 'ENABLED'}`);
            }
          }
          if (hits.length) anyFound = true;
          line(`  [${state}] ${appNo}  ${hits.length ? 'CREATE ACCOUNT ' + hits.join(',') : 'no control'}`);
        } catch (e) {
          line(`  [${state}] ${appNo}  ERROR ${e.message.slice(0, 90)}`);
        }
      }
    }
    line('');
    line(anyFound
      ? '  ok  the control was seen at least once — the reader works, and the states above are the answer.'
      : '  !!  NOT SEEN ANYWHERE. With no positive sighting this sweep cannot tell "the build does not\n' +
        '      offer it here" from "this locator never matches". Do not report it as absent.');
  } finally {
    await browser.close();
  }
})();
