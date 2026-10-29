import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { OtherFunctionsPage } from '../pages/OtherFunctionsPage';
import { BoLoginPage } from '../pages/BoLoginPage';
import { BoPrecheckTransactionListingPage } from '../pages/BoPrecheckTransactionListingPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS } from '../utils/esim';

// ── EC_TS4 — "Extra Coverage" group (EAINT-9306): an EXISTING BO-cancelled precheck
// still BLOCKS a fresh Deregistration ──
//
// Added 2026-08-28, from the dev-authored QA test guide, scenario 3's
// "Cancelled" sub-case. Found NOT covered: MU_TS9/TS10 both produce a
// BO-cancelled record and check what happens to the SAME transaction
// afterward (retry/refresh behaviour) — neither ever starts a genuinely NEW
// Deregistration for the same vehicle+company to confirm the compulsory
// gate still treats a Cancelled record as "no precheck".
//
// Single user (Main), same company throughout — no second AATF account
// needed, unlike MU_TS9/TS10's own multi-user shape.
//
// Reuses two already-confirmed-live mechanisms: BO's `a.to-cancel` link
// (BoPrecheckTransactionListingPage, confirmed live via MU_TS9's first BO
// cancel) and MU_TS7's own finding that an ABANDONED Step-2 popup (never
// past Step 2, no submitVehicleDetails()) does NOT leave a resumable draft
// behind — "User A had no Step-3+ draft (only an abandoned popup), so a
// fresh Owner Authentication screen rendered" — which is exactly the shape
// this test's own first Deregistration attempt leaves behind (a declined
// inline popup, abandoned in place, never continued past Step 2), so
// starting a SECOND fresh Deregistration afterward is expected to render
// normally rather than resuming the first one.
//
// NEVER RUN LIVE.
test('Extra Coverage — EC_TS4 (an existing BO-cancelled precheck still blocks a fresh Deregistration)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(12 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  // ── Produce a real, persisted, cancellable (Pending/Failed) precheck via
  // an inline decline — RHB "IF" decline is confirmed to persist a real
  // record (MU_TS9, §27), abandoned in place afterward (never continued
  // past Step 2). ──
  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS);
  const mykad1 = new MykadEmulatorClient(page.context());
  try {
    const dereg1 = new DeregTransactionPage(page, session, mykad1);
    await dereg1.createFromHome();
    await dereg1.authenticateOwner();
    await dereg1.fillOwnerContactFields(getDeregVehicleInputs());
    const attempt = await dereg1.beginInlinePaymentFlow(inputs.vehicleRegNo);
    if (!attempt.declined) {
      throw new Error(`Expected the first payment attempt (RHB "IF") to be DECLINED — it wasn't (${attempt.jpjStatus} / ${attempt.responseDesc}).`);
    }
  } finally {
    await mykad1.close();
  }
  session.progress('ec-ts4-declined-record', 'Declined precheck record created — abandoning this Deregistration attempt in place, never continuing past Step 2');

  const lookupTab = await page.context().newPage();
  let transactionId = '';
  try {
    const precheckLookup = new PrecheckEnquiryPage(lookupTab, session);
    transactionId = await precheckLookup.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
  } finally {
    await lookupTab.close();
  }

  // ── BackOffice cancels this exact record. ──
  const boContext = await page.context().browser()!.newContext();
  let boCancel: Awaited<ReturnType<BoPrecheckTransactionListingPage['cancelFirstMatchingRow']>> | null = null;
  try {
    const boPage = await boContext.newPage();
    await new BoLoginPage(boPage).login(inputs.envSegment);
    const boListing = new BoPrecheckTransactionListingPage(boPage);
    await boListing.open(inputs.envSegment);
    await boListing.searchByVehicleNo(inputs.vehicleRegNo);
    boCancel = await boListing.cancelFirstMatchingRow();
  } finally {
    await boContext.close();
  }
  if (!boCancel.found) {
    throw new Error(`Expected BackOffice's "Cancel" link to be present for transaction ${transactionId || '(lookup failed)'} — it wasn't found.`);
  }
  session.progress('ec-ts4-bo-cancelled', `BackOffice cancelled transaction ${transactionId || '(lookup failed)'} — dialog: "${boCancel.dialogMessage}"`);

  // Round 1's own declined-payment popup (#precheck-popup's Payment History
  // shape) is STILL OPEN on this page — "abandoning this Deregistration
  // attempt in place" (line above) means literally that, nothing ever
  // clicked its Cancel button. Its modal backdrop (.ui-widget-overlay)
  // blocks EVERY click elsewhere on the page, including round 2's own
  // #home-link — confirmed live 2026-09-01 (createFromHome() timed out
  // there with ".ui-widget-overlay intercepts pointer events"). Close it
  // before starting round 2.
  await session.confirmDialog(15_000, 'Cancel');

  // ── The actual test: a SECOND, fresh Deregistration for the SAME
  // vehicle+company must still be BLOCKED, despite the Cancelled record on
  // file. Cancel this popup too rather than completing it — a gate-check
  // assertion, not a full flow. ──
  const mykad2 = new MykadEmulatorClient(page.context());
  const otherFunctions = new OtherFunctionsPage(page, session);
  let gateBlockedCheck: Awaited<ReturnType<OtherFunctionsPage['cancelPrecheckPopup']>> | null = null;
  try {
    const dereg2 = new DeregTransactionPage(page, session, mykad2);
    await dereg2.createFromHome();
    await dereg2.authenticateOwner();
    await dereg2.fillOwnerContactFields(getDeregVehicleInputs());
    gateBlockedCheck = await otherFunctions.cancelPrecheckPopup(dereg2, inputs.vehicleRegNo);
  } finally {
    await mykad2.close();
  }
  session.progress('ec-ts4-gate-check', `Fresh Deregistration's gate check: ${gateBlockedCheck.isRed ? 'BLOCKED as expected' : 'UNEXPECTEDLY NOT blocked'}`);

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: boCancel.found && gateBlockedCheck.errorVisible && gateBlockedCheck.isRed ? 'SUCCESS' : 'FAIL',
    label: 'EC_TS4 — existing BO-cancelled precheck still blocks a fresh Deregistration',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    cancelledTransactionId: transactionId,
    boCancel,
    gateBlockedCheck,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
