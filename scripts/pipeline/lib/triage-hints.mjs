// Triage hints for elf:findings (2026-10-27, night enhancement round 3).
//
// Charmain's qa-triage agent judges each red with a fixed method: suspect the
// script before the product (two tells: a step far slower than its
// neighbours, a step that passed without changing anything), check the
// environment causes that look exactly like defects, check whether it is
// already known, and say "unresolved" with what was ruled out instead of
// guessing [charmain-repo: .claude/agents/qa-triage.md:32-69]. Node computes
// what can be computed (error kind, slow steps, earlier findings for the same
// TS, failures sharing one error) so Elf judges from facts, not from a theory.

import fs from "node:fs";
import path from "node:path";
import { PIPE_DIR } from "../store.mjs";

/** Error text patterns → kind + what it usually means (hint, never a verdict). */
const KINDS = [
  {
    kind: "network", re: /net::ERR_|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|\b50[234]\b|Bad Gateway|Service Unavailable|Gateway Time-?out|socket hang up/i,
    hint: "the site or a service did not answer: environment, not the product rule. Retry later before raising.",
    source: "[charmain-repo: .claude/agents/qa-triage.md:40] (environment: name the specific thing)",
  },
  {
    kind: "login", re: /invalid (user ?name|username|password|credentials?)|incorrect (user ?name|password)|account (is )?(locked|blocked|suspended)|too many (login )?attempts|login failed|authentication failed/i,
    hint: "login refused: repeated logins on the shared instance are throttled and look exactly like a wrong password. Environment; wait, do not retry into a lockout.",
    source: "[charmain-repo: docs/lessons.md:26-31]",
  },
  {
    // Night round 11.
    kind: "card-reader", re: /reader (is )?(not )?(un)?available|card reader|MyKad reader|Scanning IC|insert (the |your )?card/i,
    hint: "the card reader step failed: three environment causes look exactly like a broken reader (the wrong per-environment key, a company missing from the emulator allowlist, Chrome blocking the local-network socket). Rule them out (knowledge/mykad-emulator.md) before calling it a defect.",
    source: "[charmain-repo: docs/lessons.md:78-82]",
  },
  {
    kind: "strict", re: /strict mode violation|resolved to \d+ elements/i,
    hint: "the locator matched several elements: the script's selector is not unique (automation), unless the page really shows duplicates the TS forbids.",
    source: "[charmain-repo: docs/qa-principles.md:99] (suspect your own script: non-unique scope key)",
  },
  {
    kind: "empty-listing", re: /no (data|records?|results?)( (available|found))?|0 records|please apply (a )?search|nothing to display/i,
    hint: "an empty listing: a listing with a mandatory date range returns nothing without one, and UCD/BO listings show nothing until searched. Check the filters and the data before blaming the system.",
    source: "[charmain-repo: docs/lessons.md:17-20]; spec-reviewer row 16 [charmain-repo: .claude/agents/spec-reviewer.md:54]",
  },
  {
    kind: "locator-timeout", re: /(Timeout \d+ ?ms exceeded|timed out).*?(waiting for|locator|selector|getBy)|waiting for (locator|selector|getBy)|locator\.\w+: Timeout/is,
    hint: "a control was never found in time: the selector is wrong, a popup was in the way (popups are queued, not simultaneous), or the run never reached that screen. Look at the screenshot first: if the screen is right and the control is there, it is the script.",
    source: "[charmain-repo: .claude/agents/qa-triage.md:51-55]; [charmain-repo: docs/lessons.md:10-15]",
  },
  {
    kind: "closed", re: /Target (page|context|browser).*(closed|crashed)|browser has been closed|page\.goto: Navigation .* interrupted/i,
    hint: "the browser or page closed mid-run (stopped run, crash, a script closing the tab). Usually not a product result.",
    source: "[charmain-repo: .claude/agents/qa-triage.md:40]",
  },
  {
    kind: "value-mismatch", re: /Expected( string| value| pattern|:)|Received( string| value|:)|toHaveText|toContainText|toHaveValue|toBe\(|toEqual\(/i,
    hint: "the screen showed a different value from the TS: compare the screenshot with the TS and SRD wording. A real difference is a system finding; an expectation the source does not back, or old data, is data.",
    source: "[charmain-repo: .claude/agents/qa-triage.md:38] (defect: the block's words vs the screen's words)",
  },
  {
    kind: "timeout", re: /Test timeout of \d+ ?ms exceeded|Timeout \d+ ?ms exceeded/i,
    hint: "the test ran out of time: look for the slow step below (a swallowed wait pays its full timeout) before blaming the system.",
    source: "[charmain-repo: docs/lessons.md:58-60]",
  },
];

/** The first matching kind for a failure's text, or { kind: "other" }. */
export function errorKind(...texts) {
  const t = texts.filter(Boolean).join("\n").slice(0, 6000);
  // An expect() that timed out but DID receive a value is a value mismatch, not a missing control.
  const received = /Received(?: string| value)?:\s*(.+)/i.exec(t)?.[1] ?? "";
  if (received && !/element\(s\) not found|<element|undefined$/i.test(received.trim())) {
    const k = KINDS.find(x => x.kind === "value-mismatch");
    return { kind: k.kind, hint: k.hint, source: k.source };
  }
  for (const k of KINDS) if (k.re.test(t)) return { kind: k.kind, hint: k.hint, source: k.source };
  return { kind: "other" };
}

const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

/**
 * Steps far slower than their siblings (>= 20 s and >= 4x the sibling median),
 * the first tell of a swallowed wait [charmain-repo: .claude/agents/qa-triage.md:51-55].
 */
export function slowSteps(steps, out = [], depth = 0) {
  const list = (steps ?? []).filter(s => s && typeof s === "object");
  const durs = list.map(s => Number(s.duration) || 0);
  list.forEach((s, i) => {
    const d = durs[i];
    const others = durs.filter((_, j) => j !== i);
    const med = median(others);
    if (d >= 20_000 && (others.length ? d >= 4 * Math.max(med, 1000) : true) && !s.error) {
      out.push({ title: String(s.title ?? "").slice(0, 160), seconds: Math.round(d / 1000), siblingsMedianSeconds: Math.round(med / 1000), depth });
    }
    if (depth < 6) slowSteps(s.steps, out, depth + 1);
  });
  return out;
}

const canon = s => String(s ?? "").toUpperCase().replace(/^\d+_/, "").replace(/TS0*(\d+)/g, "TS$1");

/** Earlier findings of this ticket for the same TS (any state), newest first, excluding ids. */
export function priorFindings(key, ts, excludeIds = []) {
  const dir = path.join(PIPE_DIR, "findings", key);
  let names = [];
  try { names = fs.readdirSync(dir); } catch { return []; }
  const want = String(ts).split("/").map(canon);
  const out = [];
  for (const n of names) {
    if (excludeIds.includes(n)) continue;
    let f;
    try { f = JSON.parse(fs.readFileSync(path.join(dir, n, "finding.json"), "utf8")); } catch { continue; }
    if (!f || !String(f.ts ?? "").split("/").map(canon).some(x => want.includes(x))) continue;
    out.push({
      id: f.id ?? n, state: f.state, classification: f.classification, summary: String(f.summary ?? "").slice(0, 200),
      ...(f.issueKey ? { issueKey: f.issueKey } : {}), ...(f.runId ? { runId: f.runId } : {}), createdAt: f.createdAt,
      ...(f.dismissReason || f.reason ? { reason: String(f.dismissReason ?? f.reason).slice(0, 200) } : {}),
    });
  }
  return out.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))).slice(0, 5);
}

const firstLine = s => String(s ?? "").replace(/\x1b\[[0-9;]*m/g, "").split("\n").map(l => l.trim()).find(Boolean)?.replace(/\d+/g, "#").slice(0, 160) ?? "";

/** Failed checks that share the same first error line (a common cause: login, site down, shared helper). */
export function sharedErrors(failed) {
  const groups = new Map();
  for (const c of failed) {
    const k = firstLine(c.error ?? c.friendlyError);
    if (!k) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c.title);
  }
  return [...groups.entries()].filter(([, v]) => v.length > 1).map(([error, titles]) => ({ error, titles }));
}

/** All hints for one failed check. */
export function hintsFor(check, { key, ts, failed, excludeIds }) {
  const kind = errorKind(check.error, check.friendlyError);
  const slow = slowSteps(check.steps).slice(0, 5);
  const prior = priorFindings(key, ts, excludeIds);
  const shared = sharedErrors(failed).find(g => g.titles.includes(check.title));
  return {
    errorKind: kind.kind, ...(kind.hint ? { errorHint: kind.hint, errorHintSource: kind.source } : {}),
    ...(slow.length ? { slowSteps: slow } : {}),
    ...(prior.length ? { priorFindings: prior } : {}),
    ...(shared ? { sameErrorAs: shared.titles.filter(t => t !== check.title).slice(0, 10) } : {}),
  };
}

/** Short numbered text of the hints, for the prompt. */
export function hintsText(h) {
  const lines = [];
  if (h.errorHint) lines.push(`Error kind **${h.errorKind}**: ${h.errorHint}`);
  if (h.slowSteps?.length) lines.push(`Slow step(s): ${h.slowSteps.map(s => `"${s.title}" ${s.seconds}s (siblings ~${s.siblingsMedianSeconds}s)`).join("; ")} — a swallowed wait or a step that did nothing; suspect the script here first.`);
  if (h.sameErrorAs?.length) lines.push(`Same error in ${h.sameErrorAs.length} other failed check(s) this run (${h.sameErrorAs.slice(0, 3).join("; ")}): look for ONE common cause (login, site, shared helper) before writing separate system findings.`);
  if (h.priorFindings?.length) lines.push(`Earlier findings for this TS: ${h.priorFindings.map(p => `${p.id} (${p.state}${p.issueKey ? `, ${p.issueKey}` : ""}, ${p.classification}: "${p.summary}")${p.reason ? ` reason "${p.reason}"` : ""}`).join("; ")} — if it is the same symptom it is "known": say so and name it.`);
  return lines;
}

/** Prompt block: the triage method (verdicts + order of checks). */
export const TRIAGE_RULES = `Triage method (another QA's triage method, mapped to our three classes). Judge from the evidence, not from a theory; "probably flaky" is not an answer.
1. **Read the run, not the summary:** the full error text in context.json, the failed step, then LOOK at every evidence image.
2. **Suspect the script before the product** (automation): wrong or non-unique selector, a popup in the way, a helper that returned quietly, a slow step (a swallowed wait), a step that passed without changing anything, the run reading another run's record.
3. **Check the environment causes that look exactly like defects:** site/service down, login throttled after repeated logins (looks like a wrong password), a listing empty because a mandatory date range or the search was not applied, the wrong environment. These are class "data" (test data / setup) with triage verdict "environment", and you name the specific thing — never "the environment was bad".
4. **Check whether it is already known:** the earlier findings listed for that TS (and their QA-Issue). Same symptom → triage verdict "known", "knownAs" = that finding id or issue key; keep the class it had.
5. **Then the product:** "system" only when the screen's words differ from the TS / SRD words and steps 2-4 are ruled out; quote both.
6. **Cannot place it?** Verdict "unresolved", with what you checked in "ruledOut". Class "automation" if the script could still be at fault, else "system". That is an honest answer; a guess is not.`;

export const TRIAGE_VERDICTS = new Set(["defect", "script", "environment", "data", "known", "unresolved"]);
