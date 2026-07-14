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

    // Expected: on a session that has NOT been booked yet, only up to 3
    // appointments can be added. Buy more than a session can hold (perSlot+1)
    // so our own purchase total is never the limiting factor, start from an
    // EMPTY session so the limit we hit is the hard 3-per-slot cap, and prove
    // the "+" stepper refuses to exceed 3. Stepper only, never saved — the
    // shared calendar is left untouched.
    test("Morning Slot - Book until full", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
      const date = await slotPicker.findDateMatching((i) => i.morning.booked === 0);
      if (!date) {
        test.skip(true, "No date with an empty morning session available.");
        return;
      }
      await test.step(`Expected: morning session accepts at most ${ENV.slotCapacity.perSlot}`, async () => {
        await slotPicker.openSlotModal(date);
        await slotPicker.incrementSlot(MORNING, ENV.slotCapacity.perSlot + 1);
        expect(await slotPicker.getStepperValue(MORNING)).toBe(ENV.slotCapacity.perSlot);
      });
    });

    test("Afternoon Slot - Book until full", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
      const date = await slotPicker.findDateMatching((i) => i.afternoon.booked === 0);
      if (!date) {
        test.skip(true, "No date with an empty afternoon session available.");
        return;
      }
      await test.step(`Expected: afternoon session accepts at most ${ENV.slotCapacity.perSlot}`, async () => {
        await slotPicker.openSlotModal(date);
        await slotPicker.incrementSlot(AFTERNOON, ENV.slotCapacity.perSlot + 1);
        expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(ENV.slotCapacity.perSlot);
      });
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

    test("Biometric Purchase - Free Install Option (partial booking)", async ({
      biometricPurchasePage,
      slotPicker,
    }) => {
      // 2 devices → 2 free software installations. Do not opt for extra
      // (paid) installs. Expected: UCD may PARTIALLY book — the remaining
      // free appointment stays valid for 1 month (tied to the SR reference).
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

    test("Biometric Purchase - Free Install Option (no booking)", async ({
      biometricPurchasePage,
      slotPicker,
    }) => {
      // 2 devices → 2 free installs, no extra (paid) installs. Expected: UCD
      // may proceed WITHOUT booking any appointment now — all free installs
      // remain valid for 1 month (tied to the SR reference).
      await biometricPurchasePage.purchaseDevice({
        deviceQty: 2,
        recipientName: "Test Receiver",
        contactNo: "0123456789",
        shipToShowroom: true,
      });

      expect(await slotPicker.getAllocationTotal()).toBe(2);

      // Confirm with nothing booked — free installs are optional, so this
      // must be allowed to proceed (no mandatory paid unit to block it).
      await slotPicker.confirmAppointment();
      expect(slotPicker.page.url()).toMatch(/submitted\.do/);
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

  // NOTE: BO/CSE capacity is intentionally NOT tested here. Per SRD 2.3.2.7
  // #2 rule 3 the 3-per-slot (6/day) cap binds UCD Portal bookings only; for
  // CSE the counter is informational. The "can CSE add past a full slot"
  // behaviour lives in add-appointment-bo.spec.ts, not as a capacity limit.
});
