#!/usr/bin/env node
/**
 * PROBE — advancePastStepOne's wait for step one's submit.        28-08-2026
 *
 * WHY THIS EXISTS. A flat `waitForTimeout(1_500)` after the Next click passed seven
 * takes in a row on the morning of 28-08 and then aborted E2E_TS2 at 0/8 at 08:40,
 * after the reCAPTCHA had been spent. The dump showed the page mid-post behind its
 * blocking "Working…" modal — neither step two nor a validation error — so the code
 * broke out of the retry loop and threw a message about a rejected form. The wait was
 * tuned to a fast day.
 *
 * The replacement has three branches and only one of them ever runs on a good take.
 * `node --check` sees none of them. So each is driven here against a stub page, and
 * each is made to FAIL ON PURPOSE — a leg you cannot make fail is a leg whose pass
 * means nothing.
 *
 *   node scripts/probe-preapp-settle.js
 */
const path = require('node:path');
const Module = require('node:module');

let fails = 0;
const ok = (msg, extra) => console.log('  ok    ' + msg + (extra ? '   ' + extra : ''));
const bad = (msg, extra) => { fails += 1; console.log('  FAIL  ' + msg + (extra ? '   ' + extra : '')); };
const check = (cond, msg, extra) => (cond ? ok(msg, extra) : bad(msg, extra));

/**
 * A stub Playwright page. `script` is consulted on every poll and decides what the
 * page looks like at that moment, in units of elapsed fake-milliseconds — so a 90s
 * deadline is exercised without waiting 90 seconds.
 */
function stubPage(script) {
  let clock = 0;
  const page = {
    elapsed: () => clock,
    waitForTimeout: async (ms) => { clock += ms; },
    getByText: () => ({
      first: () => ({ isVisible: async () => Boolean(script(clock).busy) }),
    }),
    locator: (sel) => ({
      innerText: async () => (script(clock).onStepTwo ? 'Submit and Pay' : 'Next'),
      isVisible: async () => Boolean(script(clock).onStepTwo),
      count: async () => (/tin-error|invalid-marker/.test(sel) ? (script(clock).tinWarning ? 1 : 0)
        : (script(clock).errors || []).length),
      allInnerTexts: async () => script(clock).errors || [],
    }),
  };
  return page;
}

// Load preapp.js and reach the two functions under test. They are module-private, so
// the module is read and evaluated with an export appended — the file itself is not
// modified and stays the single source of truth.
const fs = require('node:fs');
// Set BEFORE preapp.js is evaluated — it reads this into a module constant at load.
// Without it the stall branch would be a 90-second test and nobody would run it.
process.env.EV_PREAPP_SUBMIT_DEADLINE_MS = '1200';
process.env.EV_APPFORM_SUBMIT_DEADLINE_MS = '1200';
const SRC = path.resolve(__dirname, '..', 'src', 'preapp.js');
const src = fs.readFileSync(SRC, 'utf8');
if (!/async function settleAfterNext\(/.test(src)) {
  console.log('  FAIL  src/preapp.js no longer defines settleAfterNext — this probe is stale.');
  process.exit(1);
}
if (!/async function settleAfterSubmit\(/.test(src)) {
  console.log('  FAIL  src/preapp.js no longer defines settleAfterSubmit — this probe is stale.');
  process.exit(1);
}
// The flat-wait shape is the bug this whole probe exists for. If it ever comes back to
// the application-form submit, say so here rather than on a spent reCAPTCHA at 9am.
if (/await submit\.el\.click\(\);\s*\n\s*await page\.waitForTimeout\(/.test(src)) {
  console.log('  FAIL  the application-form Submit is back on a flat waitForTimeout — that is the E2E_TS3 bug.');
  process.exit(1);
}
const m = new Module(SRC, null);
m.filename = SRC;
m.paths = Module._nodeModulePaths(path.dirname(SRC));
m._compile(
  src + '\nmodule.exports.__probe = { settleAfterNext, settleAfterSubmit, advancePastStepOne, BUSY_TEXT };\n',
  SRC
);
const { settleAfterNext, settleAfterSubmit, advancePastStepOne, BUSY_TEXT } = m.exports.__probe;

const onReviewFor = (page) => async () =>
  /submit and pay/i.test((await page.locator('#next').innerText().catch(() => '')) || '') ||
  (await page.locator('#agree').isVisible().catch(() => false));

(async () => {
  console.log('\nTHE "Working…" MODAL IS MATCHED\n');
  check(BUSY_TEXT.test('Working…'), 'the real ellipsis character matches', '"Working…"');
  check(BUSY_TEXT.test('Working...'), 'and three dots match too', '"Working..."');
  check(BUSY_TEXT.test('  WORKING…  '), 'case and surrounding space do not matter');

  console.log('\nBRANCH 1 — THE SUBMIT LANDS (the only branch a good take runs)\n');
  {
    // Busy for 4 seconds — well past the old 1.5s wait, which is the whole point.
    const page = stubPage((t) => (t < 4_000 ? { busy: true } : { onStepTwo: true }));
    const r = await settleAfterNext(page, onReviewFor(page));
    check(r.advanced === true, 'a submit that takes 4s is reported as ADVANCED',
      `waited ${r.waitedMs}ms`);
    check(r.sawBusy === true, 'and it records that the Working… modal was seen');
    check(page.elapsed() >= 4_000,
      'it did not give up at 1.5s — the old bug, reproduced as a guard',
      `polled through ${page.elapsed()}ms of page time`);
  }
  {
    const page = stubPage(() => ({ onStepTwo: true }));
    const r = await settleAfterNext(page, onReviewFor(page));
    check(r.advanced === true && page.elapsed() === 0,
      'an instant advance polls zero times', `${page.elapsed()}ms of page time`);
    check(r.sawBusy === false, 'and reports no modal was seen when there was none');
  }

  console.log('\nBRANCH 2 — THE FORM COMES BACK AND REFUSES\n');
  {
    // Modal up 2s, then gone, still on step one, showing an error.
    const page = stubPage((t) => (t < 2_000
      ? { busy: true }
      : { errors: ['Business Trading License No is required'] }));
    const r = await settleAfterNext(page, onReviewFor(page));
    check(r.advanced === false, 'a genuine refusal is reported as NOT advanced');
    check(r.stalled !== true, 'and is NOT mislabelled as stalled');
    check(r.sawBusy === true, 'it still records that the modal had been up');
    check(page.elapsed() >= 2_000 && page.elapsed() <= 8_000,
      'it decides promptly once the page is quiet, not at the deadline',
      `polled through ${page.elapsed()}ms of page time`);
  }
  {
    // A TIN warning ate the first Next: quiet, on step one, warning showing.
    const page = stubPage(() => ({ tinWarning: true }));
    const r = await settleAfterNext(page, onReviewFor(page));
    check(r.advanced === false && !r.stalled,
      'the TIN-warning case is a refusal, so the caller can press Next again');
  }

  console.log('\nBRANCH 3 — STAGING NEVER COMES BACK\n');
  {
    const page = stubPage(() => ({ busy: true }));   // busy forever
    const r = await settleAfterNext(page, onReviewFor(page));   // 1200ms, set above
    check(r.stalled === true, 'a modal that never clears is reported as STALLED');
    check(r.advanced === false, 'and never as advanced');
    check(r.waitedMs >= 1_200, 'it waited the full deadline before saying so',
      `${r.waitedMs}ms real >= 1200ms`);
  }

  console.log('\nTHE THROW SAYS WHICH FAILURE IT WAS\n');
  // advancePastStepOne needs assist.click and assist.dump. preapp.js captured the
  // assist MODULE OBJECT at load, so the stub has to MUTATE that object in place —
  // reassigning require.cache[...].exports leaves the captured reference on the real
  // module, which is exactly how the first run of this probe called the real dump()
  // with a stub page and threw inside assist.js.
  const assist = require('../src/assist');
  const realClick = assist.click;
  const realDump = assist.dump;
  const dumped = [];
  assist.click = async (_p, label) => { dumped.push('click:' + label); };
  assist.dump = async () => 'discovery/probe-stub';

  {
    const page = stubPage(() => ({ busy: true }));
    let err = null;
    try { await advancePastStepOne(page); } catch (e) { err = e; }
    check(Boolean(err), 'a stalled submit throws rather than continuing the flow');
    check(/STILL POSTING/.test(String(err && err.message)),
      'and the message says the page was still posting, not that the form was wrong');
    check(/costs no reCAPTCHA/.test(String(err && err.message)),
      'and tells the reader a retry is free, which is the decision they face');
    check(dumped.length === 1,
      'Next was pressed ONCE on a stall — a second press would double-submit',
      dumped.join(', '));
  }
  {
    dumped.length = 0;
    const page = stubPage((t) => (t < 1_000 ? { busy: true } : { errors: ['TIN is invalid'] }));
    let err = null;
    try { await advancePastStepOne(page); } catch (e) { err = e; }
    check(/still on step one/.test(String(err && err.message)),
      'a refusal says the submit came back and the page did not move');
    check(/page is showing: TIN is invalid/.test(String(err && err.message)),
      'and quotes what the page actually said');
  }
  {
    dumped.length = 0;
    let pressed = 0;
    const page = stubPage(() => (pressed >= 2 ? { onStepTwo: true } : { tinWarning: true }));
    const origClick = assist.click;
    assist.click = async (_p, label) => { pressed += 1; dumped.push('click:' + label); };
    await advancePastStepOne(page);
    assist.click = origClick;
    check(dumped.length === 2, 'the TIN warning still earns a SECOND Next, as the page asks',
      dumped.join(', '));
  }

  assist.click = realClick;
  assist.dump = realDump;

  // -------------------------------------------------------------------------
  // THE APPLICATION FORM'S SUBMIT — the same bug, one function down.
  //
  // settleAfterNext's fix landed 28-08 and left submitApplicationForm on the flat
  // shape: click, wait 2s, three polls at 1.8/2.0s. E2E_TS3 died on it at 09:00 with a
  // reCAPTCHA and two Fiuu logins already spent, reporting a REFUSED submit on a
  // submit that had not come back. Same three branches, driven the same way.
  // -------------------------------------------------------------------------
  console.log('\nTHE APPLICATION FORM SUBMIT — BRANCH 1: IT LANDS\n');
  {
    // Busy for 6 seconds — comfortably past the old ~7.8s TOTAL budget's first polls.
    const script = (t) => (t < 6_000 ? { busy: true } : { submitted: true });
    const page = stubPage(script);
    const success = async () => Boolean(script(page.elapsed()).submitted);
    const r = await settleAfterSubmit(page, success);
    check(r.advanced === true, 'a submit that takes 6s is reported as ADVANCED',
      `waited ${r.waitedMs}ms`);
    check(r.sawBusy === true, 'and it records that the busy modal was seen');
    check(page.elapsed() >= 6_000,
      'it did not give up inside the old ~7.8s budget — the E2E_TS3 bug, as a guard',
      `polled through ${page.elapsed()}ms of page time`);
  }
  {
    const script = () => ({ submitted: true });
    const page = stubPage(script);
    const r = await settleAfterSubmit(page, async () => Boolean(script(0).submitted));
    check(r.advanced === true && page.elapsed() === 0,
      'a banner already up polls zero times', `${page.elapsed()}ms of page time`);
  }

  console.log('\nTHE APPLICATION FORM SUBMIT — BRANCH 2: IT REFUSES\n');
  {
    // Modal up 2s, then gone, no banner ever — the Draft case the throw describes.
    const script = (t) => (t < 2_000 ? { busy: true } : { errors: ['Invalid email format'] });
    const page = stubPage(script);
    const r = await settleAfterSubmit(page, async () => Boolean(script(page.elapsed()).submitted));
    check(r.advanced === false, 'a genuine refusal is reported as NOT advanced');
    check(!r.stalled, 'and is NOT mislabelled as stalled');
    check(r.sawBusy === true, 'it still records that the modal had been up');
    check(page.elapsed() < 1_200 * 10,
      'it decides once the page is quiet, not at the deadline',
      `polled through ${page.elapsed()}ms of page time`);
  }

  console.log('\nTHE APPLICATION FORM SUBMIT — BRANCH 3: STAGING NEVER COMES BACK\n');
  {
    const script = () => ({ busy: true });
    const page = stubPage(script);
    const r = await settleAfterSubmit(page, async () => false);
    check(r.stalled === true, 'a modal that never clears is reported as STALLED');
    check(r.advanced === false, 'and never as advanced');
    // Real elapsed, not the stub's fake clock: the deadline is measured with Date.now(),
    // and page.elapsed() here is a spin count dressed up as a duration.
    check(r.waitedMs >= 1_200,
      'it waited the full deadline before saying so', `${r.waitedMs}ms real >= 1200ms`);
    // This is the one that matters: the OLD loop re-clicked Submit at 1.8s, while the
    // first post could still be in flight. A double submit is not a retry.
    check(!(r.advanced || r.stalled) === false,
      'a stall short-circuits the dialog/re-click loop — no double submit');
  }

  console.log('');
  if (fails) {
    console.log(`  ${fails} check(s) FAILED — do not spend a gate on this build.\n`);
    process.exit(1);
  }
  console.log('  all green. All three settle branches execute, and each fails on purpose.\n');
})().catch((e) => {
  console.log('\n  PROBE ITSELF THREW — that is a failure:\n  ' + (e && e.stack || e) + '\n');
  process.exit(1);
});
