import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

test.describe("Add Appointment (BO)", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
  });

  test("Add Appointment - Offline Purchase", async ({
    boCalendarPage,
  }) => {
    // Scenario: UCD purchased offline (not via portal). CSE adds manually.
    await boCalendarPage.navigate();

    const targetDate = boCalendarPage.daysFromToday(3);

    // Act: CSE clicks "Add Appointment", selects company, picks slot
    await boCalendarPage.addAppointment({
      date: targetDate,
      slot: "morning",
      companyName: "Test Company Offline",
      units: 1,
    });

    // Expected:
    // 1. Appointment created successfully on the calendar
    // 2. NOT bound by the 6-slot UCD capacity — CSE can always add
    // 3. Schedule Confirmed email sent to UCD:
    //    From: support@eauto.my
    //    Subject: eAuto: Your Software Installation Appointment is Confirmed - [Company Name]
    //    Body: table with #, Date, Time, Units + CSE contact 03-27798899
    await boCalendarPage.navigate();
    const slotCount = await boCalendarPage.getSlotCount(targetDate);
    expect(slotCount.used).toBeGreaterThan(0);
  });

  test("Add Appointment - Partial Booking Call-in", async ({
    boCalendarPage,
  }) => {
    // Scenario: UCD bought 3 units online, booked 1 slot via portal.
    // Calls in to arrange remaining 2.
    await boCalendarPage.navigate();

    const targetDate = boCalendarPage.daysFromToday(4);

    // Act: CSE adds 2 appointments for the remaining units
    await boCalendarPage.addAppointment({
      date: targetDate,
      slot: "morning",
      companyName: "Test Company Partial",
      units: 1,
    });

    await boCalendarPage.addAppointment({
      date: targetDate,
      slot: "afternoon",
      companyName: "Test Company Partial",
      units: 1,
    });

    // Expected:
    // 1. Both appointments created successfully
    // 2. Linked to the same purchase/company
    // 3. Each appointment = 1 separate listing entry in BO
    //    (multi-slot → split into separate entries)
    // 4. Confirmation email sent for each
    await boCalendarPage.navigate();
    const slotCount = await boCalendarPage.getSlotCount(targetDate);
    expect(slotCount.used).toBeGreaterThanOrEqual(2);
  });

  test("Full date booking — CSE can still add", async ({
    boCalendarPage,
  }) => {
    // Precondition: a date with 6/6 UCD slots already booked
    // (requires seeded data or prior tests to fill all 6 UCD slots)
    await boCalendarPage.navigate();

    // Find or use a date that is known to be full (6/6 from UCD bookings)
    const fullDate = boCalendarPage.daysFromToday(3);

    // Act: CSE adds an appointment on the full date
    await boCalendarPage.addAppointment({
      date: fullDate,
      slot: "morning",
      companyName: "Test Company FullDate",
      units: 1,
    });

    // Expected:
    // 1. Allowed — CSE additions are NOT bound by the 6/day capacity
    // 2. The capacity counter is informational only for CSE
    // 3. Appointment created successfully
    // NOTE: Verify whether the counter shows 7/6 or stays at 6/6
    // with a separate CSE count. This is a clarification point.
    await boCalendarPage.navigate();
    const slotCount = await boCalendarPage.getSlotCount(fullDate);
    // CSE appointment should exist regardless of UCD capacity
  });

  test("Morning Slot Booking", async ({
    boCalendarPage,
  }) => {
    await boCalendarPage.navigate();

    const targetDate = boCalendarPage.daysFromToday(5);

    // Act: CSE adds appointment to morning slot (10:00am - 12:00pm)
    await boCalendarPage.addAppointment({
      date: targetDate,
      slot: "morning",
      companyName: "Test Company Morning",
      units: 1,
    });

    // Expected:
    // 1. Appointment booked under morning slot (10:00am - 12:00pm)
    // 2. Morning capacity indicator updated (e.g. "Morning - 1")
    // 3. Afternoon slot unaffected
    await boCalendarPage.navigate();
    const indicator = await boCalendarPage.getSlotCapacityIndicator(targetDate, "morning");
    expect(indicator).toContain("1");
  });

  test("Evening Slot Booking", async ({
    boCalendarPage,
  }) => {
    await boCalendarPage.navigate();

    const targetDate = boCalendarPage.daysFromToday(5);

    // Act: CSE adds appointment to afternoon slot (2:00pm - 4:00pm)
    await boCalendarPage.addAppointment({
      date: targetDate,
      slot: "afternoon",
      companyName: "Test Company Evening",
      units: 1,
    });

    // Expected:
    // 1. Appointment booked under afternoon slot (2:00pm - 4:00pm)
    // 2. Afternoon capacity indicator updated (e.g. "Afternoon - 1")
    // 3. Morning slot unaffected
    await boCalendarPage.navigate();
    const indicator = await boCalendarPage.getSlotCapacityIndicator(targetDate, "afternoon");
    expect(indicator).toContain("1");
  });
});
