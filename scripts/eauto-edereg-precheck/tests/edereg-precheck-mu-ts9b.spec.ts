import * as path from 'node:path';
import { Page, Dialog } from '@playwright/test';
import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { BoLoginPage } from '../pages/BoLoginPage';
import { BoPrecheckTransactionListingPage } from '../pages/BoPrecheckTransactionListingPage';
import { LoginPage } from '../pages/LoginPage';
import { PrecheckSession } from '../utils/session';
import { setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS } from '../utils/esim';
import { recordSubPageVideo, videoRunDir } from '../utils/videoManifest';
import { TIMESTAMP_OVERLAY_INIT_SCRIPT } from '../utils/overlay';

// ── MU_TS9B: same scenario as MU_TS9 (SAME company, BackOffice cancels the
// shared Pre-Checking transaction while both users still have it open), but
// User A creates the transaction via the STANDALONE "eDereg Pre-Checking
// Enquiry" flow instead of the inline popup embedded in Deregistration
// Step 2 — added 2026-08-27, purpose-built for direct comparison, per
// Faizuddin's own request: "add a new automation that will do the same
// thing, but instead of doing the initial precheck in deregistration flow,
// it will use the pre-check flow. i want to compare the behaviour between
// the two." (EAINT-9306)
//
// MU_TS9's own two live-run history is the reason this comparison exists:
// the BO cancel step is now confirmed working (real "Succesfully cancel."
// dialog), but refreshing User A's Deregistration Step 2 afterward showed
// NO dialog and NO visible error at all — just a silently blank, fresh
// "Owner & Vehicle Details" form (knowledge/flow-edereg.md §27's own "why
// the flow isn't complete" note). Whether the STANDALONE flow's own
// Step 2 behaves the SAME way (also silent) or DIFFERENTLY (e.g. an actual
// "Transaction Cancelled" dialog/message) on the identical BO cancel is
// exactly what this build is for — this test does NOT hard-assert on
// either user's refresh dialog text, unlike MU_TS9, since the whole point
// is to OBSERVE and compare, not to re-assert an already-uncertain
// expectation a second time.
//
// User A here NEVER touches Deregistration at all — only the standalone
// Pre-Checking Enquiry flow (`openFromHome`/`fillVehicleAndConsent`/
// `enquireNow`), same as CPC_E2E_TS1/MU_TS7's User B leg for Steps 1-2,
// but using the NEW `attemptStandalonePayment()` (see its own doc comment
// in `PrecheckEnquiryPage.ts`) instead of the happy-path-only `pay()`, since
// this scenario needs a DECLINED (IF) first attempt. That method is itself
// GENUINELY UNCONFIRMED — built from MU_TS4's own finding that the RETRY
// button (reached via listing Resubmit) and this flow's own "NEXT" button
// are the SAME underlying page/template, so a first-attempt decline is
// assumed to look identical to a retry decline. If that assumption is
// wrong, `attemptStandalonePayment()` will simply time out waiting for
// either shape — informative on its own.
//
// User B (same company, Sub) resubmits from the listing exactly like
// MU_TS9's own User B leg (`openViaListingAndResubmit()`) — this part is
// UNCHANGED between the two tests, since MU_TS9's User B already used the
// standalone flow. The only structural difference is User A's own entry
// point into the pre-check.
//
// NEVER RUN LIVE.
//
// **Dialog held open for CONFIG.detailsPauseMs before accepting** —
// confirmed live 2026-08-27 (first run) that the captured message is real
// (a genuine native dialog fired with "Transaction Cancelled" text on both
// users' refresh), but auto-accepting instantly meant it never rendered a
// visible frame — same "let a DISPLAYING screen sit for the recording"
// rule as `pauseForDetails()` (knowledge/flow-edereg.md §12), applied here
// to a native dialog instead of a DOM screen.
async function reloadAndCaptureDialog(target: Page, extraWaitMs = 10_000): Promise<string> {
  let dialogMessage = '';
  const onDialog = (dialog: Dialog) => {
    dialogMessage = dialog.message();
    setTimeout(() => { dialog.accept().catch(() => {}); }, CONFIG.detailsPauseMs);
  };
  target.on('dialog', onDialog);
  try {
    await target.reload();
    await target.waitForTimeout(extraWaitMs);
  } finally {
    target.off('dialog', onDialog);
  }
  return dialogMessage;
}

test('AATF Multiple Users — MU_TS9B, same company, BackOffice cancel via the STANDALONE Pre-Checking flow (comparison build)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(10 * 60_000);

  // IF from the start — User A's own payment attempt is expected to
  // decline, same steering MU_TS9 uses.
  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — STANDALONE Pre-Checking Enquiry flow only, NEVER
  // touches Deregistration. Steps 1->2 only (creates the Pending record),
  // stops before paying so User B can resubmit the SAME record next. ──
  const precheckA = new PrecheckEnquiryPage(page, session);
  await precheckA.openFromHome();
  await precheckA.fillVehicleAndConsent(inputs);
  await precheckA.enquireNow();
  session.progress('mu-ts9b-standalone-pending', 'Standalone Pre-Checking record created (Step 2, Pending) — stopping here, not paying yet');

  // ── User B (same company, Sub) — resubmits the SAME Pre-Checking record
  // from the listing, reaching their OWN tab on the identical standalone
  // Step 2 (Payment) page. Does NOT pay — same as MU_TS9's own User B. ──
  const userBContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  // Applied to every "Multiple Users" case, 2026-08-27 (piloted on MU_TS1
  // first) — see utils/overlay.ts's own doc comment.
  await userBContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  const userBPage = await userBContext.newPage();
  const sessionB = new PrecheckSession(userBContext, userBPage);
  await new LoginPage(userBPage, sessionB).login(inputs, { username: CONFIG.subUsername, password: CONFIG.subPassword });
  sessionB.logUrl('after login (User B)');
  await sessionB.closeBanners();

  const precheckB = new PrecheckEnquiryPage(userBPage, sessionB);
  await precheckB.openViaListingAndResubmit(inputs.envSegment, inputs.vehicleRegNo);

  // ── User A proceeds to pay via the STANDALONE flow's own NEXT button —
  // expects DECLINED (RHB "IF"), via the new (unconfirmed)
  // attemptStandalonePayment(). ──
  const attemptA = await precheckA.attemptStandalonePayment();
  if (!attemptA.declined) {
    throw new Error(`Expected User A's standalone payment attempt (RHB "IF") to be DECLINED — it wasn't (${attemptA.resultResponseDesc}).`);
  }
  session.progress('mu-ts9b-user-a-declined', `User A's standalone payment declined as expected: "${attemptA.dialogMessage}"`);

  // ── BackOffice cancels the shared Pre-Checking transaction — identical
  // to MU_TS9's own (now-confirmed-working) BO step. ──
  const boContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  await boContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  const boPage = await boContext.newPage();
  let boListingRows: Awaited<ReturnType<BoPrecheckTransactionListingPage['searchByVehicleNo']>> = [];
  let boCancelResult: Awaited<ReturnType<BoPrecheckTransactionListingPage['cancelFirstMatchingRow']>> = { found: false, dialogMessage: '' };
  try {
    await new BoLoginPage(boPage).login(inputs.envSegment);
    const boListing = new BoPrecheckTransactionListingPage(boPage);
    await boListing.open(inputs.envSegment);
    boListingRows = await boListing.searchByVehicleNo(inputs.vehicleRegNo);
    if (boListingRows.length === 0) {
      throw new Error(`BO Pre-Checking listing found no row for ${inputs.vehicleRegNo} — expected User A's Failed (IF) record to be there.`);
    }
    boCancelResult = await boListing.cancelFirstMatchingRow();
    if (!boCancelResult.found) {
      throw new Error('Expected a "Cancel" link (a.to-cancel) on the found row, none appeared.');
    }
  } catch (err) {
    await boPage.screenshot({ path: path.join(videoRunDir(), 'mu-ts9b-bo-failure.png'), fullPage: true }).catch(() => { /* ignore */ });
    throw err;
  } finally {
    await boContext.close();
    await recordSubPageVideo(boPage, 'mu-ts9b-bo-cancel').catch(() => { /* ignore */ });
  }
  session.progress('mu-ts9b-bo-cancelled', `BO cancelled the transaction — dialog was: "${boCancelResult.dialogMessage}"`);

  // ── User A refreshes their OWN standalone Step 2 page — OBSERVED ONLY,
  // not hard-asserted. This is the actual comparison point against MU_TS9's
  // own (silent, no dialog) result on the Deregistration-embedded flow. ──
  const reloadDialogA = await reloadAndCaptureDialog(page);
  session.progress('mu-ts9b-user-a-refresh', `User A refreshed the standalone Step 2 — dialog was: "${reloadDialogA}"`);
  const userACancelledConfirmed = /cancel/i.test(reloadDialogA);

  // ── User B refreshes their OWN standalone Step 2 page — also observed
  // only. ──
  let reloadDialogB = '';
  try {
    reloadDialogB = await reloadAndCaptureDialog(userBPage);
  } finally {
    session.progress('mu-ts9b-user-b-refresh', `User B refreshed their own standalone Step 2 — dialog was: "${reloadDialogB}"`);
    await userBContext.close();
    await recordSubPageVideo(userBPage, 'mu-ts9b-user-b').catch(() => { /* ignore */ });
  }
  const userBCancelledConfirmed = /cancel/i.test(reloadDialogB);

  // ── Final Pre-Checking listing check — expect Trx Status = Cancelled,
  // the one thing we already know holds regardless of the refresh
  // behaviour above (confirmed via MU_TS9's own BO step). ──
  const precheckListingStatus = await precheckA.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
  if (precheckListingStatus.trxStatus !== 'Cancelled') {
    throw new Error(`Expected the Pre-Checking listing to show Cancelled after the BO cancel — got "${precheckListingStatus.trxStatus}".`);
  }

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    // Status deliberately does NOT depend on the refresh-dialog outcome —
    // that's the OBSERVATION this build exists to make, not a pass/fail
    // criterion. Only the objective, already-understood parts gate it.
    status: attemptA.declined && boCancelResult.found
      && precheckListingStatus.trxStatus === 'Cancelled'
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'MU_TS9B',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    userAPaymentAttempt: attemptA,
    boListingRows,
    boCancelResult,
    comparisonAgainstMuTs9: {
      note: 'MU_TS9 (Deregistration-embedded inline flow) got an EMPTY dialog on both refreshes, live, 2026-08-27 — compare these against that.',
      userA: { reloadDialog: reloadDialogA, cancelledConfirmed: userACancelledConfirmed },
      userB: { reloadDialog: reloadDialogB, cancelledConfirmed: userBCancelledConfirmed },
    },
    precheckListingStatus,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
