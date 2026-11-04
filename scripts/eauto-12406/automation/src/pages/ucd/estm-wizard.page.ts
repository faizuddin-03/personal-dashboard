/**
 * eSerahan (eSTM) wizard — UCD portal.
 *
 * The ownership transfer from the dealer to the buying customer, so the roles
 * are mirrored from STMS: STMS authenticates the SELLER first ("Kategori ID
 * PENJUAL"), eSerahan authenticates the BUYER ("Kategori ID PEMBELI").
 *
 * Structurally it is the same wizard — identical category tiles, identical
 * confirm dialogs, identical MyKad panel — so it subclasses the shared base and
 * only states what differs.
 *
 * One trap that STMS does NOT have: the create screen opens an
 * `ANNOUNCEMENT/PENGUMUMAN` modal (`#dialog-estm-announcement`) whose overlay
 * covers the category tiles. Every click times out until it is closed.
 * `dismissAnnouncements()` in the base handles it.
 *
 * Mapped on staging 2026-09-15.
 */

import { TransactionWizardPage, type CardLike, type IdCategory, type MyKadDriver } from "../wizard.page";
import { step } from "@fixtures/step";
import { UCD_MENU } from "./ucd-home.page";
import { awaitFinalScreen } from "../final-step";

export const ESTM_LANDING = "view/ucd/estm/view.do";
export const ESTM_WIZARD = "view/ucd/estm/transaction/view.do";

/**
 * The six steps eSerahan shows — note they mirror STMS rather than repeat it:
 *   1 Buyer (Customer) · 2 Vehicle · 3 Seller (Dealer) · 4 JPJ Check · 5 Payment · 6 Transfer
 */
export class EstmWizardPage extends TransactionWizardPage {
  protected readonly landingPath = ESTM_LANDING;
  protected readonly menuItem = UCD_MENU.eSerahan;
  protected readonly wizardUrlPattern = /estm\/transaction\/view\.do/;

  /** Step 1 — pick the BUYER's ID category. */
  async chooseBuyerCategory(category: IdCategory): Promise<void> {
    await this.chooseCategory(category, /estm\/transaction\/(auth|data|mykad)/);
  }

  /**
   * Step 1 — Buyer Authentication.
   *
   * Takes an email as well as the vehicle number, because the perakuan here
   * also covers **eVOC** and **eLKM**: the eVOC certificate is sent to this
   * address. Those options are agreed to on this screen, not in a separate
   * module.
   *
   * `#jpjReceiptEmail` and `#ucd-consent` are present in the DOM but render at
   * zero size — they belong to the SELLER (dealer) step, not this one. Filling
   * them here just times out.
   */
  async authenticateBuyer(opts: {
    vehicleRegNo: string;
    email: string;
    mykad: MyKadDriver;
    card: CardLike;
  }): Promise<void> {
    await this.page.fill("#vehicleRegNo", opts.vehicleRegNo);
    await this.page.fill("#email", opts.email);
    await this.tickConsent("#buyer-consent");
    await this.readMyKad(opts.mykad, opts.card);
  }

  /** Step 1 -> Step 2 (Vehicle). */
  async continueToVehicle(): Promise<void> {
    await this.clickContinue();
  }

  /**
   * Step 2 — Buyer & Vehicle Details (`data-entry.do`).
   *
   * Not the same form as STMS step 2, despite the same URL shape:
   *  - eSerahan collects a MAILING ADDRESS with a postcode and a district,
   *    because the eVOC certificate is posted as well as emailed.
   *  - It does NOT ask for vehicle make, model or year. STMS does.
   *  - `#email` arrives prefilled from step 1 and must be typed again into
   *    `#reconfirmEmail`; the page compares them.
   *
   * `#district` populates by cascade once a postcode is entered, so the two
   * cannot be set in one go.
   */
  @step("Fill the buyer and vehicle details")
  async fillBuyerAndVehicleDetails(v: {
    /** The eVOC address. Leave unset to tick "same as MyKad" instead. */
    mailingAddress1?: string;
    mailingAddress2?: string;
    postCode?: string;
    district?: string;
    buyerEmail: string;
    contactNo: string;
    engineNo: string;
    chassisNo: string;
  }): Promise<void> {
    // The page compares these two, so read the prefilled one rather than
    // assuming what step 1 put there.
    const evocEmail = await this.page.inputValue("#email");
    await this.page.fill("#reconfirmEmail", evocEmail);

    await this.page.fill("#buyerEmail", v.buyerEmail);
    await this.page.fill("#contactNo", v.contactNo);

    if (v.mailingAddress1) {
      await this.page.fill("#mailingAddress1", v.mailingAddress1);
      if (v.mailingAddress2) await this.page.fill("#mailingAddress2", v.mailingAddress2);
      if (v.postCode) {
        await this.page.fill("#postCode", v.postCode);
        // District is repopulated by the postcode; wait for a real option to
        // arrive rather than selecting into the placeholder.
        await this.page.locator("#district option").nth(1).waitFor({ timeout: 15_000 }).catch(() => undefined);
        const district = this.page.locator("#district");
        if (v.district) {
          await district.selectOption({ label: v.district }).catch(async () => {
            await district.selectOption({ index: 1 });
          });
        } else {
          await district.selectOption({ index: 1 });
        }
      }
    } else {
      // "Same as MyKad" copies the address off the card that was scanned.
      await this.tickConsent("#to-same-address");
    }

    await this.page.fill("#vehicleEngineNo", v.engineNo);
    await this.page.fill("#vehicleChassisNo", v.chassisNo);
  }

  /** Step 2 -> Step 3 (Seller). Raises a "Sure to continue?" confirmation. */
  async continueToSeller(): Promise<void> {
    await this.page.locator("#to-continue").click();
    await this.confirmDialog();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  /**
   * Step 3 — Seller Authentication (`auth-ucd.do`), the DEALER's own scan.
   *
   * The mirror of STMS step 3: there the dealer is the buyer, here the dealer
   * is the seller. Same MyKad panel, and `#ucd-consent` is the checkbox —
   * which is why it sits unused and zero-sized on step 1.
   *
   * `#jpjReceiptEmail` arrives prefilled with the dealer's registered address,
   * so it is left alone unless a caller overrides it.
   */
  @step("Authenticate the seller (dealer)")
  async authenticateSeller(opts: {
    jpjReceiptEmail?: string;
    mykad: MyKadDriver;
    card: CardLike;
  }): Promise<void> {
    if (opts.jpjReceiptEmail) {
      await this.page.fill("#jpjReceiptEmail", opts.jpjReceiptEmail);
    }
    await this.tickConsent("#ucd-consent");
    await this.readMyKad(opts.mykad, opts.card);
  }

  /** Step 3 -> Step 4 (JPJ Check). */
  async continueToJpjCheck(): Promise<void> {
    await this.clickContinue();
  }

  /**
   * Step 4 — agree, then run the JPJ enquiry.
   *
   * Same controls as STMS, different URL: eSerahan enquires at `estm-enq.do`
   * where STMS uses `jpj-enq.do`.
   */
  @step("Run the JPJ enquiry")
  async runJpjEnquiry(): Promise<void> {
    await this.tickConsent("#to-agree");
    await this.page.locator("#to-enquiry").click();
    await this.confirmDialog();
    await this.page.locator("#to-payment").waitFor({ state: "visible", timeout: 60_000 });
  }

  /**
   * Step 4 -> Step 5.
   *
   * Does NOT always reach the payment page. If the eSTM enquiry response is
   * `VEL000069E`, the flow diverts straight to motor insurance and the payment
   * screen is skipped — so this returns where it actually landed rather than
   * asserting one destination.
   *
   * The two ways into insurance are told apart by the query string:
   *   before payment (VEL000069E)  ...&showBuyerNames=true&estmTransactionId=...
   *   after payment  (no eLKM)     ...&isDirectEstmFirstTime=true
   */
  @step("Leave the JPJ check")
  async goToPayment(): Promise<"payment" | "insurance"> {
    await this.page.locator("#to-payment").click();
    await this.confirmDialog();
    await this.page.waitForURL(/estm\/transaction\/payment\.do|ucd\/insurance\//, { timeout: 60_000 });
    return /ucd\/insurance\//.test(this.page.url()) ? "insurance" : "payment";
  }

  /** Which route into insurance this is, when the flow has diverted there. */
  insuranceRoute(): "before-payment" | "after-payment" | "not-insurance" {
    const u = this.page.url();
    if (!/ucd\/insurance\//.test(u)) return "not-insurance";
    return /isDirectEstmFirstTime=true/.test(u) ? "after-payment" : "before-payment";
  }

  /**
   * Step 5 — choose the add-ons.
   *
   * eSerahan sells two optional extras on the payment screen that STMS does
   * not have, and BOTH ARRIVE TICKED:
   *
   *  - **eLKM (Road Tax) Renewal** — RM60 for 12 months. Ticking it reveals
   *    `#renewalPeriod_6` / `#renewalPeriod_12`, and the screen says "Please
   *    select LKM renewal period".
   *  - **eVOC** — RM10 eAuto processing fee, emailed to the eVOC address.
   *
   * Defaults here are BOTH OFF, because a seeding run should buy the cheapest
   * valid transaction, and because leaving eLKM on with no period chosen is
   * what stops "Next" from moving.
   */
  @step("Choose the payment add-ons")
  async configureAddOns(opts: { lkm?: boolean | 6 | 12; evoc?: boolean } = {}): Promise<void> {
    const wantEvoc = opts.evoc ?? false;
    const wantLkm = opts.lkm ?? false;

    const evoc = this.page.locator("#evoc-addson-checkbox");
    if ((await evoc.isChecked()) !== wantEvoc) await evoc.click();

    const lkm = this.page.locator("#lkm-addson-checkbox");
    if ((await lkm.isChecked()) !== Boolean(wantLkm)) await lkm.click();

    if (wantLkm) {
      // The period radios only exist once eLKM is on, and the page will not
      // advance until one is chosen.
      const months = wantLkm === 6 ? 6 : 12;
      await this.page.locator(`#renewalPeriod_${months}`).check();
    }

    // Each tick recalculates the Payment Summary under a "Working..." box. Returning before it
    // clears handed back the OLD total (verify runs estm-r3/r4 21.10.2026: add-ons off still
    // charged eLKM RM60.00 + RM2.75; eLKM 12 still charged eVOC RM10.00). Wait for the box,
    // then for two identical reads of the summary 1 s apart. Touches nothing.
    await this.page.getByText("Working...").waitFor({ state: "hidden", timeout: 30_000 }).catch(() => undefined);
    let last = await this.paymentSummary();
    for (let i = 0; i < 10; i++) {
      await this.page.waitForTimeout(1_000);
      const now = await this.paymentSummary();
      if (now === last) break;
      last = now;
    }
  }

  /**
   * The Payment Summary block as printed, whitespace collapsed
   * ("Payment Summary … Total Amount Payable … : RM x"). Same read the 12403
   * runs used (`paymentSummary` in tests/_explore/eaint-12403-lib.ts), moved
   * here so a flow can carry it without importing from a test folder.
   */
  async paymentSummary(): Promise<string> {
    const body = await this.page.evaluate(() => document.body.innerText);
    const block = body.match(/Payment Summary[\s\S]*?Total Amount Payable[^\n]*\n?[^\n]*/);
    return (block?.[0] ?? "").replace(/\s+/g, " ").trim();
  }

  /** What the payment screen says is owed, as printed. */
  async totalPayable(): Promise<string> {
    return this.labelled("Total Amount Payable (inclusive of Service Tax 8%) :");
  }

  /**
   * Step 5 -> the end of the eSerahan. Submits the payment and returns ON ARRIVAL.
   *
   * eSerahan confirms TWICE before paying, and the two dialogs say different things:
   *   1. "Sure to proceed with payment?"      Back / Next
   *   2. "Sure to make this payment now?"     with the payment summary
   * Each is answered ONLY while the page is still on Step 5 (`payment.do`) and ONLY when the
   * dialog's text is a payment confirm — never "whatever dialog is last". Once the page has
   * left Step 5, nothing here touches a dialog (EAINT-12253, 21.10.2026: the Firefox browser
   * reminder is shown on the transaction's final step, after the payment).
   *
   * Where it ends depends on eLKM (knowledge/portals/ucd/portal.md), so the caller says which:
   *   `"estm-done"`  eLKM ticked → Step 6 `estm/transaction/estm-sub.do` (marker: its "Done")
   *   `"insurance"`  eLKM unticked → paid, then redirected to the insurance plan page
   *                  `insurance/plan/view.do?…isDirectEstmFirstTime=true` (marker: an insurer
   *                  SELECT). Per the BA (21.10) eSTM Step 6 shows NO reminder on this route;
   *                  either way nothing is dismissed on Step 6 or on the insurance landing.
   * Returns the URL it arrived on.
   */
  @step("Submit the payment")
  async submitPayment(lands: "estm-done" | "insurance" = "estm-done"): Promise<string> {
    const step5 = this.page.url();
    const onStep5 = () => this.page.url() === step5;
    const payConfirm = this.page
      .locator(".ui-dialog:visible")
      .filter({ hasText: /Sure to (proceed with|make this) payment/i })
      .filter({ hasNotText: /Browser Reminder|浏览器提醒/i })
      .last();

    await this.page.locator("#to-payment").click();
    for (let n = 0; n < 4 && onStep5(); n++) {
      // ONE polling loop, nothing left running when it ends. It used to race waitForURL against
      // payConfirm.waitFor (60 s each); the loser was never cancelled and kept polling through the
      // next screens. On 21.10.2026 (EAINT-12253 CH_TS4, staging /uat1/) that left-over wait and a
      // spec's locator handler collided on Insurance Step 3 and Playwright never released the action.
      const deadline = Date.now() + 60_000;
      let next: "left" | "confirm" | "timeout" = "timeout";
      while (Date.now() < deadline) {
        if (!onStep5()) { next = "left"; break; }
        if (await payConfirm.isVisible().catch(() => false)) { next = "confirm"; break; }
        await this.page.waitForTimeout(250);
      }
      if (next !== "confirm" || !onStep5()) break;
      await payConfirm.locator("button.confirm-dialog-btn").or(payConfirm.locator("button", { hasText: /^(Next|Yes|OK|Proceed)$/ })).first().click();
      await payConfirm.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
    }

    if (lands === "insurance") {
      await this.page.waitForURL(/ucd\/insurance\/plan\/view\.do/, { timeout: 120_000 });
      await awaitFinalScreen(this.page, this.page.locator("button.select-plan-btn:visible"), "insurance plan: an insurer SELECT button", 90_000);
    } else {
      await this.page.waitForURL(/estm\/transaction\/estm-sub\.do/, { timeout: 120_000 });
      await awaitFinalScreen(this.page, this.doneButton, "eSerahan Step 6: Done");
    }
    return this.page.url();
  }

  /** eSerahan Step 6 (`estm-sub.do`) "Done" control. Read, never pressed by a flow. */
  get doneButton() {
    // On /uat1/ (21.10.2026) "Done" is a plain div, not a button / div.next-btn: the old
    // locator never matched (verify runs EAINT-12253-verify-estm-r1/r2-20261021), so match the text.
    return this.page.getByText(/^\s*Done\s*$/i).locator("visible=true").first()
      .or(this.page.locator("input[value='Done']:visible"));
  }
}
