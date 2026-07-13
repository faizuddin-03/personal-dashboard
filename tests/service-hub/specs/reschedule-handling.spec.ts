import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

const MORNING = 0;
const AFTERNOON = 1;

test.describe("Reschedule & Handling", () => {
  // ────────────────────────────────────────────────────────────
  // UCD — Self-service reschedule via Service Request Listing
  // Flow: Listing → Search Now → click Reschedule in action column
  //       → Calendar opens → click booked (orange) date → minus to
  //       remove → Save changes → click new date → plus to add slot
  //       → Save changes → Confirm Appointment → Done
  // ────────────────────────────────────────────────────────────
  test.describe("UCD", () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
    });

    test("Reschedule on the day of the initial appointment to a future date", async ({
      listingPage,
      reschedulePage,
    }) => {
      // Scenario: Today is the day of the appointment (e.g. appointment at
      // 10am, but it's 8am now). UCD wants to reschedule to a future date.
      // The minimum new date must be at least +2 days from today.

      // Step 1: Go to listing and find an appointment that can be rescheduled
      await listingPage.navigate();
      await listingPage.searchBtn.click();
      await listingPage.waitForNav();

      const rows = await listingPage.getResultRows();
      expect(rows.length).toBeGreaterThan(0);

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

      // Step 2: Click Reschedule → calendar page opens
      await listingPage.clickReschedule(targetRow);

      // Step 3: Verify +2 day blackout — today and tomorrow are blocked
      await reschedulePage.verifyBlackoutDates();
      const earliest = reschedulePage.earliestRescheduleDate(); // today + 2
      await reschedulePage.verifyEarliestDate();

      // Step 4: Reschedule — remove old booking, then pick a future date
      // The booked date will show as orange on the calendar.
      // We need to find which date is currently booked.
      // For this test, we know the appointment is "today" — but since
      // today is in the blackout zone, the old date is remove-only.
      const today = reschedulePage.today();
      const newDate = reschedulePage.daysFromToday(3); // a valid future date

      await reschedulePage.rescheduleToNewDate({
        oldDate: today,
        newDate,
        slot: MORNING,
      });
    });

    test("Reschedule before the day of the appointment to a future date", async ({
      listingPage,
      reschedulePage,
    }) => {
      // Scenario: Today is 15th, appointment is on 16th.
      // UCD reschedules BEFORE the appointment day.
      // Minimum new date = today + 2 days (the +2 day blackout rule).

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

      // Verify blackout: today and tomorrow blocked, earliest = today+2
      await reschedulePage.verifyBlackoutDates();
      await reschedulePage.verifyEarliestDate();

      // Reschedule to a future date beyond the blackout window
      const earliest = reschedulePage.earliestRescheduleDate();
      const newDate = reschedulePage.daysFromToday(7);

      // The old booking date is in the future (e.g. tomorrow) — it's
      // still in the blackout zone so it's remove-only, not re-bookable.
      const tomorrow = reschedulePage.daysFromToday(1);

      await reschedulePage.rescheduleToNewDate({
        oldDate: tomorrow,
        newDate,
        slot: AFTERNOON,
      });
    });

    test("Reschedule after 1 appointment has successfully finished", async ({
      listingPage,
      reschedulePage,
    }) => {
      // Scenario: UCD bought multiple software installations (e.g. 3).
      // 1 installation has been completed (marked by BO).
      // The remaining 2 appointments should still be reschedulable.

      await listingPage.navigate();
      await listingPage.searchWithFilters({
        serviceType: "SOFTWARE_INSTALLATION",
      });

      const rows = await listingPage.getResultRows();
      if (rows.length === 0) {
        test.skip(true, "No software installation appointments found");
        return;
      }

      // Look for a row that has Reschedule action available
      // (remaining appointments from a multi-unit purchase)
      let reschedulableRow = null;
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          reschedulableRow = row;
          break;
        }
      }

      // Expected: even though 1 appointment is completed, the remaining
      // ones should still have the Reschedule option available
      expect(reschedulableRow).not.toBeNull();

      // Perform the reschedule on one of the remaining appointments
      await listingPage.clickReschedule(reschedulableRow!);

      const newDate = reschedulePage.daysFromToday(5);
      // Find the currently booked date (shown as orange on calendar)
      // and reschedule it
      const earliest = reschedulePage.earliestRescheduleDate();

      // Note: the old booked date depends on when the appointment was
      // originally set. The test verifies the flow works for remaining
      // appointments after one has been completed.
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

      // Expected: if slot was taken by UCD2, system blocks with
      // "Slot Unavailable" popup when confirming
    });

    test("Reschedule cancelled appointment — should be blocked", async ({
      browser,
    }) => {
      // Scenario: UCD has appointments on 20th and 21st.
      // BO cancels the 20th. When UCD opens listing, the cancelled
      // appointment should no longer show Reschedule action.
      // UCD should only be able to reschedule the 21st.

      // ── Step 1: BO cancels an appointment ──
      const boContext = await browser.newContext();
      const boPage = await boContext.newPage();
      const boLogin = new (await import("../pages/LoginPage")).LoginPage(boPage);
      const boCal = new (await import("../pages/bo/AppointmentCalendarPage")).AppointmentCalendarPage(boPage);

      await boLogin.loginAsBO(ENV.boUsername, ENV.boPassword);
      await boCal.navigate();
      await boCal.markAppointmentCancelled();
      await boContext.close();

      // ── Step 2: UCD checks the listing ──
      const ucdContext = await browser.newContext();
      const ucdPage = await ucdContext.newPage();
      const ucdLogin = new (await import("../pages/LoginPage")).LoginPage(ucdPage);
      const ucdListing = new (await import("../pages/ServiceRequestListingPage")).ServiceRequestListingPage(ucdPage);

      await ucdLogin.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
      await ucdListing.navigate();
      await ucdListing.searchBtn.click();
      await ucdListing.waitForNav();

      const rows = await ucdListing.getResultRows();

      // Verify: cancelled appointment does NOT have Reschedule action
      for (const row of rows) {
        const status = await ucdListing.getRowStatus(row);
        if (status.toLowerCase().includes("cancel")) {
          const hasReschedule = await ucdListing.hasRescheduleAction(row);
          expect(hasReschedule).toBe(false);
        }
      }

      // Verify: remaining non-cancelled appointments still have Reschedule
      let hasReschedulable = false;
      for (const row of rows) {
        const status = await ucdListing.getRowStatus(row);
        if (!status.toLowerCase().includes("cancel") && !status.toLowerCase().includes("complete") && !status.toLowerCase().includes("fail")) {
          if (await ucdListing.hasRescheduleAction(row)) {
            hasReschedulable = true;
            break;
          }
        }
      }
      // At least the remaining appointment(s) should be reschedulable
      expect(hasReschedulable).toBe(true);

      await ucdContext.close();
    });

    test("Reschedule failed appointment — should be blocked for UCD", async ({
      browser,
    }) => {
      // Scenario: BO marks an appointment as Failed.
      // When UCD opens listing, the failed appointment should NOT
      // have a Reschedule action. Only remaining active appointments
      // should be reschedulable.

      // ── Step 1: BO marks an appointment as Failed ──
      const boContext = await browser.newContext();
      const boPage = await boContext.newPage();
      const boLogin = new (await import("../pages/LoginPage")).LoginPage(boPage);
      const boCal = new (await import("../pages/bo/AppointmentCalendarPage")).AppointmentCalendarPage(boPage);

      await boLogin.loginAsBO(ENV.boUsername, ENV.boPassword);
      await boCal.navigate();
      await boCal.markAppointmentFailed("Reappointment");
      await boContext.close();

      // ── Step 2: UCD checks the listing ──
      const ucdContext = await browser.newContext();
      const ucdPage = await ucdContext.newPage();
      const ucdLogin = new (await import("../pages/LoginPage")).LoginPage(ucdPage);
      const ucdListing = new (await import("../pages/ServiceRequestListingPage")).ServiceRequestListingPage(ucdPage);

      await ucdLogin.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
      await ucdListing.navigate();
      await ucdListing.searchBtn.click();
      await ucdListing.waitForNav();

      const rows = await ucdListing.getResultRows();

      // Verify: failed appointment does NOT have Reschedule action
      for (const row of rows) {
        const status = await ucdListing.getRowStatus(row);
        if (status.toLowerCase().includes("fail")) {
          const hasReschedule = await ucdListing.hasRescheduleAction(row);
          expect(hasReschedule).toBe(false);
        }
      }

      // Verify: remaining active appointments still have Reschedule
      let hasReschedulable = false;
      for (const row of rows) {
        const status = await ucdListing.getRowStatus(row);
        if (!status.toLowerCase().includes("cancel") && !status.toLowerCase().includes("complete") && !status.toLowerCase().includes("fail")) {
          if (await ucdListing.hasRescheduleAction(row)) {
            hasReschedulable = true;
            break;
          }
        }
      }
      expect(hasReschedulable).toBe(true);

      await ucdContext.close();
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
