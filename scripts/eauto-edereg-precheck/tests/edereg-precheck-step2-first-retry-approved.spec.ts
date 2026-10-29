import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimJpjErrorPath, ensureEsimHappyPath } from '../utils/esim';
import { runJpjXmlLogChecklist } from '../utils/srdChecklist';

// ── CPC_E2E_TS9: [Failed - JPJ error code] (EAINT-9306) ──
// "Pre-check done in step 2" entry point (flow-edereg.md §2), same shape as
// CPC_E2E_TS8.
//
// CORRECTED 2026-09-02, per Faizuddin — REWRITTEN, no longer a retry-to-
// Approved scenario. The original build assumed re-entering the SAME
// vehicle no. a second time (after re-steering eSIM to Approved) would
// trigger a genuinely fresh payment popup, this time succeeding. That
// assumption is now known to be wrong: per knowledge/flow-edereg.md §33
// (settled on CPC_E2E_TS2, then confirmed to apply here too by Faizuddin
// directly), once a vehicle has ANY Failed pre-check on file — even one
// from this SAME inline "pre-check done in step 2" entry point, not just a
// standalone one — re-entering that vehicle no. just PULLS UP and DISPLAYS
// the existing failed result. Close does nothing further. Re-steering eSIM
// to Approved beforehand does NOT change this — the second entry still just
// reshows the stale Failed result, it does not run a fresh JPJ check. So
// this scenario can no longer reach Approved / a real Deregistration via
// this mechanism; it now demonstrates the SAME reshow-only behavior twice,
// once from each entry (first attempt: no prior record, full payment popup;
// second attempt: existing Failed record, reshow only) — the whole point of
// keeping BOTH attempts in this script.
//
// Set Dereg Enq. Response = VEL000045E -> Create Deregistration Trx using
// MyPR (no prior pre-check) -> at Step 2 the inline popup pays and comes
// back Failed (VEL000045E) -> Close, scenario would normally end there
// (same dead-end as CPC_E2E_TS8) -> to prove the reshow-only behavior is
// independent of the underlying eSIM code, re-steer eSIM to
// GLB000000I (Approved) THEN fill the SAME vehicle no. again -> expect the
// SAME stale Failed result to reshow (dialogShape 'closed-direct'), NOT a
// fresh payment popup, even though the JPJ code would now pass if a real
// check ran.
//
// IMPORTANT PRECONDITION: vehicleRegNo must have NO prior pre-checking
// transaction, same as TS7/TS8.
//
// ADDED (this session): the test plan's own final step — "Ensure Step Page,
// Transaction Listing, JPJ XML Log and Details Page showing correctly" —
// was never implemented in any earlier version of this file; the rewrite
// above ended the script right after the second reshow with no checklist at
// all. The first attempt DOES persist a real Pre-Checking transaction (the
// same "TS2/TS8 dead-end" record, per DeregTransactionPage.
// resolveVehicleGate's own doc comment) even though this entry point never
// calls precheck.done() itself, so it's looked up via the listing exactly
// like CPC_E2E_TS10/11/12 Part 1 do
// (PrecheckEnquiryPage.findTransactionIdByVehicleNo + a direct goto to its
// Details view) — same approach CPC_E2E_TS3 already uses for its own
// no-Deregistration reshow case. There is no Deregistration Details page or
// ref no. here (the reshow never lets one complete), so
// runJpjXmlLogChecklist() is called with `deregRefNo: ''`, same as TS3/TS12.
// None of detailsCheck/jpjXmlLogCheck feed the SUCCESS condition below — like
// TS3, they're reported for the tester to eyeball, not hard pass/fail gates.
//
// NEVER RUN LIVE in this corrected form — check knowledge/flow-edereg.md §33
// first if anything here surprises you.
test('Deregistration (pre-check done in step 2) — CPC_E2E_TS9, Failed then re-entry reshows the same result', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  await ensureEsimJpjErrorPath(inputs.vehicleRegNo);

  session.logUrl('after login');
  await session.closeBanners();

  const vehicle = getDeregVehicleInputs();
  const mykad = new MykadEmulatorClient(page.context());
  let firstAttempt: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  let secondAttempt: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYPR');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(vehicle);

    firstAttempt = await dereg.resolveVehicleGate(inputs.vehicleRegNo);
    if (firstAttempt.satisfied) {
      throw new Error(`Expected the first attempt to come back Failed (VEL000045E) — got satisfied=true (${firstAttempt.jpjStatus} / ${firstAttempt.responseDesc}). Check whether this vehicle already had a qualifying pre-check.`);
    }

    // Re-steer to Approved BEFORE the second entry — deliberately, to prove
    // the reshow-only behavior ignores the underlying eSIM code entirely.
    // Same reasoning as every other run for setting eSIM explicitly
    // (knowledge/esim.md), just steered the opposite way from what you'd
    // expect a "retry" to want.
    await ensureEsimHappyPath(inputs.vehicleRegNo);

    secondAttempt = await dereg.resolveVehicleGate(inputs.vehicleRegNo);
  } finally {
    await mykad.close();
  }

  // Plan's final checklist step. The first attempt's inline pre-check
  // persisted a real (Failed) transaction — looked up via the listing since
  // this entry point never calls precheck.done() itself, same as
  // CPC_E2E_TS10/11/12 Part 1.
  const precheck = new PrecheckEnquiryPage(page, session);
  const listing = await precheck.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);

  const precheckTransactionId = await precheck.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
  let detailsCheck: Awaited<ReturnType<PrecheckEnquiryPage['verifyDetailsPage']>> | null = null;
  if (precheckTransactionId) {
    await page.goto(`${CONFIG.baseUrlFor(inputs.envSegment)}/view/aatf/dereg/precheck/enquiry/view.do?id=${precheckTransactionId}`);
    detailsCheck = await precheck.verifyDetailsPage(inputs.vehicleRegNo);
  }

  const jpjXmlLogCheck = await runJpjXmlLogChecklist({
    page, envSegment: inputs.envSegment, vehicleRegNo: inputs.vehicleRegNo,
    precheckRefNo: detailsCheck?.refNo ?? '', deregRefNo: '',
    expectedResponseCode: firstAttempt?.responseDesc?.split(' - ')[0]?.trim() ?? '',
  });

  // Per Faizuddin: no further Deregistration steps run after the second
  // entry's reshow. Hold 3s so the final state is visible in the recording
  // before the script finishes.
  await session.active().waitForTimeout(3000);

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: firstAttempt?.satisfied === false && firstAttempt?.dialogShape === 'paid'
      && secondAttempt?.satisfied === false && secondAttempt?.dialogShape === 'closed-direct'
      ? 'SUCCESS' : 'FAIL',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    firstAttempt,
    secondAttempt,
    listing,
    detailsCheck,
    jpjXmlLogCheck,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
