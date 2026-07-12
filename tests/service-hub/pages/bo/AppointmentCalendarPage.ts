import { type Page, type Locator, expect } from "@playwright/test";
import { SlotPickerComponent } from "../SlotPickerComponent";
import { PATHS } from "../../utils/config";

/**
 * BO Appointment Calendar page.
 * NOTE: Selectors are based on expected BO UI patterns from the SRD.
 * These MUST be verified against the actual BO portal and updated.
 */
export class AppointmentCalendarPage extends SlotPickerComponent {
  // BO-specific elements — selectors TBD after BO portal exploration
  readonly addAppointmentBtn = this.page.getByText("Add Appointment", { exact: false });
  readonly companyNameSelect = this.page.locator('select[name="companyName"], [class*="company"] select').first();
  readonly companyNameInput = this.page.locator('input[name="companyName"], input[placeholder*="Company"]').first();

  // Status action buttons
  readonly markCompletedBtn = this.page.getByText("Completed", { exact: false });
  readonly markFailedBtn = this.page.getByText("Failed", { exact: false });
  readonly markCancelledBtn = this.page.getByText("Cancel", { exact: false });
  readonly rescheduleLink = this.page.getByText("Reschedule", { exact: false });

  // Failed reason dialog
  readonly failedReasonSelect = this.page.locator('select[name="failedReason"]').first();
  readonly failedReasonReappointment = this.page.locator('option[value="Reappointment"]');

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.boAppointmentCalendar);
  }

  /** Add an appointment for a company on a specific date and slot */
  async addAppointment(opts: {
    date: string;
    slot: "morning" | "afternoon";
    companyName: string;
    units?: number;
  }) {
    const { date, slot, companyName, units = 1 } = opts;

    await this.openSlotModal(date);

    // Select company — try select dropdown first, fallback to input
    try {
      await this.companyNameSelect.selectOption({ label: companyName });
    } catch {
      await this.companyNameInput.fill(companyName);
      // May need to select from autocomplete
      await this.page.getByText(companyName, { exact: false }).first().click();
    }

    const slotLocator = slot === "morning" ? this.morningSlot : this.afternoonSlot;
    await this.incrementSlot(slotLocator, units);
    await this.saveSlotChanges();
  }

  /** BO reschedule — no date restriction, no capacity limit */
  async rescheduleAppointment(opts: {
    oldDate: string;
    newDate: string;
    slot: "morning" | "afternoon";
    units?: number;
  }) {
    // BO uses the reschedule link on the appointment entry
    await this.rescheduleLink.click();
    await this.waitForNav();

    // Reuse the same remove → allocate → confirm flow
    const { oldDate, newDate, slot, units = 1 } = opts;
    await this.openSlotModal(oldDate);
    await this.removeBooking();
    await this.saveSlotChanges();

    await this.openSlotModal(newDate);
    const slotLocator = slot === "morning" ? this.morningSlot : this.afternoonSlot;
    await this.incrementSlot(slotLocator, units);
    await this.saveSlotChanges();

    await this.confirmAppointment();
  }

  /** Mark an appointment as Failed with a reason */
  async markAppointmentFailed(reason: "Reappointment" | "Laptop Issue" | "Other") {
    await this.markFailedBtn.click();
    await this.failedReasonSelect.selectOption(reason);
    await this.page.getByText("Confirm", { exact: false }).click();
    await this.waitForNav();
  }

  /** Mark an appointment as Cancelled */
  async markAppointmentCancelled() {
    await this.markCancelledBtn.click();
    await this.page.getByText("Confirm", { exact: false }).click();
    await this.waitForNav();
  }

  /** Mark an appointment as Completed */
  async markAppointmentCompleted() {
    await this.markCompletedBtn.click();
    await this.page.getByText("Confirm", { exact: false }).click();
    await this.waitForNav();
  }

  /** Check if reschedule link is available for the current appointment */
  async isRescheduleAvailable(): Promise<boolean> {
    return await this.rescheduleLink.count() > 0;
  }

  /** Get the capacity indicator text for a slot (e.g. "Morning - 2", "Afternoon - 3 (Full)") */
  async getSlotCapacityIndicator(date: string, slot: "morning" | "afternoon"): Promise<string> {
    const cell = this.getDayCell(date);
    const label = slot === "morning" ? "Morning" : "Afternoon";
    const indicator = cell.getByText(new RegExp(label, "i")).first();
    return (await indicator.textContent())?.trim() ?? "";
  }
}
