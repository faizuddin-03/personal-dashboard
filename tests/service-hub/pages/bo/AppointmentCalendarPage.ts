import { type Page, type Locator, expect, test } from "@playwright/test";
import { BasePage } from "../BasePage";
import { PATHS } from "../../utils/config";

export type BoTimeSlot = 0 | 1; // 0 = 10am–12pm, 1 = 2pm–4pm

/**
 * A BO calendar date's per-session snapshot, read straight off the grid
 * (div.cal-cap) — no modal needed. `full` reflects the "(Full)" indicator,
 * which on BO is informational (the 6/day cap binds UCD Portal bookings only;
 * CSE can still add past it). Consumed by findDateMatching().
 */
export interface BoDateSlotInfo {
  date: string; // the calendar's DD-MM-YYYY label
  morning: { booked: number; full: boolean };
  afternoon: { booked: number; full: boolean };
}

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
    // Guard against a redirect race landing us on the portal home instead of
    // the listing (the Appointment Calendar button won't be there) — retry once.
    if ((await this.listingApptCalBtn.count()) === 0) {
      await this.goto(PATHS.boListing);
    }
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

  /**
   * BO counterpart to the UCD SlotPickerComponent.findDateMatching(): returns
   * the first date in the CURRENTLY DISPLAYED month whose per-session snapshot
   * satisfies `predicate`. BO shows per-slot counts directly on the grid, so
   * no modal is opened. Scanning is limited to the visible month — select a
   * different month via #cal-month-picker + Search first if you need one.
   */
  async findDateMatching(predicate: (info: BoDateSlotInfo) => boolean): Promise<string | null> {
    const labels = await this.calTable.locator("tbody tr span.cal-daynum").allTextContents();
    for (const raw of labels) {
      const date = raw.trim();
      if (!date) continue;
      const info: BoDateSlotInfo = {
        date,
        morning: { booked: await this.getSlotCount(date, 0), full: await this.isSlotFull(date, 0) },
        afternoon: { booked: await this.getSlotCount(date, 1), full: await this.isSlotFull(date, 1) },
      };
      if (predicate(info)) return date;
    }
    return null;
  }

  /** First date in the visible month whose given session shows "(Full)". */
  async findDateWithSlotFull(slot: BoTimeSlot): Promise<string | null> {
    return this.findDateMatching((i) => (slot === 0 ? i.morning : i.afternoon).full);
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

    let target: Locator | null = null;
    if (dayOfMonth !== undefined) {
      const exact = selectable.filter({ hasText: new RegExp(`^${dayOfMonth}$`) }).first();
      if (await exact.count()) target = exact;
      // else: requested day isn't selectable this month — fall through to any.
    }
    if (!target) {
      const n = await selectable.count();
      if (n === 0) throw new Error("No selectable day in the datepicker");
      target = selectable.nth(n - 1); // last selectable → later in month
    }
    await target.click();
    // The datepicker overlay sits directly over the time-slot radios below the
    // date field; if it stays open it intercepts the next click. Force it shut.
    await this.dismissDatepicker();
  }

  /**
   * Close the jQuery UI datepicker overlay so it can't intercept clicks.
   * Selecting a day can momentarily refocus the (readonly) date input, and
   * jQuery UI reopens the picker on focus — a synthetic blur() alone can lose
   * that race. Shifting focus to a real, inert click target (the open
   * dialog's title bar) is more reliable than blur() at keeping it shut.
   */
  private async dismissDatepicker() {
    await this.page.evaluate(() => {
      const w = window as unknown as { jQuery?: { datepicker?: { _hideDatepicker?: () => void } } };
      try {
        w.jQuery?.datepicker?._hideDatepicker?.();
      } catch {}
      const dp = document.getElementById("ui-datepicker-div");
      if (dp) dp.style.display = "none";
      (document.activeElement as HTMLElement | null)?.blur();
    });
    await this.page
      .locator(".ui-dialog:visible .ui-dialog-titlebar")
      .first()
      .click({ timeout: 2000 })
      .catch(() => {});
    await this.datepicker.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }

  private isoDayOfMonth(iso: string): number | undefined {
    const m = iso.match(/^\d{4}-\d{2}-(\d{2})$/);
    return m ? Number(m[1]) : undefined;
  }

  /**
   * Whether `dateIso` is selectable in the Add Appointment date field.
   *
   * Verified live against the real jQuery UI datepicker bound to #ac-add-date
   * (NOT the read-only #cal-table grid, which only ever displays existing
   * bookings and has no concept of "blocked" — the actual book/no-book gate
   * is this datepicker):
   *  - Past dates (before today): every cell carries
   *    "ui-datepicker-unselectable ui-state-disabled" and has no onclick.
   *  - Weekends: same disabled classes, plus "ui-datepicker-week-end".
   *  - Today and all future weekdays (including >2 months out — BO/CSE has
   *    no +2-day blackout and no 2-month window limit): enabled, no
   *    "ui-state-disabled" class.
   * Must be called with the Add Appointment dialog already open (does not
   * open/close the dialog itself, so callers can chain further actions).
   */
  async isAddDateSelectable(dateIso: string): Promise<boolean> {
    const [y, m, d] = dateIso.split("-").map(Number);
    await this.page.evaluate(() => {
      (window as unknown as { jQuery: any }).jQuery("#ac-add-date").datepicker("show");
    });
    await this.datepicker.waitFor({ state: "visible", timeout: 5000 });
    await this.datepicker.locator("select.ui-datepicker-month").selectOption(String(m - 1));
    await this.datepicker.locator("select.ui-datepicker-year").selectOption(String(y));
    // Changing the dropdowns re-renders the day grid — give it a beat.
    await this.page.waitForTimeout(200);
    const cell = this.datepicker.locator("td", { hasText: new RegExp(`^${d}$`) }).first();
    const disabled = await cell.evaluate((el) => el.classList.contains("ui-state-disabled"));
    await this.dismissDatepicker();
    return !disabled;
  }

  /**
   * Reschedule whichever appointment is listed first. Opens the Reschedule
   * dialog, sets a new date via the datepicker + a time slot, accepts the
   * native confirm, and waits for the calendar to refresh.
   */
  async rescheduleFirstListed(opts: { slot: BoTimeSlot }) {
    const link = this.page.locator("a.cal-rs").first();
    await this.demoHighlight(link);
    await link.click();
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
    const slotName = slot === 0 ? "morning" : "afternoon";
    const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-rs-dialog") });
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    // Show the current appointment being changed, so the reviewer sees the
    // "before" state before the new date is picked.
    await this.demoHighlight("#ac-rs-cur");

    await test.step(`Pick a new date and the ${slotName} slot`, async () => {
      // New Appointment Date via datepicker (readonly input → click to open).
      await this.page.locator("#ac-rs-date").click();
      await this.pickDatepickerDay();
      // Defensive: a refocus race can reopen the picker after pickDatepickerDay
      // already dismissed it — clear it again before touching the slot radio.
      if (await this.datepicker.isVisible().catch(() => false)) await this.dismissDatepicker();
      await this.demoHighlight(`input[name="ac-rs-slot"][value="${slot}"]`);
      await this.page.locator(`input[name="ac-rs-slot"][value="${slot}"]`).check();
    });

    await test.step("Confirm the reschedule", async () => {
      // Confirm raises a NATIVE browser confirm() — accept it.
      await this.demoHighlight(dialog.getByRole("button", { name: "Confirm" }), { color: "green" });
      this.page.once("dialog", (d) => d.accept());
      await dialog.getByRole("button", { name: "Confirm" }).click();
      await this.waitForNav();
      await this.demoPause();
    });
  }

  /**
   * Open the Add Appointment dialog and return its Locator, without filling
   * anything in. Used by the calendar date-rule checks (isAddDateSelectable
   * is scoped to this dialog's #ac-add-date field) — call closeAddDialog()
   * when done to leave the calendar clean.
   */
  async openAddDialog(): Promise<Locator> {
    await this.addAppointmentBtn.click();
    const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-add-dialog") });
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    return dialog;
  }

  /** Close the Add dialog via its Cancel button (best-effort, public wrapper). */
  async closeAddDialog(dialog: Locator) {
    await dialog.getByRole("button", { name: "Cancel" }).click().catch(() => {});
    await dialog.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }

  /**
   * Add Appointment (jQuery UI dialog). Default type is "New Record"; pass
   * existingRecordRefNo to use the "Existing Record" path.
   */
  /**
   * Returns the date actually booked (DD-MM-YYYY, matching the calendar
   * label) on success, or `null` when the add couldn't proceed — the company
   * couldn't be resolved, it has no unallocated units ("No allocation
   * remaining"), or the confirm was rejected. Callers use null to SKIP
   * (arrange-else-skip) rather than fail. The chosen date may differ from
   * `appointmentDate` if that day isn't selectable, which is why we report
   * back the date the datepicker actually committed.
   */
  async addAppointment(opts: {
    companyName: string;
    slot: BoTimeSlot;
    appointmentDate?: string; // ISO (YYYY-MM-DD); picks that day if selectable this month
    existingRecordRefNo?: string;
    /**
     * Exact company to click from the search results. Defaults to
     * companyName. Needed because several look-alikes exist (e.g.
     * "FAIZUDDIN AUTO TEST" vs "FAIZUDDIN AUTO TEST 2"/"3") — we match the
     * result whose text is EXACTLY this, never a prefix.
     */
    companySelect?: string;
  }): Promise<string | null> {
    await this.demoHighlight(this.addAppointmentBtn);
    await this.addAppointmentBtn.click();
    const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-add-dialog") });
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    await this.demoPause();

    // Appointment type radio (New Record vs Existing Record).
    await this.page
      .locator(`input[name="ac-add-type"][value="${opts.existingRecordRefNo ? "EXISTING" : "NEW"}"]`)
      .check();

    // Company search → results render in .ac_results (<ul><li> list). Select
    // by EXACT text so "FAIZUDDIN AUTO TEST" never matches "… TEST 2"/"… 3".
    await this.page.locator("#ac-add-name").fill(opts.companyName);
    await this.demoHighlight("#ac-add-name");
    await this.page.locator("#ac-add-search").click();
    const results = this.page.locator(".ac_results");
    await results.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    const pick = opts.companySelect ?? opts.companyName;
    const option = results.getByText(pick, { exact: true }).first();
    if (!(await option.count())) {
      await this.closeAddDialog(dialog); // company not in results — precondition unmet
      return null;
    }
    await this.demoHighlight(option);
    await option.click();

    // Existing Record: after the company is chosen, key in the reference
    // (captured from the BO SI Listing for this company) and search to bind it.
    if (opts.existingRecordRefNo) {
      const ref = opts.existingRecordRefNo;
      await test.step(`Enter Existing Record reference ${ref}`, async () => {
        await this.page.locator("#ac-add-refno").fill(ref);
        await this.demoHighlight("#ac-add-refno");
        await this.page.locator("#ac-add-ref-search").click();
        await this.page.waitForTimeout(500);
      });
    }

    // A company with no active installation request, or with no unallocated
    // units left, can't be added — the dialog surfaces one of these errors.
    if (
      (await this.page.locator("#ac-add-noreq").isVisible().catch(() => false)) ||
      (await this.page.locator("#ac-add-alloc-no").isVisible().catch(() => false))
    ) {
      await this.closeAddDialog(dialog);
      return null;
    }

    // Appointment date via datepicker + time slot radio.
    let bookedDate = "";
    await test.step(`Pick appointment date and the ${opts.slot === 0 ? "morning" : "afternoon"} slot`, async () => {
      await this.page.locator("#ac-add-date").click();
      await this.pickDatepickerDay(opts.appointmentDate ? this.isoDayOfMonth(opts.appointmentDate) : undefined);
      // Capture the date actually chosen (display value = DD-MM-YYYY).
      bookedDate = (await this.page.locator("#ac-add-date").inputValue().catch(() => "")).trim();
      // Defensive: a refocus race can reopen the picker after pickDatepickerDay
      // already dismissed it — clear it again before touching the slot radio.
      if (await this.datepicker.isVisible().catch(() => false)) await this.dismissDatepicker();
      await this.demoHighlight(`#ac-add-slot-${opts.slot}`);
      await this.page.locator(`#ac-add-slot-${opts.slot}`).check();
    });

    await test.step("Confirm the appointment", async () => {
      // Confirm raises a NATIVE browser confirm() — accept it.
      await this.demoHighlight(dialog.getByRole("button", { name: "Confirm" }), { color: "green" });
      this.page.once("dialog", (d) => d.accept());
      await dialog.getByRole("button", { name: "Confirm" }).click();
      await this.waitForNav();
      await this.demoPause();
    });

    // Success only if the dialog closed; a validation failure leaves it open.
    if (await dialog.isVisible().catch(() => false)) {
      await this.closeAddDialog(dialog);
      return null;
    }
    return bookedDate || null;
  }
}
