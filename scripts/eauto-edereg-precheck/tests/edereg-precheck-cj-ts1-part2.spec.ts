import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';

// ── CJ_TS1, PART 2 of 2 (EAINT-9306) — pure read, no action ──
// Continues Part 1 (edereg-precheck-cj-ts1-part1.spec.ts) for the SAME
// vehicle no., after a dev has run the cronjob (or the daily 23:59:59 run
// has happened) on the Failed (RHB IF) pre-check Part 1 created. This is
// the "after" half — per Faizuddin, 2026-08-27: "the after will check the
// status and the other details" — just reads the "eDereg Pre-Checking
// Transaction Listing", nothing is created or paid here.
//
// Expected (knowledge/flow-edereg.md §5.5): Trx Status = Expired (cronjob
// picked it up), Remarks = "Transaction Expired", Payment/JPJ Pre-Checking
// unchanged from Part 1's own Failed values.
//
// PRECONDITION: run CJ_TS1 Part 1 first, wait for dev to confirm the
// cronjob has run, then run this with the SAME vehicleRegNo. **Confirmed
// 2026-08-28, per Faizuddin: the cronjob also skips same-day records** —
// a row created on the same calendar day as the 23:59:59 run is not
// picked up until the FOLLOWING day's run. Don't run this Part 2 the same
// day as Part 1, even after asking the dev to trigger the cronjob — see
// knowledge/flow-edereg.md §5.5. This exact gap is what produced this
// test's own first live run "failure" and EAINT-12240 (2026-08-28,
// vehicle HXA088 checked same-day as creation) — re-evaluate that ticket
// once this is re-run a day later before treating it as a confirmed bug.
//
// NEVER RUN LIVE.
test('eDereg Pre-Checking listing — CJ_TS1 Part 2 (Failed -> Expired via cronjob)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(5 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  const precheck = new PrecheckEnquiryPage(page, session);
  const listing = await precheck.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);

  if (listing.trxStatus !== 'Expired') {
    throw new Error(`Expected Trx Status = Expired (cronjob should have picked up this Failed record) — got "${listing.trxStatus}".`);
  }
  if (listing.remarks !== 'Transaction Expired') {
    throw new Error(`Expected Remarks = "Transaction Expired" — got "${listing.remarks}".`);
  }

  console.log('RESULT:' + JSON.stringify({
    status: listing.trxStatus === 'Expired' && listing.remarks === 'Transaction Expired' ? 'SUCCESS' : 'FAIL',
    tsNo: 'CJ_TS1',
    part: 2,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    listing,
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
