import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "../base.page";
import { step } from "@fixtures/step";
import { UcdHomePage, UCD_MENU } from "./ucd-home.page";
import { awaitFinalScreen } from "../final-step";

/**
 * Service Hub — UCD portal.
 *
 * Selectors read off staging /eauto/ on 2026-10-20 (EAINT-12253 probes p01 / p02 / p04,
 * `cr/EAINT-12253/03-spec/probes-2010/`), from the live DOM and the pages' own scripts.
 *
 * Landing `view/ucd/service-hub/view.do` (tile SERVICE HUB) has three `div.menu-btn` tiles,
 * no `#create-tx`:
 *   `#service-request-listing`   → `service-hub/listing.do`
 *   `#software-installation`     → `service-hub/installation.do`
 *   `#biometric-device-purchase` → `service-hub/purchase.do`
 *
 * Both services put **payment before the appointment**, so their later steps cannot be
 * reached without paying:
 *   Software Installation: 1 Payment → 2 Appointment → 3 Submission
 *   Biometric Device Purchase: 1 Selection → 2 Payment → 3 Appointment → 4 Submission
 *
 * "Make Payment" (`#si-pay-btn`, on both) opens a jQuery UI dialog "Payment" —
 * "Sure to proceed with payment?" — with **Back** (`.cancel-dialog-btn`) and **Next**
 * (`.confirm-dialog-btn`). Next posts `…/make-payment.do` (RHB): PAID → appointment
 * calendar (`installation/slot.do?id=…`); FAILED → RHB message dialog. Never press Next
 * unless a ticket means to pay.
 *
 * After paying (walked live 20.10.2026, probe p10; paid SI RM54.00 and BDP RM850.00), BOTH
 * services land on the same Appointment calendar `service-hub/installation/slot.do?id=<requestId>`
 * ("Schedule an Appointment", 2 sessions a day: 10:00am - 12:00pm / 2:00pm - 4:00pm, up to 3 per
 * session; cells `td.si-book[onclick]` "N Available", "Full", "Public Holiday"; month arrows
 * `#si-prev` / `#si-next`; "Booked 0 of 1 appointment(s)."; **Confirm Appointment**
 * `#si-confirm-booking`, which submits WITHOUT a confirm dialog). A date opens the modal `#si-ovl`
 * (`#si-dec<n>` / `#si-inc<n>` per session, modal **Confirm** `#si-confirm` places a server-side
 * hold). Confirm Appointment → Submission `installation/submitted.do?id=` "Request Submitted".
 *
 * Biometric Device Purchase has two variants, chosen on Step 2 Payment by the checkbox
 * "I don't need software installation" (`#installOptOut`, probe `probes-2110/p01`, 21.10.2026):
 * WITH installation (default) pays → Appointment → Submission as above; WITHOUT installation pays →
 * Submission directly (`PAID:SUB` in the page script; not yet confirmed on a paid run).
 *
 * No MyKad / thumbprint on either path.
 */
export const SERVICE_HUB_LANDING = /ucd\/service-hub\/view\.do/;

export type ServiceHubTile = "service-request-listing" | "software-installation" | "biometric-device-purchase";

export class ServiceHubPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  @step("Open Service Hub from the dashboard")
  async gotoLanding(): Promise<void> {
    const home = new UcdHomePage(this.page);
    await home.returnToDashboard();
    await home.goTo(UCD_MENU.serviceHub);
    await expect(this.page).toHaveURL(SERVICE_HUB_LANDING, { timeout: 30_000 });
  }

  @step("Open a Service Hub tile")
  async open(tile: ServiceHubTile): Promise<void> {
    await this.gotoLanding();
    await (await this.requireVisible(this.page.locator(`#${tile}`), `Service Hub tile #${tile}`)).click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  /** The flow strip, e.g. { steps: ["1 Payment","2 Appointment","3 Submission"], active: "1 Payment" }. */
  async flowSteps(): Promise<{ steps: string[]; active: string }> {
    const norm = (s: string) => s.replace(/\s+/g, " ").trim();
    const steps = (await this.page.locator(".flow-steps .fs-step").allInnerTexts()).map(norm);
    const active = norm((await this.page.locator(".flow-steps .fs-step.active").first().innerText().catch(() => "")) || "");
    return { steps, active };
  }

  /** "Total Amount Payable (inclusive of Service Tax 8%) :" value, e.g. "54.00". */
  async totalPayable(): Promise<string> {
    return this.labelled("Total Amount Payable (inclusive of Service Tax 8%) :");
  }

  get makePaymentButton(): Locator {
    return this.page.locator("#si-pay-btn");
  }

  /** The "Payment" confirm dialog Make Payment opens. */
  get paymentDialog(): Locator {
    return this.page.locator(".ui-dialog:visible").filter({ hasText: "Sure to proceed with payment?" });
  }

  /** Press Make Payment and wait for the confirm dialog. Pays NOTHING. Returns the dialog text. */
  @step("Make Payment: open the confirm dialog")
  async openPaymentDialog(): Promise<string> {
    await (await this.requireVisible(this.makePaymentButton, "Make Payment (#si-pay-btn)")).click();
    await this.paymentDialog.waitFor({ state: "visible", timeout: 15_000 });
    return (await this.paymentDialog.innerText()).replace(/\s+/g, " ").trim();
  }

  /** Close the confirm dialog with **Back**. Nothing is paid; Make Payment is enabled again. */
  @step("Payment dialog: Back")
  async cancelPaymentDialog(): Promise<void> {
    const dlg = this.paymentDialog;
    await dlg.locator("button.cancel-dialog-btn, button:text-is('Back')").first().click();
    await dlg.waitFor({ state: "hidden", timeout: 10_000 });
  }

  // ── Biometric Device Purchase, Step 1 Selection (`purchase.do`) ──────────────────

  /**
   * Fill Step 1 Selection. Recipient name, contact and address arrive prefilled from the
   * company profile; the prefilled contact can FAIL the page's own check
   * `/^0[0-9]{8,10}$/` (Azfar1's "6020000011" did, 20.10.2026), so pass `contactNo`.
   */
  @step("Biometric Device Purchase: fill Selection")
  async fillBiometricSelection(opts: { quantity?: number; recipientName?: string; contactNo?: string; deliveryAddress?: string }): Promise<void> {
    await expect(this.page).toHaveURL(/service-hub\/purchase\.do/);
    if (opts.quantity !== undefined) await this.page.locator("#qty").fill(String(opts.quantity));
    if (opts.recipientName !== undefined) await this.page.locator("#authorizedReceiver").fill(opts.recipientName);
    if (opts.contactNo !== undefined) await this.page.locator("#contactNo").fill(opts.contactNo);
    if (opts.deliveryAddress !== undefined) {
      const ship = this.page.locator("#shipToShowroom");
      if (await ship.isChecked()) await ship.click();
      await this.page.locator("#deliveryAddress").fill(opts.deliveryAddress);
    }
  }

  /**
   * Selection → Next. Posts `api/ucd/service-hub/purchase/create.do`, which lands on
   * Step 2 Payment at that same URL. Throws with the page's own complaints if it stays.
   */
  @step("Biometric Device Purchase: Next to Payment")
  async biometricNextToPayment(): Promise<void> {
    await this.page.locator("button[type=submit]", { hasText: /^\s*Next\s*$/ }).click();
    try {
      await this.page.waitForURL(/service-hub\/purchase\/create\.do/, { timeout: 30_000 });
    } catch {
      const errs = (await this.page.locator(".err:visible, [id^='err-']:visible").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
      throw new Error(`Selection was not accepted: ${errs.join(" | ") || "(no message on the page)"}`);
    }
    await expect(this.makePaymentButton).toBeVisible();
  }

  // ── Biometric Device Purchase, Step 2 Payment: with / without installation ──────

  /**
   * "I don't need software installation" — the ONLY with/without-installation control. It sits on
   * Step 2 Payment (`purchase/create.do`), not on Selection (probe `probes-2110/p01`, 21.10.2026).
   * Unticked (page default) = WITH installation: 1 free install per device + "Additional Installation"
   * stepper at RM54.00 each (`#bio-extra-plus` / `#bio-extra-minus`). Ticked (`bioToggleInstall()`)
   * = WITHOUT: the SI line and its RM leave the summary, "No installation appointment will be
   * scheduled." shows (`#bio-si-optout`), both steppers go read-only, and Make Payment posts
   * `installOptOut=Y`. Client-side only until Make Payment → Next. The flow strip still reads
   * 1 Selection → 2 Payment → 3 Appointment → 4 Submission either way.
   */
  get installOptOutCheckbox(): Locator {
    return this.page.locator("#installOptOut");
  }

  /** Tick / untick "I don't need software installation" and wait for the page's own view to follow. */
  @step("Biometric Device Purchase: choose with / without installation")
  async setBiometricInstallation(withInstallation: boolean): Promise<void> {
    await expect(this.page).toHaveURL(/service-hub\/purchase\/create\.do/);
    const box = await this.requireVisible(this.installOptOutCheckbox, "I don't need software installation (#installOptOut)");
    if (withInstallation) await box.uncheck();
    else await box.check();
    await expect(this.page.locator("#bio-si-optout")).toBeVisible({ visible: !withInstallation });
    await expect(this.page.locator("#bio-si-line")).toBeVisible({ visible: withInstallation });
  }

  /**
   * PAYS. Next on the open "Sure to proceed with payment?" dialog, for a Biometric Device Purchase
   * WITHOUT installation. From the page script (`bioDoSubmit`, staging /eauto/ 20 + 21.10.2026): the
   * server answers `PAID:SUB:<id>` → `view/ucd/service-hub/installation/submitted.do?id=<id>`, i.e.
   * straight to Step 4 Submission with no Appointment; `PAID:CAL:<id>` → `installation/slot.do`
   * (the with-installation path). Which answer an opt-out gets is NOT CONFIRMED on a paid run, and
   * neither is the Submission screen's content for a device-only request: assumed to be the same
   * "Request Submitted" marker seen on the with-installation Submission (20.10.2026) — to confirm on
   * a paid run. If it lands on the Appointment calendar instead, this throws (already paid).
   *
   * FINAL STEP (EAINT-12253): returns on arrival (URL + marker + "Working..." cleared); nothing after
   * that touches a dialog.
   */
  @step("Payment: Next (PAYS) → Submission, without installation")
  async payToSubmission(): Promise<string> {
    await Promise.all([
      this.page.waitForURL(/service-hub\/installation\/(submitted|slot)\.do/, { timeout: 120_000 }),
      this.paymentDialog.locator("button.confirm-dialog-btn, button:text-is('Next')").first().click(), // PAYS
    ]);
    const url = new URL(this.page.url());
    if (/slot\.do/.test(url.pathname)) {
      throw new Error(`Paid WITHOUT installation but landed on the Appointment calendar (${url.href}); the opt-out was not honoured.`);
    }
    await awaitFinalScreen(this.page, this.submittedMarker, "Service Hub Submission (no installation): 'Request Submitted' — unconfirmed");
    return url.searchParams.get("id") ?? "";
  }

  // ── Appointment (after paying) ─────────────────────────────────────────────────

  /** "Booked N of M appointment(s)." as numbers. */
  async bookedCount(): Promise<{ booked: number; of: number }> {
    const m = /Booked (\d+) of (\d+) appointment/.exec(await this.page.locator("body").innerText());
    return { booked: Number(m?.[1] ?? NaN), of: Number(m?.[2] ?? NaN) };
  }

  /**
   * Pick the first bookable date (moving up to `maxMonths` months forward), add one installation
   * to the first session with room, and press the modal's Confirm (places a hold). Confirm
   * Appointment is NOT pressed. Returns the date picked (yyyy-mm-dd).
   */
  @step("Appointment: pick the first free slot")
  async pickFirstFreeSlot(maxMonths = 3): Promise<string> {
    let cell = this.page.locator("td.si-book[onclick]").first();
    for (let m = 0; m < maxMonths && !(await cell.isVisible().catch(() => false)); m++) {
      await this.page.locator("#si-next").click();
      cell = this.page.locator("td.si-book[onclick]").first();
      await cell.waitFor({ state: "visible", timeout: 3_000 }).catch(() => undefined);
    }
    if (!(await cell.isVisible().catch(() => false))) throw new Error(`No bookable Service Hub date in the next ${maxMonths} months.`);
    const date = (await cell.getAttribute("data-date")) ?? "";
    await cell.click();
    await this.page.locator("#si-ovl").waitFor({ state: "visible", timeout: 15_000 });
    const inc0 = this.page.locator("#si-inc0");
    await ((await inc0.isEnabled()) ? inc0 : this.page.locator("#si-inc1")).click();
    await this.page.locator("#si-confirm").click();
    await this.page.locator("#si-ovl").waitFor({ state: "hidden", timeout: 15_000 });
    return date;
  }

  /** The Submission screen's own marker ("Request Submitted", probe p10, 20.10.2026). */
  get submittedMarker(): Locator {
    return this.page.getByText("Request Submitted");
  }

  /**
   * SUBMITS. Confirm Appointment → Submission (`installation/submitted.do?id=`, "Request Submitted").
   * No confirm dialog on this button.
   *
   * FINAL STEP of both services (EAINT-12253, BA 21.10.2026: the reminder shows on the final step
   * after a successful payment / submission). Returns on arrival: URL, "Request Submitted" visible,
   * "Working..." cleared. Nothing after that touches a dialog.
   */
  @step("Appointment: Confirm Appointment (submit)")
  async confirmAppointment(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/service-hub\/installation\/submitted\.do/, { timeout: 60_000 }),
      this.page.locator("#si-confirm-booking").click(),
    ]);
    await awaitFinalScreen(this.page, this.submittedMarker, "Service Hub Submission: 'Request Submitted'");
  }
}
