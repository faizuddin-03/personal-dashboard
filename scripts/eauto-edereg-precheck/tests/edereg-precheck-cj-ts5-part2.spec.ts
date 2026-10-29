import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';

// ── CJ_TS5, PART 2 of 2 (EAINT-9306) — pure read, no action ──
// Continues Part 1 (edereg-precheck-cj-ts5-part1.spec.ts) for the SAME
// vehicle no., after a dev has run the cronjob (or the daily 23:59:59 run
// has happened) on the Pending pre-check Part 1 created (never paid).
//
// Expected (knowledge/flow-edereg.md §5.5): Trx Status = Expired (cronjob
// picked it up), Remarks = "Transaction Expired", rest unchanged.
//
// PRECONDITION: run CJ_TS5 Part 1 first, wait for dev to confirm the
// cronjob has run, then run this with the SAME vehicleRegNo. **Confirmed
// 2026-08-28, per Faizuddin: the cronjob also skips same-day records** —
// a row created on the same calendar day as the 23:59:59 run is not
// picked up until the FOLLOWING day's run. Don't run this Part 2 the same
// day as Part 1, even after asking the dev to trigger the cronjob — see
// knowledge/flow-edereg.md §5.5 (this exact gap produced CJ_TS1's own
// false-looking failure and EAINT-12240, since raised for re-evaluation).
//
// NEVER RUN LIVE.
test('eDereg Pre-Checking listing — CJ_TS5 Part 2 (Pending -> Expired via cronjob)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(5 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  const precheck = new PrecheckEnquiryPage(page, session);
  const listing = await precheck.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);

  if (listing.trxStatus !== 'Expired') {
    throw new Error(`Expected Trx Status = Expired (cronjob should have picked up this Pending record) — got "${listing.trxStatus}".`);
  }
  if (listing.remarks !== 'Transaction Expired') {
    throw new Error(`Expected Remarks = "Transaction Expired" — got "${listing.remarks}".`);
  }

  console.log('RESULT:' + JSON.stringify({
    status: listing.trxStatus === 'Expired' && listing.remarks === 'Transaction Expired' ? 'SUCCESS' : 'FAIL',
    tsNo: 'CJ_TS5',
    part: 2,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    listing,
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
