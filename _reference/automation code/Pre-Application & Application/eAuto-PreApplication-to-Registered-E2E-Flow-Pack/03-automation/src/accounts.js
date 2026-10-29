/**
 * Account registry — PORTABLE COPY, shipped by the `eauto-credentials` skill.
 * Drop this into any eAuto CR project as src/accounts.js.
 *
 * Account registry, discovered from the environment.
 *
 * Rather than hard-coding a fixed set of roles, ANY `<KEY>_USER` / `<KEY>_PASS`
 * pair in the environment becomes a runnable account, so adding a person to the
 * sweep is two lines in .env and no code change.
 *
 *   CSE_ALI_USER=ali.rahman   ->  EV_ROLE=cse_ali
 *   CSE_ALI_PASS=********
 *   CSE_ALI_LABEL=CSE — Ali Rahman     (optional)
 *
 * Passwords are read here and handed straight to the login helper. They are
 * never logged, never written to a sidecar, and never rendered on camera.
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

/** Human label when no <KEY>_LABEL is supplied. */
function defaultLabel(key) {
  const kind = kindOf(key);
  const rest = key.replace(/^(CSE|OPS|RO|EDIT)_?/i, '').replace(/_/g, ' ').trim();
  if (!rest) return kind;
  return `${kind} — ${rest.replace(/\b\w/g, (c) => c.toUpperCase())}`;
}

/**
 * How the account is described on camera, derived from its key prefix.
 * Order matters: HUBADMIN must be tested before ADMIN.
 */
function kindOf(key) {
  const k = key.toUpperCase();
  if (k.startsWith('CSE')) return 'CSE';
  if (k.startsWith('OPS')) return 'OPS';
  if (k.startsWith('HUBADMIN')) return 'Hub Admin';
  if (k.startsWith('ADMIN')) return 'Admin';
  if (k.startsWith('PROB')) return 'Probation';
  if (k.startsWith('FIN')) return 'Finance';
  if (k.startsWith('SUBUCD')) return 'Sub UCD';
  if (k.startsWith('UCD')) return 'Main UCD';
  if (k.startsWith('RO')) return 'read-only role';
  if (k.startsWith('EDIT')) return 'edit-capable role';
  return key.toLowerCase();
}

/** Groups that the ROLEPERM matrix says cannot reach the module at all. */
const NO_ACCESS_KINDS = ['Hub Admin', 'Admin', 'Probation', 'Finance'];

/** Prefixes that name a real role group. Anything else is not an account. */
const KNOWN_PREFIXES = /^(CSE|OPS|HUBADMIN|ADMIN|PROB|FIN|SUBUCD|UCD|RO|EDIT)/i;

/**
 * The SHARED eAuto credential store, used by every CR project on this machine.
 * Passwords live here and nowhere else, so a new project needs no re-entry.
 * Managed by the `eauto-credentials` skill.
 */
const SHARED_ENV = path.join(os.homedir(), '.claude', 'secrets', 'eauto.env');
/** Project-local settings (dates, URLs); may override any shared key. */
const PROJECT_ENV = process.env.EAUTO_PROJECT_ENV || path.resolve(process.cwd(), '.env');

function parseEnv(file) {
  if (!file || !fs.existsSync(file)) return null;
  const out = {};
  for (const line of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

/**
 * Shared store + project .env (project wins). The registry must come from these
 * DECLARED files, not from `process.env`: the operator's shell already carries
 * unrelated `<X>_USER` / `<X>_PASS` pairs for other systems, and those strays
 * would otherwise be eligible to be picked as an account.
 */
function loadEnvFile() {
  const shared = parseEnv(SHARED_ENV);
  const project = parseEnv(PROJECT_ENV);
  if (!shared && !project) return null;
  return { ...(shared ?? {}), ...(project ?? {}) };
}

/**
 * Put the merged files into process.env WITHOUT clobbering anything already set
 * — an explicit `$env:TC=...` or a CI variable must still win. Runs on import so
 * every entry point sees the shared store whether or not it was launched with
 * --env-file.
 */
function hydrateProcessEnv() {
  const merged = loadEnvFile();
  if (!merged) return;
  for (const [k, v] of Object.entries(merged)) {
    if (process.env[k] === undefined || process.env[k] === '') process.env[k] = v;
  }
}
hydrateProcessEnv();

/**
 * Every account the environment defines, keyed lowercase.
 * A `<KEY>_USER` with no matching `<KEY>_PASS` is ignored, so a blank block in
 * .env simply drops out of the sweep.
 */
function discoverAccounts(env) {
  env = env ?? loadEnvFile() ?? process.env;
  const out = {};
  for (const name of Object.keys(env)) {
    const m = /^(.+)_USER$/.exec(name);
    if (!m) continue;
    const key = m[1];
    if (!KNOWN_PREFIXES.test(key)) continue;
    const user = (env[name] ?? '').trim();
    const pass = (env[`${key}_PASS`] ?? '').trim();
    if (!user || !pass) continue;
    out[key.toLowerCase()] = {
      key: key.toLowerCase(),
      user,
      pass,
      kind: kindOf(key),
      label: (env[`${key}_LABEL`] ?? '').trim() || defaultLabel(key),
    };
  }
  return out;
}

/** Accounts of one kind, e.g. every CSE login, in declaration order. */
function accountsOfKind(kind, env) {
  env = env ?? loadEnvFile() ?? process.env;
  const all = discoverAccounts(env);
  const listed = (env.CSE_ACCOUNTS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (kind === 'CSE' && listed.length) {
    return listed.map((k) => all[k]).filter(Boolean);
  }
  return Object.values(all).filter((a) => a.kind === kind);
}

/** Names only — safe to print. Never print an account object; it holds the password. */
function accountNames(env) {
  return Object.values(discoverAccounts(env)).map((a) => `${a.key} (${a.label})`);
}

module.exports = {
  SHARED_ENV, PROJECT_ENV, parseEnv, hydrateProcessEnv,
  discoverAccounts, accountsOfKind, accountNames, kindOf, defaultLabel,
  NO_ACCESS_KINDS, loadEnvFile, KNOWN_PREFIXES,
};
