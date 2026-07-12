import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ENV } from "../utils/config";

/**
 * Shared calendar + slot modal component.
 * Used by: Software Installation slot picker, Biometric Purchase scheduling,
 * Reschedule page, and BO Appointment Calendar.
 */
export class SlotPickerComponent extends BasePage {
  // Calendar elements
  readonly calendar = this.page.locator(".si-calendar, .calendar-container, [class*='calendar']").first();
  readonly nextMonthArrow = this.page.locator("text='>>'").or(this.page.locator("[class*='next']")).first();
  readonly prevMonthArrow = this.page.locator("text='<<'").or(this.page.locator("[class*='prev']")).first();
  readonly confirmAppointmentBtn = this.page.getByText("Confirm Appointment", { exact: false });

  // Modal elements
  readonly appointmentModal = this.page.locator("[class*='modal']").filter({ hasText: "Installation Appointment" });
  readonly morningSlot = this.page.getByText("10:00am - 12:00pm", { exact: false });
  readonly afternoonSlot = this.page.getByText("2:00pm - 4:00pm", { exact: false });
  readonly saveChangesBtn = this.page.getByText("Save changes", { exact: false });

  constructor(page: Page) {
    super(page);
  }

  /** Get a day cell by its date string (YYYY-MM-DD) */
  getDayCell(dateStr: string): Locator {
    return this.page.locator(`[data-date="${dateStr}"]`);
  }

  /** Check if a day is bookable (not muted/disabled) */
  async isDayBookable(dateStr: string): Promise<boolean> {
    const cell = this.getDayCell(dateStr);
    const classes = await cell.getAttribute("class") ?? "";
    return !classes.includes("si-muted") && !classes.includes("disabled");
  }

  /** Get the slot badge text for a specific date (e.g. "Slot 2/6") */
  async getSlotBadge(dateStr: string): Promise<string> {
    const cell = this.getDayCell(dateStr);
    const badge = cell.locator("[class*='badge'], [class*='slot']").first();
    return (await badge.textContent()) ?? "";
  }

  /** Get slot count from badge text like "Slot 2/6" → { used: 2, total: 6 } */
  async getSlotCount(dateStr: string): Promise<{ used: number; total: number }> {
    const badge = await this.getSlotBadge(dateStr);
    const match = badge.match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) return { used: 0, total: ENV.slotCapacity.perDay };
    return { used: Number(match[1]), total: Number(match[2]) };
  }

  /** Check if a date shows as "Booked" (orange tag on reschedule page) */
  async isDateBooked(dateStr: string): Promise<boolean> {
    const cell = this.getDayCell(dateStr);
    const text = (await cell.textContent()) ?? "";
    return text.toLowerCase().includes("booked");
  }

  /** Check if a date shows as "Selected" (green tag after allocation) */
  async isDateSelected(dateStr: string): Promise<boolean> {
    const cell = this.getDayCell(dateStr);
    const text = (await cell.textContent()) ?? "";
    return text.toLowerCase().includes("selected");
  }

  /** Click a date to open the slot modal */
  async openSlotModal(dateStr: string) {
    const cell = this.getDayCell(dateStr);
    await cell.click();
    await this.appointmentModal.waitFor({ state: "visible", timeout: 5000 });
  }

  /** Get the "N of 3 booked" count for a specific slot within the open modal */
  async getModalSlotBooked(slotLocator: Locator): Promise<{ booked: number; max: number }> {
    const parent = slotLocator.locator("..").or(slotLocator.locator("xpath=.."));
    const text = (await parent.textContent()) ?? "";
    const match = text.match(/(\d+)\s*of\s*(\d+)\s*booked/i);
    if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
    return { booked: Number(match[1]), max: Number(match[2]) };
  }

  /** Check if a slot shows "Fully booked" in the modal */
  async isSlotFullyBooked(slotLocator: Locator): Promise<boolean> {
    const parent = slotLocator.locator("..").or(slotLocator.locator("xpath=.."));
    const text = (await parent.textContent()) ?? "";
    return text.toLowerCase().includes("fully booked");
  }

  /** Click the "+" button N times for a slot stepper within the modal */
  async incrementSlot(slotLocator: Locator, times: number = 1) {
    const container = slotLocator.locator("..").or(slotLocator.locator("xpath=.."));
    const plusBtn = container.locator("text='+'").or(container.locator("button:has-text('+')")).first();
    for (let i = 0; i < times; i++) {
      await plusBtn.click();
    }
  }

  /** Click the "−" button N times for a slot stepper within the modal */
  async decrementSlot(slotLocator: Locator, times: number = 1) {
    const container = slotLocator.locator("..").or(slotLocator.locator("xpath=.."));
    const minusBtn = container.locator("text='−'").or(container.locator("text='-'")).or(container.locator("button:has-text('−')")).first();
    for (let i = 0; i < times; i++) {
      await minusBtn.click();
    }
  }

  /** Remove a booking from the modal (used on reschedule page) */
  async removeBooking() {
    const removeBtn = this.appointmentModal.locator("text='Remove'").or(
      this.appointmentModal.locator("button:has-text('Remove')")
    ).first();
    await removeBtn.click();
  }

  /** Save changes in the slot modal */
  async saveSlotChanges() {
    await this.saveChangesBtn.click();
    await this.appointmentModal.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }

  /** Get the "Remaining to allocate" count from the calendar footer */
  async getRemainingToAllocate(): Promise<number> {
    const footer = this.page.getByText("Remaining to allocate", { exact: false });
    const text = (await footer.textContent()) ?? "";
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  /** Get "Booked N of N" from the calendar footer */
  async getBookedCount(): Promise<{ booked: number; total: number }> {
    const footer = this.page.getByText(/Booked \d+ of \d+/i);
    const text = (await footer.textContent()) ?? "";
    const match = text.match(/Booked\s+(\d+)\s+of\s+(\d+)/i);
    if (!match) return { booked: 0, total: 0 };
    return { booked: Number(match[1]), total: Number(match[2]) };
  }

  /** Scroll to and click "Confirm Appointment" */
  async confirmAppointment() {
    await this.confirmAppointmentBtn.scrollIntoViewIfNeeded();
    await this.confirmAppointmentBtn.click();
    await this.waitForNav();
  }

  /** Navigate calendar to a specific month by clicking next/prev arrows */
  async navigateToMonth(targetYear: number, targetMonth: number) {
    // Read current month from calendar header — format varies, try common patterns
    const maxAttempts = 12;
    for (let i = 0; i < maxAttempts; i++) {
      const header = await this.page.locator("[class*='month'], [class*='header']").first().textContent() ?? "";
      const currentDate = new Date(header);
      if (!isNaN(currentDate.getTime())) {
        if (currentDate.getFullYear() === targetYear && currentDate.getMonth() + 1 === targetMonth) break;
        if (currentDate < new Date(targetYear, targetMonth - 1)) {
          await this.nextMonthArrow.click();
        } else {
          await this.prevMonthArrow.click();
        }
      } else {
        await this.nextMonthArrow.click();
      }
      await this.page.waitForTimeout(500);
    }
  }
}
