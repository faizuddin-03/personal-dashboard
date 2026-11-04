// VERIFY SPEC for src/flows/jomcheck.flow.ts — the live run that moves the flow from
// UNVERIFIED to VERIFIED (src/flows/README.md). Each test asserts on the screen the stop
// CLAIMS to be sitting on, and attaches a screenshot for review.
//
//   RECORD=1 npx playwright test --project=flows jomcheck.verify
//
// DESTRUCTIVE (mildly): `submitted` and `payConfirm` press Submit, which creates a Pending
// JomCheck transaction on the lane's company (vehicle OUP…, EAINT-12253 prefix). Nothing is
// ever paid by the first three tests: the Payment dialog is closed with No, and the test asserts
// it stayed unpaid.
//
// EAINT-12253 (21.10.2026): the last test drives the new FINAL stop `paid` and PAYS (RM20.00 + 8% on
// staging, OU's RHB switched to OK around the payment only; VPN). It records clicks / keys / closed
// dialogs (./_final-step.ts) and asserts that on the result ("Report is retrieved successfully",
// Download Report) nothing was touched after the Payment dialog's Yes. A second `paid` test (added 21.10.2026) does the
// same by Chassis No., with a locator handler armed on Pay Now as the EAINT-12253 CR specs arm one (PAYS again).

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { lanePersona } from "@config/personas";
import { runJomCheckFlow } from "@flows/jomcheck.flow";
import { randomChassisNo } from "@data/generator";
import { withRhbOk } from "@fixtures/esim-switch";
import { recordUserActions, expectUntouchedAfterArrival, attachOpenDialogs } from "./_final-step";

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

test.describe.configure({ mode: "serial" });

test.describe("jomcheck flow verify", () => {
  test("stops at form: Get JomCheck Reports, nothing typed", async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runJomCheckFlow(page, { stopAfter: "form" });
    expect(r.stoppedAfter).toBe("form");
    expect(page.url()).toMatch(/jomcheck\/transaction\/view\.do$/);
    await expect(page.locator("#vehicleRegNo")).toBeEditable();
    await expect(page.locator("#to-check-vehicle")).toBeVisible();
    await expect(page.locator("#to-pay")).toBeHidden();
    await snap(page, "jomcheck-form");
  });

  test("stops at submitted: Pending transaction, result line, Pay Now offered", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runJomCheckFlow(page, { stopAfter: "submitted" });
    expect(r.stoppedAfter).toBe("submitted");
    expect(r.transactionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.result).toMatch(/number found\. Pay now \(RM\d+\.\d{2} \+ 8% Service Tax\) to purchase the report\./);
    await expect(page.locator("#to-pay")).toBeVisible();
    await expect(page.locator(".ui-dialog:visible")).toHaveCount(0);
    await snap(page, "jomcheck-submitted");
  });

  test("stops at payConfirm: Payment dialog open; No leaves it unpaid", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runJomCheckFlow(page, { stopAfter: "payConfirm" });
    expect(r.stoppedAfter).toBe("payConfirm");
    await expect(r.jomcheck.paymentDialog).toBeVisible();
    await expect(r.jomcheck.paymentDialog.locator(".ui-dialog-title")).toHaveText("Payment");
    expect(r.payDialogText).toContain("Are you sure you want to proceed with this payment?");
    await expect(r.jomcheck.paymentDialog.locator("button.confirm-dialog-btn")).toHaveText("Yes");
    await expect(r.jomcheck.paymentDialog.locator("button.cancel-dialog-btn")).toHaveText("No");
    await snap(page, "jomcheck-pay-confirm");

    await r.jomcheck.cancelPayNowDialog();
    // Still the same transaction, Pay Now offered again: nothing was paid.
    expect(r.jomcheck.transactionId()).toBe(r.transactionId);
    await expect(page.locator("#to-pay")).toBeVisible();
    await snap(page, "jomcheck-after-no");
  });

  test("runs to paid (FINAL, PAYS): result with Download Report, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    await recordUserActions(page);
    await ucdSession(lanePersona());
    const r = await runJomCheckFlow(page, { stopAfter: "paid", expectedPrice: "20.00", aroundPayment: (f) => withRhbOk("OU", f) });
    expect(r.stoppedAfter).toBe("paid");
    expect(r.payment?.outcome).toBe("paid");
    expect(page.url()).toMatch(/jomcheck\/transaction\/view\.do\?transactionId=/);
    expect(r.jomcheck.transactionId()).toBe(r.transactionId);
    await expect(page.getByText(/Report is retrieved successfully/i).filter({ visible: true }).first()).toBeVisible();
    await expect(r.jomcheck.downloadReportButton).toBeVisible();
    await expect(page.locator("#to-search-new-vehicle")).toBeVisible();
    await expectUntouchedAfterArrival(page, { finalClickIn: /Are you sure you want to proceed with this payment/i });
    await attachOpenDialogs(page);
    if (r.payment?.outcome === "paid") expect(r.payment.result).toMatch(/Report is retrieved successfully/);
    await snap(page, "jomcheck-paid-result");
  });

  // 21.10.2026 (EAINT-12253 CH_TS8): `paid` now makes ONE wait, on the VISIBLE Download Report or a refusal. Before, it
  // raced two waits. In CH_TS8 a locator handler on #to-pay was armed by the CR spec's no-reminder proof, and one of
  // the two racing waits hung in that handler for 120 s with the report on screen (see confirmPayment()). This test
  // proves the Chassis No. route through `paid` under the same condition: a do-nothing locator handler on #to-pay, as
  // the CR spec arms, is registered first (the old code hangs here; the vehicle-number test above has none).
  // PAYS (RM20.00 + 8% = RM21.60). Chassis: JOMCHECK_CHASSIS, else a generated "NNN/ AH-NNNN" (CH_TS8 found
  // 406/ AH-4878 that way on /uat1/).
  test("runs to paid by Chassis No. (FINAL, PAYS RM21.60) with a locator handler armed on Pay Now: result with Download Report, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    const chassisNo = process.env.JOMCHECK_CHASSIS || randomChassisNo();
    await recordUserActions(page);
    await ucdSession(lanePersona());
    let handlerRuns = 0;
    await page.addLocatorHandler(page.locator("#to-pay"), async () => { handlerRuns++; }, { noWaitAfter: true });
    const r = await runJomCheckFlow(page, { chassisNo, stopAfter: "paid", expectedPrice: "20.00", aroundPayment: (f) => withRhbOk("OU", f) });
    test.info().annotations.push({ type: "chassis", description: `${chassisNo}: submit result "${r.result ?? ""}"; #to-pay handler ran ${handlerRuns}x` });
    await page.removeLocatorHandler(page.locator("#to-pay"));
    expect(r.stoppedAfter).toBe("paid");
    expect(r.chassisNo).toBe(chassisNo);
    expect(r.vehicleRegNo).toBeUndefined();
    expect(r.result).toMatch(/number found\. Pay now \(RM20\.00 \+ 8% Service Tax\) to purchase the report\./);
    expect(r.payment?.outcome).toBe("paid");
    expect(page.url()).toMatch(/jomcheck\/transaction\/view\.do\?transactionId=/);
    expect(r.jomcheck.transactionId()).toBe(r.transactionId);
    await expect(page.getByText(/Report is retrieved successfully/i).filter({ visible: true }).first()).toBeVisible();
    await expect(r.jomcheck.downloadReportButton).toBeVisible();
    await expect(page.locator("#to-search-new-vehicle")).toBeVisible();
    await expectUntouchedAfterArrival(page, { finalClickIn: /Are you sure you want to proceed with this payment/i });
    await attachOpenDialogs(page);
    if (r.payment?.outcome === "paid") expect(r.payment.result).toMatch(/Report is retrieved successfully/);
    await snap(page, "jomcheck-paid-result-chassis");
  });
});
