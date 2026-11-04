/**
 * Insurance plan flow — the reusable entry point. Same shape as `stms.flow.ts`.
 *
 * Routes into the plan wizard (all walked live 2026-10-20, staging /eauto/, EAINT-12253 p06 / p09 / p15 / p16):
 *
 *  - `"freeQuote"` (default) — GET A FREE QUOTE. With NO eSTM for that vehicle + buyer IC the strip
 *    has only Quotes · Optional Coverage and Optional Coverage offers only "< Back": furthest stop
 *    `optionalCoverage`.
 *  - `"freeQuoteAfterEstm"` — GET A FREE QUOTE for the eSTM's OWN vehicle, after that eSTM is PAID,
 *    with the same buyer IC (Azfar 20.10 + 21.10; seen: OUP000010 → four steps and "Make Payment").
 *    A different vehicle with the same IC stays at Step 2 Optional Coverage with "< Back" only (p15
 *    OUP0030, 20.10; EAINT-12253 CH_TS4 OUP0167, 21.10), and so does an eSTM only saved at Step 4
 *    (FF_TS8 ON000160, 21.10). `estmVehicle` names a vehicle with such a paid eSTM (the quote goes on
 *    that vehicle; a different `vehicleRegNo` throws); omitted, the flow first completes (PAYS) an
 *    eSerahan with eLKM unticked for a new OUP vehicle (default buyer card; its insurance is left
 *    unbought on the plan page), goes Home and quotes THAT vehicle.
 *  - `"estm"` — eSerahan completed with eLKM unticked (PAYS the eSTM) → diverted AFTER payment to
 *    the plan page (`isDirectEstmFirstTime=true`).
 *  - `"estmVel069"` — eSerahan whose first JPJ enquiry is OK, then the eSTM enquiry answer is
 *    switched to VEL000069E before Step 4 → 5: diverted BEFORE payment to the plan page
 *    (`estmTransactionId=…`); the code is switched back to the GLB success code once there
 *    (knowledge/portals/ucd/portal.md "eSerahan — where the flow ends"). The caller passes the two
 *    switches (`estmCode.divert` / `estmCode.restore`); the flow ALWAYS calls `restore` (finally).
 *
 * With eSTM behind it the strip is **Quotes · Optional Coverage · Payment · Confirm**: Optional
 * Coverage "Make Payment" (`#confirm-plan`) → Step 3 Payment (`plan/payment.do`, the payment step),
 * PAY NOW → "Payment" Cancel / OK → Step 4 Confirm (`plan/complete.do`, the result).
 *
 * EAINT-12253 (BA 21.10.2026): the browser reminder shows at the END, after payment, not on Step 3:
 *  - eLKM unticked (`estm`, and the eSTM leg of `freeQuoteAfterEstm`): eSTM Step 6 shows NO reminder →
 *    redirected to Insurance Step 1 (Quotes) → **Insurance Step 4 Confirm** shows it.
 *  - VEL000069E (`estmVel069`): **Insurance Step 4 Confirm** shows it, then the eSTM continues and
 *    **eSTM Step 6** shows it too.
 * FINAL STOPS:
 *  - `paid` — Insurance Step 4 Confirm `view/ucd/insurance/plan/complete.do?transactionId=…`, marker
 *    "Thank you! Your payment has been successfully made." (`InsurancePage.step4Marker`). Every
 *    eSTM-backed route.
 *  - `estmCompleted` — `estmVel069` only: after `paid`, "Continue with eSerahan" (`#estmLkmDoneBtn`) →
 *    the eSTM is completed → eSTM Step 6 `view/ucd/estm/transaction/estm-sub.do`, marker its "Done".
 *    The screens between that button and Step 6 have NOT been walked yet (written 21.10 from the
 *    button seen in p16 + the BA's rule): the flow handles both "lands on eSTM Step 5 Payment, pays it"
 *    and "lands straight on Step 6", and throws with the URL otherwise.
 * EAINT-12253 (21.10): final-step stop returns on arrival; nothing after it touches a dialog. Neither
 * does the eSTM → insurance redirect (no helper on eSTM Step 6 or on the insurance landing). On the way
 * to `estmCompleted` the flow presses NOTHING on Insurance Step 4 except "Continue with eSerahan": a
 * reminder there is the caller's (`onInsuranceStep4`), and with a dialog still up the flow throws.
 * `payment` (Step 3) is kept as it was: returns as soon as Step 3 has loaded. RHB is keyed on the vehicle prefix (OU / OUP / OUPV = IF), so pass
 * `aroundPayment: (f) => withRhbOk("OU", f)` for any route that pays (eSTM and/or insurance). This
 * flow never touches eSim itself.
 *
 * Side effects: every quote creates an insurance transaction (Quotation); the eSTM routes create
 * and (except estmVel069) PAY an eSerahan and need the MyKad emulator.
 * Register: UNVERIFIED (src/flows/README.md).
 */

import type { Page } from "@playwright/test";
import { InsurancePage, type BuyerCategory } from "@pages/ucd/insurance.page";
import { UcdHomePage } from "@pages/ucd/ucd-home.page";
import { CARDS } from "@data/cards";
import { nextVehicleNumber } from "@data/generator";
import { runEstmFlow, type EstmScenario } from "@flows/estm.flow";
import type { MyKadClient } from "@fixtures/mykad";
import { EstmWizardPage } from "@pages/ucd/estm-wizard.page";
import { awaitFinalScreen } from "@pages/final-step";
import type { Locator } from "@playwright/test";

/** A modal of any kind up on the page (jQuery UI overlay, Bootstrap modal, campaign modal). Reads only. */
async function modalUp(page: Page): Promise<boolean> {
  return page
    .locator(".ui-widget-overlay:visible, .modal.show:visible, .modal.in:visible, .modal-campaign:visible")
    .count()
    .then((n) => n > 0)
    .catch(() => false);
}

async function waitVisible(l: Locator, what: string): Promise<Locator> {
  try {
    await l.first().waitFor({ state: "visible", timeout: 30_000 });
  } catch {
    throw new Error(`Could not find "${what}" on ${l.page().url()}`);
  }
  return l.first();
}

/**
 * `form`             — free quote: the GET A FREE QUOTE form open, nothing typed
 * `quotes`           — plan wizard step 1 Quotes, insurer cards shown
 * `optionalCoverage` — an insurer SELECTed: step 2 Optional Coverage
 * `payment`          — eSTM-backed routes: ON step 3 Payment. Nothing pressed after arrival (before paying)
 * `payConfirm`       — PAY NOW pressed: "Payment" Cancel / OK dialog OPEN. Nothing paid
 * `paid`             — FINAL. OK pressed (PAYS): ON step 4 Confirm, returned on arrival
 * `estmCompleted`    — FINAL, estmVel069 only. After `paid`: "Continue with eSerahan", the eSTM completed
 *                      (PAYS the eSTM if it lands on its Step 5): ON eSTM Step 6, returned on arrival
 */
export type InsurancePlanStep = "form" | "quotes" | "optionalCoverage" | "payment" | "payConfirm" | "paid" | "estmCompleted";
const ORDER: InsurancePlanStep[] = ["form", "quotes", "optionalCoverage", "payment", "payConfirm", "paid", "estmCompleted"];

export type InsuranceRoute = "freeQuote" | "freeQuoteAfterEstm" | "estm" | "estmVel069";
type Around = <T>(run: () => Promise<T>) => Promise<T>;

export interface InsurancePlanScenario {
  route?: InsuranceRoute;
  vehicleRegNo?: string;
  /**
   * Default "OUP". eSim answers the eSTM enquiry by the vehicle's FIRST TWO letters (an "OUPV" row was
   * ignored, 20.10.2026), so estmVel069 switches OUR "OU" estm-enquiry-resp row.
   */
  vehiclePrefix?: string;
  /** Free quote: MyKad no. (Individual) or ROC (Company). Default CARDS.malaysianIndividual.NRIC (= the eSTM buyer). */
  buyerRef?: string;
  category?: BuyerCategory;
  /**
   * freeQuoteAfterEstm: a vehicle whose own eSTM with this buyer is already PAID; the quote is for it. Omitted: one is
   * made (and paid) first. Never with a different `vehicleRegNo` (throws: that quote cannot pass Step 2).
   */
  estmVehicle?: string;
  /** Which insurer card to SELECT, 0-based. Default 0. */
  planIndex?: number;
  /** eSTM routes: extra eSerahan options. */
  estm?: Omit<EstmScenario, "stopAfter" | "addOns" | "mykad" | "vehicleRegNo" | "afterEnquiry">;
  /** eSTM routes: the `mykad` fixture. */
  mykad?: MyKadClient;
  /** estmVel069: switch the vehicle's eSTM enquiry answer to VEL000069E / back to GLB000000I. */
  estmCode?: { divert: () => Promise<void>; restore: () => Promise<void> };
  /** Wraps every payment (eSTM and insurance), e.g. `(f) => withRhbOk("OU", f)`. */
  aroundPayment?: Around;
  /** Default: "optionalCoverage" for "freeQuote", "payment" otherwise. */
  stopAfter?: InsurancePlanStep;
  /**
   * `estmCompleted` only: called ON Insurance Step 4 Confirm, before "Continue with eSerahan". The BA
   * says the browser reminder shows there in Firefox; the flow never closes it. Take the evidence here
   * and close it yourself (with the reminder's own Continue) if the eSTM is to go on.
   */
  onInsuranceStep4?: (page: Page) => Promise<void>;
  /** `estmCompleted` only, if the eSTM lands back on its Step 5: add-ons to choose there. Default both off. */
  estmAddOns?: { lkm?: boolean | 6 | 12; evoc?: boolean };
}

export interface InsurancePlanResult {
  route: InsuranceRoute;
  vehicleRegNo: string;
  stoppedAfter: InsurancePlanStep;
  transactionId?: string;
  /** The eSTM leg, when the route made one: where it ended. */
  estmRoute?: string;
  steps?: { steps: string[]; active: string };
  selected?: string;
  actions?: { confirmPlan: boolean; savePlan: boolean; back: boolean };
  reference?: string;
  payDialogText?: string;
  confirm?: { eCertificateNo: string; paymentAmount: string; url: string };
  /** `estmCompleted`: whether "Continue with eSerahan" led to the eSTM's Step 5 (then paid) or straight to Step 6. */
  estmContinuedVia?: "payment" | "step6";
  /** `estmCompleted`: the eSTM Step 6 URL. */
  estmFinalUrl?: string;
  page: Page;
  insurance: InsurancePage;
}

export async function runInsurancePlanFlow(page: Page, s: InsurancePlanScenario = {}): Promise<InsurancePlanResult> {
  const route = s.route ?? "freeQuote";
  const stopAfter = s.stopAfter ?? (route === "freeQuote" ? "optionalCoverage" : "payment");
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  if (route === "freeQuote" && stopAt > ORDER.indexOf("optionalCoverage")) {
    throw new Error(`Route "freeQuote" stops at Optional Coverage (no Make Payment without an eSTM); use "freeQuoteAfterEstm" for "${stopAfter}".`);
  }
  if ((route === "estm" || route === "estmVel069") && stopAfter === "form") throw new Error(`Route "${route}" has no "form" stop.`);
  if (route === "estmVel069" && !s.estmCode) throw new Error(`Route "estmVel069" needs estmCode.divert / estmCode.restore.`);
  if (route === "freeQuoteAfterEstm" && s.estmVehicle && s.vehicleRegNo && s.vehicleRegNo !== s.estmVehicle) {
    throw new Error(
      `Route "freeQuoteAfterEstm": the free quote reaches Payment only for the eSTM's own vehicle (${s.estmVehicle}); ` +
        `vehicleRegNo ${s.vehicleRegNo} would stop at Step 2 Optional Coverage (p15 20.10, EAINT-12253 CH_TS4 21.10). ` +
        `Pass only estmVehicle, or neither (the flow pays its own eSTM and quotes that vehicle).`,
    );
  }
  if (stopAfter === "estmCompleted" && route !== "estmVel069") {
    throw new Error(`"estmCompleted" exists only on route "estmVel069" (the eSTM was diverted before its payment); route "${route}" already paid its eSTM.`);
  }
  const reaches = (st: InsurancePlanStep) => ORDER.indexOf(st) <= stopAt;
  const around: Around = s.aroundPayment ?? ((run) => run());
  const needsEstm = route === "estm" || route === "estmVel069" || (route === "freeQuoteAfterEstm" && !s.estmVehicle);
  if (needsEstm && !s.mykad) throw new Error(`Route "${route}" drives an eSerahan: pass the mykad fixture.`);

  const insurance = new InsurancePage(page);
  const vehicleRegNo =
    s.vehicleRegNo ?? s.estmVehicle ?? nextVehicleNumber(s.vehiclePrefix ?? "OUP", 4);
  const r: Partial<InsurancePlanResult> = {};
  const out = (stoppedAfter: InsurancePlanStep): InsurancePlanResult => ({
    route,
    vehicleRegNo,
    stoppedAfter,
    transactionId: new URL(page.url()).searchParams.get("transactionId") || undefined,
    ...r,
    page,
    insurance,
  });

  let restored = false;
  const restore = async () => {
    if (route === "estmVel069" && !restored) {
      restored = true;
      await s.estmCode!.restore();
    }
  };

  try {
    await new UcdHomePage(page).returnToDashboard();
    if (route === "estm" || (route === "freeQuoteAfterEstm" && !s.estmVehicle)) {
      const estm = await around(() => runEstmFlow(page, { ...s.estm, vehicleRegNo, mykad: s.mykad, addOns: {}, stopAfter: "transfer" }));
      r.estmRoute = estm.route;
      if (route === "estm" && estm.route !== "insurance-after-payment") {
        throw new Error(`eSerahan ended on "${estm.route}" (${estm.finalUrl}), not on the insurance plan page.`);
      }
      if (route === "freeQuoteAfterEstm") await new UcdHomePage(page).returnToDashboard();
    }
    if (route === "estmVel069") {
      await s.estmCode!.restore(); // start from the success code
      const estm = await runEstmFlow(page, { ...s.estm, vehicleRegNo, mykad: s.mykad, addOns: {}, stopAfter: "payment", afterEnquiry: s.estmCode!.divert }); // diverted = never reaches payment; not diverted = stops ON eSTM payment unpaid
      r.estmRoute = estm.route;
      if (estm.route !== "insurance-before-payment") throw new Error(`VEL000069E did not divert: eSerahan ended on "${estm.route}" (${estm.finalUrl}).`);
      await restore(); // "switch back to the GLB… success code before completing"
    }
    if (route === "freeQuote" || route === "freeQuoteAfterEstm") {
      await insurance.openFreeQuote();
      if (!reaches("quotes")) return out("form");
      await insurance.requestQuote({ vehicleRegNo, buyerRef: s.buyerRef ?? CARDS.malaysianIndividual.NRIC, category: s.category });
    }
    await page.waitForURL(/insurance\/plan\/view\.do/, { timeout: 90_000 });
    await insurance.planSelectButtons().first().waitFor({ state: "visible", timeout: 60_000 });
    if (!reaches("optionalCoverage")) {
      r.steps = await insurance.planSteps();
      return out("quotes");
    }

    r.selected = await insurance.selectPlan(s.planIndex ?? 0);
    r.steps = await insurance.planSteps();
    r.actions = await insurance.optionalCoverageActions();
    if (!reaches("payment")) return out("optionalCoverage");

    await insurance.confirmPlanToPayment();
    if (!reaches("payConfirm")) return out("payment"); // nothing after arrival (EAINT-12253)

    r.reference = await insurance.paymentReference();
    r.steps = await insurance.planSteps();
    r.payDialogText = await insurance.openPaymentDialog();
    if (!reaches("paid")) return out("payConfirm");

    r.confirm = await around(() => insurance.confirmPayment());
    if (!reaches("estmCompleted")) return out("paid"); // FINAL: Insurance Step 4, nothing after arrival (EAINT-12253)

    // estmVel069: back into the eSTM. Insurance Step 4 is left exactly as it arrived unless the caller acts.
    if (s.onInsuranceStep4) await s.onInsuranceStep4(page);
    if (await modalUp(page)) {
      throw new Error(
        `Insurance Step 4 has a dialog up (the browser reminder?). The flow does not close it: pass onInsuranceStep4 to take the evidence and close it.`,
      );
    }
    const estm = new EstmWizardPage(page);
    await (await waitVisible(insurance.continueWithEstmButton, "Continue with eSerahan (#estmLkmDoneBtn)")).click();
    await page.waitForURL(/estm\/transaction\/(payment|estm-sub)\.do/, { timeout: 90_000 });
    if (/estm\/transaction\/payment\.do/.test(page.url())) {
      r.estmContinuedVia = "payment";
      await estm.configureAddOns(s.estmAddOns ?? {});
      await around(() => estm.submitPayment("estm-done")); // returns on arrival at eSTM Step 6
    } else {
      r.estmContinuedVia = "step6";
      await awaitFinalScreen(page, estm.doneButton, "eSerahan Step 6: Done");
    }
    r.estmFinalUrl = page.url();
    return out("estmCompleted"); // FINAL: eSTM Step 6, nothing after arrival (EAINT-12253)
  } finally {
    await restore().catch((e) => console.log(`!! eSTM code restore failed: ${(e as Error).message}`));
  }
}
