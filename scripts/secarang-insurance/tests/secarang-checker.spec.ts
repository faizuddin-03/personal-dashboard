import * as fs from 'fs';
import * as path from 'path';
import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { VehicleResult } from '../data/types';
import { readInputExcel, writeSampleInput, writeOutputExcel } from '../utils/excel';
import { chunkArray, runWorker } from '../utils/batch';

// ── Secarang Insurance Quote Checker ────────────────────────
// Reads vehicles from input-vehicles.xlsx, checks insurer availability in
// parallel sessions, and writes output-results.xlsx for the dashboard.

test.describe('Secarang Insurance Quote Checker', () => {
  test.setTimeout(0);

  test('Check insurance quotes for all vehicles', async ({ newCheckerSession }) => {
    const inputPath = path.resolve(CONFIG.inputFile);
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Input file not found: ${inputPath}`);
      await writeSampleInput(inputPath);
      console.log(`✅ Sample input created: ${inputPath}`);
      return;
    }

    const vehicles = await readInputExcel(inputPath);
    console.log(`📄 Loaded ${vehicles.length} vehicle(s)`);
    if (!vehicles.length) { console.log('⚠️ No vehicles.'); return; }

    const concurrency = Math.min(
      parseInt(process.env.SECARANG_CONCURRENCY || String(CONFIG.defaultConcurrency)),
      vehicles.length,
    );
    console.log(`🚀 Running ${concurrency} worker(s) for ${vehicles.length} vehicle(s)`);

    const outputPath = path.resolve(CONFIG.outputFile);
    const shared: VehicleResult[] = [];
    const chunks = chunkArray(vehicles, concurrency);

    const chunkResults = await Promise.all(
      chunks.map(async (chunk, idx) => {
        const { page } = await newCheckerSession();
        return runWorker(idx, chunk, page, CONFIG.defaultIc, shared, outputPath);
      })
    );
    const results = chunkResults.flat();

    // Final ordered write
    await writeOutputExcel(results, outputPath);

    const ok  = results.filter(r => r.status === 'SUCCESS').length;
    const err = results.filter(r => r.status === 'ERROR').length;
    console.log('\n══════════════════════════════════════════════════════════');
    console.log(`📊 Total: ${results.length} | ✅ ${ok} success | ❌ ${err} errors`);
    console.log(`📁 Output: ${outputPath}`);
    console.log('══════════════════════════════════════════════════════════\n');
  });
});
