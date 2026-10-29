import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';

// ── CJ_TS4, PART 1 of 2 (EAINT-9306) — "Cronjob" block ──
// Test plan (per Faizuddin's Miro paste, 2026-08-27 — see
// knowledge/flow-edereg.md §5.5 for the full CJ_TS1-5 table):
//
//   Starting Trx Status: Approved
//   1. Create new Deregistration until step 2
//   2. Proceed with purchasing Pre-Check with JPJ Pre-Check Status =
//      Approved
//   3. Wait until cronjob runs
//   Expected: Trx Status stays Approved (cronjob never touches Approved),
//   all details unchanged
//
// Same inline entry point + happy-path steering as CJ_TS3 Part 1 — the
// only difference from CJ_TS3 is that THIS record is left genuinely
// Approved for the hand-off (no DB patch), since this scenario exists to
// confirm the cronjob leaves Approved alone on its own, not via a patched
// Expired row.
//
// NEVER RUN LIVE.
test('Deregistration — CJ_TS4 Part 1 (Approved, then hand off for cronjob no-op check)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  await ensureEsimHappyPath(inputs.vehicleRegNo);

  session.logUrl('after login');
  await session.closeBanners();

  const mykad = new MykadEmulatorClient(page.context());
  let gate: Awaited<ReturnType<DeregTransactionPage['resolveVehicleGate']>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(getDeregVehicleInputs());
    gate = await dereg.resolveVehicleGate(inputs.vehicleRegNo);
  } finally {
    await mykad.close();
  }
  if (!gate?.satisfied || !gate?.usedInlinePrecheck) {
    throw new Error(`Expected the inline pre-check to resolve Approved — got satisfied: ${gate?.satisfied}, usedInlinePrecheck: ${gate?.usedInlinePrecheck} (${gate?.responseDesc}).`);
  }

  const precheck = new PrecheckEnquiryPage(page, session);
  const transactionId = await precheck.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);

  console.log('RESULT:' + JSON.stringify({
    status: gate.satisfied && gate.usedInlinePrecheck && transactionId ? 'PART1_DONE' : 'FAIL',
    tsNo: 'CJ_TS4',
    part: 1,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    transactionId,
    responseDesc: gate.responseDesc ?? '',
    nextAction: 'Ask dev to run the cronjob (or wait for the daily 23:59:59 run) — this Approved pre-check is expected to be LEFT ALONE. Then run CJ_TS4 Part 2 for the SAME vehicle no.',
    continuesAs: 'cj-ts4-part2',
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
