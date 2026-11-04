/**
 * APT flow — the reusable entry point.
 *
 * Same shape as `stms.flow.ts`: `stopAfter` names the step just COMPLETED, every
 * option has a default, and the result carries what the next step needs.
 *
 *   // find the APT and stop there
 *   await runAptFlow(page, { vehicleRegNo, stopAfter: "listed" });
 *
 *   // read the price, pay nothing
 *   const r = await runAptFlow(page, { vehicleRegNo, stopAfter: "payment" });
 *   r.total   // "127.00"
 *
 *   // pay, but only if Step 5 shows the amount the ticket says
 *   await runAptFlow(page, { vehicleRegNo, expectedTotal: "127.00" });
 *
 *   // pay, then F5 on the payment page: APT Step 6 "Submission (JPJ Transfer)" (UNVERIFIED stop, 21.10.2026)
 *   const t = await runAptFlow(page, { vehicleRegNo, expectedTotal: "127.00", stopAfter: "transfer" });
 *   t.transfer   // { url: ".../apt/transaction/jpj-sub.do?id=…", status: "OK - SUCCESSFUL" }
 *
 * ── PRECONDITIONS (the flow states them; it changes none of them) ───────────
 *  1. A dealer never starts an APT. It must ALREADY exist with its 6.0 notice —
 *     BackOffice > Manual APT Trigger (5.5 then 6.0) on an Approved STMS, or
 *     JPJ's notices. That is a BackOffice job (another persona, another portal),
 *     so it is NOT in this flow.
 *  2. The company must have an active RHB account, or Step 5 bounces.
 *  3. REGION: the APT JPJ Fee follows the UCD company's mailing-address State in
 *     BO > Manage Company Accounts, read AT PAYMENT TIME (knowledge/_core/apt.md,
 *     "Region"). Check that address before any region-dependent case; switching it
 *     is BO's, and it prices every APT of that company, cron included.
 *  4. eSim: the RHB answer keys on the vehicle-number PREFIX, as for STMS.
 *
 * The page must ALREADY be signed in — take `ucdSession` in the spec.
 * Register: UNVERIFIED until a person has run and reviewed it (README).
 *
 * ── STOP `paid` (VERIFIED 21.10.2026, unchanged) ───────────────────────────────
 * Screen: Step 5 `view/ucd/apt/transaction/payment.do` with the result dialog **"Payment request
 * sent"** up (a good APT payment does not navigate; the dialog's [OK] leads to the APT listing).
 * Marker: that dialog (`AptPage.paymentSentDialog`). Returns on arrival; nothing after it touches a
 * dialog (EAINT-12253, 21.10). The flow does not press the result's OK (it used to, 20.10 run 1835).
 * To read the listing afterwards call `readAptListing()` (by address, clicks nothing on the result),
 * or press the result's own [OK] with `AptPage.pressPaymentSentOk()`.
 *
 * ── STOP `transfer` (added 21.10.2026 late, UNVERIFIED) ─────────────────────────
 * CORRECTION (cr-triage APT / CD4, cr/EAINT-12253/05-evidence/triage-2026-10-21-apt.md): APT DOES
 * have a Step 6, "Submission (JPJ Transfer)" `view/ucd/apt/transaction/jpj-sub.do?id=` (step strip
 * 5 Payment → 6 Transfer; "JPJ Transfer Status", e.g. OK - SUCCESSFUL, and the Submission
 * Date/Time; no price). The earlier "there is no Step 6 page" was wrong. [OK] on the result does
 * NOT open it (it goes to the listing); reloading the paid APT's payment page does (BEH_TS1,
 * /uat1/ 21.10.2026 16:57). `transfer` = from `paid`, F5 → waits for `jpj-sub.do`, "JPJ Transfer
 * Status" and "Working..." to clear → returns on arrival, touching nothing. After [OK] (on the
 * listing), `reopenAptTransfer()` opens the payment page's address again and F5s to Step 6.
 * Which of `paid` / `transfer` is the APT's FINAL step for the browser reminder is with the BA (Q23).
 *
 * ── EAINT-12626 (26.10.2026, fix on staging /uat1/; UNVERIFIED on the fixed build) ────────────────
 * The fix removes "Payment request sent": a good payment now goes STRAIGHT to Step 6 `jpj-sub.do`.
 * `AptPage.pay()` already returns `paid` when the page moves (`payment.via` = "moved" vs "sent").
 * So on the fixed build: `paid` returns ON Step 6 (no dialog), and `transfer` waits for Step 6 there
 * (`AptPage.arriveTransfer()`, NO F5; `transferBy` = "landed"). On the old build `transfer` still F5s.
 * To read what arrived without touching it: `AptPage.afterPayment()` (address, step strip, heading,
 * status, any visible dialog). Verify: `tests/flows/apt.verify.spec.ts` "after the 12626 fix" tests.
 */

import type { Page } from "@playwright/test";
import { AptPage, APT_TRANSFER, type ListingRow, type AptPayResult } from "@pages/ucd/apt.page";

/**
 * `listed`   — the APT's row is in the listing (Search Now pressed); nothing clicked on it
 * `payment`  — Resubmit pressed and confirmed; sitting on Step 5, price read, nothing paid
 * `paid`     — Payment submitted and accepted: ON Step 5 with "Payment request sent" OPEN
 *              (not pressed). The JPJ transfer is a batch (Pending until it runs)
 * `transfer` — (UNVERIFIED) from `paid`, F5 → Step 6 `apt/transaction/jpj-sub.do` ("JPJ Transfer
 *              Status"), returned on arrival, nothing pressed
 */
export type AptStep = "listed" | "payment" | "paid" | "transfer";
const ORDER: AptStep[] = ["listed", "payment", "paid", "transfer"];

export interface AptScenario {
  /** The vehicle whose APT exists. Required — a dealer cannot make one. */
  vehicleRegNo: string;
  /** Pin one APT when the vehicle has several rows. Default: the first row for the vehicle. */
  transactionNo?: string;
  /**
   * Pay only when Step 5's total equals this (e.g. "127.00"). A mismatch THROWS
   * before any payment, so a wrong price never gets paid by accident.
   * Default: no check.
   */
  expectedTotal?: string;
  /** Default "paid". */
  stopAfter?: AptStep;
}

export interface AptResult {
  vehicleRegNo: string;
  /** The APT reference, e.g. A69347792. */
  transactionNo: string;
  /** The row as found, before anything was clicked. */
  listedRow: ListingRow;
  /** Step 5 text; from `payment` onward. */
  paymentSummary?: string;
  /** Step 5 "Total Amount Payable" digits; from `payment` onward. */
  total?: string;
  /** From `paid` onward. `rejected` carries RHB's message and is NOT thrown. */
  payment?: AptPayResult;
  /** `transfer`: Step 6's address and its "JPJ Transfer Status" value. */
  transfer?: { url: string; status: string };
  /** `transfer`: how Step 6 was reached: "landed" (the payment went straight there, EAINT-12626 fix) or "f5" (old build). */
  transferBy?: "landed" | "f5";
  stoppedAfter: AptStep;
  page: Page;
  apt: AptPage;
}

/** Find the APT in the listing and return its row. Throws, saying why, when there is none. */
export async function findApt(page: Page, vehicleRegNo: string, transactionNo?: string): Promise<{ apt: AptPage; row: ListingRow }> {
  const apt = new AptPage(page);
  await apt.openListing();
  await apt.search(vehicleRegNo);
  const row = await apt.row(vehicleRegNo, transactionNo);
  if (!row) {
    throw new Error(
      `No APT for ${vehicleRegNo}${transactionNo ? ` / ${transactionNo}` : ""} in the listing. ` +
        `A dealer cannot create one: BO Manual APT Trigger (5.5 then 6.0) must have run on an Approved STMS first.`,
    );
  }
  return { apt, row };
}

/**
 * Resubmit an APT and stop on Step 5 with the price read. Used by `runAptFlow`,
 * and on its own for a Failed/Pending APT (a reset one included) where the case
 * is about what Step 5 shows.
 */
export async function resubmitApt(
  page: Page,
  scenario: Pick<AptScenario, "vehicleRegNo" | "transactionNo">,
): Promise<Pick<AptResult, "vehicleRegNo" | "transactionNo" | "listedRow" | "paymentSummary" | "total" | "page" | "apt">> {
  const { apt, row } = await findApt(page, scenario.vehicleRegNo, scenario.transactionNo);
  const transactionNo = apt.transactionNoOf(row);
  await apt.resubmit(scenario.vehicleRegNo, transactionNo || undefined);
  const paymentSummary = await apt.paymentSummary();
  return { vehicleRegNo: scenario.vehicleRegNo, transactionNo, listedRow: row, paymentSummary, total: apt.totalOf(paymentSummary), page, apt };
}

/**
 * Read the APT's listing row again (after paying, say). `null` when it is not listed.
 *
 * After `paid` the page is still under the "Payment request sent" dialog, whose overlay
 * blocks the HOME button. So when the dashboard is not showing, this opens the listing by
 * its address on the SAME instance (root taken from the current URL) instead of clicking:
 * nothing on the result dialog is pressed.
 */
export async function readAptListing(page: Page, vehicleRegNo: string, transactionNo?: string): Promise<ListingRow | null> {
  const apt = new AptPage(page);
  await apt.openListingFromAnywhere();
  await apt.search(vehicleRegNo);
  return apt.row(vehicleRegNo, transactionNo);
}

/** Run the APT journey as far as `stopAfter`. */
export async function runAptFlow(page: Page, scenario: AptScenario): Promise<AptResult> {
  const stopAfter = scenario.stopAfter ?? "paid";
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}". Use one of: ${ORDER.join(", ")}.`);
  const reaches = (s: AptStep) => ORDER.indexOf(s) <= stopAt;

  if (!reaches("payment")) {
    const { apt, row } = await findApt(page, scenario.vehicleRegNo, scenario.transactionNo);
    return { vehicleRegNo: scenario.vehicleRegNo, transactionNo: apt.transactionNoOf(row), listedRow: row, stoppedAfter: "listed", page, apt };
  }

  const at5 = await resubmitApt(page, scenario);
  const result: AptResult = { ...at5, stoppedAfter: "payment" };
  if (!reaches("paid")) return result;

  if (scenario.expectedTotal !== undefined && at5.total !== scenario.expectedTotal) {
    throw new Error(
      `Step 5 for ${scenario.vehicleRegNo} shows RM${at5.total || "?"}, expected RM${scenario.expectedTotal}. Not paid. ` +
        `Check the company's BO mailing State (region) and the fee in force. ${at5.paymentSummary}`,
    );
  }
  result.payment = await at5.apt.pay();
  result.stoppedAfter = "paid";
  if (!reaches("transfer")) return result;

  if (result.payment.outcome !== "paid") {
    throw new Error(`stopAfter "transfer" needs a paid APT; the payment for ${scenario.vehicleRegNo} was refused: ${result.payment.message}`);
  }
  // EAINT-12626 (26.10.2026, UNVERIFIED): after the fix a good payment lands straight on Step 6 `jpj-sub.do`; then
  // `transfer` waits for it there and does NOT F5. Only the old build (still on Step 5 under "Payment request sent")
  // gets the F5 as before.
  result.transfer = APT_TRANSFER.test(result.payment.url) ? await at5.apt.arriveTransfer() : await at5.apt.reloadToTransfer();
  result.transferBy = APT_TRANSFER.test(result.payment.url) ? "landed" : "f5";
  result.stoppedAfter = "transfer";
  return result;
}

/**
 * After the result's [OK] (or from anywhere): open the paid APT's payment page again by its address (`paymentUrl` =
 * `AptResult.payment.url`, `apt/transaction/payment.do?id=…`), then F5 → Step 6 `jpj-sub.do` ("JPJ Transfer Status"),
 * returned on arrival, nothing pressed. `openedAt` = where the address itself landed, before the F5 (not seen yet:
 * Step 5 or already Step 6). Added 21.10.2026 late, UNVERIFIED (README).
 */
export async function reopenAptTransfer(page: Page, paymentUrl: string): Promise<{ openedAt: string; url: string; status: string }> {
  const apt = new AptPage(page);
  const openedAt = await apt.reopen(paymentUrl);
  const t = await apt.reloadToTransfer();
  return { openedAt, ...t };
}
