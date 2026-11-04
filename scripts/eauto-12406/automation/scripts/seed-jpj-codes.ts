/**
 * Seed eSim with one record per JPJ error code.
 *
 *   npx tsx scripts/seed-jpj-codes.ts            # seed every P1-P4 code
 *   npx tsx scripts/seed-jpj-codes.ts P1 P2      # seed only those priorities
 *   npx tsx scripts/seed-jpj-codes.ts --check    # report drift, change nothing
 *
 * Run once. After that the prefixes stand, and any spec can pick an outcome by
 * choosing a vehicle-number prefix. Re-running is safe: `ensurePrefix` updates
 * the existing record rather than adding a duplicate.
 *
 * Needs the VPN — eSim is on an internal address.
 */

import { loadEnv } from "../config/load-env";
import { EsimClient, ESIM_ENTITY } from "../src/fixtures/esim";
import { STMS_JPJ_CODES, ESIM_DEFAULTS, codesByPriority, type Priority } from "../src/data/jpj-codes";

// Same loader as playwright.config.ts, so the script and the suite always
// read the same file.
loadEnv();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const levels = args.filter((a) => /^P[1-4]$/.test(a)) as Priority[];
  const codes = levels.length ? codesByPriority(...levels) : STMS_JPJ_CODES;

  const esim = new EsimClient();
  await esim.connect();
  try {
    console.log(`${checkOnly ? "Checking" : "Seeding"} ${codes.length} code(s) in ${ESIM_ENTITY.stmsEnquiry}\n`);
    let ok = 0;
    let drift = 0;

    for (const c of codes) {
      const existing = await esim.findByPrefix(ESIM_ENTITY.stmsEnquiry, c.prefix);
      const wanted = {
        ...ESIM_DEFAULTS,
        ...c.esimFields,
        responseCode: c.code,
        remark: `QA automation · ${c.priority} · ${c.code}`,
      };

      const matches =
        existing &&
        String(existing.responseCode) === c.code &&
        Object.entries(c.esimFields ?? {}).every(([k, v]) => String(existing[k]) === String(v));

      if (matches) {
        console.log(`  ok      ${c.prefix}  ${c.code.padEnd(4)} ${c.priority}`);
        ok++;
        continue;
      }
      if (checkOnly) {
        console.log(
          `  DRIFT   ${c.prefix}  ${c.code.padEnd(4)} ${c.priority}  ` +
            (existing ? `has responseCode=${existing.responseCode}` : "missing"),
        );
        drift++;
        continue;
      }
      await esim.ensurePrefix(ESIM_ENTITY.stmsEnquiry, c.prefix, wanted);
      console.log(`  ${existing ? "updated" : "created"} ${c.prefix}  ${c.code.padEnd(4)} ${c.priority}`);
      ok++;
    }

    console.log(`\n${ok} in place${drift ? `, ${drift} needing a seed run` : ""}.`);
    if (checkOnly && drift) process.exitCode = 1;
  } finally {
    await esim.close();
  }
}

main().catch((e) => {
  console.error("FAILED:", (e as Error).message);
  process.exit(1);
});
