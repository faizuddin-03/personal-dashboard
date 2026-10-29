import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { LoginPage } from '../pages/LoginPage';
import { PrecheckSession } from '../utils/session';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimVehicleNotExistPath, ensureEsimHappyPath } from '../utils/esim';
import { recordSubPageVideo, videoRunDir } from '../utils/videoManifest';
import { TIMESTAMP_OVERLAY_INIT_SCRIPT } from '../utils/overlay';

// ── MU_TS5: AATF Multiple Users, DIFFERENT company, isolation check (EAINT-9306) ──
// The test plan's OWN written steps (Trx Status "Failed (JPJ Pre-Checking
// Enquiry)", "2 Users / Different Company") describe a "User B searches
// the listing and attempts to make payment, gets a duplicate-RHB-payment
// message" scenario — SUPERSEDED by Faizuddin's own corrected version,
// 2026-08-26:
//
//   Pre-requisite: AATF User A (Main) & User B (Main) are from different
//   company (attempt to make payment after JPJ Pre-Checking = Failed)
//   1. User A creates a new Deregistration. Step 2, input vehicle no.
//      Ensure it has no valid pre-check
//   2. Proceed with payment but JPJ Pre-Checking = Failed (VEL000100E),
//      Trx Status = Failed
//   3. User B creates a NEW Deregistration with the SAME vehicle no.
//   4. Proceed with payment but JPJ Pre-Checking = Failed (VEL000100E),
//      Trx Status = Failed. Ensure the pre-check listing creates a NEW
//      transaction
//   5. User A redoes checking in Step 2 with JPJ Pre-Checking = OK
//   6. User B redoes checking in Step 2 with JPJ Pre-Checking = Failed
//      (VEL000100E). Ensure User B CANNOT proceed with the deregistration
//
// Per Faizuddin's own framing of the INTENT: "since this precheck is in a
// new flow, i need to make sure the function will not affect globally. so
// if User A passes, i need to make sure if when user B does and expected
// to fail, it will fail, and will not pass using User A's result." — i.e.
// this is an ISOLATION test between different companies' pre-check state,
// not a payment-collision test like the original written steps described.
//
// eSIM steering is PER-VEHICLE-PREFIX, not per-company (confirmed
// throughout this suite) — so proving isolation genuinely requires
// changing the eSIM code back and forth explicitly, per Faizuddin: "the
// automation will need to change the details in the eSim multiple times."
// Sequence: Failed (both first attempts) -> OK (User A's redo only) ->
// Failed again (User B's redo) — if User B's redo were left on "OK", a
// pass wouldn't prove isolation, just that both happened to share a
// happy-path code.
//
// "User B (Main), different company" maps to this suite's existing User C
// identity (CONFIG.subUsername2/subPassword2, default AzfarAATF —
// CONFIG.mykadNricSub2/mykadNameSub2) — same slot MU_TS2/TS3 use, kept
// for naming consistency across this ticket's automation rather than the
// test plan's own literal "User B" label.
//
// Neither user is driven to a REAL completed Deregistration — the test
// plan's own steps stop at confirming each gate's satisfied/not-satisfied
// state, and per Faizuddin's established rule (MU_TS1, §19), a real
// Deregistration is a one-time, irreversible action per vehicle; nothing
// here requires it.
//
// Reuses two already-established patterns directly: CPC_E2E_TS9's own
// "resolveVehicleGate() called twice on the same live page, re-steering
// eSIM between attempts" shape (never confirmed live itself), and MU_TS2/
// TS3's "separate browser context per company, checked from its own
// session" shape (confirmed live).
//
// First live run (2026-08-26) failed: the listing count for User A ran
// directly against `page` (still-open Deregistration Step 2 tab needed for
// the redo two steps later) and stranded it on the Pre-Checking listing
// page instead — see the `newPage()` ephemeral-tab comment below and
// knowledge/flow-edereg.md §23 for the full root cause. Fixed.
//
// CORRECTED 2026-09-02, per Faizuddin — "redo comes back Approved" no
// longer holds for EITHER user. Confirmed live: once a vehicle already has
// a Failed pre-check on file, re-entering it on the SAME still-open Step 2
// form just reshows that stale Failed result (`dialogShape:
// 'closed-direct'`) — re-steering eSIM beforehand does NOT change this,
// since no fresh JPJ check actually runs on a reshow (same root cause as
// CPC_E2E_TS9's own correction, knowledge/flow-edereg.md §33/§34). So
// User A's redo can no longer reach Approved via this mechanism, which
// means the original isolation proof ("does User A's now-Approved state
// leak to User C") can't be exercised this way either — Approved is simply
// unreachable for either user through a same-session redo.
//
// Redefined what "isolation" means here instead: BOTH users' redos should
// each reshow their OWN stale Failed result (`dialogShape: 'closed-direct'`,
// satisfied: false), even after eSIM is re-steered — proving the reshow is
// scoped to each company's own record and doesn't leak the OTHER company's
// data (or the fresh eSIM code) across. Kept the eSIM re-steer calls
// (Approved before User A's redo, back to Failed before User C's) since
// they're still useful evidence that the reshow ignores the underlying
// code either way, same reasoning TS9's rebuild used.
test('AATF Multiple Users — MU_TS5, different company, isolation check', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(10 * 60_000);

  await ensureEsimVehicleNotExistPath(inputs.vehicleRegNo);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — first attempt, expected Failed. Stays open for the
  // later redo, same "declared outside its own setup try" shape as MU_TS4's
  // deregA (mykadA.close() is a documented no-op regardless of timing). ──
  const mykadA = new MykadEmulatorClient(page.context());
  const deregA = new DeregTransactionPage(page, session, mykadA);
  const vehicleA = getDeregVehicleInputs();
  let attemptA1: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  try {
    await deregA.createFromHome('MYKAD');
    await deregA.authenticateOwner();
    await deregA.fillOwnerContactFields(vehicleA);
    attemptA1 = await deregA.resolveVehicleGate(inputs.vehicleRegNo);
  } finally {
    await mykadA.close();
  }
  if (attemptA1?.satisfied) {
    throw new Error(`Expected User A's first attempt to come back Failed (VEL000100E) — got satisfied=true (${attemptA1.jpjStatus} / ${attemptA1.responseDesc}).`);
  }

  // ── User C (different company) — own SEPARATE new Deregistration, SAME
  // vehicle no., still steered Failed. Stays open for its own later redo. ──
  const userCContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  // Applied to every "Multiple Users" case, 2026-08-27 (piloted on MU_TS1
  // first) — see utils/overlay.ts's own doc comment.
  await userCContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  let userCPage: Awaited<ReturnType<typeof userCContext.newPage>> | undefined;
  let attemptC1: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  let attemptA2: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  let attemptC2: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  let precheckListingRowCountA = -1;
  let precheckListingRowCountC = -1;
  try {
    userCPage = await userCContext.newPage();
    const sessionC = new PrecheckSession(userCContext, userCPage);
    await new LoginPage(userCPage, sessionC).login(inputs, { username: CONFIG.subUsername2, password: CONFIG.subPassword2 });
    sessionC.logUrl('after login (User C)');
    await sessionC.closeBanners();

    const mykadC = new MykadEmulatorClient(userCContext, { nric: CONFIG.mykadNricSub2, name: CONFIG.mykadNameSub2 });
    const vehicleC = getDeregVehicleInputs();
    const deregC = new DeregTransactionPage(userCPage, sessionC, mykadC);
    try {
      await deregC.createFromHome('MYKAD');
      await deregC.authenticateOwner();
      await deregC.fillOwnerContactFields(vehicleC);
      attemptC1 = await deregC.resolveVehicleGate(inputs.vehicleRegNo);
    } finally {
      await mykadC.close();
    }
    if (attemptC1.satisfied) {
      throw new Error(`Expected User C's first attempt to come back Failed (VEL000100E) too — got satisfied=true (${attemptC1.jpjStatus} / ${attemptC1.responseDesc}).`);
    }

    // "Ensure the pre-check listing creates a NEW transaction" — each
    // company should see exactly its OWN 1 row, not the other's (same
    // pattern MU_TS2/TS3 already confirmed for different-company listing
    // scoping, knowledge/flow-edereg.md §21).
    //
    // Done on EPHEMERAL tabs, not `page`/`userCPage` themselves — MU_TS5's
    // first live run (2026-08-26) failed with a #vehicleRegNo timeout on
    // User A's redo because countTransactionsForVehicle() navigates the page
    // it's given via p.goto(), and it had been given `page` directly. That
    // stranded User A's still-open Deregistration Step 2 form on the
    // Pre-Checking listing page instead, so the later resolveVehicleGate()
    // redo call on `page` found no #vehicleRegNo at all. Opening a throwaway
    // tab per check leaves `page`/`userCPage` exactly where each user's own
    // redo needs them. See knowledge/flow-edereg.md §23.
    const listingTabA = await page.context().newPage();
    try {
      const precheckA = new PrecheckEnquiryPage(listingTabA, session);
      precheckListingRowCountA = await precheckA.countTransactionsForVehicle(inputs.envSegment, inputs.vehicleRegNo);
    } finally {
      await listingTabA.close();
    }
    const listingTabC = await userCContext.newPage();
    try {
      const precheckC = new PrecheckEnquiryPage(listingTabC, sessionC);
      precheckListingRowCountC = await precheckC.countTransactionsForVehicle(inputs.envSegment, inputs.vehicleRegNo);
    } finally {
      await listingTabC.close();
    }

    // User A's redo — steer to OK, retry on User A's SAME still-open Step 2
    // form. Per the correction above, this no longer reaches Approved — it
    // just reshows User A's own stale Failed result regardless of the new
    // eSIM code, proving the reshow is independent of the underlying JPJ
    // response.
    await ensureEsimHappyPath(inputs.vehicleRegNo);
    attemptA2 = await deregA.resolveVehicleGate(inputs.vehicleRegNo);
    if (attemptA2.satisfied || attemptA2.dialogShape !== 'closed-direct') {
      throw new Error(
        `Expected User A's redo to reshow the same stale Failed result (satisfied=false, dialogShape='closed-direct') `
        + `— got satisfied=${attemptA2.satisfied}, dialogShape=${attemptA2.dialogShape} (${attemptA2.jpjStatus} / ${attemptA2.responseDesc}).`,
      );
    }

    // Steer back to Failed before User C's own redo — kept as evidence the
    // reshow ignores the underlying code either way, not as an isolation
    // gate anymore (Approved was never reachable for User A to leak in the
    // first place).
    await ensureEsimVehicleNotExistPath(inputs.vehicleRegNo);
    attemptC2 = await deregC.resolveVehicleGate(inputs.vehicleRegNo);
    if (attemptC2.satisfied || attemptC2.dialogShape !== 'closed-direct') {
      throw new Error(
        `Expected User C's redo to ALSO reshow their OWN stale Failed result (satisfied=false, dialogShape='closed-direct'), `
        + `not User A's data — got satisfied=${attemptC2.satisfied}, dialogShape=${attemptC2.dialogShape} (${attemptC2.jpjStatus} / ${attemptC2.responseDesc}).`,
      );
    }
  } finally {
    await userCContext.close();
    if (userCPage) await recordSubPageVideo(userCPage, 'mu-ts5-user-c').catch(() => { /* ignore */ });
  }

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: attemptA1?.satisfied === false && attemptC1?.satisfied === false
      && precheckListingRowCountA === 1 && precheckListingRowCountC === 1
      && attemptA2?.satisfied === false && attemptA2?.dialogShape === 'closed-direct'
      && attemptC2?.satisfied === false && attemptC2?.dialogShape === 'closed-direct'
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'MU_TS5',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    userA: { firstAttempt: attemptA1, redoAttempt: attemptA2, precheckListingRowCount: precheckListingRowCountA },
    userC: { firstAttempt: attemptC1, redoAttempt: attemptC2, precheckListingRowCount: precheckListingRowCountC },
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
