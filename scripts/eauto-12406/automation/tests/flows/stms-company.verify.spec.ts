// VERIFY SPEC for src/flows/stms-company.flow.ts (STMS with a Company seller) — the live run that moves the flow from
// UNVERIFIED to VERIFIED (src/flows/README.md). Browser-neutral. Written 21.10.2026 for EAINT-12253 CH_TS1 / BEH_TS7.
//
//   RECORD=1 INSTANCE=uat1 npx playwright test --project=flows stms-company.verify
//
// Signs in as the lane's dealer (lanePersona). Needs the MyKad Reader Emulator and the VPN (each test seeds a NEW eSim SSM
// company, rows tagged "Azfar - QA automation", whose director is the representative card). DESTRUCTIVE: every test
// creates an STMS transaction (Step 1 → 2); `transfer` PAYS RM37.00 on a new ON vehicle (QA-owned, RHB OK).
// `buySsm` (21.10.2026, Azfar): ticks BOTH of AZFARAZO's BO "Purchase SSM Document" boxes (STMS + ESTM Company
// Category) as `bo`, runs to Step 6 buying the SSM Document (PAYS the SSM fee + RM37.00), and puts the boxes back in a
// finally. Lane 1 (or 3 / 4) only. The other tests leave the boxes as they are (unticked: no SSM purchase asked).

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { lanePersona } from "@config/personas";
import { runStmsCompanyFlow } from "@flows/stms-company.flow";
import { EsimClient } from "@fixtures/esim";
import { seedStmsCompanySeller } from "@data/ssm-seed";
import { CARDS, laneCard } from "@data/cards";
import { LoginPage } from "@auth/login";
import {
  BoCompanyAccountsPage, AZFARAZO_ROC, SSM_PURCHASE_ON, describeSsmBoxes, ssmBoxesEqual, type SsmBoxes,
} from "@pages/bo/company-accounts.page";
import { recordUserActions, expectUntouchedAfterArrival, attachOpenDialogs } from "./_final-step";

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

async function newCompany() {
  const sim = new EsimClient();
  await sim.connect();
  try {
    // Always a NEW company (21.10.2026): never QA456528 / 202600456528, whose bought, mismatching SSM Document is stored
    // until 27.10.2026 (SPENT_SSM_KEYS in @data/ssm-seed); page1 now names this company (rocPage1For).
    const c = await seedStmsCompanySeller(sim, CARDS.emulatorDefault); // = the flow's default representative
    test.info().annotations.push({ type: "ssm-company", description: `${c.companyName} / ${c.newRoc}` });
    return { name: c.companyName, regNo: c.newRoc };
  } finally {
    await sim.close();
  }
}

const buyer = () => laneCard();

test.describe.configure({ mode: "serial" });

test.describe("stms company flow verify", () => {
  test("stops at vehicle: Company seller verified, Step 2 filled, document boxes filled", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    test.setTimeout(15 * 60 * 1000);
    const company = await newCompany();
    await ucdSession(lanePersona());
    const r = await runStmsCompanyFlow(page, { mykad, company, buyer: buyer(), stopAfter: "vehicle" });
    expect(page.url()).toMatch(/stms\/transaction\/data-entry\.do/);
    expect(r.documentBoxes).toBeGreaterThan(0);
    await expect(page.locator("#to-continue-company")).toBeVisible();
    await expect(page.locator("#companyName")).toHaveValue(company.name);
    await snap(page, "company-step2");
  });

  test("stops at jpjEnquiry: Step 4 result on screen; records whether the SSM purchase is asked", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    test.setTimeout(20 * 60 * 1000);
    const company = await newCompany();
    await ucdSession(lanePersona());
    const r = await runStmsCompanyFlow(page, { mykad, company, buyer: buyer(), stopAfter: "jpjEnquiry" });
    expect(r.jpj?.status).toMatch(/OK/);
    test.info().annotations.push({ type: "ssm-purchase-asked", description: String(r.ssmPurchaseAsked) });
    if (!r.ssmPurchaseAsked) await expect(page.locator("#to-payment")).toBeVisible();
    await snap(page, "company-step4");
    // Leave it Pending for nothing to pay: Save & Continue Later (the base wizard method, seen on STMS Step 4 20.10).
    await r.stms.saveAndContinueLater();
    expect(page.url()).toMatch(/stms\/enquiry\/main\.do/);
  });

  test("runs to transfer (FINAL, PAYS RM37.00): Step 6 OK, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    test.setTimeout(25 * 60 * 1000);
    const company = await newCompany();
    await recordUserActions(page);
    await ucdSession(lanePersona());
    const r = await runStmsCompanyFlow(page, { mykad, company, buyer: buyer(), stopAfter: "transfer" });
    expect(r.stoppedAfter).toBe("transfer");
    expect(page.url()).toMatch(/stms\/transaction\/jpj-sub\.do\?id=/);
    expect((await r.stms.transferResult()).status).toMatch(/OK - SUCCESSFUL/);
    await expectUntouchedAfterArrival(page, { finalClickIn: /Sure to submit this payment/i });
    await attachOpenDialogs(page);
    await snap(page, "company-step6");
  });
});

test.describe("stms company flow verify: SSM Document purchase", () => {
  // Azfar 21.10.2026 (knowledge/_core/stms.md): Step 4 offers [Purchase SSM] only when BOTH "Purchase SSM Document" boxes
  // of the DEALER company are ticked in BO before the transaction starts: STMS - Company Category (`ssmPermission`) AND
  // ESTM - Company Category (`estmSsmPermission`); ticking only the first never offered it (/preprod1/ 29.09). Azfar OK'd
  // ticking them on AZFARAZO (lanes 1, 3, 4) for these runs; the test signs in to BO as `bo` (jasons) on this tab, ticks
  // both, runs the STMS, and puts them back as they were in a finally: while ticked, every company-seller STMS of
  // AZFARAZO asks only for the Board Resolution at Step 2 (the flow fills the VISIBLE document boxes only).
  // PAYS the SSM fee (RM19.44 on staging) and RM37.00 (Step 5 → Step 6, ON vehicle).
  test("buySsm (PAYS the SSM fee + RM37.00): both Purchase SSM Document boxes ticked, Step 4 asks, the purchase goes through, Step 6 OK", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    test.setTimeout(30 * 60 * 1000);
    test.skip(process.env.LANE === "2", "the boxes are ticked on AZFARAZO, the company of lanes 1, 3 and 4; lane 2's dealer is another company");
    const roc = AZFARAZO_ROC;
    const bo = new BoCompanyAccountsPage(page);
    const asBo = async () => {
      await page.context().clearCookies();
      await new LoginPage(page).as("bo");
    };
    let before: SsmBoxes | undefined;
    await asBo();
    try {
      const set = await bo.setMany(roc, SSM_PURCHASE_ON, { onBefore: (b) => { before = b; } });
      test.info().annotations.push({ type: "bo-ssm-set-up", description: `${roc}: ${describeSsmBoxes(set.before)} -> ${describeSsmBoxes(set.after)}${set.saved ? " (saved)" : " (already so)"}` });
      await snap(page, "bo-ssm-purchase-ticked");

      const company = await newCompany();
      await recordUserActions(page);
      await page.context().clearCookies();
      await ucdSession(lanePersona());
      const r = await runStmsCompanyFlow(page, { mykad, company, buyer: buyer(), buySsm: true, stopAfter: "transfer" });
      test.info().annotations.push({ type: "step2-document-boxes", description: `${r.documentBoxes} visible document box(es) filled (Board Resolution only expected with the boxes ticked)` });
      test.info().annotations.push({ type: "ssm-dialogs", description: (r.ssmDialogs ?? []).join(" || ") || "(none)" });
      test.info().annotations.push({ type: "ssm-total", description: `SSM Total Amount Payable read from the Payment Summary pop-up: RM ${r.ssmTotal ?? "(not read)"}` });
      // Step 2 accepted with the boxes ticked: the flow reached Step 3 (continueFromCompanyDetails throws on a refusal).
      expect(r.documentBoxes ?? 0, "Step 2: at least the Board Resolution box was visible and filled").toBeGreaterThan(0);
      // Step 4: asked, and bought (the flow throws when Step 4 still asks for it after the pop-ups).
      expect(r.ssmPurchaseAsked, "Step 4 asked for the SSM Document purchase with both boxes ticked").toBe(true);
      // Seen 21.10.2026 (r2 trace): two pop-ups, company details [Next] then Payment Summary [Make Payment]; then Step 4 reloads,
      // with the server's "SSM Document Verification" pop-up (r4 trace: the failed one; the LKM board says a successful one
      // is shown on a match, so purchaseSsm presses its OK and keeps its text as a third entry). A failed one throws
      // SsmDocumentMismatchError before this line.
      const ssmDialogs = r.ssmDialogs ?? [];
      expect([2, 3], `the SSM purchase pop-ups were answered (company details, Payment Summary[, Verification successful]): ${ssmDialogs.join(" || ")}`).toContain(ssmDialogs.length);
      expect(ssmDialogs[0] ?? "", "pop-up 1 = the seller company details").toMatch(/Please reconfirm the Seller Company Name/i);
      expect(ssmDialogs[1] ?? "", "pop-up 2 = the Payment Summary").toMatch(/Total Amount Payable/i);
      if (ssmDialogs.length === 3) expect(ssmDialogs[2], "pop-up 3 = SSM Document Verification, successful").toMatch(/SSM Document Verification[\s\S]*Verification successful/i);
      test.info().annotations.push({ type: "ssm-verification-popup", description: ssmDialogs[2] ?? "(no SSM Document Verification pop-up after the purchase)" });
      expect(r.ssmTotal ?? "", "the SSM Total Amount Payable was read from the Payment Summary pop-up").toMatch(/^\d+\.\d{2}$/);
      // Step 5 paid, Step 6 reached and untouched.
      expect(r.stoppedAfter).toBe("transfer");
      expect(page.url()).toMatch(/stms\/transaction\/jpj-sub\.do\?id=/);
      expect((await r.stms.transferResult()).status).toMatch(/OK - SUCCESSFUL/);
      await expectUntouchedAfterArrival(page, { finalClickIn: /Sure to submit this payment/i });
      await attachOpenDialogs(page);
      await snap(page, "company-step6-after-ssm");
    } finally {
      const back = before;
      if (back && !ssmBoxesEqual(back, SSM_PURCHASE_ON)) {
        await asBo();
        const r = await bo.setMany(roc, back);
        test.info().annotations.push({ type: "bo-ssm-put-back", description: `${roc}: ${describeSsmBoxes(r.before)} -> ${describeSsmBoxes(r.after)}` });
        await snap(page, "bo-ssm-purchase-put-back");
      }
    }
  });
});
