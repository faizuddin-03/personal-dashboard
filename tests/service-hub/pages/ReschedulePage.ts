import { type Page, expect } from "@playwright/test";
import { SlotPickerComponent } from "./SlotPickerComponent";
import { PATHS } from "../utils/config";

export class ReschedulePage extends SlotPickerComponent {
  readonly instructionText = this.page.getByText("Click a booked (orange) date to remove", { exact: false });
  readonly doneBtn = this.page.getByText("Done", { exact: false });

  constructor(page: Page) {
    super(page);
  }

  async navigate(txnId: string) {
    await this.goto(PATHS.reschedule(txnId));
  }

  /**
   * Full reschedule: remove from old date → allocate to new date/slot → confirm.
   * @param oldDate - current booked date (YYYY-MM-DD) to remove
   * @param newDate - target date (YYYY-MM-DD) to book
   * @param slot - "morning" | "afternoon"
   * @param units - number of units to allocate (default 1)
   */
  async rescheduleAppointment(opts: {
    oldDate: string;
    newDate: string;
    slot: "morning" | "afternoon";
    units?: number;
  }) {
    const { oldDate, newDate, slot, units = 1 } = opts;

    // Step 1: Remove from the old date
    await this.openSlotModal(oldDate);
    await this.removeBooking();
    await this.saveSlotChanges();

    // Step 2: Allocate to the new date
    await this.openSlotModal(newDate);
    const slotLocator = slot === "morning" ? this.morningSlot : this.afternoonSlot;
    await this.incrementSlot(slotLocator, units);
    await this.saveSlotChanges();

    // Step 3: Confirm
    await this.confirmAppointment();
  }

  /** Check that today and tomorrow are NOT bookable (blackout rule) */
  async verifyBlackoutDates() {
    const today = this.today();
    const tomorrow = this.daysFromToday(1);
    expect(await this.isDayBookable(today)).toBe(false);
    expect(await this.isDayBookable(tomorrow)).toBe(false);
  }

  /** Check that the earliest bookable date is today + 2 */
  async verifyEarliestDate() {
    const earliest = this.earliestRescheduleDate();
    expect(await this.isDayBookable(earliest)).toBe(true);
  }
}
