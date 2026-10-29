import { Locator } from '@playwright/test';

// Reads an HTML table by HEADER TEXT, never by column position (spec-reviewer
// rule "read a table column by its header text"). Handles colspan, so a total
// row whose label spans two columns ("YEAR TO DATE (Jan–Jun)" colspan=2 in the
// mock-up, line 601) still lines its numbers up under the right headers.

export interface TableCell { text: string; /** index among the row's th/td elements, for a locator */ dom: number }
export interface TableRow { tr: number; section: string; byCol: Record<number, TableCell>; text: string; imgCount: number }
export interface TableData { headers: string[]; rows: TableRow[] }

/** "Car<br>Transactions" → "Car Transactions"; "Date / Time" → "Date/Time". */
export const normHeader = (s: string) => s.replace(/\s+/g, ' ').replace(/\s*\/\s*/g, '/').trim();
export const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

export async function readTable(table: Locator): Promise<TableData> {
  const data = await table.evaluate((el) => {
    const trs = Array.from((el as HTMLTableElement).querySelectorAll('tr'));
    const out: { tr: number; section: string; cells: { text: string; col: number; dom: number; span: number; th: boolean }[]; imgCount: number }[] = [];
    trs.forEach((tr, i) => {
      let col = 0;
      const cells = Array.from(tr.children).filter(c => c.tagName === 'TD' || c.tagName === 'TH').map((c, dom) => {
        const span = Number((c as HTMLTableCellElement).colSpan) || 1;
        const cell = { text: (c as HTMLElement).innerText, col, dom, span, th: c.tagName === 'TH' };
        col += span;
        return cell;
      });
      out.push({ tr: i, section: tr.parentElement?.tagName.toLowerCase() ?? '', cells, imgCount: tr.querySelectorAll('img').length });
    });
    return out;
  });
  const headRow = data.find(r => r.section === 'thead') ?? data.find(r => r.cells.length && r.cells.every(c => c.th));
  const headers = headRow ? headRow.cells.map(c => normHeader(c.text)) : [];
  const rows: TableRow[] = data
    .filter(r => r !== headRow && r.cells.length && !(r.section === 'thead'))
    .map(r => {
      const byCol: Record<number, TableCell> = {};
      for (const c of r.cells) byCol[c.col] = { text: norm(c.text), dom: c.dom };
      return { tr: r.tr, section: r.section, byCol, text: norm(r.cells.map(c => c.text).join(' ')), imgCount: r.imgCount };
    });
  return { headers, rows };
}

/** Column index of a header (exact after normHeader, case-insensitive). Throws naming what is there. */
export function colOf(data: TableData, header: string | RegExp): number {
  const i = data.headers.findIndex(h => (typeof header === 'string' ? h.toLowerCase() === normHeader(header).toLowerCase() : header.test(h)));
  if (i < 0) throw new Error(`Column "${header}" not found. Headers on the page: ${data.headers.map(h => `"${h}"`).join(', ') || '(none)'}`);
  return i;
}

export function cellText(data: TableData, row: TableRow, header: string | RegExp): string {
  return row.byCol[colOf(data, header)]?.text ?? '';
}

/** Locator of one cell, found by header text — for highlights and the red box. */
export function cellLocator(table: Locator, data: TableData, row: TableRow, header: string | RegExp): Locator {
  const cell = row.byCol[colOf(data, header)];
  const tr = table.locator('tr').nth(row.tr);
  return cell ? tr.locator('th, td').nth(cell.dom) : tr;
}

export const rowLocator = (table: Locator, row: TableRow): Locator => table.locator('tr').nth(row.tr);
