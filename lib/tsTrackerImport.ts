// ── TS workbook → TS Tracker import preview (server side) ─
// Reads a team TS workbook (the draft-TS-excel house format) and returns the
// CRs, sections and TS (number + objective + current status) it holds. No
// steps — the tracker only tracks progress (Faizuddin, 2026-10-21).
//
// Format, verified on _reference/tickets/EAINT-12412/*.xlsx and
// _reference/tickets/EAINT-12107/New 20_10_26*.xlsx:
//   1. Row 1: merged title "EAINT-12412 - [..] ..." or "EAINT-12107 & EAINT-12327 - ..."
//   2. Header row(s) whose first cell is "TS No." — may be two (group row, then
//      "TS No., Scenario, Steps, ..."). Objective column "Test Objective" /
//      "Scenario"; status column "Test Result" / "Status (Pass/Fail)".
//   3. Section banners: every cell holds the same text ("A. UCD — ...").
//   4. TS rows: first cell "12412_TS01". One TS may span several rows
//      (12107_TS06) — deduped, first objective wins.
// Every sheet with a "TS No." header is read.

import type ExcelJS from "exceljs";
import type { ImportCR, ImportPreview, TsStatus } from "@/lib/tsTrackerModel";
import { normTs } from "@/lib/tsTrackerModel";

const KEY_RE = /\b([A-Z][A-Z0-9]+-\d+)\b/g;
const TS_CELL_RE = /^[A-Za-z0-9_-]*TS\s*\d+[A-Za-z]?$/i;
const DEFAULT_SUITE = "Test scenarios";

export function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v !== "object") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if ("richText" in v) return v.richText.map(r => r.text).join("");
  if ("formula" in v || "sharedFormula" in v) {
    const res = (v as ExcelJS.CellFormulaValue).result;
    return res === undefined || res === null || typeof res === "object" ? "" : String(res);
  }
  if ("hyperlink" in v) return String((v as ExcelJS.CellHyperlinkValue).text ?? "");
  if ("error" in v) return "";
  return String(v);
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function mapImportStatus(s: string): TsStatus {
  const v = s.trim().toLowerCase();
  if (/^pass/.test(v)) return "pass";
  if (/^fail/.test(v)) return "fail";
  if (/^wip\b|in.?progress/.test(v)) return "in-progress";
  return null;
}

interface Acc {
  crKey: string;
  suites: { title: string; cases: { tsNumber: string; objective: string; status: TsStatus }[] }[];
  seen: Map<string, { objective: string; status: TsStatus; ref: { tsNumber: string; objective: string; status: TsStatus } }>;
}

export function parseTsWorkbook(wb: ExcelJS.Workbook, filename: string): ImportPreview {
  const warnings: string[] = [];
  const sheets: string[] = [];
  const accs = new Map<string, Acc>();
  let title = "";

  for (const ws of wb.worksheets) {
    const colCount = Math.max(ws.columnCount, 1);
    const rowTexts = (row: ExcelJS.Row) => {
      const out: string[] = [];
      for (let c = 1; c <= colCount; c++) out.push(clean(cellText(row.getCell(c).value)));
      return out;
    };

    // Pass 1: header rows + title.
    const headerRows: number[] = [];
    let sheetTitle = "";
    ws.eachRow((row, n) => {
      const cells = rowTexts(row);
      if (/^TS\s*No\.?$/i.test(cells[0] ?? "")) { headerRows.push(n); return; }
      if (!headerRows.length && !sheetTitle) {
        const first = cells.find(Boolean) ?? "";
        if (/\b[A-Z][A-Z0-9]+-\d+\b/.test(first)) sheetTitle = first;
      }
    });
    if (!headerRows.length) continue;
    sheets.push(ws.name);
    if (!title && sheetTitle) title = sheetTitle;

    let objCol = -1, statusCol = -1;
    for (const n of headerRows) {
      const cells = rowTexts(ws.getRow(n));
      cells.forEach((t, i) => {
        if (i === 0) return;
        if (objCol < 0 && /test objective|^objective|^scenario/i.test(t)) objCol = i;
        if (statusCol < 0 && /test result|^status|^result/i.test(t)) statusCol = i;
      });
    }
    if (objCol < 0) {
      objCol = 1;
      warnings.push(`Sheet "${ws.name}": no "Test Objective" / "Scenario" column found — used column B.`);
    }
    if (statusCol < 0) warnings.push(`Sheet "${ws.name}": no status column found — TS imported as Not started.`);

    const titleKeys = [...(sheetTitle || title).matchAll(KEY_RE)].map(m => m[1]);
    const fileKeys = [...filename.toUpperCase().matchAll(KEY_RE)].map(m => m[1]);
    const keys = titleKeys.length ? titleKeys : fileKeys;
    const project = keys[0]?.split("-")[0] ?? "EAINT";
    if (!keys.length) warnings.push(`Sheet "${ws.name}": no ticket key in the title or filename — TS filed under ${project}-UNKNOWN.`);

    const keyFor = (ts: string): string => {
      const prefix = ts.match(/^(\d{4,})_/)?.[1];
      if (prefix) return keys.find(k => k.endsWith(`-${prefix}`)) ?? `${project}-${prefix}`;
      return keys[0] ?? `${project}-UNKNOWN`;
    };

    let banner: string | null = null;
    const lastHeader = Math.max(...headerRows);
    ws.eachRow((row, n) => {
      if (n <= headerRows[0] || headerRows.includes(n)) return;
      const cells = rowTexts(row);
      const first = cells[0] ?? "";
      if (!cells.some(Boolean)) return;

      if (TS_CELL_RE.test(first)) {
        const tsNumber = first.replace(/\s+/g, "").toUpperCase();
        const crKey = keyFor(tsNumber);
        let acc = accs.get(crKey);
        if (!acc) { acc = { crKey, suites: [], seen: new Map() }; accs.set(crKey, acc); }
        const objective = cells[objCol] ?? "";
        const status = statusCol >= 0 ? mapImportStatus(cells[statusCol] ?? "") : null;
        const norm = normTs(tsNumber);
        const prev = acc.seen.get(norm);
        if (prev) {
          // Continuation row of the same TS: first objective wins; fill blanks only.
          if (!prev.ref.objective && objective) prev.ref.objective = objective;
          if (!prev.ref.status && status) prev.ref.status = status;
          return;
        }
        const suiteTitle = banner ?? DEFAULT_SUITE;
        let suite = acc.suites.find(s => s.title === suiteTitle);
        if (!suite) { suite = { title: suiteTitle, cases: [] }; acc.suites.push(suite); }
        const ref = { tsNumber, objective, status };
        suite.cases.push(ref);
        acc.seen.set(norm, { objective, status, ref });
        return;
      }

      // Section banner: every non-empty cell holds the same text.
      const filled = cells.filter(Boolean);
      if (n > lastHeader && filled.length && filled.every(t => t === filled[0]) && !/^TS\s*No\.?$/i.test(filled[0])) {
        banner = filled[0];
      }
    });
  }

  // CR summaries: title text after the keys; "A + B" split per key when counts match.
  const titleKeys = [...title.matchAll(KEY_RE)].map(m => m[1]);
  const rest = title.replace(/^[\sA-Z0-9&,+-]*?\b[A-Z][A-Z0-9]+-\d+\b(?:\s*(?:&|\+|,|and)\s*[A-Z][A-Z0-9]+-\d+\b)*\s*[-–—:]\s*/, "").trim();
  const parts = rest.split(/\s\+\s/).map(s => s.trim()).filter(Boolean);
  const summaryFor = (key: string): string => {
    const i = titleKeys.indexOf(key);
    if (i >= 0 && parts.length === titleKeys.length) return parts[i];
    return rest || title || filename.replace(/\.xlsx$/i, "");
  };

  const crs: ImportCR[] = [...accs.values()].map(a => ({
    crKey: a.crKey,
    crSummary: summaryFor(a.crKey),
    suites: a.suites.map(s => ({ title: s.title, cases: s.cases.map(c => ({ ...c })) })),
  }));
  if (!sheets.length) warnings.push('No sheet has a header row starting with "TS No.".');
  else if (!crs.length) warnings.push("Header found, but no TS rows (first cell like 12412_TS01).");
  return { filename, sheets, crs, warnings };
}
