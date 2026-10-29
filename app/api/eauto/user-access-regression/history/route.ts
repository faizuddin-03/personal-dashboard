import { NextResponse } from "next/server";
import { listRunHistory } from "@/lib/server/evidenceHistory";

// Past runs for the User Access Regression tab — every run folder under
// public/qa-artifacts/eauto-user-access-regression/ (the run route keeps the
// last 10).

export async function GET() {
  return NextResponse.json({ runs: listRunHistory("eauto-user-access-regression") });
}
