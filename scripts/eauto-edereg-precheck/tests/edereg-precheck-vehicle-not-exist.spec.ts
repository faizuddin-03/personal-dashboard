import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimVehicleNotExistPath, ensureEsimHappyPath } from '../utils/esim';
import { probeRepurchase } from '../utils/repurchaseProbe';
import { runJpjXmlLogChecklist } from '../utils/srdChecklist';

// ── CPC_E2E_TS2: [Failed - Vehicle Not Exist] (EAINT-9306) ──
// Create eDereg Pre-Checking Enquiry with Trx Status = Failed, Enquiry
// Response = VEL000100E -> Create Deregistration Trx using MyPR -> at step 2
// enter the same vehicle no. -> confirm the user can REPURCHASE -> then
// repurchase once more against an Approved code and carry the Deregistration
// through to Done.
//
// Three phases, in order:
//   1. The pre-check fails (VEL000100E), both standalone and on re-entry.
//   2. Repurchase twice, still on VEL000100E: each purchase must be OFFERED
//      and must create its OWN new precheck transaction (+1 listing row).
//   3. Re-steer eSIM to GLB000000I, buy one FINAL pre-check — now Approved —
//      and complete all six Deregistration steps to Done.
//
// Phase 3 exists because phases 1-2 alone can never finish a Deregistration:
// while the code stays VEL000100E every pre-check fails, so the compulsory
// gate never goes green regardless of how many repurchases happen. Re-steering
// is what makes the repurchase right *useful* — the user keeps buying until a
// result they can proceed on. Added 2026-09-04, per Faizuddin.
//
// ── REWRITTEN 2026-09-04 (knowledge/flow-edereg.md §40), per Faizuddin ──
// This test used to assert the opposite. Its previous premise was that a
// vehicle with an existing Failed pre-check only ever gets a RESHOW of that
// stale result (`dialogShape: 'closed-direct'`, no new payment popup), per
// §33's ruling that the reshow is correct app behaviour.
//
// That rule is now known to be PER-CODE, not universal: **VEL000100E
// (VEHICLE RECORD NOT EXIST) is the ONE code that allows a repurchase.** Each
// repurchase creates a BRAND-NEW eDereg Pre-Checking transaction — it does
// not resume or mutate the failed one — and it is repeatable without limit.
// Since TS2 is precisely the VEL000100E scenario, its expectation flips: the
// pass condition is now "a repurchase was offered, and each one created a new
// precheck row". The reshow rule still holds for other failed codes, which is
// what CPC_E2E_TS3 / CPC_E2E_TS11 Part 2 cover on VEL000045E.
//
// ⚠️ There is an UNRESOLVED CONFLICT here that this test exists to settle.
// TS2's own earlier live runs (§33, on HXA122/HXA123/HXA131) DID observe the
// reshow while steered to VEL000100E. The likely explanation is that the app
// shows the stale result first, clears the Vehicle No. field, and only offers
// a fresh purchase on a FURTHER re-entry — and that `resolveVehicleGate()`,
// which returns the moment it sees a Close button, stopped one step short.
// `probeRepurchase()` therefore re-enters the vehicle number over several
// rounds and reports what each round produced rather than assuming a shape,
// so this run distinguishes "reshow first, then purchase" from "purchase
// straight away". Read §40 before changing any of this.
//
// Added 2026-08-24, per Faizuddin: the SRD's TS1 checklist (Pre-Checking
// details/payment) applies here too — the "Failed" half of it, since TS1
// itself only covers the Approved case. This standalone entry point DOES
// persist a real Pre-Checking transaction even on a Failed enquiry (unlike
// the inline "pre-check done in step 2" entry — see
// utils/srdChecklist.ts's own doc comment), so `verifyDetailsPage()` has a
// real page to check.
//
// The JPJ XML Log check was dropped 2026-09-02 (the scenario ended at the
// reshow-only Close back then, nothing ran after it) — RE-ADDED 2026-09-XX
// now that this test's own literal text ("Ensure Step Page, Transaction
// Listing, JPJ XML Log and Details Page showing correctly") was checked
// against the 2026-09-04 repurchase-to-completion rewrite: a real completed
// Deregistration now exists by the end of this run, so the log entry the
// old drop-reason assumed away is reachable again. Uses the FINAL
// (Approved) purchase's response code, not the initial standalone Failed
// one, since that's the transaction the completed Deregistration actually
// carries through — same convention as CPC_E2E_TS5 Part 2's own
// `expectedResponseCode`.
//
// TWO PIECES OF THIS HAVE NEVER BEEN RUN LIVE — expect the first run to need
// debugging, same as every other first-run in this suite:
//   1. MyPR's category (DeregTransactionPage.createFromHome('MYPR')) — its
//      post-confirm owner-auth widget has never been captured. This assumes
//      it's the identical MyKad/thumbprint widget the MyKad category uses
//      (same emulator, same #mykad-control-container shape) — flow-edereg.md
//      §4's "IDENTICAL structure" note was only confirmed for MyKad.
//   2. The inline "buy pre-checking now" popup at step 2
//      (DeregTransactionPage.resolveVehicleGate) — built from the
//      EAINT-9306-dereg-step2-precheck-jpj-failed.html /
//      ...-payment-failed-retry.html captures, never driven end-to-end.
// If the first run fails at either point, check knowledge/flow-edereg.md §4
// and §8 and knowledge/mykad-emulator.md for what's already confirmed vs.
// assumed, then capture whatever new HTML/behaviour turns up per the
// standing rule.
test('eDereg Pre-Checking Enquiry -> Deregistration — CPC_E2E_TS2, Failed (Vehicle Not Exist) then repurchase to completion', async ({ loggedInPage: page, session, inputs }) => {
  // Raised 9 -> 25 min 2026-09-04: this test grew a repurchase loop (two more
  // full payment round trips plus two listing counts) and a complete
  // Deregistration leg (three MyKad auths, a JPJ check, a final payment) on
  // top of the original standalone-enquiry flow, plus FOUR eSIM browser
  // spawns (two codes set twice). Still well inside the run route's own
  // 40-minute cap, so a hang fails here — with a step list and a video —
  // rather than there, with neither.
  test.setTimeout(25 * 60_000);

  // eSIM is shared across every tester — steer BOTH entities explicitly,
  // every run, same reasoning as the happy path (knowledge/esim.md).
  await ensureEsimVehicleNotExistPath(inputs.vehicleRegNo);

  session.logUrl('after login');
  await session.closeBanners();

  const precheck = new PrecheckEnquiryPage(page, session);
  await precheck.openFromHome();
  await session.closeBanners();

  await precheck.fillVehicleAndConsent(inputs);
  await precheck.enquireNow();
  await precheck.pay();

  const precheckResult = await precheck.readResult();
  const precheckTransactionId = await precheck.done();
  const detailsCheck = await precheck.verifyDetailsPage(precheckResult.vehicleRegNo);

  // The emulator and the Deregistration page object now stay alive for the
  // WHOLE test, not just the gate step — the completion leg at the end needs
  // three more MyKad/thumbprint auth round trips (owner consent, AATF rep),
  // so closing the emulator early (as this test used to) would strand them.
  const mykad = new MykadEmulatorClient(page.context());
  let gate: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  let repurchase: Awaited<ReturnType<typeof probeRepurchase>> | null = null;
  let finalGate: Awaited<ReturnType<DeregTransactionPage['fillVehicleDetails']>> | null = null;
  let jpjCheckResult: Awaited<ReturnType<DeregTransactionPage['jpjCheck']>> | null = null;
  let deregResult: Awaited<ReturnType<DeregTransactionPage['payAndDeregister']>> | null = null;
  let precheckLinkCheck: Awaited<ReturnType<DeregTransactionPage['verifyPrecheckingYesLink']>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYPR');
    await dereg.authenticateOwner();
    gate = await dereg.resolveVehicleGate(inputs.vehicleRegNo);

    // ── 1. The repurchase check (§40). `resolveVehicleGate()` above has
    // already consumed the FIRST re-entry — whatever it produced is in
    // `gate` — so these rounds are the second and third entries of the same
    // vehicle number. Two rounds, because "repeatable again and again" needs
    // more than one success to demonstrate. eSIM is still on VEL000100E, so
    // every one of these purchases succeeds at payment and comes back Failed
    // at the JPJ enquiry.
    repurchase = await probeRepurchase(session, inputs.envSegment, inputs.vehicleRegNo, 2);

    // ── 2. Now prove the repurchased pre-check can actually carry a
    // Deregistration through to Done, per Faizuddin 2026-09-04.
    //
    // This needs a code change first: while eSIM stays on VEL000100E every
    // pre-check fails, so the compulsory gate can NEVER go green and the
    // Deregistration is unreachable no matter how many times the user
    // repurchases. Re-steering to GLB000000I makes the NEXT purchase come
    // back Approved — which is the whole point of the repurchase right being
    // there: the user can keep buying until they get a result they can
    // proceed on.
    await ensureEsimHappyPath(inputs.vehicleRegNo);

    // `fillVehicleDetails()` runs `resolveVehicleGate()` itself (that IS the
    // final purchase — fresh popup, pay, Approved, gate turns green), then
    // fills the rest of Step 2 and submits. It throws with a clear message if
    // the gate does not go green, which is the correct failure here.
    finalGate = await dereg.fillVehicleDetails(inputs, getDeregVehicleInputs());
    await dereg.ownerConsentAndAuth();
    await dereg.aatfConsentAndAuth();
    jpjCheckResult = await dereg.jpjCheck();
    deregResult = await dereg.payAndDeregister();
    precheckLinkCheck = await dereg.verifyPrecheckingYesLink(inputs.vehicleRegNo);
  } finally {
    await mykad.close();
  }

  const jpjXmlLogCheck = await runJpjXmlLogChecklist({
    page, envSegment: inputs.envSegment, vehicleRegNo: inputs.vehicleRegNo,
    precheckRefNo: detailsCheck.refNo, deregRefNo: precheckLinkCheck?.deregRefNo ?? '',
    expectedResponseCode: finalGate?.responseDesc?.split(' - ')[0]?.trim() ?? '',
  });

  // Hold 3s so the final state is still visible in the recording.
  await session.active().waitForTimeout(3000);

  const finalPage = session.active();
  // Pass condition, per §40: the standalone pre-check failed as steered, AND
  // the user was then able to repurchase, AND each repurchase created its own
  // new precheck transaction (one extra listing row each).
  //
  // `gate.dialogShape` is NO LONGER a pass condition. It is reported, because
  // which shape the FIRST re-entry produced is exactly the open question §40
  // flags — but whether the app reshows once before offering the purchase is
  // a mechanism detail, not a pass/fail matter. What must hold is that a
  // repurchase is reachable at all and that it creates a new transaction.
  const repurchaseOk = !!repurchase?.repurchaseOffered && !!repurchase?.eachRepurchaseCreatedNewRow;
  const completedOk = finalGate?.satisfied === true
    && !!deregResult?.jpjDeregistrationStatus.startsWith('OK');
  console.log('RESULT:' + JSON.stringify({
    status: precheckResult.jpjStatusLabel === 'Failed' && repurchaseOk && completedOk ? 'SUCCESS' : 'FAIL',
    vehicleRegNo: precheckResult.vehicleRegNo,
    envSegment: inputs.envSegment,
    precheck: {
      jpjStatusLabel: precheckResult.jpjStatusLabel,
      responseDesc: precheckResult.responseDesc,
      transactionId: precheckTransactionId,
    },
    detailsCheck,
    inlineRetry: gate,
    repurchase,
    deregistration: {
      finalGateSatisfied: finalGate?.satisfied ?? false,
      finalPrecheckJpjStatus: finalGate?.jpjStatus ?? '',
      finalPrecheckResponseDesc: finalGate?.responseDesc ?? '',
      jpjCheckStatus: jpjCheckResult?.jpjStatus ?? '',
      jpjCheckResponseCode: jpjCheckResult?.responseCode ?? '',
      jpjDeregistrationStatus: deregResult?.jpjDeregistrationStatus ?? '',
      transactionId: deregResult?.transactionId ?? '',
    },
    precheckLinkCheck,
    jpjXmlLogCheck,
    // Spelled out so a failing run says WHICH part went wrong without
    // anyone having to read the nested objects.
    verdict: {
      precheckFailedAsSteered: precheckResult.jpjStatusLabel === 'Failed',
      repurchaseOffered: !!repurchase?.repurchaseOffered,
      repurchaseCount: repurchase?.repurchaseCount ?? 0,
      eachRepurchaseCreatedNewRow: !!repurchase?.eachRepurchaseCreatedNewRow,
      repeatable: !!repurchase?.repeatable,
      precheckRowsBefore: repurchase?.rowsBefore ?? -1,
      precheckRowsAfter: repurchase?.rowsAfter ?? -1,
      firstReEntryShape: gate?.dialogShape ?? null,
      reshowRounds: repurchase?.reshowCount ?? 0,
      finalPurchaseApproved: finalGate?.satisfied === true,
      deregistrationCompleted: completedOk,
    },
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
