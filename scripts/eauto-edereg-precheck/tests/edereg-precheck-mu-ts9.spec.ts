import * as path from 'node:path';
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

// ── MU_TS9: AATF Multiple Users, SAME company — a BackOffice cancel lands
// on the ONE shared Pre-Checking transaction while User A (inline popup)
// and User B (listing resubmit) both still have it open (EAINT-9306) ──
//
// Test plan, as given by Faizuddin 2026-08-27, no wording correction:
//
//   Pre-requisite: AATF User A (Main) & User B (Sub) are from same company
//   (refresh Step 2 Trx Status = Cancelled)
//   1. User A go to create new Deregistration. At step 2, input vehicle
//      number without valid pre-check
//   2. Proceed until pre-check enquiry pops up, Trx Status = Pending
//   3. User B resubmit transaction from Transaction Listing Page
//   4. User A proceed to make payment but Payment = Failed (due to IF)
//   5. BackOffice user cancel the transaction vio BO Transaction Listing page
//   6. User A and User B refresh Step 2
//   7. System prompt error message "Transaction Cancelled"
//   8. Click [OK] button and system pre-search the trx in Transaction
//      Listing page, Trx Status = Cancelled
//   9. Ensure Step Page, Transaction Listing and Details Page showing
//      correctly
//
// **WHICH BO PAGE, CORRECTED 2026-08-27.** Faizuddin originally pasted the
// BO "Deregistration Transaction Enquiry" page's HTML for step 5, then
// caught his own mistake: the RIGHT page is the "eDereg Pre-Checking
// Transaction Listing" instead (`BoPrecheckTransactionListingPage`) — the
// transaction being cancelled throughout this whole scenario (Pending ->
// Failed -> Cancelled, step 2's own "Trx Status = Pending" being the
// PRE-CHECK's field) is the ONE Pre-Checking transaction both User A
// (inline `#precheck-popup`) and User B (listing Resubmit,
// `openViaListingAndResubmit()`) are independently looking at — the SAME
// underlying record, not two separate ones.
//
// **The "Cancel" action is now CONFIRMED, for real** — Faizuddin's corrected
// capture (`EAINT-9306-bo-precheck-transaction-listing.html`) has real
// Pending/Failed rows, each showing `<a class="to-cancel" txid="<uuid>">
// Cancel</a>` right after "View". Confirmed present on Pending/Failed rows,
// confirmed ABSENT on every Approved/Expired row across all 39 rows in the
// capture — exactly the cancellable-state rule this scenario needs.
//
// **Step 6's trigger, CORRECTED a second time, 2026-08-27** — the FIRST two
// live runs (using a plain `page.reload()`, per the test plan's own literal
// "refresh Step 2" wording) both came back with an EMPTY dialog on User A's
// side, even after fixing the capture-timing bug (extending the listener
// window past the reload). The real finding: **a plain browser refresh on
// this Deregistration-embedded entry point shows NOTHING at all** — no
// dialog, no error text, just a silently blank "Owner & Vehicle Details"
// form (Owner Authentication persisted from session, everything else
// blank). This is now understood as REAL, CONFIRMED live behaviour, not a
// capture bug — it's tracked as its own QA-Issue, **EAINT-12233**, under
// this same parent.
//
// Faizuddin then asked (after seeing MU_TS10 successfully capture
// "Transaction Cancelled" via an ACTIVE retry click instead of a passive
// refresh): "make TS9 follow TS10" — i.e. change User A's own trigger from
// a refresh to an ACTIVE retry attempt (clicking "Next" on the still-open
// Payment History popup), matching MU_TS10's own mechanic. This build does
// exactly that for BOTH users — User A via `DeregTransactionPage.
// attemptInlineRetryAfterCancellation()` (already built/fixed for
// MU_TS10), User B via the NEW `PrecheckEnquiryPage.
// attemptStandaloneRetryAfterCancellation()` (same grace-window +
// hold-before-accept fix, applied from the start this time instead of
// discovering the same bug a second time). **The original
// page-refresh finding above remains the real, separately-confirmed
// answer to the test plan's own literal "refresh Step 2" wording** — this
// rebuild is a DIFFERENT question (does an active retry surface the
// message, where a refresh doesn't), not a retraction of that finding.
//
// GENUINELY UNCONFIRMED, flagged per the standing rule: whether an active
// retry ALSO stays silent on this shared-transaction, same-company shape,
// or shows "Transaction Cancelled" the way MU_TS10's own (different-
// company, separate-transaction) User A did on her first live attempt.
// Neither user's dialog text is hard-asserted in this build's pass
// condition — only the final listing status (`Cancelled`) is, for both.
//
// NEVER RUN LIVE (this third attempt, User B's retry mechanic never
// exercised live at all before this).
test('AATF Multiple Users — MU_TS9, same company, BackOffice cancels the transaction', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(10 * 60_000);

  // IF from the start — User A's own payment attempt (step 4) is expected
  // to decline, no happy-path steering needed at any point in this scenario.
  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — creates the Deregistration, triggers the gate,
  // STOPS with the inline #precheck-popup open (never Next, never Cancel).
  // Identical setup to MU_TS7/MU_TS8. ──
  const mykadA = new MykadEmulatorClient(page.context());
  const dereg = new DeregTransactionPage(page, session, mykadA);
  try {
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(getDeregVehicleInputs());
    const alreadySatisfied = await dereg.fillVehicleRegNoAndCheckGate(inputs.vehicleRegNo);
    if (alreadySatisfied) {
      throw new Error(`MU_TS9 needs the gate BLOCKED (no valid pre-check) so the inline popup appears — vehicle ${inputs.vehicleRegNo} already has one.`);
    }
  } finally {
    await mykadA.close();
  }

  const popupOpened = await page.locator('.ui-dialog:visible').last()
    .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
  if (!popupOpened) throw new Error('Expected the inline #precheck-popup after the gate failed, none appeared.');
  session.progress('mu-ts9-popup-open', 'Inline pre-check popup open, Trx Status Pending — stopping here, not paying yet');

  // ── User B (same company, Sub) — resubmits the SAME Pre-Checking record
  // from the listing, reaching the standalone Step 2 (Payment) page. Does
  // NOT pay yet — the test plan only has User A attempt payment first. ──
  const userBContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  // Applied to every "Multiple Users" case, 2026-08-27 (piloted on MU_TS1
  // first) — see utils/overlay.ts's own doc comment.
  await userBContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  const userBPage = await userBContext.newPage();
  const sessionB = new PrecheckSession(userBContext, userBPage);
  await new LoginPage(userBPage, sessionB).login(inputs, { username: CONFIG.subUsername, password: CONFIG.subPassword });
  sessionB.logUrl('after login (User B)');
  await sessionB.closeBanners();

  const precheckB = new PrecheckEnquiryPage(userBPage, sessionB);
  await precheckB.openViaListingAndResubmit(inputs.envSegment, inputs.vehicleRegNo);

  // ── User A proceeds to pay — expects DECLINED (RHB "IF"). ──
  const attemptA = await dereg.attemptInlinePayment();
  if (!attemptA.declined) {
    throw new Error(`Expected User A's payment attempt (RHB "IF") to be DECLINED — it wasn't (${attemptA.jpjStatus} / ${attemptA.responseDesc}).`);
  }
  session.progress('mu-ts9-user-a-declined', `User A's payment declined as expected: "${attemptA.dialogMessage}"`);

  // ── BackOffice cancels the ONE shared Pre-Checking transaction via the
  // "eDereg Pre-Checking Transaction Listing" — a SEPARATE BO login/context,
  // same pattern as srdChecklist.ts's own BO usage. ──
  const boContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  await boContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  const boPage = await boContext.newPage();
  let boListingRows: Awaited<ReturnType<BoPrecheckTransactionListingPage['searchByVehicleNo']>> = [];
  let boCancelResult: Awaited<ReturnType<BoPrecheckTransactionListingPage['cancelFirstMatchingRow']>> = { found: false, dialogMessage: '' };
  try {
    await new BoLoginPage(boPage).login(inputs.envSegment);
    const boListing = new BoPrecheckTransactionListingPage(boPage);
    await boListing.open(inputs.envSegment);
    boListingRows = await boListing.searchByVehicleNo(inputs.vehicleRegNo);
    if (boListingRows.length === 0) {
      throw new Error(`BO Pre-Checking listing found no row for ${inputs.vehicleRegNo} — expected User A's Failed (IF) record to be there.`);
    }
    boCancelResult = await boListing.cancelFirstMatchingRow();
    if (!boCancelResult.found) {
      throw new Error('Expected a "Cancel" link (a.to-cancel) on the found row, none appeared.');
    }
  } catch (err) {
    // boPage is never the fixture-tracked `page` Playwright auto-snapshots
    // on failure (it's a manually created context) — a prior failure here
    // left NO visual evidence of what the BO listing actually showed.
    // Screenshot it explicitly before the context closes below.
    await boPage.screenshot({ path: path.join(videoRunDir(), 'mu-ts9-bo-failure.png'), fullPage: true }).catch(() => { /* ignore */ });
    throw err;
  } finally {
    await boContext.close();
    await recordSubPageVideo(boPage, 'mu-ts9-bo-cancel').catch(() => { /* ignore */ });
  }
  session.progress('mu-ts9-bo-cancelled', `BO cancelled the transaction — dialog was: "${boCancelResult.dialogMessage}"`);

  // ── User A actively RETRIES on the still-open inline popup — matching
  // MU_TS10's own mechanic, per Faizuddin's direct instruction ("make TS9
  // follow TS10"). OBSERVED, not hard-asserted on the dialog itself. ──
  const userARetry = await dereg.attemptInlineRetryAfterCancellation();
  session.progress('mu-ts9-user-a-retry', `User A retried after BO cancel — dialog: "${userARetry.dialogMessage}", url after: ${userARetry.urlAfter}`);
  const userARetryCancelledConfirmed = /cancel/i.test(userARetry.dialogMessage);

  const precheckA = new PrecheckEnquiryPage(page, session);
  const userAListingAfter = await precheckA.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
  if (userAListingAfter.trxStatus !== 'Cancelled') {
    throw new Error(`Expected User A's own listing to show Cancelled after the retry — got "${userAListingAfter.trxStatus}".`);
  }

  // ── User B actively RETRIES on the standalone Step 2 page they resubmit-
  // ted into earlier — same treatment, observed only. Their page was
  // reached BEFORE User A's decline/BO's cancel, so whichever button
  // renders now (#to-retry-rhb or #to-payment) reflects the CURRENT
  // state at click time, not whatever it looked like when they first
  // navigated there. ──
  let userBRetry: Awaited<ReturnType<PrecheckEnquiryPage['attemptStandaloneRetryAfterCancellation']>>;
  let userBListingAfter: Awaited<ReturnType<PrecheckEnquiryPage['getListingStatusForVehicle']>>;
  try {
    userBRetry = await precheckB.attemptStandaloneRetryAfterCancellation();
    session.progress('mu-ts9-user-b-retry', `User B retried after BO cancel — button: "${userBRetry.buttonClicked}", dialog: "${userBRetry.dialogMessage}", url after: ${userBRetry.urlAfter}`);
    userBListingAfter = await precheckB.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
    if (userBListingAfter.trxStatus !== 'Cancelled') {
      throw new Error(`Expected User B's own listing to show Cancelled after the retry — got "${userBListingAfter.trxStatus}".`);
    }
  } finally {
    await userBContext.close();
    await recordSubPageVideo(userBPage, 'mu-ts9-user-b').catch(() => { /* ignore */ });
  }
  const userBRetryCancelledConfirmed = /cancel/i.test(userBRetry.dialogMessage);

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    // Gated on the CONFIRMED parts only: User A declined, BO cancel
    // succeeded, and BOTH final listing checks show Cancelled. NOT gated
    // on either retry's own dialog text — that's the open question this
    // run exists to answer, logged below rather than asserted on.
    status: attemptA.declined && boCancelResult.found
      && userAListingAfter.trxStatus === 'Cancelled'
      && userBListingAfter.trxStatus === 'Cancelled'
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'MU_TS9',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    userAPaymentAttempt: attemptA,
    boListingRows,
    boCancelResult,
    userA: { retry: userARetry, retryCancelledConfirmed: userARetryCancelledConfirmed, listingAfter: userAListingAfter },
    userB: { retry: userBRetry, retryCancelledConfirmed: userBRetryCancelledConfirmed, listingAfter: userBListingAfter },
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
