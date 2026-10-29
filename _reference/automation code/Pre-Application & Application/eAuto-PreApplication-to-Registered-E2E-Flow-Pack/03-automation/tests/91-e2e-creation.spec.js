/**
 * E2E SEGMENT 1 — THE CREATION HALF, FILMED FROM THE reCAPTCHA GATE.
 *
 *   TS=E2E_TS1 npm run evidence:creation
 *
 * Charmain's ruling, 27-08-2026 night: *"all E2E ts need to film start from the
 * recaptcha gate"*. Every E2E row is titled "Full flow" and E2E_TS1's own step 1 is
 * the gate; the recorder's first point on an extend take is BackOffice `login`, so an
 * E2E take filmed the last third of its own scenario and could still score full
 * marks. See triggerPoints.js's E2E SEGMENT 1 block for the whole reasoning.
 *
 * WHY THIS IS A SEPARATE FILE AND A SEPARATE PROJECT
 *
 * 90-evidence.spec.js is 3,900 lines that work. This take has a different SHAPE —
 * several browser contexts, three roles, two human payment gates and no Extend click
 * anywhere — and threading a second mode through the working recorder would put
 * every read-only take at risk to add a path that cannot be tested without a person
 * at the keyboard. So it lives here, reuses the same recorder/annotator/spotlight,
 * and writes the same sidecar format.
 *
 * WHAT IT COSTS AND WHAT IT DOES NOT
 *
 * Three human gates per row: one reCAPTCHA tick and two Fiuu bank-simulator logins.
 * It never clicks Extend, so it spends NO extension (R1) — which is the one good
 * property of the seam: a segment 1 that goes wrong can be re-filmed, and segment 2
 * never can.
 *
 * THE FILENAME DELIBERATELY DOES NOT MATCH THE BOARD'S TAKE PATTERN.
 *
 * evidence-coverage.mjs matches `<ref>_<record>_<role>_<date>.txt` and grades what it
 * finds against that ref's ceiling. A segment-1 sidecar named that way would be read
 * as a short E2E take against segment 2's 16-point ceiling and the row would show
 * SHORT on a bogus record. So the label is prefixed `SEG1-`, which fails the pattern
 * and is skipped — and the board prints a separate line for these so the film is
 * VISIBLE without being mis-graded. Half a scenario must not look like a bad whole
 * one, and it must not look like nothing either.
 */
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

const { startDesktopRecording, extractFrame, VIDEO_DIR } = require('../src/videoRecorder');
const { attachAnnotator } = require('../src/annotate');
const { attachSpotlight } = require('../src/spotlight');
const { installPointer, pointerNotes } = require('../src/pointer');
const { checkFraming } = require('../src/framing');
const tp = require('../src/triggerPoints');
const takeFixtures = require('../src/takeFixtures');
const creation = require('../src/creation');
const fixture = require('../src/fixture');
const preapp = require('../src/preapp');
const dates = require('../src/dates');
const support = require('../src/support');
const listing = require('../src/listing');
const { login } = require('../src/login');
const { ROLES, OBS } = require('../src/env');
const {
  maximizeViaCDP, pinOnTop, unpin, startTopmostWatcher, handOverMarker,
  releaseMarker, reclaimMarker, closeDocumentWindow,
  placeWindowOnRecordedDisplay, EVIDENCE_TITLE_MARKER,
} = require('../src/desktopWindow');

const STORE = path.resolve(__dirname, '..', '..', 'vault', 'data', 'store.json');
const RAW_TS = (process.env.TS ?? '').trim();

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Same archive rule as the main recorder: a re-record must not erase what it corrects. */
function archiveExistingTake(dir, label) {
  let existing = [];
  try { existing = fs.readdirSync(dir).filter((f) => f.startsWith(label)); } catch { return null; }
  if (!existing.length) return null;
  const bin = path.join(dir, 'superseded');
  fs.mkdirSync(bin, { recursive: true });
  let n = 1;
  while (fs.existsSync(path.join(bin, `${label}__${n}`))) n += 1;
  const to = path.join(bin, `${label}__${n}`);
  fs.mkdirSync(to, { recursive: true });
  for (const f of existing) {
    try { fs.renameSync(path.join(dir, f), path.join(to, f)); } catch {}
  }
  return { to, moved: existing.length };
}

test.describe('EAINT-11982 E2E segment 1 — creation @creation', () => {
  test.describe.configure({ mode: 'serial' });
  // Three human gates and eleven phases. The main recorder's 20 minutes is not
  // enough: a first build with a field map miss has waited longer than that.
  test.setTimeout(75 * 60_000);

  test('film the creation half of one E2E scenario', async ({ browser }) => {
    const store = JSON.parse(fs.readFileSync(STORE, 'utf8'));
    const sc = store.scenarios.find((s) => s.ref.toUpperCase() === RAW_TS.toUpperCase());
    if (!sc) {
      throw new Error(
        `Set TS=<E2E ref>. "${RAW_TS}" is not in the register.\n` +
        `Gate rows: ${tp.E2E_GATE_ROWS.join(', ')}`);
    }
    // Throws with the reason on E2E_TS8 — its exemption is not a special case here,
    // it is the checklist refusing to exist for a row that must not film from the gate.
    const points = tp.creationPointsFor(sc.ref);

    const role = 'dealer+bo';
    const profile = fixture.newProfile({});
    const runLabel = profile.label;
    const label = `SEG1-${sc.ref.replace(/[^\w.]/g, '')}_${runLabel}_${role}_${stamp()}`;

    const captured = new Set();
    const missing = [];
    const naPoints = [];
    const notes = [];
    const marks = [];
    const stills = [];

    const archived = archiveExistingTake(VIDEO_DIR, label);
    if (archived) {
      notes.push(`superseded an earlier take of this label: ${archived.moved} file(s) -> ` +
                 path.relative(process.cwd(), archived.to));
    }

    notes.push(`SEGMENT 1 OF 2 — this take films CREATION only: the public gate through to a ` +
               `record with its expiry patched into the window. It clicks no Extend and spends ` +
               `no extension (R1). Segment 2 performs the extension and the two-surface sweep.`);
    notes.push(`profile: ${profile.businessName} (${profile.type || 'Non-SSM'}) runLabel=${runLabel}`);

    const rec = await startDesktopRecording(label);
    const STILL_LEAD = 0.9;

    let spot = null;
    let dealerCtx = null;
    let topmost = null;
    // The page the camera is currently pinned to, and the dealer page it goes back
    // to. Held here because `attach` is defined before the dealer page exists.
    let dealerPage = null;
    let markerOn = null;
    // The overlay the camera is currently pointed at. Null means the canonical one.
    let activeSpot = null;
    let appNo = null;
    let uuid = null;
    let aborted = null;

    /** Tick a point only when it was really captured; otherwise say why. */
    const tick = async (key, why) => {
      if (!points.some((p) => p.key === key)) return;
      if (why) { missing.push(`${key} — ${why}`); return; }
      captured.add(key);
      marks.push({ key, atMs: Date.now() - STILL_LEAD * 1000 });
      // The ACTIVE overlay, not the canonical one: a tick has to light the row on the
      // page the camera is pointed at, or the checklist animates behind another window.
      const s = activeSpot || spot;
      if (s) await s.tick(key).catch(() => {});
    };

    /**
     * Attach the overlay to every page the flow opens.
     *
     * Fired from creation.js's `onPage` hook BEFORE login runs, which is the only
     * moment the short-lived BackOffice contexts can be annotated — they are created
     * and closed inside their own phase. The hook is wrapped by runCreation, so a
     * failure here costs an annotation and never the fixture.
     *
     * The FIRST page to be attached owns the checklist: the spotlight paints its
     * panel per page, and three panels racing each other across contexts is what
     * `spot` being a single reference avoids.
     */
    /**
     * ONE OVERLAY PER PAGE, AND THE TAKE DRAWS ON WHICHEVER PAGE IS ON CAMERA.
     *
     * The old version kept a SINGLE `spot`, bound to the first page attached — the
     * dealer. Its comment reasoned that several checklist panels racing each other
     * across contexts was the thing to avoid, which is true, and it produced a worse
     * bug: `Spotlight` holds `this.page`, so every ring, caption, checklist repaint
     * and cursor move for a BackOffice leg was painted on the DEALER page, behind the
     * window that was actually being filmed.
     *
     * That is what Charmain saw in the 01:06 film: the BackOffice listing on camera
     * with no ring, no caption, no trigger-points panel and no cursor, and a tab
     * titled "[QA-EVID] evidence" instead of the scenario. Not one of those was a
     * separate bug.
     *
     * So: a handle per page, and `spotFor(page)` returns that page's one. The ticked
     * set is seeded from `captured` on switch, so the panel shows the TAKE's progress
     * rather than what happened on that page. src/secondSession.js already does it
     * this way for the race take's second window — this is the same pattern.
     */
    const overlays = new Map();

    const attach = async (page) => {
      if (overlays.has(page)) return overlays.get(page).note;
      const note = await attachAnnotator(page).catch(() => null);
      const s = await attachSpotlight(page, points).catch(() => null);
      // Patch Locator.click / Page.click ONCE for this process, so every click in the
      // flow — through preapp.js, onboarding.js, listing.js, anywhere — walks the
      // drawn cursor onto its target and waits for it to arrive before pressing.
      // Idempotent; the first page to attach does it for all of them.
      installPointer(page);
      overlays.set(page, { note, spot: s });
      // The first page attached owns the canonical timeline: deadAir() and notes are
      // read off `spot` when the sidecar is written, so beats from the other pages
      // are folded back into it in spotFor().
      if (!spot) spot = s;
      return note;
    };

    /** The overlay for the page being filmed, with the take's tick state seeded in. */
    const spotFor = async (page) => {
      if (!page) return spot;
      if (!overlays.has(page)) await attach(page);
      const s = (overlays.get(page) || {}).spot;
      if (!s) return spot;
      if (s !== spot) {
        s.done = [...captured];
        await s.refreshChecklist().catch(() => {});
      }
      return s;
    };

    /** Fold a borrowed page's beats and notes back into the canonical timeline. */
    const foldBack = (s) => {
      if (!s || s === spot || !spot) return;
      if (s.beats && s.beats.length) spot.beats.push(...s.beats.splice(0));
      if (s.notes && s.notes.length) spot.notes.push(...s.notes.splice(0));
      if (s.panelOpen && s.panelOpen.length) spot.panelOpen.push(...s.panelOpen.splice(0));
    };

    try {
      dealerCtx = await browser.newContext({
        // `null`, NOT a CSS box — and it is the project's own setting. This spec
        // calls browser.newContext() directly, which inherits nothing from
        // playwright.config.js, so the project's `viewport: null` ("maximized to the
        // physical screen, not a CSS box") was being overridden here with 1600x1000.
        //
        // MEASURED 28-08-2026 on this machine, both ways, on this very page:
        //   1600x1000 -> window 1552x928 maximized, page innerWidth 1600, dpr forced
        //                to 1.0  => the page is WIDER than its own window and every
        //                frame loses the right edge
        //   null      -> window 1552x928 maximized, page innerWidth 1536, dpr 1.25
        //                => fits
        // framing does not catch this: it checks the window's CENTRE is on the
        // recorded display, and a window whose CONTENT overflows still passes.
        viewport: null,
        // Carries the passed gate when there is one. check:gate says the session is
        // NOT reusable per build, so expect to tick the reCAPTCHA anyway.
        storageState: preapp.gateStatePath() || undefined,
        acceptDownloads: true,
      });
      const dealer = await dealerCtx.newPage();
      const dealerNote = await attach(dealer);

      /* ---- prepare the window the camera will film, THEN gate on it --------
       *
       * SEGMENT 1 NEVER DID THIS. It had a camera check and no window preparation
       * at all: no title marker, no maximize, no pin, no topmost watcher. And the
       * check was called with no page, so it threw a TypeError first — which hid
       * the fact that the complaint underneath it was TRUE. Fixing the argument
       * alone just produced the honest version of the same failure:
       * "no window carries the [QA-EVID] marker".
       *
       * THE ORDER IS LOAD-BEARING, and 90-evidence.spec.js has already paid for
       * it: the marker pinOnTop finds the window by is painted into
       * `document.title` by the annotator, and on about:blank there is nothing to
       * paint into. So — navigate to a REAL page, name the scenario (that paints
       * the title), maximize, pin, and only then gate.
       *
       * The page navigated to is the gate's OWN first page, so this invents no URL
       * and costs no extra hop: preapp.passGate() goes to exactly this next.
       * Nothing is ticked here and the reCAPTCHA is not touched.
       */
      await dealer.goto(OBS.preApplicationFormPage, { waitUntil: 'domcontentloaded' }).catch(() => {});
      if (dealerNote) {
        await dealerNote.scenario(sc.ref, `dealer · EAINT-11982 · segment 1 · creation`).catch(() => {});
      }
      // The dealer window is the one the camera is pinned to by default; the two
      // BackOffice checks borrow it and hand it straight back.
      dealerPage = dealer;
      markerOn = dealer;
      await maximizeViaCDP(dealer).catch(() => {});
      await pinOnTop().catch(() => {});
      // 900s is the module default and segment 1 runs ~30 min, so the watcher would
      // stop re-asserting topmost about a third of the way in and the first Windows
      // toast after that would land on the evidence.
      topmost = startTopmostWatcher(undefined, 2700);
      await dealer.waitForTimeout(800);

      // The camera check BEFORE THE FIRST HUMAN GATE. It is the one that catches a
      // take filming the bare desktop and reporting full marks — and here it would
      // waste three human gates before anyone noticed.
      //
      // It measures the DEALER page: checkFraming reads the window rect and focus
      // THROUGH a page, and measuring the page that will actually be filmed is the
      // stronger check anyway — probe:framing's own window passing says nothing
      // about where THIS context landed.
      const framing = await checkFraming(dealer).catch((e) => ({ ok: false, problems: [`the framing check itself threw: ${String(e && e.message)}`] }));
      const framingWhy = (framing && framing.problems && framing.problems.length)
        ? framing.problems.join(' | ')
        : (framing && framing.why) || 'no reason reported';
      notes.push(`framing: ${framing && framing.ok ? 'the recorded display will see the browser' : 'FAILED — ' + framingWhy}`);
      if (framing && framing.report) notes.push(framing.report);
      if (framing && framing.ok === false) {
        // Quote the measurement. The old message named probe:framing whatever the
        // cause, so a rig fault and a browser on the wrong monitor read identically.
        throw new Error(
          `refusing to burn three human gates on a take the camera cannot see: ${framingWhy}`
        );
      }

      /* ---- the eleven creation phases, filmed ----------------------------- */
      // WHICH READS THE PATCH IS A PRECONDITION FOR. Named rather than inferred from
      // ordering: the order has already moved once (the patch was the LAST phase until
      // 28-08, which made all four of these describe an unpatched record), and a guard
      // that depends on ordering breaks silently the next time it moves.
      const PATCH_DEPENDENT = new Set([
        'create-bo-listing', 'create-bo-export', 'create-bo-detail', 'create-bo-audit',
      ]);
      let patchFailedBecause = null;

      const legCaption = (phase) => {
        const leg = creation.legForPhase(phase);
        return leg ? leg.caption : phase;
      };
      // WHERE THIS ROW WANTS ITS EXPIRY LEFT — resolved here, because this is the
      // side that knows the ref. See creation.EXPIRY_TARGET: a flat 'in-window'
      // (= today) is wrong for E2E_TS1/TS6, which need the expiry still in the FUTURE
      // so that an extension can be "before" it, and right-for-a-reason for
      // E2E_TS2/TS7, which need the midnight cron to write Expired overnight.
      const expiryTarget = creation.expiryTargetFor(sc.ref);
      notes.push(`expiry target for ${sc.ref}: ${expiryTarget.ymd} (${expiryTarget.target}, ` +
                 `state ${expiryTarget.state}) — ${expiryTarget.why}`);
      const result = await creation.runCreation({
        browser, dealer, profile, runLabel, expiryTarget,
        say: (s) => notes.push(String(s).trim()),
        onPage: attach,
        onPhaseStart: async (phase, page) => {
          const leg = creation.legForPhase(phase);
          // HAND THE CAMERA TO THE BACKOFFICE WINDOW, for the checks that need it.
          //
          // The topmost watcher pins whichever window carries [QA-EVID], and that is
          // the dealer window — so a BackOffice context opens BEHIND it, annotates
          // itself perfectly, and never appears in a frame. That is exactly how the
          // 00:44 take captioned "the approver approves the application" over the
          // dealer's Business Information form.
          //
          // EVERY BackOffice leg, checked or not — 28-08-2026. This used to read
          // `leg.checked && leg.bo`, on the reasoning that an unchecked leg is not
          // framed so the 2.4s hand-over "would buy nothing". Charmain, watching the
          // film: *"all the action you did in BO is not recorded"*. Sampling the 11:51
          // TS3 take across 95s–245s — approve-preapp, assign, submit-approval,
          // approve-app, verify-regdocs — returns nothing but the dealer window.
          //
          // `checked` is what gets SCORED; `bo` is what is ON CAMERA. Conflating them
          // meant narrowing the checklist silently narrowed the film too, and the whole
          // reason these takes start at the reCAPTCHA gate is to show the real flow.
          // The legs stay unchecked and earn no point; they are simply visible now.
          //
          // Done in onPhaseStart rather than the onPage hook because onPage fires
          // BEFORE login and does not know the phase — this way credentials stay off
          // camera. onPhaseEnd hands the marker back, so a BackOffice leg in the MIDDLE
          // of the flow returns the camera to the dealer for the next dealer step.
          if (leg && leg.bo && page && dealerPage && page !== dealerPage) {
            const ov = overlays.get(page) || {};
            // NAME THE SCENARIO ON THIS PAGE FIRST. The marker the pinner finds the
            // window by is the annotator's document.title, and without this the tab
            // read "[QA-EVID] evidence" — which is also what the frame showed.
            if (ov.note) await ov.note.scenario(sc.ref, `${sc.ref} · EAINT-11982 · BackOffice ${leg.checked ? 'check' : 'step'} — ${phase}`).catch(() => {});
            // MAXIMIZE AND PLACE IT, not just raise it. handOverMarker only re-titles,
            // fronts and pins — so a window that opened small or on DISPLAY2 stayed
            // small or on DISPLAY2 while reporting focused=true. That is why Charmain
            // could not see the support tool patching even though the log said the
            // camera had been handed to it. secondSession.bringForward does all three;
            // this is the same sequence.
            await maximizeViaCDP(page).catch(() => {});
            await handOverMarker(dealerPage, page, sc.ref).catch((e) => {
              notes.push(`marker hand-over to ${phase} failed: ${String(e && e.message).slice(0, 120)} — ` +
                         `this leg may have been filmed behind the dealer window`);
            });
            markerOn = page;
            // Point every subsequent ring, caption and tick at THIS page's overlay.
            activeSpot = await spotFor(page);
            // A rect is not visibility, and this is the claim the tick rests on, so
            // measure it and write it down rather than assuming the hand-over worked.
            const placed = await placeWindowOnRecordedDisplay(EVIDENCE_TITLE_MARKER).catch(() => null);
            await page.bringToFront().catch(() => {});
            await pinOnTop().catch(() => {});
            await page.waitForTimeout(700).catch(() => {});
            const seen = await page.evaluate(() => document.hasFocus()).catch(() => null);
            notes.push(`camera handed to ${phase}: title="${await page.title().catch(() => '?')}" ` +
                       `focused=${seen} placed=${placed ? (placed.ok ?? true) : 'unknown'}`);
          }
          if (leg && leg.human) {
            // Say which KIND of gate. A leg marked `human` is the worst case; with the
            // sandbox pair in the store the two payments log themselves in and drive
            // the TAC / Approved / Pay Now, so calling them human gates in the sidecar
            // reads as "a person did this" when nobody touched them.
            const driven = leg.humanAuto === 'fiuu' && creation.simLoginAvailable();
            notes.push(driven
              ? `AUTOMATED GATE — ${phase}: the Fiuu sandbox login comes from the shared store, ` +
                `so this drives itself. ${leg.key}`
              : `HUMAN GATE — ${phase}: this pauses for a person. ${leg.key}`);
          }
          // Nothing is ringed on entry: the claim is what the phase ACHIEVED, and a
          // caption promising it before it happened would be on camera either way.
          const entry = activeSpot || spot;
          if (page && entry) await entry.refreshChecklist().catch(() => {});
        },
        // Set the moment the support tool refuses, and read by the four BackOffice
        // legs below. A plain string rather than a boolean so each refusal can quote
        // the reason the operator will actually act on — a tunnel that timed out and a
        // session that expired need different things done about them.
        onPhaseDone: async (phase, detail, page) => {
          const leg = creation.legForPhase(phase);
          if (!leg) return;
          if (detail && detail.applicationNo) appNo = detail.applicationNo;
          if (detail && detail.uuid) uuid = detail.uuid;

          // UNCHECKED LEGS RUN BUT ARE NOT FRAMED (Charmain, 28-08: the pre-application
          // and application flow needs no checks — the payment-done page is the proof).
          // They stay in the sidecar so a reviewer can follow the recording, and they
          // earn no point, because a point nothing frames is a false tick.
          if (!leg.checked) {
            notes.push(`ran (not a checked point): ${phase} — ${leg.caption}`);
            return;
          }
          if (!page || !spot) { await tick(leg.key, 'no page in scope when this phase finished, so nothing could be framed'); return; }

          // A PAYMENT POINT IS AN ASSERTION, NOT A PHOTOGRAPH. "make sure payment go
          // through and success" — so a done page that does not say so refuses the
          // tick and reports what it actually read. Filming a payment page and
          // ticking it regardless is indistinguishable from a run that did nothing.
          if (detail && detail.success === false) {
            notes.push(`${leg.key}: payment-done page read "${detail.evidenceText || '(nothing matched)'}" at ${detail.url || '?'}`);
            await tick(leg.key,
              `the payment-done page did not confirm success — status read as ` +
              `"${detail.statusText || '(none found)'}". The flow continued; the CHECK failed.`);
            return;
          }
          if (detail && detail.success === true) {
            notes.push(`${leg.key}: PAID — ${detail.evidenceText || ''} (${detail.paymentMethod || 'method not read'})`);
          }
          // A PATCH THAT DID NOT HAPPEN MUST NOT TICK. The 05:49 take reported
          // "PATCH FAILED: ... the VPN is not connected" in the log and ticked
          // create-patch-expiry anyway, because nothing here looked at the result. A
          // point that ticks on a step that did not happen is the exact fault this
          // recorder keeps being rebuilt to prevent.
          if (detail && detail.patchFailed) {
            // AND REMEMBER IT. Refusing this one point is not enough: the four
            // BackOffice legs that run after it each hold their own `detail` and knew
            // nothing about the patch, so create-bo-detail went on to read a correctly
            // ABSENT Extend button and write it up as "a record that was just patched
            // INTO the window ... That is a FINDING — compare EAINT-12235."
            //
            // Measured on the 18:38 take of 29-08-2026, when the VPN flapped mid-run:
            // the sidecar carried a false 12235 duplicate, on a record whose expiry was
            // still created+90d and whose absent button was therefore CORRECT.
            //
            // A failed precondition is not a finding. It invalidates every reading that
            // depended on it, and each of those has to say so in its own words rather
            // than reporting the state it happened to observe.
            patchFailedBecause = String(detail.patchFailed);
            await tick(leg.key, `the expiry was NOT patched: ${detail.patchFailed}. ` +
              `The record is still at created+90d, i.e. OUT of window, so every BackOffice ` +
              `reading below describes a record segment 2 cannot extend.`);
            return;
          }

          // THE FOUR READS THAT DEPEND ON THE PATCH. Ordered after it deliberately
          // (28-08), and meaningless without it.
          if (patchFailedBecause && PATCH_DEPENDENT.has(leg.key)) {
            await tick(leg.key,
              `the expiry patch failed earlier in this take (${patchFailedBecause}), so this ` +
              `reading describes a record still at created+90d — OUT of window. Whatever it ` +
              `shows is the CORRECT behaviour for that state, so nothing about the build ` +
              `follows from it. This is a failed precondition, not a finding.`);
            return;
          }
          // The details page is only evidence if it IS the details page. Refuse the
          // tick when the navigation never landed, and say where it actually was —
          // the 01:06 take read the listing's filter panel and reported the status as
          // "All", which is a <select> default, not a status.
          if (detail && detail.landedOnDetail === false) {
            await tick(leg.key,
              `never reached the details page — still at ${detail.url || 'an unknown url'} ` +
              `(uuid ${detail.uuid || 'not obtained'}). openApplication closes the Edit popup, ` +
              `so the caller has to navigate by uuid.`);
            return;
          }
          // "details page just check whether the extend button is showing" — so an
          // ABSENT control is the finding, and it must not tick quietly.
          if (detail && detail.extendShowing === false) {
            await tick(leg.key,
              `the Extend button is NOT showing on a record that was just patched INTO ` +
              `the window (${detail.extendWhy || 'no reason measured'}). That is a FINDING — ` +
              `compare EAINT-12235.`);
            return;
          }
          // Ring SOMETHING that names the page. A caption over a frame that could be
          // any page evidences nothing — the same rule as the key shot.
          //
          // A phase may ask for a TIGHTER ring than the generic panel: the BackOffice
          // listing check rings the record's own row, because a caption naming a
          // status over a whole listing panel makes the reviewer hunt for the row.
          // Fall back to the panel when the requested element is not on the page, so
          // a selector that goes stale costs a loose ring and never the point.
          let anchor = page.locator('.panel, .content-wrapper, .card, form, main').first();
          // THE CELL AND ITS HEADER, as one ring — the TS54 pattern. Spotlight.track()
          // accepts an array and frames the UNION, which is how a value gets filmed
          // with the column title that names it.
          if (detail && detail.ringUnion && appNo) {
            const pair = await listing.cellWithHeader(page, appNo, detail.ringUnion).catch(() => null);
            if (pair && pair.td) {
              anchor = pair.th ? [pair.td, pair.th] : pair.td;
              notes.push(`${leg.key}: ringed the ${detail.ringUnion} cell together with its column header`);
            } else {
              notes.push(`${leg.key}: cellWithHeader found no ${detail.ringUnion} cell — falling back`);
            }
          }
          if (!Array.isArray(anchor) && detail && detail.ringSelector) {
            const wanted = page.locator(detail.ringSelector).first();
            if (await wanted.count().catch(() => 0)) anchor = wanted;
            else notes.push(`${leg.key}: ringSelector "${detail.ringSelector}" matched nothing — ringed the panel instead`);
          }
          const target = Array.isArray(anchor)
            ? anchor
            : ((await anchor.count().catch(() => 0)) ? anchor : page.locator('body'));
          const primary = Array.isArray(target) ? target[0] : target;
          // Scroll the thing being certified into view BEFORE ringing it — and
          // HORIZONTALLY, which is the half that was missing. Charmain, on the 05:49
          // film: *"listing page you didnt show the expiry column lol"*.
          //
          // scrollIntoViewIfNeeded() moves the nearest scrollable ancestor only as far
          // as it must, and the listing's own wrapper is what scrolls sideways — so the
          // cell was ringed at an x-offset still outside the visible strip. Ask the
          // element itself to centre in BOTH axes, then let Playwright confirm.
          await primary
            .evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }))
            .catch(() => {});
          await primary.scrollIntoViewIfNeeded({ timeout: 3_000 }).catch(() => {});
          // And prove it landed in shot rather than assuming: a ring drawn outside the
          // viewport is a caption pointing at nothing.
          const box = await primary.boundingBox().catch(() => null);
          const vp = page.viewportSize && page.viewportSize();
          if (box && vp && (box.x < 0 || box.x + box.width > vp.width)) {
            notes.push(`${leg.key}: the ringed cell is still off-screen horizontally ` +
                       `(x=${Math.round(box.x)}, width=${Math.round(box.width)}, viewport=${vp.width}) — ` +
                       `the frame may not show it`);
          }
          // THE EXPORT LEG OPENS THE ACTUAL WORKBOOK, in Excel, on camera.
          //
          // Charmain, 28-08-2026: *"the excel file you didnt even open it, should open
          // and show the expiry column"*. A parsed row in a sidecar is a claim ABOUT
          // the evidence and a reviewer has to trust the rig to have read it right; the
          // file, opened with the row highlighted, needs no such trust.
          //
          // Same sequence 90-evidence.spec.js uses and for the same reasons: hand the
          // marker AWAY first or Excel opens behind the pinned browser and the leg
          // verifies the workbook perfectly while appearing in not one frame; hash
          // before and after because the file IS the evidence; and judge the script's
          // stdout, because it signals trouble by PRINTING "ERROR ..." beside a zero
          // exit code.
          if (leg.key === 'create-bo-export' && detail && detail.file) {
            const before = crypto.createHash('sha256').update(fs.readFileSync(detail.file)).digest('hex');
            notes.push(`export workbook: ${path.basename(detail.file)}  sha256=${before}`);
            const keysFile = detail.file.replace(/\.xlsx$/, '_keys.json');
            fs.writeFileSync(keysFile, JSON.stringify(detail.fingerprint), 'utf8');
            await releaseMarker(page).catch(() => {});
            const ps1 = path.resolve(__dirname, '..', 'scripts', 'open-xlsx-highlighted.ps1');
            const res = await new Promise((resolve) => {
              let outText = '';
              const p = spawn('powershell.exe', [
                '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1,
                '-Workbook', detail.file,
                '-KeysJson', keysFile,
                '-MatchColumn', 'Application No',
                '-FlagColumns', detail.flagColumn,
                '-KeepColumns', ['Company Name', 'Application Status'].join('|'),
              ], { windowsHide: false });
              p.stdout?.on('data', (d) => { outText += String(d); });
              p.stderr?.on('data', (d) => { outText += String(d); });
              p.on('error', (e) => resolve({ code: -1, out: `${outText}\nspawn failed: ${e.message}` }));
              p.on('close', (code) => resolve({ code, out: outText }));
            });
            notes.push(`excel: exit=${res.code} ${res.out.trim().split('\n').slice(-4).join(' | ')}`);
            const framed = /FRAMED .*= True/i.test(res.out);

            // PUT EXCEL WHERE THE CAMERA IS, AND ASK BOTH QUESTIONS.
            //
            // FRAMED only says the column is inside EXCEL'S OWN visible range. It says
            // nothing about Excel being in front — and on the 06:22 take it was not:
            // frames cut at 356/359/362s show the browser, with Excel merely running in
            // the taskbar. The leg reported FRAMED=True and ticked.
            //
            // 90-evidence.spec.js already paid for this exact lesson (Charmain, on an
            // earlier CR: *"i didnt see the excel file checking showing in the
            // recording"*). "On the right monitor" and "nothing in front of it" are two
            // questions, and BOTH signals are needed: foreground alone refuses a window
            // that is topmost-but-not-focused, topmost alone passes a pin that failed.
            const placed = res.code === 0
              ? await placeWindowOnRecordedDisplay(path.basename(detail.file)).catch(() => null)
              : null;
            const visible = !!(placed && placed.ok && (placed.foreground || placed.topmost));
            notes.push(`excel window: placed=${placed ? placed.ok : 'not attempted'} ` +
                       `foreground=${placed && placed.foreground} topmost=${placed && placed.topmost} ` +
                       `-> ${visible ? 'ON CAMERA' : 'NOT on camera'}`);
            const after = crypto.createHash('sha256').update(fs.readFileSync(detail.file)).digest('hex');
            notes.push(`export workbook after opening: sha256=${after} — ${after === before ? 'byte-identical, never saved' : 'CHANGED, which must not happen'}`);
            // A STILL OF THE WORKBOOK ITSELF, cut while it is up. The point's own still
            // is timed 0.9s before the tick, which lands after Excel has been closed —
            // so on the 06:22 take the "export" still was a picture of the browser. A
            // still is what gets pasted into a ticket, so the artefact needs its own.
            marks.push({ key: 'create-bo-export-workbook', atMs: Date.now() + 1200 });
            // Hold it on camera, then put the marker back before closing.
            await new Promise((r) => setTimeout(r, leg.holdMs || 4500));
            await closeDocumentWindow(path.basename(detail.file)).catch(() => {});
            await reclaimMarker(page, sc.ref).catch(() => {});
            if (!framed || !visible || /ERROR /.test(res.out) || after !== before) {
              await tick(leg.key,
                !visible
                  ? `Excel opened and the ${detail.flagColumn} column was in its visible range, but the ` +
                    `WINDOW was not on camera (placed=${placed && placed.ok} ` +
                    `foreground=${placed && placed.foreground} topmost=${placed && placed.topmost}) — ` +
                    `the film would show the browser, not the workbook`
                  : !framed
                  ? `Excel opened but the ${detail.flagColumn} column was not measurably in the ` +
                    `frame — "was this filmed" is not answered by the window existing`
                  : after !== before
                    ? 'the workbook changed on disk — it must be opened read-only and never saved'
                    : `the Excel step printed an error: ${(/ERROR [^\n]*/.exec(res.out) || [])[0]}`);
              return;
            }
          }
          const drawOn = (await spotFor(page)) || spot;
          // PER-LEG HOLD. Charmain on the 05:33 film: *"listing and details page went
          // too fast not even showing in spotlight highlight"*. 2.2s at 15fps is ~33
          // frames, and the BackOffice reads are the only look their surface gets, so
          // they hold ~4.5s. The flow legs keep the shorter default.
          const hold = leg.holdMs || 2200;
          await drawOn.check(target, `${legCaption(phase)}${appNo ? ` · ${appNo}` : ''}`, hold).catch(() => {});
          await tick(leg.key);

          // CLOSE THE UCD BROWSER once the dealer half is done. Charmain, 28-08:
          // *"you can close the ucd application browser once done, cus it keep shift
          // back to ucd side when it doing the bo check"* — and she is describing the
          // hand-BACK below. Every BackOffice leg borrowed the camera and then returned
          // it to the dealer window, so the film flicked to UCD between checks. After
          // regfee the dealer page is never used again, so closing it removes the
          // flicker at the source instead of choreographing around it.
          if (phase === 'regfee' && dealerCtx) {
            await dealerCtx.close().catch(() => {});
            dealerCtx = null;
            dealerPage = null;
            markerOn = null;
            notes.push('closed the UCD dealer browser — the dealer half is finished, and ' +
                       'leaving it open made the camera flick back to it between BackOffice checks');
          }

          // Give the camera back. asRole closes this context the moment the phase
          // returns, and a marker left on a closed page pins nothing — the rest of the
          // take would run unpinned and the first Windows toast would land on it.
          // Fold the borrowed overlay's timeline back regardless of whether the camera
          // goes anywhere — once the dealer window is closed there is nothing to hand
          // back to, and leaving this inside the branch would drop every BackOffice
          // leg's beats from the dead-air report.
          foldBack(drawOn);
          if (markerOn && dealerPage && markerOn !== dealerPage) {
            await handOverMarker(markerOn, dealerPage, `${sc.ref} · dealer`).catch(() => {});
            markerOn = dealerPage;
            activeSpot = null;
          }
        },
      });
      appNo = result.applicationNo || appNo;
      uuid = result.uuid || uuid;
      notes.push(`created: ${appNo} uuid=${uuid} status=${JSON.stringify(result.result && result.result.status)} ` +
                 `expiry=${JSON.stringify(result.result && result.result.expiry)}`);
      if (result.hookErrors && result.hookErrors.length) {
        notes.push(`ANNOTATION FAILURES (${result.hookErrors.length}) — the flow was unaffected: ` +
                   result.hookErrors.slice(0, 5).join(' | '));
      }

      /* ---- the patch is now a PHASE, not a step here ---------------------- */
      //
      // Moved into src/creation.js on 28-08-2026 so it runs BEFORE the four BackOffice
      // reads. Here it only has to be read back off the result, because the seam
      // caption quotes it. Charmain: *"recheck listing + export, details, and audit log
      // again after patching the expiry date using the support tool"* — and a patch that
      // happened after those reads made all four of them describe the wrong record.
      const patchLeg = (result.phases && result.phases['patch-expiry']) || {};
      const patchedTo = patchLeg.patchedTo || null;
      if (patchLeg.patchFailed) notes.push(`the expiry patch FAILED: ${patchLeg.patchFailed}`);

      /* ---- and the seam, stated out loud --------------------------------- */
      const seam = {
        segment: 1, of: 2, ref: sc.ref, applicationNo: appNo, uuid,
        patchedExpiry: patchedTo, runLabel, video: path.basename(rec.file),
        // The TARGET, not just the date. A segment 2 opening this record the next
        // morning needs to know whether today's date was chosen so the record would
        // still be PRE-expiry (E2E_TS1/TS6) or so the cron would expire it overnight
        // (E2E_TS2/TS7). The ymd alone cannot tell those two apart.
        patchTarget: patchLeg.patchTarget || null,
        patchState: patchLeg.patchState || null,
        patchWhy: patchLeg.patchWhy || null,
        recordedAt: new Date().toISOString(),
        segment2: appNo
          // EAINT-12235 IS FIXED (verified 28-08-2026), so segment 2 is no longer
          // refused on that ground. What still gates E2E_TS2 and E2E_TS7 is the CRON:
          // they assert Expired -> Approved and only the midnight run writes Expired,
          // so their segment 2 belongs to the next morning. A wait, not a block.
          // E2E_TS4 IS THE ONE ROW WHOSE SEGMENT 2 IS ITSELF TWO SITTINGS
          // (29-08-2026). Its claim is that the greyed once-only button survives the
          // EXTENDED period running out, and the step between extending and reading
          // that is a midnight cron. One command line cannot express it, and the one
          // that used to sit here sent the operator into an extend-shaped take on a
          // record that had to arrive already extended. The runbook is held in
          // src/takeFixtures.js so the seam and the fixture ledger cannot drift.
          ? (takeFixtures.TAKES[sc.ref] && takeFixtures.TAKES[sc.ref].segments
             && /^E2E_TS4$/.test(sc.ref)
              ? takeFixtures.TAKES[sc.ref].segments[2].replace(/<segment 1 record>|<that same record>/g, appNo)
              : `TS=${sc.ref} EV_APP_NO=${appNo} EV_SPEND=1 npm run evidence` +
                (/^E2E_TS(2|7)$/.test(sc.ref)
                  ? '   (RUN IT TOMORROW: this row asserts Expired -> Approved, and the midnight cron has to '
                    + 'write Expired first — the expiry was patched to TODAY for exactly that reason)'
                  : '   (runnable as soon as this segment finishes — no status change is needed)'))
          : 'UNKNOWN — no Application No was learned, so segment 2 has no record to open',
      };
      if (appNo && spot) {
        // On the LISTING, because that is where a reviewer re-finds the record, and
        // the frame has to carry the number that joins the two segments.
        const boCtx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
        const boPage = await boCtx.newPage();
        await attach(boPage);
        await login(boPage, ROLES.assignee);
        // Re-find the record the way a reviewer would, and ring the row rather than
        // the page when it is there — the seam's whole job is to carry the number
        // that joins the two films.
        const row = await listing.findByApplicationNo(boPage, appNo).catch(() => null);
        notes.push(`seam shot: listing row ${row ? 'found and ringed' : 'not re-found — captioned on the listing page instead'}`);
        await spot.check(row && row.loc ? row.loc : boPage.locator('body'),
          `SEAM — segment 1 of 2 ends here. ${appNo} exists, is Approved, and its expiry is ` +
          `${patchedTo || 'UNPATCHED (still created+90d)'}. No extension has been spent. ` +
          'Segment 2 opens THIS record and performs the extension — the two films join on this number', 3000)
          .catch(() => {});
        await tick('seam-declared');
        await boCtx.close().catch(() => {});
      } else {
        await tick('seam-declared', appNo
          ? 'the overlay was never attached, so the seam could not be stated on camera'
          : 'no Application No to state the seam against');
      }

      const seamFile = rec.file.replace(/\.mp4$/, '_seam.json');
      fs.writeFileSync(seamFile, JSON.stringify(seam, null, 2), 'utf8');
      notes.push(`seam file: ${path.basename(seamFile)} — segment 2 reads its record from here`);
    } catch (err) {
      aborted = err;
      notes.push(`THE TAKE ABORTED: ${String(err && err.message).split('\n')[0].slice(0, 300)}`);
    } finally {
      await rec.stop().catch(() => {});
      // Stop re-asserting topmost and give the desktop back BEFORE anything else in
      // this block runs. A take that aborts must not leave the operator's screen
      // with a browser pinned in front of everything — and unpin() locates the
      // window by its marker, so it has to happen while the context is still open.
      if (topmost && topmost.stop) topmost.stop();
      await unpin().catch(() => {});
      if (dealerCtx) await dealerCtx.close().catch(() => {});

      for (const m of marks) {
        const out = rec.file.replace(/\.mp4$/, `_${m.key}-fullscreen.jpg`);
        const at = Math.max(0, (m.atMs - rec.startedAt) / 1000);
        const got = await extractFrame(rec.file, at, out).catch(() => null);
        if (got) stills.push(`  ${m.key.padEnd(22)} at ~${at.toFixed(1)}s -> ${path.basename(out)}`);
      }

      // Every click where the pointer could NOT be walked onto its target. Silent
      // here would be invisible in the sidecar and obvious in the video, which is
      // exactly backwards — the sidecar is what gets read.
      if (pointerNotes.length) {
        notes.push(`POINTER (${pointerNotes.length} click(s) without a walked cursor): ` +
                   pointerNotes.slice(0, 6).join(' | '));
      }
      const sidecar = rec.file.replace(/\.mp4$/, '.txt');
      const stalls = spot?.deadAir ? spot.deadAir() : [];
      const quiet = spot?.notes ?? [];
      const lines = [
        `EAINT-11982 evidence take — E2E SEGMENT 1 (creation)`,
        `scenario   ${sc.ref} — ${sc.title}`,
        `shape      e2e-creation   (ceiling ${points.length})`,
        `record     ${appNo || '(none created)'}`,
        `account    rig: ${role}`,
        `video      ${path.basename(rec.file)}`,
        ``,
        `SEGMENT 1 OF 2 — creation only. No Extend was clicked and no extension spent (R1).`,
        `           Segment 2 performs the extension on ${appNo || 'the record this take failed to create'}.`,
        ``,
        `CAPTURED ${captured.size}/${points.length}`,
        ...(aborted ? [
          `  ^ THE TAKE ABORTED — this count is a stopping point, not a coverage figure.`,
          `    Everything below the last tick is NOT REACHED.`,
          `    threw: ${String((aborted && aborted.message) || aborted).split('\n')[0].slice(0, 200)}`,
        ] : []),
        ...points.map((p) => `  [${captured.has(p.key) ? 'x' : ' '}] ${p.key.padEnd(22)} ${p.label}`),
        ``,
        `MISSING (${missing.length})`,
        ...(missing.length ? missing.map((m) => `  - ${m}`) : ['  (none)']),
        ``,
        `NOT APPLICABLE (${naPoints.length})`,
        ...(naPoints.length ? naPoints.map((n) => `  - ${n}`) : ['  (none)']),
        ``,
        `DEAD AIR (${stalls.length})   gaps of 5s+ with nothing annotated on camera`,
        ...(stalls.length ? stalls.map((s) => `  - ${s}`) : ['  (none)']),
        ``,
        `STILLS (${stills.length})`,
        ...(stills.length ? stills : ['  (none)']),
        ...(quiet.length ? ['', `QUIET FAILURES (${quiet.length})`, ...quiet.map((q) => `  - ${q}`)] : []),
        ``,
        `VERBATIM / OBSERVED`,
        ...notes.map((n) => `  ${n}`),
      ];
      fs.mkdirSync(path.dirname(sidecar), { recursive: true });
      fs.writeFileSync(sidecar, lines.join('\n'), 'utf8');
      console.log(`\n${lines.join('\n')}\n\nvideo: ${rec.file}`);
    }

    // The verdict comes AFTER the sidecar is written, so a failure still leaves the
    // film and the reasons on disk. A summary written in `finally` cannot see the
    // throw, which is why `aborted` is carried rather than inferred.
    if (aborted) throw aborted;
    expect(captured.size, `${sc.ref} segment 1 filmed ${captured.size} of ${points.length} creation legs — ` +
      'read MISSING in the sidecar; each entry says what could not be framed and why')
      .toBe(points.length);
  });
});
