import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS } from '../utils/esim';
import { runJpjXmlLogChecklist } from '../utils/srdChecklist';

// ── CPC_E2E_TS6, PART 2 of 2 (EAINT-9306) ──
// Continues Part 1 (edereg-precheck-ts6-part1.spec.ts) for the SAME vehicle
// no., after a dev has patched that vehicle's eDereg Pre-Checking
// transaction to expire. Create Deregistration Trx using MyPR -> at Step 2
// the expired pre-check doesn't satisfy the gate, so the inline popup runs
// -> steer RHB Transfer to "IF" (insufficient funds) -> Click [Next] to
// resubmit payment failed MULTIPLE times, per the test plan's own wording —
// unlike CPC_E2E_TS5's "RE", "IF" is never re-steered to succeed within
// this test case. The test plan's own pass criterion is deliberately soft
// ("Ensure system behaviour is acceptable") — there is no dev-patch
// continuation beyond this and no expectation of eventual success; this
// just exercises the SAME payment attempted several times and checks it
// keeps declining the same way each time (no crash, no unexpected escape
// from the Payment History shape).
//
// PRECONDITION: run CPC_E2E_TS6 Part 1 first, wait for dev to confirm the
// expiry patch, then run this with the SAME vehicleRegNo.
//
// NONE of this has been run live — same caveat as CPC_E2E_TS5 Part 2 for
// the shared DECLINED-payment popup shape (Payment History list, native
// confirm() on every attempt). "IF" is not expected to show the
// #reset-timer countdown at all (only "RE" — "reset" — per its name and
// knowledge/esim.md § RHB Transfer), so no wait is built in between
// retries here; if IF DOES show a countdown live, that's new information
// worth capturing.
//
// Added 2026-08-24, per Faizuddin: the SRD's TS1 checklist applies to the
// LAST part of every two-part case — but ONLY the JPJ XML Log item applies
// here, by Vehicle No. only. This scenario never completes a Deregistration
// (no `payAndDeregister()` call) and never satisfies the gate (every
// attempt declines), so there's no Deregistration Details page for the
// "Yes" hyperlink check, no Deregistration ref no. to search the JPJ XML Log
// by, and no newly-Approved Pre-Checking transaction for the details-page
// check either — nothing exists on screen for those 3 items to check.
test('Deregistration (expired pre-check, insufficient-funds retries) — CPC_E2E_TS6 Part 2', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS);

  session.logUrl('after login');
  await session.closeBanners();

  const mykad = new MykadEmulatorClient(page.context());
  const attempts: Awaited<ReturnType<DeregTransactionPage['attemptInlinePayment']>>[] = [];
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYPR');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(getDeregVehicleInputs());

    attempts.push(await dereg.beginInlinePaymentFlow(inputs.vehicleRegNo));
    // "resubmit ... multiple times" — 3 retries total (4 attempts), enough
    // to see the pattern hold without an open-ended loop.
    for (let i = 0; i < 3; i++) {
      attempts.push(await dereg.attemptInlinePayment());
    }
  } finally {
    await mykad.close();
  }

  const jpjXmlLogCheck = await runJpjXmlLogChecklist({
    page, envSegment: inputs.envSegment, vehicleRegNo: inputs.vehicleRegNo,
    precheckRefNo: '', deregRefNo: '', expectedResponseCode: '',
  });

  const allDeclinedConsistently = attempts.every(a => a.declined);
  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: allDeclinedConsistently ? 'SUCCESS' : 'FAIL',
    tsNo: 'CPC_E2E_TS6',
    part: 2,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    paymentAttempts: attempts,
    jpjXmlLogCheck,
    note: 'Exploratory — the test plan only requires "acceptable" system behaviour across repeated failed retries, not eventual success. No further continuation beyond this.',
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
