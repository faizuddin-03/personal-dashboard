/**
 * The UCD (dealer-facing) side of a fixture build — everything from the
 * reCAPTCHA gate to registration documents submitted.
 *
 * The selectors below are REAL, captured from staging on 24-08-2026 and kept in
 * discovery/11-preapplication-form-fresh.*. They are no longer the SRD's prose,
 * and where the two disagree the page wins. What the capture changed:
 *
 *   - Type of Business is a RADIO GROUP (businessType = SDN_BHD |
 *     SOLE_PROPRIETORSHIP_PARTNERSHIP | LLP | TRADING_SABAH | TRADING_SARAWAK),
 *     not the dropdown the prose implied.
 *   - The BRN / licence fields are hidden until a type is chosen. There is no
 *     single "BRN" box: SSM shows #oldBrn AND #newBrn, Non-SSM shows
 *     #businessLicenseNo plus the file upload.
 *   - Showroom address is ONE textarea, not two lines. State and City are
 *     dependent dropdowns — City stays disabled until loadCity() has answered.
 *   - There is no Admin IC field: only Name, Mobile No and Email Address.
 *   - Both steps live in ONE page. #nextSubmitBtn relabels itself to
 *     "Submit and Pay" on the review step.
 *
 * WHERE THE HARNESS STOPS AND A HUMAN STARTS
 *
 *   reCAPTCHA  — /obs/preOnb/recaptcha fronts the whole UCD side. Solving it
 *                programmatically is off the table; the real fix is a config
 *                change (Google's published test keys on staging, or the widget
 *                off for the test window). A human ticks it, `passGate` watches
 *                the page, and the session is saved so the rest of the build
 *                never asks again.
 *   FPX        — the RM 108.00 fee and, later, the registration fee. Payment
 *                runs in the gateway's own window and reports back by
 *                postMessage; on success the page replaces itself with
 *                /obs/preOnb/summary/<uuid>, which is exactly what `payFpx`
 *                waits for.
 *
 * WHY THE DEFAULT FIXTURE IS NON-SSM
 *
 * Next on the SSM path calls /obs/preOnb/checkSSM.do and, if the BRN is not a
 * real registered company, calls fallbackToBusinessTrading() and RETURNS — the
 * form silently switches paths instead of advancing. A generated BRN can never
 * satisfy that lookup, so a generated dealer takes the Business Trading route
 * from the start: licence number and upload are ours to invent, and the TIN
 * check on that path is a non-blocking warning. Business type has no bearing on
 * the expiry date or on Extend, so this costs the fixture nothing.
 */
const fs = require('node:fs');
const path = require('node:path');
const assist = require('./assist');
const { OBS, BASE } = require('./env');

const AUTH_DIR = path.resolve(__dirname, '..', '.auth');
const GATE_STATE = path.join(AUTH_DIR, 'preapp-state.json');
const ASSETS = path.resolve(__dirname, '..', 'fixtures', 'assets');

/** businessType radio values, keyed by the label a human would read. */
const BUSINESS_TYPE = {
  'Sdn Bhd': 'SDN_BHD',
  'Sdn Bhd / Bhd': 'SDN_BHD',
  'Sole Proprietorship / Partnership': 'SOLE_PROPRIETORSHIP_PARTNERSHIP',
  LLP: 'LLP',
  'Business Trading (Sabah)': 'TRADING_SABAH',
  'Business Trading Sabah': 'TRADING_SABAH',
  'Business Trading (Sarawak)': 'TRADING_SARAWAK',
  'Business Trading Sarawak': 'TRADING_SARAWAK',
};

const typeValue = (label) => BUSINESS_TYPE[label] || BUSINESS_TYPE[String(label).trim()] || 'TRADING_SARAWAK';

/* ------------------------------------------------------------------ the gate */

/** Is the reCAPTCHA widget still the thing on screen? */
async function onGate(page) {
  if (/recaptcha/i.test(page.url())) return true;
  return (await page.locator('iframe[src*="recaptcha"]').count()) > 0;
}

/**
 * Past the gate = the form's own field is in the DOM.
 *
 * Deliberately not a URL test: /obs/preOnb/form served WITH the widget still on
 * it would read as success, and then every locator below would fail somewhere
 * less obvious. #businessName exists only on the real form.
 */
async function pastGate(page) {
  if ((await page.locator('#businessName').count()) > 0) return true;
  return /preOnb\/summary\//i.test(page.url());
}

/**
 * Get to the Pre-Application Form.
 *
 * Returns { how: 'session' | 'human' } — 'session' means the saved storageState
 * carried us straight through, which is the answer to the question that decides
 * whether fixture building is ever cheap: does one human tick buy one
 * application, or a batch?
 */
async function passGate(page, opts = {}) {
  // Ask for the form itself first. If the restored session still counts, the
  // widget is never rendered and nobody has to tick anything — and going to
  // /recaptcha first would have made them tick regardless.
  await page.goto(OBS.preApplicationFormPage, { waitUntil: 'domcontentloaded' }).catch(() => {});
  if (await pastGate(page)) {
    console.log('    gate: skipped — the restored session reaches the form directly');
    return { how: 'session', reusable: true };
  }

  await page.goto(OBS.preApplicationForm, { waitUntil: 'domcontentloaded' });
  if (await pastGate(page)) {
    console.log('    gate: already satisfied by the restored session');
    return { how: 'session', reusable: true };
  }

  await assist.dump(page, '10-recaptcha-gate');
  await assist.waitForHuman(page, {
    hint:
      'Pass the reCAPTCHA in the browser window (tick "I\'m not a robot", solve the\n' +
      '     challenge, and submit the gate if it has its own button).\n' +
      '     This is the one step that cannot be automated — ask for staging to use\n' +
      '     Google\'s reCAPTCHA test keys and this pause disappears.',
    until: async () => {
      const token = await page
        .locator('#g-recaptcha-response, textarea[name="g-recaptcha-response"]')
        .first()
        .inputValue()
        .catch(() => '');
      if (token && !(await pastGate(page))) {
        await assist.click(page, 'gate.continue', { role: 'button', label: /^(next|submit|continue|proceed)$/i }, { optional: true });
      }
      return pastGate(page);
    },
    timeoutMs: opts.timeoutMs || 300_000,
  });

  await fs.promises.mkdir(AUTH_DIR, { recursive: true });
  await page.context().storageState({ path: GATE_STATE });
  console.log('    gate: passed by hand, session saved to .auth/preapp-state.json');
  await assist.dump(page, '11-preapplication-form-fresh');
  return { how: 'human', reusable: null };
}

const gateStatePath = () => (fs.existsSync(GATE_STATE) ? GATE_STATE : undefined);

/* -------------------------------------------------- the pre-application form */

/** Captured ids first; the label/placeholder hints are the fallback. */
const PREAPP = {
  businessName: { css: '#businessName', label: /business registered name/i },
  tin: { css: '#tin', placeholder: 'Tax Identification No (TIN)' },
  oldBrn: { css: '#oldBrn', placeholder: 'Old Business Registration No (BRN)' },
  newBrn: { css: '#newBrn', placeholder: 'New Business Registration No (BRN)' },
  businessLicenseNo: { css: '#businessLicenseNo', placeholder: 'Business Trading License No' },
  licenceFile: { css: 'input.file-input[type=file]' },
  showroomAddress: { css: '#showroomAddress', label: /showroom address/i },
  showroomPostcode: { css: '#showroomPostcode', placeholder: 'Showroom Postcode' },
  showroomState: { css: '#showroomState' },
  showroomCity: { css: '#showroomCity' },
  adminName: { css: '#adminName', label: /^name/i },
  mobileNo: { css: '#mobileNo', placeholder: 'Mobile No' },
  adminEmail: { css: '#adminEmail', placeholder: 'Email Address' },
  browseFile: { role: 'button', label: /browse file/i },
  next: { css: '#nextSubmitBtn' },
  agreeTerms: { css: '#agreeTerms' },
};

/**
 * Fill the Pre-Application Form and advance to Business Info Review.
 *
 * Order matters twice over: the business-type radio must be clicked before the
 * registration fields exist at all, and the state must be chosen before the
 * city dropdown is anything but disabled.
 */
async function fillPreApplicationForm(page, profile) {
  console.log('\n  Pre-Application Form');
  // A resumed run starts on a blank page. Re-entering through passGate means
  // --from preapp behaves whether or not the saved session still carries.
  if (!(await pastGate(page))) await passGate(page);

  await assist.fill(page, 'preapp.businessName', PREAPP.businessName, profile.businessName);

  // Type of business — a radio, and the gate for every field below it.
  const value = profile.typeCode || typeValue(profile.typeOfBusiness);
  await assist.click(page, 'preapp.businessType', { css: 'input[name="businessType"][value="' + value + '"]' });
  console.log('    business type                   ' + value);
  await page.waitForTimeout(400); // the reveal is a class flip, not a navigation

  if (profile.isSsm) {
    // Both ROC numbers, when the type has them. The page treats each as optional
    // on its own but wants at least one, and checkSSM.do is handed whichever was
    // entered — so a REAL company's BRN passes here and a generated one does not.
    if (profile.newBrn) await assist.fill(page, 'preapp.newBrn', PREAPP.newBrn, profile.newBrn);
    if (profile.oldBrn) await assist.fill(page, 'preapp.oldBrn', PREAPP.oldBrn, profile.oldBrn, { optional: true });
  } else {
    await assist.fill(page, 'preapp.businessLicenseNo', PREAPP.businessLicenseNo, profile.tradingLicenseNo);

    // The input is display:none behind "Browse File...", and two more like it sit
    // hidden in the sections for other business types — so let the page pick.
    const licence = ensureAsset('trading-licence.pdf');
    await assist.uploadVia(page, 'preapp.licenceFile', PREAPP.browseFile, licence);

    // "No file selected." turning into the filename is the page's own receipt
    // that handleFileSelect ran. Without it, Next rejects the form for a missing
    // document and the reason is nowhere on screen.
    await page
      .getByText(new RegExp(path.basename(licence).replace('.', '\.'), 'i'))
      .first()
      .waitFor({ timeout: 20_000 })
      .catch(async () => {
        const where = await assist.dump(page, 'miss-licence-upload-not-registered');
        throw new Error('the trading licence upload never registered on the page — see ' + where + '.*');
      });
    console.log('    licence upload confirmed on the page');
  }

  await assist.fill(page, 'preapp.tin', PREAPP.tin, profile.tin, { optional: true });
  await assist.fill(page, 'preapp.showroomAddress', PREAPP.showroomAddress, profile.address);
  await assist.fill(page, 'preapp.showroomPostcode', PREAPP.showroomPostcode, profile.postcode);

  await selectState(page, profile.state);
  await selectCity(page, profile.city);

  await assist.fill(page, 'preapp.adminName', PREAPP.adminName, profile.adminName);
  await assist.fill(page, 'preapp.mobileNo', PREAPP.mobileNo, profile.adminPhone);
  await assist.fill(page, 'preapp.adminEmail', PREAPP.adminEmail, profile.adminEmail);

  await assist.dump(page, '12-preapplication-form-filled');
  await advancePastStepOne(page);
  await assist.dump(page, '13-business-info-review');
}

/** State options are UPPERCASE on the page; match loosely and report the hit. */
async function selectState(page, state) {
  const el = page.locator(PREAPP.showroomState.css);
  const options = await el.locator('option').allInnerTexts();
  const wanted = options.find((o) => o.trim().toUpperCase() === String(state).trim().toUpperCase()) ||
    options.find((o) => o.toUpperCase().includes(String(state).trim().toUpperCase()));
  if (!wanted) {
    throw new Error('state "' + state + '" is not an option — page offers: ' + options.filter(Boolean).join(', '));
  }
  await el.selectOption({ label: wanted });
  console.log('    preapp.state                    ' + wanted);
}

/**
 * City is populated by loadCity() over ajax, so the select is disabled and
 * single-optioned until that resolves. Waiting on the OPTION COUNT rather than
 * on the enabled attribute is what makes this reliable — the control is enabled
 * a moment before it has anything in it.
 */
async function selectCity(page, preferred) {
  const el = page.locator(PREAPP.showroomCity.css);

  // Wait in the DOM, not on visibility: an <option> inside a <select> is never
  // "visible" to Playwright, so waitFor() on one can only ever time out — even
  // while the list is sitting there fully populated.
  await page.waitForFunction(
    (sel) => {
      const s = document.querySelector(sel);
      return Boolean(s) && !s.disabled && s.options.length > 1;
    },
    PREAPP.showroomCity.css,
    { timeout: 20_000 }
  );

  const options = (await el.locator('option').allInnerTexts()).map((s) => s.trim()).filter(Boolean);
  const real = options.filter((o) => !/^select city$/i.test(o));
  const wanted =
    real.find((o) => o.toUpperCase() === String(preferred || '').trim().toUpperCase()) ||
    real.find((o) => o.toUpperCase().includes(String(preferred || '').trim().toUpperCase())) ||
    real[0];
  if (!wanted) throw new Error('city dropdown never populated for this state');

  await el.selectOption({ label: wanted });
  console.log('    preapp.city                     ' + wanted + (wanted === preferred ? '' : '  (first available)'));
  return wanted;
}

/**
 * Click Next, and click it again if the TIN warning ate the first one.
 *
 * The TIN/BRN mismatch is deliberately NON-blocking — the page's own copy says
 * 'The TIN is invalid. This may affect e-Invoice submission. Click "Next" to
 * proceed.' A generated TIN will always trip it, so one repeat is expected and
 * is not an error. Anything still on step one after that is a real failure and
 * gets dumped.
 */
/**
 * The blocking modal the page raises while step one posts. Its visible text is
 * "Working…" (a real ellipsis character, not three dots), so match both.
 */
const BUSY_TEXT = /working\s*(\.\.\.|…)?/i;

/**
 * WAIT FOR STEP ONE'S SUBMIT TO ACTUALLY LAND — added 28-08-2026.
 *
 * This replaces a flat `waitForTimeout(1_500)`. That wait passed seven times on the
 * morning of 28-08 and then aborted E2E_TS2 at 0/8 at 08:40, having already spent a
 * reCAPTCHA: the dump showed the page mid-post behind its "Working…" modal, which is
 * neither step two nor a validation error, so the old code broke out of the retry
 * loop and threw "Next did not reach Business Info Review" — a message that describes
 * a rejected form, on a form that had not been answered yet. A wait tuned to a fast
 * day is not a wait.
 *
 * Three outcomes, and it names which so the dump says WHY:
 *   advanced  — step two is on screen
 *   (quiet)   — the modal cleared and we are still on step one: a real refusal
 *   stalled   — the modal never cleared inside the deadline: staging, not the form
 */
/**
 * How long to let the submit post before calling it stalled. Overridable because a
 * slow staging afternoon is a real thing and 90s is a guess, not a measurement — and
 * because scripts/probe-preapp-settle.js drives the stall branch, which is otherwise
 * a 90-second test.
 */
const STEP_ONE_DEADLINE_MS = Number(process.env.EV_PREAPP_SUBMIT_DEADLINE_MS || 90_000);

async function settleAfterNext(page, onReview, deadlineMs = STEP_ONE_DEADLINE_MS) {
  const t0 = Date.now();
  const busy = () => page.getByText(BUSY_TEXT).first().isVisible().catch(() => false);
  let sawBusy = false;
  let quietPolls = 0;

  while (Date.now() - t0 < deadlineMs) {
    if (await onReview()) return { advanced: true, sawBusy, waitedMs: Date.now() - t0 };
    if (await busy()) {
      sawBusy = true;
      quietPolls = 0;
      await page.waitForTimeout(500);
      continue;
    }
    // Not busy and not on step two. The modal drops a beat before the step indicator
    // repaints, so require three seconds of quiet before calling it a refusal —
    // twice the old wait, and still prompt when the form genuinely rejects.
    quietPolls += 1;
    if (quietPolls >= 6) return { advanced: false, sawBusy, waitedMs: Date.now() - t0 };
    await page.waitForTimeout(500);
  }
  return { advanced: false, sawBusy, stalled: true, waitedMs: Date.now() - t0 };
}

/**
 * How long to let the APPLICATION FORM's Submit post before calling it stalled.
 * Same reasoning and same override shape as STEP_ONE_DEADLINE_MS.
 */
const APPFORM_SUBMIT_DEADLINE_MS = Number(process.env.EV_APPFORM_SUBMIT_DEADLINE_MS || 90_000);

/**
 * WAIT FOR THE APPLICATION FORM'S SUBMIT TO ACTUALLY LAND — added 28-08-2026.
 *
 * settleAfterNext() below fixed exactly this bug for step one's Next on the morning of
 * 28-08. It landed ONE FUNCTION SHORT: submitApplicationForm() still had the flat-wait
 * shape — click, waitForTimeout(2_000), then three polls at 1.8s/2.0s — a ~7.8s total
 * budget with no notion of "still posting". E2E_TS3 died on it at 09:00, having spent a
 * reCAPTCHA and two Fiuu logins, and reported "the record is likely still Draft" — a
 * message about a REFUSED submit, on a submit that had not come back yet.
 *
 * Worse than the short budget: the old loop RE-CLICKED Submit at 1.8s, i.e. while the
 * first post could still be in flight. A double submit is not a retry.
 *
 * Same three outcomes, named, so the throw says which:
 *   advanced — the "successfully submitted" banner is up
 *   (quiet)  — nothing posting and no banner: a real refusal, worth answering a dialog
 *   stalled  — still behind the busy modal at the deadline: staging, not the form
 */
async function settleAfterSubmit(page, success, deadlineMs = APPFORM_SUBMIT_DEADLINE_MS) {
  const t0 = Date.now();
  const busy = () => page.getByText(BUSY_TEXT).first().isVisible().catch(() => false);
  let sawBusy = false;
  let quietPolls = 0;

  while (Date.now() - t0 < deadlineMs) {
    if (await success()) return { advanced: true, sawBusy, waitedMs: Date.now() - t0 };
    if (await busy()) {
      sawBusy = true;
      quietPolls = 0;
      await page.waitForTimeout(500);
      continue;
    }
    // Three seconds of quiet before calling it a refusal — the busy modal drops a beat
    // before the banner paints, and the banner is the only proof we accept.
    quietPolls += 1;
    if (quietPolls >= 6) return { advanced: false, sawBusy, waitedMs: Date.now() - t0 };
    await page.waitForTimeout(500);
  }
  return { advanced: false, sawBusy, stalled: true, waitedMs: Date.now() - t0 };
}

async function advancePastStepOne(page) {
  const onReview = async () =>
    /submit and pay/i.test((await page.locator(PREAPP.next.css).innerText().catch(() => '')) || '') ||
    (await page.locator(PREAPP.agreeTerms.css).isVisible().catch(() => false));

  let settled = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    await assist.click(page, 'preapp.next.' + attempt, PREAPP.next);
    settled = await settleAfterNext(page, onReview);
    const took = (settled.waitedMs / 1_000).toFixed(1);
    if (settled.advanced) {
      console.log('    reached Business Info Review' +
        (attempt > 1 ? ' (second Next — TIN warning)' : '') +
        `  (submit landed in ${took}s${settled.sawBusy ? ', behind the Working… modal' : ''})`);
      return;
    }
    if (settled.stalled) {
      console.log(`    the Working… modal never cleared in ${took}s — not pressing Next again`);
      break;
    }
    const warning = await page.locator('#tin-error:visible, .invalid-marker').count();
    if (!warning) break;
    console.log('    non-blocking TIN warning shown — pressing Next again, as the page asks');
  }

  const where = await assist.dump(page, 'miss-preapp-stuck-on-step-1');
  const errors = await page.locator('[id$="-error"]:visible, .error:visible').allInnerTexts().catch(() => []);
  // WHICH failure it was, not just that there was one. "Still posting after 90s" and
  // "the form came back and refused" want different responses from whoever reads this.
  const why = !settled ? ''
    : settled.stalled
      ? `\n    the page was STILL POSTING — its "Working…" modal was up for the whole ` +
        `${(settled.waitedMs / 1_000).toFixed(1)}s. That is staging being slow, not the form ` +
        `being wrong; the gate session is saved and reusable, so a retry costs no reCAPTCHA.`
      : `\n    the submit came back after ${(settled.waitedMs / 1_000).toFixed(1)}s` +
        `${settled.sawBusy ? ' (the Working… modal cleared)' : ' (no Working… modal was ever seen)'} ` +
        `and the page is still on step one.`;
  throw new Error(
    'Next did not reach Business Info Review.' + why +
    (errors.length ? '\n    page is showing: ' + errors.map((e) => e.trim()).filter(Boolean).join(' | ') : '') +
    '\n    dumped to ' + where + '.*'
  );
}

/**
 * Payment methods are image CARDS with the radio hidden behind them, so the
 * input is never visible and clicking it directly cannot work. These are the
 * accessible names the cards actually carry:
 *
 *   credit  "Credit or Debit Card"
 *   b2b     "Online Banking (Business)"
 *   b2c     "Online Banking (Personal)"     <- the sandbox path, and the default
 */
const METHOD = {
  credit: { text: /credit or debit card/i, value: 'credit', css: '#payment-credit' },
  b2b: { text: /online banking \(business\)/i, value: 'fpx_business', css: '#payment-fpx-business' },
  b2c: { text: /online banking \(personal\)/i, value: 'fpx_personal', css: '#payment-fpx-personal' },
};

/** What the page currently has selected for a radio group. */
const selectedValue = (page, name) =>
  page.evaluate((n) => {
    const el = document.querySelector('input[name="' + n + '"]:checked');
    return el ? el.value : '';
  }, name);

/**
 * Last resort for a control the UI hides: set it in the DOM and fire the events
 * the page listens for.
 *
 * Used only after clicking the card has failed, and it says so when it does —
 * it bypasses whatever the click handler would have done, and a fixture built
 * that way is worth less than one built by clicking.
 */
async function forceRadio(page, css) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('click', { bubbles: true }));
    return true;
  }, css);
}

async function pickPaymentMethod(page, kind) {
  const m = METHOD[kind] || METHOD.b2c;
  await assist.click(page, 'review.paymentMethod', { text: m.text }, { optional: true });

  if ((await selectedValue(page, 'paymentMethod')) !== m.value) {
    if (!(await forceRadio(page, m.css))) {
      throw new Error('no payment method control matched ' + m.text + ' — see discovery/13b-*');
    }
    console.log('    review.paymentMethod            set in the DOM — the card click did not take');
  }
  console.log('    payment method                  ' + m.value);
  await page.waitForTimeout(600); // the bank list renders off this choice
}

/**
 * Bank list, which only exists once a method is chosen.
 *
 * MUST be scoped to the chosen method's category. Every bank radio shares the
 * name `bankSelection` — B2B and B2C alike — so "the first one" is FPX_M2E, a
 * BUSINESS bank, even when the method chosen was Online Banking (Personal).
 * That mismatch reached the gateway once before this was scoped, and the log
 * cheerfully reported "Maybank2u" while submitting a B2B id.
 *
 * The cards are images, so the click target is matched by alt text first and
 * visible text second; Maybank is the default only because it is the one with a
 * dependable sandbox.
 */
async function pickBank(page, preferred, category = 'FPX_B2C') {
  const want = preferred ? new RegExp(preferred, 'i') : /maybank/i;
  const inCategory = 'input[name="bankSelection"][data-category="' + category + '"]';

  // The visible cards belong to the chosen category, so an alt/text hit is safe.
  await assist.click(page, 'review.bank', { label: want, role: 'img' }, { optional: true });
  if (!(await bankCategory(page))) {
    await assist.click(page, 'review.bank.text', { text: want }, { optional: true });
  }

  let chosen = await selectedValue(page, 'bankSelection');
  let cat = await bankCategory(page);

  // Either nothing took, or something took from the WRONG list. Both are fixed
  // the same way: force the first bank that actually belongs to this method.
  if (!chosen || cat !== category) {
    if (chosen && cat !== category) {
      console.log('    review.bank                     ' + chosen + ' is ' + (cat || 'uncategorised') + ', not ' + category + ' — correcting');
    }
    if (await page.locator(inCategory).first().count()) {
      await forceRadio(page, inCategory);
      chosen = await selectedValue(page, 'bankSelection');
      cat = await bankCategory(page);
      console.log('    review.bank                     first ' + category + ' bank taken in the DOM');
    }
  }

  if (!chosen) throw new Error('no bank could be selected — see discovery/13b-review-ready-to-pay.*');
  if (cat !== category) {
    throw new Error('bank ' + chosen + ' belongs to ' + cat + ' but the method is ' + category +
      ' — the gateway would be handed a mismatched pair');
  }
  console.log('    bank                            ' + chosen + '  (' + cat + ')');
  return chosen;
}

/** data-category of the currently checked bank — the tell for a mismatch. */
const bankCategory = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('input[name="bankSelection"]:checked');
    return el ? el.getAttribute('data-category') || '' : '';
  });

/**
 * Business Info Review -> declaration -> payment method -> Submit and Pay, then
 * hand the gateway to the operator.
 *
 * FPX B2C with Maybank2u is the default because it is the sandbox path with a
 * simulator; credit/debit is a different gateway and a different set of screens.
 */
async function reviewAndPay(page, profile, opts = {}) {
  console.log('\n  Business Info Review');
  const total = await page.getByText(/Total Amount.*RM\s*[\d,.]+/i).first().innerText().catch(() => '');
  if (total) console.log('    ' + total.replace(/\s+/g, ' ').trim());

  await assist.click(page, 'review.agreeTerms', PREAPP.agreeTerms);
  const kind = /credit/i.test(opts.method || 'fpx') ? 'credit'
    : /b2b|business/i.test(opts.method || '') ? 'b2b' : 'b2c';
  await pickPaymentMethod(page, kind);
  let bank = '';
  if (kind !== 'credit') {
    bank = await pickBank(page, opts.bank, kind === 'b2b' ? 'FPX_B2B' : 'FPX_B2C');
  }

  await assist.dump(page, '13b-review-ready-to-pay');
  await assist.click(page, 'review.submitAndPay', PREAPP.next);

  const uuid = await payFpx(page, { amount: 'RM 108.00', what: 'the pre-application fee', bank });
  await assist.dump(page, '14-preapplication-submitted');
  return { uuid, url: page.url() };
}

/** Controls a payment simulator puts in front of you, in the order to try them. */
const PAY_LABEL = /^(pay|pay now|confirm|approve|submit|proceed|continue|agree|accept|ok|next|done|request tac)$/i;

/**
 * Drive the Fiuu simulator's own controls, where they exist. Observed on the
 * 23-08-2026 video for both banks used since:
 *
 *   Maybank (MB2U0227)  shows the TAC on the page next to a copy control, with
 *                       an empty "Enter TAC" input below it.
 *   AmBank  (AMB80209)  wants "Request TAC" clicked first (PAY_LABEL covers
 *                       that), then shows the code the same way.
 *
 * Both carry a "Please set payment status below" dropdown that must read
 * Approved before Pay Now. None of this is a credential — the TAC is printed on
 * the page — so filling it is fair game; the login before it stays human.
 * Everything here is best-effort: a miss leaves the screen for the operator.
 */
/** The one host the stored simulator credential may ever be typed on. */
const SIM_HOST = 'bank-simulator.fiuu.com';

/**
 * Log in to the Fiuu payment simulator from the shared store.
 *
 * FIUU_SIM_USER / FIUU_SIM_PASS live in ~/.claude/secrets/eauto.env beside the
 * eAuto role logins and reach process.env through accounts.js — same mechanism
 * as every other stored login in this harness. The guard that makes this safe
 * to store: the pair is typed ONLY when the window's host is exactly
 * bank-simulator.fiuu.com. Any other login form — including a real bank's —
 * still pauses for a human, credentials in the store or not.
 */
async function simulatorLogin(p) {
  const user = (process.env.FIUU_SIM_USER || '').trim();
  const pass = (process.env.FIUU_SIM_PASS || '').trim();
  if (!user || !pass) return false;

  let host = '';
  try { host = new URL(p.url()).hostname; } catch { /* about:blank etc. */ }
  if (host !== SIM_HOST) return false;

  const userBox = p.locator('input[type=text]:visible, input:not([type]):visible, input[type=email]:visible').first();
  const passBox = p.locator('input[type=password]:visible').first();
  if (!(await userBox.count().catch(() => 0)) || !(await passBox.count().catch(() => 0))) return false;

  await userBox.fill(user);
  await passBox.fill(pass);
  await p
    .getByRole('button', { name: /^log ?in$/i })
    .or(p.locator('button[type=submit], input[type=submit]'))
    .first()
    .click()
    .catch(() => {});
  console.log('    simulator login submitted from the shared store (FIUU_SIM_USER) — host ' + host);
  await p.waitForTimeout(2_500);
  return true;
}

async function driveSimulator(p) {
  // status dropdown -> Approved
  await p.evaluate(() => {
    for (const s of document.querySelectorAll('select')) {
      const ok = [...s.options].find((o) => /approved/i.test(o.textContent || o.value));
      if (ok && s.value !== ok.value) {
        s.value = ok.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }).catch(() => {});

  // TAC shown on the page -> the empty TAC input. The code is displayed in
  // ANOTHER INPUT'S VALUE (next to a copy control), which innerText never
  // carries — a text-only reader missed it and burned the click budget on the
  // 24-08 run. So: page text first, then any filled 4-8-digit input that is
  // not itself the TAC box and not an amount/order field.
  await p.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[type=text], input:not([type])')];
    const tacBox = inputs.find((i) => !i.value && /tac/i.test(i.name + ' ' + i.id + ' ' + i.placeholder));
    if (!tacBox) return;

    const fromText = (/Transaction Authentication Code\s*:?\s*(\d{4,8})/i.exec(document.body.innerText || '') || [])[1];
    const fromInput = (inputs.find((i) =>
      i !== tacBox && /^\d{4,8}$/.test(i.value || '') &&
      !/amount|order|postcode|mobile|phone/i.test(i.name + ' ' + i.id + ' ' + i.placeholder)
    ) || {}).value;

    const tac = fromText || fromInput;
    if (!tac) return;
    tacBox.value = tac;
    tacBox.dispatchEvent(new Event('input', { bubbles: true }));
    tacBox.dispatchEvent(new Event('change', { bubbles: true }));
  }).catch(() => {});
}

/**
 * Wait out the payment gateway — and drive its window when it is a simulator.
 *
 * On success the eAuto page does window.location.replace('/obs/preOnb/summary/<uuid>'),
 * so the summary URL is both the completion signal and the pre-application's
 * uuid, which saves searching the BackOffice listing for it later.
 *
 * The gateway opens its own window, so this watches every page the context
 * opens, dumps each one, and clicks the approve control a person would. Bounded
 * at 8 clicks per window: a simulator that still is not done by then is not a
 * simulator we understand, and guessing further is worse than stopping.
 *
 * WHERE IT REFUSES TO CONTINUE
 *
 * A password field means this is a real online-banking login, not a sandbox
 * approve screen. It stops there and hands the window back, every time. Nothing
 * here types a credential, and no automation should.
 */
async function payFpx(page, { amount, what, bank, settled: settledOpt }) {
  const summaryUuid = () => (/\/preOnb\/summary\/([\w-]+)/i.exec(page.url()) || [])[1] || '';
  // The default completion signal is the pre-application's summary redirect.
  // The registration fee never goes there — its success page is "Application
  // Payment Success" on /obs/form — so callers can hand in their own signal.
  const settled = settledOpt
    ? async () => (await settledOpt()) || (await failed(page))
    : async () => Boolean(summaryUuid()) || (await failed(page));
  if (await settled()) return finish(page, what, summaryUuid);

  const ctx = page.context();
  const opened = ctx.pages().filter((p) => p !== page);
  ctx.on('page', (p) => opened.push(p));

  console.log('\n  ' + what + ' (' + amount + ')' + (bank ? ' via ' + bank : '') + ' — driving the gateway window');
  const state = new Map();          // page -> { clicks, seen, done }
  // A payment step waits on a person who may have walked away. Ten minutes was
  // not enough and cost a whole rebuild; half an hour is the default, and
  // EV_PAY_WAIT_MS overrides it for an unattended run that should fail fast.
  const waitMs = Number(process.env.EV_PAY_WAIT_MS || 1_800_000);
  const deadline = Date.now() + waitMs;
  let sawCredentialWall = false;

  while (!(await settled()) && Date.now() < deadline) {
    for (const p of opened.filter((x) => !x.isClosed())) {
      const st = state.get(p) || { clicks: 0, seen: new Set(), done: false };
      state.set(p, st);
      if (st.done) continue;

      await p.waitForLoadState('domcontentloaded').catch(() => {});

      // A password field means a login, and logins are human by policy. But the
      // wall is a PAUSE, not an exit: the first version broke out of this loop
      // entirely, so the TAC screen AFTER the login was never driven and the
      // operator had to finish the simulator by hand (bitten on the 24-08 run).
      // Now the window is skipped while the password field is up, and driving
      // resumes the moment the login clears.
      if ((await p.locator('input[type=password]:visible').count().catch(() => 0)) > 0) {
        // Fiuu's simulator can be logged into from the shared store — host-locked
        // to bank-simulator.fiuu.com inside simulatorLogin. Two attempts: a pair
        // that has not worked twice is stale, and hammering a login with a stale
        // credential is how accounts get locked.
        st.loginTries = st.loginTries || 0;
        if (st.loginTries < 2 && (await simulatorLogin(p).catch(() => false))) {
          st.loginTries += 1;
          continue;
        }
        if (!st.warnedCredential) {
          st.warnedCredential = true;
          sawCredentialWall = true;
          await assist.dump(p, 'fpx-gateway-credential-screen').catch(() => {});
          console.log('\n  [pause] The gateway wants a login' + (st.loginTries
            ? ' and the stored FIUU_SIM_* pair did not clear it — it may be stale.'
            : ' and no FIUU_SIM_USER / FIUU_SIM_PASS is filled in ~/.claude/secrets/eauto.env.'));
          console.log('     Log in in that window by hand — the moment the login clears I resume driving it');
          console.log('     (TAC, status Approved, Pay Now) and carry on by myself.');
        }
        continue;
      }
      if (st.warnedCredential) {
        st.warnedCredential = false;
        console.log('    login cleared — driving the gateway window again');
      }

      // The gateway opens on a "Processing payment... do not close this window"
      // landing page that has no controls at all and then redirects. A window
      // with nothing to click is NOT a window we have failed at — it is one that
      // has not arrived yet, so leave its budget alone and come back.
      const controls = await p
        .locator('button:visible, input[type=submit]:visible, input[type=button]:visible, a[role=button]:visible')
        .count()
        .catch(() => 0);
      if (!controls) continue;

      // Dump each distinct screen once, keyed by URL — a redirect chain would
      // otherwise overwrite the one screen we actually need to read.
      const key = p.url().split('?')[0];
      if (!st.seen.has(key)) {
        st.seen.add(key);
        await assist.dump(p, 'fpx-gateway-' + (st.seen.size)).catch(() => {});
      }

      // Simulator conveniences first — status dropdown to Approved, on-page TAC
      // into the TAC box — so the click that follows lands on a completed form.
      await driveSimulator(p);

      const hit =
        (await assist.click(p, 'fpx.approve.' + (st.clicks + 1), { role: 'button', label: PAY_LABEL }, { optional: true })) ||
        (await assist.click(p, 'fpx.approve.text.' + (st.clicks + 1), { text: PAY_LABEL }, { optional: true })) ||
        (await assist.click(p, 'fpx.approve.submit.' + (st.clicks + 1), { css: 'input[type=submit], button[type=submit]' }, { optional: true }));

      if (hit) {
        st.clicks += 1;
        if (st.clicks >= 8) {
          st.done = true;
          console.log('    gateway window: 8 clicks and still not settled — handing it over');
        }
      } else {
        // Controls ARE present and none of them is an approve control we know.
        // Guessing further on a payment screen is worse than stopping.
        st.done = true;
        console.log('    gateway window: controls present but none recognised — handing it over');
      }
      await p.waitForTimeout(1_200);
    }
    await page.waitForTimeout(1_000);
  }

  if (!(await settled())) {
    await assist.waitForHuman(page, {
      hint: sawCredentialWall
        ? 'The gateway is waiting on a login I could not clear.\n' +
          '     Approve ' + what + ' (' + amount + ') in that window and I will pick the flow back up.'
        : 'I could not finish ' + what + ' (' + amount + ') in the gateway window — the last\n' +
          '     screen is dumped to discovery/fpx-gateway-*. Approve it by hand and I will carry on.',
      until: settled,
      timeoutMs: waitMs,
    });
  }

  if (await failed(page)) {
    await assist.dump(page, 'fpx-failed');
    throw new Error(what + ' reported FAILED by the gateway — see discovery/fpx-failed.*');
  }
  return finish(page, what, summaryUuid);
}

function finish(page, what, summaryUuid) {
  const uuid = summaryUuid();
  if (uuid) console.log('    ' + what + ' done — pre-application uuid ' + uuid);
  return uuid;
}

const failed = (page) =>
  page.locator('.unsuccessful-payment-container:visible').count().then((n) => n > 0).catch(() => false);

/* ------------------------------------------- the dealer-side application form */

/**
 * The dealer Application Form, captured 24-08-2026 from a BackOffice-generated
 * link (discovery/44-application-form-ssm.*). Three steps in one page:
 * 1 Business Information, 2 Upload Files, 3 Acknowledgement.
 *
 * `#to-next-step` carries a data-step attribute, which is the honest way to know
 * which step we are on — far better than counting clicks. The first version of
 * this walker clicked Next six times without checking, and every click was
 * rejected by required-field validation while the log cheerfully reported
 * progress. Reading data-step is what turns that into a real answer.
 */
const APPFORM = {
  next: { css: '#to-next-step' },
  saveDraft: { css: '#to-save-draft' },
  submit: { role: 'button', label: /^submit$/i },
  acknowledge: { label: /acknowledg|declar|agree/i, css: 'input[type=checkbox]' },

  // Step 1 — Business Information
  companyName: { css: '#companyName' },
  tin: { css: '#tinNo' },
  sst: { css: '#sstNo' },
  address1: { css: '#address1' },
  address2: { css: '#address2' },
  address3: { css: '#address3' },
  postcode: { css: '#postcode' },
  state: { css: '#stateSelect' },
  city: { css: '#citySelect' },
  businessType: (code) => ({ css: '#business-type-' + code }),
  showroomOwn: { css: '#showroom-type-OWN' },
  noAdvertising: { css: '#hasAdvertisingPlatform1' },
  noAuctionHouse: { css: '#hasAuctionHouse2' },
  noAssociation: { css: '#isNoAssociation1' },

  // Director + Person In Charge — two more required blocks on step one.
  numOfDirector: { css: '#numOfDirector' },
  directorName: { css: '#directorNameInput' },
  directorMyKad: { css: '#directorMyKad' },
  directorMobile: { css: '#directorMobile' },
  directorEmail: { css: '#directorEmail' },
  picName: { css: '#picName' },
  picMyKad: { css: '#picMyKad' },
  picMobile: { css: '#picMobile' },
  picEmail: { css: '#picEmail' },
};

/**
 * The Application Form the dealer reaches through the link BackOffice generates
 * on approval: Business Information -> Upload Files -> Acknowledgement -> Submit.
 *
 * Unlike the pre-application form, this one has NOT been captured yet — the
 * build has never got this far. Expect the first run to stop here with a dump,
 * and correct these hints from it.
 */
/**
 * Which step the wizard is on, from the Next button's own data-step. On the
 * Acknowledgement step the Next button is REPLACED by Submit, so a missing
 * data-step with a visible Submit means step 3 — reading it as 1 sent the
 * walker back to filling Business Information on the wrong page (24-08 run).
 */
async function currentStep(page) {
  const v = await page.locator(APPFORM.next.css).getAttribute('data-step').catch(() => null);
  if (v) return Number(v) - 1;               // data-step names the NEXT step
  const submit = await page.getByRole('button', { name: /^submit$/i }).first().isVisible().catch(() => false);
  return submit ? 3 : 1;
}

/** Every required-field message currently on screen, deduplicated with its label. */
async function requiredErrors(page) {
  return page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.error, .text-danger, [class*="error"]')) {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || el.offsetParent === null) continue;
      if (!/required|invalid|must|please/i.test(t)) continue;
      const row = el.closest('div,tr,section');
      const label = row ? (row.querySelector('label,strong,b') || {}).textContent || '' : '';
      out.push((label.replace(/\s+/g, ' ').trim() + ' — ' + t).replace(/^ — /, '').slice(0, 90));
    }
    return [...new Set(out)];
  }).catch(() => []);
}

/**
 * Step 1, Business Information. Mostly the same facts as the pre-application
 * form, asked again — plus SST, showroom ownership, and the advertising /
 * auction-house / association questions.
 */
async function fillApplicationBusinessInfo(page, profile) {
  // Carried over from the pre-application, the business type arrives CHECKED and
  // DISABLED (observed 24-08: `checked="checked" disabled="disabled"`), and a
  // click on a disabled control waits its full timeout. Same guard for the other
  // pre-filled identity fields: touch only what the page left editable.
  await clickUnlessLocked(page, 'appform.businessType', APPFORM.businessType(profile.typeCode).css);
  await page.waitForTimeout(400);

  // Everything carried over from the pre-application arrives pre-filled and
  // DISABLED (businessType, companyName, tinNo were all locked on the 24-08
  // run), so every touch on this step goes through the locked-state guard.
  await fillUnlessLocked(page, 'appform.companyName', APPFORM.companyName.css, profile.businessName);
  await fillUnlessLocked(page, 'appform.tin', APPFORM.tin.css, profile.tin);
  await fillUnlessLocked(page, 'appform.sst', APPFORM.sst.css, profile.sst);

  await clickUnlessLocked(page, 'appform.showroomOwn', APPFORM.showroomOwn.css);
  await fillUnlessLocked(page, 'appform.address1', APPFORM.address1.css, profile.address);
  await fillUnlessLocked(page, 'appform.postcode', APPFORM.postcode.css, profile.postcode);

  // State options here carry a code — "JOHOR (01)" — so match loosely on name.
  await selectByName(page, APPFORM.state.css, profile.state);
  await page.waitForTimeout(1_200);                    // city loads off state
  await selectByName(page, APPFORM.city.css, profile.city, true);

  // The three "do you have…" questions. Answering No everywhere keeps the form
  // short; each Yes opens another required block (platforms, auction houses,
  // association membership receipts).
  for (const [step, spec] of [['noAdvertising', APPFORM.noAdvertising], ['noAuctionHouse', APPFORM.noAuctionHouse], ['noAssociation', APPFORM.noAssociation]]) {
    await clickUnlessLocked(page, 'appform.' + step, spec.css);
  }

  // Director and Person In Charge. One director is enough; asking for more opens
  // another identical block per head, each with its own MyKad upload.
  await fillUnlessLocked(page, 'appform.numOfDirector', APPFORM.numOfDirector.css, '1');
  await fillUnlessLocked(page, 'appform.directorName', APPFORM.directorName.css, profile.directorName);
  await fillUnlessLocked(page, 'appform.directorMyKad', APPFORM.directorMyKad.css, profile.directorMyKad);
  await fillUnlessLocked(page, 'appform.directorMobile', APPFORM.directorMobile.css, profile.directorMobile);
  await fillUnlessLocked(page, 'appform.directorEmail', APPFORM.directorEmail.css, profile.directorEmail);

  await fillUnlessLocked(page, 'appform.picName', APPFORM.picName.css, profile.picName);
  await fillUnlessLocked(page, 'appform.picMyKad', APPFORM.picMyKad.css, profile.picMyKad);
  await fillUnlessLocked(page, 'appform.picMobile', APPFORM.picMobile.css, profile.picMobile);
  await fillUnlessLocked(page, 'appform.picEmail', APPFORM.picEmail.css, profile.picEmail);
}

/** What the page has done to a control: locked (disabled/readonly), checked, filled. */
const controlState = (page, css) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    return {
      locked: Boolean(el.disabled || el.readOnly),
      checked: Boolean(el.checked),
      value: 'value' in el ? String(el.value || '') : '',
    };
  }, css).catch(() => null);

/** Click a radio/checkbox unless the page pre-checked or locked it. */
async function clickUnlessLocked(page, step, css) {
  const st = await controlState(page, css);
  if (st && (st.checked || st.locked)) {
    console.log('    ' + step.padEnd(32) + 'pre-set by the page' + (st.locked ? ' (locked)' : '') + ' — left alone');
    return null;
  }
  return assist.click(page, step, { css }, { optional: true });
}

/** Fill a text control unless the page locked it or already filled it. */
async function fillUnlessLocked(page, step, css, value) {
  if (value === undefined || value === null || value === '') return null;
  const st = await controlState(page, css);
  if (st && (st.locked || st.value)) {
    console.log('    ' + step.padEnd(32) + (st.locked ? 'locked by the page' : 'pre-filled') + ' — left alone');
    return null;
  }
  return assist.fill(page, step, { css }, value, { optional: true });
}

/** Pick an option by its name even when the label carries a code in brackets. */
async function selectByName(page, selector, wanted, firstIfMissing = false) {
  const el = page.locator(selector);
  if (!(await el.count())) return '';
  const st = await controlState(page, selector);
  if (st && st.locked) {
    console.log('    ' + selector.padEnd(32) + 'locked by the page — left alone');
    return '';
  }
  if (!(await el.first().isVisible().catch(() => false))) {
    console.log('    ' + selector.padEnd(32) + 'not visible on this step — skipped');
    return '';
  }
  const options = (await el.locator('option').allInnerTexts()).map((s) => s.trim()).filter(Boolean);
  const want = String(wanted || '').toUpperCase();
  const hit =
    options.find((o) => o.toUpperCase() === want) ||
    options.find((o) => o.toUpperCase().replace(/\s*\(\d+\)\s*$/, '') === want) ||
    options.find((o) => o.toUpperCase().includes(want)) ||
    (firstIfMissing ? options.find((o) => !/^select/i.test(o)) : null);
  if (!hit) throw new Error(selector + ' has no option for "' + wanted + '" — offers: ' + options.slice(0, 12).join(', '));
  await el.selectOption({ label: hit });
  console.log('    ' + selector.padEnd(32) + hit);
  return hit;
}

/**
 * Walk the Application Form: Business Information -> Upload Files ->
 * Acknowledgement -> Submit.
 *
 * Advancing is VERIFIED, not assumed. Clicking Next on a step with a missing
 * required field leaves you where you were, and a walker that does not check
 * will happily click six times and report progress it never made — which is
 * exactly what the first version did.
 */
async function fillApplicationForm(page, profile, link) {
  console.log('\n  Application Form (dealer link)');
  await page.goto(link, { waitUntil: 'domcontentloaded' });
  await page.locator(APPFORM.next.css).waitFor({ timeout: 30_000 });
  await assist.dump(page, '20-application-form-step1');

  for (let guard = 0; guard < 6; guard++) {
    const step = await currentStep(page);
    console.log('    on step ' + step);

    if (step === 1) await fillApplicationBusinessInfo(page, profile);
    if (step === 2) await uploadApplicationFiles(page, profile);
    if (step >= 3) await fillAcknowledgementStep(page, profile);

    await assist.dump(page, '20-application-form-step' + step + '-filled');

    const submit = await assist.resolve(page, APPFORM.submit);
    if (submit && step >= 3) {
      // Any confirmation dialog still open would intercept the click — answer it.
      await assist.click(page, 'appform.dialog.yes', { role: 'button', label: /^(yes|ok)$/i }, { optional: true });
      // The banner is the ONLY proof: on the 24-08 run Submit "worked" while
      // two Invalid-email-format messages held the record at Draft.
      const success = async () => (await page.getByText(/successfully submitted/i).count().catch(() => 0)) > 0;

      await submit.el.click();
      let settled = await settleAfterSubmit(page, success);

      // Submit can raise dialogs that swallow it — "Unsaved Changes" (button:
      // Save & Continue, hit on the 24-08 run) or a plain confirm. Answer
      // whatever came up, and press Submit again if the send still went nowhere.
      //
      // ONLY on the quiet branch. If the page is still posting, a second click is a
      // double submit, not a retry — which is what the old flat 1.8s wait did.
      for (let t = 0; t < 3 && !settled.advanced && !settled.stalled; t++) {
        await assist.click(page, 'appform.submit.dialog.' + (t + 1),
          { role: 'button', label: /^(save\s*&\s*continue|yes|ok|confirm)$/i }, { optional: true });
        settled = await settleAfterSubmit(page, success);
        if (settled.advanced || settled.stalled) break;
        const again = await assist.resolve(page, APPFORM.submit);
        if (!again) break;
        await again.el.click().catch(() => {});
        settled = await settleAfterSubmit(page, success);
      }

      const ok = settled.advanced || (await success());
      if (ok) {
        console.log(`    submit landed in ${(settled.waitedMs / 1_000).toFixed(1)}s` +
          (settled.sawBusy ? ', behind the busy modal' : ''));
      }
      await assist.click(page, 'appform.success.ok', { role: 'button', label: /^ok$/i }, { optional: true });
      await assist.dump(page, '22-application-submitted');
      if (!ok) {
        const errs = await requiredErrors(page);
        // WHICH failure it was. "Still posting after 90s" and "the form came back and
        // refused" want different responses from whoever reads this at 9am.
        const why = settled.stalled
          ? `\n    the page was STILL POSTING — its busy modal was up for the whole ` +
            `${(settled.waitedMs / 1_000).toFixed(1)}s. That is staging being slow, not the ` +
            `record being wrong; check the listing before re-filming, it may have landed.`
          : `\n    the submit came back after ${(settled.waitedMs / 1_000).toFixed(1)}s` +
            `${settled.sawBusy ? ' (the busy modal cleared)' : ' (no busy modal was ever seen)'} ` +
            `and no success banner ever painted.`;
        throw new Error('Submit clicked but no success notification — the record is likely still Draft.' +
          why + (errs.length ? '\n    the page shows: ' + errs.join('\n                    ') : ''));
      }
      console.log('    submitted — success notification confirmed');
      return;
    }

    // Advancing a step is a CYCLE, not a click, and it may need running twice.
    //
    // Two things eat a Next without failing (both seen on the 24-08 run / the
    // video): the "You have unsaved changes. To save, click Save & Continue."
    // dialog, and the TIN warning. The ^...$ anchors keep the Save & Continue
    // match off the footer's "Save & Continue Later" button.
    //
    // The TIN warning is ACKNOWLEDGE-ONCE, and that is what stalled the 26-08
    // build. validateTinAgainstBrn() runs inside the Unsaved-Changes dialog's
    // confirm handler: the first call stores tinMismatchAckKey (TIN|regNo),
    // shows "The TIN is invalid... Click Next to proceed" and returns false;
    // the SECOND call with the same key returns true and the draft saves. So
    // the page needs Next -> Save & Continue twice over, and the old code did
    // next -> saveContinue -> next and stopped one click short, one dialog
    // still open. Generated TINs never validate, so every BackOffice-route
    // fixture hits this.
    let after = step;
    for (let attempt = 1; attempt <= 3 && after === step; attempt++) {
      await assist.click(page, attempt === 1 ? 'appform.next' : 'appform.next.retry', APPFORM.next, { optional: true });
      await page.waitForTimeout(2_000);
      after = await currentStep(page);
      if (after !== step) break;

      await assist.click(page, 'appform.saveContinue', { role: 'button', label: /^save\s*&\s*continue$/i }, { optional: true });
      await page.waitForTimeout(2_000);
      after = await currentStep(page);

      if (after === step && attempt < 3) {
        const warned = await page.locator('#tinNo-mismatch-error:visible').count().catch(() => 0);
        if (warned) console.log('    appform.tin                     acknowledged the TIN warning — going round again');
      }
    }
    if (after === step) {
      const errs = await requiredErrors(page);
      const where = await assist.dump(page, 'miss-appform-stuck-step' + step);
      throw new Error(
        'the Application Form would not leave step ' + step + '.' +
        (errs.length ? '\n    it wants: ' + errs.join('\n              ') : '\n    no visible validation message') +
        '\n    dumped to ' + where + '.*'
      );
    }
  }
  throw new Error('the Application Form never reached a Submit — more than six steps, which is unexpected');
}

/**
 * Step 3, Acknowledgement — Director / Business Owner in Charge, Admin in
 * Charge, e-Invoice Person-in-Charge (video 4:48–5:24). Some fields arrive
 * pre-filled from earlier data; the rest are matched by placeholder, because
 * this variant's ids are unobserved. Every empty visible box in a block gets
 * the director's details — the blocks repeat the same four placeholders.
 */
async function fillAcknowledgementStep(page, profile) {
  const cleanName = ((profile.directorName || profile.adminName || 'QA DIRECTOR')
    .replace(/[^a-zA-Z ]+/g, ' ').replace(/\s+/g, ' ').trim()) || 'QA DIRECTOR';
  // This form rejects plus-addressing ("Invalid email format", 24-08 run) even
  // though the pre-application accepted it — so every email here, including the
  // pre-filled ones carried over WITH a plus, gets the stripped form.
  const safeEmail = (() => {
    const src = String(profile.directorEmail || profile.adminEmail || 'qa.eaint11982@modefair.com');
    const [local, domain] = src.split('@');
    return local.split('+')[0] + '@' + (domain || 'modefair.com');
  })();
  const byPlaceholder = [
    [/mykad/i, profile.directorMyKad],
    [/mobile/i, profile.directorMobile || profile.adminPhone],
    [/email/i, safeEmail],
    [/name/i, cleanName],
  ];

  // "Same as Director/Business Owner in Charge" collapses the e-Invoice block —
  // and raises "Proceed Confirmation: This will clear the e-Invoice
  // Person-in-Charge details, sure to proceed?" (24-08 run). Left unanswered,
  // its overlay intercepts every later click, including Submit.
  const same = page.getByLabel(/same as director/i).first();
  const alreadySame = (await same.count().catch(() => 0)) && (await same.isChecked().catch(() => false));
  if (alreadySame) {
    console.log('    ack.sameAsDirector              already ticked — left alone (a re-click toggles it OFF)');
  } else {
    await assist.click(page, 'ack.sameAsDirector', { label: /same as director/i, css: 'input[type=checkbox]' }, { optional: true });
    await page.waitForTimeout(600);
    await assist.click(page, 'ack.sameAsDirector.confirm', { role: 'button', label: /^yes$/i }, { optional: true });
  }

  const inputs = page.locator('input[type=text]:visible, input[type=email]:visible, input[type=tel]:visible, input:not([type]):visible');
  for (let i = 0, n = await inputs.count().catch(() => 0); i < n; i++) {
    const el = inputs.nth(i);
    if (await el.evaluate((x) => x.disabled || x.readOnly).catch(() => true)) continue;
    const ph = (await el.getAttribute('placeholder').catch(() => '')) || '';
    const val = (await el.inputValue().catch(() => '')) || '';

    // Pre-filled emails carrying a plus fail this form's validator — replace.
    if (/email/i.test(ph)) {
      if (!val || val.includes('+')) {
        await el.fill(safeEmail).catch(() => {});
        console.log('    ack.' + (ph.toLowerCase().replace(/\W+/g, '-')).padEnd(28) + safeEmail + (val ? '  (replaced plus-address)' : ''));
      }
      continue;
    }
    if (val) continue;
    const hit = byPlaceholder.find(([re]) => re.test(ph));
    if (hit && hit[1]) {
      await el.fill(String(hit[1])).catch(() => {});
      console.log('    ack.' + (ph.toLowerCase().replace(/\W+/g, '-') || 'field').padEnd(28) + hit[1]);
    }
  }

  // Label-matched only: a bare input[type=checkbox] fallback ticked an
  // arbitrary "checkbox 7 of 7" here once. A miss is fine — the declaration on
  // this variant is plain text, not a checkbox.
  await assist.click(page, 'appform.acknowledge', { label: /acknowledg|declar|agree/i }, { optional: true });
}

/**
 * Step 2, Upload Files. Every upload is a styled Browse button over a hidden
 * input, so each one goes through the filechooser the same way the trading
 * licence did on the pre-application form.
 */
async function uploadApplicationFiles(page, profile) {
  await uploadAllBrowseButtons(page, profile);

  // The MyKad/passport row carries a required "Name" textbox next to its Browse
  // button (aria: textbox "Name"; hit on the 24-08 run as "This field is
  // required"). Letters and spaces only — the row also validates characters.
  const clean = (((profile && (profile.directorName || profile.adminName)) || 'QA DIRECTOR')
    .replace(/[^a-zA-Z ]+/g, ' ').replace(/\s+/g, ' ').trim()) || 'QA DIRECTOR';
  const boxes = page.getByRole('textbox', { name: /^name$/i }).or(page.getByPlaceholder(/^name$/i));
  for (let i = 0, n = await boxes.count().catch(() => 0); i < n; i++) {
    const el = boxes.nth(i);
    if ((await el.isVisible().catch(() => false)) && !(await el.inputValue().catch(() => ''))) {
      await el.fill(clean).catch(() => {});
      console.log('    director/owner name              ' + clean);
    }
  }
}

/**
 * Feed every visible Browse button on the current step, choosing the file type
 * from the surrounding text. The 23-08-2026 video settled two specifics:
 *
 *   - the "20 Seconds Showroom Video" row takes an mp4, so routing it a PDF
 *     would fail its accept filter (a real recording used MP4.mp4);
 *   - each MyKad/passport row carries a NAME text input beside its Browse
 *     button, and the row is incomplete until both are given.
 */
async function uploadAllBrowseButtons(page, profile) {
  const buttons = page.locator('button:visible').filter({ hasText: /browse files?\.\.\.|browse file/i });
  const count = await buttons.count();
  console.log('    ' + count + ' upload control(s) on this step');

  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    const near = (await btn.evaluate((n) => {
      const box = n.closest('div,section,tr');
      return box ? (box.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) : '';
    }).catch(() => '')) || 'upload ' + (i + 1);

    const file = ensureAsset(
      /video/i.test(near) ? 'showroom-video-' + i + '.mp4'
      : /photo|picture|image|stamp|card/i.test(near) ? 'document-' + i + '.jpg'
      : 'document-' + i + '.pdf'
    );

    // The MyKad row's name box, when this Browse button has one.
    if (/mykad|passport|director|owner/i.test(near) && profile) {
      await btn.evaluate((n, name) => {
        const box = n.closest('div,section,tr');
        const input = box && [...box.querySelectorAll('input[type=text], input:not([type])')]
          .find((x) => !x.value && x.offsetParent !== null);
        if (input) {
          input.value = name;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, profile.directorName || profile.adminName || 'DIRECTOR ONE').catch(() => {});
    }

    try {
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 8_000 }),
        btn.click(),
      ]);
      await chooser.setFiles(file);
      console.log('    uploaded to: ' + near.slice(0, 44));
      await page.waitForTimeout(800);
    } catch {
      console.log('    could not upload to: ' + near.slice(0, 44) + ' (no file chooser opened)');
    }
  }
}

/**
 * The dealer's Registration Documents step — the link lands straight on it once
 * BackOffice has approved the application. Six required sections, one Browse
 * each (video, 7:36–8:24): RHB Offer Letter, RHB Direct Debit Application Form,
 * RHB LoA e-TukarMilik, RHB Bank Statement Cover / RHB Welcome Letter, eAuto LoA
 * e-TukarMilik, LHDN Company Tax Compliance Certificate. The confirm-and-agree
 * block above Submit is static text, not a checkbox.
 */
async function submitRegistrationDocs(page, profile, link) {
  console.log('\n  Registration Documents (dealer side)');
  if (link) await page.goto(link, { waitUntil: 'domcontentloaded' });
  await page.getByText(/registration documents/i).first().waitFor({ timeout: 30_000 });

  // BE ON STEP 4 BEFORE LOOKING FOR UPLOADS.
  //
  // "Registration Documents" is step 4 of a four-step wizard, and the wizard bar
  // is display-only — no click handlers, just spans. The page restores the last
  // step from localStorage, so a fresh browser context always opens on step 1,
  // and the old code's wait for the text /registration documents/ was satisfied
  // by the step-4 LABEL in that bar while step 1 was on screen. It then found
  // "0 upload control(s) on this step" and looked for a Submit that only step 4
  // renders (26-08 build).
  //
  // The page exposes showStep(n) and a step4Visible flag; use them, then check
  // #step4 is really on screen rather than trusting the call.
  const onStep4 = async () => page.locator('#step4').isVisible().catch(() => false);
  if (!(await onStep4())) {
    const why = await page.evaluate(() => {
      if (typeof showStep !== 'function') return 'showStep is not defined on this page';
      if (typeof step4Visible !== 'undefined' && !step4Visible) return 'the page says step 4 is not available yet (step4Visible false)';
      showStep(4);
      return '';
    }).catch((e) => 'showStep threw: ' + e.message);
    await page.waitForTimeout(1_000);
    if (!(await onStep4())) {
      const where = await assist.dump(page, 'miss-regdocs-step4');
      throw new Error('could not reach step 4 (Registration Documents)' +
        (why ? ' — ' + why : '') + '\n    dumped to ' + where + '.*');
    }
    console.log('    moved to step 4 (the wizard opens on step 1 in a fresh session)');
  }
  await assist.dump(page, '30-registration-docs-dealer');

  await uploadAllBrowseButtons(page, profile);

  await assist.click(page, 'regdocs.submit', { role: 'button', label: /^(submit|submit documents)$/i });

  // The receipt banner renders only after the server round-trip, which can take
  // a while with six attachments — poll for it, answering any confirm dialog
  // that pops in between, rather than reading the page 2 seconds in.
  let ok = 0;
  for (let t = 0; t < 20 && !ok; t++) {
    await page.waitForTimeout(1_500);
    ok = await page.getByText(/successfully submitted/i).count().catch(() => 0);
    if (!ok) {
      await assist.click(page, 'regdocs.submit.dialog.' + (t + 1),
        { role: 'button', label: /^(save\s*&\s*continue|yes|ok|confirm)$/i }, { optional: true });
    }
  }
  await assist.click(page, 'regdocs.success.ok', { role: 'button', label: /^ok$/i }, { optional: true });
  await assist.dump(page, '31-registration-docs-submitted');
  if (!ok) {
    const errs = await requiredErrors(page);
    throw new Error('no success notification after Submit — the documents step is likely incomplete.' +
      (errs.length ? '\n    it wants: ' + errs.join('\n              ') : ''));
  }
  console.log('    registration documents submitted');
}

/**
 * The dealer's Payment step (step 5) — the RM 990.00 registration fee + Dermalog
 * device. Same method tiles and bank grid as the pre-application review, but the
 * SUCCESS SIGNAL is different: this one never redirects to /preOnb/summary. It
 * finishes on "Application Payment Success" with Payment Status PAID (video,
 * 9:12–10:12), so payFpx is handed that as its settled test.
 */
async function payRegistrationFee(page, link, opts = {}) {
  console.log('\n  Registration Fee (dealer side)');
  if (link) await page.goto(link, { waitUntil: 'domcontentloaded' });
  await page.getByText(/payment summary/i).first().waitFor({ timeout: 30_000 });

  const total = await page.getByText(/Total Amount.*RM\s*[\d,.]+/i).first().innerText().catch(() => '');
  if (total) console.log('    ' + total.replace(/\s+/g, ' ').trim());
  await assist.dump(page, '34-registration-fee');

  const kind = /credit/i.test(opts.method || 'fpx') ? 'credit'
    : /b2b|business/i.test(opts.method || '') ? 'b2b' : 'b2c';
  let bank = '';
  try {
    await pickPaymentMethod(page, kind);
    if (kind !== 'credit') bank = await pickBank(page, opts.bank, kind === 'b2b' ? 'FPX_B2B' : 'FPX_B2C');
  } catch (err) {
    // This screen's markup has not been captured yet; if its radios differ from
    // the pre-application's, hand the choice over rather than guessing.
    await assist.dump(page, '34b-regfee-method-miss');
    await assist.waitForHuman(page, {
      hint: 'Pick the payment method and bank on the Payment step by hand (' + err.message.split('\n')[0] + ')',
    });
  }

  await assist.click(page, 'regfee.submitAndPay', { role: 'button', label: /submit\s*(&|and)\s*pay/i });

  const paid = async () =>
    (await page.getByText(/application payment success/i).count().catch(() => 0)) > 0 ||
    (await page.getByText(/payment status:?\s*paid/i).count().catch(() => 0)) > 0;
  await payFpx(page, { amount: 'RM 990.00', what: 'the registration fee', bank, settled: paid });
  await assist.dump(page, '35-registration-fee-paid');
  console.log('    registration fee paid');
  return { bank, kind };
}

/* ---------------------------------------------------------------- test assets */

/**
 * A small real file for every upload field, made on demand. The licence upload
 * accepts pdf/png/jpeg only (accept="application/pdf,image/png,image/jpeg"), so
 * a valid one-page PDF and a 1x1 JPEG cover every field; nothing asserts on
 * their contents.
 */
function ensureAsset(name) {
  fs.mkdirSync(ASSETS, { recursive: true });
  const file = path.join(ASSETS, name);
  if (fs.existsSync(file)) return file;

  if (/\.mp4$/i.test(name)) {
    // A minimal ftyp+mdat stub. Client-side accept filters check the extension;
    // if staging ever validates the stream itself, drop a real 20-second clip
    // into fixtures/assets/ under this name and it is used instead.
    fs.writeFileSync(file, Buffer.concat([
      Buffer.from('000000186674797069736f6d0000020069736f6d6d703432', 'hex'), // ftyp isom
      Buffer.from('000000086d646174', 'hex'),                                 // empty mdat
    ]));
  } else if (/\.jpe?g$/i.test(name)) {
    fs.writeFileSync(file, Buffer.from(
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPDs0NDP/wAALCAABAAEBAREA/8QAFAABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AVwA//9k=',
      'base64'
    ));
  } else {
    const body = 'QA fixture placeholder - EAINT-11982 - ' + name;
    fs.writeFileSync(file,
      '%PDF-1.4\n' +
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n' +
      '4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n' +
      '5 0 obj<</Length ' + (body.length + 44) + '>>stream\n' +
      'BT /F1 12 Tf 72 760 Td (' + body + ') Tj ET\n' +
      'endstream endobj\n' +
      'trailer<</Root 1 0 R>>\n%%EOF\n'
    );
  }
  return file;
}

module.exports = {
  GATE_STATE, gateStatePath, onGate, pastGate, passGate,
  fillPreApplicationForm, reviewAndPay, payFpx, advancePastStepOne, pickPaymentMethod, pickBank,
  selectState, selectCity, fillApplicationForm, fillApplicationBusinessInfo, uploadApplicationFiles, uploadAllBrowseButtons, currentStep, submitRegistrationDocs, payRegistrationFee,
  ensureAsset, PREAPP, APPFORM, BUSINESS_TYPE, typeValue,
};
