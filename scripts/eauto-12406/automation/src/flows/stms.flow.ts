/**
 * STMS flow — the reusable entry point.
 *
 * Most tickets do not want "the STMS happy path". They want *one* screen with
 * *one* condition set up, and everything before it done for them. So this is a
 * single composable function, not a script:
 *
 *   // seed a completed STMS so APT has something to act on
 *   await runStmsFlow(page, { stopAfter: "transfer" });
 *
 *   // a ticket about Step 2 validation — get there and stop
 *   const r = await runStmsFlow(page, { stopAfter: "vehicle" });
 *
 *   // a ticket about a specific JPJ error code
 *   await runStmsFlow(page, { vehiclePrefix: "VD", stopAfter: "jpjCheck" });
 *
 *   // a ticket about a failed thumbprint
 *   await runStmsFlow(page, { matchResult: "Not Identical", stopAfter: "seller" });
 *
 * Every knob has a working default, so a caller states only what it cares
 * about. The result carries what later steps and assertions need.
 *
 * FINAL STOP: `transfer` — Step 6 Transfer `view/ucd/stms/transaction/jpj-sub.do?id=…`
 * (marker "JPJ Transfer Status:", read by `StmsWizardPage.transferResult()`). It returns when that
 * page has loaded (`submitPayment` waits for the URL); the only dialog answered is Step 5's own
 * "Sure to submit this payment?", BEFORE arrival.
 * EAINT-12253 (21.10): final-step stop returns on arrival; nothing after it touches a dialog.
 * Reviewed 21.10.2026 and already compliant, so the CODE is unchanged (this note only) and the flow
 * stays LEGACY. It does not wait for the marker / "Working..." itself: a CR spec that screenshots
 * Step 6 waits for "JPJ Transfer Status" first (`awaitFinalScreen`, `@pages/final-step`).
 */

import type { Page } from "@playwright/test";
import { StmsWizardPage, SellerCategory, type CardLike } from "@pages/ucd/stms-wizard.page";
import { MyKadClient, type MatchResult } from "@fixtures/mykad";
import { CARDS } from "@data/cards";
import {
  nextVehicleNumber,
  nextMobile,
  nextEmail,
  randomEngineNo,
  randomChassisNo,
} from "@data/generator";

/**
 * Where to stop. Each value names the step that has just been COMPLETED.
 *
 * `category` — seller category chosen, sitting on Seller Authentication
 * `seller`   — seller MyKad verified, "Next" available
 * `vehicle`  — Step 2 filled, not yet submitted
 * `buyer`    — buyer MyKad verified
 * `jpjCheck`   — sitting on the JPJ Check screen, nothing submitted
 * `jpjEnquiry` — JPJ enquiry run, result on screen, not yet paid
 * `payment`    — on the payment page, nothing paid
 * `transfer`   — COMPLETE. Paid and transferred to JPJ
 */
export type StmsStep =
  | "category"
  | "seller"
  | "vehicle"
  | "buyer"
  | "jpjCheck"
  | "jpjEnquiry"
  | "payment"
  | "transfer";

const ORDER: StmsStep[] = [
  "category",
  "seller",
  "vehicle",
  "buyer",
  "jpjCheck",
  "jpjEnquiry",
  "payment",
  "transfer",
];

export interface VehicleDetails {
  mobileNo: string;
  email: string;
  engineNo: string;
  chassisNo: string;
  make: string;
  model?: string;
  year: string;
}

export interface StmsScenario {
  /** Default MALAYSIAN. */
  sellerCategory?: SellerCategory;
  /**
   * Vehicle-number prefix. **This chooses the JPJ outcome**, because eSim keys
   * its canned responses on it. Default "TE" (response code 00 on staging).
   */
  vehiclePrefix?: string;
  /** Pin an exact vehicle number instead of allocating one from the counter. */
  vehicleRegNo?: string;
  /** Default CARDS.malaysianIndividual. */
  seller?: CardLike;
  /** Default: the same card as the seller, which is how the flow was mapped. */
  buyer?: CardLike;
  /** Override any Step 2 field; the rest are generated. */
  vehicle?: Partial<VehicleDetails>;
  /** Force a thumbprint outcome. Default "Identical". */
  matchResult?: MatchResult;
  /** Default "transfer" — a complete transaction. */
  stopAfter?: StmsStep;
  /**
   * The card reader to drive.
   *
   * Pass the `mykad` FIXTURE from the spec: the fixture already resets the
   * reader between tests, and a flow that opened its own socket would leave a
   * second one hanging on the same channel. Omitted only by the probe scripts,
   * which run outside Playwright and have no fixture to take.
   */
  mykad?: MyKadClient;
}

export interface StmsResult {
  vehicleRegNo: string;
  vehicle: VehicleDetails;
  /** eAuto's transaction id, once the URL carries one (from Step 3 onward). */
  transactionId?: string;
  stoppedAfter: StmsStep;
  page: Page;
  stms: StmsWizardPage;
  /** Still connected when the caller needs more card reads. Close it yourself. */
  mykad: MyKadClient;
}

/**
 * Run the STMS wizard as far as `stopAfter`.
 *
 * The page must ALREADY be signed in — take `ucdSession` in the spec. Signing
 * in here would hide which persona a run used, and a destructive journey has
 * to name its account.
 *
 * The MyKad client is left OPEN so the caller can keep driving. Close it in a
 * `finally`, or call `closeStmsFlow(result)`.
 */
export async function runStmsFlow(page: Page, scenario: StmsScenario = {}): Promise<StmsResult> {
  const stopAfter = scenario.stopAfter ?? "transfer";
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (step: StmsStep) => ORDER.indexOf(step) <= stopAt;

  const seller = scenario.seller ?? CARDS.malaysianIndividual;
  const buyer = scenario.buyer ?? seller;
  const vehicleRegNo = scenario.vehicleRegNo ?? nextVehicleNumber(scenario.vehiclePrefix ?? "TE");

  const vehicle: VehicleDetails = {
    mobileNo: nextMobile(),
    email: nextEmail(),
    engineNo: randomEngineNo(),
    chassisNo: randomChassisNo(),
    make: "Chery",
    year: "2012",
    ...scenario.vehicle,
  };

  // Default channel on purpose: eAuto hardcodes ws://localhost:7878/IDCard,
  // so a per-worker channel would insert cards the page never sees.
  const borrowed = scenario.mykad !== undefined;
  const mykad = scenario.mykad ?? new MyKadClient();
  if (!borrowed) await mykad.connect();
  await mykad.removeCard();
  await mykad.setMatchResult(scenario.matchResult ?? "Identical");

  const stms = new StmsWizardPage(page);
  const result = (stoppedAfter: StmsStep): StmsResult => ({
    vehicleRegNo,
    vehicle,
    transactionId: transactionIdFrom(page.url()),
    stoppedAfter,
    page,
    stms,
    mykad,
  });

  try {
    await stms.startNewTransaction();
    await stms.chooseSellerCategory(scenario.sellerCategory ?? SellerCategory.MALAYSIAN);
    if (!reaches("seller")) return result("category");

    await stms.authenticateSeller({ vehicleRegNo, mykad, card: seller, sellerEmail: vehicle.email });
    if (!reaches("vehicle")) return result("seller");

    await stms.continueToVehicle();
    await stms.fillVehicleDetails(vehicle);
    if (!reaches("buyer")) return result("vehicle");

    await stms.continueToBuyer();
    await stms.authenticateBuyer({ jpjReceiptEmail: vehicle.email, mykad, card: buyer });
    if (!reaches("jpjCheck")) return result("buyer");

    await stms.continueToJpjCheck();
    if (!reaches("jpjEnquiry")) return result("jpjCheck");

    await stms.runJpjEnquiry();
    if (!reaches("payment")) return result("jpjEnquiry");

    await stms.goToPayment();
    if (!reaches("transfer")) return result("payment");

    await stms.submitPayment();
    return result("transfer");
  } catch (e) {
    // Never leave a socket open on a failure path — but a BORROWED reader
    // belongs to the fixture, which closes it in its own teardown.
    if (!borrowed) await mykad.close().catch(() => undefined);
    throw e;
  }
}

/**
 * Release the reader a flow opened for itself.
 *
 * Safe to call when the spec passed its own `mykad` fixture in: the card is
 * taken out, and closing is left to whoever opened the socket.
 */
export async function closeStmsFlow(result: StmsResult): Promise<void> {
  await result.mykad.removeCard().catch(() => undefined);
}

function transactionIdFrom(url: string): string | undefined {
  return new URL(url).searchParams.get("id") ?? undefined;
}
