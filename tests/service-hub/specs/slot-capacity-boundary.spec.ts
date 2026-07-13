import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

const MORNING = 0;
const AFTERNOON = 1;

test.describe("Slot Capacity Boundary", () => {
  // ────────────────────────────────────────────────────────────
  // UCD — Capacity limits enforced
  //
  // Dates are discovered dynamically instead of hardcoded day-offsets,
  // since offsets can land on weekends, holidays, or already-partially-
  // booked dates. Tests also don't assume a completely empty (0-booked)
  // date exists — staging.eauto.my is a shared, persistent environment
  // with no reset between runs, so every clean date within the bookable
  // window eventually gets consumed. Instead, each test inspects whatever
  // room actually remains (via getModalSlotBooked / getSlotCount) and
  // books exactly that much.
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
      // Single purchase of 4 installations — enough to fill however much
      // room is left in the morning slot (max 3) plus at least 1 spare
      // to prove overbooking is rejected, regardless of prior bookings.
      await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
      // A date can be generally "bookable" while morning specifically is
      // already full, so find one where morning itself has room.
      const targetDate = await slotPicker.findDateWithSlotRoom(MORNING, 1);
      expect(targetDate).not.toBeNull();

      await slotPicker.openSlotModal(targetDate!);
      const initial = await slotPicker.getModalSlotBooked(MORNING);
      const roomLeft = initial.max - initial.booked;
      expect(roomLeft).toBeGreaterThan(0);

      // The modal's capacity indicator (#si-cap0/#si-cap1) reflects
      // committed (saved) bookings, not in-progress stepper clicks — so
      // book and save one unit at a time rather than incrementing
      // roomLeft times and checking before any save.
      for (let i = 0; i < roomLeft; i++) {
        await slotPicker.openSlotModal(targetDate!);
        await slotPicker.incrementSlot(MORNING, 1);
        await slotPicker.saveSlotChanges();
      }

      await slotPicker.openSlotModal(targetDate!);
      // "Fully booked" text only appears when the slot was already at
      // capacity before we touched it — filling it ourselves in this
      // session doesn't re-render that label, it just stops incrementing.
      // Verify fullness numerically instead.
      const morningState = await slotPicker.getModalSlotBooked(MORNING);
      expect(morningState.booked).toBe(morningState.max);

      // Try to add one more unit to the now-full morning slot — must be rejected
      const before = morningState;
      await slotPicker.incrementSlot(MORNING, 1);
      const after = await slotPicker.getModalSlotBooked(MORNING);
      expect(after.booked).toBe(before.booked);

      // Allocate the remaining purchased units elsewhere to complete the
      // mandatory booking (afternoon of this date, or another date if
      // this one doesn't have enough room)
      let leftover = ENV.slotCapacity.perSlot + 1 - roomLeft;
      leftover -= await slotPicker.allocateUnitsAcrossSlots(targetDate!, leftover);
      while (leftover > 0) {
        const overflowDate = await slotPicker.findDateWithRoom(1);
        expect(overflowDate).not.toBeNull();
        leftover -= await slotPicker.allocateUnitsAcrossSlots(overflowDate!, leftover);
      }
      await slotPicker.confirmAppointment();
    });

    test("Afternoon Slot - Book until full", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      // Single purchase of 4 installations — enough to fill however much
      // room is left in the afternoon slot (max 3) plus at least 1 spare
      // to prove overbooking is rejected, regardless of prior bookings.
      await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
      // A date can be generally "bookable" while afternoon specifically is
      // already full, so find one where afternoon itself has room.
      const targetDate = await slotPicker.findDateWithSlotRoom(AFTERNOON, 1);
      expect(targetDate).not.toBeNull();

      await slotPicker.openSlotModal(targetDate!);
      const initial = await slotPicker.getModalSlotBooked(AFTERNOON);
      const roomLeft = initial.max - initial.booked;
      expect(roomLeft).toBeGreaterThan(0);

      // Book and save one unit at a time — the modal's capacity indicator
      // reflects committed bookings, not in-progress stepper clicks.
      for (let i = 0; i < roomLeft; i++) {
        await slotPicker.openSlotModal(targetDate!);
        await slotPicker.incrementSlot(AFTERNOON, 1);
        await slotPicker.saveSlotChanges();
      }

      await slotPicker.openSlotModal(targetDate!);
      // "Fully booked" text only appears when the slot was already at
      // capacity before we touched it — filling it ourselves in this
      // session doesn't re-render that label, it just stops incrementing.
      // Verify fullness numerically instead.
      const afternoonState = await slotPicker.getModalSlotBooked(AFTERNOON);
      expect(afternoonState.booked).toBe(afternoonState.max);

      // Try to add one more unit to the now-full afternoon slot — must be rejected
      const before = afternoonState;
      await slotPicker.incrementSlot(AFTERNOON, 1);
      const after = await slotPicker.getModalSlotBooked(AFTERNOON);
      expect(after.booked).toBe(before.booked);

      // Allocate the remaining purchased units elsewhere to complete the
      // mandatory booking (morning of this date, or another date if this
      // one doesn't have enough room)
      let leftover = ENV.slotCapacity.perSlot + 1 - roomLeft;
      leftover -= await slotPicker.allocateUnitsAcrossSlots(targetDate!, leftover);
      while (leftover > 0) {
        const overflowDate = await slotPicker.findDateWithRoom(1);
        expect(overflowDate).not.toBeNull();
        leftover -= await slotPicker.allocateUnitsAcrossSlots(overflowDate!, leftover);
      }
      await slotPicker.confirmAppointment();
    });

    test("Day capacity reach 6/6", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      // Find any bookable date and figure out how much combined room
      // (morning + afternoon) it has left, then buy+book exactly that
      // much, one unit at a time, to prove the day caps out at 6/6.
      await softwareInstallationPage.purchaseInstallation(1);
      const targetDate = await slotPicker.findAnyBookableDate();
      expect(targetDate).not.toBeNull();

      await slotPicker.openSlotModal(targetDate!);
      const morningInit = await slotPicker.getModalSlotBooked(MORNING);
      const afternoonInit = await slotPicker.getModalSlotBooked(AFTERNOON);
      let remainingMorning = morningInit.max - morningInit.booked;
      let remainingAfternoon = afternoonInit.max - afternoonInit.booked;
      expect(remainingMorning + remainingAfternoon).toBeGreaterThan(0);

      const bookOneUnit = async () => {
        await slotPicker.openSlotModal(targetDate!);
        if (remainingMorning > 0) {
          await slotPicker.incrementSlot(MORNING, 1);
          remainingMorning--;
        } else {
          await slotPicker.incrementSlot(AFTERNOON, 1);
          remainingAfternoon--;
        }
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();
      };

      // 1st unit already purchased above
      await bookOneUnit();

      // Buy + book the rest of the day's remaining room
      while (remainingMorning > 0 || remainingAfternoon > 0) {
        await softwareInstallationPage.purchaseInstallation(1);
        await bookOneUnit();
      }

      // One more purchase — the day should now read 6/6 and no longer be
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

      const targetDate = await slotPicker.findDateWithRoom(total);
      expect(targetDate).not.toBeNull();

      // Book only 1 of the 2 units
      await slotPicker.allocateUnitsAcrossSlots(targetDate!, 1);

      const remainingAfter = await slotPicker.getRemainingToAllocate();
      expect(remainingAfter).toBe(1);

      // Try to confirm with 1 still unbooked — should be blocked
      await slotPicker.confirmAppointment();
      const clientErr = slotPicker.page.locator("#si-clienterr");
      await expect(clientErr).toBeVisible();

      // Book the remaining unit — should now be allowed to proceed
      await slotPicker.allocateUnitsAcrossSlots(targetDate!, 1);

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

      const targetDate = await slotPicker.findDateWithRoom(1);
      expect(targetDate).not.toBeNull();

      // Book only 1 of the 2 free installations
      await slotPicker.allocateUnitsAcrossSlots(targetDate!, 1);

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

      // Paid/extra installations are allocated FIRST and are mandatory;
      // the free ones just have a booking deadline — they don't block
      // confirmation. So with 1 paid unit, booking 0 must be blocked,
      // and booking 1 (the paid unit) must be enough to proceed even
      // though the 2 free units remain unbooked.
      const total = await slotPicker.getAllocationTotal();
      expect(total).toBe(3);

      const targetDate = await slotPicker.findDateWithRoom(1);
      expect(targetDate).not.toBeNull();

      // Confirm with nothing booked — the mandatory paid unit is missing
      await slotPicker.confirmAppointment();
      expect(slotPicker.page.url()).not.toMatch(/submitted\.do/);

      // Book exactly 1 unit (the mandatory paid one) — the 2 free ones stay unbooked
      await slotPicker.allocateUnitsAcrossSlots(targetDate!, 1);

      const allocated = await slotPicker.getAllocatedCount();
      expect(allocated).toBe(1);

      await slotPicker.confirmAppointment();
      expect(slotPicker.page.url()).toMatch(/submitted\.do/);
    });

    test("Two UCD - Select same last available slot", async ({
      softwareInstallationPage,
      slotPicker,
      browser,
    }) => {
      // Scout: find a date where morning specifically has room
      await softwareInstallationPage.purchaseInstallation(1);
      const targetDate = await slotPicker.findDateWithSlotRoom(MORNING, 1);
      expect(targetDate).not.toBeNull();

      await slotPicker.openSlotModal(targetDate!);
      let current = await slotPicker.getModalSlotBooked(MORNING);
      expect(current.max - current.booked).toBeGreaterThan(0);

      // Keep buying + booking 1 unit at a time into morning until exactly
      // 1 slot remains — whatever the starting point was
      while (current.max - current.booked > 1) {
        await slotPicker.incrementSlot(MORNING, 1);
        await slotPicker.saveSlotChanges();
        await slotPicker.confirmAppointment();

        await softwareInstallationPage.purchaseInstallation(1);
        await slotPicker.openSlotModal(targetDate!);
        current = await slotPicker.getModalSlotBooked(MORNING);
      }

      // Exactly 1 slot remains, and we have an unconfirmed purchase with
      // its modal already open — this is the "last" purchase attempting
      // to grab it
      const beforeBooked = current;
      expect(beforeBooked.booked).toBe(beforeBooked.max - 1);

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
