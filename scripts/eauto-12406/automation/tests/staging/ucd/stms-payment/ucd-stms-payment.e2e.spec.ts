// @subject  UCD-STMS
// @ledger   none yet — coverage has not been through ./bin/review s
// @plan     none yet — no block has been signed off
// @env      staging
// @status   draft
//
// PRE-LEDGER. Proves each RHB code STOPS the payment and says something; it
// does not yet assert the message matches the checklist's wording.

import { test, expect } from "@fixtures";
import { runStmsFlow, closeStmsFlow } from "@flows/stms.flow";
import { rhbFailures, RHB_CODES } from "@data/rhb-codes";

/**
 * RHB payment failures, driven through STMS.
 *
 * **RHB is the payment gateway for every module** — the checklist sheet is
 * literally called "RHB (Shared Across Modules)" — so a code proved here is the
 * same code eSerahan, APT and BMK will hit. Proving it once on the cheapest
 * wizard is the point; re-proving it per module is not.
 *
 *   npx tsx scripts/seed-rhb-codes.ts            # once — creates the prefixes
 *   npm run test:e2e -- --grep @P1               # the three P1 codes
 *
 * Each run creates a draft STMS on staging and spends one vehicle number.
 * A rejected payment leaves the transaction unpaid, which is the point.
 */
test.describe("UCD › STMS payment › RHB", { tag: "@destructive" }, () => {
  for (const c of rhbFailures()) {
    test(
      `${c.priority} ${c.code} — ${c.description.slice(0, 55)}`,
      { tag: [`@${c.priority}`] },
      async ({ page, ucdSession, mykad }) => {
        await ucdSession("ucdE2E");

        const run = await runStmsFlow(page, {
          mykad,
          vehiclePrefix: c.prefix,
          stopAfter: "payment",
        });
        try {
          const result = await run.stms.submitPaymentAndReadResult();

          test.info().annotations.push(
            { type: "rhbCode", description: `${c.code} (${c.priority})` },
            { type: "prefix", description: c.prefix },
            { type: "vehicle", description: run.vehicleRegNo },
            { type: "outcome", description: result.outcome },
            {
              type: "message",
              description: result.outcome === "rejected" ? result.message : result.url,
            },
          );

          // A failing RHB code must stop the payment...
          expect(result.outcome, `RHB ${c.code} should not complete the transfer`).toBe("rejected");
          // ...and tell the dealer why. A silent refusal is its own defect.
          if (result.outcome === "rejected") {
            expect(result.message.trim(), `RHB ${c.code} rejected silently`).not.toBe("");
          }
        } finally {
          await closeStmsFlow(run);
        }
      },
    );
  }

  test("the success code still completes a transfer", { tag: ["@P4"] }, async ({ page, ucdSession, mykad }) => {
    const ok = RHB_CODES.find((c) => c.success);
    expect(ok, "a success code must exist in the map").toBeTruthy();

    await ucdSession("ucdE2E");
    const run = await runStmsFlow(page, { mykad, vehiclePrefix: ok!.prefix, stopAfter: "payment" });
    try {
      const result = await run.stms.submitPaymentAndReadResult();
      test.info().annotations.push({ type: "outcome", description: result.outcome });
      // Without this, a suite where EVERY code fails would look healthy.
      expect(result.outcome, `RHB ${ok!.code} should complete`).toBe("transferred");
    } finally {
      await closeStmsFlow(run);
    }
  });
});
