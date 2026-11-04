/**
 * Insurance Cancellation flow (EAINT-12022) — STMS with the IC add-on.
 *
 * Built ON TOP of `runStmsFlow`, not beside it: Steps 1-4 and reaching Step 5
 * are the STMS flow's job, unchanged. This adds only what happens on Step 5
 * when the seller takes the add-on. So a change to the STMS wizard is fixed
 * once in `stms.flow.ts`, and a change to the IC pop-up once in
 * `insurance-cancellation.page.ts`; every caller picks both up.
 *
 *   // a check on the Step 5 add-on box — get there and stop
 *   const r = await runInsuranceCancellationFlow(page, { mykad, stopAfter: "addOn" });
 *
 *   // a pop-up validation check — pop-up open, nothing filled
 *   await runInsuranceCancellationFlow(page, { mykad, stopAfter: "popup" });
 *
 *   // a signing check — preview open after a passing AI check
 *   await runInsuranceCancellationFlow(page, { mykad, files, stopAfter: "preview" });
 *
 *   // a complete STMS paid WITH insurance cancellation
 *   await runInsuranceCancellationFlow(page, { mykad, files, stopAfter: "paid" });
 *
 * Eligibility comes from eSim (Runnerku Eligibility Resp), keyed on the vehicle
 * PREFIX like every other canned response. The default "ON" is Azfar's own
 * eSim record: eligible, Allianz General Insurance, 71%. A colleague testing
 * with their own records passes their own prefix.
 */

import type { Page } from "@playwright/test";
import * as path from "node:path";
import { runStmsFlow, type StmsResult, type StmsScenario } from "./stms.flow";
import { InsuranceCancellationPage, clean, type IcDetails } from "@pages/ucd/insurance-cancellation.page";

/**
 * Where to stop. Each value names the step just COMPLETED.
 *
 * `addOn`    — on Step 5, add-on offered, not ticked
 * `popup`    — add-on ticked, details pop-up open and empty
 * `filled`   — pop-up filled with valid details, [Next] not yet clicked
 * `preview`  — [Next] passed the AI check; document preview open, unsigned
 * `signed`   — signature drawn on the pad, not yet confirmed
 * `selected` — signature confirmed; preview closed, add-on selected with its fee
 * `paid`     — COMPLETE. Paid; STMS transferred with insurance cancellation
 */
export type IcStep = "addOn" | "popup" | "filled" | "preview" | "signed" | "selected" | "paid";

const ORDER: IcStep[] = ["addOn", "popup", "filled", "preview", "signed", "selected", "paid"];

export interface IcFiles {
  copyOfIc: string;
  bankStatement: string;
}

export interface IcScenario extends Omit<StmsScenario, "stopAfter"> {
  /** Default "ON" (eligible, Allianz, 71% in Azfar's eSim records). Ignored when `vehicleRegNo` is given. */
  vehiclePrefix?: string;
  /** Default IC_BANK, else "RHB BANK" (the old SimAI record; real AI since 07.10.2026 needs the real bank). */
  bank?: string;
  /** Default IC_ACCOUNT_NO, else "12345678901234" (old SimAI record). */
  accountNo?: string;
  /**
   * The two uploads. Default: `copy-of-ic.png` and `bank-statement.pdf` in the
   * folder named by `IC_FILES` (or `ICFILES`). Needed from `filled` onward.
   */
  files?: IcFiles;
  /** Default "selected": add-on taken, nothing paid. */
  stopAfter?: IcStep;
}

export interface IcResult extends Omit<StmsResult, "stoppedAfter"> {
  stoppedAfter: IcStep;
  ic: InsuranceCancellationPage;
  /** The Step 1 seller, as Step 5 repeats it in its read-only "name" input. */
  sellerName: string;
  /** How the signature was accepted, once past `signed`. */
  confirmedWith?: "proceed" | "close";
  /** RHB's answer, at `paid`. */
  payment?: { outcome: "transferred"; url: string } | { outcome: "rejected"; message: string };
}

/**
 * The default uploads. Since 07.10.2026 the document check is a REAL AI read
 * (Dev), so a run past `preview` needs real, matching documents — a real
 * person's data, kept out of the repo: IC_COPY_OF_IC / IC_BANK_STATEMENT
 * (paths). Otherwise `copy-of-ic.png` / `bank-statement.pdf` in IC_FILES
 * (or ICFILES), which are placeholders.
 */
export function defaultIcFiles(): IcFiles {
  const env = process.env;
  if (env.IC_COPY_OF_IC && env.IC_BANK_STATEMENT) return { copyOfIc: env.IC_COPY_OF_IC, bankStatement: env.IC_BANK_STATEMENT };
  const dir = env.IC_FILES ?? env.ICFILES;
  if (!dir) throw new Error("Insurance Cancellation needs upload files: pass `files`, or set IC_COPY_OF_IC + IC_BANK_STATEMENT, or IC_FILES to a folder holding copy-of-ic.png and bank-statement.pdf.");
  return { copyOfIc: path.join(dir, "copy-of-ic.png"), bankStatement: path.join(dir, "bank-statement.pdf") };
}

/**
 * Run STMS to Step 5, then the Insurance Cancellation add-on as far as `stopAfter`.
 *
 * Same contract as `runStmsFlow`: the page must already be signed in, and the
 * MyKad reader is left open — close it with `closeStmsFlow(result)`.
 */
export async function runInsuranceCancellationFlow(page: Page, scenario: IcScenario = {}): Promise<IcResult> {
  const stopAfter = scenario.stopAfter ?? "selected";
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (step: IcStep) => ORDER.indexOf(step) <= stopAt;

  const { bank = process.env.IC_BANK ?? "RHB BANK", accountNo = process.env.IC_ACCOUNT_NO ?? "12345678901234", files, stopAfter: _s, ...stms } = scenario;
  const run = await runStmsFlow(page, { ...stms, vehiclePrefix: scenario.vehiclePrefix ?? "ON", stopAfter: "payment" });
  await page.waitForLoadState("networkidle").catch(() => undefined);

  const ic = new InsuranceCancellationPage(page);
  const sellerName = clean(await page.locator('input[name="name"]').first().inputValue().catch(() => ""));
  const out: IcResult = { ...run, stoppedAfter: "addOn", ic, sellerName };
  const done = (step: IcStep) => ((out.stoppedAfter = step), out);

  if (!(await ic.isOffered())) {
    throw new Error(`Step 5 does not offer Insurance Cancellation for ${run.vehicleRegNo}. Check the eSim Runnerku Eligibility Resp for prefix "${scenario.vehiclePrefix ?? "ON"}".`);
  }
  if (!reaches("popup")) return done("addOn");

  await ic.toggle();
  if (!(await ic.isFormOpen())) throw new Error("Ticking the add-on did not open the details pop-up.");
  if (!reaches("filled")) return done("popup");

  const f = files ?? defaultIcFiles();
  const details: IcDetails = { bank, accountNo, copyOfIc: f.copyOfIc, bankStatement: f.bankStatement, declare: true };
  await ic.fill(details);
  if (!reaches("preview")) return done("filled");

  await ic.next();
  await page.waitForTimeout(2500);
  if (!(await ic.isPreviewOpen())) throw new Error(`[Next] did not open the document preview: "${await ic.formError()}"`);
  if (!reaches("signed")) return done("preview");

  await ic.sign();
  if (!reaches("selected")) return done("signed");

  out.confirmedWith = await ic.confirmSignature();
  if (!(await ic.isTicked())) throw new Error(`Add-on not selected after confirming the signature with [${out.confirmedWith}]: "${await ic.previewError()}"`);
  if (!reaches("paid")) return done("selected");

  out.payment = await run.stms.submitPaymentAndReadResult();
  return done("paid");
}

/** Release the reader, as `closeStmsFlow` does for a plain STMS run. */
export async function closeInsuranceCancellationFlow(result: IcResult): Promise<void> {
  await result.mykad.removeCard().catch(() => undefined);
}
