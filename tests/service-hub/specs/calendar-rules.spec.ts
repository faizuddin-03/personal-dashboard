import { test, expect } from "../fixtures/test-fixtures";
import type { ReschedulePage } from "../pages/ReschedulePage";
import type { ServiceRequestListingPage } from "../pages/ServiceRequestListingPage";
import type { LoginPage } from "../pages/LoginPage";
import type { SoftwareInstallationPage } from "../pages/SoftwareInstallationPage";
import type { SlotPickerComponent } from "../pages/SlotPickerComponent";
import { ENV } from "../utils/config";

/**
 * UCD calendar date rules (SRD 2.3.2.1 #3–5), both CSV entry points:
 *  - "Add New" (SC_SCB_TS11/13/15/17/19): a fresh Software Installation
 *    purchase, checked on its own slot-picker calendar.
 *  - "Reschedule" (SC_SCB_TS12/14/16/18/20): the SAME rule, checked via an
 *    existing appointment's Reschedule calendar instead (opened via the
 *    Service Request Listing) — no new booking/payment is made either way,
 *    these are VIEW-only checks of which dates are selectable.
 * A date is "blocked" when it is greyed out (si-muted) or not rendered at
 * all (outside the current+next-month window).
 *
 * Each test skips (rather than fails) if its precondition can't be arranged
 * (e.g. no reschedulable appointment currently exists on the account).
 */

async function openRescheduleCalendar(
  loginPage: LoginPage,
  listingPage: ServiceRequestListingPage,
  reschedulePage: ReschedulePage,
): Promise<boolean> {
  await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  await listingPage.navigate();
  await listingPage.searchBtn.click();
  await listingPage.waitForNav();
  const rows = await listingPage.getResultRows();
  for (const row of rows) {
    if (await listingPage.hasRescheduleAction(row)) {
      await listingPage.clickReschedule(row);
      await reschedulePage.calendar.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
      return true;
    }
  }
  return false;
}

async function openAddNewCalendar(
  loginPage: LoginPage,
  softwareInstallationPage: SoftwareInstallationPage,
): Promise<void> {
  await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  await softwareInstallationPage.purchaseInstallation(1);
}

test.describe("Calendar Rules (UCD)", () => {
  test.describe("Add New", () => {
    test("SC_SCB_TS11: Book for current day and the next day", async ({ loginPage, softwareInstallationPage, slotPicker }) => {
      await openAddNewCalendar(loginPage, softwareInstallationPage);
      await test.step("Expected: today and tomorrow are greyed out / unclickable", async () => {
        expect(await slotPicker.isDayBlocked(slotPicker.today())).toBe(true);
        expect(await slotPicker.isDayBlocked(slotPicker.daysFromToday(1))).toBe(true);
      });
    });

    test("SC_SCB_TS13: Book for previous dates", async ({ loginPage, softwareInstallationPage, slotPicker }) => {
      await openAddNewCalendar(loginPage, softwareInstallationPage);
      const y = slotPicker.yesterday();
      await test.step("Expected: a previous date shows no slot count and is not clickable", async () => {
        expect(await slotPicker.isDayBlocked(y)).toBe(true);
        expect(await slotPicker.hasSlotBadge(y)).toBe(false);
      });
    });

    test("SC_SCB_TS15: Book future dates more than 2 months", async ({ loginPage, softwareInstallationPage, slotPicker }) => {
      await openAddNewCalendar(loginPage, softwareInstallationPage);
      // SRD 2.3.2.1 #3: only the current + following month are shown, so a
      // date 3 months out is never reachable/selectable.
      const far = slotPicker.dateMonthsAhead(3);
      await test.step(`Expected: ${far} (>2 months out) is not selectable`, async () => {
        expect(await slotPicker.isDayBlocked(far)).toBe(true);
      });
    });

    test("SC_SCB_TS17: Book weekend dates", async ({ loginPage, softwareInstallationPage, slotPicker }) => {
      await openAddNewCalendar(loginPage, softwareInstallationPage);
      const weekend = slotPicker.nextWeekend();
      await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
        expect(await slotPicker.isDayBlocked(weekend)).toBe(true);
      });
    });

    test("SC_SCB_TS19: Book Public Holiday", async ({ loginPage, softwareInstallationPage, slotPicker }) => {
      const ph = ENV.publicHoliday;
      if (!ph) {
        test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
        return;
      }
      await openAddNewCalendar(loginPage, softwareInstallationPage);
      await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
        expect(await slotPicker.isDayBlocked(ph)).toBe(true);
      });
    });
  });

  test.describe("Reschedule", () => {
    test("SC_SCB_TS12: Reschedule to current day and the next day", async ({ loginPage, listingPage, reschedulePage }) => {
      if (!(await openRescheduleCalendar(loginPage, listingPage, reschedulePage))) {
        test.skip(true, "No reschedulable appointment to open a calendar from.");
        return;
      }
      await test.step("Expected: today and tomorrow are greyed out / unclickable", async () => {
        expect(await reschedulePage.isDayBlocked(reschedulePage.today())).toBe(true);
        expect(await reschedulePage.isDayBlocked(reschedulePage.daysFromToday(1))).toBe(true);
      });
    });

    test("SC_SCB_TS14: Reschedule to previous dates", async ({ loginPage, listingPage, reschedulePage }) => {
      if (!(await openRescheduleCalendar(loginPage, listingPage, reschedulePage))) {
        test.skip(true, "No reschedulable appointment to open a calendar from.");
        return;
      }
      const y = reschedulePage.yesterday();
      await test.step("Expected: a previous date shows no slot count and is not clickable", async () => {
        expect(await reschedulePage.isDayBlocked(y)).toBe(true);
        expect(await reschedulePage.hasSlotBadge(y)).toBe(false);
      });
    });

    test("SC_SCB_TS16: Reschedule to future dates more than 2 months", async ({ loginPage, listingPage, reschedulePage }) => {
      if (!(await openRescheduleCalendar(loginPage, listingPage, reschedulePage))) {
        test.skip(true, "No reschedulable appointment to open a calendar from.");
        return;
      }
      const far = reschedulePage.dateMonthsAhead(3);
      await test.step(`Expected: ${far} (>2 months out) is not selectable`, async () => {
        expect(await reschedulePage.isDayBlocked(far)).toBe(true);
      });
    });

    test("SC_SCB_TS18: Reschedule to weekend dates", async ({ loginPage, listingPage, reschedulePage }) => {
      if (!(await openRescheduleCalendar(loginPage, listingPage, reschedulePage))) {
        test.skip(true, "No reschedulable appointment to open a calendar from.");
        return;
      }
      const weekend = reschedulePage.nextWeekend();
      await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
        expect(await reschedulePage.isDayBlocked(weekend)).toBe(true);
      });
    });

    test("SC_SCB_TS20: Reschedule to Public Holiday", async ({ loginPage, listingPage, reschedulePage }) => {
      const ph = ENV.publicHoliday;
      if (!ph) {
        test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
        return;
      }
      if (!(await openRescheduleCalendar(loginPage, listingPage, reschedulePage))) {
        test.skip(true, "No reschedulable appointment to open a calendar from.");
        return;
      }
      await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
        expect(await reschedulePage.isDayBlocked(ph)).toBe(true);
      });
    });
  });
});
