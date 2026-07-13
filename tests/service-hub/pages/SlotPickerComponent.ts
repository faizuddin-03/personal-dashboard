import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ENV } from "../utils/config";

/**
 * Shared calendar + slot modal component.
 * Used by: Software Installation slot picker, Biometric Purchase scheduling,
 * Reschedule page, and BO Appointment Calendar.
 *
 * NOTE: Calendar/modal selectors below are best-guesses based on the site's
 * naming conventions (si- prefix pattern). Verify with actual page HTML and
 * update as needed — run in headed mode and inspect if tests fail here.
 */
export class SlotPickerComponent extends BasePage {
  // Calendar elements — try multiple selector strategies
  readonly calendar = this.page.locator(".si-calendar, .calendar, [class*='calendar']").first();
  readonly nextMonthArrow = this.page.locator(".si-cal-next, .cal-next, [class*='next']").first();
  readonly prevMonthArrow = this.page.locator(".si-cal-prev, .cal-prev, [class*='prev']").first();
  readonly confirmAppointmentBtn = this.page.locator("button:has-text('Confirm'), .si-abtn:has-text('Confirm')");

  // Modal elements
  readonly appointmentModal = this.page.locator(".modal, .si-modal, [class*='modal']").filter({ hasText: /appointment|slot|installation/i });
  readonly morningSlot = this.page.locator("text=10:00").or(this.page.getByText("10:00am - 12:00pm", { exact: false })).first();
  readonly afternoonSlot = this.page.locator("text=2:00").or(this.page.getByText("2:00pm - 4:00pm", { exact: false })).first();
  readonly saveChangesBtn = this.page.locator("button:has-text('Save'), .si-abtn:has-text('Save')").first();

  constructor(page: Page) {
    super(page);
  }

  getDayCell(dateStr: string): Locator {
    return this.page.locator(`[data-date="${dateStr}"], td[data-date="${dateStr}"]`);
  }

  async isDayBookable(dateStr: string): Promise<boolean> {
    const cell = this.getDayCell(dateStr);
    const classes = await cell.getAttribute("class") ?? "";
    return !classes.includes("muted") && !classes.includes("disabled") && !classes.includes("past");
  }

  async getSlotBadge(dateStr: string): Promise<string> {
    const cell = this.getDayCell(dateStr);
    const badge = cell.locator("[class*='badge'], [class*='slot'], small, span").first();
    return (await badge.textContent()) ?? "";
  }

  async getSlotCount(dateStr: string): Promise<{ used: number; total: number }> {
    const badge = await this.getSlotBadge(dateStr);
    const match = badge.match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) return { used: 0, total: ENV.slotCapacity.perDay };
    return { used: Number(match[1]), total: Number(match[2]) };
  }

  async isDateBooked(dateStr: string): Promise<boolean> {
    const cell = this.getDayCell(dateStr);
    const text = (await cell.textContent()) ?? "";
    const classes = await cell.getAttribute("class") ?? "";
    return text.toLowerCase().includes("booked") || classes.includes("booked");
  }

  async isDateSelected(dateStr: string): Promise<boolean> {
    const cell = this.getDayCell(dateStr);
    const text = (await cell.textContent()) ?? "";
    const classes = await cell.getAttribute("class") ?? "";
    return text.toLowerCase().includes("selected") || classes.includes("selected");
  }

  async openSlotModal(dateStr: string) {
    const cell = this.getDayCell(dateStr);
    await cell.click();
    // Wait for any modal to appear
    await this.page.locator(".modal, .si-modal, [class*='modal']").first().waitFor({ state: "visible", timeout: 5000 });
  }

  async getModalSlotBooked(slotLocator: Locator): Promise<{ booked: number; max: number }> {
    const parent = slotLocator.locator("xpath=ancestor::*[position()<=3]");
    const text = (await parent.textContent()) ?? "";
    const match = text.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i);
    if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
    return { booked: Number(match[1]), max: Number(match[2]) };
  }

  async isSlotFullyBooked(slotLocator: Locator): Promise<boolean> {
    const parent = slotLocator.locator("xpath=ancestor::*[position()<=3]");
    const text = (await parent.textContent()) ?? "";
    return text.toLowerCase().includes("full");
  }

  async incrementSlot(slotLocator: Locator, times: number = 1) {
    const container = slotLocator.locator("xpath=ancestor::div[1]");
    const plusBtn = container.locator("button:has-text('+')").first();
    for (let i = 0; i < times; i++) {
      await plusBtn.click();
    }
  }

  async decrementSlot(slotLocator: Locator, times: number = 1) {
    const container = slotLocator.locator("xpath=ancestor::div[1]");
    const minusBtn = container.locator("button:has-text('−'), button:has-text('-')").first();
    for (let i = 0; i < times; i++) {
      await minusBtn.click();
    }
  }

  async removeBooking() {
    const removeBtn = this.page.locator("button:has-text('Remove'), .si-abtn:has-text('Remove'), a:has-text('Remove')").first();
    await removeBtn.click();
  }

  async saveSlotChanges() {
    await this.saveChangesBtn.click();
    await this.page.locator(".modal, .si-modal, [class*='modal']").first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }

  async getRemainingToAllocate(): Promise<number> {
    const footer = this.page.getByText(/remaining/i).first();
    const text = (await footer.textContent()) ?? "";
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  async getBookedCount(): Promise<{ booked: number; total: number }> {
    const footer = this.page.getByText(/booked/i).first();
    const text = (await footer.textContent()) ?? "";
    const match = text.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i);
    if (!match) return { booked: 0, total: 0 };
    return { booked: Number(match[1]), total: Number(match[2]) };
  }

  async confirmAppointment() {
    await this.confirmAppointmentBtn.scrollIntoViewIfNeeded();
    await this.confirmAppointmentBtn.click();
    await this.waitForNav();
  }

  async navigateToMonth(targetYear: number, targetMonth: number) {
    const maxAttempts = 12;
    for (let i = 0; i < maxAttempts; i++) {
      const header = await this.calendar.locator("th, [class*='month'], [class*='header']").first().textContent() ?? "";
      const currentDate = new Date(header.trim());
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
