/**
 * Put an application's expiry date wherever a test needs it.
 *
 * This is the QA side of the support tool at
 * http://172.30.202.23:8888/eauto-support/obs/reset-expiry — type an application
 * trx no and a date, and the record's expiry becomes that date. It is the answer
 * to Q12, which is what filed TS08.4/.5, TS09 and TS22 as BLOCKED ("nothing on
 * the QA side can patch an expiry date").
 *
 *   # a date, straight
 *   npm run set-expiry -- --app-no NA68001099 --date 2026-05-26
 *
 *   # or the BOUNDARY you want, and let src/dates.js work out the date
 *   npm run set-expiry -- --app-no NA68001099 --state opens-tomorrow
 *   npm run set-expiry -- --app-no NA68001099 --state closing-day
 *
 * THERE IS NO --time, and the tool has no time field. It writes the DATE you give
 * and carries the time of day over from the record's existing expiry (measured:
 * 21:10:17.357665 survived a move and a restore). So for the sub-day half of TS08,
 * and for Q39's timestamp reading, you choose the FIXTURE — whose time of day you
 * are stuck with — not the clock.
 *
 *   npm run set-expiry -- --list-states      # what every target resolves to today
 *   npm run set-expiry -- --app-no X --state closing-day --dry-run
 *
 * NAME THE BOUNDARY, NOT THE DATE. The window's two ends count in different
 * units — 30 days before expiry, 3 CALENDAR MONTHS after it — and the far end
 * clamps at month ends, so "today minus 90 days" is the wrong closing day by up
 * to two days. --state runs the inverse of the same windowState() the assertions
 * use, so the fixture and the test cannot disagree.
 *
 * WHAT THIS SCRIPT INSISTS ON
 *
 *   - The VPN, first, by TCP. Off VPN this host does not exist, and every other
 *     diagnosis of that is a lie about the feature (see src/vpn.js).
 *   - Reading the expiry BEFORE and AFTER, off the UCD Application Listing. The
 *     support tool's own banner is a claim about its request; the listing is the
 *     only surface that shows what the record now says (C2).
 *   - A typed confirmation, unless --yes. This mutates a record on shared staging
 *     that other people's runs may be using.
 *   - An audit line per patch, appended to discovery/96-expiry-patches.jsonl, so
 *     "who moved this fixture's expiry" has an answer.
 */
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { login } = require('../src/login');
const { ROLES } = require('../src/env');
const support = require('../src/support');
const vpn = require('../src/vpn');
const dates = require('../src/dates');

const LOG = path.join(__dirname, '..', 'discovery', '96-expiry-patches.jsonl');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const arg = (f, dflt = '') => {
  const i = argv.indexOf(f);
  return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : dflt;
};

function usage() {
  console.log(`
Set an application's expiry date through the eAuto support tool.

  --app-no <NA…>     the application trx no. Required.
  --date <yyyy-mm-dd>  the expiry date to set, OR
  --state <target>     a named boundary; the date is derived. One of:
                       ${Object.keys(dates.EXPIRY_TARGETS).join(', ')}
  --list-states      print what each target resolves to today, and stop
  --dry-run          fill the form, never submit
  --no-verify        skip the BackOffice read-back (loses the only real proof)
  --allow-same       re-write the date the record already has (proves the write
                     path without changing any data)
  --yes              do not ask for confirmation (for unattended runs)
  --headed           watch it happen
`.trim());
}

function printStates() {
  const now = dates.today();
  console.log('Expiry targets as of ' + dates.ymd(now) + ' (today):\n');
  for (const r of dates.reachableTargets(now)) {
    if (!r.ymd) { console.log('  ' + r.target.padEnd(20) + 'UNREACHABLE TODAY — ' + r.error.split('.')[0]); continue; }
    const w = dates.windowState(r.ymd, now);
    console.log('  ' + r.target.padEnd(20) + r.ymd +
      '   (window ' + dates.ymd(w.opensOn) + ' … ' + dates.ymd(w.closesOn) + ', state: ' + w.state + ')' +
      (r.exact === false ? '  [nearest fit]' : ''));
  }
  console.log('\nThe far end is 3 CALENDAR MONTHS, clamped at month ends — not 90 days.');
}

/** A yes/no the operator has to type. EOF (a piped stdin) counts as no. */
function confirm(question) {
  if (!process.stdin.isTTY) return Promise.resolve(false);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(/^y(es)?$/i.test(a.trim())); }));
}

(async () => {
  if (has('--help') || has('-h')) return usage();
  if (has('--list-states')) return printStates();

  const applicationNo = arg('--app-no') || arg('--trx-no');
  const rawDate = arg('--date');
  const state = arg('--state');

  if (!applicationNo) {
    usage();
    // Deliberately not defaulted from APP_NO/EXTEND_APP_NO: this command MUTATES
    // a record, and a mutating command that guesses its target from the
    // environment will one day move the wrong fixture's expiry.
    throw new Error('--app-no is required (this command changes a record, so it will not guess which one)');
  }
  if (!rawDate && !state) throw new Error('give either --date <yyyy-mm-dd> or --state <target> (see --list-states)');
  if (rawDate && state) throw new Error('--date and --state both set; pick one');

  const now = dates.today();
  let wanted;
  let plan = null;
  if (rawDate) {
    wanted = dates.parseListingDate(rawDate);
    if (!wanted) throw new Error('--date must be yyyy-mm-dd, got "' + rawDate + '"');
  } else {
    plan = dates.expiryForState(state, now);
    wanted = plan.expiry;
  }
  const wantedYmd = dates.ymd(wanted);
  const resulting = dates.windowState(wantedYmd, now);

  // 1. VPN first — milliseconds, and it removes every other explanation.
  const { url, host, port } = support.target();
  const reach = await vpn.probe(host, port, 5000);
  if (!reach.ok) { console.error('\n' + vpn.offVpnError(host, port, reach).message); process.exit(2); }

  console.log('Support tool : ' + url + '  (reachable, ' + reach.ms + ' ms)');
  console.log('Portal login : ' + (support.haveCredentials()
    ? 'SUPPORT_USER configured' + (support.savedAuth() ? ', session cached in .auth/support.json' : ', will sign in')
    : 'NOT CONFIGURED — the tool is behind /eauto-support/login and will refuse'));
  console.log('Application  : ' + applicationNo);
  console.log('New expiry   : ' + wantedYmd +
    (plan ? '   <- --state ' + plan.target + (plan.exact ? '' : ' (nearest fit)') : ''));
  console.log('Puts it      : ' + resulting.state + '   (button window ' + dates.ymd(resulting.opensOn) +
    ' … ' + dates.ymd(resulting.closesOn) + ')');

  const browser = await chromium.launch({ headless: !has('--headed') });
  const record = {
    at: new Date().toISOString(), applicationNo, wanted: wantedYmd,
    state: state || null, resultingState: resulting.state, dryRun: has('--dry-run'),
  };

  try {
    // 2. What does the record say NOW? Read it off the listing, which is the only
    //    surface that shows expiry at all.
    let boPage = null;
    if (!has('--no-verify')) {
      boPage = await browser.newPage();
      await login(boPage, ROLES.assignee);
      const before = await support.verify(boPage, applicationNo);
      record.before = { raw: before.raw, date: before.date, time: before.time };
      const wasIn = dates.windowState(before.raw, now);
      console.log('Currently    : ' + (before.raw || '(no expiry on the row)') +
        '   (state: ' + wasIn.state + ')');
      if (before.date === wantedYmd && !has('--allow-same')) {
        console.log('\nAlready on that date — nothing to change. (--allow-same re-writes it anyway,');
        console.log('which is how the write path gets proved without changing any data.)');
        return;
      }
    }

    // 3. Confirm. This is shared staging: someone else's run may be mid-flight on
    //    this very record.
    if (!has('--yes') && !has('--dry-run')) {
      const ok = await confirm('\nChange ' + applicationNo + "'s expiry to " + wantedYmd + '? [y/N] ');
      if (!ok) { console.log('Nothing submitted.'); return; }
    }

    // 4. Do it. A separate CONTEXT: the support tool is a different application
    //    with its own login, and it shares no session with the BackOffice one.
    //    support.context() reuses .auth/support.json when it is there, so the
    //    portal's "remember me for 7 days" cookie means one sign-in a week.
    const toolCtx = await support.context(browser);
    const toolPage = await toolCtx.newPage();
    const result = await support.setExpiry(toolPage, {
      applicationNo, date: wanted,
      dryRun: has('--dry-run'),
    });
    record.filled = result.filled;
    record.outcome = result.outcome || null;
    record.toolSaid = result.message;

    // The tool's own step-2 view of the record — status, and the expiry to the
    // microsecond, which is finer than the listing renders it.
    if (result.found) {
      record.tool = {
        status: result.found.status, currentExpiry: result.found.currentExpiry,
        createdAt: result.found.createdAt, company: result.found.companyName,
      };
      console.log('\nTool sees    : ' + result.found.applicationNo + '  ' + result.found.companyName);
      console.log('               status ' + result.found.status + ', created ' + result.found.createdAt);
      console.log('               expiry now ' + result.found.currentExpiry);
    }
    console.log('\nField        : ' + result.filled.dateField + ' <- "' + result.filled.typedAs + '" (' +
      result.filled.format + ', by ' + result.filled.via + ')');
    // Pre-commit statement of intent, straight from the tool: the exact timestamp
    // it will write. The time of day is carried over from the current expiry —
    // which is what makes the Q39 timestamp reading testable at all.
    if (result.filled.resultingExpiryPreview) {
      record.preview = result.filled.resultingExpiryPreview;
      console.log('Will write   : ' + result.filled.resultingExpiryPreview +
        '   (time of day preserved from the current expiry)');
    }
    if (result.dryRun) { console.log('\nDRY RUN — stopped at step 2. Nothing confirmed, nothing changed.'); return; }
    console.log('Tool said    : [' + result.outcome + '] ' + result.message.slice(0, 300));

    // A tool that says "not found" must not leave this command exiting 0 — the
    // caller is usually a script setting up a fixture, and a silent failure there
    // is a test run against a record in the wrong state.
    if (result.outcome === 'failure') process.exitCode = 1;

    // 5. The only proof: read it back off the listing.
    if (boPage) {
      const after = await support.verify(boPage, applicationNo, wantedYmd);
      record.after = { raw: after.raw, date: after.date, time: after.time, matches: after.matches };
      console.log('\nListing now  : ' + (after.raw || '(no expiry on the row)'));
      if (after.matches) {
        console.log('VERIFIED     : expiry is ' + after.date +
          (after.time ? ' at ' + after.time + '  <- the time of day the patch produced (Q39 evidence)' : ''));
      } else {
        console.log('NOT VERIFIED : wanted ' + wantedYmd + ', listing shows ' + (after.date || '(nothing)') + '.');
        console.log('               The tool reported "' + result.outcome + '". Trust the listing, not the banner.');
        process.exitCode = 1;
      }
    } else {
      console.log('\n--no-verify: nothing read the record back, so nothing here proves it changed' +
        (result.outcome === 'success' ? ' — the tool\'s banner is a claim about its own request.' : '.'));
    }
  } finally {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, JSON.stringify(record) + '\n');
    await browser.close();
  }
})().catch((e) => {
  console.error('\n' + (e && e.message ? e.message : e));
  process.exit(1);
});
