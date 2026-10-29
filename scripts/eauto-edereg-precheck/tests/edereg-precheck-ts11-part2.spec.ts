import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimJpjErrorPath, ensureEsimHappyPath } from '../utils/esim';
import { runJpjXmlLogChecklist } from '../utils/srdChecklist';

// ── CPC_E2E_TS11, PART 2 of 2 (EAINT-9306) ──
//
// **REWRITTEN AGAIN 2026-09-03, after its FIRST live run failed — the
// 2026-08-27 build's premise was unreachable.** That build (correctly, for
// what was known at the time) reused CPC_E2E_TS9's "resolveVehicleGate()
// twice, re-steering eSIM between attempts" retry pattern to drive the
// plan's "Set eSim Dereg Enq. Response = GLB000000I > Continue with eDereg
// Trx Status = Approved, Payment = OK" step. But TS9 itself was rewritten
// on 2026-09-02 — five days AFTER this file was written — for exactly the
// reason this run then hit.
//
// The live failure, 2026-09-03: the first attempt behaved perfectly
// ('paid' shape, Failed / VEL000045E, Vehicle No. field blank). The second
// attempt came back `satisfied=false` with `jpjStatus`/`responseDesc` both
// `undefined`, logging `"Vehicle No. field blank after Close: false"` —
// the message ONLY resolveVehicleGate()'s `closed-direct` branch emits. It
// had reshown the FIRST attempt's stale Failed result instead of running a
// fresh check.
//
// Root cause, already settled and confirmed live twice elsewhere —
// knowledge/flow-edereg.md §33/§35/§36: once a vehicle has a Failed
// pre-check on file, ANY later entry at Step 2 — same still-open form, a
// different session, even a different user under the same company — only
// PULLS UP AND REDISPLAYS that stale Failed result. No fresh JPJ check
// runs, so re-steering eSIM to GLB000000I beforehand changes nothing.
// Approved is unreachable through a retry, full stop. §36 explicitly
// predicted this file would be affected: "any OTHER test in this suite
// that assumes a Failed precheck can be superseded/resolved by a LATER
// attempt should be treated as suspect until checked."
//
// NOTE this is NOT the same situation as CPC_E2E_TS10 Part 2, which stays
// valid: TS10 never fails a first attempt, so no Failed record exists and
// its single expired-pre-check gate genuinely does get a fresh purchase.
// The reshow rule keys on a FAILED record, not an EXPIRED one.
//
// **Redefined accordingly, per Faizuddin 2026-09-03** — the same fix
// already applied to CPC_E2E_TS9 (§33), MU_TS5 (§35) and MU_TS6 (§36).
// The plan's Deregistration continuation ("Trx Status = Approved, Payment
// = OK, JPJ Pre-Checking = OK > Go to Details Page > Ensure Yes hyperlink
// is displayed and click it > Redirects to Pre-Check Listing Page") is
// dropped — it cannot be reached from a VEL000045E first attempt — along
// with runPostDeregSrdChecklist(), whose 4 items all need a completed
// Deregistration on screen. What this test now proves: on an EXPIRED
// pre-check the inline gate offers a genuinely fresh purchase ('paid'),
// that purchase fails at JPJ level (VEL000045E), and the re-entry
// afterwards reshows that stale Failed result ('closed-direct') even
// though eSIM has been re-steered to Approved in between.
//
// The plan's "Ensure details in eDereg Pre-Checking Listing are displayed
// correctly" step IS still reachable, so it's kept — but read at the END
// (reading it between the two attempts would navigate away from the
// still-open Step 2 form and lose it) and reported only, NOT asserted:
// no expected row shape for this setup has ever been confirmed live, and
// guessing one would just re-run the mistake this rewrite is fixing.
//
// ADDED (this session): the rest of the plan's own final checklist line —
// "Ensure Step Page, Transaction Listing, JPJ XML Log and Details Page
// showing correctly" — only had the Transaction Listing half built; Details
// Page and JPJ XML Log were never added after runPostDeregSrdChecklist()
// (the Deregistration-side checklist) was dropped as unreachable. Same fix
// as CPC_E2E_TS3's own no-completed-Deregistration case: the FIRST attempt's
// inline pre-check DID persist a real Failed transaction, so its own Details
// Page is looked up via the listing (PrecheckEnquiryPage.
// findTransactionIdByVehicleNo + a direct goto, same as
// CPC_E2E_TS10/11/12 Part 1) rather than via precheck.done(), which this
// entry point never calls. This vehicle now carries TWO Pre-Checking
// transactions (Part 1's now-expired one, and Part 2's new Failed one) —
// `.first()` is confirmed to land on the newest row (utils/srdChecklist.ts's
// own doc comment, from two live BO JPJ XML Log captures), which is the one
// this scenario is actually about. `deregRefNo: ''` since no Deregistration
// completes here, same as TS3/TS9/TS12. Neither addition feeds the SUCCESS
// condition below — reported for the tester to eyeball, same as the listing
// read already was.
//
// PRECONDITION: run CPC_E2E_TS11 Part 1 first, wait for dev to confirm the
// expiry patch, then run this with the SAME vehicleRegNo.
//
// NOT yet re-run live in this corrected form.
test('Deregistration (expired pre-check, JPJ-error then re-entry reshows the same result) — CPC_E2E_TS11 Part 2', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(10 * 60_000);

  await ensureEsimJpjErrorPath(inputs.vehicleRegNo);

  session.logUrl('after login');
  await session.closeBanners();

  const vehicle = getDeregVehicleInputs();
  const mykad = new MykadEmulatorClient(page.context());
  let firstAttempt: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  let secondAttempt: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(vehicle);

    // First attempt — the now-EXPIRED pre-check doesn't satisfy the gate, and
    // an expired record is not a failed one, so a genuinely fresh purchase is
    // offered ('paid'). Steered to the JPJ error (VEL000045E).
    firstAttempt = await dereg.resolveVehicleGate(inputs.vehicleRegNo);
    if (firstAttempt.satisfied) {
      throw new Error(`Expected the first attempt (on the now-expired pre-check) to come back Failed (VEL000045E) — got satisfied=true (${firstAttempt.jpjStatus} / ${firstAttempt.responseDesc}). Check the expiry patch actually applied.`);
    }
    if (firstAttempt.dialogShape !== 'paid') {
      throw new Error(`Expected the first attempt to get a FRESH payment popup (dialogShape 'paid') — got '${firstAttempt.dialogShape}'. A 'closed-direct' reshow here means this vehicle already had a FAILED pre-check on file before Part 2 started, not just the expired one Part 1 created.`);
    }

    // Re-steer to Approved BEFORE the second entry — deliberately, to prove
    // the reshow ignores the underlying eSIM code entirely. Same reasoning as
    // CPC_E2E_TS9's own corrected build, and the standing rule to set eSIM
    // explicitly rather than assume a resting value (knowledge/esim.md).
    await ensureEsimHappyPath(inputs.vehicleRegNo);

    secondAttempt = await dereg.resolveVehicleGate(inputs.vehicleRegNo);
    if (secondAttempt.satisfied) {
      throw new Error(`Expected the re-entry to RESHOW the stale Failed result, not resolve the gate — got satisfied=true (${secondAttempt.jpjStatus} / ${secondAttempt.responseDesc}). If this ever happens, the company-scoped reshow rule (flow-edereg.md §36) no longer holds and TS9/MU_TS5/MU_TS6 need re-checking too.`);
    }
    if (secondAttempt.dialogShape !== 'closed-direct') {
      throw new Error(`Expected the re-entry to reshow the existing Failed result (dialogShape 'closed-direct') — got '${secondAttempt.dialogShape}'.`);
    }
  } finally {
    await mykad.close();
  }

  // Plan step "Ensure details in eDereg Pre-Checking Listing are displayed
  // correctly" — reported for the tester to eyeball, deliberately NOT
  // asserted (see the file header).
  const precheck = new PrecheckEnquiryPage(page, session);
  const listing = await precheck.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
  session.progress('cpc-ts11-listing', `Pre-Checking listing — rows: ${listing.rowCount}, Payment: ${listing.paymentStatus}, JPJ Pre-Checking: ${listing.jpjPreChecking}, Trx Status: ${listing.trxStatus}`);

  // Plan's remaining checklist items — Details Page + JPJ XML Log — same
  // approach as CPC_E2E_TS3 (no completed Deregistration to key off, so look
  // up the persisted Failed transaction via the listing instead). `.first()`
  // lands on the NEWEST row (this Part 2 attempt), not Part 1's now-expired
  // one — confirmed newest-first ordering, see the file header.
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

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: firstAttempt?.satisfied === false && firstAttempt?.dialogShape === 'paid'
      && secondAttempt?.satisfied === false && secondAttempt?.dialogShape === 'closed-direct'
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'CPC_E2E_TS11',
    part: 2,
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
