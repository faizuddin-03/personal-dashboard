import * as fs from 'fs';
import ExcelJS from 'exceljs';
import { VehicleInput, VehicleResult } from '../data/types';

// ── Excel I/O — the file contract with the dashboard API ───

export async function readInputExcel(filePath: string): Promise<VehicleInput[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.getWorksheet(1);
  if (!ws) throw new Error('No worksheet found');

  const vehicles: VehicleInput[] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const vn = row.getCell(1).text?.trim();
    if (!vn) return;
    const ownerRaw = (row.getCell(5).text || '').trim().toLowerCase();
    const vtypeRaw = (row.getCell(6).text || '').trim().toLowerCase();
    vehicles.push({
      vehicleNumber: vn,
      icNumber:      row.getCell(2).text?.trim() || undefined,
      postcode:      row.getCell(3).text?.trim() || undefined,
      ownerType:     ownerRaw === 'company' ? 'company' : 'private',
      vehicleType:   vtypeRaw === 'motorcycle' ? 'motorcycle' : 'car',
    });
  });
  return vehicles;
}

export async function writeSampleInput(filePath: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Vehicles');
  ws.columns = [
    { header: 'Vehicle Number', key: 'vn',    width: 18 },
    { header: 'IC Number',      key: 'ic',    width: 18 },
    { header: 'Postcode',       key: 'pc',    width: 12 },
    { header: 'Notes',          key: 'notes', width: 20 },
    { header: 'Owner Type',     key: 'owner', width: 15 },
    { header: 'Vehicle Type',   key: 'vtype', width: 15 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.addRow({ vn: 'ALA2133', ic: '980121066038', pc: '55000', owner: 'private', vtype: 'car' });
  await wb.xlsx.writeFile(filePath);
}

export async function writeOutputExcel(results: VehicleResult[], filePath: string): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Secarang Insurance Checker';
  wb.created = new Date();

  const headerFont  = { bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };
  const headerAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };

  // ── Quotations sheet ─────────────────────────────────────────
  const qs = wb.addWorksheet('Quotations', { views: [{ state: 'frozen', ySplit: 1 }] });
  qs.columns = [
    { header: 'Vehicle Number',  key: 'vn',        width: 18 },
    { header: 'Make',            key: 'make',      width: 15 },
    { header: 'Model',           key: 'model',     width: 30 },
    { header: 'Year',            key: 'year',      width: 8  },
    { header: 'Variant',         key: 'variant',   width: 25 },
    { header: 'Insurer',         key: 'insurer',   width: 25 },
    { header: 'Available',       key: 'available', width: 12 },
    { header: 'Reason',          key: 'reason',    width: 40 },
    { header: 'Total Displayed', key: 'displayed', width: 16 },
    { header: 'Total Available', key: 'available2',width: 16 },
  ];
  qs.getRow(1).font      = headerFont;
  qs.getRow(1).fill      = headerFill;
  qs.getRow(1).alignment = headerAlign;

  for (const r of results) {
    if (r.status !== 'SUCCESS') continue;
    for (const ins of r.insurers) {
      const row = qs.addRow({
        vn: r.vehicleNumber, make: r.make, model: r.model, year: r.year,
        variant: r.variant, insurer: ins.name,
        available: ins.available ? 'Yes' : 'No',
        reason: ins.unavailableReason || '',
        displayed: r.totalDisplayed, available2: r.totalAvailable,
      });
      row.getCell('available').font = { color: { argb: ins.available ? 'FF008000' : 'FFFF0000' }, bold: true };
    }
  }
  if (qs.rowCount > 1) {
    qs.autoFilter = { from: { row: 1, column: 1 }, to: { row: qs.rowCount, column: 10 } };
  }

  // ── Vehicles summary sheet ───────────────────────────────────
  const vs = wb.addWorksheet('Vehicles', { views: [{ state: 'frozen', ySplit: 1 }] });
  vs.columns = [
    { header: 'Vehicle Number',  key: 'vn',        width: 18 },
    { header: 'Make',            key: 'make',       width: 15 },
    { header: 'Model',           key: 'model',      width: 30 },
    { header: 'Year',            key: 'year',       width: 8  },
    { header: 'Variant',         key: 'variant',    width: 25 },
    { header: 'Total Displayed', key: 'displayed',  width: 18 },
    { header: 'Total Available', key: 'available',  width: 18 },
    { header: 'Status',          key: 'status',     width: 16 },
    { header: 'Error',           key: 'error',      width: 50 },
  ];
  vs.getRow(1).font      = headerFont;
  vs.getRow(1).fill      = headerFill;
  vs.getRow(1).alignment = headerAlign;

  for (const r of results) {
    vs.addRow({
      vn: r.vehicleNumber, make: r.make, model: r.model,
      year: r.year, variant: r.variant,
      displayed: r.totalDisplayed, available: r.totalAvailable,
      status: r.status, error: r.errorMessage || '',
    });
  }

  // ── Errors sheet ─────────────────────────────────────────────
  const es = wb.addWorksheet('Errors');
  es.columns = [
    { header: 'Vehicle Number', key: 'vn',     width: 18 },
    { header: 'Status',         key: 'status', width: 16 },
    { header: 'Error',          key: 'error',  width: 70 },
  ];
  es.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  es.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };
  for (const r of results) {
    if (r.status === 'SUCCESS') continue;
    es.addRow({ vn: r.vehicleNumber, status: r.status, error: r.errorMessage || '' });
  }

  await wb.xlsx.writeFile(tmpPath);
  // Atomic swap so a reader never sees a half-written file
  fs.renameSync(tmpPath, filePath);
}

// Serialised incremental flush — each call writes the full snapshot
let writeChain: Promise<void> = Promise.resolve();
export function flushOutput(results: VehicleResult[], filePath: string): Promise<void> {
  const snapshot = [...results];
  writeChain = writeChain
    .then(() => writeOutputExcel(snapshot, filePath))
    .catch(err => console.error('   ⚠️ flush failed:', err));
  return writeChain;
}
