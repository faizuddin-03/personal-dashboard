/**
 * Can the Pre-Application Form be driven for EVERY business type?
 *
 *   npm run probe:types              # all five
 *   npm run probe:types -- --type LLP
 *
 * Fills step one with a fresh, uniquely-numbered dealer for each type and clicks
 * Next. It stops there: no declaration, no payment, nothing paid for. What it
 * reports per type is the only thing in question —
 *
 *   REVIEW    reached Business Info Review; the type is drivable end to end
 *   FALLBACK  the form switched itself to Business Trading; checkSSM.do rejected
 *             the generated BRN, so this type needs a REAL company number
 *   BLOCKED   a validation message stopped it — the message is captured verbatim
 *
 * WHY THE SSM TYPES ARE THE WHOLE POINT
 *
 * Sdn Bhd, Sole Proprietorship / Partnership and LLP all send the BRN to
 * /obs/preOnb/checkSSM.do. If it is not a registered company the page calls
 * fallbackToBusinessTrading() and returns, so a fabricated BRN can never advance
 * on those paths no matter how well-formed it looks. This probe is how we learn
 * whether staging's SSM lookup is live or permissive, and therefore whether
 * "cover all business types" means five automated fixtures or two automated and
 * three needing real BRNs.
 *
 * COST: clicking Next saves a draft pre-application, so expect up to one unpaid
 * draft per type on the Pre-Application Listing. Unpaid drafts never become
 * applications and never carry an expiry date, so they cannot be mistaken for
 * fixtures.
 */
const fsp = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const preapp = require('../src/preapp');
const assist = require('../src/assist');
const fixture = require('../src/fixture');
const { OBS } = require('../src/env');

const argv = process.argv.slice(2);
const only = (() => {
  const i = argv.indexOf('--type');
  return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
})();
const headless = argv.includes('--headless');

const TYPES = only
  ? fixture.ALL_TYPES.filter((t) => fixture.typeCodeOf(t) === fixture.typeCodeOf(only))
  : fixture.ALL_TYPES;

/** Which radio the page has selected NOW — the tell for a silent fallback. */
const checkedType = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('input[name="businessType"]:checked');
    return el ? el.value : '';
  });

/** Every validation message currently on screen, in reading order. */
async function messages(page) {
  const raw = await page
    .locator('.error-message:visible, [id$="-error"]:visible')
    .allInnerTexts()
    .catch(() => []);
  return raw.map((s) => s.trim()).filter(Boolean);
}

/** Are we on step two? #agreeTerms only shows there, and Next relabels itself. */
async function onReview(page) {
  if (await page.locator('#agreeTerms').isVisible().catch(() => false)) return true;
  const label = await page.locator('#nextSubmitBtn').innerText().catch(() => '');
  return /submit and pay/i.test(label || '');
}

(async () => {
  const browser = await chromium.launch({ headless, slowMo: headless ? 0 : 60 });
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    storageState: preapp.gateStatePath(),
  });
  const page = await ctx.newPage();
  const results = [];

  // Capture what the SSM lookup actually answers. A FALLBACK verdict alone
  // cannot tell "the real registry says no" from "staging's stub is misconfigured
  // and says no to everything" — and those two have different owners.
  const ssmCalls = [];
  page.on('response', async (res) => {
    if (!/checkSSM\.do/i.test(res.url())) return;
    const body = await res.text().catch(() => '');
    ssmCalls.push({ status: res.status(), query: res.url().split('?')[1] || '', body: body.slice(0, 400) });
  });

  try {
    for (const type of TYPES) {
      const code = fixture.typeCodeOf(type);
      const profile = fixture.newProfile({ type });
      console.log('\n' + '─'.repeat(72) + '\n  ' + code + '  —  ' + profile.businessName + '\n' + '─'.repeat(72));

      // Fresh DOM each time: a completed step one leaves state behind, and a
      // fallback rewrites the very radio we are about to test.
      await page.goto(OBS.preApplicationFormPage, { waitUntil: 'domcontentloaded' });
      if (!(await preapp.pastGate(page))) await preapp.passGate(page);

      const row = {
        type, code,
        businessName: profile.businessName,
        newBrn: profile.newBrn, oldBrn: profile.oldBrn,
        licenceNo: profile.tradingLicenseNo, tin: profile.tin,
        verdict: '', selectedAfter: '', messages: [], error: '',
      };

      try {
        await preapp.fillPreApplicationForm(page, profile);
        row.verdict = 'REVIEW';
      } catch (err) {
        row.error = err.message.split('\n')[0];
      }

      row.selectedAfter = await checkedType(page);
      row.messages = await messages(page);
      row.ssm = ssmCalls.splice(0);   // whatever this type's Next triggered
      for (const c of row.ssm) console.log('    checkSSM ' + c.status + '  ' + c.query + '  ->  ' + c.body.replace(/\s+/g, ' ').slice(0, 200));

      if (!row.verdict) {
        const switched = row.selectedAfter && row.selectedAfter !== code;
        const droppedToTrading = /^TRADING_/.test(row.selectedAfter) && !/^TRADING_/.test(code);
        row.verdict = await onReview(page) ? 'REVIEW' : (switched || droppedToTrading) ? 'FALLBACK' : 'BLOCKED';
      }

      await assist.dump(page, 'probe-type-' + code);
      console.log('    verdict: ' + row.verdict +
        (row.selectedAfter && row.selectedAfter !== code ? '  (page now has ' + row.selectedAfter + ' selected)' : '') +
        (row.messages.length ? '\n    says:    ' + row.messages.join(' | ') : '') +
        (row.error ? '\n    stopped: ' + row.error : ''));
      results.push(row);
    }
  } finally {
    const out = path.join(assist.OUT, 'business-type-probe.json');
    await fsp.mkdir(assist.OUT, { recursive: true });
    await fsp.writeFile(out, JSON.stringify({ at: new Date().toISOString(), results }, null, 2));

    console.log('\n' + '═'.repeat(72));
    console.log('  business type                      verdict    what happened');
    console.log('  ' + '─'.repeat(68));
    for (const r of results) {
      const note = r.verdict === 'REVIEW' ? 'drivable with generated data'
        : r.verdict === 'FALLBACK' ? 'needs a real BRN — SSM lookup rejected ours'
        : (r.messages[0] || r.error || 'stopped on step one').slice(0, 40);
      console.log('  ' + r.code.padEnd(34) + r.verdict.padEnd(11) + note);
    }
    const drivable = results.filter((r) => r.verdict === 'REVIEW').length;
    console.log('\n  ' + drivable + '/' + results.length + ' business types drivable with generated data');
    console.log('  full detail: ' + out + '\n');
    await browser.close();
  }
})();
