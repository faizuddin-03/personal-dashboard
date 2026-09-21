import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { ensureEsimJpjErrorPath } from '../utils/esim';

// ── CPC_E2E_TS5, PART 1 of 2: [Failed] (EAINT-9306) ──
// "6-month SRD expiry" block — Failed variant, RE (payment reset-timer) at
// Part 2. Create eDereg Pre-Checking Enquiry with Trx Status = Failed,
// Enquiry Response = VEL000045E, THEN STOP for the same dev expiry-patch
// handoff as CPC_E2E_TS4 Part 1. Part 2 (edereg-precheck-ts5-part2.spec.ts)
// picks up from there using the SAME vehicle no.
//
// The test plan's own bracket label for this row reads "[Failed - Vehicle
// Not Exist]", which doesn't match its own response code (VEL000045E is
// the JPJ-error code, not Vehicle-Not-Exist, per flow-edereg.md §5.2) — the
// same kind of label/content mismatch already seen on CPC_E2E_TS4's row.
// Followed the literal response code, not the bracket text.
test('eDereg Pre-Checking Enquiry — CPC_E2E_TS5 Part 1 (Failed, then hand off for expiry patch)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(5 * 60_000);

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
  const transactionId = await precheck.done();

  console.log('RESULT:' + JSON.stringify({
    status: precheckResult.jpjStatusLabel === 'Failed' ? 'PART1_DONE' : 'FAIL',
    tsNo: 'CPC_E2E_TS5',
    part: 1,
    vehicleRegNo: precheckResult.vehicleRegNo,
    envSegment: inputs.envSegment,
    transactionId,
    responseDesc: precheckResult.responseDesc,
    nextAction: 'Ask dev to patch this eDereg Pre-Checking transaction to expire (backdate JPJ approval past 6 months), then run CPC_E2E_TS5 Part 2 for the SAME vehicle no.',
    continuesAs: 'ts5-part2',
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
