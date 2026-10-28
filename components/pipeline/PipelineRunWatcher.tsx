"use client";
// Keeps the official TS status in step with runner-page runs for pipeline
// tickets (Faizuddin, 2026-10-27). No UI. Reads the runs that
// hooks/useBackgroundRuns.ts mirrors to localStorage (read only — that hook is
// never changed): a run starting → "In Progress" for its TS; a run finishing →
// "Pass" / "Fail" per TS from its checks, and Elf is asked to look at any
// failure. Mounted once in AppShell. Design: scripts/pipeline/README.md §1.6.
// The full result of each finished run is saved server-side
// (/api/pipeline/runs) so Elf has the error text later. Only one tab watches
// at a time (Web Locks), so two open tabs never post the same status twice.
import { useEffect } from "react";
import type { PipelineTicket } from "@/lib/pipeline/types";

const RUNS_KEY = "dashboard_background_runs";
const STATE_KEY = "pipeline_run_watcher";
const POLL_MS = 3_000;
const TICKETS_MS = 60_000;
const MAX_REMEMBERED = 300;
const LOCK_NAME = "pipeline-run-watcher";

type CheckStatus = "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
interface Check { title?: string; tsLabel?: string; status?: CheckStatus }
interface StoredRun {
  key: string; runId: string; running: boolean; orphaned: boolean;
  startedAt: string; finishedAt?: string; result: unknown; error: string;
  meta?: Record<string, unknown>;
}
interface WatcherState {
  /** Runs that finished before the watcher existed are never posted. */
  installedAt: string;
  handled: Record<string, { started?: boolean; resolved?: boolean; at: string }>;
}

function loadState(): WatcherState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as WatcherState;
      if (s && s.installedAt && s.handled) return s;
    }
  } catch { /* storage blocked or bad JSON */ }
  return { installedAt: new Date().toISOString(), handled: {} };
}

function saveState(s: WatcherState) {
  const entries = Object.entries(s.handled).sort((a, b) => b[1].at.localeCompare(a[1].at)).slice(0, MAX_REMEMBERED);
  try { localStorage.setItem(STATE_KEY, JSON.stringify({ ...s, handled: Object.fromEntries(entries) })); } catch { /* full */ }
}

function readRuns(): Record<string, StoredRun> {
  try { return JSON.parse(localStorage.getItem(RUNS_KEY) ?? "{}") ?? {}; } catch { return {}; }
}

const digitsOf = (key: string) => key.match(/-(\d+)$/)?.[1] ?? "";
const two = (n: string) => String(Number(n)).padStart(2, "0");

/** TS ids of this ticket in any text: "12153_TS02: ..." → "12153_TS02". */
function idsIn(text: string, digits: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b(\d+)_TS_?(\d+)\b/gi)) if (m[1] === digits) out.add(`${digits}_TS${two(m[2])}`);
  return [...out];
}

/** The TS a run covers, from meta (scenario ids like "ts2", or titles). */
function idsOfRun(run: StoredRun, digits: string): string[] {
  const meta = run.meta ?? {};
  const out = new Set(idsIn(JSON.stringify(meta), digits));
  const lists = [meta.scenarios, meta.titles, meta.ts].filter(Array.isArray) as unknown[][];
  for (const list of lists) {
    for (const v of list) {
      const m = typeof v === "string" ? v.trim().match(/^ts[_ ]?(\d+)$/i) : null;
      if (m) out.add(`${digits}_TS${two(m[1])}`);
    }
  }
  return [...out];
}

/** Checks from either result shape: { result: { checks } } (12153-style) or { checks }. */
function checksOf(result: unknown): Check[] {
  const r = result as { result?: { checks?: Check[] }; checks?: Check[] } | null;
  return r?.result?.checks ?? r?.checks ?? [];
}

/** Pass / Fail per TS. A TS with any failed check is Fail; skipped-only TS are left as they are. */
function outcomes(checks: Check[], digits: string): { pass: string[]; fail: string[] } {
  const per: Record<string, "Pass" | "Fail"> = {};
  for (const c of checks) {
    if (!c.status || c.status === "skipped") continue;
    let ids = idsIn(`${c.tsLabel ?? ""} ${c.title ?? ""}`, digits);
    if (!ids.length) {
      const m = `${c.tsLabel ?? ""} ${c.title ?? ""}`.match(/\bTS[_ ]?(\d+)\b/i);
      if (m) ids = [`${digits}_TS${two(m[1])}`];
    }
    for (const id of ids) {
      if (c.status === "passed") { if (!per[id]) per[id] = "Pass"; }
      else per[id] = "Fail";
    }
  }
  const pass: string[] = [], fail: string[] = [];
  for (const [id, s] of Object.entries(per)) (s === "Pass" ? pass : fail).push(id);
  return { pass, fail };
}

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(typeof data?.error === "string" ? data.error : `HTTP ${r.status}`);
  }
  return r.json().catch(() => ({}));
}

/** The full run, as /api/pipeline/runs saves it. */
function runRecord(key: string, runKey: string, run: StoredRun) {
  const res = (run.result ?? {}) as Record<string, unknown>;
  const inner = (res.result && typeof res.result === "object" ? res.result : res) as Record<string, unknown>;
  const pick = (c: Record<string, unknown>) => ({
    title: c.title, status: c.status, tsLabel: c.tsLabel, error: c.error, friendlyError: c.friendlyError,
    steps: c.steps, evidence: c.evidence, video: c.video, details: c.details, durationMs: c.durationMs,
  });
  return {
    key, runKey, runId: run.runId,
    serverRunId: res.runId != null ? String(res.runId) : undefined,
    runLabel: typeof res.runLabel === "string" ? res.runLabel : undefined,
    startedAt: run.startedAt, finishedAt: run.finishedAt,
    error: run.error || undefined,
    meta: run.meta,
    checks: (checksOf(run.result) as unknown as Record<string, unknown>[]).map(pick),
    passed: inner.passed, failed: inner.failed, total: inner.total,
    video: res.video, evidence: res.evidence, details: res.details,
    log: typeof res.log === "string" ? res.log : undefined,
  };
}

function postStatus(key: string, ts: string[], status: "In Progress" | "Pass" | "Fail", runId: string) {
  if (!ts.length) return;
  post("/api/pipeline/ts-status", { key, ts, status, runId })
    .catch(e => console.warn(`[pipeline] official TS ${status} for ${key} not written:`, e instanceof Error ? e.message : e));
}

/** Polls the runs until the returned stop function is called. */
function startWatching(): () => void {
  let tickets: PipelineTicket[] = [];
  let ticketsAt = 0;
  let loading = false;
  let stopped = false;

  async function loadTickets() {
    if (loading) return;
    loading = true;
    try {
      const r = await fetch("/api/pipeline/tickets", { cache: "no-store" });
      if (r.ok) {
        const data = (await r.json()) as { tickets?: PipelineTicket[] };
        tickets = Array.isArray(data.tickets) ? data.tickets : [];
      }
    } catch (e) {
      console.warn("[pipeline] could not load pipeline tickets:", e instanceof Error ? e.message : e);
    } finally {
      ticketsAt = Date.now();
      loading = false;
    }
  }

  function tick() {
    if (stopped) return;
    if (Date.now() - ticketsAt > TICKETS_MS) void loadTickets();
    // Every ticket with a runner page is watched: findings still matter when
    // the official-sheet sync is turned off.
    const watched = tickets.filter(t => t.runKey);
    if (!watched.length) return;

    const runs = readRuns();
    const state = loadState();
    let dirty = false;

    for (const t of watched) {
      const run = runs[t.runKey!];
      if (!run?.runId) continue;
      const digits = digitsOf(t.key);
      const h = state.handled[run.runId] ?? { at: new Date().toISOString() };
      if (h.resolved) continue;

      if (run.running && !run.orphaned) {
        if (!h.started) {
          state.handled[run.runId] = { ...h, started: true };
          dirty = true;
          if (t.statusSync) postStatus(t.key, idsOfRun(run, digits), "In Progress", run.runId);
        }
        continue;
      }

      // Finished. Only runs seen running, or finished after the watcher was
      // installed, so old results already in storage are never re-posted.
      if (run.running || run.orphaned || (!run.result && !run.error)) continue;
      const finished = run.finishedAt ?? run.startedAt;
      if (!h.started && finished < state.installedAt) {
        state.handled[run.runId] = { ...h, resolved: true };
        dirty = true;
        continue;
      }
      state.handled[run.runId] = { ...h, resolved: true };
      dirty = true;
      if (!run.result) continue; // the request failed; nothing says how the TS went

      const { pass, fail } = outcomes(checksOf(run.result), digits);
      if (t.statusSync) {
        postStatus(t.key, pass, "Pass", run.runId);
        postStatus(t.key, fail, "Fail", run.runId);
      }
      // Save the full result first, so Elf reads the error text from it.
      const saved = post("/api/pipeline/runs", runRecord(t.key, t.runKey!, run))
        .catch(e => console.warn(`[pipeline] run ${run.runId} of ${t.key} not saved:`, e instanceof Error ? e.message : e));
      if (fail.length) {
        const key = t.key, runKey = t.runKey, runId = run.runId, result = run.result;
        void saved.then(() => post("/api/pipeline/jobs", { key, action: "elf:findings", input: { runKey, runId, result } }))
          .catch(e => console.warn(`[pipeline] could not ask Elf about the failed run of ${key}:`, e instanceof Error ? e.message : e));
      }
    }
    if (dirty) saveState(state);
  }

  // First mount ever: remember the install time so old runs stay untouched.
  try { if (!localStorage.getItem(STATE_KEY)) saveState(loadState()); } catch { /* storage blocked */ }
  void loadTickets().then(tick);
  const id = window.setInterval(tick, POLL_MS);
  return () => { stopped = true; window.clearInterval(id); };
}

export default function PipelineRunWatcher() {
  useEffect(() => {
    const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
    if (!locks?.request) return startWatching(); // older browser: every tab watches, as before

    // Only the tab holding the lock watches; the next tab takes over when it closes.
    let stop: (() => void) | null = null;
    let release: (() => void) | null = null;
    let disposed = false;
    const abort = new AbortController();
    locks.request(LOCK_NAME, { signal: abort.signal }, () => new Promise<void>(resolve => {
      if (disposed) { resolve(); return; }
      stop = startWatching();
      release = resolve;
    })).catch(() => { /* aborted on unmount while waiting */ });
    return () => {
      disposed = true;
      abort.abort();
      stop?.();
      release?.();
    };
  }, []);

  return null;
}
