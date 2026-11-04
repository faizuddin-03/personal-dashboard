import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "../base.page";
import { step } from "@fixtures/step";
import { UcdHomePage, UCD_MENU } from "./ucd-home.page";
import { awaitFinalScreen } from "../final-step";

/**
 * JomCheck purchase — UCD portal (Get JomCheck Reports).
 *
 * Selectors read off staging /eauto/ on 2026-10-20 (EAINT-12253 probes p02 / p03,
 * `cr/EAINT-12253/03-spec/probes-2010/`), from the live DOM and the page's own
 * handlers, not guessed.
 *
 * The journey, as observed:
 *   tile JOMCHECK REPORT → `view/ucd/jomcheck/view.do`
 *   → `#create-tx` "PURCHASE JOMCHECK REPORT" → `view/ucd/jomcheck/transaction/view.do`
 *   → Vehicle No. (`#vehicleRegNo`, radio `#vehicleNoRadio`) or Chassis No.
 *     (`#vehicleChassisNo`, radio `#chassisNoRadio`) → **Submit** `#to-check-vehicle`
 *     (posts `ajax/ucd/jomcheck/transaction/save.do`: this CREATES a Pending JomCheck
 *     transaction; the URL then carries `?transactionId=<uuid>`)
 *   → `#result`: "Vehicle number found. Pay now (RM20.00 + 8% Service Tax) to purchase
 *     the report." + optional credit-company share boxes (`.share-cc-pay`) + **Pay Now** `#to-pay`
 *   → jQuery UI dialog "Payment" (`#do-payment-dialog`): "Are you sure you want to proceed
 *     with this payment? …" with **No** (`.cancel-dialog-btn`) / **Yes** (`.confirm-dialog-btn`).
 *     Yes posts `make-payment.do` (RHB). Yes is the final pay.
 *   → paid (probe p22, OUP0039, RM21.60, 20.10.2026): the SAME page and URL
 *     (`transaction/view.do?transactionId=…`), Result now "Report is retrieved successfully. You can
 *     download the report now or access it later through the JomCheck report listing.", with
 *     **Search Another Vehicle** `#to-search-new-vehicle` and **Download Report** `#to-view-report`.
 *     That is the FINAL STEP (EAINT-12253, BA 21.10.2026: the browser reminder shows there).
 *
 * No MyKad / thumbprint anywhere on this path.
 */
export class JomCheckPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private get submitButton(): Locator {
    return this.page.locator("#to-check-vehicle");
  }
  get payNowButton(): Locator {
    return this.page.locator("#to-pay");
  }
  /** The "Payment" confirm dialog opened by Pay Now (jQuery UI wraps `#do-payment-dialog`). */
  get paymentDialog(): Locator {
    return this.page.locator(".ui-dialog:visible").filter({ has: this.page.locator("#do-payment-dialog") });
  }

  @step("Open JomCheck from the dashboard")
  async gotoLanding(): Promise<void> {
    const home = new UcdHomePage(this.page);
    await home.returnToDashboard();
    await home.goTo(UCD_MENU.jomcheckReport);
    await expect(this.page).toHaveURL(/ucd\/jomcheck\/view\.do/, { timeout: 30_000 });
  }

  @step("Purchase JomCheck Report: open the search form")
  async startPurchase(): Promise<void> {
    await this.gotoLanding();
    await Promise.all([
      this.page.waitForURL(/jomcheck\/transaction\/view\.do/, { timeout: 30_000 }),
      this.page.locator("#create-tx").click(),
    ]);
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Fill the search and press Submit. Creates a Pending transaction (no charge yet).
   * Waits for the page to come back with a transaction id and a result.
   */
  @step("Search a vehicle and Submit")
  async submitSearch(opts: { vehicleRegNo?: string; chassisNo?: string }): Promise<void> {
    if (opts.chassisNo) {
      await this.page.locator("#chassisNoRadio").check();
      await this.page.locator("#vehicleChassisNo").fill(opts.chassisNo);
    } else {
      if (!opts.vehicleRegNo) throw new Error("JomCheck search needs a vehicleRegNo or a chassisNo.");
      await this.page.locator("#vehicleNoRadio").check();
      await this.page.locator("#vehicleRegNo").fill(opts.vehicleRegNo);
    }
    await Promise.all([
      this.page.waitForURL(/jomcheck\/transaction\/view\.do\?transactionId=/, { timeout: 90_000 }),
      this.submitButton.click(),
    ]);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    await this.page.locator("#result").waitFor({ state: "visible", timeout: 60_000 });
  }

  /**
   * The text under "Result", e.g. "Vehicle number found. Pay now (RM20.00 + 8% Service Tax) …".
   * `#result` holds only "Vehicle number found."; the Pay now sentence is a sibling in the
   * same paragraph (probe p03, verify runs EAINT-12253-verify-jomcheck-20261020-1630/1636-L2),
   * so read the paragraph around it.
   */
  async resultText(): Promise<string> {
    const result = this.page.locator("#result");
    if (/found\.$/i.test((await result.innerText()).trim())) {
      await this.payNowButton.waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
    }
    return (await result.locator("xpath=..").innerText()).replace(/\s+/g, " ").trim();
  }

  /** The transaction the Submit created, from the URL. */
  transactionId(): string | undefined {
    return new URL(this.page.url()).searchParams.get("transactionId") ?? undefined;
  }

  /** Press Pay Now and wait for the "Payment" confirm dialog. Pays NOTHING. Returns the dialog text. */
  @step("Pay Now: open the Payment confirm dialog")
  async openPayNowDialog(): Promise<string> {
    await (await this.requireVisible(this.payNowButton, "Pay Now (#to-pay)")).click();
    await this.paymentDialog.waitFor({ state: "visible", timeout: 15_000 });
    return (await this.page.locator("#do-payment-field").innerText()).replace(/\s+/g, " ").trim();
  }

  /** The final screen's Download Report button (`#to-view-report`, after a good payment). Never pressed by a flow. */
  get downloadReportButton(): Locator {
    return this.page.locator("#to-view-report");
  }

  /**
   * PAYS. Yes on the open Payment dialog, then return ON ARRIVAL at the result: "Report is retrieved
   * successfully…" with Download Report (`#to-view-report`) visible and "Working..." cleared. Nothing
   * after that touches a dialog (EAINT-12253, 21.10). A refusal (RHB) leaves a dialog on the page:
   * its text is read and returned, nothing clicked. Returns the Result paragraph or the refusal text.
   */
  @step("Payment dialog: Yes (pay)")
  async confirmPayment(): Promise<{ outcome: "paid"; result: string } | { outcome: "refused"; message: string }> {
    const dlg = this.paymentDialog;
    await dlg.locator("button.confirm-dialog-btn, button:text-is('Yes')").first().click();
    await dlg.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => undefined);
    // "Paid" = the VISIBLE Download Report (#to-view-report), then the VISIBLE "Report is retrieved successfully".
    //
    // ONE wait, never two in a Promise.race (21.10.2026, EAINT-12253 CH_TS8). Until then this raced two waitFor()s (the
    // sentence, the refusal dialog). The CH_TS8 run (Chassis No. 406/ AH-4878, paid) had a Playwright locator handler on
    // #to-pay armed by the CR spec (its no-reminder proof on the Result). Both waits hit that handler in the same
    // instant (trace 04-runs/EAINT-12253-sheet2-CH8-20261021-1359-L2, calls 278 + 280 at 26618 ms). One interception
    // never finished, so the sentence wait sat out 120 s while `<span id="result">Report is retrieved
    // successfully.</span>` was visible (the page has ONE such span: no hidden copy). The vehicle-number verify runs
    // had no handler armed, which is why they passed. A single wait on "Download Report OR a refusal" meets any locator
    // handler one at a time.
    const download = this.downloadReportButton.filter({ visible: true }).first();
    const retrieved = this.page.getByText(/Report is retrieved successfully/i).filter({ visible: true }).first();
    const refusal = this.page
      .locator(".ui-dialog:visible")
      .filter({ hasNot: this.page.locator("#do-payment-dialog") })
      .filter({ hasNotText: /Browser Reminder|浏览器提醒/i });
    const arrived = await this.downloadReportButton
      .filter({ visible: true })
      .or(refusal)
      .first()
      .waitFor({ state: "visible", timeout: 120_000 })
      .then(() => true, () => false);
    if (!arrived) throw new Error(`JomCheck: no result within 120 s of the payment Yes (${this.page.url()}).`);
    if (!(await download.isVisible().catch(() => false))) {
      return { outcome: "refused", message: (await refusal.first().innerText().catch(() => "")).replace(/\s+/g, " ").trim() };
    }
    await awaitFinalScreen(this.page, download, "JomCheck result: Download Report (#to-view-report)");
    await retrieved.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {
      throw new Error(`JomCheck: Download Report is shown but "Report is retrieved successfully" is not visible (${this.page.url()}).`);
    });
    // Read only. The sentence sits in the Result paragraph (p22); read the paragraph around it.
    const result = (await retrieved.locator("xpath=..").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    return { outcome: "paid", result };
  }

  /** Close the Payment dialog with **No**. The transaction stays Pending, unpaid. */
  @step("Payment dialog: No")
  async cancelPayNowDialog(): Promise<void> {
    const dlg = this.paymentDialog;
    await dlg.locator("button.cancel-dialog-btn, button:text-is('No')").first().click();
    await dlg.waitFor({ state: "hidden", timeout: 10_000 });
  }

  // ── JomCheck Transaction Listing (added 21.10.2026 late, EAINT-12253 CH_TS8 / FF_TS10 (b)); not called by the flow ──

  /**
   * The JomCheck Transaction Listing row of a vehicle, keyed by column header (read only). The listing
   * `view/ucd/jomcheck/enquiry/` (opened by address on the SAME instance, clicking nothing on the current screen) is
   * searched by Vehicle No `#vehicleNo` + Search Now `#to-search`; columns "# | Vehicle | Chassis No | Transaction No |
   * Created At | Payment | Tx Status | e-Invoice Status | Remarks | Action" (probe cr/EAINT-12253/03-spec/probes-2110
   * p07, staging /uat1/ 21.10.2026). `row` = the newest matching row's locator (for a screenshot outline); `cells` null
   * when there is no row.
   */
  @step("JomCheck listing: read the vehicle's row")
  async listingRow(vehicleRegNo: string): Promise<{ cells: Record<string, string> | null; row: Locator }> {
    const root = this.page.url().replace(/\/view\/.*/, "");
    await this.page.goto(`${root}/view/ucd/jomcheck/enquiry/`);
    await this.page.locator("#vehicleNo").waitFor({ state: "visible", timeout: 30_000 });
    await this.page.locator("#vehicleNo").fill(vehicleRegNo);
    await this.page.locator("#to-search").click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    const row = this.page.locator("table tr").filter({ hasText: vehicleRegNo }).last();
    await row.waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
    const raw = await this.page.evaluate((v) => {
      // not String.prototype.trim: on this page it leaves a trailing space (run 22.10.2026 read "OK ", "Failed ")
      const norm = (x: string) => x.replace(/\s+/g, " ").replace(/^ /, "").replace(/ $/, "");
      const own = (tr: Element) => Array.from(tr.children).filter((c) => c.tagName === "TD");
      const rows = Array.from(document.querySelectorAll("tr")).filter((tr) => own(tr).length > 6 && own(tr).some((td) => norm(td.textContent || "") === v));
      const tr = rows[rows.length - 1];
      if (!tr) return null;
      const header = Array.from(tr.closest("table")!.querySelectorAll("tr")).find((h) => h.querySelectorAll(":scope > th").length > 4);
      const ths = header ? Array.from(header.querySelectorAll(":scope > th")).map((th) => norm(th.textContent || "")) : [];
      const out: Record<string, string> = {};
      own(tr).forEach((td, i) => { out[ths[i] || `col${i + 1}`] = norm(td.textContent || ""); });
      return out;
    }, vehicleRegNo);
    // collapsed and trimmed again here, in Node, so a cell never carries the page's whitespace into a comparison
    const tidy = (x: string) => x.replace(/\s+/g, " ").trim();
    const cells = raw ? Object.fromEntries(Object.entries(raw).map(([k, val]) => [tidy(k), tidy(val)])) : null;
    return { cells, row };
  }
}
