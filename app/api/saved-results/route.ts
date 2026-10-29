import { NextRequest, NextResponse } from "next/server";
import { deleteResult, loadResult } from "@/lib/server/savedResults";
import { SAVED_RESULT_KEYS } from "@/lib/savedRunKeys";

// GET /api/saved-results?key=<run key> — the last saved result of an eAuto tool
// run (lib/server/savedResults.ts). Only keys in SAVED_RESULT_KEYS are served.

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? "";
  if (!SAVED_RESULT_KEYS.includes(key)) return NextResponse.json({ error: "Unknown key." }, { status: 400 });
  const saved = loadResult(key);
  return NextResponse.json({ saved });
}

/** DELETE — the page cleared its result (useBackgroundRuns clearRun). */
export async function DELETE(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? "";
  if (!SAVED_RESULT_KEYS.includes(key)) return NextResponse.json({ error: "Unknown key." }, { status: 400 });
  deleteResult(key);
  return NextResponse.json({ deleted: true });
}
