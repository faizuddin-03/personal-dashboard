import { Page, Dialog } from '@playwright/test';
import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { PrecheckEnquiryPage } from '../pages/PrecheckEnquiryPage';
import { LoginPage } from '../pages/LoginPage';
import { PrecheckSession } from '../utils/session';
import { MykadEmulatorClient } from '../utils/mykadEmulator';
import { TIMESTAMP_OVERLAY_INIT_SCRIPT } from '../utils/overlay';
import { recordSubPageVideo } from '../utils/videoManifest';
import { pauseForDashboardContinue } from '../utils/pauseSignal';

// Literal browser refresh of Step 2's own still-open inline popup, holding
// any native dialog open for CONFIG.detailsPauseMs before accepting so it's
// actually visible in the recording — same helper shape as MU_TS9B's own
// `reloadAndCaptureDialog()`, duplicated locally rather than shared since
// this suite doesn't have a common home for it yet (small enough not to be
// worth factoring out for two callers).
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

// ── MU_TS11 — AATF Multiple Users, DIFFERENT company, both create a
// Pending pre-check for the SAME vehicle no., wait for the cronjob to
// expire both, then attempt resubmit from an Expired row (EAINT-9306) ──
//
// Test plan, as given by Faizuddin 2026-08-27:
//
//   Pre-requisite: AATF User A (Main) & User B (Sub) are from different
//   company (attempt refresh & resubmit after Trx Status = Expired)
//   1. User A go to create new Deregistration. At step 2, input vehicle
//      number without valid pre-check
//   2. Proceed until pre-check enquiry pops up, Trx Status = Pending
//   3. User B create another transaction using the same vehicle number
//   4. Proceed until pre-check enquiry pops up, Trx Status = Pending
//   5. Wait until cronjob runs, Trx Status = Expired
//   6. User A & User B refresh Step 2
//   7. System shows the step 2 page for Deregistration Transaction
//   8. User A & User B attempts to resubmit transaction from Transaction
//      Listing page
//   9. System displays error message "Transaction Expired"
//   10. Click [OK] button and system pre-search the trx in Transaction
//       Listing page, Trx Status = Expired
//
// **Rebuilt 2026-08-27 from an original Part 1/Part 2 split into a SINGLE
// run that PAUSES mid-flow for the dashboard's Continue button**
// (utils/pauseSignal.ts), per Faizuddin: "i need the continue button to
// still be on the exact same transaction, to see what the transaction
// does." Both users' inline popups stay OPEN, on the SAME live browser
// sessions, across the pause — the dev runs the cronjob (or waits for the
// daily 23:59:59 run) while the run is blocked, then clicks Continue on
// the dashboard. Looking up each side's transaction ID without disturbing
// its still-open popup uses the "second tab, same context" trick MU_TS7
// already established (`PrecheckEnquiryPage`'s own page-object methods
// always operate on `session.active()` — the LAST page opened in the
// context — so a fresh tab becomes the target without touching the tab
// underneath it).
//
// User A's own setup is IDENTICAL to MU_TS7/TS8/TS9/TS10's own User A
// setup. User B (DIFFERENT company) does the SAME thing on their OWN
// Deregistration — same identity slot MU_TS2/TS3/TS5/TS7/TS10 use
// (`CONFIG.subUsername2`/`subPassword2`, `mykadNricSub2`/`mykadNameSub2`) —
// confirmed isolation rule (MU_TS3/MU_TS5, §21/§23) means this produces a
// genuinely SEPARATE record from User A's, not a shared one.
//
// **"Refresh Step 2" — CORRECTED 2026-08-28.** The first build of this
// test read step 6 as "cancel the stale popup and start a whole NEW
// Deregistration attempt" — explicitly NOT a literal reload, on the
// (wrong) understanding that this was confirmed with Faizuddin ahead of
// time. Live-run behaviour proved that reading wrong, and Faizuddin
// corrected it directly: **"REFRESH MEANS REFRESH THE PAYMENT."** Step 6
// is a literal browser refresh of Step 2's own still-open inline popup —
// the SAME action MU_TS9 already exercised on a Cancelled record (§27,
// confirmed live: silently resets to a blank "Owner & Vehicle Details"
// form, no dialog, EAINT-12233) — just against an Expired record this
// time, a terminal status MU_TS9 never covered. See
// `reloadAndCaptureDialog()` above and knowledge/flow-edereg.md §30 for
// the full correction.
//
// GENUINELY UNCONFIRMED which way this goes for an EXPIRED (vs Cancelled)
// record — observed and logged below, NOT hard-asserted on the dialog
// text or the resulting DOM state, since MU_TS9's own silent finding was
// for a different terminal status and may not carry over.
//
// Step 8's "resubmit ... Transaction Expired" reuses
// `PrecheckEnquiryPage.openViaListingAndResubmitExpectingCancellation()`
// verbatim (built for MU_TS10, §29). Per Faizuddin's live-run feedback
// 2026-08-27: **"the resubmit link will not render on expired row. for the
// expired transactions, user cannot do anything anymore"** — this is now
// CONFIRMED, not just inferred, and is HARD-ASSERTED below
// (`resubmitLinkFound === false`). Per the same feedback, the literal
// "Transaction Expired" dialog wording is deliberately NOT asserted —
// Faizuddin checks that manually via the recording — only the final
// listing status (`Expired`) is hard-asserted, for both users.
//
// NEVER RUN LIVE.
test('AATF Multiple Users — MU_TS11 (different company, both create a Pending pre-check, wait for cronjob expiry, then resubmit from an Expired row)', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(40 * 60_000);

  session.logUrl('after login (User A)');
  await session.closeBanners();

  // ── User A (Main) — creates the Deregistration, triggers the gate,
  // STOPS with the inline #precheck-popup open (never Next, never Cancel).
  // Identical setup to MU_TS7/TS8/TS9/TS10. ──
  const mykadA = new MykadEmulatorClient(page.context());
  try {
    const deregA = new DeregTransactionPage(page, session, mykadA);
    await deregA.createFromHome('MYKAD');
    await deregA.authenticateOwner();
    await deregA.fillOwnerContactFields(getDeregVehicleInputs());
    const alreadySatisfied = await deregA.fillVehicleRegNoAndCheckGate(inputs.vehicleRegNo);
    if (alreadySatisfied) {
      throw new Error(`MU_TS11 needs the gate BLOCKED (no valid pre-check) so the inline popup appears — vehicle ${inputs.vehicleRegNo} already has one.`);
    }
  } finally {
    await mykadA.close();
  }

  const popupOpenedA = await page.locator('.ui-dialog:visible').last()
    .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
  if (!popupOpenedA) throw new Error('Expected the inline #precheck-popup after the gate failed, none appeared (User A).');
  session.progress('mu-ts11-user-a-popup-open', 'User A: inline pre-check popup open, Trx Status Pending — stopping here, not paying');

  // Second tab, same context/login — leaves User A's own popup untouched.
  const listingTabA = await page.context().newPage();
  let transactionIdA = '';
  try {
    const precheckA = new PrecheckEnquiryPage(listingTabA, session);
    transactionIdA = await precheckA.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
  } finally {
    await listingTabA.close();
  }

  // ── User B (DIFFERENT company) — SAME setup, own identity. Separate
  // browser context/login, same vehicle no. — confirmed isolation
  // produces a genuinely SEPARATE Pending record (MU_TS3/MU_TS5, §21/§23).
  // Kept OPEN (not closed) for the rest of this test, unlike the old
  // Part 1/Part 2 split. ──
  const userBContext = await page.context().browser()!.newContext();
  await userBContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  const userBPage = await userBContext.newPage();
  const sessionB = new PrecheckSession(userBContext, userBPage);
  let transactionIdB = '';
  try {
    await new LoginPage(userBPage, sessionB).login(inputs, { username: CONFIG.subUsername2, password: CONFIG.subPassword2 });
    sessionB.logUrl('after login (User B)');
    await sessionB.closeBanners();

    const mykadB = new MykadEmulatorClient(userBContext, { nric: CONFIG.mykadNricSub2, name: CONFIG.mykadNameSub2 });
    try {
      const deregB = new DeregTransactionPage(userBPage, sessionB, mykadB);
      await deregB.createFromHome('MYKAD');
      await deregB.authenticateOwner();
      await deregB.fillOwnerContactFields(getDeregVehicleInputs());
      const alreadySatisfiedB = await deregB.fillVehicleRegNoAndCheckGate(inputs.vehicleRegNo);
      if (alreadySatisfiedB) {
        throw new Error(`MU_TS11 needs User B's gate BLOCKED too (their own company should have no valid pre-check for this vehicle either) — vehicle ${inputs.vehicleRegNo} already has one.`);
      }
    } finally {
      await mykadB.close();
    }

    const popupOpenedB = await userBPage.locator('.ui-dialog:visible').last()
      .waitFor({ state: 'visible', timeout: 20_000 }).then(() => true).catch(() => false);
    if (!popupOpenedB) throw new Error('Expected the inline #precheck-popup after the gate failed, none appeared (User B).');
    session.progress('mu-ts11-user-b-popup-open', 'User B: OWN inline pre-check popup open, Trx Status Pending — different company, separate record');

    // Second tab, same context/login — leaves User B's own popup untouched.
    const listingTabB = await userBContext.newPage();
    try {
      const precheckB = new PrecheckEnquiryPage(listingTabB, sessionB);
      transactionIdB = await precheckB.findTransactionIdByVehicleNo(inputs.envSegment, inputs.vehicleRegNo);
    } finally {
      await listingTabB.close();
    }

    // ── PAUSE — both popups stay open, both browser sessions stay alive.
    // Dashboard shows a Continue button; the dev runs the cronjob (or the
    // daily 23:59:59 run happens) while this is blocked. ──
    session.progress('mu-ts11-paused', `Paused — both users' Pending pre-checks open for ${inputs.vehicleRegNo} (A: ${transactionIdA || '(lookup failed)'}, B: ${transactionIdB || '(lookup failed)'}). Ask the dev to run the cronjob, then click Continue on the dashboard.`);
    await pauseForDashboardContinue(
      `MU_TS11: waiting for cronjob to expire both Pending pre-checks (vehicle ${inputs.vehicleRegNo})`,
      {
        transactions: [
          { label: 'User A', transactionId: transactionIdA || '(lookup failed)' },
          { label: 'User B', transactionId: transactionIdB || '(lookup failed)' },
        ],
      },
    );
    session.progress('mu-ts11-resumed', 'Resumed — dashboard Continue clicked');

    // ── User A — "refresh Step 2": a LITERAL browser refresh of the same
    // still-open Step 2 tab (per Faizuddin's own correction — see this
    // file's header comment). ──
    const reloadDialogA = await reloadAndCaptureDialog(page);
    session.progress('mu-ts11-user-a-refresh', `User A refreshed Step 2 — dialog: "${reloadDialogA}"`);

    // ── User A resubmits from the Pre-Checking listing — Resubmit link
    // CONFIRMED absent on an Expired row, hard-asserted below. ──
    const precheckA = new PrecheckEnquiryPage(page, session);
    const userAResubmit = await precheckA.openViaListingAndResubmitExpectingCancellation(inputs.envSegment, inputs.vehicleRegNo);
    session.progress('mu-ts11-user-a-resubmit', `User A resubmitted — Resubmit link found: ${userAResubmit.resubmitLinkFound}, dialog: "${userAResubmit.dialogMessage}"`);
    if (userAResubmit.resubmitLinkFound) {
      throw new Error('Expected NO "Resubmit" link on User A\'s Expired row (confirmed absent — users can do nothing further on an Expired transaction).');
    }

    const userAListingAfter = await precheckA.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
    if (userAListingAfter.trxStatus !== 'Expired') {
      throw new Error(`Expected User A's own listing to show Expired — got "${userAListingAfter.trxStatus}".`);
    }

    // ── User B — SAME treatment, own identity/session, still alive. ──
    const reloadDialogB = await reloadAndCaptureDialog(userBPage);
    session.progress('mu-ts11-user-b-refresh', `User B refreshed Step 2 — dialog: "${reloadDialogB}"`);

    const precheckB = new PrecheckEnquiryPage(userBPage, sessionB);
    const userBResubmit = await precheckB.openViaListingAndResubmitExpectingCancellation(inputs.envSegment, inputs.vehicleRegNo);
    session.progress('mu-ts11-user-b-resubmit', `User B resubmitted — Resubmit link found: ${userBResubmit.resubmitLinkFound}, dialog: "${userBResubmit.dialogMessage}"`);
    if (userBResubmit.resubmitLinkFound) {
      throw new Error('Expected NO "Resubmit" link on User B\'s Expired row (confirmed absent — users can do nothing further on an Expired transaction).');
    }

    const userBListingAfter = await precheckB.getListingStatusForVehicle(inputs.envSegment, inputs.vehicleRegNo);
    if (userBListingAfter.trxStatus !== 'Expired') {
      throw new Error(`Expected User B's own listing to show Expired — got "${userBListingAfter.trxStatus}".`);
    }

    const finalPage = session.active();
    console.log('RESULT:' + JSON.stringify({
      status: userAListingAfter.trxStatus === 'Expired' && userBListingAfter.trxStatus === 'Expired'
        && !userAResubmit.resubmitLinkFound && !userBResubmit.resubmitLinkFound
        ? 'SUCCESS' : 'FAIL',
      tsNo: 'MU_TS11',
      vehicleRegNo: inputs.vehicleRegNo,
      envSegment: inputs.envSegment,
      userA: { transactionId: transactionIdA, reloadDialog: reloadDialogA, resubmit: userAResubmit, listingAfter: userAListingAfter },
      userB: { transactionId: transactionIdB, reloadDialog: reloadDialogB, resubmit: userBResubmit, listingAfter: userBListingAfter },
      finalUrl: finalPage.url(),
    }));

    if (!CONFIG.skipPause) {
      await session.active().pause();
    }
  } finally {
    await recordSubPageVideo(userBPage, 'mu-ts11-user-b').catch(() => { /* ignore */ });
    await userBContext.close();
  }
});
