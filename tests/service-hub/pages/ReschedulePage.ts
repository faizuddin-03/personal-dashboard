import { type Page, expect } from "@playwright/test";
import { SlotPickerComponent } from "./SlotPickerComponent";
import { PATHS } from "../utils/config";

export class ReschedulePage extends SlotPickerComponent {
  constructor(page: Page) {
    super(page);
  }

  async navigate(txnId: string) {
    await this.goto(PATHS.reschedule(txnId));
  }

  /**
   * Full reschedule: remove from old date → allocate to new date/slot → confirm.
   * @param slot - 0 = morning (10:00am-12:00pm), 1 = afternoon (2:00pm-4:00pm)
   */
  async rescheduleAppointment(opts: {
    oldDate: string;
    newDate: string;
    slot: number;
    units?: number;
  }) {
    const { oldDate, newDate, slot, units = 1 } = opts;

    // Step 1: Open old date and remove booking
    await this.openSlotModal(oldDate);
    // Remove from whichever slot has the original booking
    for (let s = 0; s < 2; s++) {
      const countEl = s === 0 ? this.morningCount : this.afternoonCount;
      const val = Number(await countEl.inputValue()) || 0;
      if (val > 0) await this.removeSlot(s);
    }
    await this.saveSlotChanges();

    // Step 2: Open new date and allocate
    await this.openSlotModal(newDate);
    await this.incrementSlot(slot, units);
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

  async verifyEarliestDate() {
    const earliest = this.earliestRescheduleDate();
    expect(await this.isDayBookable(earliest)).toBe(true);
  }
}
