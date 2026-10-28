import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";
import { readXlsx } from "@/lib/excelSheets";
import { typeFromNewRoc, type OnboardingCompany, type OnboardingCompanyList } from "@/lib/onboardingCompanyTypes";

// The shared onboarding company list (lib/onboardingCompanies.ts). POST a
// Company Details Checker export (.xlsx, field "file") to replace it; GET
// returns the parsed rows. Stored on the dashboard server under data/onboarding
// (gitignored — real BRNs and TINs) so every onboarding page reads the same list.

const DIR = path.join(process.cwd(), "data", "onboarding");
const JSON_FILE = path.join(DIR, "companies.json");
const MAX_BYTES = 15 * 1024 * 1024;

/** Header text → our field, matched loosely (case, spaces, punctuation ignored). */
const HEADERS: Record<string, keyof Omit<OnboardingCompany, "type">> = {
  companyroc: "roc",
  roc: "roc",
  newcompanyroc: "newRoc",
  newroc: "newRoc",
  tinnumber: "tin",
  tin: "tin",
  overall: "overall",
  tinstatus: "tinStatus",
};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export async function GET() {
  try {
    return NextResponse.json(JSON.parse(fs.readFileSync(JSON_FILE, "utf-8")) as OnboardingCompanyList);
  } catch {
    return NextResponse.json({ file: "", uploadedAt: "", rows: [], error: "No company Excel dropped yet." });
  }
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try { form = await req.formData(); } catch {
    return NextResponse.json({ error: "Expected a multipart upload with a file." }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  const name = file.name || "companies.xlsx";
  if (!/\.xlsx$/i.test(name)) return NextResponse.json({ error: "Only .xlsx files can be used. Save the file as .xlsx and try again." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 15 MB)." }, { status: 400 });

  try {
    const wb = await readXlsx(Buffer.from(await file.arrayBuffer()));
    const rows: OnboardingCompany[] = [];
    for (const ws of wb.worksheets) {
      // The header row: the first row (of the first 10) naming both ROC columns.
      let headerRow = 0;
      const cols: Partial<Record<keyof Omit<OnboardingCompany, "type">, number>> = {};
      for (let r = 1; r <= Math.min(ws.rowCount, 10) && !headerRow; r++) {
        const found: typeof cols = {};
        ws.getRow(r).eachCell((cell, c) => { const f = HEADERS[norm(String(cell.text ?? ""))]; if (f && !found[f]) found[f] = c; });
        if (found.roc && found.newRoc) { headerRow = r; Object.assign(cols, found); }
      }
      if (!headerRow) continue;
      for (let r = headerRow + 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const get = (f: keyof typeof cols) => (cols[f] ? String(row.getCell(cols[f]!).text ?? "").trim() : "");
        // Trailing "*" marks a hand note in his sheet, not part of the number.
        const roc = get("roc").replace(/\*+$/, "").toUpperCase();
        const newRoc = get("newRoc").replace(/\D/g, "");
        if (!roc || !newRoc) continue;
        rows.push({ roc, newRoc, tin: get("tin").replace(/\*+$/, "").toUpperCase(), overall: get("overall").toUpperCase(), ...(cols.tinStatus ? { tinStatus: get("tinStatus").toUpperCase() } : {}), type: typeFromNewRoc(newRoc) });
      }
    }
    if (!rows.length) {
      return NextResponse.json({ error: 'No company rows found. The sheet needs "Company ROC" and "New Company ROC" columns (TIN Number and Overall are read when present).' }, { status: 400 });
    }
    const list: OnboardingCompanyList = { file: name, uploadedAt: new Date().toISOString(), rows };
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(JSON_FILE, JSON.stringify(list, null, 1));
    return NextResponse.json(list);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? `Could not read the workbook: ${e.message}` : "Could not read the workbook." }, { status: 500 });
  }
}
