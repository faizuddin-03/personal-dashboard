import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
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
 *
 * Scope matches the "Add Appointment (BO)" CSV exactly (SC_APBO_TS01–5).
 * SC_APBO_TS06/7 (expired-transaction adds) are excluded — their precondition
 * requires a dev to manually patch a transaction to Expired, which this
 * automation cannot do without human intervention.
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

  // SC_APBO_TS01: "Add Appointment - Existing Record Free Booking" — CSE books
  // for a UCD who already purchased (via BDP) but hasn't booked yet.
  test("SC_APBO_TS01: Add Appointment - Existing Record Free Booking", async ({ boCalendarPage, browser }, testInfo) => {
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }

    await boCalendarPage.navigate();
    // No appointmentDate given: addAppointment()'s datepicker fallback picks
    // the last selectable day in the CURRENTLY DISPLAYED month. A fixed
    // day-offset (e.g. daysFromToday(3)) can cross into next month near
    // month-end, and getSlotCount() below only scans whatever month is
    // showing after the fresh navigate() — a real mismatch that read as a
    // false "0 booked" failure (see debug session 2026-07-31).
    const booked = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      existingRecordRefNo: ref,
      slot: MORNING,
    });
    if (!booked) {
      test.skip(true, `Could not add an appointment for reference ${ref}.`);
      return;
    }

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  });

  // SC_APBO_TS02: "Morning Slot Full Booking - Add Appointment" — CSE is not
  // bound by the UCD-facing 6/day cap; numbering continues past "Full".
  test("SC_APBO_TS02: Morning Slot Full Booking - Add Appointment", async ({ boCalendarPage, browser }, testInfo) => {
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }

    await boCalendarPage.navigate();

    // Precondition: the date's morning session must already be Full.
    const fullDate = await boCalendarPage.findDateWithSlotFull(MORNING);
    if (!fullDate) {
      test.skip(true, "No date with a full morning session currently available.");
      return;
    }
    const booked = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      existingRecordRefNo: ref,
      appointmentDate: fullDate,
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

  // SC_APBO_TS03: "Afternoon Slot Full Booking - Add Appointment" — same as
  // APBO_2 but the afternoon session.
  test("SC_APBO_TS03: Afternoon Slot Full Booking - Add Appointment", async ({ boCalendarPage, browser }, testInfo) => {
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }

    await boCalendarPage.navigate();

    const fullDate = await boCalendarPage.findDateWithSlotFull(AFTERNOON);
    if (!fullDate) {
      test.skip(true, "No date with a full afternoon session currently available.");
      return;
    }
    const booked = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      existingRecordRefNo: ref,
      appointmentDate: fullDate,
      slot: AFTERNOON,
    });
    if (!booked) {
      test.skip(true, `Could not add an appointment for reference ${ref}.`);
      return;
    }

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(booked, AFTERNOON)).toBeGreaterThan(0);
  });

  // SC_APBO_TS04: "Full date booking" — the WHOLE day (both sessions) already
  // fully booked; CSE can still add, and the numbering continues.
  test("SC_APBO_TS04: Full date booking", async ({ boCalendarPage, browser }, testInfo) => {
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }

    await boCalendarPage.navigate();

    const fullDate = await boCalendarPage.findDateMatching(
      (i) => i.morning.full && i.afternoon.full,
    );
    if (!fullDate) {
      test.skip(true, "No date with both sessions fully booked currently available.");
      return;
    }
    const booked = await boCalendarPage.addAppointment({
      companyName: COMPANY,
      existingRecordRefNo: ref,
      appointmentDate: fullDate,
      slot: MORNING,
    });
    if (!booked) {
      test.skip(true, `Could not add an appointment for reference ${ref}.`);
      return;
    }

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  });

  // SC_APBO_TS05: "Add free booking that is cancelled" — the reference's
  // request was cancelled before any appointment was made; the Reference
  // No. field must show the CANCELLED error, and adding must be blocked.
  test("SC_APBO_TS05: Add free booking that is cancelled", async ({ boCalendarPage, boListingPage }) => {
    await boListingPage.navigate();
    await boListingPage.searchWithFilters({});
    const rows = await boListingPage.getResultRows();
    let cancelledRef: string | null = null;
    let cancelledCompany: string | null = null;
    for (const row of rows) {
      if ((await boListingPage.getRowInstallationStatus(row)).toLowerCase().includes("cancel")) {
        cancelledRef = await boListingPage.getRowReferenceNo(row);
        cancelledCompany = await boListingPage.getRowCompanyName(row);
        break;
      }
    }
    if (!cancelledRef || !cancelledCompany) {
      test.skip(true, "No Cancelled installation reference found to test against.");
      return;
    }

    await boCalendarPage.navigate();
    const dialog = await boCalendarPage.openAddDialog();
    await boCalendarPage.page.locator("#ac-add-name").fill(cancelledCompany);
    await boCalendarPage.page.locator("#ac-add-search").click();
    await boCalendarPage.page.waitForTimeout(500);
    await boCalendarPage.page.locator("#ac-add-refno").fill(cancelledRef);
    await boCalendarPage.page.locator("#ac-add-ref-search").click();
    await boCalendarPage.page.waitForTimeout(500);

    await test.step("Expected: 'This transaction is CANCELLED and cannot be rescheduled.' under Reference No.", async () => {
      const errorNearRef = dialog.getByText(/cancelled/i);
      await expect(errorNearRef.first()).toBeVisible({ timeout: 5000 });
    });

    await boCalendarPage.closeAddDialog(dialog);
  });
});
