// @subject  UCD-STMS
// @ledger   none yet — coverage has not been through ./bin/review s
// @plan     none yet — no block has been signed off
// @env      staging
// @status   draft
//
// PRE-LEDGER, and it matters more here than elsewhere: this file walks the
// team's own regression checklist, so the obvious next step is to turn each
// row into a ledger entry with the message text the checklist states. Until
// then it proves the codes still FAIL and still BLOCK payment — not that the
// wording is right.

import { test, expect } from "@fixtures";
import { runStmsFlow, closeStmsFlow } from "@flows/stms.flow";
import { STMS_JPJ_CODES } from "@data/jpj-codes";

/**
 * Every P1–P4 JPJ error code from
 * `🚨Master Regression Checklist _ JPJ & RHB Error Codes.xlsx`, driven through
 * the real wizard.
 *
 * The checklist's last recorded regression is 2024. This exists to answer one
 * question: do these codes still behave?
 *
 *   npx tsx scripts/seed-jpj-codes.ts          # once — creates the prefixes
 *   npm run test:e2e -- --grep @P1             # the five P1 codes
 *
 * Each run creates a draft on staging and spends one vehicle number. Nothing
 * is paid: every test stops at the enquiry.
 */
test.describe("UCD › STMS JPJ check", { tag: "@destructive" }, () => {
  for (const c of STMS_JPJ_CODES) {
    const usage = c.esimFields?.usageCode ? ` usage=${c.esimFields.usageCode}` : "";

    test(
      `${c.priority} ${c.code}${usage} — ${c.description.slice(0, 60)}`,
      { tag: [`@${c.priority}`] },
      async ({ page, ucdSession, mykad }) => {
        await ucdSession("ucdE2E");

        const run = await runStmsFlow(page, {
          mykad,
          vehiclePrefix: c.prefix,
          stopAfter: "jpjEnquiry",
        });
        try {
          const result = await run.stms.jpjEnquiryResult();
          const canPay = await run.stms.canProceedToPayment();

          test.info().annotations.push(
            { type: "code", description: `${c.code}${usage} (${c.priority})` },
            { type: "prefix", description: c.prefix },
            { type: "vehicle", description: run.vehicleRegNo },
            { type: "jpjStatus", description: result.status },
            { type: "responseCode", description: result.responseCode },
            { type: "canProceedToPayment", description: String(canPay) },
          );

          // Every code here is an error code, so three things must hold.
          expect(result.status, `JPJ should not report OK for ${c.code}`).not.toBe("OK");
          expect(canPay, `a failed JPJ enquiry must not offer payment (${c.code})`).toBe(false);
          expect(result.responseCode.trim(), `${c.code} produced no response text`).not.toBe("");
        } finally {
          await closeStmsFlow(run);
        }
      },
    );
  }
});
