#!/usr/bin/env node
// Unit tests for the night-of-2026-10-27 pipeline helpers (night enhancement round 39).
//
//   node scripts/pipeline/tools/unit-tests.mjs        (also run by selftest.mjs --unit)
//
// Pure functions are tested in memory; helpers that read the pipeline store use
// a PIPETEST-9902xx ticket that is created and deleted here. Exit 1 on a failure.
// "A leg you cannot make fail on purpose is a leg whose pass means nothing"
// [charmain-repo: .claude/skills/test-evidence-recording/SKILL.md:83]: each
// check below has a case that must fail and one that must pass.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PIPE = path.resolve(HERE, "..");
const imp = rel => import(pathToFileURL(path.join(PIPE, rel)).href);

const store = await imp("store.mjs");
const answers = await imp("answers.mjs");
const { quoteIn } = await imp("lib/quote-check.mjs");
const { lintDraft } = await imp("lib/qa-issue.mjs");
const { compareAssertions } = await imp("lib/assertion-guard.mjs");
const { lintScenarios } = await imp("lib/scenario-review.mjs");
const { errorKind } = await imp("lib/triage-hints.mjs");
const { checkTsIds, canonTs, newerResult, markFindingsAfterRun } = await imp("lib/latest-run.mjs");
const { voidRun, unvoidRun, voidedFor, readVoided } = await imp("lib/voided-runs.mjs");
const { extractTeamQuestions } = await imp("lib/open-questions.mjs");
const { incomingMessage, hasQuestions } = await imp("prompts-common.mjs");
const { scanFile } = await imp("lib/suite-check.mjs");
const { snapshotRequirements, passRequirementChange } = await imp("lib/requirement-change.mjs");

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`ok   ${name}`); }
  catch (e) { failed++; console.log(`FAIL ${name}: ${String(e.message).split("\n")[0]}`); }
}

// ── pure helpers ──────────────────────────────────────────────────────
await test("answers: deferral-only replies are not answers", () => {
  assert.equal(answers.isDeferral("i will give you this later. dwarf can ask me again later when he needs it"), true);
  assert.equal(answers.isDeferral("2. ignore first. i will come back to this later"), true);
  assert.equal(answers.isDeferral("cron internal unknown. ignore first, but we usually set every 30 mins for testing"), false);
  assert.equal(answers.isDeferral("staging"), false);
});
await test("answers: options are dropped and short repeats match", () => {
  assert.equal(answers.normQuestion("Dealer A or B? (a) A (b) B"), answers.normQuestion("Dealer A or B?"));
  const list = [{ id: "a", state: "active", scope: "global", question: "Which environment should TS use?", answer: "staging" },
    { id: "d", state: "active", scope: "global", question: "Can you capture the edit form of one row?", answer: "i will give you this later" }];
  assert.equal(answers.bestAnswer("Which environment should the TS use?", { key: "K", title: "" }, list)?.match, true);
  assert.equal(answers.bestAnswer("Which portal should TS use?", { key: "K", title: "" }, list)?.match, false);
  assert.ok(!answers.bestAnswer("Can you capture the edit form of one row?", { key: "K", title: "" }, list)?.match, "a deferral must not answer");
});
await test("answers: cross-scope match is found, out-of-scope only", () => {
  const list = [{ id: "c", state: "active", scope: "ticket:EAINT-1", question: "How is the cron job triggered on staging for the reminder emails?", answer: "ask the developer" }];
  assert.ok(answers.bestAnswerAnyScope("How is the cron job triggered on staging for the emails?", list));
  assert.ok(!answers.bestAnswer("How is the cron job triggered on staging for the emails?", { key: "EAINT-2", title: "" }, list)?.match);
});
await test("quote-check: verbatim passes, reworded fails", () => {
  const src = "Expected:\n1. BO detail -> Status shows **Cancelled**";
  assert.equal(quoteIn("BO detail -> Status shows Cancelled", src).ok, true);
  assert.equal(quoteIn("status changes to cancelled on the BO detail", src).ok, false);
  assert.equal(quoteIn("Nothing on this", "").ok, true);
});
await test("qa-issue lintDraft: invented ID and long Actual flagged, clean draft passes", () => {
  const bad = lintDraft({ title: "[eAuto - UCD] Invoice wrong for BR69005758", actual: "The invoice page still shows only one line instead of the two lines the SRD needs", expected: "Shows 2 lines", steps: ["a"], stagingIds: ["Ref = ZZ999"] }, "BR69005758");
  assert.ok(bad.some(w => /ZZ999/.test(w)) && bad.some(w => /Title/.test(w)) && bad.some(w => /Actual has/.test(w)));
  assert.deepEqual(lintDraft({ title: "[eAuto - UCD] Invoice still shows 1 line", actual: "Invoice still shows !!1 line!!", expected: "Shows ++2 lines++ (SRD v1.2 §2.2.5)", steps: ["a", "b", "c"], stagingIds: ["Ref = BR1"] }, "br1"), []);
});
await test("assertion-guard: loosened, removed and softened are caught; a new value is not", () => {
  const before = { "t.spec.ts": { "X_TS01: a": ["await expect(page.locator('#s')).toHaveText('Approved')", "await expect(page.locator('#a')).toHaveText('RM 1')", "await expect(page.locator('#v')).toHaveValue('x')"] } };
  const after = { "t.spec.ts": { "X_TS01: a": ["await expect(page.locator('#s')).toContainText('Appr')", "await expect(page.locator('#v')).toHaveValue('y')", "await expect.soft(page.locator('#n')).toBeVisible()"] } };
  const kinds = compareAssertions(before, after).map(x => x.kind).sort();
  assert.deepEqual(kinds, ["removed", "softened", "weakened"]);
  assert.deepEqual(compareAssertions(before, before), []);
});
await test("scenario lint: vague and observed basis flagged; sourced TS clean", () => {
  const mk = (id, extra) => ({ id, section: "A", title: id, steps: ["a"], expected: ["BO -> **X**"], basis: "SRD 1", priority: "P1", ...extra });
  const w = lintScenarios([mk("T1", { expected: ["works correctly"] }), mk("T2", { basis: "observed on staging" }), mk("T3")]).warnings;
  assert.ok(w.some(x => x.id === "T1" && x.kind === "vague"));
  assert.ok(w.some(x => x.id === "T2" && x.kind === "observed-basis"));
  assert.ok(!w.some(x => x.id === "T3"));
});
await test("triage errorKind: value mismatch vs locator timeout vs card reader", () => {
  assert.equal(errorKind("Expected string: \"A\"\nReceived string: \"B\"").kind, "value-mismatch");
  assert.equal(errorKind("locator.click: Timeout 30000ms exceeded waiting for locator('#x')").kind, "locator-timeout");
  assert.equal(errorKind("The card reader is unavailable").kind, "card-reader");
});
await test("latest-run: TS ids and canonical form", () => {
  assert.deepEqual(checkTsIds({ title: "12339_TS19/TS20: t" }), ["TS19", "TS20"]);
  assert.equal(canonTs("EAINT-12153-TS03"), "TS3");
});
await test("open questions: team questions parsed; a team-only reply does not wait", () => {
  const t = "1. x\n\n## Questions for the team\n1. Who can cancel? (for: the BA)\n2. Does staging email? (for: the developer)\n";
  assert.equal(extractTeamQuestions(t).length, 2);
  assert.equal(hasQuestions(t), false);
});
await test("prompts: pasted material is check-only", () => {
  assert.match(incomingMessage({ text: "see", file: "_reference/x.html" }), /CHECK/);
  assert.doesNotMatch(incomingMessage({ text: "see" }), /CHECK/);
});
await test("suite-check rules: deep link and internal assert, login goto kept", () => {
  const dir = path.join(store.PIPE_DIR, "work", "PIPETEST-990201", "s", "pages");
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, "P.js");
  fs.writeFileSync(f, "await page.goto(`${C.baseUrl}/view/ucd/x.do`);\nawait page.goto(`${C.baseUrl}/public/login/`);\nexpect(response.status()).toBe(200);\n");
  try {
    const rules = scanFile(f, path.relative(path.resolve(PIPE, "..", ".."), path.join(store.PIPE_DIR, "work", "PIPETEST-990201", "s")).split(path.sep).join("/")).map(x => `${x.rule}:${x.line}`);
    assert.deepEqual(rules.sort(), ["deep-link:1", "internal-assert:3"]);
  } finally { fs.rmSync(path.join(store.PIPE_DIR, "work", "PIPETEST-990201"), { recursive: true, force: true }); }
});

await test("requirement change: changed brief queues Elf once; unchanged or no scenarios does not", () => {
  const hashes = { "s.md": "a", "r.md": "b", "data/pipeline/work/K-1/brief.json": "c" };
  const queued = [];
  const fake = (scenarios, active = []) => ({
    hashFile: rel => hashes[rel] ?? null,
    readTicket: () => ({ key: "K-1", files: scenarios ? { scenariosJson: "package.json" } : {} }),
    repoPath: rel => path.resolve(PIPE, "..", "..", rel),
    listJobs: () => active,
    queueJob: j => queued.push(j),
    appendChat: () => {}, addEvent: () => {},
  });
  const run = (s, change) => {
    const ctx = { store: s, job: { key: "K-1" }, ticket: { key: "K-1", files: { study: "s.md", related: "r.md" } }, state: {} };
    snapshotRequirements(ctx);
    if (change) hashes[change] += "x";
    return passRequirementChange(ctx, "scout");
  };
  assert.equal(run(fake(true), null), false, "nothing changed");
  assert.equal(run(fake(false), "s.md"), false, "no scenarios yet");
  assert.equal(run(fake(true, [{ action: "elf:chat", state: "queued", input: { requirementChange: true } }]), "r.md"), false, "already queued");
  assert.equal(run(fake(true), "data/pipeline/work/K-1/brief.json"), true);
  assert.equal(queued.length, 1);
  assert.equal(queued[0].action, "elf:chat");
  assert.deepEqual(queued[0].input.changed, ["data/pipeline/work/K-1/brief.json"]);
});

// ── store-backed helpers (PIPETEST fixture) ───────────────────────────
const key = "PIPETEST-990202";
try {
  store.ensureTicket({ key, title: "unit tests" });
  store.writeRun({ key, runId: "r1", finishedAt: "2026-10-27T10:00:00Z", checks: [{ title: "990202_TS01: a", status: "failed" }, { title: "990202_TS02: b", status: "failed" }] });
  const f1 = store.writeFinding({ id: "f1", key, ts: "990202_TS01", runId: "r1", createdAt: "2026-10-27T10:01:00Z", state: "confirmed", classification: "system", summary: "s", tsQuote: "", evidence: [], actual: "a", expected: "b" });
  const f2 = store.writeFinding({ id: "f2", key, ts: "990202_TS01/TS02", runId: "r1", createdAt: "2026-10-27T10:01:00Z", state: "open", classification: "system", summary: "s", tsQuote: "", evidence: [], actual: "a", expected: "b" });
  const r2 = store.writeRun({ key, runId: "r2", finishedAt: "2026-10-27T11:00:00Z", checks: [{ title: "990202_TS01: a", status: "passed" }] });

  await test("latest-run: newer pass found; a multi-TS finding needs every TS", () => {
    assert.equal(newerResult(key, f1)?.status, "passed");
    assert.equal(newerResult(key, f2)?.status, "partial");
    assert.deepEqual(markFindingsAfterRun(key, r2).marked, ["f1"]);
  });
  await test("voided runs: a voided run is ignored, a short reason refused", () => {
    assert.throws(() => voidRun({ key, runId: "r2", reason: "short", by: "unit" }));
    voidRun({ key, runId: "r2", reason: "Run against the wrong instance (unit test)", by: "unit" });
    assert.ok(voidedFor(key, "r2"));
    assert.equal(newerResult(key, f1), null);
    assert.equal(unvoidRun({ key, runId: "r2", by: "unit" }), true);
    assert.equal(newerResult(key, f1)?.status, "passed");
  });
} finally {
  for (const d of ["runs", "findings", "chats", "work"]) fs.rmSync(path.join(store.PIPE_DIR, d, key), { recursive: true, force: true });
  try { store.removeTicket(key); } catch { /* gone */ }
  // Leave no store file behind if this run created it.
  try { if (!readVoided().length) fs.rmSync(path.join(store.PIPE_DIR, "voided-runs.json"), { force: true }); } catch { /* keep */ }
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
