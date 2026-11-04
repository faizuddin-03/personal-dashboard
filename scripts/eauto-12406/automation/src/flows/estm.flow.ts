/**
 * eSerahan (eSTM) flow — the reusable entry point, plus the Insurance quote it
 * can hand off to.
 *
 * Same shape as `stms.flow.ts`: `stopAfter` names the step just COMPLETED,
 * every option has a default, and the result carries what later steps and
 * assertions need. eSerahan mirrors STMS: the BUYER (customer) is authenticated
 * first, the dealer is the SELLER at Step 3.
 *
 *   // a ticket about the eSerahan fee on the payment screen — add-ons off
 *   const r = await runEstmFlow(page, { mykad, stopAfter: "payment" });
 *
 *   // complete it and stay inside eSerahan (eLKM ticked with a period)
 *   await runEstmFlow(page, { mykad, addOns: { lkm: 12 } });
 *
 *   // a ticket about the VEL000069E divert: flip eSim between enquiry and payment
 *   await runEstmFlow(page, { mykad, vehiclePrefix: "VV", afterEnquiry: () => setCode("VEL000069E") });
 *
 * The page must ALREADY be signed in (`ucdSession`). Nothing here touches eSim;
 * a caller that needs a response code changed does it in `afterEnquiry` and
 * restores it in a `finally`.
 *
 * ── Where an eSerahan run can END (knowledge/portals/ucd/portal.md) ─────────
 *  - eLKM ticked with a period  -> stays in eSerahan, `estm/transaction/estm-sub.do` ("Done")
 *  - eLKM NOT ticked            -> paid, THEN diverted to insurance
 *                                  (`isDirectEstmFirstTime=true`)  = "insurance-after-payment"
 *  - enquiry answers VEL000069E -> diverted at Step 4 -> 5, the payment screen is
 *                                  never reached                  = "insurance-before-payment"
 * Add-ons default to BOTH OFF (the cheapest valid transaction), so the default
 * complete run ends on insurance, not on `estm-sub.do`. That is the product, not
 * a failure: read `result.route`, do not assume where it landed.
 *
 * ── FINAL STOP: `transfer` ──────────────────────────────────────────────────
 * Final screen, by add-on:
 *  - eLKM ticked:   eSerahan Step 6 `view/ucd/estm/transaction/estm-sub.do`, marker its "Done"
 *                   (`EstmWizardPage.doneButton`, read, never pressed).
 *  - eLKM unticked: eSTM paid, then redirected to `view/ucd/insurance/plan/view.do?…&isDirectEstmFirstTime=true`,
 *                   marker an insurer SELECT button. BA 21.10: eSTM Step 6 shows NO reminder on this
 *                   route; the reminder comes at Insurance Step 4 Confirm (`insurance.flow.ts`, `paid`).
 *  - VEL000069E:    never reaches payment here; the insurance flow's route `estmVel069` continues it to
 *                   eSTM Step 6 (stop `estmCompleted`).
 * EAINT-12253 (21.10): final-step stop returns on arrival; nothing after it touches a dialog. The two
 * Step 5 payment confirms are answered only while the page is still on Step 5 and only by their own
 * text (they used to be "whatever dialog is last, until the URL moves", which could have pressed a
 * dialog on the screen that came next).
 */

import type { Page } from "@playwright/test";
import { EstmWizardPage } from "@pages/ucd/estm-wizard.page";
import { InsurancePage, insuranceArrival, type BuyerCategory } from "@pages/ucd/insurance.page";
import { UcdHomePage } from "@pages/ucd/ucd-home.page";
import { IdCategory, type CardLike } from "@pages/wizard.page";
import { MyKadClient, type MatchResult } from "@fixtures/mykad";
import { CARDS } from "@data/cards";
import { nextVehicleNumber, nextMobile, nextEmail, randomEngineNo, randomChassisNo } from "@data/generator";

/**
 * Where to stop. Each value names the step that has just been COMPLETED.
 *
 * `category`   — buyer ID category chosen, sitting on Buyer Authentication
 * `buyer`      — Step 1 done: buyer MyKad verified, "Next" available
 * `vehicle`    — Step 2 filled, not yet submitted
 * `seller`     — Step 3 done: the dealer's MyKad verified
 * `jpjCheck`   — on the JPJ Check screen, nothing submitted
 * `jpjEnquiry` — enquiry run, result on screen, "Make Payment" offered
 * `payment`    — on the payment page, add-ons chosen, nothing paid
 * `transfer`   — FINAL. Payment submitted; ON eSTM Step 6 or the insurance plan page (see `route`),
 *                returned on arrival
 */
export type EstmStep = "category" | "buyer" | "vehicle" | "seller" | "jpjCheck" | "jpjEnquiry" | "payment" | "transfer";

const ORDER: EstmStep[] = ["category", "buyer", "vehicle", "seller", "jpjCheck", "jpjEnquiry", "payment", "transfer"];

/** `stoppedAfter` is an EstmStep, or "insurance" when the run was diverted before payment. */
export type EstmStopped = EstmStep | "insurance";

/** Where the run is, in this suite's words. */
export type EstmRoute =
  | "payment-page" // stopped on the eSerahan payment screen
  | "estm-done" // paid, ended at estm-sub.do
  | "insurance-after-payment" // paid, then diverted (eLKM unticked)
  | "insurance-before-payment" // diverted at Step 4 -> 5 (VEL000069E), payment never reached
  | "before-payment" // stopped earlier than the payment screen
  | "unknown"; // paid, landed somewhere not mapped — read `finalUrl`

export interface EstmDetails {
  buyerEmail: string;
  contactNo: string;
  engineNo: string;
  chassisNo: string;
  /** eVOC address. Unset = tick "same as MyKad". */
  mailingAddress1?: string;
  mailingAddress2?: string;
  postCode?: string;
  district?: string;
}

export interface EstmScenario {
  /** Default MALAYSIAN. */
  buyerCategory?: IdCategory;
  /**
   * Vehicle-number prefix. **This chooses the JPJ / eSTM-enquiry outcome**, because
   * eSim keys its canned responses on it (`estm-enquiry-resp`). Default "TE" as in the
   * probe. NOTE the 12403 R5 run used its own `ON` because `TE` belongs to another team;
   * and prefix ownership is per entity (`VV` in `estm-enquiry-resp` is Azfar's).
   */
  vehiclePrefix?: string;
  /** Pin an exact vehicle number instead of allocating one from the counter. */
  vehicleRegNo?: string;
  /** The buyer (customer) card, Step 1. Default CARDS.malaysianIndividual. */
  buyer?: CardLike;
  /** The dealer's card, Step 3. Default: the same card. */
  seller?: CardLike;
  /** The eVOC email typed at Step 1. Default generated. */
  email?: string;
  /** Override any Step 2 field; the rest are generated. */
  details?: Partial<EstmDetails>;
  /**
   * Payment add-ons. BOTH DEFAULT OFF. `lkm: 6 | 12` (or `true` = 12) keeps the run inside
   * eSerahan; `lkm` off diverts to insurance after payment.
   */
  addOns?: { lkm?: boolean | 6 | 12; evoc?: boolean };
  /** Force a thumbprint outcome. Default "Identical". */
  matchResult?: MatchResult;
  /**
   * Called after the enquiry has answered and BEFORE "Make Payment". The place to change an
   * eSim response code mid-run (VEL000069E divert). The flow does not touch eSim itself.
   */
  afterEnquiry?: () => Promise<void>;
  /** Default "transfer". */
  stopAfter?: EstmStep;
  /**
   * The card reader to drive. Pass the `mykad` FIXTURE from the spec (see `StmsScenario.mykad`).
   * Omitted only by scripts that run outside Playwright.
   */
  mykad?: MyKadClient;
}

export interface EstmResult {
  vehicleRegNo: string;
  details: EstmDetails;
  /** Best-effort from the URL (`id`, `transactionId` or `estmTransactionId`). Not yet confirmed for eSerahan pages. */
  transactionId?: string;
  stoppedAfter: EstmStopped;
  route: EstmRoute;
  /** The Payment Summary block, when the run reached the payment screen. */
  paymentSummary?: string;
  /** "Total Amount Payable" as printed, when on the payment screen. */
  total?: string;
  /** The URL the run ended on. */
  finalUrl: string;
  page: Page;
  estm: EstmWizardPage;
  /** Still connected when the caller needs more card reads. Close it yourself. */
  mykad: MyKadClient;
}

/**
 * Run eSerahan as far as `stopAfter`.
 *
 * If the enquiry diverts to insurance before payment, the run stops there with
 * `stoppedAfter: "insurance"` and `route: "insurance-before-payment"` whatever `stopAfter`
 * asked for: the payment screen does not exist for that transaction.
 */
export async function runEstmFlow(page: Page, scenario: EstmScenario = {}): Promise<EstmResult> {
  const stopAfter = scenario.stopAfter ?? "transfer";
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (step: EstmStep) => ORDER.indexOf(step) <= stopAt;

  const buyer = scenario.buyer ?? CARDS.malaysianIndividual;
  const seller = scenario.seller ?? buyer;
  const vehicleRegNo = scenario.vehicleRegNo ?? nextVehicleNumber(scenario.vehiclePrefix ?? "TE");
  const email = scenario.email ?? nextEmail();

  const details: EstmDetails = {
    buyerEmail: nextEmail(),
    contactNo: nextMobile(),
    engineNo: randomEngineNo(),
    chassisNo: randomChassisNo(),
    ...scenario.details,
  };

  // Default channel on purpose (see stms.flow.ts): the portal hardcodes ws://localhost:7878.
  const borrowed = scenario.mykad !== undefined;
  const mykad = scenario.mykad ?? new MyKadClient();
  if (!borrowed) await mykad.connect();
  await mykad.removeCard();
  await mykad.setMatchResult(scenario.matchResult ?? "Identical");

  const estm = new EstmWizardPage(page);
  const result = (
    stoppedAfter: EstmStopped,
    route: EstmRoute,
    extra: Partial<Pick<EstmResult, "paymentSummary" | "total">> = {},
  ): EstmResult => ({
    vehicleRegNo,
    details,
    transactionId: transactionIdFrom(page.url()),
    stoppedAfter,
    route,
    ...extra,
    finalUrl: page.url(),
    page,
    estm,
    mykad,
  });

  try {
    // A previous flow leaves the page on its last screen, which has no dashboard tiles.
    await new UcdHomePage(page).returnToDashboard();
    await estm.startNewTransaction();
    await estm.chooseBuyerCategory(scenario.buyerCategory ?? IdCategory.MALAYSIAN);
    if (!reaches("buyer")) return result("category", "before-payment");

    await estm.authenticateBuyer({ vehicleRegNo, email, mykad, card: buyer });
    if (!reaches("vehicle")) return result("buyer", "before-payment");

    await estm.continueToVehicle();
    await estm.fillBuyerAndVehicleDetails(details);
    if (!reaches("seller")) return result("vehicle", "before-payment");

    await estm.continueToSeller();
    await estm.authenticateSeller({ mykad, card: seller });
    if (!reaches("jpjCheck")) return result("seller", "before-payment");

    await estm.continueToJpjCheck();
    if (!reaches("jpjEnquiry")) return result("jpjCheck", "before-payment");

    await estm.runJpjEnquiry();
    if (scenario.afterEnquiry) await scenario.afterEnquiry();
    if (!reaches("payment")) return result("jpjEnquiry", "before-payment");

    const where = await estm.goToPayment();
    if (where === "insurance") return result("insurance", "insurance-before-payment");

    await estm.configureAddOns(scenario.addOns ?? {});
    const paymentSummary = await estm.paymentSummary();
    const total = await estm.totalPayable().catch(() => undefined);
    if (!reaches("transfer")) return result("payment", "payment-page", { paymentSummary, total });

    // Arrival only: Step 6 "Done" (eLKM ticked) or the insurance plan page (eLKM unticked).
    // Nothing after it touches a dialog (EAINT-12253, 21.10).
    await estm.submitPayment(scenario.addOns?.lkm ? "estm-done" : "insurance");
    return result("transfer", routeAfterPayment(page.url()), { paymentSummary, total });
  } catch (e) {
    if (!borrowed) await mykad.close().catch(() => undefined);
    throw e;
  }
}

/** Release the reader a flow opened for itself. Safe when the spec passed its own `mykad`. */
export async function closeEstmFlow(result: EstmResult): Promise<void> {
  await result.mykad.removeCard().catch(() => undefined);
}

function routeAfterPayment(url: string): EstmRoute {
  if (insuranceArrival(url) === "estm-after-payment") return "insurance-after-payment";
  if (/estm\/transaction\/estm-sub\.do/.test(url)) return "estm-done";
  return "unknown";
}

function transactionIdFrom(url: string): string | undefined {
  const q = new URL(url).searchParams;
  return q.get("id") ?? q.get("transactionId") ?? q.get("estmTransactionId") ?? undefined;
}

// ------------------------------------------------------------- insurance quote

/**
 * `form`   — Get a Free Quote form open, nothing typed
 * `quoted` — quote requested, whatever the screen answered is on show
 */
export type InsuranceQuoteStep = "form" | "quoted";

export interface InsuranceQuoteScenario {
  /**
   * Default: the next number for `vehiclePrefix`. Insurance is wired to eSim on staging, so
   * every quote is simulated; a prefix eSim knows is likeliest to return one.
   */
  vehicleRegNo?: string;
  /** Default "VV" — the prefix the insurance probe used. */
  vehiclePrefix?: string;
  /** MyKad no. for Individual, company ROC for Company. Default CARDS.malaysianIndividual.NRIC. */
  buyerRef?: string;
  category?: BuyerCategory;
  /** Default "quoted". */
  stopAfter?: InsuranceQuoteStep;
}

export interface InsuranceQuoteResult {
  vehicleRegNo: string;
  stoppedAfter: InsuranceQuoteStep;
  /** The quote wizard's stage strip (Quotes · Optional Coverage · Payment · Confirm), or "(no stage strip)". */
  stage?: string;
  /** What the page objected to, in its own words. */
  complaints?: string[];
  page: Page;
  insurance: InsurancePage;
}

/**
 * Dealer home -> INSURANCE -> Get a Free Quote (-> request a quote).
 *
 * This is the direct entry, not the eSerahan divert. Where the divert lands, read
 * `EstmResult.route`; the plan screen it lands on (`insurance/plan/view.do`) is not driven
 * by any flow yet — no probe has walked past it.
 */
export async function runInsuranceQuote(page: Page, s: InsuranceQuoteScenario = {}): Promise<InsuranceQuoteResult> {
  const insurance = new InsurancePage(page);
  const vehicleRegNo = s.vehicleRegNo ?? nextVehicleNumber(s.vehiclePrefix ?? "VV");
  const done = (stoppedAfter: InsuranceQuoteStep, more: Partial<InsuranceQuoteResult> = {}): InsuranceQuoteResult => ({
    vehicleRegNo,
    stoppedAfter,
    ...more,
    page,
    insurance,
  });

  await new UcdHomePage(page).returnToDashboard();
  await insurance.openFreeQuote();
  if ((s.stopAfter ?? "quoted") === "form") return done("form");

  await insurance.requestQuote({
    vehicleRegNo,
    buyerRef: s.buyerRef ?? CARDS.malaysianIndividual.NRIC,
    category: s.category,
  });
  // The probe waited a fixed 8 s for the result to render; wait for the page to settle instead.
  await page.waitForLoadState("networkidle").catch(() => undefined);
  return done("quoted", { stage: await insurance.quoteStage(), complaints: await insurance.validationMessages() });
}
