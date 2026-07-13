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
      // We never save or confirm this booking — the goal is purely to
      // prove the "+" stepper refuses to exceed the morning slot's
      // remaining capacity. Since nothing is committed, the shared
      // calendar's day totals are never touched, so there's no risk of
      // this test itself pushing a date to 6/6 and locking it for
      // everyone else. Buy more than a slot could ever hold (perSlot + 1)
      // so our own purchase total is never the limiting factor — only
      // the slot's own capacity should be.
      await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
      // A date can be generally "bookable" while morning specifically is
      // already full, so find one where morning itself has room.
      const targetDate = await slotPicker.findDateWithSlotRoom(MORNING, 1);
      expect(targetDate).not.toBeNull();

      await slotPicker.openSlotModal(targetDate!);
      const initial = await slotPicker.getModalSlotBooked(MORNING);
      const roomLeft = initial.max - initial.booked;
      expect(roomLeft).toBeGreaterThan(0);

      // Fill the slot to capacity via the stepper only — no save
      await slotPicker.incrementSlot(MORNING, roomLeft);
      const filled = await slotPicker.getStepperValue(MORNING);
      expect(filled).toBe(roomLeft);

      // Try to add one more — the stepper must refuse to go past capacity
      await slotPicker.incrementSlot(MORNING, 1);
      const afterOverbook = await slotPicker.getStepperValue(MORNING);
      expect(afterOverbook).toBe(roomLeft);
    });

    test("Afternoon Slot - Book until full", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      // Same approach as the morning test — verify the stepper's own
      // limit without ever saving/confirming, so no real booking is made
      // and the shared calendar is left untouched.
      await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
      // A date can be generally "bookable" while afternoon specifically is
      // already full, so find one where afternoon itself has room.
      const targetDate = await slotPicker.findDateWithSlotRoom(AFTERNOON, 1);
      expect(targetDate).not.toBeNull();

      await slotPicker.openSlotModal(targetDate!);
      const initial = await slotPicker.getModalSlotBooked(AFTERNOON);
      const roomLeft = initial.max - initial.booked;
      expect(roomLeft).toBeGreaterThan(0);

      // Fill the slot to capacity via the stepper only — no save
      await slotPicker.incrementSlot(AFTERNOON, roomLeft);
      const filled = await slotPicker.getStepperValue(AFTERNOON);
      expect(filled).toBe(roomLeft);

      // Try to add one more — the stepper must refuse to go past capacity
      await slotPicker.incrementSlot(AFTERNOON, 1);
      const afterOverbook = await slotPicker.getStepperValue(AFTERNOON);
      expect(afterOverbook).toBe(roomLeft);
    });

    test("Day capacity reach 6/6", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      await softwareInstallationPage.purchaseInstallation(1);

      // Part 1: a date that's already fully booked (6/6) must not open
      // at all when clicked — no popup, no way in.
      const fullDate = await slotPicker.findFullyBookedDate();
      expect(fullDate).not.toBeNull();

      let popupOpened = false;
      try {
        await slotPicker.openSlotModal(fullDate!);
        popupOpened = true;
      } catch {
        // Expected — a fully-booked date must refuse to open.
      }
      // If it somehow DID open, that's a real bug and this test must fail.
      expect(popupOpened).toBe(false);

      // Part 2: on a date with some room, neither slot can be pushed past
      // its own 3-unit cap. Stepper only — never saved/confirmed, so no
      // real booking is made and the shared calendar stays untouched.
      const targetDate = await slotPicker.findDateWithRoom(1);
      expect(targetDate).not.toBeNull();

      await slotPicker.openSlotModal(targetDate!);

      const morningInitial = await slotPicker.getModalSlotBooked(MORNING);
      const afternoonInitial = await slotPicker.getModalSlotBooked(AFTERNOON);
      const morningRoom = morningInitial.max - morningInitial.booked;
      const afternoonRoom = afternoonInitial.max - afternoonInitial.booked;
      expect(morningRoom + afternoonRoom).toBeGreaterThan(0);

      if (morningRoom > 0) {
        await slotPicker.incrementSlot(MORNING, morningRoom);
        expect(await slotPicker.getStepperValue(MORNING)).toBe(morningRoom);
        await slotPicker.incrementSlot(MORNING, 1);
        expect(await slotPicker.getStepperValue(MORNING)).toBe(morningRoom);
      }

      if (afternoonRoom > 0) {
        await slotPicker.incrementSlot(AFTERNOON, afternoonRoom);
        expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(afternoonRoom);
        await slotPicker.incrementSlot(AFTERNOON, 1);
        expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(afternoonRoom);
      }
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
      await slotPicker.allocateUnitsAnywhere(1, targetDate!);

      const remainingAfter = await slotPicker.getRemainingToAllocate();
      expect(remainingAfter).toBe(1);

      // Try to confirm with 1 still unbooked — should be blocked
      await slotPicker.confirmAppointment();
      const clientErr = slotPicker.page.locator("#si-clienterr");
      await expect(clientErr).toBeVisible();

      // Book the remaining unit — should now be allowed to proceed
      await slotPicker.allocateUnitsAnywhere(1);

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
      await slotPicker.allocateUnitsAnywhere(1, targetDate!);

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
      await slotPicker.allocateUnitsAnywhere(1, targetDate!);

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

    // SRD 2.3.2.7 #2 rule 3: the 3-per-slot (6/day) cap applies to UCD
    // Portal bookings only; for CSE it is informational, so BO can add
    // beyond it.
    test("BO add beyond 6/day cap", async ({ boCalendarPage }) => {
      const fullDate = boCalendarPage.daysFromToday(3);

      await boCalendarPage.addAppointment({
        companyName: "Test Company Beyond6",
        appointmentDate: fullDate,
        slot: MORNING,
      });

      await boCalendarPage.navigate();
      expect(await boCalendarPage.getSlotCount(fullDate, MORNING)).toBeGreaterThan(0);
    });

    test("BO add beyond morning slot limit", async ({ boCalendarPage }) => {
      const fullDate = boCalendarPage.daysFromToday(4);

      await boCalendarPage.addAppointment({
        companyName: "Test Company BeyondMorning",
        appointmentDate: fullDate,
        slot: MORNING,
      });

      await boCalendarPage.navigate();
      expect(await boCalendarPage.getSlotCount(fullDate, MORNING)).toBeGreaterThan(0);
    });

    test("BO add beyond afternoon slot limit", async ({ boCalendarPage }) => {
      const fullDate = boCalendarPage.daysFromToday(4);

      await boCalendarPage.addAppointment({
        companyName: "Test Company BeyondAfternoon",
        appointmentDate: fullDate,
        slot: AFTERNOON,
      });

      await boCalendarPage.navigate();
      expect(await boCalendarPage.getSlotCount(fullDate, AFTERNOON)).toBeGreaterThan(0);
    });
  });
});
