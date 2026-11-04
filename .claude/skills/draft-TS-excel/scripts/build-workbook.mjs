#!/usr/bin/env node
// Reusable builder for the draft-TS-excel skill.
//
// Encodes the house-style formatting mechanics (colours, borders, wrap,
// trailing line break, Pass/Fail dropdown + conditional formatting, Field
// Reference sheet) so the skill never has to re-derive them by hand. The
// skill supplies content only — this script owns styling.
//
// Usage: node build-workbook.mjs <spec.json> <output.xlsx>
// spec.json shape: see README.md in this skill folder for the full data model.

import ExcelJS from 'exceljs';
import { readFileSync } from 'fs';

const TITLE_FILL = 'FF1F4E78';
const SECTION_FILL = 'FF0070C0';
// Test Result statuses (Faizuddin, 2026-10-30: "PASS - GREEN FAIL - RED IN
// PROGRESS - YELLOW NOT STARTED - BLUE"). Untested rows read "Not Started"
// (2026-10-29). Conditional, so the colour follows the value picked from the
// dropdown, and each result column gets its own rule so a pick colours only
// the cell it is in ("it should only affect the cell it is on").
const NOT_STARTED = 'Not Started';
const RESULT_STYLE = {
  Pass: { fill: 'FFC6EFCE', font: 'FF006100' },
  Fail: { fill: 'FFFFC7CE', font: 'FF9C0006' },
  'In Progress': { fill: 'FFFFEB9C', font: 'FF9C5700' },
  [NOT_STARTED]: { fill: 'FFDDEBF7', font: 'FF1F3864' },
};
const RESULT_LIST = `"${Object.keys(RESULT_STYLE).join(',')}"`;
// A platform a TS does not run on: grey, empty, no dropdown.
const NOT_APPLICABLE_FILL = 'FFD9D9D9';
// Optional Priority column, right of TS No., only when a row has "priority"
// (Faizuddin, 2026-10-30: "do not put it in remarks. need to make a new
// column to the right of the TS No. column"). P1 red, P2 yellow, P3 green.
// Conditional, so the colour follows a value picked from the dropdown.
const PRIORITY_STYLE = {
  P1: { fill: 'FFFFC7CE', font: 'FF9C0006' },
  P2: { fill: 'FFFFEB9C', font: 'FF9C5700' },
  P3: { fill: 'FFC6EFCE', font: 'FF006100' },
};

const THIN = { style: 'thin', color: { argb: 'FF000000' } };
const ALL_BORDERS = { top: THIN, left: THIN, bottom: THIN, right: THIN };

function renderItems(items) {
  // items: array of strings, or { text, bullets: [string] } objects.
  // Returns numbered top-level lines with nested " - " bullets, joined by \n,
  // with exactly one trailing \n at the very end.
  const lines = [];
  items.forEach((item, i) => {
    const n = i + 1;
    if (typeof item === 'string') {
      lines.push(`${n}. ${item}`);
    } else if (item.column !== undefined) {
      // Column / Position / Value shape
      lines.push(`${n}. ${item.column}`);
      lines.push(`     - Position: ${item.position}`);
      lines.push(`     - Value: ${item.value}`);
    } else {
      lines.push(`${n}. ${item.text}`);
      (item.bullets || []).forEach((b) => lines.push(`     - ${b}`));
    }
  });
  return lines.join('\n') + '\n';
}

// Inline emphasis marks (house rule, Faizuddin 2026-10-15):
//   **text**  -> bold black   (pages, buttons, fields, columns, statuses)
//   ++text++  -> bold green   (outcomes expected to pass)
//   !!text!!  -> bold red     (anything negative: must not happen / appear)
// Marks are stripped from the output; the cell becomes Excel rich text.
const MARK_RE = /(\*\*|\+\+|!!)([\s\S]+?)\1/g;
const MARK_COLOUR = { '**': 'FF000000', '++': 'FF00B050', '!!': 'FFFF0000' };

function toRichText(text, { baseBold = false } = {}) {
  // Returns a plain string when no marks are present, else an ExcelJS
  // richText value. Font name/size match styleCell.
  const str = String(text);
  if (!MARK_RE.test(str)) return str;
  MARK_RE.lastIndex = 0;
  const runs = [];
  let last = 0;
  let m;
  while ((m = MARK_RE.exec(str)) !== null) {
    if (m.index > last) runs.push({ text: str.slice(last, m.index), font: { name: 'Calibri', size: 11, bold: baseBold, color: { argb: 'FF000000' } } });
    runs.push({ text: m[2], font: { name: 'Calibri', size: 11, bold: true, color: { argb: MARK_COLOUR[m[1]] } } });
    last = m.index + m[0].length;
  }
  if (last < str.length) runs.push({ text: str.slice(last), font: { name: 'Calibri', size: 11, bold: baseBold, color: { argb: 'FF000000' } } });
  return { richText: runs };
}

function styleCell(cell, { bold = false, fill = null, fontColor = 'FF000000', align = 'left', valign = 'top', wrap = true } = {}) {
  cell.font = { name: 'Calibri', size: 11, bold, color: { argb: fontColor } };
  if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  cell.alignment = { horizontal: align, vertical: valign, wrapText: wrap };
  cell.border = ALL_BORDERS;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Tab name for one section: section.sheet if given, else "<letter>. <title>"
// without a leading "BO — ". Excel: max 31 chars, none of \ / ? * [ ] :
function sheetName(section, letter) {
  const raw = section.sheet || `${letter}. ${String(section.title).replace(/^BO\s*[—–-]\s*/, '')}`;
  return cleanTabName(raw);
}
const cleanTabName = (raw) => String(raw).replace(/[\\/?*[\]:]/g, '-').slice(0, 31).trim();

// Platforms used by these sections' rows; a row without "platforms" runs on all.
function usedResultColumns(resultColumns, sections) {
  const used = new Set();
  sections.forEach((s) => s.rows.forEach((r) => {
    (Array.isArray(r.platforms) ? r.platforms : resultColumns.map((c) => c.header)).forEach((p) => used.add(p));
  }));
  return resultColumns.filter((c) => used.has(c.header));
}

// Fills one TS sheet: title, header, section banners + rows, formatting,
// Test Result dropdown, frozen panes. letterIdx[i] is section i's index in
// the whole spec, so letters keep running A., B., C. ... across tabs.
// letters = false: banners show the title only (spec.sectionLetters false).
function fillSheet(ws, title, sections, letterIdx, withPriority = false, resultColumns = null, letters = true) {
  // TS No. | [Priority] | Test Objective | Test Steps | Expected Result | QA | Test Result | Remarks
  // With spec.resultColumns, one result column per platform takes the place
  // of Test Result, after Remarks: ... | QA | Remarks | Android 15 | iOS 27 ...
  const results = resultColumns ?? [{ header: 'Test Result' }];
  const resultCols = results.map((r, i) => ({ header: r.header, width: resultColumns ? 13 : 12, align: 'center', valign: 'middle', key: `result${i}`, headerFill: r.fill }));
  const cols = [
    { header: 'TS No.', width: 14, align: 'center', valign: 'middle', bold: true },
    ...(withPriority ? [{ header: 'Priority', width: 10, align: 'center', valign: 'middle', key: 'priority' }] : []),
    { header: 'Test Objective', width: 34, rich: true },
    { header: 'Test Steps', width: 40, rich: true },
    { header: 'Expected Result', width: 46, rich: true },
    { header: 'QA', width: 12, align: 'center' },
    ...(resultColumns ? [] : resultCols),
    { header: 'Remarks', width: 30, rich: true, key: 'remarks' },
    ...(resultColumns ? resultCols : []),
  ];
  const NUM_COLS = cols.length;
  const colLetter = (key) => LETTERS[cols.findIndex((c) => c.key === key)];
  ws.columns = cols.map((c) => ({ width: c.width }));

  // Row 1: title, merged across the table width
  ws.mergeCells(1, 1, 1, NUM_COLS);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  styleCell(titleCell, { bold: true, fill: TITLE_FILL, fontColor: 'FFFFFFFF', align: 'center', valign: 'middle', wrap: false });
  ws.getRow(1).height = 20;

  // Row 2: column headers
  cols.forEach((c, i) => {
    const cell = ws.getCell(2, i + 1);
    cell.value = c.header;
    const light = c.headerFill && c.headerFill.length === 8;
    styleCell(cell, { bold: true, fill: light ? c.headerFill : TITLE_FILL, fontColor: light ? 'FF000000' : 'FFFFFFFF', align: 'center', valign: 'middle', wrap: true });
  });
  // Row 2 is not merged, so it auto-fits like the data rows (no height set).

  const bannerRowIndices = [];
  const dataRowIndices = [];

  sections.forEach((section, sIdx) => {
    const bannerRowIndex = ws.rowCount + 1;
    bannerRowIndices.push(bannerRowIndex);
    ws.mergeCells(bannerRowIndex, 1, bannerRowIndex, NUM_COLS);
    const bannerCell = ws.getCell(bannerRowIndex, 1);
    bannerCell.value = letters ? `${LETTERS[letterIdx[sIdx]]}. ${section.title}` : section.title;
    styleCell(bannerCell, { bold: true, fill: SECTION_FILL, fontColor: 'FFFFFFFF', align: 'left', valign: 'middle', wrap: false });
    ws.getRow(bannerRowIndex).height = 18;

    section.rows.forEach((r) => {
      const rowIndex = ws.rowCount + 1;
      dataRowIndices.push(rowIndex);

      const objectiveText = r.objective.endsWith('\n') ? r.objective : r.objective + '\n';
      const stepsText = renderItems(r.steps);
      const expectedText = 'Ensure:\n' + renderItems(r.expected);
      const remarksText = r.remarks || '';

      const byKey = { remarks: remarksText };
      // r.platforms (with resultColumns): the headers this TS runs on; the rest are grey. Omitted = all.
      results.forEach((res, k) => {
        byKey[`result${k}`] = !resultColumns || !Array.isArray(r.platforms) || r.platforms.includes(res.header) ? NOT_STARTED : null;
      });
      const fixed = [r.no, ...(withPriority ? [r.priority || ''] : []), objectiveText, stepsText, expectedText, ''];
      cols.forEach((c, i) => {
        const v = i < fixed.length ? fixed[i] : byKey[c.key];
        const cell = ws.getCell(rowIndex, i + 1);
        const na = c.key?.startsWith('result') && v === null;
        styleCell(cell, { bold: !!c.bold, fill: na ? NOT_APPLICABLE_FILL : null, align: c.align || 'left', valign: c.valign || 'top', wrap: true });
        if (v !== null) cell.value = c.rich ? toRichText(v) : v;
      });

      // No row height: Excel auto-fits a wrapped row only when the file
      // stores no height for it — any explicit height locks the row
      // (Faizuddin, 2026-10-19: "the cells must format to autofit row
      // height"; verified in Excel the same day). Merged rows (title,
      // banners) cannot auto-fit, so only those keep a fixed height.
    });
  });

  // Status dropdown + colour on each result column. One rule set per column,
  // anchored on that column's own first row, so a pick never colours the
  // cell next to it. Dropdowns go only on cells that hold a status.
  const lastRow = ws.rowCount;
  let cfPriority = 1;
  results.forEach((_, k) => {
    const rc = colLetter(`result${k}`);
    ws.addConditionalFormatting({
      ref: `${rc}3:${rc}${lastRow}`,
      rules: Object.entries(RESULT_STYLE).map(([status, st]) => ({
        type: 'expression', formulae: [`${rc}3="${status}"`], priority: cfPriority++,
        style: { font: { bold: true, color: { argb: st.font } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: st.fill } } },
      })),
    });
    dataRowIndices.forEach((i) => {
      const cell = ws.getCell(`${rc}${i}`);
      if (cell.value !== null && cell.value !== undefined) cell.dataValidation = { type: 'list', allowBlank: true, formulae: [RESULT_LIST] };
    });
  });

  // P1/P2/P3 dropdown + red/yellow/green on Priority
  if (withPriority) {
    const pc = colLetter('priority');
    ws.addConditionalFormatting({
      ref: `${pc}3:${pc}${lastRow}`,
      rules: Object.entries(PRIORITY_STYLE).map(([p, st], i) => ({
        type: 'containsText', operator: 'containsText', text: p, priority: cfPriority + i,
        style: { font: { color: { argb: st.font } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: st.fill } } },
      })),
    });
    dataRowIndices.forEach((i) => {
      ws.getCell(`${pc}${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"P1,P2,P3"'] };
    });
  }

  ws.views = [{ state: 'frozen', ySplit: 2 }];
}

async function build(spec) {
  const wb = new ExcelJS.Workbook();
  // One Priority column on every tab when any row in the workbook has one.
  const withPriority = spec.sections.some((s) => s.rows.some((r) => r.priority));
  // Optional platform result columns (e.g. Android 15, iOS 27), same on every tab.
  // fill: "android" = light green, "apple" = light blue (Faizuddin, 2026-10-30), or an ARGB hex.
  const PLATFORM_FILL = { android: 'FFE2EFDA', apple: 'FFDDEBF7' };
  const resultColumns = Array.isArray(spec.resultColumns) && spec.resultColumns.length
    ? spec.resultColumns.map((c) => (typeof c === 'string' ? { header: c } : { header: c.header, fill: PLATFORM_FILL[c.fill] ?? c.fill }))
    : null;
  if (resultColumns && resultColumns.length > 12) throw new Error('resultColumns: at most 12 platform columns');
  spec.sections.forEach((s) => s.rows.forEach((r) => {
    if (r.priority && !PRIORITY_STYLE[r.priority]) throw new Error(`${r.no}: priority must be "P1", "P2" or "P3"`);
  }));
  // sectionLetters false: banners without "A. " (Faizuddin, 2026-10-30: "dont include those. just the names").
  const letters = spec.sectionLetters !== false;
  // resultColumnsPerTab: a tab shows only the platforms its rows use (Faizuddin,
  // 2026-10-30: "if the tab doesnt have at least 1 scenario for it, then remove that column in that tab").
  const perTab = !!spec.resultColumnsPerTab && !!resultColumns;
  const colsFor = (sections) => (perTab ? usedResultColumns(resultColumns, sections) : resultColumns);
  if (spec.sheetPerSection) {
    // tabs: several sections on one tab, in the order listed; each section named by its "sheet".
    let groups;
    if (Array.isArray(spec.tabs) && spec.tabs.length) {
      const byName = new Map();
      spec.sections.forEach((s, i) => {
        if (!s.sheet) throw new Error(`tabs: section ${i + 1} ("${s.title}") has no "sheet" value to name it by`);
        if (byName.has(s.sheet)) throw new Error(`tabs: two sections share the "sheet" value "${s.sheet}"`);
        byName.set(s.sheet, i);
      });
      const placed = new Set();
      groups = spec.tabs.map((tab, t) => {
        if (!tab?.name || !Array.isArray(tab.sections) || !tab.sections.length) throw new Error(`tabs[${t}]: needs a "name" and a non-empty "sections" list`);
        const idx = tab.sections.map((n) => {
          if (!byName.has(n)) throw new Error(`tabs: "${tab.name}" lists "${n}", which is not any section's "sheet" value`);
          if (placed.has(n)) throw new Error(`tabs: section "${n}" is in more than one tab`);
          placed.add(n);
          return byName.get(n);
        });
        return { name: cleanTabName(tab.name), idx };
      });
      const missing = [...byName.keys()].filter((n) => !placed.has(n));
      if (missing.length) throw new Error(`tabs: section(s) in no tab: ${missing.join(', ')}`);
    } else {
      groups = spec.sections.map((section, sIdx) => ({ name: sheetName(section, LETTERS[sIdx]), idx: [sIdx] }));
    }
    const used = new Set();
    groups.forEach(({ name, idx }) => {
      if (used.has(name.toLowerCase())) throw new Error(`Duplicate tab name "${name}" — give the section a "sheet" value, or name the tab differently`);
      used.add(name.toLowerCase());
      const sections = idx.map((i) => spec.sections[i]);
      fillSheet(wb.addWorksheet(name), spec.title, sections, idx, withPriority, colsFor(sections), letters);
    });
  } else {
    fillSheet(wb.addWorksheet('Test Scenarios'), spec.title, spec.sections, spec.sections.map((_, i) => i), withPriority, colsFor(spec.sections), letters);
  }

  // Optional Field Reference sheet
  if (spec.fieldReference && spec.fieldReference.length) {
    const wsRef = wb.addWorksheet('Field Reference');
    const refHeaders = ['#', 'Field Name', 'Old Field Name (replaced)', 'Column Name', 'Position', 'Notes', 'Verified In'];
    const refWidths = [6, 28, 26, 26, 34, 42, 16];
    wsRef.columns = refWidths.map((w) => ({ width: w }));
    refHeaders.forEach((h, i) => {
      const cell = wsRef.getCell(1, i + 1);
      cell.value = h;
      styleCell(cell, { bold: true, fill: TITLE_FILL, fontColor: 'FFFFFFFF', align: 'center', valign: 'middle', wrap: true });
    });
    spec.fieldReference.forEach((r, idx) => {
      const rowIndex = idx + 2;
      const values = [idx + 1, r.field, r.oldField, r.column, r.position, r.notes, r.verifiedIn || ''];
      values.forEach((v, i) => {
        const cell = wsRef.getCell(rowIndex, i + 1);
        cell.value = v;
        styleCell(cell, { align: i === 0 ? 'center' : 'left', valign: 'top', wrap: true });
      });
    });
  }

  return wb;
}

async function main() {
  const [specPath, outPath] = process.argv.slice(2);
  if (!specPath || !outPath) {
    console.error('Usage: node build-workbook.mjs <spec.json> <output.xlsx>');
    process.exit(1);
  }
  const spec = JSON.parse(readFileSync(specPath, 'utf-8'));
  const wb = await build(spec);
  await wb.xlsx.writeFile(outPath);
  console.log('Written to', outPath);
}

main().catch((e) => { console.error(e); process.exit(1); });
