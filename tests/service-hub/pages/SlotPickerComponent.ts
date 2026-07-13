import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ENV } from "../utils/config";

/**
 * Shared calendar + slot modal component (si-calendar grid).
 * Selectors derived from the actual eAuto slot.do / reschedule.do HTML+JS.
 */
export class SlotPickerComponent extends BasePage {
  // Calendar grid
  readonly calendar = this.page.locator("#si-grid");
  readonly monthHeader = this.page.locator("#si-mo");
  readonly nextMonthArrow = this.page.locator("#si-next");
  readonly prevMonthArrow = this.page.locator("#si-prev");

  // Modal overlay
  readonly modalOverlay = this.page.locator("#si-ovl");

  // Slot steppers inside modal — si-cnt0 = morning, si-cnt1 = afternoon
  readonly morningCount = this.page.locator("#si-cnt0");
  readonly afternoonCount = this.page.locator("#si-cnt1");
  readonly morningCapacity = this.page.locator("#si-cap0");
  readonly afternoonCapacity = this.page.locator("#si-cap1");
  readonly morningRemoveBtn = this.page.locator("#si-rowx0");
  readonly afternoonRemoveBtn = this.page.locator("#si-rowx1");

  // Footer
  readonly allocCount = this.page.locator("#si-alloc-count");
  readonly remainingCount = this.page.locator("#si-remain-n");

  // Confirm button — used after all slots are allocated
  readonly confirmBookingBtn = this.page.locator("button:has-text('Confirm'), .si-abtn:has-text('Confirm')").first();

  // Unavailable popup
  readonly unavailOverlay = this.page.locator("#si-uovl");

  constructor(page: Page) {
    super(page);
  }

  getDayCell(dateStr: string): Locator {
    return this.page.locator(`td[data-date="${dateStr}"]`);
  }

  async isDayBookable(dateStr: string): Promise<boolean> {
    const cell = this.getDayCell(dateStr);
    const classes = await cell.getAttribute("class") ?? "";
    return classes.includes("si-book") && !classes.includes("si-muted");
  }

  async isDayFullyBooked(dateStr: string): Promise<boolean> {
    const cell = this.getDayCell(dateStr);
    const classes = await cell.getAttribute("class") ?? "";
    return classes.includes("si-fullday");
  }

  async getSlotBadge(dateStr: string): Promise<string> {
    const cell = this.getDayCell(dateStr);
    const badge = cell.locator(".si-badge").first();
    return (await badge.textContent()) ?? "";
  }

  async getSlotCount(dateStr: string): Promise<{ used: number; total: number }> {
    const badge = await this.getSlotBadge(dateStr);
    const match = badge.match(/Slot\s+(\d+)\s*\/\s*(\d+)/);
    if (!match) return { used: 0, total: ENV.slotCapacity.perDay };
    return { used: Number(match[1]), total: Number(match[2]) };
  }

  async isDateBooked(dateStr: string): Promise<boolean> {
    const cell = this.getDayCell(dateStr);
    return await cell.locator(".si-bookbadge").count() > 0;
  }

  async isDateSelected(dateStr: string): Promise<boolean> {
    const cell = this.getDayCell(dateStr);
    return await cell.locator(".si-selbadge").count() > 0;
  }

  /** Click a date cell to open the slot dialog */
  async openSlotModal(dateStr: string) {
    const cell = this.getDayCell(dateStr);
    await cell.click();
    await this.modalOverlay.waitFor({ state: "visible", timeout: 5000 });
  }

  /** Get booked count for a slot from the modal capacity text (e.g. "2 of 3 booked") */
  async getModalSlotBooked(slotIndex: number): Promise<{ booked: number; max: number }> {
    const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
    const text = (await capEl.textContent()) ?? "";
    if (text.toLowerCase().includes("fully booked")) return { booked: ENV.slotCapacity.perSlot, max: ENV.slotCapacity.perSlot };
    const match = text.match(/(\d+)\s*of\s*(\d+)/);
    if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
    return { booked: Number(match[1]), max: Number(match[2]) };
  }

  async isSlotFullyBooked(slotIndex: number): Promise<boolean> {
    const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
    const text = (await capEl.textContent()) ?? "";
    return text.toLowerCase().includes("fully booked");
  }

  /** Increment a slot's stepper via the JS function siStep(slot, +1) */
  async incrementSlot(slotIndex: number, times: number = 1) {
    for (let i = 0; i < times; i++) {
      await this.page.evaluate((s) => (window as any).siStep(s, 1), slotIndex);
    }
  }

  /** Decrement a slot's stepper via the JS function siStep(slot, -1) */
  async decrementSlot(slotIndex: number, times: number = 1) {
    for (let i = 0; i < times; i++) {
      await this.page.evaluate((s) => (window as any).siStep(s, -1), slotIndex);
    }
  }

  /** Remove all units from a slot via the JS function siRowRemove(slot) */
  async removeSlot(slotIndex: number) {
    await this.page.evaluate((s) => (window as any).siRowRemove(s), slotIndex);
  }

  /** Save changes in the slot dialog via siSaveDate() */
  async saveSlotChanges() {
    await this.page.evaluate(() => (window as any).siSaveDate());
    await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }

  /** Close the slot dialog without saving */
  async closeSlotModal() {
    await this.page.evaluate(() => (window as any).siCloseModal());
  }

  async getRemainingToAllocate(): Promise<number> {
    const text = (await this.remainingCount.textContent()) ?? "0";
    return Number(text) || 0;
  }

  async getAllocatedCount(): Promise<number> {
    const text = (await this.allocCount.textContent()) ?? "0";
    return Number(text) || 0;
  }

  /** Click "Confirm Appointment" / "Confirm booking" via siConfirmBooking() */
  async confirmAppointment() {
    await this.page.evaluate(() => (window as any).siConfirmBooking());
    await this.waitForNav();
  }

  /** Navigate calendar to next/prev month */
  async goNextMonth() {
    await this.nextMonthArrow.click();
    await this.page.waitForTimeout(300);
  }

  async goPrevMonth() {
    await this.prevMonthArrow.click();
    await this.page.waitForTimeout(300);
  }

  /** Get current month/year from the calendar header */
  async getCurrentMonth(): Promise<string> {
    return (await this.monthHeader.textContent()) ?? "";
  }

  /** Close the "Slot Unavailable" popup */
  async closeUnavailPopup() {
    await this.page.evaluate(() => (window as any).siCloseUnavail());
  }
}
