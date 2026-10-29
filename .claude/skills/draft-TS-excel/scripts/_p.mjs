import ExcelJS from 'exceljs';
const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(process.argv[2]);
const ws = wb.worksheets[0]; console.log('sheet', ws.name, 'widths', ws.columns.map(c => c.width).join(','), 'merges', ws.model.merges.join(' '));
const fmt = c => { const v = c.value; if (!v) return ''; if (!v.richText) return String(v);
  return v.richText.map(r => { const f = r.font || {}; let t = r.text; const col = f.color?.argb; if (f.bold) t = `[b${col && col !== 'FF000000' ? ':' + col : ''}]${t}[/b]`; else if (col && col !== 'FF000000') t = `[c:${col}]${t}[/c]`; if (f.italic) t = `[i]${t}[/i]`; if (f.underline) t = `[u]${t}[/u]`; return t; }).join(''); };
for (const i of process.argv.slice(3).map(Number)) { const r = ws.getRow(i); console.log(`===== ROW ${i} h=${r.height}`);
  for (let c = 1; c <= 11; c++) { const cell = r.getCell(c); const s = fmt(cell); if (s) console.log(`--- col ${c} fill=${cell.fill?.fgColor?.argb ?? '-'} font=${JSON.stringify(cell.font)} align=${JSON.stringify(cell.alignment)}\n${s}`); } }
