"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { syncRunToTracker } from "@/lib/tsTrackerSync";
import { SAVED_RESULT_KEYS, isSavedResultKey } from "@/lib/savedRunKeys";

/**
 * Runs that survive navigating away from the page that started them.
 *
 * THE PROBLEM THIS SOLVES. A runner page that owns its own `fetch` loses the run
 * the moment you navigate: Next unmounts the route, React state goes with it,
 * and — the part that actually bites — the in-flight promise resolves into a
 * component that no longer exists. The Playwright process keeps going on the
 * server; only the UI forgets. Come back and the page looks like nothing ever
 * happened, mid-run.
 *
 * THE FIX. Own the fetch and the log polling HERE, in AppShell, which does not
 * unmount on client-side navigation. Pages read a run by key and render it. This
 * is the same shape Insurance and Secarang already use (see AppShell), lifted
 * out so every page can share one implementation instead of hand-rolling a
 * fourth.
 *
 * A hard browser reload still tears everything down, so finished runs are
 * mirrored to localStorage and restored on boot. A run that was still `running`
 * when the reload happened is restored as `orphaned` rather than as running: the
 * process may well have finished while we were gone, and claiming to be live
 * when nothing is being polled is worse than admitting we lost track.
 */

export interface BackgroundRun<T = unknown> {
  key: string;
  runId: string;
  running: boolean;
  stopping: boolean;
  /** Restored from storage after a reload, so we no longer know if it is live. */
  orphaned: boolean;
  startedAt: string;
  finishedAt?: string;
  liveLog: string;
  result: T | null;
  error: string;
  /** Anything the page wants to remember alongside the run — scenario, env… */
  meta: Record<string, unknown>;
}

export interface StartRunOptions {
  /** POST target. */
  url: string;
  body: unknown;
  /** GET target for live output, called as `${liveLogUrl}?runId=…`. */
  liveLogUrl?: string;
  /** DELETE target for Stop, called as `${stopUrl}?runId=…`. Defaults to `url`. */
  stopUrl?: string;
  meta?: Record<string, unknown>;
}

export type RunMap = Record<string, BackgroundRun>;

const STORAGE_KEY = "dashboard_background_runs";
const POLL_MS = 2_000;
/**
 * Long enough to come back to a finished run, short enough not to hoard.
 *
 * Measured from `finishedAt` when a run has one, not `startedAt` — several
 * dashboard runs genuinely span the better part of a day (EAINT-11864 TS07
 * runs 23:30 → 07:00 overnight; TS03 alone is ~2h15m), and nobody checks a run
 * like that within minutes of it finishing. Keying off the start would prune a
 * perfectly good overnight result before the tester ever opens the tab again.
 * A run still `running` when the browser reloaded has no finish time yet, so it
 * falls back to its start — that path leads to `orphaned`, not survival, if it
 * runs unusually long.
 */
const KEEP_MS = 24 * 60 * 60 * 1000;

/** How often a cut-off eAuto tool run checks the server for its saved result, and for how long. */
const SAVED_POLL_MS = 15_000;
const SAVED_POLL_FOR_MS = 6 * 60 * 60 * 1000;

interface SavedResultResponse { saved: { key: string; runId: string; savedAt: string; payload: unknown } | null }

/** A run rebuilt from the server's saved copy (lib/server/savedResults.ts). */
function runFromSaved(key: string, saved: NonNullable<SavedResultResponse["saved"]>, meta: Record<string, unknown> = {}): BackgroundRun {
  const payload = saved.payload as { error?: unknown } | null;
  const error = payload && typeof payload.error === "string" ? payload.error : "";
  return {
    key, runId: saved.runId || `saved-${saved.savedAt}`,
    running: false, stopping: false, orphaned: false,
    startedAt: saved.savedAt, finishedAt: saved.savedAt,
    liveLog: "", result: error ? null : saved.payload, error, meta,
  };
}

function loadPersisted(): RunMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: RunMap = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const out: RunMap = {};
    for (const [key, run] of Object.entries(parsed)) {
      const anchor = run.finishedAt ?? run.startedAt;
      // eAuto tool results are kept until the next run replaces them.
      if (!isSavedResultKey(key) && now - new Date(anchor).getTime() > KEEP_MS) continue;
      out[key] = run.running
        ? { ...run, running: false, stopping: false, orphaned: true }
        : run;
    }
    return out;
  } catch { return {}; }
}

export function useBackgroundRuns() {
  const [runs, setRuns] = useState<RunMap>(() => loadPersisted());

  // Where each live run should be polled. Kept in a ref rather than in state so
  // starting a run does not restart the polling effect mid-flight.
  const pollTargets = useRef<Record<string, { liveLogUrl?: string; runId: string }>>({});
  const stopTargets = useRef<Record<string, { stopUrl: string; runId: string }>>({});
  // The newest runId started under each key. A resolution for any other runId
  // is stale and is dropped.
  const currentRunIds = useRef<Record<string, string>>({});
  // eAuto tool runs cut off before their response arrived, still waiting for the
  // server's saved result (lib/server/savedResults.ts).
  const awaitingSaved = useRef<Record<string, { runId: string; until: number }>>({});

  const persist = useCallback((next: RunMap) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* full */ }
  }, []);

  /**
   * Patches the run under `key` — but only while it is still the run with
   * `runId`, when one is given. A key is reused by every run a page starts
   * (queues, bulk panels), so an older run that resolves late must not
   * overwrite the newer one (see app/eauto/edereg-precheck/BulkRunPanel.tsx).
   */
  const update = useCallback((key: string, patch: Partial<BackgroundRun>, runId?: string) => {
    setRuns(prev => {
      const cur = prev[key];
      if (!cur) return prev;
      if (runId && cur.runId !== runId) return prev;
      const next = { ...prev, [key]: { ...cur, ...patch } };
      persist(next);
      return next;
    });
  }, [persist]);

  const startRun = useCallback(<T,>(key: string, opts: StartRunOptions) => {
    const runId = crypto.randomUUID();
    currentRunIds.current[key] = runId;
    const isCurrent = () => currentRunIds.current[key] === runId;
    pollTargets.current[key] = { liveLogUrl: opts.liveLogUrl, runId };
    stopTargets.current[key] = { stopUrl: opts.stopUrl ?? opts.url, runId };

    setRuns(prev => {
      const next: RunMap = {
        ...prev,
        [key]: {
          key, runId,
          running: true, stopping: false, orphaned: false,
          startedAt: new Date().toISOString(),
          liveLog: "", result: null, error: "",
          // `page` = where the run was started, so the sidebar's "Running now"
          // list (components/RunningAutomations.tsx) can link back to it.
          meta: { page: window.location.pathname + window.location.search, ...(opts.meta ?? {}) },
        },
      };
      persist(next);
      return next;
    });

    // The page that started this may be unmounted long before it resolves —
    // which is the entire point. Nothing here touches component state.
    fetch(opts.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(opts.body as object), runId }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        // A non-OK response is a failure even when the route sent no `error`
        // field — previously that case was recorded as a successful result.
        if (!r.ok) {
          const msg = typeof data?.error === "string" && data.error ? data.error : `Request failed (HTTP ${r.status})`;
          throw new Error(msg);
        }
        return data as T;
      })
      .then((data) => {
        if (!isCurrent()) return; // superseded by a newer run on this key
        delete pollTargets.current[key];
        update(key, {
          running: false, stopping: false,
          result: data, finishedAt: new Date().toISOString(),
        }, runId);
        // Feed TS Tracker. Must never break the run itself.
        try { syncRunToTracker(key, data, opts.meta ?? {}); } catch { /* ignore */ }
      })
      .catch((e: unknown) => {
        if (!isCurrent()) return;
        delete pollTargets.current[key];
        // The request itself died (laptop asleep, network dropped) while the run
        // may still be going on the server — wait for its saved result instead
        // of reporting a failure. An HTTP error response is an Error, not a TypeError.
        if (isSavedResultKey(key) && e instanceof TypeError) {
          awaitingSaved.current[key] = { runId, until: Date.now() + SAVED_POLL_FOR_MS };
          update(key, { running: false, stopping: false, orphaned: true }, runId);
          return;
        }
        update(key, {
          running: false, stopping: false,
          error: e instanceof Error ? e.message : "Run failed",
          finishedAt: new Date().toISOString(),
        }, runId);
      });

    return runId;
  }, [persist, update]);

  const stopRun = useCallback((key: string) => {
    const target = stopTargets.current[key];
    update(key, { stopping: true });
    if (!target) return;
    fetch(`${target.stopUrl}?runId=${target.runId}`, { method: "DELETE" }).catch(() => {});
  }, [update]);

  const clearRun = useCallback((key: string) => {
    // A cleared tool result must not come back from the server copy on the next load.
    if (isSavedResultKey(key)) {
      delete awaitingSaved.current[key];
      fetch(`/api/saved-results?key=${encodeURIComponent(key)}`, { method: "DELETE" }).catch(() => {});
    }
    delete pollTargets.current[key];
    delete stopTargets.current[key];
    delete currentRunIds.current[key];
    setRuns(prev => {
      const next = { ...prev };
      delete next[key];
      persist(next);
      return next;
    });
  }, [persist]);

  // One interval for every live run, rather than one per page. Only runs with a
  // liveLogUrl are polled; the rest just wait for their POST to resolve.
  useEffect(() => {
    const id = setInterval(() => {
      for (const [key, target] of Object.entries(pollTargets.current)) {
        if (!target.liveLogUrl) continue;
        fetch(`${target.liveLogUrl}?runId=${target.runId}`)
          .then(r => r.json())
          .then((data: { log?: string }) => {
            if (typeof data.log === "string") update(key, { liveLog: data.log }, target.runId);
          })
          .catch(() => { /* next tick retries */ });
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [update]);

  /**
   * eAuto tool results survive a closed laptop (Faizuddin, 2026-10-21): on boot,
   * and every SAVED_POLL_MS while a cut-off run waits, read the server's saved
   * result for each tool key and take it when it is the run this browser started,
   * when this browser has none, or when it is newer than the one shown.
   */
  const syncSaved = useCallback(async (keys: string[]) => {
    for (const key of keys) {
      let saved: SavedResultResponse["saved"] = null;
      try {
        const r = await fetch(`/api/saved-results?key=${encodeURIComponent(key)}`);
        saved = ((await r.json()) as SavedResultResponse).saved;
      } catch { continue; }
      if (!saved) continue;
      const found = saved;
      setRuns(prev => {
        const cur = prev[key];
        if (cur?.running) return prev; // a live run in this tab owns the key
        const waiting = awaitingSaved.current[key];
        const sameRun = !!cur && cur.runId === found.runId;
        const newer = !cur || new Date(found.savedAt).getTime() > new Date(cur.finishedAt ?? cur.startedAt).getTime();
        const take = sameRun ? (cur.orphaned || (!cur.result && !cur.error)) : !waiting && newer;
        if (!take) return prev;
        if (waiting && waiting.runId === found.runId) delete awaitingSaved.current[key];
        const next = { ...prev, [key]: runFromSaved(key, found, cur?.meta) };
        persist(next);
        return next;
      });
    }
  }, [persist]);

  useEffect(() => {
    // Boot: every orphaned tool run waits for its saved result; then sync all tool keys.
    for (const [key, run] of Object.entries(loadPersisted())) {
      if (isSavedResultKey(key) && run.orphaned) awaitingSaved.current[key] = { runId: run.runId, until: Date.now() + SAVED_POLL_FOR_MS };
    }
    syncSaved(SAVED_RESULT_KEYS);
    const id = setInterval(() => {
      const now = Date.now();
      for (const [key, w] of Object.entries(awaitingSaved.current)) if (now > w.until) delete awaitingSaved.current[key];
      const keys = Object.keys(awaitingSaved.current);
      if (keys.length) syncSaved(keys);
    }, SAVED_POLL_MS);
    return () => clearInterval(id);
  }, [syncSaved]);

  return { runs, startRun, stopRun, clearRun };
}
