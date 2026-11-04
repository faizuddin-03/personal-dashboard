// VERIFY SPEC for src/flows/bo-actions.flow.ts — the live run that moves the flow
// from UNVERIFIED to VERIFIED (src/flows/README.md).
//
// BackOffice acts on records that already exist, so this spec is driven by
// transactions a PERSON nominates, never by ones it finds. Set:
//
//   BO_VERIFY_STMS_VEHICLE / BO_VERIFY_STMS_TX     an APPROVED STMS (read-only checks)
//   BO_VERIFY_APT_VEHICLE  / BO_VERIFY_APT_TX      any APT (optional)
//   BO_VERIFY_RESET_VEHICLE / BO_VERIFY_RESET_TX   a FAILED, yours-to-reset STMS for the
//                                                  reset test; for the report test, one
//                                                  that HAS been reset
//   BO_VERIFY_TRIGGER_VEHICLE                      an Approved STMS with NO APT yet
//   BO_VERIFY_NOT_RESET_VEHICLE / _TX              a row that must NOT be in the report (optional)
//
//   npx playwright test --project=flows bo-actions.verify
//   npx playwright test --project=flows bo-actions.verify -g "@destructive"   # state-changing only
//
// Read-only tests run first. A test whose variables are unset is SKIPPED, and a
// skipped test does not verify its function.

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import * as path from "node:path";
import { LoginPage } from "@auth/login";
import {
  findStmsTransaction,
  findAptTransaction,
  resetPayment,
  readResetReport,
  manualAptTrigger,
  exportListing,
  BoRefusedError,
} from "@flows/bo-actions.flow";

test.describe.configure({ mode: "serial" });

const env = (k: string) => process.env[k] || undefined;
const STMS = { vehicle: env("BO_VERIFY_STMS_VEHICLE"), tx: env("BO_VERIFY_STMS_TX") };
const APT = { vehicle: env("BO_VERIFY_APT_VEHICLE"), tx: env("BO_VERIFY_APT_TX") };
const RESET = { vehicle: env("BO_VERIFY_RESET_VEHICLE"), tx: env("BO_VERIFY_RESET_TX") };
const TRIGGER = { vehicle: env("BO_VERIFY_TRIGGER_VEHICLE") };
const NOT_RESET = { vehicle: env("BO_VERIFY_NOT_RESET_VEHICLE"), tx: env("BO_VERIFY_NOT_RESET_TX") };

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

test.describe("bo-actions flow verify", () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).as("bo");
  });

  // ------------------------------------------------------------ read-only

  test("findStmsTransaction reads the row by column header", async ({ page }) => {
    test.skip(!STMS.vehicle, "set BO_VERIFY_STMS_VEHICLE");
    const row = await findStmsTransaction(page, { vehicleNo: STMS.vehicle!, txNo: STMS.tx });
    expect(row, "row found").not.toBeNull();
    // The columns the reset outcome is judged on must have been read by header.
    for (const col of ["Payment", "Tx Status"]) expect(Object.keys(row!), `column ${col}`).toContain(col);
    if (STMS.tx) expect(Object.values(row!).join(" ")).toContain(STMS.tx);
    await snap(page, "bo-stms-row");
  });

  test("findStmsTransaction returns null for a vehicle that has no row", async ({ page }) => {
    expect(await findStmsTransaction(page, { vehicleNo: "ZZ999999" })).toBeNull();
    await snap(page, "bo-stms-no-row");
  });

  test("findAptTransaction reads an APT row", async ({ page }) => {
    test.skip(!APT.vehicle, "set BO_VERIFY_APT_VEHICLE");
    const row = await findAptTransaction(page, { vehicleNo: APT.vehicle!, txNo: APT.tx });
    expect(row, "APT row found").not.toBeNull();
    expect(Object.keys(row!)).toContain("Tx Status");
    await snap(page, "bo-apt-row");
  });

  test("resetPayment REFUSES when the row is not in the expected state", async ({ page }) => {
    test.skip(!STMS.vehicle || !STMS.tx, "set BO_VERIFY_STMS_VEHICLE and BO_VERIFY_STMS_TX (an Approved STMS)");
    // The row is Approved, so demanding Failed must throw and press nothing.
    await expect(
      resetPayment(page, {
        kind: "stms",
        vehicleNo: STMS.vehicle!,
        txNo: STMS.tx!,
        expect: { Payment: "Failed", "Tx Status": "Failed" },
      }),
    ).rejects.toBeInstanceOf(BoRefusedError);
    await snap(page, "bo-reset-refused");
    // ...and it must still be untouched.
    const after = await findStmsTransaction(page, { vehicleNo: STMS.vehicle!, txNo: STMS.tx });
    expect(after?.["Tx Status"]).not.toBe("Pending");
  });

  test("resetPayment REFUSES an empty expectation", async ({ page }) => {
    await expect(
      resetPayment(page, { kind: "stms", vehicleNo: "ZZ999999", txNo: "S000000000", expect: {} }),
    ).rejects.toBeInstanceOf(BoRefusedError);
  });

  test("readResetReport lists a reset transaction and not a non-reset one", async ({ page }) => {
    test.skip(!RESET.vehicle || !RESET.tx, "set BO_VERIFY_RESET_VEHICLE and BO_VERIFY_RESET_TX (a transaction that HAS been reset)");
    const listed = await readResetReport(page, { vehicleNo: RESET.vehicle! });
    expect(listed.lists(RESET.tx!), `${RESET.tx} listed`).toBe(true);
    await snap(listed.view, "reset-report-listed");
    if (NOT_RESET.vehicle && NOT_RESET.tx) {
      const not = await readResetReport(page, { vehicleNo: NOT_RESET.vehicle });
      expect(not.lists(NOT_RESET.tx), `${NOT_RESET.tx} not listed`).toBe(false);
      await snap(not.view, "reset-report-not-listed");
    }
  });

  test("exportListing downloads the Failed list and parses it", async ({ page }, testInfo) => {
    const { file, rows } = await exportListing(page, {
      kind: "stms",
      status: "Failed",
      saveTo: path.join(testInfo.outputDir, "export-STMS-Failed.csv"),
    });
    expect(rows.length, "at least one Failed STMS parsed").toBeGreaterThan(0);
    expect(rows.every((r) => r.status.includes("Failed")), "every exported row is Failed").toBe(true);
    await testInfo.attach("export-STMS-Failed.csv", { path: file });
  });

  // ---------------------------------------------------------- destructive

  test("resetPayment resets a Failed row: Payment -, Pending, Reset gone", { tag: ["@destructive"] }, async ({ page }) => {
    test.skip(!RESET.vehicle || !RESET.tx, "set BO_VERIFY_RESET_VEHICLE and BO_VERIFY_RESET_TX (a FAILED row that is yours to reset)");
    const r = await resetPayment(page, {
      kind: "stms",
      vehicleNo: RESET.vehicle!,
      txNo: RESET.tx!,
      expect: { Payment: "Failed", "Tx Status": "Failed" },
    });
    await snap(page, "bo-after-reset");
    expect(r.after?.["Payment"], "Payment after").toBe("-");
    expect(r.after?.["Tx Status"], "Tx Status after").toBe("Pending");
    expect(r.resetLinkGone, "Reset link gone").toBe(true);
    expect(r.ok).toBe(true);
    // A second press must now be refused: the row is no longer Failed.
    await expect(
      resetPayment(page, { kind: "stms", vehicleNo: RESET.vehicle!, txNo: RESET.tx!, expect: { Payment: "Failed" } }),
    ).rejects.toBeInstanceOf(BoRefusedError);
  });

  test("manualAptTrigger creates an APT for an Approved STMS", { tag: ["@destructive"] }, async ({ page }) => {
    test.skip(!TRIGGER.vehicle, "set BO_VERIFY_TRIGGER_VEHICLE (an Approved STMS with no APT yet)");
    const r = await manualAptTrigger(page, { vehicleNo: TRIGGER.vehicle!, expectStms: { "Tx Status": "Approved" } });
    await snap(page, "bo-after-trigger");
    // The triggers show no message; an APT row appearing is the outcome. It can lag.
    const apt = r.apt ?? (await findAptTransaction(page, { vehicleNo: TRIGGER.vehicle! }));
    expect(apt, "an APT row now exists for the vehicle").not.toBeNull();
    // A second trigger must be refused.
    await expect(
      manualAptTrigger(page, { vehicleNo: TRIGGER.vehicle!, expectStms: { "Tx Status": "Approved" } }),
    ).rejects.toBeInstanceOf(BoRefusedError);
  });
});
