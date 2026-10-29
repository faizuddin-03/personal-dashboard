import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath, setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_RESET_TIMER } from '../utils/esim';
import { runPostDeregSrdChecklist } from '../utils/srdChecklist';

// ── CPC_E2E_TS5, PART 2 of 2 (EAINT-9306) ──
// Continues Part 1 (edereg-precheck-ts5-part1.spec.ts) for the SAME vehicle
// no., after a dev has patched that vehicle's eDereg Pre-Checking
// transaction to expire. Create Deregistration Trx using MyKad -> at Step 2
// the expired pre-check doesn't satisfy the gate, so the inline popup runs
// -> steer RHB Transfer to "RE" so the FIRST payment attempt is DECLINED ->
// "payment failed message" (a native browser confirm(), auto-accepted by
// withNativeConfirm — see DeregTransactionPage.attemptInlinePayment's doc
// comment) -> Payment History + #reset-timer countdown popup -> wait out
// the ~6-minute reset window -> re-steer RHB Transfer to OK -> retry ->
// Approved -> gate satisfied -> continues through the rest of
// Deregistration same as CPC_E2E_TS1/TS7/TS9's continuation.
//
// PRECONDITION: run CPC_E2E_TS5 Part 1 first, wait for dev to confirm the
// expiry patch, then run this with the SAME vehicleRegNo.
//
// NONE of this has been run live — the entire DECLINED-payment popup shape
// (Payment History list, #reset-timer countdown, the native confirm() on
// every attempt) is built from a single captured HTML snapshot plus
// Faizuddin's descriptive note in that capture's header comment, not a live
// walkthrough. In particular: whether waitOutPaymentResetTimer()'s guessed
// end-condition (the #clockdiv reaching 00:00, or the whole #reset-timer
// block hiding) is even how the real countdown resolves is UNCONFIRMED —
// if this run hangs there for the full ~7-minute ceiling before proceeding
// anyway, that is the first thing to revisit. Check knowledge/flow-edereg.md
// §9's TS5 entry and knowledge/esim.md § RHB Transfer before changing
// anything here.
//
// Added 2026-08-24, per Faizuddin: the SRD's TS1 checklist applies to the
// LAST part of every two-part case — Part 1 doesn't have the details on
// screen to check, this Part 2 does. See utils/srdChecklist.ts's
// runPostDeregSrdChecklist().
test('Deregistration (expired pre-check, payment reset-timer retry) — CPC_E2E_TS5 Part 2', async ({ loggedInPage: page, session, inputs }) => {
  // Real ~6-minute wall-clock wait built in — budget well beyond the
  // other cases' 9-minute cap.
  test.setTimeout(16 * 60_000);

  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_RESET_TIMER);

  session.logUrl('after login');
  await session.closeBanners();

  const vehicle = getDeregVehicleInputs();
  const mykad = new MykadEmulatorClient(page.context());
  let firstAttempt: Awaited<ReturnType<DeregTransactionPage['attemptInlinePayment']>> | null = null;
  let secondAttempt: Awaited<ReturnType<DeregTransactionPage['attemptInlinePayment']>> | null = null;
  let gateSatisfied = false;
  let jpjCheckResult: Awaited<ReturnType<DeregTransactionPage['jpjCheck']>> | null = null;
  let deregResult: Awaited<ReturnType<DeregTransactionPage['payAndDeregister']>> | null = null;
  let srdChecklist: Awaited<ReturnType<typeof runPostDeregSrdChecklist>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(vehicle);

    firstAttempt = await dereg.beginInlinePaymentFlow(inputs.vehicleRegNo);
    if (!firstAttempt.declined) {
      throw new Error(`Expected the first payment attempt (RHB "RE") to be DECLINED — it wasn't (${firstAttempt.jpjStatus} / ${firstAttempt.responseDesc}).`);
    }

    await dereg.waitOutPaymentResetTimer();

    // Re-steer BOTH entities to their happy-path codes for the retry — same
    // reasoning as every other run (knowledge/esim.md): never assume the
    // resting value, set it explicitly.
    await ensureEsimHappyPath(inputs.vehicleRegNo);

    secondAttempt = await dereg.attemptInlinePayment();
    if (secondAttempt.declined) {
      throw new Error('Expected the retry to succeed after re-steering RHB Transfer to OK — it was declined again.');
    }

    gateSatisfied = await dereg.isVehicleGateSatisfiedNow();
    if (!gateSatisfied) {
      throw new Error('Payment succeeded but the vehicle gate did not turn green afterward.');
    }

    await dereg.submitVehicleDetails(vehicle);
    await dereg.ownerConsentAndAuth();
    await dereg.aatfConsentAndAuth();
    jpjCheckResult = await dereg.jpjCheck();
    deregResult = await dereg.payAndDeregister();
    srdChecklist = await runPostDeregSrdChecklist({
      page, session, dereg, envSegment: inputs.envSegment, vehicleRegNo: inputs.vehicleRegNo,
      expectedResponseCode: secondAttempt.responseDesc?.split(' - ')[0]?.trim() ?? '',
    });
  } finally {
    await mykad.close();
  }

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: firstAttempt?.declined && !secondAttempt?.declined && gateSatisfied
      && deregResult?.jpjDeregistrationStatus.startsWith('OK')
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'CPC_E2E_TS5',
    part: 2,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    paymentAttempts: [firstAttempt, secondAttempt],
    deregistration: {
      jpjCheckStatus: jpjCheckResult?.jpjStatus ?? '',
      jpjCheckResponseCode: jpjCheckResult?.responseCode ?? '',
      jpjDeregistrationStatus: deregResult?.jpjDeregistrationStatus ?? '',
      transactionId: deregResult?.transactionId ?? '',
    },
    detailsCheck: srdChecklist?.detailsCheck,
    precheckLinkCheck: srdChecklist?.precheckLinkCheck,
    jpjXmlLogCheck: srdChecklist?.jpjXmlLogCheck,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
