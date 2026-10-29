/**
 * Log in and dump one screen. The smallest possible tool for the question
 * "what is actually on this page?"
 *
 *   npm run dump -- --url /obs/admin/enquiry
 *   npm run dump -- --url /obs/admin/enquiry --role ops_jasons --name listing
 *
 * Exists because a locator written from a walkthrough is a guess until a run
 * proves it. `listing.open()` waited on a Search button through four different
 * accounts and timed out on all of them — identical failures across roles point
 * at the selector, not at permissions, and this is how you tell the difference:
 * capture the page, read what it really offers, fix the map.
 *
 * Writes <name>.aria.yaml / .txt / .html / .png into discovery/ and prints the
 * landing URL, the headings, and every button and textbox it can see.
 */
const { chromium } = require('@playwright/test');
const { login } = require('../src/login');
const { ROLES, BASE } = require('../src/env');
const assist = require('../src/assist');

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};

const target = opt('url', '/obs/admin/enquiry');
const role = opt('role', ROLES.approver);
const name = opt('name', 'screen-' + target.replace(/[^\w]+/g, '-').replace(/^-|-$/g, ''));
const headed = argv.includes('--headed');

(async () => {
  const browser = await chromium.launch({ headless: !headed });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();

  try {
    // --public skips the login. Dealer links are signed URLs on the /obs side,
    // and opening one WITH a BackOffice session is not what a dealer sees.
    if (argv.includes('--public')) {
      console.log('\n  no login — opening it the way the public would');
    } else {
      const who = await login(page, role);
      console.log('\n  logged in as ' + who.key + ' (' + who.label + ')');
    }

    const url = target.startsWith('http') ? target : BASE + target;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2_500); // these screens finish rendering after load

    console.log('  asked for   ' + url);
    console.log('  landed on   ' + page.url());
    if (page.url() !== url) console.log('  ** redirected — that alone may be the answer **');

    const where = await assist.dump(page, name);

    const headings = await page.locator('h1,h2,h3,legend,.page-title').allInnerTexts().catch(() => []);
    const buttons = await page.locator('button:visible, input[type=submit]:visible, a.btn:visible').allInnerTexts().catch(() => []);
    const boxes = await page.locator('input:visible:not([type=hidden]), select:visible, textarea:visible')
      .evaluateAll((els) => els.map((e) => (e.tagName.toLowerCase() + '#' + (e.id || '-') + '[' + (e.getAttribute('name') || '') + ']'))).catch(() => []);
    const tables = await page.locator('table').count().catch(() => 0);

    const clean = (a) => [...new Set(a.map((s) => String(s).replace(/\s+/g, ' ').trim()).filter(Boolean))];
    console.log('\n  headings   ' + (clean(headings).slice(0, 8).join(' | ') || '(none)'));
    console.log('  buttons    ' + (clean(buttons).slice(0, 20).join(' | ') || '(none)'));
    console.log('  fields     ' + (clean(boxes).slice(0, 25).join(' ') || '(none)'));
    console.log('  tables     ' + tables);
    console.log('\n  dumped to ' + where + '.*\n');
  } catch (err) {
    console.error('\n  failed: ' + err.message.split('\n')[0] + '\n');
    await assist.dump(page, name + '-error').catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
