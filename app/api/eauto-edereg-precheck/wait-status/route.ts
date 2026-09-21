import { NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";

// Lightweight status the dashboard polls WHILE a run is in flight — the
// main /run route's own fetch() doesn't resolve until the whole test
// finishes, so this is the only way to know mid-run that
// DeregTransactionPage.waitOutPaymentResetTimer() (CPC_E2E_TS5/TS11 Part 2's
// RHB "RE" reset-timer wait, ~6.5 minutes) is currently in progress — used
// to warn Faizuddin to reconnect the VPN before the automation touches
// eSIM again right after. See scripts/eauto-edereg-precheck/utils/
// waitStatus.ts for the marker file this reads and knowledge/flow-edereg.md
// §13 for the full reasoning. Per Faizuddin, 2026-08-24.
const SCRIPT_DIR = process.env.EAUTO_EDEREG_PRECHECK_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "eauto-edereg-precheck");
const WAIT_STATUS_PATH = path.join(SCRIPT_DIR, "test-results", "wait-status.json");

export async function GET() {
  if (!fs.existsSync(WAIT_STATUS_PATH)) {
    return NextResponse.json({ waiting: false });
  }
  try {
    const status = JSON.parse(fs.readFileSync(WAIT_STATUS_PATH, "utf8")) as {
      label: string; startedAtMs: number; waitMs: number;
    };
    return NextResponse.json({ waiting: true, ...status });
  } catch {
    return NextResponse.json({ waiting: false });
  }
}
