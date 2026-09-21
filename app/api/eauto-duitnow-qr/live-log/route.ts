import { NextRequest, NextResponse } from "next/server";
import { runState } from "../runState";

export async function GET(req: NextRequest) {
  const runId = new URL(req.url).searchParams.get("runId") ?? "";
  const entry = runState.runs.get(runId);
  return NextResponse.json({
    running: entry?.child != null,
    log: entry?.outputBuffer ?? "",
  });
}
