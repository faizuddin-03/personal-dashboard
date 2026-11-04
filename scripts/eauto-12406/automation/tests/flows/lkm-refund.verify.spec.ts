// VERIFY SPEC for src/flows/lkm-refund.flow.ts — the live run that moves the flow from
// UNVERIFIED to VERIFIED (src/flows/README.md). DESTRUCTIVE: every stop creates a real STMS
// transaction up to Step 5; the last one pays it (RM91.00 on the OW prefix).
//
//   node scripts/broker-run.mjs single all tests/flows/lkm-refund.verify.spec.ts --project=flows
//   (or: INSTANCE=uat1 TEST_ENV=staging LANE=1 npx playwright test --project=flows lkm-refund.verify)
//
// Documents (22.10.2026, EAINT-12253 BEH_TS8): the real AI check at [Next] reads them, so they must be real and match
// the seller card (CARDS.malaysianIndividual, 020406081081) and the bank details typed. `lkmRefundDocs()`
// (src/data/lkm-refund-docs.ts) gives the QA set on Azfar's PC (Copy of IC = IC test\ic_020406081081.pdf, statement =
// bimb statement header2.jpg, BANK ISLAM MALAYSIA BERHAD 08013024351249); override with LKM_COPY_OF_IC,
// LKM_BANK_STATEMENT, LKM_BANK, LKM_ACCOUNT_NO. The stops from `preview` on are skipped when the files are not on this PC.
//
// Staging /uat1/ (22.10.2026): signs in as the run's lane (`lanePersona()`, was the named Azfar1) and gives Step 3 the
// lane user's own card (`laneCard()`), as the other verify specs do. A sub user may lack the LKM Refund permission
// ("Your account don't have LKM Refund permission"): run it on a MAIN user's lane (1, 2, 5-9). Region: the flow's
// Phase 1 note says KL / Selangor dealers, but AZFARAZO (BO mailing State JOHOR) WAS offered LKM Refund on /preprod1/
// 07.10.2026 (knowledge/portals/ucd/how-we-test.md); whether /uat1/ offers it is what the `addOn` stop shows first.
//
// EAINT-12253 (21.10.2026): `paid` is the FINAL stop (STMS Step 6, "JPJ Transfer Status"). It records
// clicks / keys / closed dialogs (./_final-step.ts) and asserts nothing was touched after arrival.

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { lanePersona } from "@config/personas";
import { laneCard } from "@data/cards";
import { lkmRefundDocs } from "@data/lkm-refund-docs";
import { runLkmRefundFlow, closeLkmRefundFlow } from "@flows/lkm-refund.flow";
import { recordUserActions, expectUntouchedAfterArrival, attachOpenDialogs } from "./_final-step";

test.describe.configure({ mode: "serial" });

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

const docs = lkmRefundDocs();
const refund = { bank: docs.bank, accountNo: docs.accountNo, copyOfIc: docs.copyOfIc, bankStatement: docs.bankStatement, consent: true };

function needFiles() {
  test.skip(docs.missing.length > 0, `LKM Refund documents not on this PC: ${docs.missing.join(", ")} (set LKM_COPY_OF_IC / LKM_BANK_STATEMENT)`);
  test.info().annotations.push({ type: "lkm-documents", description: `${docs.copyOfIc.split(/[\\/]/).pop()} + ${docs.bankStatement.split(/[\\/]/).pop()}, ${docs.bank} ${docs.accountNo}${docs.fromEnv.length ? ` (from env: ${docs.fromEnv.join(", ")})` : " (defaults)"}` });
}

test.describe("lkm refund flow verify", () => {
  test.setTimeout(20 * 60 * 1000);

  test("stops at addOn: Step 5 offers LKM Refund, unticked", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession(lanePersona());
    const r = await runLkmRefundFlow(page, { mykad, buyer: laneCard(), stopAfter: "addOn" });
    try {
      expect(page.url()).toMatch(/payment\.do/);
      await expect(r.lkm.checkbox).toBeVisible();
      await expect(r.lkm.checkbox).not.toBeChecked();
      await snap(page, "addOn");
    } finally {
      await closeLkmRefundFlow(r);
    }
  });

  test("stops at popup: refund pop-up open, Seller's Name and consent text shown", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession(lanePersona());
    const r = await runLkmRefundFlow(page, { mykad, buyer: laneCard(), stopAfter: "popup" });
    try {
      expect(await r.lkm.isPopupOpen()).toBe(true);
      await expect(r.lkm.bankStatement).toBeAttached();
      await expect(r.lkm.dialog).toContainText(r.vehicleRegNo); // consent names the vehicle
      await snap(page, "popup");
    } finally {
      await closeLkmRefundFlow(r);
    }
  });

  test("stops at preview: AI check passed, pad and documents shown", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    needFiles();
    await ucdSession(lanePersona());
    const r = await runLkmRefundFlow(page, { mykad, buyer: laneCard(), refund, stopAfter: "preview" });
    try {
      await expect(r.lkm.signaturePad).toBeVisible();
      expect(await r.lkm.previewPageCount()).toBeGreaterThan(0);
      await snap(page, `preview-after-${r.aiAttempts}-attempt(s)`);
    } finally {
      await closeLkmRefundFlow(r);
    }
  });

  test("stops at confirmed: refund committed, fee charged", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    needFiles();
    await ucdSession(lanePersona());
    const r = await runLkmRefundFlow(page, { mykad, buyer: laneCard(), refund, stopAfter: "confirmed" });
    try {
      await expect(r.lkm.checkbox).toBeChecked();
      expect(r.fee).toMatch(/^\d+\.\d{2}$/);
      expect(r.fee).not.toBe("0.00");
      await snap(page, `confirmed-fee-${r.fee}`);
    } finally {
      await closeLkmRefundFlow(r);
    }
  });

  test("stops at paid (FINAL): STMS transferred, on Step 6, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    needFiles();
    await recordUserActions(page);
    await ucdSession(lanePersona());
    const r = await runLkmRefundFlow(page, { mykad, buyer: laneCard(), refund, stopAfter: "paid" });
    try {
      expect(r.payment?.outcome).toBe("transferred");
      expect(page.url()).toMatch(/jpj-sub\.do/);
      await expect(page.getByText(/JPJ Transfer Status/i).first()).toBeVisible();
      await expectUntouchedAfterArrival(page, { finalClickIn: /Sure to submit this payment/i });
      await attachOpenDialogs(page);
      await snap(page, "paid");
    } finally {
      await closeLkmRefundFlow(r);
    }
  });
});
