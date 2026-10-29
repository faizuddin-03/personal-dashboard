/**
 * The BackOffice half of a fixture build — pre-application approval through to
 * registration documents verified.
 *
 * These screens are better understood than the UCD side (the 23-08-2026
 * walkthrough covered the listing, the detail tabs and the sidebar), but the
 * ACTIONS on them — Approve, Submit for Approval, Verified — were watched, not
 * driven. So they go through assist.js too, and the confirmation dialogs are
 * handled defensively: every one of these buttons is a state change that cannot
 * be undone from the UI.
 *
 * Nothing in this file touches Extend. Building a fixture and spending its one
 * extension (R1) are deliberately different scripts.
 */
const assist = require('./assist');
const { OBS, BASE } = require('./env');
const { gotoObs } = require('./obs');
const listing = require('./listing');

/** Accept whatever confirmation the action raises: dialog, or a Yes button. */
async function confirm(page, step) {
  page.once('dialog', (d) => d.accept().catch(() => {}));
  await assist.click(page, step, { role: 'button', label: /^(yes|ok|confirm|proceed)$/i }, { optional: true });
  await page.waitForLoadState('domcontentloaded');
}

/* --------------------------------------------------- pre-application listing */

/**
 * Find the run's pre-application by company name and open it.
 *
 * By name, not by reference: the fixture's company name carries the run stamp
 * and is unique by construction, whereas the reference is only ever read off a
 * confirmation page that may not show one.
 */
async function openPreApplication(page, companyName) {
  await gotoObs(page, OBS.preApplicationListing);
  await assist.dump(page, '15-preapplication-listing');

  await assist.fill(page, 'preapplisting.search', { label: /company|business.*name/i, name: 'companyName' }, companyName, { optional: true });
  await assist.click(page, 'preapplisting.searchBtn', { role: 'button', label: /^search$/i }, { optional: true });
  await page.waitForLoadState('domcontentloaded');

  const row = page.locator('tr').filter({ hasText: companyName }).first();
  await row.waitFor({ timeout: 20_000 });

  // The row's View opens a NEW TAB (bitten on the 24-08 run: the click landed,
  // the listing page never changed, and Approve was hunted on the wrong tab).
  // So race a popup against a same-page navigation and follow whichever wins.
  const [popup] = await Promise.all([
    page.context().waitForEvent('page', { timeout: 8_000 }).catch(() => null),
    row.getByRole('link', { name: /^(view|edit|detail)/i }).or(row.locator('a')).first().click(),
  ]);
  const target = popup || page;
  await target.waitForLoadState('domcontentloaded');
  await assist.dump(target, '16-preapplication-summary');

  const uuid = (target.url().split('?')[0].split('/').filter(Boolean).pop()) || '';
  return { uuid, url: target.url(), page: target };
}

/**
 * Approve the pre-application and return the dealer's Application Link.
 *
 * The link is the only way onto the Application Form, so a build that approves
 * and then fails to read the link is a dead fixture — hence the link is read
 * back and returned, not assumed.
 */
async function approvePreApplication(page) {
  // Idempotent: a re-run on an already-approved record (e.g. --from
  // approve-preapp after a later phase failed) skips straight to reading the
  // link instead of hunting for an Approve button that is no longer there.
  const btn = await assist.resolve(page, { role: 'button', label: /^approve$/i });
  if (btn) {
    await assist.click(page, 'preapp.approve', { role: 'button', label: /^approve$/i });
    await confirm(page, 'preapp.approve.confirm');
  } else {
    console.log('    no Approve button — record already approved, reading the link');
  }
  // WAIT FOR THE APPROVAL TO LAND BEFORE READING THE LINK.
  //
  // Approve is an AJAX round-trip and the page shows a "Working..." overlay
  // while it runs. Reading straight after the confirm click caught exactly that
  // (26-08): the dump was the pre-approval summary, mid-spinner, with no
  // Application Link anywhere on it — and the build stopped one phase later
  // with "no dealer link on the checkpoint". The link is the only way onto the
  // Application Form, so this is worth polling for rather than reading once.
  //
  // Reload halfway through: some renders only grow the sidebar box after a
  // fresh GET of the summary.
  const summaryUrl = page.url();
  let link = '';
  for (let t = 0; t < 20 && !link; t++) {
    await page.waitForTimeout(1_500);
    const working = await page.getByText(/^\s*working\.\.\.\s*$/i).first().isVisible().catch(() => false);
    if (working) continue;
    link = await applicationLink(page);
    if (!link && t === 9) await page.goto(summaryUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
  }

  await assist.dump(page, '17-preapplication-approved');
  if (!link) {
    console.log('    NOTE: approved, but no Application Link found on the page — check discovery/17-*');
  } else {
    console.log('    application link: ' + link);
  }
  return { link };
}

/**
 * The generated dealer link, from the sidebar box beside "Copy Link".
 *
 * The dealer link is `/obs/form/<sec>?id=...&s=...` — NOT `/obs/admin/form/edit/
 * <uuid>`, which is this very page's own edit URL. An anchor-first version of
 * this grabbed the admin URL once (24-08 run) and the dealer context then died
 * on it with ERR_HTTP_RESPONSE_CODE_FAILURE. Reading order:
 *
 *   1. input/textarea values (the sidebar box) — immune to soft-wrapping;
 *   2. the HTML source, which the sidebar's rendered line-wrapping cannot break.
 */
async function applicationLink(page) {
  const isDealer = (u) => /\/obs\/form\//i.test(u) && !/\/obs\/admin\//i.test(u);

  const boxes = page.locator('textarea, input');
  for (let i = 0, n = await boxes.count().catch(() => 0); i < n; i++) {
    const v = (await boxes.nth(i).inputValue().catch(() => '')) || '';
    if (isDealer(v)) return v.trim();
  }

  const html = (await page.content().catch(() => '')) || '';
  const urls = html.match(/https?:\/\/[^"'\s<>]+\/obs\/form\/[^"'\s<>]*/gi) || [];
  const hit = urls.find(isDealer);
  return hit ? hit.replace(/&amp;/g, '&').trim() : '';
}

/* ------------------------------------------------------- application progress */

/**
 * Approver side: hand the application to the assignee.
 *
 * The 23-08-2026 video shows this as its own act, BEFORE the assignee ever opens
 * the record (5:30): jasons opens the Application Form edit page, picks the
 * assignee in the sidebar's Assignee dropdown, and Saves — the page answers
 * "This application form has been updated successfully." Skipping it leaves the
 * record unassigned, and the assignee's later actions are then off-script.
 *
 * The dropdown holds display names, not login keys — hubadmin_bochar appears as
 * "CHARMAIN EA CHIANG chg". EV_ASSIGNEE_NAME overrides the default.
 */
async function assignApplication(page, uuid, assigneeName) {
  const want = String(assigneeName || process.env.EV_ASSIGNEE_NAME || 'CHARMAIN EA CHIANG chg');
  await gotoObs(page, OBS.applicationEdit(uuid));
  await assist.dump(page, '22b-application-before-assign');

  const hit = await assist.resolve(page, { label: /^assignee/i, name: 'assignee', css: 'select:not([id$="Hidden"])[name*="assignee" i], select:not([id$="Hidden"])[id*="assignee" i]' });
  if (!hit) {
    // NOT A MISS — the field is not offered yet at this point in the flow.
    //
    // On a freshly submitted application the approver's edit page renders only
    // UCD Group and Application Status in the sidebar; #assigneeUserId does not
    // exist, only the hidden #assigneeUserIdHidden that carries its value. The
    // visible dropdown appears once the record is further along (it is on the
    // registration-documents page of an Approved application). Treating that as
    // a locator miss stopped the 26-08 build dead on a page that was behaving
    // correctly — so say so and let the caller decide to come back later.
    const stage = await selectedText(page, '#status');
    await assist.dump(page, '22b-assignee-not-offered');
    console.log('    app.assignee                    not offered at this stage' +
      (stage ? ' (Application Status: ' + stage + ')' : '') + ' — deferring');
    return { assigned: false, reason: 'the Assignee dropdown is not rendered at this stage', stage };
  } else {
    const options = (await hit.el.locator('option').allInnerTexts()).map((s) => s.trim());
    const label =
      options.find((o) => o.toUpperCase() === want.toUpperCase()) ||
      options.find((o) => o.toUpperCase().includes(want.toUpperCase()));
    if (!label) {
      throw new Error('assignee "' + want + '" is not an option — the dropdown offers: ' +
        options.filter(Boolean).slice(0, 20).join(', '));
    }
    await hit.el.selectOption({ label });
    console.log('    app.assignee                    ' + label + '  (' + hit.why + ')');
  }

  await assist.click(page, 'app.assignee.save', { role: 'button', label: /^save$/i });
  await page.getByText(/updated successfully/i).first().waitFor({ timeout: 15_000 }).catch(async () => {
    await assist.dump(page, '22c-assign-no-confirmation');
    console.log('    NOTE: no "updated successfully" banner after Save — check discovery/22c-*');
  });
  await assist.dump(page, '22d-application-assigned');
  return { assigned: true, assignee: want };
}

/** The visible text of a select's chosen option, or '' if the select is absent. */
async function selectedText(page, selector) {
  try {
    const el = page.locator(selector).first();
    if (!(await el.count())) return '';
    return (await el.evaluate((n) => n.selectedOptions?.[0]?.textContent?.trim() ?? n.value)) || '';
  } catch {
    return '';
  }
}

/**
 * Assignee side: set the UCD Group, then Submit for Approval.
 * The group is environment-specific — set EV_UCD_GROUP, or leave it blank and
 * the first option is taken, which is fine for a fixture and wrong for a test.
 */
async function setUcdGroupAndSubmit(page, uuid, group) {
  await gotoObs(page, OBS.applicationEdit(uuid));
  await assist.dump(page, '23-application-backoffice');

  if (group) {
    await assist.fill(page, 'app.ucdGroup', { label: /ucd group/i, name: 'ucdGroup' }, group);
  } else {
    const select = await assist.resolve(page, { label: /ucd group/i, name: 'ucdGroup' });
    if (select) {
      await select.el.selectOption({ index: 1 }).catch(() => {});
      console.log('    ucd group: first option taken (EV_UCD_GROUP not set)');
    }
  }

  // TWO SHAPES, ONE SURVIVING ROUTE. The pre-application route (23-08 video)
  // gives the assignee a "Submit for Approval" button. The BackOffice-generated
  // record does not: its edit page carries only Back and Save (#to-edit), and
  // moving it along would mean setting the Application Status dropdown and
  // saving, which is not the same act. Hunting for a button that shape never
  // renders stopped the 26-08 build, and that dead end is half of why the manual
  // route is now closed (R22). The else-branch below stays because a stub can
  // still be reached by hand.
  const submit = await assist.resolve(page, { role: 'button', label: /submit for approval/i });
  if (submit) {
    await assist.click(page, 'app.submitForApproval', { role: 'button', label: /submit for approval/i });
    await confirm(page, 'app.submitForApproval.confirm');

    /* READ BACK THAT IT ACTUALLY MOVED. 31-08-2026.
     *
     * This phase used to click Submit, click its confirm, and return — asserting
     * nothing. `confirm()` finishes on `waitForLoadState('domcontentloaded')`, which
     * for an AJAX submit resolves INSTANTLY because the page is already loaded, so
     * nothing here ever waited for the request to land.
     *
     * NA68001156 (fx-260831-1108-133) is what that costs. The build was stopped right
     * after this phase with --until, the browser closed on the in-flight POST, and the
     * record stayed at "Pending". `approve-app` then found no Approve button and threw a
     * message blaming a "BackOffice-generated record" — which it was not; it came off the
     * Pre-Application form like every other fixture. A whole build looked like the wrong
     * creation route when the submit had simply never landed.
     *
     * Earlier builds survived only because the NEXT phase's login and navigation gave the
     * POST time to complete. That is luck, not sequencing.
     *
     * Reloading and re-reading is the check: once submitted, the record leaves the
     * assignee's hands and the Submit for Approval button goes with it. */
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(1500);
    const still = await assist.resolve(page, { role: 'button', label: /submit for approval/i });
    const statusNow = await selectedText(page, '#status');
    console.log('    app.submitForApproval.landed    '
      + (still ? 'NO — the button is STILL THERE after a reload' : 'yes — the button is gone')
      + (statusNow ? ` (Application Status reads "${statusNow}")` : ''));
    if (still) {
      throw new Error(
        'Submit for Approval did not land on ' + page.url()
        + (statusNow ? ' (Application Status still reads "' + statusNow + '")' : '')
        + '\n    The button is still on the page after a reload, so the record did NOT advance and'
        + '\n    approve-app would find no Approve button and blame the creation route for it.'
        + '\n    Re-run this phase:  npm run fixture -- --resume <id> --from submit-approval'
      );
    }
  } else {
    // Save what was set, but be honest that this is NOT a submit-for-approval:
    // it persists the UCD Group and nothing more. The record does not advance,
    // and approve-app will find no Approve button (see the note there).
    console.log('    app.submitForApproval           NOT on this page — saving the UCD Group only; the record does NOT advance');
    await saveApplication(page, 'app.ucdGroup.save');
  }
  await assist.dump(page, '24-application-submitted-for-approval');
}

/** Save the BackOffice application edit form (#to-edit) and wait for its banner. */
async function saveApplication(page, step) {
  const save = page.locator('#to-edit').or(page.getByRole('button', { name: /^save$/i })).first();
  await save.click({ timeout: 15_000 }).catch(() => save.dispatchEvent('click'));
  await confirm(page, step + '.confirm');
  const banner = await page.getByText(/updated successfully/i).first()
    .waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
  console.log('    ' + step.padEnd(32) + (banner ? 'saved — "updated successfully"' : 'saved, but no confirmation banner'));
  return banner;
}

/** Approver side. Separate login — the caller switches sessions. */
async function approveApplication(page, uuid) {
  await gotoObs(page, OBS.applicationEdit(uuid));

  // Same two shapes as setUcdGroupAndSubmit: a dedicated Approve button on the
  // public route, or the Application Status dropdown plus Save on the
  // BackOffice one, whose #status offers Pending / KIV / Approved / Rejected.
  const approve = await assist.resolve(page, { role: 'button', label: /^approve$/i });
  if (approve) {
    await assist.click(page, 'app.approve', { role: 'button', label: /^approve$/i });
    await confirm(page, 'app.approve.confirm');
  } else {
    // DO NOT "approve" by setting the status dropdown. Tried on 26-08 and it is
    // WRONG: the dropdown changes the FIELD, the Approve button runs the
    // WORKFLOW. NA68001100 came out of it reading Approved on the listing with
    // Assignee / UCD, Approver / Assignee, Softcopy Docs, Registration Fee and
    // Hardcopy & Acc Created all "-", **no expiry date at all**, and the
    // dealer's step 4 still server-side read-only (step4Visible true,
    // step4ReadOnly true) so registration documents could never be submitted.
    // A half-approved record that no later phase can use.
    //
    // The Approve button belongs to the APPROVER on a record that has been
    // submitted for approval. Its absence means the record is not in that state
    // — or this route never put it there — not that the dropdown is the way.
    const status = await selectedText(page, '#status');
    await assist.dump(page, 'miss-app.approve');
    throw new Error(
      'no Approve button on ' + page.url() +
      (status ? ' (Application Status reads "' + status + '")' : '') +
      '\n    The status dropdown is NOT a substitute — it sets the field without running the ' +
      'approval workflow, leaving a record with no expiry date and a read-only documents step.' +
      // NAME THE LIKELY CAUSE FIRST, AND DO NOT ASSERT ONE WE HAVE NOT CHECKED.
      //
      // This used to end with "This is a BackOffice-generated record" flatly, which on
      // 31-08 was simply false: NA68001156 came off the Pre-Application form like every
      // other fixture, and the real cause was that Submit for Approval had never landed
      // (the phase asserted nothing, so an AJAX submit killed by a closing browser looked
      // identical to a submit that worked). The comment above this throw had the right
      // list all along — "the record is not in that state, or this route never put it
      // there" — while the message named only the one that was wrong. It cost a rebuild's
      // worth of chasing.
      '\n    LIKELIEST: the record was never submitted for approval. submit-approval now ' +
      'reloads and re-reads, so a fresh build would have said so — an older record may ' +
      'predate that check. Try:  npm run fixture -- --resume <id> --from submit-approval' +
      '\n    ALSO POSSIBLE: this is a BackOffice-generated record, which has no proven path ' +
      'from here — then build from the Pre-Application Form instead:  npm run fixture   (R22)'
    );
  }
  await assist.dump(page, '25-application-approved');

  // Approving is the point of this phase, so it is read back rather than assumed.
  const now = await selectedText(page, '#status');
  if (now && !/approved/i.test(now)) {
    throw new Error('after approving, Application Status still reads "' + now + '" — check discovery/25-application-approved.*');
  }
  return { status: now || 'Approved' };
}

/**
 * Assignee side: mark the registration documents Verified. This is the step
 * that puts the application into the state EAINT-11982 cares about — Approved,
 * documents verified, Hardcopy Doc NOT yet Registered, so Extend is offered
 * (R9). Creating the company account after this point would remove the button,
 * which is why the build stops here.
 */
async function verifyRegistrationDocs(page, uuid) {
  await gotoObs(page, OBS.registrationDocs(uuid));
  await page.getByText(/Application No:/).first().waitFor();
  await assist.dump(page, '32-registration-docs-backoffice');

  // The whole point of the fixture: Extend should be sitting in this sidebar
  // beside Application Status (C4/Q11 — confirmed on the 23-08-2026 video at
  // 9:00). Its absence here means the fixture is already unusable for the
  // Extend cases, so say so NOW, not after the suite starts.
  const extend = await page.getByRole('button', { name: /^extend$/i }).count();
  console.log('    Extend button: ' + (extend
    ? 'present in the sidebar — fixture is on track'
    : 'NOT PRESENT — check Application Status is Approved and Hardcopy Doc is not Registered (R9)'));

  await assist.click(page, 'regdocs.verified', { role: 'button', label: /^verified$/i });
  await confirm(page, 'regdocs.verified.confirm');
  await page.getByText(/verification date/i).first().waitFor({ timeout: 15_000 }).catch(() => {});
  await assist.dump(page, '33-registration-docs-verified');
}


/* ------------------------------------- starting an application from BackOffice */

const GENERATE_SCREEN = () => BASE + '/uat4/view/backoffice/support/onboarding/view.do';

/**
 * "UCD New Application" — hands back a dealer application link without the
 * public pre-application form at all.
 *
 * CLOSED AS A WAY OF CREATING A TRANSACTION — Charmain, 27-08-2026: *"make sure
 * all transaction created from preapplication, i dont want the manual
 * application way to create the trx, we didnt cover that part in this ticket."*
 * This function is the ONE place in the rig that could create an application any
 * other way, so the ruling is enforced here rather than in each caller (R22).
 *
 * The two things this route used to be kept for, and why neither survives:
 *
 *   - **SSM business types.** The public form sends the BRN to
 *     /obs/preOnb/checkSSM.do, which rejects every generated number and
 *     silently falls back to Business Trading; this endpoint never calls SSM.
 *     But business type has no bearing on the expiry date or on Extend (see
 *     src/fixture.js newProfile and the src/preapp.js header), so the coverage
 *     given up is coverage this ticket never asked for.
 *   - **Cost.** No reCAPTCHA, no RM 108.00 fee — and no working path either:
 *     the route stalls at approve-app for good, because the assignee's edit
 *     page carries no "Submit for Approval" button. Reproduced 26-08 on
 *     NA68001102. It never produced an extendable fixture.
 *
 * Left runnable behind EV_ALLOW_BO_NEW_APPLICATION=1 for exactly one purpose:
 * re-creating an R19 stub if NA68001100 is ever lost. A stub is not a fixture
 * and must never be fed to a build.
 *
 * Format rules are the page's own validators, asserted here because a
 * client-side rejection is SILENT to automation — the button just does nothing:
 *   old ROC  [a-zA-Z0-9-], min 6      new ROC  12 digits starting 19 or 20
 *   licence  [a-zA-Z0-9/], min 4      all      no spaces
 */
function checkGenerateFormat(kind, values) {
  const bad = [];
  if (kind === 'SSM') {
    if (!/^[a-zA-Z0-9-]+$/.test(values.companyRegNo || '')) bad.push('old ROC allows only letters, digits and hyphen');
    if ((values.companyRegNo || '').length < 6) bad.push('old ROC must be at least 6 characters');
    if (!/^\d{12}$/.test(values.newRegistrationCompany || '')) bad.push('new ROC must be exactly 12 digits');
    if (!/^(19|20)/.test(values.newRegistrationCompany || '')) bad.push('new ROC must start 19 or 20');
  } else {
    if (!/^[a-zA-Z0-9/]+$/.test(values.tradingNo || '')) bad.push('trading licence allows only letters, digits and forward slash');
    if ((values.tradingNo || '').length < 4) bad.push('trading licence must be at least 4 characters');
  }
  for (const [k, v] of Object.entries(values)) if (/\s/.test(v || '')) bad.push(k + ' contains a space');
  return bad;
}

/** 'SSM' or 'Trading Business' — the radio values the panel actually carries. */
const generateKindFor = (profile) => (profile.isSsm ? 'SSM' : 'Trading Business');

const generateValuesFor = (profile) =>
  profile.isSsm
    ? { companyRegNo: profile.oldBrn, newRegistrationCompany: profile.newBrn }
    : { tradingNo: profile.tradingLicenseNo };

async function generateApplicationLink(page, profile) {
  if (process.env.EV_ALLOW_BO_NEW_APPLICATION !== '1') {
    throw new Error([
      'BackOffice "UCD New Application" is CLOSED as a way of creating a transaction.',
      '    Charmain, 27-08-2026: every transaction must be created from the Pre-Application',
      '    Form. The manual application route is out of scope for EAINT-11982 (vault R22).',
      '    Build from the pre-application flow instead:  npm run fixture',
      '    The only sanctioned exception is re-creating the R19 stub (TS51) if NA68001100 is',
      '    lost, and that needs EV_ALLOW_BO_NEW_APPLICATION=1 set deliberately.',
    ].join('\n'));
  }
  console.log('    EV_ALLOW_BO_NEW_APPLICATION=1 — creating a BackOffice STUB, not a fixture (R19/R22)');

  const kind = generateKindFor(profile);
  const values = generateValuesFor(profile);

  const bad = checkGenerateFormat(kind, values);
  if (bad.length) throw new Error('the generator would reject these silently: ' + bad.join('; '));

  await page.goto(GENERATE_SCREEN(), { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="businessType"]').first().waitFor({ timeout: 20_000 });
  await page.locator('input[name="businessType"][value="' + kind + '"]').check();
  await page.waitForTimeout(400);            // the panel swaps its fields on this

  if (kind === 'SSM') {
    await page.locator('#companyRegNo').fill(values.companyRegNo);
    await page.locator('#newRegistrationCompany').fill(values.newRegistrationCompany);
  } else {
    await page.locator('#tradingNo').fill(values.tradingNo);
  }

  // Watch the POST: "Duplicate roc." comes back in the body, not as a status.
  const posted = page
    .waitForResponse((r) => /onboarding\/generate\.do/.test(r.url()), { timeout: 20_000 })
    .catch(() => null);
  await page.locator('#to-generate-link').click();
  const res = await posted;
  const body = res ? await res.text().catch(() => '') : '';
  await page.waitForTimeout(1_200);
  await assist.dump(page, '18-generate-link-' + kind.replace(/\W+/g, '-'));

  const link = (await page.locator('#generatedLink').inputValue().catch(() => '')) || '';
  if (!link) {
    const errors = (await page.locator('[id^="error-message-"]:visible').allInnerTexts().catch(() => []))
      .map((x) => x.trim()).filter(Boolean);
    throw new Error('no link generated for ' + kind +
      (errors.length ? ' — ' + errors.join(' | ') : '') +
      (body ? ' — server said ' + body.slice(0, 160) : ' — the POST never went out'));
  }
  console.log('    ' + kind + ' link: ' + link);
  return { kind, values, link };
}

/* --------------------------------------------------------------- the pay-off */

/**
 * What the fixture is FOR: the application number and the expiry the listing
 * renders for it (C2 — created + 90 days, to the minute).
 *
 * The 90-day arithmetic is checked, not assumed: if the expiry is anything else
 * the fixture is still usable, but that is a finding for the ticket and it must
 * not be discovered later, mid-suite, as a failing assertion on the wrong case.
 */
async function readFixtureState(page, applicationNo) {
  const row = await listing.findByApplicationNo(page, applicationNo);
  const { raw, date } = await listing.expiry(page, applicationNo);

  let daysFromCreated = null;
  const created = parseListingDate(row.createdAt);
  if (created && date) daysFromCreated = Math.round((date - created) / 86_400_000);

  return {
    applicationNo: row.applicationNo,
    companyName: row.companyName,
    applicationStatus: row.applicationStatus,
    hardcopyAccCreated: row.hardcopyAccCreated,
    createdAt: row.createdAt,
    expiryRaw: raw,
    expiryDate: date ? date.toISOString() : null,
    daysFromCreated,
    matchesR2: daysFromCreated === 90,
  };
}

function parseListingDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(String(s || ''));
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : null;
}

module.exports = {
  openPreApplication, approvePreApplication, applicationLink,
  generateApplicationLink, checkGenerateFormat, generateKindFor, generateValuesFor,
  assignApplication, setUcdGroupAndSubmit, approveApplication, verifyRegistrationDocs,
  readFixtureState, confirm, parseListingDate,
};
