#!/usr/bin/env node
/**
 * check-email.js — standalone Mailtrap email checker for the eAuto SI/BDP emails.
 * ============================================================================
 * Verifies the "Software Installation Appointment" Confirmation / Reschedule
 * emails against the baseline contracts in lib/email-contracts.js — the SAME
 * field-by-field checks the QA runner does, but as a self-contained CLI you can
 * run without the rest of the QA project.
 *
 * SETUP (either one — env vars win over config.json):
 *   1) copy config.example.json → config.json and paste your token + URL, OR
 *   2) set MAILTRAP_TOKEN and MAILTRAP_URL in your shell.
 *
 * USAGE:
 *   node check-email.js list [--to someone@x.com] [--n 20]
 *       List recent messages in the sandbox (newest first).
 *
 *   node check-email.js confirmation [--to x@y.com] [--since 30m]
 *       Verify an Appointment Confirmation email exists and every field matches.
 *
 *   node check-email.js reschedule  [--to x@y.com] [--since 30m]
 *       Verify a Reschedule email.
 *
 *   node check-email.js none        [--to x@y.com] [--since 30m] [--reason "..."]
 *       Assert NO eAuto appointment email arrived (the negative / absence check).
 *
 *   node check-email.js show <messageId>
 *       Dump one message's subject + text/html body (for eyeballing new copy).
 *
 * OPTIONS:
 *   --to      filter/assert on recipient (substring, case-insensitive)
 *   --since   only consider mail newer than this (e.g. 30m, 2h, 90s; default 1h)
 *   --n       list: how many to show (default 20)
 *   --reason  none: note why no email is expected (printed in the result)
 *
 * EXIT CODE: 0 if every assertion passed (or was a blocked/manual step), 1 if any
 * assertion FAILED — so it can gate a CI step.
 */
const path = require('path');
const mailtrap = require('./lib/mailtrap');
const EC = require('./lib/email-contracts');

// ── tiny ANSI colours (no dependency) ──────────────────────────────────────
const useColor = process.stdout.isTTY;
const c = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = (s) => c('32', s), red = (s) => c('31', s), yellow = (s) => c('33', s),
      dim = (s) => c('2', s), bold = (s) => c('1', s), cyan = (s) => c('36', s);

// ── minimal harness shim: the email lib only needs h.step / h.assert /
//    h.knownIssue / h.run.emailChecks. We print each and tally pass/fail. ────
function makeHarness() {
  const badge = { pass: green('PASS'), fail: red('FAIL'), info: cyan('info'), blocked: yellow('BLOCKED'), review: yellow('REVIEW') };
  const tally = { pass: 0, fail: 0, blocked: 0, info: 0 };
  const h = {
    run: { emailChecks: [], knownIssues: [] },
    step(name, status, detail) {
      tally[status] = (tally[status] || 0) + 1;
      const b = badge[status] || status;
      console.log(`  ${b}  ${name}${detail ? dim('  — ' + detail) : ''}`);
    },
    assert(name, condition, detailPass, detailFail) {
      return this.step(name, condition ? 'pass' : 'fail', condition ? (detailPass || '') : (detailFail || detailPass || ''));
    },
    knownIssue(ticket, verdict, detail) {
      this.run.knownIssues.push({ ticket, verdict, detail });
      this.step(`Known issue ${ticket}`, verdict === 'fixed' ? 'pass' : 'info', `${String(verdict).toUpperCase()} — ${detail}`);
    },
  };
  h._tally = tally;
  return h;
}

// ── arg parsing ─────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; out[k] = v; }
    else out._.push(a);
  }
  return out;
}
function sinceMs(str) {
  if (!str || str === true) return Date.now() - 60 * 60 * 1000; // default 1h
  const m = /^(\d+)\s*([smhd])?$/.exec(String(str).trim());
  if (!m) return Date.now() - 60 * 60 * 1000;
  const n = Number(m[1]), unit = m[2] || 'm';
  const mult = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[unit];
  return Date.now() - n * mult;
}

function header() {
  const cfg = mailtrap.cfg();
  console.log(bold('\neAuto Mailtrap email checker'));
  console.log(dim(`  sandbox: ${cfg.webUrl}`));
  if (!mailtrap.enabled()) {
    console.log(yellow('  ⚠ MAILTRAP_TOKEN / MAILTRAP_URL not set — running in MANUAL mode.'));
    console.log(dim('    Set them (env or config.json) to read the sink automatically. Manual steps are printed below.\n'));
  } else {
    console.log(dim(`  api: ${cfg.url}\n`));
  }
}

function fmtDate(m) { return m.sent_at || m.created_at || ''; }

async function cmdList(args) {
  const n = Number(args.n) || 20;
  const msgs = await mailtrap.findMessages({ to: typeof args.to === 'string' ? args.to : undefined, sinceMs: args.since ? sinceMs(args.since) : 0 });
  if (!mailtrap.enabled()) { console.log(yellow('  (manual mode — open the sandbox link above to browse messages)')); return 0; }
  if (!msgs.length) { console.log(dim('  no messages match.')); return 0; }
  console.log(bold(`  ${Math.min(n, msgs.length)} of ${msgs.length} message(s):\n`));
  for (const m of msgs.slice(0, n)) {
    console.log(`  ${dim(fmtDate(m))}  ${cyan(String(m.id))}`);
    console.log(`    to:   ${m.to_email || m.to || dim('?')}`);
    console.log(`    subj: ${bold(m.subject || dim('(no subject)'))}\n`);
  }
  return 0;
}

async function cmdShow(args) {
  const id = args._[1];
  if (!id) { console.log(red('  usage: node check-email.js show <messageId>')); return 1; }
  if (!mailtrap.enabled()) { console.log(yellow('  (manual mode — open the sandbox to view this message)')); return 0; }
  const msgs = await mailtrap.listMessages();
  const msg = msgs.find((m) => String(m.id) === String(id));
  if (!msg) { console.log(red(`  message ${id} not found in the sink.`)); return 1; }
  const bodies = await mailtrap.fetchBodies(msg);
  console.log(bold('  Subject: ') + (msg.subject || ''));
  console.log(bold('  From:    ') + (msg.from_email || msg.from || ''));
  console.log(bold('  To:      ') + (msg.to_email || msg.to || ''));
  console.log(bold('\n  ── text body ──'));
  console.log((bodies.txt || dim('(none)')).replace(/^/gm, '  '));
  if (bodies.html) { console.log(bold('\n  ── html body (raw) ──')); console.log(bodies.html.replace(/^/gm, '  ')); }
  return 0;
}

async function cmdContract(type, args) {
  const h = makeHarness();
  const to = typeof args.to === 'string' ? args.to : undefined;
  const since = sinceMs(args.since);
  console.log(bold(`  Checking "${EC.CONTRACTS[type].label}"${to ? ' to ' + to : ''} since ${new Date(since).toLocaleString()}:\n`));
  await mailtrap.assertEmail(h, { type, to, sinceMs: since });
  return finish(h);
}

async function cmdNone(args) {
  const h = makeHarness();
  const to = typeof args.to === 'string' ? args.to : undefined;
  const since = sinceMs(args.since);
  const reason = typeof args.reason === 'string' ? args.reason : '';
  console.log(bold(`  Absence check${to ? ' for ' + to : ''} since ${new Date(since).toLocaleString()}${reason ? ' (' + reason + ')' : ''}:\n`));
  await mailtrap.assertNoEmail(h, { to, sinceMs: since, reason });
  return finish(h);
}

function finish(h) {
  const t = h._tally;
  console.log('');
  console.log(dim('  ─────────────────────────────────────────────'));
  const parts = [green(`${t.pass} pass`), red(`${t.fail} fail`), yellow(`${t.blocked} blocked`), cyan(`${t.info} info`)];
  console.log('  ' + parts.join(dim(' · ')));
  const verdict = t.fail > 0 ? red('  ✗ FAIL') : (t.blocked > 0 && t.pass === 0 ? yellow('  ⚠ MANUAL — verify in the sandbox') : green('  ✓ PASS'));
  console.log(verdict + '\n');
  return t.fail > 0 ? 1 : 0;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = (args._[0] || 'help').toLowerCase();
  header();

  let code = 0;
  switch (cmd) {
    case 'list': code = await cmdList(args); break;
    case 'show': code = await cmdShow(args); break;
    case 'confirmation': case 'confirm': code = await cmdContract('appointment-confirmation', args); break;
    case 'reschedule': case 'resched': code = await cmdContract('appointment-reschedule', args); break;
    case 'none': case 'absent': code = await cmdNone(args); break;
    default:
      console.log('Commands: list | confirmation | reschedule | none | show <id>');
      console.log('Run with no token to see the manual steps; see README.md for full usage.\n');
  }
  process.exit(code);
}

main().catch((e) => { console.error(red('\n  error: ' + (e && e.message ? e.message : e)) + '\n'); process.exit(1); });
