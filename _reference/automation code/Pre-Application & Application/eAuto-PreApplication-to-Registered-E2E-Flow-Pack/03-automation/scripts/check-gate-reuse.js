/**
 * Does one reCAPTCHA tick buy one fixture, or a day of them?
 *
 *   npm run check:gate
 *
 * This is the single most valuable unknown in the whole harness. If the saved
 * session reaches the Pre-Application Form directly, fixture building costs one
 * tick per session and the rest is unattended — 12 minutes a DAY instead of 12
 * minutes a FIXTURE. If it does not, every fixture needs a human at the keyboard
 * and that belongs in the estimate, and in the ask for reCAPTCHA test keys.
 *
 * The builder's own gate check is not a fair test of this: it navigates to
 * /obs/preOnb/recaptcha, and that URL may render the widget unconditionally.
 * The honest question is whether /obs/preOnb/form serves the form or bounces,
 * so that is what this asks — with a fresh context, restored cookies, and no
 * human in the loop.
 *
 * Costs nothing and creates nothing: it fills in no field and submits no form.
 */
const { chromium } = require('@playwright/test');
const preapp = require('../src/preapp');
const assist = require('../src/assist');
const { OBS } = require('../src/env');

const headed = process.argv.includes('--headed');

(async () => {
  const state = preapp.gateStatePath();
  if (!state) {
    console.error('\n  No saved gate session. Run the fixture builder once and pass the reCAPTCHA first.\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: !headed });
  const ctx = await browser.newContext({ storageState: state, viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  try {
    console.log('\n  restored ' + state);

    // 1. Straight at the form — the question that matters.
    await page.goto(OBS.preApplicationForm.replace('/recaptcha', '/form'), { waitUntil: 'domcontentloaded' });
    const direct = { url: page.url(), form: await page.locator('#businessName').count() > 0, gate: await preapp.onGate(page) };
    console.log('\n  /obs/preOnb/form');
    console.log('    landed on   ' + direct.url);
    console.log('    form?       ' + (direct.form ? 'YES — #businessName is there' : 'no'));
    console.log('    widget?     ' + (direct.gate ? 'yes — bounced to the gate' : 'no'));
    await assist.dump(page, 'gate-reuse-direct-form');

    // 2. And the way the builder asks, for comparison.
    await page.goto(OBS.preApplicationForm, { waitUntil: 'domcontentloaded' });
    const viaGate = { url: page.url(), form: await page.locator('#businessName').count() > 0, gate: await preapp.onGate(page) };
    console.log('\n  /obs/preOnb/recaptcha');
    console.log('    landed on   ' + viaGate.url);
    console.log('    form?       ' + (viaGate.form ? 'YES — walked straight through' : 'no'));
    console.log('    widget?     ' + (viaGate.gate ? 'yes — asks again' : 'no'));

    const verdict = direct.form
      ? 'REUSABLE — the saved session reaches the form directly. Fixture builds after\n' +
        '  the first are unattended up to the FPX screens. If the builder still pauses,\n' +
        '  point passGate at /obs/preOnb/form instead of /obs/preOnb/recaptcha.'
      : 'NOT REUSABLE — the gate is enforced per build, so every fixture needs a human\n' +
        '  at the keyboard for the tick. This is the number that belongs in the estimate,\n' +
        '  and the argument for asking that staging use reCAPTCHA test keys.';
    console.log('\n  ' + verdict + '\n');
  } catch (err) {
    console.error('\n  probe failed: ' + err.message + '\n');
    await assist.dump(page, 'gate-reuse-error').catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
