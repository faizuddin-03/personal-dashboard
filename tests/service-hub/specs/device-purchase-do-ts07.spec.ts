import { type Page } from "@playwright/test";
import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import { arrangeBdpReferenceViaUCD } from "../utils/arrange";
import { uniqueSerials } from "../utils/serials";

/**
 * 12166_67_E2E_TS07 — [DO] button visibility by transaction category, run
 * back to back: present on Purchase-only and Purchase+Installation, absent
 * on Installation-only.
 *
 * Corrected 2026-09-23 (see knowledge/flow-device-purchase.md): the button
 * only ever renders once Delivery Status = Arranged, so each purchase
 * category is shipped through Update Shipping Details -> Arranged before
 * the presence/absence check — the original artifact wording checked this
 * immediately after purchase (status = New), which would never show the
 * button for ANY category and so couldn't actually distinguish them.
 */
// Runs on the caller's OWN page — same reasoning as arrangeBdpReferenceViaUCD
// in utils/arrange.ts (sequential, not concurrent, so no need for a second
// browser context). Callers that were already logged in as BO must log back
// in as BO afterward, since this logs the shared page in as UCD.
async function arrangeInstallOnlyReferenceViaUCD(page: Page): Promise<string | null> {
  const { LoginPage } = await import("../pages/LoginPage");
  const { SoftwareInstallationPage } = await import("../pages/SoftwareInstallationPage");
  const { ServiceRequestListingPage } = await import("../pages/ServiceRequestListingPage");

  await new LoginPage(page).loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  await new SoftwareInstallationPage(page).purchaseInstallation(1);
  const listing = new ServiceRequestListingPage(page);
  await listing.navigate();
  await listing.searchWithFilters({ serviceType: "SOFTWARE_INSTALLATION" });
  const rows = await listing.getResultRows();
  if (rows.length === 0) return null;
  return await listing.getRowReferenceNo(rows[0]);
}

async function shipToArrangedAndCheckDoButton(
  boListingPage: import("../pages/bo/SoftwareInstallationListingPage").SoftwareInstallationListingPage,
  boDevicePurchaseDetailsPage: import("../pages/bo/DevicePurchaseDetailsPage").DevicePurchaseDetailsPage,
  ref: string,
  tag: string,
): Promise<boolean> {
  await boListingPage.navigate();
  await boListingPage.searchWithFilters({ referenceNo: ref, deliveryStatus: "New" });
  const rows = await boListingPage.getResultRows();
  if (rows.length === 0) return false; // e.g. install-only never has a deliveryStatus=New row
  await boListingPage.clickView(rows[0]);

  await boDevicePurchaseDetailsPage.openUpdateShippingDetails();
  const deviceCount = await boDevicePurchaseDetailsPage.getPopupDeviceCount();
  if (deviceCount > 0) {
    await boDevicePurchaseDetailsPage.setDeliveryDate(boDevicePurchaseDetailsPage.daysFromToday(3));
    await boDevicePurchaseDetailsPage.setConsignmentNumber(`${tag}${Date.now()}`.slice(-12));
    const serials = uniqueSerials(deviceCount);
    await boDevicePurchaseDetailsPage.fillSerialNumbers(serials);
    await boDevicePurchaseDetailsPage.setDeliveryStatusToNextOption();
    await boDevicePurchaseDetailsPage.submitUpdateShippingDetails();
  } else {
    await boDevicePurchaseDetailsPage.cancelUpdateShippingDetails();
  }
  return boDevicePurchaseDetailsPage.isDoButtonPresent();
}

test.describe("12166/12167 E2E — TS07 DO button visibility by category", () => {
  test("12166_67_E2E_TS07", async ({ page, loginPage, boListingPage, boDevicePurchaseDetailsPage }) => {
    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);

    await test.step("Purchase-only — [DO] button present once Arranged", async () => {
      const ref = await arrangeBdpReferenceViaUCD(page, { deviceQty: 1, skipInstall: true });
      if (!ref) {
        test.skip(true, "Could not arrange a Purchase-only Biometric Device Purchase via UCD.");
        return;
      }
      // arrangeBdpReferenceViaUCD logs the shared page in as UCD — switch
      // back to BO before touching boListingPage/boDevicePurchaseDetailsPage.
      await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
      expect(await shipToArrangedAndCheckDoButton(boListingPage, boDevicePurchaseDetailsPage, ref, "TS07A")).toBe(true);
    });

    await test.step("Purchase + Installation — [DO] button present once Arranged", async () => {
      // 1 install, at/under the "5 or less" threshold — books a real slot
      // (per Faizuddin, 2026-09-24) so the appointment shows on the DO.
      const ref = await arrangeBdpReferenceViaUCD(page, { deviceQty: 1, skipInstall: false, bookSlot: true });
      if (!ref) {
        test.skip(true, "Could not arrange a Purchase+Installation Biometric Device Purchase via UCD.");
        return;
      }
      await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
      expect(await shipToArrangedAndCheckDoButton(boListingPage, boDevicePurchaseDetailsPage, ref, "TS07B")).toBe(true);
    });

    await test.step("Installation-only — [DO] button absent (out of scope for this CR)", async () => {
      const ref = await arrangeInstallOnlyReferenceViaUCD(page);
      if (!ref) {
        test.skip(true, "Could not arrange an Installation-only Software Installation via UCD.");
        return;
      }
      await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
      // Installation-only records never carry a device-shipping flow at all —
      // no Update Shipping Details / Delivery Status = New row to ship
      // through, so the [DO] button must never appear regardless of status.
      await boListingPage.navigate();
      await boListingPage.searchWithFilters({ referenceNo: ref });
      const rows = await boListingPage.getResultRows();
      expect(rows.length).toBeGreaterThan(0);
      await boListingPage.clickView(rows[0]);
      expect(await boDevicePurchaseDetailsPage.isDoButtonPresent()).toBe(false);
    });
  });
});
