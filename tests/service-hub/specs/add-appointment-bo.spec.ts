import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

const MORNING = 0;
const AFTERNOON = 1;

test.describe("Add Appointment (BO)", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
  });

  test("Add Appointment - Offline Purchase", async ({
    boCalendarPage,
  }) => {
    await boCalendarPage.navigate();

    const targetDate = boCalendarPage.daysFromToday(3);

    await boCalendarPage.addAppointment({
      date: targetDate,
      slot: MORNING,
      companyName: "Test Company Offline",
      units: 1,
    });

    await boCalendarPage.navigate();
    const slotCount = await boCalendarPage.getSlotCount(targetDate);
    expect(slotCount.used).toBeGreaterThan(0);
  });

  test("Add Appointment - Partial Booking Call-in", async ({
    boCalendarPage,
  }) => {
    await boCalendarPage.navigate();

    const targetDate = boCalendarPage.daysFromToday(4);

    await boCalendarPage.addAppointment({
      date: targetDate,
      slot: MORNING,
      companyName: "Test Company Partial",
      units: 1,
    });

    await boCalendarPage.addAppointment({
      date: targetDate,
      slot: AFTERNOON,
      companyName: "Test Company Partial",
      units: 1,
    });

    await boCalendarPage.navigate();
    const slotCount = await boCalendarPage.getSlotCount(targetDate);
    expect(slotCount.used).toBeGreaterThanOrEqual(2);
  });

  test("Full date booking — CSE can still add", async ({
    boCalendarPage,
  }) => {
    await boCalendarPage.navigate();

    const fullDate = boCalendarPage.daysFromToday(3);

    await boCalendarPage.addAppointment({
      date: fullDate,
      slot: MORNING,
      companyName: "Test Company FullDate",
      units: 1,
    });

    await boCalendarPage.navigate();
  });

  test("Morning Slot Booking", async ({
    boCalendarPage,
  }) => {
    await boCalendarPage.navigate();

    const targetDate = boCalendarPage.daysFromToday(5);

    await boCalendarPage.addAppointment({
      date: targetDate,
      slot: MORNING,
      companyName: "Test Company Morning",
      units: 1,
    });

    await boCalendarPage.navigate();
    const indicator = await boCalendarPage.getSlotCapacityIndicator(targetDate, MORNING);
    expect(indicator).toContain("1");
  });

  test("Evening Slot Booking", async ({
    boCalendarPage,
  }) => {
    await boCalendarPage.navigate();

    const targetDate = boCalendarPage.daysFromToday(5);

    await boCalendarPage.addAppointment({
      date: targetDate,
      slot: AFTERNOON,
      companyName: "Test Company Evening",
      units: 1,
    });

    await boCalendarPage.navigate();
    const indicator = await boCalendarPage.getSlotCapacityIndicator(targetDate, AFTERNOON);
    expect(indicator).toContain("1");
  });
});
