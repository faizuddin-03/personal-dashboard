import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';

// ── CPC_E2E_TS10, PART 1 of 2 (EAINT-9306) ──
// "6-month SRD expiry" block, "pre-check done in step 2" entry point — the
// step2-first counterpart of CPC_E2E_TS4. Create a Deregistration Trx for a
// vehicle with NO prior pre-check (CPC_E2E_TS7's precondition) -> Step 2's
// gate triggers the inline pre-check -> Approved -> gate turns green -> STOP
// RIGHT THERE (do not submit the rest of Step 2 or continue into Step 3+ —
// same "produce one precheck, then hand off" shape as CPC_E2E_TS4 Part 1,
// just entered inline instead of via the standalone Enquiry menu). Part 2
// (edereg-precheck-ts10-part2.spec.ts) picks up once a dev has expired that
// pre-check, using the SAME vehicle no.
//
// UNLIKE CPC_E2E_TS5/TS6 Part 1 (standalone Enquiry, which persists a
// transaction regardless of Approved/Failed), this inline entry point does
// NOT persist anything when the outcome is Failed — a Failed inline
// pre-check resets #vehicleRegNo to blank instead (DeregTransactionPage.
// resolveVehicleGate's own doc comment, confirmed live via CPC_E2E_TS2/TS8's
// dead-end shape). So CPC_E2E_TS10/TS11/TS12's Part 1 all use the SAME
// Approved inline outcome here, regardless of which payment-decline code
// each one exercises in Part 2 — Part 1's only job is to produce ONE real,
// persisted pre-check transaction to later expire; the actual TS10 vs
// TS11 vs TS12 distinction (Approved / RE reset-timer / ER RHB-API-Down
// retry — TS12 corrected 2026-08-27 from an earlier IF assumption, see
// edereg-precheck-ts12-part2.spec.ts's own doc comment) plays out entirely
// in Part 2, exactly as it already does for
// CPC_E2E_TS4/TS5/TS6.
//
// Per Faizuddin, 2026-08-24: the transaction ID for THIS entry point is
// obtained via "eDereg Pre-Checking Transaction Listing" > View on the
// matching row (`PrecheckEnquiryPage.findTransactionIdByVehicleNo()`) —
// confirmed URL + listing shape from
// `_reference/codebases/AATF/EAINT-9306-precheck-details-and-listing.html`.
//
// NEVER RUN LIVE. Also unconfirmed: whether an inline-Approved pre-check
// even IS the same "6-month-expiry-eligible" record a dev can patch the same
// way as a standalone-Enquiry one — assumed yes (same underlying JPJ
// approval timestamp), but worth a first-run sanity check.
test('Deregistration (pre-check done in step 2) — CPC_E2E_TS10 Part 1 (Approved, then hand off for expiry patch)', async ({ loggedInPage: page, session, inputs }) => {
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

  let transactionId = '';
  if (gate?.satisfied && gate?.usedInlinePrecheck) {
    const precheck = new PrecheckEnquiryPage(page, session);
    transactionId = await precheck.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
  }

  console.log('RESULT:' + JSON.stringify({
    status: gate?.satisfied && gate?.usedInlinePrecheck ? 'PART1_DONE' : 'FAIL',
    tsNo: 'CPC_E2E_TS10',
    part: 1,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    transactionId,
    responseDesc: gate?.responseDesc ?? '',
    nextAction: 'Ask dev to patch this eDereg Pre-Checking transaction to expire (backdate JPJ approval past 6 months), then run CPC_E2E_TS10 Part 2 for the SAME vehicle no.',
    continuesAs: 'ts10-part2',
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
