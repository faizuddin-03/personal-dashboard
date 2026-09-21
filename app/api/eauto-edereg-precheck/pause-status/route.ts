import { NextRequest, NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";

// Lightweight status the dashboard polls WHILE a run is in flight, mirroring
// ../wait-status/route.ts's own pattern — lets the dashboard know a running
// test has reached `pauseForDashboardContinue()`
// (scripts/eauto-edereg-precheck/utils/pauseSignal.ts) and is blocked on the
// SAME live browser session until a human clicks "Continue". Added
// 2026-08-27 for MU_TS11, per Faizuddin: "i need the continue button to
// still be on the exact same transaction, to see what the transaction
// does." See knowledge/flow-edereg.md for the full reasoning.
//
// CHANGED 2026-08-28: scoped to a `runId` query param, matching
// pauseSignal.ts's own DPC_RUN_ID-scoped filename — so two simultaneously
// paused runs (e.g. MU_TS11 + MU_TS12, each in its own browser tab) each
// get their own status file read back, instead of one overwriting the
// other. A missing/empty runId falls back to the original unscoped
// filename (a run started outside the dashboard's runId plumbing).
//
// Reads from `.run-signals/`, NOT `test-results/` — confirmed 2026-08-28
// that `npx playwright test` wipes its entire `test-results/` outputDir at
// the start of every invocation, which was silently deleting one run's
// pause file the instant a second run started, even with a runId-scoped
// filename. See pauseSignal.ts's own doc comment for the full story.
const SCRIPT_DIR = process.env.EAUTO_EDEREG_PRECHECK_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-edereg-precheck");

function pauseStatusPath(runId: string): string {
  const suffix = runId ? `-${runId}` : "";
  return path.join(SCRIPT_DIR, ".run-signals", `pause-status${suffix}.json`);
}

export async function GET(req: NextRequest) {
  const runId = new URL(req.url).searchParams.get("runId") ?? "";
  const pausePath = pauseStatusPath(runId);
  if (!fs.existsSync(pausePath)) {
    return NextResponse.json({ paused: false });
  }
  try {
    const status = JSON.parse(fs.readFileSync(pausePath, "utf8")) as {
      label: string; pausedAtMs: number;
      // One entry per transaction the dev needs to act on — more than one
      // when a scenario has genuinely separate records (MU_TS11's User
      // A/User B, different companies). Added 2026-08-27.
      transactions?: { label: string; transactionId: string }[];
    };
    return NextResponse.json({ paused: true, ...status });
  } catch {
    return NextResponse.json({ paused: false });
  }
}
