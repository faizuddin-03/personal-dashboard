/**
 * BMK (Butiran Maklumat Kenderaan) purchase wizard — UCD portal.
 *
 * Read off staging /eauto/ on 2026-10-20 (EAINT-12253 probe p05,
 * `cr/EAINT-12253/03-spec/probes-2010/`), walked live with the MyKad Reader Emulator:
 *
 *   tile BMK → `view/ucd/bmk/view.do` (`#create-tx` "PURCHASE BMK", BMK LISTING → `bmk/enquiry/`)
 *   → `bmk/transaction/view.do` "Please select Owner category ID": `a.owner-category`, `category`
 *     1 = "MyKad - MALAYSIAN", 4 = the dealer's own company name, 0 = "MyPR - PEMASTAUTIN TETAP"
 *   → dialog "Owner Category ID — Pilihan anda: …" No / Yes
 *   → Step 1 Owner `auth-owner.do?category=1`: `#vehicleRegNo`, `#owner-consent`, MyKad panel
 *     (`#readMyKadButton`, `#continueButton` Next, `#rereadMyKadButton`, `#cancelButton`)
 *   → Step 2 Vehicle `data-entry.do`: `#name`, `#refId`, `#permanentAddress`, `#vehicleRegNo` all
 *     prefilled from the card / Step 1; `#to-continue` Next → "Continue Confirmation — Sure want to continue?"
 *   → Step 3 Dealer `auth-ucd.do?category=1&id=<txId>`: `#jpjReceiptEmail` (prefilled), `#ucd-consent`,
 *     the login user's own MyKad
 *   → Step 4 JPJ Check `jpj-enq.do`: `#to-agree` → `#to-enquiry` NEXT → "Submit Confirmation — Submit
 *     to JPJ for checking?" → result ("Response Code:", "JPJ Enquiry Status:") + `#to-payment`
 *     "Make Payment" → "Continue Confirmation — BMK will be sent to <email>. Proceed for payment?"
 *   → Step 5 Payment `payment.do?id=<txId>` (the payment step; the final step is Step 6, EAINT-12253 21.10): Payment Summary (JPJ Fee RM20.00,
 *     eAuto Fee RM10.00, SST 8% RM0.80, Total RM30.80 on 20.10.2026), payment method radio
 *     `input[name=paymentMethod][value=RHB]` (pre-checked), `#to-payment` "Next" →
 *     `#sure-to-submit-payment` "Sure to submit this payment?" No / **Yes** (final; posts
 *     `api/ucd/bmk/transaction/make-payment.do`). OK → Step 6 Purchase `jpj-sub.do?id=`; RHB refusal →
 *     dialog "Payment" on Step 5 (e.g. IF "Wang di dalam akaun RHB anda TIDAK MENCUKUPI.").
 *
 *   Step strip: 1 Owner · 2 Vehicle · 3 Dealer · 4 JPJ Check · 5 Payment · 6 Purchase.
 */

import { expect, type Locator } from "@playwright/test";
import { TransactionWizardPage, type CardLike, type MyKadDriver } from "../wizard.page";
import { UCD_MENU } from "./ucd-home.page";
import { awaitFinalScreen } from "../final-step";

export const BMK_LANDING = "view/ucd/bmk/view.do";

/** The `category` attribute of BMK's owner tiles. 4 is labelled with the dealer's own company name. */
export const BmkOwnerCategory = { MALAYSIAN: "1", COMPANY: "4", MYPR: "0" } as const;
export type BmkOwnerCategory = (typeof BmkOwnerCategory)[keyof typeof BmkOwnerCategory];

export class BmkWizardPage extends TransactionWizardPage {
  protected readonly landingPath = BMK_LANDING;
  protected readonly menuItem = UCD_MENU.bmk;
  protected readonly wizardUrlPattern = /bmk\/transaction\/view\.do/;

  /**
   * A jQuery UI dialog, found by the text it carries — never "the last dialog", so a
   * browser reminder (EAINT-12253) or any other modal is never confirmed by mistake.
   */
  private dialogWith(text: string | RegExp): Locator {
    return this.page.locator(".ui-dialog:visible").filter({ hasText: text });
  }

  private async yes(text: string | RegExp): Promise<string> {
    const dlg = this.dialogWith(text);
    await dlg.waitFor({ state: "visible", timeout: 15_000 });
    const said = (await dlg.innerText()).replace(/\s+/g, " ").trim();
    await dlg.locator("button.confirm-dialog-btn, button:text-is('Yes')").first().click();
    return said;
  }

  /**
   * Pick the owner category and confirm with Yes. Not the base `chooseCategory()`:
   * BMK's tiles carry the LABEL in `data` and the code in `category`, so match the code.
   */
  async chooseOwnerCategory(category: BmkOwnerCategory = BmkOwnerCategory.MALAYSIAN): Promise<string> {
    await this.dismissAnnouncements();
    const tiles = this.page.locator(`a.owner-category[category="${category}"]`);
    let clicked = false;
    for (let i = 0; i < (await tiles.count()); i++) {
      if (await tiles.nth(i).isVisible().catch(() => false)) {
        await tiles.nth(i).click();
        clicked = true;
        break;
      }
    }
    if (!clicked) throw new Error(`No clickable BMK owner category tile with category="${category}".`);
    const dlg = this.dialogWith("Owner Category ID");
    await dlg.waitFor({ state: "visible", timeout: 15_000 });
    const said = (await dlg.innerText()).replace(/\s+/g, " ").trim();
    await Promise.all([
      this.page.waitForURL(/bmk\/transaction\/auth-owner\.do/, { timeout: 30_000 }),
      dlg.locator("button", { hasText: /^Yes$/ }).click(),
    ]);
    await expect(this.page.locator("#owner-consent")).toBeVisible();
    return said;
  }

  /** Step 1 Owner: vehicle, consent, owner's MyKad + thumbprint. Ends with Next visible. */
  async authenticateOwner(opts: { vehicleRegNo: string; mykad: MyKadDriver; card: CardLike }): Promise<void> {
    await this.page.fill("#vehicleRegNo", opts.vehicleRegNo);
    await this.page
      .locator("#readonlyVehicleRegNo")
      .and(this.page.locator(`[value="${opts.vehicleRegNo}"]`))
      .waitFor({ timeout: 10_000 })
      .catch(() => undefined);
    await this.tickConsent("#owner-consent");
    await this.readMyKad(opts.mykad, opts.card);
  }

  /** Step 1 → Step 2 (`data-entry.do`). */
  async continueToVehicle(): Promise<void> {
    await Promise.all([this.page.waitForURL(/bmk\/transaction\/data-entry\.do/, { timeout: 30_000 }), this.page.locator("#continueButton").click()]);
    await expect(this.page.locator("#to-continue")).toBeVisible();
  }

  /** Step 2 → Step 3 (`auth-ucd.do`): Next, then "Sure want to continue?" Yes. Fields are prefilled. */
  async continueToDealer(): Promise<void> {
    await this.page.locator("#to-continue").click();
    await Promise.all([this.page.waitForURL(/bmk\/transaction\/auth-ucd\.do/, { timeout: 30_000 }), this.yes("Sure want to continue?")]);
    await expect(this.page.locator("#ucd-consent")).toBeVisible();
  }

  /** Step 3 Dealer: consent + the LOGIN USER's MyKad ("Please use login user's MyKad"). */
  async authenticateDealer(opts: { mykad: MyKadDriver; card: CardLike; jpjReceiptEmail?: string }): Promise<void> {
    if (opts.jpjReceiptEmail) await this.page.fill("#jpjReceiptEmail", opts.jpjReceiptEmail);
    await this.tickConsent("#ucd-consent");
    await this.readMyKad(opts.mykad, opts.card);
  }

  /** Step 3 → Step 4 (`jpj-enq.do`). */
  async continueToJpjCheck(): Promise<void> {
    await Promise.all([this.page.waitForURL(/bmk\/transaction\/jpj-enq\.do/, { timeout: 30_000 }), this.page.locator("#continueButton").click()]);
    await expect(this.page.locator("#to-agree")).toBeVisible();
  }

  /** Step 4: agree, NEXT, "Submit to JPJ for checking?" Yes, wait for the result. */
  async runJpjEnquiry(): Promise<{ responseCode: string; status: string }> {
    await this.tickConsent("#to-agree");
    await this.page.locator("#to-enquiry").click();
    await this.yes("Submit to JPJ for checking?");
    await this.page.locator("body").filter({ hasText: /Response Code:/ }).waitFor({ timeout: 90_000 });
    return { responseCode: await this.labelled("Response Code:"), status: await this.labelled("JPJ Enquiry Status:") };
  }

  /** Step 4 → Step 5: Make Payment, then "BMK will be sent to … Proceed for payment?" Yes. Pays nothing. */
  async goToPayment(): Promise<string> {
    await this.page.locator("input#to-payment").click();
    const [, said] = await Promise.all([
      this.page.waitForURL(/bmk\/transaction\/payment\.do/, { timeout: 60_000 }),
      this.yes("Proceed for payment?"),
    ]);
    await expect(this.page.locator("div#to-payment")).toBeVisible();
    return said;
  }

  /** Step 5's "Total Amount Payable (inclusive of Service Tax 8%) :" value, e.g. "30.80". */
  async totalPayable(): Promise<string> {
    return (await this.labelled("Total Amount Payable (inclusive of Service Tax 8%) :")).replace(/^RM\s*/, "").trim();
  }

  /** The Step 5 confirm dialog ("Sure to submit this payment?"). */
  get paymentDialog(): Locator {
    return this.dialogWith("Sure to submit this payment?");
  }

  /** Step 5: press Next and wait for "Sure to submit this payment?". Pays NOTHING. */
  async openPaymentDialog(): Promise<string> {
    await this.page.locator("div#to-payment").click();
    await this.paymentDialog.waitFor({ state: "visible", timeout: 15_000 });
    return (await this.paymentDialog.innerText()).replace(/\s+/g, " ").trim();
  }

  /** Close the Step 5 confirm with No. */
  async cancelPaymentDialog(): Promise<void> {
    await this.paymentDialog.locator("button.cancel-dialog-btn, button:text-is('No')").first().click();
    await this.paymentDialog.waitFor({ state: "hidden", timeout: 10_000 });
  }

  /**
   * After an RHB refusal Step 5 reloads with "Payment History", "Payment Status: Failed" and
   * **Retry** (`#to-retry-rhb`) instead of Next. This presses Retry and waits for "Sure to retry?"
   * (No / Yes). Pays nothing; `confirmPayment()` then pays (it accepts this dialog too).
   */
  async openRetryDialog(): Promise<string> {
    await this.page.locator("#to-retry-rhb").click();
    const dlg = this.dialogWith("Sure to retry?");
    await dlg.waitFor({ state: "visible", timeout: 15_000 });
    return (await dlg.innerText()).replace(/\s+/g, " ").trim();
  }

  /** Step 6 Purchase (`jpj-sub.do`): "JPJ BMK Purchase Status:" (SUCCESSFUL on 20.10.2026) and its time. */
  async purchaseResult(): Promise<{ status: string; submittedAt: string }> {
    return { status: await this.labelled("JPJ BMK Purchase Status:"), submittedAt: await this.labelled("Submission Date/Time:") };
  }

  /** Step 6 Purchase's own marker ("JPJ BMK Purchase Status:", seen p08 OUP0009). */
  get step6Marker(): Locator {
    return this.page.getByText(/JPJ BMK Purchase Status/i);
  }

  /**
   * PAYS. Confirm the open Step 5 dialog with Yes and report what RHB did: Step 6
   * (`jpj-sub.do`) or a refusal dialog left on Step 5 (its text returned, nothing clicked).
   *
   * FINAL STEP (EAINT-12253, 21.10.2026: the browser reminder shows on Step 6, after payment):
   * returns on arrival — `jpj-sub.do`, "JPJ BMK Purchase Status" visible, "Working..." cleared.
   * Nothing after that touches a dialog.
   */
  async confirmPayment(): Promise<{ outcome: "paid"; url: string } | { outcome: "refused"; message: string }> {
    const open = this.dialogWith(/Sure to submit this payment\?|Sure to retry\?/);
    await open.locator("button.confirm-dialog-btn, button:text-is('Yes')").first().click();
    const moved = await this.page.waitForURL(/bmk\/transaction\/jpj-sub\.do/, { timeout: 120_000 }).then(() => true, () => false);
    if (moved) {
      await awaitFinalScreen(this.page, this.step6Marker, "BMK Step 6 Purchase: 'JPJ BMK Purchase Status'");
      return { outcome: "paid", url: this.page.url() };
    }
    const dlg = this.page.locator(".ui-dialog:visible").filter({ hasText: /Payment|RHB|Sila/ }).last();
    return { outcome: "refused", message: (await dlg.innerText().catch(() => "")).replace(/\s+/g, " ").trim() };
  }

  /**
   * [Save & Continue Later] as the other wizards render it (`#to-continue.save-btn`, TransactionWizardPage
   * .saveAndContinueLater). On BMK NONE was seen on Steps 1-5 (probe p05 20.10.2026; seed s07 Step 4: Cancel / Make
   * Payment only; Step 5 markup: Cancel / Next only): a spec checks `isVisible()` and records what it found.
   */
  get saveAndContinueLaterButton(): Locator {
    return this.page.locator("#to-continue.save-btn", { hasText: /Save\s*&\s*Continue Later/i });
  }

  /**
   * READ ONLY. The BMK Transaction Listing row of a vehicle, keyed by column header, and the row's own action labels.
   * Added 22.10.2026 (EAINT-12253 FF_TS6); no flow calls it. Seen on staging /uat1/ 22.10.2026 (probe
   * cr/EAINT-12253/03-spec/probes-2110/p08): the listing is `view/ucd/bmk/enquiry/` (`…/enquiry/main.do` is a 404),
   * empty until searched; Vehicle No `#vehicleNo`, Search Now `#to-search`; rows land in `#result` (AJAX
   * `api/ucd/bmk/enquiry/list.do`), columns "# | Vehicle | Transaction No | Owner Name | Created At | JPJ Check | Payment |
   * JPJ Submission | Tx Status | e-Invoice Status | Remarks | Action"; a Cancelled / Pending-at-Step-4 row's Action is
   * "View" only (`a[href*="bmk/enquiry/view.do?id="]`). Opened by address on the same instance; nothing is clicked on the
   * screen it leaves. `cells` null when there is no row.
   */
  async listingRow(vehicleRegNo: string): Promise<{ cells: Record<string, string> | null; actions: string[]; row: Locator }> {
    const root = this.page.url().replace(/\/view\/.*/, "");
    await this.page.goto(`${root}/view/ucd/bmk/enquiry/`);
    await this.page.locator("#vehicleNo").waitFor({ state: "visible", timeout: 30_000 });
    await this.page.locator("#vehicleNo").fill(vehicleRegNo);
    await this.page.locator("#to-search").click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    const row = this.page.locator("#result tr").filter({ hasText: vehicleRegNo }).last();
    await row.waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
    const got = await this.page.evaluate((v) => {
      // not String.prototype.trim: the JomCheck listing's left a trailing space (22.10.2026); same guard here
      const norm = (x: string) => x.replace(/\s+/g, " ").replace(/^ /, "").replace(/ $/, "");
      const own = (tr: Element) => Array.from(tr.children).filter((c) => c.tagName === "TD");
      const rows = Array.from(document.querySelectorAll("#result tr")).filter((tr) => own(tr).length > 6 && own(tr).some((td) => norm(td.textContent || "") === v));
      const tr = rows[rows.length - 1];
      if (!tr) return null;
      const header = Array.from(tr.closest("table")!.querySelectorAll("tr")).find((h) => h.querySelectorAll(":scope > th").length > 4);
      const ths = header ? Array.from(header.querySelectorAll(":scope > th")).map((th) => norm(th.textContent || "")) : [];
      const cells: Record<string, string> = {};
      own(tr).forEach((td, i) => { cells[ths[i] || `col${i + 1}`] = norm(td.textContent || ""); });
      const actions = Array.from(tr.querySelectorAll("a, button, input[type=button]")).map((a) => norm((a as HTMLElement).innerText || (a as HTMLInputElement).value || "")).filter(Boolean);
      return { cells, actions };
    }, vehicleRegNo);
    const tidy = (x: string) => x.replace(/\s+/g, " ").trim(); // again in Node: no page whitespace reaches a comparison
    const cells = got?.cells ? Object.fromEntries(Object.entries(got.cells).map(([k, val]) => [tidy(k), tidy(val)])) : null;
    return { cells, actions: (got?.actions ?? []).map(tidy).filter(Boolean), row };
  }
}
