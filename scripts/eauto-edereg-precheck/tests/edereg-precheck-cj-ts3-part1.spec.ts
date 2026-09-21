import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';

// ── CJ_TS3, PART 1 of 2 (EAINT-9306) — "Cronjob" block ──
// Test plan (per Faizuddin's Miro paste, 2026-08-27 — see
// knowledge/flow-edereg.md §5.5 for the full CJ_TS1-5 table):
//
//   Starting Trx Status: Expired
//   1. Create new Deregistration until step 2
//   2. Proceed with purchasing Pre-Check with JPJ Pre-Check Status = Passed
//   3. Ask dev to run cronjob. Make sure the status is changed to EXPIRED
//   4. Wait until next cronjob runs
//   Expected: Trx Status stays Expired (cronjob does NOT re-pick-up an
//   already-Expired row), all details unchanged
//
// **TWO dev hand-offs needed, not one** — this row's OWN precondition is
// already "Expired," which the cronjob itself can never produce from an
// Approved record (§5.5: "the cronjob explicitly does NOT touch
// Approved"). Step 3's "ask dev to run cronjob... make sure status is
// EXPIRED" is read as a direct DB patch forcing the status (the SAME kind
// of one-off dev intervention the 6-month SRD expiry patch already uses
// elsewhere in this suite, e.g. CPC_E2E_TS4/TS5/TS10 Part 1), not a
// literal cronjob run — mislabelled in the plan the same way "refresh
// Step 2" turned out to mean something other than a literal browser
// reload in MU_TS9/TS11. Part 1 here only produces the Approved record;
// BOTH the DB patch AND the wait for the next real cronjob run happen
// during the hand-off, before Part 2.
//
// Uses the Deregistration-embedded inline entry point (matches the plan's
// own "Create new Deregistration until step 2" wording) — an Approved
// inline outcome DOES persist a real record, already confirmed by
// CPC_E2E_TS10/TS11/TS12 Part 1 (same `resolveVehicleGate()` call).
//
// NEVER RUN LIVE.
test('Deregistration — CJ_TS3 Part 1 (Approved, then hand off for a DB-patched Expired status + cronjob no-op check)', async ({ loggedInPage: page, session, inputs }) => {
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
    tsNo: 'CJ_TS3',
    part: 1,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    transactionId,
    responseDesc: gate.responseDesc ?? '',
    nextAction: 'Ask dev to (1) DB-patch this Approved pre-check\'s status directly to Expired (the daily cronjob will not do this itself), then (2) wait for the NEXT daily 23:59:59 cronjob run to confirm it leaves an already-Expired row alone. Then run CJ_TS3 Part 2 for the SAME vehicle no.',
    continuesAs: 'cj-ts3-part2',
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
