/**
 * BMK purchase flow — the reusable entry point. Same shape as `stms.flow.ts`.
 *
 *   await runBmkFlow(page, { mykad, stopAfter: "payment" });      // ON Step 5 Payment (before paying)
 *   await runBmkFlow(page, { mykad, stopAfter: "payConfirm" });   // "Sure to submit this payment?" open
 *   await runBmkFlow(page, { mykad, stopAfter: "paid", expectedTotal: "30.80" });   // PAYS
 *
 * Wizard (walked live 2026-10-20, staging /eauto/, MyKad Reader Emulator):
 * 1 Owner · 2 Vehicle · 3 Dealer · 4 JPJ Check · 5 Payment · 6 Purchase. Thumbprints at
 * Step 1 (owner's card) and Step 3 (the LOGIN USER's own card). Selectors and screens:
 * `pages/ucd/bmk-wizard.page.ts`.
 *
 * FINAL STOP: `paid` — Step 6 Purchase `view/ucd/bmk/transaction/jpj-sub.do?id=…`, marker
 * "JPJ BMK Purchase Status:" (`BmkWizardPage.step6Marker`; SUCCESSFUL on 20.10.2026). An RHB
 * refusal stays on Step 5 with its dialog, read and never clicked.
 * EAINT-12253 (21.10): final-step stop returns on arrival; nothing after it touches a dialog (BA:
 * the reminder shows on the final step after payment, i.e. Step 6, not on Step 5). `payment` is kept
 * as it was: it returns the moment Step 5 has loaded, nothing after the arrival.
 *
 * eSim: `bmk-enquiry-resp` has no row for OU / OUP; the enquiry still answered "TRANSACTION
 * SUCCESSFUL / OK" (OUP0006, 20.10.2026). RHB is keyed on the vehicle prefix: OU / OUP = IF,
 * so `paid` on an OUP vehicle is REFUSED unless the caller first switches OU to OK
 * (`withRhbOk("OU", …)`, `@fixtures/esim-switch`, VPN needed).
 *
 * The page must ALREADY be signed in. Register: UNVERIFIED (src/flows/README.md).
 */

import type { Page } from "@playwright/test";
import { BmkWizardPage, BmkOwnerCategory } from "@pages/ucd/bmk-wizard.page";
import { MyKadClient, type MatchResult } from "@fixtures/mykad";
import { CARDS } from "@data/cards";
import type { CardLike } from "@pages/wizard.page";
import { nextVehicleNumber } from "@data/generator";

/**
 * `category`   — owner category chosen (Yes), on Step 1, nothing typed
 * `owner`      — Step 1 filled, owner MyKad read, Next visible (not pressed)
 * `vehicle`    — on Step 2 (prefilled), Next not pressed
 * `dealer`     — Step 3 consent + dealer MyKad read, Next visible (not pressed)
 * `jpjCheck`   — on Step 4, nothing submitted
 * `jpjEnquiry` — JPJ enquiry run, result + Make Payment on screen
 * `payment`    — ON Step 5 Payment. Nothing pressed after arrival (the payment step)
 * `payConfirm` — Step 5 Next pressed: "Sure to submit this payment?" No/Yes OPEN. Nothing paid
 * `paid`       — FINAL. Yes pressed (PAYS): ON Step 6 Purchase, returned on arrival; or RHB refusal
 *                (see `payment` in the result)
 */
export type BmkStep = "category" | "owner" | "vehicle" | "dealer" | "jpjCheck" | "jpjEnquiry" | "payment" | "payConfirm" | "paid";
const ORDER: BmkStep[] = ["category", "owner", "vehicle", "dealer", "jpjCheck", "jpjEnquiry", "payment", "payConfirm", "paid"];

export interface BmkScenario {
  ownerCategory?: BmkOwnerCategory;
  vehicleRegNo?: string;
  /** Default "OUP" (EAINT-12253 sub-prefix of the QA-owned OU). */
  vehiclePrefix?: string;
  /** Default CARDS.malaysianIndividual. */
  owner?: CardLike;
  /** The login user's own card. Default CARDS.malaysianIndividual (Azfar1); lane 2: CARDS.ucdE2E2Rep. */
  dealer?: CardLike;
  matchResult?: MatchResult;
  /** Default "payment" (Step 5, before paying). The final step is `paid`. */
  stopAfter?: BmkStep;
  /** `paid` only: refuse to press Yes unless Step 5's total equals this (e.g. "30.80"). */
  expectedTotal?: string;
  /** Pass the `mykad` fixture; omitted, the flow opens (and closes) its own reader. */
  mykad?: MyKadClient;
}

export interface BmkResult {
  vehicleRegNo: string;
  stoppedAfter: BmkStep;
  transactionId?: string;
  categoryDialog?: string;
  jpj?: { responseCode: string; status: string };
  total?: string;
  payDialogText?: string;
  payment?: { outcome: "paid"; url: string } | { outcome: "refused"; message: string };
  page: Page;
  bmk: BmkWizardPage;
}

export async function runBmkFlow(page: Page, s: BmkScenario = {}): Promise<BmkResult> {
  const stopAfter = s.stopAfter ?? "payment";
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (st: BmkStep) => ORDER.indexOf(st) <= stopAt;

  const bmk = new BmkWizardPage(page);
  const vehicleRegNo = s.vehicleRegNo ?? nextVehicleNumber(s.vehiclePrefix ?? "OUP", 4);
  const r: Partial<BmkResult> = {};
  const out = (stoppedAfter: BmkStep): BmkResult => ({
    vehicleRegNo,
    stoppedAfter,
    transactionId: new URL(page.url()).searchParams.get("id") ?? undefined,
    ...r,
    page,
    bmk,
  });

  await bmk.startNewTransaction();
  r.categoryDialog = await bmk.chooseOwnerCategory(s.ownerCategory);
  if (!reaches("owner")) return out("category");

  const borrowed = s.mykad !== undefined;
  const mykad = s.mykad ?? new MyKadClient();
  if (!borrowed) await mykad.connect();
  try {
    await mykad.removeCard();
    await mykad.setMatchResult(s.matchResult ?? "Identical");
    await bmk.authenticateOwner({ vehicleRegNo, mykad, card: s.owner ?? CARDS.malaysianIndividual });
    if (!reaches("vehicle")) return out("owner");

    await bmk.continueToVehicle();
    if (!reaches("dealer")) return out("vehicle");

    await bmk.continueToDealer();
    await mykad.removeCard();
    await bmk.authenticateDealer({ mykad, card: s.dealer ?? CARDS.malaysianIndividual });
    if (!reaches("jpjCheck")) return out("dealer");
  } finally {
    if (!borrowed) await mykad.close().catch(() => undefined);
  }

  await bmk.continueToJpjCheck();
  if (!reaches("jpjEnquiry")) return out("jpjCheck");

  r.jpj = await bmk.runJpjEnquiry();
  if (!reaches("payment")) return out("jpjEnquiry");

  await bmk.goToPayment();
  if (!reaches("payConfirm")) return out("payment"); // nothing after arrival (EAINT-12253)

  r.total = await bmk.totalPayable();
  r.payDialogText = await bmk.openPaymentDialog();
  if (!reaches("paid")) return out("payConfirm");

  if (s.expectedTotal !== undefined && r.total !== s.expectedTotal) {
    await bmk.cancelPaymentDialog();
    throw new Error(`BMK Step 5 total is RM${r.total}, expected RM${s.expectedTotal}. Not paid.`);
  }
  r.payment = await bmk.confirmPayment();
  return out("paid");
}
