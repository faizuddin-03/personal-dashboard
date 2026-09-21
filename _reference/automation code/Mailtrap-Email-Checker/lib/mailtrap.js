/**
 * mailtrap.js — read the staging mail sink (Mailtrap sandbox) and assert the
 * eAuto SI/BDP emails against the baseline contracts (email-contracts.js).
 * ------------------------------------------------------------------------------
 * STANDALONE COPY (for sharing). Same logic as the QA-runner's
 * automation/lib/mailtrap.js, but reads config from THIS folder's config.json
 * (one level up from /lib) instead of the project's data/config.json.
 *
 * Email rule: email verification is part of EVERY E2E scenario.
 *   - A scenario that SHOULD send email → the email MUST appear in Mailtrap and
 *     every field (sender, recipient, subject, body/table/footer) is checked.
 *   - A scenario that should NOT send email → assert NO matching email arrived in
 *     the run window (the reverse / absence check).
 *
 * Wiring & config (config.json in this folder, or env vars — env ALWAYS wins):
 *   MAILTRAP_TOKEN  — Mailtrap API token (required to actually read the sink).
 *   MAILTRAP_URL    — the inbox "messages" API endpoint. For the modefair sandbox:
 *       https://mailtrap.io/api/accounts/{accountId}/inboxes/2581833/messages
 *     (or the sandbox.api.mailtrap.io host).
 *
 * GRACEFUL DEGRADATION: with no token/URL the helpers do NOT throw — they record a
 * `blocked` step ("email check needs MAILTRAP_TOKEN") plus the exact manual check,
 * so a run is never falsely green and the reviewer knows what to do by hand.
 *
 * Uses global fetch (Node 18+). No new dependency.
 */
const fs = require('fs');
const path = require('path');
const EC = require('./email-contracts');

const SANDBOX_WEB = 'https://mailtrap.io/sandboxes/2581833/messages';

// config.json in the tool root (../config.json). Read once, lazily, so a
// missing/broken config never throws at import time. Env ALWAYS wins.
let _fileCfg;
function fileCfg() {
  if (_fileCfg !== undefined) return _fileCfg;
  try { _fileCfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8')) || {}; }
  catch (_) { _fileCfg = {}; }
  return _fileCfg;
}

// Config precedence: environment variable → config.json field → default.
function cfg() {
  const f = fileCfg();
  return {
    token: process.env.MAILTRAP_TOKEN || f.mailtrapToken || '',
    url: process.env.MAILTRAP_URL || f.mailtrapUrl || '',
    webUrl: process.env.MAILTRAP_WEB_URL || f.mailtrapWebUrl || SANDBOX_WEB,
  };
}
function enabled() { const c = cfg(); return !!(c.token && c.url && typeof fetch === 'function'); }

async function api(url, token) {
  const res = await fetch(url, { headers: { 'Api-Token': token, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Mailtrap ${res.status} ${res.statusText} @ ${url}`);
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

/** List inbox messages (newest first). Returns [] on any failure. */
async function listMessages() {
  const c = cfg();
  if (!enabled()) return [];
  try {
    const msgs = await api(c.url, c.token);
    const arr = Array.isArray(msgs) ? msgs : (msgs.data || msgs.messages || []);
    return arr.slice().sort((a, b) => String(b.sent_at || b.created_at || '').localeCompare(String(a.sent_at || a.created_at || '')));
  } catch (_) { return []; }
}

/** Fetch a message's raw MIME + html + text bodies (best-effort). */
async function fetchBodies(msg) {
  const c = cfg();
  const base = c.url.replace(/\/messages.*/, `/messages/${msg.id}`);
  const out = { raw: '', html: '', txt: '' };
  for (const [k, suffix] of [['raw', 'body.raw'], ['html', 'body.html'], ['txt', 'body.txt']]) {
    try { out[k] = String(await api(`${base}/${suffix}`, c.token) || ''); } catch (_) {}
  }
  return out;
}

const sentMs = (m) => { const t = Date.parse(m.sent_at || m.created_at || ''); return Number.isFinite(t) ? t : 0; };

/** Find messages matching a subject regex and/or recipient, arrived at/after sinceMs. */
async function findMessages({ subjectRe, to, sinceMs = 0 } = {}) {
  const msgs = await listMessages();
  return msgs.filter((m) => {
    if (sinceMs && sentMs(m) && sentMs(m) < sinceMs - 60000) return false; // 60s slack for clock skew
    if (subjectRe && !subjectRe.test(String(m.subject || ''))) return false;
    if (to && !String(m.to_email || m.to || '').toLowerCase().includes(String(to).toLowerCase())) return false;
    return true;
  });
}

/** The manual fallback instructions surfaced when the API isn't wired. */
function manualHint(expectText) {
  return `Open the Mailtrap sandbox (${cfg().webUrl}) and ${expectText}. Set MAILTRAP_TOKEN + MAILTRAP_URL (env or config.json) to automate this.`;
}

/**
 * Assert a scenario's expected email(s) EXIST and match the contract, field-by-field.
 * `type` is a key of email-contracts.CONTRACTS. `vars` supplies the booking values
 * to look for in the body (companyName / appointmentDate / timeSlot / units).
 * Records pass/fail/info on the harness; never throws.
 */
async function assertEmail(h, { type, to, sinceMs, vars = {} } = {}) {
  const contract = EC.CONTRACTS[type];
  if (!contract) { h.step(`Email check — unknown contract "${type}"`, 'info', 'no contract'); return { ok: false }; }
  h.run.emailChecks = h.run.emailChecks || [];
  const label = `Email · ${contract.label}`;

  if (!enabled()) {
    const hint = manualHint(`confirm ONE "${contract.subjectHuman}" from ${contract.from} and check every field (subject, sender, recipient, body table, footer)`);
    h.step(`${label} (present)`, 'blocked', hint);
    h.run.emailChecks.push({ type, expect: 'present', status: 'blocked', hint });
    return { ok: false, blocked: true };
  }

  const matches = await findMessages({ subjectRe: contract.subjectRe, to, sinceMs });
  if (!matches.length) {
    h.assert(`${label} present`, false, '', `no email matching ${contract.subjectHuman}${to ? ' to ' + to : ''} in the run window`);
    h.run.emailChecks.push({ type, expect: 'present', status: 'fail', detail: 'not found' });
    return { ok: false };
  }
  const msg = matches[0];
  const bodies = await fetchBodies(msg);
  const body = `${bodies.html}\n${bodies.txt}\n${bodies.raw}`;
  const subject = String(msg.subject || '');

  // sender + recipient
  h.assert(`${label} · from ${contract.from}`, String(msg.from_email || msg.from || '').toLowerCase().includes(contract.from), `from=${msg.from_email || msg.from}`, `expected ${contract.from}`);
  if (to) h.assert(`${label} · to ${to}`, String(msg.to_email || msg.to || '').toLowerCase().includes(String(to).toLowerCase()), `to=${msg.to_email || msg.to}`, `expected recipient contains ${to}`);

  // subject encoding defect (mojibake "?") — raise, don't accept as expected copy
  if (contract.checkSubjectEncoding && EC.SUBJECT_ENCODING_DEFECT.re.test(subject)) {
    h.knownIssue('email-subject-mojibake', 'still-present', `subject="${subject}" — ${EC.SUBJECT_ENCODING_DEFECT.note}`);
  }

  // body must-contain (hard)
  for (const re of contract.bodyMustContain || []) {
    h.assert(`${label} · body contains ${re}`, re.test(body), '', `body missing ${re}`);
  }
  // body should-contain (soft — verify/deviation, never hard-fail)
  for (const s of contract.bodyShouldContain || []) {
    const present = s.re.test(body);
    if (present) h.step(`${label} · ${s.what}`, 'pass', 'present');
    else h.step(`${label} · ${s.what}`, 'info', `${s.deviation ? 'DEVIATION — ' : 'not found — verify vs baseline: '}${s.re}`);
  }
  // dynamic booking values (the "check every detail" leg)
  for (const f of contract.dynamicFields || []) {
    const v = vars[f];
    if (v == null || v === '') continue;
    const present = body.includes(String(v)) || (f === 'appointmentDate' && [String(v), String(v).replace(/-/g, '.'), String(v).split('-').reverse().join('.')].some((x) => body.includes(x)));
    h.assert(`${label} · body shows ${f}="${v}"`, present, 'matched the booking', `"${v}" not found in the email body`);
  }

  h.step(`${label} present`, 'pass', `subject="${subject}"`);
  h.run.emailChecks.push({ type, expect: 'present', status: 'pass', subject, to: msg.to_email || msg.to, id: msg.id });
  return { ok: true, msg, bodies };
}

/**
 * Assert NO email (of the given type, or ANY eAuto email) arrived for `to` in the
 * run window — the reverse/absence check for scenarios that must not send mail
 * (failed/pending payment, validation blocks, read-only/permission/pricing).
 */
async function assertNoEmail(h, { to, sinceMs, type, reason = '' } = {}) {
  h.run.emailChecks = h.run.emailChecks || [];
  const subjectRe = type && EC.CONTRACTS[type] ? EC.CONTRACTS[type].subjectRe
    : /eAuto:\s*Your Software Installation Appointment/i;
  const label = 'Email · absence check';

  if (!enabled()) {
    const hint = manualHint(`confirm NO new Appointment email arrived${to ? ' for ' + to : ''} during this run${reason ? ' (' + reason + ')' : ''}`);
    h.step(label, 'blocked', hint);
    h.run.emailChecks.push({ expect: 'absent', status: 'blocked', hint });
    return { ok: false, blocked: true };
  }
  const matches = await findMessages({ subjectRe, to, sinceMs });
  const none = matches.length === 0;
  h.assert(`${label} — no email expected${reason ? ' (' + reason + ')' : ''}`, none,
    'no eAuto appointment email arrived in the run window (correct)',
    `UNEXPECTED: ${matches.length} email(s) arrived — e.g. "${matches[0] && matches[0].subject}"`);
  h.run.emailChecks.push({ expect: 'absent', status: none ? 'pass' : 'fail', found: matches.length, reason });
  return { ok: none };
}

module.exports = { enabled, cfg, listMessages, fetchBodies, findMessages, assertEmail, assertNoEmail, manualHint, SANDBOX_WEB };
