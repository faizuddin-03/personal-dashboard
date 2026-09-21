/**
 * Getting into the /obs application at all.
 *
 * THE TRAP THIS EXISTS FOR
 *
 * The onboarding screens live on `/obs`, which is a DIFFERENT application from
 * the `/uat4` instance the login establishes. A `/uat4` session is not an `/obs`
 * session, and `/obs` does not say so: asked for directly, `/obs/admin/enquiry`
 * answers **39 bytes of empty HTML** — no redirect, no 403, no error text. Every
 * account tried got the same blank page, which is how we know it is not
 * permissions.
 *
 * After the session HANDOFF the very same URL returns ~84 KB with a working Search
 * button. So: one handoff per session, then business as usual. Without it the whole
 * BackOffice half of this harness reads empty pages and every assertion fails in a
 * way that looks like a missing feature rather than a missing session.
 *
 * THE HANDOFF IS A URL, NOT A MENU (corrected 27-08-2026). The rig used to walk
 * Menu > Onboarding > UCD Application Listing, and Charmain asked why the dropdown
 * opens in every take. It does not have to: the menu item is
 * `<li data-type="OBS_APPLICATION_LISTING"><a href="#">`, and clicking it navigates
 * to `auth-redirect.do?type=OBS_APPLICATION_LISTING`. The rig was opening a dropdown
 * to make the browser follow a URL it already had. See enterObs.
 */
const { BASE, INSTANCE } = require('./env');

// The instance home, NOT a hardcoded /uat4/ — the 26-08 cross-instance run logged
// into /eauto and was then sent to /uat4/home/, which bounced it straight back to a
// login page and reported "no UCD Application Listing item in the Onboarding menu".
// The menu was fine; the harness had walked into the wrong instance.
const HOME = BASE + '/' + INSTANCE + '/home/';

/**
 * A route /obs will not serve for this record — NOT a lapsed handoff.
 *
 * Both failures look alike (a tiny document), so they were treated alike until
 * the 25-08 run reported "blank even after re-entering through the menu" for a
 * page that plainly said 404: an application whose registration documents were
 * never submitted has no /form/edit-registration-doc/<uuid> to open. Telling
 * the two apart lets callers fall back instead of failing.
 */
const NOT_FOUND = /404\s*[-–—]?\s*NOT\s+FOUND/i;

async function notFound(page) {
  const html = await page.content().catch(() => '');
  return html.length < 2_000 && NOT_FOUND.test(html);
}

function notFoundError(url) {
  const e = new Error(url + ' answers "404 - NOT FOUND" — /obs does not serve that route for this record ' +
    '(e.g. registration documents never submitted)');
  e.code = 'OBS_NOT_FOUND';
  return e;
}

/** Does this page currently hold a usable /obs document? */
async function inObs(page) {
  if (!/\/obs\//.test(page.url())) return false;
  const html = await page.content().catch(() => '');
  return html.length > 1_000;
}

/**
 * The menu's own handoff types, read off the live home page 27-08-2026:
 *
 *   <li class="obs-auth-required" data-type="OBS_APPLICATION_LISTING">
 *
 * Clicking such an item is just navigation to
 * `/<instance>/api/admin/onboarding/auth-redirect.do?type=<data-type>`.
 */
const HANDOFF = {
  'application': 'OBS_APPLICATION_LISTING',
  'pre-application': 'PRE_OBS_APPLICATION_LISTING',
};
const authRedirect = (type) => BASE + '/' + INSTANCE + '/api/admin/onboarding/auth-redirect.do?type=' + type;

/**
 * Establish the /obs session, and land on the named screen.
 *
 * GO STRAIGHT THROUGH THE DOOR — DO NOT WALK THE MENU (Charmain, 27-08-2026:
 * *"every time when you land in backoffice you will open the menu dropdown then
 * only proceed to the expected page, why? ... dont open the menu dropdown"*).
 *
 * She is right, and the distinction is worth keeping straight. The HANDOFF is
 * real and still mandatory — re-measured 27-08 on a cold session: a direct GET of
 * /obs/admin/enquiry returns **39 bytes**, and the same URL after the handoff
 * returns **84,673**. What was never necessary is the THEATRE around it. The menu
 * item is `<li data-type="OBS_APPLICATION_LISTING"><a href="#">`, and clicking it
 * navigates to `auth-redirect.do?type=OBS_APPLICATION_LISTING`. So the rig was
 * opening a dropdown to make the browser follow a URL it already knew.
 *
 * Measured on the same run: the redirect lands on /obs/admin/enquiry with a full
 * 84,673-byte document in **1.1 s**, and direct navigation works for the rest of
 * the session — exactly as the menu click did. The audit log had used this route
 * since it was first reached (R18); the listing simply never got updated.
 *
 * Three things go away with the dropdown: a menu opening on camera in every take,
 * ~1.5 s of animation waits per entry, and the click-interception hazard that bit
 * the 25-08 run when "UCD Pre-Application Audit Log" swallowed the click meant for
 * the listing — a redirect has no neighbouring element to hit.
 *
 * The menu walk is KEPT as a fallback, because the redirect is one endpoint and
 * the menu is the thing a human actually uses: if the endpoint is ever renamed the
 * fallback keeps every take running, and the sidecar says which door was used.
 */
async function enterObs(page, which = 'application') {
  if (await inObs(page)) return { already: true, url: page.url(), via: 'session' };

  const type = HANDOFF[which] || HANDOFF.application;
  await gotoDocument(page, authRedirect(type), { timeout: 45_000 }).catch(() => {});
  if (await inObs(page)) return { already: false, url: page.url(), via: 'auth-redirect:' + type };

  // FALLBACK: walk the menu, the way a person would.
  return enterObsViaMenu(page, which);
}

/**
 * The original door: Menu > Onboarding > UCD Application Listing.
 *
 * No longer the default (see enterObs) — kept because it is what a human does, so
 * it still works the day the redirect endpoint is renamed. Every quirk below was
 * paid for once and is left documented rather than rediscovered.
 */
async function enterObsViaMenu(page, which = 'application') {
  await page.goto(HOME, { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: /^menu/i }).first().click().catch(() => {});
  await page.waitForTimeout(600);

  // The group header is script-driven, and on some renders the items are already
  // visible — clicking a collapsed group is required, clicking an open one is
  // harmless, so try it either way.
  const group = page.getByText(/^\s*Onboarding\s*$/i).first();
  if (await group.count()) {
    await group.click().catch(() => {});
    await page.waitForTimeout(600);
  }

  const label = which === 'pre-application' ? /UCD Pre-?Application Listing/i : /UCD Application Listing/i;
  const link = page.getByRole('link', { name: label }).first();
  if (!(await link.count())) {
    throw new Error('no "' + label + '" item in the Onboarding menu for this account — ' +
      'run `npm run find:listing -- --headed --role <key>` and watch what it offers');
  }

  // The dropdown items overlap while the menu animates, and a real pointer
  // click gets intercepted by a NEIGHBOURING item (seen 25-08: "UCD
  // Pre-Application Audit Log" swallowed the click meant for the listing).
  // The links are script-driven (href="#"), so on interception dispatch the
  // click event straight to the right element instead of the topmost one.
  await link.click({ timeout: 5_000 }).catch(() => link.dispatchEvent('click'));

  // The click lands one of two ways (both seen live): the top frame navigates
  // to /obs, OR the listing loads inside an IFRAME under a "Back to
  // Backoffice" wrapper while the top URL stays on the instance. Either way
  // the /obs request that just happened carries the session handoff, so once
  // ANY frame holds a real /obs document, direct navigation works.
  const deadline = Date.now() + 30_000;
  let handed = false;
  while (Date.now() < deadline) {
    if (await inObs(page)) { handed = true; break; }
    const frame = page.frames().find((f) => /\/obs\//.test(f.url()));
    if (frame) {
      const html = await frame.content().catch(() => '');
      if (html.length > 1_000) { handed = true; break; }
    }
    await page.waitForTimeout(500);
  }
  if (!handed) {
    throw new Error('the auth-redirect handoff did not take AND clicking the menu item produced no ' +
      'usable /obs document either (top URL: ' + page.url() + ')');
  }
  return { already: false, url: page.url(), via: 'menu' };
}

/**
 * Navigate and wait for the DOCUMENT, not for the page lifecycle.
 *
 * WHY THIS IS NOT `waitUntil: 'domcontentloaded'` (Q25, settled 26-08-2026).
 * The Rejected record 6bc4ae32… was read as a 30-second hang twice: once on
 * 'load', then again on 'domcontentloaded' after the first "fix". Probing it
 * with no wait condition at all showed why — the server sends the whole 252 KB
 * document in 1.2 s and it is perfectly usable, but a batch of static assets
 * (the /web/jquery/* libraries, the /uat4 toolbar images) never answer, so
 * `document.readyState` sits on "loading" forever and NEITHER lifecycle event
 * ever fires. Waiting for a lifecycle on this app therefore waits for an image.
 *
 * So: commit the navigation, then poll for a document big enough to be real.
 */
async function gotoDocument(page, url, opts = {}) {
  const timeout = opts.timeout || 45_000;
  await page.goto(url, { waitUntil: 'commit', timeout }).catch(() => {});

  const deadline = Date.now() + timeout;
  let len = 0;
  while (Date.now() < deadline) {
    len = await page.evaluate(() => document.documentElement.outerHTML.length).catch(() => 0);
    if (len > 20_000) return { url: page.url(), bytes: len };
    if (len > 0 && await notFound(page)) return { url: page.url(), bytes: len, notFound: true };
    await page.waitForTimeout(250);
  }
  return { url: page.url(), bytes: len, timedOut: true };
}

/**
 * Navigate inside /obs, entering through the menu first if needed.
 *
 * Use this instead of page.goto for any /obs URL. It also re-enters when a page
 * comes back blank, which is what a lapsed handoff looks like mid-run.
 */
async function gotoObs(page, url, opts = {}) {
  if (!(await inObs(page))) await enterObs(page, opts.via || 'application');

  if (page.url().split('?')[0] !== String(url).split('?')[0]) {
    await gotoDocument(page, url);
  }
  if (!(await inObs(page))) {
    if (await notFound(page)) throw notFoundError(url);
    // One retry: re-enter through the menu, then ask again.
    await enterObs(page, opts.via || 'application');
    await gotoDocument(page, url);
    if (!(await inObs(page))) {
      if (await notFound(page)) throw notFoundError(url);
      throw new Error(url + ' is blank even after re-entering through the menu');
    }
  }
  return page.url();
}

module.exports = { enterObs, enterObsViaMenu, gotoObs, gotoDocument, inObs, notFound, HOME, HANDOFF, authRedirect };
