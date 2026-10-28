import { NextResponse } from "next/server";
import { buildTicketTsCatalog } from "@/lib/server/ticketTsCatalog";

// TS lists of every /tickets page, read from the page sources. Used by
// lib/tsTrackerTally.ts to keep the TS Tracker in step with /tickets.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(buildTicketTsCatalog());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
