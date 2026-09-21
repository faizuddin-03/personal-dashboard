/**
 * Dealer Application detail page — Pre-Application | Application | Registration
 * Documents, with the action sidebar on the right.
 *
 * Extend lives in that sidebar, on the Registration Documents tab, beside the
 * Application Status label (C4 / Q11, settled by the 23-08-2026 walkthrough —
 * NOT in the page header, which carries Create Account).
 *
 * MODAL SELECTORS ARE GROUND TRUTH as of the 25-08-2026 discover run against
 * NA68001099 (discovery/05-extend-modal.json + the page's own JS):
 *   button   #extend-application-btn (.extend-btn)
 *   dialog   jQuery UI: .ui-dialog wrapping #extend-dialog — the Cancel/Confirm
 *            buttons live in the WRAPPER's buttonpane, not inside #extend-dialog
 *   remark   textarea#extend-remarks, maxlength 3000, no placeholder, no
 *            required attr — the mandatory rule is client-side JS
 *            (#extend-remarks-error + .invalid-marker on an empty .trim())
 *   endpoint POST {contextPath}admin/form/extend, FormData {uuid, remarks};
 *            success reloads the page; error closes the modal and opens a
 *            custom "Unable to proceed" dialog with the server's message
 *   quirks   closeOnEscape: false (Esc is dead by design); jQuery UI emits a
 *            .ui-dialog-titlebar-close button but the dialog ships it
 *            style="display:none" — it MATCHES Figma, and the 25-08 "× parity
 *            delta" was the harness reading the DOM instead of the screen
 *
 * THE BUTTON HAS THREE LEGAL RENDERINGS (R11, ruled and then corrected on
 * 26-08-2026 -- read the whole block, an intermediate version of it was wrong):
 *
 *   enabled — never extended, AND status in {Approved, Expired}, AND Hardcopy &
 *             Acc Created != Registered, AND inside the window (expiry - 30d ..
 *             expiry + 3 calendar months), AND the registration-documents stage
 *             was reached, AND the user is not one of REQ-004's eighteen;
 *   greyed  — already extended, AND status in {Approved, Expired}, AND Hardcopy
 *             & Acc Created != Registered. The WINDOW DOES NOT APPLY here: a
 *             spent extension leaves the window nothing to govern, so the greyed
 *             button persists past expiry + 3 months;
 *   absent  — anything else.
 *
 * THE STATUS TEST IS A TWO-VALUE WHITELIST. Charmain, 26-08: "should hide the
 * button when application status is not approved or expired, or hardcopy doc is
 * registered". Approved or Expired keeps the button; Pending / KIV / Rejected /
 * Draft / Submitted hide it. Registered hides it regardless of status.
 *
 * SO EXPIRED DOES *NOT* REMOVE THE GREYED BUTTON. An earlier version of this
 * comment said it did, from over-reading "if updated to other status then only
 * hide it, like application status expired". Expired is not one of the removing
 * statuses -- it is one of the two keeping ones, and it is the status the
 * after-window is SUPPOSED to show. An extended application that has since
 * expired shows greyed + the once-only message (TS07, E2E_TS4, E2E_TS6).
 *
 * Consequence worth knowing when reading a result: on an Expired record the
 * rendering reports the history. Never extended + inside the window -> enabled.
 * Already extended -> greyed. Absence on an extended, non-Registered record
 * whose status is Approved or Expired is a DEFECT.
 *
 * So visible-vs-hidden and enabled-vs-greyed are different questions and
 * extendState() answers them separately. It REPORTS all three; nothing in here
 * asserts which is legal, because that depends on fixture state the reader
 * knows and this function does not.
 */
const { OBS } = require('./env');
const { gotoObs } = require('./obs');

const TAB = { pre: 'Pre-Application', app: 'Application', regDocs: 'Registration Documents' };

/**
 * The sidebar panel that holds Application No / Assignee / Status / Extend.
 * Requiring BOTH labels picks the real container — the narrower "^Application
 * No:" filter landed on an inner div whose innerText missed the status rows
 * (seen on the 25-08 discover run).
 */
const sidebar = (page) =>
  page.locator('div')
    .filter({ hasText: /Application No:/ })
    .filter({ hasText: /Application Status:/ })
    .last();

/**
 * TWO DIFFERENT PAGES answer these routes, and only one of them can host Extend.
 *
 *  - the **BackOffice view**: tab bar, the record header, and the right sidebar
 *    carrying "Application No:", Application Status and the Extend button;
 *  - the **dealer view**: the plain "eAuto Application Form" with every field
 *    disabled and no sidebar whatsoever. That is what an early-status record
 *    (Draft, Rejected) opens into — seen 25-08 on TS02, where waiting for a
 *    sidebar that was never coming read as a 20-second hang.
 *
 * Extend can only ever render in the BackOffice view, so "dealer view" means
 * the case is out of scope, not that a button went missing.
 *
 * NAMING WARNING (26-08-2026). 'dealer' is the historical label and it is a
 * MISNOMER for the commonest way of hitting it. A BackOffice user opening a
 * BackOffice-generated STUB -- a record made from the UCD New Application panel
 * whose dealer link was never followed -- gets this same plain form, because the
 * record never progressed, not because anyone is logged in wrong. That is R19,
 * and NA68001100 is the example. Reading 'dealer' as "wrong session" has already
 * cost one round of confusion (Q30).
 *
 * Either way the consequence is the same and it is why the distinction matters:
 * no sidebar means no Extend, ever, so such a record is NOT A VALID FIXTURE for
 * any scenario in this CR. Use assertRealApplication() to fail loudly on one
 * instead of quietly reporting "no Extend button" and letting a reader conclude
 * the build is broken.
 */
async function whichView(page, timeout = 20_000, opts = {}) {
  const sidebarLabel = page.getByText(/Application No:/).first();
  const dealerForm = page.getByText(/eAuto Application Form/i).first();
  try {
    await sidebarLabel.or(dealerForm).waitFor({ timeout });
  } catch (err) {
    // THE THIRD OUTCOME, added 27-08-2026 night.
    //
    // This function was written believing every record renders one of two markers.
    // A BackOffice-generated stub (R19) renders NEITHER, and the measured cost of
    // that assumption is on record: TS51 on NA68001100 died here on a 20s timeout
    // at the exact moment it reached its own subject — 5/15 — because the missing
    // sidebar it exists to evidence is also the thing the wait was waiting for.
    //
    // A case whose subject is an ABSENCE cannot be gated on the presence of a
    // marker. So callers who are prepared for it may ask for 'neither' back and
    // film what is actually there. Everyone else still gets the throw, because for
    // them a record with no sidebar really is an invalid fixture.
    if (!opts.allowNeither) throw err;
    return 'neither';
  }
  return (await sidebarLabel.count()) ? 'backoffice' : 'dealer';
}

/**
 * What markers does this page ACTUALLY carry? For the sidecar, when whichView()
 * comes back 'neither' and somebody has to be able to tell a stub apart from a
 * timeout, a redirect, or an error page — without re-running an expensive take.
 *
 * Deliberately cheap and deliberately non-throwing: it runs on a page that has
 * already disappointed us once.
 */
async function describePage(page) {
  const read = async (fn, fallback = null) => { try { return await fn(); } catch { return fallback; } };
  return {
    url: await read(() => page.url(), ''),
    title: await read(() => page.title(), ''),
    hasSidebarLabel: await read(async () => (await page.getByText(/Application No:/).count()) > 0, null),
    hasDealerForm: await read(async () => (await page.getByText(/eAuto Application Form/i).count()) > 0, null),
    headings: await read(async () =>
      (await page.locator('h1, h2, h3, .panel-title, legend').allInnerTexts())
        .map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 8), []),
  };
}

/**
 * Refuse to test on a record that can never host an Extend button (R19).
 *
 * Charmain, 26-08-2026: "make sure all the ts dont test with those trasanction".
 * The failure mode this prevents is not a crash -- it is a scenario that runs
 * green-ish on a stub, reports "no Extend button", and gets read as a defect in
 * the feature. Which is exactly what happened before R19 was written down.
 *
 * Call it after goto() in any case whose subject is the button. TS51 is the one
 * case that WANTS a stub, so it deliberately does not call this.
 */
async function assertRealApplication(page, uuid) {
  if ((await whichView(page)) === 'backoffice') return true;
  throw new Error(
    'not a valid fixture for this CR (R19): ' + (uuid || page.url()) +
    '\n    The page rendered the plain "eAuto Application Form" with no "Application No:" sidebar,' +
    '\n    so it never progressed past BackOffice generation and can never host an Extend button.' +
    '\n    This is a STUB, not a defect. Build a fixture that reaches the registration-documents' +
    '\n    stage, or if you meant to test stubs, that is TS51.'
  );
}

/**
 * Land on a tab of the detail page, and report what it actually reached: which
 * tab, and which of the two views. An application whose registration documents
 * were never submitted answers the regdocs route with 404, so this falls back to
 * the Application tab and says so rather than failing (25-08 run, TS01).
 */
async function goto(page, uuid, tab = TAB.regDocs, opts = {}) {
  // `allowNeither` is passed straight through to whichView(). TS51's subject is a
  // record with no sidebar AND no dealer form (R19), so for that one case a view of
  // 'neither' is the finding rather than a failure — see whichView().
  const url = tab === TAB.regDocs ? OBS.registrationDocs(uuid) : OBS.applicationEdit(uuid);
  // A page that will never paint either marker should not cost the full 20s twice.
  const wait = opts.allowNeither ? (opts.timeout ?? 8_000) : (opts.timeout ?? 20_000);
  const look = async () => whichView(page, wait, opts);
  try {
    await gotoObs(page, url);
  } catch (err) {
    if (err.code === 'OBS_NOT_FOUND' && tab === TAB.regDocs) {
      await gotoObs(page, OBS.applicationEdit(uuid));
      return { tab: TAB.app, fellBack: true, view: await look(), url: page.url() };
    }
    throw err;
  }
  return { tab, fellBack: false, view: await look(), url: page.url() };
}

/**
 * Click a tab in the tab bar.
 *
 * Names must be EXACT: "Application" otherwise matches "Pre-Application" too,
 * and .first() then picks the active tab, whose href is "#" and whose parent
 * div swallows the pointer — a 20 s timeout that reads like a broken tab bar
 * (25-08 run, TS18). The links are script-driven, so an intercepted click falls
 * back to dispatching the event at the right element.
 */
async function openTab(page, tab) {
  const link = page
    .getByRole('tab', { name: tab, exact: true })
    .or(page.getByRole('link', { name: tab, exact: true }))
    .first();
  await link.click({ timeout: 10_000 }).catch(() => link.dispatchEvent('click'));
  await page.waitForLoadState('domcontentloaded');
}

/** Read the sidebar as plain values. Labels are the on-screen text. */
async function readSidebar(page) {
  const text = await sidebar(page).innerText();
  const after = (label) => {
    const re = new RegExp(`${label}\\s*:?\\s*\\n+\\s*(.+)`, 'i');
    const m = re.exec(text);
    return m ? m[1].trim() : '';
  };
  return {
    applicationNo: (/Application No:\s*(\S+)/i.exec(text) || [])[1] || '',
    assignee: await selectedLabel(page, '#assigneeUserId'),
    applicationStatus: after('Application Status'),
    regDocsSubmittedAt: after('Registration Documents Submission Date'),
    regDocsVerifiedAt: after('Registration Documents Verification Date'),
    hardcopyDoc: await selectedLabel(page, '#hardcopyStatus'),
    raw: text,
  };
}

/* ===================================================================== *
 * THE SIDEBAR'S "Application Extended Remarks:" ROW
 *
 * Added 28-08-2026 on Charmain's instruction: *"all ts that click and confirm
 * the extend, should include Application Extended Remarks: field value checking
 * in the details page rightsidebar"*, and then *"all non extend ts also need to
 * include but to check the field is not showing"*.
 *
 * Until now this row existed in the rig only as a BOOLEAN — five scripts test
 * `/Application Extended Remarks/i` against the sidebar text to decide whether a
 * record has ever been extended. Not one of them read the VALUE, so no take ever
 * checked that the remark the user typed is the remark the record shows back on
 * the surface it lives on. (TS11's `readback` is the single exception, and it is
 * one scenario.)
 *
 * THREE THINGS THIS FUNCTION REFUSES TO DO, each because the rig has already
 * been bitten by the alternative:
 *
 * 1. IT NEVER READS FROM `body`. The Spotlight overlay is appended to
 *    document.documentElement and its caption will contain the words
 *    "Application Extended Remarks" the moment a take captions this point — so a
 *    body-scoped read would match the recorder's own annotation and report a row
 *    that is not on the page. That exact fault failed TS51 six times over three
 *    takes on `Application No:`. The read is scoped to the sidebar container and
 *    nowhere else.
 *
 * 2. IT NEVER RETURNS A LABEL AS A VALUE. innerText puts each sidebar row on its
 *    own line and an EMPTY row is followed directly by the NEXT row's label, so
 *    the obvious `/label\s*:?\s*\n?([^\n]*)/` returns "Application Status:" as
 *    the remark. Present-and-empty and present-with-a-value are different
 *    findings; a reader that cannot tell them apart cannot report either.
 *
 * 3. IT NEVER LETS AN UNREADABLE SIDEBAR LOOK LIKE AN ABSENT ROW. "The field is
 *    not showing" is a negative claim, and a negative claim needs a positive
 *    control in the same reading — otherwise a dead session, a dealer view or a
 *    stub all produce a confident "not showing" from a panel that was never
 *    there. `control` is that control: it is true only when the SAME text the
 *    absence is read from also carried "Application No:", i.e. the reader
 *    demonstrably could have seen a row if one existed. A caller that ticks a
 *    point on `present === false` without checking `control` has measured
 *    nothing.
 * ===================================================================== */

/** The on-screen label, exactly as the build renders it. */
const EXTENDED_REMARKS_LABEL = 'Application Extended Remarks';

/** The row itself, for the camera — scoped to the sidebar, never to `body`. */
const extendedRemarksRow = (page) =>
  sidebar(page).getByText(new RegExp(EXTENDED_REMARKS_LABEL, 'i')).first();

/**
 * The text following a labelled row in the sidebar's innerText.
 *
 * Returns `null` when the label is not there at all, which is a different answer
 * from `{ value: '' }` — the row exists and is blank. Callers must keep them
 * apart: absent is what a never-extended record shows, blank would be a build
 * that rendered the row and lost the remark.
 */
function afterSidebarLabel(text, label) {
  const lines = String(text || '').split('\n');
  const needle = label.toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    const at = lines[i].toLowerCase().indexOf(needle);
    if (at === -1) continue;
    const inline = lines[i].slice(at + label.length).replace(/^\s*:?\s*/, '').trim();
    if (inline) return { value: inline, where: 'same line' };
    // Blank after the label — the value may be rendered on the next line. Take it
    // ONLY if it is not itself a label; see refusal 2 above.
    //
    // "Looks like a label" is deliberately narrow — a bare `/:$/` test would
    // discard a genuine remark that happens to end in a colon and report the row
    // as EMPTY, which is a finding. A label is a short run of label-ish
    // characters ending in a colon and nothing else.
    const next = String(lines[i + 1] ?? '').trim();
    const looksLikeLabel = /^[A-Za-z][A-Za-z0-9 .&/()'-]{1,60}:$/.test(next);
    if (next && !looksLikeLabel) return { value: next, where: 'next line' };
    // The heuristic can still be wrong the other way — a genuine remark that is a
    // short phrase ending in a colon reads as a label and the row reports EMPTY.
    // That cannot produce a false green in either direction, which is why it is
    // acceptable: on an extend take the point asserts value === the remark typed,
    // and '' fails it; on a non-extend take the claim is that the row is not there
    // at all, and `present` is already true. Both surface the row, and `where`
    // names the line that was suppressed so the sidecar shows what was on screen.
    return {
      value: '',
      where: next ? `row present but EMPTY (the next line is the label ${JSON.stringify(next)})` : 'row present but EMPTY',
    };
  }
  return null;
}

/**
 * Read the "Application Extended Remarks:" row off the details page sidebar.
 *
 * Reports; asserts nothing. Whether the row SHOULD be there depends on the
 * fixture's history, which this function does not know and must not guess.
 *
 *   read      the sidebar yielded text at all
 *   control   that text carried "Application No:" — the positive control for a
 *             "not showing" claim (see refusal 3)
 *   present   the label row is in the sidebar
 *   value     the text after it; '' means present-and-blank; null means absent
 *   where     how the value was found, for the sidecar
 *   raw       the whole sidebar text, so a disagreement can be re-read later
 */
async function readExtendedRemarks(page, timeout = 4000) {
  let text = '';
  let err = '';
  try {
    // BOUNDED, and not on general principle. The interesting cases for this reader
    // are the ones with NO sidebar — a BackOffice stub (R19), a dealer view, a
    // bounced session — and on those innerText() waits out the default 30 s
    // actionTimeout before returning the answer the caller already suspected. Two
    // reads per take (before and after) plus a re-open on a failed control is two
    // minutes of dead camera on exactly the takes whose subject IS the absence.
    // Same trap raiseTooltip() documents: waiting for something the page will never
    // render is not patience, it is a burnt timeout.
    text = await sidebar(page).innerText({ timeout });
  } catch (e) {
    err = String((e && e.message) || e).split('\n')[0];
  }
  const read = !!String(text || '').trim();
  // THE LABEL ALONE IS NOT THE CONTROL. The UCD Application LISTING carries an
  // "Application No" search box, so /Application No:/ matches there too — and on
  // 28-08 TS27's after-read landed on /obs/admin/enquiry, reported
  // control=true readable=true, found no "Application Extended Remarks:" row
  // (there is no sidebar on a search page) and the sidecar wrote it up as "a
  // finding about the build". A fresh probe of the same record showed the row
  // present. So the control must also assert we are on the application route.
  // [[a-locator-that-matches-nothing-looks-like-an-absent-feature]]
  // WHICH PAGE, not merely "an application page". Tightened 29-08-2026.
  //
  // The 28-08 version of this guard required /form\/edit/ in the URL, because the
  // LISTING carries an "Application No" SEARCH BOX and an off-route read there had
  // been written up as a build finding. That was right and it was not enough:
  // BOTH application tabs match /form\/edit/ —
  //
  //     Application tab .......... /obs/admin/form/edit/<uuid>
  //     Registration Documents ... /obs/admin/form/edit-registration-doc/<uuid>
  //
  // — and the "Application Extended Remarks:" row renders ONLY on the second.
  // Measured 29-08 on three independently extended records (NA66001065,
  // NA64001022, NA68001099): the Application tab reads control=true, onRoute=true,
  // 399 chars, "Application No:" present, and present=FALSE, every time. The
  // registration-documents tab reads the row on all three at 591-614 chars.
  //
  // So on the Application tab the old guard certified a FALSE ABSENCE. TS30's take
  // reported "no greyed button" and "the sidebar carries NO Extended Remarks row"
  // as findings about the build; a direct read a minute later showed the row
  // populated and the control greyed. One fixture spent for nothing.
  //
  // `onRoute` is KEPT as-is and still means "some application page" — it is what
  // tells an off-route read (the listing) apart from a wrong-tab read, and the two
  // have different fixes. `control` is what every caller gates on, so that is what
  // gets the narrower test: this row can only be claimed present or absent from the
  // page that renders it. A wrong-tab read now comes back control=false, which every
  // caller already treats as "unmeasured", never as "absent".
  const onRoute = /form\/edit/.test(page.url());
  const onRegDocs = /edit-registration-doc/.test(page.url());
  const control = /Application No:/i.test(text || '') && onRegDocs;
  const hit = read ? afterSidebarLabel(text, EXTENDED_REMARKS_LABEL) : null;
  return {
    read,
    control,
    onRoute,
    onRegDocs,
    present: !!hit,
    value: hit ? hit.value : null,
    where: hit ? hit.where : null,
    chars: String(text || '').length,
    url: page.url(),
    raw: String(text || ''),
    // THREE DIFFERENT FAULTS, and they have three different fixes. Saying only
    // "not on route" sent a reader looking for a navigation bug when the real
    // problem was the wrong TAB.
    note: read
      ? (control ? ''
        : onRegDocs
          ? 'the sidebar yielded text but no "Application No:" — this may not be the application sidebar'
          : onRoute
            ? `read on ${page.url()} — the APPLICATION tab, not Registration Documents. The "Application ` +
              'Extended Remarks:" row renders only on the registration-documents tab, so an absence here ' +
              'is a WRONG-TAB read and says nothing about the build. Navigate to app.TAB.regDocs first'
            : `the text was read on ${page.url()}, which is NOT an application route at all — a search ` +
              'page has no details sidebar, so an absent Extended Remarks row here says nothing about ' +
              'the build')
      : `the sidebar could not be read${err ? ` (${err})` : ''} — no absence can be claimed from this`,
  };
}

/**
 * A VERDICT on that row, for the assertion suite.
 *
 * REPORTS — the caller asserts. Same contract as extendState(), and for the same
 * reason: whether the row should be there depends on the fixture's history, which
 * this module does not know. What it can do is hold the WORDING in one place, so
 * ten call sites across eight spec files cannot drift into ten different accounts
 * of the same rule.
 *
 *   expected      the remark that was typed; the row must read exactly this
 *   mustBeAbsent  the opposite claim — no row at all
 *   appNo         prefixed to the message, because a soft failure in a loop is
 *                 unreadable without it
 *
 * `ok: false` with an unreadable sidebar is deliberate and is NOT the same as a
 * failed claim: the `why` says so in words. A test that treated "could not read"
 * as "absent" would pass the negative case by never looking.
 */
async function checkExtendedRemarks(page, opts = {}) {
  const { expected = null, mustBeAbsent = false, appNo = '' } = opts;
  const row = await readExtendedRemarks(page);
  const who = appNo ? `${appNo}: ` : '';

  if (!row.read || !row.control) {
    return { ok: false, row, why:
      `${who}the application sidebar was not on screen (readable=${row.read}, "Application No:" seen=` +
      `${row.control}, ${row.chars} chars, url ${row.url}), so nothing can be claimed about the ` +
      '"Application Extended Remarks:" row in either direction. This is a reach problem, not a build finding' };
  }
  if (mustBeAbsent) {
    return row.present
      ? { ok: false, row, why:
          `${who}the sidebar shows an "Application Extended Remarks:" row reading ${JSON.stringify(row.value)} ` +
          'on a record that has not been extended (R25)' }
      : { ok: true, row, why: `${who}no "Application Extended Remarks:" row, read off a sidebar proven readable by its own Application No` };
  }
  if (!row.present) {
    return { ok: false, row, why:
      `${who}the extension went through and the details page shows NO "Application Extended Remarks:" row. ` +
      'R14 proves the remark stays off the listing and out of the export, and R18 proves it reached the audit ' +
      'log — this row is the only thing that proves it is shown to a user at all (R25)' };
  }
  // CONTAINMENT, NOT WHOLE-FIELD EQUALITY (corrected 28-08-2026 evening, matching
  // the recorder's same-day fix). The build PREFIXES the extension timestamp:
  // typed "EV TS27 NA68001115", the sidebar shows
  // "28-08-2026 03:53pm, EV TS27 NA68001115", and the audit log's [Application
  // Extension Date] matches the prefix to the minute. The old `!==` demanded the
  // whole field equal the typed text — unsatisfiable by construction on this
  // build, so every one of the ten expected-value call sites across the assertion
  // suites reported a failure on a correct build.
  // [[a-check-stricter-than-the-requirement]]
  //
  // What R25 actually asks: the typed remark comes back character for character,
  // and the leading text (if any) is the extension's own timestamp — checked here
  // only for the presence of digits; the to-the-minute cross-check against the
  // audit row stays with the audit legs that read that row.
  if (expected !== null) {
    const shown = String(row.value ?? '');
    if (!shown.includes(String(expected))) {
      return { ok: false, row, why:
        `${who}the "Application Extended Remarks:" row reads ${JSON.stringify(shown)}, and the typed remark ` +
        `${JSON.stringify(expected)} is NOT in it character for character — truncated, escaped or re-wrapped ` +
        '(R25). Compare codepoints with `node scripts/probe-remark-charset.js`' };
    }
    const prefix = shown.slice(0, shown.indexOf(String(expected))).replace(/[,\s]+$/, '').trim();
    if (prefix && !/\d/.test(prefix)) {
      return { ok: false, row, why:
        `${who}the row carries leading text with no digits in it, so it is not the extension timestamp the ` +
        `build is expected to prefix: ${JSON.stringify(prefix)} (full value ${JSON.stringify(shown)})` };
    }
    return { ok: true, row, prefix, why:
      `${who}the row reads ${JSON.stringify(shown)} — the typed remark verbatim` +
      (prefix ? `, behind the build's timestamp prefix ${JSON.stringify(prefix)}` : '') };
  }
  return { ok: true, row, why: `${who}the row reads ${JSON.stringify(row.value)} — exactly what was typed` };
}

/** The visible text of a select's chosen option (ids from the 25-08 discover run). */
async function selectedLabel(page, selector) {
  try {
    const el = page.locator(selector).first();
    if (!(await el.count())) return '';
    return (
      (await el.evaluate((n) => n.selectedOptions?.[0]?.textContent?.trim() ?? n.value)) || ''
    );
  } catch {
    return '';
  }
}

const extendButton = (page) =>
  page.locator('#extend-application-btn').or(page.getByRole('button', { name: /^extend$/i }));

/**
 * The button's state, reported rather than asserted, so one probe can answer
 * R6 / R7 / R9 / R11 at once:
 *   present  — VISIBLE on the page. This is the one the tests assert.
 *   inDom    — in the markup, visible or not. present !== inDom means the
 *              build hid a rendered node, which is a finding in itself.
 *   enabled  — clickable (R6 greys an already-extended application)
 *   message  — the once-only text, when greyed
 *
 * `present` used to be a DOM count, so a `display:none` node would have read as
 * a rendered button — the same mistake that manufactured the C6 modal-× finding
 * on 25-08. Since the 26-08 ruling turns hidden-vs-greyed into the central
 * assertion, the two are now measured apart.
 *
 * As built, hiding is server-side: a Registered application's page contains no
 * #extend-application-btn and no span.extend-wrap at all, so present and inDom
 * agree today. They are kept separate to notice the day they stop agreeing.
 */
async function extendState(page) {
  const btn = extendButton(page);
  const inDom = (await btn.count()) > 0;
  if (!inDom) return { present: false, inDom: false, enabled: false, message: '', note: 'no Extend control in the markup' };

  const el = btn.first();
  const visible = await el.isVisible();
  const [disabledAttr, ariaDisabled, className, pointerEvents] = await Promise.all([
    el.isDisabled(),
    el.getAttribute('aria-disabled'),
    el.getAttribute('class'),
    el.evaluate((n) => getComputedStyle(n).pointerEvents),
  ]);
  const looksGreyed =
    disabledAttr ||
    ariaDisabled === 'true' ||
    /disabled|greyed|grayed/i.test(className || '') ||
    pointerEvents === 'none';

  return {
    present: visible,
    inDom: true,
    enabled: visible && !looksGreyed,
    message: await extendMessage(page),
    note: visible ? '' : 'rendered but hidden — R11 expects absence, not a hidden node',
    diagnostics: { disabledAttr, ariaDisabled, className, pointerEvents },
  };
}

/** The once-only tooltip and the span whose :hover paints it. */
const extendWrap = (page) => page.locator('span.extend-wrap').first();
const extendTip = (page) => page.locator('.extend-wrap .extend-tip').first();

/**
 * The once-only message as Figma writes it (node `9058-30492`), kept in ONE
 * place so the recorder, the probes and the modal checklist all compare against
 * the same string instead of three hand-typed copies.
 */
const ONCE_ONLY_MESSAGE =
  'This application has already been extended. Each application can only be extended once.';

/** Collapse whitespace so a re-wrapped tooltip still compares equal. */
const flat = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/**
 * The once-only message, READ FROM THE MARKUP.
 *
 * It is a HOVER TOOLTIP: `.extend-tip` inside `span.extend-wrap`, `display:none`
 * until `.extend-wrap:hover` (CSS read off discovery/33-registration-docs-
 * verified.html). innerText() returns nothing for a display:none node, so the
 * text has to come from textContent — reading it the visible way would have
 * failed TS03 on a perfectly correct build. Title attribute and any sidebar
 * copy stay as fallbacks in case the build moves it.
 *
 * WHAT THIS IS NOT (26-08-2026, after Charmain reviewed the TS03 take): the text
 * being in the markup is NOT evidence that a user ever sees it. This function
 * answers "does the build carry the right words", and nothing more. Whether the
 * tooltip actually PAINTS on hover is a separate measurement — `extendTipVisible`
 * — and it is the one the evidence still has to show.
 */
async function extendMessage(page) {
  const tip = page.locator('.extend-wrap .extend-tip').first();
  if (await tip.count()) {
    const text = (await tip.evaluate((n) => n.textContent || '')).trim();
    if (text) return text;
  }
  return (
    (await extendButton(page).first().getAttribute('title').catch(() => '')) ||
    (await sidebar(page).getByText(/already been extended/i).first().innerText().catch(() => '')) ||
    ''
  ).trim();
}

/**
 * WHAT THE TOOLTIP ACTUALLY SAYS ON SCREEN — the Figma parity half of R6.
 *
 * `extendTipVisible()` answers "did it paint". This answers "and are the words
 * the ones Figma specifies", which is the other half of what Charmain sent the
 * 26-08-2026 TS03 take back for. The two are separate failures with separate
 * fixes: an unpainted tooltip is a CSS/hover problem, wrong copy in a painted
 * tooltip is a content problem, and a still that shows neither cannot tell them
 * apart.
 *
 * READS, NEVER HOVERS. The pointer is placed by `Spotlight.pointAt()` (see
 * `extendHoverHost` for why it must be mouse.move onto `span.extend-wrap`), so
 * this is called WHILE the pointer is resting there and reports what is on the
 * screen at that moment. Two hover mechanisms in one file is how a fix like this
 * rots: keep the moving here and the measuring there and they cannot disagree.
 *
 *   rendered     — the tip is painted right now (assert this)
 *   visibleText  — what a reader would read, via innerText
 *   markupText   — what extendMessage() finds in the HTML, painted or not
 *   matchesFigma — visibleText === ONCE_ONLY_MESSAGE, whitespace-insensitive
 *   verdict      — one line fit for a caption or a sidecar
 */
async function readExtendTip(page) {
  const tip = extendTip(page);
  const out = {
    rendered: await extendTipVisible(page),
    visibleText: '',
    markupText: flat(await extendMessage(page).catch(() => '')),
    matchesFigma: false,
    box: null,
    loc: tip,
    verdict: '',
  };

  if (!out.rendered) {
    out.display = await tip.evaluate((n) => getComputedStyle(n).display).catch(() => '(no .extend-tip node)');
    out.verdict = out.markupText
      ? 'the once-only message is in the markup but the tooltip did NOT paint — a greyed button with no visible reason'
      : 'no once-only message anywhere: not painted, and not in the markup either';
    return out;
  }

  out.visibleText = flat(await tip.innerText().catch(() => ''));
  out.matchesFigma = out.visibleText === flat(ONCE_ONLY_MESSAGE);
  out.box = await tip.boundingBox().catch(() => null);
  out.verdict = out.matchesFigma
    ? 'tooltip painted, wording matches Figma 9058-30492'
    : `tooltip painted but the wording is NOT Figma 9058-30492 — on screen ${JSON.stringify(out.visibleText)}, ` +
      `Figma ${JSON.stringify(flat(ONCE_ONLY_MESSAGE))}`;
  return out;
}

/**
 * The element whose `:hover` raises the once-only tooltip — `span.extend-wrap`,
 * NOT the button inside it.
 *
 * This is a rule about the build's CSS, not a preference. A greyed Extend is
 * `.extend-btn:disabled`, which carries `pointer-events:none`, so the button is
 * not hoverable in any sense the browser recognises: it never enters the hover
 * chain, and `elementFromPoint` over it returns the wrap. The tooltip rule is
 * `.extend-wrap:hover .extend-tip{display:block}` — the wrap was always the
 * hover host; aiming at the button was aiming at the one node that cannot work.
 *
 * Cost of getting it wrong, measured on TS03's 26-08-2026 take: `btn.hover()`
 * retried the hit-target check for the full 20s actionTimeout, scrolled the page
 * up and down ten times on camera, and produced a key shot of a greyed button
 * with no visible reason beside it. See Spotlight.pointAt() for the other half
 * of the fix (mouse.move, which has no actionability check to fail).
 */
async function extendHoverHost(page) {
  const wrap = page.locator('.extend-wrap').first();
  if (await wrap.count()) return wrap;
  return extendButton(page).first();
}

/**
 * Is the once-only tooltip ACTUALLY PAINTED right now?
 *
 * The positive control for the hover. extendMessage() reads the text out of
 * textContent precisely because the node is `display:none` until hovered — which
 * means it returns the message whether or not the tooltip is on screen. So the
 * sidecar could quote the message in full while the still showed nothing. Ask
 * the screen, separately, and record the answer.
 */
async function extendTipVisible(page) {
  const tip = page.locator('.extend-wrap .extend-tip').first();
  if (!(await tip.count())) return false;
  return tip.isVisible().catch(() => false);
}

/**
 * Hover the tooltip and read it, for callers with no Spotlight to place a pointer
 * for them — the assertion suite and the probes.
 *
 * The evidence recorder does NOT use this: there the pointer has to be placed by
 * Spotlight.pointAt so the synthetic cursor and the hold agree with the real
 * pointer, and the tip has to still be up when the still is cut. Here nobody is
 * filming, so move and read in one call.
 *
 * Off the target first, then onto it: a single move to a point the pointer already
 * occupies fires no mousemove at all, and after a scrollIntoViewIfNeeded it often
 * already occupies it.
 */
async function hoverExtendTip(page) {
  const host = await extendHoverHost(page);
  if (!(await host.count())) return readExtendTip(page);
  await host.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => {});
  const bb = await host.boundingBox().catch(() => null);
  if (bb) {
    await page.mouse.move(Math.max(0, bb.x - 120), Math.max(0, bb.y - 60)).catch(() => {});
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 8 }).catch(() => {});
    await page.waitForTimeout(300);
  }
  return readExtendTip(page);
}

/**
 * Open the Extend modal and report everything about it, so the first run
 * produces the ground truth this file is currently guessing at.
 */
async function openExtendModal(page) {
  await extendButton(page).first().click();
  // jQuery UI: the buttons sit in the .ui-dialog wrapper's buttonpane, so the
  // wrapper — not #extend-dialog itself — is what callers must search within.
  const dialog = page
    .locator('.ui-dialog')
    .filter({ has: page.locator('#extend-dialog') })
    .or(page.getByRole('dialog'))
    .first();
  await dialog.waitFor({ timeout: 10_000 });
  return {
    dialog,
    title: (await dialog.locator('h1,h2,h3,[class*="title"],[class*="header"]').first().innerText().catch(() => '')).trim(),
    text: (await dialog.innerText()).trim(),
    fields: await dialog.locator('input, textarea, select').evaluateAll((els) =>
      els.map((e) => ({
        tag: e.tagName.toLowerCase(),
        type: e.getAttribute('type') || '',
        name: e.getAttribute('name') || '',
        id: e.id || '',
        placeholder: e.getAttribute('placeholder') || '',
        required: e.hasAttribute('required'),
        maxLength: e.getAttribute('maxlength') || '',
      }))
    ),
    // EVERY button node, painted or not. Kept because "is it in the markup" is a
    // real question — but it is NOT the question a caption may answer.
    buttons: await dialog.locator('button, input[type=submit], a[role=button]').allInnerTexts(),
    // ONLY the ones that render, and the reason this field exists at all
    // (27-08-2026): jQuery UI emits a `.ui-dialog-titlebar-close` button and this
    // dialog ships it `style="display:none"`, so `buttons` reads
    // ["Close","Cancel","Confirm"] on a modal that visibly offers two. The first
    // no-op-probe take put that three-item list in an on-screen caption over a
    // frame showing Cancel and Confirm — re-manufacturing C6, the finding that was
    // raised on 25-08 from exactly this DOM read and withdrawn on 26-08 once
    // somebody looked at the screen.
    //
    // So: `buttons` is what the markup holds, `buttonsVisible` is what a reviewer
    // can see, and only the second may ever reach a caption. Same distinction as
    // extendState()'s present-vs-inDom, for the same reason.
    buttonsVisible: (await dialog.locator('button, input[type=submit], a[role=button]')
      .evaluateAll((els) => els
        .filter((e) => {
          const s = getComputedStyle(e);
          return s.display !== 'none' && s.visibility !== 'hidden' && e.offsetParent !== null;
        })
        .map((e) => (e.innerText || e.value || '').trim())
        .filter(Boolean))),
  };
}

/**
 * Extend with a remark. On success the page's own JS calls location.reload(),
 * so we wait for the reload rather than just the dialog hiding; on a server
 * error the dialog closes and an "Unable to proceed" dialog opens instead —
 * callers checking refusals should read that dialog's text.
 */
async function extend(page, remark) {
  const modal = await openExtendModal(page);
  await page.locator('#extend-remarks').fill(remark);
  await modal.dialog.getByRole('button', { name: /^confirm$/i }).first().click();
  await page.waitForLoadState('load', { timeout: 30_000 }).catch(() => {});
  return modal;
}

/** The inline mandatory-remark validation surface (client-side JS). */
const remarkError = (page) => page.locator('#extend-remarks-error');

/**
 * The region that MUST be in frame for this CR's evidence still.
 *
 * The rule (Charmain, 26-08-2026): the screenshot is the application page
 * showing the Extend button — and where there is no button, the SAME page
 * showing it is not there.
 *
 * So the anchor cannot simply be the button. On a Registered record the build
 * removes `span.extend-wrap` from the markup entirely, and a locator that
 * resolves to nothing frames nothing — the absent case would produce either no
 * still at all or a spotlight over the whole body, which highlights everything
 * and therefore highlights nothing. It falls back to the sidebar panel, because
 * that panel carries Application No and Application Status in the same frame:
 * the two values that make an absence read as "not offered on THIS application"
 * rather than "some page, no button".
 *
 * Returns { loc, anchored } so the caller can say in the sidecar which of the
 * two it actually got, and refuse the point if it got neither.
 */
async function extendRegion(page) {
  const btn = extendButton(page).first();
  // VISIBLE, not merely present: a rendered-but-hidden node has no painted box,
  // so ringing it draws the ring nowhere. extendState() keeps present and inDom
  // apart to notice the day the build starts hiding instead of omitting; this
  // has to make the same distinction or the still would quietly go blank.
  if ((await btn.count()) && (await btn.isVisible().catch(() => false))) {
    return { loc: btn, anchored: 'control' };
  }
  const side = sidebar(page).first();
  if (await side.count()) return { loc: side, anchored: 'sidebar' };
  return { loc: page.locator('body'), anchored: 'body' };
}

module.exports = {
  TAB, goto, openTab, whichView, describePage, assertRealApplication, readSidebar, extendButton, extendState, extendMessage,
  extendRegion, extendHoverHost, extendTipVisible, extendWrap, extendTip, readExtendTip, hoverExtendTip, ONCE_ONLY_MESSAGE,
  openExtendModal, extend, remarkError, sidebar,
  EXTENDED_REMARKS_LABEL, extendedRemarksRow, readExtendedRemarks, afterSidebarLabel, checkExtendedRemarks,
};
