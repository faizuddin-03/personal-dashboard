import * as fs from 'fs';
import * as path from 'path';
import { test } from '../fixtures/authFixture';
import { CONFIG } from '../data/config';
import { CompanyRowResult } from '../data/types';
import { readInputJson, writeOutputJson } from '../utils/io';
import { chunkArray, runWorker } from '../utils/batch';

// ── Company Details Checker (EAINT-12153 sub-function) ────────
// Reads candidate rows from input-rows.json, checks each of Company ROC /
// New Company ROC / TIN Number independently (the listing search is
// AND-only — see knowledge/flow-ucd-company-listing.md), and writes
// output-results.json for the dashboard. Not a test — no pass/fail
// assertion, no recording; this always "passes" as a Playwright test as
// long as it completes.
//
// Concurrent workers again (2026-09-02, per Faizuddin), chunked the same
// way as before — but the login is singular: `authedContext`
// (fixtures/authFixture.ts) logs in ONCE on a shared BrowserContext, and
// `newWorkerSession` just opens each worker its own PAGE inside that same
// context, so N workers never means N logins.

test.describe('eAuto Company Details Checker', () => {
  test.setTimeout(0);

  test('Check ROC / New ROC / TIN for all rows', async ({ newWorkerSession }) => {
    const inputPath = path.resolve(CONFIG.inputFile);
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Input file not found: ${inputPath}`);
      return;
    }

    const rows = readInputJson(inputPath);
    console.log(`📄 Loaded ${rows.length} row(s)`);
    if (!rows.length) { console.log('⚠️ No rows.'); return; }

    const concurrency = Math.min(
      parseInt(process.env.COMPANY_CHECKER_CONCURRENCY || String(CONFIG.defaultConcurrency)),
      rows.length,
    );
    console.log(`🚀 One login, ${concurrency} parallel worker(s) for ${rows.length} row(s)`);

    const chunks = chunkArray(rows, concurrency);
    const outputPath = path.resolve(CONFIG.outputFile);

    const shared: CompanyRowResult[] = [];

    const chunkResults = await Promise.all(
      chunks.map(async (chunk, idx) => {
        const { listingPage } = await newWorkerSession();
        return runWorker(idx, chunk, listingPage, shared, outputPath);
      })
    );

    const results: CompanyRowResult[] = chunkResults.flat();
    writeOutputJson(results, outputPath);

    const pass = results.filter(r => r.overall === 'PASS').length;
    const fail = results.filter(r => r.overall === 'FAIL').length;

    console.log('\n══════════════════════════════════════════════════════════');
    console.log(`📊 Total: ${results.length} | ✅ ${pass} pass | ❌ ${fail} fail`);
    console.log(`📁 Output: ${outputPath}`);
    console.log('══════════════════════════════════════════════════════════\n');
  });
});
