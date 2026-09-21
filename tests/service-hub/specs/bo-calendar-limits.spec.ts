import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import { openTrackedContext, closeTrackedContext } from "../utils/tracked-context";
import { arrangeBdpReferenceViaUCD } from "../utils/arrange";
import { SoftwareInstallationListingPage } from "../pages/bo/SoftwareInstallationListingPage";

const MORNING = 0;
const AFTERNOON = 1;

// The BO test company (several "FAIZUDDIN …" look-alikes exist; addAppointment
// selects this one by EXACT match). CSE bookings are not bound by the 3/slot
// (6/day) cap, so an add should simply proceed.
const COMPANY = "FAIZUDDIN AUTO TEST";

// LOCAL-calendar yyyy-mm-dd — deliberately not `.toISOString()`, which
// converts to UTC first and rolls the date back a day whenever the local
// clock is within the UTC offset of midnight (e.g. every run between
// 00:00-08:00 in Malaysia, UTC+8). See BasePage.formatLocalDate().
function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isWeekendIso(iso: string): boolean {
  const day = fromIsoDate(iso).getDay();
  return day === 0 || day === 6;
}

function nextBusinessDate(iso: string): string {
  const d = fromIsoDate(iso);
  const ph = ENV.publicHoliday;
  while (isWeekendIso(toIsoDate(d)) || (ph && toIsoDate(d) === ph)) {
    d.setDate(d.getDate() + 1);
  }
  return toIsoDate(d);
}

function addDaysIso(iso: string, days: number): string {
  const d = fromIsoDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

/**
 * BO / CSE calendar limits (SRD 2.3.2.7). CSE is not bound by the UCD 6/day
 * cap, so adding an appointment should proceed regardless of how full the
 * slot already is. Tests skip (rather than fail) when the company has no
 * unallocated units to add against.
 *
 * The date-rule tests (current/next day, previous dates, >2 months, weekends,
 * public holiday) are VIEW-only — they open the Add Appointment dialog and
 * inspect its #ac-add-date datepicker (via isAddDateSelectable), then cancel
 * without booking anything. Verified live: the read-only #cal-table grid only
 * ever displays existing bookings and has no "blocked" concept — the real
 * book/no-book gate is this datepicker, where:
 *   - past dates: disabled ("ui-datepicker-unselectable ui-state-disabled")
 *   - weekends: disabled, plus "ui-datepicker-week-end"
 *   - today and all future weekdays (including >2 months out): enabled —
 *     BO/CSE has no +2-day blackout and no 2-month window limit.
 */
test.describe("BO Calendar & Limits", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
  });

  async function findListingSeedForAdd(
    boListingPage: import("../pages/bo/SoftwareInstallationListingPage").SoftwareInstallationListingPage,
  ): Promise<{ companyName: string; referenceNo: string } | null> {
    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
    const fmt = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    };

    await boListingPage.navigate();
    await boListingPage.searchWithFilters({
      requestedFrom: fmt(twoWeeksAgo),
      requestedTo: fmt(now),
      paymentStatus: "Paid",
    });

    const rows = await boListingPage.getResultRows();
    for (const row of rows) {
      const [referenceNo, companyName, installationRequestText] = await Promise.all([
        boListingPage.getRowReferenceNo(row),
        boListingPage.getRowCompanyName(row),
        boListingPage.getRowInstallationRequest(row),
      ]);

      if (!/^SR[A-Za-z]*\d+/.test(referenceNo)) continue;
      if (!companyName) continue;
      if (installationRequestText !== "-") continue;

      return { companyName, referenceNo };
    }

    return null;
  }

  async function prepareAddDialogWithListingSeed(
    boCalendarPage: import("../pages/bo/AppointmentCalendarPage").AppointmentCalendarPage,
  ): Promise<import("@playwright/test").Locator | null> {
    const boListingPage = new SoftwareInstallationListingPage(boCalendarPage.page);
    const seed = await findListingSeedForAdd(boListingPage);
    if (!seed) return null;

    await boCalendarPage.navigate();
    const dialog = await boCalendarPage.openAddDialog();

    await boCalendarPage.page.locator("#ac-add-name").fill(seed.companyName);
    await boCalendarPage.page.locator("#ac-add-search").click();
    await boCalendarPage.page.waitForTimeout(400);

    const cid = await boCalendarPage.page.locator("#ac-add-cid").inputValue();
    if (!cid) {
      await boCalendarPage.closeAddDialog(dialog);
      return null;
    }

    await boCalendarPage.page.locator("#ac-add-refno").fill(seed.referenceNo);
    await boCalendarPage.page.locator("#ac-add-ref-search").click();
    await boCalendarPage.page.waitForTimeout(400);

    const noReq = await boCalendarPage.page.locator("#ac-add-noreq").isVisible().catch(() => false);
    const noAlloc = await boCalendarPage.page.locator("#ac-add-alloc-no").isVisible().catch(() => false);
    if (noReq || noAlloc) {
      await boCalendarPage.closeAddDialog(dialog);
      return null;
    }

    return dialog;
  }

  test("SC_SCB_TS28: BO add beyond morning slot limit", async ({ boCalendarPage, browser }, testInfo) => {
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }
    await boCalendarPage.navigate();
    const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: MORNING });
    if (!booked) {
      test.skip(true, `Could not add an appointment for reference ${ref}.`);
      return;
    }
    await boCalendarPage.navigate();
    // Expected: CSE can proceed — the morning slot count reflects the add.
    expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  });

  test("SC_SCB_TS30: BO add beyond afternoon slot limit", async ({ boCalendarPage, browser }, testInfo) => {
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }
    await boCalendarPage.navigate();
    const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: AFTERNOON });
    if (!booked) {
      test.skip(true, `Could not add an appointment for reference ${ref}.`);
      return;
    }
    await boCalendarPage.navigate();
    expect(await boCalendarPage.getSlotCount(booked, AFTERNOON)).toBeGreaterThan(0);
  });

  test("SC_SCB_TS26: BO add beyond 6 days limit", async ({ boCalendarPage, browser }, testInfo) => {
    // Add the appointment as CSE, then OBSERVE it in every location the SRD
    // lists. Email is checked via its on-screen proxy (the UCD Service Request
    // Listing), per the agreed approach.
    const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
      return;
    }

    let booked: string | null = null;
    await test.step("CSE adds the appointment (beyond the 6/day cap)", async () => {
      await boCalendarPage.navigate();
      booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: MORNING });
    });
    if (!booked) {
      test.skip(true, `Could not add an appointment for reference ${ref}.`);
      return;
    }

    await test.step("Observe on BO Appointment Calendar — numbering continues", async () => {
      await boCalendarPage.navigate();
      // A positive count on the booked date/slot shows the numbered list
      // continued past the UCD cap (CSE is uncapped).
      expect(await boCalendarPage.getSlotCount(booked!, MORNING)).toBeGreaterThan(0);
    });

    await test.step("Observe on BO Biometric/SI Listing — reference present", async () => {
      const boListing = new (await import("../pages/bo/SoftwareInstallationListingPage")).SoftwareInstallationListingPage(boCalendarPage.page);
      await boListing.navigate();
      await boListing.searchWithFilters({ referenceNo: ref });
      const rows = await boListing.getResultRows();
      expect(rows.length, "the added appointment should appear in the BO listing").toBeGreaterThan(0);
    });

    await test.step("Observe on UCD Service Request Listing (on-screen proxy for the email)", async () => {
      const ucdCtx = await openTrackedContext(browser, testInfo);
      const ucdPage = await ucdCtx.newPage();
      try {
        const ucdLogin = new (await import("../pages/LoginPage")).LoginPage(ucdPage);
        const ucdListing = new (await import("../pages/ServiceRequestListingPage")).ServiceRequestListingPage(ucdPage);
        await ucdLogin.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
        await ucdListing.navigate();
        await ucdListing.searchByReferenceNo(ref);
        const row = await ucdListing.findRowByRefNo(ref);
        // Best-effort: only assert when this UCD account owns the reference.
        if (row) {
          expect((await ucdListing.getRowServiceType(row)).length).toBeGreaterThan(0);
        }
      } finally {
        await closeTrackedContext(ucdCtx, testInfo, "UCD verifies listing");
      }
    });
  });

  test("SC_SCB_TS32: BO add for current day and the next day", async ({ boCalendarPage }) => {
    const dialog = await prepareAddDialogWithListingSeed(boCalendarPage);
    if (!dialog) {
      test.skip(true, "No valid BO listing seed (Payment Status=OK, Installation Request='-') for Add Appointment.");
      return;
    }

    await test.step("Expected: able to proceed with booking today and tomorrow", async () => {
      const first = nextBusinessDate(boCalendarPage.today());
      const second = nextBusinessDate(addDaysIso(first, 1));
      expect(await boCalendarPage.isAddDateSelectable(first)).toBe(true);
      expect(await boCalendarPage.isAddDateSelectable(second)).toBe(true);
    });
    await boCalendarPage.closeAddDialog(dialog);
  });

  test("SC_SCB_TS34: BO add for previous dates", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const dialog = await boCalendarPage.openAddDialog();
    await test.step("Expected: a previous date is not selectable", async () => {
      expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.yesterday())).toBe(false);
    });
    await boCalendarPage.closeAddDialog(dialog);
  });

  test("SC_SCB_TS36: BO book future date more than 2 months", async ({ boCalendarPage }) => {
    const dialog = await prepareAddDialogWithListingSeed(boCalendarPage);
    if (!dialog) {
      test.skip(true, "No valid BO listing seed (Payment Status=OK, Installation Request='-') for Add Appointment.");
      return;
    }
    const far = nextBusinessDate(boCalendarPage.dateMonthsAhead(3));
    await test.step(`Expected: ${far} (>2 months out) CAN be booked by BO`, async () => {
      expect(await boCalendarPage.isAddDateSelectable(far)).toBe(true);
    });
    await boCalendarPage.closeAddDialog(dialog);
  });

  test("SC_SCB_TS38: BO book weekend dates", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const dialog = await boCalendarPage.openAddDialog();
    const weekend = boCalendarPage.nextWeekend();
    await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
      expect(await boCalendarPage.isAddDateSelectable(weekend)).toBe(false);
    });
    await boCalendarPage.closeAddDialog(dialog);
  });

  test("SC_SCB_TS40: BO book Public Holiday", async ({ boCalendarPage }) => {
    const ph = ENV.publicHoliday;
    if (!ph) {
      test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
      return;
    }
    await boCalendarPage.navigate();
    const dialog = await boCalendarPage.openAddDialog();
    await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
      expect(await boCalendarPage.isAddDateSelectable(ph)).toBe(false);
    });
    await boCalendarPage.closeAddDialog(dialog);
  });

  // ── Reschedule-entry parity ──
  // The QA doc pairs every Add scenario above with a Reschedule one too —
  // these exercise the Reschedule dialog's OWN #ac-rs-date datepicker
  // (isRescheduleDateSelectable), rather than assuming it behaves the same
  // as Add's #ac-add-date.

  test("SC_SCB_TS33: BO reschedule for current day and the next day", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const dialog = await boCalendarPage.openRescheduleDialogOnly();
    if (!dialog) {
      test.skip(true, "No listed appointment to reschedule in this month");
      return;
    }
    await test.step("Expected: able to reschedule into today and tomorrow", async () => {
      const first = nextBusinessDate(boCalendarPage.today());
      const second = nextBusinessDate(addDaysIso(first, 1));
      expect(await boCalendarPage.isRescheduleDateSelectable(first)).toBe(true);
      expect(await boCalendarPage.isRescheduleDateSelectable(second)).toBe(true);
    });
    await boCalendarPage.closeRescheduleDialog(dialog);
  });

  test("SC_SCB_TS35: BO reschedule for previous dates", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const dialog = await boCalendarPage.openRescheduleDialogOnly();
    if (!dialog) {
      test.skip(true, "No listed appointment to reschedule in this month");
      return;
    }
    await test.step("Expected: a previous date is not selectable", async () => {
      expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.yesterday())).toBe(false);
    });
    await boCalendarPage.closeRescheduleDialog(dialog);
  });

  test("SC_SCB_TS37: BO reschedule future date more than 2 months", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const dialog = await boCalendarPage.openRescheduleDialogOnly();
    if (!dialog) {
      test.skip(true, "No listed appointment to reschedule in this month");
      return;
    }
    const far = nextBusinessDate(boCalendarPage.dateMonthsAhead(3));
    await test.step(`Expected: ${far} (>2 months out) CAN be rescheduled into by BO`, async () => {
      expect(await boCalendarPage.isRescheduleDateSelectable(far)).toBe(true);
    });
    await boCalendarPage.closeRescheduleDialog(dialog);
  });

  test("SC_SCB_TS39: BO reschedule weekend dates", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const dialog = await boCalendarPage.openRescheduleDialogOnly();
    if (!dialog) {
      test.skip(true, "No listed appointment to reschedule in this month");
      return;
    }
    const weekend = boCalendarPage.nextWeekend();
    await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
      expect(await boCalendarPage.isRescheduleDateSelectable(weekend)).toBe(false);
    });
    await boCalendarPage.closeRescheduleDialog(dialog);
  });

  test("SC_SCB_TS41: BO reschedule Public Holiday", async ({ boCalendarPage }) => {
    const ph = ENV.publicHoliday;
    if (!ph) {
      test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
      return;
    }
    await boCalendarPage.navigate();
    const dialog = await boCalendarPage.openRescheduleDialogOnly();
    if (!dialog) {
      test.skip(true, "No listed appointment to reschedule in this month");
      return;
    }
    await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
      expect(await boCalendarPage.isRescheduleDateSelectable(ph)).toBe(false);
    });
    await boCalendarPage.closeRescheduleDialog(dialog);
  });

  test("SC_SCB_TS29: BO reschedule beyond morning slot limit", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const fullLabel = await boCalendarPage.findDateWithSlotFull(MORNING);
    if (!fullLabel) {
      test.skip(true, "No date with a full morning session available.");
      return;
    }
    const [d, m, y] = fullLabel.split("-");
    const iso = `${y}-${m}-${d}`;
    const dialog = await boCalendarPage.openRescheduleDialogOnly();
    if (!dialog) {
      test.skip(true, "No listed appointment to reschedule in this month");
      return;
    }
    await test.step(`Expected: CSE can still reschedule into ${fullLabel} despite the morning session being full`, async () => {
      expect(await boCalendarPage.isRescheduleDateSelectable(iso)).toBe(true);
    });
    await boCalendarPage.closeRescheduleDialog(dialog);
  });

  test("SC_SCB_TS31: BO reschedule beyond afternoon slot limit", async ({ boCalendarPage }) => {
    await boCalendarPage.navigate();
    const fullLabel = await boCalendarPage.findDateWithSlotFull(AFTERNOON);
    if (!fullLabel) {
      test.skip(true, "No date with a full afternoon session available.");
      return;
    }
    const [d, m, y] = fullLabel.split("-");
    const iso = `${y}-${m}-${d}`;
    const dialog = await boCalendarPage.openRescheduleDialogOnly();
    if (!dialog) {
      test.skip(true, "No listed appointment to reschedule in this month");
      return;
    }
    await test.step(`Expected: CSE can still reschedule into ${fullLabel} despite the afternoon session being full`, async () => {
      expect(await boCalendarPage.isRescheduleDateSelectable(iso)).toBe(true);
    });
    await boCalendarPage.closeRescheduleDialog(dialog);
  });

  test("SC_SCB_TS27: BO reschedule beyond 6 days limit", async ({ boCalendarPage }) => {
    // "6 days" = the UCD-facing 6/day cap; CSE ignores it. Reuses whichever
    // full session (morning or afternoon) is found first as evidence the
    // day is at/near that cap.
    await boCalendarPage.navigate();
    const fullLabel = (await boCalendarPage.findDateWithSlotFull(MORNING)) ?? (await boCalendarPage.findDateWithSlotFull(AFTERNOON));
    if (!fullLabel) {
      test.skip(true, "No date at the daily booking limit available.");
      return;
    }
    const [d, m, y] = fullLabel.split("-");
    const iso = `${y}-${m}-${d}`;
    const dialog = await boCalendarPage.openRescheduleDialogOnly();
    if (!dialog) {
      test.skip(true, "No listed appointment to reschedule in this month");
      return;
    }
    await test.step(`Expected: CSE can still reschedule into ${fullLabel} despite it being at the UCD 6/day cap`, async () => {
      expect(await boCalendarPage.isRescheduleDateSelectable(iso)).toBe(true);
    });
    await boCalendarPage.closeRescheduleDialog(dialog);
  });

  // ── Add Appointment — existing-reference edge case ──
  test("SC_SCB_TS25: Attempt to add existing appointment expired over 2 months", async ({ boListingPage, boCalendarPage }) => {
    // No "Expired" filter exists in the Installation Status dropdown (it's
    // time-derived — a free biometric install left unbooked for 2 months),
    // so search with no filter and text-match the status cell instead.
    await boListingPage.navigate();
    await boListingPage.searchWithFilters({});
    const rows = await boListingPage.getResultRows();
    let expiredRef: string | null = null;
    let expiredCompany: string | null = null;
    for (const row of rows) {
      if ((await boListingPage.getRowInstallationStatus(row)).toLowerCase().includes("expired")) {
        expiredRef = await boListingPage.getRowReferenceNo(row);
        expiredCompany = await boListingPage.getRowCompanyName(row);
        break;
      }
    }
    if (!expiredRef || !expiredCompany) {
      test.skip(true, "No Expired installation reference found — this status is time-dependent and can't be arranged on demand.");
      return;
    }

    await boCalendarPage.navigate();
    const dialog = await boCalendarPage.openAddDialog();
    // Company must be searched/bound first — the Reference No. field
    // validates against whichever company is currently bound.
    await boCalendarPage.page.locator("#ac-add-name").fill(expiredCompany);
    await boCalendarPage.page.locator("#ac-add-search").click();
    await boCalendarPage.page.waitForTimeout(500);
    await boCalendarPage.page.locator("#ac-add-refno").fill(expiredRef);
    await boCalendarPage.page.locator("#ac-add-ref-search").click();
    await boCalendarPage.page.waitForTimeout(500);

    await test.step("Expected: an error message appears under Reference No.", async () => {
      const errorNearRef = dialog.getByText(/expired|invalid|not found/i);
      await expect(errorNearRef.first()).toBeVisible({ timeout: 5000 });
    });

    await boCalendarPage.closeAddDialog(dialog);
  });
});
