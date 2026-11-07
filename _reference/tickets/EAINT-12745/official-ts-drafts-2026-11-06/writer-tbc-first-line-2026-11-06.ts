function main(wb: ExcelScript.Workbook) {
  const sheets = ["Homepage & Access","C2C Listing","Details & Documents","UCD Reports","BackOffice C2C","BackOffice Finance & JPJ","Regression"];
  let total = 0;
  for (const sn of sheets) {
    const ws = wb.getWorksheet(sn); const u = ws.getUsedRange();
    const last = u.getRowIndex() + u.getRowCount();
    const rng = ws.getRange("A1:H" + last); const v = rng.getValues();
    let n = 0;
    for (let i = 0; i < v.length; i++) {
      const id = String(v[i][0]), f = String(v[i][5]), qa = String(v[i][7]);
      if (!id.startsWith("12745_") || qa !== "Faizuddin") continue;
      if (f.startsWith("TBC") || f.indexOf("TBC (") < 0) continue;
      const qs: string[] = [];
      const re = /TBC \(([^)]*)\)/g; let m: RegExpExecArray | null;
      while ((m = re.exec(f)) !== null) for (const q of m[1].split(/,\s*/)) if (q && qs.indexOf(q) < 0) qs.push(q);
      ws.getCell(i, 5).setValue("TBC (" + qs.join(", ") + ")\n" + f);
      n++;
    }
    total += n; console.log(sn + ": " + n);
  }
  console.log("total moved " + total);
}
