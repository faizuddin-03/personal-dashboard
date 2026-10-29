/**
 * Assisted locators — for surfaces nobody has automated yet.
 *
 * When this was written, everything downstream of the reCAPTCHA gate was
 * unobserved: the 23-08-2026 recording never got through the challenge
 * (preapp-flow.har is 60 entries of `replaceimage` / `userverify` and not one
 * `/obs/preOnb/` form request), so the Pre-Application Form was known only from
 * the SRD's prose.
 *
 * The 24-08-2026 build settled that form — src/preapp.js now carries its real
 * ids, and it took three misses to get there: a radio group read as a dropdown,
 * a file input hidden behind a Browse button, and a city list that loads by ajax.
 * Each miss cost one aborted run and produced the dump that fixed it. What is
 * still unobserved is the dealer Application Form and the registration-documents
 * screens, so this module stays load-bearing.
 *
 * A guessed locator that throws is cheap. A guessed locator that silently hits
 * the WRONG control is what quietly builds a fixture in the wrong state — and
 * that only shows up after the extension has been spent (R1). So every field on
 * an unobserved surface goes through `fill` / `click` here, which:
 *
 *   1. tries each candidate in order and takes the first visible match;
 *   2. on a miss, dumps the page (aria + text + html + png) to ./discovery and
 *      hands control to the operator instead of guessing harder;
 *   3. records what actually matched into discovery/locators-learned.json.
 *
 * That last file is the point: the first assisted run is how this folder stops
 * guessing. Fold it back into the field maps and the second run is unattended.
 */
const fsp = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline');

const OUT = path.resolve(__dirname, '..', 'discovery');
const LEARNED = path.join(OUT, 'locators-learned.json');

/** Unattended runs must fail loudly rather than sit waiting for a human. */
const INTERACTIVE = () => Boolean(process.stdout.isTTY) && !process.env.EV_NO_PROMPT;

/**
 * A DUMP MUST NEVER KILL THE TAKE IT IS DUMPING — 28-08-2026.
 *
 * E2E_TS4 died here at 09:04, having already spent a reCAPTCHA and two Fiuu logins.
 * It was not the flow that failed: approveApplication() called dump() while the page
 * was mid-navigation and `page.content()` threw "Unable to retrieve content because
 * the page is navigating and changing the content." The screenshot on the next line
 * was already guarded; content(), url() and the writes were not, so the one leg whose
 * entire job is to explain a failure became the failure.
 *
 * Every read is now individually guarded and records WHY it is empty, so a partial
 * dump still lands and still says what it could not see. A dump that throws tells you
 * nothing; a dump that says "html unavailable: the page was navigating" tells you
 * exactly what happened.
 */
async function dump(page, name) {
  await fsp.mkdir(OUT, { recursive: true });
  const soft = async (what, read) => {
    try {
      return await read();
    } catch (e) {
      return `<<${what} unavailable: ${String((e && e.message) || e).split('\n')[0]}>>`;
    }
  };
  const url = await soft('url', async () => page.url());
  const aria = await soft('ariaSnapshot', () => page.locator('body').ariaSnapshot());
  const text = await soft('innerText', () => page.locator('body').innerText());
  const html = await soft('html', () => page.content());
  const base = path.join(OUT, name);
  await fsp.writeFile(base + '.aria.yaml', '# ' + url + '\n' + aria + '\n').catch(() => {});
  await fsp.writeFile(base + '.txt', url + '\n\n' + text + '\n').catch(() => {});
  await fsp.writeFile(base + '.html', html).catch(() => {});
  await page.screenshot({ path: base + '.png', fullPage: true }).catch(() => {});
  return base;
}

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const asRe = (v) => (v instanceof RegExp ? v : new RegExp(escapeRe(v), 'i'));

/**
 * A spec is a bag of hints, most specific first. Every key is optional:
 *   { label, name, placeholder, role, exact, css, text }
 * Order matters — `label` beats `css`, because a CSS hit tells you nothing about
 * whether the control is the one a human would have clicked.
 */
function candidates(scope, spec) {
  const out = [];
  const add = (why, locator) => out.push({ why, locator });

  if (spec.role && spec.label) add('role=' + spec.role + ' name=' + spec.label, scope.getByRole(spec.role, { name: spec.label }));
  if (spec.label) add('label=' + spec.label, scope.getByLabel(spec.label, { exact: Boolean(spec.exact) }));
  if (spec.placeholder) add('placeholder=' + spec.placeholder, scope.getByPlaceholder(spec.placeholder));
  if (spec.name) add('[name]=' + spec.name, scope.locator('[name="' + spec.name + '"], #' + spec.name));
  if (spec.text) add('text=' + spec.text, scope.getByText(spec.text));
  if (spec.css) add('css=' + spec.css, scope.locator(spec.css));

  // Last resort for a labelled input the DOM never wired to its <label>: find
  // the text, then the nearest control under it. Common on these screens.
  if (spec.label && spec.role !== 'button') {
    add(
      'near-text=' + spec.label,
      scope
        .locator('div,td,tr,li,section')
        .filter({ hasText: asRe(spec.label) })
        .last()
        .locator('input, textarea, select')
        .first()
    );
  }
  return out;
}

/**
 * First candidate that exists and is visible, or null. Never throws.
 *
 * `requireVisible: false` drops the visibility test, for controls that are
 * hidden BY DESIGN — a file input driven by a styled Browse button is the case
 * that forced this: it is real, it accepts setInputFiles, and it will never be
 * visible. Everything else keeps the check, because an invisible control is
 * usually the wrong one.
 */
async function resolve(scope, spec, opts = {}) {
  const needVisible = opts.requireVisible !== false;
  for (const c of candidates(scope, spec)) {
    try {
      const n = await c.locator.count();
      if (!n) continue;
      if (!needVisible) return { why: c.why, el: c.locator.first() };

      // Take the first VISIBLE match, not the first match. These pages ship
      // client-side templates as ordinary markup, so an id can appear twice —
      // once in the hidden template and once live. Checking only .first() made
      // real, visible fields report as absent, and an "absent (optional)" line
      // for a mandatory field is a lie the run then acts on.
      for (let i = 0; i < Math.min(n, 8); i++) {
        const el = c.locator.nth(i);
        if (await el.isVisible().catch(() => false)) {
          return { why: c.why + (i ? ' [match ' + (i + 1) + ' of ' + n + ']' : ''), el };
        }
      }
    } catch {
      // a malformed selector is a miss, not a crash
    }
  }
  return null;
}

const describe = (spec) =>
  Object.fromEntries(Object.entries(spec).map(([k, v]) => [k, v instanceof RegExp ? String(v) : v]));

async function remember(step, spec, why) {
  await fsp.mkdir(OUT, { recursive: true });
  let all = {};
  try {
    all = JSON.parse(await fsp.readFile(LEARNED, 'utf-8'));
  } catch {
    // first write
  }
  all[step] = { spec: describe(spec), matchedBy: why, at: new Date().toISOString() };
  await fsp.writeFile(LEARNED, JSON.stringify(all, null, 2));
}

const log = (s) => console.log(s);
const shown = (v, opts) => (opts.secret ? '••••' : String(v).slice(0, 40));

/**
 * Fill a field. `step` is the name this appears under in
 * locators-learned.json and in the dump filename, so keep it readable:
 * 'preapp.business-name'.
 */
async function fill(page, step, spec, value, opts = {}) {
  const scope = opts.scope || page;
  const hit = await resolve(scope, spec);
  if (!hit) return miss(page, step, spec, 'fill "' + shown(value, opts) + '"', opts);

  const tag = await hit.el.evaluate((n) => n.tagName.toLowerCase());
  if (tag === 'select') {
    await hit.el.selectOption({ label: String(value) }).catch(() => hit.el.selectOption(String(value)));
  } else if (opts.type) {
    await hit.el.click();
    await hit.el.type(String(value), { delay: 30 }); // some pickers ignore fill()
  } else {
    await hit.el.fill(String(value));
  }

  await remember(step, spec, hit.why);
  log('    ' + step.padEnd(32) + hit.why);
  return hit.el;
}

async function click(page, step, spec, opts = {}) {
  const scope = opts.scope || page;
  const hit = await resolve(scope, spec);
  if (!hit) return miss(page, step, spec, 'click', opts);
  await hit.el.click();
  await remember(step, spec, hit.why);
  log('    ' + step.padEnd(32) + hit.why + '  (clicked)');
  return hit.el;
}

/** Set a file input directly. File inputs are usually hidden, so visibility is not required. */
async function upload(page, step, spec, filePath, opts = {}) {
  const scope = opts.scope || page;
  const hit = await resolve(scope, Object.assign({ css: 'input[type=file]' }, spec), { requireVisible: false });
  if (!hit) return miss(page, step, spec, 'upload ' + filePath, opts);
  await hit.el.setInputFiles(filePath);
  await remember(step, spec, hit.why);
  log('    ' + step.padEnd(32) + hit.why + '  (' + path.basename(filePath) + ')');
  return hit.el;
}

/**
 * Upload through the page's own Browse button.
 *
 * Preferred over `upload` wherever a visible button drives the input. The
 * pre-application form carries THREE hidden file inputs and only one belongs to
 * the section on screen, so picking the input ourselves is a guess; clicking the
 * button a human would click and catching the filechooser lets the page choose,
 * and its onchange handler (handleFileSelect) runs exactly as it does for a
 * person.
 */
async function uploadVia(page, step, buttonSpec, filePath, opts = {}) {
  const scope = opts.scope || page;
  const hit = await resolve(scope, buttonSpec);
  if (!hit) return miss(page, step, buttonSpec, 'upload ' + path.basename(filePath) + ' via its Browse button', opts);

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: opts.timeout || 15_000 }),
    hit.el.click(),
  ]);
  await chooser.setFiles(filePath);
  await remember(step, buttonSpec, hit.why + ' -> filechooser');
  log('    ' + step.padEnd(32) + hit.why + ' -> filechooser  (' + path.basename(filePath) + ')');
  return hit.el;
}

/**
 * A locator missed. Dump what the page actually is, then either hand over to
 * the operator (assisted run) or stop (unattended run). It deliberately does
 * NOT try to be clever — the value of this harness is that an unknown surface
 * produces evidence rather than a plausible wrong click.
 */
async function miss(page, step, spec, intent, opts) {
  if (opts.optional) {
    log('    ' + step.padEnd(32) + 'absent (optional) — skipped');
    return null;
  }
  const where = await dump(page, 'miss-' + step.replace(/[^\w.-]+/g, '_'));
  const msg =
    'no control matched ' + step + ' — wanted to ' + intent +
    '\n    hints: ' + JSON.stringify(describe(spec)) +
    '\n    page dumped to ' + where + '.*';

  if (!INTERACTIVE()) throw new Error(msg);

  log('\n  ' + msg);
  log('  Do it by hand in the open browser, then press Enter here to carry on');
  log('  (or type "skip" to move past this field, "abort" to stop).\n');
  const answer = (await prompt('  > ')).trim().toLowerCase();
  if (answer === 'abort') throw new Error('operator aborted at ' + step);
  await fsp.mkdir(OUT, { recursive: true });
  await fsp.appendFile(
    path.join(OUT, 'assisted-steps.log'),
    new Date().toISOString() + '\t' + step + '\t' + (answer || 'done-by-hand') + '\n'
  );
  return null;
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((done) => rl.question(question, (a) => { rl.close(); done(a); }));
}

/**
 * Wait for a human to do something the harness must not do itself — pass the
 * reCAPTCHA, drive the FPX simulator. `until` is polled so the operator never
 * has to come back to the terminal; the Enter key is only the fallback.
 */
async function waitForHuman(page, { hint, until, timeoutMs = 300_000, poll = 1_000 }) {
  log('\n  [pause] ' + hint);
  if (!until) {
    await prompt('     press Enter when done > ');
    return 'enter';
  }
  log('     watching the page for up to ' + Math.round(timeoutMs / 1000) + 's — no need to come back here');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await until().catch(() => false)) {
      log('     detected — carrying on\n');
      return 'detected';
    }
    await page.waitForTimeout(poll);
  }
  throw new Error('timed out waiting for the operator: ' + hint);
}

module.exports = { dump, resolve, fill, click, upload, uploadVia, waitForHuman, prompt, remember, OUT, LEARNED, INTERACTIVE };
