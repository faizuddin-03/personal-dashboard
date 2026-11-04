/**
 * LKM Refund flow — STMS with the LKM Refund add-on on Step 5.
 *
 * Built on `runStmsFlow` exactly like `insurance-cancellation.flow.ts`:
 * Steps 1-4 are the STMS flow's job; this drives only the add-on. Screen
 * actions live in `pages/ucd/lkm-refund.page.ts`.
 *
 *   // the Step 5 add-on, nothing ticked
 *   await runLkmRefundFlow(page, { mykad, stopAfter: "addOn" });
 *
 *   // pop-up validation — pop-up open, prefilled PTJ untouched
 *   await runLkmRefundFlow(page, { mykad, stopAfter: "popup" });
 *
 *   // signing — document check passed, preview + pad open
 *   await runLkmRefundFlow(page, { mykad, stopAfter: "preview" });
 *
 *   // a paid STMS with the refund committed
 *   await runLkmRefundFlow(page, { mykad, stopAfter: "paid" });
 *
 * The vehicle PREFIX picks the eSim JPJ answers. The default "OW" is QA-owned
 * (src/data/qa-prefixes.ts, seeded 2026-10-07): JPJ refund balance RM1,000.
 * The document check at [Next] is a real AI read of the uploads since
 * 07.10.2026 — see `defaultRefund` for where the real documents come from.
 *
 * PRECONDITIONS (not set here):
 *  - The signed-in UCD account has the LKM Refund permission and its company
 *    address is in KL / Selangor (Phase 1), seller category MALAYSIAN.
 *  - A vehicle number is accepted once only (Step 2: "telah direkod sebelum
 *    ini"); the shared counter handles that.
 *
 * FINAL STOP: `paid` — STMS Step 6 Transfer `view/ucd/stms/transaction/jpj-sub.do?id=…`, marker
 * "JPJ Transfer Status:"; an RHB refusal stays on Step 5 and its dialog is READ only
 * (`StmsWizardPage.submitPaymentAndReadResult`). The only dialog answered is Step 5's own payment
 * confirm, before arrival.
 * EAINT-12253 (21.10): final-step stop returns on arrival; nothing after it touches a dialog. Every
 * earlier stop (`addOn` … `confirmed`) is on Step 5 and kept as it was; the refund pop-up's own
 * buttons are the add-on's controls, pressed only before payment.
 */

import type { Page } from "@playwright/test";
import * as path from "node:path";
import { runStmsFlow, type StmsResult, type StmsScenario } from "./stms.flow";
import { LkmRefundPage, type LkmRefundDetails } from "@pages/ucd/lkm-refund.page";
import { qaPrefix } from "@data/qa-prefixes";
import { awaitFinalScreen } from "@pages/final-step";

/**
 * Where to stop. Each value names the step just COMPLETED.
 *
 * `addOn`     — on Step 5, add-on offered, not ticked
 * `popup`     — ticked, refund pop-up open as eAuto prefilled it
 * `filled`    — pop-up filled, [Next] not clicked
 * `preview`   — AI check passed; preview and signature pad open
 * `signed`    — signature drawn (inked), not confirmed
 * `confirmed` — [Confirm]ed; refund committed, fee in the summary
 * `paid`      — FINAL. Paid; STMS transferred with the refund: ON Step 6, returned on arrival
 */
export type LkmStep = "addOn" | "popup" | "filled" | "preview" | "signed" | "confirmed" | "paid";

const ORDER: LkmStep[] = ["addOn", "popup", "filled", "preview", "signed", "confirmed", "paid"];

export interface LkmScenario extends Omit<StmsScenario, "stopAfter"> {
  /** Default "OW" (QA-owned LKM Refund prefix). Ignored when `vehicleRegNo` is given. */
  vehiclePrefix?: string;
  /**
   * What to type and upload; given keys override the defaults. Default: the
   * bank details of the prefix's eSim document-check record (OW: MAYBANK
   * 112233445566), consent ticked, and `copy-of-ic.png` / `bank-statement.pdf`
   * from the IC_FILES (or ICFILES) folder.
   */
  refund?: LkmRefundDetails;
  /**
   * On a document-check refusal, cancel, re-tick, refill and try [Next] this
   * many more times. Default 1: the check is a real AI read (since 07.10.2026)
   * and can refuse good documents once. A test ABOUT the refusal sets 0.
   */
  aiRetries?: number;
  /** Default "confirmed": refund committed, nothing paid. */
  stopAfter?: LkmStep;
}

export interface LkmResult extends Omit<StmsResult, "stoppedAfter"> {
  stoppedAfter: LkmStep;
  lkm: LkmRefundPage;
  /** PTJ as eAuto prefilled it, before anything was changed. */
  prefilledPtj?: { state: string; branch: string };
  /** [Next] attempts made, and the refusals seen before a pass. */
  aiAttempts: number;
  aiRefusals: string[];
  /** "eAuto Processing Fee - LKM Refund", once confirmed. */
  fee?: string;
  payment?: { outcome: "transferred"; url: string } | { outcome: "rejected"; message: string };
}

/**
 * Run STMS to Step 5, then LKM Refund as far as `stopAfter`.
 * The page must already be signed in; close the reader with `closeLkmRefundFlow`.
 */
export async function runLkmRefundFlow(page: Page, scenario: LkmScenario = {}): Promise<LkmResult> {
  const stopAfter = scenario.stopAfter ?? "confirmed";
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (step: LkmStep) => ORDER.indexOf(step) <= stopAt;
  const { refund, aiRetries = 1, stopAfter: _s, ...stms } = scenario;
  const prefix = scenario.vehiclePrefix ?? "OW";
  const run = await runStmsFlow(page, { ...stms, vehiclePrefix: prefix, stopAfter: "payment" });
  await page.waitForLoadState("networkidle").catch(() => undefined);

  const lkm = new LkmRefundPage(page);
  const out: LkmResult = { ...run, stoppedAfter: "addOn", lkm, aiAttempts: 0, aiRefusals: [] };
  const done = (step: LkmStep) => ((out.stoppedAfter = step), out);

  if (!(await lkm.isOffered())) {
    throw new Error(
      `Step 5 does not offer LKM Refund for ${run.vehicleRegNo}. Check: eSim stms-enquiry-resp refund balance for prefix "${prefix}", ` +
        `the account's LKM Refund permission, the dealer address (KL / Selangor), seller category.`,
    );
  }
  if (!reaches("popup")) return done("addOn");

  const openPopup = async () => {
    await lkm.toggle();
    if (!(await lkm.isPopupOpen())) throw new Error("Ticking LKM Refund did not open the refund pop-up.");
  };
  await openPopup();
  out.prefilledPtj = await lkm.prefilledPtj();
  if (!reaches("filled")) return done("popup");

  const details: LkmRefundDetails = { ...defaultRefund(prefix), ...refund };
  // Nothing prefilled (seen on AZFARAZO 07.10.2026) and the caller named no PTJ: take the first on the list.
  const ptjEmpty = !out.prefilledPtj.state || /^Select/i.test(out.prefilledPtj.state);
  if (details.ptjState === undefined && ptjEmpty) details.ptjState = "";
  await lkm.fill(details);
  if (!reaches("preview")) return done("filled");

  for (;;) {
    out.aiAttempts += 1;
    const r = await lkm.next();
    if (r.outcome === "preview") break;
    out.aiRefusals.push(r.message);
    if (out.aiAttempts > aiRetries) throw new Error(`AI document check refused ${out.aiAttempts} time(s): ${out.aiRefusals.map((m) => `"${m}"`).join(", ")}`);
    await lkm.cancel();
    if (await lkm.isTicked()) await lkm.toggle(); // untick, so the next tick opens a fresh pop-up
    await openPopup();
    await lkm.fill(details);
  }
  if (!reaches("signed")) return done("preview");

  await lkm.sign();
  if (!reaches("confirmed")) return done("signed");

  await lkm.confirm();
  out.fee = await lkm.processingFee();
  if (!(await lkm.isCommitted())) throw new Error(`Refund not committed after [Confirm]: LKM Refund fee reads "${out.fee || "(not shown)"}".`);
  if (!reaches("paid")) return done("confirmed");

  // One payment: Step 5's total already carries the LKM fee (OW000017, 07.10.2026: RM91.00 = 10 + 25 + 50 + 6 tax).
  out.payment = await run.stms.submitPaymentAndReadResult();
  if (out.payment.outcome === "transferred") {
    await awaitFinalScreen(page, page.getByText(/JPJ Transfer Status/i), "STMS Step 6 Transfer: 'JPJ Transfer Status'");
  }
  return done("paid"); // FINAL: nothing after arrival (EAINT-12253)
}

/**
 * Default pop-up input. Since 07.10.2026 the document check is a REAL AI read
 * of the files (Dev), so real, matching documents are needed — and those are a
 * real person's data, so they never live in this repo. They come from the
 * environment instead:
 *
 *   LKM_BANK="BANK ISLAM MALAYSIA BERHAD"  LKM_ACCOUNT_NO=<on the statement>
 *   LKM_COPY_OF_IC=<path>  LKM_BANK_STATEMENT=<path>
 *
 * The seller card (`seller`, default CARDS.malaysianIndividual) must be the
 * same person. Without these, it falls back to the prefix's eSim record and
 * the IC_FILES placeholders (fine up to `filled`, refused at [Next]).
 */
export function defaultRefund(prefix: string): LkmRefundDetails {
  const env = process.env;
  const dir = env.IC_FILES ?? env.ICFILES;
  let bank: Pick<LkmRefundDetails, "bank" | "accountNo"> = {};
  try {
    const ocr = qaPrefix(prefix).lkmRefund?.ocr;
    if (ocr) bank = { bank: ocr.bankName, accountNo: ocr.bankAccNo };
  } catch {
    // not a QA prefix
  }
  return {
    consent: true,
    ...bank,
    ...(env.LKM_BANK ? { bank: env.LKM_BANK } : {}),
    ...(env.LKM_ACCOUNT_NO ? { accountNo: env.LKM_ACCOUNT_NO } : {}),
    copyOfIc: env.LKM_COPY_OF_IC ?? (dir ? path.join(dir, "copy-of-ic.png") : undefined),
    bankStatement: env.LKM_BANK_STATEMENT ?? (dir ? path.join(dir, "bank-statement.pdf") : undefined),
  };
}

/** Release the reader, as `closeStmsFlow` does for a plain STMS run. */
export async function closeLkmRefundFlow(result: LkmResult): Promise<void> {
  await result.mykad.removeCard().catch(() => undefined);
}
