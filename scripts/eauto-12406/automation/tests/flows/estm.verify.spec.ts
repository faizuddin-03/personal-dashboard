// VERIFY SPEC for src/flows/estm.flow.ts — the live run that moves the flow
// from UNVERIFIED to VERIFIED (src/flows/README.md). DESTRUCTIVE: creates real
// staging eSerahan transactions and pays some of them.
//
// Each test asserts on the screen the stop CLAIMS to be sitting on, not merely
// that nothing threw. Evidence is attached to the report for review.
//
//   npx playwright test --project=flows estm.verify
//
// Needs the ucdE2E dealer, the MyKad emulator alone on port 7878, and — for the
// divert test only — eSim reachable (it edits Azfar's `VV` prefix in
// estm-enquiry-resp and restores it in a finally).
//
// EAINT-12253 (21.10.2026): the two `transfer` tests are the FINAL stop. They record the page's
// clicks / keys / closed dialogs (./_final-step.ts) and assert that on the arrival screen (eSTM
// Step 6 "Done", or the insurance plan page after the eLKM-off redirect, where the BA says eSTM
// Step 6 shows no reminder) the flow touched nothing after arrival.

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { ESIM_ENTITY } from "@fixtures/esim";
import { insuranceArrival } from "@pages/ucd/insurance.page";
import { runEstmFlow, runInsuranceQuote } from "@flows/estm.flow";
import { recordUserActions, expectUntouchedAfterArrival, attachOpenDialogs } from "./_final-step";

test.describe.configure({ mode: "serial" });

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

const body = (page: Page) => page.locator("body").innerText().then((t) => t.replace(/\s+/g, " "));

// The two `transfer` tests' own vehicle prefix (21.10.2026): r2 failed on TEST DATA, TE000071 already had an eSTM for this
// buyer on the shared staging DB ("Transaksi yang sama"); plain TE numbers are used by other specs too. TE9xxxxxx resolves
// to exactly the same eSim rows as TE (scripts/esim-prefix-free.ts TE TE9, 21.10.2026: both hit only the TE rows of
// stms-enquiry-resp, estm-enquiry-resp, rhb-transfer-resp and jomcheck-report-resp; no T or TE9… row exists), so the
// enquiry, the payment and the totals are unchanged. Same idea as the divert test's VV9.
const TRANSFER_PREFIX = "TE9";

test.describe("estm flow verify", () => {
  test("stops at buyer: Step 1 verified, consent ticked", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runEstmFlow(page, { mykad, stopAfter: "buyer" });
    expect(r.stoppedAfter).toBe("buyer");
    expect(page.url()).toMatch(/estm\/transaction\//);
    await expect(page.locator("#buyer-consent")).toBeChecked();
    await snap(page, "estm-buyer");
  });

  test("stops at vehicle: Step 2 typed, not submitted", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runEstmFlow(page, { mykad, stopAfter: "vehicle" });
    expect(r.stoppedAfter).toBe("vehicle");
    await expect(page.locator("#vehicleEngineNo")).toHaveValue(r.details.engineNo);
    await expect(page.locator("#vehicleChassisNo")).toHaveValue(r.details.chassisNo);
    await snap(page, "estm-vehicle");
  });

  test("stops at seller: Step 3 dealer verified", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runEstmFlow(page, { mykad, stopAfter: "seller" });
    expect(r.stoppedAfter).toBe("seller");
    await expect(page.locator("#ucd-consent")).toBeChecked();
    await snap(page, "estm-seller");
  });

  test("stops at jpjEnquiry: result on screen, payment offered", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runEstmFlow(page, { mykad, stopAfter: "jpjEnquiry" });
    expect(r.stoppedAfter).toBe("jpjEnquiry");
    await expect(page.locator("#to-payment")).toBeVisible();
    await snap(page, "estm-jpj-enquiry");
  });

  test("stops at payment with eLKM 12: on the payment page, add-on and period set", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runEstmFlow(page, { mykad, stopAfter: "payment", addOns: { lkm: 12 } });
    expect(r.stoppedAfter).toBe("payment");
    expect(r.route).toBe("payment-page");
    expect(page.url()).toMatch(/estm\/transaction\/payment\.do/);
    await expect(page.locator("#lkm-addson-checkbox")).toBeChecked();
    await expect(page.locator("#renewalPeriod_12")).toBeChecked();
    expect(r.paymentSummary).toMatch(/Total Amount Payable/);
    await snap(page, "estm-payment-lkm12");
    console.log("eSerahan payment summary (eLKM 12):", r.paymentSummary);
  });

  test("stops at payment with add-ons off: neither add-on ticked", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runEstmFlow(page, { mykad, stopAfter: "payment" });
    expect(r.route).toBe("payment-page");
    await expect(page.locator("#lkm-addson-checkbox")).not.toBeChecked();
    await expect(page.locator("#evoc-addson-checkbox")).not.toBeChecked();
    await snap(page, "estm-payment-addons-off");
  });

  test("runs to transfer with eLKM 12 (FINAL): ends at estm-sub.do, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await recordUserActions(page);
    await ucdSession("ucdE2E");
    const r = await runEstmFlow(page, { mykad, vehiclePrefix: TRANSFER_PREFIX, addOns: { lkm: 12 } });
    expect(r.stoppedAfter).toBe("transfer");
    expect(r.route).toBe("estm-done");
    expect(page.url()).toMatch(/estm\/transaction\/estm-sub\.do/);
    await expect(r.estm.doneButton.first()).toBeVisible();
    await expectUntouchedAfterArrival(page, { finalClickIn: /Sure to (proceed with|make this) payment/i });
    await attachOpenDialogs(page);
    expect(await body(page)).toMatch(/Done/);
    await snap(page, "estm-transfer-lkm12");
    console.log("eSerahan completed (eLKM 12):", r.vehicleRegNo);
  });

  test("runs to transfer with eLKM off (FINAL): paid, redirected to insurance, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await recordUserActions(page);
    await ucdSession("ucdE2E");
    const r = await runEstmFlow(page, { mykad, vehiclePrefix: TRANSFER_PREFIX });
    expect(r.route).toBe("insurance-after-payment");
    expect(insuranceArrival(page.url())).toBe("estm-after-payment");
    await expect(page.locator("button.select-plan-btn:visible").first()).toBeVisible();
    // No helper on eSTM Step 6 or on the insurance landing (BA 21.10: no reminder on eSTM Step 6 here).
    await expectUntouchedAfterArrival(page, { finalClickIn: /Sure to (proceed with|make this) payment/i });
    await attachOpenDialogs(page);
    await snap(page, "estm-transfer-insurance-after");
    console.log("eSerahan completed (eLKM off) -> insurance:", r.vehicleRegNo);
  });

  test("VEL000069E after the enquiry: diverted before payment, payment screen never reached", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad, esim }) => {
    test.setTimeout(12 * 60 * 1000);
    const PREFIX = "VV"; // Azfar's own prefix in estm-enquiry-resp
    const original = await esim.findByPrefix(ESIM_ENTITY.estmEnquiry, PREFIX);
    expect(original, `prefix ${PREFIX} must exist in estm-enquiry-resp`).toBeTruthy();
    const originalCode = String(original!.responseCode);
    const setCode = async (code: string): Promise<void> => {
      await esim.update(ESIM_ENTITY.estmEnquiry, { ...original!, id: original!.id as number, responseCode: code });
    };
    try {
      await setCode("GLB000000I");
      await ucdSession("ucdE2E");
      const r = await runEstmFlow(page, {
        mykad,
        // VV000001/2 already had an eSTM for this buyer on the shared staging DB ("Transaksi yang sama",
        // runs estm-r3/r4 21.10.2026). VV9xxxxxx still resolves to the VV eSim row and is ours alone.
        vehiclePrefix: `${PREFIX}9`,
        afterEnquiry: () => setCode("VEL000069E"),
      });
      expect(r.stoppedAfter).toBe("insurance");
      expect(r.route).toBe("insurance-before-payment");
      expect(insuranceArrival(page.url())).toBe("estm-before-payment");
      expect(page.url()).not.toMatch(/estm\/transaction\/payment\.do/);
      await snap(page, "estm-divert-before-payment");
    } finally {
      await setCode(originalCode);
    }
  });

  test("insurance free quote stops at form: the form is open", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    await ucdSession("ucdE2E");
    const r = await runInsuranceQuote(page, { stopAfter: "form" });
    expect(r.stoppedAfter).toBe("form");
    expect(page.url()).toMatch(/insurance\/quote\/view\.do/);
    await expect(page.locator("#vehicleRegNo")).toBeVisible();
    await snap(page, "insurance-free-quote-form");
  });

  test("insurance free quote requested: no validation complaints, still in insurance", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    await ucdSession("ucdE2E");
    const r = await runInsuranceQuote(page);
    expect(r.stoppedAfter).toBe("quoted");
    expect(page.url()).toMatch(/ucd\/insurance\//);
    expect(r.complaints ?? []).toEqual([]);
    // TODO: no probe has established what a successful quote looks like beyond the
    // stage strip, so `r.stage` is logged, not asserted. Tighten once someone has read it.
    console.log("insurance quote stage:", r.stage);
    await snap(page, "insurance-quote-requested");
  });
});
