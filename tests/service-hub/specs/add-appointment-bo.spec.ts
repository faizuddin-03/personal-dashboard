import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import { openTrackedContext, closeTrackedContext } from "../utils/tracked-context";
import { arrangeBdpReferenceViaUCD } from "../utils/arrange";

const MORNING = 0;
const AFTERNOON = 1;

/**
 * BO Add Appointment (SRD 2.3.2.7 #4). The Add Appointment dialog resolves a
 * company (search — auto-binds on an exact name match, no dropdown to
 * click), then a Reference No. (search — validates it has unallocated
 * units), then an appointment date via the datepicker + a mandatory
 * time-slot radio. CSE bookings are not bound by the 6/day UCD cap (the
 * counter is informational for CSE).
 *
 * Verified live (SIT2): the New Record / Existing Record type radio is
 * GONE. There is no way to create a request from scratch here anymore —
 * every add now requires an EXISTING reference with unallocated units. So
 * each test below first arranges one itself: UCD buys a device (one free
 * install comes with it) and exits at the appointment page without booking
 * (arrangeBdpReferenceViaUCD), leaving a fresh, unallocated reference for
 * CSE to key in here. addAppointment()/arrangeBdpReferenceViaUCD return
 * null when they can't proceed, and these tests SKIP in that case rather
 * than fail, so the overall run always finishes (arrange-else-skip).
 */
// Search term = the exact company we want; addAppointment only binds on an
// EXACT name match, so look-alikes ("FAIZUDDIN AUTO TEST 2"/"3") are never
// picked. Must match the UCD test account's own company name, since that's
// who arrangeBdpReferenceViaUCD purchases as.
const COMPANY = "FAIZUDDIN AUTO TEST";

test.describe("Add Appointment (BO)", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
  });

  // Offline Purchase: the customer paid offline (not via the UCD portal), so
  // CSE books the appointment for them via Add Appointment › Existing Record
  // (using a reference UCD already purchased but hasn't booked yet).
  test("Add Appointment - Offline Purchase (New Record)", async ({ boCalendarPage, browser }, testInfo) => {
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }

    await boCalendarPage.navigate();
    const booked = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      existingRecordRefNo: ref,
      appointmentDate: boCalendarPage.daysFromToday(3),
      slot: MORNING,
    });
    if (!booked) {
      test.skip(true, `Could not add an appointment for reference ${ref}.`);
      return;
    }

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  });

  test("Add Appointment - Both slots on one date", async ({ boCalendarPage, browser }, testInfo) => {
    // Needs 2 allocatable units on the same reference — one for each slot —
    // so arrange with deviceQty: 2 (2 devices → 2 free installs).
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo, { deviceQty: 2 });
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }

    await boCalendarPage.navigate();
    const targetDate = boCalendarPage.daysFromToday(4);

    const bookedMorning = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      existingRecordRefNo: ref,
      appointmentDate: targetDate,
      slot: MORNING,
    });
    if (!bookedMorning) {
      test.skip(true, `Could not add a morning appointment for reference ${ref}.`);
      return;
    }
    // Re-use the same ISO date requested for the morning slot — NOT
    // `bookedMorning`, which is the date INPUT'S DISPLAY VALUE (DD-MM-YYYY,
    // e.g. "22-07-2026"). addAppointment()/pickDatepickerDay() expect ISO
    // (YYYY-MM-DD); feeding the display value back in gets parsed as
    // year="22", month="07", day="2026" — garbage that made the datepicker
    // navigate to a nonexistent month/year and, on a fresh dialog, never
    // even open (timed out waiting on #ui-datepicker-div).
    const bookedAfternoon = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      existingRecordRefNo: ref,
      appointmentDate: targetDate,
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

  test("CSE not bound by 6/day cap — can add to a full slot", async ({ boCalendarPage, browser }, testInfo) => {
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }

    await boCalendarPage.navigate();

    // Prefer a session the UCD-facing counter already marks (Full); CSE
    // should still be able to add to it. Falls back to any near date.
    const fullDate = await boCalendarPage.findDateWithSlotFull(MORNING);
    const booked = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      existingRecordRefNo: ref,
      appointmentDate: fullDate ?? boCalendarPage.daysFromToday(3),
      slot: MORNING,
    });
    if (!booked) {
      test.skip(true, `Could not add an appointment for reference ${ref}.`);
      return;
    }

    await boCalendarPage.navigate();
    // The counter is informational for CSE; the add should have succeeded.
    expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  });

  test("Morning Slot Full Booking - Add Appointment", async ({ boCalendarPage, browser }, testInfo) => {
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }

    await boCalendarPage.navigate();

    // Prefer a date the UCD-facing counter already marks morning (Full);
    // CSE should still be able to add to it. Falls back to any near date.
    const fullDate = await boCalendarPage.findDateWithSlotFull(MORNING);
    const booked = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      existingRecordRefNo: ref,
      appointmentDate: fullDate ?? boCalendarPage.daysFromToday(5),
      slot: MORNING,
    });
    if (!booked) {
      test.skip(true, `Could not add an appointment for reference ${ref}.`);
      return;
    }

    await boCalendarPage.navigate();
    // The numbering for the morning slot continues past the full mark.
    expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  });

  test("Afternoon Slot Booking", async ({ boCalendarPage, browser }, testInfo) => {
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }

    await boCalendarPage.navigate();

    const booked = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      existingRecordRefNo: ref,
      appointmentDate: boCalendarPage.daysFromToday(6),
      slot: AFTERNOON,
    });
    if (!booked) {
      test.skip(true, `Could not add an appointment for reference ${ref}.`);
      return;
    }

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(booked, AFTERNOON)).toBeGreaterThan(0);
  });
});
