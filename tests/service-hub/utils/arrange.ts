import { type Page, test } from "@playwright/test";
import { ENV } from "./config";

/**
 * Arrange a fresh Biometric Device Purchase reference for the BO "Add
 * Appointment" flow to use.
 *
 * Verified live (SIT2): the Add Appointment dialog's New Record / Existing
 * Record type radio is GONE — there's no way to create a request from
 * scratch there anymore, only "Existing Record" (Company Name → Reference
 * No. → Appointment Date → Time Slot). So every BO add-appointment test now
 * needs a real, unbooked reference to key in FIRST: UCD buys a device (one
 * free install comes with it) and exits at the appointment/slot page
 * WITHOUT booking, leaving that free install unallocated and tied to a
 * fresh reference — exactly what the Existing Record path expects.
 *
 * Runs on the caller's OWN `page` — every caller uses this sequentially
 * (arrange as UCD, then continue as UCD or log in as BO), never
 * concurrently with another session, so there's no need for a second
 * browser context/recording here (per Faizuddin, 2026-09-23 — "since its
 * not concurrent and just one flow at a time, i prefer just one browser").
 * `LoginPage.login()` navigates straight to /login and re-submits
 * credentials regardless of whatever session is already on the page, so
 * switching accounts on the same page mid-test is already a proven pattern
 * elsewhere in this suite (e.g. device-purchase-do-ts01.spec.ts goes
 * UCD → BO on one `page`).
 *
 * Returns the reference number, or null if it couldn't be determined
 * (callers should skip rather than fail).
 */
export async function arrangeBdpReferenceViaUCD(
  page: Page,
  opts: {
    deviceQty?: number;
    recipientName?: string;
    contactNo?: string;
    shipToShowroom?: boolean;
    deliveryAddress?: string;
    skipInstall?: boolean;
    additionalInstalls?: number;
    /**
     * Book a random slot for the free/extra installs this purchase creates,
     * instead of leaving the appointment unallocated. Off by default — the
     * BO "Add Appointment" tests (add-appointment-bo.spec.ts,
     * bo-calendar-limits.spec.ts) specifically need an UNBOOKED reference,
     * since booking it themselves via the BO Add Appointment dialog IS the
     * thing they're testing. Only opt in from callers that actually want a
     * real appointment to show up on the resulting DO — the
     * device-purchase-do-ts0X specs, per Faizuddin's 2026-09-24 request:
     * "for any scenarios with installation 5 or less... I want to see in
     * the PDF, the appointment dates." No-op if there's nothing to
     * allocate (skipInstall with no additionalInstalls).
     */
    bookSlot?: boolean;
  } = {},
): Promise<string | null> {
  return await test.step("Arrange fresh Biometric Device Purchase reference via UCD", async () => {
    const { LoginPage } = await import("../pages/LoginPage");
    const { BiometricPurchasePage } = await import("../pages/BiometricPurchasePage");
    const { ServiceRequestListingPage } = await import("../pages/ServiceRequestListingPage");

    await new LoginPage(page).loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
    await new BiometricPurchasePage(page).purchaseDevice({
      deviceQty: opts.deviceQty ?? 1,
      recipientName: opts.recipientName ?? "Test Receiver",
      contactNo: opts.contactNo ?? "0123456789",
      shipToShowroom: opts.deliveryAddress ? false : (opts.shipToShowroom ?? true),
      deliveryAddress: opts.deliveryAddress,
      skipInstall: opts.skipInstall,
      additionalInstalls: opts.additionalInstalls,
    });

    // purchaseDevice() lands on the appointment/slot page (same slot.do
    // picker as Software Installation — see BiometricPurchasePage's own doc
    // comment). Book a random slot here when asked; otherwise exit without
    // booking anything (free installs are optional), same as before.
    const installsNeeded = (opts.skipInstall ? 0 : (opts.deviceQty ?? 1)) + (opts.additionalInstalls ?? 0);
    if (opts.bookSlot && installsNeeded > 0) {
      await test.step(`Book a random slot for ${installsNeeded} install(s)`, async () => {
        const { SlotPickerComponent } = await import("../pages/SlotPickerComponent");
        const slotPicker = new SlotPickerComponent(page);
        await slotPicker.allocateUnitsAnywhere(installsNeeded);
        await slotPicker.confirmAppointment();
      });
    }

    const listing = new ServiceRequestListingPage(page);
    await listing.navigate();
    await listing.searchWithFilters({ serviceType: "BIOMETRIC_PURCHASE" });
    const rows = await listing.getResultRows();
    if (rows.length === 0) {
      await test.step("No BIOMETRIC_PURCHASE row found on the listing after purchase", async () => {});
      return null;
    }
    const ref = await listing.getRowReferenceNo(rows[0]);
    await test.step(`Arranged reference = ${ref}`, async () => {});
    return ref;
  });
}
