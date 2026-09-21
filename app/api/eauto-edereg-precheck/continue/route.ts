import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";

// The "Continue" button's own endpoint — writes the signal file
// `pauseForDashboardContinue()` (scripts/eauto-edereg-precheck/utils/
// pauseSignal.ts) polls for, unblocking a run that's currently paused on
// the SAME live browser session. Added 2026-08-27 for MU_TS11. Deliberately
// does NOT check `../pause-status/route.ts` first — writing this signal
// when nothing is actually paused is harmless (the marker just gets
// cleared at the START of the next run, same reasoning as every other
// reset in `fixtures/sessionFixture.ts`), so there's no need for this
// route to duplicate that check.
//
// CHANGED 2026-08-28: takes a `runId` in the POST body and writes the
// SCOPED signal file pauseSignal.ts's own DPC_RUN_ID-based naming expects
// — critical for two simultaneously paused runs (MU_TS11 + MU_TS12): before
// this, one shared signal file meant clicking Continue for either run woke
// up BOTH, even if the dev had only patched one of them. An empty/missing
// runId falls back to the original unscoped filename.
//
// Writes into `.run-signals/`, NOT `test-results/` — see pauseSignal.ts's
// own doc comment: `npx playwright test` wipes its entire `test-results/`
// outputDir at the start of every invocation, which would delete this
// signal (or the OTHER run's) the instant a second run started.
const SCRIPT_DIR = process.env.EAUTO_EDEREG_PRECHECK_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-edereg-precheck");

function continueSignalPath(runId: string): string {
  const suffix = runId ? `-${runId}` : "";
  return path.join(SCRIPT_DIR, ".run-signals", `continue-signal${suffix}.json`);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { runId?: string };
  const signalPath = continueSignalPath(body.runId ?? "");
  fs.mkdirSync(path.dirname(signalPath), { recursive: true });
  fs.writeFileSync(signalPath, JSON.stringify({ requestedAtMs: Date.now() }));
  return NextResponse.json({ ok: true });
}
