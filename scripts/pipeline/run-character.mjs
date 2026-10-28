#!/usr/bin/env node
// QA pipeline job runner (Faizuddin, 2026-10-27).
//
//   node scripts/pipeline/run-character.mjs <jobId> [--dry]
//
// The API writes data/pipeline/jobs/<jobId>.json first, then spawns this
// detached so the job survives dev-server reloads. It takes the
// ticket+character lock, asks the action module (actions/<character>-<verb>.mjs)
// for a prompt, runs Claude Code headless, streams tool activity into the
// job file and the chat, then lets the module finish (files, stage,
// follow-up jobs). --dry prints the claude command and the prompt and exits
// without calling Claude (used by tests).
//
// Every character uses Faizuddin's Claude Code default model: no --model
// (decision 2026-10-27). Design: scripts/pipeline/README.md §2.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import * as store from "./store.mjs";
import { hasQuestions, firstQuestion, NAMES } from "./prompts-common.mjs";
import { splitFinalText, handleAsks, relayAnswer, helpFailed } from "./ask.mjs";
import { autoAnswer } from "./answers.mjs";
import { deferredBlock } from "./lib/deferred-questions.mjs";

const jobId = process.argv[2];
const DRY = process.argv.includes("--dry");
// A queued job waits up to 1 h for the character to be free (tests may shorten it).
const LOCK_WAIT_MS = Number(process.env.PIPELINE_LOCK_WAIT_MS) > 0 ? Number(process.env.PIPELINE_LOCK_WAIT_MS) : 60 * 60 * 1000;
const TIMEOUT_MS = { "dwarf:build": 45 * 60 * 1000 };
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;
const BASE_DISALLOWED = ["WebFetch", "WebSearch", "Agent", "Workflow"];

if (!jobId || jobId.startsWith("--")) {
  console.error("Usage: node scripts/pipeline/run-character.mjs <jobId> [--dry]");
  process.exit(2);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Claude Code ─────────────────────────────────────────────────────
function claudeBin() {
  // Tests point this at a fake CLI (data/pipeline/test/) so no real session is used.
  if (process.env.PIPELINE_CLAUDE_BIN) return process.env.PIPELINE_CLAUDE_BIN;
  const npm = path.join(process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"), "npm", "claude.cmd");
  return fs.existsSync(npm) ? `"${npm}"` : "claude";
}

// shell:true joins args with spaces, so anything with spaces, brackets or
// globs (e.g. "Bash(node *)") must be quoted for cmd.exe.
const q = a => (/^[A-Za-z0-9_.:=\/-]+$/.test(a) ? a : `"${String(a).replace(/"/g, '\\"')}"`);

function buildArgs(tools, session) {
  const allowed = tools?.allowed ?? ["Read", "Glob", "Grep"];
  const disallowed = [...new Set([...BASE_DISALLOWED, ...(tools?.disallowed ?? [])])];
  return [
    "-p", "--output-format", "stream-json", "--verbose",
    "--permission-mode", "acceptEdits",
    ...(session.resume ? ["--resume", session.id] : ["--session-id", session.id]),
    "--allowedTools", ...allowed,
    "--disallowedTools", ...disallowed,
    "--strict-mcp-config",
  ];
}

function toolLine(c) {
  const i = c.input ?? {};
  const file = i.file_path ? path.basename(i.file_path) : i.path ? path.basename(i.path) : "";
  switch (c.name) {
    case "Read": return `Reading ${file}`.trim();
    case "Write": return `Writing ${file}`.trim();
    case "Edit": case "MultiEdit": return `Updating ${file}`.trim();
    case "Glob": return "Looking through files";
    case "Grep": return "Searching notes";
    case "Bash": return `Running: ${String(i.command ?? "").replace(/\s+/g, " ").slice(0, 90)}`;
    case "Skill": return `Using the ${i.skill ?? i.name ?? ""} skill`.trim();
    case "TodoWrite": return "Planning the steps";
    default: return c.name;
  }
}

function killTree(child) {
  if (!child?.pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" }); } catch { /* ignore */ }
  } else {
    try { child.kill("SIGKILL"); } catch { /* ignore */ }
  }
}

let currentChild = null;

/** One `claude -p` run. Resolves { ok, text, error, sessionMissing, activity }. */
function runClaude({ prompt, tools, session, timeoutMs, onActivity }) {
  return new Promise(resolve => {
    const args = buildArgs(tools, session);
    const child = spawn(`${claudeBin()} ${args.map(q).join(" ")}`, {
      cwd: store.ROOT,
      shell: true,
      windowsHide: true,
      env: { ...process.env, CLAUDE_PIPELINE_JOB: jobId },
    });
    currentChild = child;
    let buf = "", stderr = "", result = null, lastText = "", timedOut = false;
    const activity = [];
    const timer = setTimeout(() => { timedOut = true; killTree(child); }, timeoutMs);
    child.stdout.on("data", chunk => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
        if (!line) continue;
        let msg; try { msg = JSON.parse(line); } catch { continue; }
        if (msg.type === "assistant") {
          const texts = [];
          for (const c of msg.message?.content ?? []) {
            if (c.type === "tool_use") {
              const l = toolLine(c);
              if (activity.length < 400) activity.push(l);
              onActivity(l);
            } else if (c.type === "text" && c.text?.trim()) texts.push(c.text);
          }
          if (texts.length) lastText = texts.join("\n");
        } else if (msg.type === "result") {
          result = msg;
        }
      }
    });
    child.stderr.on("data", d => { stderr += d; });
    child.on("error", e => { stderr += String(e?.message ?? e); });
    child.on("close", code => {
      clearTimeout(timer);
      currentChild = null;
      const errText = [stderr, ...(result?.errors ?? [])].join("\n");
      const sessionMissing = session.resume && /No conversation found/i.test(errText);
      const ok = !timedOut && code === 0 && result && !result.is_error;
      const text = (typeof result?.result === "string" && result.result.trim()) ? result.result : lastText;
      resolve({
        ok: !!ok,
        text,
        sessionMissing,
        activity,
        error: ok ? undefined
          : timedOut ? `Timed out after ${Math.round(timeoutMs / 60000)} min`
          : (result?.errors?.join("; ") || (result?.is_error ? result?.result : "") || stderr.trim().slice(-400) || `claude exited with ${code}`),
      });
    });
    child.stdin.end(prompt);
  });
}

// ── job lifecycle ───────────────────────────────────────────────────
let lockTaken = false;
let slotTaken = null; // character slot number (1..SLOTS_PER_CHARACTER) while running
let finished = false;
let job = null;

function takeLock() {
  const lp = store.lockPath(job.key, job.character);
  fs.mkdirSync(path.dirname(lp), { recursive: true });
  try {
    // "wx" fails if the file exists, so two runners cannot both take it.
    fs.writeFileSync(lp, JSON.stringify({ pid: process.pid, jobId: job.id, at: store.nowIso() }), { flag: "wx" });
    lockTaken = true;
    return true;
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
    if (!store.lockHolder(job.key, job.character)) {
      try { fs.unlinkSync(lp); } catch { /* raced */ }
    }
    return false;
  }
}

function dropLock() {
  if (slotTaken !== null) { try { store.dropSlot(job.character, job.id); } catch { /* gone */ } slotTaken = null; }
  if (!lockTaken) return;
  const lp = store.lockPath(job.key, job.character);
  try {
    const held = JSON.parse(fs.readFileSync(lp, "utf8"));
    if (held.jobId === job.id) fs.unlinkSync(lp);
  } catch { /* gone */ }
  lockTaken = false;
}

/** Synchronous cleanup: safe from signal handlers and finally blocks. */
function cleanup(reason) {
  if (!job || finished) { if (job) dropLock(); return; }
  finished = true;
  try {
    const cur = store.readJob(job.id);
    if (cur && (cur.state === "running" || cur.state === "queued")) {
      store.updateJob(job.id, { state: "error", error: reason, activity: `Stopped: ${reason}`, finishedAt: store.nowIso() });
    }
    store.updateTicket(job.key, t => {
      const c = t.characters?.[job.character];
      if (c && c.lastJobId === job.id && c.state === "working") t.characters[job.character] = { ...c, state: "error", note: reason };
    });
  } catch { /* best effort */ }
  // A crashed help job must not leave the asker "waiting for an answer" forever.
  if (isHelpJob()) { try { helpFailed({ store, job, reason }); } catch { /* best effort */ } }
  // sage:apply (sage-batch-apply): a change it never applied goes back to "error".
  releaseApplied(reason);
  dropLock();
}

/** sage:apply only: changes this job held that are still "approved" go to "error" (store.releaseApply). */
function releaseApplied(reason) {
  if (job?.action !== "sage:apply" || DRY) return;
  try { store.releaseApply(job.id, reason); } catch { /* best effort */ }
}

/** "<character>:help" — answering another character's question. */
function isHelpJob() {
  return /:help$/.test(String(job?.action ?? ""));
}

/**
 * Night round 33: Elf judges a red run in its own conversation, not in the one
 * where it wrote the scenarios — "What a red MEANS … fresh context — never the
 * session that watched the run" [charmain-repo: .claude/agents/qa.md:92]; "An
 * agent that both runs a suite and sorts its own failures starts describing what
 * it expected rather than what happened" [charmain-repo: .claude/agents/qa-runner.md:16-19].
 * The slot is kept per ticket (triage of later runs continues it), and every
 * follow-up of a slotted job uses the same slot.
 */
const SESSION_SLOT = { "elf:findings": "triageSessionId" };
function sessionSlotFor(j, t) {
  if (SESSION_SLOT[j.action]) return SESSION_SLOT[j.action];
  if (/:help$/.test(j.action)) return "sessionId";
  try {
    // Continuation of a slotted job: another character's answer or the Sage's.
    const asker = j.input?.askJobId ? store.readJob(j.input.askJobId) : null;
    if (asker && asker.character === j.character) return asker.sessionSlot ?? SESSION_SLOT[asker.action] ?? "sessionId";
    // Faizuddin replying while a slotted job of this character waits for him.
    if (/:chat$/.test(j.action) && !j.input?.from) {
      const cur = t.characters?.[j.character];
      const last = cur?.state === "waiting" && cur.lastJobId ? store.readJob(cur.lastJobId) : null;
      if (last && last.id !== j.id) return last.sessionSlot ?? SESSION_SLOT[last.action] ?? "sessionId";
    }
  } catch { /* main conversation */ }
  return "sessionId";
}

for (const sig of ["SIGTERM", "SIGINT", "SIGHUP", "SIGBREAK"]) {
  try {
    process.on(sig, () => {
      killTree(currentChild);
      cleanup(`Ended by ${sig}`);
      process.exit(1);
    });
  } catch { /* signal not supported here */ }
}
process.on("uncaughtException", e => {
  console.error(e);
  killTree(currentChild);
  cleanup(String(e?.message ?? e).slice(0, 300));
  process.exit(1);
});

function stoppedByUser() {
  return store.readJob(job.id)?.state === "stopped";
}

async function main() {
  job = store.readJob(jobId);
  if (!job) { console.error(`No job ${jobId}`); process.exit(2); }
  if (job.state !== "queued" && !DRY) { console.error(`Job ${jobId} is ${job.state}, not queued`); return; }

  const modFile = path.join(store.ROOT, "scripts", "pipeline", "actions", `${job.action.replace(":", "-")}.mjs`);
  if (!fs.existsSync(modFile)) throw new Error(`No action module for ${job.action} yet (${path.basename(modFile)})`);
  const mod = (await import(pathToFileURL(modFile).href)).default;

  // Debounce (Sage, 2026-10-27): a module may wait before taking the lock,
  // e.g. sage:learn starts only after the ticket has been quiet for 2 min.
  if (!DRY && typeof mod.waitUntilReady === "function") {
    await mod.waitUntilReady({
      job, store, stopped: stoppedByUser,
      activity: text => { try { store.updateJob(job.id, cur => (cur.state === "queued" ? { activity: text } : {})); } catch { /* next one */ } },
    });
    if (stoppedByUser()) { finished = true; return; }
  }

  // Wait for the character to be free on this ticket (one job at a time).
  if (!DRY) {
    const waitStart = Date.now();
    let told = false;
    while (!takeLock()) {
      if (stoppedByUser()) { finished = true; return; }
      if (Date.now() - waitStart > LOCK_WAIT_MS) throw new Error(`Waited over an hour for ${job.character} to finish another job`);
      if (!told) { store.updateJob(job.id, { activity: `Waiting for ${job.character} to finish the current job`, pid: process.pid }); told = true; }
      await sleep(3000);
    }
    if (stoppedByUser()) { finished = true; dropLock(); return; }

    // At most two of this character at once, across tickets (2026-10-27).
    let toldSlot = false;
    while ((slotTaken = store.takeSlot(job.character, job.id)) === null) {
      if (stoppedByUser()) { finished = true; dropLock(); return; }
      if (Date.now() - waitStart > LOCK_WAIT_MS) throw new Error(`Waited over an hour for a free ${job.character}`);
      if (!toldSlot) {
        store.updateJob(job.id, { activity: `Waiting for a free ${job.character} (${store.slotsFor?.(job.character) ?? store.SLOTS_PER_CHARACTER} already working)`, pid: process.pid });
        toldSlot = true;
      }
      await sleep(3000);
    }
    store.updateJob(job.id, { slot: slotTaken });
  }

  // System job (sage-apply-any-key, 2026-10-27): no pipeline ticket. An
  // in-memory holder stands in; it is never written, so every updateTicket /
  // addEvent below is a no-op and nothing appears on the board. A fresh
  // session each time (none is stored). README §8.3.
  const ticket = job.system && job.key === store.SYSTEM_KEY && store.SYSTEM_ACTIONS.includes(job.action)
    ? { key: job.key, title: "Knowledge base (no pipeline ticket)", system: true, files: {}, characters: {} }
    : store.readTicket(job.key);
  if (!ticket) throw new Error(`${job.key} is not in the pipeline`);
  // Night round 33: some actions keep their own conversation (SESSION_SLOT), and
  // the follow-ups of such a job (another character's answer, the Sage's
  // answer, or Faizuddin's reply while it waits) continue that conversation.
  const slot = sessionSlotFor(job, ticket);
  const prevSession = ticket.characters?.[job.character]?.[slot];
  let session = prevSession ? { id: prevSession, resume: true } : { id: crypto.randomUUID(), resume: false };

  let lastWrite = 0, pendingActivity = null, flushTimer = null;
  const flushActivity = () => {
    flushTimer = null;
    if (pendingActivity == null) return;
    const a = pendingActivity; pendingActivity = null; lastWrite = Date.now();
    try { store.updateJob(job.id, cur => (cur.state === "running" ? { activity: a } : {})); } catch { /* next one */ }
  };
  const activity = text => {
    pendingActivity = text;
    if (Date.now() - lastWrite > 400) flushActivity();
    else if (!flushTimer) flushTimer = setTimeout(flushActivity, 400);
  };
  const ctx = {
    job, ticket, input: job.input, store, dry: DRY, state: {},
    character: job.character,
    log: text => { if (!DRY) store.addEvent(job.key, text); console.log(`[${job.key}] ${text}`); },
    activity: text => { if (!DRY) activity(text); },
  };

  if (!DRY) {
    const started = store.updateJob(job.id, { state: "running", activity: "Getting ready", pid: process.pid, sessionId: session.id });
    // sage-batch-apply: approvals may have joined this job while it was queued;
    // the switch to running closes the batch, so take the input as it is now.
    if (started) { job.input = started.input; ctx.input = started.input; }
    store.updateTicket(job.key, t => {
      t.characters[job.character] = { ...(t.characters[job.character] ?? {}), state: "working", lastJobId: job.id, note: undefined };
    });
  }

  const prep = await mod.prepare(ctx);
  if (prep?.skip) {
    if (DRY) {
      console.log(`SKIP: ${prep.skip}`);
      if (store.readJob(job.id)?.state === "queued") store.updateJob(job.id, { state: "done", activity: `Dry run skipped: ${prep.skip}`, finishedAt: store.nowIso() });
      finished = true;
      return;
    }
    const reply = prep.reply ?? prep.skip;
    store.appendChat(job.key, job.character, { from: prep.reply ? job.character : "system", text: reply, jobId: job.id });
    store.updateTicket(job.key, t => {
      t.characters[job.character] = { ...t.characters[job.character], state: prep.state ?? (hasQuestions(reply) ? "waiting" : "idle"), note: prep.note ?? firstQuestion(reply) };
    });
    store.updateJob(job.id, { state: "done", activity: prep.skip, finishedAt: store.nowIso() });
    ctx.log(`${job.action}: ${prep.skip}`);
    finished = true;
    if (isHelpJob()) helpFailed({ store, job, reason: prep.skip });
    releaseApplied(prep.skip);
    return;
  }

  // Night round 17: questions Faizuddin parked for this character ("dwarf can
  // ask me again later") go into its next prompt. Advisory: never blocks a job.
  if (!isHelpJob()) {
    try {
      const parked = deferredBlock(job.key, job.character);
      if (parked && typeof prep.prompt === "string") prep.prompt = `${prep.prompt}\n\n${parked}`;
    } catch (e) { console.error(`deferred questions check failed: ${e?.message ?? e}`); }
  }

  // A module may ask for more time (a sage:apply batch: a few minutes per change).
  const timeoutMs = Number(prep.timeoutMs) > 0 ? Number(prep.timeoutMs) : TIMEOUT_MS[job.action] ?? DEFAULT_TIMEOUT_MS;
  const tools = prep.tools ?? (typeof mod.tools === "function" ? mod.tools(ctx) : mod.tools);
  if (DRY) {
    console.log("COMMAND:");
    console.log(`${claudeBin()} ${buildArgs(tools, session).map(q).join(" ")}`);
    console.log(`TIMEOUT_MIN: ${timeoutMs / 60000}`);
    console.log("PROMPT:");
    console.log(prep.prompt);
    if (store.readJob(job.id)?.state === "queued") store.updateJob(job.id, { state: "done", activity: "Dry run: Claude was not called", finishedAt: store.nowIso() });
    finished = true;
    return;
  }

  // Store the session id before the run so a crash mid-run still resumes it next time.
  store.updateTicket(job.key, t => { t.characters[job.character][slot] = session.id; });
  if (slot !== "sessionId") store.updateJob(job.id, { sessionSlot: slot });
  activity("Thinking");
  let r = await runClaude({ prompt: prep.prompt, tools, session, timeoutMs, onActivity: activity });
  let notes = [];
  if (!r.ok && r.sessionMissing) {
    // The saved session is gone (cleared or another machine): start fresh.
    session = { id: crypto.randomUUID(), resume: false };
    notes.push(`The earlier ${job.character} session for this ticket was missing, so a new one was started.`);
    store.updateTicket(job.key, t => { t.characters[job.character][slot] = session.id; });
    store.updateJob(job.id, { sessionId: session.id });
    r = await runClaude({ prompt: prep.prompt, tools, session, timeoutMs, onActivity: activity });
  }
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }

  if (stoppedByUser()) { finished = true; dropLock(); return; }

  // Ask-each-other (2026-10-27): ```ask blocks are handled below, not shown raw.
  const split = r.ok ? splitFinalText(r.text ?? "", job.character) : { text: r.text, asks: [], invalid: [] };
  const helpFor = isHelpJob() ? job.input ?? {} : null;
  const helpLine = helpFor && NAMES[helpFor.from] ? `**Answering ${NAMES[helpFor.from]}:** ${String(helpFor.question ?? "").slice(0, 300)}\n\n` : "";
  const text = r.ok ? `${helpLine}${split.text || "(No reply text.)"}` : `Could not finish: ${r.error}`;
  store.appendChat(job.key, job.character, {
    from: r.ok ? job.character : "system",
    text: notes.length ? `${notes.map((n, i) => `${i + 1}. ${n}`).join("\n")}\n\n${text}` : text,
    jobId: job.id,
    activity: r.activity,
  });
  // Default character state; the module's finish() may override it.
  store.updateTicket(job.key, t => {
    t.characters[job.character] = r.ok
      ? { ...t.characters[job.character], state: hasQuestions(r.text) ? "waiting" : "idle", note: firstQuestion(r.text) }
      : { ...t.characters[job.character], state: "error", note: r.error?.slice(0, 200) };
  });

  let finishError;
  try {
    await mod.finish?.(ctx, { ok: r.ok, text: r.text ?? "" });
  } catch (e) {
    finishError = String(e?.message ?? e).slice(0, 300);
    store.appendChat(job.key, job.character, { from: "system", text: `After-step failed: ${finishError}`, jobId: job.id });
  }

  const ok = r.ok && !finishError;
  store.updateJob(job.id, {
    state: ok ? "done" : "error",
    activity: ok ? "Finished" : `Stopped: ${r.error ?? finishError}`,
    finishedAt: store.nowIso(),
    ...(ok ? {} : { error: r.error ?? finishError }),
  });
  ctx.log(`${job.action} ${ok ? "finished" : `failed: ${r.error ?? finishError}`}`);
  finished = true;
  // finish() sets applied / error per change; anything it did not reach (an
  // after-step that threw) goes back to "error".
  releaseApplied(ok ? "the Sage finished without applying it" : (r.error ?? finishError));

  // Ask-each-other: pass questions on, and hand a helper's answer back.
  let queuedAsks = 0;
  if (ok) {
    try {
      if (split.asks.length || split.invalid.length) {
        queuedAsks = handleAsks({ store, job, asks: split.asks, invalid: split.invalid, finalText: r.text ?? "" }).queued.length;
      }
      // A helper that asked someone else answers later, in its follow-up help job.
      if (helpFor && !queuedAsks) relayAnswer({ store, job, answer: split.text ?? "" });
    } catch (e) {
      store.appendChat(job.key, job.character, { from: "system", text: `Could not pass the question or answer on: ${String(e?.message ?? e).slice(0, 300)}`, jobId: job.id });
      if (helpFor) helpFailed({ store, job, reason: String(e?.message ?? e) });
    }
  } else if (helpFor) {
    helpFailed({ store, job, reason: r.error ?? finishError ?? "unknown error" });
  }

  // Answer registry (Faizuddin, 2026-10-27: no repeated questions): questions
  // he already answered are answered from data/pipeline/answers.json and the
  // character continues; only new ones keep it "waiting" for him.
  if (ok && !queuedAsks) {
    try {
      const auto = autoAnswer({ store, job, text: r.text ?? "" });
      if (auto.continued) console.log(`[${job.key}] Sage answered ${auto.answered.length} question(s) from earlier answers`);
    } catch (e) {
      console.error(`answer registry check failed: ${e?.message ?? e}`);
    }
  }

  // Sage (2026-10-27): every finished job is something the knowledge keeper
  // may learn from. Never from the Sage's own jobs or jobs it started (no loops).
  if (ok && job.character !== "sage") {
    store.noteForSage(job.key, {
      type: "job", action: job.action, character: job.character, jobId: job.id, by: job.character,
      text: String(split.text ?? "").slice(0, 3000),
    });
  }
}

try {
  await main();
} catch (e) {
  const msg = String(e?.message ?? e).slice(0, 300);
  console.error(e);
  if (job && !DRY) {
    try { store.appendChat(job.key, job.character, { from: "system", text: `Could not finish: ${msg}`, jobId: job.id }); } catch { /* ignore */ }
  }
  if (!DRY) cleanup(msg);
  process.exitCode = 1;
} finally {
  if (!DRY) cleanup("The job ended without finishing");
  else finished = true;
}
