// @subject  UCD-STMS
// @ledger   none yet — coverage has not been through ./bin/review s
// @plan     none yet — no block has been signed off
// @env      staging
// @status   draft
//
// PRE-LEDGER. These came out of building the harness, not out of an agreed
// ledger, so no title carries a case id and none of them may gate sign-off.
// They exist to prove the journey runs end to end; the coverage that should
// outlive that gets written as ledger entries and re-authored from signed
// blocks.

import { test, expect } from "@fixtures";
import { runStmsFlow, closeStmsFlow } from "@flows/stms.flow";
import { CARDS } from "@data/cards";

/**
 * STMS — the customer selling TO the dealer, all six steps.
 *
 * Every test here CREATES A RECORD on staging, so the whole file is
 * `@destructive` and can never be selected by the production project.
 */
test.describe("UCD › STMS wizard", { tag: "@destructive" }, () => {
  test("a dealer can take an STMS from seller scan to JPJ transfer", async ({
    page,
    ucdSession,
    mykad,
  }) => {
    await ucdSession("ucdE2E");

    const run = await runStmsFlow(page, { mykad, stopAfter: "transfer" });
    try {
      await expect(page).toHaveURL(/jpj-sub\.do/);

      const transfer = await run.stms.transferResult();
      expect(transfer.status).toContain("SUCCESSFUL");
      expect(transfer.submittedAt).not.toBe("");

      test.info().annotations.push(
        { type: "vehicle", description: run.vehicleRegNo },
        { type: "transaction", description: run.transactionId ?? "(none)" },
        { type: "transfer", description: transfer.status },
      );
    } finally {
      await closeStmsFlow(run);
    }
  });

  test("the seller step reports the identity that was actually scanned", async ({
    page,
    ucdSession,
    mykad,
  }) => {
    await ucdSession("ucdE2E");

    const run = await runStmsFlow(page, { mykad, stopAfter: "seller" });
    try {
      await expect(page).toHaveURL(/auth-seller\.do\?category=1/);

      // The screen must show the identity from the card that was inserted, not
      // one left over from a previous read.
      const seller = await run.stms.identityFromCard();
      expect(seller.nric).toBe(CARDS.malaysianIndividual.NRIC);
      expect(seller.name).toBe(CARDS.malaysianIndividual.GMPCName);
    } finally {
      await closeStmsFlow(run);
    }
  });

  test("the vehicle number entered at step 1 survives to the JPJ check", async ({
    page,
    ucdSession,
    mykad,
  }) => {
    await ucdSession("ucdE2E");

    const run = await runStmsFlow(page, { mykad, stopAfter: "jpjCheck" });
    try {
      await expect(page).toHaveURL(/jpj-enq\.do/);
      expect(run.transactionId, "a transaction id should exist by the JPJ step").toBeTruthy();
      await expect(page.locator("#vehicleRegNo")).toHaveValue(run.vehicleRegNo);
    } finally {
      await closeStmsFlow(run);
    }
  });

  test("a thumbprint that does not match never unlocks Next", async ({
    page,
    ucdSession,
    mykad,
  }) => {
    await ucdSession("ucdE2E");

    // "Next" carries `d-none` until verification passes, so the flow throws
    // waiting for it. That throw IS the expected behaviour — the assertion is
    // that the journey cannot continue, not that it completes.
    await expect(
      runStmsFlow(page, { mykad, matchResult: "Not Identical", stopAfter: "seller" }),
    ).rejects.toThrow();
  });
});
