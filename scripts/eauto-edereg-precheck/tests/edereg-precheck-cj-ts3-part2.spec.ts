import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';

// ── CJ_TS3, PART 2 of 2 (EAINT-9306) — pure read, no action ──
// Continues Part 1 (edereg-precheck-cj-ts3-part1.spec.ts) for the SAME
// vehicle no., after a dev has (1) DB-patched the Approved pre-check
// straight to Expired, then (2) let the next daily 23:59:59 cronjob run
// pass.
//
// Expected (knowledge/flow-edereg.md §5.5): Trx Status stays Expired —
// the cronjob does not re-touch an already-Expired row. Remarks NOT
// hard-asserted here (logged only): unlike CJ_TS1/TS5, this row's Expired
// state came from a direct DB patch, not the cronjob's own "Transaction
// Expired" write — whether the patch itself sets the same Remarks text is
// genuinely unconfirmed, flagged per the standing rule rather than
// assumed.
//
// PRECONDITION: run CJ_TS3 Part 1 first, wait for dev to confirm both the
// patch and the following cronjob run, then run this with the SAME
// vehicleRegNo.
//
// NEVER RUN LIVE.
test('eDereg Pre-Checking listing — CJ_TS3 Part 2 (Expired, cronjob does not re-touch it)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(5 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  const precheck = new PrecheckEnquiryPage(page, session);
  const listing = await precheck.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);

  if (listing.trxStatus !== 'Expired') {
    throw new Error(`Expected Trx Status to stay Expired (cronjob should NOT re-pick this up) — got "${listing.trxStatus}".`);
  }
  session.progress('cj-ts3-remarks-observed', `Remarks after the DB patch + cronjob no-op: "${listing.remarks}" (not hard-asserted — see this file's own header note)`);

  console.log('RESULT:' + JSON.stringify({
    status: listing.trxStatus === 'Expired' ? 'SUCCESS' : 'FAIL',
    tsNo: 'CJ_TS3',
    part: 2,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    listing,
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
