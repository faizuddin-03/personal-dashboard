import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';

// ── CPC_E2E_TS12, PART 1 of 2 (EAINT-9306) ──
// "6-month SRD expiry" block, "pre-check done in step 2" entry point —
// structurally the step2-first sibling of CPC_E2E_TS10/TS11 (same shape as
// edereg-precheck-ts10-part1.spec.ts, see that file's doc comment for the
// full reasoning): create a Deregistration Trx for a vehicle with NO prior
// pre-check, resolve the inline gate as Approved, STOP right there, hand off
// for the expiry patch. TS12's own payment-decline behaviour (RHB API Down,
// code "ER" — corrected 2026-08-27, was assumed IF insufficient-funds until
// this session, see edereg-precheck-ts12-part2.spec.ts's own doc comment for
// the full correction — repeated, no recovery) is exercised entirely in
// Part 2, not here — Part 1 only needs to produce ONE real, persisted
// pre-check to later expire, and an inline-Failed outcome does not persist
// one (dead-end shape, same as CPC_E2E_TS2/TS8). Transaction ID looked up
// via the "eDereg Pre-Checking Transaction Listing" page
// (PrecheckEnquiryPage.findTransactionIdByVehicleNo), per Faizuddin
// 2026-08-24.
//
// NEVER RUN LIVE.
test('Deregistration (pre-check done in step 2) — CPC_E2E_TS12 Part 1 (Approved, then hand off for expiry patch)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  await ensureEsimHappyPath(inputs.vehicleRegNo);

  session.logUrl('after login');
  await session.closeBanners();

  const mykad = new MykadEmulatorClient(page.context());
  let gate: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(getDeregVehicleInputs());
    gate = await dereg.resolveVehicleGate(inputs.vehicleRegNo);
  } finally {
    await mykad.close();
  }

  let transactionId = '';
  if (gate?.satisfied && gate?.usedInlinePrecheck) {
    const precheck = new PrecheckEnquiryPage(page, session);
    transactionId = await precheck.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
  }

  console.log('RESULT:' + JSON.stringify({
    status: gate?.satisfied && gate?.usedInlinePrecheck ? 'PART1_DONE' : 'FAIL',
    tsNo: 'CPC_E2E_TS12',
    part: 1,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    transactionId,
    responseDesc: gate?.responseDesc ?? '',
    nextAction: 'Ask dev to patch this eDereg Pre-Checking transaction to expire (backdate JPJ approval past 6 months), then run CPC_E2E_TS12 Part 2 for the SAME vehicle no.',
    continuesAs: 'ts12-part2',
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
