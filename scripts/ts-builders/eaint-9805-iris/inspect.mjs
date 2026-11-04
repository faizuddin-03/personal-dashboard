import {createRequire} from 'module'; const ExcelJS=createRequire('C:/Users/Faizuddin/Documents/GitHub/personal-dashboard/package.json')('exceljs');
const p=process.argv[2], sheets=process.argv.slice(3);
const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile(p);
console.log(wb.worksheets.map(w=>w.name));
for (const name of sheets){ const ws=wb.getWorksheet(name); console.log('=== ',name, ws.rowCount, ws.columnCount, JSON.stringify(ws.views), Object.keys(ws._merges||{}));
 ws.columns.forEach((c,i)=>console.log('col',i+1,c.width));
 ws.eachRow({includeEmpty:false},(row,rn)=>{ if(rn>16) return; row.eachCell((c)=>{
  const v=c.value; let t = v&&v.richText? 'RICH:'+JSON.stringify(v.richText.map(r=>[r.text,r.font&&r.font.bold,r.font&&r.font.color&&(r.font.color.argb||r.font.color.theme)])) : JSON.stringify(v);
  console.log(c.address, (t||'').slice(0,400), '| fill',c.fill&&c.fill.fgColor&&(c.fill.fgColor.argb||'th'+c.fill.fgColor.theme),'| font',JSON.stringify(c.font),'| al',JSON.stringify(c.alignment),'| ht',row.height, '| border', c.border&&c.border.top&&c.border.top.style);
 });});
}
