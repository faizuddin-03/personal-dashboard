import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { ensureEsimHappyPath, setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS } from '../utils/esim';
import { runPostDeregSrdChecklist, runJpjXmlLogChecklist } from '../utils/srdChecklist';

// ── EC_TS1 — "Extra Coverage" group (EAINT-9306): a LATER failed precheck does NOT
// undo an EARLIER approved one ──
//
// Added 2026-08-28, from the dev-authored QA test guide
// (_reference/tickets/EAINT-9306/EAINT-9306-artifact-qa-test-guide-from-dev.html),
// scenario 4: "On a vehicle with an approved precheck from (say) 1 January
// and a failed one from 5 January, both within 6 months, the DEREG must
// still be allowed... this confirms the rule looks at ANY qualifying record
// rather than just the latest." Found NOT covered by any existing TS —
// MU_TS6 (§24) tests the OPPOSITE order (Failed-first, then a second user's
// Approved) and never re-checks a fresh Deregistration attempt against a
// vehicle with a mixed Approved+Failed history for the SAME company.
//
// Single user (Main), same company throughout — the guide's own rule
// ("Same vehicle number AND same AATF company") doesn't need a second
// account to test, just two records over time.
//
// GENUINELY UNCONFIRMED, flagged rather than guessed around: whether the
// standalone "eDereg Pre-Checking Enquiry" create flow even lets you
// ENQUIRE NOW again for a vehicle that ALREADY has a valid (Approved,
// within 6 months) precheck on file. Every other standalone-create build in
// this suite (CPC_E2E_TS1, MU_TS1/2/6/7, the dual-create diagnostic) only
// ever creates a FIRST precheck for a vehicle with none — this is the first
// time this suite asks the standalone flow to create a SECOND one on top of
// an already-valid record. If the app instead blocks/redirects at Step 1
// (e.g. straight to a "no action needed" message) rather than opening
// Step 2's payment page, `enquireNow()`'s own dialog-wait will simply not
// find `#enquire-dialog` and throw — informative on its own for what this
// build exists to find out.
//
// NEVER RUN LIVE.
test('Extra Coverage — EC_TS1 (a later failed precheck does not undo an earlier approved one)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(15 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  // ── Record A: standalone create, happy path, Approved. ──
  await ensureEsimHappyPath(inputs.vehicleRegNo);
  const precheck = new PrecheckEnquiryPage(page, session);
  await precheck.openFromHome();
  await session.closeBanners();
  await precheck.fillVehicleAndConsent(inputs);
  await precheck.enquireNow();
  await precheck.pay();
  const resultA = await precheck.readResult();
  const transactionIdA = await precheck.done();
  if (resultA.jpjStatusLabel !== 'OK') {
    throw new Error(`Expected Record A's standalone precheck to come back Approved — got "${resultA.jpjStatusLabel}" / "${resultA.responseDesc}".`);
  }
  session.progress('ec-ts1-record-a', `Record A: Approved precheck created (${transactionIdA})`);

  // done() just navigated to the Details page (view.do?id=...) — NOT the
  // AATF home page `openFromHome()`'s own doc comment assumes ("AATF home
  // -> eDEREG menu -> ..."). Unlike `DeregTransactionPage.createFromHome()`
  // (which clicks #home-link itself before #DEREGISTRATION, so it can be
  // called from anywhere), `openFromHome()` goes straight to #DEREGISTRATION
  // — confirmed live 2026-08-29 that this times out (element not found at
  // all, no dialog interception) when called from the Details page instead
  // of home. Click #home-link first, same mechanism createFromHome() already
  // relies on, then dismiss whatever banner that fresh page load spawns
  // (confirmed live 2026-08-29 too — the FIRST attempt at this fix only
  // added closeBanners() here without the #home-link click, which still
  // failed because #DEREGISTRATION genuinely isn't on the Details page).
  await page.locator('#home-link').click();
  await session.waitForDomReady();
  await session.closeBanners();

  // ── Record B: a SECOND standalone create for the SAME vehicle, steered to
  // decline — see this file's own header note on whether this step is even
  // reachable the way it's written here. ──
  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS);
  await precheck.openFromHome();
  await session.closeBanners();
  await precheck.fillVehicleAndConsent(inputs);
  await precheck.enquireNow();
  const attemptB = await precheck.attemptStandalonePayment();
  if (!attemptB.declined) {
    throw new Error(`Expected Record B's second standalone precheck attempt (RHB "IF") to be DECLINED — it wasn't (dialog: "${attemptB.dialogMessage}").`);
  }
  session.progress('ec-ts1-record-b', `Record B: second precheck attempt DECLINED as expected — dialog: "${attemptB.dialogMessage}"`);

  // Back to happy path for both entities — belt-and-suspenders. The
  // compulsory gate below is expected to never touch payment again at all
  // (Record A should already satisfy it), so this is precautionary, not
  // because a new attempt is anticipated.
  await ensureEsimHappyPath(inputs.vehicleRegNo);

  const rowCountAfterBothRecords = await precheck.countTransactionsForVehicle(inputs.envSegment, inputs.vehicleRegNo);

  // ── The actual test: a FRESH Deregistration for the SAME vehicle+company
  // must be ALLOWED (gate already satisfied), despite Record B's later
  // failure — because Record A still qualifies. ──
  const mykad = new MykadEmulatorClient(page.context());
  let gateSatisfiedOnFreshDereg = false;
  let deregResult: Awaited<ReturnType<DeregTransactionPage['payAndDeregister']>> | null = null;
  let srdChecklist: Awaited<ReturnType<typeof runPostDeregSrdChecklist>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome();
    await dereg.authenticateOwner();
    const vehicle = getDeregVehicleInputs();
    await dereg.fillOwnerContactFields(vehicle);
    gateSatisfiedOnFreshDereg = await dereg.fillVehicleRegNoAndCheckGate(inputs.vehicleRegNo);
    session.progress('ec-ts1-gate-check', `Fresh Deregistration's own gate check: ${gateSatisfiedOnFreshDereg ? 'ALREADY SATISFIED (Record A still qualifies)' : 'BLOCKED — Record A did NOT protect this vehicle from Record B\'s later failure'}`);

    if (gateSatisfiedOnFreshDereg) {
      await dereg.submitVehicleDetails(vehicle);
      // Same defensive dismiss as every other fresh-page-load transition in
      // this file — Step 2 -> Step 3 is a fresh render that can spawn its
      // own #dialog-announcement. `ownerConsentAndAuth()` timed out here
      // live 2026-08-29 waiting for #owner-consent with no element ever
      // resolving; every other test in the suite reaches this same step
      // without it, but none of them do as much prior page navigation in
      // the same session as EC_TS1 does (two standalone creates, listing
      // lookups) before getting here, so the odds of a stray banner landing
      // exactly on this transition are higher for this case specifically.
      await session.closeBanners();
      await dereg.ownerConsentAndAuth();
      await dereg.aatfConsentAndAuth();
      await dereg.jpjCheck();
      deregResult = await dereg.payAndDeregister();

      // NOT runPostDeregSrdChecklist() as-is — its own internal lookup
      // (findTransactionIdByVehicleNo()) grabs the NEWEST pre-check record
      // for the vehicle, which is correct everywhere else in this suite but
      // wrong here: this vehicle now has TWO records, and the newest is
      // Record B (declined, never completed) — its own Details page has no
      // "Enquiry Response" to show, which is exactly what broke live
      // 2026-08-29 ("Enquiry Response:" text empty). The record actually
      // worth checking is Record A (Approved, already known as
      // transactionIdA) — the one that satisfied the gate. Reproduces
      // runPostDeregSrdChecklist()'s own body, just pointed at transactionIdA
      // directly instead of re-deriving it.
      const precheckLinkCheck = await dereg.verifyPrecheckingYesLink(inputs.vehicleRegNo);
      await page.goto(`${CONFIG.baseUrlFor(inputs.envSegment)}/view/aatf/dereg/precheck/enquiry/view.do?id=${transactionIdA}`);
      const detailsCheck = await precheck.verifyDetailsPage(inputs.vehicleRegNo);
      const jpjXmlLogCheck = await runJpjXmlLogChecklist({
        page, envSegment: inputs.envSegment, vehicleRegNo: inputs.vehicleRegNo,
        precheckRefNo: detailsCheck.refNo,
        deregRefNo: precheckLinkCheck.deregRefNo,
        expectedResponseCode: resultA.responseDesc.split(' - ')[0]?.trim() ?? '',
      });
      srdChecklist = { detailsCheck, precheckLinkCheck, jpjXmlLogCheck };
    }
  } finally {
    await mykad.close();
  }

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: gateSatisfiedOnFreshDereg && deregResult?.jpjDeregistrationStatus.startsWith('OK') ? 'SUCCESS' : 'FAIL',
    label: 'EC_TS1 — later failure does not undo earlier approval',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    recordA: { transactionId: transactionIdA, jpjStatusLabel: resultA.jpjStatusLabel, responseDesc: resultA.responseDesc },
    recordB: { declined: attemptB.declined, dialogMessage: attemptB.dialogMessage },
    rowCountAfterBothRecords,
    gateSatisfiedOnFreshDereg,
    deregistration: {
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
