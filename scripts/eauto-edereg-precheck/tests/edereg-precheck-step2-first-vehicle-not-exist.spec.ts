import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimVehicleNotExistPath, ensureEsimHappyPath } from '../utils/esim';
import { probeRepurchase } from '../utils/repurchaseProbe';

// ── CPC_E2E_TS8: [Failed - Vehicle Not Exist] (EAINT-9306) ──
// "Pre-check done in step 2" entry point (flow-edereg.md §2), same entry
// point as CPC_E2E_TS7, but the Failed outcome — TS2's category/response
// code (MyPR, VEL000100E) reached through TS7's no-standalone-enquiry path.
// No standalone Pre-Checking Enquiry: create a Deregistration transaction
// directly for a vehicle with no prior pre-check, MyPR category. At Step 2,
// resolveVehicleGate() drives the inline popup (#precheck-popup -> Next ->
// #payment-result -> Close) same as TS7, but this time the outcome is
// Failed, so the gate resets #vehicleRegNo to blank instead of turning green.
//
// ── EXTENDED 2026-09-04 (§40), per Faizuddin ──
// No longer a dead end. VEL000100E is the ONE code that allows a REPURCHASE
// (each one creating its own brand-new precheck transaction, repeatable), so
// after the first inline failure this test now:
//   1. repurchases twice, still on VEL000100E — each purchase must be offered
//      and must add its own listing row;
//   2. re-steers eSIM to GLB000000I, buys one FINAL pre-check that comes back
//      Approved, and completes all six Deregistration steps to Done.
// Phase 2 is required because while the code stays VEL000100E the gate can
// never go green, so no number of repurchases could finish a Deregistration.
//
// IMPORTANT PRECONDITION: vehicleRegNo must have NO prior pre-checking
// transaction, same as TS7 — a vehicle already carrying an Approved
// pre-check from an earlier run would show the green gate immediately with
// no inline popup, the wrong entry point for this case.
//
// Built entirely from pieces already confirmed piecemeal (resolveVehicleGate's
// Failed branch from CPC_E2E_TS2, MyPR category + no-standalone-enquiry
// entry from CPC_E2E_TS7) — but this exact combination has not itself been
// run live. Check knowledge/flow-edereg.md §9 first if anything here
// surprises you.
test('Deregistration (pre-check done in step 2) — CPC_E2E_TS8, Failed (Vehicle Not Exist) then repurchase to completion', async ({ loggedInPage: page, session, inputs }) => {
  // Raised 9 -> 25 min 2026-09-04, same reasoning as CPC_E2E_TS2: two extra
  // payment round trips for the repurchase rounds, a full Deregistration leg
  // (three MyKad auths, JPJ check, final payment), and four eSIM browser
  // spawns. Still inside the run route's own 40-minute cap.
  test.setTimeout(25 * 60_000);

  // eSIM is shared across every tester — steer both entities explicitly,
  // every run, same reasoning as every other case (knowledge/esim.md).
  await ensureEsimVehicleNotExistPath(inputs.vehicleRegNo);

  session.logUrl('after login');
  await session.closeBanners();

  // The emulator and page object stay alive for the WHOLE test — the
  // completion leg at the end needs two more MyKad/thumbprint auth round
  // trips (owner consent, AATF rep), so closing the emulator after the gate
  // step (as this test used to) would strand them.
  const mykad = new MykadEmulatorClient(page.context());
  let gate: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  let repurchase: Awaited<ReturnType<typeof probeRepurchase>> | null = null;
  let finalGate: Awaited<ReturnType<DeregTransactionPage['fillVehicleDetails']>> | null = null;
  let jpjCheckResult: Awaited<ReturnType<DeregTransactionPage['jpjCheck']>> | null = null;
  let deregResult: Awaited<ReturnType<DeregTransactionPage['payAndDeregister']>> | null = null;
  let precheckLinkCheck: Awaited<ReturnType<DeregTransactionPage['verifyPrecheckingYesLink']>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYPR');
    await dereg.authenticateOwner();
    gate = await dereg.resolveVehicleGate(inputs.vehicleRegNo);

    // ── 1. Repurchase check (§40). Still on VEL000100E, so each purchase
    // succeeds at payment and comes back Failed at the JPJ enquiry. Two
    // rounds, to show it repeats.
    repurchase = await probeRepurchase(session, inputs.envSegment, inputs.vehicleRegNo, 2);

    // ── 2. Re-steer to an Approved code and carry it through to Done.
    // Necessary because while the code stays VEL000100E the gate can never go
    // green, so the Deregistration is unreachable however many times the user
    // repurchases. Added 2026-09-04, per Faizuddin.
    await ensureEsimHappyPath(inputs.vehicleRegNo);

    // fillVehicleDetails() runs resolveVehicleGate() itself — that IS the
    // final purchase (fresh popup, pay, Approved, gate green) — then fills the
    // rest of Step 2 and submits. It throws clearly if the gate stays shut.
    finalGate = await dereg.fillVehicleDetails(inputs, getDeregVehicleInputs());
    await dereg.ownerConsentAndAuth();
    await dereg.aatfConsentAndAuth();
    jpjCheckResult = await dereg.jpjCheck();
    deregResult = await dereg.payAndDeregister();
    precheckLinkCheck = await dereg.verifyPrecheckingYesLink(inputs.vehicleRegNo);
  } finally {
    await mykad.close();
  }

  // This is a genuinely first-ever check (precondition: no prior pre-check
  // on this vehicle at all) — nothing to reshow yet, so the full payment
  // popup ('paid' shape) is the correct/expected result here, unlike
  // CPC_E2E_TS2's reused-VN case (knowledge/flow-edereg.md §33). That part is
  // UNCHANGED by §40's repurchase rule: with no prior record, there is
  // nothing for the app to decide between reshowing and reselling.
  //
  // Hold 3s so the final state is visible in the recording before the end.
  await session.active().waitForTimeout(3000);

  const finalPage = session.active();
  const repurchaseOk = !!repurchase?.repurchaseOffered && !!repurchase?.eachRepurchaseCreatedNewRow;
  const completedOk = finalGate?.satisfied === true
    && !!deregResult?.jpjDeregistrationStatus.startsWith('OK');
  console.log('RESULT:' + JSON.stringify({
    status: gate?.jpjStatus === 'Failed' && gate?.satisfied === false
      && gate?.dialogShape === 'paid' && repurchaseOk && completedOk
      ? 'SUCCESS' : 'FAIL',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    inlineRetry: gate,
    repurchase,
    deregistration: {
      finalGateSatisfied: finalGate?.satisfied ?? false,
      finalPrecheckJpjStatus: finalGate?.jpjStatus ?? '',
      finalPrecheckResponseDesc: finalGate?.responseDesc ?? '',
      jpjCheckStatus: jpjCheckResult?.jpjStatus ?? '',
      jpjCheckResponseCode: jpjCheckResult?.responseCode ?? '',
      jpjDeregistrationStatus: deregResult?.jpjDeregistrationStatus ?? '',
      transactionId: deregResult?.transactionId ?? '',
    },
    precheckLinkCheck,
    verdict: {
      firstEverCheckWasPaidShape: gate?.dialogShape === 'paid',
      precheckFailedAsSteered: gate?.jpjStatus === 'Failed',
      repurchaseOffered: !!repurchase?.repurchaseOffered,
      repurchaseCount: repurchase?.repurchaseCount ?? 0,
      eachRepurchaseCreatedNewRow: !!repurchase?.eachRepurchaseCreatedNewRow,
      repeatable: !!repurchase?.repeatable,
      precheckRowsBefore: repurchase?.rowsBefore ?? -1,
      precheckRowsAfter: repurchase?.rowsAfter ?? -1,
      reshowRounds: repurchase?.reshowCount ?? 0,
      finalPurchaseApproved: finalGate?.satisfied === true,
      deregistrationCompleted: completedOk,
    },
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
