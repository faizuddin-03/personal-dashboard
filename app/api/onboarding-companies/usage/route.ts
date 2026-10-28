import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";
import type { UsageEntry, UsageLedger } from "@/lib/companyUsageLedger";

// Which onboarding companies are spent, kept on the dashboard server so every
// browser and every onboarding page sees the same list (Faizuddin, 2026-10-22:
// "the system itself will keep track of what's used, and whats not").
// GET → the ledger. POST { mark: UsageEntry[] } adds entries (a confirmed entry
// is never downgraded); POST { release: key[] } makes those companies free again.

const FILE = path.join(process.cwd(), "data", "onboarding", "usage.json");

function read(): UsageLedger {
  try { return JSON.parse(fs.readFileSync(FILE, "utf-8")) as UsageLedger; } catch { return {}; }
}

function write(ledger: UsageLedger) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(ledger, null, 1));
}

export async function GET() {
  return NextResponse.json(read());
}

export async function POST(req: NextRequest) {
  let body: { mark?: UsageEntry[]; release?: string[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
  const ledger = read();
  for (const e of body.mark ?? []) {
    if (!e?.key || !e.roc || !e.newRoc) continue;
    const old = ledger[e.key];
    if (old?.confirmed && !e.confirmed) continue;
    ledger[e.key] = { ...old, ...e, scenario: e.scenario || old?.scenario, companyName: e.companyName || old?.companyName, reference: e.reference || old?.reference };
  }
  for (const k of body.release ?? []) delete ledger[k];
  write(ledger);
  return NextResponse.json(ledger);
}
