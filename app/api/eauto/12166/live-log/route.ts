import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveEautoRunTs } from "@/lib/eautoRunRegistry";

/**
 * Polled every 2s by useBackgroundRuns while a run is in flight (see
 * hooks/useBackgroundRuns.ts's POLL_MS loop) — the hook only reads
 * `data.log` as a plain string, so a manual gate (see
 * tests/service-hub/utils/manualGate.ts) is surfaced as a single marker
 * line the dashboard page parses back out:
 *   [GATE:waiting:<gateId>] <message>
 * Empty string means nothing is currently waiting on a human.
 */
export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) return NextResponse.json({ log: "" });

  const ts = resolveEautoRunTs(runId);
  if (!ts) return NextResponse.json({ log: "" });

  const gateDir = path.join(process.cwd(), "test-evidence", ts, "_run", "gates");
  if (!fs.existsSync(gateDir)) return NextResponse.json({ log: "" });

  try {
    const waitingFiles = fs.readdirSync(gateDir).filter((f) => f.endsWith(".waiting.json"));
    if (waitingFiles.length === 0) return NextResponse.json({ log: "" });
    // Only one gate is ever active at a time in practice — take the first.
    const data = JSON.parse(fs.readFileSync(path.join(gateDir, waitingFiles[0]), "utf-8")) as {
      gateId: string;
      message: string;
    };
    return NextResponse.json({ log: `[GATE:waiting:${data.gateId}] ${data.message}` });
  } catch {
    return NextResponse.json({ log: "" });
  }
}
