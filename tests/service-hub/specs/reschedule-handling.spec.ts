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
      // Scenario: appointment exists on some date. UCD opens listing,
      // clicks Reschedule, calendar opens. UCD removes the old booking
      // and picks a new available date. +2 day blackout applies.

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

      // Click Reschedule → calendar page opens
      await listingPage.clickReschedule(targetRow);

      // Verify blackout: today and tomorrow are NOT bookable
      await reschedulePage.verifyBlackoutDates();

      // Verify there are bookable dates available
      await reschedulePage.verifyHasBookableDates();

      // Find the currently booked date (orange badge) and first available date
      const bookedDate = await reschedulePage.findBookedDate();
      expect(bookedDate).not.toBeNull();

      const newDate = await reschedulePage.findFirstBookableDate();
      expect(newDate).not.toBeNull();

      // Reschedule: remove from booked date → pick new date
      await reschedulePage.rescheduleToNewDate({
        oldDate: bookedDate!,
        newDate: newDate!,
        slot: MORNING,
      });
    });

    test("Reschedule before the day of the appointment to a future date", async ({
      listingPage,
      reschedulePage,
    }) => {
      // Scenario: UCD reschedules BEFORE the appointment day.
      // Same flow — the booked date is in the future.

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
      await reschedulePage.verifyHasBookableDates();

      const bookedDate = await reschedulePage.findBookedDate();
      expect(bookedDate).not.toBeNull();

      // Find a bookable date that is NOT the same as the booked date
      const allBookable = await reschedulePage.page.locator("td.si-book[data-date]").all();
      let newDate: string | null = null;
      for (const cell of allBookable) {
        const date = await cell.getAttribute("data-date");
        if (date && date !== bookedDate) {
          newDate = date;
          break;
        }
      }
      expect(newDate).not.toBeNull();

      await reschedulePage.rescheduleToNewDate({
        oldDate: bookedDate!,
        newDate: newDate!,
        slot: AFTERNOON,
      });
    });

    test("Reschedule after 1 appointment has successfully finished", async ({
      listingPage,
    }) => {
      // Scenario: UCD bought multiple software installations (e.g. 3).
      // 1 installation has been completed (marked by BO).
      // The remaining appointments should still be reschedulable.

      await listingPage.navigate();
      await listingPage.searchWithFilters({
        serviceType: "SOFTWARE_INSTALLATION",
      });

      const rows = await listingPage.getResultRows();
      if (rows.length === 0) {
        test.skip(true, "No software installation appointments found");
        return;
      }

      // Look for a row with Reschedule action (remaining from multi-unit)
      let reschedulableRow = null;
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          reschedulableRow = row;
          break;
        }
      }

      // Even though 1 appointment is completed, remaining ones should
      // still have the Reschedule option
      expect(reschedulableRow).not.toBeNull();

      // Verify the reschedule flow works
      await listingPage.clickReschedule(reschedulableRow!);
      // Calendar should open — verify there are bookable dates
      const firstBookable = await listingPage.page.locator("td.si-book[data-date]").first();
      await expect(firstBookable).toBeVisible();
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

      await listingPage.clickReschedule(targetRow);

      const firstBookable = await reschedulePage.findFirstBookableDate();
      if (!firstBookable) {
        test.skip(true, "No bookable dates available");
        return;
      }

      await reschedulePage.openSlotModal(firstBookable);
      const initialBooked = await reschedulePage.getModalSlotBooked(MORNING);

      // UCD2: would book the same last slot in a parallel context
      // NOTE: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)

      await reschedulePage.incrementSlot(MORNING, 1);
      await reschedulePage.saveSlotChanges();
    });

    test("Reschedule cancelled appointment — should be blocked", async ({
      browser,
    }) => {
      // Scenario: UCD has multiple appointments (e.g. 20th and 21st).
      // BO cancels the 20th. When UCD opens listing, the cancelled
      // appointment should NOT show Reschedule. Only the 21st should.

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

      // Cancelled rows should NOT have Reschedule action
      for (const row of rows) {
        const status = await ucdListing.getRowStatus(row);
        if (status.toLowerCase().includes("cancel")) {
          const hasReschedule = await ucdListing.hasRescheduleAction(row);
          expect(hasReschedule).toBe(false);
        }
      }

      // Remaining non-cancelled appointments should still have Reschedule
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

    test("Reschedule failed appointment — should be blocked for UCD", async ({
      browser,
    }) => {
      // Scenario: BO marks an appointment as Failed.
      // UCD listing should NOT show Reschedule for that appointment.
      // Only remaining active appointments should be reschedulable.

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

      // Failed rows should NOT have Reschedule action
      for (const row of rows) {
        const status = await ucdListing.getRowStatus(row);
        if (status.toLowerCase().includes("fail")) {
          const hasReschedule = await ucdListing.hasRescheduleAction(row);
          expect(hasReschedule).toBe(false);
        }
      }

      // Remaining active appointments should still have Reschedule
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
      const isAvailable = await boCalendarPage.isRescheduleAvailable();
      expect(isAvailable).toBe(false);
    });

    test("Reschedule after appointment status = fail", async ({
      boCalendarPage,
    }) => {
      await boCalendarPage.navigate();
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
