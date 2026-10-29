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

// ── MU_TS7: AATF Multiple Users, DIFFERENT company — User A abandons an
// unpaid pre-check, a different company buys its own in between, User A
// resumes and completes the SAME vehicle no. (EAINT-9306) ──
//
// Test plan, as given by Faizuddin 2026-08-26 (no wording correction —
// three interpretive gaps resolved directly by him before this build):
//
//   Pre-requisite: AATF User A (Main) & User B (Sub) are from different
//   company
//   1. User A go to create new Deregistration. At step 2, input vehicle
//      number.
//   2. Stop until pre-checking enquiry popup appears
//   3. Go to the pre-check listing an ensure the transaction on the
//      vehicle number is Pending
//   4. User B go to eDereg Pre-Checking Transaction and make transaction
//      using the same vehicle number
//   5. Proceed with the eDereg Pre-Checking until Trx Status = Approved,
//      Payment = OK, JPJ Pre-Checking = OK
//   6. User A resubmit with the Deregistration process from the listing
//      page
//   7. Do deregistration with the same vehicle number until the status for
//      the Deregistration Transaction is Trx Status = Approved, Payment = OK
//
// Three gaps resolved directly by Faizuddin before this build:
//   1. Checking the listing in step 3 without losing the open
//      `#precheck-popup`: use a SECOND TAB in User A's own browser context
//      (same login), never navigate the tab holding the open popup — same
//      reasoning as MU_TS5's own listing-check fix (knowledge/
//      flow-edereg.md §23).
//   2. Step 6's "listing page" is the PRE-CHECKING listing, not the
//      Deregistration listing — confirmed necessary since MU_TS1 already
//      established an incomplete Deregistration (User A here never gets
//      past Step 2) doesn't appear on the Deregistration Transaction
//      Listing at all until Step 3.
//   3. Step 7 drives a REAL completed Deregistration (Step 3 consent →
//      Step 4 JPJ check → Step 5/6 payment+deregister) — this vehicle is
//      only ever deregistered once in this test (User B never touches
//      Deregistration, only the standalone Pre-Checking enquiry), so no
//      reuse conflict with the "a vehicle can't be deregistered twice"
//      rule (MU_TS1, §19).
//
// "User B (Sub), different company" maps to this suite's existing User C
// identity (CONFIG.subUsername2/subPassword2, default AzfarAATF —
// CONFIG.mykadNricSub2/mykadNameSub2) — same slot MU_TS2/TS3/TS5 use, kept
// for naming consistency across this ticket's automation, same as every
// earlier different-company case.
//
// TWO GENUINELY UNCONFIRMED SHAPES, flagged per the standing rule rather
// than guessed silently:
//   - PrecheckEnquiryPage.resumePendingPayment() (step 6's actual payment
//     button) — every other Resubmit case built so far (MU_TS4/TS6) is for
//     a record with an EXISTING payment attempt (declined or JPJ-rejected),
//     which renders `#to-retry-rhb` ("RETRY") with Payment History. A
//     genuinely Pending/never-attempted record (this case) may instead
//     render the standalone flow's ordinary `#to-payment` ("NEXT") button
//     since there's no history yet — the method checks for either.
//   - Step 7's re-entry into a real Deregistration: after User A's Step 2
//     popup is abandoned (never Cancelled, never paid) and the vehicle's
//     pre-check gets paid for entirely through the LISTING instead, this
//     build calls `dereg.createFromHome('MYKAD')` again on the SAME
//     session to start the Deregistration proper. Per MU_TS6's own
//     first-run finding, a same-company navigation while a draft is
//     pending gets redirected to RESUME that draft rather than starting
//     fresh — if that happens here too, `authenticateOwner()` may find
//     itself on an already-authenticated Step 2 form instead of a fresh
//     Owner Authentication screen. Expect this exact sequence may need
//     adjusting after the first live run.
//
// NEVER RUN LIVE.
test('AATF Multiple Users — MU_TS7, different company, resume an abandoned pre-check', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(10 * 60_000);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — creates the Deregistration, triggers the gate,
  // STOPS with the inline #precheck-popup open (never Next, never Cancel). ──
  const mykadA = new MykadEmulatorClient(page.context());
  const dereg = new DeregTransactionPage(page, session, mykadA);
  try {
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(getDeregVehicleInputs());
    const alreadySatisfied = await dereg.fillVehicleRegNoAndCheckGate(inputs.vehicleRegNo);
    if (alreadySatisfied) {
      throw new Error(`MU_TS7 needs the gate BLOCKED (no valid pre-check) so the inline popup appears — vehicle ${inputs.vehicleRegNo} already has one.`);
    }
  } finally {
    await mykadA.close();
  }

  const popupOpened = await page.locator('.ui-dialog:visible').last()
    .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
  if (!popupOpened) throw new Error('Expected the inline #precheck-popup after the gate failed, none appeared.');
  session.progress('mu-ts7-popup-open', 'Inline pre-check popup open — stopping here, not paying');

  // ── Check the Pre-Checking listing from a SECOND TAB, same context/login,
  // so the still-open popup on the original tab is never disturbed. ──
  const listingTabA = await page.context().newPage();
  let listingStatusPending: Awaited<ReturnType<PrecheckEnquiryPage['getListingStatusForVehicle']>> | null = null;
  try {
    const precheckA = new PrecheckEnquiryPage(listingTabA, session);
    listingStatusPending = await precheckA.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
  } finally {
    await listingTabA.close();
  }
  if (listingStatusPending.rowCount !== 1 || listingStatusPending.trxStatus !== 'Pending') {
    throw new Error(`Expected exactly 1 Pending row for ${inputs.vehicleRegNo} while User A's popup is open — got ${JSON.stringify(listingStatusPending)}.`);
  }

  // ── User B / "Sub" (different company, User C identity) — the
  // STANDALONE eDereg Pre-Checking Enquiry flow, own new transaction, same
  // vehicle no. Steered to Approved before this purchase. ──
  const userBContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  // Applied to every "Multiple Users" case, 2026-08-27 (piloted on MU_TS1
  // first) — see utils/overlay.ts's own doc comment.
  await userBContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  let userBPage: Awaited<ReturnType<typeof userBContext.newPage>> | undefined;
  let userBResult: Awaited<ReturnType<PrecheckEnquiryPage['readResult']>> | null = null;
  try {
    await ensureEsimHappyPath(inputs.vehicleRegNo);

    userBPage = await userBContext.newPage();
    const sessionB = new PrecheckSession(userBContext, userBPage);
    await new LoginPage(userBPage, sessionB).login(inputs, { username: CONFIG.subUsername2, password: CONFIG.subPassword2 });
    sessionB.logUrl('after login (User B)');
    await sessionB.closeBanners();

    const precheckB = new PrecheckEnquiryPage(userBPage, sessionB);
    await precheckB.openFromHome();
    await precheckB.fillVehicleAndConsent(inputs);
    await precheckB.enquireNow();
    await precheckB.pay();
    userBResult = await precheckB.readResult();
  } finally {
    await userBContext.close();
    if (userBPage) await recordSubPageVideo(userBPage, 'mu-ts7-user-b').catch(() => { /* ignore */ });
  }
  if (userBResult?.jpjStatusLabel !== 'OK') {
    throw new Error(`Expected User B's own standalone pre-check to come back Approved (OK) — got "${userBResult?.jpjStatusLabel}" / "${userBResult?.responseDesc}".`);
  }

  // ── User A resumes THEIR OWN Pending record via the Pre-Checking
  // listing's Resubmit link (same-company listing scoping keeps this to
  // User A's own row, not User B's separate different-company one). ──
  const precheckA = new PrecheckEnquiryPage(page, session);
  await precheckA.openViaListingAndResubmit(inputs.envSegment, inputs.vehicleRegNo);
  const resumeResult = await precheckA.resumePendingPayment();
  if (resumeResult.resultResponseDesc && !/OK|GLB000000I/i.test(resumeResult.resultResponseDesc)) {
    throw new Error(`Expected User A's resumed Pending pre-check to come back Approved — got "${resumeResult.resultResponseDesc}".`);
  }

  // ── Re-enter the Deregistration flow and drive it to a REAL completed
  // transaction. See this file's own header comment — if the app instead
  // resumes the abandoned Step-2 draft rather than starting fresh, this
  // sequence needs adjusting. ──
  const mykadA2 = new MykadEmulatorClient(page.context());
  let gateA: Awaited<ReturnType<DeregTransactionPage['fillVehicleDetails']>> | null = null;
  let jpjCheckResult: Awaited<ReturnType<DeregTransactionPage['jpjCheck']>> | null = null;
  let deregResult: Awaited<ReturnType<DeregTransactionPage['payAndDeregister']>> | null = null;
  try {
    const dereg2 = new DeregTransactionPage(page, session, mykadA2);
    await dereg2.createFromHome('MYKAD');
    await dereg2.authenticateOwner();
    gateA = await dereg2.fillVehicleDetails(inputs, getDeregVehicleInputs());
    await dereg2.ownerConsentAndAuth();
    await dereg2.aatfConsentAndAuth();
    jpjCheckResult = await dereg2.jpjCheck();
    deregResult = await dereg2.payAndDeregister();
  } finally {
    await mykadA2.close();
  }

  if (gateA?.usedInlinePrecheck) {
    throw new Error(
      "Expected User A's Step 2 gate to be ALREADY satisfied by the just-resumed Approved pre-check "
      + '— it triggered its OWN inline purchase instead (usedInlinePrecheck: true).',
    );
  }

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: listingStatusPending?.trxStatus === 'Pending'
      && userBResult?.jpjStatusLabel === 'OK'
      && gateA?.satisfied === true && gateA?.usedInlinePrecheck === false
      && !!deregResult?.jpjDeregistrationStatus.startsWith('OK')
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'MU_TS7',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    listingStatusWhilePending: listingStatusPending,
    userB: { result: userBResult },
    userAResume: resumeResult,
    userAGate: gateA,
    userA: {
      jpjCheckStatus: jpjCheckResult?.jpjStatus ?? '',
      jpjCheckResponseCode: jpjCheckResult?.responseCode ?? '',
      jpjDeregistrationStatus: deregResult?.jpjDeregistrationStatus ?? '',
      transactionId: deregResult?.transactionId ?? '',
    },
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
