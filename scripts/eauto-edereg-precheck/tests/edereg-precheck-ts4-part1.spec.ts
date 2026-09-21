import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { ensureEsimHappyPath } from '../utils/esim';

// ── CPC_E2E_TS4, PART 1 of 2: [Approved] (EAINT-9306) ──
// "6-month SRD expiry" block (flow-edereg.md §5.5) — Approved variant.
// Create eDereg Pre-Checking Enquiry with Trx Status = Approved, Enquiry
// Response = GLB000000I, THEN STOP — the next step needs a dev to manually
// patch this transaction's JPJ-approval timestamp back more than 6 months
// (there is no in-app way to fast-forward this). Part 2
// (edereg-precheck-ts4-part2.spec.ts) picks up from there once the patch is
// done, using the SAME vehicle no.
//
// The PDF test plan's own text literally reads "CPC_E2E_TS1" for this row
// (confirmed via raw PDF text extraction, not a transcription error on our
// end) — treated as CPC_E2E_TS4 per lib/ticketStudies.ts's existing
// automation.groups mapping and this row's position in the "Expired (After
// 6 Months)" block (right after TS1-3's fresh variants, followed by TS5/TS6
// which ARE correctly labelled).
test('eDereg Pre-Checking Enquiry — CPC_E2E_TS4 Part 1 (Approved, then hand off for expiry patch)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(5 * 60_000);

  await ensureEsimHappyPath(inputs.vehicleRegNo);

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
    status: precheckResult.jpjStatusLabel === 'OK' ? 'PART1_DONE' : 'FAIL',
    tsNo: 'CPC_E2E_TS4',
    part: 1,
    vehicleRegNo: precheckResult.vehicleRegNo,
    envSegment: inputs.envSegment,
    transactionId,
    responseDesc: precheckResult.responseDesc,
    nextAction: 'Ask dev to patch this eDereg Pre-Checking transaction to expire (backdate JPJ approval past 6 months), then run CPC_E2E_TS4 Part 2 for the SAME vehicle no.',
    continuesAs: 'ts4-part2',
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
