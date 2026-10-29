#!/usr/bin/env node
/**
 * PROVE EVERY CREATION BRANCH ACTUALLY RUNS — offline, in about a second.
 *
 *   node scripts/probe-creation-branches.js
 *
 * WHY THIS EXISTS, AND IT IS NOT A FORMALITY
 *
 * On 27-08-2026 a read-only batch filmed NOTHING for an evening. Seventeen
 * `wants(...)` call sites in the recorder were reading a helper that only existed
 * inside another function, so each threw `ReferenceError: wants is not defined` the
 * moment its branch was reached — which aborted the take mid-flight at 7/15. Six
 * takes ran twice each and all twelve died the same way. `node --check` saw none of
 * it: a runtime resolution failure is not a syntax error, and the sites sit behind
 * `if (...)` so nothing throws until the scenario carrying that point is filmed.
 *
 * Then fixing the first one revealed a SECOND bug stacked behind it in the same
 * branch. Two runtime faults, one file, invisible to every static check.
 *
 * `src/creation.js` adds eleven new branches, and the cost of learning this the
 * expensive way is now much higher than an evening: a segment-1 take costs one
 * reCAPTCHA tick and two Fiuu bank-simulator logins, and a throw at phase 9 of 11
 * takes the whole sitting with it. Charmain runs these by hand tomorrow morning.
 *
 * So: every branch is driven here against stubs. No browser, no network, no staging,
 * no fixture. It cannot prove a SELECTOR is right — only staging can do that — but
 * it proves the code PATH executes, which is the class of fault that actually keeps
 * biting this rig.
 *
 * The stubs are patched onto the real modules BEFORE creation.js is required, and
 * the order matters: creation.js destructures `login` at load time, so patching it
 * afterwards would leave the real one in place and this probe would try to log in.
 */
const path = require('node:path');
const fs = require('node:fs');

const SRC = path.resolve(__dirname, '..', 'src');
const calls = [];
const record = (what) => (...args) => { calls.push({ what, args }); return undefined; };

/* ------------------------------------------------------------------- stubs */

// Patch BEFORE requiring creation.js. See the note above about destructuring.
const loginMod = require(path.join(SRC, 'login'));
loginMod.login = async (page, roleKey) => {
  calls.push({ what: 'login', args: [roleKey] });
  return { key: String(roleKey), label: 'stub ' + String(roleKey) };
};

const CHECKPOINT = {};
const fixtureMod = require(path.join(SRC, 'fixture'));
fixtureMod.readCheckpoint = async () => ({ ...CHECKPOINT });
fixtureMod.writeCheckpoint = async (label, patch) => {
  calls.push({ what: 'writeCheckpoint', args: [Object.keys(patch || {})] });
  Object.assign(CHECKPOINT, patch || {});
  return { ...CHECKPOINT };
};
fixtureMod.markPhase = async (label, phase) => { calls.push({ what: 'markPhase', args: [phase] }); };

const preappMod = require(path.join(SRC, 'preapp'));
preappMod.passGate = async () => { calls.push({ what: 'passGate', args: [] }); return { passed: true }; };
preappMod.fillPreApplicationForm = record('fillPreApplicationForm');
preappMod.reviewAndPay = async () => { calls.push({ what: 'reviewAndPay', args: [] }); return { uuid: 'stub-preapp-uuid' }; };
preappMod.fillApplicationForm = record('fillApplicationForm');
preappMod.submitRegistrationDocs = record('submitRegistrationDocs');
preappMod.payRegistrationFee = async () => { calls.push({ what: 'payRegistrationFee', args: [] }); return 'fpx'; };

const boMod = require(path.join(SRC, 'onboarding'));
// View opens a NEW TAB — return a DIFFERENT page object so the onPage(view tab)
// branch is exercised. A stub that returns the same page would leave that line
// unproven, which is exactly the kind of gap this probe exists to close.
const viewTab = { __name: 'view-tab' };
boMod.openPreApplication = async () => {
  calls.push({ what: 'openPreApplication', args: [] });
  return { page: viewTab, uuid: 'stub-preapp-uuid' };
};
boMod.approvePreApplication = async () => {
  calls.push({ what: 'approvePreApplication', args: [] });
  return { link: 'https://staging.eauto.my/stub-dealer-link' };
};
boMod.assignApplication = async () => { calls.push({ what: 'assignApplication', args: [] }); return { assigned: true }; };
boMod.setUcdGroupAndSubmit = record('setUcdGroupAndSubmit');
boMod.approveApplication = record('approveApplication');
boMod.verifyRegistrationDocs = record('verifyRegistrationDocs');
boMod.readFixtureState = async (page, appNo) => {
  calls.push({ what: 'readFixtureState', args: [appNo] });
  return { applicationNo: appNo || 'NA00000000', status: 'Approved', expiry: '2026-11-25 10:00:00' };
};

const listingMod = require(path.join(SRC, 'listing'));
listingMod.findByCompanyName = async () => {
  calls.push({ what: 'findByCompanyName', args: [] });
  return { applicationNo: 'NA99000001' };
};
listingMod.openApplication = async () => { calls.push({ what: 'openApplication', args: [] }); return 'stub-app-uuid'; };
// The two BackOffice verification phases (28-08-2026). Without these the flow
// reached the real listing.open() with a stub page and died on `page.url is not a
// function` — which is the probe doing its job: an unstubbed call is an unproven
// branch, and this one would have aborted a take after the reCAPTCHA.
listingMod.findByApplicationNo = async (page, appNo) => {
  calls.push({ what: 'findByApplicationNo', args: [appNo] });
  return {
    applicationNo: appNo,
    companyName: 'CHARMAIN QA11982 STUB-001 SDN BHD',
    applicationStatus: 'Approved',
    hardcopyAccCreated: 'Pending UCD',
    createdAt: '2026-08-28 00:44',
  };
};
listingMod.expiry = async (page, appNo) => {
  calls.push({ what: 'expiry', args: [appNo] });
  return { raw: '2026-11-26 00:44', date: new Date(2026, 10, 26, 0, 44) };
};

const appMod = require(path.join(SRC, 'application'));
appMod.assertRealApplication = async () => { calls.push({ what: 'assertRealApplication', args: [] }); };
appMod.goto = async () => { calls.push({ what: 'app.goto', args: [] }); return { tab: 'regDocs', view: 'backoffice' }; };
// The details-page check is "is the Extend button showing". EXTEND_SHOWING is flipped
// below so both answers are exercised — an absence has to refuse the tick, not pass.
let EXTEND_SHOWING = true;
appMod.extendState = async () => {
  calls.push({ what: 'extendState', args: [] });
  return EXTEND_SHOWING
    ? { present: true, inDom: true, enabled: true }
    : { present: false, inDom: false, enabled: false };
};
appMod.readSidebar = async () => {
  calls.push({ what: 'readSidebar', args: [] });
  // The status MATCHES the listing stub deliberately: the agreement branch is the
  // normal path, and the disagreement branch is asserted separately below.
  return {
    applicationNo: 'NA99000001',
    assignee: 'stub assignee',
    applicationStatus: 'Approved',
    regDocsSubmittedAt: '2026-08-28',
    regDocsVerifiedAt: '2026-08-28',
    hardcopyDoc: 'Pending UCD',
    raw: 'Application No: NA99000001',
  };
};

// The four post-patch BackOffice legs (28-08-2026) and the patch itself.
const supportMod = require(path.join(SRC, 'support'));
let PATCH_FAILS_ONCE = false;
let patchCalls = 0;
supportMod.context = async () => ({
  newPage: async () => ({
    __name: 'support-page',
    url: () => 'http://172.30.202.23:8888/eauto-support/obs/reset-expiry',
    evaluate: async () => '',
    waitForTimeout: async () => {},
  }),
  close: async () => {},
});
supportMod.setExpiry = async (page, opts) => {
  patchCalls += 1;
  calls.push({ what: 'setExpiry', args: [opts && opts.applicationNo] });
  // First call fails in the shape of a DEAD SESSION, so the retry branch is proven.
  if (PATCH_FAILS_ONCE && patchCalls === 1) {
    throw new Error("locator.fill: Timeout 20000ms exceeded waiting for locator('#applicationNumber')");
  }
  return { message: 'Expiry date updated successfully' };
};
supportMod.AUTH_FILE = path.join(__dirname, '..', '.auth', '__probe-never-written.json');

const exportMod = require(path.join(SRC, 'exportSheet'));
exportMod.sweep = async (page, appNo) => {
  calls.push({ what: 'exportSheet.sweep', args: [appNo] });
  return { row: { applicationNo: appNo, expiryDate: '2026-08-28 01:07' } };
};

const auditMod = require(path.join(SRC, 'auditLog'));
let AUDIT_ROWS = [{ description: 'Application approved', applicationNo: 'NA99000001' }];
auditMod.searchOnScreen = async () => {
  calls.push({ what: 'auditLog.searchOnScreen', args: [] });
  return { rows: AUDIT_ROWS };
};

// Requiring creation.js only NOW, with every stub already in place.
const creation = require(path.join(SRC, 'creation'));

// The dealer page has to be PAGE-SHAPED now: readPaymentDone reads the payment-done
// page through it, and the whole point of the check is that it reads rather than
// assumes. `PAYMENT_PAGE_TEXT` is swapped below to prove the failing branch too.
let PAYMENT_PAGE_TEXT =
  'Application Payment Success\n' +
  'Payment ID: A260828000134\n' +
  'Payment Method: FPX Online Banking (Maybank)\n' +
  'Payment Date Time: 28-08-2026 12:48am\n' +
  'Payment Status: PAID\n';
const dealer = {
  __name: 'dealer-page',
  evaluate: async () => PAYMENT_PAGE_TEXT,
  url: () => 'https://staging.eauto.my/obs/form/stub',
};
// The BackOffice pages must be PAGE-SHAPED too: bo-detail reads page.url() to prove
// it actually landed on the details route, and expiryCellSelector reads the header row
// through page.evaluate. `BO_URL` is swapped below to prove the did-not-land branch.
let BO_URL = 'https://staging.eauto.my/obs/onb/regDocs/stub-app-uuid';
const browser = {
  newContext: async () => ({
    newPage: async () => ({
      __name: 'bo-page',
      url: () => BO_URL,
      title: async () => '[QA-EVID] E2E_TS1',
      evaluate: async () => ({ col: 12, row: 2 }),
      waitForTimeout: async () => {},
    }),
    close: async () => {},
  }),
};
const profile = { businessName: 'CHARMAIN QA11982 STUB-001 SDN BHD', ucdGroup: 'STUB UCD GROUP' };

/* ------------------------------------------------------------------ checks */

let failures = 0;
const ok = (cond, what, detail) => {
  if (cond) { console.log('  ok    ' + what); return true; }
  console.log('  FAIL  ' + what + (detail ? '\n        ' + detail : ''));
  failures += 1;
  return false;
};

(async () => {
  console.log('\n  creation-branch reachability — no browser, no network, no fixture\n');

  /* ---- 1. every phase runs, every leg is bracketed ---------------------- */
  const started = [];
  const finished = [];
  const pages = [];
  let out;
  try {
    out = await creation.runCreation({
      browser, dealer, profile, runLabel: 'stub-run',
      onPhaseStart: async (phase, page) => { started.push(phase); pages.push(page && page.__name); },
      onPhaseDone: async (phase) => { finished.push(phase); },
      onPage: async (page, roleKey) => { calls.push({ what: 'onPage', args: [page && page.__name, String(roleKey)] }); },
      say: () => {},
    });
  } catch (err) {
    ok(false, 'the full eleven-phase flow runs end to end',
      (err && err.stack ? err.stack.split('\n').slice(0, 4).join('\n        ') : String(err)));
    console.log('\n  Nothing below could be checked — the flow aborted.\n');
    process.exit(1);
  }

  ok(started.length === creation.PHASES.length,
    'every one of the ' + creation.PHASES.length + ' phases reached onPhaseStart',
    'started: ' + started.join(', '));
  ok(finished.length === creation.PHASES.length,
    'every phase reached onPhaseDone',
    'missing: ' + creation.PHASES.filter((p) => !finished.includes(p)).join(', '));

  const missingStart = creation.PHASES.filter((p) => !started.includes(p));
  ok(missingStart.length === 0, 'no phase was skipped', 'skipped: ' + missingStart.join(', '));

  // The order is load-bearing: approve-app before regdocs is what gives the record
  // an expiry at all, and regfee last is what makes it a candidate for Extend.
  ok(started.join('>') === creation.PHASES.join('>'),
    'the phases ran in the register\'s order',
    'ran: ' + started.join(' > '));

  /* ---- 2. every leg has a point and a caption -------------------------- */
  ok(creation.LEGS.length === creation.PHASES.length,
    'one checklist leg per phase (' + creation.LEGS.length + ')');
  const unmapped = creation.PHASES.filter((p) => !creation.legForPhase(p));
  ok(unmapped.length === 0, 'every phase maps to a leg', 'unmapped: ' + unmapped.join(', '));
  const uncaptioned = creation.LEGS.filter((l) => !l.caption || l.caption.length < 20);
  ok(uncaptioned.length === 0, 'every leg carries a caption a reviewer can check',
    'thin: ' + uncaptioned.map((l) => l.key).join(', '));
  const dupes = creation.LEGS.map((l) => l.key).filter((k, i, a) => a.indexOf(k) !== i);
  ok(dupes.length === 0, 'no duplicate leg keys', 'duplicated: ' + dupes.join(', '));

  /* ---- 3. the annotator reaches the short-lived BackOffice pages -------- */
  const onPageCalls = calls.filter((c) => c.what === 'onPage');
  // gate/preapp/appform/regdocs/regfee ride the dealer page; the other six open
  // their own BackOffice context, plus the approve-preapp View tab.
  ok(onPageCalls.length >= 6,
    'onPage fired for the short-lived BackOffice contexts (' + onPageCalls.length + ' times)');
  ok(onPageCalls.some((c) => c.args[0] === 'view-tab'),
    'onPage followed the approve-preapp View tab — Approve lives there, not on the listing page');

  // Every login must be preceded by its onPage, or the login is filmed unannotated.
  let orderOk = true;
  for (let i = 0; i < calls.length; i += 1) {
    if (calls[i].what !== 'login') continue;
    const prior = calls.slice(0, i).filter((c) => c.what === 'onPage');
    if (!prior.length) { orderOk = false; break; }
  }
  ok(orderOk, 'onPage fires BEFORE login, so the login itself can be filmed');

  /* ---- 4. the identity is banked before the assignment ----------------- */
  const wcIdx = calls.findIndex((c) => c.what === 'writeCheckpoint' &&
    c.args[0].includes('applicationNo') && c.args[0].includes('uuid'));
  const assignIdx = calls.findIndex((c) => c.what === 'assignApplication');
  ok(wcIdx !== -1 && assignIdx !== -1 && wcIdx < assignIdx,
    'the Application No is written to the checkpoint BEFORE the assignment is tried',
    'this is the 26-08 fault: the assignment failed, the checkpoint was never written, and ' +
    'a resume had to re-find a record it had already found');

  ok(out && out.applicationNo === 'NA99000001',
    'the finished flow returns the record it created',
    'got: ' + JSON.stringify(out && out.applicationNo));

  /* ---- 5. a hook that throws must not cost the fixture ----------------- */
  for (const k of Object.keys(CHECKPOINT)) delete CHECKPOINT[k];
  calls.length = 0;
  let out2;
  try {
    out2 = await creation.runCreation({
      browser, dealer, profile, runLabel: 'stub-run-2',
      onPhaseStart: async () => { throw new Error('deliberate caption failure'); },
      onPhaseDone: async () => { throw new Error('deliberate tick failure'); },
      onPage: async () => { throw new Error('deliberate attach failure'); },
      say: () => {},
    });
    ok(true, 'a throwing hook does not abort the flow — film is not flow');
    ok(out2 && out2.hookErrors && out2.hookErrors.length > 0,
      'and the hook failures are REPORTED, not swallowed (' +
      ((out2 && out2.hookErrors && out2.hookErrors.length) || 0) + ' recorded)');
  } catch (err) {
    ok(false, 'a throwing hook does not abort the flow',
      'it aborted: ' + (err && err.message) + ' — a failed caption would cost a reCAPTCHA tick and two Fiuu logins');
  }

  /* ---- 6. the guards actually refuse ----------------------------------- */
  const refuses = async (what, opts) => {
    try { await creation.runCreation(opts); return ok(false, what, 'it did NOT throw'); }
    catch { return ok(true, what); }
  };
  await refuses('runCreation refuses with no browser', { dealer, profile, runLabel: 'x', phases: [] });
  await refuses('runCreation refuses with no dealer page (it carries the passed gate)', { browser, profile, runLabel: 'x', phases: [] });
  await refuses('runCreation refuses with no profile', { browser, dealer, runLabel: 'x', phases: [] });
  await refuses('runCreation refuses with no runLabel to checkpoint against', { browser, dealer, profile, phases: [] });
  await refuses('runCreation refuses an unknown phase', { browser, dealer, profile, runLabel: 'x', phases: ['not-a-phase'] });

  // requireUuid must fail loudly rather than approve nothing.
  for (const k of Object.keys(CHECKPOINT)) delete CHECKPOINT[k];
  await refuses('approve-app refuses when no uuid was ever banked',
    { browser, dealer, profile, runLabel: 'x', phases: ['approve-app'], say: () => {} });

  // And requireAppNo the same way, for both BackOffice verification phases. Without
  // this they would search the listing for '' or for the boolean `true` and come back
  // with no rows — which looks exactly like "the record is not in BackOffice", i.e. a
  // product defect, on a run where nothing was ever banked to look for.
  for (const k of Object.keys(CHECKPOINT)) delete CHECKPOINT[k];
  await refuses('bo-listing refuses when no Application No was banked',
    { browser, dealer, profile, runLabel: 'x', phases: ['bo-listing'], say: () => {} });
  await refuses('bo-detail refuses when no Application No was banked',
    { browser, dealer, profile, runLabel: 'x', phases: ['bo-detail'], say: () => {} });
  CHECKPOINT.applicationNo = true;
  await refuses('and refuses the BOOLEAN `true` a phase can leave behind, not just an empty one',
    { browser, dealer, profile, runLabel: 'x', phases: ['bo-listing'], say: () => {} });
  for (const k of Object.keys(CHECKPOINT)) delete CHECKPOINT[k];

  /* ---- 6b. the two lists of legs must not drift ------------------------ */
  //
  // triggerPoints.js writes the creation keys out by hand instead of requiring
  // creation.js, because check-points.mjs and evidence-coverage.mjs load
  // triggerPoints with no environment and must not drag preapp/login/env in behind
  // it. A hand-kept copy of a derived fact is this rig's most familiar bug, so the
  // copy is CHECKED here rather than trusted: if a phase is added to creation.js and
  // not to the checklist, the take would film a leg that can never tick.
  const tp = require(path.join(SRC, 'triggerPoints'));
  // CHECKED legs, not all legs (28-08-2026). Charmain narrowed segment 1 to the
  // payment-done pages plus the two BackOffice reads, so seven phases now run without
  // earning a point. The drift check therefore runs on `checked`, and the UNCHECKED
  // ones are asserted ABSENT — otherwise narrowing the scope would silently leave
  // seven points on the checklist that nothing frames, which is how the 00:44 take
  // ticked six legs over the dealer window.
  const fromFlow = creation.LEGS.filter((l) => l.checked).map((l) => l.key);
  const unchecked = creation.LEGS.filter((l) => !l.checked).map((l) => l.key);
  const onChecklist = tp.CREATION_POINTS.map((p) => p.key);
  const missingFromChecklist = fromFlow.filter((k) => !onChecklist.includes(k));
  const extraOnChecklist = onChecklist.filter(
    (k) => !fromFlow.includes(k) && !['create-patch-expiry', 'seam-declared'].includes(k));
  ok(missingFromChecklist.length === 0,
    'every CHECKED creation phase has a checklist point in triggerPoints.js',
    'checked phases with no point: ' + missingFromChecklist.join(', '));
  ok(extraOnChecklist.length === 0,
    'the checklist invents no creation point the flow cannot drive',
    'points with no phase: ' + extraOnChecklist.join(', '));
  const strays = unchecked.filter((k) => onChecklist.includes(k));
  ok(strays.length === 0,
    'and no UNCHECKED phase is left on the checklist as a point nothing frames',
    'still counted despite not being checked: ' + strays.join(', '));
  ok(fromFlow.length === 7 && onChecklist.length === 8,
    'segment 1 checks the two payments, the patch and four BackOffice surfaces — not the flow (' +
      fromFlow.length + ' checked legs + seam = ' + onChecklist.length + ' points)',
    'checked: ' + fromFlow.join(', '));
  // Every BackOffice leg that IS checked must be marked `bo`, or it never gets the
  // marker handed to it and films behind the dealer window — the 00:44 defect.
  // FIVE, not four: the support tool opens its own window too, and Charmain could not
  // see the patch happening because that window sat behind the pinned dealer one.
  // Every checked leg whose page is NOT the dealer page needs the hand-over.
  const boChecked = creation.LEGS.filter((l) => l.checked && l.bo).map((l) => l.key);
  ok(boChecked.length === 5 && boChecked.includes('create-patch-expiry'),
    'all five own-window checks are flagged `bo` — the support tool included',
    'flagged: ' + boChecked.join(', '));
  // AND EVERY UNCHECKED BACKOFFICE LEG TOO — 28-08-2026. Charmain: *"all the action
  // you did in BO is not recorded"*. The hand-over was gated on `checked && bo`, so
  // the five BackOffice FLOW steps ran behind the dealer window and never reached a
  // frame; sampling the 11:51 TS3 take from 95s to 245s returns only the dealer.
  // They stay unchecked — `checked` is the score, `bo` is the camera — so assert the
  // camera side explicitly, or trimming the checklist silently trims the film again.
  const BO_FLOW_LEGS = ['create-approve-preapp', 'create-assign', 'create-submit-approval',
    'create-approve-app', 'create-verify-regdocs', 'create-record'];
  const boFlowMissing = BO_FLOW_LEGS.filter(
    (k) => !creation.LEGS.some((l) => l.key === k && l.bo));
  ok(boFlowMissing.length === 0,
    'every BackOffice FLOW leg is flagged `bo` as well — it is filmed even though it is not scored',
    boFlowMissing.length ? 'NOT flagged: ' + boFlowMissing.join(', ') : BO_FLOW_LEGS.length + ' legs');
  // The dealer legs must NOT be flagged: handing the camera away from the dealer
  // window mid-form is how the payment checks would lose their own frame.
  const DEALER_FLOW_LEGS = ['create-gate', 'create-appform', 'create-regdocs'];
  const dealerStray = DEALER_FLOW_LEGS.filter(
    (k) => creation.LEGS.some((l) => l.key === k && l.bo));
  ok(dealerStray.length === 0,
    'and no dealer-window leg is flagged `bo` — the camera stays put for the dealer half',
    dealerStray.length ? 'wrongly flagged: ' + dealerStray.join(', ') : 'gate, appform, regdocs clean');
  const dealerLegs = creation.LEGS.filter((l) => l.checked && !l.bo).map((l) => l.key);
  ok(dealerLegs.length === 2 && dealerLegs.every((k) => /preapp|regfee/.test(k)),
    'and only the two payment checks stay on the dealer window, where they belong',
    'dealer-page checks: ' + dealerLegs.join(', '));
  // THE ORDER IS THE FIX FROM THE 05:33 TAKE. Every BackOffice read has to come after
  // the patch, or it describes a record that is still 90 days from expiry.
  const order = creation.PHASES;
  const patchAt = order.indexOf('patch-expiry');
  const boAfter = ['bo-listing', 'bo-export', 'bo-detail', 'bo-audit']
    .every((p) => order.indexOf(p) > patchAt && patchAt >= 0);
  ok(boAfter,
    'and every one of them runs AFTER patch-expiry, not before',
    'order: ' + order.slice(patchAt).join(' -> '));
  // The BackOffice reads hold longer than the flow legs — they went by too fast to
  // read in the 05:33 film.
  const shortBo = creation.LEGS.filter((l) => l.checked && l.bo && (l.holdMs || 0) < 3500).map((l) => l.key);
  ok(shortBo.length === 0,
    'each BackOffice check holds long enough to be legible at 15fps',
    'too short: ' + shortBo.join(', '));
  ok(creation.LEGS.find((l) => l.key === 'create-gate').checked === false,
    'the reCAPTCHA gate is filmed but NOT spotlighted — no highlight on the creation flow',
    'the film still starts at the gate; it is simply not ringed or counted');

  /* ---- 6c. the payment check READS the page, in both directions -------- */
  //
  // "make sure payment go through and success" is an assertion, so it has to be able
  // to FAIL. A check that reports success on any page it is handed would tick on a
  // gateway timeout, and the sidecar would read exactly the same as a real payment.
  {
    const details = [];
    const opts = (phases) => ({
      browser, dealer, profile, runLabel: 'pay-probe', phases,
      say: () => {},
      onPhaseDone: async (phase, detail) => { details.push({ phase, detail }); },
    });
    for (const k of Object.keys(CHECKPOINT)) delete CHECKPOINT[k];
    await creation.runCreation(opts(['gate', 'preapp']));
    const paidDetail = (details.find((d) => d.phase === 'preapp') || {}).detail || {};
    ok(paidDetail.success === true && /PAID/i.test(paidDetail.statusText || ''),
      'a payment-done page reading "Payment Status: PAID" passes the check',
      'status read: "' + paidDetail.statusText + '"  id=' + paidDetail.paymentId);
    ok(/A260828000134/.test(paidDetail.evidenceText || ''),
      'and the VERBATIM page text goes to the sidecar, not a parsed summary',
      paidDetail.evidenceText);

    // Now the same flow against a gateway that never settled.
    PAYMENT_PAGE_TEXT = 'Processing payment... do not close this window\n';
    details.length = 0;
    for (const k of Object.keys(CHECKPOINT)) delete CHECKPOINT[k];
    await creation.runCreation(opts(['gate', 'preapp']));
    const stuck = (details.find((d) => d.phase === 'preapp') || {}).detail || {};
    ok(stuck.success === false,
      'a page that never says PAID FAILS the check instead of ticking',
      'this is the branch that separates a real payment from a stalled gateway');
    ok(!stuck.statusText,
      'and it reports no status rather than inventing one',
      'statusText: "' + stuck.statusText + '"');
    PAYMENT_PAGE_TEXT =
      'Application Payment Success\nPayment ID: A260828000134\nPayment Status: PAID\n';
    for (const k of Object.keys(CHECKPOINT)) delete CHECKPOINT[k];
  }

  /* ---- 6d. the two BackOffice checks, both directions each ------------- */
  {
    const details = [];
    const run = async () => {
      details.length = 0;
      for (const k of Object.keys(CHECKPOINT)) delete CHECKPOINT[k];
      CHECKPOINT.applicationNo = 'NA99000001';
      CHECKPOINT.uuid = 'stub-app-uuid';
      await creation.runCreation({
        browser, dealer, profile, runLabel: 'bo-probe', phases: ['bo-listing', 'bo-detail'],
        say: () => {},
        onPhaseDone: async (phase, detail) => { details.push({ phase, detail }); },
      });
      return (p) => (details.find((d) => d.phase === p) || {}).detail || {};
    };

    let get = await run();
    const listed = get('bo-listing');
    ok(listed.expiryPresent === true && /2026-11-26/.test(listed.expiryRaw || ''),
      'the listing check reads the EXPIRY DATE off the row, which is what it is for',
      'expiry read: "' + listed.expiryRaw + '"');
    ok(/td:nth-child\(12\)/.test(listed.ringSelector || ''),
      'and it rings the expiry CELL, at the column index read from the header',
      'ring: ' + listed.ringSelector);

    const shown = get('bo-detail');
    ok(shown.landedOnDetail === true && shown.extendShowing === true,
      'the details check lands on the detail route and reports the Extend button SHOWING',
      'url=' + shown.url + '  showing=' + shown.extendShowing);

    // Now an absent control: the finding must be reported, never ticked quietly.
    EXTEND_SHOWING = false;
    get = await run();
    const gone = get('bo-detail');
    ok(gone.extendShowing === false && /present=false/.test(gone.extendWhy || ''),
      'an ABSENT Extend button is reported with what was measured, not passed over',
      'why: ' + gone.extendWhy);
    EXTEND_SHOWING = true;

    // And a navigation that never left the listing must not be read as a sidebar.
    BO_URL = 'https://staging.eauto.my/obs/admin/enquiry';
    get = await run();
    const stranded = get('bo-detail');
    ok(stranded.landedOnDetail === false && !('extendShowing' in stranded),
      'a page still on the LISTING refuses the check instead of reading its filter panel',
      'this is the 01:06 defect: status came back "All", a <select> default');
    ok(/enquiry/.test(stranded.url || ''),
      'and it names the url it was actually on, so the reason is diagnosable',
      stranded.url);
    BO_URL = 'https://staging.eauto.my/obs/onb/regDocs/stub-app-uuid';
    for (const k of Object.keys(CHECKPOINT)) delete CHECKPOINT[k];
  }
  ok(onChecklist.indexOf('seam-declared') === onChecklist.length - 1,
    'seam-declared is LAST — the seam is stated after the record exists, not before');
  ok(tp.E2E_GATE_ROWS.length === 9 && !tp.E2E_GATE_ROWS.includes('E2E_TS8'),
    'nine gate rows, and E2E_TS8 is not one of them (Charmain\'s exemption)',
    'got: ' + tp.E2E_GATE_ROWS.join(', '));
  let refused = false;
  try { tp.creationPointsFor('E2E_TS8'); } catch { refused = true; }
  ok(refused, 'creationPointsFor refuses E2E_TS8 with the reason rather than filming it');

  /* ---- 7. the human gates are named, and counted for THIS machine ------ */
  ok(creation.HUMAN_GATES.length === 3,
    'the three POSSIBLE human gates are named so a runner can warn (' + creation.HUMAN_GATES.join(', ') + ')',
    'one reCAPTCHA tick and two Fiuu logins — the worst case, when nothing can log in for them');

  // AND WHAT THIS RUN ACTUALLY NEEDS. The runner used to warn "three human gates,
  // ~12 min of your hands" unconditionally, because it read the LEG rather than the
  // machine — so Charmain was asked to sit through two payments the rig was already
  // paying by itself. Both directions are asserted: a guard proven only refusing may
  // be refusing everything.
  const savedUser = process.env.FIUU_SIM_USER;
  const savedPass = process.env.FIUU_SIM_PASS;
  try {
    process.env.FIUU_SIM_USER = 'probe';
    process.env.FIUU_SIM_PASS = 'probe';
    const withCreds = creation.humanGatesNow();
    ok(withCreds.length === 1 && withCreds[0] === 'create-gate',
      'WITH the Fiuu pair in the store, the reCAPTCHA is the only gate (' + withCreds.join(', ') + ')',
      'payFpx logs into the sandbox and drives the TAC, Approved and Pay Now itself');

    process.env.FIUU_SIM_USER = '';
    process.env.FIUU_SIM_PASS = '';
    const without = creation.humanGatesNow();
    ok(without.length === 3,
      'WITHOUT it, all three are named again so nobody is left waiting at a login (' + without.join(', ') + ')',
      'the fallback still has to be honest, or a blank store silently reads as hands-free');
  } finally {
    if (savedUser === undefined) delete process.env.FIUU_SIM_USER; else process.env.FIUU_SIM_USER = savedUser;
    if (savedPass === undefined) delete process.env.FIUU_SIM_PASS; else process.env.FIUU_SIM_PASS = savedPass;
  }
  ok(creation.simLoginAvailable(),
    'and on THIS machine the pair is present, so the next take is reCAPTCHA-only',
    'from ~/.claude/secrets/eauto.env via accounts.js — no value is printed');


  /* ------------------------------------------------------------------------
   * A FAILED PATCH MUST NOT BECOME A FINDING.
   *
   * Measured on the 18:38 take of 29-08-2026. The VPN passed the pre-flight burst
   * 5/5 and flapped fifteen minutes later, so the support tool timed out and
   * create-patch-expiry correctly refused its point. The four BackOffice legs that
   * run AFTER it each carry their own `detail` and knew nothing about that, so
   * create-bo-detail read a correctly ABSENT Extend button on a record still at
   * created+90d and wrote it into the sidecar as:
   *
   *     "the Extend button is NOT showing on a record that was just patched INTO
   *      the window ... That is a FINDING — compare EAINT-12235."
   *
   * Every clause of which is false. That is a bogus defect report with a real
   * ticket number attached to it, produced automatically, on a build where 12235
   * is fixed.
   *
   * Checked in SOURCE ORDER, not just for presence: the guard is only a guard if it
   * stands in front of the branch that writes the finding.
   * ---------------------------------------------------------------------- */
  {
    const spec = fs.readFileSync(path.resolve(__dirname, '..', 'tests', '91-e2e-creation.spec.js'), 'utf8');
    const iSet = spec.indexOf('patchFailedBecause = String(detail.patchFailed)');
    const iGuard = spec.indexOf('PATCH_DEPENDENT.has(leg.key)');
    // ANCHORED ON THE CODE, NOT THE PROSE. The first draft searched for the string
    // "compare EAINT-12235" and matched the COMMENT that quotes the false finding,
    // which sits above the guard — so the check reported the guard as misplaced when it
    // was correct. A check that greps explanatory text is measuring the documentation.
    const iFinding = spec.indexOf('detail.extendShowing === false');
    ok(iSet > 0, 'a failed patch is REMEMBERED, not just reported on its own point',
      'nothing sets patchFailedBecause, so the reads after it cannot know the precondition failed');
    ok(iGuard > 0, 'the reads that depend on the patch are guarded',
      'no PATCH_DEPENDENT guard — a failed patch still lets four BackOffice reads report findings');
    ok(iGuard > 0 && iFinding > 0 && iGuard < iFinding,
      'the guard stands BEFORE the branch that writes the 12235 comparison',
      'the guard is placed after the extendShowing branch, so the finding is written first and the guard never runs');
    for (const key of ['create-bo-listing', 'create-bo-export', 'create-bo-detail', 'create-bo-audit']) {
      ok(new RegExp("'" + key + "'").test(spec.slice(0, iGuard > 0 ? spec.length : 0)),
        key + ' is named in the patch-dependent set',
        key + ' runs after the patch and is NOT in PATCH_DEPENDENT, so it can still report a '
        + 'finding about a record whose expiry was never moved');
    }
  }
  console.log('');
  if (failures) {
    console.log('  ' + failures + ' check(s) FAILED — do not film until these are green.\n');
    process.exit(1);
  }
  console.log('  all green. Every creation branch executes; selectors still need staging.\n');
})().catch((err) => {
  console.error('\n  the probe itself threw:\n', err);
  process.exit(1);
});
