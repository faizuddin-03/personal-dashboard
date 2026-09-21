import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';

// ── CJ_TS2, PART 2 of 2 (EAINT-9306) — pure read, no action ──
// Continues Part 1 (edereg-precheck-cj-ts2-part1.spec.ts) for the SAME
// vehicle no., after a dev has run the cronjob (or the daily 23:59:59 run
// has happened) on the Failed (JPJ error) pre-check Part 1 created via
// the standalone Enquiry flow.
//
// Expected (knowledge/flow-edereg.md §5.5): Trx Status stays Failed —
// the cronjob explicitly does NOT pick up an already-Failed record.
// Remarks expected to stay blank (this record never had a prior
// cancel/expire action to set one).
//
// PRECONDITION: run CJ_TS2 Part 1 first, wait for dev to confirm the
// cronjob has run (or been skipped), then run this with the SAME
// vehicleRegNo.
//
// NEVER RUN LIVE.
test('eDereg Pre-Checking listing — CJ_TS2 Part 2 (Failed, cronjob does not pick it up)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(5 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  const precheck = new PrecheckEnquiryPage(page, session);
  const listing = await precheck.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);

  if (listing.trxStatus !== 'Failed') {
    throw new Error(`Expected Trx Status to stay Failed (cronjob should NOT pick this up) — got "${listing.trxStatus}".`);
  }
  if (listing.remarks !== '') {
    throw new Error(`Expected Remarks to stay blank (no cronjob action expected) — got "${listing.remarks}".`);
  }

  console.log('RESULT:' + JSON.stringify({
    status: listing.trxStatus === 'Failed' && listing.remarks === '' ? 'SUCCESS' : 'FAIL',
    tsNo: 'CJ_TS2',
    part: 2,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    listing,
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
