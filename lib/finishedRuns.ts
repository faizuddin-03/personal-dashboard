// ── Finished runs a queue page hands to PipelineRunWatcher ─
// A queue runner page starts its next TS on the same run key the moment one
// finishes, so `dashboard_background_runs[key]` holds the finished run for only
// a few milliseconds. PipelineRunWatcher polls every 3 s (once a minute in a
// background tab) and never saw it: the sheet kept "In Progress" and the Pass /
// Fail was never written (EAINT-12028 TS01, TS02, TS05, TS06, 2026-11-02/03).
// The runner page records each run here as it processes it; the watcher reads
// this list as well as the live run. hooks/useBackgroundRuns.ts is not touched
// (scripts/pipeline/README.md §5.1).

const KEY = "dashboard_finished_runs";
const MAX = 100;

export interface FinishedRun {
  key: string; runId: string; running: false; orphaned: false;
  startedAt: string; finishedAt?: string; result: unknown; error: string;
  meta?: Record<string, unknown>;
}

export function readFinishedRuns(): FinishedRun[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

/** Adds one finished run (once per runId). Never throws. */
export function recordFinishedRun(run: { key: string; runId: string; startedAt: string; finishedAt?: string; result: unknown; error?: string; meta?: Record<string, unknown> }): void {
  try {
    const list = readFinishedRuns();
    if (list.some(r => r.runId === run.runId)) return;
    const entry: FinishedRun = { ...run, running: false, orphaned: false, error: run.error ?? "" };
    localStorage.setItem(KEY, JSON.stringify([entry, ...list].slice(0, MAX)));
  } catch { /* storage full or blocked */ }
}
