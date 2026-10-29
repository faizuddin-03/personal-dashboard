import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { LoginPage } from '../pages/LoginPage';
import { PrecheckSession } from '../utils/session';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath, setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS } from '../utils/esim';
import { recordSubPageVideo, videoRunDir } from '../utils/videoManifest';
import { TIMESTAMP_OVERLAY_INIT_SCRIPT } from '../utils/overlay';

// ── MU_TS4: AATF Multiple Users, SAME company, concurrent retry (EAINT-9306) ──
// Test plan row (Trx Status "Failed (Payment)", "2 Users / Same company —
// retry payment at the same time"):
//   1. User A creates a new Deregistration. Step 2, input vehicle no.
//      Ensure it has no valid pre-check.
//   2. Proceed until Pre-Checking payment with Payment = IF
//   3. User B opens the transaction through the pre-checking transaction
//      listing (NOT a new transaction — User A's existing one)
//   4. Both users attempt to retry payment at the same time
//   5. System prompts error message "Payment Paid"
//   6. Click [OK] and redirect User B to Transaction Listing page
//   7. Prompts another error message "Transaction Approved"
//   8. Click [OK], system pre-searches the transaction
//   9. Trx Status = Approved, Payment = OK, JPJ Pre-Checking = OK
//   10. Ensure Step Page, Transaction Listing, Details Page show correctly
//
// Confirmed directly by Faizuddin, 2026-08-26 (this is the scenario he'd
// originally described in detail before the TS3/TS4 mix-up was caught —
// see knowledge/flow-edereg.md §21's "Next up" note):
//   1. "if resubmit, it will go to the pre-checking flow" — CORRECTED
//      after the first live run: Resubmit does NOT reopen the inline
//      #precheck-popup. It lands on the standalone "eDereg Pre-Checking
//      Enquiry" flow's OWN Step 2 (Payment) page — a full page, own
//      header/wizard, confirmed live via a real HTML capture
//      (_reference/codebases/AATF/EAINT-9306-precheck-resubmit-standalone.html).
//      The retry button there is #to-retry-rhb ("RETRY"), which opens a
//      jQuery UI dialog (#payment-dialog, "Are you sure to make payment?",
//      Yes/No) — clicking Yes on the WINNING side lands on #result-container
//      (Step 3 Result), same shape PrecheckEnquiryPage.readResult() already
//      parses. The LOSING side's exact behaviour is still UNCONFIRMED —
//      see PrecheckEnquiryPage.attemptResubmitPayment()'s own doc comment.
//   2. "yes, the alert is the same" — the native confirm() dialog
//      mechanism (withNativeConfirmCapture) applies here too, same as
//      every other declined/retried payment in this suite.
//   3/4. Pass condition, exact quote: "it depends on whoever clicked
//      first. since its hard to simulate actual miliseconds perfect, as
//      long as both of them gets different message, its okay. so make it
//      considered as pass if they get either 1 of the expected results...
//      that part is meant to be observed. it doesnt matter which part
//      gets it first... as long as one of them get expected results A,
//      and the other gets expected results B, its fine and considered
//      pass." NOT hard-matched against the literal "Payment Paid"/
//      "Transaction Approved" wording (never confirmed live) — the actual
//      check is just: both dialog messages are non-empty AND different
//      from each other. Whoever got which is logged, not asserted.
//
// User B is the SAME-company sub-account (CONFIG.subUsername/subPassword,
// CONFIG.mykadNricSub/mykadNameSub) — same identity MU_TS1 uses, NOT the
// different-company User C (MU_TS2/TS3's subUsername2). User B never
// touches MyKad at all here — they only view/act on an EXISTING
// Pre-Checking record via the listing, never create their own owner
// identity.
//
// NEVER RUN LIVE.
test('AATF Multiple Users — MU_TS4, same company, concurrent retry', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(10 * 60_000);

  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — first IF decline. Stays open for the later race ──
  // (`deregA` deliberately declared OUTSIDE this try block — its own
  // #precheck-popup needs to still be open later, for the concurrent
  // retry. `mykadA.close()` is a documented no-op regardless of when it's
  // called, so wrapping just the setup phase in try/finally is harmless.)
  const mykadA = new MykadEmulatorClient(page.context());
  const deregA = new DeregTransactionPage(page, session, mykadA);
  let attemptA1: Awaited<ReturnType<DeregTransactionPage['beginInlinePaymentFlow']>> | null = null;
  try {
    await deregA.createFromHome('MYKAD');
    await deregA.authenticateOwner();
    await deregA.fillOwnerContactFields(getDeregVehicleInputs());
    attemptA1 = await deregA.beginInlinePaymentFlow(inputs.vehicleRegNo);
  } finally {
    await mykadA.close();
  }

  if (!attemptA1?.declined) {
    throw new Error(`Expected User A's first payment attempt (RHB "IF") to be DECLINED — it wasn't (${attemptA1?.jpjStatus} / ${attemptA1?.responseDesc}).`);
  }

  // ── User B (same company) — opens User A's EXISTING transaction via the
  // Pre-Checking listing (no new transaction, no MyKad auth) ──
  const userBContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  // Applied to every "Multiple Users" case, 2026-08-27 (piloted on MU_TS1
  // first) — see utils/overlay.ts's own doc comment.
  await userBContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  let userBPage: Awaited<ReturnType<typeof userBContext.newPage>> | undefined;
  let attemptA2: Awaited<ReturnType<DeregTransactionPage['attemptInlinePayment']>> | null = null;
  let attemptB: Awaited<ReturnType<PrecheckEnquiryPage['attemptResubmitPayment']>> | null = null;
  try {
    userBPage = await userBContext.newPage();
    const sessionB = new PrecheckSession(userBContext, userBPage);
    await new LoginPage(userBPage, sessionB).login(inputs, { username: CONFIG.subUsername, password: CONFIG.subPassword });
    sessionB.logUrl('after login (User B)');
    await sessionB.closeBanners();

    const precheckB = new PrecheckEnquiryPage(userBPage, sessionB);
    await precheckB.openViaListingAndResubmit(inputs.envSegment, inputs.vehicleRegNo);

    // ONLY NOW re-steer to OK — both sides' popups are already open
    // (User A's since Part 1, User B's just now via Resubmit), matching
    // every other "re-steer right before the retry, not before" pattern
    // in this suite (e.g. OF_TS4 Part 2).
    await ensureEsimHappyPath(inputs.vehicleRegNo);

    // THE RACE — both retries fired concurrently via Promise.all(), not
    // sequentially, so they actually compete for the same underlying
    // transaction. Per Faizuddin, it doesn't matter who wins.
    [attemptA2, attemptB] = await Promise.all([
      deregA.attemptInlinePayment(),
      precheckB.attemptResubmitPayment(),
    ]);
  } finally {
    await userBContext.close();
    if (userBPage) await recordSubPageVideo(userBPage, 'mu-ts4-user-b').catch(() => { /* ignore */ });
  }

  // Pass condition, CORRECTED 2026-08-26 after the first live run: a
  // WINNING attempt naturally has an EMPTY dialogMessage (a native
  // confirm() only ever fires on a decline/blocked outcome, confirmed
  // throughout this suite — a successful attempt just proceeds straight
  // to the result). Requiring BOTH sides' dialogMessage to be non-empty
  // was wrong — it fails a genuinely correct run where the winner's own
  // message is naturally blank. Confirmed live: User A won (declined:
  // false, real success, dialogMessage: "") and User B lost
  // (outcome: 'declined-or-redirected', dialogMessage: "Transaction
  // Approved" — the ACTUAL wording, matching the test plan's own step 7
  // exactly). Faizuddin's real criterion is simpler: exactly ONE side
  // reached success directly, the other did not — not "both got text."
  const userAWon = !!attemptA2 && !attemptA2.declined;
  const userBWon = attemptB?.outcome === 'approved';
  const exactlyOneWon = userAWon !== userBWon;

  // Final state — regardless of who won the race, the underlying
  // Pre-Checking transaction should now be Approved. Checked from User
  // A's own (still open) session — same company as User B, confirmed
  // visible to each other per MU_TS1 (unlike the different-company cases,
  // knowledge/flow-edereg.md §21).
  const precheckA = new PrecheckEnquiryPage(page, session);
  const transactionId = await precheckA.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
  let finalDetails: Awaited<ReturnType<PrecheckEnquiryPage['verifyDetailsPage']>> | null = null;
  if (transactionId) {
    await page.goto(`${CONFIG.baseUrlFor(inputs.envSegment)}/view/aatf/dereg/precheck/enquiry/view.do?id=${transactionId}`);
    finalDetails = await precheckA.verifyDetailsPage(inputs.vehicleRegNo);
  }

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: attemptA1?.declined && exactlyOneWon
      && finalDetails?.trxStatus === 'Approved'
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'MU_TS4',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    userA: { firstAttempt: attemptA1, raceAttempt: attemptA2 },
    userB: { raceAttempt: attemptB },
    raceCheck: { userAWon, userBWon, exactlyOneWon },
    transactionId,
    finalDetails,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
