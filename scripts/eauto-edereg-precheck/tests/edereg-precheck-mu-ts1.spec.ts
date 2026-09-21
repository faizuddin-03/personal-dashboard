import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { DeregTransactionListingPage } from '../pages/DeregTransactionListingPage';
import { LoginPage } from '../pages/LoginPage';
import { PrecheckSession } from '../utils/session';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';
import { recordSubPageVideo, videoRunDir } from '../utils/videoManifest';
import { TIMESTAMP_OVERLAY_INIT_SCRIPT } from '../utils/overlay';

// ── MU_TS1: AATF Multiple Users, same company (EAINT-9306) ──
// Pre-requisite (test plan): AATF User A (Main) & User B (Sub) are from the
// SAME company. Test plan steps, as written:
//   1. User A creates a new Deregistration. At Step 2, input vehicle no.
//   2. Continue until Pre-Checking Enquiry = Successful
//   3. Proceed until Trx Status = Approved, Payment = OK, JPJ Pre-Checking = OK
//   4. User B creates a new Deregistration. At Step 2, input the SAME vehicle no.
//   5. Proceed until Trx Status = Approved, Payment = OK, JPJ Pre-Checking = OK
//   6. Ensure eDereg Pre-Checking Transaction Listing Page shows 2 different transactions
//
// TWO corrections to the above, per Faizuddin 2026-08-26 (the written test
// plan is NOT updated for these — noted here and in
// knowledge/flow-edereg.md §19 for future reference):
//
// 1. Steps 2-3's "Trx Status = Approved, Payment = OK, JPJ Pre-Checking = OK"
//    are the INLINE PRE-CHECK's own status fields, not the Deregistration
//    transaction's final status. User A creates the Deregistration only to
//    reach Step 2's compulsory gate, buys the pre-check inline, and STOPS
//    there — same stopping point as CPC_E2E_TS10 Part 1
//    (DeregTransactionPage.resolveVehicleGate()). User A must NEVER reach
//    Step 3+ or complete a real Deregistration — per Faizuddin: "once a
//    vehicle number has proceeded with the deregistration, it cannot do
//    [it] again," a real (irreversible) submission would permanently
//    retire the test vehicle. User B, same company, then reuses User A's
//    just-completed Approved pre-check (gate already green, no popup) and
//    goes all the way through a REAL completed Deregistration — the whole
//    point of this scenario is confirming that reuse works, not
//    re-proving full completion (already covered by CPC_E2E_TS1/TS7).
// 2. Step 6's listing check is the Deregistration Transaction Listing
//    (`/dereg/enquiry/main.do`), NOT the Pre-Checking listing — and
//    expects exactly 1 row, not 2. Per Faizuddin: a Deregistration
//    transaction only shows up in that listing once it reaches Step 3 —
//    User A never gets there, so only User B's transaction appears.
//
// Runs User B in a SEPARATE browser context/login (CONFIG.subUsername/
// subPassword, default faizAATFsub2/password) — sequential with User A,
// never concurrent, since MykadEmulatorClient's multi-session behaviour
// across overlapping connections is unconfirmed (knowledge/
// mykad-emulator.md). User A's own card-read fully completes and closes
// before User B's context even opens.
//
// NEVER RUN LIVE.
test('AATF Multiple Users — MU_TS1, same company', async ({ loggedInPage: page, session, inputs }) => {
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

  // ── User B (Sub) — SEPARATE browser context/login, SAME vehicle no. ──
  const userBContext = await page.context().browser()!.newContext({
    // NOT inherited from playwright.config.ts's `use.video` for a manually
    // created context — has to be passed explicitly, same reasoning as
    // utils/srdChecklist.ts's BO context. Same viewport as the main config
    // so ffmpeg can concatenate without a resolution mismatch.
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  // Piloted 2026-08-27 on this test first — see utils/overlay.ts's own doc
  // comment. A fresh context doesn't inherit the main page's init scripts,
  // so User B's own separately-published video needs this call too.
  await userBContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  let userBPage: Awaited<ReturnType<typeof userBContext.newPage>> | undefined;
  let gateB: Awaited<ReturnType<DeregTransactionPage['fillVehicleDetails']>> | null = null;
  let jpjCheckResultB: Awaited<ReturnType<DeregTransactionPage['jpjCheck']>> | null = null;
  let deregResultB: Awaited<ReturnType<DeregTransactionPage['payAndDeregister']>> | null = null;
  let deregListingRowCount = 0;
  try {
    userBPage = await userBContext.newPage();
    const sessionB = new PrecheckSession(userBContext, userBPage);
    await new LoginPage(userBPage, sessionB).login(inputs, { username: CONFIG.subUsername, password: CONFIG.subPassword });
    sessionB.logUrl('after login (User B)');
    await sessionB.closeBanners();

    // Own identity, NOT the default — User B is a separate NRIC/name from
    // User A's card (CONFIG.mykadNricSub/mykadNameSub, added 2026-08-26).
    const mykadB = new MykadEmulatorClient(userBContext, { nric: CONFIG.mykadNricSub, name: CONFIG.mykadNameSub });
    try {
      const deregB = new DeregTransactionPage(userBPage, sessionB, mykadB);
      await deregB.createFromHome('MYKAD');
      await deregB.authenticateOwner();
      // fillVehicleDetails() resolves the gate itself — expected ALREADY
      // satisfied (User A's pre-check, same company), so this should go
      // straight through to submitVehicleDetails() with no inline popup.
      gateB = await deregB.fillVehicleDetails(inputs, getDeregVehicleInputs());
      await deregB.ownerConsentAndAuth();
      await deregB.aatfConsentAndAuth();
      jpjCheckResultB = await deregB.jpjCheck();
      deregResultB = await deregB.payAndDeregister();
    } finally {
      await mykadB.close();
    }

    // ── Deregistration Transaction Listing, checked from User B's OWN
    // session — CORRECTED 2026-08-27 after a live run showed 0 rows here
    // when checked from User A's session instead, even with the
    // already-fixed reload-race code (see this file's own RESULT log,
    // 2026-08-27) — User A's transaction never reached Step 3 (stopped at
    // the inline pre-check), so User A has nothing of their own to find.
    // Per §21's same finding for the DIFFERENT-company case (MU_TS3), this
    // listing is scoped to the LOGGED-IN ACCOUNT, not the company — so
    // "check the listing from whoever's own transaction it is" applies
    // here too, not just across companies. ──
    const listingB = new DeregTransactionListingPage(userBPage, sessionB);
    deregListingRowCount = await listingB.countTransactionsForVehicle(inputs.envSegment, inputs.vehicleRegNo);
  } finally {
    await userBContext.close();
    if (userBPage) await recordSubPageVideo(userBPage, 'mu-ts1-user-b').catch(() => { /* ignore */ });
  }

  if (gateB?.usedInlinePrecheck) {
    throw new Error(
      "Expected User B's Step 2 gate to be ALREADY satisfied (reusing User A's pre-check, same company) "
      + '— it triggered its OWN inline purchase instead (usedInlinePrecheck: true).',
    );
  }

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: gateA?.satisfied && gateA?.usedInlinePrecheck
      && gateB?.satisfied && !gateB?.usedInlinePrecheck
      && deregResultB?.jpjDeregistrationStatus.startsWith('OK')
      && deregListingRowCount === 1
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'MU_TS1',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    userA: { gate: gateA },
    userB: {
      gate: gateB,
      jpjCheckStatus: jpjCheckResultB?.jpjStatus ?? '',
      jpjCheckResponseCode: jpjCheckResultB?.responseCode ?? '',
      jpjDeregistrationStatus: deregResultB?.jpjDeregistrationStatus ?? '',
      transactionId: deregResultB?.transactionId ?? '',
    },
    deregListingRowCount,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
