import * as fs from 'node:fs';
import * as path from 'node:path';

// ── Dashboard-driven pause/continue — lets a run BLOCK mid-flow on the SAME
// live browser session/transaction, until a human clicks "Continue" on the
// dashboard, added 2026-08-27 for MU_TS11 (EAINT-9306) ──
// Faizuddin's own reasoning for wanting this, verbatim: "i need the
// continue button to still be on the exact same transaction, to see what
// the transaction does" — the existing two-part (Part 1 / Part 2) pattern
// used elsewhere in this suite (CPC_E2E_TS4/5/6/10/11/12, OF_TS4) always
// restarts a FRESH browser session for Part 2, which is the wrong shape
// for MU_TS11: it needs to watch the SAME already-open Deregistration
// Step 2 popups survive a real-world wait (the dev running the cronjob),
// not recreate them from scratch.
//
// Modelled directly on the existing one-directional mechanisms already in
// this suite:
//   - `utils/waitStatus.ts` (test -> dashboard): writes a status file the
//     dashboard polls, used for the VPN reminder banner.
//   - The Stop button (dashboard -> test, via `runState` in
//     app/api/eauto-edereg-precheck/): proves the dashboard can already
//     reach INTO a live-running Playwright process.
// This combines both directions: the test writes a "paused" marker (like
// waitStatus.ts), the dashboard shows a "Continue" button once it sees
// that marker, and clicking it writes a SEPARATE "continue" signal file
// that this test's own polling loop is waiting on.
//
// **Session-lifetime caveat, deliberately not solved here**: this only
// keeps the SAME browser tabs/login alive across the pause — fine for a
// wait on the order of minutes (asking a dev to run a cronjob right now),
// NOT fine for an overnight wait (the real 23:59:59 cronjob run), where
// the AATF login session itself may not survive. That longer-wait case is
// exactly what the existing two-part pattern is for elsewhere in this
// suite — this mechanism is a deliberately different tool, not a
// replacement for it.
// Scoped by DPC_RUN_ID, added 2026-08-28 — lets two paused runs (e.g.
// MU_TS11 + MU_TS12, run simultaneously in two browser tabs per Faizuddin:
// "its hard for the dev to patch the data one by one. easier if can
// multiple at once") each get their OWN pause/continue files instead of
// colliding on one shared pair. Before this, a second run's pause
// overwrote the first's status file, and clicking Continue for one run
// would wake BOTH — even if only one's data was actually patched. Falls
// back to the original unscoped names when DPC_RUN_ID isn't set (e.g. a
// plain `npx playwright test` run outside the dashboard), so nothing
// changes for that usage.
// Lives in `.run-signals/`, a folder SEPARATE from `test-results/` —
// confirmed 2026-08-28 (Playwright's own `createRemoveOutputDirsTask()`,
// node_modules/playwright/lib/runner/index.js) that `npx playwright test`
// WIPES its entire `outputDir` (which defaults to `test-results/`, shared
// by every project in playwright.config.ts) at the START of every
// invocation. That's what broke the runId-scoping above on its own: running
// MU_TS12 while MU_TS11 was still paused deleted MU_TS11's pause-status
// file out from under it the moment MU_TS12's process started, regardless
// of the two files having different names. `.run-signals/` is never
// Playwright's outputDir, so nothing it does can touch these files no
// matter how many runs overlap.
const RUN_ID = process.env.DPC_RUN_ID?.trim() || '';
const suffix = RUN_ID ? `-${RUN_ID}` : '';
const SIGNALS_DIR = path.join(process.cwd(), '.run-signals');
const PAUSE_STATUS_PATH = path.join(SIGNALS_DIR, `pause-status${suffix}.json`);
const CONTINUE_SIGNAL_PATH = path.join(SIGNALS_DIR, `continue-signal${suffix}.json`);

/** One transaction to hand to the dev — `label` distinguishes WHICH one
 *  when a scenario has more than one (e.g. MU_TS11's User A/User B, each a
 *  genuinely separate record on a different company). Added 2026-08-27 per
 *  Faizuddin: the dashboard's Continue banner needs to show/copy ALL of
 *  them, not assume exactly one. */
export interface PausedTransaction {
  label: string;
  transactionId: string;
}

export interface PauseStatus {
  label: string;
  pausedAtMs: number;
  transactions?: PausedTransaction[];
}

function writePauseStatus(label: string, transactions?: PausedTransaction[]): void {
  fs.mkdirSync(path.dirname(PAUSE_STATUS_PATH), { recursive: true });
  const status: PauseStatus = { label, pausedAtMs: Date.now(), transactions };
  fs.writeFileSync(PAUSE_STATUS_PATH, JSON.stringify(status));
}

/** Call once per test, before anything that might pause — clears any
 *  marker left over from a previous run (mirrors `resetVideoManifest()`/
 *  `clearWaitStatus()`'s own reasoning in `fixtures/sessionFixture.ts`). */
export function resetPauseSignal(): void {
  fs.rmSync(PAUSE_STATUS_PATH, { force: true });
  fs.rmSync(CONTINUE_SIGNAL_PATH, { force: true });
}

/** Pauses the test: writes a status the dashboard's `pause-status` route
 *  can show a "Continue" button for, then polls for the `continue-signal`
 *  file that button's own route writes. Clears both marker files before
 *  returning (success OR timeout) so nothing leaks into whatever runs
 *  next. Throws if nobody clicks Continue within `maxWaitMs` — a real
 *  failure, not a silent skip, so an abandoned run doesn't hang the
 *  dashboard's own outer kill-timer indefinitely. */
export async function pauseForDashboardContinue(
  label: string,
  opts: { transactions?: PausedTransaction[]; maxWaitMs?: number } = {},
): Promise<void> {
  const { transactions, maxWaitMs = 25 * 60_000 } = opts;
  writePauseStatus(label, transactions);
  try {
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      if (fs.existsSync(CONTINUE_SIGNAL_PATH)) return;
      await new Promise((resolve) => { setTimeout(resolve, 2_000); });
    }
    throw new Error(`Timed out after ${Math.round(maxWaitMs / 60_000)} min waiting for the dashboard's Continue button — nobody clicked it in time.`);
  } finally {
    fs.rmSync(PAUSE_STATUS_PATH, { force: true });
    fs.rmSync(CONTINUE_SIGNAL_PATH, { force: true });
  }
}
