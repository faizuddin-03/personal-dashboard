// VERIFY SPEC for src/flows/apt.flow.ts — the live run that moves the flow from
// UNVERIFIED to VERIFIED (src/flows/README.md). Each test asserts on the screen
// the stop CLAIMS to be sitting on, and attaches a screenshot for review.
//
// A dealer cannot create an APT, so this spec needs APTs that BackOffice has
// already triggered (Manual APT Trigger 5.5 then 6.0 on an Approved STMS). Point
// it at them; every test skips when its variable is unset.
//
//   APT_VERIFY_VEHICLE=ON000010          an APT with a Resubmit link (New/Pending/Failed, 6.0 present)
//   APT_VERIFY_PAY_VEHICLE=ON000011      a SECOND such APT — paying spends it
//   APT_VERIFY_EXPECTED_TOTAL=127.00     what Step 5 must show for the pay vehicle
//   APT_VERIFY_TRANSFER_VEHICLE=ON000012 a THIRD such APT for `transfer` (pays, then F5 → Step 6)
//   APT_VERIFY_REOPEN_VEHICLE=ON000013   a FOURTH for paid → [OK] → `reopenAptTransfer` (pays)
//
//   npx playwright test --project=flows apt.verify
//
// DESTRUCTIVE: `payment` presses Resubmit (which can re-run the JPJ enquiry) and
// `paid` debits RHB through eSim. Check the company's BO mailing State first —
// the JPJ Fee's region follows it at payment time (knowledge/_core/apt.md).
//
// EAINT-12253 (21.10.2026): `paid` is the FINAL stop. A good APT payment does not navigate: Step 5
// raises "Payment request sent", and the flow now returns with it OPEN (it used to press its OK).
// The test records clicks / keys / closed dialogs (./_final-step.ts) and asserts nothing was
// touched after the result arrived; the listing is then read by address (`readAptListing`).

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { runAptFlow, readAptListing, reopenAptTransfer } from "@flows/apt.flow";
import { lanePersona } from "@config/personas";
import { recordUserActions, expectUntouchedAfterArrival, attachOpenDialogs } from "./_final-step";

const VEHICLE = process.env.APT_VERIFY_VEHICLE;
const PAY_VEHICLE = process.env.APT_VERIFY_PAY_VEHICLE;
const EXPECTED = process.env.APT_VERIFY_EXPECTED_TOTAL;
const TRANSFER_VEHICLE = process.env.APT_VERIFY_TRANSFER_VEHICLE;
const REOPEN_VEHICLE = process.env.APT_VERIFY_REOPEN_VEHICLE;
// EAINT-12626 (26.10.2026): the fixed build (staging /uat1/ from 26.10). Two more APTs, each PAID:
//   APT_VERIFY_LANDED_VEHICLE=ON000014    `paid` lands straight on Step 6 (no "Payment request sent")
//   APT_VERIFY_LANDED_TRANSFER_VEHICLE=ON000015  `transfer` on the fixed build: Step 6 reached WITHOUT an F5
const LANDED_VEHICLE = process.env.APT_VERIFY_LANDED_VEHICLE;
const LANDED_TRANSFER_VEHICLE = process.env.APT_VERIFY_LANDED_TRANSFER_VEHICLE;

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

test.describe.configure({ mode: "serial" });

test.describe("apt flow verify", () => {
  test("stops at listed: the APT's row is on the listing", async ({ page, ucdSession }) => {
    test.skip(!VEHICLE, "set APT_VERIFY_VEHICLE");
    await ucdSession(lanePersona());
    const r = await runAptFlow(page, { vehicleRegNo: VEHICLE!, stopAfter: "listed" });
    expect(r.stoppedAfter).toBe("listed");
    expect(page.url()).toMatch(/apt\/enquiry/);
    expect(r.transactionNo).toMatch(/^A\d{6,}$/);
    expect(Object.keys(r.listedRow)).toEqual(expect.arrayContaining(["Payment", "Tx Status"]));
    await snap(page, "apt-listed");
  });

  test("stops at payment: on Step 5 with the price read, nothing paid", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    test.skip(!VEHICLE, "set APT_VERIFY_VEHICLE");
    await ucdSession(lanePersona());
    const r = await runAptFlow(page, { vehicleRegNo: VEHICLE!, stopAfter: "payment" });
    expect(r.stoppedAfter).toBe("payment");
    expect(page.url()).toMatch(/apt\/transaction\/payment\.do/);
    expect(r.paymentSummary).toMatch(/Total Amount Payable/);
    expect(r.total).toMatch(/^\d+\.\d{2}$/);
    await expect(page.locator("#to-payment")).toBeVisible();
    await snap(page, "apt-step5");
  });

  test("expectedTotal guards the payment: a wrong total throws before paying", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    test.skip(!VEHICLE, "set APT_VERIFY_VEHICLE");
    await ucdSession(lanePersona());
    await expect(
      runAptFlow(page, { vehicleRegNo: VEHICLE!, expectedTotal: "0.01", stopAfter: "paid" }),
    ).rejects.toThrow(/expected RM0\.01\. Not paid/);
    // Still on Step 5: nothing was submitted.
    expect(page.url()).toMatch(/apt\/transaction\/payment\.do/);
    await snap(page, "apt-guard-refused");
  });

  test("runs to paid (FINAL): 'Payment request sent' left open, nothing touched; then Payment OK on the listing", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    test.skip(!PAY_VEHICLE || !EXPECTED, "set APT_VERIFY_PAY_VEHICLE and APT_VERIFY_EXPECTED_TOTAL");
    await recordUserActions(page);
    await ucdSession(lanePersona());
    const r = await runAptFlow(page, { vehicleRegNo: PAY_VEHICLE!, expectedTotal: EXPECTED, stopAfter: "paid" });
    expect(r.total).toBe(EXPECTED);
    expect(r.payment?.outcome).toBe("paid");
    expect(page.url()).toMatch(/apt\/transaction\/payment\.do/);
    await expect(r.apt.paymentSentDialog).toBeVisible();
    await expectUntouchedAfterArrival(page, { finalClickIn: /payment/i });
    await attachOpenDialogs(page);
    await snap(page, "apt-after-payment");

    const row = await readAptListing(page, PAY_VEHICLE!, r.transactionNo);
    expect(row?.["Payment"]).toBe("OK");
    expect(row?.["Tx Status"]).toMatch(/Approved/);
    await snap(page, "apt-listing-after-payment");
  });

  // Added 21.10.2026 late (EAINT-12253 cr-triage APT): APT Step 6 "Submission (JPJ Transfer)" `jpj-sub.do` exists; F5 on
  // the paid APT's payment page opens it. These two stops are UNVERIFIED until two clean runs each (README).
  test("runs to transfer (Step 6): F5 on the paid APT's payment page opens jpj-sub.do, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    test.skip(!TRANSFER_VEHICLE || !EXPECTED, "set APT_VERIFY_TRANSFER_VEHICLE and APT_VERIFY_EXPECTED_TOTAL");
    await recordUserActions(page);
    await ucdSession(lanePersona());
    const r = await runAptFlow(page, { vehicleRegNo: TRANSFER_VEHICLE!, expectedTotal: EXPECTED, stopAfter: "transfer" });
    expect(r.stoppedAfter).toBe("transfer");
    expect(r.payment?.outcome).toBe("paid");
    expect(page.url()).toMatch(/apt\/transaction\/jpj-sub\.do/);
    await expect(page.getByText("JPJ Transfer Status").first()).toBeVisible();
    expect(r.transfer?.status).toMatch(/OK/);
    await expectUntouchedAfterArrival(page);
    await attachOpenDialogs(page);
    await snap(page, "apt-step6-transfer");
  });

  test("paid, the result's OK opens the APT listing; reopenAptTransfer: payment page again + F5 → Step 6", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    test.skip(!REOPEN_VEHICLE || !EXPECTED, "set APT_VERIFY_REOPEN_VEHICLE and APT_VERIFY_EXPECTED_TOTAL");
    await ucdSession(lanePersona());
    const r = await runAptFlow(page, { vehicleRegNo: REOPEN_VEHICLE!, expectedTotal: EXPECTED, stopAfter: "paid" });
    expect(r.payment?.outcome).toBe("paid");
    const paymentUrl = r.payment?.outcome === "paid" ? r.payment.url : "";
    expect(paymentUrl).toMatch(/apt\/transaction\/payment\.do\?id=/);
    const landed = await r.apt.pressPaymentSentOk();
    expect(landed).toMatch(/apt\/enquiry\//);
    await snap(page, "apt-after-result-ok");
    const t = await reopenAptTransfer(page, paymentUrl);
    await test.info().attach("reopened-at", { body: t.openedAt, contentType: "text/plain" });
    expect(t.url).toMatch(/apt\/transaction\/jpj-sub\.do/);
    expect(t.status).toMatch(/OK/);
    await snap(page, "apt-step6-after-reopen-f5");
  });
});

// EAINT-12626 (26.10.2026, cr-author): the FIXED build. A good payment goes straight to Step 6 `jpj-sub.do`; the old tests
// above ("Payment request sent" left open; F5 → Step 6; the result's OK) describe the build BEFORE the fix and are
// expected to fail on it. These two prove the new path of the same flow. UNVERIFIED until two clean runs each (README).
test.describe("apt flow verify (after the EAINT-12626 fix)", () => {
  test("runs to paid on the fixed build: lands on Step 6 jpj-sub.do, no 'Payment request sent', nothing touched", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    test.skip(!LANDED_VEHICLE || !EXPECTED, "set APT_VERIFY_LANDED_VEHICLE and APT_VERIFY_EXPECTED_TOTAL");
    await recordUserActions(page);
    await ucdSession(lanePersona());
    const r = await runAptFlow(page, { vehicleRegNo: LANDED_VEHICLE!, expectedTotal: EXPECTED, stopAfter: "paid" });
    expect(r.payment?.outcome).toBe("paid");
    expect(r.payment?.outcome === "paid" ? r.payment.via : "").toBe("moved");
    const after = await r.apt.afterPayment();
    await test.info().attach("after-payment", { body: JSON.stringify(after, null, 2), contentType: "application/json" });
    expect(after.sentDialog).toBe(false);
    expect(after.onStep6).toBe(true);
    expect(after.activeStep).toMatch(/6\s*Transfer/);
    expect(after.status).toMatch(/OK/);
    await expectUntouchedAfterArrival(page, { finalClickIn: /payment/i });
    await attachOpenDialogs(page);
    await snap(page, "apt-paid-landed-step6");
  });

  test("runs to transfer on the fixed build: Step 6 reached without F5 (transferBy landed)", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    test.skip(!LANDED_TRANSFER_VEHICLE || !EXPECTED, "set APT_VERIFY_LANDED_TRANSFER_VEHICLE and APT_VERIFY_EXPECTED_TOTAL");
    await recordUserActions(page);
    await ucdSession(lanePersona());
    const r = await runAptFlow(page, { vehicleRegNo: LANDED_TRANSFER_VEHICLE!, expectedTotal: EXPECTED, stopAfter: "transfer" });
    expect(r.stoppedAfter).toBe("transfer");
    expect(r.transferBy).toBe("landed");
    expect(page.url()).toMatch(/apt\/transaction\/jpj-sub\.do/);
    expect(r.transfer?.status).toMatch(/OK/);
    await expectUntouchedAfterArrival(page, { finalClickIn: /payment/i });
    await attachOpenDialogs(page);
    await snap(page, "apt-transfer-landed");
  });
});
