import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import { arrangeBdpReferenceViaUCD } from "../utils/arrange";
import { extractPdfText, getPdfPageCount } from "../utils/pdf";
import { LoginPage } from "../pages/LoginPage";
import { BiometricPurchasePage } from "../pages/BiometricPurchasePage";
import { SoftwareInstallationListingPage } from "../pages/bo/SoftwareInstallationListingPage";
import { DevicePurchaseDetailsPage } from "../pages/bo/DevicePurchaseDetailsPage";
import { uniqueSerials } from "../utils/serials";

/**
 * 12166_67_E2E_TS02 — 41-device clamp, 40-unit split (20+20), two-officer
 * Issued-by check, invalid Delivery Status transition via console.
 *
 * The 41->40 clamp leg types the value directly and blurs (REQ-007's real
 * "manual entry above 40" path) rather than clicking "+" 41 times (which
 * self-disables at 40 and can't actually test the correction). The exact
 * clamp message hasn't been captured live yet (see
 * knowledge/flow-device-purchase.md) — asserted loosely by value only, with
 * the message text checked only if the error element is present.
 *
 * The Officer B leg needs a SECOND BO Hub Admin account
 * (EAUTO_BO2_USER/EAUTO_BO2_PASS) — skips gracefully if not configured.
 */
test.describe("12166/12167 E2E — TS02 quantity cap, split, two officers", () => {
  test("12166_67_E2E_TS02", async ({ page, loginPage, boListingPage, boDevicePurchaseDetailsPage }) => {
    await test.step("Quantity cap: type 41+, blur -> corrects to 40", async () => {
      await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
      const purchasePage = new BiometricPurchasePage(page);
      await purchasePage.navigate();
      const corrected = await purchasePage.typeQuantityAndBlur("41");
      expect(corrected).toBe(40);
      const errText = await purchasePage.getQuantityErrorText();
      if (errText.trim().length > 0) {
        expect(errText).toContain("A maximum of 40 devices can be purchased per transaction.");
      }
    });

    const ref = await arrangeBdpReferenceViaUCD(page, { deviceQty: 40 });
    if (!ref) {
      test.skip(true, "Could not arrange a fresh 40-device Biometric Device Purchase via UCD.");
      return;
    }

    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
    await boListingPage.navigate();
    await boListingPage.searchWithFilters({ referenceNo: ref, deliveryStatus: "New" });
    const rows = await boListingPage.getResultRows();
    expect(rows.length).toBeGreaterThan(0);
    await boListingPage.clickView(rows[0]);

    await boDevicePurchaseDetailsPage.openUpdateShippingDetails();
    expect(await boDevicePurchaseDetailsPage.getPopupDeviceCount()).toBe(40);
    await boDevicePurchaseDetailsPage.setDeliveryDate(boDevicePurchaseDetailsPage.daysFromToday(3));
    await boDevicePurchaseDetailsPage.setConsignmentNumber(`TS02${Date.now()}`.slice(-12));
    const serials = uniqueSerials(40);
    await boDevicePurchaseDetailsPage.fillSerialNumbers(serials);
    await boDevicePurchaseDetailsPage.setDeliveryStatusToNextOption();
    await boDevicePurchaseDetailsPage.submitUpdateShippingDetails();

    let officerAName = "";
    await test.step("2 DO numbers assigned, comma-separated, 2-page PDF", async () => {
      const doNumbers = await boDevicePurchaseDetailsPage.getDeliveryOrderNumber();
      expect(doNumbers.split(",").map((s) => s.trim()).length).toBe(2);

      const download = await boDevicePurchaseDetailsPage.downloadDeliveryOrder();
      expect(await getPdfPageCount(download)).toBe(2);
      const text = await extractPdfText(download);
      expect(text).toMatch(/Split order/i);
      const nameMatch = text.match(/Name\s*:\s*([^\n]+)/);
      officerAName = nameMatch?.[1]?.trim() ?? "";
      expect(officerAName.length).toBeGreaterThan(0);
      // This 40-install purchase is over the "5 or less" threshold that gets
      // a real slot booked (see arrangeBdpReferenceViaUCD's bookSlot option
      // and device-purchase-do-ts01.spec.ts, 2026-09-24) — it stays
      // unbooked, so the "no appointment" coverage TS01 used to check
      // belongs here instead.
      expect(text).toContain("No appointment has been selected yet");
      expect(text).toContain("to be arranged with the UCD");
    });

    if (!ENV.bo2Username || !ENV.bo2Password) {
      test.skip(true, "EAUTO_BO2_USER/EAUTO_BO2_PASS not configured — cannot run the Officer B leg.");
      return;
    }

    await test.step("Officer B marks Delivered; DO still shows Officer A's name, not B's", async () => {
      await new LoginPage(page).loginAsBO(ENV.bo2Username, ENV.bo2Password);
      const listingB = new SoftwareInstallationListingPage(page);
      await listingB.navigate();
      await listingB.searchWithFilters({ referenceNo: ref });
      const rowsB = await listingB.getResultRows();
      expect(rowsB.length).toBeGreaterThan(0);
      await listingB.clickView(rowsB[0]);

      const detailsB = new DevicePurchaseDetailsPage(page);
      await detailsB.openUpdateShippingDetails();
      await detailsB.setDeliveryStatusToNextOption(); // Arranged -> Delivered
      await detailsB.submitUpdateShippingDetails();

      const download = await detailsB.downloadDeliveryOrder();
      const text = await extractPdfText(download);
      expect(text).toContain(`Name : ${officerAName}`);

      await test.step("Invalid transition Delivered -> Arranged via console is blocked", async () => {
        // Endpoint + payload shape confirmed from the live page source and a
        // captured request (Playwright trace, uat1, 2026-09-23):
        //   POST <env>/api/admin/service-hub/biometric/update-shipping.do
        //   Content-Type: application/x-www-form-urlencoded
        //   X-Requested-With: XMLHttpRequest
        //   transactionId=<the detail.do ?id= value>&baseVersion=<n>&deliveryStatus=...
        // The previous version of this step POSTed JSON to
        // `detail.do`->`update-shipping.do` on the PAGE path
        // (/view/bo/service-hub/...), which is not where the API lives — it
        // 404'd every run, so this check silently passed without ever
        // exercising the rule it claims to cover.
        const { status, body } = await page.evaluate(async () => {
          const url = location.pathname.replace(
            /\/view\/bo\/service-hub\/detail\.do.*$/,
            "/api/admin/service-hub/biometric/update-shipping.do",
          );
          const transactionId = new URLSearchParams(location.search).get("id") ?? "";
          const form = new URLSearchParams();
          form.set("transactionId", transactionId);
          form.set("baseVersion", "0");
          form.set("deliveryStatus", "Arranged"); // the illegal backwards move
          try {
            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest",
              },
              body: form.toString(),
            });
            return { status: res.status, body: (await res.text()).slice(0, 500) };
          } catch (e) {
            return { status: -1, body: String(e) };
          }
        });

        await test.step(`Server answered ${status}: ${body.slice(0, 200)}`, async () => {});

        // The rule itself: the record must NOT still be sitting at Arranged
        // afterwards — that is the outcome that actually matters, whatever
        // wording/status code the endpoint chooses to reply with. Reload and
        // read the real persisted value rather than trusting the response
        // body, whose exact text is not confirmed anywhere.
        await page.reload({ waitUntil: "networkidle" });
        expect(
          await detailsB.getDeliveryStatus(),
          "a console-forced Delivered -> Arranged must not take effect",
        ).toContain("Delivered");
      });

      // Delivered is terminal — there's nothing left to update, and the app
      // reflects that by not rendering the "Update Shipping Details" button
      // at all (confirmed live, manual repro video, 2026-09-23), rather than
      // showing it disabled or leaving the fields merely locked once
      // reopened. Asserting the button is gone is the real guarantee here;
      // attempting to reopen a popup with no trigger button is what timed
      // out before this fix.
      expect(
        await detailsB.isUpdateShippingButtonPresent(),
        "Delivered is terminal — Update Shipping Details should not be reachable at all",
      ).toBe(false);
    });
  });
});
