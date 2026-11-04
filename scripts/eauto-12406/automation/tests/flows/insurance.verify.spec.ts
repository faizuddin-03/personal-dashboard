// VERIFY SPEC for src/flows/insurance.flow.ts (free-quote route) — the live run that moves
// the flow from UNVERIFIED to VERIFIED (src/flows/README.md).
//
//   RECORD=1 npx playwright test --project=flows insurance.verify
//
// Every quote creates an insurance transaction in status Quotation (it expires; no charge).
// Free quote: nothing is confirmed or paid; that route has no Make Payment (asserted below).
// Route "estm" (last test): PAYS an eSerahan on staging (OUP vehicle, OU's RHB switched to OK around
// the payment only; VPN + MyKad emulator needed), then stops ON insurance Step 3 Payment and closes
// the PAY NOW confirm with Cancel — the insurance itself is never paid here (probe p09 paid it once).
//
// EAINT-12253 (BA 21.10.2026): the reminder shows on Insurance Step 4 Confirm (eLKM-off and VEL routes)
// and, on the VEL route, again on eSTM Step 6 after "Continue with eSerahan". The last two tests drive
// those FINAL stops and PAY: `paid` on route estm (eSTM + insurance) and `estmCompleted` on route
// estmVel069 (insurance, then the eSTM). They record clicks / keys / closed dialogs (./_final-step.ts)
// and assert nothing was touched after arrival.

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { lanePersona } from "@config/personas";
import { EstmWizardPage } from "@pages/ucd/estm-wizard.page";
import { runInsurancePlanFlow, type InsuranceRoute } from "@flows/insurance.flow";
import { withRhbOk, setEstmCode } from "@fixtures/esim-switch";
import { recordUserActions, expectUntouchedAfterArrival, attachOpenDialogs } from "./_final-step";

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

test.describe.configure({ mode: "serial" });

test.describe("insurance plan flow verify", () => {
  test("stops at quotes: plan wizard on Quotes, insurer cards shown", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runInsurancePlanFlow(page, { stopAfter: "quotes" });
    expect(page.url()).toMatch(/insurance\/plan\/view\.do\?transactionId=/);
    expect(r.steps?.active).toBe("Quotes");
    expect(await r.insurance.planSelectButtons().count()).toBeGreaterThan(0);
    await expect(page.getByText(r.vehicleRegNo, { exact: true }).first()).toBeVisible();
    await snap(page, "insurance-quotes");
  });

  test("stops at optionalCoverage: insurer selected, Optional Coverage active, no Confirm on this route", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runInsurancePlanFlow(page, { stopAfter: "optionalCoverage" });
    expect(page.url()).toMatch(/insurance\/plan\/select\.do\?transactionId=/);
    expect(r.selected).toMatch(/^SELECT /);
    expect(r.steps).toEqual({ steps: ["Quotes", "Optional Coverage"], active: "Optional Coverage" });
    // The finding this flow rests on: the free-quote route cannot go past here.
    expect(r.actions).toEqual({ confirmPlan: false, savePlan: false, back: true });
    await expect(page.getByText("Total Premium").first()).toBeVisible();
    await snap(page, "insurance-optional-coverage");
  });

  // The eSTM-backed routes. Each PAYS an eSerahan first (except estmVel069, diverted before payment),
  // then stops ON insurance Step 3 Payment and closes the PAY NOW confirm with Cancel: the insurance is
  // never paid here (probes p09 / p16 paid each route once, 20.10.2026).
  const ROUTES = {
    estm: {},
    freeQuoteAfterEstm: {},
    estmVel069: { estmCode: { divert: () => setEstmCode("OU", "VEL000069E"), restore: () => setEstmCode("OU", "GLB000000I") } },
  } as const;
  for (const [route, extra] of Object.entries(ROUTES) as [InsuranceRoute, object][]) {
    test(`route ${route} stops at payment, then payConfirm Cancel pays nothing`, { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
      test.setTimeout(20 * 60 * 1000);
      await ucdSession(lanePersona());
      const r = await runInsurancePlanFlow(page, { route, mykad, aroundPayment: (f) => withRhbOk("OU", f), stopAfter: "payment", ...extra });
      expect(page.url()).toMatch(/insurance\/plan\/payment\.do\?transactionId=/);
      expect(r.steps?.steps).toEqual(["Quotes", "Optional Coverage", "Payment", "Confirm"]);
      if (route === "estmVel069") expect(r.estmRoute).toBe("insurance-before-payment");
      if (route === "estm") expect(r.estmRoute).toBe("insurance-after-payment");
      await expect(page.locator("a#to-pay")).toBeVisible();
      await expect(page.locator(".ui-dialog:visible")).toHaveCount(0);
      await snap(page, `insurance-${route}-step3`);

      const text = await r.insurance.openPaymentDialog();
      expect(text).toContain("Are you sure you want to proceed with this payment?");
      await snap(page, `insurance-${route}-pay-confirm`);
      await r.insurance.cancelPaymentDialog();
      expect(page.url()).toMatch(/insurance\/plan\/payment\.do/);
    });
  }

  test("route estm runs to paid (FINAL, PAYS eSTM + insurance): Step 4 Confirm, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    test.setTimeout(20 * 60 * 1000);
    await recordUserActions(page);
    await ucdSession(lanePersona());
    const r = await runInsurancePlanFlow(page, { route: "estm", mykad, aroundPayment: (f) => withRhbOk("OU", f), stopAfter: "paid" });
    expect(r.stoppedAfter).toBe("paid");
    expect(r.estmRoute).toBe("insurance-after-payment");
    expect(page.url()).toMatch(/insurance\/plan\/complete\.do\?transactionId=/);
    await expect(r.insurance.step4Marker.first()).toBeVisible();
    expect(r.confirm?.eCertificateNo).toBeTruthy();
    await expectUntouchedAfterArrival(page, { finalClickIn: /Are you sure you want to proceed with this payment/i });
    await attachOpenDialogs(page);
    await snap(page, "insurance-estm-step4-confirm");
  });

  test("route estmVel069 runs to estmCompleted (FINAL, PAYS insurance + eSTM): eSTM Step 6, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    test.setTimeout(25 * 60 * 1000);
    await recordUserActions(page);
    await ucdSession(lanePersona());
    let step4Dialogs: string[] = [];
    const r = await runInsurancePlanFlow(page, {
      route: "estmVel069",
      mykad,
      ...ROUTES.estmVel069,
      aroundPayment: (f) => withRhbOk("OU", f),
      stopAfter: "estmCompleted",
      // Insurance Step 4 is the FIRST final screen of this route: prove it was left alone too.
      onInsuranceStep4: async (p) => {
        await expect(p.getByText(/Thank you! Your payment has been successfully made/i).first()).toBeVisible();
        await expectUntouchedAfterArrival(p, { finalClickIn: /Are you sure you want to proceed with this payment/i });
        step4Dialogs = await attachOpenDialogs(p);
        await snap(p, "insurance-vel-step4-confirm");
        // In Chrome nothing is up here. In Firefox the reminder would be: closing it is a CR spec's
        // decision (with its evidence), never the flow's, so this verify spec stops if one is open.
        expect(step4Dialogs, "a dialog is open on Insurance Step 4; a verify run does not close it").toEqual([]);
      },
    });
    expect(r.stoppedAfter).toBe("estmCompleted");
    expect(r.estmRoute).toBe("insurance-before-payment");
    expect(r.confirm?.eCertificateNo).toBeTruthy();
    expect(page.url()).toMatch(/estm\/transaction\/estm-sub\.do/);
    // Same "Done" marker as the estm flow (a plain div on /uat1/, 21.10.2026).
    await expect(new EstmWizardPage(page).doneButton).toBeVisible();
    console.log(`estmCompleted reached eSTM Step 6 via: ${r.estmContinuedVia}`);
    await expectUntouchedAfterArrival(page, { finalClickIn: /Sure to (proceed with|make this) payment/i });
    await attachOpenDialogs(page);
    await snap(page, "insurance-vel-estm-step6");
  });
});
