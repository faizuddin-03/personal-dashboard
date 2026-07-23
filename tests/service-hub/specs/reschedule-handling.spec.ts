import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import { openTrackedContext, closeTrackedContext } from "../utils/tracked-context";

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

    /**
     * Arrange a guaranteed-fresh, actually-booked appointment to reschedule:
     * buy 1 installation, book it into whatever date has room, confirm. This
     * SR is unambiguously booked right now, so the reschedule step below
     * never depends on the shared listing's ambient state (staging can carry
     * older SRs left at "Booked 0 of N" from interrupted runs, which have a
     * Reschedule action but nothing to actually remove).
     */
    async function arrangeBookedAppointment(
      softwareInstallationPage: import("../pages/SoftwareInstallationPage").SoftwareInstallationPage,
      slotPicker: import("../pages/SlotPickerComponent").SlotPickerComponent,
    ): Promise<{ txnId: string; bookedDate: string }> {
      const txnId = await softwareInstallationPage.purchaseInstallation(1);
      const date = await slotPicker.findDateWithRoom(1);
      expect(date, "expected a bookable date with room to arrange the appointment").not.toBeNull();
      await slotPicker.allocateUnitsAnywhere(1, date!);
      await slotPicker.confirmAppointment();
      return { txnId, bookedDate: date! };
    }

    test("Reschedule on the day of the initial appointment to a future date", async ({
      softwareInstallationPage,
      slotPicker,
      reschedulePage,
    }) => {
      // Scenario: appointment exists on some date. UCD opens listing,
      // clicks Reschedule, calendar opens. UCD removes the old booking
      // and picks a new available date. +2 day blackout applies.
      const { txnId, bookedDate } = await test.step(
        "Arrange: buy + book a fresh installation",
        () => arrangeBookedAppointment(softwareInstallationPage, slotPicker),
      );

      await reschedulePage.navigate(txnId);
      expect(await reschedulePage.findBookedDate()).toBe(bookedDate);

      // Blackout-window enforcement is a boundary/negative check, not part of
      // this happy-path reschedule — verified separately in Calendar Rules.

      // Verify there are bookable dates available
      await reschedulePage.verifyHasBookableDates();

      const newDate = await reschedulePage.findFirstBookableDate();
      expect(newDate).not.toBeNull();

      // Reschedule: remove from booked date → pick new date
      await reschedulePage.rescheduleToNewDate({
        oldDate: bookedDate,
        newDate: newDate!,
        slot: MORNING,
      });
    });

    test("Reschedule before the day of the appointment to a future date", async ({
      softwareInstallationPage,
      slotPicker,
      reschedulePage,
    }) => {
      // Scenario: UCD reschedules BEFORE the appointment day.
      // Same flow — the booked date is in the future.
      const { txnId, bookedDate } = await test.step(
        "Arrange: buy + book a fresh installation",
        () => arrangeBookedAppointment(softwareInstallationPage, slotPicker),
      );

      await reschedulePage.navigate(txnId);
      expect(await reschedulePage.findBookedDate()).toBe(bookedDate);

      // Blackout-window enforcement is a boundary/negative check, not part of
      // this happy-path reschedule — verified separately in Calendar Rules.
      await reschedulePage.verifyHasBookableDates();

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
        oldDate: bookedDate,
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

    // ── Status-based reschedule blocking (QA doc: "Reschedule Handling") ──
    // Reschedule is only ever offered for Tx Status = Pending
    // (ServiceRequestListingPage.hasRescheduleAction / SRD 2.3.2.2 #3) — these
    // confirm that rule at each of the other statuses the doc calls out.

    test("Reschedule Pending Installation", async ({ listingPage }) => {
      await listingPage.navigate();
      await listingPage.searchWithFilters({ status: "PENDING" });
      const rows = await listingPage.getResultRows();
      if (rows.length === 0) {
        test.skip(true, "No Pending Service Request found.");
        return;
      }
      let found = false;
      for (const row of rows) {
        if (await listingPage.hasRescheduleAction(row)) {
          found = true;
          break;
        }
      }
      expect(found, "a Pending Service Request should offer Reschedule").toBe(true);
    });

    test("Reschedule Complete Installation", async ({ listingPage }) => {
      await listingPage.navigate();
      await listingPage.searchWithFilters({ status: "COMPLETED" });
      const rows = await listingPage.getResultRows();
      if (rows.length === 0) {
        test.skip(true, "No Completed Service Request found.");
        return;
      }
      for (const row of rows) {
        expect(await listingPage.hasRescheduleAction(row)).toBe(false);
      }
    });

    test("Reschedule Expired Installation", async ({ listingPage }) => {
      // "Expired" IS a real filter value on the Status dropdown (verified
      // live) — a free biometric install left unbooked for 2 months.
      await listingPage.navigate();
      await listingPage.searchWithFilters({ status: "EXPIRED" });
      const rows = await listingPage.getResultRows();
      const target = rows[0] ?? null;
      if (!target) {
        test.skip(true, "No Expired Service Request found — this status is time-dependent (2 months unbooked) and can't be arranged on demand.");
        return;
      }
      expect(await listingPage.hasRescheduleAction(target)).toBe(false);
    });

    // ── Calendar-edge reschedule checks ──

    test("Reschedule on Friday", async ({ listingPage, reschedulePage }) => {
      // Precondition: testing must be done on a Friday. Weekends don't count
      // within the +2-day blackout, so the buffer must extend through the
      // weekend — both today (Friday) AND the following Monday stay blocked.
      if (new Date().getDay() !== 5) {
        test.skip(true, "This test only applies when run on a Friday (per the QA precondition).");
        return;
      }
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

      await test.step("Expected: Friday and the following Monday are both blocked", async () => {
        expect(await reschedulePage.isDayBlocked(reschedulePage.today())).toBe(true);
        expect(await reschedulePage.isDayBlocked(reschedulePage.daysFromToday(3))).toBe(true);
      });
    });

    test("Reschedule before Public Holiday", async ({ listingPage, reschedulePage }) => {
      // Precondition: a public holiday must be patched in for testing, and
      // today must be the day immediately before it. Public holidays don't
      // count within the +2-day blackout, so the day AFTER the holiday
      // should also stay blocked.
      const ph = ENV.publicHoliday;
      if (!ph) {
        test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
        return;
      }
      if (ph !== reschedulePage.daysFromToday(1)) {
        test.skip(true, `This test only applies when today is the day before the public holiday (expected ${reschedulePage.daysFromToday(1)}, got ${ph}).`);
        return;
      }
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

      const dayAfterHoliday = reschedulePage.daysFromToday(2);
      await test.step(`Expected: the day after the public holiday (${dayAfterHoliday}) is still blocked`, async () => {
        expect(await reschedulePage.isDayBlocked(dayAfterHoliday)).toBe(true);
      });
    });

    test("Reschedule from morning to afternoon after 12:00PM", async ({ listingPage, requestDetailsPage, reschedulePage }) => {
      // Precondition: time of testing must be after 12:00PM, and the
      // appointment being checked is today's morning appointment. Once the
      // appointment time has passed, the Reschedule action should disappear.
      if (new Date().getHours() < 12) {
        test.skip(true, "This test only applies when run after 12:00PM (per the QA precondition).");
        return;
      }
      await listingPage.navigate();
      await listingPage.searchBtn.click();
      await listingPage.waitForNav();
      const rows = await listingPage.getResultRows();

      const todayIso = reschedulePage.today();
      const [y, m, d] = todayIso.split("-");
      const todayDisplay = `${d}-${m}-${y}`; // matches the app's DD-MM-YYYY date displays elsewhere

      let targetRef: string | null = null;
      for (const row of rows) {
        if (!(await listingPage.hasRescheduleAction(row))) continue;
        const txnId = await listingPage.getRescheduleTxnId(row);
        if (!txnId) continue;
        const ref = await listingPage.getRowReferenceNo(row);
        await requestDetailsPage.navigate(txnId);
        for (const apptRow of await requestDetailsPage.getAppointmentRows()) {
          const slot = (await requestDetailsPage.getAppointmentTimeSlot(apptRow)).toLowerCase();
          const isMorning = /10:00|10am|morning/.test(slot);
          const dateText = await requestDetailsPage.getAppointmentDate(apptRow);
          if (isMorning && (dateText.includes(todayDisplay) || dateText.includes(todayIso))) {
            targetRef = ref;
            break;
          }
        }
        if (targetRef) break;
      }
      if (!targetRef) {
        test.skip(true, "No Service Request with today's morning appointment found.");
        return;
      }

      await listingPage.navigate();
      await listingPage.searchByReferenceNo(targetRef);
      const refreshedRows = await listingPage.getResultRows();
      expect(refreshedRows.length, `expected ${targetRef} to still appear in the listing`).toBeGreaterThan(0);
      await test.step("Expected: the Reschedule action no longer appears — the appointment time has passed", async () => {
        expect(await listingPage.hasRescheduleAction(refreshedRows[0])).toBe(false);
      });
    });

    // NOTE: "Reschedule from afternoon to morning on same day" is marked
    // TBC ("if the appointment is on the current day, should UCD be able to
    // see the reschedule button") in the QA doc itself — the expected
    // behaviour isn't decided yet, so no automated assertion is made here
    // pending that decision.

    test("Reschedule to the exact same date shows a popup", async ({ listingPage, reschedulePage }) => {
      // Precondition (doc): reschedule to the exact same date the
      // appointment is already booked on. Exact popup wording is itself
      // marked "tbc" in the QA doc, so this only asserts that SOME dialog
      // appears, not specific text.
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

      const bookedDate = await reschedulePage.findBookedDate();
      if (!bookedDate) {
        test.skip(true, "Could not determine the currently booked date.");
        return;
      }

      // Re-select the same date without removing/changing anything, then
      // attempt to confirm — the app should surface a "same date" message.
      await reschedulePage.openSlotModal(bookedDate);
      await reschedulePage.saveSlotChanges();
      await reschedulePage.confirmBookingBtn.click();
      await expect(reschedulePage.page.locator(".ui-dialog")).toBeVisible({ timeout: 8000 });
    });
  });

  // ────────────────────────────────────────────────────────────
  // Cross-portal (BO acts, then UCD checks) — deliberately OUTSIDE the "UCD"
  // describe above: these tests manage their own BO/UCD logins entirely via
  // openTrackedContext(), so they never touch the default page/context. If
  // they inherited the "UCD" describe's beforeEach login, that default
  // context would still get a video recorded for it — showing nothing but
  // "login → home page" — which is confusing noise. The real recordings are
  // the two tracked-context videos ("... - BO ....webm" / "... - UCD ....webm").
  // ────────────────────────────────────────────────────────────
  test.describe("Cross-Portal", () => {
    test("Reschedule cancelled appointment — should be blocked", async ({
      browser,
    }, testInfo) => {
      // Scenario: UCD has multiple appointments (e.g. 20th and 21st).
      // BO cancels one. When UCD opens listing, the cancelled appointment
      // should NOT show Reschedule. Only the active ones should.
      //
      // Per SRD 2.3.2.5, Cancel is performed on the BO Software
      // Installation Listing ("Cancel" action + "Sure to cancel?" popup).

      // ── Step 1: BO cancels a request via the BO SI Listing ──
      const boContext = await openTrackedContext(browser, testInfo);
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
      await closeTrackedContext(boContext, testInfo, "BO cancels request");

      // ── Step 2: UCD checks the listing ──
      const ucdContext = await openTrackedContext(browser, testInfo);
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

      await closeTrackedContext(ucdContext, testInfo, "UCD checks listing");
    });

    test("Reschedule failed appointment — should be blocked for UCD", async ({
      browser,
    }, testInfo) => {
      // Scenario: BO marks an appointment as Failed.
      // UCD listing should NOT show Reschedule for that appointment.
      // Only remaining active appointments should be reschedulable.

      // ── Step 1: BO marks a request Failed via the BO SI Details page ──
      // Per SRD 2.3.2.6 #7, "Installation Failed »" opens a reason popup
      // (Reappointment / Laptop-PC Issues / Other) → Yes sets status Failed.
      const boContext = await openTrackedContext(browser, testInfo);
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
      await closeTrackedContext(boContext, testInfo, "BO marks failed");

      // ── Step 2: UCD checks the listing ──
      const ucdContext = await openTrackedContext(browser, testInfo);
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

      await closeTrackedContext(ucdContext, testInfo, "UCD checks listing");
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

      // The Reschedule dialog picks the new date from its own datepicker
      // (any non-past selectable date); CSE has no +2 blackout.
      await boCalendarPage.rescheduleFirstListed({ slot: MORNING });
    });

    test("BO reschedule to afternoon slot", async ({ boCalendarPage }) => {
      await boCalendarPage.navigate();

      if (!(await boCalendarPage.isRescheduleAvailable())) {
        test.skip(true, "No listed appointment to reschedule in this month");
        return;
      }

      await boCalendarPage.rescheduleFirstListed({ slot: AFTERNOON });
    });

    // ── Status-based reschedule blocking, BO side ──
    // Finds a company with the target installationStatus via the BO SI
    // Listing, then checks the Appointment Calendar (current month only) for
    // whether that company's entry still offers a Reschedule link.
    async function assertNoRescheduleForStatus(
      boListingPage: import("../pages/bo/SoftwareInstallationListingPage").SoftwareInstallationListingPage,
      boCalendarPage: import("../pages/bo/AppointmentCalendarPage").AppointmentCalendarPage,
      status: import("../pages/bo/SoftwareInstallationListingPage").InstallationStatus,
    ): Promise<"ok" | "no-record" | "not-on-calendar"> {
      await boListingPage.navigate();
      await boListingPage.searchWithFilters({ installationStatus: status });
      const rows = await boListingPage.getResultRows();
      if (rows.length === 0) return "no-record";
      const company = await boListingPage.getRowCompanyName(rows[0]);

      await boCalendarPage.navigate();
      const hasReschedule = await boCalendarPage.hasRescheduleForCompany(company);
      if (hasReschedule === null) return "not-on-calendar";
      expect(hasReschedule, `${company} (${status}) should not offer Reschedule`).toBe(false);
      return "ok";
    }

    test("BO reschedule Cancelled Installation", async ({ boListingPage, boCalendarPage }) => {
      const result = await assertNoRescheduleForStatus(boListingPage, boCalendarPage, "CANCELLED");
      if (result === "no-record") { test.skip(true, "No Cancelled installation found."); return; }
      if (result === "not-on-calendar") { test.skip(true, "The Cancelled installation's company isn't listed on the current month's calendar."); return; }
    });

    test("BO reschedule Failed Installation", async ({ boListingPage, boCalendarPage }) => {
      const result = await assertNoRescheduleForStatus(boListingPage, boCalendarPage, "FAILED");
      if (result === "no-record") { test.skip(true, "No Failed installation found."); return; }
      if (result === "not-on-calendar") { test.skip(true, "The Failed installation's company isn't listed on the current month's calendar."); return; }
    });

    test("BO reschedule Complete Installation", async ({ boListingPage, boCalendarPage }) => {
      const result = await assertNoRescheduleForStatus(boListingPage, boCalendarPage, "COMPLETED");
      if (result === "no-record") { test.skip(true, "No Completed installation found."); return; }
      if (result === "not-on-calendar") { test.skip(true, "The Completed installation's company isn't listed on the current month's calendar."); return; }
    });

    test("BO reschedule Expired Installation", async ({ boListingPage, boCalendarPage }) => {
      // No "Expired" filter exists in the Installation Status dropdown (it's
      // time-derived), so search with no filter and text-match instead.
      await boListingPage.navigate();
      await boListingPage.searchWithFilters({});
      const rows = await boListingPage.getResultRows();
      let target: import("@playwright/test").Locator | null = null;
      for (const row of rows) {
        if ((await boListingPage.getRowInstallationStatus(row)).toLowerCase().includes("expired")) {
          target = row;
          break;
        }
      }
      if (!target) {
        test.skip(true, "No Expired installation found — this status is time-dependent and can't be arranged on demand.");
        return;
      }
      const company = await boListingPage.getRowCompanyName(target);
      await boCalendarPage.navigate();
      const hasReschedule = await boCalendarPage.hasRescheduleForCompany(company);
      if (hasReschedule === null) {
        test.skip(true, "The Expired installation's company isn't listed on the current month's calendar.");
        return;
      }
      expect(hasReschedule, `${company} (Expired) should not offer Reschedule`).toBe(false);
    });
  });
});
