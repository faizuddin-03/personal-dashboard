// VERIFY SPEC for src/flows/bmk.flow.ts — the live run that moves the flow from UNVERIFIED to
// VERIFIED (src/flows/README.md). Browser-neutral: runs under the `flows` (Chrome) and
// `flows-firefox` projects alike (a current Firefox takes the page's WebSocket reader path).
//
//   RECORD=1 npx playwright test --project=flows bmk.verify
//
// Needs the MyKad Reader Emulator on ws://localhost:7878 (DermalogMyBioIDService stopped).
// DESTRUCTIVE: from `owner` on it creates a BMK transaction (vehicle OUP…). Nothing is paid
// here — `payConfirm` closes the dialog with No. Paying is proven by probe p08 (20.10.2026).
//
// EAINT-12253 (21.10.2026): the last test drives the FINAL stop `paid` and PAYS (RM30.80 on staging,
// OU's RHB switched to OK around the payment only; VPN). It records clicks / keys / closed dialogs
// (./_final-step.ts) and asserts that on Step 6 Purchase nothing was touched after arrival.

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { lanePersona } from "@config/personas";
import { runBmkFlow } from "@flows/bmk.flow";
import { CARDS } from "@data/cards";
import { withRhbOk } from "@fixtures/esim-switch";
import { recordUserActions, expectUntouchedAfterArrival, attachOpenDialogs } from "./_final-step";

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

test.describe.configure({ mode: "serial" });

test.describe("bmk flow verify", () => {
  test("stops at category: Step 1 Ownership Authentication, nothing typed", async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runBmkFlow(page, { stopAfter: "category" });
    expect(r.categoryDialog).toContain("MyKad - MALAYSIAN");
    expect(page.url()).toMatch(/bmk\/transaction\/auth-owner\.do\?category=1/);
    await expect(page.getByText("PERAKUAN BMK - PEMILIK KENDERAAN")).toBeVisible();
    await expect(page.locator("#owner-consent")).not.toBeChecked();
    await snap(page, "bmk-step1");
  });

  test("stops at owner: owner MyKad read, Next visible, not pressed", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession(lanePersona());
    const r = await runBmkFlow(page, { stopAfter: "owner", mykad });
    expect(page.url()).toMatch(/bmk\/transaction\/auth-owner\.do/);
    await expect(page.locator("#continueButton")).toBeVisible();
    expect(await page.inputValue("#myKadNo")).toBe(CARDS.malaysianIndividual.NRIC);
    expect(await page.inputValue("#readonlyVehicleRegNo")).toBe(r.vehicleRegNo);
    await snap(page, "bmk-step1-owner-read");
  });

  test("stops at payment: Step 5, Next offered, no dialog open", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession(lanePersona());
    const r = await runBmkFlow(page, { stopAfter: "payment", mykad });
    expect(page.url()).toMatch(/bmk\/transaction\/payment\.do\?id=/);
    expect(r.jpj?.status).toBe("OK");
    await expect(page.getByText("Click Next to pay.")).toBeVisible();
    await expect(page.locator("div#to-payment")).toHaveText(/Next/);
    expect(await r.bmk.totalPayable()).toMatch(/^\d+\.\d{2}$/);
    await snap(page, "bmk-step5");
  });

  test("stops at payConfirm: 'Sure to submit this payment?' open; No pays nothing", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession(lanePersona());
    const r = await runBmkFlow(page, { stopAfter: "payConfirm", mykad });
    await expect(r.bmk.paymentDialog).toBeVisible();
    expect(r.payDialogText).toContain("Sure to submit this payment?");
    await snap(page, "bmk-pay-confirm");
    await r.bmk.cancelPaymentDialog();
    expect(page.url()).toMatch(/bmk\/transaction\/payment\.do/);
    await expect(page.locator("div#to-payment")).toBeVisible();
  });

  test("runs to paid (FINAL, PAYS): Step 6 Purchase, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    test.setTimeout(10 * 60 * 1000);
    await recordUserActions(page);
    await ucdSession(lanePersona());
    // The RHB switch wraps the whole run: the flow presses Yes inside it and returns on arrival.
    const r = await withRhbOk("OU", () => runBmkFlow(page, { stopAfter: "paid", expectedTotal: "30.80", mykad }));
    expect(r.payment?.outcome).toBe("paid");
    expect(page.url()).toMatch(/bmk\/transaction\/jpj-sub\.do\?id=/);
    await expect(r.bmk.step6Marker.first()).toBeVisible();
    await expectUntouchedAfterArrival(page, { finalClickIn: /Sure to submit this payment/i });
    await attachOpenDialogs(page);
    expect((await r.bmk.purchaseResult()).status).toMatch(/SUCCESSFUL/i);
    await snap(page, "bmk-step6-purchase");
  });
});
