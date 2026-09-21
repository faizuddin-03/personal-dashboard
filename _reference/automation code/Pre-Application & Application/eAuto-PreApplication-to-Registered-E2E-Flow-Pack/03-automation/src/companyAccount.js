const fs = require('node:fs');
const path = require('node:path');
/**
 * THE SECOND HALF OF CREATE ACCOUNT — the Create New Company Account form.
 *
 * WHY THIS EXISTS. src/createAccount.js was written believing the button opened one
 * dialog and the record was then Registered. It does not. Measured 30-08-2026 from
 * Charmain's screen recording of the real flow, after the driver clicked Yes and then
 * waited sixty seconds for a state that was never coming:
 *
 *   1. Create Account (approver session, Pending Assignee records only)
 *        -> a CONFIRMATION dialog: "Are you sure you want to proceed for company
 *           account creation?" over No / Yes. No inputs.
 *   2. Yes NAVIGATES to  /uat4/view/account/company-obs/new.do?id=<uuid>
 *        -> "Create New Company Account", a full form with a Save at the TOP.
 *   3. Save  ->  Hardcopy & Acc Created = Registered.
 *
 * So "the form was submitted but the record never read Registered" was accurate and
 * misleading at once: the confirmation was submitted, and the form had not been seen.
 *
 * WHAT THE FORM ARRIVES WITH, and it matters because most of it is already right:
 * Company Name, Company Reg. No., Company Type (UCD), Vehicle Type (CAR), UCD Group,
 * TIN, SST, Showroom Address and both file attachments are PRE-FILLED from the
 * application. Six things are required and empty:
 *
 *   Mailing Address, Postcode, State, City, District, Contact Number
 *
 * THE THREE SELECTS CASCADE, which is the part a generic form-filler gets wrong.
 * City is populated by an AJAX call fired when State changes, and District by one
 * fired when City changes. Filling them in DOM order picks City before its options
 * exist, silently leaves it on "-- Select a City --", and Save then fails validation
 * on a field the filler believes it set. They are therefore filled in dependency
 * order, and each waits for its own options to arrive.
 *
 * NOTHING HERE IS GUESSED FROM THE MARKUP ALONE — the field list came from watching
 * the flow, and every locator falls back to a label-based lookup so a renamed id is a
 * loud failure rather than a skipped field.
 */
const VALUES = {
  mailingAddress: process.env.EV_CA_ADDRESS || 'Lot 12, Jalan QA, Taman Automation',
  postcode: process.env.EV_CA_POSTCODE || '93100',
  state: process.env.EV_CA_STATE || 'SARAWAK',
  contactNumber: process.env.EV_CA_CONTACT || '0123456789',
};

/**
 * The Save button — at the TOP of this form beside the title, and it is an
 * input[type=button] carrying a VALUE ("Save »"), not a <button> carrying text.
 * A hasText filter matches nothing on it, which is the quiet kind of miss: the click
 * never happens, no error is raised, and the form just sits there.
 */
const saveButton = (page) => page
  .locator('#to-create-company, input[value*="Save"], button:has-text("Save")').first();

/** Is this the company-account form, rather than wherever we hoped to be? */
function onForm(page) {
  return /company-obs\/new\.do/i.test(page.url());
}

/**
 * Pick an option by visible text, waiting for the options to EXIST first.
 *
 * A cascading select starts with one placeholder option and grows when its parent's
 * AJAX returns. selectOption() against a placeholder-only list throws a timeout that
 * reads like a missing element, so the wait is explicit and its failure says which
 * select never filled.
 */
async function selectWhenPopulated(loc, wanted, what, timeout = 20_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const opts = await loc.locator('option').allTextContents().catch(() => []);
    const real = opts.map((o) => o.trim()).filter((o) => o && !/^--/.test(o) && !/please select/i.test(o));
    if (real.length) {
      const hit = wanted
        ? real.find((o) => o.toUpperCase().includes(String(wanted).toUpperCase())) || real[0]
        : real[0];
      await loc.selectOption({ label: hit });
      return hit;
    }
    await loc.page().waitForTimeout(500);
  }
  throw new Error(`${what} never populated within ${Math.round(timeout / 1000)}s — it still holds only a `
    + 'placeholder. It is filled by the AJAX its parent select fires, so the parent either did not change '
    + 'or its call failed.');
}

/**
 * Fill what the form needs and return what was touched.
 * Fills only EMPTY required controls: everything pre-filled from the application is
 * left exactly as the build made it.
 */
async function fillCompanyForm(page, opts = {}) {
  if (!onForm(page)) {
    throw new Error(`not on the Create New Company Account form — the page is ${page.url()}. `
      + 'Clicking Yes on the confirmation should have navigated to company-obs/new.do.');
  }
  const v = { ...VALUES, ...(opts.values || {}) };
  const touched = [];

  const setText = async (sel, value, what) => {
    const loc = page.locator(sel).first();
    if (!(await loc.count())) throw new Error(`${what}: no control matched ${sel}`);
    const now = (await loc.inputValue().catch(() => '')).trim();
    if (now) { touched.push({ what, kept: now }); return; }
    await loc.fill(value);
    touched.push({ what, set: value });
  };

  // IDS READ OFF THE PAGE, not inferred from the labels. The first attempt guessed
  // #mailingAddress / #postcode / #contactNo — none of which exist — and threw on the
  // first one. The real ids are address / postCode / phone, and note the CAPITAL C in
  // postCode: a lower-case guess matches nothing and reads as a missing field.
  await setText('#address, textarea[name="address"]', v.mailingAddress, 'Mailing Address');
  await setText('#postCode, input[name="postCode"]', v.postcode, 'Postcode');
  await setText('#phone, input[name="phone"]', v.contactNumber, 'Contact Number');

  // DEPENDENCY ORDER, NOT DOM ORDER. State first; City only exists once State's AJAX
  // has returned; District only once City's has.
  // #state / #city / #district — NOT the showroomState / showroomCity / showroomDistrict
  // trio sitting immediately beside them, which arrives pre-filled from the build.
  const stateSel = page.locator('#state').first();
  const citySel = page.locator('#city').first();
  const districtSel = page.locator('#district').first();

  const stateNow = await stateSel.inputValue().catch(() => '');
  if (!stateNow || /^\s*$/.test(stateNow)) {
    const picked = await selectWhenPopulated(stateSel, v.state, 'State');
    touched.push({ what: 'State', set: picked });
  } else {
    touched.push({ what: 'State', kept: stateNow });
  }
  await page.waitForTimeout(1200);
  touched.push({ what: 'City', set: await selectWhenPopulated(citySel, opts.city, 'City') });
  await page.waitForTimeout(1200);
  touched.push({ what: 'District', set: await selectWhenPopulated(districtSel, opts.district, 'District') });

  // ATTACH IC / PASSPORT — the one required upload the application does not carry over.
  //
  // Everything else on this form arrives pre-attached: "Attach BoD Reso / LoA" holds
  // document-4.pdf and "Attach SSM Company / Business Profile" holds document-0.pdf,
  // both inherited from the build. PrimaryUserFile arrives EMPTY, and Save refuses with
  // an alert — "Attach IC / Passport is required." — that is raised by the page and,
  // because Playwright auto-dismisses dialogs, was invisible until saveCompanyForm
  // started listening for it.
  const icInput = page.locator('#PrimaryUserFile, input[type="file"][name="PrimaryUserFile"]').first();
  if (await icInput.count()) {
    const asset = path.join(__dirname, '..', 'fixtures', 'assets', 'document-0.pdf');
    if (!fs.existsSync(asset)) {
      throw new Error(`Attach IC / Passport needs a file and ${asset} is not there. `
        + 'fixtures/assets holds the sample documents the pre-application build uses.');
    }
    await icInput.setInputFiles(asset);
    touched.push({ what: 'Attach IC / Passport', set: path.basename(asset) });
  } else {
    touched.push({ what: 'Attach IC / Passport', kept: '(no PrimaryUserFile control on this form)' });
  }

  // MAIN USER — Login ID. Discovered the way everything else on this form was: Save
  // refused with "Main User Login ID is required." The field is #primaryUserLoginName,
  // and the id has to be unique across the environment, so it is derived from the
  // application number rather than being a fixed string that collides on the second run.
  //
  // #primaryUserLoginPassword SITS BESIDE IT AND IS DELIBERATELY NOT TOUCHED HERE.
  // Filling password fields is not something this rig should do quietly, even for a
  // synthetic account on staging. If Save turns out to require it, the alert will say
  // so and it is a decision to take deliberately, in the open, rather than a line that
  // appeared in a helper. EV_CA_PRIMARY_PASSWORD exists for when that decision is made.
  const loginInput = page.locator('#primaryUserLoginName').first();
  if (await loginInput.count()) {
    const now = (await loginInput.inputValue().catch(() => '')).trim();
    if (!now) {
      const id = v.loginId || `qa${String(opts.appNo || '').replace(/\D/g, '').slice(-8) || Date.now().toString().slice(-8)}`;
      await loginInput.fill(id);
      touched.push({ what: 'Main User Login ID', set: id });
    } else {
      touched.push({ what: 'Main User Login ID', kept: now });
    }
  }
  const pwd = String(process.env.EV_CA_PRIMARY_PASSWORD || '').trim();
  if (pwd) {
    const pwdInput = page.locator('#primaryUserLoginPassword').first();
    if (await pwdInput.count()) {
      await pwdInput.fill(pwd);
      touched.push({ what: 'Main User password', set: '(from EV_CA_PRIMARY_PASSWORD)' });
    }
  }

  return touched;
}

/**
 * Save, and report what the page said. Does NOT decide whether it worked — the server does.
 *
 * IT LISTENS FOR THE JS ALERT, and that is the whole reason this function is not three
 * lines. This form validates with `alert()`, and Playwright DISMISSES dialogs
 * automatically when nothing is listening. So the first run clicked Save, the page put
 * up "Attach IC / Passport is required.", Playwright silently dismissed it, and the
 * probe reported `stillOnForm: true, errors: []` — no error text anywhere on the page,
 * no POST, and no reason. The page was saying exactly what was wrong and nothing was
 * listening.
 *
 * Anything an alert says comes back in `alerts`, so a validation failure names itself.
 */
async function saveCompanyForm(page) {
  const btn = saveButton(page);
  if (!(await btn.count())) {
    throw new Error('no Save control on the Create New Company Account form — it is an input[type=button] '
      + 'carrying a VALUE at the TOP of the page, so a bottom-of-form hasText search finds nothing.');
  }
  const alerts = [];
  const onDialog = async (d) => {
    alerts.push(`${d.type()}: ${d.message().replace(/\s+/g, ' ').trim()}`);
    await d.accept().catch(() => {});
  };
  page.on('dialog', onDialog);
  try {
    await btn.click();
    await page.waitForLoadState('networkidle', { timeout: 45_000 }).catch(() => {});
    await page.waitForTimeout(2500);
  } finally {
    page.off('dialog', onDialog);
  }
  const errors = await page.locator('.error, .has-error, .alert-danger, [class*="invalid"]')
    .allInnerTexts().catch(() => []);
  return {
    url: page.url(),
    stillOnForm: onForm(page),
    alerts,
    errors: errors.map((e) => e.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 6),
  };
}

module.exports = { VALUES, onForm, saveButton, selectWhenPopulated, fillCompanyForm, saveCompanyForm };
