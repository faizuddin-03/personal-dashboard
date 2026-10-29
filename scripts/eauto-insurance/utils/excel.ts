import * as fs from 'fs';
import ExcelJS from 'exceljs';
import { VehicleInput, VehicleResult } from '../data/types';

// ── Excel I/O — the file contract with the dashboard API ───

export async function readInputExcel(filePath: string): Promise<VehicleInput[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const ws = workbook.getWorksheet(1);
  if (!ws) throw new Error('No worksheet found');

  const vehicles: VehicleInput[] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const vn = row.getCell(1).text?.toString().trim();
    if (!vn) return;
    vehicles.push({
      vehicleNumber: vn,
      icNumber: row.getCell(2).text?.toString().trim() || undefined,
      postcode: row.getCell(3).text?.toString().trim() || undefined,
      vehicleCategory: row.getCell(4).text?.toString().trim().toLowerCase() || undefined,
    });
  });
  return vehicles;
}

export async function writeSampleInput(filePath: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Vehicles');
  ws.columns = [
    { header: 'Vehicle Number', key: 'vn', width: 18 },
    { header: 'IC Number', key: 'ic', width: 18 },
    { header: 'Postcode', key: 'pc', width: 12 },
    { header: 'Vehicle Category', key: 'cat', width: 18 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.addRow({ vn: 'JKC9998' });
  ws.addRow({ vn: 'AAAAAAA8' });
  await wb.xlsx.writeFile(filePath);
}

export async function writeOutputExcel(results: VehicleResult[], filePath: string): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'eAuto Insurance Checker';
  wb.created = new Date();

  // Summary sheet
  const ss = wb.addWorksheet('Summary', { views: [{ state: 'frozen', ySplit: 1 }] });
  ss.columns = [
    { header: 'Vehicle Number', key: 'vehicleNumber', width: 18 },
    { header: 'Make', key: 'make', width: 15 },
    { header: 'Model', key: 'model', width: 30 },
    { header: 'Mfg Year', key: 'mfgYear', width: 12 },
    { header: 'Engine CC', key: 'cc', width: 12 },
    { header: 'Transmission', key: 'transmission', width: 20 },
    { header: 'Variant', key: 'variant', width: 25 },
    { header: 'Insurer', key: 'insurer', width: 20 },
    { header: 'Cover Type', key: 'coverType', width: 35 },
    { header: 'Allow Purchase', key: 'allow', width: 16 },
    { header: 'Refer Risk Code', key: 'risk', width: 45 },
    { header: 'Total Price', key: 'price', width: 15 },
  ];
  ss.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ss.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };
  ss.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  for (const r of results) {
    if (r.status !== 'SUCCESS' || r.insurers.length === 0) continue;
    for (const ins of r.insurers) {
      const row = ss.addRow({
        vehicleNumber: r.vehicleNumber, make: r.make, model: r.model,
        mfgYear: r.manufacturingYear, cc: r.engineCapacity,
        transmission: r.transmission, variant: r.variant,
        insurer: ins.insurerName, coverType: ins.coverType,
        allow: ins.allowToPurchase, risk: ins.referRiskCode, price: ins.totalPrice,
      });
      const cell = row.getCell('allow');
      cell.font = ins.allowToPurchase === 'Yes'
        ? { color: { argb: 'FF008000' }, bold: true }
        : { color: { argb: 'FFFF0000' }, bold: true };
    }
  }
  if (ss.rowCount > 1) {
    ss.autoFilter = { from: { row: 1, column: 1 }, to: { row: ss.rowCount, column: 12 } };
  }

  // Skipped sheet
  const sk = wb.addWorksheet('Skipped Vehicles', { views: [{ state: 'frozen', ySplit: 1 }] });
  sk.columns = [
    { header: 'Vehicle Number', key: 'vn', width: 18 },
    { header: 'Status', key: 'st', width: 20 },
    { header: 'Reason', key: 'reason', width: 60 },
  ];
  sk.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sk.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };

  for (const r of results) {
    if (r.status === 'SUCCESS') continue;
    sk.addRow({ vn: r.vehicleNumber, st: r.status, reason: r.errorMessage || 'No info' });
  }

  await wb.xlsx.writeFile(tmpPath);
  // Atomic swap so a reader never sees a half-written file (important when the
  // run is stopped mid-flight and the API reads partial results).
  fs.renameSync(tmpPath, filePath);
}

// Serialise incremental writes so concurrent workers don't clobber each other.
// Each flush writes the full snapshot of results gathered so far, so if the
// process is killed the output file always holds every vehicle done up to then.
let writeChain: Promise<void> = Promise.resolve();
export function flushOutput(results: VehicleResult[], filePath: string): Promise<void> {
  const snapshot = [...results];
  writeChain = writeChain
    .then(() => writeOutputExcel(snapshot, filePath))
    .catch(err => console.error('   ⚠️ flush failed:', err));
  return writeChain;
}
