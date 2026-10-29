import { NextRequest, NextResponse } from "next/server";
import { runState } from "../runState";

// Lightweight polling endpoint, added 2026-08-26 — run/route.ts's own POST
// fetch() doesn't resolve until the whole child process closes, so there was
// no way to see a run's output WHILE it's in flight. This just reads the
// SAME output buffer run/route.ts already accumulates as the child's
// stdout/stderr streams in, so nothing about the run itself changes — this
// is purely an additional read path onto state that already existed.
//
// CHANGED 2026-08-28: scoped to a `runId` query param (the same client-
// generated id page.tsx's own run() sends to /run and every other route) —
// runState is now a Map of concurrent runs (see runState.ts's own doc
// comment), so this needs to know WHICH run's buffer to read. A missing/
// unknown runId just reads as "not running" rather than erroring.
export async function GET(req: NextRequest) {
  const runId = new URL(req.url).searchParams.get("runId") ?? "";
  const entry = runState.runs.get(runId);
  return NextResponse.json({
    running: entry?.child != null,
    log: entry?.runOutputBuffer ?? "",
  });
}
