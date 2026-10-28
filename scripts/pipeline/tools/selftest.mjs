#!/usr/bin/env node
// Pipeline self-test (2026-10-27, night enhancement round 23).
//
//   node scripts/pipeline/tools/selftest.mjs          syntax + import of every pipeline module
//   node scripts/pipeline/tools/selftest.mjs --jobs   … plus a dry run of the main actions on a PIPETEST ticket
//
// Why: twice tonight a code edit left a module that passed `node --check` but
// threw when imported (lost backslashes in a regex), and the ticket API broke
// until it was noticed. "do not rely on this principle to remind you of
// itself … move it into a hook, a gate, or a reviewer's reject row"
// [charmain-repo: docs/qa-principles.md:150-156]. Run this after ANY change
// under scripts/pipeline/ (README §9.21). Read only, except the PIPETEST
// fixture it creates and deletes. Exit 1 on any failure.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PIPE = path.resolve(HERE, "..");
const ROOT = path.resolve(PIPE, "..", "..");
// Modules that run something when imported: syntax-checked only.
const NO_IMPORT = new Set(["run-character.mjs", "fetch.mjs", "miro.mjs", "selftest.mjs", "unit-tests.mjs"]);

const files = [];
for (const d of [PIPE, path.join(PIPE, "actions"), path.join(PIPE, "lib"), path.join(PIPE, "tools")]) {
  for (const f of fs.readdirSync(d)) if (f.endsWith(".mjs") && !f.startsWith("_pt")) files.push(path.join(d, f));
}

let bad = 0;
const fail = (what, msg) => { bad++; console.log(`FAIL ${what}: ${String(msg).split("\n").slice(0, 3).join(" | ")}`); };

for (const f of files) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { fail(`syntax ${path.relative(ROOT, f)}`, e.stderr?.toString() || e.message); }
}
for (const f of files) {
  if (NO_IMPORT.has(path.basename(f))) continue;
  try { await import(pathToFileURL(f).href); }
  catch (e) { fail(`import ${path.relative(ROOT, f)}`, e.message); }
}
console.log(`${files.length} modules: syntax ${bad ? "with failures" : "ok"}, imports checked.`);

// Lint catches what import cannot: "/**/g" in a regex is an empty comment, so
// `s.replace(/**/g, "")` imports fine and throws "g is not defined" only when called.
try {
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["eslint", "scripts/pipeline", "app/api/pipeline", "lib/pipeline"], { cwd: ROOT, stdio: "pipe", shell: process.platform === "win32" });
  console.log("eslint: ok");
} catch (e) { fail("eslint", (e.stdout?.toString() || "") + (e.stderr?.toString() || e.message)); }
// The repo config has no-undef off (TypeScript checks it for .ts); the .mjs files get it here.
const NODE_GLOBALS = "process,console,Buffer,URL,URLSearchParams,setTimeout,clearTimeout,setInterval,clearInterval,setImmediate,fetch,structuredClone,TextDecoder,TextEncoder,AbortController,AbortSignal,queueMicrotask,globalThis,Response,Request,Headers,FormData,Blob,performance,crypto";
try {
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["eslint", "--no-warn-ignored", "--rule", "{\"no-undef\":\"error\"}", "--global", NODE_GLOBALS, "scripts/pipeline/**/*.mjs"], { cwd: ROOT, stdio: "pipe", shell: process.platform === "win32" });
  console.log("eslint no-undef (.mjs): ok");
} catch (e) { fail("eslint no-undef", (e.stdout?.toString() || "") + (e.stderr?.toString() || e.message)); }

// Smoke: call the read-only helpers on every real ticket (nothing is written).
try {
  const lib = name => import(pathToFileURL(path.join(PIPE, "lib", name)).href);
  const { listTickets } = await import(pathToFileURL(path.join(PIPE, "store.mjs")).href);
  const { nextStep } = await lib("next-step.mjs");
  const { openQuestions } = await lib("open-questions.mjs");
  const { deferredQuestions } = await lib("deferred-questions.mjs");
  const { lintScenarios } = await lib("scenario-review.mjs");
  const { errorKind } = await lib("triage-hints.mjs");
  const { isDeferral, normQuestion } = await import(pathToFileURL(path.join(PIPE, "answers.mjs")).href);
  let n = 0;
  for (const t of listTickets()) { nextStep(t); openQuestions(t.key); deferredQuestions(t.key); n++; }
  lintScenarios([{ id: "X_TS01", title: "t", steps: ["a"], expected: ["works correctly"], basis: "observed on staging" }]);
  errorKind("Expected string: \"A\"\nReceived string: \"B\"");
  isDeferral("i will give you this later"); normQuestion("Which **dealer**? (a) A (b) B");
  console.log(`smoke: ok (${n} tickets)`);
} catch (e) { fail("smoke", e.stack || e.message); }

// Unit tests of the helpers (round 39): always, they take a second.
try {
  const out = execFileSync(process.execPath, [path.join(HERE, "unit-tests.mjs")], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120000 });
  console.log(`unit tests: ${out.trim().split("\n").pop()}`);
} catch (e) { fail("unit tests", (e.stdout?.toString() || "").split("\n").filter(l => l.startsWith("FAIL")).join(" | ") || e.message); }

if (process.argv.includes("--jobs")) {
  const store = await import(pathToFileURL(path.join(PIPE, "store.mjs")).href);
  const key = "PIPETEST-990099";
  const w = `data/pipeline/work/${key}`, st = `_reference/tickets/Studying/${key}`;
  const R = p => store.repoPath(p);
  try {
    store.ensureTicket({ key, title: "[eAuto - Test] pipeline self-test" });
    fs.mkdirSync(R(w), { recursive: true }); fs.mkdirSync(R(st), { recursive: true });
    fs.writeFileSync(R(`${st}/${key}-study.md`), "# self-test study\n");
    fs.writeFileSync(R(`${st}/${key}-related-history.md`), "# self-test related history\n");
    fs.writeFileSync(R(`${w}/scenarios.json`), JSON.stringify([{ id: "990099_TS01", section: "A", title: "Status shows Approved", objective: "Verify the status", steps: ["Open the BO detail"], expected: ["BO detail -> **Approved**"], basis: "SRD 2.1" }], null, 2));
    store.updateTicket(key, t => {
      t.files = { study: `${st}/${key}-study.md`, related: `${st}/${key}-related-history.md`, scenariosJson: `${w}/scenarios.json` };
      t.approvedAt = new Date().toISOString();
    });
    store.writeRun({ key, runId: "selftest-r1", runLabel: "Self-test run", finishedAt: new Date().toISOString(), checks: [{ title: "990099_TS01: Status shows Approved", status: "failed", error: "Expected string: \"Approved\"\nReceived string: \"Pending\"" }] });
    store.writeFinding({ id: "selftest-f1", key, ts: "990099_TS01", runId: "selftest-r1", createdAt: new Date().toISOString(), state: "confirmed", classification: "system", summary: "Status stays Pending", tsQuote: "q", evidence: [], actual: "Pending", expected: "Approved" });
    const jobs = [
      ["elf:plan", {}], ["elf:chat", { text: "self-test" }], ["dwarf:build", {}], ["dwarf:chat", { text: "self-test" }],
      ["scout:issue", { findingId: "selftest-f1" }], ["scout:chat", { text: "self-test" }], ["scribe:chat", { text: "self-test" }],
      ["elf:findings", { runId: "selftest-r1" }], ["sage:chat", { text: "self-test" }],
    ];
    for (const [action, input] of jobs) {
      const j = store.createJob({ key, action, input });
      try {
        const out = execFileSync(process.execPath, [path.join(PIPE, "run-character.mjs"), j.id, "--dry"], { encoding: "utf8", timeout: 120000, stdio: ["ignore", "pipe", "pipe"], cwd: ROOT });
        const err = out.split("\n").find(l => /TypeError|ReferenceError|SyntaxError|is not defined|Cannot read prop/.test(l));
        if (err) fail(`dry ${action}`, err); else console.log(`ok   dry ${action} (${out.includes("PROMPT:") ? "prompt built" : out.split("\n").find(l => l.startsWith("SKIP")) ?? "no prompt"})`);
      } catch (e) { fail(`dry ${action}`, e.stderr?.toString() || e.message); }
    }
  } finally {
    for (const d of ["runs", "findings", "chats"]) fs.rmSync(path.join(store.PIPE_DIR, d, key), { recursive: true, force: true });
    for (const f of fs.readdirSync(path.join(store.PIPE_DIR, "jobs")).filter(n => n.includes(key))) fs.rmSync(path.join(store.PIPE_DIR, "jobs", f), { force: true });
    for (const p of [w, st, `_reference/tickets/${key}`, "scripts/eauto-990099"]) fs.rmSync(R(p), { recursive: true, force: true });
    try { store.removeTicket(key); } catch { /* gone */ }
  }
}

console.log(bad ? `SELF-TEST FAILED: ${bad} problem(s)` : "SELF-TEST OK");
process.exit(bad ? 1 : 0);
