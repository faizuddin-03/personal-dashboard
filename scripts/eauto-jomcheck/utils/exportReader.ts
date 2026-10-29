import * as fs from 'node:fs';
import ExcelJS from 'exceljs';

// Reads the BackOffice JomCheck Report Listing export (TS30/TS32/TS33/TS35).
//
// The real export file has NOT been captured yet — the only reference is
// the SRD mock-up, which builds an .xlsx with ExcelJS, one header row, then
// one row per transaction, multi-claim values in ONE cell
// (`_reference/tickets/EAINT-12339/Mockup_EAINT-12339_JomCheck_Report_Listing_20260928.html`,
// `doExport()`). So this checks the file really is .xlsx (zip "PK" header)
// and fails with the actual first bytes if not, instead of misreading it.

export interface ExportCell {
  text: string;
  /** 'string' = stored as text in Excel; 'number' = Excel converted it. */
  type: 'string' | 'number' | 'date' | 'empty' | 'other';
}

export interface ExportSheet {
  headers: string[];
  rows: ExportCell[][];
}

/** Header label without the mock-up's "(UPDATED)"/"(NEW)" suffix (OQ-09). */
export const baseHeader = (h: string) => h.replace(/\s*\((UPDATED|NEW)\)\s*$/i, '').trim();

/** Multi-claim and plain values normalised for comparison: one entry per
 *  claim line ("1. X" numbering removed), whitespace collapsed. */
export function claimLines(text: string): string[] {
  const t = text.replace(/\r/g, '').trim();
  if (!/^1\./.test(t)) return [t.replace(/\s+/g, ' ')];
  return t.split(/\n?\s*\d+\.\s*/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function cellType(cell: ExcelJS.Cell): ExportCell['type'] {
  switch (cell.type) {
    case ExcelJS.ValueType.Null: return 'empty';
    case ExcelJS.ValueType.String:
    case ExcelJS.ValueType.RichText:
    case ExcelJS.ValueType.SharedString: return 'string';
    case ExcelJS.ValueType.Number: return 'number';
    case ExcelJS.ValueType.Date: return 'date';
    default: return 'other';
  }
}

/** `headerMarker`: a header that identifies the header row — "Transaction
 *  Number" for BackOffice; the Service Portal export (TS37) has no such column. */
export async function readExport(filePath: string, headerMarker = 'Transaction Number'): Promise<ExportSheet> {
  const buf = fs.readFileSync(filePath);
  if (buf.subarray(0, 2).toString('latin1') !== 'PK') {
    throw new Error(
      `The export is not an .xlsx file (first bytes: ${JSON.stringify(buf.subarray(0, 16).toString('latin1'))}). ` +
      `Saved at ${filePath} — check its real format before changing utils/exportReader.ts.`,
    );
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ExcelJS.Buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error(`The export at ${filePath} has no worksheet.`);

  // Header row = the first row carrying `headerMarker` (allows title rows above it).
  let headerRowNo = -1;
  for (let r = 1; r <= Math.min(ws.rowCount, 10); r++) {
    const texts = (ws.getRow(r).values as unknown[]).map(v => String(v ?? ''));
    if (texts.some(t => baseHeader(t) === headerMarker)) { headerRowNo = r; break; }
  }
  if (headerRowNo === -1) throw new Error(`No "${headerMarker}" header in the first 10 rows of ${filePath}.`);

  const headerRow = ws.getRow(headerRowNo);
  const colCount = headerRow.cellCount;
  const headers: string[] = [];
  for (let c = 1; c <= colCount; c++) headers.push(headerRow.getCell(c).text.trim());

  const rows: ExportCell[][] = [];
  for (let r = headerRowNo + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    if (!row.hasValues) continue;
    const cells: ExportCell[] = [];
    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      cells.push({ text: cell.text.trim(), type: cellType(cell) });
    }
    rows.push(cells);
  }
  return { headers, rows };
}

/** The export row whose Transaction Number is `txNo`, keyed by base header. */
export function exportRowByTransactionNo(sheet: ExportSheet, txNo: string): Record<string, ExportCell> | undefined {
  const col = sheet.headers.findIndex(h => baseHeader(h) === 'Transaction Number');
  const row = sheet.rows.find(r => r[col]?.text === txNo);
  if (!row) return undefined;
  return Object.fromEntries(sheet.headers.map((h, i) => [baseHeader(h), row[i]]));
}
