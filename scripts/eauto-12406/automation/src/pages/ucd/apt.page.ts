/**
 * APT — UCD portal (Automatic Permanent Transfer).
 *
 * A dealer NEVER starts an APT: BackOffice (Manual APT Trigger 5.5 then 6.0, or
 * JPJ's own notices) creates it, and the dealer finds it in the APT Transaction
 * Listing. So there is no "create" here and no MyKad. The journey is:
 *
 *   listing (Search Now) -> row -> Resubmit -> Step 5 Payment -> pay -> "Payment request sent" (on Step 5)
 *   -> [OK] -> the APT listing.   Step 6 "Submission (JPJ Transfer)" `apt/transaction/jpj-sub.do?id=` exists, but
 *   [OK] does not open it: reloading the paid APT's payment page does (EAINT-12253, staging /uat1/ 21.10.2026,
 *   12253_EX_TS4 run log + 12253_BEH_TS1 16:57). The listing's [View] on an Approved APT opens Transaction Details
 *   `apt/enquiry/view.do?id=` (not a step of the wizard).
 *
 * Selectors are the ones the EAINT-12403 runs used and the 2026-09-18 / 09-28
 * APT mapping recorded (knowledge/portals/ucd/portal.md, "APT — mapped"):
 *   listing  `view/ucd/apt/enquiry/`   `#vehicleNo`  `#to-search`
 *   Resubmit an `<a>` in the row, then a confirm dialog; it opens straight on
 *            `apt/transaction/payment.do`
 *   payment  `#to-payment` (same id as STMS Step 5)
 *
 * Payment is DELEGATED to `StmsWizardPage` on purpose: `submitPaymentAndReadResult`
 * lives there and APT's Step 5 uses the same control. Composition, not
 * inheritance, because the STMS class pins its own landing path and menu tile.
 */

import { TransactionWizardPage } from "../wizard.page";
import { StmsWizardPage } from "./stms-wizard.page";
import { UcdHomePage, UCD_MENU } from "./ucd-home.page";
import { step } from "@fixtures/step";
import { awaitFinalScreen, waitForWorkingToClear } from "../final-step";

export const APT_LISTING = "view/ucd/apt/enquiry/";
export const APT_PAYMENT = /apt\/transaction\/payment\.do/;
/** APT Step 6 "Submission (JPJ Transfer)": "JPJ Transfer Status" + Submission Date/Time, no price (seen 21.10.2026, /uat1/). */
export const APT_TRANSFER = /apt\/transaction\/jpj-sub\.do/;

/** One listing row, keyed by column header, whitespace normalised. */
export type ListingRow = Record<string, string>;

const clean = (x: string | undefined | null) =>
  String(x ?? "").replace(/[\s ​‌‍﻿]+/g, " ").trim();

export type AptPayResult =
  /**
   * `via` (added 26.10.2026, EAINT-12626): what told `pay()` the payment went through. "sent" = the old
   * "Payment request sent" dialog on Step 5 (before the 12626 fix); "moved" = the page left `payment.do`
   * (after the fix it goes straight to Step 6 `jpj-sub.do`). Optional, so older callers are unchanged.
   */
  | { outcome: "paid"; url: string; via?: "moved" | "sent" }
  | { outcome: "rejected"; message: string };

/**
 * What the screen shows straight after a good APT payment, read only (EAINT-12626, 26.10.2026). Nothing is pressed.
 * Markup seen on staging /uat1/ 26.10.2026 (cr/EAINT-12626/03-spec/probes/p01, A60347839's Step 6):
 * step strip `#stms-header .header-element-active` ("6 Transfer"), heading `.stms-header-title`
 * "Submission (JPJ Transfer)", status `span.jpjStatus` ("OK - SUCCESSFUL").
 */
export interface AptAfterPayment {
  url: string;
  /** On `apt/transaction/jpj-sub.do` with the "Submission (JPJ Transfer)" heading. */
  onStep6: boolean;
  /** The step strip's active step as printed, e.g. "6 Transfer". */
  activeStep: string;
  /** The page heading under the step strip, e.g. "Submission (JPJ Transfer)" or "Payment". */
  heading: string;
  /** "JPJ Transfer Status" value, "" when not on the page. */
  status: string;
  /** Text of every visible jQuery dialog at the time of the read. */
  dialogs: string[];
  /** A visible dialog says "Payment request sent". */
  sentDialog: boolean;
}

export class AptPage extends TransactionWizardPage {
  protected readonly landingPath = APT_LISTING;
  protected readonly menuItem = UCD_MENU.apt;
  // APT has no create wizard; this only satisfies the base class and matches Step 5.
  protected readonly wizardUrlPattern = /apt\/transaction\//;

  /** Dashboard -> APT tile -> the listing. It is empty until Search Now is pressed. */
  @step("Open the APT listing")
  async openListing(): Promise<void> {
    await new UcdHomePage(this.page).returnToDashboard();
    await this.gotoLanding();
  }

  /**
   * The listing from wherever the page is, clicking nothing on what is showing. From the
   * dashboard: the APT tile, as `openListing()`. From anywhere else (e.g. Step 5 under the
   * "Payment request sent" result, whose overlay blocks the HOME button): the listing's address
   * on the SAME instance (root read off the current URL), so no dialog is pressed (EAINT-12253).
   */
  @step("Open the APT listing (without touching the current screen)")
  async openListingFromAnywhere(): Promise<void> {
    const onDashboard = await this.page.locator("button.dashboard-menu-item-btn").first().isVisible().catch(() => false);
    if (onDashboard) return this.openListing();
    const root = this.page.url().replace(/\/view\/.*/, "");
    await this.page.goto(`${root}/${APT_LISTING}`);
    await this.page.waitForURL(/view\/ucd\/apt\/enquiry\//, { timeout: 30_000 });
    await this.page.locator("#vehicleNo").waitFor({ state: "visible", timeout: 30_000 });
  }

  /** Search the listing by vehicle number and wait for the result to settle. */
  @step("Search the APT listing by vehicle number")
  async search(vehicleRegNo: string): Promise<void> {
    await this.page.fill("#vehicleNo", vehicleRegNo);
    await this.page.click("#to-search");
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    // Results arrive by AJAX; a row for this vehicle is the signal, an empty list is a valid answer.
    await this.page
      .locator("table tr", { hasText: vehicleRegNo })
      .first()
      .waitFor({ timeout: 15_000 })
      .catch(() => undefined);
  }

  /**
   * The listing row for a vehicle (and transaction, when several), keyed by
   * column header — matched by column POSITION, because the listing's tables
   * are nested and a `tr` also matches its parent. `null` when there is none.
   */
  async row(vehicleRegNo: string, transactionNo?: string): Promise<ListingRow | null> {
    const raw = await this.page.evaluate(
      ({ v, t }) => {
        const norm = (x: string) => x.replace(/\s+/g, " ").trim();
        const own = (tr: Element) => Array.from(tr.children).filter((c) => c.tagName === "TD");
        const rows = Array.from(document.querySelectorAll("tr")).filter(
          (tr) =>
            own(tr).length > 6 &&
            norm(tr.textContent || "").includes(v) &&
            (!t || norm(tr.textContent || "").includes(t)),
        );
        const tr = rows[0];
        if (!tr) return null;
        const table = tr.closest("table")!;
        const header = Array.from(table.querySelectorAll("tr")).find(
          (h) => h.querySelectorAll(":scope > th").length > 4,
        );
        const ths = header ? Array.from(header.querySelectorAll(":scope > th")) : [];
        const out: Record<string, string> = {};
        for (const th of ths) {
          const r = th.getBoundingClientRect();
          const td = own(tr).find((c) => {
            const b = c.getBoundingClientRect();
            const m = b.left + b.width / 2;
            return m >= r.left && m <= r.right;
          });
          if (td) out[norm(th.textContent || "")] = norm(td.textContent || "");
        }
        return out;
      },
      { v: vehicleRegNo, t: transactionNo },
    );
    if (!raw) return null;
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [clean(k), clean(v)]));
  }

  /** The row's APT reference, e.g. `A69347792` (column "Transaction No." on APT). */
  transactionNoOf(row: ListingRow | null): string {
    return row?.["Transaction No."] ?? row?.["Transaction No"] ?? "";
  }

  /**
   * Press Resubmit on a row, confirm, and land on Step 5 Payment.
   *
   * Only offered for New / Pending / Created / Submitted / Failed / Error, and
   * only once the 6.0 notice is on the APT. When it is missing the row is
   * reported, so the failure says WHY (no 6.0 yet, already paid, cancelled)
   * instead of "link not found".
   */
  @step("Resubmit the APT and open Step 5")
  async resubmit(vehicleRegNo: string, transactionNo?: string): Promise<void> {
    const row = this.page.locator("table tr", { hasText: transactionNo ?? vehicleRegNo }).last();
    const link = row.locator("a").filter({ hasText: /Resubmit/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      const seen = clean(await row.innerText().catch(() => "(no row)"));
      throw new Error(
        `No Resubmit for ${transactionNo ?? vehicleRegNo}. Needs an APT with the 6.0 notice, not Cancelled/Expired/Approved. Row reads: ${seen}`,
      );
    }
    await link.click();
    await this.confirmDialog(8_000).catch(() => "");
    await this.page.waitForURL(APT_PAYMENT, { timeout: 30_000 });
  }

  /** The Step 5 "Payment Summary … Total Amount Payable" block, as one line. */
  async paymentSummary(): Promise<string> {
    const body = await this.page.evaluate(() => document.body.innerText);
    return ((body.match(/Payment Summary[\s\S]*?Total Amount Payable[^\n]*\n?[^\n]*/) ?? [""])[0])
      .replace(/\s+/g, " ")
      .trim();
  }

  /** "RM 127.00" -> "127.00" out of a payment summary; "" when it is not there. */
  totalOf(summary: string): string {
    return (summary.match(/Total Amount Payable[^:]*:\s*RM\s*([\d.]+)/) ?? [])[1] ?? "";
  }

  /** The "Payment request sent" result dialog a good APT payment raises on Step 5. */
  get paymentSentDialog() {
    return this.page.locator(".ui-dialog:visible").filter({ hasText: /Payment request sent/i });
  }

  /**
   * Step 5 -> paid. COMPLETES the payment (RHB debits, JPJ transfer is a batch
   * and reads Pending until it runs).
   *
   * Returns ON the screen straight after paying (EAINT-12253, 21.10.2026): a good APT payment does
   * not navigate. Step 5 (`apt/transaction/payment.do`) raises the result dialog **"Payment request
   * sent"**, whose [OK] leads to the APT listing. This returns the moment it is up (and any
   * "Working..." overlay has cleared) and does NOT press its OK. A caller that wants the listing
   * calls `readAptListing()` (navigates without clicking) or `pressPaymentSentOk()`.
   * Corrected 21.10.2026 late (cr-triage, 05-evidence/triage-2026-10-21-apt.md): APT DOES have a
   * Step 6, "Submission (JPJ Transfer)" `apt/transaction/jpj-sub.do?id=` ("JPJ Transfer Status").
   * [OK] does not open it; reloading the paid APT's payment page does: `reloadToTransfer()`
   * (flow stop `transfer`). The earlier "no separate Step 6 page" was wrong.
   *
   * The only dialog this answers is the payment confirm on Step 5 ("Sure to submit this
   * payment?"), BEFORE the result. A refusal (RHB) is another dialog on Step 5: its text is
   * read and returned, nothing is clicked. A page that leaves `payment.do` instead is also
   * read as paid (arrived elsewhere), never clicked through.
   */
  @step("Pay the APT")
  async pay(): Promise<AptPayResult> {
    const before = this.page.url();
    await this.page.locator("#to-payment").click();
    const confirmText = await this.confirmDialog().catch(() => "");

    // What arrives after the confirm: the result dialog, a refusal dialog, or a new page.
    const outcome = await this.page
      .waitForFunction(
        ({ before, confirmText }) => {
          if (location.href !== before) return "moved";
          const shown = Array.from(document.querySelectorAll(".ui-dialog")).filter(
            (d) => (d as HTMLElement).getClientRects().length > 0 && getComputedStyle(d).display !== "none",
          );
          for (const d of shown) {
            const t = ((d as HTMLElement).innerText || "").replace(/\s+/g, " ").trim();
            if (/Payment request sent/i.test(t)) return "sent";
            if (/Browser Reminder|浏览器提醒/i.test(t)) return "sent"; // EAINT-12253: shown only after a good payment
            if (t && t !== confirmText) return "other";
          }
          return false;
        },
        { before, confirmText },
        { timeout: 120_000, polling: 250 },
      )
      .then((h) => h.jsonValue() as Promise<"moved" | "sent" | "other">)
      .catch(() => "timeout" as const);

    if (outcome === "other") {
      const message = await new StmsWizardPage(this.page).paymentDialogMessage();
      if (!/Payment request sent/i.test(message)) return { outcome: "rejected", message };
    }
    if (outcome === "timeout") {
      return { outcome: "rejected", message: `No result within 120 s of the payment confirm (still on ${this.page.url()}).` };
    }
    await waitForWorkingToClear(this.page);
    return { outcome: "paid", url: this.page.url(), via: outcome === "moved" ? "moved" : "sent" };
  }

  // ── after the payment (added 21.10.2026 late, EAINT-12253 CH_TS7 / cr-triage APT): not called by `paid` ─────────────

  /**
   * On Step 5 with "Payment request sent" open: press the dialog's own [OK] (`button.confirm-dialog-btn` "OK", its only
   * button: 12253_EX_TS4 Firefox 36 run log, /uat1/ 21.10.2026 12:04:11) and wait for the page it opens (the APT listing
   * `apt/enquiry/` in that run). Returns the address it landed on; nothing else is pressed.
   */
  @step("Payment request sent: OK")
  async pressPaymentSentOk(): Promise<string> {
    const dlg = this.paymentSentDialog;
    await dlg.first().waitFor({ state: "visible", timeout: 15_000 });
    const before = this.page.url();
    await dlg.first().locator("button.confirm-dialog-btn, button:text-is('OK')").first().click();
    await this.page.waitForURL((u) => u.toString() !== before, { timeout: 30_000 }).catch(() => undefined);
    await this.page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await waitForWorkingToClear(this.page);
    return this.page.url();
  }

  /** Open an address of this APT again (its payment page `payment.do?id=` after paying). Returns where it landed. */
  @step("Open the paid APT's payment page again")
  async reopen(url: string): Promise<string> {
    await this.page.goto(url);
    await this.page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await waitForWorkingToClear(this.page);
    return this.page.url();
  }

  /**
   * F5 on the paid APT's page → Step 6 "Submission (JPJ Transfer)" `apt/transaction/jpj-sub.do` (BEH_TS1, /uat1/
   * 21.10.2026 16:57): waits for that address, "JPJ Transfer Status" and "Working..." to clear, and returns on arrival,
   * touching nothing (EAINT-12253 final-step rule). Throws, naming where it is, when Step 6 does not come.
   */
  @step("F5: APT Step 6 Transfer")
  async reloadToTransfer(): Promise<{ url: string; status: string }> {
    await this.page.reload();
    try {
      await this.page.waitForURL(APT_TRANSFER, { timeout: 60_000 });
    } catch {
      throw new Error(`F5 did not open APT Step 6 (apt/transaction/jpj-sub.do); the page is ${this.page.url()}`);
    }
    await awaitFinalScreen(this.page, this.page.getByText("JPJ Transfer Status").first(), "APT Step 6: JPJ Transfer Status");
    return { url: this.page.url(), status: await this.transferStatus() };
  }

  // ── added 26.10.2026 (EAINT-12626: after the fix a good payment goes straight to Step 6, no popup) ─────────────────
  // Every selector below was read off staging /uat1/ on 26.10.2026 by the read-only probe
  // cr/EAINT-12626/03-spec/probes/p01-apt-screens-readonly.spec.ts (A60347839 / OQ000009, paid before the fix).

  /** Step strip, the active step (`<div class="header-element-active">` holding "6" and "Transfer" on Step 6). */
  get activeStep() {
    return this.page.locator("#stms-header .header-element-active");
  }

  /** The heading under the step strip: "Submission (JPJ Transfer)" on Step 6 (`div.stms-header-title`). */
  get pageHeading() {
    return this.page.locator(".stms-header-title").first();
  }

  /** Step 6's status value `<span class="jpjStatus label ok">OK - SUCCESSFUL</span>`. */
  get transferStatusValue() {
    return this.page.locator("span.jpjStatus").first();
  }

  /** Step 5 [Retry] (a Failed APT; `#to-retry-rhb`, 12253_EX_TS4 / BEH_TS1 runs) and [Next] (`#to-payment`). */
  get retryButton() {
    return this.page.locator("#to-retry-rhb");
  }
  get payButton() {
    return this.page.locator("#to-payment");
  }

  /**
   * Read what arrived after `pay()` returned "paid", touching nothing: waits up to `timeout` for EITHER Step 6
   * (`jpj-sub.do` + "JPJ Transfer Status") OR the old "Payment request sent" dialog, then `settleMs` more (so a dialog
   * that comes a moment late is still seen), then reads the address, the step strip, the heading, the status and every
   * visible dialog. Never presses anything and never reloads.
   */
  @step("Read the screen after the APT payment")
  async afterPayment(o: { timeout?: number; settleMs?: number } = {}): Promise<AptAfterPayment> {
    await this.page
      .waitForFunction(
        () => {
          const onStep6 = /apt\/transaction\/jpj-sub\.do/.test(location.href) && /JPJ Transfer Status/.test(document.body?.innerText ?? "");
          const sent = Array.from(document.querySelectorAll(".ui-dialog")).some(
            (d) => (d as HTMLElement).getClientRects().length > 0 && /Payment request sent/i.test((d as HTMLElement).innerText || ""),
          );
          return onStep6 || sent;
        },
        undefined,
        { timeout: o.timeout ?? 90_000, polling: 250 },
      )
      .catch(() => undefined);
    await this.page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await waitForWorkingToClear(this.page);
    await this.page.waitForTimeout(o.settleMs ?? 3_000);
    const dialogs = await this.page
      .locator(".ui-dialog:visible")
      .evaluateAll((ds) => ds.map((d) => ((d as HTMLElement).innerText || "").replace(/\s+/g, " ").trim()))
      .catch(() => [] as string[]);
    const heading = clean(await this.pageHeading.innerText({ timeout: 2_000 }).catch(() => ""));
    const url = this.page.url();
    return {
      url,
      onStep6: APT_TRANSFER.test(url) && /Submission \(JPJ Transfer\)/.test(heading),
      activeStep: clean(await this.activeStep.innerText({ timeout: 2_000 }).catch(() => "")),
      heading,
      status: await this.transferStatus().catch(() => ""),
      dialogs,
      sentDialog: dialogs.some((d) => /Payment request sent/i.test(d)),
    };
  }

  /**
   * ON Step 6 already (the page landed there after the payment, EAINT-12626): wait for "JPJ Transfer Status" and
   * "Working..." to clear, WITHOUT reloading, and return on arrival. Throws, naming where it is, when not on Step 6.
   */
  @step("APT Step 6 Transfer (arrived, no F5)")
  async arriveTransfer(): Promise<{ url: string; status: string }> {
    if (!APT_TRANSFER.test(this.page.url())) throw new Error(`Not on APT Step 6 (apt/transaction/jpj-sub.do); the page is ${this.page.url()}`);
    await awaitFinalScreen(this.page, this.page.getByText("JPJ Transfer Status").first(), "APT Step 6: JPJ Transfer Status");
    return { url: this.page.url(), status: await this.transferStatus() };
  }

  /** Step 5's "Payment Status:" value ("Failed" after a refused payment); "" when Step 5 shows none. */
  async paymentStatus(): Promise<string> {
    const body = await this.page.locator("body").innerText();
    const m = body.match(/Payment Status:\s*([^\n]+)/);
    return m ? clean(m[1]) : "";
  }

  /**
   * From the APT listing (searched): the row's [View] (`<a href=".../apt/enquiry/view.do?id=…" title="to view A…">View</a>`,
   * same tab) → Transaction Details `apt/enquiry/view.do`. Returns its address.
   */
  @step("APT listing: View -> Transaction Details")
  async openDetails(vehicleRegNo: string): Promise<string> {
    const row = this.page.locator("table tr", { hasText: vehicleRegNo }).last();
    await row.getByText("View", { exact: true }).first().click();
    await this.page.waitForURL(/apt\/enquiry\/view\.do/, { timeout: 30_000 });
    await this.page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await waitForWorkingToClear(this.page);
    return this.page.url();
  }

  /** Transaction Details "Payment Details:" block (`h3.subtitle` + the div after it). */
  get paymentDetailsBlock() {
    return this.page.locator("h3.subtitle", { hasText: "Payment Details:" }).locator("xpath=following-sibling::div[1]");
  }

  /**
   * Transaction Details "Payment Details:" lines as printed (`h6.data.w-90`), e.g.
   * "21-10-2026 04:56pm - RHB (2610210017000279-OQ000009) - OK". The page lists each RHB payment TWICE, once with
   * "-<vehicle>" after the reference and once without (A60347839, probe p01).
   */
  async paymentDetails(): Promise<string[]> {
    return (await this.paymentDetailsBlock.locator("h6.data.w-90").allInnerTexts().catch(() => [] as string[])).map(clean).filter(Boolean);
  }

  /** Transaction Details "JPJ Transfer (Final Submission):" value, e.g. "21-10-2026 04:56pm Successful". */
  async finalSubmission(): Promise<string> {
    const box = this.page.locator("h3.subtitle", { hasText: "JPJ Transfer (Final Submission):" }).locator("xpath=following-sibling::div[1]");
    return clean(await box.innerText({ timeout: 5_000 }).catch(() => ""));
  }

  /** Step 6's "JPJ Transfer Status" value (e.g. "OK - SUCCESSFUL"), read only; "" when it is not on the page. */
  async transferStatus(): Promise<string> {
    const body = await this.page.locator("body").innerText();
    const i = body.indexOf("JPJ Transfer Status");
    if (i === -1) return "";
    return (
      body
        .slice(i + "JPJ Transfer Status".length)
        .split(/\r?\n/)
        .map((x) => x.replace(/^[\s:]+/, "").trim())
        .filter(Boolean)[0] ?? ""
    );
  }
}
