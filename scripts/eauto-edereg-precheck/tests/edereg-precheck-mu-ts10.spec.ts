import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { BoLoginPage } from '../pages/BoLoginPage';
import { BoPrecheckTransactionListingPage } from '../pages/BoPrecheckTransactionListingPage';
import { LoginPage } from '../pages/LoginPage';
import { PrecheckSession } from '../utils/session';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS } from '../utils/esim';
import { recordSubPageVideo, videoRunDir } from '../utils/videoManifest';
import { TIMESTAMP_OVERLAY_INIT_SCRIPT } from '../utils/overlay';

// ── MU_TS10: AATF Multiple Users, DIFFERENT company — BOTH users
// independently create a Deregistration + inline pre-check, decline (IF),
// get their OWN transaction cancelled by BackOffice, then retry on their
// still-open popup (EAINT-9306) ──
//
// Test plan, REWRITTEN by Faizuddin 2026-08-27 after the first live run
// exposed a wrong assumption in the original wording (see "First live run"
// below) — this is the CURRENT, confirmed-correct version:
//
//   Pre-requisite: AATF User A (Main) & User B (Sub) are from different
//   company (resubmit and make/retry payment after cancel)
//   1. User A go to create new Deregistration. At step 2, input vehicle
//      number without valid pre-check
//   2. Proceed until pre-check enquiry pops up, Trx Status = Pending
//   3. User A proceed to make payment but Payment = Failed (due to IF)
//   4. BackOffice user cancel the transaction vio BO Transaction Listing page
//   5. User B follows the same step as User A from step 1 until step 4
//   6. System prompt error message "Transaction Cancelled"
//   7. Click [OK] button and system pre-search the trx in Transaction
//      Listing page, Trx Status = Cancelled
//   8. User A attempt to retry payment / make payment
//   9. System prompt error message "Transaction Cancelled"
//   10. Click [OK] button and system pre-search the trx in Transaction
//       Listing page, Trx Status = Cancelled
//   11. User B attempt to retry payment / make payment
//   12. System prompt error message "Transaction Cancelled"
//   13. Ensure Step Page, Transaction Listing and Details Page showing
//       correctly
//
// **First live run, 2026-08-27, ORIGINAL wording — FAILED, and the
// finding IS why the plan above was rewritten.** The original wording had
// User B create their own SEPARATE transaction via the STANDALONE
// "eDereg Pre-Checking Enquiry" flow, then "resubmit" it from the AATF
// listing after BO's cancel, expecting that click to surface "Transaction
// Cancelled." It didn't get that far: **the "Resubmit" link itself no
// longer rendered on a Cancelled row at all** ("No 'Resubmit' link found
// for HXA073 — the Cancelled row may not offer one") — confirming, live,
// that this listing's "Resubmit" action is gated to non-terminal
// (Pending/Failed) rows, same rule already confirmed for
// `BoPrecheckTransactionListingPage`'s own "Cancel" link (§27). Faizuddin
// then rewrote the plan to drop "resubmit" entirely: BOTH users now stay
// on the DEREGISTRATION-embedded inline flow throughout (matching User
// A's own original shape, not the standalone one), and BOTH retry via
// their own still-open inline popup instead of via the listing.
//
// **`PrecheckEnquiryPage.openViaListingAndResubmitExpectingCancellation()`
// and the standalone-flow setup from the FIRST attempt are no longer used
// by this test** — kept in place (not deleted) since the method itself is
// real and confirmed (it correctly detected and reported the missing
// link rather than throwing a generic timeout), just not needed for this
// scenario anymore.
//
// User B's own setup is now IDENTICAL to User A's (create Deregistration,
// Step 2, inline popup, decline IF) — just their OWN company's MyKad
// identity (`CONFIG.mykadNricSub2`/`mykadNameSub2`) and login
// (`CONFIG.subUsername2`/`subPassword2`, the same different-company slot
// MU_TS2/TS3/TS5/TS7 use). Each BO cancel happens separately, right after
// each user's own decline (matching the plan's own step ordering — User
// A's transaction is cancelled BEFORE User B even starts, not both at
// once) — reuses `BoPrecheckTransactionListingPage.cancelAllMatchingRows()`
// each time, which naturally skips whichever row is already Cancelled
// from a prior round (it only cancels what's still cancellable).
//
// GENUINELY UNCONFIRMED, flagged per the standing rule: whether clicking
// "Next" on an already-cancelled record's still-open Payment History
// popup (a CLICK, not a page reload) shows "Transaction Cancelled",
// something else, or nothing at all — MU_TS9 only ever confirmed a plain
// REFRESH stays silent on this same Deregistration-embedded entry point;
// this specific trigger (a retry click) has never been exercised live
// before, for EITHER user this time (both are on the same inline flow
// now). `DeregTransactionPage.attemptInlineRetryAfterCancellation()`
// reports whatever happens without asserting a specific DOM shape
// afterward — NEITHER user's dialog text is hard-asserted in this
// build's pass condition; only the final listing status (Cancelled) is,
// for both.
//
// NEVER RUN LIVE (this rewritten version).
test('AATF Multiple Users — MU_TS10, different company, each user cancelled and retries independently', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(10 * 60_000);

  // IF from the start — both users' payment attempts are expected to
  // decline. eSIM steering is per vehicle PREFIX, not per company, so this
  // covers both regardless of which company pays.
  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — creates the Deregistration, triggers the gate,
  // STOPS with the inline #precheck-popup open. Identical setup to
  // MU_TS7/TS8/TS9. ──
  const mykadA = new MykadEmulatorClient(page.context());
  const deregA = new DeregTransactionPage(page, session, mykadA);
  try {
    await deregA.createFromHome('MYKAD');
    await deregA.authenticateOwner();
    await deregA.fillOwnerContactFields(getDeregVehicleInputs());
    const alreadySatisfied = await deregA.fillVehicleRegNoAndCheckGate(inputs.vehicleRegNo);
    if (alreadySatisfied) {
      throw new Error(`MU_TS10 needs the gate BLOCKED (no valid pre-check) so the inline popup appears — vehicle ${inputs.vehicleRegNo} already has one.`);
    }
  } finally {
    await mykadA.close();
  }

  const popupOpenedA = await page.locator('.ui-dialog:visible').last()
    .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
  if (!popupOpenedA) throw new Error('Expected the inline #precheck-popup after the gate failed, none appeared (User A).');
  session.progress('mu-ts10-user-a-popup-open', 'User A: inline pre-check popup open, Trx Status Pending — stopping here, not paying yet');

  // ── User A proceeds to pay — expects DECLINED (RHB "IF"). ──
  const attemptA1 = await deregA.attemptInlinePayment();
  if (!attemptA1.declined) {
    throw new Error(`Expected User A's payment attempt (RHB "IF") to be DECLINED — it wasn't (${attemptA1.jpjStatus} / ${attemptA1.responseDesc}).`);
  }
  session.progress('mu-ts10-user-a-declined', `User A's payment declined as expected: "${attemptA1.dialogMessage}"`);

  // ── BackOffice cancels User A's transaction — the only cancellable row
  // for this vehicle no. at this point (User B hasn't created theirs yet).
  // FIXED 2026-08-27 — this context previously had no `recordVideo`
  // config at all, so BO's own actions were never recorded (a real gap,
  // caught while rolling out the separate-videos-plus-timestamp change
  // to every test — see utils/overlay.ts's own doc comment). ──
  const boContext1 = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  await boContext1.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  const boPage1 = await boContext1.newPage();
  let boCancelResultsA: Awaited<ReturnType<BoPrecheckTransactionListingPage['cancelAllMatchingRows']>> = [];
  try {
    await new BoLoginPage(boPage1).login(inputs.envSegment);
    const boListing1 = new BoPrecheckTransactionListingPage(boPage1);
    await boListing1.open(inputs.envSegment);
    boCancelResultsA = await boListing1.cancelAllMatchingRows(inputs.vehicleRegNo);
    if (boCancelResultsA.length !== 1 || !boCancelResultsA[0].found) {
      throw new Error(`Expected exactly 1 cancel (User A's own row) at this point — got ${JSON.stringify(boCancelResultsA)}.`);
    }
  } finally {
    await boContext1.close();
    await recordSubPageVideo(boPage1, 'mu-ts10-bo-cancel-a').catch(() => { /* ignore */ });
  }
  session.progress('mu-ts10-bo-cancelled-a', `BO cancelled User A's transaction: ${JSON.stringify(boCancelResultsA)}`);

  // ── User B (DIFFERENT company) — SAME setup as User A, own identity.
  // Same "no recordVideo config at all" gap fixed here too. ──
  const userBContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  await userBContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  const userBPage = await userBContext.newPage();
  const sessionB = new PrecheckSession(userBContext, userBPage);
  await new LoginPage(userBPage, sessionB).login(inputs, { username: CONFIG.subUsername2, password: CONFIG.subPassword2 });
  sessionB.logUrl('after login (User B)');
  await sessionB.closeBanners();

  const mykadB = new MykadEmulatorClient(userBContext, { nric: CONFIG.mykadNricSub2, name: CONFIG.mykadNameSub2 });
  const deregB = new DeregTransactionPage(userBPage, sessionB, mykadB);
  try {
    await deregB.createFromHome('MYKAD');
    await deregB.authenticateOwner();
    await deregB.fillOwnerContactFields(getDeregVehicleInputs());
    const alreadySatisfiedB = await deregB.fillVehicleRegNoAndCheckGate(inputs.vehicleRegNo);
    if (alreadySatisfiedB) {
      throw new Error(`MU_TS10 needs User B's gate BLOCKED too (their own company should have no valid pre-check for this vehicle either) — vehicle ${inputs.vehicleRegNo} already has one.`);
    }
  } finally {
    await mykadB.close();
  }

  const popupOpenedB = await userBPage.locator('.ui-dialog:visible').last()
    .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
  if (!popupOpenedB) throw new Error('Expected the inline #precheck-popup after the gate failed, none appeared (User B).');
  session.progress('mu-ts10-user-b-popup-open', 'User B: OWN inline pre-check popup open, Trx Status Pending — different company, separate record');

  const attemptB1 = await deregB.attemptInlinePayment();
  if (!attemptB1.declined) {
    throw new Error(`Expected User B's payment attempt (RHB "IF") to be DECLINED — it wasn't (${attemptB1.jpjStatus} / ${attemptB1.responseDesc}).`);
  }
  session.progress('mu-ts10-user-b-declined', `User B's payment declined as expected: "${attemptB1.dialogMessage}"`);

  // ── BackOffice cancels User B's transaction — the only NEWLY
  // cancellable row now (User A's is already Cancelled from the round
  // above, so cancelAllMatchingRows() naturally skips it). ──
  const boContext2 = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  await boContext2.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  const boPage2 = await boContext2.newPage();
  let boCancelResultsB: Awaited<ReturnType<BoPrecheckTransactionListingPage['cancelAllMatchingRows']>> = [];
  try {
    await new BoLoginPage(boPage2).login(inputs.envSegment);
    const boListing2 = new BoPrecheckTransactionListingPage(boPage2);
    await boListing2.open(inputs.envSegment);
    boCancelResultsB = await boListing2.cancelAllMatchingRows(inputs.vehicleRegNo);
    if (boCancelResultsB.length !== 1 || !boCancelResultsB[0].found) {
      throw new Error(`Expected exactly 1 NEW cancel (User B's own row) at this point — got ${JSON.stringify(boCancelResultsB)}.`);
    }
  } finally {
    await boContext2.close();
    await recordSubPageVideo(boPage2, 'mu-ts10-bo-cancel-b').catch(() => { /* ignore */ });
  }
  session.progress('mu-ts10-bo-cancelled-b', `BO cancelled User B's transaction: ${JSON.stringify(boCancelResultsB)}`);

  // ── User A retries payment on their own still-open inline popup —
  // OBSERVED, not hard-asserted on the dialog itself (genuinely
  // unconfirmed trigger, see this file's own header note). ──
  const userARetry = await deregA.attemptInlineRetryAfterCancellation();
  session.progress('mu-ts10-user-a-retry', `User A retried after BO cancel — dialog: "${userARetry.dialogMessage}", url after: ${userARetry.urlAfter}`);
  const userARetryCancelledConfirmed = /cancel/i.test(userARetry.dialogMessage);

  const precheckA = new PrecheckEnquiryPage(page, session);
  const userAListingAfter = await precheckA.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
  if (userAListingAfter.trxStatus !== 'Cancelled') {
    throw new Error(`Expected User A's own listing to show Cancelled after the retry — got "${userAListingAfter.trxStatus}".`);
  }

  // ── User B retries payment on their own still-open inline popup — same
  // treatment, observed only. ──
  let userBRetry: Awaited<ReturnType<DeregTransactionPage['attemptInlineRetryAfterCancellation']>>;
  let userBListingAfter: Awaited<ReturnType<PrecheckEnquiryPage['getListingStatusForVehicle']>>;
  try {
    userBRetry = await deregB.attemptInlineRetryAfterCancellation();
    session.progress('mu-ts10-user-b-retry', `User B retried after BO cancel — dialog: "${userBRetry.dialogMessage}", url after: ${userBRetry.urlAfter}`);

    const precheckB = new PrecheckEnquiryPage(userBPage, sessionB);
    userBListingAfter = await precheckB.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
    if (userBListingAfter.trxStatus !== 'Cancelled') {
      throw new Error(`Expected User B's own listing to show Cancelled after the retry — got "${userBListingAfter.trxStatus}".`);
    }
  } finally {
    await userBContext.close();
    await recordSubPageVideo(userBPage, 'mu-ts10-user-b').catch(() => { /* ignore */ });
  }
  const userBRetryCancelledConfirmed = /cancel/i.test(userBRetry.dialogMessage);

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    // Gated on the CONFIRMED parts only: both declines happened, both BO
    // cancels succeeded, and BOTH final listing checks show Cancelled.
    // Deliberately NOT gated on either retry's own dialog text — that's
    // the genuinely open question this run is meant to answer, logged
    // below rather than asserted on.
    status: attemptA1.declined && attemptB1.declined
      && boCancelResultsA[0]?.found && boCancelResultsB[0]?.found
      && userAListingAfter.trxStatus === 'Cancelled'
      && userBListingAfter.trxStatus === 'Cancelled'
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'MU_TS10',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    userA: {
      paymentAttempt: attemptA1,
      boCancelResult: boCancelResultsA[0],
      retry: userARetry,
      retryCancelledConfirmed: userARetryCancelledConfirmed,
      listingAfter: userAListingAfter,
    },
    userB: {
      paymentAttempt: attemptB1,
      boCancelResult: boCancelResultsB[0],
      retry: userBRetry,
      retryCancelledConfirmed: userBRetryCancelledConfirmed,
      listingAfter: userBListingAfter,
    },
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
