// VERIFY SPEC for src/flows/dereg.flow.ts (AATF: e-Dereg Pre-Checking + Deregistration) — the live
// run that moves the flow from UNVERIFIED to VERIFIED (src/flows/README.md). Browser-neutral.
//
//   RECORD=1 npx playwright test --project=flows dereg.verify
//
// Signs in as the AATF persona (`aatf`: AATF_USERNAME / AATF_PASSWORD). The Dereg tests need the MyKad
// Reader Emulator. DESTRUCTIVE: pre-check `payment` creates a pre-check transaction; the Dereg tests
// PAY a pre-check first (RM10.40 on staging, OU's RHB switched to OK around it; VPN) and create a
// Dereg transaction. Neither Dereg test pays the deregistration: `payConfirm` reads the native
// "Sure to submit this payment to DEREGISTER?" and DISMISSES it.
//
// EAINT-12253 (21.10.2026): the last two tests drive the FINAL stops — pre-check `paid` (Step 3 Result)
// and Dereg `deregistered` (Step 6; PAYS and DEREGISTERS a simulated OUP vehicle). They record clicks /
// keys / closed dialogs (./_final-step.ts) and assert nothing was touched after arrival. The browser's
// own (native) dialogs are not in that log: Playwright dismisses an unhandled one by itself.
//
// EAINT-12253 (21.10.2026 pm, after cr-triage of CH_TS9): the embedded pre-check has TWO tests, one per path — first
// payment OK (the consent pop-up's Next pays; no retry pop-up; stops at Dereg Step 5) and first payment refused with
// RHB IF (retry pop-up, paid there; stops at `vehicle`, no Dereg transaction). Each PAYS one pre-check (RM10.40).

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { runDeregPrecheckFlow, runDeregFlow } from "@flows/dereg.flow";
import { DeregWizardPage } from "@pages/aatf/dereg-wizard.page";
import { withRhbOk, setRhb } from "@fixtures/esim-switch";
import { recordUserActions, expectUntouchedAfterArrival, attachOpenDialogs } from "./_final-step";

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

test.describe.configure({ mode: "serial" });

test.describe("dereg flows verify", () => {
  test("pre-check stops at payment: Step 2, NEXT offered, no dialog", { tag: ["@destructive"] }, async ({ page, login }) => {
    await login.as("aatf");
    const r = await runDeregPrecheckFlow(page, { stopAfter: "payment" });
    expect(page.url()).toMatch(/precheck\/transaction\/payment\.do\?id=/);
    await expect(page.getByText("Click NEXT to pay and retrieve the vehicle eDereg Pre-Checking result.")).toBeVisible();
    await expect(page.locator("#to-payment")).toHaveText(/NEXT/);
    await expect(page.locator(".ui-dialog:visible")).toHaveCount(0);
    expect(r.transactionId).toBeTruthy();
    await snap(page, "precheck-step2");
  });

  test("pre-check stops at payConfirm: confirm open; No pays nothing", { tag: ["@destructive"] }, async ({ page, login }) => {
    await login.as("aatf");
    const r = await runDeregPrecheckFlow(page, { stopAfter: "payConfirm" });
    expect(r.payDialogText).toContain("Are you sure to make payment?");
    expect(r.total).toMatch(/^\d+\.\d{2}$/);
    await snap(page, "precheck-pay-confirm");
    await r.precheck.cancelPaymentDialog();
    expect(page.url()).toMatch(/precheck\/transaction\/payment\.do/);
  });

  test("dereg stops at payment: Step 5, Next offered", { tag: ["@destructive"] }, async ({ page, login, mykad }) => {
    test.setTimeout(20 * 60 * 1000);
    await login.as("aatf");
    const r = await runDeregFlow(page, { mykad, precheck: { aroundPayment: (f) => withRhbOk("OU", f) }, stopAfter: "payment" });
    expect(r.precheck?.note).toMatch(/Able to proceed for eDereg/);
    expect(r.precheckLine).toMatch(/allowed to create eDereg transaction/);
    expect(r.jpj?.status).toBe("OK");
    expect(page.url()).toMatch(/dereg\/transaction\/payment\.do\?id=/);
    await expect(page.getByText("Click NEXT to pay and DEREGISTER.")).toBeVisible();
    await expect(page.locator("input#to-payment")).toBeVisible();
    await snap(page, "dereg-step5");
  });

  test("dereg stops at payConfirm: native confirm read and dismissed, still on Step 5", { tag: ["@destructive"] }, async ({ page, login, mykad }) => {
    test.setTimeout(20 * 60 * 1000);
    await login.as("aatf");
    const r = await runDeregFlow(page, { mykad, precheck: { aroundPayment: (f) => withRhbOk("OU", f) }, stopAfter: "payConfirm" });
    expect(r.payConfirmText).toBe("Sure to submit this payment to DEREGISTER?");
    expect(page.url()).toMatch(/dereg\/transaction\/payment\.do/);
    await snap(page, "dereg-after-dismiss");
  });

  test("pre-check runs to paid (FINAL, PAYS RM10.40): Step 3 Result, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, login }) => {
    await recordUserActions(page);
    await login.as("aatf");
    const r = await runDeregPrecheckFlow(page, { stopAfter: "paid", aroundPayment: (f) => withRhbOk("OU", f) });
    expect(r.stoppedAfter).toBe("paid");
    expect(page.url()).toMatch(/precheck\/transaction\/result\.do\?id=/);
    await expect(r.precheck.resultMarker.first()).toBeVisible();
    expect(r.result?.note).toMatch(/Able to proceed for eDereg/);
    await expectUntouchedAfterArrival(page, { finalClickIn: /Are you sure to make payment/i });
    await attachOpenDialogs(page);
    await snap(page, "precheck-step3-result");
  });

  test("dereg runs to deregistered (FINAL, PAYS + DEREGISTERS): Step 6, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, login, mykad }) => {
    test.setTimeout(20 * 60 * 1000);
    await recordUserActions(page);
    await login.as("aatf");
    const r = await runDeregFlow(page, {
      mykad,
      precheck: { aroundPayment: (f) => withRhbOk("OU", f) },
      aroundPayment: (f) => withRhbOk("OU", f),
      stopAfter: "deregistered",
    });
    expect(r.stoppedAfter).toBe("deregistered");
    expect(r.deregistration?.message).toBe("Sure to submit this payment to DEREGISTER?");
    expect(page.url()).toMatch(/dereg\/transaction\/jpj-sub\.do\?id=/);
    await expect(r.dereg.step6Marker.first()).toBeVisible();
    expect(r.deregistration?.status).toMatch(/OK/);
    // Step 5's confirm is native (not in the log) and Step 6 is a new page: the log must be empty.
    await expectUntouchedAfterArrival(page);
    await attachOpenDialogs(page);
    await snap(page, "dereg-step6");
  });

  // Added 21.10.2026 (EAINT-12253 CH_TS9): the EMBEDDED pre-check on Dereg Step 2 for a vehicle with none
  // (`embeddedPrecheck`). REWRITTEN 21.10.2026 pm after cr-triage (CH_TS9 run 1452-L1): the consent pop-up IS the
  // pre-check's payment screen and its Next pays at once. The runs r3-envretry / r4 passed only because OU's RHB was
  // still IF at the consent Next (first payment refused → retry pop-up → paid there). Two tests now, one per path.

  // SUCCESS path (the normal one): RHB OK around the consent Next → no retry pop-up → result pop-up → Close → Step 5.
  // PAYS the pre-check (RM10.40) and creates a Dereg transaction; stops on Dereg Step 5 without paying the deregistration.
  test("dereg with the embedded pre-check, first payment OK, stops at payment: consent pop-up pays, result pop-up, Close, Step 5", { tag: ["@destructive"] }, async ({ page, login, mykad }) => {
    test.setTimeout(20 * 60 * 1000);
    await login.as("aatf");
    const dereg = new DeregWizardPage(page);
    const seen: string[] = [];
    const attempts: string[] = [];
    let step5 = false;
    const r = await runDeregFlow(page, {
      mykad,
      embeddedPrecheck: {
        aroundPayment: (f, attempt) => { attempts.push(attempt); return withRhbOk("OU", f); },
        onStep: async (at, text) => {
          seen.push(at);
          if (at === "gate") {
            await expect(dereg.embeddedPrecheckConsent).toBeVisible();
            expect(text).toMatch(/Approved eDereg Pre-Checking within 6 months is required to proceed/);
          }
          if (at === "payment") {
            // The consent pop-up, e-mail typed, BEFORE Next: it carries the Payment Summary and the paying Next.
            await expect(dereg.embeddedPrecheckConsent).toBeVisible();
            await expect(dereg.embeddedPrecheckConsent.locator("#dpc-consent-total")).toHaveText(/^\s*10\.40\s*$/);
            expect(text).toMatch(/Click NEXT to pay and retrieve the vehicle pre-checking result/i);
            expect(text).toMatch(/Payment Summary/);
            await expect(dereg.embeddedPrecheckPayment).toHaveCount(0);
          }
          if (at === "result") {
            await expect(dereg.embeddedPrecheckResult).toBeVisible();
            await expect(dereg.embeddedPrecheckPayment).toHaveCount(0); // no retry pop-up on this path
            await expect(dereg.embeddedPrecheckConsent).toHaveCount(0);
            expect(text).toMatch(/SUCCESSFUL|Able to proceed/i);
          }
          if (at === "closed") expect(text).toMatch(/allowed to create eDereg transaction/i);
          await snap(page, `embedded-precheck-${at}`);
        },
      },
      onPayment: async () => { step5 = true; },
      stopAfter: "payment",
    });
    expect(seen).toEqual(["gate", "payment", "result", "closed"]);
    expect(attempts).toEqual(["first"]);
    expect(r.embeddedPrecheck?.paidOn).toBe("first");
    expect(r.embeddedPrecheck?.refusal).toBeUndefined();
    expect(step5).toBe(true);
    expect(r.precheckLine).toMatch(/allowed to create eDereg transaction/);
    expect(page.url()).toMatch(/dereg\/transaction\/payment\.do\?id=/);
    await expect(page.locator("input#to-payment")).toBeVisible();
    await snap(page, "dereg-embedded-step5");
  });

  // REFUSED-then-RETRY path: OU's RHB set to IF for the consent Next (the first payment is refused: the page's alert, then
  // the payment (retry) pop-up), then OK around the retry pop-up's Next. PAYS the pre-check (RM10.40; the refused attempt
  // costs nothing). Stops at `vehicle` (Step 2 filled, Next not pressed): no Dereg transaction is created.
  test("dereg with the embedded pre-check, first payment refused (RHB IF): retry pop-up, paid there, result pop-up, Close", { tag: ["@destructive"] }, async ({ page, login, mykad }) => {
    test.setTimeout(20 * 60 * 1000);
    await login.as("aatf");
    const dereg = new DeregWizardPage(page);
    const seen: string[] = [];
    const attempts: string[] = [];
    const r = await runDeregFlow(page, {
      mykad,
      embeddedPrecheck: {
        aroundPayment: async (f, attempt) => {
          attempts.push(attempt);
          if (attempt === "first") {
            await setRhb("OU", "IF"); // its resting value, set explicitly so the first payment is refused
            return f();
          }
          return withRhbOk("OU", f);
        },
        onStep: async (at, text) => {
          seen.push(at);
          if (at === "retry") {
            await expect(dereg.embeddedPrecheckPayment).toBeVisible();
            await expect(dereg.embeddedPrecheckResult).toHaveCount(0);
            expect(text).toMatch(/10\.40/);
          }
          if (at === "result") {
            await expect(dereg.embeddedPrecheckResult).toBeVisible();
            expect(text).toMatch(/SUCCESSFUL|Able to proceed/i);
          }
          if (at === "closed") expect(text).toMatch(/allowed to create eDereg transaction/i);
          await snap(page, `embedded-retry-${at}`);
        },
      },
      stopAfter: "vehicle",
    });
    expect(seen).toEqual(["gate", "payment", "retry", "result", "closed"]);
    expect(attempts).toEqual(["first", "retry"]);
    expect(r.embeddedPrecheck?.paidOn).toBe("retry");
    expect(r.embeddedPrecheck?.refusal ?? "").toMatch(/TIDAK MENCUKUPI/);
    expect(r.precheckLine).toMatch(/allowed to create eDereg transaction/);
    expect(page.url()).toMatch(/dereg\/transaction\/data-entry\.do/);
    await snap(page, "dereg-embedded-retry-step2");
  });
});
