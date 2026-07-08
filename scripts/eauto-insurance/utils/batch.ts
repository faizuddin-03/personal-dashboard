import { VehicleInput, VehicleResult, emptyResult } from '../data/types';
import { EnquiryPage } from '../pages/EnquiryPage';
import { flushOutput } from './excel';

// ── Batch helpers for the parallel vehicle-checking run ────

export function chunkArray<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n);
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

/**
 * Process one worker's slice of vehicles on its own authenticated page.
 * Flushes partial results to disk after every vehicle so a stopped run
 * still surfaces everything gathered so far.
 */
export async function runWorker(
  workerIdx: number,
  vehicles: VehicleInput[],
  enquiryPage: EnquiryPage,
  shared: VehicleResult[],
  outputPath: string,
): Promise<VehicleResult[]> {
  const results: VehicleResult[] = [];
  for (let i = 0; i < vehicles.length; i++) {
    const vn = vehicles[i].vehicleNumber;
    console.log(`[Worker ${workerIdx + 1}] ━━━ ${i + 1}/${vehicles.length}: ${vn}`);
    let res: VehicleResult;
    try {
      res = await enquiryPage.checkVehicle(vehicles[i]);
    } catch (err) {
      console.error(`[Worker ${workerIdx + 1}] ❌ ${vn}:`, err);
      res = emptyResult(vn, 'ERROR', String(err));
    }
    results.push(res);
    shared.push(res);
    await flushOutput(shared, outputPath);
  }
  return results;
}
