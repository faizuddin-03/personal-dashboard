import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { setEsimResponseCode, vehiclePrefix } from '../utils/esim';
import { runPostDeregSrdChecklist } from '../utils/srdChecklist';

// ── Custom Run — EAINT-9306 ──────────────────────────────────────────
// Added 2026-08-28, per Faizuddin, modelled on Secarang's own "Regression"
// tab (scripts/secarang-insurance/tests/secarang-regression.spec.ts): ONE
// generic script driven entirely by env vars a tester picks on the
// dashboard's new "Custom Run" tab (app/eauto/edereg-precheck/
// CustomRunTab.tsx), instead of a fixed, named test-plan case. Lets a
// tester build an ad hoc E2E combination (entry point + JPJ Pre-Check
// response code + RHB payment response code + whether to continue into a
// full Deregistration + whether to run the SRD checklist) without needing
// a new TS number or a new spec file for every combination.
//
// No fixed pass/fail expectation, deliberately — unlike every numbered TS
// in this suite, there's no test-plan row to check against here. `status`
// in the RESULT is purely "did the script itself run to completion without
// throwing", not "did the app behave as some specific plan expects."
//
// Env vars (all optional except the two already required by every other
// test — DPC_VEHICLE_REG_NO / DPC_JPJ_RECEIPT_EMAIL):
//   DPC_CUSTOM_ENTRY        'inline' (default) | 'standalone'
//   DPC_CUSTOM_JPJ_CODE     dereg-precheck-enquiry response code, default GLB000000I
//   DPC_CUSTOM_RHB_CODE     rhb-transfer response code, default OK
//   DPC_CUSTOM_CONTINUE_FULL '1' to drive the rest of Deregistration if the
//                             gate/precheck ends up satisfied, '' to stop there
//   DPC_CUSTOM_RUN_SRD      '1' to run the SRD checklist if a Deregistration
//                             actually completes, '' to skip it
//
// Single-user only, v1 — every Multiple-Users/two-part/cronjob shape stays
// on the "9306 TS" tab; this is for single-user combinations that don't
// already have a named TS.
//
// Composes ONLY already-confirmed page-object methods, generically handling
// all three outcome shapes a gate/payment check can land on (already-
// satisfied, declined, terminal Approved-or-JPJ-Failed) — same pattern
// CJ_TS1/MU_TS8/MU_TS9 already use for the inline entry, and EC_TS1/EC_TS5
// already use for the standalone entry. Does NOT use
// `DeregTransactionPage.resolveVehicleGate()` for the inline path — that
// method only ever handles the Approved/JPJ-Failed shape (a single Close
// button), never the DECLINED-payment shape (`#payment-history-portion`,
// no Close) that a custom RHB decline code needs.
//
// NEVER RUN LIVE.
test('Custom Run — user-configured eDereg Pre-Checking scenario', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(15 * 60_000);

  const entry = (process.env.DPC_CUSTOM_ENTRY?.trim() || 'inline') as 'inline' | 'standalone';
  const jpjCode = process.env.DPC_CUSTOM_JPJ_CODE?.trim() || 'GLB000000I';
  const rhbCode = process.env.DPC_CUSTOM_RHB_CODE?.trim() || 'OK';
  const continueFull = process.env.DPC_CUSTOM_CONTINUE_FULL === '1';
  const runSrd = process.env.DPC_CUSTOM_RUN_SRD === '1';

  const prefix = vehiclePrefix(inputs.vehicleRegNo);
  const jpjSet = await setEsimResponseCode('dereg-precheck-enquiry', prefix, jpjCode);
  if (!jpjSet.ok) throw new Error(`[esim] Could not set JPJ Pre-Check Response Code: ${jpjSet.reason}`);
  const rhbSet = await setEsimResponseCode('rhb-transfer', prefix, rhbCode);
  if (!rhbSet.ok) throw new Error(`[esim] Could not set RHB Transfer Response Code: ${rhbSet.reason}`);
  session.progress('custom-esim-steered', `entry=${entry}, JPJ code=${jpjCode}, RHB code=${rhbCode}`);

  session.logUrl('after login');
  await session.closeBanners();

  const vehicle = getDeregVehicleInputs();
  let precheckOutcome: Record<string, unknown> = {};
  let gateSatisfied = false;
  let deregResult: Awaited<ReturnType<DeregTransactionPage['payAndDeregister']>> | null = null;
  let jpjCheckResult: Awaited<ReturnType<DeregTransactionPage['jpjCheck']>> | null = null;
  let srdChecklist: Awaited<ReturnType<typeof runPostDeregSrdChecklist>> | null = null;

  if (entry === 'standalone') {
    // ── Standalone eDereg Pre-Checking Enquiry first. ──
    const precheck = new PrecheckEnquiryPage(page, session);
    await precheck.openFromHome();
    await session.closeBanners();
    await precheck.fillVehicleAndConsent(inputs);
    await precheck.enquireNow();
    const attempt = await precheck.attemptStandalonePayment();
    precheckOutcome = { ...attempt };
    if (attempt.declined) {
      session.progress('custom-standalone-declined', `Standalone payment declined: "${attempt.dialogMessage}"`);
    } else {
      const transactionId = await precheck.done();
      precheckOutcome = { ...precheckOutcome, transactionId };
      session.progress('custom-standalone-result', `Standalone precheck result: ${attempt.resultResponseDesc} (${transactionId})`);
    }

    if (continueFull) {
      // A completed precheck (declined or not) still needs a real
      // Deregistration transaction to "continue full" into — create one
      // for the SAME vehicle no. and resolve whatever gate state it lands
      // on, generically (may already be satisfied if the precheck
      // qualified, or may need its own inline attempt if it didn't).
      const mykad = new MykadEmulatorClient(page.context());
      try {
        const dereg = new DeregTransactionPage(page, session, mykad);
        await dereg.createFromHome('MYKAD');
        await dereg.authenticateOwner();
        await dereg.fillOwnerContactFields(vehicle);
        gateSatisfied = await resolveGateGenerically(dereg, inputs.vehicleRegNo, session);
        if (gateSatisfied) {
          await dereg.submitVehicleDetails(vehicle);
          await dereg.ownerConsentAndAuth();
          await dereg.aatfConsentAndAuth();
          jpjCheckResult = await dereg.jpjCheck();
          deregResult = await dereg.payAndDeregister();
          if (runSrd) {
            srdChecklist = await runPostDeregSrdChecklist({
              page, session, dereg, envSegment: inputs.envSegment, vehicleRegNo: inputs.vehicleRegNo,
              expectedResponseCode: jpjCode,
            });
          }
        }
      } finally {
        await mykad.close();
      }
    }
  } else {
    // ── Inline at Deregistration Step 2. ──
    const mykad = new MykadEmulatorClient(page.context());
    try {
      const dereg = new DeregTransactionPage(page, session, mykad);
      await dereg.createFromHome('MYKAD');
      await dereg.authenticateOwner();
      await dereg.fillOwnerContactFields(vehicle);
      gateSatisfied = await resolveGateGenerically(dereg, inputs.vehicleRegNo, session, (o) => { precheckOutcome = o; });

      if (gateSatisfied && continueFull) {
        await dereg.submitVehicleDetails(vehicle);
        await dereg.ownerConsentAndAuth();
        await dereg.aatfConsentAndAuth();
        jpjCheckResult = await dereg.jpjCheck();
        deregResult = await dereg.payAndDeregister();
        if (runSrd) {
          srdChecklist = await runPostDeregSrdChecklist({
            page, session, dereg, envSegment: inputs.envSegment, vehicleRegNo: inputs.vehicleRegNo,
            expectedResponseCode: jpjCode,
          });
        }
      }
    } finally {
      await mykad.close();
    }
  }

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: 'SUCCESS', // observational only — see this file's own header note
    tsNo: 'CUSTOM',
    entry, jpjCode, rhbCode, continueFull, runSrd,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    precheck: precheckOutcome,
    gateSatisfied,
    deregistration: deregResult ? {
      jpjCheckStatus: jpjCheckResult?.jpjStatus ?? '',
      jpjCheckResponseCode: jpjCheckResult?.responseCode ?? '',
      jpjDeregistrationStatus: deregResult.jpjDeregistrationStatus,
      transactionId: deregResult.transactionId,
    } : null,
    srdChecklist,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});

/** Resolves `#vehicleRegNo`'s compulsory gate GENERICALLY — handles all
 *  three shapes a gate check can land on (already-satisfied, DECLINED
 *  payment, or a terminal Approved/JPJ-Failed result), unlike
 *  `DeregTransactionPage.resolveVehicleGate()` which only ever handles the
 *  last of those. Needed here because a custom RHB code may legitimately
 *  decline. Returns whether the gate ended up satisfied; optionally reports
 *  the raw outcome via `onOutcome` for the caller's own RESULT log. */
async function resolveGateGenerically(
  dereg: DeregTransactionPage,
  vehicleRegNo: string,
  session: { progress: (step: string, label: string) => void },
  onOutcome?: (o: Record<string, unknown>) => void,
): Promise<boolean> {
  const alreadySatisfied = await dereg.fillVehicleRegNoAndCheckGate(vehicleRegNo);
  if (alreadySatisfied) {
    session.progress('custom-gate', 'Gate already satisfied — vehicle already has a qualifying pre-check');
    onOutcome?.({ alreadySatisfied: true });
    return true;
  }
  const attempt = await dereg.attemptInlinePayment();
  onOutcome?.({ alreadySatisfied: false, ...attempt });
  if (attempt.declined) {
    session.progress('custom-gate-declined', `Inline payment declined: "${attempt.dialogMessage}"`);
    return false;
  }
  const satisfiedNow = await dereg.isVehicleGateSatisfiedNow();
  session.progress('custom-gate-result', `Inline result: ${attempt.jpjStatus} / ${attempt.responseDesc} — gate satisfied: ${satisfiedNow}`);
  return satisfiedNow;
}
