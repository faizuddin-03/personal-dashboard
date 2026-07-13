import { type Page, expect } from "@playwright/test";
import { SlotPickerComponent } from "./SlotPickerComponent";
import { PATHS, ENV } from "../utils/config";

export class ReschedulePage extends SlotPickerComponent {
  readonly doneBtn = this.page.getByText("Done", { exact: false });
  readonly confirmBookingBtn = this.page.locator("#si-confirm-booking");

  constructor(page: Page) {
    super(page);
  }

  async navigate(txnId: string) {
    await this.goto(PATHS.reschedule(txnId));
  }

  /** Find the currently booked date (has si-bookbadge = orange tag) */
  async findBookedDate(): Promise<string | null> {
    const cells = await this.page.locator("td[data-date] .si-bookbadge").all();
    if (cells.length === 0) return null;
    const parent = cells[0].locator("xpath=ancestor::td");
    return await parent.getAttribute("data-date");
  }

  /** Find the first bookable date on the calendar (has si-book class) */
  async findFirstBookableDate(): Promise<string | null> {
    const cells = await this.page.locator("td.si-book[data-date]").all();
    if (cells.length === 0) return null;
    return await cells[0].getAttribute("data-date");
  }

  /**
   * Confirm the reschedule. Per SRD 2.3.2.1 #6 (Reschedule Flow), clicking
   * "Confirm Appointment" raises a confirmation popup:
   *   "Are you sure you want to reschedule? By proceeding you will lost
   *    your current appointment."  [Yes] [No]
   * Yes proceeds; No returns to the calendar to pick another date.
   */
  async confirmReschedule(accept: boolean = true) {
    await this.confirmBookingBtn.click();
    await this.waitForDialog();
    if (accept) {
      await this.acceptConfirmDialog();
    } else {
      await this.dismissConfirmDialog();
    }
    await this.waitForNav();
  }

  /**
   * Full reschedule flow (already on the reschedule calendar page):
   * 1. Click booked (orange) date → minus to remove → Save changes
   * 2. Click new bookable date → plus to add slot → Save changes
   * 3. Confirm Appointment → accept the reschedule confirmation popup
   * 4. Done
   *
   * @param slot - 0 = morning (10:00am-12:00pm), 1 = afternoon (2:00pm-4:00pm)
   */
  async rescheduleToNewDate(opts: {
    oldDate: string;
    newDate: string;
    slot: number;
    units?: number;
  }) {
    const { oldDate, newDate, slot, units = 1 } = opts;

    // Step 1: Click the booked (orange) date and remove
    await this.openSlotModal(oldDate);
    for (let s = 0; s < 2; s++) {
      const countEl = s === 0 ? this.morningCount : this.afternoonCount;
      const val = Number(await countEl.inputValue()) || 0;
      if (val > 0) await this.removeSlot(s);
    }
    await this.saveSlotChanges();

    // Step 2: Click the new date and allocate slot
    await this.openSlotModal(newDate);
    await this.incrementSlot(slot, units);
    await this.saveSlotChanges();

    // Step 3: Confirm appointment + accept the reschedule confirmation popup
    await this.confirmReschedule(true);

    // Step 4: Confirmation page — click Done
    await this.doneBtn.waitFor({ state: "visible", timeout: 10000 });
    await this.doneBtn.click();
    await this.waitForNav();
  }

  /**
   * Verify the +2-day blackout rule (SRD 2.3.2.1 #6 Rules, Via UCD Portal):
   *  1. Today and tomorrow must NOT be bookable.
   *  2. The earliest *bookable* date must be at least today+2 (it may be
   *     later than +2 if the +2 date is full — availability fallback).
   */
  async verifyBlackoutDates() {
    const today = this.today();
    const tomorrow = this.daysFromToday(1);
    expect(await this.isDayBookable(today)).toBe(false);
    expect(await this.isDayBookable(tomorrow)).toBe(false);

    const earliest = await this.findFirstBookableDate();
    expect(earliest).not.toBeNull();
    // Earliest bookable must be on or after today+2 (availability fallback
    // means it can be later, never earlier).
    expect(earliest! >= this.earliestRescheduleDate()).toBe(true);
  }

  /** Verify there is at least one bookable date on the calendar */
  async verifyHasBookableDates() {
    const firstBookable = await this.findFirstBookableDate();
    expect(firstBookable).not.toBeNull();
  }

  /**
   * SRD 2.3.2.1 #5 (Reschedule Flow, note iii): same-day reschedule is
   * allowed to proceed via the portal, but the affected installation
   * record is then set to Status = "Failed" with the system remark
   * "UCD rescheduled on the same day."
   *
   * NOTE: the SRD is internally ambiguous here — rule 1 (+2 blackout)
   * greys out today, yet this note says selecting today is allowed. Only
   * call this if today is actually selectable on the calendar; the caller
   * is responsible for verifying the resulting Failed status + remark on
   * the Service Request Details / listing afterwards
   * (ENV.text.sameDayRescheduleRemark).
   */
  async rescheduleToToday(opts: { oldDate: string; slot: number; units?: number }) {
    const { oldDate, slot, units = 1 } = opts;
    const today = this.today();

    await this.openSlotModal(oldDate);
    for (let s = 0; s < 2; s++) {
      const countEl = s === 0 ? this.morningCount : this.afternoonCount;
      const val = Number(await countEl.inputValue()) || 0;
      if (val > 0) await this.removeSlot(s);
    }
    await this.saveSlotChanges();

    await this.openSlotModal(today);
    await this.incrementSlot(slot, units);
    await this.saveSlotChanges();

    await this.confirmReschedule(true);
    await this.doneBtn.waitFor({ state: "visible", timeout: 10000 });
    await this.doneBtn.click();
    await this.waitForNav();
  }

  /** The exact system remark expected after a same-day portal reschedule. */
  get sameDayRescheduleRemark(): string {
    return ENV.text.sameDayRescheduleRemark;
  }
}
