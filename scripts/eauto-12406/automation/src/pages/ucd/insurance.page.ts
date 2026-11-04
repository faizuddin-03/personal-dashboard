import { expect, type Page } from "@playwright/test";
import { BasePage } from "../base.page";
import { step } from "@fixtures/step";
import { UcdHomePage, UCD_MENU } from "./ucd-home.page";
import { awaitFinalScreen } from "../final-step";

/**
 * Insurance / Takaful — UCD portal.
 *
 * Two things set this module apart from the transaction wizards:
 *
 *  - **It does not use `#create-tx`.** STMS, eSerahan, BMK and JomCheck all
 *    start a transaction with that one id; insurance has four separate entry
 *    buttons instead. A helper that assumes the convention finds nothing here.
 *  - **On staging it is wired to eSim, not to a real insurer API** (Azfar,
 *    2026-09-18). Every premium, insurer and quotation is simulated, so a
 *    number read off these screens says nothing about the integration.
 *
 * Reached two ways: from the dealer home tile, or by being diverted out of
 * eSerahan — see `EstmWizardPage.insuranceRoute()`.
 */
export const INSURANCE_HOME = "view/ucd/insurance/home.do";

/** What the quote form calls the two kinds of buyer. */
export type BuyerCategory = "Individual" | "Company";

export class InsurancePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Reach the insurance home screen by clicking its dashboard tile.
   *
   * Not `page.goto(INSURANCE_HOME)`: a constructed path 404s or redirects, and
   * a redirect can land the run on another environment whose login form is
   * identical (qa-principles #13). `INSURANCE_HOME` is kept to assert the
   * click arrived, not to navigate.
   *
   * The caller must already be signed in and on the dashboard.
   */
  @step("Open Insurance from the dashboard")
  async gotoHome(): Promise<void> {
    const home = new UcdHomePage(this.page);
    await home.settle();
    await home.goTo(UCD_MENU.insurance);
    await expect(this.page).toHaveURL(/ucd\/insurance\/home\.do/, { timeout: 30_000 });
  }

  /** The four entry points the module offers, by id. */
  static readonly ENTRY = {
    listing: "#insuranceListing",
    freeQuote: "#freeQuote",
    report: "#report",
    permission: "#insurancePermission",
  } as const;

  @step("Open Get a Free Quote")
  async openFreeQuote(): Promise<void> {
    await this.gotoHome();
    await this.page.locator(InsurancePage.ENTRY.freeQuote).click();
    await this.page.waitForURL(/insurance\/quote\/view\.do/, { timeout: 30_000 });
  }

  @step("Open the insurance transaction listing")
  async openListing(): Promise<void> {
    await this.gotoHome();
    await this.page.locator(InsurancePage.ENTRY.listing).click();
    await this.page.waitForURL(/insurance\/enquiry\/home\.do/, { timeout: 30_000 });
  }

  /**
   * Ask for a quote.
   *
   * Only two fields: the vehicle and the buyer's IC (or company ROC). The
   * category radios decide which of those two the second field means.
   */
  @step("Request a quote")
  async requestQuote(opts: {
    vehicleRegNo: string;
    /** MyKad number for Individual, company ROC for Company. */
    buyerRef: string;
    category?: BuyerCategory;
  }): Promise<void> {
    const category = opts.category ?? "Individual";
    await this.page
      .getByText(category, { exact: true })
      .first()
      .click()
      .catch(() => undefined);

    await this.page.fill("#vehicleRegNo", opts.vehicleRegNo);
    await this.page.fill("#buyerRefIdCompanyROC", opts.buyerRef);
    await this.page.locator("#to-show-result").click();
  }

  /** The quote wizard's own step strip: Quotes · Optional Coverage · Payment · Confirm. */
  async quoteStage(): Promise<string> {
    const body = await this.page.locator("body").innerText();
    for (const stage of ["Optional Coverage", "Quotes", "Payment", "Confirm"]) {
      if (body.includes(stage)) return stage;
    }
    return "(no stage strip)";
  }

  /**
   * The plan wizard's step strip as the page draws it, and which step is active.
   * `.md-stepper-horizontal .md-step`, active one `.md-step.active` (staging 2026-10-20).
   * On the free-quote route the strip has only TWO steps — Quotes · Optional Coverage —
   * Payment and Confirm are not drawn (EAINT-12253 probe p06).
   */
  async planSteps(): Promise<{ steps: string[]; active: string }> {
    const titles = await this.page.locator(".md-stepper-horizontal .md-step .md-step-title").allInnerTexts();
    const active = await this.page
      .locator(".md-stepper-horizontal .md-step.active .md-step-title")
      .first()
      .innerText()
      .catch(() => "");
    return { steps: titles.map((t) => t.trim()), active: active.trim() };
  }

  /** The insurer cards on Quotes: their SELECT buttons (`button.select-plan-btn`, label "SELECT <INSURER>"). */
  planSelectButtons() {
    return this.page.locator("button.select-plan-btn:visible");
  }

  /**
   * Quotes → Optional Coverage: press SELECT on one insurer card (default the first).
   * Lands on `ajax/ucd/insurance/plan/select.do?transactionId=…` with "Optional Coverage" active.
   * Returns the button's label, e.g. "SELECT LONPAC".
   */
  @step("Quotes: select an insurer")
  async selectPlan(index = 0): Promise<string> {
    const btn = this.planSelectButtons().nth(index);
    await (await this.requireVisible(btn, `insurer SELECT button #${index}`)).waitFor();
    const label = (await btn.innerText()).replace(/\s+/g, " ").trim();
    await Promise.all([this.page.waitForURL(/insurance\/plan\/select\.do/, { timeout: 60_000 }), btn.click()]);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    await expect(this.page.locator(".md-step.active .md-step-title")).toHaveText(/Optional Coverage/, { timeout: 30_000 });
    return label;
  }

  /**
   * The controls Optional Coverage offers to move on. On the free-quote route (staging,
   * 2026-10-20) there are NONE: only "< Back" (`#backBtn`). The page script references
   * `#confirm-plan` (→ checkApprovedEstm → plan/confirm.do) and `#save-plan`
   * (Save & Continue Later), but neither element is rendered without an eSTM-linked
   * transaction. Returned so a caller can assert on it rather than time out.
   */
  async optionalCoverageActions(): Promise<{ confirmPlan: boolean; savePlan: boolean; back: boolean }> {
    const vis = (sel: string) => this.page.locator(sel).first().isVisible().catch(() => false);
    return { confirmPlan: await vis("#confirm-plan"), savePlan: await vis("#save-plan"), back: await vis("#backBtn") };
  }

  // ── Steps 3 Payment and 4 Confirm (eSTM-linked transactions only) ─────────────
  // Walked live 2026-10-20 (staging /eauto/, EAINT-12253 probe p09) on the
  // "insurance-after-payment" route (eSerahan paid with eLKM unticked). There the strip has
  // four steps, Quotes · Optional Coverage · Payment · Confirm, and Optional Coverage offers
  // "Make Payment" (`#confirm-plan`).

  /**
   * Optional Coverage → Step 3 Payment: "Make Payment" (`#confirm-plan`; the page checks
   * the eSTM is approved, the quote date and refer-risk, then posts `plan/confirm.do`).
   * Lands on `view/ucd/insurance/plan/payment.do?transactionId=…`. Pays nothing.
   */
  @step("Optional Coverage: Make Payment (to Step 3)")
  async confirmPlanToPayment(): Promise<void> {
    await (await this.requireVisible(this.page.locator("#confirm-plan"), "Make Payment (#confirm-plan)")).click();
    await this.page.waitForURL(/insurance\/plan\/payment\.do/, { timeout: 90_000 });
    await expect(this.page.locator("a#to-pay")).toBeVisible();
    // Step 3 arrives under a "Working..." overlay for ~2 s (verify run
    // EAINT-12253-verify-insurance-20261020-1824-L1); a screenshot of Step 3
    // must not be taken under it. Waiting touches no dialog.
    await this.page.getByText("Working...").waitFor({ state: "hidden", timeout: 30_000 }).catch(() => undefined);
  }

  /**
   * Step 3 Payment's own fields: Reference No (e.g. "B60004460"), the insured's
   * `#mobileNo` / `#email` / `#address1..3` (prefilled), `#hirePurchase` (bank list), PAY NOW `a#to-pay`.
   */
  async paymentReference(): Promise<string> {
    const body = await this.page.locator("body").innerText();
    return /Reference No:\s*(\S+)/.exec(body)?.[1] ?? "";
  }

  /** The Step 3 confirm ("Payment": "Are you sure you want to proceed with this payment? …" Cancel / OK). */
  get paymentDialog() {
    return this.page.locator(".ui-dialog:visible").filter({ has: this.page.locator("#proceed-payment-dialog") });
  }

  /**
   * Step 3: PAY NOW → the "Payment" confirm (Cancel / **OK**, OK = the final pay). Pays nothing.
   * Before the dialog the page runs `checking-duplicate.do` and `verify-pricing.do`; a changed
   * price raises "Price Update Alert" instead (seen once 20.10.2026 after re-selecting a plan on a
   * confirmed transaction) — that is THROWN with its text, never clicked through here.
   */
  @step("Step 3 Payment: PAY NOW (open the confirm)")
  async openPaymentDialog(): Promise<string> {
    await this.page.locator("a#to-pay").click();
    const price = this.page.locator(".ui-dialog:visible").filter({ hasText: "Price Update Alert" });
    await this.paymentDialog.or(price).first().waitFor({ state: "visible", timeout: 60_000 });
    if (await price.isVisible()) throw new Error(`Insurance Step 3: ${(await price.innerText()).replace(/\s+/g, " ").trim()}`);
    return (await this.paymentDialog.innerText()).replace(/\s+/g, " ").trim();
  }

  /** Close the Step 3 confirm with Cancel. Nothing paid. */
  async cancelPaymentDialog(): Promise<void> {
    await this.paymentDialog.locator("button.cancel-dialog-btn, button:text-is('Cancel')").first().click();
    await this.paymentDialog.waitFor({ state: "hidden", timeout: 10_000 });
  }

  /**
   * PAYS (RHB, keyed on the vehicle prefix like the other modules). OK on the Step 3 confirm →
   * `plan/complete.do` = Step 4 Confirm ("Thank you! Your payment has been successfully made.",
   * E-certificate No., Confirmation of Payment, Payment Amount). Returns what Step 4 prints.
   *
   * FINAL STEP of the insurance (EAINT-12253, BA 21.10.2026: the browser reminder shows here, on
   * both the eLKM-unticked and the VEL000069E route). Returns on arrival: the Step 4 marker
   * ("Thank you! Your payment has been successfully made.") visible and "Working..." cleared; the
   * values are READ from the page text, nothing is clicked or dismissed.
   */
  @step("Step 3 Payment: OK (pay)")
  async confirmPayment(): Promise<{ eCertificateNo: string; paymentAmount: string; url: string }> {
    await this.paymentDialog.locator("button.confirm-dialog-btn, button:text-is('OK')").first().click();
    await this.page.waitForURL(/insurance\/plan\/complete\.do/, { timeout: 120_000 });
    await awaitFinalScreen(this.page, this.step4Marker, "Insurance Step 4 Confirm: 'Thank you! Your payment has been successfully made.'");
    return {
      eCertificateNo: await this.labelled("E-certificate No."),
      paymentAmount: await this.labelled("Payment Amount"),
      url: this.page.url(),
    };
  }

  /** Insurance Step 4 Confirm's own marker (seen p09 / p16, 20.10.2026). */
  get step4Marker() {
    return this.page.getByText(/Thank you! Your payment has been successfully made/i);
  }

  /**
   * Step 4 Confirm's way back into the eSerahan on the VEL000069E route: "Continue with eSerahan"
   * `#estmLkmDoneBtn` (seen on staging 20.10.2026, p16, OUP0032; the plain free-quote / eLKM-unticked
   * Step 4 shows `#doneBtn` Done instead). Never pressed by a stop that ends on Step 4.
   */
  get continueWithEstmButton() {
    return this.page.locator("#estmLkmDoneBtn");
  }

  /** Whatever the page is currently objecting to, in its own words. */
  async validationMessages(): Promise<string[]> {
    return this.page.evaluate(() => {
      const found = new Set<string>();
      for (const sel of [".error", ".is-invalid", ".invalid-feedback", ".mandatory", ".text-red"]) {
        for (const el of Array.from(document.querySelectorAll(sel))) {
          const e = el as HTMLElement;
          if (e.offsetParent === null) continue;
          const t = (e.innerText || "").trim();
          if (t && t.length < 300) found.add(t.replace(/\s+/g, " "));
        }
      }
      return Array.from(found);
    });
  }
}

/**
 * How a browser arrived at `insurance/plan/view.do`.
 *
 * Three routes reach the same screen and the query string is the only thing
 * that tells them apart. One of them is a FAILURE code rather than a choice, so
 * a check that only asks "are we on insurance" cannot tell a sold upsell from a
 * diverted transaction.
 *
 * Confirmed on staging 2026-09-18.
 */
export type InsuranceArrival =
  /** Dealer pressed GET A FREE QUOTE. No eSerahan involved. */
  | "free-quote"
  /** eSerahan completed with eLKM unticked — diverted AFTER payment. */
  | "estm-after-payment"
  /** eSerahan enquiry returned VEL000069E — diverted BEFORE the payment screen. */
  | "estm-before-payment"
  | "not-insurance";

export function insuranceArrival(url: string): InsuranceArrival {
  if (!/ucd\/insurance\//.test(url)) return "not-insurance";
  if (/isDirectEstmFirstTime=true/.test(url)) return "estm-after-payment";
  if (/estmTransactionId=/.test(url)) return "estm-before-payment";
  return "free-quote";
}
