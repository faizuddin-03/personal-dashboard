/**
 * UCD to UCD flow — the reusable entry points.
 *
 * Same shape as `stms.flow.ts`: a function per journey, `stopAfter` names the
 * step just COMPLETED, every option has a default, and the result carries what
 * the next step needs. Interstate is TWO functions because it is two people:
 *
 *   // Standard, whole transaction, UCD B logged in
 *   await ucdSession("ucdE2E");
 *   const t = await runUcdToUcdStandard(page, { mykad, stopAfter: "transfer" });
 *
 *   // Interstate: A creates and submits ...
 *   await ucdSession("ucdE2E");
 *   const sent = await runInterstateSeller(page, { mykad, buyerRoc: "1231165-A" });
 *   // ... B accepts and pays, in a session signed in as the buyer
 *   await ucdSession("ucdE2E2");
 *   await runInterstateBuyer(page, { mykad, vehicleRegNo: sent.vehicleRegNo });
 *
 * The page must ALREADY be signed in, as for STMS: the persona is the caller's
 * to name. The two Interstate sides need two different personas, so switch
 * with a fresh `ucdSession(...)` (or a second browser context) in between.
 *
 * ── Things a caller must know ───────────────────────────────────────────────
 *  - Standard: the person on `seller`'s card must be a registered user of the
 *    `sellerCompany` typed at Step 2, or Step 3 is refused.
 *  - Interstate seller: the vehicle must ALREADY be held by the seller UCD. A
 *    vehicle it never acquired answers "Vehicle record not found" on GET.
 *  - Interstate buyer: the 48 h window runs from when the seller created it.
 *    Accepting spends the transaction — there is no second go.
 *  - Vehicle prefix picks the JPJ / RHB outcome (eSim keys on it), as in STMS.
 *
 * ── FINAL STOPS ───────────────────────────────────────────────────────────────
 *  - Standard `transfer` and Interstate buyer `transfer`: Step 6 Transfer, the STMS screen
 *    `view/ucd/stms/transaction/jpj-sub.do?id=…`, marker "JPJ Transfer Status:". The only dialog
 *    answered on the way is Step 5's own "Sure to submit this payment?", BEFORE arrival.
 *  - Interstate seller `submitted` (not an EAINT-12253 final step; Q7): the Interstate listing.
 * EAINT-12253 (21.10): final-step stop returns on arrival; nothing after it touches a dialog (BA: the
 * reminder shows on Step 6 after payment, not on Step 5). `payment` is kept as it was.
 */

import type { Page } from "@playwright/test";
import { UcdToUcdPage, type SellerCompany, INTERSTATE_LISTING } from "@pages/ucd/ucd-to-ucd.page";
import type { CardLike } from "@pages/ucd/stms-wizard.page";
import { MyKadClient, type MatchResult } from "@fixtures/mykad";
import { CARDS, laneCard, partnerCard } from "@data/cards";
import { nextVehicleNumber, nextMobile, nextEmail, randomEngineNo, randomChassisNo } from "@data/generator";
import type { VehicleDetails } from "./stms.flow";
import { awaitFinalScreen } from "@pages/final-step";

/** The seller company the Standard walks used (its rep is on `CARDS.malaysianIndividual`). */
export const DEFAULT_SELLER_COMPANY: SellerCompany = { name: "RICH BOYZ", rocNo: "1231165-A" };
/** UCD B's company ROC — the buyer the Interstate seller creates for. */
export const DEFAULT_INTERSTATE_BUYER_ROC = "1231165-A";
const DEFAULT_ADDRESS = "NO 1 JALAN SEED, 81100 JOHOR BAHRU, JOHOR";

// ------------------------------------------------------------------ shared

type Common = {
  /** The card reader fixture. Required: every UCD to UCD journey reads a card. */
  mykad: MyKadClient;
  /** Vehicle-number prefix. Default "TE". */
  vehiclePrefix?: string;
  /** Pin an exact vehicle number instead of allocating one from the counter. */
  vehicleRegNo?: string;
  /** Override any Step 2 field; the rest are generated. */
  vehicle?: Partial<VehicleDetails>;
  /** Force a thumbprint outcome. Default "Identical". */
  matchResult?: MatchResult;
};

export interface UtuResult {
  vehicleRegNo: string;
  vehicle: VehicleDetails;
  transactionId?: string;
  page: Page;
  utu: UcdToUcdPage;
  mykad: MyKadClient;
}

function vehicleFor(s: Common): { vehicleRegNo: string; vehicle: VehicleDetails } {
  return {
    vehicleRegNo: s.vehicleRegNo ?? nextVehicleNumber(s.vehiclePrefix ?? "TE"),
    vehicle: {
      mobileNo: nextMobile(),
      email: nextEmail(),
      engineNo: randomEngineNo(),
      chassisNo: randomChassisNo(),
      make: "Chery",
      year: "2012",
      ...s.vehicle,
    },
  };
}

const idOf = (page: Page) => new URL(page.url()).searchParams.get("id") ?? undefined;

/** Reader starts empty with the wanted match result. The caller owns the socket. */
async function primeReader(mykad: MyKadClient, matchResult?: MatchResult): Promise<void> {
  await mykad.removeCard();
  await mykad.setMatchResult(matchResult ?? "Identical");
}

/** Take the card out. Closing the socket is the fixture's job. */
export async function closeUcdToUcdFlow(result: UtuResult): Promise<void> {
  await result.mykad.removeCard().catch(() => undefined);
}

/** Step 6 Transfer arrived: its own marker + "Working..." cleared. Touches nothing (EAINT-12253). */
async function arriveOnStep6(page: Page): Promise<void> {
  await awaitFinalScreen(page, page.getByText(/JPJ Transfer Status/i), "Step 6 Transfer: 'JPJ Transfer Status'");
}

function stopper<S extends string>(order: readonly S[], stopAfter: S) {
  const at = order.indexOf(stopAfter);
  if (at === -1) throw new Error(`Unknown stopAfter "${stopAfter}". Use one of: ${order.join(", ")}.`);
  return (s: S) => order.indexOf(s) <= at;
}

// ---------------------------------------------------------------- Standard

/**
 * `seller`     — Step 1 done: seller rep thumbprinted, "Next" available
 * `vehicle`    — Step 2 filled (seller company + vehicle), not yet submitted
 * `buyer`      — Step 3 done: buyer thumbprinted
 * `jpjCheck`   — on the JPJ Check screen, nothing submitted
 * `jpjEnquiry` — JPJ enquiry run, result on screen, not yet paid
 * `payment`    — on the payment page, nothing paid
 * `transfer`   — FINAL. Paid and transferred to JPJ: ON Step 6, returned on arrival
 */
export type UtuStandardStep = "seller" | "vehicle" | "buyer" | "jpjCheck" | "jpjEnquiry" | "payment" | "transfer";
const STANDARD_ORDER = ["seller", "vehicle", "buyer", "jpjCheck", "jpjEnquiry", "payment", "transfer"] as const;

export interface UtuStandardScenario extends Common {
  /** The company selling. Default `DEFAULT_SELLER_COMPANY`. */
  sellerCompany?: SellerCompany;
  /** Seller company's representative, thumbprinted at Step 1. Default CARDS.malaysianIndividual. */
  seller?: CardLike;
  /** The logged-in UCD's own card, at Step 3. Default: the same card as the seller. */
  buyer?: CardLike;
  /** Default "transfer". */
  stopAfter?: UtuStandardStep;
}

export interface UtuStandardResult extends UtuResult {
  stoppedAfter: UtuStandardStep;
}

/** UCD to UCD Standard: UCD B, logged in, runs the whole transaction. */
export async function runUcdToUcdStandard(page: Page, s: UtuStandardScenario): Promise<UtuStandardResult> {
  const stopAfter = s.stopAfter ?? "transfer";
  const reaches = stopper(STANDARD_ORDER, stopAfter);
  const seller = s.seller ?? CARDS.malaysianIndividual;
  const buyer = s.buyer ?? seller;
  const { vehicleRegNo, vehicle } = vehicleFor(s);

  await primeReader(s.mykad, s.matchResult);
  const utu = new UcdToUcdPage(page);
  const done = (stoppedAfter: UtuStandardStep): UtuStandardResult => ({
    vehicleRegNo, vehicle, transactionId: idOf(page), stoppedAfter, page, utu, mykad: s.mykad,
  });

  await utu.openStandard();
  await utu.authenticateStandardSeller({ mykad: s.mykad, card: seller, sellerEmail: vehicle.email });
  if (!reaches("vehicle")) return done("seller");

  await utu.continueToVehicle();
  await utu.fillStandardStep2(s.sellerCompany ?? DEFAULT_SELLER_COMPANY, {
    ...vehicle, address: DEFAULT_ADDRESS, vehicleRegNo,
  });
  if (!reaches("buyer")) return done("vehicle");

  await utu.continueToBuyerStandard();
  await utu.authenticateBuyer({ jpjReceiptEmail: vehicle.email, mykad: s.mykad, card: buyer });
  if (!reaches("jpjCheck")) return done("buyer");

  await utu.continueToJpjCheck();
  if (!reaches("jpjEnquiry")) return done("jpjCheck");

  await utu.runJpjEnquiry();
  if (!reaches("payment")) return done("jpjEnquiry");

  await utu.goToPayment();
  if (!reaches("transfer")) return done("payment");

  await utu.submitPayment();
  await arriveOnStep6(page);
  return done("transfer"); // FINAL: nothing after arrival (EAINT-12253)
}

// ------------------------------------------------------- Interstate, seller

/**
 * `buyerFound` — buyer ROC accepted, sitting on Step 1
 * `seller`     — Step 1 done: seller rep thumbprinted
 * `vehicle`    — Step 2 filled and the vehicle GOT from JPJ, not yet submitted
 * `submitted`  — COMPLETE for this side. On the Interstate listing: Interstate New,
 *                PENDING BUYER THUMBPRINT. The buyer has 48 h.
 */
export type InterstateSellerStep = "buyerFound" | "seller" | "vehicle" | "submitted";
const SELLER_ORDER = ["buyerFound", "seller", "vehicle", "submitted"] as const;

export interface InterstateSellerScenario extends Common {
  /** The buyer company's ROC. Default `DEFAULT_INTERSTATE_BUYER_ROC`. */
  buyerRoc?: string;
  /** UCD A's own representative. Default: the run's lane user's card (laneCard; lane 1 = Azfar1). */
  seller?: CardLike;
  /** Default "submitted". */
  stopAfter?: InterstateSellerStep;
}

export interface InterstateSellerResult extends UtuResult {
  stoppedAfter: InterstateSellerStep;
  buyerRoc: string;
}

/**
 * Interstate, seller side. `vehicleRegNo` should be a vehicle the seller UCD
 * already holds — there is no sensible default, so pass one (the counter's
 * next number is only right if that vehicle was just acquired by STMS).
 */
export async function runInterstateSeller(page: Page, s: InterstateSellerScenario): Promise<InterstateSellerResult> {
  const stopAfter = s.stopAfter ?? "submitted";
  const reaches = stopper(SELLER_ORDER, stopAfter);
  const buyerRoc = s.buyerRoc ?? DEFAULT_INTERSTATE_BUYER_ROC;
  const { vehicleRegNo, vehicle } = vehicleFor(s);

  await primeReader(s.mykad, s.matchResult);
  const utu = new UcdToUcdPage(page);
  const done = (stoppedAfter: InterstateSellerStep): InterstateSellerResult => ({
    vehicleRegNo, vehicle, transactionId: idOf(page), stoppedAfter, page, utu, mykad: s.mykad, buyerRoc,
  });

  await utu.openInterstate();
  await utu.startInterstateFor(buyerRoc);
  if (!reaches("seller")) return done("buyerFound");

  await utu.authenticateInterstateSeller({ mykad: s.mykad, card: s.seller ?? laneCard() });
  if (!reaches("vehicle")) return done("seller");

  await utu.continueToVehicle();
  await utu.fillInterstateStep2({ mobileNo: vehicle.mobileNo, email: vehicle.email, address: DEFAULT_ADDRESS, vehicleRegNo });
  if (!reaches("submitted")) return done("vehicle");

  await utu.submitInterstateToBuyer();
  return done("submitted");
}

// -------------------------------------------------------- Interstate, buyer

/**
 * `accepted`   — To Accept pressed, sitting on Step 3
 * `buyer`      — Step 3 done: buyer thumbprinted
 * `jpjCheck`   — on the JPJ Check screen
 * `jpjEnquiry` — enquiry run again, result on screen ("pay before <48 h>")
 * `payment`    — on the payment page, nothing paid
 * `transfer`   — FINAL. Paid and transferred to JPJ: ON Step 6, returned on arrival
 */
export type InterstateBuyerStep = "accepted" | "buyer" | "jpjCheck" | "jpjEnquiry" | "payment" | "transfer";
const BUYER_ORDER = ["accepted", "buyer", "jpjCheck", "jpjEnquiry", "payment", "transfer"] as const;

export interface InterstateBuyerScenario {
  mykad: MyKadClient;
  /** The vehicle the seller submitted. Required. */
  vehicleRegNo: string;
  /** UCD B's logged-in user, whose OWN card is read. Default: the partner lane's card (partnerCard; lane 2 = faizuddin2). */
  buyer?: CardLike;
  /** JPJ receipt email. Default generated. */
  jpjReceiptEmail?: string;
  matchResult?: MatchResult;
  /** Default "transfer". */
  stopAfter?: InterstateBuyerStep;
}

export interface InterstateBuyerResult {
  vehicleRegNo: string;
  transactionId?: string;
  stoppedAfter: InterstateBuyerStep;
  page: Page;
  utu: UcdToUcdPage;
  mykad: MyKadClient;
}

/** Interstate, buyer side. The page must be signed in as the BUYER (`partnerPersona()`, lane 2 by default). */
export async function runInterstateBuyer(page: Page, s: InterstateBuyerScenario): Promise<InterstateBuyerResult> {
  const stopAfter = s.stopAfter ?? "transfer";
  const reaches = stopper(BUYER_ORDER, stopAfter);
  const email = s.jpjReceiptEmail ?? nextEmail();

  await primeReader(s.mykad, s.matchResult);
  const utu = new UcdToUcdPage(page);
  const done = (stoppedAfter: InterstateBuyerStep): InterstateBuyerResult => ({
    vehicleRegNo: s.vehicleRegNo, transactionId: idOf(page), stoppedAfter, page, utu, mykad: s.mykad,
  });

  await utu.acceptInterstate(s.vehicleRegNo);
  if (!reaches("buyer")) return done("accepted");

  await utu.authenticateInterstateBuyer({ jpjReceiptEmail: email, mykad: s.mykad, card: s.buyer ?? partnerCard() });
  if (!reaches("jpjCheck")) return done("buyer");

  await utu.continueToJpjCheck();
  if (!reaches("jpjEnquiry")) return done("jpjCheck");

  await utu.runJpjEnquiry();
  if (!reaches("payment")) return done("jpjEnquiry");

  await utu.goToPayment();
  if (!reaches("transfer")) return done("payment");

  await utu.submitPayment();
  await arriveOnStep6(page);
  return done("transfer"); // FINAL: nothing after arrival (EAINT-12253)
}

export { INTERSTATE_LISTING };
