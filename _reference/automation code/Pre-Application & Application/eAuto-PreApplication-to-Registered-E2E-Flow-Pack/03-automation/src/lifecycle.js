/**
 * THE LIFECYCLE LEG — the one thing an end-to-end flow exists to prove.
 *
 * WRITTEN 29-08-2026, replacing a checklist point that could never be captured.
 *
 * `lifecycle` is a single trigger point shared by eight E2E rows. For every
 * EXTEND-shaped one of them the recorder called tick() with a reason, and a reason
 * makes tick() push to MISSING and return — so the point was a hard-coded miss and
 * each of those rows sat at ceiling-minus-one whatever the take achieved. The stated
 * cause was supply:
 *
 *     "its lifecycle leg is the extension itself plus the reading at the far end,
 *      and neither can be filmed until a fixture exists (pool:status reads 0).
 *      Not a missing recorder branch — a missing fixture."
 *
 * Both halves were false. Fixtures exist, and `pool:status` reporting 0 is a known
 * fault of the counter rather than a census of the estate. A point billed to a
 * shortage that does not exist is worse than an empty one, because it reads as
 * answered — nobody re-opens a question the sidecar has already explained.
 *
 * WHAT A LIFECYCLE CLAIM IS, AND WHY IT IS DECLARED PER ROW
 *
 * Every other point in this rig is the same on every take: film the listing, film
 * the export, film the control. This one is different by design. E2E_TS1 and
 * E2E_TS2 share all sixteen of their other points and differ ONLY in their
 * lifecycle — one extends before expiry, the other after — so a shared branch could
 * not tell them apart, and a take of one would score identically to a take of the
 * other. A row with no entry here therefore REFUSES the point and names itself,
 * rather than ticking on a caption. That is the rule expectedState.js applies to
 * R21, for the same reason: a point that ticks without asserting is a point the next
 * take can break while reporting itself complete.
 *
 * WHY IT IS A MODULE AND NOT A BLOCK IN THE SPEC
 *
 * Because `node --check` cannot see a branch that never runs, and this rig has paid
 * for that twice — twenty-one branches written in one afternoon, none of them ever
 * executed, and seventeen call sites reading a helper that existed only inside
 * another function. Two of the four legs below ACT: E2E_TS6 patches the expiry and
 * E2E_TS7 opens a second window, and both run AFTER Confirm, where a throw costs the
 * fixture. Out here they can be driven against stubs by
 * `scripts/probe-lifecycle-legs.js`, including a run that proves each one can be
 * made to FAIL — a leg you cannot make fail on purpose is a leg whose pass means
 * nothing.
 *
 * ORDER. These are called from recordScenarioExtras(), the final section of a take,
 * so every core point is banked before any of them starts, and the caller wraps them
 * in try/catch.
 */
// REQUIRED AS MODULE OBJECTS, NOT DESTRUCTURED — and that is the whole reason these
// legs are provable. A destructured `const { openSecondSession } = require(...)` binds
// the function at load time, so scripts/probe-lifecycle-legs.js cannot substitute a
// stub for it and the two ACTING legs could only ever be exercised by spending a real
// fixture. Measured 29-08-2026: the first draft destructured, and the probe reported
// "Cannot read properties of null (reading newContext)" for both of them.
const pw = require('@playwright/test');
const dates = require('./dates');
const app = require('./application');
const support = require('./support');
const fixtureStore = require('./fixture');
const secondSession = require('./secondSession');

const NEWLINE = String.fromCharCode(10);

/** windowState, but a record with an unreadable expiry answers "do not know". */
function safeWindow(raw) {
  try { return raw ? dates.windowState(raw) : null; } catch { return null; }
}

/**
 * Re-read the application page from scratch.
 *
 * Never assume where the take left off: by the time the extras pass runs, the page
 * has been through the audit log and both R14 sweeps. A read taken on whatever
 * happened to be on screen is how a search page came to be reported as an R6
 * regression on 28-08.
 */
async function readApplication(ctx) {
  const { page, uuid } = ctx;
  await app.goto(page, uuid, app.TAB.regDocs).catch(() => {});
  const side = await app.readSidebar(page).catch(() => ({}));
  const ctl = await app.extendState(page)
    .catch(() => ({ present: false, inDom: false, enabled: false }));
  return { side, ctl };
}

const anchorOf = (ctx) => (app.sidebar ? app.sidebar(ctx.page).first() : ctx.page.locator('body'));

const CLAIMS = {
  /* --------------------------------------------------------------------- E2E_TS1
   * "New application to Approved, extended before expiry."
   *
   * The assertion that matters is NOT the arithmetic — it is that the record still
   * had run left when Confirm was pressed. On an already-expired record the build
   * applies R4 (click + 30) and the new date still looks tidy, so a take that only
   * checked "the date moved by 30" would film R4 under the name of R3 and report a
   * clean pass. That is why the window position is asserted separately.
   */
  /* --------------------------------------------------------------------- E2E_TS8
   * "Created before the deploy, extended after it - behaves exactly like a post-deploy
   * application."
   *
   * This is the only row in the family whose claim is COMPARATIVE, so it is the only
   * one that has to read a second record. Step 7 says so in as many words: compare the
   * whole result with a post-deploy application extended the same way.
   *
   * THE COMPARATOR IS READ, NEVER EXTENDED. An already-extended post-deploy record
   * shows every value this comparison needs, so the leg costs nothing and needs no
   * build - which matters, because building one would drag a reCAPTCHA and a person
   * into a row that is otherwise unattended. Supply it with:
   *
   *   EV_COMPARATOR_APP_NO=<no> EV_COMPARATOR_UUID=<uuid>
   *
   * and if either is missing the point is REFUSED rather than ticked on the subject
   * alone - a comparison with nothing to compare against is the caption-tick this
   * whole table exists to prevent.
   *
   * WHAT IS ASSERTED, AND WHAT IS NOT. The two axes read here are the ones that
   * survive a page reload on both records: Application Status and the state of the
   * Extend control. The ARITHMETIC is deliberately not re-derived from the comparator
   * - its own pre-extension expiry is long gone and cannot be read back - so the R3/R4
   * half of "the same way" is asserted on the SUBJECT, against its own before/after,
   * by the points that already do that. This leg adds the side-by-side that no other
   * point on the checklist provides.
   */
  'E2E_TS8': {
    expected: 'A pre-deploy application, extended today, ends in exactly the state a POST-deploy one ends '
      + 'in - Application Status Approved and the Extend control present but GREYED - which is what "no '
      + 'grandfathering" means when it is read off a screen rather than asserted in a sentence',
    film: async (ctx) => {
      const { spot, note, appNo, notes, tick, uuid } = ctx;
      const cmpNo = String(process.env.EV_COMPARATOR_APP_NO || '').trim();
      const cmpUuid = String(process.env.EV_COMPARATOR_UUID || '').trim();

      // The SUBJECT first, re-read from scratch rather than trusted from earlier in
      // the take - by now the page has been through the audit log and both sweeps.
      const subject = await readApplication(ctx);
      const subjStatus = String(subject.side.applicationStatus || '');
      const subjCtl = subject.ctl;
      notes.push('LIFECYCLE E2E_TS8 - subject ' + appNo + ': status ' + JSON.stringify(subjStatus)
        + ' control present=' + subjCtl.present + ' enabled=' + subjCtl.enabled);

      if (!cmpNo || !cmpUuid) {
        await tick(spot, 'lifecycle',
          'no post-deploy comparator was supplied, so the ONE claim this row makes - that a pre-deploy '
          + 'record behaves exactly like a post-deploy one - has nothing on the other side of the '
          + 'comparison. Re-run with EV_COMPARATOR_APP_NO and EV_COMPARATOR_UUID naming a post-deploy '
          + 'record that has ALREADY been extended (it is only read, never spent).');
        pw.expect.soft(false,
          'E2E_TS8 needs a post-deploy comparator; without one the row asserts nothing it does not '
          + 'already assert on the subject alone').toBeTruthy();
        return;
      }

      await note.narrate({
        step: 8,
        label: 'The lifecycle leg - the same extension, on a POST-deploy application',
        expected: 'Side by side, the two records end in the same state. That is the whole claim: the '
          + 'deploy boundary changes nothing',
      }).catch(() => {});

      // The COMPARATOR - read only. goto() then read; no click, no Confirm, nothing
      // that could spend it.
      await app.goto(ctx.page, cmpUuid, app.TAB.regDocs).catch(() => {});
      const cmpSide = await app.readSidebar(ctx.page).catch(() => ({}));
      const cmpCtl = await app.extendState(ctx.page)
        .catch(() => ({ present: false, inDom: false, enabled: false }));
      const cmpStatus = String(cmpSide.applicationStatus || '');
      notes.push('LIFECYCLE E2E_TS8 - comparator ' + cmpNo + ' (post-deploy, already extended): status '
        + JSON.stringify(cmpStatus) + ' control present=' + cmpCtl.present + ' enabled=' + cmpCtl.enabled);

      const sameStatus = subjStatus.toLowerCase() === cmpStatus.toLowerCase();
      const sameControl = subjCtl.present === cmpCtl.present && subjCtl.enabled === cmpCtl.enabled;
      notes.push('LIFECYCLE E2E_TS8 - status ' + (sameStatus ? 'AGREE' : 'DISAGREE')
        + ', control ' + (sameControl ? 'AGREE' : 'DISAGREE'));

      await spot.check(anchorOf(ctx),
        'The comparator ' + cmpNo + ' was created AFTER the deploy and extended the same way. It reads '
        + 'status ' + JSON.stringify(cmpStatus) + ' with the Extend control '
        + (cmpCtl.present ? (cmpCtl.enabled ? 'enabled' : 'present but greyed') : 'absent') + '. The '
        + 'pre-deploy record ' + appNo + ' reads status ' + JSON.stringify(subjStatus) + ' with the '
        + 'control ' + (subjCtl.present ? (subjCtl.enabled ? 'enabled' : 'present but greyed') : 'absent')
        + ' - ' + (sameStatus && sameControl ? 'the same on both axes, which is the claim'
                                             : 'and they DISAGREE, which is the finding'),
        4000).catch(() => {});

      // Put the take back on the record under test. Nothing downstream reads the page,
      // but leaving a take parked on a record it did not film is how a later screenshot
      // came to photograph the wrong application.
      await app.goto(ctx.page, uuid, app.TAB.regDocs).catch(() => {});

      if (sameStatus && sameControl) {
        await tick(spot, 'lifecycle');
      } else {
        await tick(spot, 'lifecycle',
          'the pre-deploy record and the post-deploy comparator did NOT end in the same state - status '
          + JSON.stringify(subjStatus) + ' vs ' + JSON.stringify(cmpStatus) + ', control enabled='
          + subjCtl.enabled + ' vs ' + cmpCtl.enabled + '. Filmed, and it is a finding: it would mean the '
          + 'deploy boundary DOES change behaviour, against Charmain\u2019s 26-08 ruling.');
      }

      pw.expect.soft(subjCtl.present,
        'E2E_TS8 - after extending, the pre-deploy record must still SHOW the Extend control (R6: it '
        + 'greys, it does not vanish)').toBe(true);
      pw.expect.soft(subjCtl.enabled,
        'E2E_TS8 - after extending, the pre-deploy record\u2019s control must be GREYED, not still '
        + 'clickable (R1/R6)').toBe(false);
      pw.expect.soft(sameControl,
        'E2E_TS8 - the pre-deploy record must end with the control in the same state as a post-deploy '
        + 'record extended the same way; that is the whole of "no grandfathering"').toBe(true);
      pw.expect.soft(sameStatus,
        'E2E_TS8 - the pre-deploy record must end at the same Application Status as the post-deploy '
        + 'comparator').toBe(true);
    },
  },

  'E2E_TS1': {
    expected: 'Born at the public gate, taken to Approved, and extended while the expiry was STILL IN THE '
      + 'FUTURE — R3: the new date counts from the ORIGINAL expiry, and the status does not move',
    film: async (ctx) => {
      const { spot, appNo, sidebar, expiryBefore, expiryAfter, notes, tick } = ctx;
      const { side } = await readApplication(ctx);
      const statusBefore = String(sidebar.applicationStatus || '');
      const statusNow = String(side.applicationStatus || '');
      const w = safeWindow(expiryBefore);
      const daysLeft = w && typeof w.daysToExpiry === 'number' ? w.daysToExpiry : null;
      const wasPreExpiry = daysLeft === null ? null : daysLeft > 0;
      const was = expiryBefore ? dates.parseListingDate(expiryBefore) : null;
      const predicted = was ? dates.ymd(dates.addDays(was, 30)) : null;
      const got = String(expiryAfter || '');
      const agrees = (predicted && got) ? got.startsWith(predicted) : null;

      notes.push('LIFECYCLE E2E_TS1 — ' + appNo + ': expiry before ' + JSON.stringify(expiryBefore)
        + ' (' + (wasPreExpiry === null ? 'position could not be computed'
          : wasPreExpiry ? daysLeft + ' day(s) still to run' : 'ALREADY PAST, which is R4 territory')
        + '), status ' + JSON.stringify(statusBefore) + ' -> ' + JSON.stringify(statusNow)
        + ', R3 predicts ' + predicted + ', the listing reads ' + JSON.stringify(got)
        + ' — ' + (agrees === null ? 'not comparable' : agrees ? 'AGREES' : 'DISAGREES'));

      await spot.check(anchorOf(ctx),
        appNo + ' ran the whole flow from the public gate to Approved, and was extended with '
        + (wasPreExpiry ? daysLeft + ' day(s) still to run' : 'its expiry ALREADY PAST')
        + '. R3: ' + (expiryBefore || '?') + ' + 30 days = ' + (predicted || '?')
        + ', and the listing now reads ' + (got || '?') + '. Status ' + (statusBefore || '?')
        + ' -> ' + (statusNow || '?') + ', which a before-expiry extension must leave alone', 3000);
      await tick(spot, 'lifecycle');

      pw.expect.soft(wasPreExpiry,
        'E2E_TS1 is the BEFORE-expiry case. If the record had already expired when Confirm was clicked the '
        + 'build applies R4 (click + 30) and this take is evidencing R4 under the name of R3 — the arithmetic '
        + 'would still look tidy, which is exactly why the window position has to be asserted separately').toBe(true);
      pw.expect.soft(agrees,
        'R3 — extended before expiry, the new expiry counts from the ORIGINAL expiry date, not the click').toBe(true);
      pw.expect.soft(statusNow.toLowerCase(),
        'R3 — a before-expiry extension leaves Application Status at Approved').toContain('approved');
    },
  },

  /* --------------------------------------------------------------------- E2E_TS2
   * "Left to expire, extended within 3 months."
   *
   * Its subject is the STATUS flip, and the trap is that the flip passes vacuously
   * on a record that was never Expired: nothing on the QA side writes Expired, the
   * midnight cron owns it, so a record patched into the past this morning still
   * reads Approved this afternoon. Assert the baseline, not just the outcome.
   */
  'E2E_TS2': {
    expected: 'Left to EXPIRE, then extended inside the 3-month window — R16 / REQ-007: Application Status '
      + 'goes Expired back to Approved, and R4 counts the new expiry from the click',
    film: async (ctx) => {
      const { spot, appNo, sidebar, expiryBefore, expiryAfter, notes, tick } = ctx;
      const { side } = await readApplication(ctx);
      const statusBefore = String(sidebar.applicationStatus || '');
      const statusNow = String(side.applicationStatus || '');
      const wasExpired = /expired/i.test(statusBefore);
      const w = safeWindow(expiryBefore);
      const got = String(expiryAfter || '');
      const predicted = dates.ymd(dates.addDays(dates.today(), 30));
      const agrees = got ? got.startsWith(predicted) : null;

      notes.push('LIFECYCLE E2E_TS2 — ' + appNo + ': status ' + JSON.stringify(statusBefore) + ' -> '
        + JSON.stringify(statusNow) + '; the expiry it carried, ' + JSON.stringify(expiryBefore)
        + ', sat ' + (w ? w.state : 'at a position that could not be computed')
        + '; R4 predicts ' + predicted + ', the listing reads ' + JSON.stringify(got)
        + ' — ' + (agrees === null ? 'not comparable' : agrees ? 'AGREES' : 'DISAGREES'));

      await spot.check(anchorOf(ctx),
        appNo + ' was created at the public gate, left until its expiry passed, and extended inside the 3 '
        + 'calendar months that follow. Application Status ' + (statusBefore || '?') + ' -> '
        + (statusNow || '?') + ' — REQ-007 puts an extended application back to Approved. R4: clicked today, '
        + 'so the new expiry is ' + predicted + ', and the listing reads ' + (got || '?'), 3000);
      await tick(spot, 'lifecycle');

      pw.expect.soft(wasExpired,
        'E2E_TS2 is the LEFT-TO-EXPIRE case, and only the midnight cron writes Expired. A record still '
        + 'reading Approved when Confirm was clicked has not been left to expire, so the Expired -> Approved '
        + 'half of this scenario proves nothing and would pass anyway').toBe(true);
      pw.expect.soft(statusNow.toLowerCase(),
        'R16 / REQ-007 — extending an expired application inside the window puts it back to Approved').toContain('approved');
      pw.expect.soft(agrees,
        'R4 — extended after expiry, the new expiry counts from the day of the CLICK').toBe(true);
    },
  },

  /* --------------------------------------------------------------------- E2E_TS4
   * "Extended once, and then the EXTENDED period expires too."
   *
   * TWO SITTINGS, and the gap between them is a midnight cron. Arm A ACTS — it patches
   * the newly extended expiry to expires-today so the cron has something to expire.
   * Arm B is where the row is judged.
   *
   * THE ASSERTION THAT MATTERS IS *WHICH DATE* EXPIRED. A record reading Expired the
   * next morning proves nothing on its own: it would read Expired if the job had acted
   * on the ORIGINAL date and ignored the extension entirely, which is the defect this
   * whole row hunts. So arm B compares the expiry the record now holds against the one
   * arm A wrote, and says so either way.
   */
  'E2E_TS4': {
    expected: 'Arm A: the extended expiry is patched to expire tonight — only the midnight cron writes '
      + 'Expired (R12). Arm B, the next morning: the record reads Expired ON THE EXTENDED DATE, and the '
      + 'Extend control is still there and GREYED — R6 outlives the extended period running out',
    film: async (ctx) => {
      const { spot, appNo, notes, tick, ref, browser, page, expiryAfter } = ctx;
      const arm = String(process.env.EV_ARM || '').trim().toUpperCase();

      /* ---------------------------------------------------------------- arm B */
      if (arm === 'B') {
        const { side, ctl } = await readApplication(ctx);
        const statusNow = String(side.applicationStatus || '');
        const expiryNow = String(side.expiryDate || side.applicationExpiryDate || '');
        const isExpired = /expired/i.test(statusNow);
        const greyed = ctl.present === true && ctl.enabled === false;

        // WHICH DATE DID IT EXPIRE ON? Arm A left the extended date in the fixture
        // checkpoint; without it this arm can still report the reading but cannot say
        // the job read the NEW date, and it must not pretend otherwise.
        let wrote = null;
        try { wrote = fixtureStore.checkpointByAppNo(appNo); } catch { wrote = null; }
        const banked = wrote && wrote.data ? wrote.data.e2eTs4ArmAExpiry : null;
        const armAExpiry = banked ? String(banked) : '';
        const onExtended = armAExpiry && expiryNow ? expiryNow.startsWith(armAExpiry.slice(0, 10)) : null;

        notes.push('LIFECYCLE E2E_TS4 arm B — ' + appNo + ': status ' + JSON.stringify(statusNow)
          + '; expiry now ' + JSON.stringify(expiryNow)
          + '; arm A wrote ' + JSON.stringify(armAExpiry || '(not recorded)')
          + ' — expired on the EXTENDED date: '
          + (onExtended === null ? 'NOT DETERMINED, arm A did not record it' : onExtended ? 'YES' : 'NO')
          + '; control present=' + ctl.present + ' enabled=' + ctl.enabled);

        await spot.check(anchorOf(ctx),
          appNo + ' was extended, and the EXTENDED period has now run out too. Application Status reads '
          + (statusNow || '?') + ' — written by the midnight cron, not by us (R12) — and the Extend control is '
          + (greyed ? 'still there and GREYED' : ctl.present ? 'still there and ENABLED' : 'GONE')
          + '. R6 says the once-only memory outlives the window closing', 3000);
        await tick(spot, 'lifecycle');

        pw.expect.soft(isExpired,
          'E2E_TS4 arm B is the morning-after sitting, and only the midnight cron writes Expired. A record '
          + 'still reading Approved has not had its extended period expire, so this arm proves nothing').toBe(true);
        pw.expect.soft(onExtended !== false,
          'E2E_TS4 — the job must have expired the record on the EXTENDED date. Expiring it on the ORIGINAL '
          + 'date and ignoring the extension is exactly the defect this row hunts, and it looks identical on '
          + 'the status alone').toBe(true);
        pw.expect.soft(greyed,
          'R6 — the extended period running out must not take the greyed control away. Only Registered '
          + 'removes it').toBe(true);
        return;
      }

      /* ---------------------------------------------------------------- arm A */
      const target = dates.expiryForState('expires-today');
      await ctx.note.narrate({
        step: 8,
        label: 'Setting the newly extended expiry to expire TONIGHT, on camera, with the support tool',
        expected: 'Arm A is setup, not the verdict: only the midnight cron writes Expired (R12), so the '
          + 'claim is filmed by arm B tomorrow',
      }).catch(() => {});

      let toolSaid = null;
      let pushed = false;
      const session = await secondSession.openSecondSession(browser, {
        label: 'the support tool — the extended expiry, set to expire tonight',
        clean: false,
        storageState: support.savedAuth(),
      });
      let toolThrew = null;
      try {
        await secondSession.bringForward(page, session, 'support tool — expire the extended period');
        // THE PATCH IS CAUGHT, NOT THROWN. A support tool that refuses is a failed
        // PRECONDITION, and this leg runs AFTER Confirm — the extension is already
        // spent. Letting it throw loses every point after this one and the sidecar
        // then says nothing about why. Reported, asserted below, take continues.
        try {
          const out = await support.setExpiry(session.page, {
            applicationNo: appNo,
            date: new Date(target.expiry),
          });
          toolSaid = (out && out.message) || null;
          pushed = true;
        } catch (e) {
          toolThrew = String(e && e.message ? e.message : e).split(NEWLINE)[0].slice(0, 200);
          notes.push('LIFECYCLE E2E_TS4 arm A — the support tool REFUSED the patch: ' + toolThrew
            + '. The extension is already spent, so this is a failed precondition on a record that '
            + 'cannot be rebuilt: arm B has no subject until the expiry is patched by hand.');
        }
        await session.spot.check(session.page.locator('body'),
          appNo + ' — its EXTENDED expiry ' + JSON.stringify(String(expiryAfter || '')) + ' is being moved to '
          + target.ymd + ', i.e. tonight. The support tool writes the DATE; only the cron writes the STATUS '
          + '(R12), which is why this row needs a second sitting', 2600).catch(() => {});
      } finally {
        await secondSession.handBack(page, session, ref).catch(() => {});
        await session.close().catch(() => {});
        await page.bringToFront().catch(() => {});
        if (spot.refreshChecklist) await spot.refreshChecklist().catch(() => {});
      }

      // BANK THE DATE ARM B HAS TO CHECK AGAINST. Without it arm B can report what it
      // sees and cannot say the job read the NEW date — see its assertion above.
      try {
        const banked = await fixtureStore.noteOnCheckpoint(appNo, { e2eTs4ArmAExpiry: target.ymd });
        notes.push('LIFECYCLE E2E_TS4 arm A — banked the patched expiry ' + target.ymd
          + (banked.ok ? ' on checkpoint ' + banked.label : ' FAILED: ' + banked.why)
          + '. Arm B compares the morning reading against it.');
      } catch (e) {
        notes.push('LIFECYCLE E2E_TS4 arm A — could not bank the arm-A expiry: '
          + String(e.message || e).split(NEWLINE)[0].slice(0, 160)
          + '. Arm B will report NOT DETERMINED rather than guessing.');
      }

      const { side } = await readApplication(ctx);
      const statusNow = String(side.applicationStatus || '');
      notes.push('LIFECYCLE E2E_TS4 arm A — ' + appNo + ': extended to ' + JSON.stringify(String(expiryAfter || ''))
        + ', then patched to ' + target.ymd + ' (tool said ' + JSON.stringify(toolSaid) + '). Status still '
        + JSON.stringify(statusNow) + ' — expected, because only the midnight cron writes Expired (R12).');

      await spot.check(anchorOf(ctx),
        appNo + ' has been extended and its NEW expiry now falls tonight. It still reads '
        + (statusNow || '?') + ' — the tool moves the date and the cron moves the status. Arm B films the '
        + 'claim tomorrow: TS=E2E_TS4 EV_ARM=B EV_APP_NO=' + appNo, 3000);
      await tick(spot, 'lifecycle');

      pw.expect.soft(pushed,
        'E2E_TS4 arm A — the extended expiry had to be patched to tonight, and the support tool did not '
        + 'confirm it' + (toolThrew ? ' (' + toolThrew + ')' : '')
        + '. Without that there is nothing for the cron to expire and arm B has no subject').toBe(true);
    },
  },

  /* --------------------------------------------------------------------- E2E_TS9
   * "The overnight auto-expire job, after a fresh extension."
   *
   * THIS ROW'S SUBJECT IS A MIDNIGHT, so it cannot be filmed in one sitting, and until
   * 31-08-2026 it was declared with no arm at all — a take would have filmed the setup
   * and reported itself complete. It now has arm A and arm B like E2E_TS4.
   *
   * WHAT IT PROVES, and the distinction is the whole row: E2E_TS4 proves the job
   * EVENTUALLY fires on the extended period. This proves it does NOT wrongly fire on
   * the OLD date. Classic "new column the job doesn't read".
   *
   * ARM B'S CLAIM IS AN ABSENCE — "nothing happened overnight" — so it needs the
   * positive control this row's own notes have demanded since 26-08: a never-extended
   * record at expires-today on the SAME night, which must flip to Expired. Without it a
   * cron that simply did not run is indistinguishable from a pass. The leg REPORTS
   * whether that control was supplied rather than quietly doing without it.
   */
  'E2E_TS9': {
    expected: 'Arm A: extended today, so the record carries a NEW expiry ~30 days out while its ORIGINAL '
      + 'date is today or already past. Arm B, the next morning: still Approved, still holding the extended '
      + 'expiry — the overnight job read the NEW date and did not act on the old one (R12)',
    film: async (ctx) => {
      const { spot, appNo, notes, tick, expiryBefore, expiryAfter, sidebar } = ctx;
      const arm = String(process.env.EV_ARM || '').trim().toUpperCase();
      const control = String(process.env.EV_CRON_CONTROL_APP_NO || '').trim();

      /* ---------------------------------------------------------------- arm B */
      if (arm === 'B') {
        const { side, ctl } = await readApplication(ctx);
        const statusNow = String(side.applicationStatus || '');
        const expiryNow = String(side.expiryDate || side.applicationExpiryDate || '');
        const stillApproved = /approved/i.test(statusNow);

        notes.push('LIFECYCLE E2E_TS9 arm B — ' + appNo + ': status ' + JSON.stringify(statusNow)
          + '; expiry ' + JSON.stringify(expiryNow)
          + '; control present=' + ctl.present + ' enabled=' + ctl.enabled);

        // THE POSITIVE CONTROL, and it is named rather than assumed.
        if (!control) {
          notes.push('LIFECYCLE E2E_TS9 arm B — NO CRON CONTROL SUPPLIED (EV_CRON_CONTROL_APP_NO unset). '
            + 'This arm asserts an ABSENCE — that the job did NOT expire this record — and a job that did '
            + 'not run at all looks exactly the same. The reading below is real; what it cannot rule out is '
            + 'that nothing happened last night to anything.');
        } else {
          notes.push('LIFECYCLE E2E_TS9 arm B — cron control is ' + control + '; it was left never-extended '
            + 'at expires-today and MUST read Expired this morning. If it does not, the job did not run and '
            + 'this row proves nothing.');
        }

        await spot.check(anchorOf(ctx),
          appNo + ' was extended yesterday, so its ORIGINAL expiry has passed and its NEW one has not. This '
          + 'morning it reads ' + (statusNow || '?') + ' with expiry ' + (expiryNow || '?')
          + ' — the overnight job has to read the NEW date. Expiring it on the old one is the defect this '
          + 'row exists to catch', 3000);
        await tick(spot, 'lifecycle');

        pw.expect.soft(stillApproved,
          'E2E_TS9 — a freshly extended application must NOT be expired overnight on its OLD date. Reading '
          + 'Expired here is the "job does not read the new column" defect').toBe(true);
        pw.expect.soft(Boolean(control),
          'E2E_TS9 arm B — this arm claims an absence, and an absence needs a control that could have shown '
          + 'a presence. Set EV_CRON_CONTROL_APP_NO to a never-extended record left at expires-today on the '
          + 'same night').toBe(true);
        return;
      }

      /* ---------------------------------------------------------------- arm A */
      const wBefore = safeWindow(expiryBefore);
      const got = String(expiryAfter || '');
      // READ THE RECORD AS IT IS NOW, not as the take found it. `sidebar` is the
      // BEFORE-reading, taken before Confirm; asserting on it would grade the record
      // this leg was handed rather than the one the extension left behind, and a leg
      // that cannot see the after-state cannot be made to fail on it. Caught by
      // probe-lifecycle-legs.js, which ticked clean on a record that had gone Expired.
      const { side: sideNow } = await readApplication(ctx);
      const statusNow = String(sideNow.applicationStatus || sidebar.applicationStatus || '');
      const predicted = dates.ymd(dates.addDays(dates.today(), 30));
      const movedForward = got ? got.slice(0, 10) > dates.ymd(dates.today()) : null;

      notes.push('LIFECYCLE E2E_TS9 arm A — ' + appNo + ': the expiry it carried, ' + JSON.stringify(expiryBefore)
        + ', sat ' + (wBefore ? wBefore.state : 'at a position that could not be computed')
        + '; after the extension the listing reads ' + JSON.stringify(got)
        + ' — in the future: ' + (movedForward === null ? 'not comparable' : movedForward ? 'YES' : 'NO')
        + '. Tonight the job has to read THAT date and not the old one.');
      if (!control) {
        notes.push('LIFECYCLE E2E_TS9 arm A — EV_CRON_CONTROL_APP_NO is unset. Arm B asserts an absence and '
          + 'will need a never-extended record left at expires-today TONIGHT to prove the cron ran at all. '
          + 'Set one up before the midnight, or arm B cannot close.');
      }

      await spot.check(anchorOf(ctx),
        appNo + ' has just been extended: its ORIGINAL expiry ' + (String(expiryBefore || '?'))
        + ' is spent, and the new one reads ' + (got || '?') + '. Nothing more can be shown today — the '
        + 'claim is what the overnight job does with those two dates. Arm B films it tomorrow: '
        + 'TS=E2E_TS9 EV_ARM=B EV_APP_NO=' + appNo, 3000);
      await tick(spot, 'lifecycle');

      // BOTH halves, and they are ANDed. Either alone is satisfiable by a record this
      // arm has no business filming: a future date on a record that is already Expired,
      // or an Approved record whose expiry did not move.
      pw.expect.soft(/approved/i.test(statusNow),
        'E2E_TS9 arm A — REQ-007 puts an extended application at Approved. A record reading '
        + JSON.stringify(statusNow) + ' after the extension has nothing for the overnight job to leave '
        + 'alone').toBe(true);
      pw.expect.soft(movedForward === true,
        'E2E_TS9 arm A — after the extension the record must carry a FUTURE expiry for the overnight job to '
        + 'read. Without that there is nothing for arm B to be about').toBe(true);
      void predicted;
    },
  },

  /* --------------------------------------------------------------------- E2E_TS6
   * "Extended once, then pushed past the 3-month window."
   *
   * THE ONLY LIFECYCLE LEG THAT ACTS RATHER THAN READS, and it acts after Confirm.
   * The push IS the case: the window governs whether an extension is OFFERED, and
   * this record has already spent its one, so R6 has to outlive the window closing.
   * Reading a record that is merely already-extended proves the first half and says
   * nothing about the second — which is what every earlier reading of this row did.
   *
   * The support tool is brought ON CAMERA the way session B is. A patch performed in
   * a window the camera never saw is a precondition arranged off screen, and filming
   * from the gate exists to stop exactly that.
   */
  'E2E_TS6': {
    expected: 'Its one extension is spent. Pushing the expiry PAST the 3-month window does not bring the '
      + 'button back and does not take the once-only message away (R6 outlives the window)',
    film: async (ctx) => {
      const { spot, note, page, appNo, browser, notes, tick, ref, raiseTooltip, bankGreyed } = ctx;
      const target = dates.expiryForState('after-window');

      await note.narrate({
        step: 8,
        label: 'Pushing the expiry PAST the 3-month window, on camera, with the support tool',
        expected: 'The window shuts for good — and the greyed control and its once-only message stay put (R6)',
      }).catch(() => {});

      let toolSaid = null;
      let toolFramed = null;
      let pushed = false;
      const session = await secondSession.openSecondSession(browser, {
        label: 'the support tool — pushing the expiry past the window',
        clean: false,
        storageState: support.savedAuth(),
      });
      try {
        toolFramed = await secondSession.bringForward(page, session, 'support tool — expiry pushed past the window');
        const out = await support.setExpiry(session.page, {
          applicationNo: appNo,
          date: new Date(target.expiry),
        });
        toolSaid = (out && out.message) || null;
        pushed = true;
        await session.spot.check(session.page.locator('body'),
          appNo + ' — its expiry is being moved to ' + target.ymd + ', past expiry plus 3 calendar months. '
          + 'The extension window shuts for good at that point', 2400).catch(() => {});
      } finally {
        await secondSession.handBack(page, session, ref).catch(() => {});
        await session.close().catch(() => {});
        await page.bringToFront().catch(() => {});
        if (spot.refreshChecklist) await spot.refreshChecklist().catch(() => {});
      }

      // READ UNTIL THE PAGE AGREES WITH THE DATABASE, NOT ONCE — 29-08-2026 night.
      //
      // The support tool writes, and the application page can still render the OLD
      // state for a few seconds. Measured: a probe that patched NA68001124 past the
      // window and read straight afterwards saw the greyed control still there, and a
      // fresh browser minutes later saw it gone. Read the direction that mistake runs
      // in HERE: a stale read shows the control STILL GREYED, which is exactly what
      // this row claims should happen — so it would tick the point and hide the very
      // defect the leg exists to find. A false pass, not a false alarm.
      //
      // So: re-read until two consecutive reads agree, up to ~12s, and print how long
      // it took. A settle time in the sidecar is the thing that tells the next reader
      // whether the reading was taken on a page that had finished changing.
      let ctl = null; let side = {}; let settleMs = 0; let stable = 0; let last = null;
      for (;;) {
        const r = await readApplication(ctx);
        side = r.side; ctl = r.ctl;
        const sig = JSON.stringify([ctl.present, ctl.inDom, ctl.enabled]);
        if (sig === last) { stable += 1; if (stable >= 1) break; } else { stable = 0; }
        last = sig;
        if (settleMs >= 12000) break;
        await ctx.page.waitForTimeout(2000).catch(() => {});
        settleMs += 2000;
      }
      notes.push('  the control reading settled after ' + settleMs + 'ms' +
        (settleMs >= 12000 ? ' — NEVER SETTLED, so this reading may have been taken mid-render' : ''));
      const nowExpiry = String(side.applicationExpiryDate || side.expiryDate || target.ymd);
      const w = safeWindow(target.ymd);
      const outsideNow = w ? w.state === 'after-window' : null;

      notes.push('LIFECYCLE E2E_TS6 — ' + appNo + ': expiry pushed to ' + target.ymd
        + ' (target state ' + (w ? w.state : '?') + '); the tool said ' + JSON.stringify(toolSaid)
        + '; the tool window was ' + (toolFramed ? toolFramed.verdict : 'not measured')
        + '; the control afterwards read present=' + ctl.present + ' inDom=' + ctl.inDom
        + ' enabled=' + ctl.enabled);

      if (!pushed) {
        await tick(spot, 'lifecycle',
          'the expiry could not be pushed past the window, so the record never reached the state this '
          + 'scenario is about. Any greyed control seen here is the ordinary R6 reading that TS03 and TS07 '
          + 'already own — it is not evidence for this row');
        pw.expect.soft(false, 'E2E_TS6 could not move the expiry past the window').toBeTruthy();
        return;
      }

      if (ctl.present && !ctl.enabled) {
        const region = await app.extendRegion(page);
        const raised = await raiseTooltip(spot, region.loc, 'after the window closed behind an extended record');
        await spot.check(raised.targets,
          appNo + ' has been extended once, and its expiry now reads ' + nowExpiry + ' — past expiry plus 3 '
          + 'calendar months, so the window is shut. The Extend button is STILL THERE and STILL GREYED'
          + (raised.tip.rendered
            ? ', and the once-only message still paints: "' + raised.tip.visibleText + '"'
            : ', but THE MESSAGE DID NOT PAINT — a greyed control with no visible reason')
          + '. The window decides whether an extension is OFFERED; this record has already spent its one',
          2600,
          { hoverHost: raised.hoverHost, hoverLabel: 'span.extend-wrap — the CSS host of the tooltip' });
        await bankGreyed(spot, 'lifecycle', raised.tip, 'after the window closed');
      } else {
        await tick(spot, 'lifecycle',
          'once the window was pushed shut the control read present=' + ctl.present + ' inDom=' + ctl.inDom
          + ' enabled=' + ctl.enabled + '. This row claims the greyed button and its message STAY, so there '
          + 'was no greyed state left to film — that is the finding, not a gap in the recorder');
      }

      pw.expect.soft(outsideNow,
        'E2E_TS6 needs the record to end up genuinely OUTSIDE the window, or "the message stays past the '
        + 'window" is a claim about a record still inside it').toBe(true);
      pw.expect.soft(ctl.present && !ctl.enabled,
        'R6 outlives the window — an application that has spent its one extension keeps the greyed button '
        + 'and the once-only message after the 3-month window closes behind it').toBeTruthy();
    },
  },

  /* --------------------------------------------------------------------- E2E_TS7
   * "Post-expiry extension, dealer finishes on the portal."
   *
   * Segment 1 already filmed this dealer submitting and paying, so the form is not
   * what is in question — whether the extension gave the dealer their application
   * BACK is. The link is read off the rig's own fixture checkpoints because it
   * carries a signature (?id=..&s=..) that appears nowhere in the markup, so no
   * selector could ever rebuild it; that already cost TS16 a fixture once.
   */
  'E2E_TS7': {
    expected: 'The post-expiry extension put the record back to Approved, and the dealer link reaches their '
      + 'application again rather than being refused',
    film: async (ctx) => {
      const { spot, note, page, appNo, sidebar, browser, notes, tick, ref } = ctx;
      const { side } = await readApplication(ctx);
      const statusBefore = String(sidebar.applicationStatus || '');
      const statusNow = String(side.applicationStatus || '');
      const found = fixtureStore.dealerLinkFor(appNo);

      notes.push('LIFECYCLE E2E_TS7 — ' + appNo + ': status ' + JSON.stringify(statusBefore) + ' -> '
        + JSON.stringify(statusNow) + '; dealer link '
        + (found ? 'read from ' + found.from : 'NOT FOUND in any fixture checkpoint'));

      if (!found) {
        await tick(spot, 'lifecycle',
          'no dealer link for ' + appNo + ' in any fixture checkpoint, so the dealer half of this row could '
          + 'not be filmed. The link is not resolvable from the page — its signature appears nowhere in the '
          + 'markup — so this is a real gap, not something a retry fixes');
        pw.expect.soft(false, 'E2E_TS7 needs the dealer application link and none was on disk').toBeTruthy();
        return;
      }

      await note.narrate({
        step: 8,
        label: 'The dealer side, in a clean session — can they still reach the application?',
        expected: 'The link opens their application. The extension is what gave it back to them',
      }).catch(() => {});

      let reached = null;
      let heading = '';
      let refusal = '';
      const dealer = await secondSession.openSecondSession(browser, {
        label: 'the dealer — a clean session, no BackOffice cookies',
        clean: true,
      });
      try {
        await secondSession.bringForward(page, dealer, 'the dealer portal — a clean session');
        await dealer.page.goto(found.link, { waitUntil: 'domcontentloaded' }).catch(() => {});
        await dealer.page.waitForTimeout(1500);
        const body = String(await dealer.page.locator('body').innerText().catch(() => ''));
        heading = body.split(NEWLINE).map((l) => l.trim()).filter(Boolean).slice(0, 4).join(' | ');
        const bad = /expired|no longer|not found|invalid|unauthoris|unauthoriz/i.exec(body);
        refusal = bad ? bad[0] : '';
        reached = !!body.trim() && !bad;
        await dealer.spot.check(dealer.page.locator('body'),
          reached
            ? 'The dealer opens their own link in a clean session and reaches ' + appNo + ' — the extension '
              + 'is what put the application back within reach. Top of the page: ' + heading
            : 'The dealer link does NOT reach the application: the page answers '
              + JSON.stringify(refusal || '(nothing readable)') + '. That is the half this scenario exists '
              + 'to prove, and it failed',
          3000).catch(() => {});
      } finally {
        await secondSession.handBack(page, dealer, ref).catch(() => {});
        await dealer.close().catch(() => {});
        await page.bringToFront().catch(() => {});
        if (spot.refreshChecklist) await spot.refreshChecklist().catch(() => {});
      }

      notes.push('  dealer portal: reached=' + reached + ' refusal=' + JSON.stringify(refusal)
        + ' top=' + JSON.stringify(heading));

      if (reached) {
        await tick(spot, 'lifecycle');
      } else {
        await tick(spot, 'lifecycle',
          'the dealer link answered ' + JSON.stringify(refusal || '(nothing readable)') + ' instead of the '
          + 'application, so the dealer did not get their application back. Filmed, and it is a finding');
      }

      pw.expect.soft(/expired/i.test(statusBefore),
        'E2E_TS7 is the POST-EXPIRY case: the record has to have been Expired when Confirm was clicked, or '
        + 'the Expired -> Approved flip this row hands back to the dealer never happened').toBe(true);
      pw.expect.soft(statusNow.toLowerCase(),
        'REQ-007 — the extension puts the application back to Approved before the dealer returns to it').toContain('approved');
      pw.expect.soft(reached,
        'E2E_TS7 — the whole point of granting the extension is that the dealer can reach and finish the '
        + 'application it was granted for').toBe(true);
    },
  },
};

/** The claim for `ref`, or null — and null means the point is refused, not skipped. */
const claimFor = (ref) => CLAIMS[ref] || null;

/** Which rows have a declared lifecycle claim. Used by the probe and by check:docs. */
const declaredRefs = () => Object.keys(CLAIMS);

/* ROWS WHOSE CLAIM NEEDS TWO SITTINGS, AND WHY THIS IS EXPORTED.
 *
 * Both of these rows are about what the MIDNIGHT JOB does with an extended date, so no
 * single sitting can observe them: arm A extends and sets the date up, arm B reads what
 * the job did the next morning. Arm A is SETUP. It is not half a verdict, it is none of
 * one.
 *
 * 31-08-2026: E2E_TS4 arm A filmed a full 17/17, and `reconcile-sweep.mjs` promptly
 * listed the row under CLEAN SIDECAR, RESULT NOT YET Pass. The sweep understands
 * SEGMENTS (it spots a segment-1 take by its filename prefix) and knew nothing about
 * ARMS, so a setup take scoring full marks read to it as the scenario proper. That is
 * the exact failure arms were introduced to prevent — a take that films the setup and
 * calls itself complete — reappearing one level up, in the reconciler, on the row's
 * behalf.
 *
 * It is exported rather than re-listed in the sweep so there is ONE list. A row that
 * gains an arm must not have to be remembered about in a second file. */
// THE SECOND COPY OF THE ARM LIST, AND IT DRIFTED THE DAY E2E_TS10 GAINED ARMS.
//
// The sweep imports this rather than keeping its own, which was the right instinct —
// but `SWEPT_ARMS` in triggerPoints.js is the list the RECORDER reads, and adding a
// row there on 31-08-2026 left this one behind. The sweep then could not see that
// E2E_TS10 had filmed arm A and owed arm B, and reported it as an ordinary short row.
//
// Kept in step by `npm run check:points`, which now fails if the two disagree.
const TWO_ARMED = new Set(['E2E_TS4', 'E2E_TS9', 'E2E_TS10']);

module.exports = { CLAIMS, claimFor, declaredRefs, safeWindow, readApplication, NEWLINE, TWO_ARMED };
