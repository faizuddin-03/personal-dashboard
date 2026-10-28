import { NextRequest, NextResponse } from "next/server";
import { readXlsx } from "@/lib/excelSheets";
import { parseTsWorkbook } from "@/lib/tsTrackerImport";

// TS Tracker "Import TS from Excel" (Faizuddin, 2026-10-21: "make it so that it
// can read my excel, and automatically create how many TS i have with the TS
// objective/name included"). Multipart upload, field "file". Returns a
// preview only — the page applies it to localStorage after the user confirms.

const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(req: NextRequest) {
  let form: FormData;
  try { form = await req.formData(); } catch {
    return NextResponse.json({ error: "Expected a multipart upload with a file." }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  const name = file.name || "workbook.xlsx";
  if (/\.xls$/i.test(name)) {
    return NextResponse.json({ error: "Legacy .xls is not supported. Save the file as .xlsx and try again." }, { status: 400 });
  }
  if (!/\.xlsx$/i.test(name)) {
    return NextResponse.json({ error: "Only .xlsx workbooks can be imported." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 15 MB)." }, { status: 400 });
  }
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = await readXlsx(buf);
    const preview = parseTsWorkbook(wb, name);
    return NextResponse.json(preview);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? `Could not read the workbook: ${e.message}` : "Could not read the workbook." }, { status: 500 });
  }
}
