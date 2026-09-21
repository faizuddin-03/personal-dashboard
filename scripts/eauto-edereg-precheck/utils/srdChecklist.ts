import { Page } from '@playwright/test';
import { PrecheckSession } from './session';
import { CONFIG } from '../data/config';
import { PrecheckEnquiryPage, PrecheckDetailsCheck } from '../pages/PrecheckEnquiryPage';
import { DeregTransactionPage, PrecheckingLinkCheck } from '../pages/DeregTransactionPage';
import { BoLoginPage } from '../pages/BoLoginPage';
import { JpjXmlLogPage, JpjXmlLogRow } from '../pages/JpjXmlLogPage';
import { decodePrecheckResponseData } from './jpjXmlLogDecode';
import { recordSubPageVideo, videoRunDir } from './videoManifest';
import { TIMESTAMP_OVERLAY_INIT_SCRIPT } from './overlay';

export interface JpjXmlLogChecklistResult {
  precheckLog: { refNo: string; foundByVehicleNo: number; foundByRefNo: number; responseCodeMatches: boolean };
  deregLog: { refNo: string; foundByVehicleNo: number; foundByRefNo: number };
}

// ── SRD checklist helpers, shared across every TS (EAINT-9306) ──
// Per Faizuddin, 2026-08-24: the SRD's TS1 checklist (Pre-Checking/
// Deregistration details, the "eDereg Pre-Checking: Yes" hyperlink, JPJ XML
// Log) applies to every OTHER test case too — with the exception that a
// two-part (dev-patch) case only checks on its LAST part, since that's the
// only point where the details being checked actually exist on screen.
// First built for CPC_E2E_TS1 directly inline (tests/edereg-precheck.spec.ts)
// — factored out here once every other TS case needed the same thing, to
// avoid re-deriving the BO-login/JPJ-log dance in 7+ near-identical copies.
// NONE of this has been run live for any case beyond the original TS1 build.

/** JPJ XML Log check — searches BOTH the eDereg Pre-Checking log and the
 *  Deregistration log, by Vehicle No. and (if given) by Transaction Ref.
 *  ID, under a SEPARATE BO/Hub Admin login in its own browser context. Pass
 *  `''` for a ref no. or `expectedResponseCode` to skip that particular
 *  search/cross-check — e.g. a case that never reaches a Deregistration
 *  Details page has no `deregRefNo` to search by, but its Vehicle No. search
 *  still runs. Only the Pre-Checking log has a confirmed field-decode
 *  reference (utils/jpjXmlLogDecode.ts); the Deregistration log is checked
 *  for row existence only, never decoded. */
export async function runJpjXmlLogChecklist(opts: {
  page: Page;
  envSegment: string;
  vehicleRegNo: string;
  precheckRefNo: string;
  deregRefNo: string;
  expectedResponseCode: string;
}): Promise<JpjXmlLogChecklistResult> {
  const { page, envSegment, vehicleRegNo, precheckRefNo, deregRefNo, expectedResponseCode } = opts;

  let precheckLogByVehicle: JpjXmlLogRow[] = [];
  let precheckLogByRefNo: JpjXmlLogRow[] = [];
  let deregLogByVehicle: JpjXmlLogRow[] = [];
  let deregLogByRefNo: JpjXmlLogRow[] = [];

  // recordVideo is NOT inherited from playwright.config.ts's `use.video`
  // for a manually created context — has to be passed explicitly, or this
  // whole BO session (a real login + JPJ XML Log evidence) goes unrecorded.
  // Same viewport as the main config, so ffmpeg can concatenate the two
  // without a resolution mismatch. Confirmed gap 2026-08-24, per Faizuddin.
  const boContext = await page.context().browser()!.newContext({
    recordVideo: { dir: videoRunDir(), size: { width: 1920, height: 1080 } },
  });
  // Applied across the suite, 2026-08-27 (piloted on MU_TS1 first) — see
  // utils/overlay.ts's own doc comment. This BO context feeds every
  // single-user test that runs the SRD checklist (TS1 and most others),
  // not just the Multiple Users cases.
  await boContext.addInitScript(TIMESTAMP_OVERLAY_INIT_SCRIPT);
  let boPage: Awaited<ReturnType<typeof boContext.newPage>> | undefined;
  try {
    boPage = await boContext.newPage();
    await new BoLoginPage(boPage).login(envSegment);

    const precheckLog = new JpjXmlLogPage(boPage, '/view/dereg/precheck/jpj/log/main.do');
    await precheckLog.open(envSegment);
    precheckLogByVehicle = await precheckLog.searchByVehicleNo(vehicleRegNo);
    if (precheckRefNo) {
      await precheckLog.open(envSegment);
      precheckLogByRefNo = await precheckLog.searchByRefNo(precheckRefNo);
    }

    const deregLog = new JpjXmlLogPage(boPage, '/view/dereg/jpj/log');
    await deregLog.open(envSegment);
    deregLogByVehicle = await deregLog.searchByVehicleNo(vehicleRegNo);
    if (deregRefNo) {
      await deregLog.open(envSegment);
      deregLogByRefNo = await deregLog.searchByRefNo(deregRefNo);
    }
  } finally {
    await boContext.close();
    if (boPage) await recordSubPageVideo(boPage, 'bo-jpj-xml-log').catch(() => { /* ignore */ });
  }

  const precheckLogResponseCodeMatches = expectedResponseCode
    ? precheckLogByVehicle.map(r => decodePrecheckResponseData(r.responseData)).some(d => d.responseCode === expectedResponseCode)
    : false;

  return {
    precheckLog: {
      refNo: precheckRefNo,
      foundByVehicleNo: precheckLogByVehicle.length,
      foundByRefNo: precheckLogByRefNo.length,
      responseCodeMatches: precheckLogResponseCodeMatches,
    },
    deregLog: {
      refNo: deregRefNo,
      foundByVehicleNo: deregLogByVehicle.length,
      foundByRefNo: deregLogByRefNo.length,
    },
  };
}

export interface PostDeregSrdChecklistResult {
  detailsCheck: PrecheckDetailsCheck | null;
  precheckLinkCheck: PrecheckingLinkCheck;
  jpjXmlLogCheck: JpjXmlLogChecklistResult;
}

/** Full checklist for a case that reaches a COMPLETED Deregistration
 *  transaction (`payAndDeregister()` already returned, active page still on
 *  the resulting Details view) — the "pre-check done in step 2" entry point
 *  never calls `precheck.done()` itself, so the Pre-Checking transaction is
 *  looked up via the listing instead
 *  (`PrecheckEnquiryPage.findTransactionIdByVehicleNo`, the SAME approach
 *  CPC_E2E_TS10/11/12's Part 1 already uses) rather than re-deriving a
 *  details-page reference some other way. That lookup's own `.first()` row
 *  assumption (newest first) is CONFIRMED by two live BO JPJ XML Log
 *  captures, both listing the newest entry first
 *  (EAINT-9306-bo-jpj-xml-log-dereg.html,
 *  EAINT-9306-bo-jpj-xml-log-precheck.html) — relevant for the two-part
 *  cases' LAST part, where a vehicle now has TWO Pre-Checking transactions
 *  (the original, now-expired one from Part 1, and the new one this part's
 *  own inline retry just created) and `.first()` needs to land on the new
 *  one, not the stale one.
 *
 *  Call `dereg.verifyPrecheckingYesLink()` yourself first if you need its
 *  result before this returns (it's also called inside here) — this
 *  function calls it once, internally, so don't call it twice. */
export async function runPostDeregSrdChecklist(opts: {
  page: Page;
  session: PrecheckSession;
  dereg: DeregTransactionPage;
  envSegment: string;
  vehicleRegNo: string;
  expectedResponseCode: string;
}): Promise<PostDeregSrdChecklistResult> {
  const { page, session, dereg, envSegment, vehicleRegNo, expectedResponseCode } = opts;

  const precheckLinkCheck = await dereg.verifyPrecheckingYesLink(vehicleRegNo);

  const precheck = new PrecheckEnquiryPage(page, session);
  const precheckTransactionId = await precheck.findTransactionIdByVehicleNo(envSegment, vehicleRegNo);
  let detailsCheck: PrecheckDetailsCheck | null = null;
  if (precheckTransactionId) {
    await page.goto(`${CONFIG.baseUrlFor(envSegment)}/view/aatf/dereg/precheck/enquiry/view.do?id=${precheckTransactionId}`);
    detailsCheck = await precheck.verifyDetailsPage(vehicleRegNo);
  }

  const jpjXmlLogCheck = await runJpjXmlLogChecklist({
    page, envSegment, vehicleRegNo,
    precheckRefNo: detailsCheck?.refNo ?? '',
    deregRefNo: precheckLinkCheck.deregRefNo,
    expectedResponseCode,
  });

  return { detailsCheck, precheckLinkCheck, jpjXmlLogCheck };
}
