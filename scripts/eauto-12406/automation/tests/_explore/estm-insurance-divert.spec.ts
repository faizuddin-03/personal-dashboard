// A TOOL wearing a spec's clothes — exploration, not coverage.
//
// Walks the sequence Azfar described on 2026-09-18:
//
//   1. first eSTM enquiry returns OK (GLB000000I)
//   2. switch the response code to VEL000069E BEFORE proceeding to step 5
//   3. the flow diverts to the insurance page
//   4. switch back to GLB000000I before completing
//   5. the flow can then proceed
//
// This is the one case prefix-per-outcome cannot express: the SAME vehicle
// needs one code at step 4 and another at step 5, so a shared eSim record is
// edited while a run is in flight. It is restored in a finally.

import { test, expect } from "@fixtures";
import { ESIM_ENTITY } from "@fixtures/esim";
import { EstmWizardPage } from "@pages/ucd/estm-wizard.page";
import { IdCategory } from "@pages/wizard.page";
import { CARDS } from "@data/cards";
import { nextVehicleNumber, nextEmail, nextMobile, randomEngineNo, randomChassisNo } from "@data/generator";

/** Azfar's own prefix in estm-enquiry-resp — remark "Azpar". */
const PREFIX = "VV";
const OK_CODE = "GLB000000I";
const DIVERT_CODE = "VEL000069E";

test("eSerahan — VEL000069E mid-flow diverts to insurance", async ({ page, ucdSession, mykad, esim }) => {
  test.setTimeout(12 * 60 * 1000);

  const original = await esim.findByPrefix(ESIM_ENTITY.estmEnquiry, PREFIX);
  expect(original, `prefix ${PREFIX} must exist in estm-enquiry-resp`).toBeTruthy();
  const originalCode = String(original!.responseCode);
  console.log(`  ${PREFIX} was ${originalCode} — will be restored`);

  const setCode = async (code: string) => {
    await esim.update(ESIM_ENTITY.estmEnquiry, { ...original!, id: original!.id as number, responseCode: code });
    console.log(`  eSim ${PREFIX} -> ${code}`);
  };

  try {
    await setCode(OK_CODE);
    await ucdSession("ucdE2E");

    const estm = new EstmWizardPage(page);
    await estm.startNewTransaction();
    await estm.chooseBuyerCategory(IdCategory.MALAYSIAN);

    const vehicleRegNo = nextVehicleNumber(PREFIX);
    console.log("  vehicle:", vehicleRegNo);
    await estm.authenticateBuyer({ vehicleRegNo, email: nextEmail(), mykad, card: CARDS.malaysianIndividual });
    await estm.continueToVehicle();
    await estm.fillBuyerAndVehicleDetails({
      buyerEmail: nextEmail(),
      contactNo: nextMobile(),
      engineNo: randomEngineNo(),
      chassisNo: randomChassisNo(),
    });
    await estm.continueToSeller();
    await estm.authenticateSeller({ mykad, card: CARDS.malaysianIndividual });
    await estm.continueToJpjCheck();

    await estm.runJpjEnquiry();
    console.log("  enquiry done, URL:", page.url());

    // THE SWITCH — after the enquiry answered OK, before proceeding.
    await setCode(DIVERT_CODE);

    const where = await estm.goToPayment();
    console.log("  step 4 -> 5 landed on:", where, "| route:", estm.insuranceRoute());
    console.log("  url:", page.url());

    if (where === "insurance") {
      console.log("  => DIVERTED TO INSURANCE before the payment screen");
      // Azfar: switch back to the success code BEFORE completing, then proceed.
      await setCode(OK_CODE);
      const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      console.log("  insurance screen says:", body.slice(0, 200));
    } else {
      console.log("  => reached the payment screen, no divert");
      await estm.configureAddOns({ lkm: false, evoc: false });
      console.log("  landed after payment:", await estm.submitPayment());
    }
  } finally {
    await esim.update(ESIM_ENTITY.estmEnquiry, {
      ...original!,
      id: original!.id as number,
      responseCode: originalCode,
    });
    console.log(`  restored ${PREFIX} -> ${originalCode}`);
  }
});
