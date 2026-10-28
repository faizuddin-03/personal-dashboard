// Suite check after Dwarf's jobs (2026-10-27, night enhancement round 1).
// dwarf:build and dwarf:sync finish() call checkAfterDwarf(): it runs
// scripts/pipeline/lib/suite-check.mjs on the ticket's pipeline-built suite,
// saves data/pipeline/work/<KEY>/suite-check.json, and when something blocks
// queues ONE dwarf:chat with input.suiteFix (loop guard: one per job,
// input.suiteFixFor = <jobId>). The fix chat's finish() checks again and,
// if still not clean, leaves Dwarf "waiting" with the list for Faizuddin.
// Idea and reject list: [charmain-repo: .claude/agents/spec-reviewer.md:35-61].

import { runAndSave, checkSummary, suiteCheckRel } from "../lib/suite-check.mjs";
import { suitePaths, scenarioTitles } from "./_dwarf-common.mjs";
import { snapshotAssertions, compareAssertions, guardSummary } from "../lib/assertion-guard.mjs";
import { checkAssertionPlan, assertionPlanRel } from "../lib/assertion-plan.mjs";

/** Runs the check for a ticket whose suite the pipeline built. Returns the result or null. */
export function runSuiteCheck(store, key) {
  const t = store.readTicket(key);
  if (!t?.files?.suiteDir) return null;
  const p = suitePaths(key);
  try {
    return runAndSave(key, { suiteDir: t.files.suiteDir, apiDir: p.apiDir, pageDir: p.pageDir });
  } catch (e) {
    store.appendChat(key, "dwarf", { from: "system", text: `Suite check could not run: ${String(e.message ?? e).slice(0, 300)}` });
    return null;
  }
}

/** After dwarf:build / dwarf:sync: check, record, and ask Dwarf once to fix what blocks. */
export function checkAfterDwarf(ctx, forJobId) {
  const { store, job } = ctx;
  const key = job.key;
  const res = runSuiteCheck(store, key);
  if (!res) return null;
  store.updateTicket(key, t => {
    t.files = { ...t.files, suiteCheck: suiteCheckRel(key) };
    t.events = [{ at: store.nowIso(), text: res.ok ? "Suite check: clean" : `Suite check: ${res.blocking.length} problem(s)` }, ...(t.events ?? [])].slice(0, 100);
  });
  if (res.ok) {
    const minor = res.findings.filter(f => !f.allowed).length;
    store.appendChat(key, "dwarf", { from: "system", text: `Suite check: clean (${res.trace.automated} of ${res.trace.scenarios} TS automated, titles match scenarios.json)${minor ? `; ${minor} minor note(s) in ${suiteCheckRel(key)}` : ""}.`, jobId: job.id });
    return res;
  }
  // Loop guard: one fix chat per job.
  if (store.listJobs({ key }).some(j => j.action === "dwarf:chat" && j.input?.suiteFixFor === forJobId)) return res;
  store.appendChat(key, "dwarf", { from: "system", text: `Suite check found ${res.blocking.length} problem(s). Asked Dwarf to fix them:\n${checkSummary(res, 15)}`, jobId: job.id });
  store.queueJob({
    key, action: "dwarf:chat",
    input: { suiteFix: true, suiteFixFor: forJobId, text: `Suite check found ${res.blocking.length} problem(s) in ${suiteCheckRel(key)}` },
  });
  store.updateTicket(key, t => {
    t.characters.dwarf = { ...t.characters.dwarf, state: "working", note: "Fixing the suite check" };
  });
  return res;
}

/** Prompt opening for the fix chat (dwarf:chat with input.suiteFix). */
export function suiteFixTask(store, key) {
  const res = runSuiteCheck(store, key);
  const body = res ? checkSummary(res, 40) : "1. (the check could not run; run it yourself)";
  return `The dashboard's suite check (scripts/pipeline/lib/suite-check.mjs, saved in ${suiteCheckRel(key)}) found problems in the automation you built for ${key}. This is NOT a message from Faizuddin.

${body}

Fix every problem listed (critical and major first). Where a hit is right on purpose, keep it with a "// pipeline-check: allow <rule> — <reason>" comment on that line or the line above, naming the source suite you copied it from. Never weaken an expected result to make it pass, and never delete a TS's test to make the title check pass: a missing test means write it; an unknown id means rename it to the scenarios.json title.
Then run: node scripts/pipeline/lib/suite-check.mjs ${key} ; npx tsc --noEmit -p <suite dir> ; npx eslint on the files you changed. Do not run the tests against any environment.`;
}

/** finish() of the fix chat: check again; still blocking → Dwarf waits for Faizuddin. */
export function finishSuiteFix(ctx) {
  const { store, job } = ctx;
  const key = job.key;
  const res = runSuiteCheck(store, key);
  if (!res) return;
  if (res.ok) {
    store.appendChat(key, "dwarf", { from: "system", text: "Suite check after the fix: clean.", jobId: job.id });
    store.addEvent(key, "Suite check: clean after Dwarf's fix");
    return;
  }
  store.appendChat(key, "dwarf", { from: "system", text: `Suite check after the fix still finds ${res.blocking.length} problem(s):\n${checkSummary(res, 15)}\n\nTell Dwarf in the chat what to do with them.`, jobId: job.id });
  store.updateTicket(key, t => {
    t.characters.dwarf = { ...t.characters.dwarf, state: "waiting", note: `Suite check: ${res.blocking.length} problem(s) left` };
  });
}

// ── Assertion guard (night round 6) ─────────────────────────────────
// [charmain-repo: docs/qa-principles.md:23-30] — never loosen an assertion to
// turn a red run green. prepare() snapshots, finish() compares.

/** prepare(): remember the suite's assertions in ctx.state (same process as finish). */
export function snapshotForGuard(ctx, own) {
  if (!own?.length) return;
  try { ctx.state.assertSnapshot = snapshotAssertions(own); ctx.state.assertDirs = own; } catch { /* advisory */ }
}

/**
 * finish(): list loosened assertions in Dwarf's chat. Unless Faizuddin's own
 * message asked for assertion changes, Dwarf waits for his OK. Returns the issues.
 */
export function guardAfterDwarf(ctx) {
  const { store, job, state, input } = ctx;
  if (!state?.assertSnapshot) return [];
  let issues;
  try { issues = compareAssertions(state.assertSnapshot, snapshotAssertions(state.assertDirs)); } catch { return []; }
  if (!issues.length) return issues;
  const fromFaiz = job.action === "dwarf:chat" && !input?.suiteFix && !input?.from;
  const asked = fromFaiz && /\b(assert|assertion|expect|matcher|loosen|soft|skip|fixme|remove (the )?check)/i.test(String(input?.text ?? ""));
  store.appendChat(job.key, "dwarf", {
    from: "system",
    text: `Assertion guard: ${issues.length} check(s) were loosened in this job:\n${guardSummary(issues)}\n\nAn assertion is never loosened to make a run pass (QA principle: assertions encode intent). ${asked ? "You asked for assertion changes, so this is a note only." : "Reply \"keep\" if this is right, or ask Dwarf to restore them."}`,
    jobId: job.id,
  });
  store.addEvent(job.key, `Assertion guard: ${issues.length} loosened check(s) after ${job.action}`);
  if (!asked) {
    store.updateTicket(job.key, t => {
      t.characters.dwarf = { ...t.characters.dwarf, state: "waiting", note: `${issues.length} assertion(s) loosened: confirm or restore` };
    });
  }
  return issues;
}

// ── Assertion plan (night round 8) ──────────────────────────────────
// [charmain-repo: .claude/skills/assertion-plan/SKILL.md:95-113] — every case
// names the wrong outcomes it must reject. Advisory: a note, never a failure.

/** finish() of dwarf:build / dwarf:sync: check assertion-plan.json, note the result, link the file. */
export function planAfterDwarf(ctx) {
  const { store, job } = ctx;
  const key = job.key;
  const ids = scenarioTitles(store, key).filter(t => !t.manual).map(t => t.id);
  let res;
  try { res = checkAssertionPlan(key, ids); } catch { return null; }
  if (res.exists) store.updateTicket(key, t => { t.files = { ...t.files, assertionPlan: assertionPlanRel(key) }; });
  store.appendChat(key, "dwarf", {
    from: "system",
    text: res.ok
      ? `Assertion plan: ${res.entries} TS, each with its checks and wrong outcomes (${assertionPlanRel(key)}).`
      : `Assertion plan has ${res.problems.length} gap(s) (${assertionPlanRel(key)}):\n${res.problems.slice(0, 12).map((p, i) => `${i + 1}. ${p}`).join("\n")}${res.problems.length > 12 ? `\n13. … and ${res.problems.length - 12} more` : ""}`,
    jobId: job.id,
  });
  return res;
}
