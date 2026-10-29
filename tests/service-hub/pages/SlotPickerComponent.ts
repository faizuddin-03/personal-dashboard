import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ENV } from "../utils/config";

/**
 * A single bookable date's capacity snapshot, at both the day level
 * (combined 6/day badge) and the per-session level (morning/afternoon,
 * read from the slot modal). `room` is the free capacity (max - booked).
 * Consumed by findDateMatching() so scenarios can express date conditions
 * declaratively.
 */
export interface DateSlotInfo {
  date: string; // ISO yyyy-mm-dd (the cell's data-date)
  dayUsed: number;
  dayTotal: number;
  dayRoom: number;
  morning: { booked: number; max: number; room: number };
  afternoon: { booked: number; max: number; room: number };
}

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
  async ensureMonthVisible(dateStr: string, maxMonthsAhead: number = ENV.calendar.searchMonthsAhead): Promise<void> {
    for (let m = 0; m <= maxMonthsAhead; m++) {
      if ((await this.getDayCell(dateStr).count()) > 0) return;
      // Was missing this guard (present in every other finder in this file):
      // without it, the loop still calls goNextMonth() on its LAST allowed
      // iteration, attempting one click past the app's real limit (the SRD
      // calendar only ever shows the current + next month — no 3rd month
      // ever exists to page into). That extra click is what hung on #si-next.
      if (m >= maxMonthsAhead) break;
      if (!(await this.goNextMonth())) return;
    }
  }

  async isDayBookable(dateStr: string): Promise<boolean> {
    await this.ensureMonthVisible(dateStr);
    const cell = this.getDayCell(dateStr);
    // A date beyond the calendar's navigable window (e.g. >2 months out)
    // never renders a cell at all — getAttribute() on a zero-match locator
    // doesn't return null, it waits/retries until timeout. A non-rendered
    // date is definitionally not bookable, so short-circuit here.
    if ((await cell.count()) === 0) return false;
    const classes = await cell.getAttribute("class") ?? "";
    return classes.includes("si-book") && !classes.includes("si-muted");
  }

  async isDayFullyBooked(dateStr: string): Promise<boolean> {
    await this.ensureMonthVisible(dateStr);
    const cell = this.getDayCell(dateStr);
    if ((await cell.count()) === 0) return false;
    const classes = await cell.getAttribute("class") ?? "";
    return classes.includes("si-fullday");
  }

  /**
   * A date is "blocked" for the UCD portal when it is NOT selectable — either
   * greyed out (si-muted) or not rendered on the calendar at all (e.g. beyond
   * the current+next-month window). The inverse of isDayBookable().
   */
  async isDayBlocked(dateStr: string): Promise<boolean> {
    return !(await this.isDayBookable(dateStr));
  }

  /** Whether the date cell is rendered at all in the (navigable) calendar. */
  async isDayRendered(dateStr: string): Promise<boolean> {
    await this.ensureMonthVisible(dateStr);
    return (await this.getDayCell(dateStr).count()) > 0;
  }

  /** Whether the date shows a slot-availability badge ("N Available" / "Full"). */
  async hasSlotBadge(dateStr: string): Promise<boolean> {
    return (await this.getSlotBadge(dateStr)).trim().length > 0;
  }

  /** Returns "" if the date has no badge at all (e.g. weekends/out-of-range days) */
  async getSlotBadge(dateStr: string): Promise<string> {
    await this.ensureMonthVisible(dateStr);
    const cell = this.getDayCell(dateStr);
    const badge = cell.locator(".si-badge").first();
    if ((await badge.count()) === 0) return "";
    return (await badge.textContent().catch(() => "")) ?? "";
  }

  /**
   * The day badge reads "N Available" (bookable, room remaining) or "Full"
   * (td.si-fullday) — verified live; it is NOT the "Slot n/6" format this
   * used to assume, which silently always fell back to used=0 (the regex
   * never matched, corrupting every room-based finder below it).
   */
  async getSlotCount(dateStr: string): Promise<{ used: number; total: number }> {
    const badge = await this.getSlotBadge(dateStr);
    const total = ENV.slotCapacity.perDay;
    if (/full/i.test(badge)) return { used: total, total };
    const match = badge.match(/(\d+)\s*Available/i);
    if (!match) return { used: 0, total };
    const available = Number(match[1]);
    return { used: total - available, total };
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
  async findEmptyBookableDate(maxMonthsAhead: number = ENV.calendar.searchMonthsAhead): Promise<string | null> {
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
  async findAnyBookableDate(maxMonthsAhead: number = ENV.calendar.searchMonthsAhead): Promise<string | null> {
    for (let m = 0; m <= maxMonthsAhead; m++) {
      const dates = await this.findBookableDates();
      if (dates.length > 0) return dates[0];
      if (m >= maxMonthsAhead) break;
      if (!(await this.goNextMonth())) break;
    }
    return null;
  }

  /** First bookable date whose combined day capacity (both slots) has at least minRoom free */
  async findDateWithRoom(minRoom: number, maxMonthsAhead: number = ENV.calendar.searchMonthsAhead): Promise<string | null> {
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

  /** First date on the calendar that's already fully booked (td.si-fullday) */
  async findFullyBookedDate(maxMonthsAhead: number = ENV.calendar.searchMonthsAhead): Promise<string | null> {
    for (let m = 0; m <= maxMonthsAhead; m++) {
      const cells = await this.page.locator("td.si-fullday[data-date]").all();
      for (const cell of cells) {
        const date = await cell.getAttribute("data-date");
        if (date) return date;
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
  async findDateWithSlotRoom(slotIndex: number, minRoom: number, maxMonthsAhead: number = ENV.calendar.searchMonthsAhead): Promise<string | null> {
    // Scanning opens/closes many modals just to inspect — suppress demo
    // highlighting/pauses so the recording only slows down for the date the
    // test actually acts on.
    return this.suppressDemo(async () => {
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
    });
  }

  /**
   * The most general date finder: pages forward month by month and returns
   * the first BOOKABLE date (td.si-book) whose capacity snapshot satisfies
   * `predicate`. Any scenario-specific condition — "morning full, afternoon
   * has room", "day exactly half booked", "afternoon empty" — is expressed
   * declaratively through the DateSlotInfo passed to the predicate, instead
   * of hand-rolling modal scans in each spec.
   *
   * Per-session (morning/afternoon) counts only exist inside the slot modal,
   * so each candidate's modal is opened and immediately closed again —
   * nothing is ever booked. A candidate that turns unbookable between the
   * grid scan and the modal open (shared staging shifts under us) is skipped.
   * Fully-booked (6/6) days are td.si-fullday, never td.si-book, so they do
   * not appear here — use findFullyBookedDate() for those.
   */
  async findDateMatching(
    predicate: (info: DateSlotInfo) => boolean,
    maxMonthsAhead: number = ENV.calendar.searchMonthsAhead,
  ): Promise<string | null> {
    // Inspecting each candidate opens/closes its modal — suppress demo
    // highlighting/pauses so the scan stays fast and quiet.
    return this.suppressDemo(async () => {
      for (let m = 0; m <= maxMonthsAhead; m++) {
        for (const date of await this.findBookableDates()) {
          let info: DateSlotInfo;
          try {
            const { used, total } = await this.getSlotCount(date);
            await this.openSlotModal(date);
            const morning = await this.getModalSlotBooked(0);
            const afternoon = await this.getModalSlotBooked(1);
            await this.closeSlotModal();
            await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
            info = {
              date,
              dayUsed: used,
              dayTotal: total,
              dayRoom: total - used,
              morning: { ...morning, room: morning.max - morning.booked },
              afternoon: { ...afternoon, room: afternoon.max - afternoon.booked },
            };
          } catch {
            continue; // candidate became unbookable / modal glitched — skip it
          }
          if (predicate(info)) return date;
        }
        if (m >= maxMonthsAhead) break;
        if (!(await this.goNextMonth())) break;
      }
      return null;
    });
  }

  /**
   * First bookable date where the given session (0 = morning, 1 = afternoon)
   * is at capacity (0 room) while the date overall is still bookable — i.e.
   * the OTHER session still has room, so the cell is td.si-book, not
   * si-fullday. Thin, readable wrapper over findDateMatching().
   */
  async findDateWithSlotFull(
    slotIndex: number,
    maxMonthsAhead: number = ENV.calendar.searchMonthsAhead,
  ): Promise<string | null> {
    return this.findDateMatching(
      (i) => (slotIndex === 0 ? i.morning : i.afternoon).room === 0,
      maxMonthsAhead,
    );
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
   * Allocates `count` units to whatever room is available anywhere,
   * optionally trying `preferredDate` first. This is a shared, persistent
   * staging environment — a date's capacity can shift between when we
   * scan for room and when we actually act on it (another test run,
   * another user, a cancellation). If the chosen date turns out to have
   * become unbookable in the meantime, drop it and re-scan for a fresh
   * one instead of failing outright.
   */
  async allocateUnitsAnywhere(count: number, preferredDate?: string, maxAttempts: number = 10): Promise<void> {
    let remaining = count;
    let candidate: string | null = preferredDate ?? null;
    let attempts = 0;

    while (remaining > 0) {
      attempts++;
      if (attempts > maxAttempts) {
        throw new Error(
          `Could not allocate the remaining ${remaining} unit(s) after ${maxAttempts} attempts — ran out of bookable dates with room (or they kept becoming unbookable before we could use them).`
        );
      }

      if (!candidate) {
        candidate = await this.findDateWithRoom(1);
        if (!candidate) {
          throw new Error(`No bookable date found with room to allocate the remaining ${remaining} unit(s).`);
        }
      }

      try {
        remaining -= await this.allocateUnitsAcrossSlots(candidate, remaining);
      } catch {
        // Date became unbookable between scan and click — try a fresh one.
      }
      candidate = null;
    }
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
    await this.demoHighlight(cell); // show which date is being opened
    await cell.click();
    await this.modalOverlay.waitFor({ state: "visible", timeout: 5000 });
    await this.demoPause(); // let the reviewer read the opened dialog
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

  /**
   * Raw value of the slot's stepper input (#si-cnt0/#si-cnt1) — how many
   * units are locally staged for this slot in the current modal session.
   * Unlike the capacity text (which only reflects committed/saved
   * bookings), this updates instantly on every +/- click, so it can
   * verify the stepper refuses to exceed capacity WITHOUT ever saving —
   * meaning no real booking is made and the shared calendar's day totals
   * are never touched.
   */
  async getStepperValue(slotIndex: number): Promise<number> {
    const el = slotIndex === 0 ? this.morningCount : this.afternoonCount;
    return Number(await el.inputValue()) || 0;
  }

  /** Increment a slot's stepper via the JS function siStep(slot, +1) */
  async incrementSlot(slotIndex: number, times: number = 1) {
    await this.demoHighlight(slotIndex === 0 ? this.morningCount : this.afternoonCount);
    for (let i = 0; i < times; i++) {
      await this.page.evaluate((s) => (window as any).siStep(s, 1), slotIndex);
    }
    await this.demoPause();
  }

  /** Decrement a slot's stepper via the JS function siStep(slot, -1) */
  async decrementSlot(slotIndex: number, times: number = 1) {
    for (let i = 0; i < times; i++) {
      await this.page.evaluate((s) => (window as any).siStep(s, -1), slotIndex);
    }
  }

  /** Remove all units from a slot via the JS function siRowRemove(slot) */
  async removeSlot(slotIndex: number) {
    await this.demoHighlight(slotIndex === 0 ? this.morningRemoveBtn : this.afternoonRemoveBtn, { color: "red" });
    await this.page.evaluate((s) => (window as any).siRowRemove(s), slotIndex);
    await this.demoPause();
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
    await this.demoHighlight("#si-confirm-booking", { color: "green" });
    // Attach the navigation wait BEFORE triggering the click/evaluate that
    // causes it — siConfirmBooking() can redirect fast enough that a
    // waitForURL() started only after the evaluate() call misses the
    // navigation entirely and times out despite the redirect having already
    // landed (confirmed live, 2026-07-31: page was already on submitted.do
    // when this used to time out).
    const navPromise = this.page
      .waitForURL(/submitted\.do\?(id|txnId|transactionId)=/, { timeout: 15000 })
      .catch(() => {});
    await this.page.evaluate(() => (window as any).siConfirmBooking());
    // Matches whichever id scheme this deployment currently uses — `id=<uuid>`
    // (current, confirmed live), or the older `txnId=<number>` /
    // `transactionId=<uuid>` (see SoftwareInstallationPage.makePayment).
    await navPromise;
    await this.waitForNav();
    await this.demoPause();
  }

  /**
   * Navigate calendar to next month. The arrow is kept in the DOM but set
   * to `visibility: hidden` (not removed/disabled) once the booking
   * window's forward limit is reached — clicking it then would hang
   * waiting for "visible". Returns false instead of clicking in that case
   * so callers know to stop paging forward.
   *
   * The style check is a best-effort guess at how the app marks "no more
   * months" — if that guess is ever wrong (a different disabled state, or
   * a genuinely unresponsive arrow), a plain `.click()` would hang for the
   * full default actionability timeout. Bound it to a short timeout instead
   * and treat a failed/timed-out click the same as "no more months" so a
   * mismatch here degrades to a graceful stop, never a hung test.
   */
  async goNextMonth(): Promise<boolean> {
    // A stray open modal's overlay covers the whole page and would
    // silently swallow this click too.
    if (await this.modalOverlay.isVisible().catch(() => false)) {
      await this.closeSlotModal();
      await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    }
    // Explicit short timeout: getAttribute() otherwise waits out the
    // project-wide default timeout if #si-next never attaches (e.g. the
    // reschedule calendar, unlike the purchase-flow calendar, appears to
    // enforce a hard 2-month cap — paging past it can leave the arrow gone
    // entirely rather than merely hidden). Treat that the same as "no more
    // months" instead of hanging the whole test.
    const style = await this.nextMonthArrow.getAttribute("style", { timeout: 3000 }).catch(() => null);
    if (style === null || style.includes("hidden")) return false;
    try {
      await this.nextMonthArrow.click({ timeout: 3000 });
    } catch {
      return false; // arrow didn't respond — treat as the forward limit
    }
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
