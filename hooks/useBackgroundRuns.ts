"use client";
import { useCallback, useEffect, useRef, useState } from "react";

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

function loadPersisted(): RunMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: RunMap = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const out: RunMap = {};
    for (const [key, run] of Object.entries(parsed)) {
      const anchor = run.finishedAt ?? run.startedAt;
      if (now - new Date(anchor).getTime() > KEEP_MS) continue;
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

  const persist = useCallback((next: RunMap) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* full */ }
  }, []);

  const update = useCallback((key: string, patch: Partial<BackgroundRun>) => {
    setRuns(prev => {
      const cur = prev[key];
      if (!cur) return prev;
      const next = { ...prev, [key]: { ...cur, ...patch } };
      persist(next);
      return next;
    });
  }, [persist]);

  const startRun = useCallback(<T,>(key: string, opts: StartRunOptions) => {
    const runId = crypto.randomUUID();
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
          meta: opts.meta ?? {},
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
        if (!r.ok && data?.error) throw new Error(data.error as string);
        return data as T;
      })
      .then((data) => {
        delete pollTargets.current[key];
        update(key, {
          running: false, stopping: false,
          result: data, finishedAt: new Date().toISOString(),
        });
      })
      .catch((e: unknown) => {
        delete pollTargets.current[key];
        update(key, {
          running: false, stopping: false,
          error: e instanceof Error ? e.message : "Run failed",
          finishedAt: new Date().toISOString(),
        });
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
    delete pollTargets.current[key];
    delete stopTargets.current[key];
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
            if (typeof data.log === "string") update(key, { liveLog: data.log });
          })
          .catch(() => { /* next tick retries */ });
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [update]);

  return { runs, startRun, stopRun, clearRun };
}
