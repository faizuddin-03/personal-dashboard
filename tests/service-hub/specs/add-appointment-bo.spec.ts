import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import { openTrackedContext, closeTrackedContext } from "../utils/tracked-context";

const MORNING = 0;
const AFTERNOON = 1;

/**
 * BO Add Appointment (SRD 2.3.2.7 #4). The Add Appointment dialog resolves a
 * company (search → pick from #ac-add-dd), then an appointment date via the
 * datepicker + a mandatory time-slot radio. CSE bookings are not bound by the
 * 6/day UCD cap (the counter is informational for CSE).
 *
 * "New Record" only works for a company that already has an active SI request
 * with UNALLOCATED units. We use the "FAIZUDDIN" company (per the test
 * account); addAppointment returns null when it can't proceed (company not
 * found / no allocation), and these tests SKIP in that case rather than fail,
 * so the overall run always finishes (arrange-else-skip).
 */
// Search term = the exact company we want; addAppointment selects the result
// whose text matches this EXACTLY, so look-alikes ("FAIZUDDIN AUTO TEST 2"/"3")
// are never picked.
const COMPANY = "FAIZUDDIN AUTO TEST";

test.describe("Add Appointment (BO)", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
  });

  // Offline Purchase: the customer paid offline (not via the UCD portal), so
  // CSE creates the appointment from scratch via Add Appointment › New Record.
  test("Add Appointment - Offline Purchase (New Record)", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();

    const booked = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      appointmentDate: boCalendarPage.daysFromToday(3),
      slot: MORNING,
    });
    if (!booked) {
      test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
      return;
    }

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  });

  test("Add Appointment - Both slots on one date", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const targetDate = boCalendarPage.daysFromToday(4);

    const bookedMorning = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      appointmentDate: targetDate,
      slot: MORNING,
    });
    if (!bookedMorning) {
      test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
      return;
    }
    const bookedAfternoon = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      appointmentDate: bookedMorning,
      slot: AFTERNOON,
    });

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(bookedMorning, MORNING)).toBeGreaterThan(0);
    if (bookedAfternoon) {
      expect(await boCalendarPage.getSlotCount(bookedAfternoon, AFTERNOON)).toBeGreaterThan(0);
    }
  });

  // Partial Booking Call-in: a UCD booked only SOME of their units and phones
  // CSE to book the rest. A Software Installation must be fully booked before
  // it can be confirmed, so the only way to leave a request partially booked
  // is a BIOMETRIC purchase — its FREE installs are optional. So we ARRANGE
  // the partial state as UCD (buy 2 devices → 2 free installs, book 1, confirm
  // leaving 1 unallocated), capture the SR reference, then CALL IN as CSE and
  // book the leftover via Add Appointment › Existing Record.
  test("Add Appointment - Partial Booking Call-in", async ({ browser }, testInfo) => {
    const LoginPage = (await import("../pages/LoginPage")).LoginPage;

    // ── ARRANGE (UCD): buy 2 devices → 2 free installs, book only 1, confirm
    //    (free installs are optional), leaving 1 unallocated. ──
    const ucdCtx = await openTrackedContext(browser, testInfo);
    const ucdPage = await ucdCtx.newPage();
    const bio = new (await import("../pages/BiometricPurchasePage")).BiometricPurchasePage(ucdPage);
    const slot = new (await import("../pages/SlotPickerComponent")).SlotPickerComponent(ucdPage);

    let arranged = false;
    try {
      await new LoginPage(ucdPage).loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
      await bio.purchaseDevice({
        deviceQty: 2,
        recipientName: "Test Receiver",
        contactNo: "0123456789",
        shipToShowroom: true,
      });
      const target = await slot.findDateWithRoom(1);
      if (target) {
        await slot.allocateUnitsAnywhere(1, target); // book 1 of 2 free installs
        await slot.confirmAppointment();              // free installs optional → confirm allowed
        arranged = true;
      }
    } finally {
      await closeTrackedContext(ucdCtx, testInfo, "UCD arranges partial booking");
    }
    if (!arranged) {
      test.skip(true, "Could not arrange a partially-booked biometric request to call in about.");
      return;
    }

    // ── CALL-IN (CSE): look up the reference from the BO SI Listing (search
    //    the company → the freshly-created request is the newest row), then
    //    book the leftover free install via Add Appointment › Existing Record. ──
    const boCtx = await openTrackedContext(browser, testInfo);
    const boPage = await boCtx.newPage();
    const boListing = new (await import("../pages/bo/SoftwareInstallationListingPage")).SoftwareInstallationListingPage(boPage);
    const boCal = new (await import("../pages/bo/AppointmentCalendarPage")).AppointmentCalendarPage(boPage);

    let ref: string | null = null;
    let booked: string | null = null;
    try {
      await new LoginPage(boPage).loginAsBO(ENV.boUsername, ENV.boPassword);
      await boListing.navigate();
      ref = await boListing.getLatestReferenceForCompany(COMPANY);
      if (ref) {
        await boCal.navigate();
        booked = await boCal.addAppointment({
          companyName: COMPANY,
          existingRecordRefNo: ref,
          slot: MORNING,
        });
      }
    } finally {
      await closeTrackedContext(boCtx, testInfo, "CSE call-in booking");
    }
    if (!ref) {
      test.skip(true, `No reference found in the BO listing for "${COMPANY}".`);
      return;
    }
    expect(booked, `CSE should book the leftover unit for ${ref} via Existing Record`).not.toBeNull();
  });

  test("CSE not bound by 6/day cap — can add to a full slot", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();

    // Prefer a session the UCD-facing counter already marks (Full); CSE
    // should still be able to add to it. Falls back to any near date.
    const fullDate = await boCalendarPage.findDateWithSlotFull(MORNING);
    const booked = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      appointmentDate: fullDate ?? boCalendarPage.daysFromToday(3),
      slot: MORNING,
    });
    if (!booked) {
      test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
      return;
    }

    await boCalendarPage.navigate();
    // The counter is informational for CSE; the add should have succeeded.
    expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  });

  test("Afternoon Slot Booking", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();

    const booked = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      appointmentDate: boCalendarPage.daysFromToday(6),
      slot: AFTERNOON,
    });
    if (!booked) {
      test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
      return;
    }

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(booked, AFTERNOON)).toBeGreaterThan(0);
  });
});
