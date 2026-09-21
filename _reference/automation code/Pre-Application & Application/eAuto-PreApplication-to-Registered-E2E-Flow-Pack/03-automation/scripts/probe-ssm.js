/**
 * Find a BRN that staging's SSM lookup accepts, so the SSM-Registered business
 * types can be covered as well as Non-SSM.
 *
 *   npm run probe:ssm                       # harvest from staging + probe each
 *   npm run probe:ssm -- --brn 202601012345 # probe specific numbers
 *
 * WHY THIS IS THE RIGHT QUESTION TO ASK FIRST
 *
 * The pre-application form does not validate the BRN's shape — 4 characters is
 * the only rule. What it does is call `/obs/preOnb/checkSSM.do` and then:
 *
 *   registered !== true            -> fallbackToBusinessTrading(), form switches
 *   registered === true, and the entered old/new BRN differs from the returned
 *   refNo / newRefNo               -> same fallback (brnEq in the page)
 *   registered === true and equal  -> proceeds down the SSM path
 *
 * So the SSM path is reachable only with a number the lookup already knows, and
 * the form must be filled with the EXACT values the lookup returns. This probe
 * reads those values back, which is what makes an SSM fixture possible at all.
 *
 * It creates nothing: a GET against the lookup, no form, no draft, no payment.
 *
 * CANDIDATES come from staging's own data — the UCD Application Listing carries
 * Old BRN and New BRN columns, and any application that reached Approved through
 * the SSM path used a number that passed this same lookup. Harvesting from there
 * beats inventing numbers, and beats using a real outside company's registration
 * number as test data.
 */
const fsp = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { login } = require('../src/login');
const { ROLES, OBS } = require('../src/env');
const listing = require('../src/listing');
const preapp = require('../src/preapp');
const assist = require('../src/assist');

const argv = process.argv.slice(2);
const explicit = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--brn' && argv[i + 1]) explicit.push(argv[i + 1]);
}
const headless = !argv.includes('--headed');
const limit = Number((argv[argv.indexOf('--limit') + 1] || 0)) || 40;

/** Harvest Old BRN / New BRN from the UCD Application Listing. */
async function harvest(page) {
  await listing.open(page);
  await page.getByRole('button', { name: /^search$/i }).click();
  await page.getByText(/record\(s\) in total/i).waitFor({ timeout: 30_000 });

  const rows = await listing.readRows(page);
  const out = [];
  for (const r of rows) {
    for (const [kind, value] of [['old', r.oldBrn], ['new', r.newBrn]]) {
      const v = String(value || '').trim();
      if (v && v !== '-' && v.length >= 4) {
        out.push({ brn: v, kind, company: r.companyName, status: r.applicationStatus });
      }
    }
  }
  console.log('    harvested ' + out.length + ' BRN value(s) from ' + rows.length + ' listing row(s)');
  return out;
}

/**
 * Ask the lookup. Runs inside the page so it carries the same origin and session
 * the form would — the endpoint sits on the public /obs/preOnb side.
 */
async function checkSSM(page, brn) {
  return page.evaluate(async (value) => {
    const res = await fetch('/obs/preOnb/checkSSM.do?tradingLicenseOrRegistrationNo=' + encodeURIComponent(value), {
      headers: { Accept: 'application/json' },
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = { parseError: true };
    }
    return { status: res.status, body };
  }, brn);
}

(async () => {
  const browser = await chromium.launch({ headless });
  const results = [];
  let harvestAttempted = false;

  try {
    // 1. Candidates — explicit ones win, otherwise harvest from BackOffice.
    let candidates = explicit.map((brn) => ({ brn, kind: 'given', company: '', status: '' }));
    if (!candidates.length) {
      // Not every login can reach Onboarding: accounts.js lists Hub Admin,
      // Admin, Probation and Finance as having no access to the module, and the
      // configured assignee is a Hub Admin. So try accounts until one can
      // actually see the listing, and say which one did.
      const tryKeys = [ROLES.approver, ROLES.assignee, 'ops_kelvin', 'cse_chinwei'];
      for (const key of tryKeys) {
        const boCtx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
        const boPage = await boCtx.newPage();
        try {
          const who = await login(boPage, key);
          candidates = await harvest(boPage);
          console.log('    (harvested as ' + who.key + ')');
          break;
        } catch (err) {
          console.log('    ' + key.padEnd(18) + 'cannot harvest — ' + err.message.split('\n')[0].slice(0, 70));
        } finally {
          await boCtx.close();
        }
      }
      harvestAttempted = true;
    }

    // De-duplicate, keep order, cap the run.
    const seen = new Set();
    candidates = candidates.filter((c) => (seen.has(c.brn) ? false : seen.add(c.brn))).slice(0, limit);
    if (!candidates.length) {
      console.log('\n  No candidate BRNs found. Pass some with --brn, or check the listing has rows.\n');
      return;
    }

    // 2. Probe each from the dealer side, where the form would ask.
    const ctx = await browser.newContext({ storageState: preapp.gateStatePath() });
    const page = await ctx.newPage();
    await page.goto(OBS.preApplicationFormPage, { waitUntil: 'domcontentloaded' });
    if (!(await preapp.pastGate(page))) await preapp.passGate(page);

    console.log('\n  probing ' + candidates.length + ' candidate(s) against /obs/preOnb/checkSSM.do\n');
    for (const c of candidates) {
      const r = await checkSSM(page, c.brn).catch((e) => ({ status: 0, body: { error: e.message } }));
      const b = r.body || {};
      const row = {
        brn: c.brn, kind: c.kind, company: c.company, status: r.status,
        registered: b.registered === true,
        refNo: b.refNo || '', newRefNo: b.newRefNo || '',
        referenceName: b.referenceName || '', itemType: b.itemType || '',
        unexpectedResult: b.unexpectedResult || null,
      };
      results.push(row);
      console.log('    ' + (row.registered ? 'YES ' : 'no  ') + c.brn.padEnd(20) +
        (row.registered
          ? 'refNo=' + row.refNo + '  newRefNo=' + row.newRefNo + '  name=' + row.referenceName
          : 'registered=false') +
        (c.company ? '   [' + c.company.slice(0, 28) + ']' : ''));
    }
  } finally {
    const out = path.join(assist.OUT, 'ssm-candidates.json');
    await fsp.mkdir(assist.OUT, { recursive: true });
    await fsp.writeFile(out, JSON.stringify({ at: new Date().toISOString(), results }, null, 2));

    const hits = results.filter((r) => r.registered);
    console.log('\n' + '═'.repeat(72));
    if (!results.length) {
      // NOTHING WAS PROBED, so say only that. An earlier version printed the
      // "the lookup rejects everything" verdict here on a run where the harvest
      // crashed before a single request went out — a conclusion invented from an
      // empty array, which is worse than no output at all.
      console.log('  Nothing was probed, so there is nothing to conclude about the SSM lookup.');
      console.log(harvestAttempted
        ? '  The harvest could not read the UCD Application Listing with any account tried —\n' +
          '  find which login has Onboarding access, or pass numbers directly with --brn.'
        : '  No candidates were supplied. Pass some with --brn.');
    } else if (hits.length) {
      console.log('  ' + hits.length + ' BRN(s) the lookup accepts. Use one for an SSM fixture like this:\n');
      const h = hits[0];
      console.log('  fixtures/profile.json');
      console.log('  {');
      console.log('    "typeOfBusiness": "Sdn Bhd / Bhd",');
      console.log('    "newBrn": "' + h.newRefNo + '",');
      console.log('    "oldBrn": "' + h.refNo + '"');
      console.log('  }\n');
      console.log('  Fill BOTH with exactly what the lookup returned — the page compares the two');
      console.log('  and falls back to Business Trading on any difference.');
      console.log('  Then: npm run fixture -- --type "Sdn Bhd"');
      console.log('\n  NOTE: these numbers are already onboarded on staging, so the submit may be');
      console.log('  refused as a duplicate. That is the next thing to find out, and it is a');
      console.log('  different failure from the SSM fallback — it would mean the SSM path needs a');
      console.log('  real BRN that eAuto has not seen (Q20).');
    } else {
      console.log('  No candidate was accepted. Every reply was registered:false, so staging\'s SSM');
      console.log('  lookup does not recognise any number currently in its own listing either —');
      console.log('  which points at the connector being pointed somewhere empty, and makes Q20 a');
      console.log('  question about environment configuration rather than about test data.');
    }
    console.log('  detail: ' + out + '\n');
    await browser.close();
  }
})();
