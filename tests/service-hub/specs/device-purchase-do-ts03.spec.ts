import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import { arrangeBdpReferenceViaUCD } from "../utils/arrange";
import { extractPdfText } from "../utils/pdf";
import { installationCountWords } from "../utils/words";
import { uniqueSerials } from "../utils/serials";

// Must match the UCD test account's own company name (arrangeBdpReferenceViaUCD
// purchases as this account) — same constant used in add-appointment-bo.spec.ts.
const COMPANY = "FAIZUDDIN AUTO TEST";

/**
 * 12166_67_E2E_TS03 — DO snapshot rule (REQ-008) + long multi-line address
 * + extra installations wording.
 *
 * One purchase covers both the snapshot-rule check and the extra-installations
 * wording check — a device purchase with extra installs generates the same
 * kind of DO as a plain one, so there's no reason to arrange two separate
 * purchases for what the combined study lists as one test case (TS03).
 * Combined 2026-09-24 per Faizuddin: "it can be done the same... since you
 * can still purchase extra, AND edit address at the same time."
 *
 * Extra-installations arithmetic is CONFIRMED live (2026-09-23, see
 * knowledge/flow-device-purchase.md): word count = quantity + extra
 * installations, e.g. 2 devices + 2 extras -> "FOUR SOFTWARE INSTALLATION".
 *
 * NOT automated in this pass: the long-multi-line-address leg needs a
 * SEPARATE UCD test account whose registered Company Address is already a
 * long multi-line value — that's pre-existing test data this repo doesn't
 * have on file yet, not something a fresh purchase can arrange. Skipped
 * with a clear reason rather than faked against the wrong account.
 */
test.describe("12166/12167 E2E — TS03 snapshot rule & extra installations", () => {
  test("12166_67_E2E_TS03", async ({
    page,
    loginPage,
    boListingPage,
    boDevicePurchaseDetailsPage,
    companyManagementPage,
  }) => {
    const deviceQty = 3;
    const extraInstalls = 2;
    // 3 + 2 = 5 installs, at the "5 or less" threshold — books a real slot
    // (per Faizuddin, 2026-09-24) so the appointment shows on the DO.
    const ref = await arrangeBdpReferenceViaUCD(page, { deviceQty, additionalInstalls: extraInstalls, bookSlot: true });
    if (!ref) {
      test.skip(true, "Could not arrange a Biometric Device Purchase with extra installations via UCD.");
      return;
    }

    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
    await boListingPage.navigate();
    await boListingPage.searchWithFilters({ referenceNo: ref, deliveryStatus: "New" });
    const rows = await boListingPage.getResultRows();
    expect(rows.length).toBeGreaterThan(0);
    await boListingPage.clickView(rows[0]);

    await boDevicePurchaseDetailsPage.openUpdateShippingDetails();
    await boDevicePurchaseDetailsPage.setDeliveryDate(boDevicePurchaseDetailsPage.daysFromToday(3));
    await boDevicePurchaseDetailsPage.setConsignmentNumber(`TS03${Date.now()}`.slice(-12));
    const serials = uniqueSerials(deviceQty);
    await boDevicePurchaseDetailsPage.fillSerialNumbers(serials);
    await boDevicePurchaseDetailsPage.setDeliveryStatusToNextOption();
    await boDevicePurchaseDetailsPage.submitUpdateShippingDetails();

    let baselineText = "";
    await test.step("Baseline DO — extra installations print as quantity + extras, in words", async () => {
      const download = await boDevicePurchaseDetailsPage.downloadDeliveryOrder();
      baselineText = await extractPdfText(download);
      expect(baselineText).toContain("24, JALAN SULAM EMPAT, 19/14D");
      const expectedWords = installationCountWords(deviceQty, extraInstalls); // e.g. "FIVE" for 3+2
      expect(baselineText).toMatch(new RegExp(`${expectedWords}\\s+SOFTWARE INSTALLATION`, "i"));
    });

    const editedAddress = "99, JALAN UBAH SELEPAS DO, TAMAN SNAPSHOT";
    const editedPhone = "0199999999";
    let originalAddress = "";
    let originalPhone = "";

    await test.step("Edit Company Details AFTER DO generation", async () => {
      await companyManagementPage.searchAndOpen(COMPANY);
      originalAddress = await companyManagementPage.getAddress();
      originalPhone = await companyManagementPage.getPhone();
      await companyManagementPage.setAddress(editedAddress);
      await companyManagementPage.setPhone(editedPhone);
      await companyManagementPage.save();
    });

    try {
      await test.step("Re-download the SAME DO — still shows the ORIGINAL values (snapshot rule, REQ-008)", async () => {
        await boListingPage.navigate();
        await boListingPage.searchWithFilters({ referenceNo: ref });
        const shippedRows = await boListingPage.getResultRows();
        await boListingPage.clickView(shippedRows[0]);
        const redownload = await boDevicePurchaseDetailsPage.downloadDeliveryOrder();
        const redownloadText = await extractPdfText(redownload);
        expect(redownloadText).toBe(baselineText);
        expect(redownloadText).not.toContain(editedAddress);
        expect(redownloadText).not.toContain(editedPhone);
      });
    } finally {
      // Restore the shared test account's Company Details so other tests
      // (and other people) aren't left with the edited values.
      await companyManagementPage.searchAndOpen(COMPANY);
      await companyManagementPage.setAddress(originalAddress);
      await companyManagementPage.setPhone(originalPhone);
      await companyManagementPage.save();
    }
  });
});
