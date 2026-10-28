import * as fs from 'fs';
import * as path from 'path';
import { test } from '../fixtures/sessionFixture';
import { checkPlate, type PlateInput, type PlateResult } from '../utils/plateCheck';

// ── Secarang Plate / SSM Checker ────────────────────────────
// Reads input-plates.json (written by /api/secarang/plate-check), checks each
// row in parallel sessions, and rewrites output-plates.json after every row so
// a stopped run still returns what it has.

const INPUT = path.resolve('./input-plates.json');
const OUTPUT = path.resolve('./output-plates.json');

test.describe('Secarang Plate / SSM Checker', () => {
  test.setTimeout(0);

  test('Check each vehicle no. with its IC / SSM', async ({ newCheckerSession }) => {
    const rows: PlateInput[] = JSON.parse(fs.readFileSync(INPUT, 'utf8')).rows ?? [];
    console.log(`📄 Loaded ${rows.length} row(s)`);
    if (!rows.length) return;
    // 20 tabs by default (Faizuddin, 2026-10-20: "the data is in the hundreds").
    // One shared queue: each tab takes the next row the moment it is free.
    const concurrency = Math.min(parseInt(process.env.SECARANG_CONCURRENCY || '20'), rows.length);
    const results: (PlateResult | undefined)[] = new Array(rows.length);
    const flush = () => fs.writeFileSync(OUTPUT, JSON.stringify({ results: results.filter(Boolean) }, null, 2));

    let next = 0;
    await Promise.all(Array.from({ length: concurrency }, async (_, w) => {
      const { page } = await newCheckerSession();
      while (next < rows.length) {
        const i = next++;
        const r = rows[i];
        console.log(`[Worker ${w + 1}] ━━━ ${i + 1}/${rows.length}: ${r.vehicleNo} (${r.ownerType} ${r.idNo})`);
        let res!: PlateResult;
        // "Kindly confirm your navigation" is Secarang asking whether to leave
        // the page, not an answer about the vehicle (seen 3 / 20 rows at 20
        // tabs, 2026-10-20) — the row is checked again from the start.
        for (let attempt = 1; ; attempt++) {
          try { res = await checkPlate(page, r); }
          catch (err) { res = { ...r, result: 'ERROR', stage: 'Checker', message: `Checker fault: ${String(err).split('\n')[0].slice(0, 200)}` }; }
          if (attempt >= 3 || !/confirm your navigation|Checker fault/i.test(res.message)) break;
          console.log(`   🔁 ${r.vehicleNo}: "${res.message}" — checking again (${attempt + 1}/3)`);
        }
        console.log(`   ${res.result === 'PROCEED' ? '✅' : '❌'} ${res.vehicleNo}: ${res.result} — ${res.stage}: ${res.message}`);
        results[i] = res;
        flush();
      }
    }));
    flush();
    const ok = results.filter(r => r?.result === 'PROCEED').length;
    console.log(`📊 Total: ${rows.length} | ✅ ${ok} proceed | ❌ ${rows.length - ok} error`);
  });
});
