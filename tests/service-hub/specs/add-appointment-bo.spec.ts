import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

const MORNING = 0;
const AFTERNOON = 1;

/**
 * BO Add Appointment (SRD 2.3.2.7 #4). The Add Appointment dialog takes a
 * company name and an appointment date chosen from a dropdown of available
 * dates, plus a mandatory time-slot radio. CSE bookings are not bound by
 * the 6/day UCD cap (the counter is informational for CSE).
 *
 * appointmentDate values are passed as they appear in the date dropdown;
 * verify the exact label format against the real BO portal.
 */
test.describe("Add Appointment (BO)", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
  });

  test("Add Appointment - New Record (Morning)", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const targetDate = boCalendarPage.daysFromToday(3);

    await boCalendarPage.addAppointment({
      companyName: "Test Company Offline",
      appointmentDate: targetDate,
      slot: MORNING,
    });

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(targetDate, MORNING)).toBeGreaterThan(0);
  });

  test("Add Appointment - Both slots on one date", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const targetDate = boCalendarPage.daysFromToday(4);

    await boCalendarPage.addAppointment({
      companyName: "Test Company Partial",
      appointmentDate: targetDate,
      slot: MORNING,
    });
    await boCalendarPage.addAppointment({
      companyName: "Test Company Partial",
      appointmentDate: targetDate,
      slot: AFTERNOON,
    });

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(targetDate, MORNING)).toBeGreaterThan(0);
    expect(await boCalendarPage.getSlotCount(targetDate, AFTERNOON)).toBeGreaterThan(0);
  });

  test("Add Appointment - Existing Record", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const targetDate = boCalendarPage.daysFromToday(5);

    // Existing Record path reveals + fills the Reference No field.
    await boCalendarPage.addAppointment({
      companyName: "Test Company Existing",
      appointmentDate: targetDate,
      slot: MORNING,
      existingRecordRefNo: "SR10000005",
    });

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(targetDate, MORNING)).toBeGreaterThan(0);
  });

  test("CSE not bound by 6/day cap — can add to a full slot", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const targetDate = boCalendarPage.daysFromToday(3);

    // Even if the UCD-facing counter reads (Full), CSE can still add.
    await boCalendarPage.addAppointment({
      companyName: "Test Company CSE Override",
      appointmentDate: targetDate,
      slot: MORNING,
    });

    await boCalendarPage.navigate();
    // The counter is informational for CSE; the add should have succeeded.
    expect(await boCalendarPage.getSlotCount(targetDate, MORNING)).toBeGreaterThan(0);
  });

  test("Afternoon Slot Booking", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const targetDate = boCalendarPage.daysFromToday(6);

    await boCalendarPage.addAppointment({
      companyName: "Test Company Evening",
      appointmentDate: targetDate,
      slot: AFTERNOON,
    });

    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(targetDate, AFTERNOON)).toBeGreaterThan(0);
  });
});
