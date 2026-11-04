/**
 * New Deregistration Transaction — AATF portal. Walked live 2026-10-20 (staging /eauto/, azfaraatf,
 * MyKad Reader Emulator; EAINT-12253 probe p12; OUP0028 deregistered end to end, tx 21bf8d5c-…).
 *
 *   1 Owner · 2 Vehicle · 3 AATF · 4 JPJ Check · 5 Payment · 6 Deregister
 *
 *   `dereg/transaction/view.do` "Sila Pilih Kategori ID": `a.owner-category` category 1 = "Orang Awam
 *     Malaysia (MyKad)", 0 = "Penduduk Tetap Malaysia (MyPR)" → dialog "Pilihan anda: …" TIDAK / **YA**
 *   Step 1 `auth-owner.do?category=1`: PERINGATAN KEPADA PEMILIK KENDERAAN → `#agreePeringatanConsent`
 *     Ya/Yes (`#cancelPeringatanConsent` Tidak/No) → owner's MyKad (shared panel, `#continueButton` Next)
 *   Step 2 `data-entry.do`: name / `#refId` / address from the card; `#contactNo`, `#email`,
 *     `#pbtCompanyId` (-1 = INDIVIDU), `#aatfConsent` (file), `#vehicleRegNo` (leaving it checks the
 *     pre-check: "This vehicle is allowed to create eDereg transaction"), `#vehicleEngineNo`,
 *     `#vehicleChassisNo`, `#vehicleMake` / `#vehicleModel` / `#vehicleYear`, `#photo1..3` (files);
 *     `#to-continue` Next → NATIVE confirm "Sure to continue?"; a vehicle + owner already in a Dereg
 *     transaction gets the jQuery dialog "Transaksi yang sama …" instead
 *   Owner declaration `auth-owner-consent.do?…&id=<txId>`: PERAKUAN PEMUNYA BERDAFTAR, `#owner-consent`,
 *     owner's MyKad again, Next
 *   Step 3 AATF `aatf-consent.do?id=`: PERAKUAN WAKIL AATF, `#aatf-consent` → `#to-auth-aatf` →
 *     `auth-aatf.do?id=`: the LOGIN USER's MyKad (azfaraatf main user = 020406081081), Next
 *   Step 4 `jpj-enq.do?id=`: `#to-agree` → `#to-enquiry` Next → NATIVE "Submit to JPJ for checking?" →
 *     result (Response Code, JPJ Enquiry Status) → `#to-payment` → NATIVE "Sure to continue?"
 *   Step 5 `payment.do?id=` (the payment step): "Click NEXT to pay and DEREGISTER." (no fee summary
 *     on screen), `input#to-payment` Next → NATIVE confirm "Sure to submit this payment to DEREGISTER?"
 *     (OK = the final pay + deregistration; RHB keyed on the vehicle prefix)
 *   Step 6 `jpj-sub.do?id=` (**the final step**, EAINT-12253 21.10): "JPJ Deregistration Status: OK - TRANSACTION SUCCESSFUL", Done.
 *
 * NATIVE dialogs: this portal confirms with window.confirm(). Playwright DISMISSES an unhandled
 * native dialog, so every method that expects one answers exactly one (`oneNative`) with a handler
 * registered right before the click and removed right after. A spec for EAINT-12253 that wants to SEE a native dialog must register
 * its own `page.on("dialog")` listener first.
 */

import { expect, type Dialog, type Page } from "@playwright/test";
import { TransactionWizardPage, type CardLike, type MyKadDriver } from "../wizard.page";
import type { UcdMenuItem } from "../ucd/ucd-home.page";
import { AatfHomePage } from "./aatf-home.page";
import { awaitFinalScreen } from "../final-step";

export const DeregOwnerCategory = { MYKAD: "1", MYPR: "0" } as const;
export type DeregOwnerCategory = (typeof DeregOwnerCategory)[keyof typeof DeregOwnerCategory];

export interface DeregVehicleDetails {
  contactNo: string;
  email: string;
  /** `#pbtCompanyId` value; "-1" = INDIVIDU. */
  pbt?: string;
  consentFile: string;
  photoFile: string;
  vehicleRegNo: string;
  engineNo: string;
  chassisNo: string;
  make: string;
  year: string;
}

export class DeregWizardPage extends TransactionWizardPage {
  protected readonly landingPath = "view/aatf/dereg/view.do";
  /** Unused: AATF has no UCD dashboard tile; `gotoLanding()` is overridden below. */
  protected readonly menuItem = "eDEREG" as unknown as UcdMenuItem;
  protected readonly wizardUrlPattern = /aatf\/dereg\/transaction\/view\.do/;

  constructor(page: Page) {
    super(page);
  }

  override async gotoLanding(): Promise<void> {
    await new AatfHomePage(this.page).gotoEdereg();
  }

  override async startNewTransaction(): Promise<void> {
    await this.gotoLanding();
    await Promise.all([this.page.waitForURL(/aatf\/dereg\/transaction\//, { timeout: 30_000 }), this.page.locator("#deregTransaction").click()]);
  }

  /** Accept exactly one NATIVE confirm raised by `click`, and return its message. */
  private async acceptNative(click: () => Promise<void>): Promise<string> {
    return this.oneNative(click, "accept");
  }

  /**
   * Answer exactly ONE native dialog raised by `click`. The handler is removed again in every case
   * (answered, timed out, click threw), so no listener outlives the step it was registered for and
   * can never answer a later dialog on another screen (EAINT-12253: the final step is left alone).
   */
  private async oneNative(click: () => Promise<void>, answer: "accept" | "dismiss", timeoutMs = 20_000): Promise<string> {
    let handler: ((d: Dialog) => Promise<void>) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const seen = new Promise<string>((resolve) => {
      handler = async (d: Dialog) => {
        this.page.off("dialog", handler!);
        const m = d.message();
        // Another listener may have answered it first (the CR `ts` fixture answers every native dialog: inside
        // ts.allowConfirm() it accepts, as here). Added 21.10.2026 (EAINT-12253): the message is still returned.
        await (answer === "accept" ? d.accept() : d.dismiss()).catch(() => undefined);
        resolve(m);
      };
      this.page.on("dialog", handler);
    });
    try {
      await click();
      return await Promise.race([
        seen,
        new Promise<string>((_, rej) => {
          timer = setTimeout(() => rej(new Error("expected a native confirm, none came")), timeoutMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      if (handler) this.page.off("dialog", handler);
    }
  }

  async chooseOwnerCategory(category: DeregOwnerCategory = DeregOwnerCategory.MYKAD): Promise<string> {
    const tiles = this.page.locator(`a.owner-category[category="${category}"]`);
    for (let i = 0; i < (await tiles.count()); i++) {
      if (await tiles.nth(i).isVisible()) {
        await tiles.nth(i).click();
        break;
      }
    }
    const dlg = this.page.locator(".ui-dialog:visible").filter({ hasText: "Pilihan anda" });
    await dlg.waitFor({ state: "visible", timeout: 15_000 });
    const said = (await dlg.innerText()).replace(/\s+/g, " ").trim();
    await Promise.all([this.page.waitForURL(/dereg\/transaction\/auth-owner\.do/, { timeout: 30_000 }), dlg.locator("button", { hasText: /^YA$/ }).click()]);
    return said;
  }

  /** Step 1: PERINGATAN Ya/Yes, then the owner's MyKad. Ends with Next visible. */
  async authenticateOwner(opts: { mykad: MyKadDriver; card: CardLike }): Promise<void> {
    await this.page.locator("#agreePeringatanConsent").click();
    await this.readMyKad(opts.mykad, opts.card);
  }

  /** Step 1 → Step 2 (`data-entry.do`). */
  async continueToVehicle(): Promise<void> {
    await Promise.all([this.page.waitForURL(/dereg\/transaction\/data-entry\.do/, { timeout: 30_000 }), this.page.locator("#continueButton").click()]);
  }

  /** Step 2: fill everything. Returns the pre-check line the page prints under Vehicle No. */
  async fillVehicleDetails(v: DeregVehicleDetails): Promise<string> {
    await this.page.locator("#contactNo").fill(v.contactNo);
    await this.page.locator("#email").fill(v.email);
    await this.page.locator("#pbtCompanyId").selectOption(v.pbt ?? "-1");
    await this.page.locator("#aatfConsent").setInputFiles(v.consentFile);
    await this.page.locator("#vehicleRegNo").fill(v.vehicleRegNo);
    await this.page.locator("#vehicleEngineNo").click(); // leaving the field runs the pre-check check
    const line = this.page.getByText(/allowed to create eDereg transaction|pre-?check/i).first();
    await line.waitFor({ state: "visible", timeout: 30_000 }).catch(() => undefined);
    const precheck = (await line.innerText().catch(() => "")).trim();
    await this.page.locator("#vehicleEngineNo").fill(v.engineNo);
    await this.page.locator("#vehicleChassisNo").fill(v.chassisNo);
    await this.page.locator("#vehicleMake").selectOption({ label: v.make });
    await this.page.locator("#vehicleModel option").nth(2).waitFor({ state: "attached", timeout: 15_000 }).catch(() => undefined);
    await this.page.locator("#vehicleModel").selectOption({ index: 1 });
    await this.page.locator("#vehicleYear").selectOption({ label: v.year });
    await this.page.locator("#photo1").setInputFiles(v.photoFile);
    return precheck;
  }

  // ── Step 2, a vehicle with NO pre-check: the EMBEDDED e-Dereg Pre-Checking (added 21.10.2026, EAINT-12253 CH_TS9) ──
  //
  // Read from Step 2's own markup and page script (probe cr/EAINT-12253/03-spec/probes-2010/out/p12/b1-after-vehicle-blur.html,
  // staging /eauto/ 20.10.2026; `runPrecheckGate`, `showPrecheckConsent`, `startPrecheckPayment`, `proceedPayment`,
  // `reloadPaymentDialog`, `showPaymentDialog`). CORRECTED 21.10.2026 pm (cr-triage, CH_TS9 run 1452-L1 trace + network):
  //   leaving `#vehicleRegNo` → `precheck-exists.do` false → `#precheck-result` "Approved eDereg Pre-Checking within 6 months
  //   is required to proceed" and the CONSENT pop-up (jQuery UI, `dialogClass: dpc-consent-dialog`, title "eDereg Pre-Checking
  //   Enquiry", e-mail `#dpc-consent-email`, "Click NEXT to pay and retrieve the vehicle pre-checking result.", the Payment
  //   Summary JPJ 5.00 + eAuto 5.00 + tax 0.40 = `#dpc-consent-total` 10.40, buttons Next / Cancel). The consent pop-up IS the
  //   pre-check's payment screen: its Next CREATES the pre-check (`create.do`) AND PAYS it at once (`make-payment.do`, no
  //   confirm, RHB keyed on the vehicle prefix).
  //     - payment OK  → the result pop-up (the dialog holding `#payment-result`: the Step 3 Result `#result-container`,
  //       button Close). No other pop-up in between.
  //     - payment refused (e.g. RHB IF) → the page's own alert() with the RHB message, then the payment (RETRY) pop-up
  //       (the dialog holding `#precheck-popup`: payment form, "Click NEXT" hidden on a retry, a reset timer that hides Next
  //       while it runs, buttons Next / Cancel) → its Next pays again (`retry-payment.do`) → the result pop-up.
  //   The `#precheck-popup` pop-up also opens straight from the check for an UNPAID pre-check found by
  //   `resumable-precheck.do` (no consent pop-up then; not handled here: `openEmbeddedPrecheck` throws).
  //   Close on the result pop-up re-runs the check → `#precheck-result` "This vehicle is allowed to create eDereg transaction".
  //   The result pop-up is the pre-check's FINAL step (EAINT-12253): nothing here touches it except Close.

  /** The consent pop-up of the embedded pre-check — also its first payment screen (Payment Summary, Next pays). */
  get embeddedPrecheckConsent() {
    return this.page.locator(".ui-dialog.dpc-consent-dialog:visible");
  }

  /** The payment (RETRY) pop-up of the embedded pre-check (holds `#precheck-popup`): only after a refused payment, or to resume an unpaid one. */
  get embeddedPrecheckPayment() {
    return this.page.locator(".ui-dialog:visible").filter({ has: this.page.locator("#precheck-popup") });
  }

  /** The result pop-up of the embedded pre-check (holds `#payment-result`): its final step. */
  get embeddedPrecheckResult() {
    return this.page.locator(".ui-dialog:visible").filter({ has: this.page.locator("#payment-result") });
  }

  private get embeddedResultClose() {
    return this.embeddedPrecheckResult.locator(".ui-dialog-buttonpane button").filter({ hasText: /^\s*Close\s*$/ });
  }

  /** The line Step 2 prints under Vehicle No. after the check (`#precheck-result`). */
  async precheckResultLine(): Promise<string> {
    return (await this.page.locator("#precheck-result").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
  }

  /** Type the vehicle and leave the field: the check runs and, with no pre-check, the consent pop-up opens. Creates nothing. */
  async openEmbeddedPrecheck(vehicleRegNo: string): Promise<{ line: string; popup: string }> {
    await this.page.locator("#vehicleRegNo").fill(vehicleRegNo);
    await this.page.locator("#vehicleEngineNo").click(); // leaving the field runs the check (runPrecheckGate on blur)
    try {
      await this.embeddedPrecheckConsent.waitFor({ state: "visible", timeout: 60_000 });
    } catch {
      throw new Error(`Step 2: no e-Dereg Pre-Checking pop-up for ${vehicleRegNo} (does it already have a pre-check, or an unpaid one?). Line: "${await this.precheckResultLine()}"`);
    }
    return { line: await this.precheckResultLine(), popup: (await this.embeddedPrecheckConsent.innerText()).replace(/\s+/g, " ").trim() };
  }

  /**
   * Consent pop-up: type the e-mail. Presses nothing. Returns the pop-up's text as it stands before Next: the pre-check's
   * payment screen ("Click NEXT to pay …", Payment Summary, Total Amount Payable 10.40, the declaration by the buttons).
   */
  async fillEmbeddedPrecheckConsent(email: string): Promise<string> {
    await this.embeddedPrecheckConsent.locator("#dpc-consent-email").fill(email);
    return (await this.embeddedPrecheckConsent.innerText()).replace(/\s+/g, " ").trim();
  }

  /**
   * Consent pop-up Next: CREATES the pre-check and PAYS it (RM10.40 on staging; RHB keyed on the vehicle prefix — wrap this
   * call in the RHB switch). Waits for EITHER outcome and says which:
   *   `paid`  — the result pop-up arrived (its Close visible, "Working..." cleared): the pre-check's final step, untouched;
   *   `retry` — the payment was refused: the page's alert (answered here, its text in `refusal`) and then the payment
   *             (retry) pop-up holding `#precheck-popup`. Nothing pressed on it; `payEmbeddedPrecheck()` pays from there.
   */
  async agreeEmbeddedPrecheck(): Promise<{ outcome: "paid" | "retry"; text: string; refusal?: string }> {
    const alerts: string[] = [];
    // The refusal is a native alert(); the page opens the retry pop-up only once it is answered. One listener, removed
    // after the outcome, accepting (= OK); tolerant of a dialog another listener answered first (the `ts` fixture's).
    const onDialog = async (d: Dialog) => {
      alerts.push(d.message());
      await d.accept().catch(() => undefined);
    };
    this.page.on("dialog", onDialog);
    try {
      await this.embeddedPrecheckConsent.locator(".ui-dialog-buttonpane button").filter({ hasText: /^\s*Next\s*$/ }).click();
      try {
        await this.embeddedResultClose.or(this.embeddedPrecheckPayment).first().waitFor({ state: "visible", timeout: 120_000 });
      } catch {
        throw new Error(`Embedded pre-check: after the consent pop-up's Next neither the result pop-up nor the payment (retry) pop-up opened within 120 s.${alerts.length ? ` Alerts: ${alerts.map((a) => `"${a}"`).join("; ")}.` : ""} Line: "${await this.precheckResultLine()}"`);
      }
    } finally {
      this.page.off("dialog", onDialog);
    }
    const refusal = alerts.length ? alerts.join(" | ") : undefined;
    if (await this.embeddedResultClose.first().isVisible()) {
      await awaitFinalScreen(this.page, this.embeddedResultClose, "embedded pre-check result pop-up: Close", 30_000);
      return { outcome: "paid", text: (await this.embeddedPrecheckResult.innerText()).replace(/\s+/g, " ").trim(), refusal };
    }
    return { outcome: "retry", text: (await this.embeddedPrecheckPayment.innerText()).replace(/\s+/g, " ").trim(), refusal };
  }

  /**
   * Payment (RETRY) pop-up — only after `agreeEmbeddedPrecheck()` returned `retry`: Next → PAYS again (`retry-payment.do`;
   * wrap in the RHB switch) and returns ON ARRIVAL of the result pop-up (its Close visible, "Working..." cleared) with its
   * text. Next is hidden while the pop-up's reset timer runs, so it waits for Next (up to `nextTimeoutMs`). The result
   * pop-up is not touched (EAINT-12253).
   */
  async payEmbeddedPrecheck(nextTimeoutMs = 10 * 60_000): Promise<string> {
    const next = this.embeddedPrecheckPayment.locator(".ui-dialog-buttonpane button").filter({ hasText: /^\s*Next\s*$/ });
    try {
      await next.waitFor({ state: "visible", timeout: nextTimeoutMs });
    } catch {
      throw new Error(`Embedded pre-check payment (retry) pop-up: no Next within ${nextTimeoutMs / 1000} s (reset timer still running?). Pop-up: "${(await this.embeddedPrecheckPayment.innerText().catch(() => "")).replace(/\s+/g, " ").trim()}"`);
    }
    await next.click();
    await awaitFinalScreen(this.page, this.embeddedResultClose, "embedded pre-check result pop-up: Close", 120_000);
    return (await this.embeddedPrecheckResult.innerText()).replace(/\s+/g, " ").trim();
  }

  /** Result pop-up: Close → back on Step 2, the check re-run; returns the line ("This vehicle is allowed to create eDereg transaction"). */
  async closeEmbeddedPrecheckResult(): Promise<string> {
    await this.embeddedResultClose.click();
    await this.page.locator("#precheck-result").filter({ hasText: /allowed to create eDereg transaction/i }).waitFor({ state: "visible", timeout: 60_000 }).catch(() => undefined);
    return this.precheckResultLine();
  }

  /** Step 2 → owner declaration: Next + native "Sure to continue?". */
  async continueToOwnerDeclaration(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/dereg\/transaction\/auth-owner-consent\.do/, { timeout: 60_000 }),
      this.acceptNative(() => this.page.locator("#to-continue").click()),
    ]);
  }

  /** Owner declaration: `#owner-consent` + owner's MyKad, Next → Step 3 AATF declaration. */
  async ownerDeclaration(opts: { mykad: MyKadDriver; card: CardLike }): Promise<void> {
    await this.tickConsent("#owner-consent");
    await this.readMyKad(opts.mykad, opts.card);
    await Promise.all([this.page.waitForURL(/dereg\/transaction\/aatf-consent\.do/, { timeout: 30_000 }), this.page.locator("#continueButton").click()]);
  }

  /** Step 3: `#aatf-consent` → `#to-auth-aatf` → the LOGIN USER's MyKad. Ends with Next visible. */
  async authenticateAatf(opts: { mykad: MyKadDriver; card: CardLike }): Promise<void> {
    await this.page.locator("#aatf-consent").click();
    await this.page.locator("#to-auth-aatf").waitFor({ state: "visible", timeout: 15_000 });
    await Promise.all([this.page.waitForURL(/dereg\/transaction\/auth-aatf\.do/, { timeout: 30_000 }), this.page.locator("#to-auth-aatf").click()]);
    await this.readMyKad(opts.mykad, opts.card);
  }

  /** Step 3 → Step 4 (`jpj-enq.do`). */
  async continueToJpjCheck(): Promise<void> {
    await Promise.all([this.page.waitForURL(/dereg\/transaction\/jpj-enq\.do/, { timeout: 30_000 }), this.page.locator("#continueButton").click()]);
    await expect(this.page.locator("#to-agree")).toBeVisible();
  }

  /** Step 4: agree, Next, native "Submit to JPJ for checking?", wait for the result. */
  async runJpjEnquiry(): Promise<{ responseCode: string; status: string }> {
    await this.page.locator("#to-agree").click();
    await this.acceptNative(() => this.page.locator("#to-enquiry").click());
    await this.page.locator("body").filter({ hasText: /Response Code:/ }).waitFor({ timeout: 90_000 });
    return { responseCode: await this.labelled("Response Code:"), status: await this.labelled("JPJ Enquiry Status:") };
  }

  /** Step 4 → Step 5: `#to-payment` + native "Sure to continue?". Pays nothing. */
  async goToPayment(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/dereg\/transaction\/payment\.do/, { timeout: 60_000 }),
      this.acceptNative(() => this.page.locator("#to-payment").click()),
    ]);
    await expect(this.page.locator("input#to-payment")).toBeVisible();
  }

  /**
   * Step 5: Next and READ the native confirm, then DISMISS it (nothing paid). Returns its text,
   * e.g. "Sure to submit this payment to DEREGISTER?".
   */
  async readPaymentConfirm(): Promise<string> {
    return this.oneNative(() => this.page.locator("input#to-payment").click(), "dismiss");
  }

  /** Step 6 Deregister's own marker ("JPJ Deregistration Status", probe p12, OUP0028). */
  get step6Marker() {
    return this.page.getByText(/JPJ Deregistration Status/i);
  }

  /**
   * PAYS and DEREGISTERS. Step 5 Next + accept the native confirm → Step 6 (`jpj-sub.do`).
   *
   * FINAL STEP (EAINT-12253, BA 21.10.2026). The one native confirm accepted is the payment's own,
   * BEFORE arrival (`page.once`, consumed by it). Returns on arrival: `jpj-sub.do`, "JPJ
   * Deregistration Status" visible, "Working..." cleared; the status is READ. No dialog handler is
   * left behind and nothing after arrival touches a dialog.
   */
  async payAndDeregister(): Promise<{ status: string; message: string }> {
    const message = await this.acceptNative(() => this.page.locator("input#to-payment").click());
    await this.page.waitForURL(/dereg\/transaction\/jpj-sub\.do/, { timeout: 120_000 });
    await awaitFinalScreen(this.page, this.step6Marker, "Dereg Step 6: 'JPJ Deregistration Status'");
    return { status: await this.labelled("JPJ Deregistration Status:"), message };
  }
}
