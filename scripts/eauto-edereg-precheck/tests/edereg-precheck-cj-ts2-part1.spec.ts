import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { ensureEsimJpjErrorPath } from '../utils/esim';

// ── CJ_TS2, PART 1 of 2 (EAINT-9306) — "Cronjob" block ──
// Test plan (per Faizuddin's Miro paste, 2026-08-27 — see
// knowledge/flow-edereg.md §5.5 for the full CJ_TS1-5 table):
//
//   Starting Trx Status: Failed
//   1. Create new Deregistration until step 2
//   2. Proceed with purchasing Pre-Check with JPJ Pre-Check Status = Failed
//   3. Wait until cronjob runs
//   Expected: Trx Status stays Failed (cronjob does NOT pick it up), all
//   details unchanged
//
// **DELIBERATELY uses the STANDALONE "eDereg Pre-Checking Enquiry" entry
// point, NOT the literal "Create new Deregistration until step 2"
// wording.** The Deregistration-embedded inline entry point does NOT
// persist anything on a JPJ-Failed outcome — it resets `#vehicleRegNo` to
// blank instead (confirmed live, CPC_E2E_TS2/TS8's own dead-end shape;
// see ts10-part1.spec.ts's own doc comment). A dead-end record can't be
// checked post-cronjob at all, so there'd be nothing for Part 2 to read.
// CPC_E2E_TS5 Part 1 (§ same knowledge doc) hit this EXACT same problem
// for the exact same JPJ-Failed shape and resolved it the exact same way
// — the standalone Enquiry flow persists a real record regardless of
// Approved/Failed outcome. Followed that precedent rather than asking
// again.
//
// NEVER RUN LIVE.
test('eDereg Pre-Checking Enquiry — CJ_TS2 Part 1 (JPJ Failed, then hand off for cronjob no-op check)', async ({ loggedInPage: page, session, inputs }) => {
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
  if (precheckResult.jpjStatusLabel !== 'Failed') {
    throw new Error(`Expected JPJ Pre-Check Status = Failed — got "${precheckResult.jpjStatusLabel}" (${precheckResult.responseDesc}).`);
  }
  const transactionId = await precheck.done();

  console.log('RESULT:' + JSON.stringify({
    status: precheckResult.jpjStatusLabel === 'Failed' && transactionId ? 'PART1_DONE' : 'FAIL',
    tsNo: 'CJ_TS2',
    part: 1,
    vehicleRegNo: precheckResult.vehicleRegNo,
    envSegment: inputs.envSegment,
    transactionId,
    responseDesc: precheckResult.responseDesc,
    nextAction: 'Ask dev to run the cronjob (or wait for the daily 23:59:59 run) — this Failed pre-check is expected to be LEFT ALONE, not expired. Then run CJ_TS2 Part 2 for the SAME vehicle no.',
    continuesAs: 'cj-ts2-part2',
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
