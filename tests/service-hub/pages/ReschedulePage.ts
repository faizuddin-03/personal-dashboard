import { type Page, expect } from "@playwright/test";
import { SlotPickerComponent } from "./SlotPickerComponent";
import { PATHS } from "../utils/config";

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
   * Full reschedule flow (already on the reschedule calendar page):
   * 1. Click booked (orange) date → minus to remove → Save changes
   * 2. Click new bookable date → plus to add slot → Save changes
   * 3. Confirm Appointment → Done
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

    // Step 3: Confirm appointment
    await this.confirmBookingBtn.click();
    await this.waitForNav();

    // Step 4: Confirmation page — click Done
    await this.doneBtn.waitFor({ state: "visible", timeout: 10000 });
    await this.doneBtn.click();
    await this.waitForNav();
  }

  /** Verify today and tomorrow are muted (blackout rule) */
  async verifyBlackoutDates() {
    const today = this.today();
    const tomorrow = this.daysFromToday(1);
    expect(await this.isDayBookable(today)).toBe(false);
    expect(await this.isDayBookable(tomorrow)).toBe(false);
  }

  /** Verify there is at least one bookable date on the calendar */
  async verifyHasBookableDates() {
    const firstBookable = await this.findFirstBookableDate();
    expect(firstBookable).not.toBeNull();
  }
}
