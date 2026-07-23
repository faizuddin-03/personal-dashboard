import type { Browser, TestInfo } from "@playwright/test";
import { ENV } from "./config";
import { openTrackedContext, closeTrackedContext } from "./tracked-context";

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
 * Runs in its own tracked browser context (cross-portal — this UCD side is
 * a separate login from the BO side driving the actual Add Appointment
 * test), and returns the reference number, or null if it couldn't be
 * determined (callers should skip rather than fail).
 */
export async function arrangeBdpReferenceViaUCD(
  browser: Browser,
  testInfo: TestInfo,
  opts: { deviceQty?: number } = {},
): Promise<string | null> {
  const ctx = await openTrackedContext(browser, testInfo);
  const page = await ctx.newPage();
  let ref: string | null = null;
  try {
    const { LoginPage } = await import("../pages/LoginPage");
    const { BiometricPurchasePage } = await import("../pages/BiometricPurchasePage");
    const { ServiceRequestListingPage } = await import("../pages/ServiceRequestListingPage");

    await new LoginPage(page).loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
    await new BiometricPurchasePage(page).purchaseDevice({
      deviceQty: opts.deviceQty ?? 1,
      recipientName: "Test Receiver",
      contactNo: "0123456789",
      shipToShowroom: true,
    });
    // purchaseDevice() lands on the appointment/slot page — exit without
    // booking anything (free installs are optional) by simply navigating
    // to the listing instead of touching the calendar.
    const listing = new ServiceRequestListingPage(page);
    await listing.navigate();
    await listing.searchWithFilters({ serviceType: "BIOMETRIC_PURCHASE" });
    const rows = await listing.getResultRows();
    if (rows.length > 0) ref = await listing.getRowReferenceNo(rows[0]);
  } finally {
    await closeTrackedContext(ctx, testInfo, "UCD arranges BDP reference");
  }
  return ref;
}
