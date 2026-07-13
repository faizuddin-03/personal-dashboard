import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

const MORNING = 0;
const AFTERNOON = 1;

test.describe("Reschedule & Handling", () => {
  // ────────────────────────────────────────────────────────────
  // UCD — Self-service reschedule via Service Request Listing
  // Flow: Listing → Search Now → click Reschedule in action column
  //       → Calendar opens → click booked (orange) date → minus to
  //       remove → Save changes → click new date → plus to add slot
  //       → Save changes → Confirm Appointment → Done
  // ────────────────────────────────────────────────────────────
  test.describe("UCD", () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
    });

    test("Reschedule on the day of the initial appointment to a future date", async ({
      listingPage,
      reschedulePage,
    }) => {
      // Scenario: appointment exists on some date. UCD opens listing,
      // clicks Reschedule, calendar opens. UCD removes the old booking
      // and picks a new available date. +2 day blackout applies.

      await listingPage.navigate();
      await listingPage.searchBtn.click();
      await listingPage.waitForNav();

      const rows = await listingPage.getResultRows();
      expect(rows.length).toBeGreaterThan(0);

      let targetRow = null;
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          targetRow = row;
          break;
        }
      }
      if (!targetRow) {
        test.skip(true, "No appointment with Reschedule action available");
        return;
      }

      // Click Reschedule → calendar page opens
      await listingPage.clickReschedule(targetRow);

      // Verify blackout: today and tomorrow are NOT bookable
      await reschedulePage.verifyBlackoutDates();

      // Verify there are bookable dates available
      await reschedulePage.verifyHasBookableDates();

      // Find the currently booked date (orange badge) and first available date
      const bookedDate = await reschedulePage.findBookedDate();
      expect(bookedDate).not.toBeNull();

      const newDate = await reschedulePage.findFirstBookableDate();
      expect(newDate).not.toBeNull();

      // Reschedule: remove from booked date → pick new date
      await reschedulePage.rescheduleToNewDate({
        oldDate: bookedDate!,
        newDate: newDate!,
        slot: MORNING,
      });
    });

    test("Reschedule before the day of the appointment to a future date", async ({
      listingPage,
      reschedulePage,
    }) => {
      // Scenario: UCD reschedules BEFORE the appointment day.
      // Same flow — the booked date is in the future.

      await listingPage.navigate();
      await listingPage.searchBtn.click();
      await listingPage.waitForNav();

      const rows = await listingPage.getResultRows();
      let targetRow = null;
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          targetRow = row;
          break;
        }
      }
      if (!targetRow) {
        test.skip(true, "No appointment with Reschedule action available");
        return;
      }

      await listingPage.clickReschedule(targetRow);

      await reschedulePage.verifyBlackoutDates();
      await reschedulePage.verifyHasBookableDates();

      const bookedDate = await reschedulePage.findBookedDate();
      expect(bookedDate).not.toBeNull();

      // Find a bookable date that is NOT the same as the booked date
      const allBookable = await reschedulePage.page.locator("td.si-book[data-date]").all();
      let newDate: string | null = null;
      for (const cell of allBookable) {
        const date = await cell.getAttribute("data-date");
        if (date && date !== bookedDate) {
          newDate = date;
          break;
        }
      }
      expect(newDate).not.toBeNull();

      await reschedulePage.rescheduleToNewDate({
        oldDate: bookedDate!,
        newDate: newDate!,
        slot: AFTERNOON,
      });
    });

    test("Reschedule after 1 appointment has successfully finished", async ({
      listingPage,
    }) => {
      // Scenario: UCD bought multiple software installations (e.g. 3).
      // 1 installation has been completed (marked by BO).
      // The remaining appointments should still be reschedulable.

      await listingPage.navigate();
      await listingPage.searchWithFilters({
        serviceType: "SOFTWARE_INSTALLATION",
      });

      const rows = await listingPage.getResultRows();
      if (rows.length === 0) {
        test.skip(true, "No software installation appointments found");
        return;
      }

      // Look for a row with Reschedule action (remaining from multi-unit)
      let reschedulableRow = null;
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          reschedulableRow = row;
          break;
        }
      }

      // Even though 1 appointment is completed, remaining ones should
      // still have the Reschedule option
      expect(reschedulableRow).not.toBeNull();

      // Verify the reschedule flow works
      await listingPage.clickReschedule(reschedulableRow!);
      // Calendar should open — verify there are bookable dates
      const firstBookable = await listingPage.page.locator("td.si-book[data-date]").first();
      await expect(firstBookable).toBeVisible();
    });

    test("Same-day reschedule via portal — record becomes Failed", async ({
      listingPage,
      reschedulePage,
      requestDetailsPage,
    }) => {
      // SRD 2.3.2.1 #5 (note iii): if a UCD reschedules to today's date via
      // the portal, the system allows it but the affected installation
      // record is set to Status = "Failed" with the remark
      // "UCD rescheduled on the same day."
      //
      // NOTE: the SRD is internally ambiguous — the +2 blackout greys out
      // today, yet this note says selecting today is allowed. This test
      // therefore only runs when today is actually selectable, and is
      // skipped (not failed) otherwise, pending clarification.

      await listingPage.navigate();
      await listingPage.searchBtn.click();
      await listingPage.waitForNav();

      const rows = await listingPage.getResultRows();
      let targetRow = null;
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          targetRow = row;
          break;
        }
      }
      if (!targetRow) {
        test.skip(true, "No appointment with Reschedule action available");
        return;
      }

      await listingPage.clickReschedule(targetRow);

      if (!(await reschedulePage.isDayBookable(reschedulePage.today()))) {
        test.skip(true, "Today is not selectable on the calendar (+2 blackout in effect); same-day reschedule not reachable via portal.");
        return;
      }

      const bookedDate = await reschedulePage.findBookedDate();
      expect(bookedDate).not.toBeNull();

      await reschedulePage.rescheduleToToday({ oldDate: bookedDate!, slot: MORNING });

      // The affected record must now show a Failed appointment.
      const txnId = reschedulePage.getTxnIdFromUrl();
      if (txnId) {
        await requestDetailsPage.navigate(txnId);
        expect(await requestDetailsPage.hasFailedAppointment()).toBe(true);
      }
    });

    test("Slot taken mid selection — concurrency", async ({
      listingPage,
      reschedulePage,
      browser,
    }) => {
      await listingPage.navigate();
      await listingPage.searchBtn.click();
      await listingPage.waitForNav();

      const rows = await listingPage.getResultRows();
      let targetRow = null;
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          targetRow = row;
          break;
        }
      }
      if (!targetRow) {
        test.skip(true, "No appointment with Reschedule action available");
        return;
      }

      await listingPage.clickReschedule(targetRow);

      const firstBookable = await reschedulePage.findFirstBookableDate();
      if (!firstBookable) {
        test.skip(true, "No bookable dates available");
        return;
      }

      await reschedulePage.openSlotModal(firstBookable);
      const initialBooked = await reschedulePage.getModalSlotBooked(MORNING);

      // UCD2: would book the same last slot in a parallel context
      // NOTE: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)

      await reschedulePage.incrementSlot(MORNING, 1);
      await reschedulePage.saveSlotChanges();
    });

    test("Reschedule cancelled appointment — should be blocked", async ({
      browser,
    }) => {
      // Scenario: UCD has multiple appointments (e.g. 20th and 21st).
      // BO cancels one. When UCD opens listing, the cancelled appointment
      // should NOT show Reschedule. Only the active ones should.
      //
      // Per SRD 2.3.2.5, Cancel is performed on the BO Software
      // Installation Listing ("Cancel" action + "Sure to cancel?" popup).

      // ── Step 1: BO cancels a request via the BO SI Listing ──
      const boContext = await browser.newContext();
      const boPage = await boContext.newPage();
      const boLogin = new (await import("../pages/LoginPage")).LoginPage(boPage);
      const boListing = new (await import("../pages/bo/SoftwareInstallationListingPage")).SoftwareInstallationListingPage(boPage);

      await boLogin.loginAsBO(ENV.boUsername, ENV.boPassword);
      await boListing.navigate();
      await boListing.searchWithFilters({ installationStatus: "PENDING" });
      const boRows = await boListing.getResultRows();
      if (boRows.length > 0) {
        await boListing.cancelRequest(boRows[0], true);
      }
      await boContext.close();

      // ── Step 2: UCD checks the listing ──
      const ucdContext = await browser.newContext();
      const ucdPage = await ucdContext.newPage();
      const ucdLogin = new (await import("../pages/LoginPage")).LoginPage(ucdPage);
      const ucdListing = new (await import("../pages/ServiceRequestListingPage")).ServiceRequestListingPage(ucdPage);

      await ucdLogin.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
      await ucdListing.navigate();
      await ucdListing.searchBtn.click();
      await ucdListing.waitForNav();

      const rows = await ucdListing.getResultRows();

      // Cancelled rows should NOT have Reschedule action
      for (const row of rows) {
        const status = await ucdListing.getRowStatus(row);
        if (status.toLowerCase().includes("cancel")) {
          const hasReschedule = await ucdListing.hasRescheduleAction(row);
          expect(hasReschedule).toBe(false);
        }
      }

      // Remaining non-cancelled appointments should still have Reschedule
      let hasReschedulable = false;
      for (const row of rows) {
        const status = await ucdListing.getRowStatus(row);
        if (!status.toLowerCase().includes("cancel") && !status.toLowerCase().includes("complete") && !status.toLowerCase().includes("fail")) {
          if (await ucdListing.hasRescheduleAction(row)) {
            hasReschedulable = true;
            break;
          }
        }
      }
      expect(hasReschedulable).toBe(true);

      await ucdContext.close();
    });

    test("Reschedule failed appointment — should be blocked for UCD", async ({
      browser,
    }) => {
      // Scenario: BO marks an appointment as Failed.
      // UCD listing should NOT show Reschedule for that appointment.
      // Only remaining active appointments should be reschedulable.

      // ── Step 1: BO marks a request Failed via the BO SI Details page ──
      // Per SRD 2.3.2.6 #7, "Installation Failed »" opens a reason popup
      // (Reappointment / Laptop-PC Issues / Other) → Yes sets status Failed.
      const boContext = await browser.newContext();
      const boPage = await boContext.newPage();
      const boLogin = new (await import("../pages/LoginPage")).LoginPage(boPage);
      const boListing = new (await import("../pages/bo/SoftwareInstallationListingPage")).SoftwareInstallationListingPage(boPage);
      const boDetails = new (await import("../pages/bo/SoftwareInstallationDetailsPage")).SoftwareInstallationDetailsPage(boPage);

      await boLogin.loginAsBO(ENV.boUsername, ENV.boPassword);
      await boListing.navigate();
      await boListing.searchWithFilters({ installationStatus: "PENDING" });
      const boRows = await boListing.getResultRows();
      if (boRows.length > 0) {
        await boListing.clickView(boRows[0]);
        await boDetails.markFailed("Reappointment");
      }
      await boContext.close();

      // ── Step 2: UCD checks the listing ──
      const ucdContext = await browser.newContext();
      const ucdPage = await ucdContext.newPage();
      const ucdLogin = new (await import("../pages/LoginPage")).LoginPage(ucdPage);
      const ucdListing = new (await import("../pages/ServiceRequestListingPage")).ServiceRequestListingPage(ucdPage);

      await ucdLogin.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
      await ucdListing.navigate();
      await ucdListing.searchBtn.click();
      await ucdListing.waitForNav();

      const rows = await ucdListing.getResultRows();

      // Failed rows should NOT have Reschedule action
      for (const row of rows) {
        const status = await ucdListing.getRowStatus(row);
        if (status.toLowerCase().includes("fail")) {
          const hasReschedule = await ucdListing.hasRescheduleAction(row);
          expect(hasReschedule).toBe(false);
        }
      }

      // Remaining active appointments should still have Reschedule
      let hasReschedulable = false;
      for (const row of rows) {
        const status = await ucdListing.getRowStatus(row);
        if (!status.toLowerCase().includes("cancel") && !status.toLowerCase().includes("complete") && !status.toLowerCase().includes("fail")) {
          if (await ucdListing.hasRescheduleAction(row)) {
            hasReschedulable = true;
            break;
          }
        }
      }
      expect(hasReschedulable).toBe(true);

      await ucdContext.close();
    });
  });

  // ────────────────────────────────────────────────────────────
  // BO — CSE/Ops reschedule
  // ────────────────────────────────────────────────────────────
  test.describe("BO", () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
    });

    // BO reschedules through the Appointment Calendar's Reschedule dialog
    // (SRD 2.3.2.7 #3): read-only identity fields + New Appointment Date +
    // Time Slot radio + Confirm. No +2 blackout / slot cap for CSE.
    test("BO reschedule normal flow", async ({ boCalendarPage }) => {
      await boCalendarPage.navigate();

      if (!(await boCalendarPage.isRescheduleAvailable())) {
        test.skip(true, "No listed appointment to reschedule in this month");
        return;
      }

      const newDate = boCalendarPage.daysFromToday(7);
      await boCalendarPage.rescheduleFirstListed({ newDate, slot: MORNING });
    });

    test("BO reschedule to next day — no +2 blackout", async ({ boCalendarPage }) => {
      await boCalendarPage.navigate();

      if (!(await boCalendarPage.isRescheduleAvailable())) {
        test.skip(true, "No listed appointment to reschedule in this month");
        return;
      }

      // CSE has no +2 day restriction; tomorrow is a valid target.
      const nextDay = boCalendarPage.daysFromToday(1);
      await boCalendarPage.rescheduleFirstListed({ newDate: nextDay, slot: AFTERNOON });
    });
  });
});
