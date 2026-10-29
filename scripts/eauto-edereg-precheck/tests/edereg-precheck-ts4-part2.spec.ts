import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';
import { runPostDeregSrdChecklist } from '../utils/srdChecklist';

// ── CPC_E2E_TS4, PART 2 of 2: [Approved] (EAINT-9306) ──
// Continues Part 1 (edereg-precheck-ts4-part1.spec.ts) for the SAME vehicle
// no., after a dev has patched that vehicle's eDereg Pre-Checking
// transaction to expire (JPJ approval backdated past 6 months). Create
// Deregistration Trx using MyPR -> at Step 2, the now-EXPIRED pre-check does
// NOT satisfy the compulsory gate (same "no qualifying pre-check" shape as
// a vehicle with none at all), so the inline popup runs
// (resolveVehicleGate, inside fillVehicleDetails) -> Approved again
// (GLB000000I, same eSIM steering as Part 1) -> gate satisfied -> continues
// through the rest of Deregistration same as CPC_E2E_TS1/TS7's
// continuation.
//
// PRECONDITION: run CPC_E2E_TS4 Part 1 first, wait for dev to confirm the
// expiry patch, then run this with the SAME vehicleRegNo.
//
// Built entirely from pieces already exercised individually (TS7's
// no-prior-pre-check inline-popup continuation) but an EXPIRED
// (rather than nonexistent) pre-check triggering the same code path has
// never been confirmed live — if the gate behaves differently for an
// expired-vs-absent pre-check, that is new information worth capturing in
// knowledge/flow-edereg.md §5.5/§9.
//
// Added 2026-08-24, per Faizuddin: the SRD's TS1 checklist applies to the
// LAST part of every two-part case — Part 1 doesn't have the details on
// screen to check, this Part 2 does. See utils/srdChecklist.ts's
// runPostDeregSrdChecklist().
test('Deregistration (expired pre-check) — CPC_E2E_TS4 Part 2, Approved', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  await ensureEsimHappyPath(inputs.vehicleRegNo);

  session.logUrl('after login');
  await session.closeBanners();

  const mykad = new MykadEmulatorClient(page.context());
  let gate: Awaited<ReturnType<DeregTransactionPage['fillVehicleDetails']>> | null = null;
  let jpjCheckResult: Awaited<ReturnType<DeregTransactionPage['jpjCheck']>> | null = null;
  let deregResult: Awaited<ReturnType<DeregTransactionPage['payAndDeregister']>> | null = null;
  let srdChecklist: Awaited<ReturnType<typeof runPostDeregSrdChecklist>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYPR');
    await dereg.authenticateOwner();
    gate = await dereg.fillVehicleDetails(inputs, getDeregVehicleInputs());
    await dereg.ownerConsentAndAuth();
    await dereg.aatfConsentAndAuth();
    jpjCheckResult = await dereg.jpjCheck();
    deregResult = await dereg.payAndDeregister();
    srdChecklist = await runPostDeregSrdChecklist({
      page, session, dereg, envSegment: inputs.envSegment, vehicleRegNo: inputs.vehicleRegNo,
      expectedResponseCode: gate.responseDesc?.split(' - ')[0]?.trim() ?? '',
    });
  } finally {
    await mykad.close();
  }

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: gate?.satisfied && gate?.usedInlinePrecheck
      && deregResult?.jpjDeregistrationStatus.startsWith('OK')
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'CPC_E2E_TS4',
    part: 2,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    inlineRetry: gate,
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
