import type { ChildProcess } from "node:child_process";

// Shared, in-process state for the eDereg Pre-Checking runner — imported by
// run/route.ts (which owns the spawned Playwright child process),
// live-log/route.ts (a lightweight polling endpoint added 2026-08-26 so the
// dashboard can show output WHILE a run is in flight), and the pause-status/
// continue routes indirectly (via the runId the client attaches to every
// call). run/route.ts's own POST fetch() doesn't resolve until the whole
// test finishes — there was no way to see progress mid-run before this.
//
// CHANGED 2026-08-28 from a single set of `let`-style fields to a Map keyed
// by `runId` — added so MU_TS11 and MU_TS12 (each with their own dashboard
// pause/continue wait for a dev to run the cronjob) can be run
// SIMULTANEOUSLY in two separate browser tabs, per Faizuddin: "its hard for
// the dev to patch the data one by one. easier if can multiple at once."
// Before this, only ONE run could exist at a time — a second concurrent run
// would silently overwrite the first's output buffer/child-process handle
// here, and (see pauseSignal.ts) collide on the SAME pause/continue files on
// disk, so clicking Continue for one run could wake up the OTHER run too,
// against un-patched data. Each run now gets a client-generated `runId`
// (a `crypto.randomUUID()`, sent as `DPC_RUN_ID` to the spawned child and
// echoed back on every live-log/pause-status/continue/stop call), and this
// Map keeps every concurrent run's own child process, output buffer and
// stop flag fully separate.
export interface RunEntry {
  child: ChildProcess | null;
  stopRequested: boolean;
  forceResolveRun: ((r: { code: number; output: string }) => void) | null;
  runOutputBuffer: string;
}

export const runState = {
  runs: new Map<string, RunEntry>(),
};
