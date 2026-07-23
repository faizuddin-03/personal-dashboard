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
 *  - Add dialog #ac-add-dialog (verified live, SIT2 — the New/Existing type
 *    radio is GONE, Reference No. is always required now): #ac-add-name +
 *    #ac-add-search (typing the EXACT company name auto-binds #ac-add-cid on
 *    search — no #ac-add-dd dropdown to click), #ac-add-ref-fld
 *    (#ac-add-refno + #ac-add-ref-search), #ac-add-date datepicker, radios
 *    name="ac-add-slot" (#ac-add-slot-0/1), Confirm/Cancel.
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
   * Whether the given company's appointment (in the currently-displayed
   * month) exposes the Reschedule link — used to verify status-based
   * blocking (Cancelled/Failed/Completed installations must not offer
   * Reschedule). Returns null if the company isn't listed in the visible
   * month at all, so callers can skip rather than fail on a stale/absent
   * candidate.
   */
  async hasRescheduleForCompany(companyName: string): Promise<boolean | null> {
    const li = this.calTable
      .locator("li", { has: this.page.locator("span.cal-co", { hasText: companyName }) })
      .first();
    if ((await li.count()) === 0) return null;
    return (await li.locator("a.cal-rs").count()) > 0;
  }

  /**
   * Pick a selectable day in the currently-open jQuery UI datepicker.
   * The date inputs are readonly + backed by a hidden ISO field, so we must
   * go through the datepicker (which sets both) rather than typing. Disabled
   * days render as <span> inside td.ui-state-disabled; selectable days are
   * <a> — we click the last selectable one (later in the month → future) when
   * no specific date is requested.
   *
   * BUG FIXED: this used to take only a bare day-of-month number and match it
   * against whatever month happened to already be showing (always the
   * current month — the datepicker opens on today's month by default). A
   * requested date in a DIFFERENT month (e.g. daysFromToday(N) crossing a
   * month boundary) would never match, and — silently, with no error — it
   * fell back to "last selectable day in the WRONG month" instead. That's
   * exactly what looked like "clicking a date in the calendar isn't
   * choosing it": some valid date got picked, just never the one asked for.
   * Now takes the full ISO date and navigates the month/year selects to the
   * right month FIRST, the same way isAddDateSelectable/
   * isRescheduleDateSelectable already do, before looking for the day.
   */
  private async pickDatepickerDay(dateIso?: string) {
    await this.datepicker.waitFor({ state: "visible", timeout: 5000 });

    let dayOfMonth: number | undefined;
    if (dateIso) {
      // Accept both ISO (YYYY-MM-DD) and calendar labels (DD-MM-YYYY).
      const parts = dateIso.split("-").map(Number);
      let y: number;
      let m: number;
      let d: number;
      if (parts.length === 3 && String(parts[0]).length === 4) {
        [y, m, d] = parts;
      } else {
        [d, m, y] = parts;
      }

      dayOfMonth = d;

      const monthSelect = this.datepicker.locator("select.ui-datepicker-month");
      const yearSelect = this.datepicker.locator("select.ui-datepicker-year");

      const monthOptions = await monthSelect
        .locator("option")
        .evaluateAll((opts) => opts.map((o) => Number((o as HTMLOptionElement).value)).filter((n) => Number.isFinite(n)));
      const yearOptions = await yearSelect
        .locator("option")
        .evaluateAll((opts) => opts.map((o) => Number((o as HTMLOptionElement).value)).filter((n) => Number.isFinite(n)));

      if (monthOptions.includes(m - 1)) {
        await monthSelect.selectOption(String(m - 1));
      }
      if (yearOptions.includes(y)) {
        await yearSelect.selectOption(String(y));
      }
      // Changing the dropdowns re-renders the day grid — give it a beat.
      await this.page.waitForTimeout(200);
    }

    const selectable = this.datepicker.locator("td:not(.ui-state-disabled) a.ui-state-default");
    let target: Locator | null = null;
    if (dayOfMonth !== undefined) {
      const exact = selectable.filter({ hasText: new RegExp(`^${dayOfMonth}$`) }).first();
      if (await exact.count()) target = exact;
      // else: requested day isn't selectable even in its own month (past/
      // weekend/holiday) — fall through to any, same as before.
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
    const selectableDay = this.datepicker
      .locator("td:not(.ui-state-disabled):not(.ui-datepicker-other-month) a.ui-state-default")
      .filter({ hasText: new RegExp(`^${d}$`) })
      .first();
    const selectable = (await selectableDay.count()) > 0;
    await this.dismissDatepicker();
    return selectable;
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

  /**
   * Open the Reschedule dialog for whichever appointment is listed first,
   * without completing it — for VIEW-only date-rule checks (mirrors
   * openAddDialog()/isAddDateSelectable()). Returns null if no appointment
   * currently offers a Reschedule link, so callers can skip.
   */
  async openRescheduleDialogOnly(): Promise<Locator | null> {
    const link = this.page.locator("a.cal-rs").first();
    if ((await link.count()) === 0) return null;
    await link.click();
    const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-rs-dialog") });
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    return dialog;
  }

  /** Close the Reschedule dialog via its Cancel button (best-effort). */
  async closeRescheduleDialog(dialog: Locator) {
    await dialog.getByRole("button", { name: "Cancel" }).click().catch(() => {});
    await dialog.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }

  /**
   * Whether `dateIso` is selectable in the Reschedule dialog's #ac-rs-date
   * datepicker — the Reschedule flow's own date field, separate from Add
   * Appointment's #ac-add-date (SRD: same no-blackout/no-2-month-limit rules
   * are expected to apply, but this exercises the actual bound field rather
   * than assuming parity). Must be called with the Reschedule dialog already
   * open (does not open/close the dialog itself).
   */
  async isRescheduleDateSelectable(dateIso: string): Promise<boolean> {
    const [y, m, d] = dateIso.split("-").map(Number);
    await this.page.evaluate(() => {
      (window as unknown as { jQuery: any }).jQuery("#ac-rs-date").datepicker("show");
    });
    await this.datepicker.waitFor({ state: "visible", timeout: 5000 });
    await this.datepicker.locator("select.ui-datepicker-month").selectOption(String(m - 1));
    await this.datepicker.locator("select.ui-datepicker-year").selectOption(String(y));
    await this.page.waitForTimeout(200);
    const selectableDay = this.datepicker
      .locator("td:not(.ui-state-disabled):not(.ui-datepicker-other-month) a.ui-state-default")
      .filter({ hasText: new RegExp(`^${d}$`) })
      .first();
    const selectable = (await selectableDay.count()) > 0;
    await this.dismissDatepicker();
    return selectable;
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
      // New Appointment Date via datepicker. Opened programmatically
      // (jQuery datepicker("show")) rather than a plain .click() — verified
      // live that a bare click can silently fail to (re-)open it, especially
      // right after a previous picker was force-closed on the same page
      // (dismissDatepicker's forceful style.display override can leave the
      // shared #ui-datepicker-div singleton in a state where the next
      // focus-triggered auto-show just doesn't fire). isAddDateSelectable/
      // isRescheduleDateSelectable already use this same programmatic show
      // and it's reliable.
      await this.page.evaluate(() => {
        (window as unknown as { jQuery: any }).jQuery("#ac-rs-date").datepicker("show");
      });
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
   * Add Appointment (jQuery UI dialog).
   *
   * Verified live (SIT2): the New Record / Existing Record type radio is
   * GONE — there is no way to add a brand-new record from this dialog
   * anymore. It's now always: Company Name (search) → Reference No.
   * (search) → Appointment Date → Time Slot → Confirm. A reference number is
   * mandatory, so callers must first arrange one (e.g. have UCD run a
   * Biometric Device Purchase and exit before booking, leaving a free
   * unallocated install tied to a fresh reference) rather than assuming this
   * dialog can create a request from scratch.
   *
   * Company search also changed: there's no more results dropdown to click
   * (`.ac_results` no longer exists). Typing the company's EXACT registered
   * name and searching auto-binds it to the hidden #ac-add-cid field; a
   * partial/ambiguous name simply leaves it unbound with no error shown, so
   * always pass the exact name (look-alikes like "FAIZUDDIN AUTO TEST 2"/"3"
   * only matter in that they must NOT be what you typed).
   */
  /**
   * Returns the date actually booked (DD-MM-YYYY, matching the calendar
   * label) on success, or `null` when the add couldn't proceed — the company
   * couldn't be resolved, the reference has no unallocated units ("No
   * allocation remaining"), or the confirm was rejected. Callers use null to
   * SKIP (arrange-else-skip) rather than fail. The chosen date may differ
   * from `appointmentDate` if that day isn't selectable, which is why we
   * report back the date the datepicker actually committed.
   */
  async addAppointment(opts: {
    companyName: string;
    existingRecordRefNo: string;
    slot: BoTimeSlot;
    appointmentDate?: string; // ISO (YYYY-MM-DD); picks that day if selectable this month
  }): Promise<string | null> {
    await this.demoHighlight(this.addAppointmentBtn);
    await this.addAppointmentBtn.click();
    const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-add-dialog") });
    await dialog.waitFor({ state: "visible", timeout: 10000 });
    await this.demoPause();

    // Company search — auto-binds #ac-add-cid on an exact name match; no
    // dropdown to click. If it doesn't bind, the company/precondition is
    // wrong — bail out rather than proceeding with no company selected.
    await test.step(`Search company ${opts.companyName}`, async () => {
      await this.page.locator("#ac-add-name").fill(opts.companyName);
      await this.demoHighlight("#ac-add-name");
      await this.page.locator("#ac-add-search").click();
      await this.page.waitForTimeout(500);
    });
    if (!(await this.page.locator("#ac-add-cid").inputValue())) {
      await this.closeAddDialog(dialog); // company name didn't resolve — precondition unmet
      return null;
    }

    // Reference No. — always required now; key it in and search to bind it.
    await test.step(`Enter reference ${opts.existingRecordRefNo}`, async () => {
      await this.page.locator("#ac-add-refno").fill(opts.existingRecordRefNo);
      await this.demoHighlight("#ac-add-refno");
      await this.page.locator("#ac-add-ref-search").click();
      await this.page.waitForTimeout(500);
    });

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
      // Opened programmatically rather than a plain .click() — see the
      // matching comment in completeRescheduleDialog(); a bare click can
      // silently fail to (re-)open the picker, e.g. on the second
      // addAppointment() call in the same test after the first one's
      // picker was force-closed.
      await this.page.evaluate(() => {
        (window as unknown as { jQuery: any }).jQuery("#ac-add-date").datepicker("show");
      });
      await this.pickDatepickerDay(opts.appointmentDate);
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
