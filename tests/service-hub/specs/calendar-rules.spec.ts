import { test, expect } from "../fixtures/test-fixtures";
import type { ReschedulePage } from "../pages/ReschedulePage";
import type { ServiceRequestListingPage } from "../pages/ServiceRequestListingPage";
import type { LoginPage } from "../pages/LoginPage";
import { ENV } from "../utils/config";

/**
 * UCD calendar date rules (SRD 2.3.2.1 #3–5). These are VIEW-only checks —
 * we open the UCD slot-picker calendar via an existing appointment's
 * Reschedule page (so no new booking/payment is made) and assert which dates
 * are selectable. A date is "blocked" when it is greyed out (si-muted) or not
 * rendered at all (outside the current+next-month window).
 *
 * Each test skips (rather than fails) if the account currently has no
 * reschedulable appointment to open a calendar from.
 */

async function openCalendar(
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

test.describe("Calendar Rules (UCD)", () => {
  test("Book for current day and the next day", async ({ loginPage, listingPage, reschedulePage }) => {
    if (!(await openCalendar(loginPage, listingPage, reschedulePage))) {
      test.skip(true, "No reschedulable appointment to open a calendar from.");
      return;
    }
    await test.step("Expected: today and tomorrow are greyed out / unclickable", async () => {
      expect(await reschedulePage.isDayBlocked(reschedulePage.today())).toBe(true);
      expect(await reschedulePage.isDayBlocked(reschedulePage.daysFromToday(1))).toBe(true);
    });
  });

  test("Book for previous dates", async ({ loginPage, listingPage, reschedulePage }) => {
    if (!(await openCalendar(loginPage, listingPage, reschedulePage))) {
      test.skip(true, "No reschedulable appointment to open a calendar from.");
      return;
    }
    const y = reschedulePage.yesterday();
    await test.step("Expected: a previous date shows no slot count and is not clickable", async () => {
      expect(await reschedulePage.isDayBlocked(y)).toBe(true);
      expect(await reschedulePage.hasSlotBadge(y)).toBe(false);
    });
  });

  test("Book future dates more than 2 months", async ({ loginPage, listingPage, reschedulePage }) => {
    if (!(await openCalendar(loginPage, listingPage, reschedulePage))) {
      test.skip(true, "No reschedulable appointment to open a calendar from.");
      return;
    }
    // SRD 2.3.2.1 #3: only the current + following month are shown, so a date
    // 3 months out is never reachable/selectable.
    const far = reschedulePage.dateMonthsAhead(3);
    await test.step(`Expected: ${far} (>2 months out) is not selectable`, async () => {
      expect(await reschedulePage.isDayBlocked(far)).toBe(true);
    });
  });

  test("Book weekend dates", async ({ loginPage, listingPage, reschedulePage }) => {
    if (!(await openCalendar(loginPage, listingPage, reschedulePage))) {
      test.skip(true, "No reschedulable appointment to open a calendar from.");
      return;
    }
    const weekend = reschedulePage.nextWeekend();
    await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
      expect(await reschedulePage.isDayBlocked(weekend)).toBe(true);
    });
  });

  test("Book Public Holiday", async ({ loginPage, listingPage, reschedulePage }) => {
    const ph = ENV.publicHoliday;
    if (!ph) {
      test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
      return;
    }
    if (!(await openCalendar(loginPage, listingPage, reschedulePage))) {
      test.skip(true, "No reschedulable appointment to open a calendar from.");
      return;
    }
    await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
      expect(await reschedulePage.isDayBlocked(ph)).toBe(true);
    });
  });
});
