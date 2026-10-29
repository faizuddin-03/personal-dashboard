import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import { arrangeBdpReferenceViaUCD } from "../utils/arrange";
import { extractPdfText } from "../utils/pdf";
import { uniqueSerial } from "../utils/serials";

/**
 * 12166_67_E2E_TS06 — clearing the UCD quantity box (or typing 0) and
 * leaving the field corrects the value to 1; single-device DO shows exactly
 * 1 Serial No. box on a single page.
 *
 * NOTE: the UCD-side "clear quantity -> corrects to 1" client-side behaviour
 * (EAINT-12166 REQ-007) is NOT automated here — arrangeBdpReferenceViaUCD's
 * own purchaseDevice() call doesn't expose the raw qty input for this
 * specific interaction, and this pass hasn't captured the live
 * error/correction DOM yet (see
 * knowledge/flow-device-purchase.md "Still outstanding"). This spec covers
 * the back half only: given a genuine 1-device purchase, the DO shows
 * exactly one serial box on one page — still real EAINT-12167/12166
 * coverage, just not the quantity-box interaction itself.
 */
test.describe("12166/12167 E2E — TS06 single-device DO", () => {
  test("12166_67_E2E_TS06", async ({ page, loginPage, boListingPage, boDevicePurchaseDetailsPage }) => {
    // 1 install, at/under the "5 or less" threshold — books a real slot
    // (per Faizuddin, 2026-09-24) so the appointment shows on the DO.
    const ref = await arrangeBdpReferenceViaUCD(page, { deviceQty: 1, bookSlot: true });
    if (!ref) {
      test.skip(true, "Could not arrange a fresh 1-device Biometric Device Purchase via UCD.");
      return;
    }

    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
    await boListingPage.navigate();
    await boListingPage.searchWithFilters({ referenceNo: ref, deliveryStatus: "New" });
    const rows = await boListingPage.getResultRows();
    expect(rows.length).toBeGreaterThan(0);
    await boListingPage.clickView(rows[0]);

    const serial = uniqueSerial();
    await test.step("Update Shipping Details — exactly 1 serial box", async () => {
      await boDevicePurchaseDetailsPage.openUpdateShippingDetails();
      expect(await boDevicePurchaseDetailsPage.getPopupDeviceCount()).toBe(1);
      const serialCount = await boDevicePurchaseDetailsPage.shipSerialInputs.count();
      expect(serialCount).toBe(1);
      await boDevicePurchaseDetailsPage.setDeliveryDate(boDevicePurchaseDetailsPage.daysFromToday(3));
      await boDevicePurchaseDetailsPage.setConsignmentNumber(`TS06${Date.now()}`.slice(-12));
      await boDevicePurchaseDetailsPage.fillSerialNumbers([serial]);
      await boDevicePurchaseDetailsPage.setDeliveryStatusToNextOption();
      await boDevicePurchaseDetailsPage.submitUpdateShippingDetails();
    });

    await test.step("[DO] downloads a single page with only 1 Serial Number box", async () => {
      const download = await boDevicePurchaseDetailsPage.downloadDeliveryOrder();
      const text = await extractPdfText(download);
      expect(text).toContain("Number of Device");
      expect(text).toMatch(new RegExp(`1\\s*\\n?\\s*${serial}`));
      // A single-device order must never carry a split annotation.
      expect(text).not.toMatch(/Split order/i);
    });
  });
});
