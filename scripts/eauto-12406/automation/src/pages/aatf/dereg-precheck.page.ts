import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "../base.page";
import { step } from "@fixtures/step";
import { AatfHomePage } from "./aatf-home.page";
import { awaitFinalScreen } from "../final-step";

/**
 * e-Dereg Pre-Checking Enquiry — AATF portal. Walked live 2026-10-20 (staging /eauto/, azfaraatf,
 * probe p11; paid twice, RM10.40 each, OUP0024 / OUP0028, result GLB000000I).
 *
 *   1 Vehicle · 2 Payment · 3 Result
 *   Step 1 `dereg/precheck/transaction/main.do`: PERAKUAN eDEREG PRE-CHECKING - AATF;
 *     `#vehicleRegNo`, `#jpjReceiptEmail`, `#aatf-consent` (the tick validates both and locks them,
 *     then reveals the form) → ENQUIRE NOW `#to-enquiry` → jQuery dialog `#enquire-dialog`
 *     "Are you sure the vehicle registration number is correct? …" Yes / No (Yes posts
 *     `api/aatf/dereg/precheck/transaction/create.do`, creating the transaction)
 *   Step 2 `precheck/transaction/payment.do?id=` (the payment step): "Click NEXT to pay and retrieve
 *     the vehicle eDereg Pre-Checking result.", Payment Summary (JPJ Fee RM5.00, eAuto Service Fee
 *     RM5.00, SST RM0.40, Total RM10.40), SAVE & CONTINUE LATER `#to-continue`, **NEXT** `#to-payment`
 *     → dialog `#payment-dialog` "Are you sure to make payment? No refund is allowed, once payment is
 *     made …" Yes / No (Yes = the final pay; RHB keyed on the vehicle prefix)
 *   Step 3 `precheck/transaction/result.do?id=` (**the final step**, EAINT-12253 21.10): Enquiry Response (e.g. "GLB000000I - TRANSACTION
 *     SUCCESSFUL"), the checks, "Note: Able to proceed for eDereg", Done `#to-view`.
 */
export class DeregPrecheckPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  @step("Pre-Check: open the enquiry")
  async open(): Promise<void> {
    await new AatfHomePage(this.page).open("precheck-transaction");
    await expect(this.page).toHaveURL(/dereg\/precheck\/transaction\/main\.do/);
    await new AatfHomePage(this.page).closeAnnouncement();
  }

  /** Step 1: vehicle + email, tick the perakuan (reveals ENQUIRE NOW). Creates nothing yet. */
  @step("Pre-Check Step 1: fill and agree")
  async fillVehicle(opts: { vehicleRegNo: string; email: string }): Promise<void> {
    await this.page.locator("#vehicleRegNo").fill(opts.vehicleRegNo);
    await this.page.locator("#jpjReceiptEmail").fill(opts.email);
    await this.page.locator("#aatf-consent").click();
    await expect(this.page.locator("#to-enquiry")).toBeVisible();
  }

  /** Step 1 → 2: ENQUIRE NOW, "Are you sure the vehicle registration number is correct?" Yes. CREATES the transaction. */
  @step("Pre-Check Step 1: Enquire now")
  async enquire(): Promise<void> {
    await this.page.locator("#to-enquiry").click();
    const dlg = this.page.locator(".ui-dialog:visible").filter({ has: this.page.locator("#enquire-dialog") });
    await dlg.waitFor({ state: "visible", timeout: 15_000 });
    await Promise.all([
      this.page.waitForURL(/precheck\/transaction\/payment\.do/, { timeout: 60_000 }),
      dlg.locator("button", { hasText: /^Yes$/ }).click(),
    ]);
    await expect(this.page.locator("#to-payment")).toBeVisible();
  }

  async totalPayable(): Promise<string> {
    return (await this.labelled("Total Amount Payable (inclusive of Service Tax 8%) :")).replace(/^RM\s*/, "").trim();
  }

  get paymentDialog(): Locator {
    return this.page.locator(".ui-dialog:visible").filter({ has: this.page.locator("#payment-dialog") });
  }

  /** Step 2: NEXT → "Are you sure to make payment? …" (Yes / No). Pays nothing. */
  @step("Pre-Check Step 2: NEXT (open the confirm)")
  async openPaymentDialog(): Promise<string> {
    await this.page.locator("#to-payment").click();
    await this.paymentDialog.waitFor({ state: "visible", timeout: 15_000 });
    return (await this.paymentDialog.innerText()).replace(/\s+/g, " ").trim();
  }

  async cancelPaymentDialog(): Promise<void> {
    await this.paymentDialog.locator("button", { hasText: /^No$/ }).click();
    await this.paymentDialog.waitFor({ state: "hidden", timeout: 10_000 });
  }

  /** Step 3 Result's own marker ("Enquiry Response", probe p11, 20.10.2026). */
  get resultMarker(): Locator {
    return this.page.getByText(/Enquiry Response/i);
  }

  /**
   * PAYS. Yes on the Step 2 confirm → Step 3 Result. Returns the enquiry response and note.
   *
   * FINAL STEP of the pre-check (EAINT-12253, BA 21.10.2026: the reminder shows on the final step
   * after payment). Returns on arrival: `result.do`, "Enquiry Response" visible, "Working..." cleared;
   * the values are READ from the page text. Nothing after that touches a dialog.
   */
  @step("Pre-Check Step 2: Yes (pay)")
  async confirmPayment(): Promise<{ enquiryResponse: string; note: string; url: string }> {
    await Promise.all([
      this.page.waitForURL(/precheck\/transaction\/result\.do/, { timeout: 120_000 }),
      this.paymentDialog.locator("button.confirm-dialog-btn, button:text-is('Yes')").first().click(),
    ]);
    await awaitFinalScreen(this.page, this.resultMarker, "Pre-Check Step 3 Result: 'Enquiry Response'");
    const body = await this.page.locator("body").innerText();
    return { enquiryResponse: await this.labelled("Enquiry Response:"), note: /Note:\s*([^\n]+)/.exec(body)?.[1]?.trim() ?? "", url: this.page.url() };
  }
}
