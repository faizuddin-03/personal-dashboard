import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { readXlsx, sheetToCsv } from "@/lib/excelSheets";

// Extracts plain text from an uploaded test-plan template (docx / xlsx / txt / md).
// Legacy binary .xls is refused with a clear message: exceljs (which replaced
// the CVE-affected SheetJS 0.18.5) reads only the .xlsx format.
// so it can be stored client-side as a lightweight style reference instead of raw binary.

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 60_000; // keep localStorage usage sane across several templates

export async function POST(req: NextRequest) {
  const { name, mediaType, data } = (await req.json()) as { name?: string; mediaType?: string; data?: string };
  if (!name || !data) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buf = Buffer.from(data, "base64");
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)." }, { status: 400 });
  }

  const lower = name.toLowerCase();
  try {
    let text: string;
    if (lower.endsWith(".docx")) {
      text = (await mammoth.extractRawText({ buffer: buf })).value;
    } else if (lower.endsWith(".xlsx")) {
      const wb = await readXlsx(buf);
      text = wb.worksheets.map(ws => `--- Sheet: ${ws.name} ---\n${sheetToCsv(ws)}`).join("\n\n");
    } else if (lower.endsWith(".xls")) {
      return NextResponse.json({ error: "Legacy .xls files are not supported. Save the file as .xlsx and upload again." }, { status: 400 });
    } else if (lower.endsWith(".txt") || lower.endsWith(".md") || (mediaType ?? "").startsWith("text/")) {
      text = buf.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Unsupported template type. Use .docx, .xlsx, .txt, or .md." }, { status: 400 });
    }

    text = text.trim();
    if (!text) {
      return NextResponse.json({ error: "No readable text found in this file." }, { status: 400 });
    }
    return NextResponse.json({ text: text.slice(0, MAX_TEXT_CHARS) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? `Failed to read file: ${e.message}` : "Failed to read file" }, { status: 500 });
  }
}
