import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

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
      // Precondition: purchase 1 installation and book it for today+2
      txnId = await softwareInstallationPage.purchaseInstallation(1);
      const bookDate = slotPicker.earliestRescheduleDate();
      await slotPicker.openSlotModal(bookDate);
      await slotPicker.incrementSlot(slotPicker.morningSlot, 1);
      await slotPicker.saveSlotChanges();
      await slotPicker.confirmAppointment();

      // Act: on the day of the appointment, reschedule to a future date
      await reschedulePage.navigate(txnId);
      const newDate = reschedulePage.daysFromToday(5);

      // Expected: +2 day blackout applies — today & tomorrow blocked
      await reschedulePage.verifyBlackoutDates();
      await reschedulePage.verifyEarliestDate();

      // Reschedule to the future date
      await reschedulePage.rescheduleAppointment({
        oldDate: bookDate,
        newDate,
        slot: "morning",
      });

      // Verify: status remains valid, new date reflected, old slot freed
      await listingPage.navigate();
      await listingPage.searchWithFilters({ serviceType: "SOFTWARE_INSTALLATION" });
      const rows = await listingPage.getResultRows();
      expect(rows.length).toBeGreaterThan(0);
      const remarks = await listingPage.getRowRemarks(rows[0]);
      expect(remarks.toLowerCase()).toContain("rescheduled");
    });

    test("Reschedule before the day of the appointment to a future date", async ({
      softwareInstallationPage,
      slotPicker,
      reschedulePage,
      listingPage,
    }) => {
      // Precondition: book appointment for today+7
      txnId = await softwareInstallationPage.purchaseInstallation(1);
      const bookDate = slotPicker.daysFromToday(7);
      await slotPicker.openSlotModal(bookDate);
      await slotPicker.incrementSlot(slotPicker.morningSlot, 1);
      await slotPicker.saveSlotChanges();
      await slotPicker.confirmAppointment();

      // Act: reschedule BEFORE the appointment day to a further date
      await reschedulePage.navigate(txnId);
      const newDate = reschedulePage.daysFromToday(14);

      await reschedulePage.verifyBlackoutDates();
      await reschedulePage.rescheduleAppointment({
        oldDate: bookDate,
        newDate,
        slot: "afternoon",
      });

      // Verify: status valid, slots updated
      await listingPage.navigate();
      await listingPage.searchWithFilters({ serviceType: "SOFTWARE_INSTALLATION" });
      const rows = await listingPage.getResultRows();
      const remarks = await listingPage.getRowRemarks(rows[0]);
      expect(remarks.toLowerCase()).toContain("rescheduled");
    });

    test("Reschedule after 1 appointment has successfully finished", async ({
      reschedulePage,
      listingPage,
      slotPicker,
    }) => {
      // Precondition: an appointment with status Completed must exist
      // (requires BO to have marked one Completed — seeded data or prior test)
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

      // Check: completed appointments should NOT have reschedule action
      const hasReschedule = await listingPage.hasRescheduleAction(rows[0]);
      expect(hasReschedule).toBe(false);
    });

    test("Slot taken mid selection — concurrency", async ({
      softwareInstallationPage,
      slotPicker,
      browser,
    }) => {
      // UCD1: purchase and start booking
      txnId = await softwareInstallationPage.purchaseInstallation(1);
      const targetDate = slotPicker.daysFromToday(5);

      // Open slot modal — slot shows as available
      await slotPicker.openSlotModal(targetDate);
      const initialBooked = await slotPicker.getModalSlotBooked(slotPicker.morningSlot);

      // UCD2 (second browser context): books the same last slot
      const context2 = await browser.newContext();
      const page2 = context2.newPage();
      // NOTE: UCD2 would need to login, purchase, and book the same slot
      // in a parallel context. This test requires a second UCD account.
      // Skeleton — fill in when UCD2 credentials are available.

      // UCD1: try to confirm after UCD2 took the slot
      await slotPicker.incrementSlot(slotPicker.morningSlot, 1);
      await slotPicker.saveSlotChanges();

      // Expected: if the slot was taken by UCD2, the system should block
      // UCD1 from confirming — show error popup
      // "Fully booked" / "Not available" / calendar blocked
      // NOTE: exact error handling depends on implementation — may be
      // caught at saveChanges or at confirmAppointment
    });

    test("Reschedule cancelled appointment — should be blocked", async ({
      listingPage,
    }) => {
      // Precondition: appointment with status CANCELLED must exist
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

      // Expected: UCD cannot reschedule. Only BO can reschedule cancelled appointment.
      const hasReschedule = await listingPage.hasRescheduleAction(rows[0]);
      expect(hasReschedule).toBe(false);
    });

    test("Reschedule failed appointment — should be blocked for UCD", async ({
      listingPage,
    }) => {
      // Precondition: appointment with status FAILED must exist
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

      // Expected: UCD cannot reschedule failed appointment. Only BO can.
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
      listingPage,
    }) => {
      // Precondition: a pending appointment must exist on the BO calendar
      await boCalendarPage.navigate();

      const oldDate = boCalendarPage.daysFromToday(3);
      const newDate = boCalendarPage.daysFromToday(7);

      // Act: reschedule to new date
      await boCalendarPage.rescheduleAppointment({
        oldDate,
        newDate,
        slot: "morning",
      });

      // Expected:
      // 1. Date and time reflect on affected pages
      // 2. Old slot should be freed (counter decreases)
      // 3. New slot shows the booking
      // 4. Reschedule email sent to UCD
      await boCalendarPage.navigate();
      const oldSlot = await boCalendarPage.getSlotCount(oldDate);
      const newSlot = await boCalendarPage.getSlotCount(newDate);

      // Old date slot count should have decreased
      expect(await boCalendarPage.isDateBooked(oldDate)).toBe(false);
      // New date should show the booking
      expect(newSlot.used).toBeGreaterThan(0);
    });

    test("BO reschedule on same day different time slot and the next day", async ({
      boCalendarPage,
    }) => {
      await boCalendarPage.navigate();

      // Scenario 1: same day, different slot (morning → afternoon)
      const sameDay = boCalendarPage.daysFromToday(4);
      await boCalendarPage.rescheduleAppointment({
        oldDate: sameDay,
        newDate: sameDay,
        slot: "afternoon", // different from original morning slot
      });

      // Expected: allowed — BO has no date restriction, old slot freed
      await boCalendarPage.navigate();

      // Scenario 2: next day
      const nextDay = boCalendarPage.daysFromToday(1);
      // Expected: allowed — BO not bound by +2 day blackout
      // BO can reschedule to tomorrow (UCD cannot)
      const isDayBookable = await boCalendarPage.isDayBookable(nextDay);
      // NOTE: BO should have no date restriction — this should be true
      // even for tomorrow which UCD cannot book
    });

    test("Reschedule after appointment status = cancel", async ({
      boCalendarPage,
    }) => {
      // Precondition: BO has an appointment marked Cancelled
      await boCalendarPage.navigate();

      // Expected: Cancelled appointments CANNOT be rescheduled.
      // "Cancelled → no repurchase" — terminal state.
      // The reschedule link should NOT be available for cancelled entries.
      // If the system shows the appointment, reschedule option should be absent.

      // NOTE: This contradicts the UCD test scenario note "only BO can
      // reschedule cancelled appointment." Clarify with team:
      // - Does "Cancelled → no repurchase" mean no reschedule at all?
      // - Or can BO override and reschedule even cancelled ones?
      // Current implementation assumes: Cancelled = terminal, no reschedule.
      const isAvailable = await boCalendarPage.isRescheduleAvailable();
      expect(isAvailable).toBe(false);
    });

    test("Reschedule after appointment status = fail", async ({
      boCalendarPage,
    }) => {
      // Precondition: BO has marked an appointment as Failed
      await boCalendarPage.navigate();

      // Act: attempt to reschedule the failed appointment
      // Expected: Allowed — "Failed → can reschedule"
      // BO/CSE can reschedule failed appointments via the Appointment Calendar.
      // After reschedule, a reschedule email is sent to UCD with updated details.
      const isAvailable = await boCalendarPage.isRescheduleAvailable();
      expect(isAvailable).toBe(true);

      // Perform the reschedule
      const newDate = boCalendarPage.daysFromToday(5);
      await boCalendarPage.rescheduleAppointment({
        oldDate: boCalendarPage.daysFromToday(2), // original failed date
        newDate,
        slot: "morning",
      });
    });
  });
});
