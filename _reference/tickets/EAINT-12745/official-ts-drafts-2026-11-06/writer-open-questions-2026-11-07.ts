function main(workbook: ExcelScript.Workbook) {
  // EAINT-12745 Open Questions: append 3 questions (Faizuddin, 2026-11-07)
  const ws = workbook.getWorksheet("Open Questions");
  const used = ws.getUsedRange();
  const lastRow = used.getRowIndex() + used.getRowCount();
  const vals = ws.getRange("A1:G" + lastRow).getValues().map(r => r.map(c => String(c)));
  let lastFilled = 0, maxQ = 0;
  vals.forEach((r, i) => {
    if (r[0].trim() !== "" || r[3].trim() !== "") lastFilled = i + 1;
    const n = parseInt(r[0].replace(/^Q/i, ""), 10);
    if (!isNaN(n) && n > maxQ) maxQ = n;
  });
  const text = vals.map(r => r[3]).join("\n");
  const qs = [
    { guard: /hidden[^\n]{0,80}(enquir|fail)|(enquir|fail)[^\n]{0,80}hidden/i,
      q: "If a hidden JPJ enquiry (Step 2 to Step 3, or Step 3 before payment) fails or does not answer, what does the UCD see? Which step does it go back to, and is Resubmit shown? (raised by Faizuddin)" },
    { guard: /submission job|hourly|cron|scheduler/i,
      q: "Is there a C2C JPJ submission job, like the hourly STMS and eSTM jobs, that resends Pending transfers after payment? What are its run times? (raised by Faizuddin)" },
    { guard: /bulk/i,
      q: "Does BackOffice Bulk JPJ Enquiry include C2C records? (raised by Faizuddin)" },
  ];
  const lastD = vals[lastFilled - 1][3];
  const nl = /\n$/.test(lastD) ? "\n" : "";
  let row = lastFilled;
  for (const x of qs) {
    const hit = vals.find(r => x.guard.test(r[3]));
    if (hit) { console.log("SKIP already raised as Q" + hit[0] + ": " + hit[3].slice(0, 80)); continue; }
    row++; maxQ++;
    ws.getRange("A" + row + ":G" + row).copyFrom(ws.getRange("A" + lastFilled + ":G" + lastFilled), ExcelScript.RangeCopyType.formats, false, false);
    ws.getRange("A" + row + ":E" + row).setValues([[maxQ, "P2", "BA", x.q + nl, "Open"]]);
    ws.getRange("A" + row + ":G" + row).getFormat().setWrapText(true);
    ws.getRange("A" + row + ":G" + row).getFormat().autofitRows();
    console.log("ADDED Q" + maxQ + " at row " + row);
  }
  console.log("last filled row was " + lastFilled + ", A=" + vals[lastFilled - 1][0]);
}
