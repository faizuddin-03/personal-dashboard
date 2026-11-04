/**
 * Seed eSim with one rhb-transfer-resp record per RHB response code.
 *
 *   npx tsx scripts/seed-rhb-codes.ts            # every P1-P4 code
 *   npx tsx scripts/seed-rhb-codes.ts P1         # only that priority
 *   npx tsx scripts/seed-rhb-codes.ts --check    # report drift, change nothing
 *
 * RHB is the payment gateway for EVERY module, so these prefixes work for STMS,
 * eSerahan, APT and BMK alike.
 *
 * Needs the VPN. Writes to the protected prefixes are refused by the client.
 */

import { loadEnv } from "../config/load-env";
import { EsimClient, ESIM_ENTITY } from "../src/fixtures/esim";
import { RHB_CODES, RHB_DEFAULTS, rhbByPriority, type Priority } from "../src/data/rhb-codes";

// Same loader as playwright.config.ts, so the script and the suite always
// read the same file.
loadEnv();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const levels = args.filter((a) => /^P[1-4]$/.test(a)) as Priority[];
  const codes = levels.length ? rhbByPriority(...levels) : RHB_CODES;

  const esim = new EsimClient();
  await esim.connect();
  try {
    console.log(`${checkOnly ? "Checking" : "Seeding"} ${codes.length} RHB code(s) in ${ESIM_ENTITY.rhbTransfer}\n`);
    let ok = 0;
    let drift = 0;

    for (const c of codes) {
      const existing = await esim.findByPrefix(ESIM_ENTITY.rhbTransfer, c.prefix);
      if (existing && String(existing.responseCode) === c.code) {
        console.log(`  ok      ${c.prefix}  ${c.code.padEnd(6)} ${c.priority}`);
        ok++;
        continue;
      }
      if (checkOnly) {
        console.log(`  DRIFT   ${c.prefix}  ${c.code.padEnd(6)} ${c.priority}  ` +
          (existing ? `has responseCode=${existing.responseCode}` : "missing"));
        drift++;
        continue;
      }
      await esim.ensurePrefix(ESIM_ENTITY.rhbTransfer, c.prefix, {
        ...RHB_DEFAULTS,
        responseCode: c.code,
        description: c.description.slice(0, 60),
        remark: `QA automation · ${c.priority} · ${c.code}`,
      });
      console.log(`  ${existing ? "updated" : "created"} ${c.prefix}  ${c.code.padEnd(6)} ${c.priority}`);
      ok++;
    }
    /*
     * Pin the ENQUIRY leg for any code that needs one.
     *
     * `DP` triggers a re-query, and a prefix with no rhb-enquiry-resp row
     * defaults to confirming — which silently turns "DP rejects the payment"
     * into "DP completes it" and makes the test meaningless.
     */
    if (!checkOnly) {
      const withEnquiry = codes.filter((c) => c.enquiryCode);
      if (withEnquiry.length) {
        console.log("\nPinning the RHB enquiry leg where the code depends on it:");
        for (const c of withEnquiry) {
          await esim.ensurePrefix(ESIM_ENTITY.rhbEnquiry, c.prefix, {
            responseCode: c.enquiryCode as string,
            description: `enquiry leg for transfer ${c.code}`,
            delayMiliSeconds: 0,
            remark: `QA automation - ${c.code} needs enquiry ${c.enquiryCode}`,
          });
          console.log(`  ${c.prefix}  rhb-enquiry-resp -> ${c.enquiryCode}  (transfer ${c.code})`);
        }
      }
    }

    /*
     * The JPJ leg has to PASS for an RHB failure to be reachable at all.
     *
     * eSim keys JPJ and RHB on the same vehicle prefix but in different
     * entities, so a Z* vehicle with no stms-enquiry-resp row never gets past
     * step 4 and the RHB code is never exercised. Seed the JPJ side to the
     * success code, so the only thing failing is the one under test.
     */
    if (!checkOnly) {
      console.log("\nSeeding the JPJ leg for the same prefixes, so payment is reachable:");
      for (const c of codes) {
        await esim.ensurePrefix(ESIM_ENTITY.stmsEnquiry, c.prefix, {
          responseCode: "00",
          usageCode: "AB",
          bodyType: "MKR",
          jsjStatus: "0",
          sekatStatus: "0",
          jpjEnqStatus: "0",
          delayMiliSeconds: 0,
          remark: `QA automation - JPJ passes so RHB ${c.code} is what fails`,
        });
        console.log(`  ${c.prefix}  stms-enquiry-resp -> 00`);
      }
    }

    console.log(`\n${ok} in place${drift ? `, ${drift} needing a seed run` : ""}.`);
    if (checkOnly && drift) process.exitCode = 1;
  } finally {
    await esim.close();
  }
}

main().catch((e) => { console.error("FAILED:", (e as Error).message); process.exit(1); });
