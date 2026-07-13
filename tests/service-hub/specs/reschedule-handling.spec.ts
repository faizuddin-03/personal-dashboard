import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

const MORNING = 0;
const AFTERNOON = 1;

test.describe("Reschedule & Handling", () => {
  // ────────────────────────────────────────────────────────────
  // UCD — Self-service reschedule via Service Request Listing
  // Flow: Listing → Search Now → click Reschedule → Calendar
  //       → pick new date/slot → Save → Confirm → Done
  // ────────────────────────────────────────────────────────────
  test.describe("UCD", () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
    });

    test("Reschedule on the day of the initial appointment to a future date", async ({
      listingPage,
      reschedulePage,
    }) => {
      // Step 1: Go to Service Request Listing and search
      await listingPage.navigate();
      await listingPage.searchBtn.click();
      await listingPage.waitForNav();

      // Step 2: Find an appointment with Reschedule action
      const rows = await listingPage.getResultRows();
      expect(rows.length).toBeGreaterThan(0);

      let targetRow = null;
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          targetRow = row;
          break;
        }
      }
      expect(targetRow).not.toBeNull();

      // Step 3: Click Reschedule — opens calendar page
      await listingPage.clickReschedule(targetRow!);

      // Step 4: Verify blackout dates (+2 day rule)
      await reschedulePage.verifyBlackoutDates();
      await reschedulePage.verifyEarliestDate();

      // Step 5: Find the currently booked (orange) date and a new future date
      const earliest = reschedulePage.earliestRescheduleDate();
      const newDate = reschedulePage.daysFromToday(5);

      // Step 6: Reschedule — remove old → pick new → confirm → done
      // Note: oldDate needs to be the actual booked date shown in orange.
      // We use the earliest reschedule date as the old date for this test.
      await reschedulePage.rescheduleToNewDate({
        oldDate: earliest,
        newDate,
        slot: MORNING,
      });
    });

    test("Reschedule before the day of the appointment to a future date", async ({
      listingPage,
      reschedulePage,
    }) => {
      await listingPage.navigate();
      await listingPage.searchBtn.click();
      await listingPage.waitForNav();

      const rows = await listingPage.getResultRows();
      let targetRow = null;
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          targetRow = row;
          break;
        }
      }
      if (!targetRow) {
        test.skip(true, "No appointment with Reschedule action available");
        return;
      }

      await listingPage.clickReschedule(targetRow);

      await reschedulePage.verifyBlackoutDates();

      const newDate = reschedulePage.daysFromToday(14);
      const earliest = reschedulePage.earliestRescheduleDate();

      await reschedulePage.rescheduleToNewDate({
        oldDate: earliest,
        newDate,
        slot: AFTERNOON,
      });
    });

    test("Reschedule after 1 appointment has successfully finished", async ({
      listingPage,
    }) => {
      await listingPage.navigate();
      await listingPage.searchWithFilters({
        serviceType: "SOFTWARE_INSTALLATION",
        status: "COMPLETED",
      });

      const rows = await listingPage.getResultRows();
      if (rows.length === 0) {
        test.skip(true, "No completed appointment available — seed data required");
        return;
      }

      // Completed appointments should NOT have reschedule action
      const hasReschedule = await listingPage.hasRescheduleAction(rows[0]);
      expect(hasReschedule).toBe(false);
    });

    test("Slot taken mid selection — concurrency", async ({
      listingPage,
      reschedulePage,
      browser,
    }) => {
      await listingPage.navigate();
      await listingPage.searchBtn.click();
      await listingPage.waitForNav();

      const rows = await listingPage.getResultRows();
      let targetRow = null;
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          targetRow = row;
          break;
        }
      }
      if (!targetRow) {
        test.skip(true, "No appointment with Reschedule action available");
        return;
      }

      // UCD1: open reschedule calendar
      await listingPage.clickReschedule(targetRow);

      const targetDate = reschedulePage.daysFromToday(5);
      await reschedulePage.openSlotModal(targetDate);
      const initialBooked = await reschedulePage.getModalSlotBooked(MORNING);

      // UCD2: would book the same last slot in a parallel context
      // NOTE: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)
      // Skeleton — fill in when UCD2 credentials are available.

      await reschedulePage.incrementSlot(MORNING, 1);
      await reschedulePage.saveSlotChanges();

      // Expected: if slot was taken by UCD2, system blocks with error popup
    });

    test("Reschedule cancelled appointment — should be blocked", async ({
      listingPage,
    }) => {
      await listingPage.navigate();
      await listingPage.searchWithFilters({
        serviceType: "SOFTWARE_INSTALLATION",
        status: "CANCELLED",
      });

      const rows = await listingPage.getResultRows();
      if (rows.length === 0) {
        test.skip(true, "No cancelled appointment available — BO must cancel one first");
        return;
      }

      // UCD cannot reschedule cancelled appointments
      const hasReschedule = await listingPage.hasRescheduleAction(rows[0]);
      expect(hasReschedule).toBe(false);
    });

    test("Reschedule failed appointment — should be blocked for UCD", async ({
      listingPage,
    }) => {
      await listingPage.navigate();
      await listingPage.searchWithFilters({
        serviceType: "SOFTWARE_INSTALLATION",
        status: "FAILED",
      });

      const rows = await listingPage.getResultRows();
      if (rows.length === 0) {
        test.skip(true, "No failed appointment available — BO must mark one Failed first");
        return;
      }

      // UCD cannot reschedule failed appointments — only BO can
      const hasReschedule = await listingPage.hasRescheduleAction(rows[0]);
      expect(hasReschedule).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────
  // BO — CSE/Ops reschedule
  // ────────────────────────────────────────────────────────────
  test.describe("BO", () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
    });

    test("BO reschedule normal flow", async ({
      boCalendarPage,
    }) => {
      await boCalendarPage.navigate();

      const oldDate = boCalendarPage.daysFromToday(3);
      const newDate = boCalendarPage.daysFromToday(7);

      await boCalendarPage.rescheduleAppointment({
        oldDate,
        newDate,
        slot: MORNING,
      });

      await boCalendarPage.navigate();
      expect(await boCalendarPage.isDateBooked(oldDate)).toBe(false);
      const newSlot = await boCalendarPage.getSlotCount(newDate);
      expect(newSlot.used).toBeGreaterThan(0);
    });

    test("BO reschedule on same day different time slot and the next day", async ({
      boCalendarPage,
    }) => {
      await boCalendarPage.navigate();

      // Same day, different slot (morning → afternoon)
      const sameDay = boCalendarPage.daysFromToday(4);
      await boCalendarPage.rescheduleAppointment({
        oldDate: sameDay,
        newDate: sameDay,
        slot: AFTERNOON,
      });

      await boCalendarPage.navigate();

      // BO can reschedule to tomorrow — no +2 day blackout
      const nextDay = boCalendarPage.daysFromToday(1);
      const isDayBookable = await boCalendarPage.isDayBookable(nextDay);
    });

    test("Reschedule after appointment status = cancel", async ({
      boCalendarPage,
    }) => {
      await boCalendarPage.navigate();
      // Cancelled = terminal state, no reschedule
      const isAvailable = await boCalendarPage.isRescheduleAvailable();
      expect(isAvailable).toBe(false);
    });

    test("Reschedule after appointment status = fail", async ({
      boCalendarPage,
    }) => {
      await boCalendarPage.navigate();
      // Failed appointments CAN be rescheduled by BO
      const isAvailable = await boCalendarPage.isRescheduleAvailable();
      expect(isAvailable).toBe(true);

      const newDate = boCalendarPage.daysFromToday(5);
      await boCalendarPage.rescheduleAppointment({
        oldDate: boCalendarPage.daysFromToday(2),
        newDate,
        slot: MORNING,
      });
    });
  });
});
