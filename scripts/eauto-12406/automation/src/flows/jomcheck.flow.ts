/**
 * JomCheck purchase flow — the reusable entry point.
 *
 * Same shape as `stms.flow.ts`: `stopAfter` names the step just COMPLETED, every
 * option has a default, and the result carries what the next step needs.
 *
 *   // stand on the search form
 *   await runJomCheckFlow(page, { stopAfter: "form" });
 *
 *   // Submit (creates a Pending transaction) and read the result line
 *   const r = await runJomCheckFlow(page, { stopAfter: "submitted" });
 *   r.result   // "Vehicle number found. Pay now (RM20.00 + 8% Service Tax) to purchase the report."
 *
 *   // the "Payment" confirm dialog open, nothing paid (default)
 *   await runJomCheckFlow(page, { stopAfter: "payConfirm" });
 *
 *   // PAYS (RM20.00 + 8% on staging): Yes, then ON the result, returned on arrival
 *   await runJomCheckFlow(page, { stopAfter: "paid", expectedPrice: "20.00", aroundPayment: (f) => withRhbOk("OU", f) });
 *
 * ── FINAL STOP: `paid` (added 21.10.2026) ─────────────────────────────────────
 * Final screen: the SAME page `view/ucd/jomcheck/transaction/view.do?transactionId=…` (no new URL),
 * Result "Report is retrieved successfully. You can download the report now or access it later
 * through the JomCheck report listing." with **Download Report** `#to-view-report` (marker) and
 * Search Another Vehicle `#to-search-new-vehicle` (probe p22, OUP0039 paid RM21.60, 20.10.2026).
 * EAINT-12253 (21.10): final-step stop returns on arrival; nothing after it touches a dialog. The BA
 * moved the reminder from "before payment" to this result, so the Payment dialog is no longer the
 * last step. `paid` is guarded: with `expectedPrice` set, a different "Pay now (RMx" price is
 * refused before Yes (the dialog is closed with No and the flow throws).
 *
 * ── PRECONDITIONS ──────────────────────────────────────────────────────────────
 *  - Signed in as a dealer (take `ucdSession` in the spec).
 *  - The vehicle must be "found". On staging /eauto/ OUP0001, whose prefix eSim's
 *    `jomcheck-enquiry-resp` does not list, came back "Vehicle number found" (20.10.2026);
 *    whether that answer is eSim's default or the ezAuto UAT gateway is not known
 *    (EAINT-12339 Q-ROUTE). Default prefix OUP = the EAINT-12253 sub-prefix of the
 *    QA-owned OU (RHB IF), so even an accidental payment would be refused: `paid` needs
 *    `aroundPayment: (f) => withRhbOk("OU", f)` (`@fixtures/esim-switch`, VPN) to go through.
 *  - No MyKad / thumbprint on this path.
 *
 * Every Submit CREATES a Pending JomCheck transaction on the signed-in company.
 * Register: UNVERIFIED (src/flows/README.md).
 */

import type { Page } from "@playwright/test";
import { JomCheckPage } from "@pages/ucd/jomcheck.page";
import { nextVehicleNumber } from "@data/generator";

/**
 * `form`       — on Get JomCheck Reports, nothing typed
 * `submitted`  — Submit pressed: Pending transaction created, Result + Pay Now on screen
 * `payConfirm` — Pay Now pressed: the "Payment" Yes/No dialog is OPEN. Nothing paid
 * `paid`       — FINAL. Yes pressed (PAYS): ON the result "Report is retrieved successfully…" with
 *                Download Report, returned on arrival; or an RHB refusal (see `payment`)
 */
export type JomCheckStep = "form" | "submitted" | "payConfirm" | "paid";
const ORDER: JomCheckStep[] = ["form", "submitted", "payConfirm", "paid"];
type Around = <T>(run: () => Promise<T>) => Promise<T>;
const noWrap: Around = (run) => run();

export interface JomCheckScenario {
  /** Search by vehicle number. Default: a new OUP vehicle (see preconditions). */
  vehicleRegNo?: string;
  /**
   * Search by chassis number instead (`#chassisNoRadio` + `#vehicleChassisNo`). First submitted and paid 21.10.2026 by
   * EAINT-12253 CH_TS8 on /uat1/ (406/ AH-4878: "Chassis number found. Pay now (RM20.00 + 8% Service Tax) to purchase
   * the report.", paid); its `paid` stop is proved by the chassis test in the verify spec.
   */
  chassisNo?: string;
  /** Prefix for a generated vehicle number. Default "OUP". */
  vehiclePrefix?: string;
  /** Default "payConfirm". */
  stopAfter?: JomCheckStep;
  /** At `payConfirm`, close the dialog with No before returning. Default false (leave it open). */
  closeDialog?: boolean;
  /** `paid` only: refuse to press Yes unless the result's "Pay now (RMx" price equals this (e.g. "20.00"). */
  expectedPrice?: string;
  /** `paid` only: wraps the Yes, e.g. `(f) => withRhbOk("OU", f)`. The flow never touches eSim itself. */
  aroundPayment?: Around;
}

export interface JomCheckResult {
  vehicleRegNo?: string;
  chassisNo?: string;
  stoppedAfter: JomCheckStep;
  transactionId?: string;
  /** The Result line after Submit. */
  result?: string;
  /** The Payment dialog's text at `payConfirm`. */
  payDialogText?: string;
  /** The price in "Pay now (RMx + 8% Service Tax)", e.g. "20.00". */
  price?: string;
  /** `paid`: the result paragraph ("Report is retrieved successfully…"), or RHB's refusal. */
  payment?: { outcome: "paid"; result: string } | { outcome: "refused"; message: string };
  page: Page;
  jomcheck: JomCheckPage;
}

export async function runJomCheckFlow(page: Page, s: JomCheckScenario = {}): Promise<JomCheckResult> {
  const stopAfter = s.stopAfter ?? "payConfirm";
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (st: JomCheckStep) => ORDER.indexOf(st) <= stopAt;

  const jomcheck = new JomCheckPage(page);
  const vehicleRegNo = s.chassisNo ? undefined : s.vehicleRegNo ?? nextVehicleNumber(s.vehiclePrefix ?? "OUP", 4);
  const out = (stoppedAfter: JomCheckStep, more: Partial<JomCheckResult> = {}): JomCheckResult => ({
    vehicleRegNo,
    chassisNo: s.chassisNo,
    stoppedAfter,
    transactionId: jomcheck.transactionId(),
    ...more,
    page,
    jomcheck,
  });

  await jomcheck.startPurchase();
  if (!reaches("submitted")) return out("form");

  await jomcheck.submitSearch({ vehicleRegNo, chassisNo: s.chassisNo });
  const result = await jomcheck.resultText();
  if (!reaches("payConfirm")) return out("submitted", { result });

  if (!(await jomcheck.payNowButton.isVisible().catch(() => false))) {
    throw new Error(`No Pay Now after Submit; the result said: "${result}"`);
  }
  const price = /Pay now \(RM\s*([\d.]+)/i.exec(result)?.[1] ?? "";
  const payDialogText = await jomcheck.openPayNowDialog();
  if (!reaches("paid")) {
    if (s.closeDialog) await jomcheck.cancelPayNowDialog();
    return out("payConfirm", { result, payDialogText, price });
  }

  if (s.expectedPrice !== undefined && price !== s.expectedPrice) {
    await jomcheck.cancelPayNowDialog();
    throw new Error(`JomCheck price is RM${price || "?"}, expected RM${s.expectedPrice}. Not paid. Result: "${result}"`);
  }
  const payment = await (s.aroundPayment ?? noWrap)(() => jomcheck.confirmPayment());
  return out("paid", { result, payDialogText, price, payment }); // FINAL: nothing after arrival (EAINT-12253)
}
