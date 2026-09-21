import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';

// ── CJ_TS5, PART 1 of 2 (EAINT-9306) — "Cronjob" block ──
// Test plan (per Faizuddin's Miro paste, 2026-08-27 — see
// knowledge/flow-edereg.md §5.5 for the full CJ_TS1-5 table):
//
//   Starting Trx Status: Pending
//   1. Create new Deregistration until step 2
//   2. Reach the pre-check popup, do NOT pay
//   3. Wait until cronjob runs
//   Expected: Trx Status = Expired (cronjob picks it up), Remarks =
//   "Transaction Expired", rest unchanged
//
// Same "stop at the inline popup, never Next, never Cancel" setup as
// MU_TS7/8/9/11's own User A. No eSIM steering needed — nothing ever
// attempts payment in this scenario.
//
// NEVER RUN LIVE.
test('Deregistration — CJ_TS5 Part 1 (Pending, never paid, then hand off for cronjob expiry)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(9 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  const mykad = new MykadEmulatorClient(page.context());
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();
    await dereg.fillOwnerContactFields(getDeregVehicleInputs());
    const alreadySatisfied = await dereg.fillVehicleRegNoAndCheckGate(inputs.vehicleRegNo);
    if (alreadySatisfied) {
      throw new Error(`CJ_TS5 needs the gate BLOCKED (no valid pre-check) so the inline popup appears — vehicle ${inputs.vehicleRegNo} already has one.`);
    }
  } finally {
    await mykad.close();
  }

  const popupOpened = await page.locator('.ui-dialog:visible').last()
    .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
  if (!popupOpened) throw new Error('Expected the inline #precheck-popup after the gate failed, none appeared.');
  session.progress('cj-ts5-popup-open', 'Inline pre-check popup open, Trx Status Pending — stopping here, not paying');

  const precheck = new PrecheckEnquiryPage(page, session);
  const transactionId = await precheck.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);

  console.log('RESULT:' + JSON.stringify({
    status: popupOpened && transactionId ? 'PART1_DONE' : 'FAIL',
    tsNo: 'CJ_TS5',
    part: 1,
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    transactionId,
    nextAction: 'Ask dev to run the cronjob (or wait for the daily 23:59:59 run) so this Pending pre-check transaction expires, then run CJ_TS5 Part 2 for the SAME vehicle no.',
    continuesAs: 'cj-ts5-part2',
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
