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

// ── MU_TS6: AATF Multiple Users, SAME company — a Failed pre-check is
// COMPANY-SCOPED, not draft-scoped: User B's own fresh Deregistration ALSO
// just reshows it (EAINT-9306) ──
//
// CORRECTED 2026-09-02, per Faizuddin — REWRITTEN a second time. The
// premise built 2026-08-26 ("User B's own new Deregistration triggers its
// OWN inline pre-check purchase, steered to Approved, superseding User A's
// Failed record") is now known to be unreachable. Confirmed live: the
// reshow-only behavior already established for CPC_E2E_TS9 and MU_TS5
// (knowledge/flow-edereg.md §33/§34/§35) is COMPANY-scoped, not
// session/draft-scoped — User B's own brand-new Deregistration, on a
// completely separate login and browser context, STILL just reshows User
// A's stale Failed result instead of being offered a fresh purchase. So
// User B can never reach Step 3+ here, and the test's own premise
// ("superseded by a completed one") is no longer achievable through this
// flow at all.
//
// Redefined what this test proves: that the Failed pre-check reshow
// applies across DIFFERENT users/sessions under the same company, not just
// within one still-open form (which TS9/MU_TS5 already covered). User A
// creates the Failed record (first-ever check for this vehicle, so gets
// the full payment popup — `dialogShape: 'paid'`); User B's own separate
// session, entering the SAME vehicle no. for the first time on THEIR OWN
// form, gets the reshow (`dialogShape: 'closed-direct'`) — proving the
// existing record is visible/blocking company-wide, immediately, with no
// prior visit to that specific form. eSIM re-steer to Approved kept before
// User B's attempt, same reasoning as TS9/MU_TS5's rebuilds — proves the
// reshow ignores the underlying code. The Pre-Checking listing is checked
// afterward and is now expected to STILL show exactly 1 row, still Failed
// — nothing superseded it, since User B's own attempt never reached a real
// payment.
//
// Older history, kept for context: this scenario was originally written as
// "User B searches and resubmits the transaction in Transaction Listing
// page," blocked by real app behaviour (same-company navigation redirects
// to an in-progress draft) — see knowledge/flow-edereg.md §24. Faizuddin's
// own replacement (own new Deregistration instead of Resubmit) is what's
// built here, just with the corrected expected outcome now.
//
// User B is the SAME-company sub-account (CONFIG.subUsername/subPassword,
// mykadNricSub/mykadNameSub) — same identity MU_TS1/TS4 use.
//
// NEVER RUN LIVE in this corrected form.
test('AATF Multiple Users — MU_TS6, same company, Failed pre-check reshows across sessions', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(10 * 60_000);

  await ensureEsimVehicleNotExistPath(inputs.vehicleRegNo);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — creates the transaction, gets Failed (VEL000100E).
  // First-ever check for this vehicle, so the full payment popup fires. ──
  const mykadA = new MykadEmulatorClient(page.context());
  let attemptA: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  try {
    const deregA = new DeregTransactionPage(page, session, mykadA);
    await deregA.createFromHome('MYKAD');
    await deregA.authenticateOwner();
    await deregA.fillOwnerContactFields(getDeregVehicleInputs());
    attemptA = await deregA.resolveVehicleGate(inputs.vehicleRegNo);
  } finally {
    await mykadA.close();
  }
  if (attemptA?.satisfied || attemptA?.dialogShape !== 'paid') {
    throw new Error(
      `Expected User A's first-ever attempt to come back Failed via the full payment popup (satisfied=false, dialogShape='paid') `
      + `— got satisfied=${attemptA?.satisfied}, dialogShape=${attemptA?.dialogShape} (${attemptA?.jpjStatus} / ${attemptA?.responseDesc}).`,
    );
  }

  // Re-steer to Approved before User B's own attempt — kept as evidence the
  // reshow ignores the underlying code, same reasoning as TS9/MU_TS5.
  await ensureEsimHappyPath(inputs.vehicleRegNo);

  // ── User B (same company) — OWN new Deregistration, same vehicle no.,
  // FIRST time on their own form. Expected to ALSO just reshow User A's
  // stale Failed record, not get offered a fresh purchase. Uses
  // resolveVehicleGate() directly (not fillVehicleDetails(), which throws
  // on a not-satisfied gate) since this scenario expects exactly that
  // outcome. ──
  const userBContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  await userBContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  let userBPage: Awaited<ReturnType<typeof userBContext.newPage>> | undefined;
  let attemptB: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  try {
    userBPage = await userBContext.newPage();
    const sessionB = new PrecheckSession(userBContext, userBPage);
    await new LoginPage(userBPage, sessionB).login(inputs, { username: CONFIG.subUsername, password: CONFIG.subPassword });
    sessionB.logUrl('after login (User B)');
    await sessionB.closeBanners();

    const mykadB = new MykadEmulatorClient(userBContext, { nric: CONFIG.mykadNricSub, name: CONFIG.mykadNameSub });
    try {
      const deregB = new DeregTransactionPage(userBPage, sessionB, mykadB);
      await deregB.createFromHome('MYKAD');
      await deregB.authenticateOwner();
      attemptB = await deregB.resolveVehicleGate(inputs.vehicleRegNo);
    } finally {
      await mykadB.close();
    }

    if (attemptB.satisfied || attemptB.dialogShape !== 'closed-direct') {
      throw new Error(
        `Expected User B's own first entry to ALSO reshow User A's stale Failed result (satisfied=false, dialogShape='closed-direct'), `
        + `not get a fresh purchase — got satisfied=${attemptB.satisfied}, dialogShape=${attemptB.dialogShape} (${attemptB.jpjStatus} / ${attemptB.responseDesc}).`,
      );
    }
  } finally {
    await userBContext.close();
    if (userBPage) await recordSubPageVideo(userBPage, 'mu-ts6-user-b').catch(() => { /* ignore */ });
  }

  // ── Pre-Checking listing, from User A's own (still open) session —
  // expected to STILL show exactly 1 row, still Failed, since neither
  // user's attempt ever reached a real payment. ──
  const precheckA = new PrecheckEnquiryPage(page, session);
  const listingStatus = await precheckA.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: attemptA?.satisfied === false && attemptA?.dialogShape === 'paid'
      && attemptB?.satisfied === false && attemptB?.dialogShape === 'closed-direct'
      && listingStatus.rowCount === 1
      && listingStatus.trxStatus === 'Failed'
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'MU_TS6',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    userA: { firstAttempt: attemptA },
    userB: { attempt: attemptB },
    listingStatus,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
