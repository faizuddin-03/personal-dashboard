import { type Page, type Locator, expect } from "@playwright/test";
import { SlotPickerComponent } from "../SlotPickerComponent";
import { PATHS } from "../../utils/config";

/**
 * BO Appointment Calendar page.
 * NOTE: BO selectors are best-guesses from SRD patterns.
 * These MUST be verified against the actual BO portal and updated.
 */
export class AppointmentCalendarPage extends SlotPickerComponent {
  readonly addAppointmentBtn = this.page.getByText("Add Appointment", { exact: false });
  readonly companyNameSelect = this.page.locator('select[name="companyName"], [class*="company"] select').first();
  readonly companyNameInput = this.page.locator('input[name="companyName"], input[placeholder*="Company"]').first();

  readonly markCompletedBtn = this.page.getByText("Completed", { exact: false });
  readonly markFailedBtn = this.page.getByText("Failed", { exact: false });
  readonly markCancelledBtn = this.page.getByText("Cancel", { exact: false });
  readonly rescheduleLink = this.page.getByText("Reschedule", { exact: false });

  readonly failedReasonSelect = this.page.locator('select[name="failedReason"]').first();

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.boAppointmentCalendar);
  }

  async addAppointment(opts: {
    date: string;
    slot: number;
    companyName: string;
    units?: number;
  }) {
    const { date, slot, companyName, units = 1 } = opts;

    await this.openSlotModal(date);

    try {
      await this.companyNameSelect.selectOption({ label: companyName });
    } catch {
      await this.companyNameInput.fill(companyName);
      await this.page.getByText(companyName, { exact: false }).first().click();
    }

    await this.incrementSlot(slot, units);
    await this.saveSlotChanges();
  }

  async rescheduleAppointment(opts: {
    oldDate: string;
    newDate: string;
    slot: number;
    units?: number;
  }) {
    await this.rescheduleLink.click();
    await this.waitForNav();

    const { oldDate, newDate, slot, units = 1 } = opts;
    await this.openSlotModal(oldDate);
    // Remove from whichever slot has the booking
    for (let s = 0; s < 2; s++) {
      const countEl = s === 0 ? this.morningCount : this.afternoonCount;
      const val = Number(await countEl.inputValue()) || 0;
      if (val > 0) await this.removeSlot(s);
    }
    await this.saveSlotChanges();

    await this.openSlotModal(newDate);
    await this.incrementSlot(slot, units);
    await this.saveSlotChanges();

    await this.confirmAppointment();
  }

  async markAppointmentFailed(reason: string) {
    await this.markFailedBtn.click();
    await this.failedReasonSelect.selectOption(reason);
    await this.page.locator(".confirm-dialog-btn").click();
    await this.waitForNav();
  }

  async markAppointmentCancelled() {
    await this.markCancelledBtn.click();
    await this.page.locator(".confirm-dialog-btn").click();
    await this.waitForNav();
  }

  async markAppointmentCompleted() {
    await this.markCompletedBtn.click();
    await this.page.locator(".confirm-dialog-btn").click();
    await this.waitForNav();
  }

  async isRescheduleAvailable(): Promise<boolean> {
    return await this.rescheduleLink.count() > 0;
  }

  async getSlotCapacityIndicator(date: string, slot: number): Promise<string> {
    const cell = this.getDayCell(date);
    const label = slot === 0 ? "Morning" : "Afternoon";
    const indicator = cell.getByText(new RegExp(label, "i")).first();
    return (await indicator.textContent())?.trim() ?? "";
  }
}
