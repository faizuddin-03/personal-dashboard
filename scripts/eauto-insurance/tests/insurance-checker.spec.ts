import * as fs from 'fs';
import * as path from 'path';
import { test } from '../fixtures/authFixture';
import { CONFIG } from '../data/config';
import { VehicleResult } from '../data/types';
import { readInputExcel, writeSampleInput, writeOutputExcel } from '../utils/excel';
import { chunkArray, runWorker } from '../utils/batch';

// ── eAuto Insurance Quote Checker ───────────────────────────
// Reads vehicles from input-vehicles.xlsx, checks quotes in parallel
// authenticated sessions, and writes output-results.xlsx for the dashboard.

test.describe('eAuto Insurance Quote Checker', () => {
  test.setTimeout(0);

  test('Check insurance quotes for all vehicles', async ({ newAuthenticatedSession }) => {
    const inputPath = path.resolve(CONFIG.inputFile);
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Input file not found: ${inputPath}`);
      await writeSampleInput(inputPath);
      console.log(`✅ Sample created: ${inputPath} — add vehicles and run again.`);
      return;
    }

    const vehicles = await readInputExcel(inputPath);
    console.log(`📄 Loaded ${vehicles.length} vehicle(s)`);
    if (!vehicles.length) { console.log('⚠️ No vehicles.'); return; }

    const concurrency = Math.min(
      parseInt(process.env.INSURANCE_CONCURRENCY || String(CONFIG.defaultConcurrency)),
      vehicles.length,
    );
    console.log(`🚀 Running ${concurrency} parallel worker(s) for ${vehicles.length} vehicle(s)`);

    const chunks = chunkArray(vehicles, concurrency);
    const outputPath = path.resolve(CONFIG.outputFile);

    // Shared accumulator flushed to disk after each vehicle (completion order),
    // so a stopped run leaves a readable partial output file.
    const shared: VehicleResult[] = [];

    // Each worker gets its own authenticated session via the fixture
    const chunkResults = await Promise.all(
      chunks.map(async (chunk, idx) => {
        const { enquiryPage } = await newAuthenticatedSession();
        return runWorker(idx, chunk, enquiryPage, shared, outputPath);
      })
    );

    // Final write in proper vehicle order, overwriting the completion-order flushes
    const results: VehicleResult[] = chunkResults.flat();
    await writeOutputExcel(results, outputPath);

    const ok   = results.filter(r => r.status === 'SUCCESS').length;
    const skip = results.filter(r => r.status === 'NO_VEHICLE_INFO').length;
    const err  = results.filter(r => r.status === 'ERROR').length;

    console.log('\n══════════════════════════════════════════════════════════');
    console.log(`📊 Total: ${results.length} | ✅ ${ok} success | ⏭️ ${skip} skipped | ❌ ${err} errors`);
    console.log(`📁 Output: ${outputPath}`);
    console.log('══════════════════════════════════════════════════════════\n');
  });
});
