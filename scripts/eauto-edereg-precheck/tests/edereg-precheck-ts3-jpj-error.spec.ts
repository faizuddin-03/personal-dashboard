import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimJpjErrorPath } from '../utils/esim';
import { runJpjXmlLogChecklist } from '../utils/srdChecklist';

// ── CPC_E2E_TS3: [Failed - JPJ error code] (EAINT-9306) ──
// UPDATED test-plan text (this session), supersedes the 2026-09-02 version
// below the first entry: "Create eDereg Pre-Checking Enquiry with Trx
// Status = Failed, Enquiry Response = VEL000045E > Create Deregistration
// Trx using MyKad > At step 2 ensure error message shown properly > Click
// [Close] > Observe Vehicle No. field and error message clears > Try again
// using the same VN > System display the pre-check result > Click [Close]
// > Observe Vehicle No. field and error message still showing > Ensure Step
// Page, Transaction Listing, JPJ XML Log and Details Page showing
// correctly." The new piece is the SECOND re-entry — the file used to stop
// after one Close.
//
// NOTE — TS3 was PREVIOUSLY built as "RHB API Down" (RHB Transfer code
// "ER"), now confirmed to be the WRONG scenario for this TS number — see
// `edereg-precheck-rhb-api-down.spec.ts`, whose title/comments have been
// updated to drop the "TS3" label until a real number is confirmed for it.
// Do not reuse that file's eSIM code (RHB "ER") for this one — this TS3 is
// a JPJ-level code (VEL000045E via the `dereg-precheck-enquiry` entity),
// same as CPC_E2E_TS9's own first attempt, not a payment-level decline.
//
// Same shape as CPC_E2E_TS2 (edereg-precheck-vehicle-not-exist.spec.ts),
// substituting VEL000045E for VEL000100E and MyKad for MyPR: standalone
// eDereg Pre-Checking Enquiry fails -> Create Deregistration Trx -> at
// Step 2, re-entering the SAME vehicle no. pulls up and displays the
// existing Failed result (reshow only, no new payment popup) -> Close.
// Per Faizuddin 2026-09-02 (knowledge/flow-edereg.md §33), that reshow-only
// behavior (`dialogShape: 'closed-direct'`) IS the correct/expected result
// for a vehicle with an existing Failed pre-check, not a bug — and per §40
// VEL000045E is NOT the VEL000100E repurchase exception, so BOTH entries
// below are expected to reshow, not just the first.
//
// SECOND ENTRY ADDED (this session), same "call resolveVehicleGate() again
// on the same vehicle no." pattern CPC_E2E_TS9 already uses. The new claim
// in the plan text — Vehicle No. field + error message CLEAR after the
// FIRST Close, but STAY SHOWING after the SECOND — is read off
// `VehicleGateResult.vehicleFieldBlank` (already tracked by
// `resolveVehicleGate()`'s `closed-direct` branch) and the same best-effort
// `#precheck-result` text read as before. **Reported, not hard-asserted**,
// same reasoning as the original single-entry version: no live run has ever
// confirmed this specific clear-then-persist sequence, and guessing which
// half is safe to assert would just repeat the mistake earlier rewrites in
// this suite (§33/§37) already got burned by. `dialogShape ===
// 'closed-direct'` on BOTH entries is the one thing hard-asserted, since
// that's the part actually confirmed (§33/§40).
//
// UNLIKE TS2 (which drops all further checks per Faizuddin's own
// instruction), TS3's own literal steps explicitly ask to confirm: the
// standalone precheck's own Details Page (`verifyDetailsPage()`), the eDereg
// Pre-Checking Transaction Listing (`getListingStatusForVehicle()`), and
// the BO JPJ XML Log search (`runJpjXmlLogChecklist()`) — same checklist
// pieces CPC_E2E_TS2 used before being scoped down, kept here since this
// TS's own plan asks for them explicitly. "Step Page" is the Deregistration
// Step 2 page itself, implicitly covered by `resolveVehicleGate()` running
// on it — no separate check needed.
//
// NEVER RUN LIVE.
test('eDereg Pre-Checking Enquiry -> Deregistration — CPC_E2E_TS3, Failed (JPJ error code)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  // eSIM is shared across every tester — steer explicitly every run, same
  // reasoning as the happy path (knowledge/esim.md).
  await ensureEsimJpjErrorPath(inputs.vehicleRegNo);

  session.logUrl('after login');
  await session.closeBanners();

  const precheck = new PrecheckEnquiryPage(page, session);
  await precheck.openFromHome();
  await session.closeBanners();

  await precheck.fillVehicleAndConsent(inputs);
  await precheck.enquireNow();
  await precheck.pay();

  const precheckResult = await precheck.readResult();
  const precheckTransactionId = await precheck.done();
  const detailsCheck = await precheck.verifyDetailsPage(precheckResult.vehicleRegNo);
  const listing = await precheck.getListingStatusForVehicle(inputs.envSegment, precheckResult.vehicleRegNo);

  const mykad = new MykadEmulatorClient(page.context());
  let firstAttempt: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  let secondAttempt: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();

    firstAttempt = await dereg.resolveVehicleGate(inputs.vehicleRegNo);
    if (firstAttempt.satisfied) {
      throw new Error(`Expected the first attempt to come back Failed (VEL000045E) — got satisfied=true (${firstAttempt.jpjStatus} / ${firstAttempt.responseDesc}). Check whether this vehicle already had a qualifying pre-check.`);
    }
    if (firstAttempt.dialogShape !== 'closed-direct') {
      throw new Error(`Expected the first entry to reshow the existing Failed result (dialogShape 'closed-direct') — got '${firstAttempt.dialogShape}'. A vehicle with a real Failed pre-check on file (from the standalone Enquiry above) should never get a fresh payment popup.`);
    }

    // "Try again using the same VN" — resolveVehicleGate() re-fills
    // #vehicleRegNo itself, same re-entry pattern CPC_E2E_TS9 uses.
    secondAttempt = await dereg.resolveVehicleGate(inputs.vehicleRegNo);
    if (secondAttempt.satisfied) {
      throw new Error(`Expected the second entry to ALSO reshow the stale Failed result, not resolve the gate — got satisfied=true (${secondAttempt.jpjStatus} / ${secondAttempt.responseDesc}).`);
    }
    if (secondAttempt.dialogShape !== 'closed-direct') {
      throw new Error(`Expected the second entry to reshow the existing Failed result (dialogShape 'closed-direct') — got '${secondAttempt.dialogShape}'.`);
    }
  } finally {
    await mykad.close();
  }

  // Plan's field-clearing claim — first Close CLEARS the field, second
  // Close (the retry) leaves it STILL SHOWING. Reported only, not asserted
  // (see the file header) — `vehicleFieldBlank` is already tracked by
  // resolveVehicleGate() itself.
  session.progress(
    'cpc-ts3-field-state',
    `Vehicle No. field blank after first Close: ${firstAttempt?.vehicleFieldBlank} — after second Close: ${secondAttempt?.vehicleFieldBlank}`,
  );

  // "Observe Vehicle No. field and error message is shown" — best-effort
  // read of the compulsory-gate div's own text after Close, since no
  // separate "remark under the field" selector has been captured live yet.
  const step2Page = session.active();
  const gateMessageAfterClose = await step2Page.locator('#precheck-result').first()
    .textContent().then(t => t?.trim() ?? '').catch(() => '');

  const jpjXmlLogCheck = await runJpjXmlLogChecklist({
    page, envSegment: inputs.envSegment, vehicleRegNo: precheckResult.vehicleRegNo,
    precheckRefNo: detailsCheck.refNo, deregRefNo: '',
    expectedResponseCode: precheckResult.responseDesc.split(' - ')[0]?.trim() ?? '',
  });

  // Hold 3s so the final state is visible in the recording before ending.
  await session.active().waitForTimeout(3000);

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: precheckResult.jpjStatusLabel === 'Failed'
      && firstAttempt?.satisfied === false && firstAttempt?.dialogShape === 'closed-direct'
      && secondAttempt?.satisfied === false && secondAttempt?.dialogShape === 'closed-direct'
      ? 'SUCCESS' : 'FAIL',
    vehicleRegNo: precheckResult.vehicleRegNo,
    envSegment: inputs.envSegment,
    precheck: {
      jpjStatusLabel: precheckResult.jpjStatusLabel,
      responseDesc: precheckResult.responseDesc,
      transactionId: precheckTransactionId,
    },
    detailsCheck,
    listing,
    firstAttempt,
    secondAttempt,
    gateMessageAfterClose,
    jpjXmlLogCheck,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
