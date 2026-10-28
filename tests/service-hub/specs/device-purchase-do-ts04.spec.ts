import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import { arrangeBdpReferenceViaUCD } from "../utils/arrange";
import { extractPdfText } from "../utils/pdf";
import { uniqueSerials } from "../utils/serials";
import { waitForManualResume } from "../utils/manualGate";

/**
 * 12166_67_E2E_TS04 — Report Engine outage / recovery (REQ-006).
 *
 * Previously excluded from automation entirely (see
 * app/eauto/12166/page.tsx's old NOT_AUTOMATED entry): stopping/restarting
 * the Report Engine is a real infra action only a dev can do, so this test
 * genuinely can't proceed on its own past that point. AUTOMATED 2026-09-24
 * per Faizuddin's request for a pause/resume mechanism — see
 * tests/service-hub/utils/manualGate.ts. The run pauses twice: once to ask
 * dev to STOP the Report Engine, once later to ask dev to RESTART it. Each
 * pause shows as a banner + Resume button on the dashboard
 * (app/eauto/12166/page.tsx) — nothing to do when running this file
 * directly via `npx playwright test` (the gate no-ops without a dashboard
 * run behind it, so this would then just hang forever waiting on a human
 * with no way to signal it — always run TS04 from the dashboard).
 *
 * Message wording confirmed live, see knowledge/flow-device-purchase.md
 * ("REQ-006 error handling"):
 *  - Report Engine down, details complete: "Delivery Order could not be
 *    generated. Please try again."
 *  - Details incomplete: "Unable to generate Delivery Order: required
 *    details are incomplete."
 *
 * NOT automated in this pass (see knowledge/flow-device-purchase.md, "Still
 * outstanding"):
 *  - the "incomplete details" branch — what data actually triggers it is
 *    still an open question, no known way to arrange that state yet.
 *  - the next-calendar-day DO-number-reset check — needs the run to
 *    genuinely cross a real day boundary, which a single automated run
 *    can't force.
 *
 * Click-chain source: combined study artifact, 12166_67_DOSN_TS04.
 */
test.describe("12166/12167 E2E — TS04 Report Engine outage", () => {
  test("12166_67_E2E_TS04", async ({ page, loginPage, boListingPage, boDevicePurchaseDetailsPage }) => {
    // CRITICAL: playwright.config.ts's default per-test timeout is only
    // 240s (detailed mode) / 60s otherwise — nowhere near enough for two
    // manual gates that can each wait up to 20 minutes for a dev to
    // respond (see tests/service-hub/utils/manualGate.ts). Without this,
    // Playwright itself would kill the test around the 4-minute mark,
    // almost certainly before the dev ever gets a chance to click Resume —
    // exactly the "ask dev again and again" failure this test exists to
    // avoid. 60 minutes comfortably covers 2×20min gates plus the actual
    // automation steps.
    test.setTimeout(60 * 60 * 1000);

    await waitForManualResume(
      page,
      "ts04-stop-engine",
      "Ask dev to STOP the Report Engine, then click Resume to continue.",
    );

    const deviceQty = 1;
    const ref = await arrangeBdpReferenceViaUCD(page, { deviceQty, bookSlot: true });
    if (!ref) {
      test.skip(true, "Could not arrange a fresh Biometric Device Purchase via UCD.");
      return;
    }

    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
    await boListingPage.navigate();
    await boListingPage.searchWithFilters({ referenceNo: ref, deliveryStatus: "New" });
    const rows = await boListingPage.getResultRows();
    expect(rows.length).toBeGreaterThan(0);
    await boListingPage.clickView(rows[0]);

    await test.step("Update Shipping Details while Report Engine is down — save still succeeds (only the stored PDF is skipped)", async () => {
      await boDevicePurchaseDetailsPage.openUpdateShippingDetails();
      await boDevicePurchaseDetailsPage.setDeliveryDate(boDevicePurchaseDetailsPage.daysFromToday(3));
      await boDevicePurchaseDetailsPage.setConsignmentNumber(`TS04${Date.now()}`.slice(-12));
      await boDevicePurchaseDetailsPage.fillSerialNumbers(uniqueSerials(deviceQty));
      await boDevicePurchaseDetailsPage.setDeliveryStatusToNextOption();
      await boDevicePurchaseDetailsPage.submitUpdateShippingDetails();
      expect(await boDevicePurchaseDetailsPage.getDeliveryStatus()).toContain("Arranged");
      expect(await boDevicePurchaseDetailsPage.getDeliveryOrderNumber()).toMatch(/^\d{8}\/DP-\d{4}/);
    });

    await test.step("[DO] while still down -> \"Delivery Order could not be generated. Please try again.\"", async () => {
      await boDevicePurchaseDetailsPage.clickDoExpectingError(
        "Delivery Order could not be generated. Please try again.",
      );
    });

    await test.step("[DO] on a transaction with incomplete details -> \"Unable to generate Delivery Order: required details are incomplete.\"", async () => {
      test.skip(
        true,
        "What data makes a transaction count as 'incomplete details' for DO generation is still an open question — see knowledge/flow-device-purchase.md. No known way to arrange this state yet.",
      );
    });

    await waitForManualResume(
      page,
      "ts04-restart-engine",
      "Ask dev to RESTART the Report Engine, then click Resume to continue.",
    );

    let firstDoNumber = "";
    await test.step("[DO] on the same order now succeeds — PDF generates and downloads (live fallback, no stored copy ever existed)", async () => {
      firstDoNumber = await boDevicePurchaseDetailsPage.getDeliveryOrderNumber();
      const download = await boDevicePurchaseDetailsPage.downloadDeliveryOrder();
      const text = await extractPdfText(download);
      expect(text).toContain(firstDoNumber);
    });

    await test.step("A second Biometric Device Purchase the same day -> DO Number continues the running sequence, no repeats", async () => {
      const ref2 = await arrangeBdpReferenceViaUCD(page, { deviceQty: 1, bookSlot: true });
      if (!ref2) {
        test.skip(true, "Could not arrange a second Biometric Device Purchase via UCD.");
        return;
      }
      await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
      await boListingPage.navigate();
      await boListingPage.searchWithFilters({ referenceNo: ref2, deliveryStatus: "New" });
      const rows2 = await boListingPage.getResultRows();
      expect(rows2.length).toBeGreaterThan(0);
      await boListingPage.clickView(rows2[0]);

      await boDevicePurchaseDetailsPage.openUpdateShippingDetails();
      await boDevicePurchaseDetailsPage.setDeliveryDate(boDevicePurchaseDetailsPage.daysFromToday(3));
      await boDevicePurchaseDetailsPage.setConsignmentNumber(`TS04B${Date.now()}`.slice(-12));
      await boDevicePurchaseDetailsPage.fillSerialNumbers(uniqueSerials(1));
      await boDevicePurchaseDetailsPage.setDeliveryStatusToNextOption();
      await boDevicePurchaseDetailsPage.submitUpdateShippingDetails();

      const secondDoNumber = await boDevicePurchaseDetailsPage.getDeliveryOrderNumber();
      expect(secondDoNumber, "the second order must get its own DO number, never repeat the first's").not.toBe(firstDoNumber);

      const firstMatch = firstDoNumber.match(/^(\d{8})\/DP-(\d{4})/);
      const secondMatch = secondDoNumber.match(/^(\d{8})\/DP-(\d{4})/);
      if (firstMatch && secondMatch && firstMatch[1] === secondMatch[1]) {
        // Same date prefix — confirm the sequence actually incremented rather
        // than just differing by chance.
        expect(Number(secondMatch[2])).toBeGreaterThan(Number(firstMatch[2]));
      }
    });

    await test.step("A transaction on the next calendar day -> DO Number resets to DP-0001 under the new date prefix", async () => {
      test.skip(
        true,
        "Needs the run to genuinely cross a real calendar day boundary — can't be forced within a single automated run.",
      );
    });
  });
});
