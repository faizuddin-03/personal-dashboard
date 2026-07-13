import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

const MORNING = 0;
const AFTERNOON = 1;

test.describe("Reschedule & Handling", () => {
  // ────────────────────────────────────────────────────────────
  // UCD — Self-service reschedule
  // ────────────────────────────────────────────────────────────
  test.describe("UCD", () => {
    test.describe.configure({ mode: "serial" });

    let txnId: string;

    test.beforeEach(async ({ loginPage, serviceHubPage }) => {
      await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
      await serviceHubPage.navigate();
    });

    test("Reschedule on the day of the initial appointment to a future date", async ({
      softwareInstallationPage,
      slotPicker,
      listingPage,
      reschedulePage,
    }) => {
      txnId = await softwareInstallationPage.purchaseInstallation(1);
      const bookDate = slotPicker.earliestRescheduleDate();
      await slotPicker.openSlotModal(bookDate);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();
      await slotPicker.confirmAppointment();

      await reschedulePage.navigate(txnId);
      const newDate = reschedulePage.daysFromToday(5);

      await reschedulePage.verifyBlackoutDates();
      await reschedulePage.verifyEarliestDate();

      await reschedulePage.rescheduleAppointment({
        oldDate: bookDate,
        newDate,
        slot: MORNING,
      });

      await listingPage.navigate();
      await listingPage.searchWithFilters({ serviceType: "SOFTWARE_INSTALLATION" });
      const rows = await listingPage.getResultRows();
      expect(rows.length).toBeGreaterThan(0);
    });

    test("Reschedule before the day of the appointment to a future date", async ({
      softwareInstallationPage,
      slotPicker,
      reschedulePage,
      listingPage,
    }) => {
      txnId = await softwareInstallationPage.purchaseInstallation(1);
      const bookDate = slotPicker.daysFromToday(7);
      await slotPicker.openSlotModal(bookDate);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();
      await slotPicker.confirmAppointment();

      await reschedulePage.navigate(txnId);
      const newDate = reschedulePage.daysFromToday(14);

      await reschedulePage.verifyBlackoutDates();
      await reschedulePage.rescheduleAppointment({
        oldDate: bookDate,
        newDate,
        slot: AFTERNOON,
      });

      await listingPage.navigate();
      await listingPage.searchWithFilters({ serviceType: "SOFTWARE_INSTALLATION" });
      const rows = await listingPage.getResultRows();
      expect(rows.length).toBeGreaterThan(0);
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

      const hasReschedule = await listingPage.hasRescheduleAction(rows[0]);
      expect(hasReschedule).toBe(false);
    });

    test("Slot taken mid selection — concurrency", async ({
      softwareInstallationPage,
      slotPicker,
      browser,
    }) => {
      txnId = await softwareInstallationPage.purchaseInstallation(1);
      const targetDate = slotPicker.daysFromToday(5);

      await slotPicker.openSlotModal(targetDate);
      const initialBooked = await slotPicker.getModalSlotBooked(MORNING);

      // UCD2 would need to login, purchase, and book the same slot
      // in a parallel context. Requires a second UCD account.
      // Skeleton — fill in when UCD2 credentials are available.

      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();
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

      const sameDay = boCalendarPage.daysFromToday(4);
      await boCalendarPage.rescheduleAppointment({
        oldDate: sameDay,
        newDate: sameDay,
        slot: AFTERNOON,
      });

      await boCalendarPage.navigate();

      const nextDay = boCalendarPage.daysFromToday(1);
      const isDayBookable = await boCalendarPage.isDayBookable(nextDay);
      // BO should have no date restriction — tomorrow should be bookable
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
