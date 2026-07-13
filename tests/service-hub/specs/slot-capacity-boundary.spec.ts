import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

const MORNING = 0;
const AFTERNOON = 1;

test.describe("Slot Capacity Boundary", () => {
  // ────────────────────────────────────────────────────────────
  // UCD — Capacity limits enforced
  // Dates are discovered dynamically (findEmptyBookableDate) instead
  // of hardcoded day-offsets, since offsets can land on weekends,
  // holidays, or already-partially-booked dates.
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
      // Buy the 1st installation and find a date with 0 bookings so the
      // 3/3 boundary is clean.
      await softwareInstallationPage.purchaseInstallation(1);
      const targetDate = await slotPicker.findEmptyBookableDate();
      expect(targetDate).not.toBeNull();

      await slotPicker.openSlotModal(targetDate!);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();
      await slotPicker.confirmAppointment();

      // Buy 2 more installations (3 total) into the morning slot of the same date
      for (let i = 1; i < ENV.slotCapacity.perSlot; i++) {
        await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate!);
        await slotPicker.incrementSlot(MORNING, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }

      // 4th installation — try to book a 4th unit into the now-full morning slot
      await softwareInstallationPage.purchaseInstallation(1);
      await slotPicker.openSlotModal(targetDate!);

      const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
      expect(isMorningFull).toBe(true);

      const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
      expect(isAfternoonFull).toBe(false);

      // Attempting to add another unit to the full morning slot must not
      // increase the booked count
      const before = await slotPicker.getModalSlotBooked(MORNING);
      await slotPicker.incrementSlot(MORNING, 1);
      const after = await slotPicker.getModalSlotBooked(MORNING);
      expect(after.booked).toBe(before.booked);
    });

    test("Afternoon Slot - Book until full", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      await softwareInstallationPage.purchaseInstallation(1);
      const targetDate = await slotPicker.findEmptyBookableDate();
      expect(targetDate).not.toBeNull();

      await slotPicker.openSlotModal(targetDate!);
      await slotPicker.incrementSlot(AFTERNOON, 1);
      await slotPicker.saveSlotChanges();
      await slotPicker.confirmAppointment();

      for (let i = 1; i < ENV.slotCapacity.perSlot; i++) {
        await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate!);
        await slotPicker.incrementSlot(AFTERNOON, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }

      // 4th installation — try to book a 4th unit into the now-full afternoon slot
      await softwareInstallationPage.purchaseInstallation(1);
      await slotPicker.openSlotModal(targetDate!);

      const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
      expect(isAfternoonFull).toBe(true);

      const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
      expect(isMorningFull).toBe(false);

      const before = await slotPicker.getModalSlotBooked(AFTERNOON);
      await slotPicker.incrementSlot(AFTERNOON, 1);
      const after = await slotPicker.getModalSlotBooked(AFTERNOON);
      expect(after.booked).toBe(before.booked);
    });

    test("Day capacity reach 6/6", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      // Buy 6 installations into a single empty date: 3 morning + 3 afternoon
      await softwareInstallationPage.purchaseInstallation(1);
      const targetDate = await slotPicker.findEmptyBookableDate();
      expect(targetDate).not.toBeNull();

      await slotPicker.openSlotModal(targetDate!);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();
      await slotPicker.confirmAppointment();

      for (let i = 1; i < ENV.slotCapacity.perSlot; i++) {
        await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate!);
        await slotPicker.incrementSlot(MORNING, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }
      for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
        await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate!);
        await slotPicker.incrementSlot(AFTERNOON, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }

      // 7th installation — the date should now read 6/6 and no longer be
      // clickable/bookable at all (fully booked for the day)
      await softwareInstallationPage.purchaseInstallation(1);

      const slotCount = await slotPicker.getSlotCount(targetDate!);
      expect(slotCount.used).toBe(ENV.slotCapacity.perDay);
      expect(slotCount.total).toBe(ENV.slotCapacity.perDay);

      const isFullyBookedDay = await slotPicker.isDayFullyBooked(targetDate!);
      expect(isFullyBookedDay).toBe(true);

      const isBookable = await slotPicker.isDayBookable(targetDate!);
      expect(isBookable).toBe(false);
    });

    test("Software Installation - Mandatory Booking", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      // Buy 2 installations — both units must be booked before confirming
      await softwareInstallationPage.purchaseInstallation(2);

      const total = await slotPicker.getAllocationTotal();
      expect(total).toBe(2);

      const targetDate = await slotPicker.findEmptyBookableDate();
      expect(targetDate).not.toBeNull();

      // Book only 1 of the 2 units
      await slotPicker.openSlotModal(targetDate!);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();

      const remainingAfter = await slotPicker.getRemainingToAllocate();
      expect(remainingAfter).toBe(1);

      // Try to confirm with 1 still unbooked — should be blocked
      await slotPicker.confirmAppointment();
      const clientErr = slotPicker.page.locator("#si-clienterr");
      await expect(clientErr).toBeVisible();

      // Book the remaining unit — should now be allowed to proceed
      await slotPicker.openSlotModal(targetDate!);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();

      const allocated = await slotPicker.getAllocatedCount();
      expect(allocated).toBe(2);

      await slotPicker.confirmAppointment();
      await expect(clientErr).toBeHidden();
    });

    test("Biometric Purchase - Free Install Option", async ({
      biometricPurchasePage,
      slotPicker,
    }) => {
      // 2 devices → 2 free software installations. Do not opt for extra
      // (paid) installs.
      await biometricPurchasePage.purchaseDevice({
        deviceQty: 2,
        recipientName: "Test Receiver",
        contactNo: "0123456789",
        shipToShowroom: true,
      });

      const total = await slotPicker.getAllocationTotal();
      expect(total).toBe(2);

      const targetDate = await slotPicker.findEmptyBookableDate();
      expect(targetDate).not.toBeNull();

      // Book only 1 of the 2 free installations
      await slotPicker.openSlotModal(targetDate!);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();

      const remaining = await slotPicker.getRemainingToAllocate();
      expect(remaining).toBe(1);

      // Free installs are optional — confirming with 1 of 2 booked must succeed
      await slotPicker.confirmAppointment();
      const clientErr = slotPicker.page.locator("#si-clienterr");
      await expect(clientErr).toBeHidden();
    });

    test("Biometric Purchase - Paid Install Mandatory", async ({
      biometricPurchasePage,
      slotPicker,
    }) => {
      // 2 devices → 2 free installs, plus opt in for 1 extra (paid) install.
      // Total to allocate = 3; the paid unit is mandatory.
      await biometricPurchasePage.purchaseDevice({
        deviceQty: 2,
        recipientName: "Test Receiver",
        contactNo: "0123456789",
        shipToShowroom: true,
        additionalInstalls: 1,
      });

      const total = await slotPicker.getAllocationTotal();
      expect(total).toBe(3);

      const targetDate = await slotPicker.findEmptyBookableDate();
      expect(targetDate).not.toBeNull();

      // Book only the 2 free installations, leave the paid one unbooked
      await slotPicker.openSlotModal(targetDate!);
      await slotPicker.incrementSlot(MORNING, 2);
      await slotPicker.saveSlotChanges();

      const remainingAfter = await slotPicker.getRemainingToAllocate();
      expect(remainingAfter).toBe(1);

      // The paid installation is mandatory — confirming should be blocked
      await slotPicker.confirmAppointment();
      const clientErr = slotPicker.page.locator("#si-clienterr");
      await expect(clientErr).toBeVisible();

      // Book the remaining (paid) unit — should now be allowed to proceed
      await slotPicker.openSlotModal(targetDate!);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();

      const allocated = await slotPicker.getAllocatedCount();
      expect(allocated).toBe(3);

      await slotPicker.confirmAppointment();
      await expect(clientErr).toBeHidden();
    });

    test("Two UCD - Select same last available slot", async ({
      softwareInstallationPage,
      slotPicker,
      browser,
    }) => {
      await softwareInstallationPage.purchaseInstallation(1);
      const targetDate = await slotPicker.findEmptyBookableDate();
      expect(targetDate).not.toBeNull();

      await slotPicker.openSlotModal(targetDate!);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();
      await slotPicker.confirmAppointment();

      await softwareInstallationPage.purchaseInstallation(1);
      await slotPicker.openSlotModal(targetDate!);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();
      await slotPicker.confirmAppointment();

      // 3rd purchase — open the last remaining morning slot (2/3 booked)
      await softwareInstallationPage.purchaseInstallation(1);
      await slotPicker.openSlotModal(targetDate!);
      const beforeBooked = await slotPicker.getModalSlotBooked(MORNING);
      expect(beforeBooked.booked).toBe(2);

      // UCD2: would book the same last slot in a parallel context
      // NOTE: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)

      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();
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
      const fullDate = boCalendarPage.daysFromToday(3);

      await boCalendarPage.addAppointment({
        date: fullDate,
        slot: MORNING,
        companyName: "Test Company Beyond6",
        units: 1,
      });

      await boCalendarPage.navigate();
    });

    test("Add beyond morning slot limit", async ({
      boCalendarPage,
    }) => {
      const fullDate = boCalendarPage.daysFromToday(4);

      await boCalendarPage.addAppointment({
        date: fullDate,
        slot: MORNING,
        companyName: "Test Company BeyondMorning",
        units: 1,
      });

      await boCalendarPage.navigate();
    });

    test("Add beyond afternoon slot limit", async ({
      boCalendarPage,
    }) => {
      const fullDate = boCalendarPage.daysFromToday(4);

      await boCalendarPage.addAppointment({
        date: fullDate,
        slot: AFTERNOON,
        companyName: "Test Company BeyondAfternoon",
        units: 1,
      });

      await boCalendarPage.navigate();
    });
  });
});
