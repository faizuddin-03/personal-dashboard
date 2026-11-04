// VERIFY SPEC for src/flows/emove.flow.ts (EAINT-12019 eMOVE, staging /uat3/ only, lane 1 AZFARAZO 1080458).
// Moves the flow from UNVERIFIED to VERIFIED once a clean run is reviewed (src/flows/README.md). Each test asserts
// on the screen the stop CLAIMS to be sitting on, and attaches a screenshot.
//
//   TEST_ENV=staging INSTANCE=uat3 LANE=1 RECORD=1 node scripts/cr-run.mjs … (or probe-run.mjs 1 tests/flows/emove.verify.spec.ts)
//
// Data (30.10.2026): ON000196 and ON000197 are Approved STMS vehicles of AZFARAZO from EAINT-12580 (26.10).
// Tests 1-4 run on a FREE vehicle (ON000196 or ON000197; both Completed and free since 30.10 16:40): test 3 creates,
// checks that a second Search on it is refused, and cancels; test 4 pays and completes. Test 5 is only for a request
// paid earlier and not picked up (EMOVE_HELD_VEHICLE / EMOVE_HELD_TRX); run it alone with --grep "5 driver legs".
//
// DESTRUCTIVE: creates eMOVE requests on lane 1's company; test 4 PAYS (first attempt refused by RHB IF, Retry paid by the default OK)
// and completes the job with 24 test photos; test 3 cancels its own request. eSim: one rhb-transfer-resp row for
// 1080458, created and removed inside test 4 (`withEmoveRhb`). Maps stub: rules in scenario EAINT12019-azfar.

import { test, expect } from "@fixtures";
import type { Page } from "@playwright/test";
import { lanePersona } from "@config/personas";
import { baseURL } from "@config/environments";
import { LoginPage } from "@auth/login";
import { runEmoveFlow, runEmoveDriverLegs } from "@flows/emove.flow";
import { BoEmovePage } from "@pages/bo/emove.page";
import { UcdEmovePage } from "@pages/ucd/emove.page";
import { withEmoveRhb } from "@fixtures/esim-switch";

const COMPANY_ID = "1080458";
/** A fresh stub tag per run: geo keeps a tag's coordinates and route cached, so a re-used tag can return an old
 *  distance (r6: tag V4 re-used, priced 100 km). */
const STAMP = Date.now().toString(36).slice(-4).toUpperCase();
const FREE = process.env.EMOVE_FREE_VEHICLE ?? "ON000196";
const HELD = process.env.EMOVE_HELD_VEHICLE ?? "ON000197";
/** The paid, not yet picked-up request on HELD that test 5 drives (EM600000021 = smoke step 6). */
const HELD_TRX = process.env.EMOVE_HELD_TRX ?? "EM600000021";

/** Saved in the test's own output folder as well, so a list-reporter run keeps it for review. */
async function snap(page: Page, name: string) {
  const file = test.info().outputPath(`${name}.png`);
  await page.screenshot({ fullPage: true, path: file });
  await test.info().attach(name, { path: file, contentType: "image/png" });
}

/** BO in its own context: both portals share one login cookie. */
async function boDetails(page: Page, id: string, name: string) {
  const ctx = await page.context().browser()!.newContext({ baseURL: baseURL(), ignoreHTTPSErrors: true, viewport: { width: 1920, height: 1080 }, recordVideo: { dir: test.info().outputPath("bo-video") } });
  try {
    const bo = await ctx.newPage();
    await new LoginPage(bo).as("bo");
    const p = new BoEmovePage(bo);
    await p.gotoDetails(id);
    const d = await p.readDetails();
    await snap(bo, name);
    return d;
  } finally {
    await ctx.close();
  }
}

test.describe.configure({ mode: "serial" });

test.describe("emove flow verify", () => {
  test.beforeEach(() => {
    expect(baseURL()).toMatch(/\/uat3\/$/);
    expect(process.env.LANE).toBe("1");
  });

  test("1 stops at searched: vehicle found, Engine / Chassis filled", async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runEmoveFlow(page, { vehicleRegNo: FREE, stopAfter: "searched" });
    expect(r.refusal).toBeUndefined();
    expect(r.stoppedAfter).toBe("searched");
    const f = await r.emove.vehicleFields();
    expect(f.engineNo).not.toBe("");
    expect(f.chassisNo).not.toBe("");
    await expect(page.getByText("Working...", { exact: true }).first()).toBeHidden();
    await snap(page, "1-searched");
  });

  test("2-3 stops at created on the maps stub (330 km); a second Search on that vehicle is refused; Cancel from the listing", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    await ucdSession(lanePersona());
    const r = await runEmoveFlow(page, { vehicleRegNo: FREE, km: 330, tag: `V3${STAMP}`, stopAfter: "created" });
    expect(r.refusal).toBeUndefined();
    expect(r.stoppedAfter).toBe("created");
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.transactionNo).toMatch(/^EM\d{9}$/);
    expect(r.step2?.distanceKm).toBe(330);
    await expect(r.emove.payButton).toBeVisible();
    await expect(page.getByText("Working...", { exact: true })).toHaveCount(0);
    await snap(page, "3-created-step2");
    // refusal at Search: the vehicle now has an eMOVE in progress (text as seen in the smoke 30.10.2026, p06b;
    // this checks the flow reports a refusal, not the wording)
    const again = await runEmoveFlow(page, { vehicleRegNo: FREE, stopAfter: "searched" });
    expect(again.stoppedAfter).toBe("landing");
    expect(again.refusal?.at).toBe("search");
    expect(again.refusal?.text).toContain("already has an eMOVE transaction in progress");
    await snap(page, "2-refused");
    const bo = await boDetails(page, r.id!, "3-bo-details");
    expect(bo.pricingHistory[0]?.["Road km"]).toBe("330.000");
    await r.emove.searchListing({ vehicleRegNo: FREE });
    expect((await r.emove.listingRow(r.transactionNo!))["Tx Status"]).toBe("Pending");
    const d = await r.emove.cancelFromListing(r.transactionNo!);
    expect(d?.text).toContain(r.transactionNo!);
    await r.emove.searchListing({ vehicleRegNo: FREE });
    expect((await r.emove.listingRow(r.transactionNo!))["Tx Status"]).toBe("Cancelled");
    await snap(page, "3-cancelled");
  });

  test("4 paid: RHB IF → failed + Retry; Retry with the default OK → Step 3; driver legs → delivered", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    test.setTimeout(20 * 60_000);
    await ucdSession(lanePersona());
    const r = await runEmoveFlow(page, { vehicleRegNo: FREE, km: 150, tag: `V4${STAMP}`, stopAfter: "paid", aroundPayment: (f) => withEmoveRhb(COMPANY_ID, "IF", f) });
    expect(r.step2?.distanceKm).toBe(150); // the stub route was priced, not the 100 km default (r5 caught that)
    expect(r.payment?.outcome).toBe("failed");
    const s2 = await r.emove.readStep2();
    expect(s2.paymentStatus).toBe("Failed");
    expect(s2.history).toHaveLength(1);
    await expect(r.emove.retryButton).toBeVisible();
    await snap(page, "4a-failed-retry");

    const again = await r.emove.pay(); // eSim row removed by withEmoveRhb: the default answers OK
    expect(again.outcome).toBe("paid");
    expect(page.url()).toMatch(/confirmation\.do\?id=/);
    await snap(page, "4b-step3-paid");

    const legs = await runEmoveDriverLegs(page, FREE, "delivered", test.info().outputPath("driver-video"));
    expect(legs.pickupText).toMatch(/Pick-Up Confirmed/);
    expect(legs.deliveryText).toMatch(/Drop-Off Confirmed/);
    const bo = await boDetails(page, r.id!, "4c-bo-details-completed");
    expect(bo.paymentHistory).toHaveLength(2);
    await r.emove.searchListing({ vehicleRegNo: FREE });
    const row = await r.emove.listingRow(r.transactionNo!);
    expect(row["Delivery"]).toBe("Delivered");
    expect(row["Tx Status"]).toBe("Completed");
    await snap(page, "4d-ucd-listing-completed");
  });

  test("5 driver legs alone on a request paid earlier (frees the held vehicle)", { tag: ["@destructive"] }, async ({ page, ucdSession }) => {
    test.setTimeout(15 * 60_000);
    await ucdSession(lanePersona());
    const legs = await runEmoveDriverLegs(page, HELD, "delivered", test.info().outputPath("driver-video"));
    expect(legs.pickupText).toMatch(/Pick-Up Confirmed/);
    expect(legs.deliveryText).toMatch(/Drop-Off Confirmed/);
    const e = new UcdEmovePage(page);
    await e.searchListing({ vehicleRegNo: HELD });
    expect((await e.listingRow(HELD_TRX))["Tx Status"]).toBe("Completed");
    await snap(page, "5-held-completed");
  });
});
