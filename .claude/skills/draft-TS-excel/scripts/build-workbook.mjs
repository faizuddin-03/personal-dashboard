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
const PASS_FILL = 'FFC6EFCE';
const PASS_FONT = 'FF006100';
const FAIL_FILL = 'FFFFC7CE';
const FAIL_FONT = 'FF9C0006';
const NUM_COLS = 7; // TS No. | Test Objective | Test Steps | Expected Result | QA | Test Result | Remarks

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

async function build(spec) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Test Scenarios');

  const colWidths = [14, 34, 40, 46, 12, 12, 30];
  ws.columns = colWidths.map((w) => ({ width: w }));

  // Row 1: title, merged across the table width
  ws.mergeCells(1, 1, 1, NUM_COLS);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = spec.title;
  styleCell(titleCell, { bold: true, fill: TITLE_FILL, fontColor: 'FFFFFFFF', align: 'center', valign: 'middle', wrap: false });
  ws.getRow(1).height = 20;

  // Row 2: column headers
  const headers = ['TS No.', 'Test Objective', 'Test Steps', 'Expected Result', 'QA', 'Test Result', 'Remarks'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(2, i + 1);
    cell.value = h;
    styleCell(cell, { bold: true, fill: TITLE_FILL, fontColor: 'FFFFFFFF', align: 'center', valign: 'middle', wrap: true });
  });
  // Row 2 is not merged, so it auto-fits like the data rows (no height set).

  const bannerRowIndices = [];
  const dataRowIndices = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  spec.sections.forEach((section, sIdx) => {
    const bannerRowIndex = ws.rowCount + 1;
    bannerRowIndices.push(bannerRowIndex);
    ws.mergeCells(bannerRowIndex, 1, bannerRowIndex, NUM_COLS);
    const bannerCell = ws.getCell(bannerRowIndex, 1);
    bannerCell.value = `${letters[sIdx]}. ${section.title}`;
    styleCell(bannerCell, { bold: true, fill: SECTION_FILL, fontColor: 'FFFFFFFF', align: 'left', valign: 'middle', wrap: false });
    ws.getRow(bannerRowIndex).height = 18;

    section.rows.forEach((r) => {
      const rowIndex = ws.rowCount + 1;
      dataRowIndices.push(rowIndex);

      const objectiveText = r.objective.endsWith('\n') ? r.objective : r.objective + '\n';
      const stepsText = renderItems(r.steps);
      const expectedText = 'Ensure:\n' + renderItems(r.expected);
      const remarksText = r.remarks || '';

      const values = [r.no, objectiveText, stepsText, expectedText, '', 'N/A', remarksText];
      values.forEach((v, i) => {
        const cell = ws.getCell(rowIndex, i + 1);
        const bold = i === 0;
        styleCell(cell, { bold, align: i === 0 || i === 4 || i === 5 ? 'center' : 'left', valign: 'top', wrap: true });
        cell.value = i >= 1 && i <= 3 || i === 6 ? toRichText(v) : v;
      });

      // No row height: Excel auto-fits a wrapped row only when the file
      // stores no height for it — any explicit height locks the row
      // (Faizuddin, 2026-10-19: "the cells must format to autofit row
      // height"; verified in Excel the same day). Merged rows (title,
      // banners) cannot auto-fit, so only those keep a fixed height.
    });
  });

  // Pass/Fail dropdown + conditional formatting on Test Result (column F)
  const lastRow = ws.rowCount;
  ws.addConditionalFormatting({
    ref: `F3:F${lastRow}`,
    rules: [
      { type: 'containsText', operator: 'containsText', text: 'PASS', priority: 1,
        style: { font: { bold: true, color: { argb: PASS_FONT } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: PASS_FILL } } } },
      { type: 'containsText', operator: 'containsText', text: 'FAIL', priority: 2,
        style: { font: { bold: true, color: { argb: FAIL_FONT } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: FAIL_FILL } } } },
    ],
  });
  dataRowIndices.forEach((i) => {
    ws.getCell(`F${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Pass,Fail,Blocked,N/A"'] };
  });

  ws.views = [{ state: 'frozen', ySplit: 2 }];

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
