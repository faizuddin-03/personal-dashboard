import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "../BasePage";
import { PATHS } from "../../utils/config";

export type BoTimeSlot = 0 | 1; // 0 = 10am–12pm, 1 = 2pm–4pm

/**
 * eAuto Back Office Portal > Appointment Calendar (SRD 2.3.2.7).
 *
 * This is a DIFFERENT UI from the UCD slot picker: appointments are listed
 * per date/slot as a numbered list of company names, with a per-slot
 * capacity counter ("Morning - 3", "Afternoon - 3 (Full)"), and actions
 * happen through dedicated dialogs (Add Appointment, Reschedule
 * Appointment) rather than the si-* stepper modal.
 *
 * NOTE: BO selectors are inferred from the SRD structure and must be
 * verified against the actual BO portal HTML, then tightened.
 */
export class AppointmentCalendarPage extends BasePage {
  // 1. Month filter row
  readonly backBtn = this.page.getByText("Back", { exact: false }).first();
  readonly monthSelect = this.page.locator('select[name="appointmentMonth"], select[name="month"]').first();
  readonly searchBtn = this.page.getByText("Search", { exact: false }).first();
  readonly addAppointmentBtn = this.page.getByText("Add Appointment", { exact: false }).first();

  // Time-slot radio labels (used inside both dialogs)
  private readonly slotLabels = ["10:00am", "2:00pm"] as const;

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.boAppointmentCalendar);
  }

  /** Select the calendar month, e.g. "Jun 2026", then Search. */
  async selectMonth(monthLabel: string) {
    await this.monthSelect.selectOption({ label: monthLabel });
    await this.searchBtn.click();
    await this.waitForNav();
  }

  /** The cell for a given date (data-date="YYYY-MM-DD"). */
  getDayCell(dateStr: string): Locator {
    return this.page.locator(`[data-date="${dateStr}"]`);
  }

  /**
   * The per-slot capacity counter text for a date, e.g. "Morning - 3" or
   * "Afternoon - 3 (Full)". Returns "" if the date/slot has no counter.
   */
  async getSlotCapacityText(dateStr: string, slot: BoTimeSlot): Promise<string> {
    const label = slot === 0 ? /Morning/i : /Afternoon/i;
    const cell = this.getDayCell(dateStr);
    const counter = cell.getByText(label).first();
    if ((await counter.count()) === 0) return "";
    return (await counter.textContent())?.trim() ?? "";
  }

  /** Numeric booked count for a date/slot parsed from the capacity text. */
  async getSlotCount(dateStr: string, slot: BoTimeSlot): Promise<number> {
    const text = await this.getSlotCapacityText(dateStr, slot);
    const match = text.match(/-\s*(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  /** SRD: "(Full)" (shown in red) once a slot reaches the 6/day UCD cap. */
  async isSlotFull(dateStr: string, slot: BoTimeSlot): Promise<boolean> {
    const text = await this.getSlotCapacityText(dateStr, slot);
    return /\(Full\)/i.test(text);
  }

  /** Whether a date lists any confirmed appointment (i.e. not "-"). */
  async hasAppointments(dateStr: string): Promise<boolean> {
    const cell = this.getDayCell(dateStr);
    const links = cell.getByText("Reschedule", { exact: false });
    return (await links.count()) > 0;
  }

  /**
   * SRD 2.3.2.7 #4 — Add Appointment dialog.
   * Default appointment type is "New Record"; for an existing record pass
   * referenceNo (which reveals + fills the Reference No field).
   */
  async addAppointment(opts: {
    companyName: string;
    appointmentDate: string; // matches an option in the date dropdown
    slot: BoTimeSlot;
    existingRecordRefNo?: string;
  }) {
    await this.addAppointmentBtn.click();
    await this.waitForDialog();
    const dialog = this.page.locator(".ui-dialog").last();

    if (opts.existingRecordRefNo) {
      await dialog.getByText("Existing Record", { exact: false }).first().click();
      await dialog.locator('input[name="referenceNo"]').first().fill(opts.existingRecordRefNo);
      await dialog.getByText("Search", { exact: false }).first().click();
    } else {
      await dialog.getByText("New Record", { exact: false }).first().click();
    }

    await dialog.locator('input[name="companyName"]').first().fill(opts.companyName);
    await dialog.getByText("Search", { exact: false }).first().click();

    await dialog
      .locator('select[name="appointmentDate"]')
      .first()
      .selectOption({ label: opts.appointmentDate });

    await this.selectSlotRadio(dialog, opts.slot);

    await dialog.getByText("Confirm", { exact: false }).first().click();
    await this.waitForNav();
  }

  /**
   * SRD 2.3.2.7 #3 — Reschedule Appointment dialog. Finds the listed
   * appointment by company name, opens its Reschedule dialog, and sets a
   * new date + time slot. All the identity fields in the dialog are
   * read-only per the SRD, so we only fill New Appointment Date + Time Slot.
   */
  async rescheduleAppointment(opts: {
    companyName: string;
    newDate: string;
    slot: BoTimeSlot;
  }) {
    const row = this.page.locator("tr, li", { hasText: opts.companyName }).first();
    await row.getByText("Reschedule", { exact: false }).first().click();
    await this.waitForDialog();
    const dialog = this.page.locator(".ui-dialog").last();

    await dialog.locator('input[name="newAppointmentDate"], input[type="date"]').first().fill(opts.newDate);
    await this.selectSlotRadio(dialog, opts.slot);

    await dialog.getByText("Confirm", { exact: false }).first().click();
    await this.waitForNav();
  }

  /**
   * Reschedule whichever appointment is listed first (no company lookup).
   * Useful when the caller just needs "any reschedulable appointment".
   */
  async rescheduleFirstListed(opts: { newDate: string; slot: BoTimeSlot }) {
    await this.page.getByText("Reschedule", { exact: false }).first().click();
    await this.waitForDialog();
    const dialog = this.page.locator(".ui-dialog").last();
    await dialog.locator('input[name="newAppointmentDate"], input[type="date"]').first().fill(opts.newDate);
    await this.selectSlotRadio(dialog, opts.slot);
    await dialog.getByText("Confirm", { exact: false }).first().click();
    await this.waitForNav();
  }

  /** Whether any appointment on the page still offers a Reschedule link. */
  async isRescheduleAvailable(): Promise<boolean> {
    return (await this.page.getByText("Reschedule", { exact: false }).count()) > 0;
  }

  private async selectSlotRadio(dialog: Locator, slot: BoTimeSlot) {
    await dialog.getByText(this.slotLabels[slot], { exact: false }).first().click();
  }
}
