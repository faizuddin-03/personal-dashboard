function main(wb: ExcelScript.Workbook) {
  const sheets = ["Homepage & Access","C2C Listing","Details & Documents","UCD Reports","BackOffice C2C","BackOffice Finance & JPJ","Regression"];
  const TXT = [2,3,4,5,6,9,10]; // C D E F G J K
  for (const sn of sheets) {
    const ws = wb.getWorksheet(sn); const u = ws.getUsedRange();
    const last = u.getRowIndex() + u.getRowCount();
    const v = ws.getRange("A1:K" + last).getValues();
    const widths: number[] = []; for (let c = 0; c < 11; c++) widths.push(ws.getCell(0, c).getFormat().getColumnWidth());
    let fs = 10, named = 0, mine: number[] = [];
    for (let i = 0; i < v.length; i++) {
      const id = String(v[i][0]); const qa = String(v[i][7]);
      if (!id.startsWith("12745_") || (qa !== "Faizuddin" && qa !== "Faiz")) continue;
      if (mine.length === 0) fs = ws.getCell(i, 2).getFormat().getFont().getSize() || 10;
      mine.push(i);
      const row = v[i].slice() as (string | number | boolean)[];
      if (qa !== "Faiz") { row[7] = "Faiz"; named++; }
      for (const c of TXT) { const s = String(row[c] ?? ""); if (s.trim() !== "") row[c] = s.replace(/\s+$/, "") + "\n"; }
      ws.getRange("A" + (i + 1) + ":K" + (i + 1)).setValues([row]);
      ws.getRange("A" + (i + 1) + ":K" + (i + 1)).getFormat().setWrapText(true);
    }
    // autofit, then make sure each row is at least the estimated wrapped height
    const charW = fs * 0.55, lineH = fs * 1.35;
    let bumped = 0;
    for (const i of mine) {
      const r = ws.getRange((i + 1) + ":" + (i + 1)); r.getFormat().autofitRows();
      const vals = ws.getRange("A" + (i + 1) + ":K" + (i + 1)).getValues()[0];
      let maxL = 1;
      for (let c = 0; c < 11; c++) {
        const s = String(vals[c] ?? ""); if (!s) continue;
        const per = Math.max(1, Math.floor((widths[c] - 6) / charW));
        let n = 0; for (const ln of s.split("\n")) n += Math.max(1, Math.ceil(ln.length / per));
        if (n > maxL) maxL = n;
      }
      const est = Math.ceil(maxL * lineH + 4);
      if (r.getFormat().getRowHeight() < est) { r.getFormat().setRowHeight(Math.min(409, est)); bumped++; }
    }
    console.log(sn + ": rows " + mine.length + ", QA renamed " + named + ", heights raised " + bumped);
  }
  const e = wb.getWorksheet("E2E Flow"); const ev = e.getUsedRange().getValues();
  const hits = ev.filter(r => /save (&|and) continue/i.test(String(r[2])) && /hid|not shown|no /i.test(String(r[2]) + String(r[5]))).map(r => String(r[0]) + " | " + String(r[2]).slice(0, 90));
  console.log("E2E Save&Continue hidden TS: " + (hits.length ? hits.join(" || ") : "none"));
}
