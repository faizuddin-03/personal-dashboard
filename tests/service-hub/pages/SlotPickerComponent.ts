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

  // Footer — confirmed from real HTML: <div class="si-tally">Booked
  // <span id="si-alloc-count">1</span> of <span id="si-alloc-total">1</span></div>
  readonly allocCount = this.page.locator("#si-alloc-count");
  readonly allocTotal = this.page.locator("#si-alloc-total");

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

  /**
   * The calendar only renders the currently-displayed month's cells.
   * A fresh page load always starts back on the current month, so a date
   * found in a later month (after paging forward) won't exist in the DOM
   * until we page forward to it again. Call this before touching any
   * specific date.
   */
  async ensureMonthVisible(dateStr: string, maxMonthsAhead: number = 6): Promise<void> {
    for (let m = 0; m <= maxMonthsAhead; m++) {
      if ((await this.getDayCell(dateStr).count()) > 0) return;
      if (!(await this.goNextMonth())) return;
    }
  }

  async isDayBookable(dateStr: string): Promise<boolean> {
    await this.ensureMonthVisible(dateStr);
    const cell = this.getDayCell(dateStr);
    const classes = await cell.getAttribute("class") ?? "";
    return classes.includes("si-book") && !classes.includes("si-muted");
  }

  async isDayFullyBooked(dateStr: string): Promise<boolean> {
    await this.ensureMonthVisible(dateStr);
    const cell = this.getDayCell(dateStr);
    const classes = await cell.getAttribute("class") ?? "";
    return classes.includes("si-fullday");
  }

  /** Returns "" if the date has no badge at all (e.g. weekends/out-of-range days) */
  async getSlotBadge(dateStr: string): Promise<string> {
    await this.ensureMonthVisible(dateStr);
    const cell = this.getDayCell(dateStr);
    const badge = cell.locator(".si-badge").first();
    if ((await badge.count()) === 0) return "";
    return (await badge.textContent().catch(() => "")) ?? "";
  }

  async getSlotCount(dateStr: string): Promise<{ used: number; total: number }> {
    const badge = await this.getSlotBadge(dateStr);
    const match = badge.match(/Slot\s+(\d+)\s*\/\s*(\d+)/);
    if (!match) return { used: 0, total: ENV.slotCapacity.perDay };
    return { used: Number(match[1]), total: Number(match[2]) };
  }

  async isDateBooked(dateStr: string): Promise<boolean> {
    await this.ensureMonthVisible(dateStr);
    const cell = this.getDayCell(dateStr);
    return await cell.locator(".si-bookbadge").count() > 0;
  }

  async isDateSelected(dateStr: string): Promise<boolean> {
    await this.ensureMonthVisible(dateStr);
    const cell = this.getDayCell(dateStr);
    return await cell.locator(".si-selbadge").count() > 0;
  }

  /** All bookable dates on the currently-visible calendar month (td.si-book) */
  async findBookableDates(): Promise<string[]> {
    const cells = await this.page.locator("td.si-book[data-date]").all();
    const dates: string[] = [];
    for (const cell of cells) {
      const date = await cell.getAttribute("data-date");
      if (date) dates.push(date);
    }
    return dates;
  }

  /**
   * First bookable date with zero units booked (clean slate for capacity
   * tests). Repeated test runs consume the pool of empty dates in the
   * current month, so this pages forward through future months until it
   * finds one, up to maxMonthsAhead.
   */
  async findEmptyBookableDate(maxMonthsAhead: number = 6): Promise<string | null> {
    for (let m = 0; m <= maxMonthsAhead; m++) {
      for (const date of await this.findBookableDates()) {
        const { used } = await this.getSlotCount(date);
        if (used === 0) return date;
      }
      if (m >= maxMonthsAhead) break;
      if (!(await this.goNextMonth())) break;
    }
    return null;
  }

  /**
   * First bookable date regardless of existing bookings. Use this (plus
   * per-slot/per-day room checks) instead of findEmptyBookableDate() once
   * the shared staging calendar no longer has any completely untouched
   * dates left in the navigable window.
   */
  async findAnyBookableDate(maxMonthsAhead: number = 6): Promise<string | null> {
    for (let m = 0; m <= maxMonthsAhead; m++) {
      const dates = await this.findBookableDates();
      if (dates.length > 0) return dates[0];
      if (m >= maxMonthsAhead) break;
      if (!(await this.goNextMonth())) break;
    }
    return null;
  }

  /** First bookable date whose combined day capacity (both slots) has at least minRoom free */
  async findDateWithRoom(minRoom: number, maxMonthsAhead: number = 6): Promise<string | null> {
    for (let m = 0; m <= maxMonthsAhead; m++) {
      for (const date of await this.findBookableDates()) {
        const { used, total } = await this.getSlotCount(date);
        if (total - used >= minRoom) return date;
      }
      if (m >= maxMonthsAhead) break;
      if (!(await this.goNextMonth())) break;
    }
    return null;
  }

  /**
   * First bookable date where a SPECIFIC slot (morning or afternoon) has
   * at least minRoom free. A date can be generally "bookable" while one
   * particular slot is already at capacity, so this opens each candidate's
   * modal to check that slot directly rather than relying on the day
   * badge (which only reflects combined capacity across both slots).
   */
  async findDateWithSlotRoom(slotIndex: number, minRoom: number, maxMonthsAhead: number = 6): Promise<string | null> {
    for (let m = 0; m <= maxMonthsAhead; m++) {
      for (const date of await this.findBookableDates()) {
        await this.openSlotModal(date);
        const { booked, max } = await this.getModalSlotBooked(slotIndex);
        await this.closeSlotModal();
        await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
        if (max - booked >= minRoom) return date;
      }
      if (m >= maxMonthsAhead) break;
      if (!(await this.goNextMonth())) break;
    }
    return null;
  }

  /**
   * Allocates `count` units into a date's morning slot first, overflowing
   * into afternoon if morning doesn't have enough room, and saves.
   * Returns the number actually allocated (may be less than requested if
   * the date doesn't have enough combined room across both slots).
   */
  async allocateUnitsAcrossSlots(dateStr: string, count: number): Promise<number> {
    await this.openSlotModal(dateStr);
    let remaining = count;
    for (const slot of [0, 1]) {
      if (remaining <= 0) break;
      const { booked, max } = await this.getModalSlotBooked(slot);
      const room = max - booked;
      const take = Math.min(room, remaining);
      if (take > 0) {
        await this.incrementSlot(slot, take);
        remaining -= take;
      }
    }
    await this.saveSlotChanges();
    return count - remaining;
  }

  /**
   * Click a date cell to open the slot dialog. Defensively closes any
   * modal left open by a previous action first — its full-page overlay
   * physically blocks clicks on the calendar underneath, which otherwise
   * surfaces as a confusing "element intercepts pointer events" timeout
   * (and can just as easily swallow a goNextMonth() click, making month
   * navigation silently fail).
   */
  async openSlotModal(dateStr: string) {
    if (await this.modalOverlay.isVisible().catch(() => false)) {
      await this.closeSlotModal();
      await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    }
    await this.ensureMonthVisible(dateStr);
    const cell = this.getDayCell(dateStr);
    const classes = (await cell.getAttribute("class")) ?? "";
    if (!classes.includes("si-book") || classes.includes("si-muted")) {
      throw new Error(
        `Date ${dateStr} is not bookable (class="${classes}") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.`
      );
    }
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

  /** Total units to allocate for this transaction (#si-alloc-total) */
  async getAllocationTotal(): Promise<number> {
    const text = (await this.allocTotal.textContent()) ?? "0";
    return Number(text) || 0;
  }

  /** Units allocated so far across all picked dates (#si-alloc-count) */
  async getAllocatedCount(): Promise<number> {
    const text = (await this.allocCount.textContent()) ?? "0";
    return Number(text) || 0;
  }

  async getRemainingToAllocate(): Promise<number> {
    const total = await this.getAllocationTotal();
    const allocated = await this.getAllocatedCount();
    return Math.max(0, total - allocated);
  }

  /**
   * Click "Confirm Appointment" / "Confirm booking" via siConfirmBooking().
   * siConfirmBooking() fires an async request before redirecting to
   * submitted.do — waiting on networkidle alone can return before that
   * request even starts, letting the next action interrupt it mid-flight.
   * Wait for the redirect explicitly first; if confirmation is blocked
   * (e.g. mandatory booking not satisfied) there's no redirect, so fall
   * through to the networkidle wait instead.
   */
  async confirmAppointment() {
    await this.page.evaluate(() => (window as any).siConfirmBooking());
    await this.page.waitForURL(/submitted\.do\?txnId=/, { timeout: 15000 }).catch(() => {});
    await this.waitForNav();
  }

  /**
   * Navigate calendar to next month. The arrow is kept in the DOM but set
   * to `visibility: hidden` (not removed/disabled) once the booking
   * window's forward limit is reached — clicking it then would hang
   * waiting for "visible". Returns false instead of clicking in that case
   * so callers know to stop paging forward.
   */
  async goNextMonth(): Promise<boolean> {
    // A stray open modal's overlay covers the whole page and would
    // silently swallow this click too.
    if (await this.modalOverlay.isVisible().catch(() => false)) {
      await this.closeSlotModal();
      await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    }
    const style = (await this.nextMonthArrow.getAttribute("style")) ?? "";
    if (style.includes("hidden")) return false;
    await this.nextMonthArrow.click();
    await this.page.waitForTimeout(300);
    return true;
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
