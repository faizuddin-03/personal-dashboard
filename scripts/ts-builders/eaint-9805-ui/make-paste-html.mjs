// HTML clipboard blocks for the UI TS Test Steps (D) and Expected Result (E)
// columns, one block per section, so Excel Online keeps the in-cell bold and
// colour runs (**bold**, ++green++, !!red!!). Used with htmlclip.ps1.
import fs from "node:fs";
const SPEC = JSON.parse(fs.readFileSync(new URL("./ui-rows.json", import.meta.url), "utf8"));
const out = process.argv[2];
const BR = '<br style="mso-data-placement:same-cell;">';
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nl = s => (s.endsWith("\n") ? s : s + "\n");
const html = t => esc(nl(t))
  .replace(/\*\*(.+?)\*\*/gs, "<b>$1</b>")
  .replace(/\+\+(.+?)\+\+/gs, '<b><font color="#00B050">$1</font></b>')
  .replace(/!!(.+?)!!/gs, '<b><font color="#FF0000">$1</font></b>')
  .replace(/\n/g, BR);
const td = t => `<td style="font-family:Calibri;font-size:11pt;color:#000000;white-space:normal" valign="top">${html(t)}</td>`;
let r = 3;
SPEC.sections.forEach((sec, i) => {
  const first = r + 1;
  const trs = sec.rows.map(row => `<tr>${td(row.steps)}${td(row.exp)}</tr>`).join("");
  r += 1 + sec.rows.length;
  fs.writeFileSync(`${out}/block${i + 1}.html`, `<table>${trs}</table>`);
  console.log(`block${i + 1}: D${first}:E${r - 1}`);
});
