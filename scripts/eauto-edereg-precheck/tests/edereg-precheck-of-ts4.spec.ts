import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS, ensureEsimHappyPath } from '../utils/esim';
import { runPostDeregSrdChecklist } from '../utils/srdChecklist';
import { pauseForDashboardContinue } from '../utils/pauseSignal';

// ── OF_TS4 — Pre-Checking Reset Payment (EAINT-9306) ──
// REBUILT 2026-08-28 as a SINGLE run with a dashboard pause/continue, per
// Faizuddin's correction of the original Part 1/Part 2 build: "there's an
// issue with this logic. the part 2 cannot use another transaction. it must
// use the same transaction. so basically, the automation needs to stay on
// the same transaction, i will ask dev to patch the payment transaction, and
// tell the automation to continue running it."
//
// The original two-file build (edereg-precheck-of-ts4-part1/-part2.spec.ts,
// added 2026-08-26 — see knowledge/flow-edereg.md §18) had Part 2 create a
// BRAND NEW Deregistration transaction on the same vehicle no. instead of
// continuing the one Part 1 declined. That's the wrong shape for a payment
// RESET (as opposed to CPC_E2E_TS4/5/6/10/11/12's expiry-timestamp backdate,
// where the record's age is all that changes) — the dev is patching THIS
// specific transaction's payment state, so the automation has to still be
// looking at it afterward, same mechanism MU_TS11/TS12 already use
// (`utils/pauseSignal.ts`, added 2026-08-27) to survive a dev hand-off
// without restarting the browser session.
//
// Per Faizuddin, 2026-08-26 (the original test-plan framing, still the
// source of truth for what each step does — only WHICH transaction Part 2
// acts on has changed):
//
//   (part 1) create new deregistration with fresh VN > at step 2, will
//   purchase pre-checking with payment = IF > stop part 1 [...] (Part 2)
//   create new deregistration using the same VN > at step 2, will purchase
//   the payment again (this is why i call it retrigger, because we retrigger
//   the payment function) > observe message error in the test scenario table
//   > click [Next] to retry the payment again > check the details in the
//   payment popup. it should show new payment reference in the payment
//   history. the payment history list is in the popup also. make sure to
//   scroll to capture all the payment history details > open eSIM and change
//   the payment to OK > proceed until complete deregistration flow
//
// Read literally now as: ONE Deregistration transaction throughout. The
// first payment attempt declines (RHB "IF") -> PAUSE, hand the transaction
// ID to the dev to reset the payment -> resume on the SAME still-open
// #precheck-popup for the retrigger (Attempt A), a further retry
// (Attempt B), then re-steer eSIM to OK and succeed (Attempt C) -> continue
// through the rest of Deregistration same as CPC_E2E_TS1/TS7/TS9's own
// continuations.
//
// mykad is kept open for the WHOLE test (closed only in the outer finally),
// same convention CPC_E2E_TS9 (edereg-precheck-step2-first-retry-approved.spec.ts)
// uses for its own two-resolveVehicleGate()-calls-in-one-run shape — not the
// original Part 1 file's early close, which only made sense when the test
// ended right after the first decline.
//
// UNCONFIRMED, same as the original build: whether Attempt A's specific
// dialog wording ("Rhb payment internal error, please try again later.") is
// really caused by the dev's reset action, versus being inherent to retrying
// an already-declined transaction regardless of any reset — checked
// (WARNING on mismatch), not hard-asserted. NEW to this rebuild: whether the
// SAME #precheck-popup really survives the pause/continue round-trip at all
// (MU_TS11/TS12 kept THEIR popups open across a pause too, but neither has
// been confirmed live yet either as of this rebuild).
//
// NEVER RUN LIVE.
test('Other Functions — OF_TS4 (RHB IF decline, dev resets payment on the SAME transaction, retrigger, then Approved)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(40 * 60_000);

  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS);

  session.logUrl('after login');
  await session.closeBanners();

  const vehicle = getDeregVehicleInputs();
  const mykad = new MykadEmulatorClient(page.context());
  const EXPECTED_INTERNAL_ERROR_TEXT = 'rhb payment internal error, please try again later';
  let firstAttempt: Awaited<ReturnType<DeregTransactionPage['beginInlinePaymentFlow']>> | null = null;
  let attemptA: Awaited<ReturnType<DeregTransactionPage['attemptInlinePayment']>> | null = null;
  let attemptB: Awaited<ReturnType<DeregTransactionPage['attemptInlinePayment']>> | null = null;
  let attemptC: Awaited<ReturnType<DeregTransactionPage['attemptInlinePayment']>> | null = null;
  let gateSatisfied = false;
  let jpjCheckResult: Awaited<ReturnType<DeregTransactionPage['jpjCheck']>> | null = null;
  let deregResult: Awaited<ReturnType<DeregTransactionPage['payAndDeregister']>> | null = null;
  let srdChecklist: Awaited<ReturnType<typeof runPostDeregSrdChecklist>> | null = null;
  let transactionId = '';
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(vehicle);

    // First attempt — expects DECLINED (RHB "IF"). Leaves the SAME
    // #precheck-popup open on screen (showing Payment History) through the
    // pause below.
    firstAttempt = await dereg.beginInlinePaymentFlow(inputs.vehicleRegNo);
    if (!firstAttempt.declined) {
      throw new Error(`Expected the first payment attempt (RHB "IF") to be DECLINED — it wasn't (${firstAttempt.jpjStatus} / ${firstAttempt.responseDesc}).`);
    }
    session.progress('of-ts4-declined', `First payment attempt declined as expected: "${firstAttempt.dialogMessage}"`);

    // Second tab, same login — looks up the transaction ID to hand to the
    // dev without disturbing User A's own open popup (same trick
    // MU_TS9/TS11/TS12 use for their own lookups).
    const lookupTab = await page.context().newPage();
    try {
      const precheckLookup = new PrecheckEnquiryPage(lookupTab, session);
      transactionId = await precheckLookup.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
    } finally {
      await lookupTab.close();
    }

    // ── PAUSE — the declined #precheck-popup stays open on the SAME live
    // session. Dashboard shows a Continue button; the dev resets the
    // payment on this exact transaction while this is blocked. ──
    session.progress('of-ts4-paused', `Paused — declined transaction (${transactionId || '(lookup failed)'}) open for ${inputs.vehicleRegNo}. Ask the dev to RESET the payment on this transaction, then click Continue on the dashboard.`);
    await pauseForDashboardContinue(
      `OF_TS4: waiting for dev to reset the payment (vehicle ${inputs.vehicleRegNo})`,
      { transactions: [{ label: 'Pre-Checking transaction', transactionId: transactionId || '(lookup failed)' }] },
    );
    session.progress('of-ts4-resumed', 'Resumed — dashboard Continue clicked');

    // Attempt A ("retrigger") — same still-open popup, eSIM is STILL
    // steered to "IF" (the dev's reset is a backend action unrelated to our
    // own eSIM mock). Expects a decline, with different dialog wording this
    // time per Faizuddin — checked, not hard-asserted (unconfirmed live).
    attemptA = await dereg.attemptInlinePayment();
    if (!attemptA.declined) {
      throw new Error(`Expected Attempt A (retrigger, still RHB "IF") to be DECLINED — it wasn't (${attemptA.jpjStatus} / ${attemptA.responseDesc}).`);
    }
    if (!attemptA.dialogMessage.toLowerCase().includes(EXPECTED_INTERNAL_ERROR_TEXT)) {
      console.log(`WARNING: Attempt A's dialog message did not match the expected "Rhb payment internal error..." text — got: "${attemptA.dialogMessage}"`);
    }

    // Attempt B — retry again, still declined, logs a new Payment History
    // entry in the SAME popup (utils/session.ts's pauseForDetails() scrolls
    // within the popup itself if it overflows).
    attemptB = await dereg.attemptInlinePayment();
    if (!attemptB.declined) {
      throw new Error(`Expected Attempt B (retry) to be DECLINED — it wasn't (${attemptB.jpjStatus} / ${attemptB.responseDesc}).`);
    }

    // ONLY NOW re-steer eSIM to OK, per Faizuddin's own framing of this flow.
    await ensureEsimHappyPath(inputs.vehicleRegNo);

    // Attempt C — expects success.
    attemptC = await dereg.attemptInlinePayment();
    if (attemptC.declined) {
      throw new Error('Expected Attempt C to succeed after re-steering RHB Transfer to OK — it was declined again.');
    }

    gateSatisfied = await dereg.isVehicleGateSatisfiedNow();
    if (!gateSatisfied) {
      throw new Error('Payment succeeded but the vehicle gate did not turn green afterward.');
    }

    await dereg.submitVehicleDetails(vehicle);
    await dereg.ownerConsentAndAuth();
    await dereg.aatfConsentAndAuth();
    jpjCheckResult = await dereg.jpjCheck();
    deregResult = await dereg.payAndDeregister();
    srdChecklist = await runPostDeregSrdChecklist({
      page, session, dereg, envSegment: inputs.envSegment, vehicleRegNo: inputs.vehicleRegNo,
      expectedResponseCode: attemptC.responseDesc?.split(' - ')[0]?.trim() ?? '',
    });
  } finally {
    await mykad.close();
  }

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: firstAttempt?.declined && attemptA?.declined && attemptB?.declined && !attemptC?.declined && gateSatisfied
      && deregResult?.jpjDeregistrationStatus.startsWith('OK')
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'OF_TS4',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    transactionId,
    firstAttempt,
    paymentAttempts: { attemptA, attemptB, attemptC },
    deregistration: {
      jpjCheckStatus: jpjCheckResult?.jpjStatus ?? '',
      jpjCheckResponseCode: jpjCheckResult?.responseCode ?? '',
      jpjDeregistrationStatus: deregResult?.jpjDeregistrationStatus ?? '',
      transactionId: deregResult?.transactionId ?? '',
    },
    detailsCheck: srdChecklist?.detailsCheck,
    precheckLinkCheck: srdChecklist?.precheckLinkCheck,
    jpjXmlLogCheck: srdChecklist?.jpjXmlLogCheck,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
