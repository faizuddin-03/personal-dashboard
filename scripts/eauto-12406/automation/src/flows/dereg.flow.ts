/**
 * AATF flows: e-Dereg Pre-Checking and Deregistration. Same shape as `stms.flow.ts`.
 *
 *   await runDeregPrecheckFlow(page, { stopAfter: "payment" });                     // ON pre-check Step 2 Payment
 *   await runDeregPrecheckFlow(page, { stopAfter: "paid", aroundPayment: (f) => withRhbOk("OU", f) });
 *   await runDeregFlow(page, { mykad, precheck: { aroundPayment: (f) => withRhbOk("OU", f) }, stopAfter: "payment" });
 *
 * Walked live 2026-10-20 on staging /eauto/ as azfaraatf (persona `aatf`) with the MyKad Reader
 * Emulator — screens, ids and dialogs in `pages/aatf/*.page.ts`. The page must ALREADY be signed in
 * as an AATF user (`login.as("aatf")`).
 *
 * FINAL STOPS (EAINT-12253, BA 21.10.2026: the browser reminder shows on the final step AFTER payment):
 *  - Pre-check `paid` — Step 3 Result `view/aatf/dereg/precheck/transaction/result.do?id=…`, marker
 *    "Enquiry Response" (`DeregPrecheckPage.resultMarker`).
 *  - Dereg `deregistered` — Step 6 `view/aatf/dereg/transaction/jpj-sub.do?id=…`, marker
 *    "JPJ Deregistration Status" (`DeregWizardPage.step6Marker`).
 * EAINT-12253 (21.10): final-step stop returns on arrival; nothing after it touches a dialog. The native
 * confirm before Step 6 is answered by a one-shot handler that is removed again, so none is left to
 * answer anything on the final screen. `payment` (pre-check Step 2 / Dereg Step 5) is kept as it was:
 * it returns as soon as that step has loaded. With `precheck`, the pre-check's Result is the END of the
 * pre-check transaction: the Dereg journey leaves it by HOME and closes nothing there; a dialog still up
 * on it (the reminder in Firefox) is the caller's (`precheck.onResult`), else the flow throws.
 *
 * Data and money (staging): every pre-check that reaches Step 2 creates a transaction; paying costs
 * RM10.40 and is RHB-keyed on the vehicle prefix (OU / OUP = IF → switch OU to OK around it,
 * `withRhbOk("OU", …)`, VPN). Deregistration needs a PAID, approved pre-check for the same vehicle
 * within 6 months (`precheck` option runs and pays one first), creates a Dereg transaction at Step 2,
 * and a vehicle + owner may have only one Dereg transaction ("Transaksi yang sama" otherwise), so use
 * a fresh OUP vehicle per run. `deregistered` PAYS and DEREGISTERS the (simulated) vehicle.
 * Register: UNVERIFIED (src/flows/README.md).
 */

import * as path from "node:path";
import type { Page } from "@playwright/test";
import { DeregPrecheckPage } from "@pages/aatf/dereg-precheck.page";
import { DeregWizardPage, DeregOwnerCategory } from "@pages/aatf/dereg-wizard.page";
import { MyKadClient, type MatchResult } from "@fixtures/mykad";
import { CARDS } from "@data/cards";
import type { CardLike } from "@pages/wizard.page";
import { nextVehicleNumber, nextMobile, randomEngineNo, randomChassisNo } from "@data/generator";

type Around = <T>(run: () => Promise<T>) => Promise<T>;
const noWrap: Around = (run) => run();
/** Wraps a paying click of the embedded pre-check; `attempt` says which ("first" = consent Next, "retry" = retry pop-up's Next). */
export type EmbeddedAround = <T>(run: () => Promise<T>, attempt: "first" | "retry") => Promise<T>;
export type EmbeddedPrecheckStep = "gate" | "payment" | "retry" | "result" | "closed";
const UPLOADS = path.join(__dirname, "..", "..", "assets", "uploads");

// ── e-Dereg Pre-Checking ──────────────────────────────────────────────────────

/**
 * `form`       — Step 1 open, nothing typed
 * `vehicle`    — Step 1 filled and agreed, ENQUIRE NOW visible (nothing created)
 * `payment`    — ENQUIRE NOW + Yes (CREATES the transaction): ON Step 2 Payment (before paying)
 * `payConfirm` — NEXT pressed: "Are you sure to make payment? …" Yes / No OPEN. Nothing paid
 * `paid`       — FINAL. Yes (PAYS RM10.40): ON Step 3 Result, returned on arrival
 */
export type PrecheckStep = "form" | "vehicle" | "payment" | "payConfirm" | "paid";
const PC_ORDER: PrecheckStep[] = ["form", "vehicle", "payment", "payConfirm", "paid"];

export interface PrecheckScenario {
  vehicleRegNo?: string;
  /** Default "OUP". */
  vehiclePrefix?: string;
  email?: string;
  stopAfter?: PrecheckStep;
  aroundPayment?: Around;
}

export interface PrecheckResult {
  vehicleRegNo: string;
  stoppedAfter: PrecheckStep;
  transactionId?: string;
  total?: string;
  payDialogText?: string;
  result?: { enquiryResponse: string; note: string; url: string };
  page: Page;
  precheck: DeregPrecheckPage;
}

export async function runDeregPrecheckFlow(page: Page, s: PrecheckScenario = {}): Promise<PrecheckResult> {
  const stopAfter = s.stopAfter ?? "payment";
  const stopAt = PC_ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (st: PrecheckStep) => PC_ORDER.indexOf(st) <= stopAt;
  const precheck = new DeregPrecheckPage(page);
  const vehicleRegNo = s.vehicleRegNo ?? nextVehicleNumber(s.vehiclePrefix ?? "OUP", 4);
  const r: Partial<PrecheckResult> = {};
  const out = (stoppedAfter: PrecheckStep): PrecheckResult => ({
    vehicleRegNo,
    stoppedAfter,
    transactionId: new URL(page.url()).searchParams.get("id") ?? undefined,
    ...r,
    page,
    precheck,
  });

  await precheck.open();
  if (!reaches("vehicle")) return out("form");
  await precheck.fillVehicle({ vehicleRegNo, email: s.email ?? "qa.12253@example.test" });
  if (!reaches("payment")) return out("vehicle");
  await precheck.enquire();
  if (!reaches("payConfirm")) return out("payment"); // nothing after arrival (EAINT-12253)
  r.total = await precheck.totalPayable();
  r.payDialogText = await precheck.openPaymentDialog();
  if (!reaches("paid")) return out("payConfirm");
  r.result = await (s.aroundPayment ?? noWrap)(() => precheck.confirmPayment());
  return out("paid"); // FINAL: Step 3 Result, nothing after arrival (EAINT-12253)
}

// ── Deregistration ────────────────────────────────────────────────────────────

/**
 * `category`         — owner category chosen (YA): on Step 1
 * `owner`            — PERINGATAN Yes + owner MyKad read, Next visible
 * `vehicle`          — Step 2 filled (pre-check line read), Next not pressed
 * `ownerDeclaration` — Step 2 Next (CREATES the Dereg transaction) + owner declaration signed: on Step 3 AATF declaration
 * `aatf`             — Step 3: AATF declaration + login user's MyKad, Next visible
 * `jpjCheck`         — on Step 4
 * `jpjEnquiry`       — JPJ enquiry run, result on screen
 * `payment`          — ON Step 5 Payment (before paying). Nothing after arrival
 * `payConfirm`       — Step 5 Next pressed; the NATIVE confirm read and DISMISSED (nothing paid)
 * `deregistered`     — FINAL. Next + confirm accepted (PAYS + DEREGISTERS): ON Step 6, returned on arrival
 */
export type DeregStep = "category" | "owner" | "vehicle" | "ownerDeclaration" | "aatf" | "jpjCheck" | "jpjEnquiry" | "payment" | "payConfirm" | "deregistered";
const DR_ORDER: DeregStep[] = ["category", "owner", "vehicle", "ownerDeclaration", "aatf", "jpjCheck", "jpjEnquiry", "payment", "payConfirm", "deregistered"];

export interface DeregScenario {
  /** A vehicle with a PAID approved pre-check. Omitted with `precheck` set: a new OUP vehicle is pre-checked first. */
  vehicleRegNo?: string;
  /**
   * Run (and PAY) an e-Dereg pre-check for the vehicle first. `onResult` is called ON the pre-check's
   * Step 3 Result (its final step: the reminder shows there in Firefox) before the flow leaves it; the
   * flow never closes a dialog there itself.
   */
  precheck?: { aroundPayment?: Around; onResult?: (page: Page) => Promise<void> };
  /**
   * The vehicle has NO pre-check: Step 2 runs the EMBEDDED e-Dereg Pre-Checking and PAYS it (RM10.40). Corrected
   * 21.10.2026 pm (cr-triage, CH_TS9): the consent pop-up IS the payment screen — e-mail, Payment Summary, and its Next
   * creates AND pays the pre-check. Payment OK → the result pop-up → Close. Payment refused → the page's alert, then the
   * payment (retry) pop-up → its Next pays again → the result pop-up → Close.
   *
   * `aroundPayment` wraps EVERY paying click: the consent Next (`attempt` "first") and, if the first payment was refused,
   * the retry pop-up's Next (`attempt` "retry"). A plain `(f) => withRhbOk("OU", f)` wraps both the same way.
   *
   * `onStep` sees each screen as it stands: "gate" = consent pop-up open, nothing typed or created; "payment" = the
   * consent pop-up with the e-mail typed, BEFORE its Next (the Payment Summary is there; nothing created or paid);
   * "retry" = ONLY after a refused first payment: the payment (retry) pop-up, nothing pressed on it; "result" = the result
   * pop-up ON ARRIVAL after the payment, the pre-check's FINAL step; "closed" = back on Step 2 after Close. Nothing in the
   * flow touches the result pop-up except Close, after `onStep("result")`. Which path ran is in
   * `result.embeddedPrecheck.paidOn`. Not with `precheck`. Omitting `vehicleRegNo` makes a new OUP vehicle.
   */
  embeddedPrecheck?: { email?: string; aroundPayment?: EmbeddedAround; onStep?: (at: EmbeddedPrecheckStep, text: string) => Promise<void> };
  /** Called on arrival at Dereg Step 5 Payment (before anything is pressed there). Added 21.10.2026 (EAINT-12253). */
  onPayment?: (page: Page) => Promise<void>;
  ownerCategory?: DeregOwnerCategory;
  /** Vehicle owner's card. Default CARDS.malaysianIndividual. */
  owner?: CardLike;
  /** The AATF login user's own card. Default CARDS.malaysianIndividual (= azfaraatf main user's NRIC). */
  aatfUser?: CardLike;
  matchResult?: MatchResult;
  /** Default "payment". */
  stopAfter?: DeregStep;
  /** Wraps the Step 5 payment (`deregistered`). */
  aroundPayment?: Around;
  mykad?: MyKadClient;
}

export interface DeregResult {
  vehicleRegNo: string;
  stoppedAfter: DeregStep;
  transactionId?: string;
  precheck?: PrecheckResult["result"];
  precheckLine?: string;
  /**
   * `embeddedPrecheck`: what each screen said (gate line, consent pop-up on opening, consent pop-up before Next =
   * `paymentText`, retry pop-up, result pop-up), the Step 2 line after Close, which payment paid (`paidOn`: "first" =
   * the consent Next, "retry" = the retry pop-up's Next) and the refusal alert(s) of a refused first payment.
   */
  embeddedPrecheck?: { gateLine: string; consentText: string; paymentText?: string; paidOn: "first" | "retry"; refusal?: string; retryText?: string; resultText?: string; lineAfter?: string };
  jpj?: { responseCode: string; status: string };
  payConfirmText?: string;
  deregistration?: { status: string; message: string };
  page: Page;
  dereg: DeregWizardPage;
}

export async function runDeregFlow(page: Page, s: DeregScenario = {}): Promise<DeregResult> {
  const stopAfter = s.stopAfter ?? "payment";
  const stopAt = DR_ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (st: DeregStep) => DR_ORDER.indexOf(st) <= stopAt;
  if (!s.vehicleRegNo && !s.precheck && !s.embeddedPrecheck) throw new Error("Deregistration needs a pre-checked vehicle: pass vehicleRegNo, precheck or embeddedPrecheck.");
  if (s.precheck && s.embeddedPrecheck) throw new Error("Pass precheck OR embeddedPrecheck, not both.");

  const r: Partial<DeregResult> = {};
  let vehicleRegNo = s.vehicleRegNo ?? (s.embeddedPrecheck ? nextVehicleNumber("OUP", 4) : "");
  if (s.precheck) {
    const pc = await runDeregPrecheckFlow(page, { vehicleRegNo: s.vehicleRegNo, stopAfter: "paid", aroundPayment: s.precheck.aroundPayment });
    vehicleRegNo = pc.vehicleRegNo;
    r.precheck = pc.result;
    if (!/Able to proceed/i.test(pc.result?.note ?? "")) throw new Error(`Pre-check for ${vehicleRegNo} did not clear: ${JSON.stringify(pc.result)}`);
    if (s.precheck.onResult) await s.precheck.onResult(page);
    const modal = await page
      .locator(".ui-widget-overlay:visible, .modal.show:visible, .modal.in:visible, .modal-campaign:visible")
      .count()
      .catch(() => 0);
    if (modal > 0) {
      throw new Error(`The pre-check Result has a dialog up (the browser reminder?). The flow does not close it: pass precheck.onResult to take the evidence and close it.`);
    }
  }

  const dereg = new DeregWizardPage(page);
  const out = (stoppedAfter: DeregStep): DeregResult => ({
    vehicleRegNo,
    stoppedAfter,
    transactionId: new URL(page.url()).searchParams.get("id") ?? undefined,
    ...r,
    page,
    dereg,
  });

  await dereg.startNewTransaction();
  await dereg.chooseOwnerCategory(s.ownerCategory);
  if (!reaches("owner")) return out("category");

  const borrowed = s.mykad !== undefined;
  const mykad = s.mykad ?? new MyKadClient();
  if (!borrowed) await mykad.connect();
  try {
    await mykad.removeCard();
    await mykad.setMatchResult(s.matchResult ?? "Identical");
    const owner = s.owner ?? CARDS.malaysianIndividual;
    await dereg.authenticateOwner({ mykad, card: owner });
    if (!reaches("vehicle")) return out("owner");

    await dereg.continueToVehicle();
    if (s.embeddedPrecheck) {
      const e = s.embeddedPrecheck;
      const on = e.onStep ?? (async () => undefined);
      const around: EmbeddedAround = e.aroundPayment ?? ((run) => run());
      const gate = await dereg.openEmbeddedPrecheck(vehicleRegNo); // creates nothing
      r.embeddedPrecheck = { gateLine: gate.line, consentText: gate.popup, paidOn: "first" };
      await on("gate", `${gate.line} || ${gate.popup}`);
      // The consent pop-up IS the pre-check's payment screen (Payment Summary RM10.40): "payment" is seen there, before Next.
      r.embeddedPrecheck.paymentText = await dereg.fillEmbeddedPrecheckConsent(e.email ?? "qa.12253@example.test");
      await on("payment", r.embeddedPrecheck.paymentText);
      const first = await around(() => dereg.agreeEmbeddedPrecheck(), "first"); // CREATES and PAYS the pre-check
      r.embeddedPrecheck.refusal = first.refusal;
      if (first.outcome === "paid") {
        r.embeddedPrecheck.resultText = first.text; // on arrival of the result pop-up
      } else {
        // The first payment was refused: the payment (retry) pop-up is up, nothing pressed on it.
        r.embeddedPrecheck.paidOn = "retry";
        r.embeddedPrecheck.retryText = first.text;
        await on("retry", first.text);
        r.embeddedPrecheck.resultText = await around(() => dereg.payEmbeddedPrecheck(), "retry"); // PAYS again; on arrival
      }
      await on("result", r.embeddedPrecheck.resultText); // the pre-check's final step: the caller's, untouched until Close
      r.embeddedPrecheck.lineAfter = await dereg.closeEmbeddedPrecheckResult();
      await on("closed", r.embeddedPrecheck.lineAfter);
    }
    r.precheckLine = await dereg.fillVehicleDetails({
      contactNo: nextMobile(),
      email: "qa.12253@example.test",
      consentFile: path.join(UPLOADS, "ic-director-1.png"),
      photoFile: path.join(UPLOADS, "ic-director-2.png"),
      vehicleRegNo,
      engineNo: randomEngineNo(),
      chassisNo: randomChassisNo(),
      make: "Honda",
      year: "2015",
    });
    if (!reaches("ownerDeclaration")) return out("vehicle");

    await dereg.continueToOwnerDeclaration();
    await mykad.removeCard();
    await dereg.ownerDeclaration({ mykad, card: owner });
    if (!reaches("aatf")) return out("ownerDeclaration");

    await mykad.removeCard();
    await dereg.authenticateAatf({ mykad, card: s.aatfUser ?? CARDS.malaysianIndividual });
    if (!reaches("jpjCheck")) return out("aatf");
  } finally {
    if (!borrowed) await mykad.close().catch(() => undefined);
  }

  await dereg.continueToJpjCheck();
  if (!reaches("jpjEnquiry")) return out("jpjCheck");
  r.jpj = await dereg.runJpjEnquiry();
  if (!reaches("payment")) return out("jpjEnquiry");
  await dereg.goToPayment();
  if (s.onPayment) await s.onPayment(page); // on arrival at Step 5, nothing pressed (EAINT-12253)
  if (!reaches("payConfirm")) return out("payment"); // nothing after arrival (EAINT-12253)
  if (!reaches("deregistered")) {
    r.payConfirmText = await dereg.readPaymentConfirm();
    return out("payConfirm");
  }
  r.deregistration = await (s.aroundPayment ?? noWrap)(() => dereg.payAndDeregister());
  return out("deregistered"); // FINAL: Step 6, nothing after arrival (EAINT-12253)
}
