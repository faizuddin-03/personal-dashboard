/**
 * The eAuto support tool — Reset Application Expiry.
 *
 *   http://172.30.202.23:8888/eauto-support/obs/reset-expiry
 *
 * WHAT THIS UNBLOCKS
 *
 * Type an application transaction number and the expiry date you want, submit,
 * and the record's expiry becomes that date. That single ability is the answer to
 * Q12, and Q12 is why the boundary suite is mostly unrun: TS08.4/.5, TS09, TS22
 * were all filed BLOCKED with the note "they need expiry dates patched to
 * specific instants, which nothing on the QA side can do". Something on the QA
 * side can.
 *
 * It also converts three findings from "wait for the calendar" into "run it now":
 *
 *   C8   the button appears ~88 days early instead of 30  -> patch a fixture to
 *        `opens-tomorrow` and assert the button is ABSENT.
 *   Q39  is the closing boundary a date or a timestamp    -> patch to
 *        `closing-day` and probe either side of the time of day, instead of
 *        waiting for NA62000987 to reach 28-08 at 09:19.
 *   TS05 an expired-but-still-eligible fixture            -> made on demand.
 *
 * WHAT THE FIRST CONNECTED RUN FOUND (26-08-2026, VPN up)
 *
 * The reset-expiry form is behind a SIGN-IN, and the sign-in is not eAuto's.
 * Asked cold, /obs/reset-expiry answers **302 -> /eauto-support/login**: a Spring
 * Security form (`_csrf`, `username`, `password`, `remember-me`) belonging to a
 * separate application that calls itself "eAuto Support Portal — Internal
 * Developer Support Platform" and footers "Internal use only. Contact IT Support
 * for access". A BackOffice session buys nothing here. See `credentials()`.
 *
 * Past the gate it is a THREE-STEP htmx WIZARD, not a form — see WIZARD below
 * for its steps, its selectors, and the four things the tool says about itself
 * that each change a test. The two that matter most: it **preserves the time of
 * day**, which is what makes Q39 testable at all, and it **never touches the
 * status**.
 *
 * THAT SECOND ONE IS NOT THE LIMIT IT LOOKED LIKE (26-08-2026 night, Charmain).
 * It was read here as "so an Expired-status record cannot be manufactured", and
 * that conclusion was drawn from measuring this tool ALONE. The tool owns the
 * DATE; the MIDNIGHT CRON owns the STATUS (R12); and this tool writes the date
 * the cron reads. So:
 *
 *   setExpiry(app, 'expires-today')  ->  wait one midnight  ->  status = Expired
 *
 * and for a record that must be Expired AND beyond the window, patch again
 * afterwards — the date moves and the status does not, *because* the tool never
 * re-statuses. Cron first, tool second; the other order depends on a scan
 * predicate nobody has measured. What genuinely remains outside this file is the
 * TIME OF DAY: there is no time field, so a case needing a specific instant
 * needs a fixture that already carries it.
 *
 * THREE THINGS THIS FILE IS CAREFUL ABOUT
 *
 * 1. IT IS OFF-VPN BY DEFAULT. The host is a private address; from a home or
 *    hotspot connection it does not exist. Every function that touches the
 *    network goes through the TCP preflight in src/vpn.js first, because
 *    Playwright's own diagnosis of an unroutable host ("Timeout 30000ms
 *    exceeded") reads as a slow server, and on a network with a captive DNS it
 *    reads as a MISSING FORM — a bug report against a page we never reached.
 *
 * 2. A LOGIN PAGE IS NOT A BROKEN FORM. The 26-08 probe reported "trx: not found
 *    on the page at all" about somebody else's sign-in screen, which is the same
 *    class of mistake as (1) — describing a page you never reached. open() now
 *    recognises the gate two ways (the /login URL, and a password field found by
 *    id/name/autocomplete as well as type, because Alpine binds this one's `type`
 *    attribute only after parse) and signs through it when a credential exists.
 *
 * 3. THE OPERATION USES REAL SELECTORS; THE SCORER IS NOW ONLY A DRIFT DETECTOR.
 *    Before the tool had been seen, setExpiry found its fields by scoring every
 *    control on the page. That got the first run through the door and it also
 *    picked the sidebar's "eSTM" nav button as the submit — which is exactly why
 *    a heuristic must not survive contact with a known page. The wizard is now
 *    driven by WIZARD's selectors, and controls()/pickFields()/concerns() are kept
 *    for `npm run probe:support`, whose job is to notice when the page changes
 *    shape and say so.
 */
// FIRST, and not for tidiness: importing accounts.js is what hydrates
// process.env from the shared store and automation/.env. Every SUPPORT_* setting
// below is read at module load, so without this line a SUPPORT_BASE, a pinned
// SUPPORT_DATE_SELECTOR or the portal credential sitting in a FILE is silently
// ignored and only a shell export works. Caught 26-08-2026: the probe reported
// "no SUPPORT_USER in the shared credential store" about a credential that was
// in the store — credentials() happened to require accounts lazily, so a direct
// call worked and the probe did not. src/env.js opens with the same line.
require('./accounts');

const vpn = require('./vpn');

const RAW_BASE = (process.env.SUPPORT_BASE || 'http://172.30.202.23:8888').replace(/\/+$/, '');
const PATH = process.env.SUPPORT_RESET_EXPIRY_PATH || '/eauto-support/obs/reset-expiry';

/** Where the tool is, split the way each consumer needs it. */
function target() {
  const url = RAW_BASE + (PATH.startsWith('/') ? PATH : '/' + PATH);
  const u = new URL(url);
  return { url, host: u.hostname, port: Number(u.port || (u.protocol === 'https:' ? 443 : 80)) };
}

/** Throw unless the tool's host answers on its port. Returns { ok, ms }. */
async function requireVpn(timeoutMs) {
  const { host, port } = target();
  return vpn.requireReachable(host, port, timeoutMs);
}

/** Same probe, but as a question — for `test.skip()` rather than a failure. */
async function reachable(timeoutMs = 3000) {
  const { host, port } = target();
  return (await vpn.probe(host, port, timeoutMs)).ok;
}

// ---------------------------------------------------------------------------
// Describing the page
// ---------------------------------------------------------------------------

/**
 * Every form control on a frame, with everything that could identify it.
 *
 * `label` is assembled from four places because old eAuto screens use all four:
 * a real <label for>, a wrapping <label>, the neighbouring table cell, and
 * sometimes only the row's text. Row text is kept SEPARATE so a scorer can
 * prefer a precise match over a whole-row smear — a row contains the other
 * field's label too, which is exactly how a scorer picks the wrong input.
 */
async function controls(frame) {
  return frame.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && (r.width > 0 || r.height > 0);
    };
    const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    const nodes = Array.from(document.querySelectorAll('input, select, textarea, button'));

    return nodes.map((el, index) => {
      const tag = el.tagName.toLowerCase();
      const id = el.id || '';
      let label = '';
      if (id) {
        const l = document.querySelector('label[for="' + id.replace(/"/g, '\\"') + '"]');
        if (l) label = l.textContent;
      }
      if (!label) {
        const wrap = el.closest('label');
        if (wrap) label = wrap.textContent;
      }
      if (!label) {
        const cell = el.closest('td, th, div');
        const prev = cell && cell.previousElementSibling;
        if (prev) label = prev.textContent;
      }
      const row = el.closest('tr, .form-group, .row, fieldset');
      const type = (el.getAttribute('type') || (tag === 'select' ? 'select' : '')).toLowerCase();
      return {
        index,
        tag,
        type,
        id,
        name: el.getAttribute('name') || '',
        placeholder: el.getAttribute('placeholder') || '',
        pattern: el.getAttribute('pattern') || '',
        title: el.getAttribute('title') || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        autocomplete: el.getAttribute('autocomplete') || '',
        value: /password/i.test(type) ? '(hidden)' : clean(el.value),
        maxLength: el.getAttribute('maxlength') || '',
        readOnly: !!el.readOnly,
        disabled: !!el.disabled,
        visible: vis(el),
        text: clean(tag === 'button' ? el.textContent : el.getAttribute('value')),
        label: clean(label),
        rowText: clean(row ? row.textContent : ''),
        options: tag === 'select' ? Array.from(el.options).slice(0, 40).map((o) => clean(o.textContent)) : undefined,
      };
    });
  });
}

/** Everything a control might be called, most-specific first. */
const idText = (c) => [c.label, c.ariaLabel, c.placeholder, c.title, c.name, c.id, c.text].filter(Boolean).join(' | ');

/**
 * What each field is likely to be called, with a weight.
 *
 * "Application trx no" is the operator's own wording; the same thing is
 * "Application No" on the listing (src/listing.js COLUMNS) and "Transaction No"
 * elsewhere in eAuto, so all three spellings score.
 */
const WANT = {
  trx: [
    [/\b(appl?(ication)?|trx|transaction)\s*(trx\s*)?(no|num(ber)?|id)\b/i, 10],
    [/\bappl?(ication)?\s*no\b/i, 8],
    [/\bapp(no|_no|number)\b/i, 7],
    [/\b(trx|transaction)\b/i, 6],
  ],
  date: [
    [/\b(new\s+)?expir(y|e|ed|ation)\s*(date)?\b/i, 10],
    [/\bexpiry\b/i, 8],
    [/\b(reset|new)\s*date\b/i, 6],
    [/\bdate\b/i, 3],
  ],
  time: [
    [/\b(expir\w*\s*)?time\b/i, 6],
    [/\b(hh:?mm|hour)\b/i, 4],
  ],
  submit: [
    [/^\s*(reset|submit|update|save|confirm|extend|set)\b/i, 10],
    [/\b(reset|submit|update|save|confirm)\b/i, 6],
    [/\bgo\b/i, 2],
  ],
};

function score(c, rules) {
  const precise = idText(c);
  let best = 0;
  for (const [re, weight] of rules) {
    if (re.test(precise)) best = Math.max(best, weight);
    else if (re.test(c.rowText || '')) best = Math.max(best, weight - 5);
  }
  return best;
}

/** Which control is the trx field / the date field / the submit button. */
function pickFields(list) {
  const usable = list.filter((c) => c.visible && !c.disabled);
  const NOT_A_FIELD = ['submit', 'button', 'reset', 'hidden', 'checkbox', 'radio'];
  const inputs = usable.filter((c) => c.tag !== 'button' && !NOT_A_FIELD.includes(c.type));
  const buttons = usable.filter((c) => c.tag === 'button' || ['submit', 'button'].includes(c.type));

  const bestOf = (pool, kind) => {
    const ranked = pool
      .map((c) => ({ c, s: score(c, WANT[kind]) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.c.index - b.c.index);
    if (!ranked.length) return null;
    return { ...ranked[0].c, score: ranked[0].s, how: 'scored', runnerUp: ranked[1] ? ranked[1].c.index : null };
  };

  // A native date input is unambiguous — take it over any text field that merely
  // has "date" somewhere in its label.
  const nativeDate = inputs.find((c) => c.type === 'date' || c.type === 'datetime-local');

  let trx = bestOf(inputs, 'trx');
  let date = nativeDate ? { ...nativeDate, score: 99, how: 'native ' + nativeDate.type } : bestOf(inputs, 'date');

  // The two fields must not be the same control. This happens for real: a
  // table-layout form whose only label text lives in a row that carries BOTH
  // labels scores every input in that row identically for both fields.
  //
  // Resolve by score when the scores differ. When they TIE, resolve by position
  // and nothing else — every eAuto support screen puts the record identifier
  // first and the value it changes second, and a coin-flip that silently reverses
  // them would type a date into the trx field and an application number into the
  // date field. Both picks are then flagged `positional` so the CLI can refuse to
  // submit without an explicit --force.
  if (trx && date && trx.index === date.index) {
    const other = inputs.find((c) => c.index !== trx.index) || null;
    const pos = (c, why) => (c ? { ...c, score: 0, positional: true, how: 'by position (' + why + ')' } : null);
    if ((date.score || 0) > (trx.score || 0)) {
      trx = pos(other, 'the date field scored higher on the same control');
    } else if ((trx.score || 0) > (date.score || 0)) {
      date = pos(other, 'the trx field scored higher on the same control');
    } else {
      const pair = [trx, other].filter(Boolean).sort((a, b) => a.index - b.index);
      trx = pos(pair[0], 'both fields scored equally — identifier comes first');
      date = pos(pair[1], 'both fields scored equally — value comes second');
    }
  }

  const timePick = inputs.find((c) => c.type === 'time') || bestOf(inputs, 'time');
  const time = timePick && (!date || timePick.index !== date.index) && (!trx || timePick.index !== trx.index) ? timePick : null;
  const submit = bestOf(buttons, 'submit') || (buttons.length === 1 ? { ...buttons[0], score: 1, how: 'the only button on the page' } : null);

  return { trx, date, time, submit, inputs, buttons };
}

/**
 * Everything doubtful about a set of picks, as sentences an operator can read.
 *
 * This exists so the doubt is CHECKABLE rather than buried in a log line.
 * setExpiry refuses to submit while this list is non-empty unless the caller
 * passes `force`, because the failure it prevents is silent and expensive:
 * typing a date into the wrong field patches the wrong record's expiry, or none,
 * and the run still reports "submitted".
 */
function concerns(fields) {
  const out = [];
  for (const kind of ['trx', 'date', 'submit']) {
    const f = fields[kind];
    if (!f) { out.push(kind + ': not found on the page at all'); continue; }
    if (PINNED[kind]) continue; // an operator pinned it; that is the answer
    const seen = f.label || f.text || f.rowText || f.name || f.id || '(nothing to go on)';
    if (f.positional) out.push(kind + ': chosen BY POSITION, not by any label — ' + f.how);
    else if ((f.score || 0) < 6) out.push(kind + ': weak match (score ' + f.score + ') against "' + seen + '"');
  }
  return out;
}

/** Pinned selectors win over every heuristic. Set these once the dump exists. */
const PINNED = {
  trx: process.env.SUPPORT_TRX_SELECTOR || '',
  date: process.env.SUPPORT_DATE_SELECTOR || '',
  time: process.env.SUPPORT_TIME_SELECTOR || '',
  submit: process.env.SUPPORT_SUBMIT_SELECTOR || '',
};

// ---------------------------------------------------------------------------
// Getting there
// ---------------------------------------------------------------------------

/** Chromium's own network error page is a real document — do not read it as the tool. */
const BROWSER_ERROR = /ERR_(CONNECTION|NAME_NOT_RESOLVED|ADDRESS_UNREACHABLE|TIMED_OUT|EMPTY_RESPONSE)/i;

/**
 * Open the reset-expiry page. Preflights the VPN, then waits for a DOCUMENT
 * rather than a lifecycle event — the same trap src/obs.js documents, since a
 * support app on this stack can hang on an asset that never answers.
 */
async function open(page, opts = {}) {
  await requireVpn(opts.probeTimeout);
  const { url } = target();
  const timeout = opts.timeout || 45000;

  await page.goto(url, { waitUntil: 'commit', timeout }).catch(() => {});

  // WAIT FOR A BODY, NOT FOR BYTES.
  //
  // Measured against the real tool on 26-08-2026, and it cost the first
  // connected run: this portal's <head> carries a BLOCKING
  // <script src="https://cdn.tailwindcss.com">, so for the first few hundred
  // milliseconds `document.documentElement.outerHTML` is a complete-looking
  // 563-byte document that ends at `</head></html>` — no <body> at all. A
  // byte-count floor accepts that happily, and the probe then reported "trx: not
  // found on the page at all" about a page whose form had simply not been parsed
  // yet. One second later the body is 3,995 bytes with seven controls on it.
  //
  // So the floor is on the BODY, and controls are given until the deadline to
  // appear — the page is Alpine-driven, and Alpine binds attributes (including
  // the password field's `type`) after the document parses.
  const deadline = Date.now() + timeout;
  let html = '';
  let shape = { body: -1, controls: 0 };
  while (Date.now() < deadline) {
    shape = await page.evaluate(() => ({
      body: document.body ? document.body.innerHTML.length : -1,
      controls: document.querySelectorAll('input, select, textarea, button').length,
    })).catch(() => shape);
    if (shape.body > 400 && shape.controls > 0) break;
    await page.waitForTimeout(200);
  }
  html = await page.content().catch(() => '');

  if (BROWSER_ERROR.test(html)) {
    throw new Error(url + ' rendered a browser network-error page even though the TCP port answered — ' +
      'the host is up but is not serving this path. Check SUPPORT_RESET_EXPIRY_PATH.');
  }
  if (shape.body < 400) {
    throw new Error(url + ' produced no usable body (' + shape.body + ' bytes of body, ' +
      html.length + ' of document) within ' + timeout + 'ms. The head loads a blocking CDN script, so a ' +
      'firewalled cdn.tailwindcss.com would stall the page here.');
  }
  // A wrong path is served as a FULL-SIZE 404 page by this stack — chrome, footer
  // and all — so it sails past the byte floor above and then reports itself as a
  // form with no fields on it. Caught by the mock run on 26-08-2026, where Git
  // Bash rewrote SUPPORT_RESET_EXPIRY_PATH into a Windows path and the probe
  // dutifully answered "trx: not found on the page at all" about a 404. Say which
  // it is; src/obs.js draws the same distinction for the same reason.
  if (/404\s*[-–—]?\s*NOT\s+FOUND/i.test(html)) {
    throw new Error(url + ' answers "404 - NOT FOUND" — the host is up but is not serving that path. ' +
      'Check SUPPORT_RESET_EXPIRY_PATH (note: exporting a leading-slash path from Git Bash gets ' +
      'rewritten to a Windows path — set it in .env, or prefix the command with MSYS_NO_PATHCONV=1).');
  }

  // The form may be framed; take whichever frame actually holds controls.
  let frame = page.mainFrame();
  let list = await controls(frame);
  if (!list.some((c) => c.visible && c.tag !== 'button')) {
    for (const f of page.frames()) {
      if (f === page.mainFrame()) continue;
      const l = await controls(f).catch(() => []);
      if (l.some((c) => c.visible && c.tag !== 'button')) { frame = f; list = l; break; }
    }
  }

  // Two independent signals, because neither is reliable alone on this portal.
  // The URL: /obs/reset-expiry answers 302 -> /eauto-support/login when the
  // session is cold (measured 26-08-2026). The field: Alpine drives the password
  // input as `:type="showPass ? 'text' : 'password'"` with NO static type
  // attribute, so a page read before Alpine binds sees a plain text input — hence
  // the id/name/autocomplete fallbacks.
  const onLoginUrl = new RegExp(LOGIN_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '|/login\\b').test(page.url());
  const hasPasswordField = list.some((c) => c.visible &&
    (c.type === 'password' || /^password$/i.test(c.name) || /^password$/i.test(c.id) || /current-password/i.test(c.autocomplete || '')));
  const needsLogin = onLoginUrl || hasPasswordField;

  // Land on the login form and we sign in and come back, rather than reporting
  // "a form with no expiry field on it" about somebody else's login page. Pass
  // signIn:false to observe the gate instead of passing through it.
  if (needsLogin && opts.signIn !== false && haveCredentials() && !opts.reentered) {
    await signIn(page, opts);
    await saveAuth(page).catch(() => {});
    return open(page, { ...opts, reentered: true });
  }

  return {
    url: page.url(), bytes: html.length, bodyBytes: shape.body, frame, controls: list,
    needsLogin, onLoginUrl, signedIn: !!opts.reentered, fields: pickFields(list),
  };
}

// ---------------------------------------------------------------------------
// The portal's own sign-in
// ---------------------------------------------------------------------------

/**
 * The support tool is NOT part of eAuto's session. It is its own application —
 * "eAuto Support Portal / Internal Developer Support Platform" — behind a Spring
 * Security form login at /eauto-support/login (`_csrf`, `username`, `password`,
 * `remember-me`). A BackOffice session buys nothing here; asked cold,
 * /obs/reset-expiry answers 302 to that form.
 *
 * CREDENTIALS LIVE IN ONE PLACE, and it is not this folder:
 *
 *   C:\Users\<you>\.claude\secrets\eauto.env
 *     SUPPORT_USER=<the portal login>
 *     SUPPORT_PASS=<its password>
 *
 * src/accounts.js hydrates those into the environment on import, Playwright types
 * them, and nothing here logs, echoes or returns the password — same discipline
 * as src/login.js. They are deliberately NOT eAuto account keys: the portal has
 * its own user list ("Internal use only. Contact IT Support for access"), so
 * reusing a BackOffice login would be a guess at another system's credentials.
 *
 * The form offers "Remember me for 7 days" and this ticks it, then saves the
 * cookie jar to .auth/support.json — so the sign-in is roughly weekly rather than
 * per run, the same trick that made the reCAPTCHA gate a once-per-session cost.
 */
const LOGIN_PATH = process.env.SUPPORT_LOGIN_PATH || '/eauto-support/login';
const AUTH_FILE = require('node:path').join(__dirname, '..', '.auth', 'support.json');

/**
 * The portal login, from either of two places — and there are two on purpose.
 *
 * `SUPPORT_ACCOUNT=<key>` reuses an account ALREADY in the shared store (e.g.
 * `ops_jasons`), which is right when the portal accepts an existing eAuto login.
 * `SUPPORT_USER`/`SUPPORT_PASS` is for a login that is genuinely the portal's
 * own. Never both: .env.example's rule is that a second copy of a password is
 * worse than a leak, because when the two drift whichever one the code happens to
 * read is the one that silently decides.
 */
function credentials() {
  const { SHARED_ENV, discoverAccounts } = require('./accounts');
  const key = (process.env.SUPPORT_ACCOUNT || '').trim().toLowerCase();
  const user = (process.env.SUPPORT_USER || '').trim();
  const pass = (process.env.SUPPORT_PASS || '').trim();

  if (key && (user || pass)) {
    throw new Error('SUPPORT_ACCOUNT and SUPPORT_USER/SUPPORT_PASS are both set. Pick one — two copies of a ' +
      'password drift, and then whichever the code reads is the one that decides.');
  }

  if (key) {
    const a = discoverAccounts()[key];
    if (!a) {
      throw new Error('SUPPORT_ACCOUNT="' + key + '" is not in the shared store. Known keys: ' +
        Object.keys(discoverAccounts()).join(', '));
    }
    return { user: a.user, pass: a.pass, from: 'SUPPORT_ACCOUNT=' + key };
  }

  if (!user || !pass) {
    const e = new Error(
      'The support tool sits behind its own sign-in — "eAuto Support Portal / Internal\n' +
      'Developer Support Platform" at ' + LOGIN_PATH + '. Asked cold, the reset-expiry\n' +
      'page answers 302 to that form, and an eAuto BackOffice session does not open it.\n\n' +
      'Point the harness at a credential, in the SHARED STORE (never in automation/.env):\n' +
      '  ' + SHARED_ENV + '\n\n' +
      '  either  SUPPORT_ACCOUNT=<a key already in that file>   # portal takes an eAuto login\n' +
      '  or      SUPPORT_USER=<portal login>\n' +
      '          SUPPORT_PASS=<its password>                    # portal has its own user list\n\n' +
      'Missing: ' + [!user && 'SUPPORT_USER', !pass && 'SUPPORT_PASS'].filter(Boolean).join(' and ') +
      ' (and no SUPPORT_ACCOUNT).');
    e.code = 'SUPPORT_NO_CREDENTIALS';
    throw e;
  }
  return { user, pass, from: 'SUPPORT_USER' };
}

/** Is a portal login configured at all? For skip messages, without throwing. */
const haveCredentials = () => !!((process.env.SUPPORT_ACCOUNT || '').trim() ||
  ((process.env.SUPPORT_USER || '').trim() && (process.env.SUPPORT_PASS || '').trim()));

/**
 * Sign in to the support portal. Asserts we LEFT the form afterwards — the same
 * guard src/login.js documents, because a silent auth failure otherwise reads as
 * "the reset-expiry screen doesn't exist".
 */
async function signIn(page, opts = {}) {
  const { user, pass, from } = credentials();
  const loginUrl = RAW_BASE + LOGIN_PATH;

  // WHERE THIS PASSWORD MAY BE TYPED, AND NOWHERE ELSE.
  //
  // SUPPORT_BASE is an env var, so a typo, a stale export or a copy-pasted
  // command can point this function at an arbitrary host — and it would dutifully
  // type a real credential into whatever form it found there. The shared store
  // applies the same rule to the Fiuu simulator login ("the harness refuses any
  // other host"), and the reason is the same: the blast radius of a wrong host is
  // a leaked password, not a failed test.
  //
  // Allowed: the known support host, or any RFC1918 address (the portal is an
  // internal deployment and may move inside the network), or localhost for the
  // mock. A public hostname is refused outright.
  const { host } = target();
  const isPrivate = /^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === 'localhost' || host.endsWith('.local');
  if (!isPrivate) {
    throw new Error('refusing to type the support-portal credential at "' + host + '" — that is not an ' +
      'internal address. The portal lives on the corporate network; check SUPPORT_BASE.');
  }

  if (!new RegExp('/login\\b').test(page.url())) {
    await page.goto(loginUrl, { waitUntil: 'commit', timeout: opts.timeout || 45000 }).catch(() => {});
  }
  // Alpine binds the password field's type after parse; wait for the form itself.
  await page.waitForSelector('#username, input[name="username"]', { timeout: 20000 });

  await page.locator('#username, input[name="username"]').first().fill(user);
  await page.locator('#password, input[name="password"]').first().fill(pass);

  // "Remember me for 7 days" — a week-long cookie instead of a login per run.
  const remember = page.locator('#remember-me, input[name="remember-me"]').first();
  if (await remember.count()) await remember.check().catch(() => {});

  await page.locator('form[action*="login"] button[type="submit"], button[type="submit"]').first().click();

  // Left the form? A Spring form login re-renders itself on failure, usually with
  // ?error on the URL, so check both.
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  const stillOnForm = await page.locator('#password, input[name="password"]').count().catch(() => 0);
  if (stillOnForm || /[?&]error/.test(page.url())) {
    const said = await page.evaluate(() => document.body.innerText).catch(() => '');
    throw new Error('support portal rejected the sign-in for SUPPORT_USER — the form came back' +
      (/[?&]error/.test(page.url()) ? ' with ?error' : '') + '. Page said: ' +
      String(said).replace(/\s+/g, ' ').trim().slice(0, 200));
  }
  return { user, remembered: true, from };
}

/** Save the portal cookies so later runs and separate processes skip the login. */
async function saveAuth(page) {
  const fs = require('node:fs');
  fs.mkdirSync(require('node:path').dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
  return AUTH_FILE;
}

/** The saved cookie jar, if there is one — pass to browser.newContext(). */
function savedAuth() {
  return require('node:fs').existsSync(AUTH_FILE) ? AUTH_FILE : undefined;
}

/**
 * A context already carrying the portal session where one was saved. Use this to
 * make the tool page; a stale jar costs one sign-in, not a failure, because
 * open() re-authenticates when it lands on the form.
 */
async function context(browser) {
  return browser.newContext({ ignoreHTTPSErrors: true, storageState: savedAuth() });
}

/**
 * The page, its controls, and the three we need — pinned selectors first.
 * Throws a message naming what it DID see, so a wrong guess is diagnosable
 * without opening the browser again.
 */
async function resolve(page, opts = {}) {
  const opened = opts.opened || (await open(page, opts));
  const { frame, controls: list, fields } = opened;

  const byPin = (sel) => frame.locator(sel).first();
  const byIndex = (c) => frame.locator('input, select, textarea, button').nth(c.index);

  const need = (kind, picked) => {
    if (PINNED[kind]) return { locator: byPin(PINNED[kind]), desc: { how: 'pinned ' + PINNED[kind], name: '', id: '' } };
    if (picked) return { locator: byIndex(picked), desc: picked };
    const seen = list.filter((c) => c.visible).map((c) =>
      c.tag + (c.type ? '[' + c.type + ']' : '') + ' ' + (c.name || c.id || '(unnamed)') + ' "' + (c.label || c.text || '') + '"');
    throw new Error(
      'Could not find the ' + kind + ' control on ' + target().url + '.\n' +
      'Visible controls were:\n  ' + (seen.join('\n  ') || '(none)') + '\n' +
      'Run `npm run probe:support` to dump the page, then pin it with SUPPORT_' + kind.toUpperCase() + '_SELECTOR.');
  };

  const timeField = PINNED.time
    ? { locator: byPin(PINNED.time), desc: { how: 'pinned ' + PINNED.time } }
    : (fields.time ? { locator: byIndex(fields.time), desc: fields.time } : null);

  return { ...opened, trx: need('trx', fields.trx), date: need('date', fields.date), submit: need('submit', fields.submit), timeField };
}

// ---------------------------------------------------------------------------
// Typing a date into a field of unknown format
// ---------------------------------------------------------------------------

const pad = (n) => String(n).padStart(2, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FORMATTERS = {
  'yyyy-mm-dd': (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()),
  'dd-mm-yyyy': (d) => pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + d.getFullYear(),
  'dd/mm/yyyy': (d) => pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(),
  'yyyy/mm/dd': (d) => d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()),
  'mm/dd/yyyy': (d) => pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear(),
  'dd mmm yyyy': (d) => pad(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(),
};

/**
 * Which format this field wants — read off the field when it says so, guessed
 * when it does not.
 *
 * The guess order starts at yyyy-mm-dd on EVIDENCE, not preference: the UCD
 * Application Listing renders every date as `2026-11-22 21:10` (src/listing.js
 * parses exactly that), so this stack's own wire format is ISO-ish even though
 * Malaysian screens read dd/mm/yyyy. A field that rejects the first candidate
 * just gets the next one — fill, read back, keep whichever stuck.
 */
function formatPlan(desc, opts = {}) {
  if (opts.format) return [opts.format];
  if (process.env.SUPPORT_DATE_FORMAT) return [process.env.SUPPORT_DATE_FORMAT];
  if (desc.type === 'date') return ['yyyy-mm-dd'];
  if (desc.type === 'datetime-local') return ['datetime-local'];
  const hint = [desc.placeholder, desc.pattern, desc.title, desc.label].join(' ').toLowerCase();
  if (/dd\s*[/-]\s*mm\s*[/-]\s*yyyy/.test(hint)) return ['dd/mm/yyyy', 'dd-mm-yyyy', 'yyyy-mm-dd'];
  if (/yyyy\s*[/-]\s*mm\s*[/-]\s*dd/.test(hint)) return ['yyyy-mm-dd', 'yyyy/mm/dd'];
  if (/mm\s*[/-]\s*dd\s*[/-]\s*yyyy/.test(hint)) return ['mm/dd/yyyy'];
  return ['yyyy-mm-dd', 'dd/mm/yyyy', 'dd-mm-yyyy', 'dd mmm yyyy', 'yyyy/mm/dd'];
}

function render(format, date, time) {
  if (format === 'datetime-local') {
    const parts = String(time || '00:00').split(':');
    return FORMATTERS['yyyy-mm-dd'](date) + 'T' + pad(Number(parts[0]) || 0) + ':' + pad(Number(parts[1]) || 0);
  }
  const base = (FORMATTERS[format] || FORMATTERS['yyyy-mm-dd'])(date);
  return time ? base + ' ' + time : base;
}

/**
 * Put a value in a field and confirm it is there.
 *
 * Datepicker widgets on this stack are often `readonly` and only accept a click
 * on a calendar cell; `fill()` throws on those. The JS fallback sets .value and
 * fires input/change, which the page's own handlers see — but it BYPASSES the
 * widget's validation, so it is REPORTED in the result rather than done quietly.
 * If a patch ever lands on a date nobody asked for, this flag is the first thing
 * to look at.
 */
async function typeInto(locator, value) {
  try {
    await locator.fill(value, { timeout: 5000 });
    const got = await locator.inputValue().catch(() => '');
    if (got) return { ok: true, got, via: 'fill' };
  } catch { /* fall through to the widget-bypassing path */ }

  const got = await locator.evaluate((el, v) => {
    const ro = el.readOnly;
    el.readOnly = false;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.readOnly = ro;
    return el.value;
  }, value).catch(() => '');
  return { ok: !!got, got, via: 'javascript (field is readonly — widget bypassed)' };
}

// ---------------------------------------------------------------------------
// The operation
// ---------------------------------------------------------------------------

const SUCCESS = /(success|updated|reset|saved|changed|expiry\s+(date\s+)?(is|set|now))/i;
const FAILURE = /(not\s+found|no\s+record|invalid|required|error|fail(ed|ure)?|exception|denied|unauthor)/i;

/**
 * THE WIZARD, as it actually is (read off the live tool, 26-08-2026).
 *
 * Not a single form. Three htmx steps that swap `#flow` in place:
 *
 *   STEP 1  #applicationNumber + Search
 *           -> POST /eauto-support/htmx/obs/reset-expiry/validate
 *   STEP 2  the application's real details + input[type=date]#newExpiry,
 *           pre-filled with the CURRENT expiry, plus a live "Resulting expiry"
 *           preview. Submit is "Confirm & Reset Expiry", carrying a hidden
 *           `confirmed=false`  -> POST .../reset-expiry/execute
 *   STEP 3  the same form again with that flag flipped, i.e. "Are you sure?"
 *
 * What the tool says about itself, verbatim — and every line changes a test:
 *
 *   "Sets obs_application.expired_at to a date you choose (any date; a past date
 *    warns, never refuses)"      -> every target in EXPIRY_TARGETS is reachable.
 *   "Does NOT reactivate an EXPIRED/REJECTED application - it only changes the
 *    date" / "the application status is never touched"
 *                                -> it CANNOT manufacture an Expired-STATUS
 *                                   record. It moves the date underneath whatever
 *                                   status the record already has, which is
 *                                   exactly what the gating tests want, and
 *                                   exactly what TS06 cannot get this way.
 *   "time of day preserved from the current expiry"
 *                                -> Q39 IS TESTABLE. A patched fixture keeps its
 *                                   original time of day, so the date-vs-timestamp
 *                                   reading of the closing boundary can be probed
 *                                   either side of it. This was the open unknown.
 *   "Automatic full-row backup created before the change (kept indefinitely)"
 *                                -> a mis-patch is recoverable from the tool's own
 *                                   backup, not only from our afterAll restore.
 *
 * ADMIN ONLY, per the page's own badge.
 */
const WIZARD = {
  flow: '#flow',
  appNo: '#applicationNumber',
  search: '#validate-form button[type="submit"]',
  newExpiry: '#newExpiry',
  execForm: 'form[hx-post*="reset-expiry/execute"]',
  execSubmit: 'form[hx-post*="reset-expiry/execute"] button[type="submit"]',
  confirmedFlag: 'form[hx-post*="reset-expiry/execute"] input[name="confirmed"]',
  // The WARNING GATE, found 27-08-2026 and never crossed before it.
  //
  // Step 3 does not always write. When the tool has something to warn about it
  // answers "Confirmation required before this expiry change can proceed",
  // renders the warnings, and puts up an UNCHECKED acknowledgement box with a
  // "Confirm anyway" button. Clicking submit again without ticking it just
  // re-serves the same page, which is what a run looks like when it reports
  // "[failure]" and the listing still shows the old date.
  //
  // Two warnings are known to trigger it, and both are NORMAL for this suite's
  // fixtures — which is why the gate went unnoticed until a boundary fixture
  // needed it: (1) the record's status is EXPIRED, (2) the resulting expiry is
  // in the past. Q12's round trip was proved on an Approved record patched
  // forward, the one shape that never sees it.
  ackBox: 'form[hx-post*="reset-expiry/execute"] input[type="checkbox"]',
};

/** Wait for htmx to swap #flow, then give Alpine a moment to re-bind. */
async function awaitFlow(page, before, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    await page.waitForTimeout(200);
    const now = await page.locator(WIZARD.flow).innerHTML().catch(() => '');
    if (now && now !== before) { await page.waitForTimeout(500); return now; }
  }
  return null;
}

const flowHtml = (page) => page.locator(WIZARD.flow).innerHTML().catch(() => '');
const flowText = (page) => page.locator(WIZARD.flow).innerText().catch(() => '');

/**
 * STEP 1 -> STEP 2. Look an application up and read what the tool knows about it.
 *
 * Read-only, and independently useful: this is the only surface QA has that shows
 * `obs_application.expired_at` to the MICROSECOND (`2026-12-22T21:10:17.357665`)
 * — the listing renders it to the minute, and Q39 turns on a time of day. It also
 * reports the status without a BackOffice login.
 */
async function lookup(page, applicationNo, opts = {}) {
  await open(page, opts);
  const before = await flowHtml(page);
  await page.locator(WIZARD.appNo).fill(String(applicationNo).trim());
  await page.locator(WIZARD.search).click();

  if (!(await awaitFlow(page, before, opts.timeout || 30000))) {
    throw new Error('the support tool did not answer the lookup for ' + applicationNo + ' within the timeout');
  }

  const text = await flowText(page);
  const details = {};
  for (const line of String(text).split('\n')) {
    const m = /^\s*([^\t]{2,40}?)\s*\t\s*(.+?)\s*$/.exec(line);
    if (m) details[m[1].replace(/\s+/g, ' ').trim()] = m[2].trim();
  }

  const dateField = page.locator(WIZARD.newExpiry);
  if (!(await dateField.count())) {
    throw new Error('step 2 has no expiry field for ' + applicationNo + ' — the tool said: ' +
      String(text).replace(/\s+/g, ' ').trim().slice(0, 300));
  }

  return {
    applicationNo: details['Application No'] || String(applicationNo).trim(),
    companyName: details['Company Name'] || '',
    companyRoc: details['Company ROC'] || '',
    registrationType: details['Registration Type'] || '',
    status: details['Current Status'] || '',
    createdAt: details['Created At'] || '',
    currentExpiry: details['Current Expiry'] || '',
    prefilledDate: await dateField.inputValue().catch(() => ''),
    details,
    stepText: String(text).replace(/\s+/g, ' ').trim(),
  };
}

/**
 * Set one application's expiry date.
 *
 * `date` is a Date — use dates.expiryForState() to get the one a named boundary
 * needs, rather than counting days at the call site (the +3-month end clamps).
 *
 * `dryRun` walks to step 2, fills the date, reads the tool's own "Resulting
 * expiry" preview and STOPS without confirming — which validates the whole path
 * including the exact timestamp the server would write, at no cost to the record.
 *
 * Returns everything observed. It CLASSIFIES the final text but does not throw on
 * a failure classification: "did the date actually change" is answered by reading
 * the listing (verify(), below), never by trusting a support tool's own banner.
 */
async function setExpiry(page, opts) {
  const { applicationNo, date } = opts;
  if (!applicationNo) throw new Error('setExpiry needs an applicationNo (the application trx no)');
  if (!(date instanceof Date) || Number.isNaN(Number(date))) throw new Error('setExpiry needs a Date for `date`');

  const found = await lookup(page, applicationNo, opts);
  const wanted = FORMATTERS['yyyy-mm-dd'](date);

  // input[type=date]: one format, no guessing, no readonly datepicker to fight.
  const typed = await typeInto(page.locator(WIZARD.newExpiry), wanted);
  if (!typed.ok || typed.got !== wanted) {
    throw new Error('step 2 would not take ' + wanted + ' (the field shows "' + typed.got + '") — for an ' +
      'input[type=date] that means the value was malformed or out of an allowed range.');
  }

  // The tool previews the exact timestamp it will write, BEFORE committing,
  // including the preserved time of day. Capture it: it is the only pre-commit
  // statement of intent that either side can point at afterwards.
  const preview = (/Resulting expiry\s*([0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9:.]+)/.exec(await flowText(page)) || [])[1] || null;

  const filled = {
    applicationNo: found.applicationNo,
    date: wanted,
    format: 'yyyy-mm-dd (input[type=date])',
    typedAs: wanted,
    fieldShows: typed.got,
    via: typed.via,
    time: preview ? ((/[ T]([0-9]{2}:[0-9]{2})/.exec(preview) || [])[1] || null) : (opts.time || null),
    resultingExpiryPreview: preview,
    trxField: WIZARD.appNo,
    dateField: WIZARD.newExpiry,
    was: found.currentExpiry,
    status: found.status,
  };

  if (opts.dryRun) {
    return { submitted: false, dryRun: true, found, filled, message: '(dry run — stopped at step 2, nothing confirmed)' };
  }

  // STEP 2 -> STEP 3 -> done. The hidden `confirmed` flag starts false, so the
  // first execute answers with the are-you-sure step and only the second writes.
  // Submit until neither an unconfirmed form nor an are-you-sure remains.
  let text = '';
  const acknowledged = [];
  for (let step = 0; step < 4; step++) {
    const before = await flowHtml(page);
    const submit = page.locator(WIZARD.execSubmit).first();
    if (!(await submit.count())) break;

    // Tick the acknowledgement box FIRST when the warning gate is up, or this
    // click just re-serves the same warning (see WIZARD.ackBox).
    const ack = page.locator(WIZARD.ackBox).first();
    if (await ack.count().catch(() => 0)) {
      const already = await ack.isChecked().catch(() => false);
      if (!already) {
        await ack.check({ timeout: 5000 }).catch(async () => { await ack.click({ force: true }).catch(() => {}); });
        acknowledged.push((await flowText(page)).replace(/\s+/g, ' ').trim().slice(0, 200));
      }
    }

    await submit.click({ timeout: 15000 }).catch(async () => { await submit.dispatchEvent('click'); });
    if (!(await awaitFlow(page, before, 30000))) break;
    text = await flowText(page);
    const stillUnconfirmed = await page.locator(WIZARD.confirmedFlag).count().catch(() => 0);
    const gated = /confirmation required/i.test(text) || (await page.locator(WIZARD.ackBox).count().catch(() => 0)) > 0;
    if (!stillUnconfirmed && !gated && !/are you sure/i.test(text)) break;
  }

  const flat = String(text || (await flowText(page))).replace(/\s+/g, ' ').trim();

  // 'no-change' is its own outcome, not a flavour of success. The tool
  // SHORT-CIRCUITS an identical date — "Expiry date is already 2026-12-22. No
  // change applied." — and that sentence matches the success pattern (`expiry
  // date is …`) while meaning the opposite. Measured 26-08-2026 by deliberately
  // re-writing a record's own date to prove the write path without moving it.
  // A caller setting up a fixture must be able to tell "it is where I wanted"
  // from "I moved it there", because only the second proves the tool works.
  const outcome = /no change applied|already\s/i.test(flat) ? 'no-change'
    : SUCCESS.test(flat) && !FAILURE.test(flat) ? 'success'
      : FAILURE.test(flat) ? 'failure' : 'unclear';
  const finished = /step\s*3\s*of\s*3|result/i.test(flat);
  return { submitted: true, found, filled, outcome, finished, acknowledged, message: flat.slice(0, 800) };
}

/**
 * Did it actually take? Read the expiry back off the UCD Application Listing.
 *
 * This is the only authoritative check. The listing is the one surface that
 * shows the expiry date (C2), and a support tool's success banner is a claim
 * about its own request, not about the record. `boPage` must already hold a
 * BackOffice session — the support tool is a different origin and shares nothing
 * with it.
 *
 * The returned `time` is deliberately separate from `date`: whether the patch
 * lands at 00:00 or keeps the record's original time of day is the evidence Q39
 * turns on.
 */
async function verify(boPage, applicationNo, expectedYmd) {
  const listing = require('./listing');
  const seen = await listing.expiry(boPage, applicationNo);
  const raw = seen.raw || '';
  const datePart = (/^(\d{4}-\d{2}-\d{2})/.exec(raw) || [])[1] || null;
  return {
    applicationNo,
    expected: expectedYmd || null,
    raw,
    date: datePart,
    time: (/\d{4}-\d{2}-\d{2}[ T](\d{2}:\d{2})/.exec(raw) || [])[1] || null,
    matches: expectedYmd ? datePart === expectedYmd : null,
    row: seen.row,
  };
}

/**
 * Patch an expiry and prove it, in one call — the shape a SPEC wants.
 *
 * `boPage` is an already-logged-in BackOffice page (the caller has one; it is
 * about to assert on the application screen anyway). The support tool gets its
 * OWN page because it is a different origin and shares no session.
 *
 * Give it `state` (a name from dates.EXPIRY_TARGETS) or `date` (a Date). Prefer
 * the name: it runs the inverse of the same windowState() the assertion uses, so
 * a fixture and the test that reads it cannot disagree about where the boundary
 * is.
 *
 * THROWS when the listing does not come back showing the requested date. A spec
 * that continues on an unverified patch is asserting about a record in an unknown
 * state, which is worse than a failure — it produces a confident wrong answer
 * about the feature.
 */
async function patch(boPage, opts) {
  const dates = require('./dates');
  const { applicationNo } = opts;
  const plan = opts.state ? dates.expiryForState(opts.state) : null;
  const date = plan ? plan.expiry : opts.date;
  if (!date) throw new Error('patch needs either a `state` from dates.EXPIRY_TARGETS or a `date`');
  const wantedYmd = dates.ymd(date);

  const before = await verify(boPage, applicationNo);
  const toolCtx = await context(boPage.context().browser());
  const toolPage = await toolCtx.newPage();
  let result;
  try {
    result = await setExpiry(toolPage, { ...opts, date });
  } finally {
    await toolPage.close().catch(() => {});
    await toolCtx.close().catch(() => {});
  }

  const after = await verify(boPage, applicationNo, wantedYmd);
  if (!after.matches) {
    throw new Error(
      'expiry patch did not take: asked for ' + wantedYmd + ', listing shows ' + (after.date || '(nothing)') + '. ' +
      'The support tool reported "' + result.outcome + '": ' + String(result.message).slice(0, 200));
  }
  return { plan, wanted: wantedYmd, before, after, tool: result, state: dates.windowState(after.raw) };
}

module.exports = {
  target, requireVpn, reachable, open, resolve, controls, pickFields,
  setExpiry, lookup, WIZARD, verify, patch, formatPlan, render, FORMATTERS, PINNED, WANT, concerns,
  signIn, credentials, haveCredentials, saveAuth, savedAuth, context, LOGIN_PATH, AUTH_FILE,
};
