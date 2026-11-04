// Builds "Suggestion by Claude - EAINT-9805 - Iris TS.xlsx" in the EAINT-7229 "Dermalog TS" layout.
// Loads the 7229 workbook as the template so theme colours and cell styles match exactly.
import { createRequire } from 'module';
const ExcelJS = createRequire('C:/Users/Faizuddin/Documents/GitHub/personal-dashboard/package.json')('exceljs');
const [, , src, out] = process.argv;

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(src);
const t = wb.getWorksheet('Dermalog TS');
const clone = (o) => JSON.parse(JSON.stringify(o));
const st = (addr) => clone(t.getCell(addr).style);
const S = {
  title: st('A1'), plain: st('A2'), group: st('J7'), head: st('A8'), band: st('A9'),
  tsno: st('A10'), pri: st('B10'), obj: st('C10'), pre: st('D10'), steps: st('E10'),
  qa: st('I10'), dev: st('J10'), res: st('K10'), rem: st('P10'),
};
const groupFills = ['J7', 'L7', 'N7'].map((a) => clone(t.getCell(a).fill));
const resultDv = t.dataValidations.model['K10'] ? clone(t.dataValidations.model['K10']) : null;

const ws = wb.addWorksheet('Iris TS');
for (const w of [...wb.worksheets]) if (w.name !== 'Iris TS') wb.removeWorksheet(w.id);

const widths = [20.7, 11.7, 40.7, 30.7, 60.7, 60.7, 12.6, 15.1, 15.1, 15.1, 15.1, 15.1, 15.1, 44.7];
widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
const LAST = 14;

// **bold**, ++bold green++, !!bold red!!  -> rich text runs on the cell's base font
const BLACK = 'FF000000', GREEN = 'FF38761D', RED = 'FFFF0000';
function rich(text, baseFont) {
  const runs = [];
  const re = /(\*\*|\+\+|!!)(.+?)\1/gs;
  let last = 0, m;
  const f = (extra) => ({ ...clone(baseFont), ...extra });
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index), font: f({}) });
    const color = m[1] === '++' ? GREEN : m[1] === '!!' ? RED : BLACK;
    runs.push({ text: m[2], font: f({ bold: true, color: { argb: color } }) });
    last = re.lastIndex;
  }
  if (last < text.length) runs.push({ text: text.slice(last), font: f({}) });
  return runs.some((r) => r.font.bold) ? { richText: runs } : text;
}
const withNl = (s) => (s.endsWith('\n') ? s.replace(/\n+$/, '\n') : s + '\n');
function put(r, c, value, style, { nl = true } = {}) {
  const cell = ws.getCell(r, c);
  cell.style = clone(style);
  if (value == null || value === '') return;
  const v = nl ? withNl(value) : value;
  cell.value = rich(v, style.font || {});
}

// Header block (rows 1-6), as in 7229
put(1, 1, 'Ticket(s): ', S.title, { nl: false });
put(2, 1, '1. EAINT-9805 : eAuto Mobile App - Phase 6 STMS - To update STMS module same as Production Web Portal', S.plain, { nl: false });
ws.getCell(4, 1).style = clone(S.plain);
ws.getCell(4, 1).value = { richText: [
  { text: 'Test environment', font: { ...clone(S.plain.font), bold: true } },
  { text: ': staging (UAT app)', font: clone(S.plain.font) } ] };
ws.getCell(6, 1).style = clone(S.title);
ws.getCell(6, 1).value = { richText: [
  { text: 'Test objective: ', font: { ...clone(S.plain.font), bold: true } },
  { text: 'To verify stable and correct Bluetooth connection between the eAuto App and the Iris reader for MyKad and thumbprint processing.', font: clone(S.plain.font) } ] };

// Row 7 group headers, row 8 column headers
const groups = [[8, 'Android 15 ★ (Full manual)'], [10, 'iOS 27 ★ (Full manual)'], [12, 'Short-check devices']];
groups.forEach(([c, label], i) => {
  for (const cc of [c, c + 1]) { put(7, cc, label, S.group, { nl: false }); ws.getCell(7, cc).fill = groupFills[i]; }
  ws.mergeCells(7, c, 7, c + 1);
});
const heads = ['TS No', 'Priority', 'Test Objective / Entry Point / Module', 'Pre-Requisite', 'Test Scenarios', 'Expected Result',
  'QA', 'Device / Build', 'Test Result', 'Device / Build', 'Test Result', 'Device / Build', 'Test Result', ' Remarks'];
heads.forEach((h, i) => put(8, i + 1, h, S.head, { nl: false }));
ws.getRow(7).height = 15.75;
ws.getRow(8).height = 30;
ws.views = [{ state: 'frozen', ySplit: 8, xSplit: 1, zoomScale: 80 }];

const SECTIONS = JSON.parse((await import('fs')).readFileSync(new URL('./iris-rows.json', import.meta.url), 'utf8'));
let r = 9, n = 0;
for (const sec of SECTIONS) {
  for (let c = 1; c <= LAST; c++) put(r, c, sec.title, S.band, { nl: false });
  ws.mergeCells(r, 1, r, LAST);
  ws.getRow(r).height = 15.75;
  r++;
  for (const row of sec.rows) {
    n++;
    const id = `9805_IR_TS${String(n).padStart(2, '0')}`;
    put(r, 1, id, S.tsno, { nl: false });
    put(r, 2, row.p, S.pri, { nl: false });
    ws.getCell(r, 2).dataValidation = { type: 'list', allowBlank: true, showErrorMessage: true, formulae: ['"P1,P2,P3,P4"'] };
    put(r, 3, row.obj, S.obj);
    put(r, 4, row.pre, S.pre);
    put(r, 5, row.steps, S.steps);
    put(r, 6, row.exp, S.steps);
    put(r, 7, '', S.qa);
    for (const c of [8, 10, 12]) put(r, c, '', S.dev);
    for (const c of [9, 11, 13]) {
      put(r, c, '', S.res);
      if (resultDv) ws.getCell(r, c).dataValidation = clone(resultDv);
    }
    put(r, 14, row.rem || '', S.rem);
    r++;
  }
}
await wb.xlsx.writeFile(out);
console.log('rows', n, '->', out, 'resultDv', JSON.stringify(resultDv));
