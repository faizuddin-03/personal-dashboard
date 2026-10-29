import { CompanyRowInput, CompanyRowResult, emptyResult } from '../data/types';
import { CompanyListingPage } from '../pages/CompanyListingPage';
import { writeOutputJson } from './io';

// ── Batch helpers for the parallel company-row checking run ───
// Multiple workers again (2026-09-02, per Faizuddin), but the login itself
// stays singular — each worker gets its own PAGE within the ONE already-
// authenticated BrowserContext (fixtures/authFixture.ts's authedContext),
// not its own separately-logged-in context. Cookies are shared at the
// context level, so a fresh page just navigates straight to the listing.

export function chunkArray<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n);
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

/**
 * Process one worker's slice of rows on its own page (same shared login).
 * Flushes partial results to disk after every row so a stopped run still
 * surfaces everything gathered so far.
 */
export async function runWorker(
  workerIdx: number,
  rows: CompanyRowInput[],
  listingPage: CompanyListingPage,
  shared: CompanyRowResult[],
  outputPath: string,
): Promise<CompanyRowResult[]> {
  const results: CompanyRowResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    console.log(`[Worker ${workerIdx + 1}] ━━━ ${i + 1}/${rows.length}: ${row.roc} / ${row.newRoc} / ${row.tin}`);
    let res: CompanyRowResult;
    try {
      res = await listingPage.checkRow(row);
    } catch (err) {
      console.error(`[Worker ${workerIdx + 1}] ❌`, err);
      res = emptyResult(row, String(err));
    }
    results.push(res);
    shared.push(res);
    writeOutputJson(shared, outputPath);
  }
  return results;
}
