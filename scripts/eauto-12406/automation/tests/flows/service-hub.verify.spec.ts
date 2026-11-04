// VERIFY SPEC for src/flows/service-hub.flow.ts — the live run that moves the flow from
// UNVERIFIED to VERIFIED (src/flows/README.md). Each test asserts on the screen the stop
// CLAIMS to be sitting on, and attaches a screenshot for review.
//
//   RECORD=1 npx playwright test --project=flows service-hub.verify
//
// The payment / payConfirm tests pay nothing (dialogs closed with Back); the two `appointment`
// tests at the end PAY (see there). The Biometric `payment`
// and `payConfirm` stops press Selection → Next, which CREATES an unpaid purchase request on
// the lane's company (tagged @destructive).
//
// EAINT-12253 (21.10.2026): the last two tests drive the FINAL stop `submitted` (Submission,
// "Request Submitted") and PAY + BOOK a staging slot (shared with other testers). They record
// clicks / keys / closed dialogs (./_final-step.ts) and assert nothing was touched after arrival.

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { lanePersona } from "@config/personas";
import { runSoftwareInstallationFlow, runBiometricPurchaseFlow } from "@flows/service-hub.flow";
import { recordUserActions, expectUntouchedAfterArrival, attachOpenDialogs } from "./_final-step";

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

test.describe.configure({ mode: "serial" });

test.describe("service hub flow verify", () => {
  test("software installation stops at payment: Step 1 Payment, total shown, nothing paid", async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runSoftwareInstallationFlow(page, { stopAfter: "payment" });
    expect(page.url()).toMatch(/service-hub\/installation\.do/);
    expect(r.flowSteps.steps).toEqual(["1 Payment", "2 Appointment", "3 Submission"]);
    expect(r.flowSteps.active).toBe("1 Payment");
    expect(r.total).toMatch(/^\d+\.\d{2}$/);
    await expect(page.locator("#si-pay-btn")).toBeEnabled();
    await snap(page, "si-payment");
  });

  test("software installation stops at payConfirm: dialog open; Back pays nothing", async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runSoftwareInstallationFlow(page, { stopAfter: "payConfirm" });
    await expect(r.hub.paymentDialog).toBeVisible();
    expect(r.payDialogText).toContain("Sure to proceed with payment?");
    await expect(r.hub.paymentDialog.locator("button.confirm-dialog-btn")).toHaveText("Next");
    await snap(page, "si-pay-confirm");
    await r.hub.cancelPaymentDialog();
    expect(page.url()).toMatch(/service-hub\/installation\.do$/);
    await expect(page.locator("#si-pay-btn")).toBeEnabled();
    await snap(page, "si-after-back");
  });

  test("biometric purchase stops at selection: Step 1 Selection filled, Next not pressed", async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runBiometricPurchaseFlow(page, { stopAfter: "selection" });
    expect(page.url()).toMatch(/service-hub\/purchase\.do/);
    expect(r.flowSteps.active).toBe("1 Selection");
    await expect(page.locator("#contactNo")).toHaveValue(/^0\d{8,10}$/);
    await snap(page, "bio-selection");
  });

  test("biometric purchase stops at payConfirm: Step 2 Payment, dialog open; Back pays nothing", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runBiometricPurchaseFlow(page, { stopAfter: "payConfirm" });
    expect(page.url()).toMatch(/service-hub\/purchase\/create\.do/);
    expect(r.flowSteps.steps).toEqual(["1 Selection", "2 Payment", "3 Appointment", "4 Submission"]);
    expect(r.flowSteps.active).toBe("2 Payment");
    expect(r.total).toMatch(/^\d{1,3}(,\d{3})*\.\d{2}$/);
    await expect(r.hub.paymentDialog).toBeVisible();
    expect(r.payDialogText).toContain("Sure to proceed with payment?");
    await snap(page, "bio-pay-confirm");
    await r.hub.cancelPaymentDialog();
    await expect(page.locator("#si-pay-btn")).toBeEnabled();
    await snap(page, "bio-after-back");
  });

  // These two PAY on staging (SI RM54.00, BDP RM850.00 on 20.10.2026; Azfar OK'd staging payments)
  // and stop ON the Appointment calendar without booking anything.
  for (const svc of ["software installation", "biometric purchase"] as const) {
    test(`${svc} stops at appointment (PAYS): calendar, nothing booked, Confirm Appointment offered`, { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
      await ucdSession(lanePersona());
      const r = svc === "software installation"
        ? await runSoftwareInstallationFlow(page, { stopAfter: "appointment" })
        : await runBiometricPurchaseFlow(page, { stopAfter: "appointment" });
      expect(page.url()).toMatch(/service-hub\/installation\/slot\.do\?id=/);
      expect(r.requestId).toBeTruthy();
      await expect(page.getByText("Schedule an Appointment")).toBeVisible();
      expect(await r.hub.bookedCount()).toEqual({ booked: 0, of: 1 });
      await expect(page.locator("#si-confirm-booking")).toBeVisible();
      await expect(page.locator(".ui-dialog:visible")).toHaveCount(0);
      expect((await r.hub.flowSteps()).active).toMatch(/Appointment/);
      await snap(page, `${svc.replace(" ", "-")}-appointment`);
    });
  }

  // FINAL stop. PAYS, holds the first free slot and SUBMITS the appointment (Confirm Appointment).
  for (const svc of ["software installation", "biometric purchase"] as const) {
    test(`${svc} runs to submitted (FINAL, PAYS + BOOKS): Request Submitted, nothing touched after arrival`, { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
      await recordUserActions(page);
      await ucdSession(lanePersona());
      const r = svc === "software installation"
        ? await runSoftwareInstallationFlow(page, { stopAfter: "submitted" })
        : await runBiometricPurchaseFlow(page, { stopAfter: "submitted" });
      expect(r.stoppedAfter).toBe("submitted");
      expect(page.url()).toMatch(/service-hub\/installation\/submitted\.do\?id=/);
      await expect(r.hub.submittedMarker.first()).toBeVisible();
      expect(r.appointmentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.flowSteps.active).toMatch(/Submission/);
      // Confirm Appointment submits with NO dialog; nothing may follow it on the Submission screen.
      await expectUntouchedAfterArrival(page, { finalClickIn: /si-confirm-booking/ });
      await attachOpenDialogs(page);
      await snap(page, `${svc.replace(" ", "-")}-submitted`);
    });
  }

  // ── Biometric WITHOUT installation (added 21.10.2026, probe cr/EAINT-12253/03-spec/probes-2110/p01) ──
  // Pays nothing; creates an unpaid purchase request (Selection → Next).
  test("biometric purchase WITHOUT installation stops at payConfirm: opt-out shown, device-only total; Back pays nothing", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runBiometricPurchaseFlow(page, { withInstallation: false, stopAfter: "payConfirm" });
    expect(page.url()).toMatch(/service-hub\/purchase\/create\.do/);
    expect(r.flowSteps.active).toBe("2 Payment");
    await expect(r.hub.installOptOutCheckbox).toBeChecked();
    await expect(page.getByText("No installation appointment will be scheduled.")).toBeVisible();
    await expect(page.locator("#bio-si-line")).toBeHidden();
    await expect(page.locator("#bio-tax-amt")).toHaveText("0.00");
    await expect(r.hub.paymentDialog).toBeVisible();
    expect(r.payDialogText).toContain("Sure to proceed with payment?");
    await snap(page, "bio-no-install-pay-confirm");
    await r.hub.cancelPaymentDialog();
    await expect(page.locator("#si-pay-btn")).toBeEnabled();
  });

  // FINAL stop WITHOUT installation. PAYS (RM850.00 on staging 21.10.2026), no booking. First paid run
  // CONFIRMS what the page script says (PAID:SUB → installation/submitted.do, no Appointment) and the
  // device-only Submission's marker; until then this test is the open question, not a regression check.
  test("biometric purchase WITHOUT installation runs to submitted (FINAL, PAYS): Submission, no Appointment, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    await recordUserActions(page);
    await ucdSession(lanePersona());
    const r = await runBiometricPurchaseFlow(page, { withInstallation: false, stopAfter: "submitted" });
    expect(r.stoppedAfter).toBe("submitted");
    expect(page.url()).toMatch(/service-hub\/installation\/submitted\.do\?id=/);
    expect(r.requestId).toBeTruthy();
    await expect(r.hub.submittedMarker.first()).toBeVisible();
    expect(r.appointmentDate).toBeUndefined();
    await expectUntouchedAfterArrival(page, { finalClickIn: /Sure to proceed with payment/i });
    await attachOpenDialogs(page);
    await test.info().attach("bio-no-install-submitted.txt", { body: await page.locator("body").innerText(), contentType: "text/plain" });
    await snap(page, "bio-no-install-submitted");
  });
});
