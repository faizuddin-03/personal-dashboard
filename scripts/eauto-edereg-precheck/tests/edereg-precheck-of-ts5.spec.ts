import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';
import { runJpjXmlLogChecklist } from '../utils/srdChecklist';

// ── OF_TS5: JPJ XML Log (EAINT-9306) ──
// Create a Deregistration Trx for a vehicle with NO prior pre-check
// (CPC_E2E_TS7/TS10 Part 1's precondition) -> Step 2's gate triggers the
// inline pre-check -> Approved -> gate turns green -> STOP RIGHT THERE, no
// submit into Step 3+ (same "stop right after the inline purchase" shape
// as CPC_E2E_TS10/11/12 Part 1) -> look up the new Pre-Checking
// transaction's Ref No. via the listing/details page -> log in as BO and
// search the eDereg Pre-Checking JPJ XML Log by both Vehicle No. and
// Transaction Ref No. (utils/srdChecklist.ts's runJpjXmlLogChecklist(),
// the same helper every other TS case already uses for this exact log
// search). Per Faizuddin: "at step 2, just do up until purchase pre-check
// successful, and then proceed with the BO JPJ XML log."
//
// PRECONDITION: vehicleRegNo must have NO prior pre-checking transaction —
// same precondition as CPC_E2E_TS7/TS10 Part 1 (reusing a vehicle that
// already has one shows the green gate immediately with no inline popup,
// the wrong entry point for this case). Only the Pre-Checking log is
// searched — no Deregistration transaction is ever created here, so
// deregRefNo is passed as ''.
//
// NEVER RUN LIVE.
test('Other Functions — OF_TS5, JPJ XML Log', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(6 * 60_000);

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
    throw new Error(
      `OF_TS5 needs the inline pre-check purchase to succeed — gate satisfied=${gate?.satisfied}, `
      + `usedInlinePrecheck=${gate?.usedInlinePrecheck}, JPJ ${gate?.jpjStatus} / ${gate?.responseDesc}.`,
    );
  }

  const precheck = new PrecheckEnquiryPage(page, session);
  const transactionId = await precheck.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
  let refNo = '';
  if (transactionId) {
    await page.goto(`${CONFIG.baseUrlFor(inputs.envSegment)}/view/aatf/dereg/precheck/enquiry/view.do?id=${transactionId}`);
    const detailsCheck = await precheck.verifyDetailsPage(inputs.vehicleRegNo);
    refNo = detailsCheck.refNo;
  }

  const jpjXmlLogCheck = await runJpjXmlLogChecklist({
    page, envSegment: inputs.envSegment, vehicleRegNo: inputs.vehicleRegNo,
    precheckRefNo: refNo, deregRefNo: '',
    expectedResponseCode: gate.responseDesc?.split(' - ')[0]?.trim() ?? '',
  });

  console.log('RESULT:' + JSON.stringify({
    status: jpjXmlLogCheck.precheckLog.foundByVehicleNo > 0
      && (!refNo || jpjXmlLogCheck.precheckLog.foundByRefNo > 0)
      && jpjXmlLogCheck.precheckLog.responseCodeMatches
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'OF_TS5',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    inlinePrecheck: gate,
    transactionId,
    refNo,
    jpjXmlLogCheck,
    finalUrl: session.active().url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
