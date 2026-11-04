// Adds the "UI TS" tab to the official EAINT-9805 workbook (Faizuddin,
// 2026-11-03: "it should have its own tab, the UI TS. and make it directly
// into the online sheet").
//
// XML patch, not an exceljs save: every other part of the file is copied
// unchanged (customXml, featurePropertyBag, other sheets). The new sheet
// reuses the style ids of "Device & Performance TS" (sheet12.xml), so
// styles.xml is untouched. Colour rules and dropdowns match that tab.
//
// Usage: node add-ui-tab.mjs <base.xlsx> <out.xlsx>
import fs from "node:fs";
import crypto from "node:crypto";
import JSZip from "jszip";

const [, , BASE, OUT] = process.argv;
if (!BASE || !OUT) { console.error("usage: node add-ui-tab.mjs <base.xlsx> <out.xlsx>"); process.exit(1); }
const SPEC = JSON.parse(fs.readFileSync(new URL("./ui-rows.json", import.meta.url), "utf8"));
const TAB = "UI TS";
const PREFIX = "9805_UI_TS";

// Style ids from sheet12.xml (Device & Performance TS).
const S = { title: 40, head: 19, headAndroid: 20, headIos: 21, band: 41, tsno: 22, center: 23, body: 24, qa: 25, grey: 26 };
const STATUS_LIST = '"Pass,Fail,In Progress,Not Started"';
const WIDTHS = [14, 10, 34, 40, 46, 12, 30]; // A–G, as sheet12; result columns 13
const RESULT_W = 13;

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const colL = n => { let s = ""; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const withNl = s => (s.endsWith("\n") ? s.replace(/\n+$/, "\n") : `${s}\n`);

// **bold**, ++bold green++, !!bold red!! → shared-string XML (same run format as the sheet's existing strings).
const BLACK = "FF000000", GREEN = "FF00B050", RED = "FFFF0000";
function siXml(text) {
  const re = /(\*\*|\+\+|!!)(.+?)\1/gs;
  const runs = [];
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push([text.slice(last, m.index), false, BLACK]);
    runs.push([m[2], true, m[1] === "++" ? GREEN : m[1] === "!!" ? RED : BLACK]);
    last = re.lastIndex;
  }
  if (last < text.length) runs.push([text.slice(last), false, BLACK]);
  const plain = runs.map(r => r[0]).join("");
  if (!runs.some(r => r[1])) return { xml: `<si><t xml:space="preserve">${esc(plain)}</t></si>`, plain };
  const xml = runs.map(([t, b, c]) =>
    `<r><rPr>${b ? "<b/>" : ""}<sz val="11"/><color rgb="${c}"/><rFont val="Calibri"/></rPr><t xml:space="preserve">${esc(t)}</t></r>`).join("");
  return { xml: `<si>${xml}</si>`, plain };
}

// Row height: lines after wrapping at the column width, 15 pt a line (autofit stand-in).
function lines(text, width) {
  const per = Math.max(8, Math.floor(width * 1.15));
  return text.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / per)), 0);
}

const zip = await JSZip.loadAsync(fs.readFileSync(BASE));
const read = p => zip.file(p).async("string");

// ── shared strings ──
let sst = await read("xl/sharedStrings.xml");
const existing = new Map();
{
  let i = 0;
  for (const m of sst.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    if (!/<r>/.test(m[1])) existing.set(m[1].replace(/<t[^>]*>|<\/t>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"), i);
    i++;
  }
}
let unique = Number(sst.match(/uniqueCount="(\d+)"/)[1]);
let count = Number(sst.match(/ count="(\d+)"/)[1]);
const added = [];
function str(text) {
  const { xml, plain } = siXml(text);
  count++;
  if (!/<r>/.test(xml) && existing.has(plain)) return existing.get(plain);
  const id = unique++;
  added.push(xml);
  if (!/<r>/.test(xml)) existing.set(plain, id);
  return id;
}

// ── sheet ──
const cols = SPEC.columns;
const LAST = 7 + cols.length;
const lastL = colL(LAST);
const rows = [];
const merges = [];
const statusCells = [];
const priCells = [];
const cell = (r, c, s, v) => v === undefined
  ? `<c r="${colL(c)}${r}" s="${s}"/>`
  : `<c r="${colL(c)}${r}" s="${s}" t="s"><v>${v}</v></c>`;

let r = 1;
{
  const title = str("EAINT-9805 - eAuto Mobile App - Phase 6_ STMS - To update STMS module same as Production Web Portal (as of 29.01.2026)");
  rows.push(`<row r="1" spans="1:${LAST}">${Array.from({ length: LAST }, (_, i) => cell(1, i + 1, S.title, i ? undefined : title)).join("")}</row>`);
  merges.push(`A1:${lastL}1`);
  const heads = ["TS No.", "Priority", "Test Objective", "Test Steps", "Expected Result", "QA", "Remarks"];
  const hc = heads.map((h, i) => cell(2, i + 1, S.head, str(h)));
  cols.forEach((h, i) => hc.push(cell(2, 8 + i, /^(iOS|iPadOS)/.test(h) ? S.headIos : S.headAndroid, str(h))));
  rows.push(`<row r="2" spans="1:${LAST}">${hc.join("")}</row>`);
  r = 3;
}
let n = 0;
const tsList = [];
for (const sec of SPEC.sections) {
  const band = str(sec.title);
  rows.push(`<row r="${r}" spans="1:${LAST}">${Array.from({ length: LAST }, (_, i) => cell(r, i + 1, S.band, i ? undefined : band)).join("")}</row>`);
  merges.push(`A${r}:${lastL}${r}`);
  r++;
  for (const row of sec.rows) {
    n++;
    const id = `${PREFIX}${String(n).padStart(2, "0")}`;
    const open = new Set(SPEC.sets[row.dev ?? sec.dev]);
    const texts = [withNl(row.obj), withNl(row.steps), withNl(row.exp)];
    const rem = row.rem ? withNl(row.rem) : "";
    const h = Math.max(...texts.map((t, i) => lines(t.replace(/\*\*|\+\+|!!/g, ""), WIDTHS[2 + i])), rem ? lines(rem, WIDTHS[6]) : 1) * 15;
    const cs = [
      cell(r, 1, S.tsno, str(id)),
      cell(r, 2, S.center, str(row.p)),
      cell(r, 3, S.body, str(texts[0])),
      cell(r, 4, S.body, str(texts[1])),
      cell(r, 5, S.body, str(texts[2])),
      cell(r, 6, S.qa, str("")),
      cell(r, 7, S.body, str(rem)),
    ];
    cols.forEach((c, i) => {
      if (open.has(c)) { cs.push(cell(r, 8 + i, S.center, str("Not Started"))); statusCells.push(`${colL(8 + i)}${r}`); }
      else cs.push(cell(r, 8 + i, S.grey));
    });
    priCells.push(`B${r}`);
    rows.push(`<row r="${r}" spans="1:${LAST}" ht="${h}" customHeight="1">${cs.join("")}</row>`);
    tsList.push({ id, row: r, open: [...open] });
    r++;
  }
}
const lastRow = r - 1;
const uid = `{${crypto.randomUUID().toUpperCase()}}`;
const cf = [
  [`B3:B${lastRow}`, `<cfRule type="containsText" dxfId="6" priority="1" operator="containsText" text="P1"><formula>NOT(ISERROR(SEARCH("P1",B3)))</formula></cfRule>`],
  [`B3:B${lastRow}`, `<cfRule type="containsText" dxfId="5" priority="2" operator="containsText" text="P2"><formula>NOT(ISERROR(SEARCH("P2",B3)))</formula></cfRule>`],
  [`B3:B${lastRow}`, `<cfRule type="containsText" dxfId="4" priority="3" operator="containsText" text="P3"><formula>NOT(ISERROR(SEARCH("P3",B3)))</formula></cfRule>`],
  [`H3:${lastL}${lastRow}`, `<cfRule type="expression" dxfId="3" priority="4"><formula>H3="Pass"</formula></cfRule>`],
  [`H3:${lastL}${lastRow}`, `<cfRule type="expression" dxfId="2" priority="5"><formula>H3="Fail"</formula></cfRule>`],
  [`H3:${lastL}${lastRow}`, `<cfRule type="expression" dxfId="1" priority="6"><formula>H3="In Progress"</formula></cfRule>`],
  [`H3:${lastL}${lastRow}`, `<cfRule type="expression" dxfId="0" priority="7"><formula>H3="Not Started"</formula></cfRule>`],
].map(([ref, rule]) => `<conditionalFormatting sqref="${ref}">${rule}</conditionalFormatting>`).join("");
const dv = `<dataValidations count="2">` +
  `<dataValidation type="list" allowBlank="1" sqref="${priCells.join(" ")}" xr:uid="{${crypto.randomUUID().toUpperCase()}}"><formula1>"P1,P2,P3"</formula1></dataValidation>` +
  `<dataValidation type="list" allowBlank="1" sqref="${statusCells.join(" ")}" xr:uid="{${crypto.randomUUID().toUpperCase()}}"><formula1>${STATUS_LIST}</formula1></dataValidation>` +
  `</dataValidations>`;
const colsXml = `<cols>${WIDTHS.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}<col min="8" max="${LAST}" width="${RESULT_W}" customWidth="1"/></cols>`;
const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac xr xr2 xr3" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac" xmlns:xr="http://schemas.microsoft.com/office/spreadsheetml/2014/revision" xmlns:xr2="http://schemas.microsoft.com/office/spreadsheetml/2015/revision2" xmlns:xr3="http://schemas.microsoft.com/office/spreadsheetml/2016/revision3" xr:uid="${uid}"><dimension ref="A1:${lastL}${lastRow}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/>${colsXml}<sheetData>${rows.join("")}</sheetData><mergeCells count="${merges.length}">${merges.map(m => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>${cf}${dv}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`;

// ── package parts ──
let wbXml = await read("xl/workbook.xml");
if (wbXml.includes(`name="${TAB}"`)) { console.error(`Tab "${TAB}" already exists — stopping.`); process.exit(2); }
let rels = await read("xl/_rels/workbook.xml.rels");
let ct = await read("[Content_Types].xml");
const sheetNums = Object.keys(zip.files).map(f => f.match(/^xl\/worksheets\/sheet(\d+)\.xml$/)?.[1]).filter(Boolean).map(Number);
const sheetFile = `sheet${Math.max(...sheetNums) + 1}.xml`;
const rid = `rId${Math.max(...[...rels.matchAll(/Id="rId(\d+)"/g)].map(m => Number(m[1]))) + 1}`;
const sheetId = Math.max(...[...wbXml.matchAll(/sheetId="(\d+)"/g)].map(m => Number(m[1]))) + 1;

wbXml = wbXml.replace("</sheets>", `<sheet name="${TAB}" sheetId="${sheetId}" r:id="${rid}"/></sheets>`);
rels = rels.replace("</Relationships>", `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/${sheetFile}"/></Relationships>`);
ct = ct.replace("</Types>", `<Override PartName="/xl/worksheets/${sheetFile}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`);
sst = sst.replace(/ count="\d+"/, ` count="${count}"`).replace(/uniqueCount="\d+"/, `uniqueCount="${unique}"`).replace("</sst>", `${added.join("")}</sst>`);

zip.file("xl/workbook.xml", wbXml, { createFolders: false });
zip.file("xl/_rels/workbook.xml.rels", rels, { createFolders: false });
zip.file("[Content_Types].xml", ct, { createFolders: false });
zip.file("xl/sharedStrings.xml", sst, { createFolders: false });
zip.file(`xl/worksheets/${sheetFile}`, sheetXml, { createFolders: false });
fs.writeFileSync(OUT, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
console.log(JSON.stringify({ out: OUT, sheetFile, rid, sheetId, ts: n, lastRow, newStrings: added.length, statusCells: statusCells.length }));
