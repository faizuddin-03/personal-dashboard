import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { OtherFunctionsPage } from '../pages/OtherFunctionsPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';

// ── EC_TS2 — "Extra Coverage" group (EAINT-9306): an abandoned (never-paid)
// precheck is REUSED, not duplicated, when a GENUINELY NEW Deregistration
// transaction is created afterward for the same vehicle ──
//
// REBUILT 2026-09-01, per Faizuddin's own literal steps, replacing the
// original "re-enter the vehicle no. on the same still-open Step 2 page"
// build:
//   1. Create a new deregistration transaction
//   2. At step 2, enter a fresh vehicle number without any prior pre-check
//   3. After the message asks to make payment for pre-check popup, do not
//      proceed and close the popup
//   4. Go to the pre-check listing and ensure the newly created transaction
//      is [Pending]
//   5. Repeat creating a new deregistration until complete purchasing the
//      pre-check
//   6. Go to the pre-check listing page and observe the pre-check
//      transaction
//
// The key difference from the original build: each round is its OWN fresh
// "Create Deregistration Transaction" (its own MyKad category confirm, its
// own Owner MyKad authentication) via `DeregTransactionPage.createFromHome()`
// — not the same page's `#vehicleRegNo` field re-filled a second time. This
// is a closer match to a real "come back later and try again" scenario than
// the original same-page re-trigger was.
//
// Round 1: create the Deregistration, hit the compulsory gate, and CANCEL
// the resulting inline payment popup without paying — `OtherFunctionsPage.
// cancelPrecheckPopup()` already does exactly this (fills+blurs
// #vehicleRegNo, waits for the popup, clicks Cancel). Look up the
// Pre-Checking listing afterward.
//
// Round 2: a SECOND, GENUINELY NEW Deregistration transaction for the SAME
// vehicle no. — `createFromHome()` clicks `#home-link` as its own first
// step, so it can be called again directly from wherever round 1 left off,
// no manual navigation needed. This time COMPLETE the pre-check purchase
// (`DeregTransactionPage.resolveVehicleGate()` — pay, JPJ result, Close)
// instead of cancelling again, per step 5's "until complete purchasing the
// pre-check." Look up the listing a second time.
//
// PRECONDITION: `vehicleRegNo` must have NO prior pre-checking transaction.
//
// GENUINELY UNCONFIRMED: whether an abandoned (Cancelled-before-paying)
// popup persists ANY row at all, versus nothing being written until the
// first Next/payment click — never observed live in this suite. If it
// persists nothing, `rowCount1` below comes back 0 and `transactionId1`
// comes back '', which is itself the finding (not a script bug). Also
// unconfirmed: whether round 2's own gate check reuses round 1's abandoned
// record's payment history/shape, or genuinely re-runs a first-time inline
// purchase — `resolveVehicleGate()` doesn't distinguish between the two,
// it just reports whatever `#jpjStatusLabel`/`#responseDesc` come back.
//
// NEVER RUN LIVE.
test('Extra Coverage — EC_TS2 (abandoned precheck reused, not duplicated, when a fresh Deregistration completes the purchase)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(10 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  // Round 2 needs a real Approved result — set the happy path up front so
  // it's already in place whenever round 2 gets there.
  await ensureEsimHappyPath(inputs.vehicleRegNo);

  // ── Round 1: create a Deregistration, hit the gate, CANCEL the payment
  // popup without paying — "do not proceed and close the popup." ──
  const mykad1 = new MykadEmulatorClient(page.context());
  const otherFunctions = new OtherFunctionsPage(page, session);
  let cancel1: Awaited<ReturnType<OtherFunctionsPage['cancelPrecheckPopup']>>;
  try {
    const dereg1 = new DeregTransactionPage(page, session, mykad1);
    await dereg1.createFromHome();
    await dereg1.authenticateOwner();
    await dereg1.fillOwnerContactFields(getDeregVehicleInputs());
    cancel1 = await otherFunctions.cancelPrecheckPopup(dereg1, inputs.vehicleRegNo);
  } finally {
    await mykad1.close();
  }
  session.progress('ec-ts2-round-1', `Round 1: popup ${cancel1.popupClosed ? 'closed' : 'STILL OPEN'} without paying, blocked=${cancel1.isRed}`);

  // "Go the the pre-check listing and ensure the newly created transaction
  // is [Pending]" — from a separate tab, so round 1's own Step 2 page
  // (still showing the red error) is never navigated away.
  const lookupTab1 = await page.context().newPage();
  let transactionId1 = '';
  let statusAfterRound1: Awaited<ReturnType<PrecheckEnquiryPage['getListingStatusForVehicle']>>;
  try {
    const precheckLookup1 = new PrecheckEnquiryPage(lookupTab1, session);
    transactionId1 = await precheckLookup1.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
    statusAfterRound1 = await precheckLookup1.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
  } finally {
    await lookupTab1.close();
  }
  session.progress('ec-ts2-lookup-1', `After round 1: ${statusAfterRound1.rowCount} row(s), transaction ID "${transactionId1 || '(none)'}", Trx Status "${statusAfterRound1.trxStatus}"`);

  // ── Round 2: "Repeat creating a new deregistration" — a GENUINELY NEW
  // Deregistration transaction (fresh createFromHome() -> fresh MyKad
  // owner auth), same vehicle no., this time carried "until complete
  // purchasing the pre-check." ──
  const mykad2 = new MykadEmulatorClient(page.context());
  let gate2: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>>;
  try {
    const dereg2 = new DeregTransactionPage(page, session, mykad2);
    await dereg2.createFromHome();
    await dereg2.authenticateOwner();
    await dereg2.fillOwnerContactFields(getDeregVehicleInputs());
    gate2 = await dereg2.resolveVehicleGate(inputs.vehicleRegNo);
  } finally {
    await mykad2.close();
  }
  if (!gate2.satisfied) {
    throw new Error(`Expected round 2's pre-check purchase to come back Approved — got satisfied=false (${gate2.jpjStatus} / ${gate2.responseDesc}).`);
  }
  session.progress('ec-ts2-round-2', `Round 2: pre-check purchase completed — ${gate2.jpjStatus} / ${gate2.responseDesc}`);

  // "Go to the pre-check listing page and observe the pre-check
  // transaction" — the actual finding this test exists to surface.
  const lookupTab2 = await page.context().newPage();
  let transactionId2 = '';
  let statusAfterRound2: Awaited<ReturnType<PrecheckEnquiryPage['getListingStatusForVehicle']>>;
  try {
    const precheckLookup2 = new PrecheckEnquiryPage(lookupTab2, session);
    transactionId2 = await precheckLookup2.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
    statusAfterRound2 = await precheckLookup2.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
  } finally {
    await lookupTab2.close();
  }
  session.progress('ec-ts2-lookup-2', `After round 2: ${statusAfterRound2.rowCount} row(s), transaction ID "${transactionId2 || '(none)'}", Trx Status "${statusAfterRound2.trxStatus}"`);

  const sameRecordReused = transactionId1 !== '' && transactionId1 === transactionId2;
  const notDuplicated = statusAfterRound1.rowCount === statusAfterRound2.rowCount;

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: gate2.satisfied && sameRecordReused && notDuplicated ? 'SUCCESS' : 'FAIL',
    label: 'EC_TS2 — abandoned precheck reused, not duplicated, when a fresh Deregistration completes the purchase',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    round1: { cancel: cancel1, transactionId: transactionId1, listing: statusAfterRound1 },
    round2: { gate: gate2, transactionId: transactionId2, listing: statusAfterRound2 },
    sameRecordReused,
    notDuplicated,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
