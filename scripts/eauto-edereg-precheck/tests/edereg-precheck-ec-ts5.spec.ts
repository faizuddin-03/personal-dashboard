import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { ensureEsimHappyPath, setRhbTransferCode, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS } from '../utils/esim';

// ── EC_TS5 — "Extra Coverage" group (EAINT-9306): a failed-payment precheck resumes
// in RETRY MODE, with its Payment History, on a genuine cancel-and-return ──
//
// Added 2026-08-28, from the dev-authored QA test guide, scenario 6: "Fail
// a payment, cancel out, then leave the vehicle field again (or reload and
// redo it). The dialog must reopen on the SAME precheck in retry mode and
// show the earlier failed attempts under Payment History... it is the
// highest-value retest" (the guide calls out that this used to create a
// fresh row and lose the history entirely).
//
// Found PARTIALLY covered: OF_TS4 declines/retries/succeeds on this exact
// shape, but keeps ONE popup open continuously via a dashboard pause/
// continue — never a genuine "cancel out, come back later" round trip. This
// build uses the STANDALONE flow's own "come back later" mechanism instead
// — the Pre-Checking listing's "Resubmit" link — which MU_TS4 already
// confirmed live lands on the SAME record's Step 2 page, in retry mode
// (`#to-retry-rhb`), with its Payment History intact. That confirmed
// mechanism is reused here as the "leave the vehicle field again (or
// reload and redo it)" step, rather than inventing a new one.
//
// Single user (Main), standalone flow throughout — no Deregistration/MyKad
// involved, keeping this a direct test of the precheck resume behaviour
// itself, same scope convention as OF_TS1-3/OF_TS5.
//
// NEVER RUN LIVE.
test('Extra Coverage — EC_TS5 (failed-payment precheck resumes in retry mode with its Payment History)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(10 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  // ── Create + decline the FIRST payment attempt via the standalone flow. ──
  await setRhbTransferCode(inputs.vehicleRegNo, RHB_TRANSFER_RESPONSE_CODE_INSUFFICIENT_FUNDS);
  const precheck = new PrecheckEnquiryPage(page, session);
  await precheck.openFromHome();
  await session.closeBanners();
  await precheck.fillVehicleAndConsent(inputs);
  await precheck.enquireNow();
  const firstAttempt = await precheck.attemptStandalonePayment();
  if (!firstAttempt.declined) {
    throw new Error(`Expected the first standalone payment attempt (RHB "IF") to be DECLINED — it wasn't (dialog: "${firstAttempt.dialogMessage}").`);
  }
  session.progress('ec-ts5-first-decline', `First attempt declined: "${firstAttempt.dialogMessage}"`);

  const rowCountAfterDecline = await precheck.countTransactionsForVehicle(inputs.envSegment, inputs.vehicleRegNo);
  const transactionIdAfterDecline = await precheck.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);

  // ── "Cancel out, then leave the vehicle field again" — reopen the SAME
  // record via the listing's Resubmit link (confirmed live, MU_TS4). ──
  await precheck.openViaListingAndResubmit(inputs.envSegment, inputs.vehicleRegNo);

  const activePage = session.active();
  const retryButtonVisible = await activePage.locator('#to-retry-rhb').isVisible().catch(() => false);
  const historyVisible = await activePage.locator('#payment-history-portion').isVisible().catch(() => false);
  session.progress('ec-ts5-resumed', `Resumed via Resubmit — RETRY button visible: ${retryButtonVisible}, Payment History visible: ${historyVisible}`);
  if (!retryButtonVisible) {
    throw new Error('Expected the resumed record to render the "RETRY" button (#to-retry-rhb) in retry mode — it did not.');
  }
  if (!historyVisible) {
    throw new Error('Expected the resumed record\'s Payment History (#payment-history-portion) to be visible, showing the earlier declined attempt — it was not.');
  }

  // ── Confirm it's genuinely the SAME record throughout (not a fresh one).
  // From a SEPARATE TAB — `findTransactionIdByVehicleNo()`/
  // `countTransactionsForVehicle()` navigate whichever page `session`
  // considers "active" (session.ts's `active()` returns the newest open
  // page), so calling them directly on `precheck`'s own page would carry
  // the resumed retry-mode view away to the listing — confirmed live
  // 2026-09-01: `attemptResubmitPayment()` then timed out on `#to-retry-rhb`
  // because the page was showing the listing instead. Same "separate tab"
  // fix EC_TS2 already uses for the identical reason. ──
  const lookupTab = await page.context().newPage();
  let rowCountAfterResume: number;
  let transactionIdAfterResume: string;
  try {
    const precheckLookup = new PrecheckEnquiryPage(lookupTab, session);
    rowCountAfterResume = await precheckLookup.countTransactionsForVehicle(inputs.envSegment, inputs.vehicleRegNo);
    transactionIdAfterResume = await precheckLookup.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
  } finally {
    await lookupTab.close();
  }

  // ── Re-steer to OK and complete via the RETRY button — proves the SAME
  // record can be carried through to Approved after being resumed. ──
  await ensureEsimHappyPath(inputs.vehicleRegNo);
  const retryResult = await precheck.attemptResubmitPayment();

  const finalPage = session.active();
  const sameRecordThroughout = transactionIdAfterDecline !== '' && transactionIdAfterDecline === transactionIdAfterResume
    && rowCountAfterDecline === rowCountAfterResume;

  console.log('RESULT:' + JSON.stringify({
    status: retryButtonVisible && historyVisible && sameRecordThroughout && retryResult.outcome === 'approved' ? 'SUCCESS' : 'FAIL',
    label: 'EC_TS5 — failed-payment precheck resumes in retry mode with its Payment History',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    firstAttempt,
    afterDecline: { transactionId: transactionIdAfterDecline, rowCount: rowCountAfterDecline },
    resumed: { retryButtonVisible, historyVisible },
    afterResume: { transactionId: transactionIdAfterResume, rowCount: rowCountAfterResume },
    sameRecordThroughout,
    retryResult,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
