import { NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";

// The Company Details Checker's last results (scripts/eauto-company-checker/
// output-results.json) for the /eauto/12257 company picker. overall "PASS" =
// old BRN, new BRN and TIN all ABSENT from eAuto, i.e. free to onboard.

const OUTPUT_JSON = path.join(process.env.COMPANY_CHECKER_SCRIPT_DIR ?? path.join(process.cwd(), "scripts", "eauto-company-checker"), "output-results.json");

interface Row { roc: string; newRoc: string; tin: string; overall: string; rocStatus?: string; newRocStatus?: string; tinStatus?: string }

export async function GET() {
  try {
    const raw = JSON.parse(fs.readFileSync(OUTPUT_JSON, "utf-8")) as { results?: Row[] };
    const rows = (raw.results ?? []).filter(r => r.roc && r.newRoc);
    const mtime = fs.statSync(OUTPUT_JSON).mtimeMs;
    return NextResponse.json({ rows, checkedAt: mtime });
  } catch {
    return NextResponse.json({ rows: [], checkedAt: 0, error: "No Company Details Checker results yet — run /eauto/company-details-checker first." });
  }
}
