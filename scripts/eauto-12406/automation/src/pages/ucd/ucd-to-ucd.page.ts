/**
 * UCD to UCD wizard — UCD portal.
 *
 * Steps 4 (JPJ Check), 5 (Payment) and 6 (Transfer) are the STMS screens, so
 * this extends `StmsWizardPage` and only adds what UCD to UCD does differently:
 * how a transaction is started, and Steps 1-3.
 *
 * Two kinds, and they are not the same journey (knowledge/_core/ucd-to-ucd.md):
 *
 *   Standard   UCD B (logged in) runs everything. Step 1 has no vehicle field:
 *              Perakuan, then the SELLER company's representative thumbprints.
 *              Step 2 types the seller company and the vehicle.
 *   Interstate UCD A creates it for a buyer ROC and submits; UCD B accepts from
 *              its own STMS listing later (48 h) and does Steps 3-6.
 *
 * Selectors read off staging 2026-09-25 (explore-output/ucd2ucd-*), not guessed.
 * Landing `view/ucd/stms/interstate/ucd-view.do`, Standard wizard
 * `companyCategory=UTU`, Interstate `companyCategory=IUTU`.
 */

import { StmsWizardPage, type CardLike, type MyKadDriver } from "./stms-wizard.page";
import { UcdHomePage, UCD_MENU } from "./ucd-home.page";
import { step } from "@fixtures/step";

export interface SellerCompany {
  name: string;
  rocNo: string;
}

export interface UtuStep2 {
  mobileNo: string;
  email: string;
  address: string;
  vehicleRegNo: string;
  engineNo: string;
  chassisNo: string;
  make: string;
  model?: string;
  year: string;
}

export const INTERSTATE_HOME = "view/ucd/stms/interstate/interstate-home.do";
export const INTERSTATE_LISTING = "view/ucd/stms/interstate/enquiry.do";
export const STMS_LISTING = "view/ucd/stms/enquiry/main.do";

export class UcdToUcdPage extends StmsWizardPage {
  /** Root of the app, e.g. https://staging.eauto.my/eauto — listings are reached from it. */
  private root(): string {
    return this.page.url().replace(/\/view\/.*/, "");
  }

  /** A confirmation dialog the screen MAY raise. Returns its text, or "" when there was none. */
  private async confirmIfAsked(timeout = 6_000): Promise<string> {
    const text = await this.confirmDialog(timeout).catch(() => "");
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    return text;
  }

  // ---------------------------------------------------------------- entry

  private async openKind(tile: RegExp): Promise<void> {
    const home = new UcdHomePage(this.page);
    await home.returnToDashboard();
    await home.goTo(UCD_MENU.ucdToUcd);
    await this.page.locator("a, button, div, li").filter({ hasText: tile }).first().click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /** Dashboard -> UCD TO UCD -> STANDARD. Lands straight on Step 1. */
  @step("Open UCD to UCD Standard")
  async openStandard(): Promise<void> {
    await this.openKind(/^\s*STANDARD\s*$/i);
  }

  /** Dashboard -> UCD TO UCD -> INTERSTATE (the Interstate home, not yet a transaction). */
  @step("Open UCD to UCD Interstate")
  async openInterstate(): Promise<void> {
    await this.openKind(/^\s*INTERSTATE\s*$/i);
  }

  // ------------------------------------------------------------- Standard

  /**
   * Standard Step 1 — Perakuan first, then the seller company's representative.
   *
   * The person on the card must be a registered user of the seller company
   * typed at Step 2, or Step 3 is refused ("Invalid Representative Error").
   */
  @step("Authenticate the seller (Standard)")
  async authenticateStandardSeller(opts: { mykad: MyKadDriver; card: CardLike; sellerEmail?: string }): Promise<void> {
    const refundEmail = this.page.locator("#sellerEmail");
    if (opts.sellerEmail && (await refundEmail.isVisible().catch(() => false)) && (await refundEmail.isEditable().catch(() => false)) && !(await refundEmail.inputValue())) {
      await refundEmail.fill(opts.sellerEmail);
    }
    await this.tickConsent("#seller-consent");
    try {
      await this.readMyKad(opts.mykad, opts.card);
    } catch (e) {
      // /uat1/ 21.10.2026 (ucd2ucd verify r1/r2, once per run, different tests): the page logged
      // "Timout for read card", closed its reader socket, and "Scan IC" stayed hidden for good.
      // Nothing on Step 1 is saved yet, so reload it once and read again; a second failure is real.
      if (await this.page.locator("#continueButton").isVisible().catch(() => false)) throw e;
      await this.page.reload();
      await this.tickConsent("#seller-consent");
      await this.readMyKad(opts.mykad, opts.card);
    }
  }

  /**
   * Standard Step 2 — the SELLER company is typed, then contact, Single/Bulk
   * and the vehicle. Vehicle number is typed here (Step 1 has none).
   */
  @step("Fill seller company and vehicle (Standard)")
  async fillStandardStep2(seller: SellerCompany, v: UtuStep2): Promise<void> {
    await this.page.fill("#companyName", seller.name);
    await this.page.fill("#companyRocNo", seller.rocNo);
    await this.page.fill("#mailingAddress", v.address);
    await this.chooseSingleTransaction();
    await this.page.fill("#vehicleRegNo", v.vehicleRegNo);
    await this.fillVehicleDetails(v);
  }

  /** Standard Step 2 -> Step 3. Its Next button is `#to-continue-company`. */
  @step("Continue to the buyer (Standard)")
  async continueToBuyerStandard(): Promise<void> {
    await this.page.locator("#to-continue-company").click();
    try {
      await this.confirmDialog();
    } catch (e) {
      const complaints = await this.validationMessages();
      if (complaints.length) throw new Error(`Step 2 was not accepted. The page reported: ${complaints.join(" | ")}`);
      throw e;
    }
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  private async chooseSingleTransaction(): Promise<void> {
    await this.page
      .getByText("Single Transaction", { exact: true })
      .click()
      .catch(async () => {
        await this.page.locator("input[type=radio]").first().check();
      });
  }

  // ------------------------------------------------------- Interstate (A)

  /**
   * INTERSTATE home -> CREATE NEW INTERSTATE TRANSACTION -> buyer ROC -> Search
   * -> Continue. Ends on Step 1 with the buyer company confirmed.
   */
  @step("Create an Interstate transaction for a buyer")
  async startInterstateFor(buyerRoc: string): Promise<void> {
    await this.page.click("#create-tx");
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.locator("input[type=text]:visible").first().fill(buyerRoc);
    await this.page
      .locator("div.next-btn:visible, input[type=button]:visible, button:visible")
      .filter({ hasText: /Next|Submit|Search|Continue|Proceed/i })
      .first()
      .click();
    await this.confirmIfAsked();
    // The buyer's company name is shown once found; Continue then asks to confirm.
    await this.page.locator("#to-continue").click();
    await this.confirmIfAsked();
  }

  /** Interstate Step 1 — the seller is UCD A's own representative. */
  @step("Authenticate the seller (Interstate)")
  async authenticateInterstateSeller(opts: { mykad: MyKadDriver; card: CardLike }): Promise<void> {
    // Wait for Step 1 to finish loading: an isVisible() check here races the
    // page and silently skips the tick, and "Scan IC" then never appears.
    await this.page.locator("#seller-consent").waitFor({ state: "visible", timeout: 30_000 });
    await this.tickConsent("#seller-consent");
    await this.readMyKad(opts.mykad, opts.card);
  }

  /**
   * Interstate Step 2. The seller company is PRE-FILLED (UCD A). The vehicle
   * must already be held by UCD A — GET reads it from JPJ, and "Vehicle record
   * not found" is the answer for anything else.
   */
  @step("Fill the vehicle and GET it from JPJ (Interstate)")
  async fillInterstateStep2(v: Pick<UtuStep2, "mobileNo" | "email" | "address" | "vehicleRegNo">): Promise<void> {
    const fillIf = async (sel: string, value: string) => {
      const l = this.page.locator(sel);
      if ((await l.isVisible().catch(() => false)) && !(await l.getAttribute("readonly"))) await l.fill(value);
    };
    await fillIf("#contactNo", v.mobileNo);
    await fillIf("#email", v.email);
    await fillIf("#mailingAddress", v.address);
    await this.chooseSingleTransaction().catch(() => undefined);
    await fillIf("#vehicleRegNo", v.vehicleRegNo);
    await this.page.click("#searchVehicleRegNo");
    await this.confirmIfAsked();
    // Engine / chassis come back from JPJ once GET has answered.
    await this.page
      .waitForFunction(() => !!(document.querySelector("#vehicleEngineNo") as HTMLInputElement | null)?.value, undefined, { timeout: 30_000 })
      .catch(() => undefined);
    await this.tickConsent("#to-agree");
  }

  /**
   * Interstate: Step 2 Next -> review (with the JPJ Check result) -> Next ->
   * the Interstate Transaction Listing, where the row reads Interstate New /
   * PENDING BUYER THUMBPRINT. Two Nexts, each with a confirmation.
   */
  @step("Submit the Interstate transaction to the buyer")
  async submitInterstateToBuyer(): Promise<void> {
    for (const stage of ["Step 2 Next", "review Next"]) {
      await this.page.locator("#to-continue").click();
      const said = await this.confirmIfAsked();
      if (!said && (await this.validationMessages()).length) {
        throw new Error(`${stage} was not accepted. The page reported: ${(await this.validationMessages()).join(" | ")}`);
      }
      if (/interstate\/enquiry\.do/.test(this.page.url())) return;
    }
    await this.page.waitForURL(/interstate\/enquiry\.do/, { timeout: 30_000 });
  }

  // ------------------------------------------------------- Interstate (B)

  /**
   * UCD B: find the vehicle in the STMS Transaction Listing and press
   * To Accept. The Interstate listing is the SELLER's and shows nothing for B.
   * Lands straight on Step 3.
   */
  @step("Accept an Interstate transaction")
  async acceptInterstate(vehicleRegNo: string): Promise<void> {
    // The row can take a moment to reach the buyer's listing, and a search
    // fired before the page is ready comes back empty. Search again until it
    // shows, rather than trusting one look.
    const deadline = Date.now() + 90_000;
    let row = this.page.locator("table tr", { hasText: vehicleRegNo }).last();
    while (true) {
      await this.searchListing(STMS_LISTING, vehicleRegNo);
      row = this.page.locator("table tr", { hasText: vehicleRegNo }).last();
      if (await row.waitFor({ state: "visible", timeout: 8_000 }).then(() => true).catch(() => false)) break;
      if (Date.now() > deadline) break;
    }
    const accept = row.locator("a, button, input").filter({ hasText: /accept/i }).first();
    if (!(await accept.isVisible().catch(() => false))) {
      throw new Error(`No "To Accept" for ${vehicleRegNo} on this account's STMS listing. Is this the buyer account, and is it still Interstate New (48 h)?`);
    }
    await accept.click();
    await this.confirmIfAsked();
  }

  /**
   * Interstate Step 3 — the card read is the LOGGED-IN user's own MyKad, not
   * the seller's. The JPJ receipt email is filled only when the field asks.
   */
  @step("Authenticate the buyer (Interstate)")
  async authenticateInterstateBuyer(opts: { jpjReceiptEmail: string; mykad: MyKadDriver; card: CardLike }): Promise<void> {
    await this.page.locator("#buyer-consent").waitFor({ state: "visible", timeout: 30_000 });
    const email = this.page.locator("#jpjReceiptEmail");
    if ((await email.isVisible().catch(() => false)) && (await email.isEditable().catch(() => false)) && !(await email.inputValue())) {
      await email.fill(opts.jpjReceiptEmail);
    }
    await this.tickConsent("#buyer-consent");
    await this.readMyKad(opts.mykad, opts.card);
  }

  // ------------------------------------------------------------- listings

  /** Search a listing page (`STMS_LISTING` or `INTERSTATE_LISTING`) by vehicle number. */
  @step("Search a listing by vehicle number")
  async searchListing(path: string, vehicleRegNo: string): Promise<void> {
    await this.page.goto(`${this.root()}/${path}`);
    await this.page.fill("#vehicleNo", vehicleRegNo);
    await this.page.click("#to-search");
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }
}
