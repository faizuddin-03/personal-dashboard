import { test } from '../fixtures/sessionFixture';
import { CONFIG, getDeregVehicleInputs } from '../data/config';
import { DeregTransactionPage } from '../pages/DeregTransactionPage';
import { OtherFunctionsPage } from '../pages/OtherFunctionsPage';
import { MykadEmulatorClient } from '../utils/mykadEmulator';

// ── OF_TS1-3: Other Functions (EAINT-9306) ──
// All 3 live on Deregistration Step 2's Vehicle Details form and never
// create a real transaction — a create-transaction-and-check flow, so all
// 3 run in one pass instead of one spec each, same reasoning as AM_TS1-4
// (tests/edereg-precheck-am.spec.ts):
//   OF_TS1 — vehicle no. with no valid pre-check -> inline #precheck-popup
//            appears -> Cancel -> popup closes, red error stays.
//   OF_TS2 — submit with #vehicleRegNo blank -> required-field validation
//            instead of navigating to step 3.
//   OF_TS3 — #vehicleRegNo's own input-shaping (reject non-alphanumeric,
//            strip spacebar, auto-capitalize).
//
// PRECONDITION: `vehicleRegNo` must NOT have an approved pre-check within
// the last 6 months (OF_TS1 needs the gate BLOCKED) — use a fresh/unused
// plate via the dashboard form, not the shared happy-path vehicle.
//
// OF_TS1's selectors/flow confirmed from the SAME #precheck-popup gate
// DeregTransactionPage.beginInlinePaymentFlow() uses, live-confirmed
// 2026-08-26 on CPC_E2E_TS5 Part 2. OF_TS2's validation state past the
// #to-continue click is UNCONFIRMED — no live HTML capture exists for it,
// see pages/OtherFunctionsPage.ts's own doc comment. OF_TS3 is plain DOM
// input-shaping, no popups involved.
//
// NEVER RUN LIVE.
test('Other Functions — OF_TS1-3', async ({ loggedInPage: page, session, inputs }) => {
  test.setTimeout(5 * 60_000);

  session.logUrl('after login');
  await session.closeBanners();

  const vehicle = getDeregVehicleInputs();
  const mykad = new MykadEmulatorClient(page.context());
  const of = new OtherFunctionsPage(page, session);

  let ts1: Awaited<ReturnType<OtherFunctionsPage['cancelPrecheckPopup']>> | null = null;
  let ts2: Awaited<ReturnType<OtherFunctionsPage['submitWithBlankVehicleNo']>> | null = null;
  let ts3: Awaited<ReturnType<OtherFunctionsPage['checkVehicleNoInputShaping']>> | null = null;
  try {
    const dereg = new DeregTransactionPage(page, session, mykad);
    await dereg.createFromHome('MYKAD');
    await dereg.authenticateOwner();

    ts1 = await of.cancelPrecheckPopup(dereg, inputs.vehicleRegNo);
    ts2 = await of.submitWithBlankVehicleNo(vehicle);
    ts3 = await of.checkVehicleNoInputShaping();
  } finally {
    await mykad.close();
  }

  const finalPage = session.active();
  console.log('RESULT:' + JSON.stringify({
    status: ts1?.popupClosed && ts1?.errorVisible && ts1?.isRed
      && ts2?.stayedOnStep2
      && (ts3?.every(c => c.asExpected) ?? false)
      ? 'SUCCESS' : 'FAIL',
    tsNo: 'OF_TS1-3',
    vehicleRegNo: inputs.vehicleRegNo,
    envSegment: inputs.envSegment,
    OF_TS1: ts1,
    OF_TS2: ts2,
    OF_TS3: ts3,
    finalUrl: finalPage.url(),
  }));

  if (!CONFIG.skipPause) {
    await session.active().pause();
  }
});
