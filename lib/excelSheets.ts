// Small exceljs helpers for the API routes that used to call SheetJS (`xlsx`
// 0.18.5, which has unpatched CVEs on npm). Each helper mirrors the SheetJS
// call it replaced, so route input/output stays the same:
//   writeAoaXlsx   ~ aoa_to_sheet + book_append_sheet + write(buffer)
//   sheetToObjects ~ sheet_to_json(ws, { defval: "" })
//   sheetToCsv     ~ sheet_to_csv(ws)
import ExcelJS from "exceljs";

type Cell = string | number | boolean | Date | null | undefined;

/** One-sheet workbook from an array of rows, as an .xlsx Buffer. */
export async function writeAoaXlsx(sheetName: string, rows: Cell[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  for (const r of rows) ws.addRow(r.map(v => (v === undefined ? null : v)));
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function readXlsx(buf: Buffer | ArrayBuffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  // exceljs's .d.ts still types load() with the pre-generic Buffer.
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  return wb;
}

/** Plain value of a cell, the way SheetJS reports `v` (formula → result,
 *  rich text / hyperlink → their text, empty → ""). */
function cellValue(v: ExcelJS.CellValue): string | number | boolean | Date {
  if (v === null || v === undefined) return "";
  if (typeof v !== "object" || v instanceof Date) return v;
  if ("richText" in v) return v.richText.map(t => t.text).join("");
  if ("formula" in v || "sharedFormula" in v) {
    const res = (v as ExcelJS.CellFormulaValue).result;
    if (res === undefined || res === null || (typeof res === "object" && !(res instanceof Date))) return "";
    return res;
  }
  if ("hyperlink" in v) return String((v as ExcelJS.CellHyperlinkValue).text ?? "");
  if ("error" in v) return String((v as ExcelJS.CellErrorValue).error);
  return String(v);
}

/** First row = headers; each later non-blank row → { header: value }, with
 *  missing cells filled with "". */
export function sheetToObjects(ws: ExcelJS.Worksheet): Record<string, unknown>[] {
  const headers: string[] = [];
  const out: Record<string, unknown>[] = [];
  let headerRow = 0;
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (!headerRow) {
      headerRow = n;
      row.eachCell({ includeEmpty: true }, (cell, c) => { headers[c] = String(cellValue(cell.value)); });
      return;
    }
    const obj: Record<string, unknown> = {};
    let any = false;
    for (let c = 1; c < headers.length; c++) {
      const h = headers[c];
      if (h === undefined || h === "") continue;
      const v = cellValue(row.getCell(c).value);
      if (v !== "") any = true;
      obj[h] = v;
    }
    if (any) out.push(obj);
  });
  return out;
}

function csvField(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Sheet as CSV text (cell display text, "\n" between rows). */
export function sheetToCsv(ws: ExcelJS.Worksheet): string {
  if (!ws.actualRowCount) return "";
  const { top, left, bottom, right } = ws.dimensions;
  const lines: string[] = [];
  for (let r = top; r <= bottom; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = left; c <= right; c++) cells.push(csvField(row.getCell(c).text ?? ""));
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}
