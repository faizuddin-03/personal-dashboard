// Office Script + HTML paste block for the Interruption TS "PHONE NAVIGATION
// BUTTONS" section (9805_IN_TS45-56), from nav-rows.json. Same method as the
// UI TS tab (README): the script builds rows with plain text, the HTML paste
// adds the bold / colour runs in Test Steps and Expected Result.
// Usage: node make-nav-section.mjs <outDir>  -> nav.ts, nav.html
import fs from "node:fs";
const SPEC = JSON.parse(fs.readFileSync(new URL("./nav-rows.json", import.meta.url), "utf8"));
const [, , OUT] = process.argv;
const strip = s => s.replace(/\*\*|\+\+|!!/g, "");
const nl = s => (s ? (s.endsWith("\n") ? s : s + "\n") : "");
const FIRST_TS = 45, BANNER_ROW = 48;
const rows = SPEC.rows.map((r, i) => ({
  id: `9805_IN_TS${FIRST_TS + i}`, p: r.p, c: nl(r.obj), d: nl(strip(r.steps)), e: nl(strip(r.exp)), g: nl(r.rem), ios: r.dev === "B",
}));
const script = `// EAINT-9805 Interruption TS: add section PHONE NAVIGATION BUTTONS, 9805_IN_TS45-56.
function main(workbook: ExcelScript.Workbook) {
  const ws = workbook.getWorksheet("Interruption TS");
  if (!ws) { console.log("Interruption TS not found"); return; }
  if (String(ws.getRange("A47").getValue()) !== "9805_IN_TS44" || String(ws.getRange("A48").getValue()) !== "") { console.log("Rows changed - stopped"); return; }
  if (String(ws.getRange("H2").getValue()) !== "Android 15" || String(ws.getRange("I2").getValue()) !== "iOS 27") { console.log("Columns changed - stopped"); return; }
  const ROWS: { id: string; p: string; c: string; d: string; e: string; g: string; ios: boolean }[] = ${JSON.stringify(rows)};
  const open = ws.getRange("H47"); // Not Started + dropdown
  const grey = ws.getRange("I30"); // iOS on 9805_IN_TS27 (Android only)
  ws.getRange("A${BANNER_ROW}:I${BANNER_ROW}").copyFrom(ws.getRange("A3"), ExcelScript.RangeCopyType.formats);
  ws.getRange("A${BANNER_ROW}").setValue(${JSON.stringify(SPEC.title).replace(/—/g, "\\u2014")});
  ws.getRange("A${BANNER_ROW}:I${BANNER_ROW}").merge(false);
  let r = ${BANNER_ROW + 1};
  for (const row of ROWS) {
    ws.getRange("A" + r + ":G" + r).copyFrom(ws.getRange("A47:G47"), ExcelScript.RangeCopyType.all);
    ws.getRange("A" + r + ":G" + r).setValues([[row.id, row.p, row.c, row.d, row.e, "", row.g]]);
    ws.getRange("H" + r).copyFrom(open, ExcelScript.RangeCopyType.all);
    ws.getRange("H" + r).setValue("Not Started");
    const i = ws.getRange("I" + r);
    if (row.ios) { i.copyFrom(open, ExcelScript.RangeCopyType.all); i.setValue("Not Started"); }
    else { i.copyFrom(grey, ExcelScript.RangeCopyType.all); i.getDataValidation().clear(); i.setValue(""); }
    r++;
  }
  console.log("added rows ${BANNER_ROW}-" + (r - 1));
}
`;
fs.writeFileSync(`${OUT}/nav.ts`, script);
const BR = '<br style="mso-data-placement:same-cell;">';
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const html = t => esc(nl(t))
  .replace(/\*\*(.+?)\*\*/gs, "<b>$1</b>")
  .replace(/\+\+(.+?)\+\+/gs, '<b><font color="#00B050">$1</font></b>')
  .replace(/!!(.+?)!!/gs, '<b><font color="#FF0000">$1</font></b>')
  .replace(/\n/g, BR);
const td = t => `<td style="font-family:Calibri;font-size:11pt;color:#000000;white-space:normal" valign="top">${html(t)}</td>`;
fs.writeFileSync(`${OUT}/nav.html`, `<table>${SPEC.rows.map(r => `<tr>${td(r.steps)}${td(r.exp)}</tr>`).join("")}</table>`);
console.log(`rows ${rows.length}: banner A${BANNER_ROW}, TS rows ${BANNER_ROW + 1}-${BANNER_ROW + rows.length}, paste D${BANNER_ROW + 1}:E${BANNER_ROW + rows.length}`);
