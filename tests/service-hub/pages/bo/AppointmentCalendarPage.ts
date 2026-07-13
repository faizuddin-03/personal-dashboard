import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "../BasePage";
import { PATHS } from "../../utils/config";

export type BoTimeSlot = 0 | 1; // 0 = 10am–12pm, 1 = 2pm–4pm

/**
 * eAuto Back Office Portal > Appointment Calendar.
 *
 * Selectors confirmed against the real BO portal HTML:
 *  - Reached from the Software Installation Listing via the "Appointment
 *    Calendar" button (#sc-appt-cal) — no stable direct URL.
 *  - Month bar: #cal-back, #cal-month-picker (datepicker), #cal-month-value
 *    (hidden ISO month), #cal-search, #cal-add-btn.
 *  - #cal-table: each row's td.cal-date has span.cal-daynum ("DD-MM-YYYY")
 *    and two div.cal-cap ("Morning - N", "Afternoon - N (Full)"; the count
 *    span carries class "full" when the slot is at capacity). The morning
 *    and afternoon <td>s each hold <ol.cal-ol><li> with an
 *    <a.cal-rs onclick="acRsOpen('<apptId>')">Reschedule</a> plus a
 *    <span.cal-co>"n. COMPANY NAME"</span>.
 *  - Reschedule dialog #ac-rs-dialog (jQuery UI): #ac-rs-name, #ac-rs-status,
 *    #ac-rs-ref, #ac-rs-cur (all read-only), #ac-rs-date (readonly
 *    datepicker), radios name="ac-rs-slot" (0/1), buttons Confirm/Cancel in
 *    the .ui-dialog-buttonpane. Confirm raises a NATIVE browser confirm().
 *  - Add dialog #ac-add-dialog: radios name="ac-add-type" (NEW/EXISTING),
 *    #ac-add-name + #ac-add-search + #ac-add-dd dropdown, #ac-add-ref-fld
 *    (#ac-add-refno + #ac-add-ref-search) shown for EXISTING, #ac-add-date
 *    datepicker, radios name="ac-add-slot" (#ac-add-slot-0/1), Confirm/Cancel.
 */
export class AppointmentCalendarPage extends BasePage {
  readonly backBtn = this.page.locator("#cal-back");
  readonly monthPicker = this.page.locator("#cal-month-picker");
  readonly monthValue = this.page.locator("#cal-month-value");
  readonly searchBtn = this.page.locator("#cal-search");
  readonly addAppointmentBtn = this.page.locator("#cal-add-btn");
  readonly calTable = this.page.locator("#cal-table");
  readonly datepicker = this.page.locator("#ui-datepicker-div");

  // Listing entry point used to reach the calendar.
  private readonly listingApptCalBtn = this.page.locator("#sc-appt-cal");

  constructor(page: Page) {
    super(page);
  }

  /** Reach the calendar via the Listing's "Appointment Calendar" button. */
  async navigate() {
    await this.goto(PATHS.boListing);
    await this.listingApptCalBtn.click();
    await this.calTable.waitFor({ state: "visible", timeout: 15000 });
  }

  /** Convert an ISO date (YYYY-MM-DD) to the calendar's DD-MM-YYYY label. */
  private isoToDayLabel(iso: string): string {
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y}`;
  }

  /** The calendar row (tr) for a given date, matched by its cal-daynum text. */
  getDayRow(dateStr: string): Locator {
    const label = dateStr.includes("-") && dateStr.length === 10 && dateStr[4] === "-"
      ? this.isoToDayLabel(dateStr)
      : dateStr;
    return this.calTable.locator("tbody tr", {
      has: this.page.locator("span.cal-daynum", { hasText: label }),
    });
  }

  /** Capacity text for a date/slot, e.g. "Morning - 3 (Full)". */
  async getSlotCapacityText(dateStr: string, slot: BoTimeSlot): Promise<string> {
    const cap = this.getDayRow(dateStr).locator("div.cal-cap").nth(slot);
    if ((await cap.count()) === 0) return "";
    return (await cap.textContent())?.trim().replace(/\s+/g, " ") ?? "";
  }

  /** Numeric booked count for a date/slot. */
  async getSlotCount(dateStr: string, slot: BoTimeSlot): Promise<number> {
    const text = await this.getSlotCapacityText(dateStr, slot);
    const match = text.match(/-\s*(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  /** SRD: the count span gets class "full" (shown as "(Full)") at capacity. */
  async isSlotFull(dateStr: string, slot: BoTimeSlot): Promise<boolean> {
    const text = await this.getSlotCapacityText(dateStr, slot);
    return /\(Full\)/i.test(text);
  }

  /** Whether any appointment on the page still offers a Reschedule link. */
  async isRescheduleAvailable(): Promise<boolean> {
    return (await this.page.locator("a.cal-rs").count()) > 0;
  }

  /**
   * Pick a selectable day in the currently-open jQuery UI datepicker.
   * The date inputs are readonly + backed by a hidden ISO field, so we must
   * go through the datepicker (which sets both) rather than typing. Disabled
   * days render as <span> inside td.ui-state-disabled; selectable days are
   * <a> — we click the last selectable one (later in the month → future).
   */
  private async pickDatepickerDay(dayOfMonth?: number) {
    await this.datepicker.waitFor({ state: "visible", timeout: 5000 });
    const selectable = this.datepicker.locator("td:not(.ui-state-disabled) a.ui-state-default");

    if (dayOfMonth !== undefined) {
      const exact = selectable.filter({ hasText: new RegExp(`^${dayOfMonth}$`) }).first();
      if (await exact.count()) {
        await exact.click();
        return;
      }
      // Requested day isn't selectable this month — fall through to any.
    }

    const n = await selectable.count();
    if (n === 0) throw new Error("No selectable day in the datepicker");
    await selectable.nth(n - 1).click(); // last selectable → later in month
  }

  private isoDayOfMonth(iso: string): number | undefined {
    const m = iso.match(/^\d{4}-\d{2}-(\d{2})$/);
    return m ? Number(m[1]) : undefined;
  }

  /**
   * Reschedule whichever appointment is listed first. Opens the Reschedule
   * dialog, sets a new date via the datepicker + a time slot, accepts the
   * native confirm, and waits for the calendar to refresh.
   */
  async rescheduleFirstListed(opts: { slot: BoTimeSlot }) {
    await this.page.locator("a.cal-rs").first().click();
    await this.completeRescheduleDialog(opts.slot);
  }

  /** Reschedule the first appointment whose company name matches. */
  async rescheduleByCompany(opts: { companyName: string; slot: BoTimeSlot }) {
    const li = this.calTable
      .locator("li", { has: this.page.locator("span.cal-co", { hasText: opts.companyName }) })
      .filter({ has: this.page.locator("a.cal-rs") })
      .first();
    await li.locator("a.cal-rs").click();
    await this.completeRescheduleDialog(opts.slot);
  }

  private async completeRescheduleDialog(slot: BoTimeSlot) {
    const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-rs-dialog") });
    await dialog.waitFor({ state: "visible", timeout: 10000 });

    // New Appointment Date via datepicker (readonly input → click to open).
    // The user confirmed any non-past selectable date is acceptable here.
    await this.page.locator("#ac-rs-date").click();
    await this.pickDatepickerDay();

    // Time slot radio.
    await this.page.locator(`input[name="ac-rs-slot"][value="${slot}"]`).check();

    // Confirm raises a NATIVE browser confirm() — accept it.
    this.page.once("dialog", (d) => d.accept());
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await this.waitForNav();
  }

  /**
   * Add Appointment (jQuery UI dialog). Default type is "New Record"; pass
   * existingRecordRefNo to use the "Existing Record" path.
   */
  async addAppointment(opts: {
    companyName: string;
    slot: BoTimeSlot;
    appointmentDate?: string; // ISO (YYYY-MM-DD); picks that day if selectable this month
    existingRecordRefNo?: string;
  }) {
    await this.addAppointmentBtn.click();
    const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-add-dialog") });
    await dialog.waitFor({ state: "visible", timeout: 10000 });

    if (opts.existingRecordRefNo) {
      await this.page.locator('input[name="ac-add-type"][value="EXISTING"]').check();
      await this.page.locator("#ac-add-refno").fill(opts.existingRecordRefNo);
      await this.page.locator("#ac-add-ref-search").click();
    } else {
      await this.page.locator('input[name="ac-add-type"][value="NEW"]').check();
    }

    // Company search → pick from the autocomplete dropdown (#ac-add-dd).
    await this.page.locator("#ac-add-name").fill(opts.companyName);
    await this.page.locator("#ac-add-search").click();
    const option = this.page.locator("#ac-add-dd").getByText(opts.companyName, { exact: false }).first();
    await option.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    if (await option.count()) await option.click();

    // Appointment date via datepicker + time slot radio.
    await this.page.locator("#ac-add-date").click();
    await this.pickDatepickerDay(opts.appointmentDate ? this.isoDayOfMonth(opts.appointmentDate) : undefined);
    await this.page.locator(`#ac-add-slot-${opts.slot}`).check();

    // Confirm raises a NATIVE browser confirm() — accept it.
    this.page.once("dialog", (d) => d.accept());
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await this.waitForNav();
  }
}
