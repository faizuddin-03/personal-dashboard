// node gen-writer.mjs <SHEETCODE> -> writes writer-<CODE>.ts (Office Script) from ts-*.json
import fs from 'fs';
import path from 'path';
const dir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const code = process.argv[2];
const NAMES = { HOME: 'Homepage & Access', LIST: 'C2C Listing', DTL: 'Details & Documents', RPT: 'UCD Reports', BO: 'BackOffice C2C', FIN: 'BackOffice Finance & JPJ', REG: 'Regression' };
let rows = [];
for (const f of fs.readdirSync(dir).filter(f => /^ts-.*\.json$/.test(f))) {
  try { rows.push(...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))); } catch (e) { console.error('bad json', f, e.message); }
}
rows = rows.filter(r => r.sheet === code);
const sections = [...new Set(rows.map(r => r.section))].sort();
let n = 0;
const data = {};
for (const s of sections) {
  data[s] = rows.filter(r => r.section === s).map(r => {
    n++;
    return [`12745_${code}_TS${String(n).padStart(2, '0')}`, r.priority || 'P2', r.scenario || '', r.precondition || '', r.steps || '', r.expected || '', r.ref || '', 'Faizuddin', 'Not Started', '', r.remarks || ''];
  });
}
const script = `function main(workbook: ExcelScript.Workbook) {
  const ws = workbook.getWorksheet(${JSON.stringify(NAMES[code])});
  const data: { [k: string]: string[][] } = ${JSON.stringify(data)};
  const order = ${JSON.stringify(sections)};
  // abort if any TS row already exists with our code (re-run guard)
  const used = ws.getUsedRange();
  const all = ws.getRange("A1:A" + (used.getRowIndex() + used.getRowCount() + 5)).getValues().map(r => String(r[0]));
  if (all.some(v => v.startsWith("12745_${code}_"))) { console.log("ABORT: ${code} rows already present"); return; }
  // process sections bottom-up so inserts do not shift unprocessed banners
  for (const s of [...order].reverse()) {
    const colA = ws.getRange("A1:A" + (used.getRowIndex() + used.getRowCount() + 400)).getValues().map(r => String(r[0]));
    const b = colA.findIndex(v => v.startsWith(s + ".  "));
    if (b < 0) { console.log("ABORT: banner " + s + " not found"); return; }
    let e = colA.findIndex((v, i) => i > b && /^[A-Z]\\.  /.test(v));
    if (e < 0) { // last section: placeholder rows run until first row whose A..K are empty AND has no border; use DV end = used range end
      e = used.getRowIndex() + used.getRowCount();
    }
    const first = b + 2; // 1-based first placeholder row
    const last = e;      // 1-based last placeholder row (row before next banner)
    const ph = last - first + 1;
    const block = ws.getRange("A" + first + ":K" + last).getValues();
    for (const r of block) for (const c of r) if (c !== "" && c !== null) { console.log("ABORT: section " + s + " not empty (someone typed there)"); return; }
    const rows = data[s];
    const need = rows.length - ph;
    if (need > 0) {
      ws.getRange(last + ":" + (last + need - 1)).insert(ExcelScript.InsertShiftDirection.down);
      ws.getRange("A" + last + ":K" + (last + need - 1)).copyFrom(ws.getRange("A" + first + ":K" + first), ExcelScript.RangeCopyType.formats, false, false);
    }
    const tgt = ws.getRange("A" + first + ":K" + (first + rows.length - 1));
    tgt.setValues(rows);
    tgt.getFormat().setWrapText(true);
    tgt.getFormat().setVerticalAlignment(ExcelScript.VerticalAlignment.top);
    tgt.getFormat().autofitRows();
    console.log("Section " + s + ": " + rows.length + " TS at rows " + first + "-" + (first + rows.length - 1) + (need > 0 ? " (+" + need + " rows inserted)" : ""));
  }
}
`;
fs.writeFileSync(path.join(dir, `writer-${code}.ts`), script);
console.log(code, 'sections', sections.map(s => s + ':' + data[s].length).join(' '), 'total', n, 'bytes', script.length);
