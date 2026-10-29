import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveEautoRunTs } from "@/lib/eautoRunRegistry";

function isSafeGateId(id: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(id);
}

/**
 * Clicked from the dashboard's pause banner to unblock a manual gate (see
 * tests/service-hub/utils/manualGate.ts) — writes the `<gateId>.resume`
 * touch file the paused test process is polling for.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { runId, gateId } = body as { runId?: string; gateId?: string };

  if (!runId || !gateId) {
    return NextResponse.json({ error: "runId and gateId are required." }, { status: 400 });
  }
  if (!isSafeGateId(gateId)) {
    return NextResponse.json({ error: "Invalid gateId." }, { status: 400 });
  }

  const ts = resolveEautoRunTs(runId);
  if (!ts) {
    return NextResponse.json({ error: "No active run found for that runId — it may have already finished." }, { status: 404 });
  }

  const gateDir = path.join(process.cwd(), "test-evidence", ts, "_run", "gates");
  fs.mkdirSync(gateDir, { recursive: true });
  fs.writeFileSync(path.join(gateDir, `${gateId}.resume`), "");

  return NextResponse.json({ ok: true });
}
