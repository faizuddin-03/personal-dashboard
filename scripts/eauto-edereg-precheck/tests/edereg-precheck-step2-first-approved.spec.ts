import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';
import { runPostDeregSrdChecklist } from '../utils/srdChecklist';

// ── CPC_E2E_TS7: [Approved] (EAINT-9306) ──
// "Pre-check done in step 2" entry point (flow-edereg.md §2) — the OTHER
// half of this ticket's two entry points, opposite of CPC_E2E_TS1's
// "pre-check done in enquiry" flow. No standalone Pre-Checking Enquiry
// beforehand: create a Deregistration transaction directly for a vehicle
// with NO prior pre-check, and the system triggers the pre-checking enquiry
// INLINE at Step 2 (DeregTransactionPage.resolveVehicleGate, called from
// inside fillVehicleDetails) — fee popup -> pay -> result. This scenario's
// response code (GLB000000I / Approved) means the gate turns green right
// after the inline payment closes, and the flow continues through the rest
// of Deregistration exactly like CPC_E2E_TS1's continuation.
//
// IMPORTANT PRECONDITION: vehicleRegNo must have NO prior pre-checking
// transaction — reusing a vehicle that already has one (e.g. one left over
// from a CPC_E2E_TS1 run) means Step 2 shows the green gate immediately with
// no inline popup at all, which is the WRONG entry point for this test case
// and will make resolveVehicleGate() report usedInlinePrecheck: false.
//
// NEVER RUN LIVE — built from the same captures as CPC_E2E_TS2's inline
// popup path (EAINT-9306-dereg-step2-precheck-jpj-failed.html /
// ...-payment-failed-retry.html), which only demonstrated the Failed
// outcome. This is the first live exercise of the Approved outcome through
// that same popup — check knowledge/flow-edereg.md §4/§8/§9 first if the
// gate does not turn green after Close.
//
// Added 2026-08-24, per Faizuddin: the SRD's TS1 checklist applies here too
// (this scenario completes a full Deregistration, so all 4 items apply) —
// see utils/srdChecklist.ts's runPostDeregSrdChecklist() for how the
// Pre-Checking transaction (never reached via its own `done()` at this
// entry point) gets looked up instead.
test('Deregistration (pre-check done in step 2) — CPC_E2E_TS7, Approved', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  // eSIM is shared across every tester — steer both entities explicitly,
  // every run, same reasoning as CPC_E2E_TS1 (knowledge/esim.md).
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
    await dereg.createFromHome('MYKAD');
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
