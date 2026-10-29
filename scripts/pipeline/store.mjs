// QA pipeline shared store (Faizuddin, 2026-10-27).
//
// Plain ESM so the job runner (scripts/pipeline/run-character.mjs), the Scout
// (scripts/agents/run-agent.mjs) and the Next API routes
// (`import ... from "@/scripts/pipeline/store.mjs"`) all read and write
// data/pipeline/ the same way. Types: store.d.mts + lib/pipeline/types.ts.
// Design: scripts/pipeline/README.md §6.1.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// ── paths ───────────────────────────────────────────────────────────
function findRoot() {
  // Bundled into a Next route, import.meta.url may not point at the source
  // file, so check the guess and fall back to the server's cwd (repo root).
  try {
    const guess = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
    if (fs.existsSync(path.join(guess, "scripts", "pipeline", "store.mjs"))) return guess;
  } catch { /* not a file URL */ }
  return process.cwd();
}

export const ROOT = findRoot();
export const PIPE_DIR = path.join(/*turbopackIgnore: true*/ ROOT, "data", "pipeline");
const AGENTS_DIR = path.join(/*turbopackIgnore: true*/ ROOT, "data", "agents");
const RUNNER = path.join(/*turbopackIgnore: true*/ ROOT, "scripts", "pipeline", "run-character.mjs");

const CHARACTERS = ["scout", "scribe", "elf", "dwarf", "sage"];
const ACTIONS = [
  "scribe:related", "elf:plan", "elf:chat", "elf:build", "dwarf:build",
  "dwarf:chat", "dwarf:sync", "elf:findings", "scout:issue", "scout:chat", "scribe:chat",
  // Ask-each-other (2026-10-27): answer another character's question (scripts/pipeline/ask.mjs).
  "scout:help", "scribe:help", "elf:help", "dwarf:help",
  // Sage, the knowledge keeper (2026-10-27): README §8.
  "sage:learn", "sage:apply", "sage:chat", "sage:help",
];
export const KEY_RE = /^[A-Z][A-Z0-9]+-\d+$/;

/**
 * Holder key for system jobs that belong to no pipeline ticket (night of
 * 2026-10-27, sage-apply-any-key): sage:apply for a knowledge change proposed
 * for a studying-only ticket or the knowledge audit. No ticket file is ever
 * written for it, so it never shows on /pipeline, the board, counts or the
 * ticket scope filter; its jobs carry `system: true` and are left out of
 * GET /api/pipeline/jobs. README §8.3.
 */
export const SYSTEM_KEY = "KNOWLEDGE-0";
/** Actions that may run as a system job (no pipeline ticket). */
export const SYSTEM_ACTIONS = ["sage:apply"];

/** Absolute path for a repo-relative path (forward or back slashes). */
export function repoPath(rel) {
  return path.resolve(ROOT, String(rel ?? ""));
}

/** Repo-relative path with forward slashes. */
export function relPath(abs) {
  return path.relative(ROOT, abs).split(path.sep).join("/");
}

const SAFE_ROOTS = ["data/pipeline", "_reference/tickets", "public/qa-artifacts"];

/**
 * Resolves a repo-relative path that must sit under one of the readable
 * roots. Throws on anything else (traversal, absolute paths elsewhere).
 */
export function safeResolve(rel) {
  if (typeof rel !== "string" || !rel.trim() || rel.includes("\0")) throw new Error("No path given");
  const abs = path.resolve(ROOT, rel.replace(/\\/g, "/"));
  for (const r of SAFE_ROOTS) {
    const base = path.resolve(ROOT, r);
    if (abs === base || abs.startsWith(base + path.sep)) return abs;
  }
  throw new Error(`Path not allowed: ${rel}`);
}

export const nowIso = () => new Date().toISOString();

// ── small file helpers ──────────────────────────────────────────────
function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Write via temp file + rename; retries because Windows refuses a rename while a reader holds the file. */
function writeJsonAtomic(p, v) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.${process.pid}.${crypto.randomBytes(3).toString("hex")}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(v, null, 2));
  for (let i = 0; ; i++) {
    try { fs.renameSync(tmp, p); return; } catch (e) {
      if (i >= 20) { try { fs.unlinkSync(tmp); } catch { /* ignore */ } throw e; }
      sleepSync(25);
    }
  }
}

/**
 * Cross-process mutex for a read-modify-write: a lock directory next to the
 * file (mkdir is atomic). Stale after 10 s so a crashed writer never blocks.
 */
function withFileLock(p, fn) {
  const lock = `${p}.lck`;
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const start = Date.now();
  for (;;) {
    try { fs.mkdirSync(lock); break; } catch (e) {
      if (e.code !== "EEXIST") throw e;
      try { if (Date.now() - fs.statSync(lock).mtimeMs > 10_000) { fs.rmdirSync(lock); continue; } } catch { /* gone already */ }
      if (Date.now() - start > 5_000) throw new Error(`Busy: ${path.basename(p)} is locked`);
      sleepSync(20);
    }
  }
  try { return fn(); } finally { try { fs.rmdirSync(lock); } catch { /* ignore */ } }
}

function checkKey(key) {
  if (typeof key !== "string" || !KEY_RE.test(key)) throw new Error(`Not a ticket key: ${key}`);
  return key;
}

// ── tickets ─────────────────────────────────────────────────────────
const ticketPath = key => path.join(PIPE_DIR, "tickets", `${checkKey(key)}.json`);

export function readTicket(key) {
  return readJson(ticketPath(key), null);
}

export function writeTicket(t) {
  const next = { ...t, updatedAt: nowIso() };
  writeJsonAtomic(ticketPath(t.key), next);
  return next;
}

/** Atomic read-modify-write. fn may mutate the ticket or return a new one. Returns the saved ticket, or null if missing. */
export function updateTicket(key, fn) {
  const p = ticketPath(key);
  return withFileLock(p, () => {
    const cur = readJson(p, null);
    if (!cur) return null;
    const out = fn(cur) ?? cur;
    return writeTicket(out);
  });
}

export function listTickets() {
  const dir = path.join(PIPE_DIR, "tickets");
  let names = [];
  try { names = fs.readdirSync(dir).filter(n => n.endsWith(".json")); } catch { return []; }
  return names
    .map(n => readJson(path.join(dir, n), null))
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function idleCharacters() {
  return Object.fromEntries(CHARACTERS.map(c => [c, { state: "idle" }]));
}

/** Creates the ticket with defaults if missing; returns the (existing or new) ticket. */
export function ensureTicket({ key, title, addedBy = "faizuddin", jiraStatus }) {
  checkKey(key);
  if (key === SYSTEM_KEY) throw new Error(`${SYSTEM_KEY} is the system holder, not a ticket`);
  const p = ticketPath(key);
  return withFileLock(p, () => {
    const cur = readJson(p, null);
    if (cur) return cur;
    const at = nowIso();
    const studyRel = `_reference/tickets/Studying/${key}/${key}-study.md`;
    const t = {
      key,
      title: title ?? key,
      ...(jiraStatus ? { jiraStatus } : {}),
      addedAt: at,
      updatedAt: at,
      addedBy,
      stage: "studied",
      files: fs.existsSync(repoPath(studyRel)) ? { study: studyRel } : {},
      statusSync: true,
      characters: idleCharacters(),
      findings: [],
      issues: [],
      events: [{ at, text: `Added to the pipeline by ${addedBy === "scout" ? "Scout" : "Faizuddin"}` }],
    };
    writeJsonAtomic(p, t);
    return t;
  });
}

/** Removes the ticket from the pipeline. Its files (studies, chats, work, findings) are kept. */
export function removeTicket(key) {
  try { fs.unlinkSync(ticketPath(key)); return true; } catch { return false; }
}

/** Adds an event (newest first, max 100). Returns the ticket or null. */
export function addEvent(key, text) {
  return updateTicket(key, t => {
    t.events = [{ at: nowIso(), text }, ...(t.events ?? [])].slice(0, 100);
  });
}

// ── chats ───────────────────────────────────────────────────────────
const chatPath = (key, c) => path.join(PIPE_DIR, "chats", checkKey(key), `${c}.jsonl`);

export function appendChat(key, character, entry) {
  if (!CHARACTERS.includes(character)) throw new Error(`Unknown character: ${character}`);
  const p = chatPath(key, character);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const e = { at: nowIso(), ...entry };
  fs.appendFileSync(p, JSON.stringify(e) + "\n");
  return e;
}

export function readChat(key, character) {
  let raw = "";
  try { raw = fs.readFileSync(chatPath(key, character), "utf8"); } catch { return []; }
  const out = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* half-written line */ }
  }
  return out;
}

// ── jobs ────────────────────────────────────────────────────────────
const JOB_ID_RE = /^[A-Za-z0-9_.-]{1,120}$/;
const jobPath = id => {
  if (!JOB_ID_RE.test(String(id))) throw new Error(`Not a job id: ${id}`);
  return path.join(PIPE_DIR, "jobs", `${id}.json`);
};

function stamp(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function createJob({ key, action, input, system = false }) {
  checkKey(key);
  if (!ACTIONS.includes(action)) throw new Error(`Unknown action: ${action}`);
  if (system && !SYSTEM_ACTIONS.includes(action)) throw new Error(`${action} cannot run without a pipeline ticket`);
  if (system && key !== SYSTEM_KEY) throw new Error(`A system job must use ${SYSTEM_KEY}`);
  const character = action.split(":")[0];
  const id = `${stamp()}-${key}-${action.replace(":", "-")}-${crypto.randomBytes(2).toString("hex")}`;
  const job = {
    id, key, character, action,
    state: "queued",
    activity: "Waiting to start",
    startedAt: nowIso(),
    ...(system ? { system: true } : {}),
    ...(input !== undefined ? { input } : {}),
  };
  writeJsonAtomic(jobPath(id), job);
  return job;
}

export function readJob(id) {
  return readJson(jobPath(id), null);
}

export function updateJob(id, patch) {
  const p = jobPath(id);
  return withFileLock(p, () => {
    const cur = readJson(p, null);
    if (!cur) return null;
    const next = { ...cur, ...(typeof patch === "function" ? patch(cur) ?? {} : patch) };
    writeJsonAtomic(p, next);
    return next;
  });
}

const ACTIVE = new Set(["queued", "running"]);

function pidAlive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; }
}

/** Jobs newest first. `active: true` keeps queued/running only. A running job whose process is gone is reported as an error. */
export function listJobs({ key, active, limit } = {}) {
  const dir = path.join(PIPE_DIR, "jobs");
  let names = [];
  try { names = fs.readdirSync(dir).filter(n => n.endsWith(".json")); } catch { return []; }
  if (key) { checkKey(key); names = names.filter(n => n.includes(`-${key}-`)); }
  let jobs = names.map(n => readJson(path.join(dir, n), null)).filter(Boolean);
  if (key) jobs = jobs.filter(j => j.key === key);
  jobs = jobs.map(j => {
    // A job file left "running" by a killed runner would spin in the UI forever.
    if (ACTIVE.has(j.state) && j.pid && !pidAlive(j.pid)) {
      return { ...j, state: "error", error: j.error ?? "The job process ended without finishing", finishedAt: j.finishedAt ?? nowIso() };
    }
    return j;
  });
  if (active) jobs = jobs.filter(j => ACTIVE.has(j.state));
  jobs.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)) || b.id.localeCompare(a.id));
  return limit ? jobs.slice(0, limit) : jobs;
}

/** Test tickets (project key PIPETEST) always run --dry: Claude is never called for them. */
export const isTestKey = key => /^PIPETEST-\d+$/.test(String(key));

/** Starts the runner detached so the job outlives the request and dev-server reloads. */
export function spawnJob(id, extraArgs = []) {
  const job = readJob(id);
  if (!job) throw new Error(`No job ${id}`);
  const args = [RUNNER, id, ...extraArgs, ...(isTestKey(job.key) && !extraArgs.includes("--dry") ? ["--dry"] : [])];
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.on("error", () => { /* reported through the job file */ });
  child.unref();
  if (child.pid) updateJob(id, { pid: child.pid });
  return child.pid;
}

export function queueJob({ key, action, input, system }) {
  const job = createJob({ key, action, input, system });
  spawnJob(job.id);
  return readJob(job.id) ?? job;
}

// ── sage:apply batches (night of 2026-10-27, sage-batch-apply) ─────────
// Approving dozens of knowledge changes in one go used to queue one job each;
// the Sage runs one job at a time and a queued job waits at most 1 h, so the
// last ones timed out and stayed "approved" for good. Now an approval joins a
// sage:apply job that is still queued for the same holder key (the ticket, or
// SYSTEM_KEY for off-board keys), up to APPLY_BATCH_MAX changes; and a job
// that ends without applying a change puts it back to "error" so it can be
// approved again. README §8.3.
export const APPLY_BATCH_MAX = 10;
/** A queued job with no process yet counts as live this long after it was made. */
const SPAWN_GRACE_MS = 2 * 60 * 1000;

/** Review ids a sage:apply job holds: input { reviewIds } (batch) or { reviewId } (older jobs). */
export function applyIds(input) {
  if (Array.isArray(input?.reviewIds)) return input.reviewIds.map(String);
  return input?.reviewId ? [String(input.reviewId)] : [];
}

/** True while the job is queued/running and its process is alive (or it was only just made). */
export function jobIsLive(j) {
  if (!j || !ACTIVE.has(j.state)) return false;
  if (j.pid) return pidAlive(j.pid);
  return Date.now() - Date.parse(j.startedAt ?? 0) < SPAWN_GRACE_MS;
}

/** Live sage:apply jobs (all keys, incl. system jobs). */
function liveApplyJobs() {
  return listJobs({ active: true }).filter(j => j.action === "sage:apply" && jobIsLive(j));
}

/** The live sage:apply job that holds this review item, or null. */
export function applyJobFor(reviewId) {
  return liveApplyJobs().find(j => applyIds(j.input).includes(String(reviewId))) ?? null;
}

/**
 * Hands an approved review item to the Sage: joins a still-queued sage:apply
 * job for the same holder key when it has room, else queues a new one.
 * Joining is atomic with the runner's queued → running switch (both go
 * through updateJob's file lock), and the runner re-reads its input at that
 * switch, so a joined change is never lost. Returns { job, joined }.
 */
export function queueApply({ reviewId, reviewKey, system = false }) {
  const key = system ? SYSTEM_KEY : reviewKey;
  checkKey(key);
  const id = String(reviewId);
  const queued = listJobs({ key, active: true })
    .filter(j => j.action === "sage:apply" && j.state === "queued" && jobIsLive(j) && !!j.system === !!system)
    .sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
  for (const j of queued) {
    let joined = false;
    const next = updateJob(j.id, cur => {
      if (cur.state !== "queued") return {};
      const ids = applyIds(cur.input);
      if (ids.includes(id)) { joined = true; return {}; }
      if (ids.length >= APPLY_BATCH_MAX) return {};
      joined = true;
      const keys = { ...(cur.input?.reviewKeys ?? (cur.input?.reviewKey && cur.input?.reviewId ? { [cur.input.reviewId]: cur.input.reviewKey } : {})), [id]: reviewKey };
      return { input: { reviewIds: [...ids, id], reviewKeys: keys } };
    });
    if (joined && next) return { job: next, joined: true };
  }
  const job = queueJob({ key, action: "sage:apply", input: { reviewIds: [id], reviewKeys: { [id]: reviewKey } }, ...(system ? { system: true } : {}) });
  return { job, joined: false };
}

/**
 * After a sage:apply job ended (done / error / stopped): every change it held
 * that is still "approved" goes to "error" with the reason, so the Learnings
 * page offers Approve again. Changes already applied / errored, or now held by
 * another job, are left alone. Does nothing while the job is still active.
 * Returns how many were released. Never throws.
 */
export function releaseApply(jobId, reason) {
  try {
    const job = readJob(jobId);
    if (!job || job.action !== "sage:apply" || ACTIVE.has(job.state)) return 0;
    const ids = new Set(applyIds(job.input));
    if (!ids.size) return 0;
    let n = 0;
    const why = String(reason || job.error || "the Sage job ended before applying it").replace(/\s+/g, " ").slice(0, 300);
    updateSageList("review", list => list.map(r => {
      if (!ids.has(r.id) || r.state !== "approved" || (r.jobId && r.jobId !== job.id)) return r;
      n++;
      return { ...r, state: "error", jobId: job.id, note: `Not applied: ${why}. Approve again to retry.` };
    }));
    return n;
  } catch { return 0; }
}

/**
 * Safety net for changes left "approved" with no live job holding them (a
 * runner killed outright, a PC restart, jobs from before batching): after
 * `minAgeMs` since the approval they go to "error" so they can be approved
 * again. Called by GET /api/pipeline/learnings. Returns how many. Never throws.
 */
export function releaseStuckApprovals({ minAgeMs = SPAWN_GRACE_MS } = {}) {
  try {
    const stuckIds = readSageList("review")
      .filter(r => r.state === "approved" && Date.now() - Date.parse(r.decidedAt ?? r.at ?? 0) > minAgeMs)
      .map(r => r.id);
    if (!stuckIds.length) return 0;
    const held = new Set(liveApplyJobs().flatMap(j => applyIds(j.input)));
    const stuck = new Set(stuckIds.filter(id => !held.has(id)));
    if (!stuck.size) return 0;
    let n = 0;
    updateSageList("review", list => list.map(r => {
      if (!stuck.has(r.id) || r.state !== "approved") return r;
      n++;
      return { ...r, state: "error", note: "Not applied: the Sage job ended before applying it (stopped, timed out or crashed). Approve again to retry." };
    }));
    return n;
  } catch { return 0; }
}

// ── findings ────────────────────────────────────────────────────────
const FINDING_ID_RE = /^[A-Za-z0-9_.-]{1,120}$/;
const findingPath = (key, id) => {
  if (!FINDING_ID_RE.test(String(id))) throw new Error(`Not a finding id: ${id}`);
  return path.join(PIPE_DIR, "findings", checkKey(key), id, "finding.json");
};

export function readFinding(key, id) {
  return readJson(findingPath(key, id), null);
}

export function writeFinding(f) {
  writeJsonAtomic(findingPath(f.key, f.id), f);
  return f;
}

export function listFindings(key) {
  const dir = path.join(PIPE_DIR, "findings", checkKey(key));
  let names = [];
  try { names = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name); } catch { return []; }
  return names
    .map(n => readJson(path.join(dir, n, "finding.json"), null))
    .filter(Boolean)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

// ── saved runs (full run results, 2026-10-27) ───────────────────────
// The runner pages' meta.json keeps only title/status per check, so
// PipelineRunWatcher posts the full live result here when a run resolves:
// data/pipeline/runs/<KEY>/<runId>.json. elf:findings reads it for the error
// text, failed step and evidence.
const RUN_ID_RE = /^[A-Za-z0-9_.-]{1,120}$/;
export const isRunId = id => RUN_ID_RE.test(String(id ?? ""));
const runPath = (key, runId) => {
  if (!isRunId(runId)) throw new Error(`Not a run id: ${runId}`);
  return path.join(PIPE_DIR, "runs", checkKey(key), `${runId}.json`);
};

/** Saves (or overwrites) one run record. Returns it with savedAt. */
export function writeRun(rec) {
  const out = { ...rec, savedAt: nowIso() };
  writeJsonAtomic(runPath(rec.key, rec.runId), out);
  return out;
}

export function readRun(key, runId) {
  if (!isRunId(runId)) return null;
  return readJson(runPath(key, runId), null);
}

/** Saved runs of a key, newest first. */
export function listRuns(key) {
  const dir = path.join(PIPE_DIR, "runs", checkKey(key));
  let names = [];
  try { names = fs.readdirSync(dir).filter(n => n.endsWith(".json")); } catch { return []; }
  return names
    .map(n => readJson(path.join(dir, n), null))
    .filter(Boolean)
    .sort((a, b) => String(b.finishedAt ?? b.savedAt ?? "").localeCompare(String(a.finishedAt ?? a.savedAt ?? "")));
}

/** A saved run by the client runId (file name) or the server's runId / runLabel. */
export function findRun(key, id) {
  if (!id) return null;
  const direct = readRun(key, id);
  if (direct) return direct;
  return listRuns(key).find(r => String(r.serverRunId ?? "") === String(id) || String(r.runLabel ?? "") === String(id)) ?? null;
}

// ── Jira ────────────────────────────────────────────────────────────
/** Jira login saved from the Agents page, or null. */
export function jiraCreds() {
  const c = readJson(path.join(AGENTS_DIR, "jira.json"), null);
  return c?.baseUrl && c?.email && c?.apiToken ? c : null;
}

/** Basic-auth Jira REST call. Throws with status + body text when not ok. */
export async function jiraFetch(pathname, init = {}) {
  const creds = jiraCreds();
  if (!creds) throw new Error("Jira login not connected (open the Agents page and connect)");
  const auth = Buffer.from(`${creds.email}:${creds.apiToken}`).toString("base64");
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  const res = await fetch(`${creds.baseUrl.replace(/\/$/, "")}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Jira ${res.status} on ${pathname.split("?")[0]}: ${(await res.text()).slice(0, 300)}`);
  return res;
}

// ── stages ──────────────────────────────────────────────────────────
export const STAGE_ORDER = ["studied", "related", "scenarios", "approved", "automation", "testing", "findings", "raised", "done"];

/** Moves t.stage forward to `stage`; never moves it back. Mutates and returns t. */
export function raiseStage(t, stage) {
  if (STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(t.stage)) t.stage = stage;
  return t;
}

// ── locks + stop ────────────────────────────────────────────────────
/** One job per ticket+character at a time: data/pipeline/locks/<KEY>-<character>.lock */
export function lockPath(key, character) {
  return path.join(PIPE_DIR, "locks", `${checkKey(key)}-${character}.lock`);
}

/** Lock holder { pid, jobId, at } if a live process holds it, else null. */
export function lockHolder(key, character) {
  const held = readJson(lockPath(key, character), null);
  return held && pidAlive(held.pid) ? held : null;
}

// ── character slots ─────────────────────────────────────────────────
// At most two of the same character work at once, on different tickets
// (Faizuddin, 2026-10-27: "if one agent have too much tickets, it will have
// another agent (another same character) so that it can run 2 at a time").
// Extra jobs wait for a free slot. data/pipeline/locks/slot-<character>-<n>.lock
export const SLOTS_PER_CHARACTER = 2;
// The Sage works one ticket at a time: two Sage jobs editing the same
// knowledge/ file at once could overwrite each other, and its per-job
// knowledge diff would mix both jobs' lines (seen 2026-10-27).
const SLOT_LIMIT = { sage: 1 };
export const slotsFor = character => SLOT_LIMIT[character] ?? SLOTS_PER_CHARACTER;

export function slotPath(character, n) {
  if (!CHARACTERS.includes(character)) throw new Error(`Unknown character: ${character}`);
  return path.join(PIPE_DIR, "locks", `slot-${character}-${n}.lock`);
}

/** Takes a free slot (1..SLOTS_PER_CHARACTER) for jobId; returns its number, or null when all are busy. */
export function takeSlot(character, jobId) {
  for (let n = 1; n <= slotsFor(character); n++) {
    const p = slotPath(character, n);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const held = readJson(p, null);
    if (held && !pidAlive(held.pid)) { try { fs.unlinkSync(p); } catch { /* raced */ } }
    try {
      fs.writeFileSync(p, JSON.stringify({ pid: process.pid, jobId, at: nowIso() }), { flag: "wx" });
      return n;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
    }
  }
  return null;
}

/** Frees the slot(s) held by jobId. */
export function dropSlot(character, jobId) {
  for (let n = 1; n <= SLOTS_PER_CHARACTER; n++) {
    const p = slotPath(character, n);
    const held = readJson(p, null);
    if (held?.jobId === jobId) { try { fs.unlinkSync(p); } catch { /* gone */ } }
  }
}

/** How many of this character are working right now. */
export function busySlots(character) {
  let busy = 0;
  for (let n = 1; n <= slotsFor(character); n++) {
    const held = readJson(slotPath(character, n), null);
    if (held && pidAlive(held.pid)) busy++;
  }
  return busy;
}

/** Kills a process and its children (Windows: taskkill /T /F, like lib/server/playwrightRun.ts killTree). */
export function killPidTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    try { spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" }); } catch { /* ignore */ }
  } else {
    try { process.kill(-pid, "SIGKILL"); } catch { try { process.kill(pid, "SIGKILL"); } catch { /* ignore */ } }
  }
}

/**
 * Stops a queued/running job: kills the runner tree and cleans up what its
 * finally-block would have (job state, lock, character state), because
 * taskkill /F gives the runner no chance to run it.
 */
export function stopJob(id, by = "Faizuddin") {
  const job = readJob(id);
  if (!job) return null;
  if (!ACTIVE.has(job.state)) return job;
  const stopped = updateJob(id, { state: "stopped", activity: `Stopped by ${by}`, finishedAt: nowIso() });
  if (job.pid && job.pid !== process.pid) killPidTree(job.pid);
  const lp = lockPath(job.key, job.character);
  const held = readJson(lp, null);
  if (held?.jobId === id) { try { fs.unlinkSync(lp); } catch { /* ignore */ } }
  dropSlot(job.character, id);
  updateTicket(job.key, t => {
    const c = t.characters?.[job.character];
    if (c && c.lastJobId === id && c.state === "working") t.characters[job.character] = { ...c, state: "idle", note: `Stopped by ${by}` };
    t.events = [{ at: nowIso(), text: `${job.action} stopped by ${by}` }, ...(t.events ?? [])].slice(0, 100);
  });
  try { appendChat(job.key, job.character, { from: "system", text: `Job stopped by ${by}.`, jobId: id }); } catch { /* ignore */ }
  // A stopped sage:apply: the changes it held go back to "error" (Approve again).
  if (job.action === "sage:apply") releaseApply(id, `the Sage job was stopped by ${by}`);
  // A stopped help job (scripts/pipeline/ask.mjs): the asker would otherwise wait for an answer forever.
  const asker = job.input?.from;
  if (/:help$/.test(job.action) && CHARACTERS.includes(asker)) {
    const helper = job.character[0].toUpperCase() + job.character.slice(1);
    try { appendChat(job.key, asker, { from: "system", text: `${helper}'s answer was stopped by ${by}.`, jobId: id, via: job.character }); } catch { /* ignore */ }
    updateTicket(job.key, t => {
      const c = t.characters?.[asker];
      if (c) t.characters[asker] = { ...c, state: "waiting", note: `${helper}'s answer was stopped by ${by}` };
    });
  }
  return stopped;
}

// ── misc ────────────────────────────────────────────────────────────
/** data/agents/setup.json (sharepointDir etc.), or {}. */
export function setupInfo() {
  return readJson(path.join(AGENTS_DIR, "setup.json"), {});
}

/** sha256 of a file (absolute or repo-relative), or null if missing. */
export function hashFile(p) {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(path.isAbsolute(p) ? p : repoPath(p))).digest("hex");
  } catch { return null; }
}

// ── Sage: knowledge keeper (Faizuddin, 2026-10-27) ──────────────────
// "every time we do something in the pipeline ... an agent will always make
// sure to improve the knowledge and flow based on everything that we did".
// Pipeline events land in data/pipeline/sage-inbox/<KEY>.jsonl; one
// sage:learn job per ticket folds them into knowledge/ (README §8).
const SAGE_INBOX_DIR = path.join(PIPE_DIR, "sage-inbox");
export const SAGE_FILES = {
  review: path.join(PIPE_DIR, "knowledge-review.json"),
  improvements: path.join(PIPE_DIR, "improvements.json"),
  learnings: path.join(PIPE_DIR, "learnings.jsonl"),
  answers: path.join(PIPE_DIR, "answers.json"),
};
const sageInboxPath = key => path.join(SAGE_INBOX_DIR, `${checkKey(key)}.jsonl`);
const shortId = () => `${stamp()}-${crypto.randomBytes(3).toString("hex")}`;
export const newSageId = prefix => `${prefix}-${shortId()}`;

function readJsonl(p) {
  let raw = "";
  try { raw = fs.readFileSync(p, "utf8"); } catch { return []; }
  const out = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* half-written line */ }
  }
  return out;
}

/** Pending events for the ticket, oldest first. */
export function readSageInbox(key) {
  return readJsonl(sageInboxPath(key));
}

/** Removes processed events (by id) from the inbox; returns how many are left. */
export function clearSageInbox(key, ids) {
  const p = sageInboxPath(key);
  const drop = new Set(ids);
  return withFileLock(p, () => {
    const left = readJsonl(p).filter(e => !drop.has(e.id));
    if (!left.length) { try { fs.unlinkSync(p); } catch { /* gone */ } return 0; }
    fs.writeFileSync(p, left.map(e => JSON.stringify(e)).join("\n") + "\n");
    return left.length;
  });
}

/**
 * Queues the ticket's sage:learn unless one is already waiting (it will pick
 * up every event in the inbox) or running (its finish re-queues for the
 * events that came in meanwhile). `exceptJobId`: the running job itself.
 */
export function queueSage(key, { exceptJobId } = {}) {
  const active = listJobs({ key, active: true }).filter(j => j.action === "sage:learn" && j.id !== exceptJobId);
  if (active.length) return null;
  return queueJob({ key, action: "sage:learn" });
}

/**
 * Records a pipeline event for the Sage and queues (debounced) its learn job.
 * Never from the Sage's own work (no loops): events by the Sage, or from a job
 * the Sage started (input.from === "sage"), are ignored. Never throws.
 */
export function noteForSage(key, event = {}, { queue = true } = {}) {
  try {
    if (event.character === "sage" || event.by === "sage" || event.from === "sage" || /^sage:/.test(String(event.action ?? ""))) return null;
    if (!KEY_RE.test(String(key)) || !readTicket(key)) return null;
    const { from: _from, ...rest } = event; void _from;
    const e = { id: newSageId("ev"), at: nowIso(), ...rest };
    if (typeof e.text === "string" && e.text.length > 4000) e.text = `${e.text.slice(0, 3999)}…`;
    const p = sageInboxPath(key);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    withFileLock(p, () => fs.appendFileSync(p, JSON.stringify(e) + "\n"));
    if (queue) { try { queueSage(key); } catch { /* the next event retries */ } }
    return e;
  } catch { return null; }
}

/** Read-modify-write of one of the Sage's JSON list files (review, improvements, answers). */
export function updateSageList(which, fn) {
  const p = SAGE_FILES[which];
  if (!p || which === "learnings") throw new Error(`Not a Sage list: ${which}`);
  return withFileLock(p, () => {
    const cur = readJson(p, []);
    const list = Array.isArray(cur) ? cur : [];
    const out = fn(list) ?? list;
    writeJsonAtomic(p, out);
    return out;
  });
}

export function readSageList(which) {
  const p = SAGE_FILES[which];
  if (!p || which === "learnings") return [];
  const v = readJson(p, []);
  return Array.isArray(v) ? v : [];
}

/** Appends one LearningRecord line to learnings.jsonl. */
export function appendLearning(rec) {
  const p = SAGE_FILES.learnings;
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const r = { at: nowIso(), ...rec };
  withFileLock(p, () => fs.appendFileSync(p, JSON.stringify(r) + "\n"));
  return r;
}

/** Last `limit` learning records, newest first. */
export function readLearnings(limit = 50) {
  return readJsonl(SAGE_FILES.learnings).reverse().slice(0, limit);
}

export { CHARACTERS, ACTIONS };
