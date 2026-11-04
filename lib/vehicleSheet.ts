// Reads vehicle rows from a dropped eSTM export (.xlsx / .csv) for the
// Insurance Checker's eAuto and Secarang tabs (Faizuddin, 2026-10-30). Same
// columns and rule as the Secarang Insurance Checker
// (app/eauto/secarang-plate-checker/page.tsx): "if use choose private, will use
// IC. if choose company, will use Company ROC". Sample:
// _reference/excel/ESTM-202610301108.csv.

export interface SheetRow { vehicle: string; roc: string; buyer: string }
export type SheetOwner = "private" | "company";

const COLUMNS = { vehicle: "vehicle", roc: "company roc", buyer: "buyer id" } as const;

const blank = (v: string) => !v.trim() || v.trim() === "-";
/** Excel turns a 12-digit IC into "9.10825E+11" when the sheet is saved as CSV; the digits are lost. */
const isScientific = (v: string) => /^\d+(\.\d+)?e\+\d+$/i.test(v.trim());

/** An IC is 12 digits starting with a real YYMMDD date (keeps a 12-digit new ROC out). */
export function looksLikeIc(id: string): boolean {
  const d = id.replace(/[-\s]/g, "");
  if (!/^\d{12}$/.test(d)) return false;
  const mm = +d.slice(2, 4), dd = +d.slice(4, 6);
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}

/** Minimal CSV split — quoted fields, escaped "", CRLF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let f = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; continue; }
    if (ch === '"') q = true;
    else if (ch === ",") { row.push(f); f = ""; }
    else if (ch === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (ch !== "\r") f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

/** Vehicle, Company ROC and Buyer ID from the first sheet. Header row looked for in the first 10 rows. */
export async function readVehicleSheet(file: File): Promise<SheetRow[]> {
  let table: string[][];
  if (file.name.toLowerCase().endsWith(".csv")) table = parseCsv(await file.text());
  else {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets.find(w => w.rowCount > 0);
    if (!ws) throw new Error("No worksheet with data in the file.");
    table = [];
    ws.eachRow({ includeEmpty: true }, (r, n) => {
      const cells: string[] = [];
      // A numeric IC cell loses its leading zero ("030426010837" → 30426010837): put it back.
      r.eachCell({ includeEmpty: true }, (c, col) => {
        const t = (c.text ?? "").trim();
        cells[col - 1] = typeof c.value === "number" && /^\d{10,11}$/.test(t) ? t.padStart(12, "0") : t;
      });
      table[n - 1] = Array.from(cells, v => v ?? "");
    });
    table = Array.from(table, r => r ?? []);
  }
  const norm = (s: string) => (s ?? "").trim().toLowerCase();
  const has = (r: string[], name: string) => r.some(c => norm(c) === name);
  const headerAt = table.slice(0, 10).findIndex(r => has(r, COLUMNS.vehicle) && (has(r, COLUMNS.roc) || has(r, COLUMNS.buyer)));
  if (headerAt < 0) throw new Error('Couldn\'t find a "Vehicle" column with a "Company ROC" or "Buyer ID" column in the first 10 rows.');
  const header = table[headerAt].map(norm);
  const vi = header.indexOf(COLUMNS.vehicle), ri = header.indexOf(COLUMNS.roc), bi = header.indexOf(COLUMNS.buyer);
  const cell = (r: string[], i: number) => (i < 0 ? "" : (r[i] ?? "").trim());
  const rows = table.slice(headerAt + 1)
    .map(r => ({ vehicle: cell(r, vi), roc: cell(r, ri), buyer: cell(r, bi) }))
    .filter(r => !blank(r.vehicle) && (!blank(r.roc) || !blank(r.buyer)));
  if (!rows.length) throw new Error("No rows with a Vehicle and a Company ROC or Buyer ID under the header.");
  return rows;
}

/** "VEHICLE⇥ID" lines for the owner type: private = Buyer ID (IC), company = Company ROC. */
export function sheetToLines(rows: SheetRow[], owner: SheetOwner) {
  const skipped = { scientific: 0, noIc: 0, noRoc: 0 };
  const lines: string[] = [];
  for (const r of rows) {
    const vehicle = r.vehicle.toUpperCase().replace(/\s+/g, "");
    if (owner === "private") {
      const ic = r.buyer.replace(/[-\s]/g, "");
      if (looksLikeIc(ic)) lines.push(`${vehicle}\t${ic}`);
      else if (isScientific(r.buyer)) skipped.scientific++;
      else skipped.noIc++;
    } else if (!blank(r.roc)) lines.push(`${vehicle}\t${r.roc.trim()}`);
    else skipped.noRoc++;
  }
  return { lines, skipped };
}
