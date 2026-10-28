import { NextResponse } from "next/server";
import { listRunHistory } from "@/lib/server/evidenceHistory";

// Past runs for the 12166 E2E tab — every run folder under
// public/qa-artifacts/eauto-12166/ (the run route keeps the last 10).

export async function GET() {
  return NextResponse.json({ runs: listRunHistory("eauto-12166") });
}
