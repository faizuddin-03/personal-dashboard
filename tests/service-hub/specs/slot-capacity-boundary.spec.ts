import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

test.describe("Slot Capacity Boundary", () => {
  // ────────────────────────────────────────────────────────────
  // UCD — Capacity limits enforced
  // ────────────────────────────────────────────────────────────
  test.describe("UCD", () => {
    test.beforeEach(async ({ loginPage, serviceHubPage }) => {
      await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
      await serviceHubPage.navigate();
    });

    test("Morning Slot - Book until full", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      // Precondition: morning slot on target date has capacity (< 3 booked)
      // Book installations until morning slot reaches 3/3
      const targetDate = slotPicker.daysFromToday(5);

      // Purchase and book 3 installations to fill morning slot
      for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
        const txnId = await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate);
        await slotPicker.incrementSlot(slotPicker.morningSlot, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }

      // Act: attempt to book one more in morning slot
      const txnId = await softwareInstallationPage.purchaseInstallation(1);
      await slotPicker.openSlotModal(targetDate);

      // Expected:
      // 1. Morning slot shows "Fully booked" in red
      // 2. Morning slot is disabled — cannot increment
      // 3. Afternoon slot should still be available
      const isMorningFull = await slotPicker.isSlotFullyBooked(slotPicker.morningSlot);
      expect(isMorningFull).toBe(true);

      const isAfternoonFull = await slotPicker.isSlotFullyBooked(slotPicker.afternoonSlot);
      expect(isAfternoonFull).toBe(false);
    });

    test("Afternoon Slot - Book until full", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      const targetDate = slotPicker.daysFromToday(6);

      // Fill afternoon slot to capacity
      for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
        const txnId = await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate);
        await slotPicker.incrementSlot(slotPicker.afternoonSlot, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }

      // Act: attempt to book one more in afternoon slot
      const txnId = await softwareInstallationPage.purchaseInstallation(1);
      await slotPicker.openSlotModal(targetDate);

      // Expected:
      // 1. Afternoon slot shows "Fully booked" in red
      // 2. Afternoon slot is disabled
      // 3. Morning slot should still be available
      const isAfternoonFull = await slotPicker.isSlotFullyBooked(slotPicker.afternoonSlot);
      expect(isAfternoonFull).toBe(true);

      const isMorningFull = await slotPicker.isSlotFullyBooked(slotPicker.morningSlot);
      expect(isMorningFull).toBe(false);
    });

    test("Day capacity reach 6/6", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      const targetDate = slotPicker.daysFromToday(8);

      // Fill both morning (3) and afternoon (3) = 6 total
      for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
        const txnId = await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate);
        await slotPicker.incrementSlot(slotPicker.morningSlot, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }
      for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
        const txnId = await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate);
        await slotPicker.incrementSlot(slotPicker.afternoonSlot, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }

      // Expected:
      // 1. Calendar badge shows "Slot 6/6" or "6/6"
      // 2. Both slots show "Fully booked"
      // 3. No more bookings can be made on this date via UCD portal
      const slotCount = await slotPicker.getSlotCount(targetDate);
      expect(slotCount.used).toBe(ENV.slotCapacity.perDay);
      expect(slotCount.total).toBe(ENV.slotCapacity.perDay);
    });

    test("Software Installation - Mandatory Booking", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      // Purchase 4 installations
      const txnId = await softwareInstallationPage.purchaseInstallation(4);

      // Expected: must book 4 slots — cannot skip
      const remaining = await slotPicker.getRemainingToAllocate();
      expect(remaining).toBe(4);

      // Book 2 of 4 slots
      const date1 = slotPicker.daysFromToday(5);
      await slotPicker.openSlotModal(date1);
      await slotPicker.incrementSlot(slotPicker.morningSlot, 2);
      await slotPicker.saveSlotChanges();

      // "Remaining to allocate" should now be 2
      const remainingAfter = await slotPicker.getRemainingToAllocate();
      expect(remainingAfter).toBe(2);

      // Try to confirm with 2 still unbooked — should be blocked
      // "Confirm Appointment" should be disabled or show error
      const confirmBtn = slotPicker.confirmAppointmentBtn;
      const isDisabled = await confirmBtn.isDisabled();
      // Expected: cannot confirm until all 4 are allocated
      expect(isDisabled).toBe(true);

      // Book remaining 2
      const date2 = slotPicker.daysFromToday(6);
      await slotPicker.openSlotModal(date2);
      await slotPicker.incrementSlot(slotPicker.morningSlot, 2);
      await slotPicker.saveSlotChanges();

      // Now "Booked 4 of 4" — confirm should work
      const booked = await slotPicker.getBookedCount();
      expect(booked.booked).toBe(4);
      expect(booked.total).toBe(4);
    });

    test("Biometric Purchase - Free Install Option", async ({
      biometricPurchasePage,
      slotPicker,
    }) => {
      // Purchase 2 dermalog units (includes 2 free installations)
      const txnId = await biometricPurchasePage.purchaseDevice({
        deviceQty: 2,
        recipientName: "Test Receiver",
        contactNo: "0123456789",
        shipToShowroom: true,
      });

      // Expected: slot booking is OPTIONAL for free installations
      // 1. Calendar shows slots available for booking
      // 2. UCD can book 0, 1, or all 2 free slots
      // 3. "Confirm Appointment" should be enabled even with 0 booked
      //    (because free installs are optional)
      const remaining = await slotPicker.getRemainingToAllocate();
      expect(remaining).toBe(2);

      // Skip booking entirely — confirm should still work
      const confirmBtn = slotPicker.confirmAppointmentBtn;
      const isEnabled = await confirmBtn.isEnabled();
      expect(isEnabled).toBe(true);
    });

    test("Biometric Purchase - Paid Install Mandatory", async ({
      biometricPurchasePage,
      slotPicker,
    }) => {
      // Purchase 1 dermalog (1 free install) + 1 additional paid install
      const txnId = await biometricPurchasePage.purchaseDevice({
        deviceQty: 1,
        recipientName: "Test Receiver",
        contactNo: "0123456789",
        shipToShowroom: true,
        additionalInstalls: 1,
      });

      // Expected:
      // 1. Free install (1 slot) = OPTIONAL booking
      // 2. Paid install (1 slot) = MANDATORY booking
      // 3. Cannot confirm until the paid slot is booked
      // 4. Can skip the free slot

      // Try to confirm without booking — should fail (paid is mandatory)
      const confirmBtn = slotPicker.confirmAppointmentBtn;

      // Book only 1 (the paid one)
      const targetDate = slotPicker.daysFromToday(5);
      await slotPicker.openSlotModal(targetDate);
      await slotPicker.incrementSlot(slotPicker.morningSlot, 1);
      await slotPicker.saveSlotChanges();

      // After booking 1 mandatory slot, confirm should be enabled
      // (free slot can remain unbooked)
      const isEnabled = await confirmBtn.isEnabled();
      expect(isEnabled).toBe(true);
    });

    test("Two UCD - Select same last available slot", async ({
      softwareInstallationPage,
      slotPicker,
      browser,
    }) => {
      // Precondition: a date with morning 2/3 (1 slot left)
      const targetDate = slotPicker.daysFromToday(10);

      // Fill morning to 2/3 first
      for (let i = 0; i < 2; i++) {
        const txnId = await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate);
        await slotPicker.incrementSlot(slotPicker.morningSlot, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }

      // UCD1: purchase and open slot modal — sees 1 remaining
      const txnId1 = await softwareInstallationPage.purchaseInstallation(1);
      await slotPicker.openSlotModal(targetDate);
      const beforeBooked = await slotPicker.getModalSlotBooked(slotPicker.morningSlot);
      expect(beforeBooked.booked).toBe(2);

      // UCD2: in a parallel context, books the last slot first
      // NOTE: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      // ... UCD2 login, purchase, book the last morning slot ...

      // UCD1: tries to allocate the now-taken slot
      await slotPicker.incrementSlot(slotPicker.morningSlot, 1);
      await slotPicker.saveSlotChanges();

      // Expected:
      // 1. System should detect the slot was taken by UCD2
      // 2. Error popup: "Fully booked" / "Not available"
      // 3. UCD1 should NOT be able to proceed with this slot
      // 4. UCD1 can choose a different slot or date instead

      await context2.close();
    });
  });

  // ────────────────────────────────────────────────────────────
  // BO — No capacity limit
  // ────────────────────────────────────────────────────────────
  test.describe("BO", () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
    });

    test("BO add beyond 6 days limit", async ({
      boCalendarPage,
    }) => {
      // Precondition: date with 6/6 UCD slots booked
      const fullDate = boCalendarPage.daysFromToday(3);

      // Act: CSE adds a 7th appointment
      await boCalendarPage.addAppointment({
        date: fullDate,
        slot: "morning",
        companyName: "Test Company Beyond6",
        units: 1,
      });

      // Expected:
      // 1. Allowed — CSE/BO not bound by the 6/day UCD capacity
      // 2. Appointment created successfully
      // 3. Counter may show 7/6 or separate CSE count (TBC)
      await boCalendarPage.navigate();
      // Appointment should exist on the calendar
    });

    test("Add beyond morning slot limit", async ({
      boCalendarPage,
    }) => {
      // Precondition: morning slot at 3/3 (full from UCD bookings)
      const fullDate = boCalendarPage.daysFromToday(4);

      // Act: CSE adds appointment to the full morning slot
      await boCalendarPage.addAppointment({
        date: fullDate,
        slot: "morning",
        companyName: "Test Company BeyondMorning",
        units: 1,
      });

      // Expected:
      // 1. Allowed — CSE not bound by per-slot capacity
      // 2. Morning indicator may show "Morning - 4" or similar
      // 3. The "Full" indicator is informational for CSE, not blocking
      await boCalendarPage.navigate();
      const indicator = await boCalendarPage.getSlotCapacityIndicator(fullDate, "morning");
      // CSE booking should be reflected
    });

    test("Add beyond afternoon slot limit", async ({
      boCalendarPage,
    }) => {
      // Precondition: afternoon slot at 3/3 (full from UCD bookings)
      const fullDate = boCalendarPage.daysFromToday(4);

      // Act: CSE adds appointment to the full afternoon slot
      await boCalendarPage.addAppointment({
        date: fullDate,
        slot: "afternoon",
        companyName: "Test Company BeyondAfternoon",
        units: 1,
      });

      // Expected:
      // 1. Allowed — CSE not bound by per-slot capacity
      // 2. Afternoon indicator may show "Afternoon - 4" or similar
      // 3. The "Full" indicator is informational for CSE, not blocking
      await boCalendarPage.navigate();
      const indicator = await boCalendarPage.getSlotCapacityIndicator(fullDate, "afternoon");
      // CSE booking should be reflected
    });
  });
});
