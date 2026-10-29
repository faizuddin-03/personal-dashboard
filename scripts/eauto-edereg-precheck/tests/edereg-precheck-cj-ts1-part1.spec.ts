import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import {
  setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS,
  setEsimResponseCode, vehiclePrefix, DEREG_PRECHECK_RESPONSE_CODE_JPJ_ERROR,
} from '../utils/esim';

// ── CJ_TS1, PART 1 of 2 (EAINT-9306) — "Cronjob" block ──
// Test plan (per Faizuddin's Miro paste, 2026-08-27 — see
// knowledge/flow-edereg.md §5.5 for the full CJ_TS1-5 table):
//
//   Starting Trx Status: Failed
//   1. Create new Deregistration until step 2
//   2. Proceed with purchasing Pre-Check with RHB Payment = Failed, JPJ
//      Pre-Check Status = Failed
//   3. Wait until cronjob runs
//   Expected: Trx Status = Expired (cronjob picks it up), Remarks =
//   "Transaction Expired", rest unchanged
//
// Per Faizuddin, 2026-08-27: "i want to make all 5 TS with 2 parts. before
// and after cronjob. the before will create the transactions up till the
// mentioned status. the after will check the status and the other
// details." Part 1 here is the "before" — produce a real, persisted
// Failed (RHB IF) Pre-Checking transaction via the Deregistration-
// embedded inline entry point, then hand off for the dev to run the
// cronjob (or wait for the daily 23:59:59 run). Part 2
// (edereg-precheck-cj-ts1-part2.spec.ts) is the "after" — pure read, no
// further action.
//
// A DECLINED inline payment (RHB "IF") DOES persist a real record —
// confirmed live by MU_TS9 (§27), which had BackOffice successfully find
// and cancel this exact shape. This is UNLIKE the inline JPJ-Failed shape
// (VEL0000xxE codes), which resets to blank instead of persisting — see
// ts10-part1.spec.ts's own doc comment and CJ_TS2's own Part 1 (which
// uses the STANDALONE entry point instead, for exactly that reason).
//
// Per Faizuddin, 2026-08-28: also steer the Dereg Precheck (JPJ) response
// code to VEL000045E alongside RHB "IF", even though the gate's own
// JPJ-then-payment ordering means the payment decline is expected to be
// what actually determines the outcome here — "i know it doesnt even hit
// it, but just in case want to test the system stills calls for the
// checking thing." Belt-and-suspenders only: NOT via ensureEsimJpjErrorPath()
// (that helper resets RHB Transfer back to OK, which would undo the
// payment-decline steering this test actually needs) — set directly via
// setEsimResponseCode() instead, leaving RHB Transfer on "IF".
//
// NEVER RUN LIVE.
test('Deregistration — CJ_TS1 Part 1 (Failed via RHB IF, then hand off for cronjob expiry)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS);
  const jpjSteer = await setEsimResponseCode(
    'dereg-precheck-enquiry', vehiclePrefix(inputs.vehicleRegNo), DEREG_PRECHECK_RESPONSE_CODE_JPJ_ERROR,
  );
  if (!jpjSteer.ok) throw new Error(`[esim] Could not set Dereg Precheck Response Code: ${jpjSteer.reason}`);

  session.logUrl('after login');
  await session.closeBanners();

  const mykad = new MykadEmulatorClient(page.context());
  const dereg = new DeregTransactionPage(page, session, mykad);
  let attempt: Awaited<ReturnType<DeregTransactionPage['attemptInlinePayment']>> | null = null;
  try {
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(getDeregVehicleInputs());
    const alreadySatisfied = await dereg.fillVehicleRegNoAndCheckGate(inputs.vehicleRegNo);
    if (alreadySatisfied) {
      throw new Error(`CJ_TS1 needs the gate BLOCKED (no valid pre-check) so the inline popup appears — vehicle ${inputs.vehicleRegNo} already has one.`);
    }
    attempt = await dereg.attemptInlinePayment();
    if (!attempt.declined) {
      throw new Error(`Expected the payment attempt (RHB "IF") to be DECLINED — it wasn't (${attempt.jpjStatus} / ${attempt.responseDesc}).`);
    }
  } finally {
    await mykad.close();
  }
  session.progress('cj-ts1-declined', `Payment declined as expected: "${attempt?.dialogMessage ?? ''}"`);

  const precheck = new PrecheckEnquiryPage(page, session);
  const transactionId = await precheck.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);

  console.log('RESULT:' + JSON.stringify({
    status: attempt?.declined && transactionId ? 'PART1_DONE' : 'FAIL',
    tsNo: 'CJ_TS1',
    part: 1,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    transactionId,
    paymentAttempt: attempt,
    nextAction: 'Ask dev to run the cronjob (or wait for the daily 23:59:59 run) so this Failed pre-check transaction expires, then run CJ_TS1 Part 2 for the SAME vehicle no.',
    continuesAs: 'cj-ts1-part2',
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
