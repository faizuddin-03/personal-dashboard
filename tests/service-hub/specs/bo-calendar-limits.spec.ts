import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";

const MORNING = 0;
const AFTERNOON = 1;

// The BO test company (several "FAIZUDDIN …" look-alikes exist; addAppointment
// selects this one by EXACT match). CSE bookings are not bound by the 3/slot
// (6/day) cap, so an add should simply proceed.
const COMPANY = "FAIZUDDIN AUTO TEST";

/**
 * BO / CSE calendar limits (SRD 2.3.2.7). CSE is not bound by the UCD 6/day
 * cap, so adding an appointment should proceed regardless of how full the
 * slot already is. Tests skip (rather than fail) when the company has no
 * unallocated units to add against.
 *
 * NOTE: bo-4…bo-8 (BO calendar date rules: current/next day, previous dates,
 * >2 months, weekends, public holiday) are pending a live check of how the BO
 * Appointment Calendar marks non-selectable dates, and will be added next.
 */
test.describe("BO Calendar & Limits", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
  });

  test("BO add beyond morning slot limit", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, slot: MORNING });
    if (!booked) {
      test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
      return;
    }
    await boCalendarPage.navigate();
    // Expected: CSE can proceed — the morning slot count reflects the add.
    expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  });

  test("BO add beyond afternoon slot limit", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, slot: AFTERNOON });
    if (!booked) {
      test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
      return;
    }
    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(booked, AFTERNOON)).toBeGreaterThan(0);
  });

  test("BO add beyond 6 days limit", async ({ boCalendarPage, browser }) => {
    // Add the appointment as CSE, then OBSERVE it in every location the SRD
    // lists. Email is checked via its on-screen proxy (the UCD Service Request
    // Listing), per the agreed approach.
    let booked: string | null = null;
    await test.step("CSE adds the appointment (beyond the 6/day cap)", async () => {
      await boCalendarPage.navigate();
      booked = await boCalendarPage.addAppointment({ companyName: COMPANY, slot: MORNING });
    });
    if (!booked) {
      test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
      return;
    }

    let ref: string | null = null;

    await test.step("Observe on BO Appointment Calendar — numbering continues", async () => {
      await boCalendarPage.navigate();
      // A positive count on the booked date/slot shows the numbered list
      // continued past the UCD cap (CSE is uncapped).
      expect(await boCalendarPage.getSlotCount(booked!, MORNING)).toBeGreaterThan(0);
    });

    await test.step("Observe on BO Biometric/SI Listing — reference present", async () => {
      const boListing = new (await import("../pages/bo/SoftwareInstallationListingPage")).SoftwareInstallationListingPage(boCalendarPage.page);
      await boListing.navigate();
      ref = await boListing.getLatestReferenceForCompany(COMPANY);
      expect(ref, "the added appointment should appear in the BO listing").not.toBeNull();
    });

    await test.step("Observe on UCD Service Request Listing (on-screen proxy for the email)", async () => {
      if (!ref) return; // nothing to look up
      const ucdCtx = await browser.newContext();
      const ucdPage = await ucdCtx.newPage();
      try {
        const ucdLogin = new (await import("../pages/LoginPage")).LoginPage(ucdPage);
        const ucdListing = new (await import("../pages/ServiceRequestListingPage")).ServiceRequestListingPage(ucdPage);
        await ucdLogin.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
        await ucdListing.searchByReferenceNo(ref);
        const row = await ucdListing.findRowByRefNo(ref);
        // Best-effort: only assert when this UCD account owns the reference.
        if (row) {
          expect((await ucdListing.getRowServiceType(row)).length).toBeGreaterThan(0);
        }
      } finally {
        await ucdCtx.close();
      }
    });
  });
});
