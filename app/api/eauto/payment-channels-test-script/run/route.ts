import { NextResponse } from "next/server";

// EAINT-12153 — placeholder for the "Test Script" tab's Run button
// (app/eauto/company-details-checker/TestScriptTab.tsx). No Playwright
// automation exists yet for the payment-channels TS1-8 scenarios, so this
// route exists only to give the tab's loading/error plumbing something real
// to call rather than faking a result. Replace the POST body with an actual
// runner (mirroring app/api/eauto-edereg-precheck/run/route.ts's shape)
// once scripts/eauto-* automation is written for this ticket.

export async function POST() {
  return NextResponse.json(
    { error: "Automation not built yet for EAINT-12153 payment channels — this tab is a UI shell. See knowledge/eauto-payments.md." },
    { status: 501 },
  );
}

export async function DELETE() {
  return NextResponse.json({ stopped: false });
}
