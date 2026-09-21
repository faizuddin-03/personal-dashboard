import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath } from '../utils/esim';
import { runJpjXmlLogChecklist } from '../utils/srdChecklist';

// ── eDereg Pre-Checking Enquiry -> Deregistration — happy path (EAINT-9306) ──
// Login (via fixture) -> AATF home -> eDEREG menu -> eDereg Pre-Checking
// Enquiry -> Vehicle no. + consent -> ENQUIRE NOW -> Payment -> Result
// (expect GLB000000I / Approved) -> Done -> straight into creating a
// Deregistration transaction for the SAME vehicle no. (the "pre-check done
// in enquiry" entry point, knowledge/flow-edereg.md §2), through all 6 of
// its steps (Owner MyKad auth -> Vehicle/gate -> AATF consent + auth ->
// JPJ Check -> Payment -> Deregister).
//
// The MyKad/thumbprint auth points (owner step 1, owner-consent step 3,
// AATF-rep step 3) are bypassed via the local emulator
// (knowledge/mykad-emulator.md) — the pre-checking enquiry itself has no
// MyKad step, so this is the first use of that bypass in this suite.
//
// Added 2026-08-24, per the SRD's own TS1 checklist: verifies the
// Pre-Checking Details page's enquiry + payment details
// (PrecheckEnquiryPage.verifyDetailsPage), the Deregistration Details page's
// "eDereg Pre-Checking: Yes" hyperlink (DeregTransactionPage.
// verifyPrecheckingYesLink), and the JPJ XML Log — searched by BOTH Vehicle
// No. and Transaction Ref. ID, for BOTH the eDereg Pre-Checking log and the
// Deregistration log (JpjXmlLogPage), under a SEPARATE BO/Hub Admin login
// (BoLoginPage, its own browser context) since this suite has otherwise only
// ever logged in as the AATF account. The checklist's "Failed" enquiry/
// payment sub-cases are covered by CPC_E2E_TS2 instead, not duplicated here.
//
// NONE of the JPJ XML Log / BO-login portion has been run live. See
// knowledge/flow-edereg.md's "TS1 SRD checklist" section for the field-decode
// cross-reference and open questions.
test('eDereg Pre-Checking Enquiry -> Deregistration — happy path, complete + valid', async ({ loggedInPage: page, session, inputs }) => {
  // Real bank + JPJ calls, three MyKad auth round trips, and a second JPJ
  // check — budget generously. The run route's own cap is 10 minutes; stay
  // under it to fail here (with a step list and a video) rather than there
  // (with neither).
  test.setTimeout(9 * 60_000);

  // eSIM is shared across every tester — another prefix-mate may have left
  // the Response Code steered to a failure value. Set both codes this flow
  // needs (JPJ result + payment result) before touching the portal, every
  // run, even this happy path. [from Faizuddin, 2026-08-21]
  await ensureEsimHappyPath(inputs.vehicleRegNo);

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
  // SRD checklist for CPC_E2E_TS1 — "Pre-checking details" / "Payment
  // details shown correctly": verify the Details page precheck.done() just
  // landed on. See PrecheckEnquiryPage.verifyDetailsPage's own doc comment.
  const detailsCheck = await precheck.verifyDetailsPage(precheckResult.vehicleRegNo);

  const mykad = new MykadEmulatorClient(page.context());
  let deregResult: Awaited<ReturnType<DeregTransactionPage['payAndDeregister']>> | null = null;
  let jpjCheckResult: Awaited<ReturnType<DeregTransactionPage['jpjCheck']>> | null = null;
  let precheckLinkCheck: Awaited<ReturnType<DeregTransactionPage['verifyPrecheckingYesLink']>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome();
    await dereg.authenticateOwner();
    await dereg.fillVehicleDetails(inputs, getDeregVehicleInputs());
    await dereg.ownerConsentAndAuth();
    await dereg.aatfConsentAndAuth();
    jpjCheckResult = await dereg.jpjCheck();
    deregResult = await dereg.payAndDeregister();
    // SRD checklist for CPC_E2E_TS1 — "Yes hyperlink in details page":
    // verify it on the Deregistration Details page payAndDeregister() just
    // landed on. See DeregTransactionPage.verifyPrecheckingYesLink's own
    // doc comment.
    precheckLinkCheck = await dereg.verifyPrecheckingYesLink(precheckResult.vehicleRegNo);
  } finally {
    await mykad.close();
  }

  // SRD checklist for CPC_E2E_TS1 — "JPJ XML Log": check with Vehicle No.
  // AND with Transaction Ref. ID, for both the eDereg Pre-Checking log and
  // the Deregistration log. Own BO/Hub Admin login, own browser context —
  // this is a Back-Office page, unrelated to the AATF session above. Shared
  // with every other TS via utils/srdChecklist.ts (also gives this BO
  // context its own recorded video + manifest entry — a manually-created
  // context doesn't inherit playwright.config.ts's `video: 'on'` otherwise,
  // confirmed gap 2026-08-24).
  const jpjXmlLogCheck = await runJpjXmlLogChecklist({
    page, envSegment: inputs.envSegment, vehicleRegNo: precheckResult.vehicleRegNo,
    precheckRefNo: detailsCheck.refNo, deregRefNo: precheckLinkCheck?.deregRefNo ?? '',
    expectedResponseCode: precheckResult.responseDesc.split(' - ')[0]?.trim() ?? '',
  });

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: precheckResult.jpjStatusLabel === 'OK' && deregResult?.jpjDeregistrationStatus.startsWith('OK') ? 'SUCCESS' : 'FAIL',
    vehicleRegNo: precheckResult.vehicleRegNo,
    envSegment: inputs.envSegment,
    precheck: {
      jpjStatusLabel: precheckResult.jpjStatusLabel,
      responseDesc: precheckResult.responseDesc,
      transactionId: precheckTransactionId,
    },
    detailsCheck,
    deregistration: {
      jpjCheckStatus: jpjCheckResult?.jpjStatus ?? '',
      jpjCheckResponseCode: jpjCheckResult?.responseCode ?? '',
      jpjDeregistrationStatus: deregResult?.jpjDeregistrationStatus ?? '',
      transactionId: deregResult?.transactionId ?? '',
    },
    precheckLinkCheck,
    jpjXmlLogCheck,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
