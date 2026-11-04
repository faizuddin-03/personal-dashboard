import type { Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { settleObs, choosePaymentTile, visibleFormStep, type PaymentMethod, type FormStep } from "./obs-page";

/**
 * The "Dealer Application Reactivation" page (EAINT-11868, SRD v1.4 §2.2.6): where the expiry email's
 * [Reactivate Application] button lands, `/obs/form/reactivate?linkUuid=…&s=…&v=…` (a SIGNED link: never log it).
 *
 * Seen 30.10.2026 (probe cr/EAINT-11868/03-spec/probes/p06, NA60001238, read only, nothing pressed):
 *
 *   Dealer Application Reactivation
 *   Your application expired on 30-10-2026. To resume the application, please proceed with the reactivation process below.
 *   Payment Summary  Pre-Application Fee: RM 100.00 · Service Tax 8% : RM 8.00 ·
 *                    Total Amount (Inclusive of 8% Service Tax) : RM 108.00
 *   declaration `#agreeTerms` (checkbox) → reveals `#payment-method-section` (display:none before)
 *   tiles: `#payment-credit` (Credit or Debit Card, channel creditAN), `#payment-fpx-business`, `#payment-fpx-personal`;
 *          banks `#bank-selection-personal` `bank-b2c-1..10`, `#bank-selection-business` `bank-b2b-12..19`
 *   `button#backBtn` "Back" (history.back() or window.close()) · `button#submitPayBtn` "Submit and Pay" (form#reactivateForm)
 *   `#unsuccessful-payment` "Unsuccessful Payment … Please choose a payment method and retry." (display:none before)
 *   `#payment-overlay` "Connecting… Please do not close the browser while connecting to payment gateway"
 *
 * The payment block is the Pre-Application's markup (same ids), so the tiles are chosen with the shared
 * `choosePaymentTile` (the radios are hidden; the tiles are what a user clicks). The submit button differs:
 * `#submitPayBtn` here, `#nextSubmitBtn` on the Pre-Application, `#to-submit-and-pay` on step 5.
 *
 * NOT seen yet (first use is the EAINT-11868 REA specs): the page after the gateway hands back (success or failure),
 * and what the same link opens once the application is reactivated (SRD §2.2.6 #1: the form).
 */
export const REACTIVATION_HEADING = "Dealer Application Reactivation";

export interface ReactivationSummary {
  heading: string;
  /** "30-10-2026" from "Your application expired on 30-10-2026." */
  expiredOn: string;
  fee: number;
  sstRate: number;
  sst: number;
  total: number;
  /** The page's own words, whitespace folded (no link in it). */
  text: string;
}

/** What a reactivate link (or any /obs/ dealer link) opened: told apart by what is on screen, never by the URL alone. */
export type ObsLanding =
  | { kind: "confirmation" }
  | { kind: "form"; step: FormStep }
  | { kind: "expired"; dialog: string }
  | { kind: "other"; text: string };

export class ReactivationPage {
  constructor(private readonly page: Page) {}

  /**
   * Navigate to a SIGNED link without its address appearing in a step title or a log: the link is handed to the page
   * as an argument (EAINT-11868: only host + path of these links are ever written down).
   */
  @step("Open a signed /obs/ link (address not logged)")
  async open(link: string): Promise<ObsLanding> {
    await this.page.evaluate((u) => { window.location.assign(u); }, link);
    await this.page.waitForTimeout(1_000);
    await this.page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await settleObs(this.page, 3_000, 30_000);
    await this.page.waitForTimeout(1_500);
    return this.landing();
  }

  /**
   * What is on screen now. The expired-link dialog was seen 30.10.2026 (p06, the original link of NA60001238):
   * a jQuery UI dialog "Application Link Expired … Sorry! The application link has expired during your submission.
   * Cancel OK" over the form.
   */
  async landing(): Promise<ObsLanding> {
    const expired = this.page.locator(".ui-dialog:visible", { hasText: /Application Link Expired/i }).first();
    if (await expired.count().catch(() => 0)) {
      return { kind: "expired", dialog: (await expired.innerText().catch(() => "")).replace(/\s+/g, " ").trim() };
    }
    if (await this.isConfirmation()) return { kind: "confirmation" };
    const step = await visibleFormStep(this.page);
    if (step) return { kind: "form", step };
    const text = (await this.page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
    if (/Application Link Expired/i.test(text)) return { kind: "expired", dialog: text.slice(0, 300) };
    return { kind: "other", text: text.slice(0, 600) };
  }

  /** The heading AND the Submit and Pay button: the page that asks the UCD to confirm and pay. */
  async isConfirmation(): Promise<boolean> {
    const heading = await this.page.getByText(REACTIVATION_HEADING, { exact: true }).first().isVisible().catch(() => false);
    const submit = await this.page.locator("button#submitPayBtn").isVisible().catch(() => false);
    return heading && submit;
  }

  /** The Payment Summary, read and checked against itself (fee + SST = total; SST = rate x fee). No amount is assumed. */
  @step("Read the reactivation Payment Summary")
  async summary(): Promise<ReactivationSummary> {
    const text = (await this.page.locator("body").innerText()).replace(/ /g, " ").replace(/\s+/g, " ").trim();
    const money = (re: RegExp) => {
      const m = re.exec(text);
      return m ? Number(m[1].replace(/,/g, "")) : NaN;
    };
    const s: ReactivationSummary = {
      heading: (await this.page.getByText(REACTIVATION_HEADING, { exact: true }).first().innerText().catch(() => "")).trim(),
      expiredOn: /expired on\s+(\d{2}-\d{2}-\d{4})/i.exec(text)?.[1] ?? "",
      fee: money(/Pre-Application Fee\s*:\s*RM\s*([\d,.]+)/i),
      sstRate: money(/Service Tax\s*([\d.]+)%\s*:/i),
      sst: money(/Service Tax\s*[\d.]+%\s*:\s*RM\s*([\d,.]+)/i),
      total: money(/Total Amount[^:]*:\s*RM\s*([\d,.]+)/i),
      text,
    };
    const unread = (["fee", "sstRate", "sst", "total"] as const).filter((k) => Number.isNaN(s[k]));
    if (unread.length) throw new Error(`Could not read ${unread.join(", ")} off the reactivation Payment Summary.`);
    return s;
  }

  /** Tick the declaration: the payment methods appear only after it. */
  @step("Accept the reactivation declaration")
  async acceptDeclaration(): Promise<void> {
    await this.page.locator("#agreeTerms").check();
    await this.page.locator("#payment-method-section").waitFor({ state: "visible", timeout: 15_000 });
  }

  /** See `choosePaymentTile`: the same tiles as the Pre-Application. */
  @step("Choose how to pay the reactivation fee")
  async choosePayment(method: PaymentMethod = "Online Banking (Personal)"): Promise<string> {
    return choosePaymentTile(this.page, method);
  }

  /** "Submit and Pay" — `#submitPayBtn`. Opens the gateway window (the caller waits for it). */
  @step("Submit and Pay the reactivation fee")
  async submitAndPay(): Promise<void> {
    await this.page.locator("button#submitPayBtn").click({ timeout: 20_000 });
  }

  /** "Unsuccessful Payment …" on this page (shown after a failed / abandoned payment), or "" when not shown. */
  async unsuccessful(): Promise<string> {
    const box = this.page.locator("#unsuccessful-payment");
    if (!(await box.isVisible().catch(() => false))) return "";
    return (await box.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
  }
}
