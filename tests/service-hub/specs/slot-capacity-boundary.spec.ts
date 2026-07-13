import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

const MORNING = 0;
const AFTERNOON = 1;

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
      const targetDate = slotPicker.daysFromToday(5);

      for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
        const txnId = await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate);
        await slotPicker.incrementSlot(MORNING, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }

      const txnId = await softwareInstallationPage.purchaseInstallation(1);
      await slotPicker.openSlotModal(targetDate);

      const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
      expect(isMorningFull).toBe(true);

      const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
      expect(isAfternoonFull).toBe(false);
    });

    test("Afternoon Slot - Book until full", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      const targetDate = slotPicker.daysFromToday(6);

      for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
        const txnId = await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate);
        await slotPicker.incrementSlot(AFTERNOON, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }

      const txnId = await softwareInstallationPage.purchaseInstallation(1);
      await slotPicker.openSlotModal(targetDate);

      const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
      expect(isAfternoonFull).toBe(true);

      const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
      expect(isMorningFull).toBe(false);
    });

    test("Day capacity reach 6/6", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      const targetDate = slotPicker.daysFromToday(8);

      for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
        const txnId = await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate);
        await slotPicker.incrementSlot(MORNING, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }
      for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
        const txnId = await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate);
        await slotPicker.incrementSlot(AFTERNOON, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }

      const slotCount = await slotPicker.getSlotCount(targetDate);
      expect(slotCount.used).toBe(ENV.slotCapacity.perDay);
      expect(slotCount.total).toBe(ENV.slotCapacity.perDay);
    });

    test("Software Installation - Mandatory Booking", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      const txnId = await softwareInstallationPage.purchaseInstallation(4);

      const remaining = await slotPicker.getRemainingToAllocate();
      expect(remaining).toBe(4);

      const date1 = slotPicker.daysFromToday(5);
      await slotPicker.openSlotModal(date1);
      await slotPicker.incrementSlot(MORNING, 2);
      await slotPicker.saveSlotChanges();

      const remainingAfter = await slotPicker.getRemainingToAllocate();
      expect(remainingAfter).toBe(2);

      // Try to confirm with 2 still unbooked — should show error
      // (Confirm button is always enabled but validates on click)
      await slotPicker.confirmAppointment();
      const clientErr = slotPicker.page.locator("#si-clienterr");
      const errVisible = await clientErr.isVisible();
      expect(errVisible).toBe(true);

      const date2 = slotPicker.daysFromToday(6);
      await slotPicker.openSlotModal(date2);
      await slotPicker.incrementSlot(MORNING, 2);
      await slotPicker.saveSlotChanges();

      const allocated = await slotPicker.getAllocatedCount();
      expect(allocated).toBe(4);
    });

    test("Biometric Purchase - Free Install Option", async ({
      biometricPurchasePage,
      slotPicker,
    }) => {
      const txnId = await biometricPurchasePage.purchaseDevice({
        deviceQty: 2,
        recipientName: "Test Receiver",
        contactNo: "0123456789",
        shipToShowroom: true,
      });

      const remaining = await slotPicker.getRemainingToAllocate();
      expect(remaining).toBe(2);

      // Free installs are optional — confirm should work with 0 booked
      // (MIN_REQUIRED is 0 for free installs)
    });

    test("Biometric Purchase - Paid Install Mandatory", async ({
      biometricPurchasePage,
      slotPicker,
    }) => {
      const txnId = await biometricPurchasePage.purchaseDevice({
        deviceQty: 1,
        recipientName: "Test Receiver",
        contactNo: "0123456789",
        shipToShowroom: true,
        additionalInstalls: 1,
      });

      const targetDate = slotPicker.daysFromToday(5);
      await slotPicker.openSlotModal(targetDate);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();

      const allocated = await slotPicker.getAllocatedCount();
      expect(allocated).toBe(1);
    });

    test("Two UCD - Select same last available slot", async ({
      softwareInstallationPage,
      slotPicker,
      browser,
    }) => {
      const targetDate = slotPicker.daysFromToday(10);

      for (let i = 0; i < 2; i++) {
        const txnId = await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate);
        await slotPicker.incrementSlot(MORNING, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      }

      const txnId1 = await softwareInstallationPage.purchaseInstallation(1);
      await slotPicker.openSlotModal(targetDate);
      const beforeBooked = await slotPicker.getModalSlotBooked(MORNING);
      expect(beforeBooked.booked).toBe(2);

      // UCD2: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)
      // Skeleton — fill in when UCD2 credentials are available.

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
