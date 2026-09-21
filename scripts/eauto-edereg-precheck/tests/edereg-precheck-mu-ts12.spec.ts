import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { LoginPage } from '../pages/LoginPage';
import { PrecheckSession } from '../utils/session';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS } from '../utils/esim';
import { recordSubPageVideo, videoRunDir } from '../utils/videoManifest';
import { TIMESTAMP_OVERLAY_INIT_SCRIPT } from '../utils/overlay';
import { pauseForDashboardContinue } from '../utils/pauseSignal';

// ── MU_TS12 — AATF Multiple Users, SAME company — User A's Failed (IF)
// payment expires via cronjob while User B still has the SAME shared
// Pre-Checking transaction open on the standalone Payment page; both then
// attempt to pay/retry against the now-Expired record (EAINT-9306) ──
//
// Test plan, as given by Faizuddin 2026-08-27:
//
//   Pre-requisite: AATF User A (Main) & User B (Sub) are from different
//   company (make and retry payment after Trx Status = Expired)
//   1. User A go to create new Deregistration. At step 2, input vehicle
//      number without valid pre-check
//   2. Proceed until pre-check enquiry pops up, Trx Status = Pending
//   3. Open another tab and login with User B AATF account
//   4. User B search the transaction in Transaction Listing page
//   5. User A proceed to make payment but Payment = Failed (due to IF),
//      Trx Status = Failed
//   6. Wait until cronjob runs, Trx Status = Expired
//   7. User B attempt to make payment
//   8. System prompt error message "Transaction Expired"
//   9. Click [OK] button and system pre-search the trx in Transaction
//      Listing page, Trx Status = Expired
//   10. User A attempt to retry payment
//   11. System prompt error message "Transaction Expired"
//   12. Click [OK] button and system pre-search the trx in Transaction
//       Listing page, Trx Status = Expired
//
// **"Different company" in the pasted header CONFIRMED to be a stale
// copy-paste, same issue MU_TS2's own plan had (§20)** — the flow only
// ever creates ONE transaction (User A's); User B never creates their own
// and only "searches"/pays on THAT one. Per Faizuddin's direct
// confirmation before building: User B is the SAME-company sub-account
// (`CONFIG.subUsername`/`subPassword`, the identity MU_TS1/TS4/TS8/TS9
// already use), sharing the ONE Pre-Checking record with User A — not the
// different-company User C (`subUsername2`).
//
// **Nearly identical shape to MU_TS9 (§27) up through the Failed
// payment** — User A's setup (create Deregistration, Step 2, stop at the
// inline popup with the gate blocked) is IDENTICAL to MU_TS7/8/9's own
// User A setup. "User B search the transaction in Transaction Listing
// page" (step 4) is read the same way MU_TS9's own step 3 ("User B
// resubmit transaction from Transaction Listing Page") was built —
// `PrecheckEnquiryPage.openViaListingAndResubmit()`, landing on the
// standalone Step 2 (Payment) page. User A's payment (step 5) reuses
// `DeregTransactionPage.attemptInlinePayment()` steered to RHB "IF"
// (insufficient funds) verbatim from MU_TS9.
//
// **Diverges from MU_TS9 at the terminal event**: MU_TS9's transaction
// goes Failed -> Cancelled via a BackOffice action; TS12's own goes
// Failed -> Expired via the SAME cronjob MU_TS11 (§30) hands off to a dev
// to run. Built the same way MU_TS11 was rebuilt: a SINGLE run that
// PAUSES via `pauseForDashboardContinue()` (utils/pauseSignal.ts) rather
// than a Part 1/Part 2 split — both User A's inline popup (now showing
// the declined/Failed payment history) and User B's standalone Payment
// page stay OPEN, on the SAME live sessions, across the pause. Per
// Faizuddin, 2026-08-27: "in both TS11 and 12, it says that needs to wait
// for cronjob to run right? so... make sure to separate the 2 processes
// at that moment in time. after patching, both TS will continue the
// steps at that point in the process" — i.e. the SAME mechanism, applied
// here too.
//
// **Steps 7/10's "attempt to make payment"/"attempt to retry payment"
// reuse MU_TS9's own retry methods VERBATIM** — despite MU_TS9 naming
// them for a BO-cancelled record, both are generic click-and-capture
// helpers: User B via `PrecheckEnquiryPage.attemptStandaloneRetryAfterCancellation()`
// (clicks whichever of #to-retry-rhb/#to-payment renders on the page
// they've had open since step 4), User A via
// `DeregTransactionPage.attemptInlineRetryAfterCancellation()` (clicks
// "Next" on the still-open Payment History popup). Per Faizuddin's TS11
// feedback (same day, applies here too): the literal "Transaction
// Expired" dialog wording is NOT hard-asserted — only the FINAL listing
// status (`Expired`) is, for both users.
//
// GENUINELY UNCONFIRMED, flagged per the standing rule: whether either
// retry mechanic actually surfaces ANY dialog on this shared-transaction,
// same-company shape at all — MU_TS9's own live run showed a PLAIN
// refresh stays completely silent on this entry point (EAINT-12233), and
// even the active-retry mechanic's own dialog text has never matched the
// test plan's literal quote in this suite (MU_TS4/TS8/TS9's shared
// lesson). Logged, not gated on.
//
// NEVER RUN LIVE.
test('AATF Multiple Users — MU_TS12 (same company, User A\'s Failed payment expires via cronjob while User B still has it open, both then attempt to pay/retry)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(40 * 60_000);

  // IF from the start — User A's own payment attempt (step 5) is expected
  // to decline, no happy-path steering needed at any point in this scenario.
  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — creates the Deregistration, triggers the gate,
  // STOPS with the inline #precheck-popup open (never Next, never Cancel).
  // Identical setup to MU_TS7/8/9. ──
  const mykadA = new MykadEmulatorClient(page.context());
  const dereg = new DeregTransactionPage(page, session, mykadA);
  try {
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(getDeregVehicleInputs());
    const alreadySatisfied = await dereg.fillVehicleRegNoAndCheckGate(inputs.vehicleRegNo);
    if (alreadySatisfied) {
      throw new Error(`MU_TS12 needs the gate BLOCKED (no valid pre-check) so the inline popup appears — vehicle ${inputs.vehicleRegNo} already has one.`);
    }
  } finally {
    await mykadA.close();
  }

  const popupOpened = await page.locator('.ui-dialog:visible').last()
    .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
  if (!popupOpened) throw new Error('Expected the inline #precheck-popup after the gate failed, none appeared.');
  session.progress('mu-ts12-popup-open', 'Inline pre-check popup open, Trx Status Pending — stopping here, not paying yet');

  // ── User B (same company, Sub) — "open another tab and login" (a
  // genuinely separate browser context/login, same multi-session
  // convention every other MU_TS case in this suite uses — see
  // knowledge/mykad-emulator.md's multi-session caveat) — searches/
  // resubmits the SAME Pre-Checking record from the listing, reaching the
  // standalone Step 2 (Payment) page. Does NOT pay yet. ──
  const userBContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  await userBContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  const userBPage = await userBContext.newPage();
  const sessionB = new PrecheckSession(userBContext, userBPage);
  try {
    await new LoginPage(userBPage, sessionB).login(inputs, { username: CONFIG.subUsername, password: CONFIG.subPassword });
    sessionB.logUrl('after login (User B)');
    await sessionB.closeBanners();

    const precheckB = new PrecheckEnquiryPage(userBPage, sessionB);
    await precheckB.openViaListingAndResubmit(inputs.envSegment, inputs.vehicleRegNo);
    session.progress('mu-ts12-user-b-search', 'User B searched/resubmitted the same transaction from the listing — standalone Payment page open, not paying yet');

    // ── User A proceeds to pay — expects DECLINED (RHB "IF"), Trx Status
    // Failed. ──
    const attemptA = await dereg.attemptInlinePayment();
    if (!attemptA.declined) {
      throw new Error(`Expected User A's payment attempt (RHB "IF") to be DECLINED — it wasn't (${attemptA.jpjStatus} / ${attemptA.responseDesc}).`);
    }
    session.progress('mu-ts12-user-a-declined', `User A's payment declined as expected: "${attemptA.dialogMessage}"`);

    // Second tab, same context/login as User A — leaves User A's own
    // Payment History popup untouched (same trick MU_TS11 uses). ONE id
    // here, not two: this is the shared, SAME-company record both users
    // are already looking at (unlike MU_TS11's genuinely separate
    // per-company records) — see this file's own header note.
    const listingTabA = await page.context().newPage();
    let transactionId = '';
    try {
      const precheckLookup = new PrecheckEnquiryPage(listingTabA, session);
      transactionId = await precheckLookup.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
    } finally {
      await listingTabA.close();
    }

    // ── PAUSE — User A's popup (now showing the declined Payment History)
    // and User B's standalone Payment page both stay open. Dashboard shows
    // a Continue button; the dev runs the cronjob (or the daily 23:59:59
    // run happens) while this is blocked. ──
    session.progress('mu-ts12-paused', `Paused — User A's Failed (IF) transaction (${transactionId || '(lookup failed)'}) open for ${inputs.vehicleRegNo}, User B's standalone Payment page also open on the same record. Ask the dev to run the cronjob, then click Continue on the dashboard.`);
    await pauseForDashboardContinue(
      `MU_TS12: waiting for cronjob to expire the Failed transaction (vehicle ${inputs.vehicleRegNo})`,
      { transactions: [{ label: 'Shared (User A & User B)', transactionId: transactionId || '(lookup failed)' }] },
    );
    session.progress('mu-ts12-resumed', 'Resumed — dashboard Continue clicked');

    // ── User B attempts to make payment on the now-Expired record —
    // Resubmit link presence isn't in question here (B already reached the
    // standalone Payment page back in step 4, before it expired); this is
    // purely whether clicking Pay/Retry on that still-open page surfaces
    // "Transaction Expired." Observed, not hard-asserted on the dialog
    // itself — see this file's own header note. ──
    const userBAttempt = await precheckB.attemptStandaloneRetryAfterCancellation();
    session.progress('mu-ts12-user-b-payment-attempt', `User B attempted payment on the Expired record — button: "${userBAttempt.buttonClicked}", dialog: "${userBAttempt.dialogMessage}", url after: ${userBAttempt.urlAfter}`);
    const userBExpiredConfirmed = /expired/i.test(userBAttempt.dialogMessage);

    const userBListingAfter = await precheckB.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
    if (userBListingAfter.trxStatus !== 'Expired') {
      throw new Error(`Expected User B's own listing to show Expired after the payment attempt — got "${userBListingAfter.trxStatus}".`);
    }

    // ── User A attempts to retry payment on the still-open inline popup —
    // same treatment, observed only. ──
    const userARetry = await dereg.attemptInlineRetryAfterCancellation();
    session.progress('mu-ts12-user-a-retry', `User A retried payment — dialog: "${userARetry.dialogMessage}", url after: ${userARetry.urlAfter}`);
    const userAExpiredConfirmed = /expired/i.test(userARetry.dialogMessage);

    const precheckA = new PrecheckEnquiryPage(page, session);
    const userAListingAfter = await precheckA.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
    if (userAListingAfter.trxStatus !== 'Expired') {
      throw new Error(`Expected User A's own listing to show Expired after the retry — got "${userAListingAfter.trxStatus}".`);
    }

    const finalPage = session.active();
    console.log('RESULT:' + JSON.stringify({
      // Gated on the CONFIRMED parts only: User A declined, and BOTH final
      // listing checks show Expired. NOT gated on either attempt's own
      // dialog text — logged above, not asserted on.
      status: attemptA.declined
        && userAListingAfter.trxStatus === 'Expired'
        && userBListingAfter.trxStatus === 'Expired'
        ? 'SUCCESS' : 'FAIL',
      tsNo: 'MU_TS12',
      vehicleRegNo: inputs.vehicleRegNo,
      envSegment: inputs.envSegment,
      transactionId,
      userAPaymentAttempt: attemptA,
      userA: { retry: userARetry, expiredConfirmed: userAExpiredConfirmed, listingAfter: userAListingAfter },
      userB: { attempt: userBAttempt, expiredConfirmed: userBExpiredConfirmed, listingAfter: userBListingAfter },
      finalUrl: finalPage.url(),
    }));

    if (!CONFIG.skipPause) {
      await session.active().pause();
    }
  } finally {
    await userBContext.close();
    await recordSubPageVideo(userBPage, 'mu-ts12-user-b').catch(() => { /* ignore */ });
  }
});
