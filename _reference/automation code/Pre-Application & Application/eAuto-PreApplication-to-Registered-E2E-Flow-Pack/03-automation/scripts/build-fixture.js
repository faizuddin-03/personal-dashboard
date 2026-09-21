/**
 * Fixture builder — one dealer, from the reCAPTCHA gate to an Approved
 * application with its expiry recorded, ready for an Extend case.
 *
 *   npm run fixture                    # build a new one (headed, assisted)
 *   npm run fixture -- --resume        # carry on with the newest half-built one
 *   npm run fixture -- --resume fx-260824-1130 --from regdocs
 *   npm run fixture -- --dry-run       # show the plan and the generated dealer
 *   npm run fixture -- --until submit-approval   # stop mid-workflow, not at Approved
 *
 * --until leaves the application at an INTERMEDIATE state instead of Approved, for rows
 * that consume a spare at some earlier point in the workflow (TS18.2 needs one at Pending
 * and one at Verified). Verify the resulting Application Status by reading the record —
 * the phase name is this script's word for a step, not the app's word for a status.
 *
 * WHY THIS EXISTS
 *
 * E2E_TS1 costs roughly 12 minutes of hands-on clicking before the Extend
 * button is even reachable, and every positive Extend case needs its own
 * application because the extension is once-only (R1). That is the real reason
 * the E2E cases are expensive — not the assertions, the fixtures.
 *
 * This script does not remove the human. It reduces them to the two gates that
 * are genuinely not ours to pass: the reCAPTCHA tick and the FPX simulator. It
 * pauses, waits for the page to change, and carries on by itself.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * - It never clicks Extend. Building the fixture and spending its one
 *   extension are separate acts, and the second one belongs to a test.
 * - It never creates the company account. Hardcopy Doc = Registered removes the
 *   Extend button entirely (R9), so the build stops one step short of it.
 * - It cannot patch the expiry date. TS05–TS09 need the expiry moved and that
 *   is Q12, still unanswered — no script here can fake it.
 *
 * FIRST RUN IS ASSISTED, ON PURPOSE
 *
 * Everything past the gate is unobserved (preapp-flow.har proves the recording
 * never got through). Field maps in src/preapp.js are the SRD's wording turned
 * into hints; when one misses, the page is dumped to ./discovery and the run
 * waits for you to do that one field by hand. Then fold
 * discovery/locators-learned.json back into the maps and the next build is
 * unattended between the two gates.
 */
const { chromium } = require('@playwright/test');
const { login } = require('../src/login');
const { ROLES, BASE, INSTANCE } = require('../src/env');
const listing = require('../src/listing');
const assist = require('../src/assist');
const preapp = require('../src/preapp');
const bo = require('../src/onboarding');
const fixture = require('../src/fixture');

/* ------------------------------------------------------------------ arguments */

const NEWLINE = '\n';
const argv = process.argv.slice(2);
const flag = (name) => argv.includes('--' + name);
const opt = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
};

/**
 * ONE ROUTE TO A FIXTURE: THE PRE-APPLICATION FLOW.
 *
 * Charmain, 27-08-2026: *"make sure all transaction created from preapplication,
 * i dont want the manual application way to create the trx, we didnt cover that
 * part in this ticket."* So `public` — the dealer's real journey, pre-application
 * form, RM 108.00 fee, BackOffice approval, application form, approvals,
 * registration documents — is the only route, and it is the default.
 *
 * The BackOffice "UCD New Application" panel used to be the default here and is
 * now REFUSED (see the check below and src/onboarding.js). Its two selling
 * points both fail on inspection:
 *
 *   - it was the only route that covered SSM business types, because the public
 *     form's checkSSM.do rejects every generated BRN and silently falls back to
 *     Business Trading — but business type has no bearing on the expiry date or
 *     on Extend, so that coverage is not this ticket's;
 *   - it was cheaper (no reCAPTCHA, one payment instead of two) — and it never
 *     worked end to end regardless, stalling at approve-app on 26-08 because the
 *     assignee's edit page carries no "Submit for Approval" button.
 *
 * The route it produced instead was a stub with no expiry date at all, which is
 * what R19/TS51 is written about. Nothing this rig tests can be built that way.
 */
const ROUTES = {
  public: [
    'gate',            // human ticks reCAPTCHA; session saved
    'preapp',          // Pre-Application Form -> review -> Submit and Pay -> FPX
    'approve-preapp',  // BackOffice approver: approve, read the dealer link
    'appform',
    'assign',
    'submit-approval',
    'approve-app',
    'regdocs',
    'verify-regdocs',
    'regfee',
    'record',
  ],
};

const headless = flag('headless');
const dryRun = flag('dry-run');
const resumeArg = opt('resume', false);
const routeArg = String(opt('route', 'public'));

// The manual application route is closed (R22). Refuse the flag by name rather
// than silently building something else — a fixture whose origin is not the
// pre-application form is out of scope for this ticket, and a quiet fallback
// would hide that from whoever reads the checkpoint later.
if (routeArg !== 'public') {
  console.error([
    '',
    '  --route ' + routeArg + ' is not available. Every transaction must be created from the',
    '  Pre-Application Form (Charmain, 27-08-2026 — the manual "UCD New Application" route',
    '  is out of scope for EAINT-11982; vault R22).',
    '',
    '  Drop the flag:  npm run fixture',
    '',
  ].join(NEWLINE));
  process.exit(1);
}

/* ------------------------------------------------------------------- helpers */

const say = (s) => console.log(s);
const rule = (s) => say('\n' + '─'.repeat(72) + '\n  ' + s + '\n' + '─'.repeat(72));

/** A BackOffice session for one role, closed as soon as its phase is done. */
async function asRole(browser, roleKey, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  try {
    const who = await login(page, roleKey);
    say('    logged in as ' + who.key + ' (' + who.label + ')');
    return await fn(page);
  } finally {
    await ctx.close();
  }
}

/* ---------------------------------------------------------------------- main */

(async () => {
  const label = typeof resumeArg === 'string' ? resumeArg : resumeArg ? await fixture.latestLabel() : null;
  let cp = label ? await fixture.readCheckpoint(label) : null;

  if (resumeArg && !cp) {
    console.error('\n  Nothing to resume — no checkpoint in fixtures/. Drop --resume to build a new dealer.\n');
    process.exit(1);
  }

  // --company pins the company name so a SECOND build can be handed the same one.
  // TS33 is the only caller: two applications, one dealer. Build them back to back —
  // the reCAPTCHA gate is per SITTING, not per record, so the pair costs one tick.
  //
  //   node scripts/build-fixture.js --company "CHARMAIN QA11982 TS33 PAIR ENTERPRISE"
  //   node scripts/build-fixture.js --company "CHARMAIN QA11982 TS33 PAIR ENTERPRISE"
  //
  // Keep CHARMAIN in the name: it is the owner tag, and it is how these records are
  // known to be ours before anything irreversible is done to them.
  const profile = cp ? cp.profile : fixture.newProfile({
    type: opt('type', undefined),
    label: opt('label', undefined),
    sharedCompany: opt('company', undefined),
  });
  const runLabel = cp ? cp.label : profile.label;
  const route = 'public';
  if (cp && cp.route && cp.route !== 'public') {
    console.error([
      '',
      '  ' + runLabel + ' was started on the ' + cp.route + ' route, which is now closed (R22).',
      '  Resuming it would carry on a transaction that was not created from the',
      '  Pre-Application Form. Start a fresh build instead:  npm run fixture',
      '',
    ].join(NEWLINE));
    process.exit(1);
  }
  const PHASES = ROUTES[route];
  const from = opt('from', null);
  const only = opt('only', null);

  /* --until <phase>: STOP AFTER THAT PHASE, leaving the application mid-workflow.
   *
   * 31-08-2026, for TS18.2. That row consumes two SPARES that this builder could not
   * produce, because it only knew how to run to Approved:
   *
   *   EV_SECOND_APP_NO   still at PENDING   — where "Revert to UCD" renders
   *   EV_THIRD_APP_NO    already at VERIFIED — where "Verified / Create Account" render
   *
   * Both states are ones this flow PASSES THROUGH on its way to Approved, so they cost
   * nothing extra to produce — they were simply unreachable, and the row read as "needs a
   * build" when what it needed was a stopping place.
   *
   * THE PHASE NAME IS NOT THE STATUS. These are the builder's own step names, and which
   * Application Status each one leaves behind is a claim about the app, not about this
   * list. Read the record back after the build and believe THAT. */
  const until = opt('until', null);
  if (until && !PHASES.includes(until)) {
    console.error(`\n  --until ${until} is not a phase of route "${route}".`);
    console.error(`  known: ${PHASES.join(', ')}\n`);
    process.exit(2);
  }

  // A phase already DONE is not in `list`, so indexOf gives -1 and slice(0, 0) would
  // build NOTHING and print it as an ordinary short plan. Say it instead.
  const upto = (list) => {
    if (!until) return list;
    const i = list.indexOf(until);
    if (i === -1) {
      console.error(`\n  --until ${until}: that phase is not in this run's plan.`);
      console.error(`  It is a real phase, so it is already done on this checkpoint — there is nothing`);
      console.error(`  left to build up to. Use --from ${until} to redo it, or pick a later phase.`);
      console.error(`  this run would have covered: ${list.join(', ') || '(nothing)'}\n`);
      process.exit(2);
    }
    return list.slice(0, i + 1);
  };
  const wanted = only
    ? [only]
    : upto(PHASES.slice(from ? Math.max(0, PHASES.indexOf(from)) : 0)
      .filter((p) => (from ? true : !fixture.isDone(cp, p))));

  rule('EAINT-11982 fixture build — ' + runLabel);
  say('  dealer      ' + profile.businessName);
  say('  type        ' + profile.typeOfBusiness + (profile.isSsm ? ' (SSM — BRN path)' : ' (Non-SSM — trading licence path)'));
  say('  brn / tin   ' + profile.newBrn + '  /  ' + profile.tin);
  say('  admin       ' + profile.adminName + '  <' + profile.adminEmail + '>');
  say('  target      ' + BASE + '  (' + INSTANCE + ')');
  say('  roles       approver=' + ROLES.approver + '  assignee=' + ROLES.assignee);
  say('  route       ' + route + '  (pre-application: captcha + both fees, Non-SSM types)');
  say('  phases      ' + (wanted.length ? wanted.join(' -> ') : '(nothing left to do)'));
  if (cp && cp.applicationNo) say('  application ' + cp.applicationNo + (cp.uuid ? '  uuid=' + cp.uuid : ''));

  if (dryRun) {
    say('\n  --dry-run: nothing was launched. Save fixtures/profile.json to change any value above.\n');
    return;
  }
  if (!wanted.length) {
    say('\n  Already complete. Use --from <phase> to redo part of it.\n');
    return;
  }
  if (headless && wanted.includes('gate') && !preapp.gateStatePath()) {
    console.error('\n  --headless with no saved gate session: the reCAPTCHA needs a human. Run headed once.\n');
    process.exit(1);
  }

  await fixture.writeCheckpoint(runLabel, { profile, base: BASE, instance: INSTANCE, route });

  const browser = await chromium.launch({ headless, slowMo: headless ? 0 : 120 });
  // The dealer context is long-lived: it carries the passed gate, and reusing it
  // is what makes a second fixture cheaper than the first.
  const dealerCtx = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    storageState: preapp.gateStatePath(),
  });
  const dealer = await dealerCtx.newPage();

  const done = (phase, detail) => fixture.markPhase(runLabel, phase, detail);
  const state = async () => (await fixture.readCheckpoint(runLabel)) || {};

  try {
    for (const phase of wanted) {
      rule(phase);
      const cur = await state();

      if (phase === 'genlink') {
        // UNREACHABLE from any route since 27-08-2026 — no phase list names it.
        // Kept only so `--only genlink` fails at the guard in onboarding.js with
        // the reason, rather than at an "unknown phase" that explains nothing.
        const out = await asRole(browser, ROLES.approver, (page) => bo.generateApplicationLink(page, profile));
        await fixture.writeCheckpoint(runLabel, { dealerLink: out.link, generateKind: out.kind });
        await done('genlink', out);

      } else if (phase === 'gate') {
        const gate = await preapp.passGate(dealer);
        await done('gate', gate);

      } else if (phase === 'preapp') {
        await preapp.fillPreApplicationForm(dealer, profile);
        const res = await preapp.reviewAndPay(dealer, profile, { method: opt('pay', 'fpx'), bank: opt('bank', undefined) });
        await fixture.writeCheckpoint(runLabel, { preAppUuid: res.uuid });
        await done('preapp', { preAppUuid: res.uuid });

      } else if (phase === 'approve-preapp') {
        const out = await asRole(browser, ROLES.approver, async (page) => {
          const found = await bo.openPreApplication(page, profile.businessName);
          // found.page: View opens a new tab, so Approve lives there, not on `page`
          const approved = await bo.approvePreApplication(found.page);
          return { preAppUuid: found.uuid, link: approved.link };
        });
        await fixture.writeCheckpoint(runLabel, { preAppUuid: out.preAppUuid, dealerLink: out.link });
        await done('approve-preapp', out);

      } else if (phase === 'appform') {
        const link = cur.dealerLink || opt('link', null);
        if (!link) throw new Error('no dealer link on the checkpoint — rerun --only approve-preapp, or pass --link <url>');
        await preapp.fillApplicationForm(dealer, profile, link);
        await done('appform', {});

      } else if (phase === 'assign') {
        // The approver hands the record to the assignee (video 5:30) — before
        // the assignee ever opens it. This is also where the run first learns
        // its Application No and uuid, so they go straight onto the checkpoint.
        const out = await asRole(browser, ROLES.approver, async (page) => {
          const row = await listing.findByCompanyName(page, profile.businessName);
          say('    application no: ' + row.applicationNo);
          const uuid = await listing.openApplication(page, row.applicationNo);

          // Save the identity BEFORE attempting the assignment. Learning the
          // Application No is the half of this phase that cannot be redone
          // cheaply, and on the 26-08 build it was thrown away: the assignment
          // failed, the checkpoint was never written, and a resume had to
          // re-find a record it had already found.
          await fixture.writeCheckpoint(runLabel, { applicationNo: row.applicationNo, uuid });

          const assigned = await bo.assignApplication(page, uuid, opt('assignee-name', undefined));
          return { applicationNo: row.applicationNo, uuid, assigned: assigned?.assigned !== false };
        });
        await fixture.writeCheckpoint(runLabel, out);
        if (!out.assigned) {
          say('    the Assignee dropdown is not offered this early — the approve-app phase retries it');
        }
        await done('assign', out);

      } else if (phase === 'submit-approval') {
        const out = await asRole(browser, ROLES.assignee, async (page) => {
          let { applicationNo, uuid } = cur;
          if (!uuid) {
            const row = await listing.findByCompanyName(page, profile.businessName);
            applicationNo = row.applicationNo;
            uuid = await listing.openApplication(page, applicationNo);
          }
          say('    application no: ' + applicationNo);
          await bo.setUcdGroupAndSubmit(page, uuid, profile.ucdGroup);
          return { applicationNo, uuid };
        });
        await fixture.writeCheckpoint(runLabel, out);
        await done('submit-approval', out);

      } else if (phase === 'approve-app') {
        const uuid = requireUuid(cur);
        const out = await asRole(browser, ROLES.approver, async (page) => {
          await bo.approveApplication(page, uuid);
          // Second bite at the assignment. The dropdown is not rendered on a
          // freshly submitted record, so the assign phase may have deferred;
          // by Approved it is there. A fixture left unassigned is still usable
          // for most cases but useless for the ones that read the sidebar's
          // Assignee row (TS41), so it is worth the one extra page load.
          if (cur.assigned === false) {
            const retry = await bo.assignApplication(page, uuid, opt('assignee-name', undefined));
            return { assigned: retry?.assigned !== false };
          }
          return {};
        });
        await fixture.writeCheckpoint(runLabel, out);
        await done('approve-app', out);

      } else if (phase === 'regdocs') {
        await preapp.submitRegistrationDocs(dealer, profile, cur.dealerLink);
        await done('regdocs', {});

      } else if (phase === 'verify-regdocs') {
        const uuid = requireUuid(cur);
        await asRole(browser, ROLES.assignee, (page) => bo.verifyRegistrationDocs(page, uuid));
        await done('verify-regdocs', {});

      } else if (phase === 'regfee') {
        const how = await preapp.payRegistrationFee(dealer, cur.dealerLink, {
          method: opt('pay', 'fpx'),
          bank: opt('bank', undefined),
        });
        await done('regfee', { how });

      } else if (phase === 'record') {
        const cur2 = await state();
        const result = await asRole(browser, ROLES.assignee, async (page) => {
          // The application number is normally learned in submit-approval. If
          // that phase was skipped, fall back to the run-stamped company name
          // rather than searching the listing for an empty string.
          let appNo = cur2.applicationNo || opt('app-no', '') || '';
          if (!appNo || appNo === true) {
            // A SHARED COMPANY MAKES THIS LOOKUP AMBIGUOUS, so it is refused rather than
            // guessed. findByCompanyName returns a ROW, not an error, so with two records
            // answering to one name it would hand back whichever the listing sorted first
            // and this run would write a stranger's application number into its own
            // checkpoint — the same shape as the hasText:undefined lookup that read the
            // top row and called it a success.
            if (profile.sharedCompany) {
              throw new Error(
                'this fixture was built with a SHARED company name ('
                + JSON.stringify(profile.businessName) + '), so its application number cannot be '
                + 'recovered by searching for it: two records answer to that name. Re-run the '
                + 'submit-approval phase so the number is learned properly, or pass it with '
                + '--app-no <NA...>.');
            }
            const row = await listing.findByCompanyName(page, profile.businessName);
            appNo = row.applicationNo;
            say('    application no (found by company name): ' + appNo);
          }
          return bo.readFixtureState(page, appNo);
        });
        await fixture.writeCheckpoint(runLabel, { result, applicationNo: result.applicationNo });
        await done('record', {});
        report(runLabel, result);

      } else {
        throw new Error('unknown phase "' + phase + '" — known: ' + PHASES.join(', '));
      }
    }
  } catch (err) {
    say('\n  STOPPED: ' + err.message);
    await assist.dump(dealer, 'error-dealer-context').catch(() => {});
    say('  The checkpoint is intact — fix the cause, then:');
    say('    npm run fixture -- --resume ' + runLabel + '\n');
    process.exitCode = 1;
  } finally {
    if (!headless && assist.INTERACTIVE()) {
      await assist.prompt('\n  press Enter to close the browser > ').catch(() => {});
    }
    await browser.close();
  }
})();

function requireUuid(cp) {
  if (!cp.uuid) throw new Error('no application uuid yet — run --only submit-approval first (it discovers the application)');
  return cp.uuid;
}

function report(label, r) {
  rule('fixture ready — ' + label);
  say('  Application No        ' + r.applicationNo);
  say('  Company               ' + r.companyName);
  say('  Status                ' + r.applicationStatus);
  say('  Hardcopy & Acc        ' + r.hardcopyAccCreated + (/registered/i.test(r.hardcopyAccCreated || '') ? '   <-- Extend would be suppressed (R9)' : ''));
  say('  Created               ' + r.createdAt);
  say('  Application Expiry    ' + r.expiryRaw);
  say('  Created + days        ' + r.daysFromCreated + (r.matchesR2 ? '  (matches the 90-day rule)' : '  <-- NOT 90 days; worth a QA-Issue'));
  say('\n  Put this in .env for the destructive suite (a fresh one per run — R1):');
  say('    EXTEND_APP_NO=' + r.applicationNo);
  say('\n  Then:  npm run test:gating     (read-only, safe)');
  say('         npm run test:extend    (spends this fixture\'s one extension)\n');
}
