import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { LoginPage } from '../pages/LoginPage';
import { PrecheckSession } from '../utils/session';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';
import { recordSubPageVideo, videoRunDir } from '../utils/videoManifest';
import { TIMESTAMP_OVERLAY_INIT_SCRIPT } from '../utils/overlay';

// ── MU_TS8: AATF Multiple Users, SAME company — User A's inline pre-check
// popup races User B's listing-side resume of that SAME (Pending, never
// attempted) record, both clicking pay at the same instant (EAINT-9306) ──
//
// Test plan, as given by Faizuddin 2026-08-27, no wording correction:
//
//   Pre-requisite: AATF User A (Main) & User B (Sub) are from same company
//   (submit payment at the same time)
//   1. User A go to create new Deregistration. At step 2, input vehicle
//      number. Ensure vehicle number does not have valid pre-check
//   2. Stop until pre-checking enquiry popup appears
//   3. User B go to eDereg Pre-Checking Transaction Listing and search the
//      transaction
//   4. Both users attempt to make payment at the same time (Click [Yes]
//      button on payment popup)
//   5. System prompt error message "Duplicate RHB payment requests have
//      been detected. This RHB payment request will not be sent. Please
//      refresh the page to view the payment details."
//   6. User A redirected to Deregistration Step 2 with pre-checking
//      enquiry popup
//   7. User B tries again using the same Vehicle Number until pre-checking
//      status is Trx Status = Approved, Payment = OK, JPJ Pre-Checking = OK
//   8. Check details after payment
//   9. User A continues with the Deregistration process until
//      Deregistration status is Trx Status = Approved, Payment = OK (This
//      status is for the Deregistration transaction)
//
// GENERALIZED per MU_TS4's own established pass condition (Faizuddin,
// 2026-08-26, knowledge/flow-edereg.md §22): "it depends on whoever clicked
// first... as long as both of them gets different message, its okay... it
// doesn't matter which part gets it first." Steps 6/7 above name User A as
// the loser and User B as the eventual winner, but MU_TS4's own live run
// showed the actual winner is a genuine race, not fixed by role — so this
// build treats "who loses" as an OUTCOME to observe, not a precondition to
// assume, and retries WHICHEVER side lost (not hard-coded to User A).
//
// User A's setup (create Deregistration, Step 2, stop at the inline popup
// with the gate blocked) is IDENTICAL to MU_TS7's own User A setup
// (knowledge/flow-edereg.md §25) — reused verbatim. User B here is the
// SAME-company sub-account (CONFIG.subUsername/subPassword,
// mykadNricSub/mykadNameSub) — same identity MU_TS1/TS4 use, NOT the
// different-company User C (MU_TS2/TS3/TS5/TS7's subUsername2).
//
// THREE GENUINELY UNCONFIRMED SHAPES, flagged rather than guessed silently:
//   - The literal "Duplicate RHB payment requests..." message (step 5) —
//     MU_TS4's own race predicted this SAME text from the test plan but got
//     "Transaction Approved" instead, live. `PrecheckEnquiryPage.
//     attemptResumePendingPayment()` (new, race-safe sibling of MU_TS7's
//     `resumePendingPayment()`) captures whatever text actually fires via
//     withNativeConfirmCapture() and logs it — NOT hard-asserted.
//   - Step 6's "redirected to Deregistration Step 2 with pre-checking
//     enquiry popup" — assumed here to mean `attemptInlinePayment()`'s own
//     already-confirmed "declined" branch (`#payment-history-portion`
//     re-renders, ready for another Next click), reusing CPC_E2E_TS5's
//     confirmed retry pattern, rather than any new page shape.
//   - Whether the LOSING side's page can be re-driven to reflect the
//     now-resolved Approved state with a single retry (this build's
//     assumption) or needs a fresh navigation/refresh first (the error
//     message's own "Please refresh the page" wording) — handled
//     defensively: the loser's retry re-navigates via
//     `openViaListingAndResubmit()`/re-checks the gate rather than
//     re-clicking blind on a possibly-stale page.
//
// NEVER RUN LIVE.
test('AATF Multiple Users — MU_TS8, same company, simultaneous first payment attempt', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(10 * 60_000);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — creates the Deregistration, triggers the gate,
  // STOPS with the inline #precheck-popup open (never Next, never Cancel).
  // Identical setup to MU_TS7 (knowledge/flow-edereg.md §25). ──
  const mykadA = new MykadEmulatorClient(page.context());
  const dereg = new DeregTransactionPage(page, session, mykadA);
  try {
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(getDeregVehicleInputs());
    const alreadySatisfied = await dereg.fillVehicleRegNoAndCheckGate(inputs.vehicleRegNo);
    if (alreadySatisfied) {
      throw new Error(`MU_TS8 needs the gate BLOCKED (no valid pre-check) so the inline popup appears — vehicle ${inputs.vehicleRegNo} already has one.`);
    }
  } finally {
    await mykadA.close();
  }

  const popupOpened = await page.locator('.ui-dialog:visible').last()
    .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
  if (!popupOpened) throw new Error('Expected the inline #precheck-popup after the gate failed, none appeared.');
  session.progress('mu-ts8-popup-open', 'Inline pre-check popup open — stopping here, not paying');

  // ── User B (same company, Sub) — reaches the SAME Pending record via the
  // Pre-Checking listing's search + Resubmit, never touches MyKad. ──
  const userBContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  // Applied to every "Multiple Users" case, 2026-08-27 (piloted on MU_TS1
  // first) — see utils/overlay.ts's own doc comment.
  await userBContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  let userBPage: Awaited<ReturnType<typeof userBContext.newPage>> | undefined;
  let sessionB: PrecheckSession | undefined;
  let precheckB: PrecheckEnquiryPage | undefined;
  let attemptA: Awaited<ReturnType<DeregTransactionPage['attemptInlinePayment']>> | null = null;
  let attemptB: Awaited<ReturnType<PrecheckEnquiryPage['attemptResumePendingPayment']>> | null = null;
  try {
    userBPage = await userBContext.newPage();
    sessionB = new PrecheckSession(userBContext, userBPage);
    await new LoginPage(userBPage, sessionB).login(inputs, { username: CONFIG.subUsername, password: CONFIG.subPassword });
    sessionB.logUrl('after login (User B)');
    await sessionB.closeBanners();

    precheckB = new PrecheckEnquiryPage(userBPage, sessionB);
    await precheckB.openViaListingAndResubmit(inputs.envSegment, inputs.vehicleRegNo);

    // Re-steer to the happy-path code right before the race — unlike
    // MU_TS4, this scenario is a FIRST payment attempt on both sides (no
    // prior decline to retry), so there's no IF/RE code to set beforehand.
    await ensureEsimHappyPath(inputs.vehicleRegNo);

    // THE RACE — both sides attempt payment concurrently via Promise.all(),
    // not sequentially, so they actually compete for the same underlying
    // Pending record. Per Faizuddin's MU_TS4 guidance, who wins is
    // observed, not assumed.
    [attemptA, attemptB] = await Promise.all([
      dereg.attemptInlinePayment(),
      precheckB.attemptResumePendingPayment(),
    ]);
  } finally {
    if (userBPage) await recordSubPageVideo(userBPage, 'mu-ts8-user-b').catch(() => { /* ignore */ });
  }

  if (!attemptA || !attemptB) {
    throw new Error('Expected both User A and User B race attempts to resolve, at least one never did.');
  }
  const userAWon = !attemptA.declined;
  const userBWon = attemptB.outcome === 'approved';
  const exactlyOneWon = userAWon !== userBWon;
  if (!exactlyOneWon) {
    throw new Error(`Expected exactly ONE side to win the payment race — got userAWon=${userAWon}, userBWon=${userBWon} (userA declined=${attemptA.declined}, userB outcome=${attemptB.outcome}).`);
  }

  // ── Whichever side lost, retry ONCE — the underlying record should
  // already be Approved from the winner's side, so this is expected to
  // resolve immediately rather than genuinely re-race. ──
  if (!userAWon) {
    session.progress('mu-ts8-user-a-retry', "User A lost the race — retrying the inline popup, expecting it's now Approved");
    const retryA = await dereg.attemptInlinePayment();
    if (retryA.declined) {
      throw new Error(`Expected User A's retry (after losing the race) to resolve Approved now that User B won — still declined (${retryA.jpjStatus} / ${retryA.responseDesc}).`);
    }
    attemptA = retryA;
  }
  if (!userBWon && sessionB && precheckB) {
    session.progress('mu-ts8-user-b-retry', "User B lost the race — checking the listing, expecting it's now Approved (no re-payment needed)");
    // CORRECTED 2026-08-27, first live run: re-opening via
    // openViaListingAndResubmit() and racing attemptResumePendingPayment()
    // AGAIN was wrong — once the WINNING side (whichever it was) resolves
    // the underlying record to Approved, the listing's "Resubmit" link
    // disappears entirely (an Approved row only offers "View"), so
    // re-clicking Resubmit timed out waiting for a link that no longer
    // exists. The loser doesn't need to independently reach success by
    // paying again — same "who wins doesn't matter" principle as MU_TS4 —
    // it only needs to OBSERVE the now-resolved state via the listing.
    const listingStatus = await precheckB.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
    if (listingStatus.trxStatus !== 'Approved') {
      throw new Error(`Expected the Pre-Checking listing to show Approved after User A won the race — got "${listingStatus.trxStatus}" (JPJ Pre-Checking "${listingStatus.jpjPreChecking}").`);
    }
    attemptB = { outcome: 'approved', dialogMessage: attemptB.dialogMessage };
  }
  await userBContext.close();

  // ── User A continues the SAME Deregistration to a real completion (step 9). ──
  await dereg.submitVehicleDetails(getDeregVehicleInputs());
  await dereg.ownerConsentAndAuth();
  await dereg.aatfConsentAndAuth();
  const jpjCheckResult = await dereg.jpjCheck();
  const deregResult = await dereg.payAndDeregister();

  // ── Final Pre-Checking state, checked from User A's own (same-company)
  // session — confirmed mutually visible per MU_TS1. ──
  const precheckA = new PrecheckEnquiryPage(page, session);
  const finalListingStatus = await precheckA.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: exactlyOneWon
      && finalListingStatus.trxStatus === 'Approved'
      && !!deregResult.jpjDeregistrationStatus.startsWith('OK')
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'MU_TS8',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    raceCheck: { userAWon, userBWon, exactlyOneWon },
    userA: { raceAttempt: attemptA },
    userB: { raceAttempt: attemptB },
    finalListingStatus,
    userADeregistration: {
      jpjCheckStatus: jpjCheckResult.jpjStatus,
      jpjCheckResponseCode: jpjCheckResult.responseCode,
      jpjDeregistrationStatus: deregResult.jpjDeregistrationStatus,
      transactionId: deregResult.transactionId,
    },
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
