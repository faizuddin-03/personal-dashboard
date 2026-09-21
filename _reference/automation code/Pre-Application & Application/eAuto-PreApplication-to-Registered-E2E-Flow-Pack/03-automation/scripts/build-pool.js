/**
 * The fixture POOL — census first, build only the shortfall.
 *
 * WHY A POOL AT ALL
 *
 * Every positive Extend case spends its application's one and only extension
 * (R1), so each destructive test needs its own fresh application. src/pool.js
 * hands them out one at a time from EXTEND_APP_POOL and records the claim; this
 * script is what FILLS that variable.
 *
 * WHY CENSUS BEFORE BUILD, AND WHY THAT IS NOT AN OPTIMISATION
 *
 * A fixture build creates a real dealer, a real application and a real payment
 * on SHARED staging. Building twenty of them when staging already holds eight
 * usable ones is not merely slow — it is eight avoidable records in a database
 * other people are testing against. So the default is: count what exists, and
 * build only the difference.
 *
 * WHAT COUNTS AS A POOL FIXTURE
 *
 * Approved, never extended, Hardcopy & Acc Created not Registered, with a
 * registration-documents page for the button to live on, and an expiry far
 * enough out that the record does not age out mid-run. The first four are the
 * eligibility rules (R9/R11/REQ-001a); the last is practical.
 *
 * "Never extended" is the expensive one to establish and the one that matters
 * most: an already-extended record produces a misleading "already extended"
 * failure rather than a clean skip, and it looks exactly like a build defect.
 * The listing cannot answer it, so each candidate's sidebar is read.
 *
 *   node scripts/build-pool.js --status          # census only, writes nothing
 *   node scripts/build-pool.js --want 8          # census, then build the shortfall
 *   node scripts/build-pool.js --want 8 --dry-run
 *   node scripts/build-pool.js --write-env       # update automation/.env
 *
 * Building is DELEGATED to scripts/build-fixture.js, unchanged — this script
 * never reimplements the flow, it just runs it in a loop and collects the
 * application numbers.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('@playwright/test');
const { login } = require('../src/login');
const { ROLES } = require('../src/env');
const listing = require('../src/listing');
const app = require('../src/application');
const pool = require('../src/pool');
const dates = require('../src/dates');

const argv = process.argv.slice(2);
const flag = (n) => argv.includes('--' + n);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };

const WANT = Number(opt('want', 0));
const STATUS_ONLY = flag('status') || WANT === 0;
const DRY = flag('dry-run');
const WRITE_ENV = flag('write-env');
/** How many candidates to open. Each one costs a page load. */
const MAX_PROBE = Number(opt('max-probe', 25));
const ENV_FILE = path.resolve(__dirname, '..', '.env');
const OUT = path.resolve(__dirname, '..', 'discovery', '98-pool-census.json');

/** Fixtures other cases depend on. Never hand these to a destructive test. */
const RESERVED = {
  NA68001099: 'the already-extended / greyed control (TS03, TS07, TS35)',
  NA68001100: 'the R19 stub (TS51)',
  NA62000987: 'the closing-day probe subject (TS49)',
};

/**
 * OWNERSHIP — the guard that stops this pool eating someone else's fixture.
 *
 * The 26-08-2026 census found five eligible records on staging and only two of
 * them were ours. The other three were "FAIZUDDIN 11978 06" (a different
 * ticket), "TEST APPLICATION DIRECTOR" and "115366TS08" — all perfectly eligible
 * and all, presumably, somebody's fixture.
 *
 * This matters more here than in most harnesses because of R1. Handing another
 * tester's application to a destructive test spends its ONE extension, and
 * nothing can give it back: they come back to a record that is greyed out with a
 * remark they did not write, and the cheapest explanation available to them is
 * "the build is broken". An eligible record is not an unclaimed one.
 *
 * So: only records the rig itself created are auto-enrolled. Everything else is
 * listed as BORROWABLE and left alone unless someone passes --include-foreign,
 * which is deliberately awkward to type.
 *
 * The marker is the company name. Every transaction the rig creates carries
 * CHARMAIN and the ticket tag (src/fixture.js: "CHARMAIN QA11982 <stamp>-<seq>
 * <SUFFIX>"); NA68001101 predates the CHARMAIN half and carries only QA11982,
 * which is why both spellings are accepted.
 */
const OURS = /\bCHARMAIN\b|\bQA11982\b/i;
const INCLUDE_FOREIGN = flag('include-foreign');

const line = (s = '') => console.log(s);

/**
 * Never destroy a previous census by running a new one.
 *
 * OUT is a FIXED filename, so every run silently replaces the last one. That
 * cost a real capture on 27-08-2026: this script was run twice in an hour (once
 * as `--status`, once as a modified copy testing the shortlist filter) and the
 * 26-08 census — the dump that recorded what the OLD stage-5 filter shortlisted
 * — went with it. The content survived only because it had been echoed to a
 * console someone still had.
 *
 * A census is evidence: it is the record of what staging held at a moment, and
 * a moment does not come back. So the previous file is moved aside, stamped
 * with its own recorded `at` (not now — the time it describes), before the new
 * one lands. Cheap, and it makes the destructive case impossible rather than
 * merely unlikely.
 *
 * Fourteen other scripts in this directory write to fixed names the same way.
 */
function archiveBeforeWrite(target) {
  if (!fs.existsSync(target)) return null;
  let stamp;
  try {
    stamp = String(JSON.parse(fs.readFileSync(target, 'utf8')).at || '');
  } catch { /* unreadable or not ours — archive it anyway, stamped by mtime */ }
  if (!stamp) stamp = fs.statSync(target).mtime.toISOString();
  const slug = stamp.replace(/[:.]/g, '-').replace(/Z$/, '');
  const dir = path.join(path.dirname(target), 'archive');
  const dest = path.join(dir, `${path.basename(target, '.json')}-${slug}.json`);
  if (fs.existsSync(dest)) return dest;          // already archived; do not churn
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(target, dest);
  line(`  archived previous census -> ${path.relative(process.cwd(), dest)}`);
  return dest;
}

/**
 * Is this candidate genuinely never-extended and genuinely able to host the
 * button? Only the detail page can say, so this costs one page open each.
 */
async function inspect(page, appNo) {
  const out = { applicationNo: appNo };
  try {
    const uuid = await listing.openApplication(page, appNo);
    out.uuid = uuid;
    const landed = await app.goto(page, uuid, app.TAB.regDocs);
    out.view = landed.view;
    out.route = landed.fellBack ? 'app (regdocs 404)' : 'regDocs';
    if (landed.view !== 'backoffice') {
      out.usable = false;
      out.why = 'R19 stub — plain dealer form, no sidebar, can never host Extend';
      return out;
    }
    const side = await app.readSidebar(page);
    const state = await app.extendState(page);
    out.hardcopy = side.hardcopyDoc;
    out.status = side.applicationStatus;
    out.present = state.present;
    out.enabled = state.enabled;
    out.everExtended = /Application Extended Remarks/i.test(side.raw || '') || /already been extended/i.test(state.message || '');

    if (out.everExtended) { out.usable = false; out.why = 'already extended — its one extension is spent (R1)'; return out; }
    if (/registered/i.test(out.hardcopy || '')) { out.usable = false; out.why = 'Hardcopy & Acc Created = Registered — R9 removes the button'; return out; }
    if (landed.fellBack) { out.usable = false; out.why = 'no registration-documents page — nowhere for the button to render (REQ-001a)'; return out; }
    if (!state.enabled) { out.usable = false; out.why = 'the button is not enabled — ' + (state.inDom ? 'rendered but greyed' : 'absent from the markup'); return out; }

    out.usable = true;
    return out;
  } catch (e) {
    out.usable = false;
    out.why = String(e.message || e).split('\n')[0].slice(0, 160);
    return out;
  }
}

async function census() {
  const browser = await chromium.launch({ headless: !flag('headed') });
  const page = await browser.newPage();
  const result = { at: new Date().toISOString(), candidates: [], usable: [], rejected: [] };
  try {
    await login(page, ROLES.assignee);
    const { total, records } = await listing.searchAll(page, { applicationStatus: 'Approved' });
    result.approvedTotal = total;

    const now = new Date();
    const shortlist = (records || [])
      .map((r) => {
        const expiry = dates.parseListingDate(r.expiredAt);
        return {
          applicationNo: String(r.applicationNumber || '').trim(),
          companyName: r.companyName || '',
          expiry: r.expiredAt || '',
          daysToExpiry: expiry ? dates.daysBetween(now, expiry) : null,
          stage5: r.stage5Status || '',
        };
      })
      // R9 is the only eligibility rule the LISTING can actually answer:
      // Registered removes the button, and that cell is trustworthy. Hardcopy
      // "-" is not — NA68001097 reads "-" and still serves a registration-
      // documents page with a live enabled Extend control (TS50, 27-08-2026).
      //
      // Pre-filtering on "-" cost real fixtures: the shortlist read 5 where it
      // should have read 12, so the census under-reported what staging already
      // holds and would have sent someone to hand-build records that existed.
      // Every fixture build burns a human reCAPTCHA tick, so this filter being
      // too tight is expensive in the one currency the rig cannot mint.
      //
      // inspect() below is the authority and always was — it opens the page and
      // reads fellBack, everExtended, hardcopy and enabled for itself.
      // CORRECTED 28-08-2026, and it is the SECOND instance of the fault the comment
      // block above apologises for — a shortlist filter too tight, in the one
      // currency the rig cannot mint.
      //
      // The clause was `r.daysToExpiry > 7`, i.e. "the expiry must be more than a
      // week in the FUTURE", commented "do not age out mid-run". But the extend
      // window does not end at the expiry — it runs from expiry - 30 days to expiry
      // + 3 CALENDAR MONTHS. A record whose expiry passed last week is squarely
      // inside it and extends perfectly well; R4 simply makes the new date click +
      // 30 instead of expiry + 30.
      //
      // MEASURED COST, same afternoon: `--status` reported ONE usable fixture and
      // printed a "1 unspent usable fixture" summary, while
      // scripts/find-unfilmed-fixtures.js — which places records by windowState()
      // instead — opened 22 of the same population and found FIVE more that were
      // never extended, not Registered, and whose Extend control it read as OFFERED
      // (NA68001118, NA68001116, NA68001112, NA68001110, NA68001106). They were
      // excluded before inspect() ever opened them, so nothing in the census said
      // "not looked at" rather than "not usable" — the two are indistinguishable in
      // a count, which is exactly what the observed-false rule is about. A census
      // reading 1 against a real 6 sends someone to hand-build five records that
      // already exist, at a human reCAPTCHA tick each.
      //
      // So the predicate is now the window itself, via the same windowState() the
      // assertions and the recorder use. The age-out guard it replaces is kept and
      // pointed at the bound that can actually bite: the FAR one. A record needs to
      // still be inside the window when the take clicks, and 'closing-day' is
      // excluded outright because on that day eligibility depends on the expiry's
      // own time of day (Q39) — a pool record must be unambiguously spendable, and
      // the closing day is TS08.4's and TS49's subject, not general supply.
      .filter((r) => {
        if (!r.applicationNo || RESERVED[r.applicationNo]) return false;
        if (/registered/i.test(r.stage5 || '')) return false;      // R9 removes the button
        const w = dates.windowState(r.expiry);
        if (!w || w.state !== 'in-window') return false;           // not spendable today
        // Far-bound runway: the window must not shut while the batch is running.
        return w.closesOn ? dates.daysBetween(now, w.closesOn) >= 2 : false;
      })
      .sort((a, b) => b.daysToExpiry - a.daysToExpiry);

    result.shortlisted = shortlist.length;
    line(`  Approved population: ${total}; ${shortlist.length} shortlisted (INSIDE the extend window — ` +
         `expiry-30d .. expiry+3 months, closing day excluded — not Registered, not reserved)`);
    line('');

    result.borrowable = [];
    for (const c of shortlist.slice(0, MAX_PROBE)) {
      const r = await inspect(page, c.applicationNo);
      const row = { ...c, ...r, ours: OURS.test(c.companyName) };
      result.candidates.push(row);

      if (!row.usable) {
        result.rejected.push({ applicationNo: row.applicationNo, why: row.why });
        line(`  no          ${row.applicationNo}  ${row.why}`);
      } else if (row.ours || INCLUDE_FOREIGN) {
        result.usable.push(row.applicationNo);
        line(`  USABLE      ${row.applicationNo}  expires ${row.expiry} (${row.daysToExpiry}d)  ${row.companyName.slice(0, 42)}`);
      } else {
        result.borrowable.push({ applicationNo: row.applicationNo, companyName: row.companyName, expiry: row.expiry });
        line(`  not ours    ${row.applicationNo}  ${row.companyName.slice(0, 42)}  <- eligible, but somebody else's`);
      }
    }

    if (result.borrowable.length) {
      line('');
      line(`  ${result.borrowable.length} eligible record(s) were LEFT ALONE because the rig did not create them.`);
      line('  Spending one costs its owner their only extension (R1) and cannot be undone. If you know they are');
      line('  free, re-run with --include-foreign; otherwise ask first.');
    }
  } finally {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    archiveBeforeWrite(OUT);
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    await browser.close();
  }
  return result;
}

/**
 * THE ROUTE IS NOT A CHOICE AT ALL — it is the pre-application flow.
 *
 * Charmain, 27-08-2026: *"make sure all transaction created from preapplication,
 * i dont want the manual application way to create the trx, we didnt cover that
 * part in this ticket."* So there is no `--route` flag here any more, and
 * build-fixture.js refuses anything else by name (vault R22).
 *
 * The measurement below predates the ruling and agrees with it, which is why it
 * is kept: the route the ruling closes was never usable anyway.
 *
 * `--route backoffice` was the one that would have made this script unattended: no
 * reCAPTCHA, no RM 108 pre-application fee, one payment instead of two. It does
 * not work end to end. A build on 26-08 at 20:59 got as far as `approve-app` on
 * NA68001102 and stopped: the assignee's edit page carries no "Submit for
 * Approval" button, so the record never leaves Pending, and the approver then
 * has no Approve button to click.
 *
 * The tempting fix — set the Application Status dropdown to Approved and save —
 * is WRONG and has already been tried. It produced NA68001100: Approved on the
 * listing, every workflow column "-", NO EXPIRY DATE AT ALL, and the dealer's
 * step 4 still server-side read-only. That record is now the R19 stub TS51 is
 * written about. The dropdown sets the FIELD; the button runs the WORKFLOW.
 *
 * So the pool is built on the pre-application route, which is proven
 * (fx-260826-1408-024 -> NA68001101, all eleven phases). Its cost is the
 * reCAPTCHA, and that cost is
 * PER FIXTURE: `npm run check:gate` reports the saved session NOT REUSABLE —
 * "the gate is enforced per build, so every fixture needs a human at the
 * keyboard for the tick".
 *
 * Which is why this runs HEADED and leaves prompting ON by default. An
 * unattended flag here would not make the captcha go away; it would only turn a
 * two-second tick into a twenty-minute timeout.
 */
const HEADLESS = flag('headless');

function buildOne(index, total) {
  line('');
  line('  ' + '─'.repeat(68));
  line(`  building fixture ${index} of ${total}   (pre-application route)`);
  line('  A browser window will open. Tick the reCAPTCHA when it appears —');
  line('  everything after that runs by itself, including both payments.');
  line('  ' + '─'.repeat(68));

  const args = ['scripts/build-fixture.js'];
  if (HEADLESS) args.push('--headless');

  // EV_NO_PROMPT is set ONLY for a headless run, where nobody is watching and a
  // prompt would just hang. A headed pre-application build MUST be able to wait
  // for the human it needs.
  const env = { ...process.env };
  if (HEADLESS) env.EV_NO_PROMPT = '1';

  try {
    const out = execFileSync(process.execPath, args, {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf-8',
      timeout: 40 * 60_000,
      env,
      stdio: ['inherit', 'pipe', 'pipe'],   // inherit stdin: the builder may prompt
    });
    process.stdout.write(out);
    const m = /EXTEND_APP_NO=([A-Z0-9]+)/.exec(out);
    return m ? m[1] : null;
  } catch (e) {
    const text = String((e.stdout || '') + (e.stderr || ''));
    process.stdout.write(text);
    line(`  fixture ${index} FAILED: ${String(e.message).split('\n')[0]}`);
    const resume = /--resume (fx-[\w-]+)/.exec(text);
    if (resume) line(`  it is RESUMABLE — no need to start over:  npm run fixture -- --resume ${resume[1]}`);
    const m = /EXTEND_APP_NO=([A-Z0-9]+)/.exec(text);
    return m ? m[1] : null;
  }
}

function writeEnv(members) {
  let text = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf-8') : '';
  const value = members.join(',');
  text = /^EXTEND_APP_POOL=.*$/m.test(text)
    ? text.replace(/^EXTEND_APP_POOL=.*$/m, 'EXTEND_APP_POOL=' + value)
    : text.replace(/\s*$/, '\n') + 'EXTEND_APP_POOL=' + value + '\n';
  fs.writeFileSync(ENV_FILE, text);
  line(`  wrote EXTEND_APP_POOL (${members.length} member(s)) to automation/.env`);
}

(async () => {
  line('');
  line('  EAINT-11982 — fixture pool');
  line('');

  const claimed = (() => { try { return JSON.parse(fs.readFileSync(pool.USED_FILE, 'utf-8')); } catch { return {}; } })();
  const already = pool.poolMembers();
  if (already.length) {
    line(`  EXTEND_APP_POOL currently names ${already.length}: ${already.join(', ')}`);
    line(`  of those, ${Object.keys(claimed).length} already claimed (fixtures/pool-used.json)`);
    line('');
  }

  const found = await census();
  const usable = found.usable.filter((a) => !claimed[a]);

  line('');
  line(`  ${usable.length} unspent usable fixture(s) on staging right now.`);
  line(`  dump: ${path.relative(process.cwd(), OUT)}`);

  if (STATUS_ONLY) {
    line('');
    line('  --status: nothing was built. To fill the pool:  node scripts/build-pool.js --want <n> --write-env');
    line('');
    if (usable.length) line('  EXTEND_APP_POOL=' + usable.join(','));
    line('');
    return;
  }

  const shortfall = Math.max(0, WANT - usable.length);
  line('');
  line(`  wanted ${WANT}; have ${usable.length}; shortfall ${shortfall}`);

  if (DRY) { line('  --dry-run: nothing was built.'); return; }

  if (shortfall && !HEADLESS) {
    line('');
    line(`  ${shortfall} build(s) to go, and each one needs ONE reCAPTCHA tick from you.`);
    line('  The saved gate session is not reusable (npm run check:gate), so this is per fixture,');
    line('  not once. Everything either side of the tick is automatic — roughly 12 minutes each.');
  }

  const built = [];
  for (let i = 1; i <= shortfall; i++) {
    const appNo = buildOne(i, shortfall);
    if (appNo) { built.push(appNo); line(`  fixture ${i} -> ${appNo}`); }
    else line(`  fixture ${i} produced no application number — see the output above, then resume with: npm run fixture -- --resume`);
  }

  const members = [...usable, ...built];
  line('');
  line(`  pool: ${members.length} member(s)`);
  members.forEach((m) => line('    ' + m));
  if (WRITE_ENV && members.length) writeEnv(members);
  else if (members.length) { line(''); line('  add this to automation/.env (or re-run with --write-env):'); line('    EXTEND_APP_POOL=' + members.join(',')); }
  line('');
})();
