import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { DeregTransactionListingPage } from '../pages/DeregTransactionListingPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { LoginPage } from '../pages/LoginPage';
import { PrecheckSession } from '../utils/session';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath, setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_RESET_TIMER } from '../utils/esim';
import { recordSubPageVideo, videoRunDir } from '../utils/videoManifest';
import { TIMESTAMP_OVERLAY_INIT_SCRIPT } from '../utils/overlay';

// ── MU_TS3: AATF Multiple Users, DIFFERENT company, RE decline (EAINT-9306) ──
// Test plan row (Trx Status "Failed (Payment)", "2 Users / Different
// Company"): User A and User B(=User C here) are from different companies.
// Both independently hit the RHB "RE" reset-timer decline on the SAME
// vehicle no., each getting their OWN separate countdown — confirmed by
// Faizuddin 2026-08-26: "its the same flow [as MU_TS2], just that since
// its different company, it should have different transaction and should
// not affect each other." Contrast with MU_TS4 (same company, NOT yet
// built) — that one expects a SHARED transaction/countdown instead.
//
// Flow:
//   1. Steer RHB Transfer to "RE" for the vehicle (shared eSIM entity,
//      read by BOTH companies' attempts).
//   2. User A creates a Deregistration, Step 2 triggers the inline
//      pre-check, first payment attempt declines (RE) — same
//      beginInlinePaymentFlow() shape CPC_E2E_TS5/TS11 Part 2 already
//      confirmed live. STOPS here — same "never complete a real
//      Deregistration" rule as User A always has (MU_TS1/TS2, §19/§20).
//   3. User C (DIFFERENT company, separate context/login) creates a NEW
//      Deregistration for the SAME vehicle — Step 2 gate is ALSO blocked
//      (own pre-check needed, confirmed MU_TS2) — their own first
//      attempt ALSO declines (RE), with their OWN countdown, independent
//      of User A's (RHB Transfer is steered per-vehicle-prefix, not
//      per-company, so both attempts see "RE" the same way).
//   4. Independence check: read both countdowns' displayed remaining time
//      (`DeregTransactionPage.readResetTimerRemaining()`, diagnostic-only,
//      new 2026-08-26) and compute each one's approximate END time
//      (read timestamp + remaining). Two genuinely independent timers
//      should end at noticeably DIFFERENT wall-clock moments — User C's
//      whole flow (their own MyKad auth, form-filling) takes real time
//      after User A's own decline, so their countdown starts later too.
//      Logged, not hard-asserted as a strict pass/fail threshold, since
//      this is the FIRST live look at whether `#clockdiv` even reads
//      correctly at all.
//   5. Wait out User C's OWN countdown (the later of the two —
//      `waitOutPaymentResetTimer()` always waits the confirmed fixed
//      6.5 minutes from whenever it's called, regardless of the
//      on-screen value, per flow-edereg.md §14 — called on User C's own
//      page). User A's own countdown is never waited out — User A's
//      transaction is abandoned at the declined state, same as always.
//   6. Re-steer RHB Transfer to OK, User C retries — expects success —
//      gate turns green — continues through a REAL completed
//      Deregistration.
//   7. Listing checks, corrected 2026-08-26 after this exact run proved
//      the original "check from User A's session, expect 2/1" design
//      wrong: both listings are scoped to the LOGGED-IN ACCOUNT/COMPANY,
//      not global. A live run showed User A's own session seeing only
//      User A's own 1 pre-check row (never User C's) and 0 Deregistration
//      rows (even though User C's had genuinely completed) — confirmed
//      via the video's true final frame, not a race condition this time.
//      Corrected to check each listing from the user whose OWN
//      transaction it is: Pre-Checking listing from User A's session
//      (expect 1) AND from User C's session (expect 1); Deregistration
//      listing from User C's session ONLY (expect 1) — not from User A's,
//      which would just be an uninformative 0 (User A never reaches Step 3
//      regardless, knowledge/flow-edereg.md §19).
//
// NEVER RUN LIVE.
test('AATF Multiple Users — MU_TS3, different company, RE decline', async ({ loggedInPage: page, session, inputs }) => {
  // More work than any single-user two-attempt case (TS5/TS11 Part 2):
  // TWO full logins/MyKad auths, TWO form-fills, the 6.5-min wait, User C's
  // full submit/consent/JPJ/pay flow, AND two listing checks at the end —
  // budgeted well past the route's own TIMEOUT_MS (app/api/eauto-edereg-
  // precheck/run/route.ts) to avoid the exact-tie race already confirmed
  // live on TS5 Part 2 (flow-edereg.md §14's own reasoning, applied here
  // preemptively rather than waiting to hit it again).
  test.setTimeout(20 * 60_000);

  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_RESET_TIMER);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — first RE decline only, STOPS at Step 2 ──
  const mykadA = new MykadEmulatorClient(page.context());
  let attemptA: Awaited<ReturnType<DeregTransactionPage['beginInlinePaymentFlow']>> | null = null;
  let remainingA: Awaited<ReturnType<DeregTransactionPage['readResetTimerRemaining']>> = null;
  const readAtA = Date.now();
  try {
    const deregA = new DeregTransactionPage(page, session, mykadA);
    await deregA.createFromHome('MYKAD');
    await deregA.authenticateOwner();
    await deregA.fillOwnerContactFields(getDeregVehicleInputs());
    attemptA = await deregA.beginInlinePaymentFlow(inputs.vehicleRegNo);
    remainingA = await deregA.readResetTimerRemaining();
  } finally {
    await mykadA.close();
  }

  if (!attemptA?.declined) {
    throw new Error(`Expected User A's first payment attempt (RHB "RE") to be DECLINED — it wasn't (${attemptA?.jpjStatus} / ${attemptA?.responseDesc}).`);
  }

  // ── User C (different company) — SEPARATE browser context/login, SAME vehicle no. ──
  const userCContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  // Applied to every "Multiple Users" case, 2026-08-27 (piloted on MU_TS1
  // first) — see utils/overlay.ts's own doc comment.
  await userCContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  let userCPage: Awaited<ReturnType<typeof userCContext.newPage>> | undefined;
  let attemptC1: Awaited<ReturnType<DeregTransactionPage['beginInlinePaymentFlow']>> | null = null;
  let attemptC2: Awaited<ReturnType<DeregTransactionPage['attemptInlinePayment']>> | null = null;
  let remainingC: Awaited<ReturnType<DeregTransactionPage['readResetTimerRemaining']>> = null;
  let readAtC = 0;
  let gateSatisfiedC = false;
  let jpjCheckResultC: Awaited<ReturnType<DeregTransactionPage['jpjCheck']>> | null = null;
  let deregResultC: Awaited<ReturnType<DeregTransactionPage['payAndDeregister']>> | null = null;
  let precheckListingRowCountC = -1;
  let deregListingRowCountC = -1;
  try {
    userCPage = await userCContext.newPage();
    const sessionC = new PrecheckSession(userCContext, userCPage);
    await new LoginPage(userCPage, sessionC).login(inputs, { username: CONFIG.subUsername2, password: CONFIG.subPassword2 });
    sessionC.logUrl('after login (User C)');
    await sessionC.closeBanners();

    const mykadC = new MykadEmulatorClient(userCContext, { nric: CONFIG.mykadNricSub2, name: CONFIG.mykadNameSub2 });
    const vehicle = getDeregVehicleInputs();
    try {
      const deregC = new DeregTransactionPage(userCPage, sessionC, mykadC);
      await deregC.createFromHome('MYKAD');
      await deregC.authenticateOwner();
      await deregC.fillOwnerContactFields(vehicle);

      attemptC1 = await deregC.beginInlinePaymentFlow(inputs.vehicleRegNo);
      readAtC = Date.now();
      remainingC = await deregC.readResetTimerRemaining();
      if (!attemptC1.declined) {
        throw new Error(`Expected User C's first payment attempt (RHB "RE") to be DECLINED — it wasn't (${attemptC1.jpjStatus} / ${attemptC1.responseDesc}).`);
      }

      // Wait out User C's OWN countdown — the later of the two.
      await deregC.waitOutPaymentResetTimer();

      await ensureEsimHappyPath(inputs.vehicleRegNo);

      attemptC2 = await deregC.attemptInlinePayment();
      if (attemptC2.declined) {
        throw new Error('Expected User C\'s retry to succeed after re-steering RHB Transfer to OK — it was declined again.');
      }

      gateSatisfiedC = await deregC.isVehicleGateSatisfiedNow();
      if (!gateSatisfiedC) {
        throw new Error('Payment succeeded but User C\'s vehicle gate did not turn green afterward.');
      }

      await deregC.submitVehicleDetails(vehicle);
      await deregC.ownerConsentAndAuth();
      await deregC.aatfConsentAndAuth();
      jpjCheckResultC = await deregC.jpjCheck();
      deregResultC = await deregC.payAndDeregister();

      // Listing checks from User C's OWN session, while it's still open —
      // corrected 2026-08-26, see header comment.
      const precheckListingC = new PrecheckEnquiryPage(userCPage, sessionC);
      precheckListingRowCountC = await precheckListingC.countTransactionsForVehicle(inputs.envSegment, inputs.vehicleRegNo);
      const deregListingC = new DeregTransactionListingPage(userCPage, sessionC);
      deregListingRowCountC = await deregListingC.countTransactionsForVehicle(inputs.envSegment, inputs.vehicleRegNo);
    } finally {
      await mykadC.close();
    }
  } finally {
    await userCContext.close();
    if (userCPage) await recordSubPageVideo(userCPage, 'mu-ts3-user-c').catch(() => { /* ignore */ });
  }

  // Independence check — diagnostic, logged not hard-asserted (first live
  // read of #clockdiv ever). endAtMs = when each countdown display said it
  // would reach 00:00, computed from when each was read.
  const endAtA = remainingA ? readAtA + (remainingA.minutes * 60 + remainingA.seconds) * 1000 : null;
  const endAtC = remainingC ? readAtC + (remainingC.minutes * 60 + remainingC.seconds) * 1000 : null;
  const countdownGapMs = endAtA !== null && endAtC !== null ? Math.abs(endAtC - endAtA) : null;

  // User A's OWN pre-check listing, from User A's own (still open) session.
  const precheckListingA = new PrecheckEnquiryPage(page, session);
  const precheckListingRowCountA = await precheckListingA.countTransactionsForVehicle(inputs.envSegment, inputs.vehicleRegNo);

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: attemptA?.declined && attemptC1?.declined && !attemptC2?.declined
      && gateSatisfiedC && deregResultC?.jpjDeregistrationStatus.startsWith('OK')
      && precheckListingRowCountA === 1 && precheckListingRowCountC === 1 && deregListingRowCountC === 1
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'MU_TS3',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    userA: { firstAttempt: attemptA, resetTimerRemaining: remainingA, precheckListingRowCount: precheckListingRowCountA },
    userC: {
      firstAttempt: attemptC1,
      resetTimerRemaining: remainingC,
      retryAttempt: attemptC2,
      gateSatisfied: gateSatisfiedC,
      jpjCheckStatus: jpjCheckResultC?.jpjStatus ?? '',
      jpjCheckResponseCode: jpjCheckResultC?.responseCode ?? '',
      jpjDeregistrationStatus: deregResultC?.jpjDeregistrationStatus ?? '',
      transactionId: deregResultC?.transactionId ?? '',
      precheckListingRowCount: precheckListingRowCountC,
      deregListingRowCount: deregListingRowCountC,
    },
    independenceCheck: { endAtA, endAtC, countdownGapMs },
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
