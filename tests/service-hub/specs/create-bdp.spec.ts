import fs from "fs";
import { test } from "../fixtures/test-fixtures";
import { ServiceRequestListingPage } from "../pages/ServiceRequestListingPage";

/**
 * Test-data utility, NOT tied to any TS. Buys a Biometric Device Purchase as
 * UCD with the given quantity / extra-install options, exits at the
 * appointment/slot page without booking (same "arrange, don't book" shape as
 * arrangeBdpReferenceViaUCD in utils/arrange.ts — leaves a fresh, unbooked
 * reference), then looks up the resulting Reference No. Used by the
 * dashboard's "Create BDP" page (app/eauto/bdp-creator) as a one-click way to
 * generate test data for EAINT-12167 manual/automated testing.
 *
 * Deliberately its own spec, not folded into arrange.ts, because it needs to
 * run standalone via `npx playwright test --grep` from the API route (see
 * app/api/eauto/bdp-creator/run/route.ts) with its own params, not as a
 * helper called from inside another test.
 *
 * Params come in via env vars (same convention as EAUTO_PUBLIC_HOLIDAY /
 * EAUTO_REF_NO in utils/config.ts):
 *   EAUTO_CREATE_BDP_QTY           device quantity (default 1)
 *   EAUTO_CREATE_BDP_EXTRA_INSTALLS extra installs beyond the free one (default 0)
 *   EAUTO_CREATE_BDP_SKIP_INSTALL   "1" to opt out of software installation entirely
 *   PW_RESULT_PATH                 where to write the JSON result
 *
 * Company name is read live off the logged-in UCD account itself
 * (BasePage.getLoggedInCompanyName(), confirmed live 2026-09-24 — see
 * _reference/html/eauto/ucd-home-page-uat1-2026-09-24.html), per Faizuddin:
 * "the company name should be the name of the logged in UCD" — no env var
 * needed for it.
 */
test.describe("Create BDP (test-data utility)", () => {
  test("create-bdp", async ({ loggedInUCD, biometricPurchasePage, page }) => {
    void loggedInUCD;

    const deviceQty = Number(process.env.EAUTO_CREATE_BDP_QTY || 1);
    const extraInstalls = Number(process.env.EAUTO_CREATE_BDP_EXTRA_INSTALLS || 0);
    const skipInstall = process.env.EAUTO_CREATE_BDP_SKIP_INSTALL === "1";
    const companyName = await biometricPurchasePage.getLoggedInCompanyName();

    const txnId = await biometricPurchasePage.purchaseDevice({
      deviceQty,
      recipientName: "Test Receiver",
      contactNo: "0123456789",
      shipToShowroom: true,
      skipInstall,
      additionalInstalls: skipInstall ? undefined : extraInstalls,
    });

    // purchaseDevice() lands on the appointment/slot page — exit without
    // booking (matches arrangeBdpReferenceViaUCD's shape) and look up the
    // Reference No. from the listing instead.
    const listing = new ServiceRequestListingPage(page);
    await listing.navigate();
    await listing.searchWithFilters({ serviceType: "BIOMETRIC_PURCHASE" });
    const rows = await listing.getResultRows();
    const reference = rows.length > 0 ? await listing.getRowReferenceNo(rows[0]) : null;

    const resultPath = process.env.PW_RESULT_PATH;
    if (resultPath) {
      fs.writeFileSync(
        resultPath,
        JSON.stringify(
          {
            reference,
            txnId,
            deviceQty,
            extraInstalls,
            skipInstall,
            companyName,
            createdAt: new Date().toISOString(),
            // Always false by this utility's own design — purchaseDevice()
            // lands on the appointment/slot page and this test deliberately
            // exits without booking, leaving the fresh reference unallocated
            // on purpose (that's the exact precondition EAINT-12167 testing
            // needs). Not a live check; reported as a fact about this
            // generator, not a scrape of the actual appointment state.
            appointmentBooked: false,
          },
          null,
          2,
        ),
      );
    }

    test.info().annotations.push({ type: "reference", description: reference ?? "" });
  });
});
