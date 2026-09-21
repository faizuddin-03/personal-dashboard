import { type Page, expect, test } from "@playwright/test";
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

  /**
   * Find the currently booked date (has si-bookbadge = orange tag). The
   * calendar only renders the currently-displayed month, and the booked
   * appointment can be in either the current or next month (the SRD's
   * 2-month window), so this pages forward like the other finders instead
   * of only checking whatever month happened to be showing on page load.
   */
  async findBookedDate(maxMonthsAhead: number = ENV.calendar.searchMonthsAhead): Promise<string | null> {
    for (let m = 0; m <= maxMonthsAhead; m++) {
      const cells = await this.page.locator("td[data-date] .si-bookbadge").all();
      if (cells.length > 0) {
        const parent = cells[0].locator("xpath=ancestor::td");
        return await parent.getAttribute("data-date");
      }
      if (m >= maxMonthsAhead) break;
      if (!(await this.goNextMonth())) break;
    }
    return null;
  }

  /** Find the first bookable date on the calendar (has si-book class) */
  async findFirstBookableDate(maxMonthsAhead: number = ENV.calendar.searchMonthsAhead): Promise<string | null> {
    for (let m = 0; m <= maxMonthsAhead; m++) {
      const cells = await this.page.locator("td.si-book[data-date]").all();
      if (cells.length > 0) return await cells[0].getAttribute("data-date");
      if (m >= maxMonthsAhead) break;
      if (!(await this.goNextMonth())) break;
    }
    return null;
  }

  /**
   * Confirm the reschedule. Per SRD 2.3.2.1 #6 (Reschedule Flow), clicking
   * "Confirm Appointment" raises a confirmation popup:
   *   "Are you sure you want to reschedule? By proceeding you will lost
   *    your current appointment."  [Yes] [No]
   * Yes proceeds; No returns to the calendar to pick another date.
   */
  async confirmReschedule(accept: boolean = true) {
    await this.demoHighlight(this.confirmBookingBtn, { color: "green" });
    await this.confirmBookingBtn.click();
    await this.waitForDialog();
    // Let the reviewer read the "Are you sure you want to reschedule?" popup.
    await this.demoHighlight(accept ? ".confirm-dialog-btn" : ".cancel-dialog-btn", { color: accept ? "green" : "red" });
    if (accept) {
      await this.acceptConfirmDialog();
    } else {
      await this.dismissConfirmDialog();
    }
    await this.waitForNav();
    await this.demoPause();
  }

  /**
   * Confirm a booking removal actually persisted before touching another
   * date. saveSlotChanges()'s modal-close is a client-side UI action —
   * siSaveDate() also fires a save request in the background, and it can
   * still be in flight when the modal closes. Clicking a NEW date before
   * that request lands can leave the app's own client-state (e.g. "which
   * date is currently being edited") inconsistent, so the new date's modal
   * then never opens (`#si-ovl` never appears, and the click hangs). Poll
   * the calendar's own booked-badge until it's actually gone.
   */
  private async waitForRemovalConfirmed(oldDate: string, timeoutMs: number = 8000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (!(await this.isDateBooked(oldDate))) return;
      await this.page.waitForTimeout(300);
    }
    // Best-effort — proceed regardless; the caller's next step will surface
    // any real failure on its own rather than us throwing a confusing one here.
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
    const slotName = slot === 0 ? "morning" : "afternoon";

    // Step 1: If the currently-booked date is still openable, clear it first.
    // When the booked date sits inside the +2-day blackout (si-muted) — e.g.
    // the appointment is today/tomorrow — it can't be opened, and that's fine:
    // confirming the reschedule discards the current appointment anyway
    // ("you will lose your current appointment"), so we simply skip removal.
    //
    // NOTE: when the caller reached this calendar via
    // ServiceRequestListingPage.clickReschedule() (the real, current UI
    // flow), the old booking has ALREADY been auto-removed by that point —
    // verified live, SIT2 — so this step is normally a harmless no-op (the
    // stepper values read 0, nothing to remove). It only does real work when
    // the calendar was reached by navigating ReschedulePage.navigate(txnId)
    // directly (bypassing the listing/modal), which still leaves the old
    // booking in place. Kept as-is so both entry points work correctly.
    await test.step(`Clear the existing booking on ${oldDate}`, async () => {
      if (await this.isDayBookable(oldDate)) {
        await this.openSlotModal(oldDate);
        for (let s = 0; s < 2; s++) {
          const countEl = s === 0 ? this.morningCount : this.afternoonCount;
          const val = Number(await countEl.inputValue()) || 0;
          if (val > 0) await this.removeSlot(s);
        }
        await this.saveSlotChanges();
        await this.waitForRemovalConfirmed(oldDate);
      }
    });

    await test.step(`Pick new date ${newDate} and allocate the ${slotName} session`, async () => {
      await this.openSlotModal(newDate);
      await this.incrementSlot(slot, units);
      await this.saveSlotChanges();
    });

    await test.step('Confirm reschedule (accept "you will lose your current appointment")', async () => {
      await this.confirmReschedule(true);
    });

    await test.step("Land on the confirmation page and click Done", async () => {
      await this.doneBtn.waitFor({ state: "visible", timeout: 10000 });
      await this.doneBtn.click();
      await this.waitForNav();
    });
  }

  /**
   * Verify the +2-day blackout rule (SRD 2.3.2.1 #6 Rules, Via UCD Portal):
   *  1. Today and tomorrow must NOT be bookable.
   *  2. The earliest *bookable* date must be at least today+2 (it may be
   *     later than +2 if the +2 date is full — availability fallback).
   */
  async verifyBlackoutDates() {
    await test.step("Expected: +2-day blackout — today & tomorrow not bookable", async () => {
      const today = this.today();
      const tomorrow = this.daysFromToday(1);
      expect(await this.isDayBookable(today)).toBe(false);
      expect(await this.isDayBookable(tomorrow)).toBe(false);

      const earliest = await this.findFirstBookableDate();
      expect(earliest).not.toBeNull();
      // Earliest bookable must be on or after today+2 (availability fallback
      // means it can be later, never earlier).
      expect(earliest! >= this.earliestRescheduleDate()).toBe(true);
    });
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

    // Clear the old booking only if that date is still openable (see
    // rescheduleToNewDate) — otherwise the confirm discards it for us.
    if (await this.isDayBookable(oldDate)) {
      await this.openSlotModal(oldDate);
      for (let s = 0; s < 2; s++) {
        const countEl = s === 0 ? this.morningCount : this.afternoonCount;
        const val = Number(await countEl.inputValue()) || 0;
        if (val > 0) await this.removeSlot(s);
      }
      await this.saveSlotChanges();
      await this.waitForRemovalConfirmed(oldDate);
    }

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
