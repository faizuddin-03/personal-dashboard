// VERIFY SPEC for src/flows/ucd2ucd.flow.ts — the live run that moves the flow
// from UNVERIFIED to VERIFIED (src/flows/README.md). DESTRUCTIVE: creates real
// staging transactions and pays them.
//
// Each test asserts on the screen the stop CLAIMS to be sitting on, not merely
// that nothing threw. Evidence is attached to the report for review.
//
//   npx playwright test --project=flows ucd2ucd.verify
//
// Needs both dealers: ucdE2E (UCD A / Standard buyer) and ucdE2E2 (Interstate buyer).
// The Interstate seller must already HOLD its vehicle, so that test first buys
// one with runStmsFlow, exactly as the 25.09 walk did.
//
// EAINT-12253 (21.10.2026): both `transfer` tests are the FINAL stops. Each records the page's
// clicks / keys / closed dialogs (./_final-step.ts) and asserts that on Step 6 (jpj-sub.do,
// "JPJ Transfer Status") the flow touched nothing after arrival.

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { LoginPage } from "@auth/login";
import { baseURL, instance } from "@config/environments";
import { lanePersona, partnerPersona } from "@config/personas";
import { ownLane, partnerLane } from "@config/lane-roster";
import { laneCard } from "@data/cards";
import { StmsWizardPage } from "@pages/ucd/stms-wizard.page";
import { INTERSTATE_LISTING } from "@pages/ucd/ucd-to-ucd.page";
import { runStmsFlow } from "@flows/stms.flow";
import { runUcdToUcdStandard, runInterstateSeller, runInterstateBuyer } from "@flows/ucd2ucd.flow";
import { recordUserActions, expectUntouchedAfterArrival, attachOpenDialogs } from "./_final-step";

test.describe.configure({ mode: "serial" });

async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

// The listing tables are nested, so a plain "table tr" matches the outer row too.
const listingRow = (page: Page, vehicle: string) => page.locator("table tr", { hasText: vehicle }).last();

const body = (page: Page) => page.locator("body").innerText().then((t) => t.replace(/\s+/g, " "));

test.describe("ucd2ucd flow verify", () => {
  test("Standard stops at seller: Step 1 verified, consent ticked", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runUcdToUcdStandard(page, { mykad, stopAfter: "seller" });
    expect(r.stoppedAfter).toBe("seller");
    expect(page.url()).toMatch(/companyCategory=UTU/);
    await expect(page.locator("#seller-consent")).toBeChecked();
    await snap(page, "standard-seller");
  });

  test("Standard stops at vehicle: seller company and vehicle typed on Step 2", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    const r = await runUcdToUcdStandard(page, { mykad, stopAfter: "vehicle" });
    await expect(page.locator("#companyName")).toHaveValue("RICH BOYZ");
    await expect(page.locator("#companyRocNo")).toHaveValue("1231165-A");
    await expect(page.locator("#vehicleRegNo")).toHaveValue(r.vehicleRegNo);
    await snap(page, "standard-vehicle");
  });

  test("Standard stops at jpjEnquiry: result on screen, payment offered", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await ucdSession("ucdE2E");
    await runUcdToUcdStandard(page, { mykad, stopAfter: "jpjEnquiry" });
    expect(await body(page)).toMatch(/Response Code:/);
    await expect(page.locator("#to-payment")).toBeVisible();
    await snap(page, "standard-jpj-enquiry");
  });

  test("Standard runs to transfer (FINAL): on Step 6, JPJ Transfer Status OK, nothing touched after arrival", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad }) => {
    await recordUserActions(page);
    await ucdSession("ucdE2E");
    const r = await runUcdToUcdStandard(page, { mykad, stopAfter: "transfer" });
    expect(page.url()).toMatch(/jpj-sub\.do/);
    await expect(page.getByText(/JPJ Transfer Status/i).first()).toBeVisible();
    await expectUntouchedAfterArrival(page, { finalClickIn: /Sure to submit this payment/i });
    await attachOpenDialogs(page);
    expect(await body(page)).toMatch(/SUCCESSFUL/);
    await snap(page, "standard-transfer");
    console.log("Standard transferred:", r.vehicleRegNo);
  });

  test("Interstate: seller submits, buyer accepts and pays", { tag: ["@destructive"] }, async ({ page, ucdSession, mykad, browser }) => {
    test.setTimeout(20 * 60 * 1000);
    // UCD A = the run's lane, UCD B = a held lane of another company (config/lane-roster.ts; lanes 1 + 2 by default)
    await ucdSession(lanePersona());

    // UCD A must hold the vehicle first.
    // the lane's own QA prefix when it has one (lanes 3+); lanes 1-2 keep the flow default as before
    const own = ownLane().prefix;
    const held = await runStmsFlow(page, { mykad, stopAfter: "transfer", buyer: laneCard(), ...(/^[A-Z]{2}$/.test(own) ? { vehiclePrefix: own } : {}) });
    const vehicleRegNo = held.vehicleRegNo;

    // --- seller side. The buyer is ucdE2E2 (faizuddin2), whose company ROC differs per
    // instance: 1576795-H on /eauto/ (EAINT-12253 seed, 20.10.2026), 030312-A on /preprod1/.
    // /uat1/ shares /eauto/'s database (checked 21.10.2026), so the same company record.
    const partner = partnerLane();
    const buyerRoc = partner.lane === "2"
      ? ({ eauto: "1576795-H", uat1: "1576795-H", preprod1: "030312-A" } as Record<string, string>)[instance()]
      : partner.roc; // our QA companies exist once, on the shared staging database
    expect(buyerRoc, `no company ROC known for UCD B (lane ${partner.lane}) on instance ${instance()}`).toBeTruthy();
    const sent = await runInterstateSeller(page, { mykad, vehicleRegNo, buyerRoc });
    expect(sent.stoppedAfter).toBe("submitted");
    expect(page.url()).toMatch(/interstate\/enquiry\.do/);
    await sent.utu.searchListing(INTERSTATE_LISTING, vehicleRegNo);
    const sellerRow = listingRow(page, vehicleRegNo);
    await expect(sellerRow).toContainText(/Interstate\s*New/i);
    await expect(sellerRow).toContainText(/PENDING BUYER THUMBPRINT/i);
    await snap(page, "interstate-seller-listing-new");

    // --- buyer side, its own context so the seller session stays signed in
    // Its own video: the r5 proof (21.10.2026) had none for the buyer, only the seller page's.
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, baseURL: baseURL(),
      recordVideo: { dir: test.info().outputPath("buyer-video"), size: { width: 1920, height: 1080 } } });
    let buyerVideo: string | undefined;
    try {
      const buyerPage = await ctx.newPage();
      buyerVideo = await buyerPage.video()?.path();
      await recordUserActions(buyerPage);
      await new LoginPage(buyerPage).as(partnerPersona());
      await new StmsWizardPage(buyerPage).dismissAnnouncements();

      const bought = await runInterstateBuyer(buyerPage, { mykad, vehicleRegNo });
      expect(bought.stoppedAfter).toBe("transfer");
      expect(buyerPage.url()).toMatch(/jpj-sub\.do/);
      // FINAL stop (EAINT-12253): Step 6 marker, and nothing touched after arrival.
      await expect(buyerPage.getByText(/JPJ Transfer Status/i).first()).toBeVisible();
      await expectUntouchedAfterArrival(buyerPage, { finalClickIn: /Sure to submit this payment/i });
      await attachOpenDialogs(buyerPage);
      expect(await body(buyerPage)).toMatch(/SUCCESSFUL/);
      await snap(buyerPage, "interstate-buyer-transfer");
    } finally {
      await ctx.close();
      if (buyerVideo) await test.info().attach("interstate-buyer-video", { path: buyerVideo, contentType: "video/webm" });
    }

    // --- the seller's Interstate listing now reads Approved
    await sent.utu.searchListing(INTERSTATE_LISTING, vehicleRegNo);
    await expect(listingRow(page, vehicleRegNo)).toContainText(/Approved/i);
    await snap(page, "interstate-seller-listing-approved");
    console.log("Interstate completed:", vehicleRegNo);
  });
});
