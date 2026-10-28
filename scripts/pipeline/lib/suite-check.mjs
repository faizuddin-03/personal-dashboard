// Suite check (2026-10-27, night enhancement round 1).
//
// A mechanical review of the automation the pipeline's Dwarf built for one
// ticket, run by dwarf:build / dwarf:sync finish() and by Dwarf itself
// (`node scripts/pipeline/lib/suite-check.mjs <KEY>`). It looks for the ways a
// suite "lies" — passes on a broken build or fails on a good one — that can be
// seen in the text, modelled on the spec-reviewer reject list in Charmain's QA
// repo [charmain-repo: .claude/agents/spec-reviewer.md:35-61] plus our own
// automation rules (prompts-common.mjs AUTOMATION_RULES, act like a person).
//
// Never blocks a build by itself: findings go to Dwarf (one automatic fix job)
// and to Faizuddin in the chat. A finding that is right on purpose (e.g. a flow
// copied step for step from a working suite) is kept by a comment with a
// reason on the same line or the line above:
//   // pipeline-check: allow <rule> — <reason>
// or for a whole file, in its first 30 lines:
//   // pipeline-check: allow-file <rule> — <reason>
// <rule> may be "*" for every rule. The reason must be at least 8 characters.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { traceSelectors } from "./selector-trace.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const digitsOf = key => String(key).replace(/^[A-Z][A-Z0-9]*-/, "");

export const suiteCheckRel = key => `data/pipeline/work/${key}/suite-check.json`;

/** Rules: id, severity, which files, the test, and why (with source). */
export const RULES = [
  {
    id: "only", sev: "critical", scope: "suite",
    re: /\b(test|describe)\.only\s*\(/,
    why: "test.only silently skips every other TS in the run",
    source: "Playwright behaviour; spec-reviewer row 21 (silent drop) [charmain-repo: .claude/agents/spec-reviewer.md:61]",
  },
  {
    id: "env", sev: "critical", scope: "all",
    re: /\b(sit4|uat3)\b/i,
    why: "sit4 and uat3 are never used",
    source: "AUTOMATION_RULES 8 (scripts/pipeline/prompts-common.mjs)",
  },
  {
    id: "password", sev: "critical", scope: "all",
    re: /(\b(pass(word)?|pwd|secret|token)\b\s*[:=]\s*(['"`])[^'"`\s$]{3,}\4)|(env\(\s*['"][A-Z0-9_]*(PASS|PWD|SECRET|TOKEN)[A-Z0-9_]*['"]\s*,\s*['"][^'"]+['"])/i,
    why: "a credential literal in code (also as an env() fallback); logins come from the dashboard or env only",
    source: "spec-reviewer row 19 [charmain-repo: .claude/agents/spec-reviewer.md:58]; feedback inputs typed on dashboard, never invented",
  },
  {
    id: "inject", sev: "critical", scope: "suite",
    re: /(\.dispatchEvent\s*\()|(\.(value|checked)\s*=(?!=))|(removeAttribute\(\s*['"]readonly)|(datepicker\(\s*['"]setDate)/,
    why: "writes to the page instead of acting like a person (no .value/.checked writes, dispatchEvent, readonly stripping, datepicker setDate)",
    source: "AUTOMATION_RULES 2; knowledge/automation-playbook.md (never datepicker('setDate')); spec-reviewer row 1 idea \"drive the product the way a user does\" [charmain-repo: .claude/agents/spec-reviewer.md:39]",
  },
  {
    id: "force", sev: "major", scope: "suite",
    re: /\bforce\s*:\s*true\b/,
    needsNo: /\b(rmSync|rm|cpSync|cp|mkdirSync|mkdir|rmdirSync)\s*\(/,
    why: "force-click skips the checks a person's click would fail (hidden, covered, disabled)",
    source: "AUTOMATION_RULES 2 (no force-click)",
  },
  {
    id: "sleep", sev: "minor", scope: "suite",
    re: /\.waitForTimeout\s*\(/,
    why: "a sleep proves nothing and hides the real wait; prefer waiting for a locator or a state (minor here: the benchmark suites still use some)",
    source: "spec-reviewer row 3 [charmain-repo: .claude/agents/spec-reviewer.md:41]; [charmain-repo: docs/writing-tests.md:56-61]",
  },
  {
    id: "swallow", sev: "major", scope: "suite",
    // An ACTION or WAIT whose failure is swallowed (.catch(() => {}) / null / false / undefined) with
    // no short timeout in the statement. Probes (isVisible, count, textContent ...) do not wait: fine.
    re: /\.(click|dblclick|fill|type|press|pressSequentially|check|uncheck|selectOption|setInputFiles|hover|focus|tap|goto|waitFor|waitForSelector|waitForURL|waitForLoadState|waitForResponse|waitForEvent|waitForFunction)\s*\([^;]*?\)\s*\.catch\(\s*(\(\s*\w*\s*\)|\w+)\s*=>\s*(\{\s*\}|null|undefined|false|void 0)\s*\)/,
    needsNo: /timeout\s*:/,
    lookBack: 2,
    why: "an action or wait whose failure is swallowed with no short timeout pays the full action timeout and lets the step continue with the work undone (reports PASS)",
    source: "spec-reviewer row 4 [charmain-repo: .claude/agents/spec-reviewer.md:42]; lesson \"A .catch(() => {}) still pays the full action timeout\" [charmain-repo: docs/lessons.md:58]",
  },
  {
    id: "host", sev: "major", scope: "steps",
    re: /https?:\/\/([a-z0-9-]+\.)*(eauto\.my|modefair\.com)\b|https?:\/\/\d{1,3}(\.\d{1,3}){3}/i,
    why: "an eAuto host typed in a page object or test; hosts come from data/config (env) so a wrong environment cannot be hit by accident",
    source: "spec-reviewer rows 1 and 19 [charmain-repo: .claude/agents/spec-reviewer.md:39,58]; lesson \"A guessed URL sent QA credentials to production six times\" [charmain-repo: docs/lessons.md:50]",
  },
  // Night round 10: two more rows of her reject list (minor: the benchmark suites still deep-link in places).
  {
    id: "deep-link", sev: "minor", scope: "steps",
    re: /\.goto\(\s*(`[^`]*\$\{[^}]+\}\s*\/[\w-]+[^`]*`|[\w.()]+\s*\+\s*(['"`]\/|[\w.]*[pP]ath\b))/,
    needsNo: /login|logout|index\.html|esim/i,
    why: "reaches a screen by typing its URL instead of logging in and clicking: a wrong path gives a 404 that looks like a broken portal, and a session-only path can redirect off the environment",
    source: "spec-reviewer row 1 [charmain-repo: .claude/agents/spec-reviewer.md:39]; QA principle 13 [charmain-repo: docs/qa-principles.md:80-97]",
  },
  {
    id: "internal-assert", sev: "minor", scope: "suite",
    re: /expect(\.soft)?\(\s*(await\s+)?(\w+\.)?(page\.evaluate|\w*[rR]esponse\w*\.(json|status|text|ok)\(|request\.(get|post|fetch)\()/,
    why: "asserts internal state (page.evaluate, an API response) where a screen exists: a result is what the user saw",
    source: "spec-reviewer row 6 [charmain-repo: .claude/agents/spec-reviewer.md:44]; assertion-plan \"Never assert a database row, an API body or a log\" [charmain-repo: .claude/skills/assertion-plan/SKILL.md:112]",
  },
  {
    id: "skip", sev: "minor", scope: "suite",
    re: /\btest\.(skip|fixme)\s*\(\s*(\)|true\s*\)|[^'"`]*\)\s*;?\s*$)/,
    why: "a skip with no reason is a silent drop; give the reason (blocker) as the second argument",
    source: "spec-reviewer row 21 [charmain-repo: .claude/agents/spec-reviewer.md:61]",
  },
];

const SKIP_DIRS = new Set(["node_modules", "test-results", "playwright-report", ".cache", "blob-report", "evidence", "runs"]);
const CODE_RE = /\.(ts|tsx|mts|mjs|js|cjs)$/;

function walk(absDir, out = []) {
  let entries;
  try { entries = fs.readdirSync(absDir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(absDir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else if (CODE_RE.test(e.name) && !e.name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

const rel = abs => path.relative(ROOT, abs).split(path.sep).join("/");

/** Which rule scopes apply to a file. suite = Playwright project; steps = its pages/tests/utils/fixtures/flows. */
function scopesFor(relPath, suiteDir) {
  const s = new Set(["all"]);
  if (relPath.startsWith(`${suiteDir}/`)) {
    s.add("suite");
    const sub = relPath.slice(suiteDir.length + 1).split("/")[0];
    if (/^(pages|tests|utils|fixtures|flows|helpers|components)$/.test(sub)) s.add("steps");
  }
  return s;
}

const ALLOW_RE = /pipeline-check:\s*allow(-file)?\s+([\w*,-]+)\s*(?:—|–|-|:)\s*(.{8,})/i;

function allowsOn(line, ruleId, wantFile) {
  const m = String(line).match(ALLOW_RE);
  if (!m || !!m[1] !== wantFile) return false;
  return m[2].split(",").some(r => r === "*" || r === ruleId);
}

/** Lines that are only comments (// or * or /*) — rules do not fire on them. */
const isComment = line => /^\s*(\/\/|\*|\/\*)/.test(line);

/** Scans one file. Returns findings (allowed ones are marked, not dropped). */
export function scanFile(abs, suiteDir) {
  const r = rel(abs);
  const scopes = scopesFor(r, suiteDir);
  let text;
  try { text = fs.readFileSync(abs, "utf8"); } catch { return []; }
  const lines = text.split(/\r?\n/);
  const head = lines.slice(0, 30);
  const out = [];
  lines.forEach((line, i) => {
    if (isComment(line)) return;
    for (const rule of RULES) {
      if (!scopes.has(rule.scope)) continue;
      if (!rule.re.test(line)) continue;
      if (rule.needsNo) {
        const stmt = lines.slice(Math.max(0, i - (rule.lookBack ?? 0)), i + 1).join("\n");
        if (rule.needsNo.test(stmt)) continue;
      }
      const allowed = allowsOn(line, rule.id, false) || allowsOn(lines[i - 1] ?? "", rule.id, false) || head.some(h => allowsOn(h, rule.id, true));
      out.push({ rule: rule.id, sev: rule.sev, file: r, line: i + 1, text: line.trim().slice(0, 200), why: rule.why, source: rule.source, ...(allowed ? { allowed: true } : {}) });
    }
  });
  return out;
}

/** File text without blank and comment-only lines, CRLF-proof: two copies of one file compare equal. */
const normalized = text => String(text).split(/\r?\n/).map(l => l.trimEnd()).filter(l => l.trim() && !isComment(l)).join("\n");

/**
 * Files of this suite that are unchanged copies of a file in another
 * scripts/eauto-* suite (same name, same code). Copying working flows step for
 * step is the rule (feedback_copy-working-flows-step-for-step), so their hits
 * are kept, marked copiedFrom, and never block.
 */
export function copiedFiles(suiteFiles, suiteDir) {
  const base = path.join(ROOT, "scripts");
  const own = path.join(ROOT, suiteDir);
  const byName = new Map();
  for (const f of suiteFiles) {
    const n = path.basename(f);
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(f);
  }
  const out = new Map();
  let suites;
  try { suites = fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory() && /^eauto-/.test(d.name)).map(d => path.join(base, d.name)); } catch { return out; }
  const mine = new Map();
  const norm = f => { if (!mine.has(f)) { try { mine.set(f, normalized(fs.readFileSync(f, "utf8"))); } catch { mine.set(f, null); } } return mine.get(f); };
  for (const s of suites) {
    if (path.resolve(s) === path.resolve(own)) continue;
    for (const other of walk(s)) {
      const cands = byName.get(path.basename(other));
      if (!cands) continue;
      let txt; try { txt = normalized(fs.readFileSync(other, "utf8")); } catch { continue; }
      if (!txt) continue;
      for (const f of cands) if (!out.has(f) && norm(f) === txt) out.set(f, rel(other));
    }
  }
  return out;
}

function readScenarios(key) {
  try {
    const list = JSON.parse(fs.readFileSync(path.join(ROOT, `data/pipeline/work/${key}/scenarios.json`), "utf8"));
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

/**
 * Trace: every automated TS has a test whose title is exactly "<id>: <title>"
 * (the dashboard joins runs to TS by it), the runner page lists it, and no
 * test or page row names a TS that is not in scenarios.json or is manual.
 * [charmain-repo: .claude/agents/spec-reviewer.md:45,51] (title joins the run; every block clause asserted)
 */
export function traceScenarios(key, suiteFiles, pageFiles) {
  const d = digitsOf(key);
  const scenarios = readScenarios(key);
  const read = files => files.map(f => { try { return fs.readFileSync(f, "utf8"); } catch { return ""; } }).join("\n");
  const suiteText = read(suiteFiles);
  const pageText = read(pageFiles);
  const titleOf = s => `${s.id}: ${s.title}`;
  const known = new Map(scenarios.map(s => [s.id, s]));
  const missingTests = [], missingInPage = [], manualAutomated = [], unknownIds = [];
  for (const s of scenarios) {
    const t = titleOf(s);
    const inSuite = suiteText.includes(t);
    if (s.manual) { if (inSuite) manualAutomated.push(s.id); continue; }
    if (!inSuite) missingTests.push(s.id);
    if (pageFiles.length && !pageText.includes(t)) missingInPage.push(s.id);
  }
  const idRe = new RegExp(`\\b${d}_TS(\\d{2,})\\b`, "g");
  for (const m of `${suiteText}\n${pageText}`.matchAll(idRe)) {
    const id = `${d}_TS${m[1]}`;
    if (!known.has(id) && !unknownIds.includes(id)) unknownIds.push(id);
  }
  return { scenarios: scenarios.length, automated: scenarios.filter(s => !s.manual).length, missingTests, missingInPage, manualAutomated, unknownIds };
}

/**
 * Checks the pipeline-built suite of a ticket.
 * Returns { key, checkedAt, suiteDir, files, findings[], trace, blocking[], ok }.
 * blocking = critical/major findings that are not allowed, plus trace problems.
 */
export function checkSuite(key, opts = {}) {
  const d = digitsOf(key);
  const suiteDir = opts.suiteDir ?? `scripts/eauto-${d}`;
  const apiDir = opts.apiDir ?? `app/api/eauto-${d}`;
  const pageDir = opts.pageDir ?? `app/eauto/${d}`;
  const suiteFiles = walk(path.join(ROOT, suiteDir));
  const appFiles = [...walk(path.join(ROOT, apiDir)), ...walk(path.join(ROOT, pageDir))];
  const pageFiles = walk(path.join(ROOT, pageDir));
  const copied = copiedFiles(suiteFiles, suiteDir);
  const findings = [...suiteFiles, ...appFiles].flatMap(f => {
    const from = copied.get(f);
    return scanFile(f, suiteDir).map(x => (from ? { ...x, allowed: true, copiedFrom: from } : x));
  });
  const trace = traceScenarios(key, suiteFiles, pageFiles);
  // Round 19: selectors with no capture / mock-up / working suite behind them (minor, listed only).
  let selectors = { checked: 0, untraced: [] };
  try { selectors = traceSelectors(key, suiteDir, { skipFiles: new Set(copied.keys()) }); } catch { /* advisory */ }
  const blocking = [];
  for (const f of findings) if (!f.allowed && f.sev !== "minor") blocking.push(`${f.rule} at ${f.file}:${f.line}`);
  if (trace.missingTests.length) blocking.push(`no test titled exactly "<id>: <title>" for ${trace.missingTests.join(", ")}`);
  if (trace.missingInPage.length) blocking.push(`runner page does not list ${trace.missingInPage.join(", ")} with the exact title`);
  if (trace.manualAutomated.length) blocking.push(`manual-only TS automated: ${trace.manualAutomated.join(", ")}`);
  if (trace.unknownIds.length) blocking.push(`TS ids not in scenarios.json: ${trace.unknownIds.join(", ")}`);
  return {
    key, checkedAt: new Date().toISOString(), suiteDir, files: suiteFiles.length + appFiles.length,
    exists: suiteFiles.length > 0, findings, trace, selectors, blocking, ok: suiteFiles.length > 0 && !blocking.length,
  };
}

/** Writes the result to data/pipeline/work/<KEY>/suite-check.json and returns it. */
export function runAndSave(key, opts) {
  const res = checkSuite(key, opts);
  const abs = path.join(ROOT, suiteCheckRel(key));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(res, null, 2) + "\n");
  return res;
}

/** Short numbered text for a chat note / Dwarf's fix prompt. */
export function checkSummary(res, max = 25) {
  if (!res.exists) return "1. No suite files found.";
  const lines = [];
  const t = res.trace;
  if (t.missingTests.length) lines.push(`**Missing tests:** ${t.missingTests.join(", ")} — no Playwright test() titled exactly "<id>: <title>" from scenarios.json (the dashboard joins run results to TS by this title).`);
  if (t.missingInPage.length) lines.push(`**Runner page:** ${t.missingInPage.join(", ")} not listed with the exact "<id>: <title>".`);
  if (t.manualAutomated.length) lines.push(`**Manual-only TS automated:** ${t.manualAutomated.join(", ")} — list them as manual, never automate.`);
  if (t.unknownIds.length) lines.push(`**Unknown TS ids:** ${t.unknownIds.join(", ")} appear in the code but not in scenarios.json.`);
  const open = res.findings.filter(f => !f.allowed);
  const order = { critical: 0, major: 1, minor: 2 };
  open.sort((a, b) => order[a.sev] - order[b.sev]);
  for (const f of open.slice(0, max)) lines.push(`**${f.sev} ${f.rule}** ${f.file}:${f.line} — \`${f.text.replace(/`/g, "'")}\` — ${f.why}.`);
  if (open.length > max) lines.push(`… ${open.length - max} more in ${suiteCheckRel(res.key)}.`);
  const un = res.selectors?.untraced ?? [];
  if (un.length) lines.push(`**minor untraced-selector** ${un.length} of ${res.selectors.checked} selector(s) appear in no saved capture, mock-up or working suite (${un.slice(0, 5).map(u => `${u.kind} "${u.value}" ${u.file.split("/").pop()}:${u.line}`).join("; ")}${un.length > 5 ? "; …" : ""}) — mark those page objects [unconfirmed] and ask Faizuddin which pages to capture.`);
  const copiedHits = res.findings.filter(f => f.copiedFrom).length;
  const allowed = res.findings.filter(f => f.allowed && !f.copiedFrom).length;
  if (copiedHits) lines.push(`${copiedHits} hit(s) in files copied unchanged from another suite (${[...new Set(res.findings.filter(f => f.copiedFrom).map(f => f.copiedFrom.split("/").slice(0, 2).join("/")))].join(", ")}): kept, not failing.`);
  if (allowed) lines.push(`${allowed} hit(s) kept on purpose with a "pipeline-check: allow" reason.`);
  return lines.length ? lines.map((l, i) => `${i + 1}. ${l}`).join("\n") : "1. Clean: titles match scenarios.json and no rule hits.";
}

/** Prompt block for Dwarf: what the check looks for and how to keep a hit on purpose. */
export function suiteCheckRules(key) {
  return `Suite check (run it before you finish; the dashboard runs it again after you): node scripts/pipeline/lib/suite-check.mjs ${key}
It fails on: a test() title that is not exactly "<id>: <title>" from scenarios.json, or a TS the runner page does not list; manual TS automated; test.only; sit4/uat3; a password/token literal (also as an env() fallback); .value/.checked writes, dispatchEvent, readonly stripping, datepicker('setDate'); force: true; an action or wait (click, fill, waitFor, goto ...) followed by .catch(() => {}) / null / false with no short "timeout:" in the same statement; an eAuto host or IP typed in pages/ tests/ utils/ (hosts live in data/config via env). Minor (listed, not failing): waitForTimeout; test.skip / test.fixme with no reason; page.goto to a typed deep path (log in and click instead); expect() on page.evaluate or an API response.
Hits in a file that is an unchanged copy of the same-named file in another scripts/eauto-* suite (copy working flows step for step) are kept automatically and never fail.
Fix each other hit. Only when a hit is right on purpose (for example a flow copied step for step from a working suite, per the copy-working-flows rule), keep it with a comment on that line or the line above: "// pipeline-check: allow <rule> — <reason, 8+ characters, name the source suite>", or for a whole copied file in its first 30 lines: "// pipeline-check: allow-file <rule> — <reason>".
Also review by eye what the check cannot see (another QA's spec-reviewer list): a helper that returns quietly when its control is missing must throw naming what it could not find; assert what the user sees on the screen, not an API body or page.evaluate state; read a filtered listing only after the search button; clear the popup queue before navigating; click THIS run's record, never a shared one or .first() when the TS needs its own row; read a table column by its header text, never by index; an expected result must reject the plausible broken build (the old behaviour, the neighbouring control, the other role's view).`;
}

// ── CLI ──────────────────────────────────────────────────────────────
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const key = process.argv[2];
  if (!key || !/^[A-Z][A-Z0-9]*-\d+$/.test(key)) {
    console.log("usage: node scripts/pipeline/lib/suite-check.mjs <KEY> [--json]");
    process.exit(2);
  }
  const res = runAndSave(key);
  if (process.argv.includes("--json")) console.log(JSON.stringify(res, null, 2));
  else {
    console.log(`Suite check ${key}: ${res.ok ? "OK" : `${res.blocking.length} problem(s)`} (${res.files} files, ${res.trace.automated}/${res.trace.scenarios} TS automated). Saved ${suiteCheckRel(key)}.`);
    console.log(checkSummary(res));
  }
  process.exit(res.ok ? 0 : 1);
}
