/**
 * Maps the dashboard's client-generated runId (a UUID from
 * useBackgroundRuns.startRun(), used for live-log polling and Stop) to the
 * server's own human-readable run folder name (`ts`, e.g. "2026-09-24_1141")
 * that `run/route.ts` already uses for `test-evidence/<ts>` and
 * `public/qa-artifacts/eauto-12166/<ts>`.
 *
 * Needed because the run's whole HTTP request blocks until the spawned
 * Playwright process exits — the dashboard has no other way to learn the
 * folder name while a run (including one paused at a manual gate, see
 * tests/service-hub/utils/manualGate.ts) is still in flight. Kept as a
 * plain in-memory Map: this only needs to survive within one `next dev`
 * process on one machine, not across restarts.
 */
const runIdToTs = new Map<string, string>();

export function registerEautoRun(runId: string, ts: string): void {
  runIdToTs.set(runId, ts);
}

export function resolveEautoRunTs(runId: string): string | undefined {
  return runIdToTs.get(runId);
}

export function unregisterEautoRun(runId: string): void {
  runIdToTs.delete(runId);
}
