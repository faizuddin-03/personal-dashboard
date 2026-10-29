import * as fs from "node:fs";
import * as path from "node:path";
import { usageKey, type UsageLedger } from "@/lib/companyUsageLedger";

// Onboarding runs print `COMPANY_SPOILED:{roc,newRoc,tin,companyName,reason}`
// when eAuto refuses the company's details (PreApplicationPage
// failIfCompanySpoiled, 2026-10-23). The run routes pass their log here so the
// company is marked used for good (confirmed) in the shared ledger,
// data/onboarding/usage.json — the same file app/api/onboarding-companies/usage
// serves — and no page picks it again.

const FILE = path.join(process.cwd(), "data", "onboarding", "usage.json");

export function markSpoiledCompanies(output: string, ticket: string): number {
  const found: Array<{ roc: string; newRoc: string; tin: string; companyName?: string; reason?: string }> = [];
  for (const line of output.split(/\r?\n/)) {
    const i = line.indexOf("COMPANY_SPOILED:");
    if (i < 0) continue;
    try {
      const d = JSON.parse(line.slice(i + "COMPANY_SPOILED:".length));
      if (d?.roc && d?.newRoc) found.push(d);
    } catch { /* not ours */ }
  }
  // TIN_SPOILED:{tin,reason} = eAuto refused the TIN; TIN_USED:{tin} = a fake /
  // Business Trading run got past the form with it. Either way it is gone.
  for (const line of output.split(/\r?\n/)) {
    const m = /(TIN_SPOILED|TIN_USED):(\{.*\})/.exec(line);
    if (!m) continue;
    try {
      const d = JSON.parse(m[2]);
      if (d?.tin) found.push({ roc: "TIN", newRoc: "-", tin: String(d.tin).toUpperCase(), reason: m[1] === "TIN_USED" ? "TIN typed by a run" : (d.reason ?? "TIN refused by eAuto") });
    } catch { /* not ours */ }
  }
  if (!found.length) return 0;
  let ledger: UsageLedger = {};
  try { ledger = JSON.parse(fs.readFileSync(FILE, "utf-8")) as UsageLedger; } catch { /* first entry */ }
  for (const d of found) {
    const row = { roc: d.roc, newRoc: d.newRoc, tin: d.tin ?? "" };
    const key = usageKey(row);
    const old = ledger[key];
    ledger[key] = {
      ...old,
      key,
      ...row,
      ticket: old?.ticket ?? ticket,
      companyName: old?.companyName ?? d.companyName,
      reference: d.roc === "TIN" ? d.reason : `Spoiled: ${d.reason ?? "refused by eAuto"}`,
      confirmed: true,
      usedAt: old?.usedAt ?? new Date().toISOString(),
    };
  }
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(ledger, null, 1));
  return found.length;
}
