import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_API_DOWN } from '../utils/esim';
import { runJpjXmlLogChecklist } from '../utils/srdChecklist';

// ── CPC_E2E_TS12, PART 2 of 2 (EAINT-9306) ──
//
// **CORRECTED AGAIN, 2026-08-27, same session — the previous "repeat the
// decline several times, no expectation of success" build was itself
// incomplete.** Faizuddin's literal test-plan text (pasted this session,
// checked alongside TS10/TS11 before touching anything):
//
//   ✅CPC_E2E_TS12: [Failed - JPJ error code] Create deregistration until
//   step 2 > Proceed with purchasing Pre-Checking = Approved > Do not
//   continue with deregistration. Stay in Step 2 > Ask dev to patch
//   pre-check transaction to Expired > Continue until system prompts to
//   do pre-checking again > Set RHB Transfer = RHB API Down > Attempt to
//   make payment > Unable to resubmit payment > Ensure error popup is
//   displayed correctly > Ensure Tx Status = Cancelled, ensure UNABLE to
//   resubmit the transaction from pre-checking transaction listing > Make
//   sure the Step Page, Transaction Listing, JPJ XML Log and Details Page
//   are showing correctly
//
// The RHB Transfer code itself (`ER`, corrected earlier this session) was
// right — what was MISSING is the actual pass condition: this scenario
// ends with the transaction going **Cancelled**, and the listing's own
// "Resubmit" link becoming UNAVAILABLE — the SAME confirmed shape MU_TS10
// (§29) already built for a BO-cancelled record
// (`PrecheckEnquiryPage.openViaListingAndResubmitExpectingCancellation()`,
// generic despite its name — reports `resubmitLinkFound: false` cleanly
// rather than throwing). The OLD build never checked either of those —
// it just repeated `attemptInlinePayment()` 4 times and asserted every
// attempt declined, with no assertion on the FINAL state at all.
//
// CORRECTED AGAIN, 2026-09-14, same day, SECOND correction: the loop rebuild
// above was itself built on the wrong proxy. Its first live run (5 rounds,
// all declined) turned out to be hitting RHB "ER"'s own undocumented ~12-minute
// cooldown between real attempts — the loop fired all 5 rounds back-to-back in
// under 2 minutes, so only round 1 was ever a genuine second attempt. The
// REAL bug: both the original single-decline test AND the loop used "is the
// Resubmit link still showing?" as a proxy for "is it Cancelled yet?", but
// `openViaListingAndResubmitExpectingCancellation()`'s own doc comment already
// flags that proxy as GENUINELY UNCONFIRMED — the Resubmit link may render
// even on an already-Cancelled row. Neither run ever read the real `trxStatus`
// field directly after the first decline.
//
// Fixed per Faizuddin's own agreed direction (session handoff 2026-09-14,
// §1): dropped the Resubmit-link gate entirely. After the single ER decline,
// go straight to `getListingStatusForVehicle()` and assert `trxStatus ===
// 'Cancelled'` directly — that's the real pass condition. Resubmit-link
// presence is still probed via `openViaListingAndResubmitExpectingCancellation()`,
// but purely informational now (logged, never a hard failure).
//
// The "error popup" is captured wherever a native dialog fires (every
// decline) — not hard-asserted on its wording, same lesson as every other
// predicted-dialog-text case in this suite (MU_TS4/TS8/TS9).
//
// PRECONDITION: run CPC_E2E_TS12 Part 1 first, wait for dev to confirm the
// expiry patch, then run this with the SAME vehicleRegNo.
//
// NOT yet re-run live in this (trxStatus-direct) form.
//
// Added 2026-08-24, per Faizuddin: the SRD's TS1 checklist applies to the
// LAST part of every two-part case — but ONLY the JPJ XML Log item applies
// here, by Vehicle No. only, same reasoning as CPC_E2E_TS6 Part 2 (no
// completed Deregistration, no satisfied gate — nothing exists on screen
// for the other 3 items to check).
test('Deregistration (expired pre-check, RHB API Down -> Cancelled, unable to resubmit) — CPC_E2E_TS12 Part 2', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_API_DOWN);

  session.logUrl('after login');
  await session.closeBanners();

  const mykad = new MykadEmulatorClient(page.context());
  let firstAttempt: Awaited<ReturnType<DeregTransactionPage['beginInlinePaymentFlow']>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(getDeregVehicleInputs());

    firstAttempt = await dereg.beginInlinePaymentFlow(inputs.vehicleRegNo);
    if (!firstAttempt.declined) {
      throw new Error(`Expected the payment attempt (RHB "ER" — API Down) to be DECLINED — it wasn't (${firstAttempt.jpjStatus} / ${firstAttempt.responseDesc}).`);
    }
    session.progress('cpc-ts12-declined', `Payment declined as expected: "${firstAttempt.dialogMessage}"`);
  } finally {
    await mykad.close();
  }

  // The real pass condition, checked DIRECTLY: read the Pre-Checking
  // listing's own Trx Status right after the single decline, rather than
  // inferring Cancelled from whether the listing still offers "Resubmit" —
  // that inference is what both the original single-decline test and the
  // 2026-09-14 resubmit-loop rebuild got wrong (see the header comment).
  const precheck = new PrecheckEnquiryPage(page, session);
  const listing = await precheck.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
  if (listing.trxStatus !== 'Cancelled') {
    throw new Error(`Expected Trx Status = Cancelled after the single declined payment — got "${listing.trxStatus}".`);
  }

  // Resubmit-link presence is reported for information only, never asserted
  // on — per the doc comment on this probe, it's unconfirmed whether the
  // link even renders on an already-Cancelled row.
  const resubmitProbe = await precheck.openViaListingAndResubmitExpectingCancellation(inputs.envSegment, inputs.vehicleRegNo);
  session.progress('cpc-ts12-resubmit-probe', `Resubmit link ${resubmitProbe.resubmitLinkFound ? 'still shows' : 'no longer shows'} on the Cancelled row (informational only).`);

  const jpjXmlLogCheck = await runJpjXmlLogChecklist({
    page, envSegment: inputs.envSegment, vehicleRegNo: inputs.vehicleRegNo,
    precheckRefNo: '', deregRefNo: '', expectedResponseCode: '',
  });

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: firstAttempt?.declined && listing.trxStatus === 'Cancelled'
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'CPC_E2E_TS12',
    part: 2,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    firstAttempt,
    listing,
    resubmitProbe,
    jpjXmlLogCheck,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
