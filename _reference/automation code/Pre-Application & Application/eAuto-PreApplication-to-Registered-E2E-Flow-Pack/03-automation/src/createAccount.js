/**
 * Drive Create Account — the step that moves a record to `Registered`.
 *
 * WHY THIS EXISTS. `handback.js` says this cannot be automated and hands the keyboard
 * to a person, which is why TS01.8, TS37, TS40 and E2E_TS10 have never run. Its reason
 * — *"the Hardcopy & Acc Created dropdown offers Pending UCD / Incomplete Docs /
 * Pending Assignee and nothing else"* — is true and is about the wrong control.
 * Registered is not reached through the dropdown; it is reached through a BUTTON that
 * the dropdown's `Pending Assignee` value reveals. Measured 30-08-2026 by
 * scripts/probe-create-account-states.js, which swept every Hardcopy value and carried
 * its own positive control.
 *
 * THE FLOW IS SPLIT ACROSS TWO ACCOUNTS, and neither can see the other's half:
 *   - only the ASSIGNEE (hubadmin_bochar) can MOVE Hardcopy to `Pending Assignee`
 *   - only the APPROVER (ops_jasons) can SEE the Create Account button
 * A check that looked for the button in the assignee's session reported false on three
 * good records before this was understood. See scripts/set-hardcopy.js.
 *
 * IT IS IRREVERSIBLE. R9 hides the Extend control permanently once a record is
 * Registered, so every function here refuses a record that is not ours to spend, and
 * `submit()` is never called by setup code — only by the take that films it.
 *
 * IT IS A CONFIRMATION, NOT A FORM — measured 30-08-2026, correcting this whole module's
 * original premise. The dialog reads "Are you sure you want to proceed for company
 * account creation?" over No / Yes and holds ZERO inputs. So describe() legitimately
 * returns an empty list and fill() legitimately fills nothing; the commit is one click
 * on Yes. Everything below still runs, because a dialog that grows fields later should
 * be discovered rather than assumed — but do not expect any today.
 *
 * THE FORM IS DISCOVERED, NOT ASSUMED. Nobody has ever driven this dialog, so rather
 * than hard-code field names that would silently stop matching, `describe()` reads
 * what is actually required and `fill()` reports every field it touched. A field it
 * cannot fill is named and the run stops — it never submits a half-filled form and
 * calls the result a build finding.
 */
const BUTTON = /create account/i;

/** The Create Account button, as the APPROVER sees it. Null-safe: returns a locator. */
const button = (page) => page.locator('button, a').filter({ hasText: BUTTON }).first();

/** Is it on the page and clickable? Waits, because the header paints late. */
async function available(page, timeout = 15_000) {
  try {
    await button(page).waitFor({ state: 'visible', timeout });
    return !(await button(page).evaluate((el) =>
      el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true').catch(() => false));
  } catch {
    return false;
  }
}

/**
 * Click it and wait for whatever it opens. Returns the container to work in — a modal
 * if one appears, otherwise the page itself, because a button that acts immediately is
 * a legitimate shape and must not be reported as a missing form.
 */
async function open(page, { timeout = 20_000 } = {}) {
  if (!(await available(page))) {
    throw new Error('Create Account is not available on this page. It needs Hardcopy & Acc Created = ' +
      '"Pending Assignee" AND an approver session — the assignee cannot see the button.');
  }
  const before = page.url();
  await button(page).click();
  const dialog = page.locator('.modal:visible, [role="dialog"]:visible').first();
  try {
    await dialog.waitFor({ state: 'visible', timeout: 6_000 });
    return { kind: 'modal', root: dialog };
  } catch { /* no modal — maybe a page, maybe it just acted */ }
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  return { kind: page.url() === before ? 'inline' : 'page', root: page.locator('body') };
}

/**
 * A caller that passed open()'s RESULT instead of its `root`.
 *
 * open() returns { kind, root } and both describe() and fill() want the root Locator.
 * Without this the mistake surfaces as "root.locator is not a function", which names
 * neither the function that was called wrongly nor the value that should have been
 * passed — and on 30-08-2026 it cost a mid-take fallback to a human on TS37.
 */
function looksLikeOpenResult(x) {
  return !!x && typeof x === 'object' && typeof x.locator !== 'function'
    && 'root' in x && 'kind' in x;
}

function assertRoot(root, fn) {
  if (looksLikeOpenResult(root)) {
    throw new TypeError(`createAccount.${fn}() was given open()'s RESULT ({ kind: ${JSON.stringify(root.kind)}, `
      + 'root }) instead of its root. Pass (await open(page)).root — the wrapper carries the kind so the '
      + 'caller can tell a modal from a navigation, and the root is the Locator to work inside.');
  }
  if (!root || typeof root.locator !== 'function') {
    throw new TypeError(`createAccount.${fn}() needs a Locator or Page to work inside, got ${typeof root}.`);
  }
}

/** Every visible form control under `root`, with whether it is required and what it holds. */
async function describe(root) {
  assertRoot(root, 'describe');
  return root.locator('input, select, textarea').evaluateAll((els) => els
    .filter((e) => (e.offsetParent || e.getClientRects().length) && e.type !== 'hidden')
    .map((e) => ({
      tag: e.tagName.toLowerCase(),
      type: e.type || '',
      name: e.name || e.id || '',
      id: e.id || '',
      required: e.required || e.getAttribute('aria-required') === 'true' ||
                /\*/.test((e.closest('.form-group, .mb-3, label, td, div') || {}).textContent || ''),
      value: (e.value || '').slice(0, 40),
      options: e.tagName.toLowerCase() === 'select'
        ? [...e.options].map((o) => ({ v: o.value, t: (o.textContent || '').trim() })).slice(0, 12)
        : undefined,
      label: ((e.closest('.form-group, .mb-3, td, div') || {}).textContent || '').trim().slice(0, 60),
    })));
}

/**
 * Fill every required control that is still empty. Returns what it touched, so the
 * sidecar records the values rather than the take asserting over an unknown form.
 * Anything it cannot fill is thrown, never skipped.
 */
async function fill(root, { defaults = {} } = {}) {
  assertRoot(root, 'fill');
  const fields = await describe(root);
  const filled = [];
  for (const f of fields) {
    if (!f.required || (f.value && f.value.trim())) continue;
    const loc = root.locator(f.tag + (f.id ? `#${f.id}` : f.name ? `[name="${f.name}"]` : '')).first();
    const want = defaults[f.name] ?? defaults[f.id];
    try {
      if (f.tag === 'select') {
        const opts = (f.options || []).filter((o) => o.v && !/^\s*(select|choose|please)/i.test(o.t));
        if (!opts.length) throw new Error('no selectable option');
        await loc.selectOption(want ?? opts[0].v);
        filled.push({ field: f.name || f.id, set: want ?? opts[0].t });
      } else if (f.type === 'checkbox' || f.type === 'radio') {
        await loc.check();
        filled.push({ field: f.name || f.id, set: 'checked' });
      } else {
        const v = want ?? defaultFor(f);
        await loc.fill(v);
        filled.push({ field: f.name || f.id, set: v });
      }
    } catch (e) {
      throw new Error(`could not fill the required field ${JSON.stringify(f.name || f.id || f.label)} ` +
        `(${f.tag}/${f.type}): ${e.message}. Refusing to submit a partly filled form — a rejected ` +
        'submit would look exactly like the build refusing the operation.');
    }
  }
  return { fields, filled };
}

/** A plausible value from the field's own label, so the record reads sensibly afterwards. */
function defaultFor(f) {
  const l = (f.label || f.name || '').toLowerCase();
  if (f.type === 'email' || /e-?mail/.test(l)) return `qa.eaint11982+acct@modefair.com`;
  if (f.type === 'date') return '2026-08-30';
  if (/mobile|phone|tel/.test(l)) return '0123456789';
  if (/postcode|zip/.test(l)) return '93350';
  if (/name/.test(l)) return 'QA Account 11982';
  return 'QA11982';
}

/** The dialog's own submit. Never the page's Save — that is a different control. */
/**
 * The control that COMMITS, as a locator — exported so it can be found without being
 * clicked. An irreversible step cannot be tested by running it, so the only free test
 * is "is the button there and is it the right one".
 *
 * "yes" is on this list because the dialog is a CONFIRMATION, not a form: measured
 * 30-08-2026, it reads "Are you sure you want to proceed for company account creation?"
 * over No / Yes and holds no inputs at all. The anchors matter — ^\s*(...)\s*$ means
 * "Yes" can never match "No", and No is the one button here that must never be pressed.
 */
function submitButton(root) {
  return root.locator('button, input[type="submit"], a.btn')
    .filter({ hasText: /^\s*(yes|create account|create|submit|confirm|ok)\s*$/i }).first();
}

async function submit(root, page) {
  assertRoot(root, 'submit');
  const btn = submitButton(root);
  if (!(await btn.count())) {
    throw new Error('no control inside the Create Account dialog that commits it — refusing to guess which ' +
      'button performs an irreversible change. Expected one reading Yes (it is a confirmation dialog, not ' +
      'a form).');
  }
  const label = (await btn.innerText().catch(() => '')).trim();
  if (/^\s*no\s*$/i.test(label)) {
    throw new Error('the control matched as "commit" reads "No" — that is the CANCEL button. Refusing.');
  }
  await btn.click();
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  return { clicked: label };
}

/**
 * Did it land? Read from the SERVER, never from the page that performed it — the whole
 * claim is that the workflow ran, and a DOM that was just mutated cannot say so.
 * `readRow` is injected so callers use whichever listing reader they already hold.
 */
async function verifyRegistered(readRow, { timeoutMs = 60_000, everyMs = 4_000 } = {}) {
  const until = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < until) {
    const row = await readRow().catch(() => null);
    last = row ? String(row.stage5Status || row.hardcopyAccCreated || '') : last;
    if (last && /registered/i.test(last)) return { ok: true, hardcopy: last };
    await new Promise((r) => setTimeout(r, everyMs));
  }
  return { ok: false, hardcopy: last, reason: `Hardcopy never became Registered within ${timeoutMs}ms (last read ${JSON.stringify(last)})` };
}

module.exports = { BUTTON, button, available, open, describe, fill, submit, verifyRegistered, defaultFor, assertRoot, submitButton };
