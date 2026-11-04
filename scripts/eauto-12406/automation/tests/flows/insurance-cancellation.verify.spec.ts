// VERIFY SPEC for src/flows/insurance-cancellation.flow.ts — the live run that moves the flow
// from UNVERIFIED to VERIFIED (src/flows/README.md). DESTRUCTIVE: every stop creates a real
// STMS transaction up to Step 5; the last one pays it.
//
// Each test asserts on the screen the stop CLAIMS to be sitting on, not merely that nothing threw.
//
//   INSTANCE=preprod1 TEST_ENV=preprod1 IC_FILES=<folder with copy-of-ic.png + bank-statement.pdf> \
//     npx playwright test --project=flows insurance-cancellation.verify
//
// Needs the eSim records behind prefix ON (Runnerku Eligibility Resp: eligible, Allianz, 0.71;
// SimAI Identity + SimAI Bank matching the default bank details). Insurance Cancellation is on
// /preprod1 only until it ships.

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { runInsuranceCancellationFlow, closeInsuranceCancellationFlow } from "@flows/insurance-cancellation.flow";

test.describe.configure({ mode: "serial" });

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

test.describe("insurance cancellation flow verify", () => {
  test.setTimeout(15 * 60 * 1000);

  test("stops at addOn: Step 5 offers the add-on, unticked", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runInsuranceCancellationFlow(page, { mykad, stopAfter: "addOn" });
    try {
      expect(r.stoppedAfter).toBe("addOn");
      expect(page.url()).toMatch(/payment\.do/);
      await expect(r.ic.checkbox).toBeVisible();
      await expect(r.ic.checkbox).not.toBeChecked();
      expect(await r.ic.insurerName()).toContain("Insurance Company:");
      await snap(page, "addOn");
    } finally {
      await closeInsuranceCancellationFlow(r);
    }
  });

  test("stops at popup: details pop-up open, Seller's Name from Step 1", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runInsuranceCancellationFlow(page, { mykad, stopAfter: "popup" });
    try {
      expect(await r.ic.isFormOpen()).toBe(true);
      await expect(r.ic.sellerName).toHaveValue(r.sellerName);
      await expect(r.ic.accountNo).toHaveValue("");
      await snap(page, "popup");
    } finally {
      await closeInsuranceCancellationFlow(r);
    }
  });

  test("stops at preview: AI check passed, preview open with the signature pad", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runInsuranceCancellationFlow(page, { mykad, stopAfter: "preview" });
    try {
      expect(await r.ic.isPreviewOpen()).toBe(true);
      await expect(r.ic.signaturePad).toBeVisible();
      expect(await r.ic.previewPageCount()).toBeGreaterThan(0);
      await snap(page, "preview");
    } finally {
      await closeInsuranceCancellationFlow(r);
    }
  });

  test("stops at selected: add-on ticked, fee in the summary, Reconfirm link", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runInsuranceCancellationFlow(page, { mykad, stopAfter: "selected" });
    try {
      expect(await r.ic.isPreviewOpen()).toBe(false);
      await expect(r.ic.checkbox).toBeChecked();
      await expect(r.ic.reconfirmLink).toBeVisible();
      expect(await r.ic.paymentSummaryText()).toMatch(/Insurance Cancellation RM(?!0\.00)\d+\.\d{2}/);
      await snap(page, `selected-with-${r.confirmedWith}`);
    } finally {
      await closeInsuranceCancellationFlow(r);
    }
  });

  test("stops at paid: STMS transferred with Insurance Cancellation Details on Step 6", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runInsuranceCancellationFlow(page, { mykad, stopAfter: "paid" });
    try {
      expect(r.payment?.outcome).toBe("transferred");
      await expect(page.locator("body")).toContainText("Insurance Cancellation Details");
      await snap(page, "paid");
    } finally {
      await closeInsuranceCancellationFlow(r);
    }
  });
});
