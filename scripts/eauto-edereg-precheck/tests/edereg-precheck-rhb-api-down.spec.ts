import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_API_DOWN } from '../utils/esim';

// ── [TS number TBD — was CPC_E2E_TS3, RENUMBERED 2026-09-02]: [Failed -
// RHB API Down] (EAINT-9306) ──
// Per Faizuddin: the latest test-plan text for CPC_E2E_TS3 is actually a
// DIFFERENT scenario (VEL000045E JPJ error code, MyKad, Deregistration
// continuation — see edereg-precheck-ts3-jpj-error.spec.ts, the real TS3).
// This RHB-API-Down build no longer has a confirmed TS number — left as-is
// otherwise (still a real, useful scenario) until Faizuddin gives it one.
// Do not reuse "TS3" for it anywhere (title, dashboard label, comments).
//
// Standalone "eDereg Pre-Checking Enquiry" entry point, payment-level
// decline (NOT a JPJ response code like TS2/TS8/TS9) — an RHB gateway
// outage.
//
// **Blocked, then unblocked, same session, 2026-08-27.** This case was
// flagged in the `eaint-9306-rhb-api-down-unconfirmed` memory as having no
// known trigger — Faizuddin then confirmed: same RHB Transfer eSIM entity
// as IF/RE, steered via code "ER" (`RHB_TRANSFER_RESPONSE_CODE_API_DOWN`,
// utils/esim.ts). That memory is now resolved/removed.
//
// **Single-part, NOT a 6-month-expiry case** — confirmed directly by
// Faizuddin, 2026-08-27: "for TS3, no need to make 2 parts." An outage is
// steered instantly via eSIM, unlike the 6-month JPJ-approval-age patch
// TS4/5/6/10/11/12 need a dev for.
//
// **Uses `PrecheckEnquiryPage.attemptStandalonePayment()`** (built
// 2026-08-27 for MU_TS9B) instead of the plain `pay()` every prior
// standalone-flow test used — `pay()` only ever handles the happy path;
// this is the FIRST case to exercise a payment-level decline through the
// standalone Enquiry's own FIRST attempt (not the Resubmit/Retry button).
// GENUINELY UNCONFIRMED, per that method's own doc comment: whether the
// first-attempt decline shape is really identical to the Retry button's
// already-confirmed one (Payment History + native confirm, no
// `#result-container`) — this is the first live check of that assumption.
//
// Deliberately SCOPED NARROWER than TS2/TS7/TS8/TS9's own pattern — those
// all continue into a Deregistration attempt for the same vehicle
// afterward, expecting the SAME failure to reproduce at the inline entry
// point. TS3's own literal test-plan steps for that continuation were not
// available when this was built (only the "needs RHB API Down" blocker
// was documented) — this scoped version stops after confirming the
// standalone decline and reading the listing. Extend with an inline
// Deregistration retry (same shape as CJ_TS1's own `attemptInlinePayment()`
// call, steered to the SAME "ER" code) once the full TS3 steps are
// confirmed.
//
// Whether a declined-payment standalone enquiry PERSISTS a real
// Pre-Checking record (the way MU_TS9's inline IF-decline does) is
// GENUINELY UNCONFIRMED for this specific code/entry-point combination —
// logged via the listing check below, not hard-asserted either way.
//
// NEVER RUN LIVE.
test('eDereg Pre-Checking Enquiry — Failed (RHB API Down) [TS number TBD]', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_API_DOWN);

  session.logUrl('after login');
  await session.closeBanners();

  const precheck = new PrecheckEnquiryPage(page, session);
  await precheck.openFromHome();
  await session.closeBanners();

  await precheck.fillVehicleAndConsent(inputs);
  await precheck.enquireNow();

  const attempt = await precheck.attemptStandalonePayment();
  if (!attempt.declined) {
    throw new Error(`Expected the standalone payment attempt (RHB "ER" — API Down) to be DECLINED — it wasn't (${attempt.resultVehicleNo} / ${attempt.resultResponseDesc}).`);
  }
  session.progress('cpc-ts3-declined', `Standalone payment declined as expected: "${attempt.dialogMessage}"`);

  const listing = await precheck.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
  session.progress('cpc-ts3-listing-observed', `Listing after the declined attempt: ${listing.rowCount} row(s), Payment "${listing.paymentStatus}", Trx Status "${listing.trxStatus}" (not hard-asserted — whether this persists at all is unconfirmed)`);

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: attempt.declined ? 'SUCCESS' : 'FAIL',
    tsNo: 'TBD (was CPC_E2E_TS3, renumbered 2026-09-02)',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    paymentAttempt: attempt,
    listing,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
