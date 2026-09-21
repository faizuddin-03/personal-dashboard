import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import { openTrackedContext, closeTrackedContext } from "../utils/tracked-context";

const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const TEST_TIMEOUT_MS = 20 * 60 * 1000; // 15-min hold + arrangement/assertion overhead

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
    test("SC_SCB_TS01: Morning Slot - Book until full", async ({
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

    test("SC_SCB_TS03: Afternoon Slot - Book until full", async ({
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

    test("SC_SCB_TS05: Day capacity reach 6/6", async ({
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
      let remainingToAllocate = await slotPicker.getRemainingToAllocate();
      expect(morningRoom + afternoonRoom).toBeGreaterThan(0);
      expect(remainingToAllocate).toBeGreaterThan(0);

      if (morningRoom > 0 && remainingToAllocate > 0) {
        const morningAlloc = Math.min(morningRoom, remainingToAllocate);
        await slotPicker.incrementSlot(MORNING, morningAlloc);
        expect(await slotPicker.getStepperValue(MORNING)).toBe(morningAlloc);
        await slotPicker.incrementSlot(MORNING, 1);
        expect(await slotPicker.getStepperValue(MORNING)).toBe(morningAlloc);
        remainingToAllocate -= morningAlloc;
      }

      if (afternoonRoom > 0 && remainingToAllocate > 0) {
        const afternoonAlloc = Math.min(afternoonRoom, remainingToAllocate);
        await slotPicker.incrementSlot(AFTERNOON, afternoonAlloc);
        expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(afternoonAlloc);
        await slotPicker.incrementSlot(AFTERNOON, 1);
        expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(afternoonAlloc);
      }
    });

    test("SC_SCB_TS07: Software Installation - Mandatory Booking", async ({
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

    // SC_SCB_TS08: "Mandatory free installation (full booking)" — CONFIRMED
    // live (user clarification, 2026-07-30): booking is all-or-nothing.
    // Booking only SOME of the free installs must be blocked; only booking
    // ALL of them (or none at all, via SC_SCB_TS09's opt-out) is allowed.
    test("SC_SCB_TS08: Biometric Purchase - Mandatory free installation (full booking)", async ({
      biometricPurchasePage,
      slotPicker,
    }) => {
      await biometricPurchasePage.purchaseDevice({
        deviceQty: 2,
        recipientName: "Test Receiver",
        contactNo: "0123456789",
        shipToShowroom: true,
      });

      const total = await slotPicker.getAllocationTotal();
      expect(total).toBe(2);

      const targetDate = await slotPicker.findDateWithRoom(2);
      if (!targetDate) {
        test.skip(true, "No bookable date with room for 2 units currently available.");
        return;
      }

      // Book only 1 of the 2 free installations, then attempt to confirm.
      await slotPicker.allocateUnitsAnywhere(1, targetDate);
      expect(await slotPicker.getRemainingToAllocate()).toBe(1);

      await test.step("Expected: confirming with only 1 of 2 booked is blocked", async () => {
        await slotPicker.confirmAppointment();
        const clientErr = slotPicker.page.locator("#si-clienterr");
        await expect(clientErr).toBeVisible();
      });

      await test.step("Expected: booking the remaining unit allows confirm to succeed", async () => {
        await slotPicker.allocateUnitsAnywhere(1);
        expect(await slotPicker.getAllocatedCount()).toBe(2);
        await slotPicker.confirmAppointment();
        expect(slotPicker.page.url()).toMatch(/submitted\.do/);
      });
    });

    // SC_SCB_TS09: "Biometric Purchase - No Installation" — the ONLY way to
    // skip booking entirely is the explicit "I don't need software
    // installation" opt-out; leaving units simply unbooked is blocked
    // (see SC_SCB_TS08 above).
    test("SC_SCB_TS09: Biometric Purchase - No Installation", async ({
      biometricPurchasePage,
      slotPicker,
    }) => {
      await biometricPurchasePage.purchaseDevice({
        deviceQty: 2,
        recipientName: "Test Receiver",
        contactNo: "0123456789",
        shipToShowroom: true,
        skipInstall: true,
      });

      // Confirmed live (2026-07-31): opting out of installation skips the
      // slot-picker page entirely — makePayment() lands directly on
      // submitted.do, so there's no #si-alloc-total to read and no confirm
      // button to click here (both belong to slot.do).
      await test.step("Expected: able to continue without booking any appointment", async () => {
        expect(biometricPurchasePage.page.url()).toMatch(/submitted\.do/);
      });
    });

    test("SC_SCB_TS10: Biometric Purchase - Paid Install Mandatory", async ({
      biometricPurchasePage,
      slotPicker,
    }) => {
      // 3 full confirm/allocate round-trips (blocked, blocked, succeed) —
      // the default 60s test timeout isn't enough with Detailed mode's
      // per-step pauses (see SC_RH_TS01's identical fix).
      test.setTimeout(120_000);

      // 2 devices → 2 free installs, plus opt in for 1 extra (paid) install.
      // Total to allocate = 3. CONFIRMED live (user, 2026-07-31): booking is
      // all-or-nothing, same rule as SC_SCB_TS08 — this includes the paid
      // unit AND both free ones, not just the paid one.
      await biometricPurchasePage.purchaseDevice({
        deviceQty: 2,
        recipientName: "Test Receiver",
        contactNo: "0123456789",
        shipToShowroom: true,
        additionalInstalls: 1,
      });

      const total = await slotPicker.getAllocationTotal();
      expect(total).toBe(3);

      const targetDate = await slotPicker.findDateWithRoom(3);
      if (!targetDate) {
        test.skip(true, "No bookable date with room for 3 units currently available.");
        return;
      }

      // Confirm with nothing booked — blocked
      await slotPicker.confirmAppointment();
      expect(slotPicker.page.url()).not.toMatch(/submitted\.do/);

      // Book only 1 of the 3 units — still blocked (all-or-nothing)
      await slotPicker.allocateUnitsAnywhere(1, targetDate);
      expect(await slotPicker.getAllocatedCount()).toBe(1);
      await slotPicker.confirmAppointment();
      expect(slotPicker.page.url()).not.toMatch(/submitted\.do/);

      // Book the remaining 2 units — all 3 booked, confirm succeeds
      await slotPicker.allocateUnitsAnywhere(2);
      expect(await slotPicker.getAllocatedCount()).toBe(3);
      await slotPicker.confirmAppointment();
      expect(slotPicker.page.url()).toMatch(/submitted\.do/);
    });

    // ── Reschedule-entry parity ──
    // The QA doc pairs every capacity scenario with both an "Add New" and a
    // "Reschedule" entry point. The slot modal/stepper is the same shared
    // component either way (SlotPickerComponent), but the doc explicitly
    // wants the cap verified when reached via Reschedule too, so these open
    // the calendar through an existing appointment's Reschedule action
    // instead of a fresh purchase.
    async function openRescheduleCalendar(
      listingPage: import("../pages/ServiceRequestListingPage").ServiceRequestListingPage,
      reschedulePage: import("../pages/ReschedulePage").ReschedulePage,
    ): Promise<boolean> {
      await listingPage.navigate();
      await listingPage.searchBtn.click();
      await listingPage.waitForNav();
      const rows = await listingPage.getResultRows();
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          await listingPage.clickReschedule(row);
          // Confirm the calendar actually rendered before reporting success —
          // clickReschedule() navigating without the calendar ever attaching
          // (a stale/edge-case record) used to leave callers hanging on a
          // getAllocationTotal()/getStepperValue() read that never resolves.
          const loaded = await reschedulePage.calendar
            .waitFor({ state: "visible", timeout: 8000 })
            .then(() => true)
            .catch(() => false);
          if (!loaded) return false;
          return true;
        }
      }
      return false;
    }

    test("SC_SCB_TS02: Morning Slot - Max Capacity (via Reschedule)", async ({ listingPage, reschedulePage }) => {
      if (!(await openRescheduleCalendar(listingPage, reschedulePage))) {
        test.skip(true, "No reschedulable appointment to open a calendar from.");
        return;
      }
      const total = await reschedulePage.getAllocationTotal();
      if (total < ENV.slotCapacity.perSlot + 1) {
        test.skip(
          true,
          `Reschedule record has allocation total ${total}; need at least ${ENV.slotCapacity.perSlot + 1} to validate per-slot cap independently of allocation cap.`
        );
        return;
      }
      const date = await reschedulePage.findDateMatching((i) => i.morning.booked === 0);
      if (!date) {
        test.skip(true, "No date with an empty morning session available.");
        return;
      }
      await test.step(`Expected: morning session accepts at most ${ENV.slotCapacity.perSlot}`, async () => {
        await reschedulePage.openSlotModal(date);
        await reschedulePage.incrementSlot(MORNING, ENV.slotCapacity.perSlot + 1);
        expect(await reschedulePage.getStepperValue(MORNING)).toBe(ENV.slotCapacity.perSlot);
      });
    });

    test("SC_SCB_TS04: Afternoon Slot - Max Capacity (via Reschedule)", async ({ listingPage, reschedulePage }) => {
      if (!(await openRescheduleCalendar(listingPage, reschedulePage))) {
        test.skip(true, "No reschedulable appointment to open a calendar from.");
        return;
      }
      const total = await reschedulePage.getAllocationTotal();
      if (total < ENV.slotCapacity.perSlot + 1) {
        test.skip(
          true,
          `Reschedule record has allocation total ${total}; need at least ${ENV.slotCapacity.perSlot + 1} to validate per-slot cap independently of allocation cap.`
        );
        return;
      }
      const date = await reschedulePage.findDateMatching((i) => i.afternoon.booked === 0);
      if (!date) {
        test.skip(true, "No date with an empty afternoon session available.");
        return;
      }
      await test.step(`Expected: afternoon session accepts at most ${ENV.slotCapacity.perSlot}`, async () => {
        await reschedulePage.openSlotModal(date);
        await reschedulePage.incrementSlot(AFTERNOON, ENV.slotCapacity.perSlot + 1);
        expect(await reschedulePage.getStepperValue(AFTERNOON)).toBe(ENV.slotCapacity.perSlot);
      });
    });

    test("SC_SCB_TS06: Daily Max Capacity (via Reschedule)", async ({ listingPage, reschedulePage }) => {
      if (!(await openRescheduleCalendar(listingPage, reschedulePage))) {
        test.skip(true, "No reschedulable appointment to open a calendar from.");
        return;
      }

      // A fully-booked (6/6) date must not open at all when clicked.
      const fullDate = await reschedulePage.findFullyBookedDate();
      if (!fullDate) {
        test.skip(true, "No fully-booked date available to verify against.");
        return;
      }
      let popupOpened = false;
      try {
        await reschedulePage.openSlotModal(fullDate);
        popupOpened = true;
      } catch {
        // Expected — a fully-booked date must refuse to open.
      }
      expect(popupOpened).toBe(false);
    });

    // ── 15-minute hold booking ──
    // Selecting a slot and saving the modal (siSaveDate) provisionally
    // allocates it against THIS transaction in the UI, but the CSV's own
    // wording ("Slot fully booked" scenario) implies the real server-side
    // capacity isn't consumed until the FINAL "Confirm Appointment" —
    // otherwise a second user could never take the same slot in between.
    // These tests literally wait the full 15 minutes (per user direction,
    // 2026-07-31) rather than simulate it, so each takes ~15-20 minutes.

    test("SC_SCB_TS21: 15 Minutes Hold Booking - Slot still available", async ({
      softwareInstallationPage,
      slotPicker,
    }) => {
      test.setTimeout(TEST_TIMEOUT_MS);

      await softwareInstallationPage.purchaseInstallation(1);
      const targetDate = await slotPicker.findDateWithRoom(1);
      if (!targetDate) {
        test.skip(true, "No bookable date with room currently available.");
        return;
      }
      await slotPicker.openSlotModal(targetDate);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();

      await test.step("Wait 15 minutes with the slot held but not yet confirmed", async () => {
        await slotPicker.page.waitForTimeout(FIFTEEN_MIN_MS);
      });

      await test.step("Expected: still able to confirm without error after the wait", async () => {
        await slotPicker.confirmAppointment();
        expect(slotPicker.page.url()).toMatch(/submitted\.do/);
      });
    });

    test("SC_SCB_TS23: 15 Minutes Hold Booking - Slot fully booked", async ({
      softwareInstallationPage,
      slotPicker,
      browser,
    }, testInfo) => {
      test.setTimeout(TEST_TIMEOUT_MS);
      if (!ENV.ucd2Username || !ENV.ucd2Password) {
        test.skip(true, "No second UCD account configured — key one into the runner's 'UCD (2nd account) Login'.");
        return;
      }

      // UCD A: select (but don't yet confirm) a slot with exactly 1 unit
      // of room, so a second user taking that same last unit genuinely
      // exhausts it.
      await softwareInstallationPage.purchaseInstallation(1);
      const targetDate = await slotPicker.findDateWithSlotRoom(MORNING, 1);
      if (!targetDate) {
        test.skip(true, "No date with morning-session room currently available.");
        return;
      }
      await slotPicker.openSlotModal(targetDate);
      const before = await slotPicker.getModalSlotBooked(MORNING);
      await slotPicker.incrementSlot(MORNING, 1);
      await slotPicker.saveSlotChanges();

      await test.step("Wait 15 minutes with UCD A's slot held but not yet confirmed", async () => {
        await slotPicker.page.waitForTimeout(FIFTEEN_MIN_MS);
      });

      // UCD B: buy the same-size purchase and race to book the SAME exact
      // date/slot A is still holding — repeat until that morning session
      // is genuinely at capacity (room may have started above 1 if the
      // shared calendar shifted during the 15-minute wait).
      const ucdBCtx = await openTrackedContext(browser, testInfo);
      const ucdBPage = await ucdBCtx.newPage();
      let bBooked = false;
      try {
        const LoginPage = (await import("../pages/LoginPage")).LoginPage;
        const SoftwareInstallationPage = (await import("../pages/SoftwareInstallationPage")).SoftwareInstallationPage;
        const SlotPickerComponent = (await import("../pages/SlotPickerComponent")).SlotPickerComponent;
        await new LoginPage(ucdBPage).loginAsUCD(ENV.ucd2Username, ENV.ucd2Password);
        const siB = new SoftwareInstallationPage(ucdBPage);
        const slotB = new SlotPickerComponent(ucdBPage);
        await siB.purchaseInstallation(before.max - before.booked);
        await slotB.openSlotModal(targetDate);
        await slotB.incrementSlot(MORNING, before.max - before.booked);
        await slotB.saveSlotChanges();
        await slotB.confirmAppointment();
        bBooked = slotB.page.url().includes("submitted.do");
      } finally {
        await closeTrackedContext(ucdBCtx, testInfo, "UCD B books the same slot");
      }
      if (!bBooked) {
        test.skip(true, "Could not arrange UCD B to fill the remaining room in this slot.");
        return;
      }

      await test.step("Expected (UCD A): 'Sorry, some selected time slot are booked...' popup", async () => {
        await slotPicker.confirmAppointment();
        const shown = await slotPicker.unavailOverlay.isVisible().catch(() => false);
        expect(shown, "expected the slot-unavailable popup after UCD B took the last unit").toBe(true);
      });
    });

    test("SC_SCB_TS22: Reschedule to 15 Minutes Hold Booking - Slot still available", async ({ listingPage, reschedulePage }) => {
      test.setTimeout(TEST_TIMEOUT_MS);
      if (!(await openRescheduleCalendar(listingPage, reschedulePage))) {
        test.skip(true, "No reschedulable appointment to open a calendar from.");
        return;
      }
      const targetDate = await reschedulePage.findFirstBookableDate();
      if (!targetDate) {
        test.skip(true, "No bookable date currently available.");
        return;
      }
      await reschedulePage.openSlotModal(targetDate);
      await reschedulePage.incrementSlot(MORNING, 1);
      await reschedulePage.saveSlotChanges();

      await test.step("Wait 15 minutes with the slot held but not yet confirmed", async () => {
        await reschedulePage.page.waitForTimeout(FIFTEEN_MIN_MS);
      });

      await test.step("Expected: still able to confirm the reschedule without error after the wait", async () => {
        await reschedulePage.confirmReschedule(true);
        await reschedulePage.doneBtn.waitFor({ state: "visible", timeout: 10000 });
      });
    });

    test("SC_SCB_TS24: Reschedule to 15 Minutes Hold Booking - Slot fully booked", async ({
      listingPage,
      reschedulePage,
      browser,
    }, testInfo) => {
      test.setTimeout(TEST_TIMEOUT_MS);
      if (!ENV.ucd2Username || !ENV.ucd2Password) {
        test.skip(true, "No second UCD account configured — key one into the runner's 'UCD (2nd account) Login'.");
        return;
      }
      if (!(await openRescheduleCalendar(listingPage, reschedulePage))) {
        test.skip(true, "No reschedulable appointment to open a calendar from.");
        return;
      }
      const targetDate = await reschedulePage.findDateWithSlotRoom(MORNING, 1);
      if (!targetDate) {
        test.skip(true, "No date with morning-session room currently available.");
        return;
      }
      await reschedulePage.openSlotModal(targetDate);
      const before = await reschedulePage.getModalSlotBooked(MORNING);
      await reschedulePage.incrementSlot(MORNING, 1);
      await reschedulePage.saveSlotChanges();

      await test.step("Wait 15 minutes with UCD A's slot held but not yet confirmed", async () => {
        await reschedulePage.page.waitForTimeout(FIFTEEN_MIN_MS);
      });

      // UCD B: a plain fresh purchase into the same date/slot (the CSV
      // doesn't require B to also use the reschedule entry point — any
      // path that fills the remaining room proves the same underlying rule).
      const ucdBCtx = await openTrackedContext(browser, testInfo);
      const ucdBPage = await ucdBCtx.newPage();
      let bBooked = false;
      try {
        const LoginPage = (await import("../pages/LoginPage")).LoginPage;
        const SoftwareInstallationPage = (await import("../pages/SoftwareInstallationPage")).SoftwareInstallationPage;
        const SlotPickerComponent = (await import("../pages/SlotPickerComponent")).SlotPickerComponent;
        await new LoginPage(ucdBPage).loginAsUCD(ENV.ucd2Username, ENV.ucd2Password);
        const siB = new SoftwareInstallationPage(ucdBPage);
        const slotB = new SlotPickerComponent(ucdBPage);
        await siB.purchaseInstallation(before.max - before.booked);
        await slotB.openSlotModal(targetDate);
        await slotB.incrementSlot(MORNING, before.max - before.booked);
        await slotB.saveSlotChanges();
        await slotB.confirmAppointment();
        bBooked = slotB.page.url().includes("submitted.do");
      } finally {
        await closeTrackedContext(ucdBCtx, testInfo, "UCD B books the same slot");
      }
      if (!bBooked) {
        test.skip(true, "Could not arrange UCD B to fill the remaining room in this slot.");
        return;
      }

      await test.step("Expected (UCD A): reschedule confirm is blocked — slot no longer available", async () => {
        // Not confirmReschedule() here — that assumes the "are you sure you
        // want to reschedule?" dialog always appears next, but with the
        // slot now exhausted the app may show the slot-unavailable popup
        // instead, which confirmReschedule()'s waitForDialog() doesn't
        // account for.
        await reschedulePage.confirmBookingBtn.click();
        const shown = await reschedulePage.unavailOverlay.waitFor({ state: "visible", timeout: 8000 }).then(() => true).catch(() => false);
        expect(shown, "expected the slot-unavailable popup after UCD B took the last unit").toBe(true);
      });
    });
  });

  // NOTE: BO/CSE capacity is intentionally NOT tested here. Per SRD 2.3.2.7
  // #2 rule 3 the 3-per-slot (6/day) cap binds UCD Portal bookings only; for
  // CSE the counter is informational. The "can CSE add past a full slot"
  // behaviour lives in add-appointment-bo.spec.ts, not as a capacity limit.
});
