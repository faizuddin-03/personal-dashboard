import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';

// ── CJ_TS4, PART 2 of 2 (EAINT-9306) — pure read, no action ──
// Continues Part 1 (edereg-precheck-cj-ts4-part1.spec.ts) for the SAME
// vehicle no., after a dev has run the cronjob (or the daily 23:59:59 run
// has happened) on the Approved pre-check Part 1 created.
//
// Expected (knowledge/flow-edereg.md §5.5): Trx Status stays Approved —
// the cronjob never touches an Approved record. Remarks expected to stay
// blank (no cancel/expire action has ever happened on this row).
//
// PRECONDITION: run CJ_TS4 Part 1 first, wait for dev to confirm the
// cronjob has run (or been skipped), then run this with the SAME
// vehicleRegNo.
//
// NEVER RUN LIVE.
test('eDereg Pre-Checking listing — CJ_TS4 Part 2 (Approved, cronjob never touches it)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(5 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  const precheck = new PrecheckEnquiryPage(page, session);
  const listing = await precheck.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);

  if (listing.trxStatus !== 'Approved') {
    throw new Error(`Expected Trx Status to stay Approved (cronjob should NEVER touch this) — got "${listing.trxStatus}".`);
  }
  if (listing.remarks !== '') {
    throw new Error(`Expected Remarks to stay blank (no cronjob action expected) — got "${listing.remarks}".`);
  }

  console.log('RESULT:' + JSON.stringify({
    status: listing.trxStatus === 'Approved' && listing.remarks === '' ? 'SUCCESS' : 'FAIL',
    tsNo: 'CJ_TS4',
    part: 2,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    listing,
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
