/**
 * eMOVE (Logistics) flow — the reusable entry point. EAINT-12019, staging /uat3/.
 *
 * Same shape as `stms.flow.ts`: `stopAfter` names the step just COMPLETED, every option has a default, and the
 * result carries what the next step needs.
 *
 *   // Step 1 filled, Next NOT pressed (nothing created)
 *   await runEmoveFlow(page, { vehicleRegNo: "ON000196", stopAfter: "filled" });
 *
 *   // Next pressed: request created (EM6…, Pending, unpaid), standing on Step 2; 330 km on the maps stub
 *   const r = await runEmoveFlow(page, { vehicleRegNo: "ON000196", km: 330, tag: "TS2", stopAfter: "created" });
 *   r.step2.distanceKm // 330
 *
 *   // PAYS (eSim default OK for the company, unless `aroundPayment` sets IF): Step 3 or the refusal
 *   await runEmoveFlow(page, { …, stopAfter: "paid", aroundPayment: (f) => withEmoveRhb("1080458", "IF", f) });
 *
 *   // then the driver legs on a separate, logged-out phone page
 *   await runEmoveFlow(page, { …, stopAfter: "delivered" });
 *
 * ── PRECONDITIONS ──────────────────────────────────────────────────────────────
 *  - Signed in as a dealer (take `ucdSession` in the spec).
 *  - `vehicleRegNo` must be eMOVE-eligible for the signed-in company (an Approved STMS / UCD to UCD / eSTM where it
 *    was a party) and must have no open eMOVE. On /uat3/ lane 1 (AZFARAZO): ON000196, ON000197 (Approved STMS from
 *    EAINT-12580, 26.10.2026). There is no default: an eligible vehicle is used up until its eMOVE ends.
 *  - Distance: with `km`, the flow writes two street rules + a route on the Google Maps stub in OUR scenario
 *    (`@fixtures/maps-stub`) and types those streets; without it staging answers 100 km (Tier 1) for any address.
 *  - Payment: eSim answers eMOVE by Company ID; no row = OK. The flow never touches eSim itself.
 *  - Driver legs need no login: they run in a NEW browser context on the phone viewport.
 *
 * `created` and later CREATE a request on the company. A test that does not complete it should cancel it
 * (`UcdEmovePage.cancelFromListing`) so the vehicle is free again.
 *
 * Register: UNVERIFIED (src/flows/README.md) until `tests/flows/emove.verify.spec.ts` has a clean reviewed run.
 */

import type { Page } from "@playwright/test";
import { UcdEmovePage, type LegInput, type PayOutcome } from "@pages/ucd/emove.page";
import { EmoveDriverPage } from "@pages/driver/emove-driver.page";
import { stubRoute } from "@fixtures/maps-stub";
import { baseURL } from "@config/environments";

/**
 * `landing`  — on the Logistics landing (tile pressed)
 * `searched` — Step 1, vehicle searched and found (Engine / Chassis filled)
 * `filled`   — Step 1 fully filled, Next NOT pressed. Nothing created
 * `created`  — Next pressed: request created, on Step 2 (Make Payment not pressed)
 * `paid`     — Make Payment > Next: on Step 3 (paid) or back on Step 2 (refused / re-priced), see `payment`
 * `pickedUp` — driver Pick-Up done (12 photos, Submit): In Transit
 * `delivered`— driver Drop-Off done: Delivered / Completed
 */
export type EmoveStep = "landing" | "searched" | "filled" | "created" | "paid" | "pickedUp" | "delivered";
const ORDER: EmoveStep[] = ["landing", "searched", "filled", "created", "paid", "pickedUp", "delivered"];
type Around = <T>(run: () => Promise<T>) => Promise<T>;
const noWrap: Around = (run) => run();

export interface EmoveScenario {
  vehicleRegNo: string;
  stopAfter?: EmoveStep;
  /** Road distance to give this route on the maps stub. Omitted = staging's default (100 km). */
  km?: number;
  /** Short unique tag for the stub street names (e.g. the TS number). Default "FLOW". */
  tag?: string;
  colour?: string;
  /** Option text, e.g. "Sedan / Hatchback". Default "Sedan / Hatchback"; "" leaves it unselected. */
  vehicleType?: string;
  makeModel?: string;
  manufacturingYear?: string;
  /** Default: Door-to-Door, SELANGOR / SHAH ALAM 40000. */
  pickup?: LegInput;
  /** Default: Door-to-Door, JOHOR / JOHOR BAHRU 80000. */
  dropoff?: LegInput;
  /** Which enabled day in the datepicker (0 = tomorrow). */
  dateIndex?: number;
  /** `paid` only: wraps the payment, e.g. `(f) => withEmoveRhb("1080458", "IF", f)`. */
  aroundPayment?: Around;
  /** Driver legs: where their browser context records its video (pass `test.info().outputPath("driver")`). */
  driverVideoDir?: string;
  /** Open Logistics from the home tile (default) or straight by address. */
  viaTile?: boolean;
}

export interface EmoveResult {
  vehicleRegNo: string;
  stoppedAfter: EmoveStep;
  id?: string;
  transactionNo?: string;
  preferredPickupDate?: string;
  /** Refusal at Search or Next (nothing created). */
  refusal?: { at: "search" | "next"; title: string; text: string };
  step2?: Awaited<ReturnType<UcdEmovePage["readStep2"]>>;
  payment?: PayOutcome;
  pickupText?: string;
  deliveryText?: string;
  page: Page;
  emove: UcdEmovePage;
}

export async function runEmoveFlow(page: Page, s: EmoveScenario): Promise<EmoveResult> {
  const stopAfter = s.stopAfter ?? "created";
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (st: EmoveStep) => ORDER.indexOf(st) <= stopAt;
  const emove = new UcdEmovePage(page);
  const r: EmoveResult = { vehicleRegNo: s.vehicleRegNo, stoppedAfter: "landing", page, emove };
  const done = (st: EmoveStep) => ((r.stoppedAfter = st), r);

  if (s.viaTile ?? true) await emove.openFromTile();
  else await emove.gotoLanding();
  if (!reaches("searched")) return done("landing");

  await emove.startCreate();
  const found = await emove.searchVehicle(s.vehicleRegNo);
  if (!found.found) {
    r.refusal = { at: "search", title: found.dialog?.title ?? "", text: found.dialog?.text ?? "(no dialog)" };
    return done("landing");
  }
  if (!reaches("filled")) return done("searched");

  const addr = s.km !== undefined ? await stubRoute({ tag: s.tag ?? "FLOW", km: s.km }) : undefined;
  await emove.fillVehicle({
    colour: s.colour ?? "Silver",
    vehicleType: s.vehicleType === "" ? undefined : s.vehicleType ?? "Sedan / Hatchback",
    makeModel: s.makeModel,
    manufacturingYear: s.manufacturingYear,
  });
  await emove.fillLeg("pickup", s.pickup ?? { mode: "DOOR", state: "SELANGOR", city: "SHAH ALAM", postcode: "40000", address: addr?.pickupAddress ?? "No 1 Jalan QA Ujian 1, Taman Ujian", remarks: "EAINT-12019 QA automation" });
  await emove.fillLeg("dropoff", s.dropoff ?? { mode: "DOOR", state: "JOHOR", city: "JOHOR BAHRU", postcode: "80000", address: addr?.dropoffAddress ?? "No 2 Jalan QA Ujian 2, Taman Ujian", remarks: "EAINT-12019 QA automation" });
  r.preferredPickupDate = await emove.pickDate(s.dateIndex ?? 0);
  if (!reaches("created")) return done("filled");

  const next = await emove.next();
  if (next.id === undefined) {
    r.refusal = { at: "next", title: next.dialog?.title ?? "", text: next.dialog?.text ?? "(no dialog)" };
    return done("filled");
  }
  r.id = next.id;
  r.step2 = await emove.readStep2();
  r.transactionNo = r.step2.transactionNo;
  if (!reaches("paid")) return done("created");

  r.payment = await (s.aroundPayment ?? noWrap)(() => emove.pay());
  if (!reaches("pickedUp")) return done("paid");
  if (r.payment.outcome !== "paid") throw new Error(`Not paid (${r.payment.outcome}); cannot go on to the driver legs.`);

  const legs = await runEmoveDriverLegs(page, s.vehicleRegNo, reaches("delivered") ? "delivered" : "pickedUp", s.driverVideoDir);
  r.pickupText = legs.pickupText;
  r.deliveryText = legs.deliveryText;
  return done(reaches("delivered") ? "delivered" : "pickedUp");
}

/**
 * The driver legs alone, for a request that is already paid (Pending Pick-Up) or picked up: a NEW, logged-out
 * browser context on the phone viewport, the universal QR page, the vehicle, Confirm & Continue, 12 photos, Submit.
 * `from: "delivery"` skips the Pick-Up leg (the request is In Transit already).
 */
const PHONE = { width: 412, height: 915 };

export async function runEmoveDriverLegs(
  page: Page,
  vehicleRegNo: string,
  upTo: "pickedUp" | "delivered",
  videoDir?: string,
  from: "pickup" | "delivery" = "pickup",
): Promise<{ pickupText?: string; deliveryText?: string }> {
  const out: { pickupText?: string; deliveryText?: string } = {};
  const ctx = await page.context().browser()!.newContext({ baseURL: baseURL(), ignoreHTTPSErrors: true, viewport: PHONE, ...(videoDir ? { recordVideo: { dir: videoDir, size: PHONE } } : {}) });
  try {
    const driver = new EmoveDriverPage(await ctx.newPage());
    const legs = (["pickup", "delivery"] as const).filter((l) => !(l === "pickup" && from === "delivery") && !(l === "delivery" && upTo === "pickedUp"));
    for (const leg of legs) {
      await driver.open(leg);
      await driver.enterVehicle(vehicleRegNo);
      await driver.confirmDetails();
      await driver.uploadPhotos(12);
      const text = await driver.submit();
      if (leg === "pickup") out.pickupText = text;
      else out.deliveryText = text;
    }
  } finally {
    await ctx.close();
  }
  return out;
}
