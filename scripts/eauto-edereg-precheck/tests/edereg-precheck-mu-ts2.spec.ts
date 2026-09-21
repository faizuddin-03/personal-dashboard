import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { DeregTransactionListingPage } from '../pages/DeregTransactionListingPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { LoginPage } from '../pages/LoginPage';
import { PrecheckSession } from '../utils/session';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';
import { recordSubPageVideo, videoRunDir } from '../utils/videoManifest';
import { TIMESTAMP_OVERLAY_INIT_SCRIPT } from '../utils/overlay';

// ── MU_TS2: AATF Multiple Users, DIFFERENT company (EAINT-9306) ──
// Same shape as MU_TS1 (tests/edereg-precheck-mu-ts1.spec.ts), one
// deliberate difference: User C is a DIFFERENT company from User A, not a
// sub-account of the same one. The test plan's own MU_TS2 row shares its
// Steps/Expected Results cell with MU_TS1 verbatim (same text, never
// actually updated for the different-company case) — per Faizuddin
// 2026-08-26: "you can use this one, since the old steps/expected results
// is outdated." The ONE behavioural difference that actually matters,
// confirmed directly by Faizuddin: "since the company is different, so
// their pre-checking should be different. so the expected results is that
// company B [C] needs to do their own pre-checking in step 2 of
// deregistration" — i.e. the OPPOSITE of MU_TS1's reuse. Pre-check
// eligibility is company-scoped, not globally vehicle-scoped.
//
// Flow:
//   1. User A creates a Deregistration, Step 2 triggers the inline
//      pre-check, buys it (Approved), STOPS — same reasoning as MU_TS1:
//      a real Deregistration is a one-time, irreversible action per
//      vehicle, so User A must never reach Step 3+.
//   2. User C (SEPARATE company, separate login/browser context) creates
//      a NEW Deregistration for the SAME vehicle no. — Step 2's gate is
//      expected BLOCKED this time (own inline purchase required, NOT
//      reused from User A) — completes it (Approved) — continues through
//      a REAL completed Deregistration.
//   3. Listing checks, corrected 2026-08-26 after a live MU_TS3 run
//      (the RE-decline sibling of this case, same listing shape) proved
//      the ORIGINAL design wrong: both listings are scoped to the LOGGED-
//      IN ACCOUNT/COMPANY, not global. Checking User C's transaction from
//      User A's own session came back EMPTY even though it genuinely
//      existed — User A's session simply has no visibility into a
//      different company's records. Confirmed live: a listing viewed as
//      User A shows only User A's own row, never User C's. So each
//      listing is now checked from the user whose OWN transaction it is:
//      - Pre-Checking listing, from User A's session: expect 1 (their own).
//      - Pre-Checking listing, from User C's session: expect 1 (their own).
//      - Deregistration listing, from User C's session ONLY: expect 1
//        (their own, completed). Not checked from User A's session — User
//        A never reaches Step 3 regardless (knowledge/flow-edereg.md §19),
//        so it would just be an uninformative 0.
//
// User C's creds (CONFIG.subUsername2/subPassword2, default AzfarAATF/
// abcd1234) and MyKad identity (CONFIG.mykadNricSub2/mykadNameSub2,
// default 020406081081 / "23 , 24,25" — genuinely that name per Faizuddin
// checking the DB directly, not a placeholder) confirmed 2026-08-26.
//
// Runs User A and User C STRICTLY SEQUENTIALLY, never concurrently — same
// reasoning as MU_TS1 (MykadEmulatorClient's multi-session behaviour
// across overlapping connections is unconfirmed).
//
// NEVER RUN LIVE.
test('AATF Multiple Users — MU_TS2, different company', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  await ensureEsimHappyPath(inputs.vehicleRegNo);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — inline pre-check purchase only, STOPS at Step 2 ──
  const mykadA = new MykadEmulatorClient(page.context());
  let gateA: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  try {
    const deregA = new DeregTransactionPage(page, session, mykadA);
    await deregA.createFromHome('MYKAD');
    await deregA.authenticateOwner();
    await deregA.fillOwnerContactFields(getDeregVehicleInputs());
    gateA = await deregA.resolveVehicleGate(inputs.vehicleRegNo);
  } finally {
    await mykadA.close();
  }

  if (!gateA?.satisfied || !gateA?.usedInlinePrecheck) {
    throw new Error(
      `User A's inline pre-check purchase did not succeed — gate satisfied=${gateA?.satisfied}, `
      + `usedInlinePrecheck=${gateA?.usedInlinePrecheck}, JPJ ${gateA?.jpjStatus} / ${gateA?.responseDesc}.`,
    );
  }

  // ── User C (different company) — SEPARATE browser context/login, SAME vehicle no. ──
  const userCContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  // Applied to every "Multiple Users" case, 2026-08-27 (piloted on MU_TS1
  // first) — see utils/overlay.ts's own doc comment. A fresh context
  // doesn't inherit the main page's init scripts.
  await userCContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  let userCPage: Awaited<ReturnType<typeof userCContext.newPage>> | undefined;
  let gateC: Awaited<ReturnType<DeregTransactionPage['fillVehicleDetails']>> | null = null;
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
    try {
      const deregC = new DeregTransactionPage(userCPage, sessionC, mykadC);
      await deregC.createFromHome('MYKAD');
      await deregC.authenticateOwner();
      // fillVehicleDetails() resolves the gate itself — expected BLOCKED
      // this time (different company, User A's pre-check does NOT carry
      // over), so this should trigger its OWN inline popup/purchase.
      gateC = await deregC.fillVehicleDetails(inputs, getDeregVehicleInputs());
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
    if (userCPage) await recordSubPageVideo(userCPage, 'mu-ts2-user-c').catch(() => { /* ignore */ });
  }

  if (!gateC?.usedInlinePrecheck) {
    throw new Error(
      "Expected User C's Step 2 gate to be BLOCKED (different company, User A's pre-check should NOT carry over) "
      + '— it came up already-satisfied instead (usedInlinePrecheck: false), meaning no inline purchase happened.',
    );
  }

  // User A's OWN pre-check listing, from User A's own (still open) session.
  const precheckListingA = new PrecheckEnquiryPage(page, session);
  const precheckListingRowCountA = await precheckListingA.countTransactionsForVehicle(inputs.envSegment, inputs.vehicleRegNo);

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: gateA?.satisfied && gateA?.usedInlinePrecheck
      && gateC?.satisfied && gateC?.usedInlinePrecheck
      && deregResultC?.jpjDeregistrationStatus.startsWith('OK')
      && precheckListingRowCountA === 1
      && precheckListingRowCountC === 1
      && deregListingRowCountC === 1
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'MU_TS2',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    userA: { gate: gateA, precheckListingRowCount: precheckListingRowCountA },
    userC: {
      gate: gateC,
      jpjCheckStatus: jpjCheckResultC?.jpjStatus ?? '',
      jpjCheckResponseCode: jpjCheckResultC?.responseCode ?? '',
      jpjDeregistrationStatus: deregResultC?.jpjDeregistrationStatus ?? '',
      transactionId: deregResultC?.transactionId ?? '',
      precheckListingRowCount: precheckListingRowCountC,
      deregListingRowCount: deregListingRowCountC,
    },
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
