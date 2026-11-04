// Live Pass / Fail count of a ticket's OFFICIAL TS workbook (Faizuddin,
// 2026-11-03: "is there a way for my dashboard to immediately check the
// pass/failed rate, and update the dashboard immediately").
//
// Reads the OneDrive-synced copy named in the pipeline ticket
// (files.officialTs). READ ONLY: the file is read into memory and never
// written. Delay = SharePoint save (about 1–3 min after an Excel Online edit,
// seen 2026-11-03) + OneDrive download; nothing on this side waits longer.
//
// Layout handled (EAINT-9805, also the single-column house format):
//   1. Each tab with a "TS No." header cell is read.
//   2. Result columns = columns right of "TS No." whose header is a status
//      header (Status / Test Result) or a device name, i.e. any column that
//      holds a status value (Pass / Fail / In Progress / Not Started ...) in
//      at least one TS row.
//   3. TS rows = rows whose "TS No." cell is a TS id (9805_DM_TS01, TS01 ...).
//   4. An empty result cell (grey: the TS does not run there) is not counted.
import fs from "node:fs";
import type ExcelJS from "exceljs";
import { readXlsx } from "@/lib/excelSheets";
import { cellText } from "@/lib/tsTrackerImport";

export const RESULT_STATUSES = ["Pass", "Fail", "In Progress", "Not Started", "Blocked", "N/A"] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number] | "Other";
export type Counts = Record<ResultStatus, number>;

export interface ColumnResult { header: string; counts: Counts }
export interface SheetResult {
  name: string;
  tsCount: number;
  columns: ColumnResult[];
  counts: Counts;
}
export interface ResultCell { sheet: string; ts: string; column: string; objective: string; status: ResultStatus }
/** One TS row: its result per open column (grey columns left out). */
export interface OfficialCase { sheet: string; section: string; ts: string; objective: string; cells: { column: string; status: ResultStatus }[] }
export interface TsResults {
  file: string;
  mtimeMs: number;
  modifiedAt: string;
  readAt: string;
  sheets: SheetResult[];
  counts: Counts;
  /** Pass / (Pass + Fail), 0–100, null when nothing is tested yet. */
  passRate: number | null;
  /** (Pass + Fail) / all counted cells, 0–100. */
  executed: number;
  failed: ResultCell[];
  inProgress: ResultCell[];
  cases: OfficialCase[];
}

const TS_HEADER = /^TS\s*No\.?$/i;
const TS_ID = /^[A-Za-z0-9]*[_-]?(?:[A-Za-z]+_)?TS\s*_?\d+[A-Za-z]?$/i;
const OBJECTIVE_HEADER = /^(test\s*objective|scenario|objective)/i;

const emptyCounts = (): Counts => ({ Pass: 0, Fail: 0, "In Progress": 0, "Not Started": 0, Blocked: 0, "N/A": 0, Other: 0 });

function statusOf(text: string): ResultStatus | null {
  const t = text.trim().replace(/\s+/g, " ").toLowerCase();
  if (!t) return null;
  if (t === "pass" || t === "passed") return "Pass";
  if (t === "fail" || t === "failed") return "Fail";
  if (t === "in progress") return "In Progress";
  if (t === "not started") return "Not Started";
  if (t === "blocked") return "Blocked";
  if (t === "n/a" || t === "na" || t === "not applicable") return "N/A";
  return "Other";
}

const text = (ws: ExcelJS.Worksheet, r: number, c: number) => cellText(ws.getCell(r, c).value).trim();

function readSheet(ws: ExcelJS.Worksheet, failed: ResultCell[], inProgress: ResultCell[], cases: OfficialCase[]): SheetResult | null {
  // Header row: first row with a "TS No." cell.
  let headRow = 0, tsCol = 0;
  for (let r = 1; r <= Math.min(ws.rowCount, 30) && !headRow; r++) {
    for (let c = 1; c <= Math.min(ws.columnCount, 40); c++) {
      if (TS_HEADER.test(text(ws, r, c))) { headRow = r; tsCol = c; break; }
    }
  }
  if (!headRow) return null;

  const lastCol = ws.columnCount;
  let objCol = 0;
  for (let c = tsCol + 1; c <= lastCol; c++) if (OBJECTIVE_HEADER.test(text(ws, headRow, c))) { objCol = c; break; }

  const tsRows: number[] = [];
  for (let r = headRow + 1; r <= ws.rowCount; r++) if (TS_ID.test(text(ws, r, tsCol).replace(/\s+/g, ""))) tsRows.push(r);
  if (!tsRows.length) return null;

  // Result columns: any column right of TS No. holding a known status value.
  const resultCols: number[] = [];
  for (let c = tsCol + 1; c <= lastCol; c++) {
    if (c === objCol) continue;
    const known = tsRows.some(r => { const s = statusOf(text(ws, r, c)); return s !== null && s !== "Other"; });
    if (known) resultCols.push(c);
  }

  const sheet: SheetResult = { name: ws.name, tsCount: tsRows.length, columns: [], counts: emptyCounts() };
  const byRow = new Map<number, OfficialCase>();
  // Section = the nearest banner row above (a row with text in "TS No." that is not a TS id).
  const sectionOf = (row: number) => {
    for (let r = row - 1; r > headRow; r--) {
      const t = text(ws, r, tsCol);
      if (t && !TS_ID.test(t.replace(/\s+/g, ""))) return t;
    }
    return "";
  };
  for (const r of tsRows) {
    const ts = text(ws, r, tsCol).replace(/\s+/g, "");
    if (cases.some(c => c.ts === ts)) continue; // a TS split over two rows: first row wins
    const oc: OfficialCase = { sheet: ws.name, section: sectionOf(r), ts, objective: objCol ? text(ws, r, objCol) : "", cells: [] };
    byRow.set(r, oc);
    cases.push(oc);
  }
  for (const c of resultCols) {
    const header = text(ws, headRow, c) || `Column ${c}`;
    const col: ColumnResult = { header, counts: emptyCounts() };
    for (const r of tsRows) {
      const s = statusOf(text(ws, r, c));
      if (!s) continue; // grey / not applicable: not counted
      col.counts[s]++;
      sheet.counts[s]++;
      byRow.get(r)?.cells.push({ column: header, status: s });
      if (s === "Fail" || s === "In Progress") {
        const cell: ResultCell = {
          sheet: ws.name, ts: text(ws, r, tsCol).replace(/\s+/g, ""), column: header,
          objective: objCol ? text(ws, r, objCol) : "", status: s,
        };
        (s === "Fail" ? failed : inProgress).push(cell);
      }
    }
    sheet.columns.push(col);
  }
  return sheet.columns.length ? sheet : null;
}

const cache = new Map<string, { mtimeMs: number; size: number; result: TsResults }>();

/** Stat only: cheap enough to call every few seconds. */
export function officialTsStamp(file: string): { mtimeMs: number; size: number } | null {
  try { const s = fs.statSync(file); return { mtimeMs: s.mtimeMs, size: s.size }; } catch { return null; }
}

export async function readOfficialTsResults(file: string): Promise<TsResults> {
  const stamp = officialTsStamp(file);
  if (!stamp) throw new Error("The official TS file was not found in the OneDrive folder.");
  const hit = cache.get(file);
  if (hit && hit.mtimeMs === stamp.mtimeMs && hit.size === stamp.size) return hit.result;

  const wb = await readXlsx(await fs.promises.readFile(file));
  const failed: ResultCell[] = [], inProgress: ResultCell[] = [], cases: OfficialCase[] = [];
  const sheets: SheetResult[] = [];
  const counts = emptyCounts();
  wb.eachSheet(ws => {
    const s = readSheet(ws, failed, inProgress, cases);
    if (!s) return;
    sheets.push(s);
    for (const k of Object.keys(counts) as ResultStatus[]) counts[k] += s.counts[k];
  });
  const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
  const tested = counts.Pass + counts.Fail;
  const result: TsResults = {
    file,
    mtimeMs: stamp.mtimeMs,
    modifiedAt: new Date(stamp.mtimeMs).toISOString(),
    readAt: new Date().toISOString(),
    sheets,
    counts,
    passRate: tested ? Math.round((counts.Pass / tested) * 1000) / 10 : null,
    executed: total ? Math.round((tested / total) * 1000) / 10 : 0,
    failed,
    inProgress,
    cases,
  };
  cache.set(file, { ...stamp, result });
  return result;
}
