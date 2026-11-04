/**
 * STMS wizard — UCD portal.
 *
 * The customer selling TO the dealer. eSerahan is the mirror image; both build
 * on `TransactionWizardPage`, which holds everything they share — the category
 * tiles, the confirm dialogs, the MyKad read, the announcement modals.
 *
 * Selectors read off staging on 2026-09-15 by dumping the live DOM, not guessed.
 * See `automation/explore-output/` for the dumps each selector came from.
 *
 * Steps: 1 Seller (Owner) · 2 Vehicle · 3 Buyer (Dealer) · 4 JPJ Check ·
 *        5 Payment · 6 Transfer
 */

import type { Locator } from "@playwright/test";
import { TransactionWizardPage, IdCategory, type CardLike, type MyKadDriver } from "../wizard.page";
import { step } from "@fixtures/step";
import { UCD_MENU } from "./ucd-home.page";

/** STMS authenticates the SELLER first, so its picker is the seller's category. */
export const SellerCategory = IdCategory;
export type SellerCategory = IdCategory;

export { CATEGORY_CODE } from "../wizard.page";
export type { CardLike, MyKadDriver } from "../wizard.page";

/**
 * A DATA error, not a product defect: the SSM Document bought at Step 4 does not match what Step 1 keyed (EAINT-10119
 * SRD V1.2 section 2.2.2 flow B: "SSM Document Verification" / "Verification failed: ..."), i.e. the eSim seed's page1 /
 * page3 names another company or director. The SSM fee is ALREADY PAID when this is thrown. Added 21.10.2026 (EAINT-12253
 * triage, cr/EAINT-12253/05-evidence/triage-2026-10-21-ssm.md).
 */
export class SsmDocumentMismatchError extends Error {
  constructor(message: string, readonly popupText: string) {
    super(message);
    this.name = "SsmDocumentMismatchError";
  }
}

export const STMS_LANDING = "view/ucd/stms/view.do";
export const STMS_WIZARD = "view/ucd/stms/transaction/view.do";

export class StmsWizardPage extends TransactionWizardPage {
  protected readonly landingPath = STMS_LANDING;
  protected readonly menuItem = UCD_MENU.stms;
  protected readonly wizardUrlPattern = /stms\/transaction\/view\.do/;

  /** Step 1 — pick the SELLER's ID category, then confirm. */
  async chooseSellerCategory(category: SellerCategory): Promise<void> {
    await this.chooseCategory(category, /auth-seller|mykad-bypass|mykad-without/);
  }

  /**
   * Step 1 — Seller Authentication.
   *
   * Fills the vehicle number, accepts the perakuan, then drives the MyKad read.
   */
  async authenticateSeller(opts: {
    vehicleRegNo: string;
    mykad: MyKadDriver;
    card: CardLike;
    /**
     * The LKM refund e-mail the newer Perakuan asks for (seen on preprod1,
     * 2026-09-28: `#sellerEmail`, required before the consent will tick).
     * Filled only when the field is on the page, so older builds are unaffected.
     */
    sellerEmail?: string;
  }): Promise<void> {
    await this.page.fill("#vehicleRegNo", opts.vehicleRegNo);
    // The page mirrors the value into a readonly twin; wait for that rather
    // than a fixed sleep, so the consent row is not re-rendered under us.
    await this.page
      .locator("#readonlyVehicleRegNo")
      .and(this.page.locator(`[value="${opts.vehicleRegNo}"]`))
      .waitFor({ timeout: 10_000 })
      .catch(() => {});

    const refundEmail = this.page.locator("#sellerEmail");
    if (opts.sellerEmail && (await refundEmail.isVisible().catch(() => false))) {
      await refundEmail.fill(opts.sellerEmail);
    }
    await this.tickConsent("#seller-consent");
    await this.readMyKad(opts.mykad, opts.card);
  }

  /** Step 1 -> Step 2. */
  async continueToVehicle(): Promise<void> {
    await this.clickContinue();
  }

  /**
   * Step 2 — Seller & Vehicle Details (`data-entry.do`).
   *
   * Vehicle No arrives prefilled and readonly from Step 1.
   * Make -> Model is a cascade: Model only holds "Select Model / Other" until a
   * Make is chosen, so the two cannot be set in one go.
   */
  async fillVehicleDetails(v: {
    mobileNo: string;
    email: string;
    engineNo: string;
    chassisNo: string;
    make: string;
    model?: string;
    year: string;
  }): Promise<void> {
    await this.page.fill("#contactNo", v.mobileNo);
    // On the newer build (preprod1) Step 2's email is carried over from the
    // Perakuan's LKM refund email and is readonly — leave it as it came.
    const email = this.page.locator("#email");
    if (await email.isEditable().catch(() => false)) await email.fill(v.email);
    await this.page.fill("#vehicleEngineNo", v.engineNo);
    await this.page.fill("#vehicleChassisNo", v.chassisNo);

    await this.page.selectOption("#vehicleMake", { label: v.make });
    // The model list is repopulated by AJAX after a make is chosen.
    await this.page.locator("#vehicleModel option").nth(1).waitFor({ timeout: 15_000 }).catch(() => {});
    const model = this.page.locator("#vehicleModel");
    if (v.model) {
      await model.selectOption({ label: v.model }).catch(async () => {
        await model.selectOption({ index: 1 });
      });
    } else {
      await model.selectOption({ index: 1 });
    }

    await this.page.selectOption("#vehicleYear", { label: v.year });
  }

  /**
   * Step 2 -> Step 3. Raises a "Sure to continue?" confirmation first.
   *
   * If that dialog never appears the form was rejected, so report WHAT the page
   * objected to. A bare "dialog not visible" timeout sends you hunting in the
   * wrong place.
   */
  async continueToBuyer(): Promise<void> {
    await this.page.locator("#to-continue").click();
    try {
      await this.confirmDialog();
    } catch (e) {
      const complaints = await this.validationMessages();
      if (complaints.length) {
        throw new Error(
          `Step 2 was not accepted. The page reported: ${complaints.join(" | ")}`,
        );
      }
      throw e;
    }
    await this.page.waitForLoadState("networkidle").catch(() => {});
  }

  /** Whatever the page is currently complaining about, in its own words. */
  async validationMessages(): Promise<string[]> {
    return this.page.evaluate(() => {
      const found = new Set<string>();
      const selectors = [
        ".error", ".is-invalid", ".invalid-feedback", ".mandatory",
        "[class*='is-invalid-']", ".text-red", ".errorMessage", "label.error",
      ];
      for (const sel of selectors) {
        for (const el of Array.from(document.querySelectorAll(sel))) {
          const e = el as HTMLElement;
          if (e.offsetParent === null) continue; // not rendered
          const t = (e.innerText || "").trim();
          if (t && t.length < 300) found.add(t.replace(/\s+/g, " "));
        }
      }
      return Array.from(found);
    });
  }

  /**
   * Step 3 — Buyer Authentication (`auth-buyer.do`).
   *
   * Same MyKad controls as Step 1; only the consent checkbox id differs, plus
   * an email field for the JPJ receipt.
   */
  async authenticateBuyer(opts: {
    jpjReceiptEmail: string;
    mykad: MyKadDriver;
    card: CardLike;
  }): Promise<void> {
    await this.page.fill("#jpjReceiptEmail", opts.jpjReceiptEmail);
    await this.tickConsent("#buyer-consent");
    await this.readMyKad(opts.mykad, opts.card);
  }

  /** Step 3 -> Step 4 (JPJ Check). */
  async continueToJpjCheck(): Promise<void> {
    await this.clickContinue();
  }

  /**
   * Step 4 — agree, then run the JPJ enquiry.
   *
   * The wizard's action controls are `<div class="next-btn">`, not buttons.
   * They carry ids, so use those; text matching picks up decoration.
   */
  async runJpjEnquiry(): Promise<Record<string, string>> {
    await this.tickConsent("#to-agree");
    await this.page.locator("#to-enquiry").click();
    await this.confirmDialog(); // "Submit to JPJ for checking?"

    /**
     * Wait for the enquiry to RESOLVE, not for payment to be offered.
     *
     * A failed JPJ response (anything other than SUCCESSFUL) still renders a
     * result, but the page does NOT show "Make Payment" — which is correct
     * behaviour, and is why waiting on `#to-payment` wrongly turns every
     * negative scenario into a timeout.
     */
    await this.page
      .locator("body")
      .filter({ hasText: /Response Code:/ })
      .waitFor({ timeout: 60_000 });

    return this.jpjEnquiryResult();
  }

  /** True when the enquiry left the transaction able to proceed to payment. */
  async canProceedToPayment(): Promise<boolean> {
    return this.page
      .locator("#to-payment")
      .isVisible()
      .catch(() => false);
  }

  /** What JPJ came back with at Step 4. Drives assertions about response codes. */
  async jpjEnquiryResult(): Promise<Record<string, string>> {
    return {
      validAsAt: await this.labelled("Valid As At:"),
      blacklisted: await this.labelled("Blacklisted:"),
      hakMilikDituntut: await this.labelled("Hak Milik Dituntut:"),
      conditionCode: await this.labelled("Condition Code:"),
      status: await this.labelled("JPJ Enquiry Status:"),
      responseCode: await this.labelled("Response Code:"),
    };
  }

  /** Step 4 -> Step 5 (payment page). */
  async goToPayment(): Promise<void> {
    await this.page.locator("#to-payment").click();
    await this.confirmDialog(); // "Sure to continue?"
    await this.page.waitForURL(/payment\.do/, { timeout: 60_000 });
  }

  /**
   * Step 5 -> Step 6. Submits the payment and waits for the JPJ transfer.
   *
   * This COMPLETES the transaction. RHB's response is simulated by eSim
   * (`rhb-transfer-resp`), keyed on the vehicle-number prefix like the rest.
   */
  async submitPayment(): Promise<void> {
    await this.page.locator("#to-payment").click();
    await this.confirmDialog(); // "Sure to submit this payment?"
    await this.page.waitForURL(/jpj-sub\.do/, { timeout: 120_000 });
  }

  /**
   * Submit the payment and report what the RHB gateway did.
   *
   * A failed RHB response does NOT navigate. The page stays on `payment.do`
   * and raises a jQuery dialog carrying the bilingual message the checklist
   * specifies — e.g. for `IF`:
   *
   *   "Wang di dalam akaun RHB anda TIDAK MENCUKUPI. 你的RHB银行余额不足."
   *
   * So a helper that waits for a URL change reports a timeout for a case the
   * product handled correctly. This returns the outcome instead.
   */
  @step("Submit the payment and read RHB's answer")
  async submitPaymentAndReadResult(): Promise<
    { outcome: "transferred"; url: string } | { outcome: "rejected"; message: string }
  > {
    const before = this.page.url();
    await this.page.locator("#to-payment").click();
    await this.confirmDialog().catch(() => undefined);

    // Either the flow moves on, or a dialog appears saying why it did not.
    const moved = await this.page
      .waitForURL((u) => u.toString() !== before, { timeout: 60_000 })
      .then(() => true)
      .catch(() => false);

    if (moved) return { outcome: "transferred", url: this.page.url() };

    return { outcome: "rejected", message: await this.paymentDialogMessage() };
  }

  /**
   * The text of the dialog RHB's refusal raises, with the chrome stripped.
   *
   * The dialog renders as "Payment close <message> OK", so the title, the
   * close icon and the button are removed to leave what a user actually reads.
   */
  async paymentDialogMessage(): Promise<string> {
    const dialog = this.page.locator(".ui-dialog:visible").last();
    if (!(await dialog.isVisible().catch(() => false))) return "";
    const raw = (await dialog.innerText()).replace(/\s+/g, " ").trim();
    return raw
      .replace(/^Payment\s*/i, "")
      .replace(/^close\s*/i, "")
      .replace(/\s*OK$/i, "")
      .trim();
  }

  /** The Step 6 outcome. */
  async transferResult(): Promise<{ status: string; submittedAt: string }> {
    return {
      status: await this.labelled("JPJ Transfer Status:"),
      submittedAt: await this.labelled("Submission Date/Time:"),
    };
  }

  /** Alias kept for callers written before the shared base existed. */
  async sellerFromCard(): Promise<{ name: string; nric: string }> {
    return this.identityFromCard();
  }

  /** Alias kept for callers written before the shared base existed. */
  async dismissModals(): Promise<void> {
    await this.dismissAnnouncements();
  }

  // ── Company (SYARIKAT) seller, Steps 1-2 (added 21.10.2026 for EAINT-12253 CH_TS1 / BEH_TS7) ─────────────────────
  //
  // Selectors are the ones the EAINT-12022 Company STMS ran with end to end on staging /preprod1 16.10.2026
  // (cr/EAINT-12022/03-spec/rerun-1610/rerun-1610-c4.spec.ts IC_REG_TS9, evidence
  // cr/EAINT-12022/05-evidence/run-1610-rerun/IC_REG_TS9/01-02 + video: ON000103 Approved). Not yet re-seen through
  // these methods: `stms-company.flow.ts` is UNVERIFIED until its verify spec has run.
  //   Step 1 (category SYARIKAT): `#vehicleRegNo`, `#companyName`, `#companyRegNo` (leave it), `#sellerEmail` when shown,
  //     `#seller-consent`, the representative's MyKad → Next.
  //   Step 2: the vehicle fields (as MyKad), the company type "Sdn Bhd or Bhd", Address (`#permanentAddress` /
  //     `#mailingAddress` when empty), the document boxes "Please attach the following" (SSM Company Profile, Company
  //     Board Resolution, Staff Employment Pass & MyKad; with the company's Purchase SSM Document setting ticked only the
  //     Board Resolution box is shown, EAINT-12395: upload into the VISIBLE boxes only), Next `#to-continue-company`
  //     → "Sure to continue?" (confirm-dialog-btn) → Step 3 `auth-buyer.do`.

  /** Step 1, Company seller: vehicle, company name + registration no., consent, then the representative's MyKad. */
  async authenticateCompanySeller(opts: {
    vehicleRegNo: string;
    companyName: string;
    companyRegNo: string;
    mykad: MyKadDriver;
    card: CardLike;
    sellerEmail?: string;
  }): Promise<void> {
    await this.page.fill("#vehicleRegNo", opts.vehicleRegNo);
    await this.page.fill("#companyName", opts.companyName);
    await this.page.fill("#companyRegNo", opts.companyRegNo);
    await this.page.locator("#companyRegNo").blur();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    const refundEmail = this.page.locator("#sellerEmail");
    if (opts.sellerEmail && (await refundEmail.isVisible().catch(() => false))) await refundEmail.fill(opts.sellerEmail);
    await this.tickConsent("#seller-consent");
    await this.readMyKad(opts.mykad, opts.card);
  }

  /**
   * Step 2, Company seller: the vehicle fields, the company type, the address when empty, and `documentFile` into every
   * VISIBLE document box. Returns how many boxes were filled.
   */
  async fillCompanySellerDetails(
    v: Parameters<StmsWizardPage["fillVehicleDetails"]>[0],
    opts: { documentFile: string; address?: string },
  ): Promise<number> {
    await this.fillVehicleDetails(v);
    const sdnBhd = this.page.getByLabel("Sdn Bhd or Bhd", { exact: true });
    if (await sdnBhd.isVisible().catch(() => false)) await sdnBhd.check({ force: true }).catch(() => undefined);
    else await this.page.getByText("Sdn Bhd or Bhd", { exact: true }).first().click().catch(() => undefined);
    for (const id of ["#permanentAddress", "#mailingAddress"]) {
      const a = this.page.locator(id);
      if ((await a.isEditable().catch(() => false)) && !(await a.inputValue().catch(() => "x"))) {
        await a.fill(opts.address ?? "NO 1 JALAN QA, TAMAN SIMULATOR, 81100 JOHOR BAHRU, JOHOR");
      }
    }
    const files = this.page.locator("input[type=file]");
    let filled = 0;
    for (let i = 0; i < (await files.count()); i++) {
      const f = files.nth(i);
      const shown = await f.evaluate((e) => {
        const el = e as HTMLElement;
        const box = el.closest("tr, .form-group, .row, div") as HTMLElement | null;
        return !!(el.offsetParent || (box && box.offsetParent && getComputedStyle(box).display !== "none"));
      });
      if (shown) {
        await f.setInputFiles(opts.documentFile);
        filled += 1;
      }
    }
    return filled;
  }

  /** Step 2 → Step 3 for a Company seller: `#to-continue-company`, "Sure to continue?" confirmed, Buyer Authentication. */
  async continueFromCompanyDetails(): Promise<void> {
    await this.page.locator("#to-continue-company").click();
    try {
      await this.confirmDialog();
    } catch (e) {
      const complaints = await this.validationMessages();
      if (complaints.length) throw new Error(`Step 2 (Company) was not accepted. The page reported: ${complaints.join(" | ")}`);
      throw e;
    }
    await this.page.waitForURL(/auth-buyer/, { timeout: 60_000 });
  }

  /**
   * Step 4: buy the SSM Document when it is asked. PAYS the SSM fee (RM19.44 seen on staging /uat1/ 21.10.2026).
   *
   * Seen on staging /uat1/ 21.10.2026 (run EAINT-12253-verify-stms-company-ssm-r2-20261021-1829-L1, its trace: the two
   * dialogs' DOM and the jpj-enq.do page script), not guessed:
   *  1. `<input type="button" id="to-get-ssm" value="Purchase SSM">` -> GET search-ssm.do -> dialog "Purchase SSM
   *     Document" with content `#ssm-details` ("SSM Document is available to purchase: ... Seller Company Name / Seller
   *     SSM Number ... Please reconfirm ...") and buttons Cancel (`cancel-dialog-btn`) / Next (`confirm-dialog-btn`).
   *  2. Next -> GET payment.do -> dialog "Purchase SSM Document" with content `#ssm-payment-popup` ("Payment Summary",
   *     "SSM Profile & Admin Fees : RM 18.00", "eAuto Service Tax : RM 1.44", "Total Amount Payable : RM 19.44" in
   *     `.totalPayableAmount`, the 7-day validity line; RHB Direct Debit preselected in a hidden radio) and buttons
   *     Cancel (`cancel-dialog-btn`, reloads) / Make Payment (`confirm-wfw-dialog-btn`). NOT Yes / OK / Next: the r2
   *     run timed out here on `confirmDialog`.
   *  3. Make Payment -> the dialog closes, POST make-payment.do; "OK" -> GET verify.do; OK -> `location.reload()`, i.e.
   *     back on Step 4. The reloaded Step 4 is rendered by the SERVER with the EAINT-10119 document check already in it
   *     (seen 21.10.2026, run ...-ssm-r4-20261021-1917-L1, page HTML): on load it calls
   *     `openCustomDialogWithTitle(<result>, "SSM Document Verification", false, null)` = `#custom-dialog`
   *     (`#custom-field` holds the text), one button OK (`button.confirm-dialog-btn`) that only closes it.
   *     a. "Verification failed: ... does not match the SSM document." (seen r4): no Make Payment, only Save & Continue
   *        Later (SRD V1.2 section 2.2.2 flow B). The SSM fee IS PAID by then. Thrown as `SsmDocumentMismatchError`, OK
   *        not pressed (it leads nowhere; the screen stays as evidence).
   *     b. "Verification successful ..." (the LKM board's "Show Verification Successful Popup", miro-lkm-board.md
   *        ~585/590; not yet seen on staging): its text is kept in `dialogs`, OK pressed, then Step 4's Make Payment
   *        (`#to-payment`) is waited for.
   *     Any other answer opens an alert dialog (`#alert-dialog`: "Payment" / "JPJ Enquiry" / "Purchase SSM Document",
   *     e.g. "Wang di dalam akaun RHB anda TIDAK MENCUKUPI", "Another payment in progress"): read and thrown.
   *     An SSM search that fails shows `#custom-dialog` at step 1 instead.
   * Only dialogs 1, 2 and 3b are answered. Any other dialog is read and THROWN (nothing pressed in it), as is a dialog 2
   * without a visible Make Payment (an error in its content, "purchased recently", "RHB account is inactive").
   * 3b is UNVERIFIED until the verify spec runs `buySsm` again on a matching seed. Returns each dialog's text in order
   * (2, or 3 with the success pop-up) and the Total Amount Payable read from dialog 2.
   */
  async purchaseSsm(): Promise<{ dialogs: string[]; total: string }> {
    const dialogs: string[] = [];
    const visibleDialog = this.page.locator(".ui-dialog:visible");
    const textOf = async (d: Locator) => (await d.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    const unknown = async (where: string): Promise<never> => {
      const all: string[] = [];
      for (let i = 0; i < (await visibleDialog.count().catch(() => 0)); i++) all.push(await textOf(visibleDialog.nth(i)));
      throw new Error(`SSM purchase, ${where}: a pop-up this method does not answer is open, nothing pressed in it: ${all.join(" || ") || "(none)"}; before it: ${dialogs.join(" || ") || "(none)"}`);
    };
    /** Wait for `want` (or any other visible dialog = unknown). */
    const waitFor = async (want: Locator, where: string, ms: number) => {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        if (await want.isVisible().catch(() => false)) return;
        if ((await visibleDialog.count().catch(() => 0)) > 0 && !(await want.isVisible().catch(() => false))) {
          await this.page.waitForTimeout(1_000); // a dialog being swapped for the next: look again before calling it unknown
          if (await want.isVisible().catch(() => false)) return;
          if ((await visibleDialog.count().catch(() => 0)) > 0) await unknown(where);
        }
        await this.page.waitForTimeout(500);
      }
      throw new Error(`SSM purchase, ${where}: nothing shown within ${ms / 1000} s; before it: ${dialogs.join(" || ") || "(none)"}`);
    };

    await this.page.locator("#to-get-ssm").click();

    // 1. Seller company details: Next.
    const details = visibleDialog.filter({ has: this.page.locator("#ssm-details") });
    await waitFor(details, "after [Purchase SSM]", 120_000);
    dialogs.push(await textOf(details));
    await details.locator("button.confirm-dialog-btn", { hasText: /^Next$/ }).click();

    // 2. Payment Summary: read the total, Make Payment.
    const pay = visibleDialog.filter({ has: this.page.locator("#ssm-payment-popup") });
    await waitFor(pay, "after the company pop-up's [Next]", 120_000);
    dialogs.push(await textOf(pay));
    const total = (await pay.locator(".totalPayableAmount").innerText().catch(() => "")).trim();
    const makePayment = pay.locator("button.confirm-wfw-dialog-btn", { hasText: /^Make Payment$/ });
    if (!(await makePayment.isVisible().catch(() => false)) || !(await makePayment.isEnabled().catch(() => false))) {
      throw new Error(`SSM purchase: the Payment Summary pop-up has no Make Payment to press (nothing pressed): ${dialogs.join(" || ")}`);
    }
    await makePayment.click();

    // 3. Paid; Step 4 reloads with the server's "SSM Document Verification" pop-up: failed = thrown (fee already paid),
    //    successful = OK, then Step 4's Make Payment. Any other pop-up = unknown, thrown.
    const step4Pay = this.page.locator("#to-payment");
    const verification = visibleDialog.filter({ has: this.page.locator("#custom-field") }).filter({ hasText: /SSM Document Verification/i }).first();
    /** Answers the verification pop-up when it is the one up: true = the success one, OK pressed. Failed = thrown. */
    const answerVerification = async (where: string): Promise<boolean> => {
      if (!(await verification.isVisible().catch(() => false))) return false;
      const field = (await verification.locator("#custom-field").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
      if (/^Verification failed/i.test(field)) {
        throw new SsmDocumentMismatchError(
          `SSM purchase, ${where}: the SSM fee (RM ${total || "?"}) WAS ALREADY PAID, but the bought SSM Document does not match ` +
            `Step 1 (company name / registration number / director): "${field}". The transaction stays at Step 4 with only ` +
            `Save & Continue Later and cannot go on. Check the eSim seed's page1 (NAME / REF_NO / NEW_REF_NO) and page3 ` +
            `directors, and use a NEW company: this document stays stored for 7 days. Pop-up left open (OK not pressed); ` +
            `before it: ${dialogs.join(" || ")}`,
          field,
        );
      }
      if (/^Verification successful/i.test(field)) {
        dialogs.push(await textOf(verification));
        await verification.locator("button.confirm-dialog-btn", { hasText: /^OK$/ }).click();
        await verification.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => undefined);
        return true;
      }
      return false; // an SSM Document Verification text no document names: left to `unknown`
    };
    let verified = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 180_000) {
      if ((await visibleDialog.count().catch(() => 0)) > 0) {
        if (!verified && (await answerVerification("after [Make Payment]"))) { verified = true; continue; }
        await this.page.waitForTimeout(1_500); // the Payment Summary pop-up closing, or the reloaded Step 4's pop-up opening
        if (!verified && (await answerVerification("after [Make Payment]"))) { verified = true; continue; }
        if ((await visibleDialog.count().catch(() => 0)) > 0) await unknown("after [Make Payment]");
      }
      if (await step4Pay.isVisible().catch(() => false)) {
        await this.page.waitForLoadState("networkidle").catch(() => undefined);
        if ((await visibleDialog.count().catch(() => 0)) > 0) {
          if (!verified && (await answerVerification("after [Make Payment], over Step 4"))) { verified = true; continue; }
          await unknown("after [Make Payment], over Step 4");
        }
        return { dialogs, total };
      }
      await this.page.waitForTimeout(500);
    }
    throw new Error(`SSM purchase: Step 4 did not come back with Make Payment within 180 s after [Make Payment]; dialogs: ${dialogs.join(" || ")}`);
  }

  /** Step 4 after the JPJ enquiry: is the SSM Document purchase asked for (a "Purchase SSM" control, no Make Payment)? Reads only. */
  async ssmPurchaseAsked(): Promise<boolean> {
    const buy = this.page.locator("a:visible, button:visible, div.next-btn:visible, input[type=button]:visible").filter({ hasText: /Purchase SSM/i });
    return (await buy.count().catch(() => 0)) > 0;
  }
}
