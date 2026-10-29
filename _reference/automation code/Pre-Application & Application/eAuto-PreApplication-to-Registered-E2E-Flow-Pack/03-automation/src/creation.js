/**
 * THE CREATION FLOW, EXTRACTED SO IT CAN BE FILMED.
 *
 * Written 27-08-2026 night, for Charmain's ruling: *"all E2E ts need to film start
 * from the recaptcha gate"*.
 *
 * WHY THIS FILE EXISTS
 *
 * Every E2E scenario in the register is titled "Full flow", and E2E_TS1's own step 1
 * is "Open https://staging.eauto.my/obs/preOnb/recaptcha and pass the check". The
 * recorder filmed none of it: its first checklist point on every extend-shaped take
 * is `login` — BackOffice. So an E2E take filmed the last third of its own scenario
 * and could still score 16/16, because the ceiling counts POINTS and no point knew
 * about the steps. Same shape of fault as TS01 scoring 12/12 over a page with no
 * Extend button.
 *
 * The flow itself was already written — `scripts/build-fixture.js` has driven it for
 * days. What it was NOT is callable: the phase loop lived inside a script's IIFE, so
 * the only way to film it was to reimplement it. A second copy of an eleven-phase
 * flow with two human gates in it would have drifted from the first within a day.
 *
 * So the loop moved HERE, unchanged in order and in its warnings, and gained hooks.
 * `build-fixture.js` and the recorder now call the same code. If a selector moves,
 * it moves for both.
 *
 * WHAT THE HOOKS ARE FOR
 *
 * A desktop recording films the whole monitor, so a child process's browser would
 * have been filmed just as well — that was the first design and it was wrong. The
 * house format needs the spotlight ring and the caption painted ON the page, and
 * `attachSpotlight` needs a Playwright `page` object. A child process's pages are
 * not reachable, so segment 1 would have been plain film with a checklist panel and
 * no annotation. Hooks keep the pages in-process.
 *
 * `onPage` fires for every page this flow opens BEFORE anything is typed into it —
 * including the short-lived BackOffice contexts, which exist only inside their own
 * phase. That is the only moment the recorder can attach an annotator to them.
 *
 * WHAT IS DELIBERATELY NOT HERE
 *
 * - It never clicks Extend. Building the fixture and spending its one extension are
 *   separate acts (R1), and the second belongs to segment 2. Carried over from
 *   build-fixture.js verbatim, because it is the reason segment 1 costs no fixture.
 * - It never creates the company account. Hardcopy Doc = Registered removes the
 *   Extend button entirely (R9), so the flow stops one step short of it.
 * - It does not patch the expiry. A record born here has expiry = created + 90d and
 *   the window opens 30 days before expiry, so it is born OUT of window. That patch
 *   is the support tool's job (src/support.js) and it is a filmed leg of its own.
 */
const { login } = require('./login');
const { ROLES } = require('./env');
const listing = require('./listing');
const preapp = require('./preapp');
const bo = require('./onboarding');
const app = require('./application');
const fixture = require('./fixture');
// Added 28-08-2026 for the four post-patch BackOffice legs and the patch itself.
const support = require('./support');
// 29-08-2026: so a tunnel that flaps mid-take can be WAITED OUT rather than losing
// the whole take. See the patch phase.
const vpn = require('./vpn');
const dates = require('./dates');
const exportSheet = require('./exportSheet');
const auditLog = require('./auditLog');
const fs = require('node:fs');

/**
 * The phase order, and it is the one build-fixture.js has always run.
 *
 * Eleven, not the ten a reading of the checkpoint suggests: `submit-approval` and
 * `verify-regdocs` are easy to miss because neither appears in the SRD's narrative,
 * and `dealer-link` looks like a phase but is the second half of `approve-preapp`.
 * An invented phase list grades itself against the wrong flow.
 */
const PHASES = [
  'gate',
  'preapp',
  'approve-preapp',
  'appform',
  'assign',
  'submit-approval',
  'approve-app',
  'regdocs',
  'verify-regdocs',
  'regfee',
  'record',
  // THE PATCH COMES BEFORE THE BACKOFFICE CHECKS, and the 05:33 take is why.
  //
  // It used to run in the spec AFTER runCreation returned, i.e. after bo-listing and
  // bo-detail. So those two read a record still sitting at created+90d — 90 days from
  // expiry, with the window opening 30 days before it. There was correctly no Extend
  // button, and the detail check reported "NOT showing ... that is a FINDING", which
  // was false: nothing had been patched yet.
  //
  // Ordering it here makes both checks read the state segment 2 will actually act on:
  // an in-window expiry on the listing, and the Extend control present on the detail
  // page. A check placed before the thing it checks for is not a strict check, it is
  // a wrong one.
  'patch-expiry',
  // ADDED 28-08-2026 on Charmain's instruction: "segment 1 need to include the
  // checking in bo as well, to check application listing and details page".
  //
  // `record` already reads the listing — but only through readFixtureState, which
  // returns values into a checkpoint. Nothing was ever FILMED as a BackOffice
  // verification: no row ringed on the listing, and the application DETAILS page
  // was never opened in segment 1 at all. A value in a sidecar is a claim about
  // the record; the ringed row and the sidebar are the evidence for it.
  //
  // Four phases rather than one, because they are four different claims and a take
  // that framed only one must not be able to score the others. Charmain extended the
  // set on 28-08: *"include the export and audit log checking as well"*, and *"recheck
  // listing + export, details, and audit log again after patching the expiry date"* —
  // which is why all four sit AFTER patch-expiry.
  'bo-listing',
  'bo-export',
  'bo-detail',
  'bo-audit',
];

/**
 * One checklist point per phase, and what each one PROVES.
 *
 * `caption` is what the spotlight says on camera, so it is written as a claim a
 * reviewer can check against the frame — not as a description of the click. `human`
 * marks the two gates that are genuinely not ours to pass; the runner warns on them
 * so nobody schedules an unattended segment-1 batch and walks away.
 */
/**
 * `checked` IS THE POINT OF THIS ARRAY NOW.
 *
 * Charmain, 28-08-2026, after seeing the first take: *"no need to check anything on
 * the flow, just the payment done page will do"* — with the BackOffice listing and
 * details checks from her previous instruction kept.
 *
 * So every phase still RUNS and is still on the continuous recording; `checked`
 * decides which ones are ringed, captioned and COUNTED. An unchecked leg earns no
 * trigger point, which is the honest way to narrow scope: the alternative — leaving
 * the points on the checklist and not framing them — is how a take reports 12/13
 * with six of those legs filmed over the wrong window.
 *
 * That is not hypothetical. It is what the 00:44 take did: create-approve-app's
 * caption was drawn over the dealer's Business Information form, because the
 * BackOffice contexts open BEHIND the pinned dealer window (rig-lessons.md, the
 * marker hand-over). Dropping those checks removes six false ticks; the two
 * BackOffice checks that remain get the marker handed to them instead.
 *
 * `checked` IS NOT `bo` — 28-08-2026. Narrowing the score narrowed the film too,
 * because the hand-over required `checked && bo`, so the six BackOffice flow legs
 * ran off camera entirely. They are `bo: true` now and get the marker like any other
 * BackOffice leg; they remain `checked: false` and still earn no trigger point.
 */
const LEGS = [
  // `checked: false` — and it is the FIRST thing the recording shows, which is why
  // Charmain caught it: *"no need to spotlight and highlight for the creation flow
  // right? except for the payment checking ... you see from the recording beginning it
  // shows the spotlight highlight, remove that for fixture creation flow"*.
  //
  // The film still STARTS at the gate — her 27-08 ruling that every E2E row must — it
  // simply is not ringed or counted. "Filmed from the gate" and "the gate is a trigger
  // point" are different claims, and only the first one was ever asked for.
  { key: 'create-gate', phase: 'gate', human: true, checked: false,
    caption: 'the flow starts where a real dealer starts — the public reCAPTCHA gate, not a BackOffice shortcut (R22 closed the manual route)' },
  { key: 'create-preapp', phase: 'preapp', human: true, humanAuto: 'fiuu', checked: true,
    caption: 'the RM 108.00 pre-application fee PAID — the payment-done page, Payment Status PAID, straight from the FPX simulator' },
  // `bo: true` ON EVERY BACKOFFICE LEG, CHECKED OR NOT — 28-08-2026.
  //
  // Charmain, having watched the film: *"all the action you did in BO is not
  // recorded"*. She is right, and the frames prove it: sampling the 11:51 TS3 take
  // from 95s to 245s — the span holding approve-preapp, assign, submit-approval,
  // approve-app and verify-regdocs — every frame is the DEALER window, one tab,
  // "rig: dealer" in the corner. The BackOffice work happened behind it.
  //
  // The hand-over used to be gated on `leg.checked && leg.bo`, reasoning that an
  // unchecked leg is not framed so the 2.4s hand-over "would buy nothing". That
  // confuses two different things: `checked` decides what is SCORED, `bo` decides
  // what is ON CAMERA. Her earlier ruling trimmed the score — *"no need to check
  // anything on the flow, just the payment done page will do"* — and it stands;
  // these legs stay `checked: false` and earn no point. But a flow that is filmed
  // is the whole reason the take starts at the gate, and five of its steps were
  // being performed off screen.
  //
  // The hand-BACK already exists (91-e2e-creation.spec.js, onPhaseEnd) and the
  // dealer browser is already closed after regfee, so a BackOffice leg in the
  // MIDDLE of the flow returns the camera to the dealer for the next dealer step.
  { key: 'create-approve-preapp', phase: 'approve-preapp', checked: false, bo: true,
    caption: 'BackOffice approver approves the pre-application; the generated dealer Application Link is read off the sidebar' },
  { key: 'create-appform', phase: 'appform', checked: false,
    caption: 'the dealer opens that link and completes the Application Form — Business Information, Upload Files, Acknowledgement' },
  { key: 'create-assign', phase: 'assign', checked: false, bo: true,
    caption: 'the record now has an Application No and is handed to the assignee' },
  { key: 'create-submit-approval', phase: 'submit-approval', checked: false, bo: true,
    caption: 'the assignee sets the UCD Group and submits the application for approval' },
  { key: 'create-approve-app', phase: 'approve-app', checked: false, bo: true,
    caption: 'the approver approves the application — this is the transition that gives it an expiry date at all' },
  { key: 'create-regdocs', phase: 'regdocs', checked: false,
    caption: 'the dealer submits the Registration Documents on the portal' },
  { key: 'create-verify-regdocs', phase: 'verify-regdocs', checked: false, bo: true,
    caption: 'the assignee verifies those registration documents in BackOffice' },
  { key: 'create-regfee', phase: 'regfee', human: true, humanAuto: 'fiuu', checked: true,
    caption: 'the RM 990.00 registration fee PAID — the payment-done page, Payment Status PAID; the last step before the record is a candidate for Extend' },
  // `bo: true` for the same reason as the five flow legs above — this reads the
  // finished record in BackOffice, and it ran behind the dealer window until 28-08.
  { key: 'create-record', phase: 'record', checked: false, bo: true,
    caption: 'the finished record read back: Application No, status Approved, and the expiry the build computed for it' },
  // `holdMs` — the BackOffice checks hold LONGER than the flow legs. Charmain, on the
  // 05:33 film: *"listing and details page went too fast not even showing in spotlight
  // highlight"*. These four are the only checked reads on their surfaces, so the ring
  // has to be legible; 2.2s at 15fps is ~33 frames, and a reviewer scrubbing will miss
  // it. The patch step holds longest because its caption carries the reasoning.
  // `bo: true` on the PATCH as well (28-08). Charmain: *"this time i didnt see the
  // patching process from support tool"*. Two reasons it was invisible — the patch
  // failed outright (VPN), and even on success the support tool opens its OWN browser
  // window, which sits BEHIND the pinned dealer window like every BackOffice context
  // did. It needs the camera handed to it exactly the same way.
  { key: 'create-patch-expiry', phase: 'patch-expiry', checked: true, bo: true, holdMs: 4200,
    caption: 'the expiry patched INTO the window with the support tool — a record born at the gate is 90 days out, and the window opens 30 days before expiry (REQ-003), so this is part of the flow, not setup' },
  { key: 'create-bo-listing', phase: 'bo-listing', checked: true, bo: true, holdMs: 4500,
    caption: 'BackOffice Application Listing, AFTER the patch — the EXPIRY DATE cell this record will be extended from' },
  { key: 'create-bo-export', phase: 'bo-export', checked: true, bo: true, holdMs: 4500,
    caption: 'the listing EXPORT — the same record and the same expiry date in the exported sheet, so the two surfaces agree before any extension (R14)' },
  { key: 'create-bo-detail', phase: 'bo-detail', checked: true, bo: true, holdMs: 4500,
    caption: 'the Application DETAILS page — the Extend button IS showing on it, which is what segment 2 will click' },
  { key: 'create-bo-audit', phase: 'bo-audit', checked: true, bo: true, holdMs: 4500,
    caption: 'the UCD Application Audit Log — NO [Extend] row yet. That is segment 2\'s baseline: R18 says every extension writes one, so its absence here is what makes segment 2\'s row mean something' },
];

/** The legs that earn a trigger point. Everything else runs without being counted. */
const CHECKED_LEGS = LEGS.filter((l) => l.checked);

/**
 * Read the payment-DONE page and say whether the payment actually went through.
 *
 * Charmain, 28-08-2026: *"just check on the payment done page make sure payment go
 * through and success"*. So this is an assertion, not a caption. A take that films a
 * payment page and ticks the point without reading it proves only that a page was
 * reached — and "no error appeared" is indistinguishable from a run that did nothing.
 *
 * Fail-soft on the CHECK, never on the flow: a page this cannot parse returns
 * success:false with the text it did read, so the point goes unticked WITH A REASON
 * rather than aborting a run that has already cost a reCAPTCHA tick.
 */
const PAID_RE = /payment\s*success|payment\s*status\s*:?\s*paid|\bPAID\b/i;

/**
 * A CSS selector for the Expiry Date cell of one record's row.
 *
 * The column index is READ from the header rather than assumed — this listing has
 * ~15 columns and their order has moved before. Returns null when the header cannot
 * be found, so the caller rings the row instead of a wrong cell: a ring on the wrong
 * column is worse than a loose one, because the caption still claims a date.
 */
async function expiryCellSelector(page, appNo) {
  try {
    const idx = await page.evaluate((no) => {
      const heads = [...document.querySelectorAll('table th')];
      const i = heads.findIndex((h) => /expiry/i.test(h.textContent || ''));
      if (i < 0) return null;
      const rows = [...document.querySelectorAll('table tr')];
      const r = rows.findIndex((tr) => (tr.textContent || '').includes(no));
      if (r < 0) return null;
      return { col: i + 1, row: r + 1 };
    }, appNo);
    if (!idx) return null;
    return `table tr:nth-child(${idx.row}) td:nth-child(${idx.col})`;
  } catch {
    return null;
  }
}

async function readPaymentDone(page, what) {
  // No page, or nothing page-shaped: say so as a FAILED CHECK rather than throwing.
  // A payment has already happened by the time this runs; aborting here would lose a
  // reCAPTCHA tick and two payments over a reader that could not read.
  if (!page || typeof page.evaluate !== 'function') {
    return {
      what, success: false, statusText: '', paymentId: '', paymentMethod: '',
      ringSelector: null, url: null,
      evidenceText: 'the payment-done page could not be read — no page was in scope',
    };
  }
  const text = await page.evaluate(() => document.body.innerText || '').catch(() => '');
  const grab = (re) => (re.exec(text) || [])[1] || '';
  const status = grab(/Payment\s*Status\s*:?\s*([A-Za-z ]+)/i).trim();
  return {
    what,
    success: PAID_RE.test(text),
    statusText: status,
    paymentId: grab(/Payment\s*ID\s*:?\s*(\S+)/i).trim(),
    paymentMethod: grab(/Payment\s*Method\s*:?\s*(.+)/i).trim().split('\n')[0],
    // Ring the payment panel, not the whole page: the caption claims a status, so
    // the status is what has to be circled.
    ringSelector: 'table:has-text("Payment Status"), .card:has-text("Payment Status"), div:has-text("Payment Success")',
    // Verbatim, for the sidecar — wording defects are defects and pixels are not
    // diffable.
    evidenceText: (text.match(/[^\n]*(?:Payment Success|Payment Status[^\n]*|Payment ID[^\n]*)/gi) || [])
      .slice(0, 4).map((s) => s.trim()).join('  |  '),
    url: page.url(),
  };
}

const legForPhase = (phase) => LEGS.find((l) => l.phase === phase) || null;
/** Every leg that CAN need a person — the standing worst case, not tonight's. */
const HUMAN_GATES = LEGS.filter((l) => l.human).map((l) => l.key);

/**
 * Is the Fiuu sandbox login available to type itself?
 *
 * `FIUU_SIM_USER` / `FIUU_SIM_PASS` live in the shared credential store
 * (~/.claude/secrets/eauto.env) and are hydrated into process.env by accounts.js.
 * `simulatorLogin` types them ONLY when the window's host is exactly
 * bank-simulator.fiuu.com; any other login form still pauses for a person.
 */
const simLoginAvailable = () =>
  Boolean((process.env.FIUU_SIM_USER || '').trim() && (process.env.FIUU_SIM_PASS || '').trim());

/**
 * The gates that will ACTUALLY stop for a person on this machine, right now.
 *
 * WHY THIS IS NOT JUST HUMAN_GATES.
 *
 * The runner told Charmain "THREE HUMAN GATES PER ROW ... ~12 min of your hands,
 * stay at the keyboard" on every segment-1 take. That was read off `human: true`,
 * which is a property of the LEG — what it needs in the worst case — and not of
 * the run. With the sandbox pair in the store, `payFpx` logs into the simulator
 * itself and then drives the TAC, the Approved status and Pay Now, so both
 * payments are hands-free and the reCAPTCHA is the only real gate.
 *
 * Measured on the 28-08-2026 00:44 take: Charmain ticked the reCAPTCHA and nothing
 * else; the sidecar shows create-preapp and create-regfee both captured with
 * "simulator login submitted from the shared store (FIUU_SIM_USER)" in the log.
 *
 * A warning that overstates what it needs is not harmlessly cautious — it asks a
 * person to sit through half an hour they do not have to.
 */
function humanGatesNow() {
  const auto = simLoginAvailable();
  return LEGS
    .filter((l) => l.human && !(l.humanAuto === 'fiuu' && auto))
    .map((l) => l.key);
}

/**
 * A BackOffice session for one role, closed as soon as its phase is done.
 *
 * Lifted from build-fixture.js. The one addition is `onPage`, fired after the page
 * is created and BEFORE `login` runs, so an annotator can be attached in time to
 * film the login itself. Attaching after login would miss it, and `login` is the
 * first thing a reviewer looks for to know which role did what.
 */
async function asRole(browser, roleKey, fn, hooks = {}) {
  // viewport: null, not a CSS box. These BackOffice contexts are FILMED (onPage
  // fires for all seven of them), and a hardcoded 1600x1000 renders the page 1600
  // CSS px wide inside a 1552px maximized window on this 1536x960 recorded display
  // — measured 28-08-2026 — so the right edge of every BackOffice frame is cut off
  // and the device pixel ratio is forced to 1.0. `null` follows the window, which is
  // what playwright.config.js already sets for both recording projects.
  //
  // build-fixture.js keeps its OWN copy of asRole and is NOT filmed, so this change
  // is confined to the takes.
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();
  try {
    // SECOND FENCE. runCreation already hands down a wrapped `onPage`, but this
    // function is exported and a direct caller may pass a raw one. An annotator
    // that fails to attach is a worse take; it must never be a lost fixture and
    // two Fiuu logins. Caught here so that holds however asRole is called.
    if (hooks.onPage) {
      try { await hooks.onPage(page, roleKey); } catch (err) {
        if (hooks.say) hooks.say('    onPage hook threw: ' + (err && err.message ? err.message : String(err)) +
          '  — the flow carries on; the take loses that annotation');
      }
    }
    const who = await login(page, roleKey);
    if (hooks.say) hooks.say('    logged in as ' + who.key + ' (' + who.label + ')');
    return await fn(page);
  } finally {
    await ctx.close();
  }
}

const requireUuid = (cur) => {
  if (!cur || !cur.uuid) {
    throw new Error('no application uuid on the checkpoint — run the assign or submit-approval phase first');
  }
  return cur.uuid;
};

/**
 * The Application No off the checkpoint, or a refusal naming the phase that banks it.
 *
 * `true` is checked as well as empty: writeCheckpoint has historically stored a
 * boolean for a phase that ran without learning a number, and searching the listing
 * for "true" returns nothing in a way that reads as a missing record.
 */
const requireAppNo = (cur) => {
  const n = cur && cur.applicationNo;
  if (!n || n === true) {
    throw new Error('no Application No on the checkpoint — run the assign or record phase first');
  }
  return String(n);
};

/**
 * Run the creation flow, filming it if hooks are supplied.
 *
 * Every phase is bracketed by `onPhaseStart` / `onPhaseDone`. Both are awaited, and
 * for the BackOffice phases they fire INSIDE the role context — while its page is
 * still open — because that is the only window in which it can be annotated. A hook
 * that throws must not take the flow down: a failed caption is a worse take, not a
 * lost fixture and two Fiuu logins. So hooks are wrapped, and a hook failure is
 * reported through `say` and carried in the returned `hookErrors`.
 *
 * Returns the checkpoint's final state plus what each phase reported.
 */

/**
 * WHERE SEGMENT 1 LEAVES THE EXPIRY, PER ROW.
 *
 * Added 29-08-2026. The patch used to be a flat `expiryForState('in-window')`, which
 * resolves to TODAY, and that is the wrong place for three of the four rows in this
 * batch — in two different directions:
 *
 *   - E2E_TS1 is "extended BEFORE expiry" (R3). An expiry of today is not in the
 *     future: the take may click past the stamped time of day, and by the next
 *     morning the cron has written Expired, which is E2E_TS2's case and not this one.
 *     Filming TS1 on an already-expired record evidences R4 under TS1's name.
 *   - E2E_TS2 and E2E_TS7 both assert Expired -> Approved (R16 / REQ-007), and
 *     nothing on the QA side writes Expired — the midnight cron owns the status. An
 *     expiry of today is exactly right for them, and it is right BECAUSE of the wait,
 *     not in spite of it: their segment 2 films the next morning.
 *   - E2E_TS6 must be able to spend an extension first, so it wants the same
 *     comfortable in-window position as TS1; segment 2 pushes it past the window
 *     AFTER the extension.
 *
 * A row not named here keeps the old 'in-window' behaviour, so the five gate rows
 * outside this batch are untouched.
 *
 * 15 days rather than 29 or 1: at 29 the record sits one day inside a 30-day window
 * and any clock skew between rig and server moves it out; at 1 the same skew moves it
 * past expiry. The middle is the only place neither boundary is in play.
 */
const EXPIRY_TARGET = {
  'E2E_TS1': { daysAhead: 15, why: 'R3 needs the expiry still in the FUTURE at click time' },
  'E2E_TS6': { daysAhead: 15, why: 'the extension must be possible before segment 2 pushes it past the window' },
  'E2E_TS2': { state: 'expires-today', why: 'R16 needs Expired, and only the midnight cron writes it' },
  'E2E_TS7': { state: 'expires-today', why: 'R16 needs Expired, and only the midnight cron writes it' },
};

/**
 * Resolve the expiry segment 1 should leave behind for `ref`.
 *
 * Returns `dates.expiryForState`'s shape plus `why`, so both the console and the seam
 * file can say WHICH target was used and on whose reasoning. Never throws on an
 * unknown ref: an unlisted row is not an error, it is the default.
 */
function expiryTargetFor(ref) {
  const spec = EXPIRY_TARGET[ref];
  if (!spec) {
    return { ...dates.expiryForState('in-window'), why: 'the default: in-window, which resolves to today' };
  }
  if (spec.state) return { ...dates.expiryForState(spec.state), why: spec.why };
  const when = dates.addDays(dates.today(), spec.daysAhead);
  const w = dates.windowState(dates.ymd(when));
  return {
    target: '+' + spec.daysAhead + 'd', expiry: when, ymd: dates.ymd(when),
    state: w.state, opensOn: w.opensOn, closesOn: w.closesOn,
    offsetDays: spec.daysAhead, exact: true, why: spec.why,
  };
}

async function runCreation(o) {
  const {
    browser, dealer, profile, runLabel,
    phases = PHASES,
    pay = 'fpx', bank, link: linkOpt, assigneeName,
    onPhaseStart, onPhaseDone, onPage,
    // 29-08-2026: where segment 1 leaves the expiry. The caller knows the ref, this
    // module knows the calendar — passing the RESOLVED target rather than the ref
    // keeps creation.js free of the scenario register.
    expiryTarget,
    say = () => {},
  } = o;

  if (!browser) throw new Error('runCreation needs a browser');
  if (!dealer) throw new Error('runCreation needs the long-lived dealer page (it carries the passed gate)');
  if (!profile) throw new Error('runCreation needs a fixture profile');
  if (!runLabel) throw new Error('runCreation needs a runLabel to write its checkpoint against');

  const results = {};
  const hookErrors = [];
  const done = (phase, detail) => fixture.markPhase(runLabel, phase, detail);
  const state = async () => (await fixture.readCheckpoint(runLabel)) || {};

  // A hook is film, not flow. Never let one abort the run.
  const safely = async (fn, what, page) => {
    if (!fn) return;
    try { await fn(page); } catch (err) {
      const msg = `${what} hook threw: ${err && err.message ? err.message : String(err)}`;
      hookErrors.push(msg);
      say('    ' + msg + '  — the flow carries on; the take loses that annotation');
    }
  };
  const started = (phase, page) => safely(onPhaseStart && ((p) => onPhaseStart(phase, p)), `${phase} onPhaseStart`, page);
  const finished = (phase, detail, page) =>
    safely(onPhaseDone && ((p) => onPhaseDone(phase, detail, p)), `${phase} onPhaseDone`, page);
  // FIRST FENCE, and the one that books the failure. Wrapped HERE rather than at the
  // call site because this is where `hookErrors` lives — a hook that fails silently
  // inside asRole would leave the sidecar claiming an annotation it never painted.
  const roleHooks = {
    say,
    onPage: onPage
      ? (page, roleKey) => safely(() => onPage(page, roleKey), `onPage(${String(roleKey)})`, page)
      : undefined,
  };

  for (const phase of phases) {
    if (!PHASES.includes(phase)) {
      throw new Error('unknown phase "' + phase + '" — known: ' + PHASES.join(', '));
    }
    const cur = await state();

    if (phase === 'gate') {
      await started(phase, dealer);
      const gate = await preapp.passGate(dealer);
      results.gate = gate;
      await done('gate', gate);
      await finished(phase, gate, dealer);

    } else if (phase === 'preapp') {
      await started(phase, dealer);
      await preapp.fillPreApplicationForm(dealer, profile);
      const res = await preapp.reviewAndPay(dealer, profile, { method: pay, bank });
      await fixture.writeCheckpoint(runLabel, { preAppUuid: res.uuid });
      // The CHECK is the payment-done page, read rather than assumed.
      const paid = await readPaymentDone(dealer, 'RM 108.00 pre-application fee');
      say(`    payment-done page: success=${paid.success} status="${paid.statusText}" id=${paid.paymentId}`);
      results.preapp = { preAppUuid: res.uuid, payment: paid };
      await done('preapp', results.preapp);
      await finished(phase, { ...paid, preAppUuid: res.uuid }, dealer);

    } else if (phase === 'approve-preapp') {
      const out = await asRole(browser, ROLES.approver, async (page) => {
        await started(phase, page);
        const found = await bo.openPreApplication(page, profile.businessName);
        // found.page: View opens a NEW TAB, so Approve lives there, not on `page`.
        // The annotator has to follow it or the approval is filmed on a dead tab.
        if (found.page && found.page !== page) await safely(onPage && ((p) => onPage(p, ROLES.approver)), 'approve-preapp onPage(view tab)', found.page);
        const approved = await bo.approvePreApplication(found.page);
        const detail = { preAppUuid: found.uuid, link: approved.link };
        await finished(phase, detail, found.page || page);
        return detail;
      }, roleHooks);
      await fixture.writeCheckpoint(runLabel, { preAppUuid: out.preAppUuid, dealerLink: out.link });
      results['approve-preapp'] = out;
      await done('approve-preapp', out);

    } else if (phase === 'appform') {
      const link = cur.dealerLink || linkOpt || null;
      if (!link) throw new Error('no dealer link on the checkpoint — rerun the approve-preapp phase, or pass link');
      await started(phase, dealer);
      await preapp.fillApplicationForm(dealer, profile, link);
      results.appform = {};
      await done('appform', {});
      await finished(phase, {}, dealer);

    } else if (phase === 'assign') {
      // The approver hands the record to the assignee BEFORE the assignee ever
      // opens it. This is also where the run first learns its Application No and
      // uuid, so they go straight onto the checkpoint — see the warning below.
      const out = await asRole(browser, ROLES.approver, async (page) => {
        await started(phase, page);
        const row = await listing.findByCompanyName(page, profile.businessName);
        say('    application no: ' + row.applicationNo);
        const uuid = await listing.openApplication(page, row.applicationNo);

        // Save the identity BEFORE attempting the assignment. Learning the
        // Application No is the half of this phase that cannot be redone cheaply,
        // and on the 26-08 build it was thrown away: the assignment failed, the
        // checkpoint was never written, and a resume had to re-find a record it
        // had already found.
        await fixture.writeCheckpoint(runLabel, { applicationNo: row.applicationNo, uuid });

        const assigned = await bo.assignApplication(page, uuid, assigneeName);
        const detail = { applicationNo: row.applicationNo, uuid, assigned: assigned?.assigned !== false };
        await finished(phase, detail, page);
        return detail;
      }, roleHooks);
      await fixture.writeCheckpoint(runLabel, out);
      if (!out.assigned) {
        say('    the Assignee dropdown is not offered this early — the approve-app phase retries it');
      }
      results.assign = out;
      await done('assign', out);

    } else if (phase === 'submit-approval') {
      const out = await asRole(browser, ROLES.assignee, async (page) => {
        await started(phase, page);
        let { applicationNo, uuid } = cur;
        if (!uuid) {
          const row = await listing.findByCompanyName(page, profile.businessName);
          applicationNo = row.applicationNo;
          uuid = await listing.openApplication(page, applicationNo);
        }
        say('    application no: ' + applicationNo);
        await bo.setUcdGroupAndSubmit(page, uuid, profile.ucdGroup);
        const detail = { applicationNo, uuid };
        await finished(phase, detail, page);
        return detail;
      }, roleHooks);
      await fixture.writeCheckpoint(runLabel, out);
      results['submit-approval'] = out;
      await done('submit-approval', out);

    } else if (phase === 'approve-app') {
      const uuid = requireUuid(cur);
      const out = await asRole(browser, ROLES.approver, async (page) => {
        await started(phase, page);
        await bo.approveApplication(page, uuid);
        // Second bite at the assignment. The dropdown is not rendered on a freshly
        // submitted record, so the assign phase may have deferred; by Approved it
        // is there. A fixture left unassigned is still usable for most cases but
        // useless for the ones that read the sidebar's Assignee row (TS41).
        let detail = {};
        if (cur.assigned === false) {
          const retry = await bo.assignApplication(page, uuid, assigneeName);
          detail = { assigned: retry?.assigned !== false };
        }
        await finished(phase, detail, page);
        return detail;
      }, roleHooks);
      await fixture.writeCheckpoint(runLabel, out);
      results['approve-app'] = out;
      await done('approve-app', out);

    } else if (phase === 'regdocs') {
      await started(phase, dealer);
      await preapp.submitRegistrationDocs(dealer, profile, cur.dealerLink);
      results.regdocs = {};
      await done('regdocs', {});
      await finished(phase, {}, dealer);

    } else if (phase === 'verify-regdocs') {
      const uuid = requireUuid(cur);
      await asRole(browser, ROLES.assignee, async (page) => {
        await started(phase, page);
        await bo.verifyRegistrationDocs(page, uuid);
        await finished(phase, {}, page);
      }, roleHooks);
      results['verify-regdocs'] = {};
      await done('verify-regdocs', {});

    } else if (phase === 'regfee') {
      await started(phase, dealer);
      const how = await preapp.payRegistrationFee(dealer, cur.dealerLink, { method: pay, bank });
      const paidReg = await readPaymentDone(dealer, 'RM 990.00 registration fee');
      say(`    payment-done page: success=${paidReg.success} status="${paidReg.statusText}" id=${paidReg.paymentId}`);
      results.regfee = { how, payment: paidReg };
      await done('regfee', { how });
      await finished(phase, { ...paidReg, how }, dealer);

    } else if (phase === 'record') {
      const cur2 = await state();
      const result = await asRole(browser, ROLES.assignee, async (page) => {
        await started(phase, page);
        // The application number is normally learned in submit-approval. If that
        // phase was skipped, fall back to the run-stamped company name rather than
        // searching the listing for an empty string.
        let appNo = cur2.applicationNo || '';
        if (!appNo || appNo === true) {
          const row = await listing.findByCompanyName(page, profile.businessName);
          appNo = row.applicationNo;
          say('    application no (found by company name): ' + appNo);
        }
        const read = await bo.readFixtureState(page, appNo);
        await finished(phase, read, page);
        return read;
      }, roleHooks);
      await fixture.writeCheckpoint(runLabel, { result, applicationNo: result.applicationNo });
      results.record = result;
      await done('record', {});

    } else if (phase === 'patch-expiry') {
      // MOVED HERE FROM THE SPEC, 28-08-2026, so it happens BEFORE the four BackOffice
      // reads. It is a leg, not a precondition: a record born at the gate is out of
      // window by construction, and every surface below is meaningless until it is in.
      const appNo = requireAppNo(await state());
      const want = expiryTarget || dates.expiryForState('in-window');
      if (!want || !want.ymd) throw new Error('no usable expiry target for the patch phase');
      say('    expiry target: ' + want.ymd + ' (' + (want.target || 'in-window') + ', state ' + want.state + ')' +
          (want.why ? ' — ' + want.why : ''));
      const wantDate = new Date(want.expiry || `${want.ymd}T00:00:00`);

      // ONE RETRY, AND ONLY AFTER CLEARING THE CACHED SESSION.
      //
      // A dead support session does not announce itself: the portal redirects to
      // /session-expired and the wizard's first field never appears, so it surfaces as
      // `locator.fill: Timeout 20000ms exceeded` on #applicationNumber — which reads
      // like a broken selector. It killed the patch on the 05:33 take even though the
      // readiness check had found the session alive seven minutes earlier. support.js
      // signs in fresh when there is no cached state, so deleting the file IS the fix.
      const attempt = async () => {
        const toolCtx = await support.context(browser);
        const toolPage = await toolCtx.newPage();
        await safely(onPage && ((p) => onPage(p, 'support-tool')), 'patch-expiry onPage', toolPage);
        await started(phase, toolPage);
        try {
          const out = await support.setExpiry(toolPage, { applicationNo: appNo, date: wantDate });
          return { ok: true, out, toolCtx, toolPage };
        } catch (err) {
          return { ok: false, err, toolCtx, toolPage };
        }
      };

      let res = await attempt();

      // A FLAPPING TUNNEL IS WORTH WAITING FOR — added 29-08-2026, having lost a take
      // to one that afternoon.
      //
      // The pre-flight VPN gate is a point in time: on the 18:38 take it answered 5 of
      // 5 probes at launch and was dead fifteen minutes later, when the patch phase ran.
      // The take reached this line having already spent a reCAPTCHA tick, both Fiuu
      // logins and half an hour of filming, and threw all of it away over a tunnel that
      // is typically back inside a minute.
      //
      // So: when the failure is VPN-SHAPED, poll until the tool answers and try again.
      // Two minutes of waiting against thirty minutes of film and a person's hands is
      // not a close call. It is deliberately NOT folded into the dead-session retry
      // below — that one clears the cached sign-in, which is exactly the wrong response
      // to an unreachable host, and doing both would sign out for no reason.
      //
      // ETIMEDOUT is not matched by /Timeout/i (the string is TIMEDOUT), which is why
      // this shape fell through to "no retry" before.
      const vpnShaped = (err) => /not reachable|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|ECONNREFUSED|VPN is not connected/i
        .test(String(err && err.message));
      if (!res.ok && vpnShaped(res.err)) {
        const { host, port } = support.target();
        say('    the patch failed in the shape of a DOWN TUNNEL — waiting for ' + host + ':' + port +
            ' rather than losing this take. Up to 150s.');
        await res.toolCtx.close().catch(() => {});
        const until = Date.now() + 150_000;
        let back = false;
        while (Date.now() < until) {
          await new Promise((f) => setTimeout(f, 5_000));
          // A BURST, NOT ONE PING. A freshly reconnected tunnel answers once and then
          // drops, and a single successful probe is exactly how the pre-flight gate
          // came to certify a tunnel that died fifteen minutes later.
          let okCount = 0;
          for (let i = 0; i < 3; i += 1) {
            if ((await vpn.probe(host, port, 3_000)).ok) okCount += 1;
            if (i < 2) await new Promise((f) => setTimeout(f, 800));
          }
          if (okCount === 3) { back = true; break; }
        }
        if (back) {
          say('    the tunnel is back and answered 3 of 3 — retrying the patch');
          res = await attempt();
        } else {
          say('    the tunnel did not come back within 150s. The patch stays failed, and the ' +
              'four BackOffice reads after it will refuse their points rather than describe an ' +
              'unpatched record as though it had been patched.');
        }
      }

      if (!res.ok && /session|Timeout|applicationNumber/i.test(String(res.err && res.err.message))) {
        say('    the patch failed in the shape of a DEAD SESSION — clearing the cached ' +
            'sign-in and signing in fresh (once)');
        await res.toolCtx.close().catch(() => {});
        try { fs.rmSync(support.AUTH_FILE, { force: true }); } catch { /* nothing cached */ }
        res = await attempt();
      }

      const detail = res.ok
        ? {
          patchedTo: want.ymd,
          // The TARGET is evidence, not a run detail: "patched to 2026-08-29" says
          // nothing about whether that was the right place for this row, and the seam
          // file is read by a segment 2 that may run the next day.
          patchTarget: want.target || 'in-window',
          patchState: want.state || null,
          patchWhy: want.why || null,
          toolSaid: (res.out && res.out.message) || null,
          // The banner is not evidence — read the expiry back off the listing later.
          // That is what bo-listing is for, and it is why it runs next.
          ringSelector: 'form, .card, .panel, main',
        }
        : {
          patchedTo: null,
          patchFailed: String(res.err && res.err.message).split('\n')[0].slice(0, 200),
          ringSelector: null,
        };
      if (res.ok) {
        say(`    expiry patched -> ${want.ymd}; tool said ${JSON.stringify(detail.toolSaid)}`);
      } else {
        say(`    PATCH FAILED: ${detail.patchFailed}`);
      }
      await finished(phase, detail, res.toolPage);
      await res.toolCtx.close().catch(() => {});
      results['patch-expiry'] = detail;
      await done('patch-expiry', detail);

    } else if (phase === 'bo-listing') {
      // THE LISTING, FILMED. `record` above reads the same row, but it reads it into
      // a checkpoint — nothing was ringed and nothing was on camera. This phase's
      // job is the picture: the row found the way a person finds it, with the cells
      // the extension turns on named in the caption.
      const appNo = requireAppNo(await state());
      const out = await asRole(browser, ROLES.assignee, async (page) => {
        await started(phase, page);
        const row = await listing.findByApplicationNo(page, appNo);
        const { raw } = await listing.expiry(page, appNo);
        // THE EXPIRY DATE IS THE CHECK (Charmain, 28-08: *"listing need to check the
        // expiry date"*). It is also the one cell that was not in shot: the Expiry
        // Date column sits off the right edge of the listing behind a horizontal
        // scrollbar, so the 01:06 frame ringed nothing and showed no date. Ring the
        // CELL and let the recorder scroll it into view.
        const detail = {
          applicationNo: row.applicationNo,
          applicationStatus: row.applicationStatus,
          hardcopyAccCreated: row.hardcopyAccCreated,
          expiryRaw: raw,
          expiryPresent: Boolean(raw && raw.trim() && raw.trim() !== '-'),
          // RING THE CELL **AND ITS HEADER**, the way the other scenarios do it.
          // Charmain, 28-08: *"can you do it like other ts? eg ts54"*. listing.js already
          // has the helper and its docstring is the whole argument: *"A highlighted value
          // with its column title scrolled out of frame names no field"*. A lone amber
          // cell reading "2026-08-28 06:05" in a 15-column table does not tell a reviewer
          // it is the EXPIRY — the header does.
          ringUnion: 'expiryDate',
          ringSelector: await expiryCellSelector(page, appNo),
        };
        say(`    listing row: ${appNo}  status=${row.applicationStatus}  hardcopy=${row.hardcopyAccCreated}`);
        say(`    EXPIRY DATE cell: "${raw || '(empty)'}"  ring=${detail.ringSelector || '(cell not located)'}`);
        await finished(phase, detail, page);
        return detail;
      }, roleHooks);
      results['bo-listing'] = out;
      await done('bo-listing', out);

    } else if (phase === 'bo-export') {
      // THE EXPORT, as its own surface. R14's two-sided sweep is what segment 2 will
      // assert on; this establishes the BEFORE reading on the same record, so that
      // sweep is a comparison rather than a single end-of-run snapshot.
      const appNo = requireAppNo(await state());
      const out = await asRole(browser, ROLES.assignee, async (page) => {
        await started(phase, page);
        // No remark to look for — nothing has been extended — so the sweep is asked
        // for the record and its expiry only. `sweep` re-runs the same search the
        // listing leg used, which is the rule: re-find the record the way you found it.
        // The listing must be SEARCHED to this record first: the export posts the
        // search form, so exporting from an unsearched listing exports everything and
        // the row is a needle in 50-odd records. Same search the listing leg used.
        await listing.findByApplicationNo(page, appNo).catch(() => null);

        const listed = results['bo-listing'] || {};
        let parsed = null;
        let file = null;
        let err = null;
        try {
          const sheet = await exportSheet.read(page);
          parsed = (sheet.records || []).find((r) =>
            String(r['Application No'] || r.applicationNo || '').trim() === appNo) || null;
          // Write the workbook to disk NEXT TO THE FILM, because the file itself is
          // the evidence and the spec opens it in Excel on camera. Charmain, 28-08:
          // *"same for the excel file you didnt even open it, should open and show the
          // expiry column"* — a parsed row in a sidecar is a claim ABOUT the export;
          // the workbook, opened, is the export.
          const dl = await exportSheet.download(page);
          const dir = process.env.EV_EXPORT_DIR || '.';
          file = require('node:path').join(dir, `export-${appNo}-${Date.now()}.xlsx`);
          fs.writeFileSync(file, dl.body);
        } catch (e) {
          err = String(e && e.message).split('\n')[0].slice(0, 200);
        }

        const exportedExpiry = parsed
          ? String(parsed['Application Expiry Date'] || parsed['Expiry Date'] || '')
          : '';
        const detail = {
          exportReached: !err,
          exportError: err,
          rowFound: Boolean(parsed),
          exportedExpiry,
          listingExpiry: listed.expiryRaw || null,
          // Say which half came from where. Two surfaces compared is the point; one
          // surface reported twice is the failure it is easy to mistake for agreement.
          agreesWithListing: parsed && listed.expiryRaw
            ? String(exportedExpiry).slice(0, 10) === String(listed.expiryRaw).slice(0, 10)
            : null,
          // Handed to the spec, which owns the marker choreography and opens this in
          // Excel. Desktop-window handling does not belong in a flow module.
          file,
          fingerprint: {
            'Application No': appNo,
            'Company Name': (parsed && parsed['Company Name']) || profile.businessName || '',
          },
          flagColumn: 'Application Expiry Date',
          ringSelector: 'a:has-text("Export"), button:has-text("Export")',
        };
        say(`    export: reached=${detail.exportReached} row=${detail.rowFound} ` +
            `expiry="${exportedExpiry || '(not read)'}" vs listing "${detail.listingExpiry || '?'}"` +
            (err ? `  error=${err}` : `  file=${file}`));
        await finished(phase, detail, page);
        return detail;
      }, roleHooks);
      results['bo-export'] = out;
      await done('bo-export', out);

    } else if (phase === 'bo-audit') {
      // THE AUDIT LOG, as segment 2's baseline. R18: every extension writes one row
      // carrying [Extend] / old / new. Segment 1 extends nothing, so the CORRECT
      // reading here is NO such row — and an absence is only evidence if the same run
      // shows the check could have found a presence, which is why the row count and
      // the search window are both reported rather than just the verdict.
      const cur3 = await state();
      const appNo = requireAppNo(cur3);
      const out = await asRole(browser, ROLES.approver, async (page) => {
        await started(phase, page);
        const found = await auditLog
          .searchOnScreen(page, { companyName: profile.businessName, days: 2 })
          .catch((e) => ({ error: String(e && e.message) }));
        const rows = (found && found.rows) || [];
        const extendRows = rows.filter((r) => /\bextend\b/i.test(JSON.stringify(r)));
        const detail = {
          auditReached: Boolean(found && !found.error),
          auditError: (found && found.error) || null,
          rowsReturned: rows.length,
          extendRows: extendRows.length,
          // The positive control for an absence: the search DID come back with rows
          // for this record, so "no Extend row" is a reading and not an empty page.
          couldHaveSeenOne: rows.length > 0,
          applicationNo: appNo,
          ringSelector: 'table, .table-responsive, main',
        };
        say(`    audit log: reached=${detail.auditReached} rows=${rows.length} ` +
            `extend-rows=${extendRows.length} (expected 0 — segment 1 extends nothing)`);
        await finished(phase, detail, page);
        return detail;
      }, roleHooks);
      results['bo-audit'] = out;
      await done('bo-audit', out);

    } else if (phase === 'bo-detail') {
      // THE DETAILS PAGE. Segment 1 had never opened it, which matters more than the
      // listing: this is the page the Extend control lives on, so it is the page
      // segment 2 will act on. Filming it here is what makes segment 2's "before"
      // state a comparison rather than an assertion about an unseen page.
      const appNo = requireAppNo(await state());
      const out = await asRole(browser, ROLES.assignee, async (page) => {
        await started(phase, page);
        // openApplication finds the row, clicks Edit, takes the uuid off the popup
        // and CLOSES it — so `page` is still the LISTING when it returns, and every
        // other caller in this rig navigates by uuid afterwards. Skipping that step
        // is how the 01:06 take read the listing's own filter panel and reported the
        // sidebar status as "All", which is the default option of a <select>.
        const uuid = await listing.openApplication(page, appNo);
        await app.goto(page, uuid).catch(() => {});

        // THE URL MUST CARRY THE UUID. assertRealApplication cannot settle this by
        // itself: it keys on whichView(), which answers 'backoffice' for the LISTING
        // as well, because the listing's filter panel also carries an
        // "Application No:" label. So the guard that exists to catch "you are not on
        // an application page" is blind to the one page most likely to be underneath.
        const landedOnDetail = Boolean(uuid) && page.url().includes(uuid);
        if (!landedOnDetail) {
          const detail = {
            landedOnDetail: false, uuid: uuid || null, url: page.url(),
            ringSelector: null,
          };
          say(`    NOT on the details page — url=${page.url()} uuid=${uuid || '(none)'}`);
          await finished(phase, detail, page);
          return detail;
        }
        // Fails loudly on a BackOffice-generated stub — a page with no
        // "Application No:" sidebar can never render an Extend control (R19).
        await app.assertRealApplication(page, uuid);
        const side = await app.readSidebar(page);
        // IS THE EXTEND BUTTON SHOWING? That is the whole check on this page
        // (Charmain, 28-08). The record has just been patched INTO the window, is
        // Approved and is not Registered, so `offered` is the expected reading and an
        // absence is a finding rather than a fixture problem — which is exactly the
        // shape of EAINT-12235.
        const ctl = await app.extendState(page).catch((e) => ({ error: String(e && e.message) }));
        const showing = Boolean(ctl && ctl.present && ctl.inDom);
        const detail = {
          applicationNo: side.applicationNo,
          applicationStatus: side.applicationStatus,
          hardcopyDoc: side.hardcopyDoc,
          assignee: side.assignee,
          landedOnDetail: true,
          uuid,
          url: page.url(),
          extendShowing: showing,
          extendEnabled: Boolean(ctl && ctl.enabled),
          extendWhy: showing
            ? null
            : `present=${ctl && ctl.present} inDom=${ctl && ctl.inDom} enabled=${ctl && ctl.enabled}` +
              (ctl && ctl.error ? ` error=${ctl.error}` : ''),
          // Ring the control itself when it is there; the sidebar when it is not, so
          // the frame shows WHERE it should have been.
          ringSelector: showing
            ? 'span.extend-wrap, button:has-text("Extend"), a:has-text("Extend")'
            : 'div:has-text("Application Status:")',
        };
        say(`    detail page: ${side.applicationNo}  status=${side.applicationStatus}  url=${page.url()}`);
        say(`    EXTEND BUTTON showing=${showing} enabled=${detail.extendEnabled}` +
            (showing ? '' : `  <- ${detail.extendWhy}`));
        await finished(phase, detail, page);
        return detail;
      }, roleHooks);
      results['bo-detail'] = out;
      await done('bo-detail', out);
    }
  }

  const final = await state();
  return { ...final, phases: results, hookErrors };
}

module.exports = {
  PHASES, LEGS, HUMAN_GATES, humanGatesNow, simLoginAvailable, legForPhase, runCreation, asRole,
  expiryTargetFor, EXPIRY_TARGET,
};
