import * as fs from 'node:fs';
import * as path from 'node:path';

// ── Wait-status marker — lets the dashboard warn about the VPN mid-run ──
// The dashboard's single `fetch()` to the run route doesn't resolve until
// the WHOLE test finishes (app/api/eauto-edereg-precheck/run/route.ts spawns
// the child and only replies once it closes) — there is no live progress
// channel while a run is in flight. But CPC_E2E_TS5/TS11 Part 2's RHB "RE"
// reset-timer wait (DeregTransactionPage.waitOutPaymentResetTimer, a real
// ~6.5-minute idle period) is exactly when Faizuddin's VPN tends to
// disconnect — and the automation needs the VPN again right after, to
// re-steer eSIM before retrying payment. Per Faizuddin, 2026-08-24: warn
// ~1 minute before that VPN-dependent step, not tied to any confirmed VPN
// timeout duration.
//
// This writes a small JSON marker (`test-results/wait-status.json`) the
// MOMENT the wait starts, with its start time + duration — a separate
// lightweight route (`app/api/eauto-edereg-precheck/wait-status/route.ts`)
// reads it back, and the dashboard page polls that route while a run is in
// progress to show an attention-grabbing "reconnect the VPN" banner once
// under a minute remains. Cleared the moment the wait ends (success or not)
// so a stale marker can never linger into the next run.
const WAIT_STATUS_PATH = path.join(process.cwd(), 'test-results', 'wait-status.json');

export interface WaitStatus {
  label: string;
  startedAtMs: number;
  waitMs: number;
}

export function writeWaitStatus(label: string, waitMs: number): void {
  fs.mkdirSync(path.dirname(WAIT_STATUS_PATH), { recursive: true });
  const status: WaitStatus = { label, startedAtMs: Date.now(), waitMs };
  fs.writeFileSync(WAIT_STATUS_PATH, JSON.stringify(status));
}

export function clearWaitStatus(): void {
  fs.rmSync(WAIT_STATUS_PATH, { force: true });
}
