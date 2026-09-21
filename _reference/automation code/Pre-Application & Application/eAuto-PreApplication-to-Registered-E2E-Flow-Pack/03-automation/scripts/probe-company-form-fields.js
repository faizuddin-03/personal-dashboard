#!/usr/bin/env node
/**
 * WHAT DOES THE CREATE NEW COMPANY ACCOUNT FORM STILL WANT, AND IN WHAT FORMAT?
 *
 *   node scripts/probe-company-form-fields.js NA68001139
 *
 * It opens the record as the approver, presses Create Account, answers the confirmation
 * with Yes — which only NAVIGATES — lands on the form, runs the rig's own
 * fillCompanyForm(), and then reports every control that is still empty, every password
 * field, and the format hints the markup carries (maxlength, pattern, placeholder,
 * inputmode).
 *
 * IT NEVER PRESSES SAVE. Save is the irreversible step: it registers the company and R9
 * then removes the Extend control for ever. This stops one click short of it, so the
 * record is unchanged and the take can still be filmed properly afterwards.
 *
 * WHY IT EXISTS. TS01.8 refused on 30-08 with "Director / Owner Password must at least
 * 6 char." — a field the rig was not filling. Charmain's instruction is that dummy
 * values are fine but must match the field's format, and the only honest way to know
 * the format is to read what the control declares rather than guess at it. Guessing is
 * what produced a postcode typed into `#postcode` when the control is `#postCode`.
 */
const { chromium } = require('@playwright/test');
const { login } = require('../src/login');
const { ROLES } = require('../src/env');
const listing = require('../src/listing');
const application = require('../src/application');
const createAccount = require('../src/createAccount');
const companyAccount = require('../src/companyAccount');

const APP_NO = (process.argv[2] || '').trim();
if (!APP_NO) { console.error('usage: node scripts/probe-company-form-fields.js NA6800XXXX'); process.exit(1); }

(async () => {
  const browser = await chromium.launch({ headless: !process.argv.includes('--headed') });
  const page = await (await browser.newContext()).newPage();
  try {
    const who = await login(page, ROLES.approver);
    console.log(`\n  as ${who.user} (${who.kind})  —  ${APP_NO}\n`);

    const uuid = await listing.openApplication(page, APP_NO);
    await application.goto(page, uuid, application.TAB.regDocs);
    await page.waitForTimeout(1200);

    const opened = await createAccount.open(page);
    console.log(`  Create Account opened a ${opened.kind}`);
    await createAccount.submit(opened.root, page);
    await page.waitForURL(/company-obs\/new\.do/i, { timeout: 30_000 }).catch(() => {});
    if (!companyAccount.onForm(page)) {
      console.error(`  NOT on the company form — the page is ${page.url()}`);
      process.exit(1);
    }
    console.log(`  landed on the form: ${page.url().replace(/^https?:\/\/[^/]+/, '')}\n`);

    const touched = await companyAccount.fillCompanyForm(page);
    console.log('  the rig filled:');
    for (const t of touched) console.log(`    ${JSON.stringify(t)}`);

    const report = await page.evaluate(() => {
      const painted = (e) => {
        const s = getComputedStyle(e);
        if (s.display === 'none' || s.visibility === 'hidden') return false;
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      const labelFor = (e) => {
        if (e.id) {
          const l = document.querySelector(`label[for="${CSS.escape(e.id)}"]`);
          if (l) return (l.innerText || '').trim().slice(0, 40);
        }
        const p = e.closest('div, td, li');
        const t = p ? (p.innerText || '').trim().split('\n')[0] : '';
        return t.slice(0, 40);
      };
      const describe = (e) => ({
        id: e.id || '', name: e.getAttribute('name') || '',
        tag: e.tagName.toLowerCase(), type: e.getAttribute('type') || '',
        value: e.type === 'password' ? (e.value ? '(set)' : '') : String(e.value || '').slice(0, 30),
        maxlength: e.getAttribute('maxlength') || '',
        pattern: e.getAttribute('pattern') || '',
        placeholder: e.getAttribute('placeholder') || '',
        inputmode: e.getAttribute('inputmode') || '',
        required: e.hasAttribute('required'),
        label: labelFor(e),
      });
      const all = [...document.querySelectorAll('input, select, textarea')].filter(painted);
      return {
        total: all.length,
        passwords: all.filter((e) => e.type === 'password').map(describe),
        empty: all.filter((e) => e.type !== 'password' && e.type !== 'hidden' && e.type !== 'file'
                                 && !String(e.value || '').trim()).map(describe),
        files: all.filter((e) => e.type === 'file').map(describe),
      };
    });

    console.log(`\n  ---- PASSWORD FIELDS (${report.passwords.length}) ----`);
    for (const f of report.passwords) {
      console.log(`    #${f.id || '(no id)'}  name=${JSON.stringify(f.name)}  value=${f.value || '(EMPTY)'}`);
      console.log(`       label=${JSON.stringify(f.label)}  maxlength=${f.maxlength || '-'}  pattern=${f.pattern || '-'}`);
    }

    console.log(`\n  ---- STILL EMPTY, NOT A PASSWORD (${report.empty.length}) ----`);
    for (const f of report.empty) {
      console.log(`    #${f.id || '(no id)'}  ${f.tag}${f.type ? `[${f.type}]` : ''}  label=${JSON.stringify(f.label)}`);
      const hints = [f.maxlength && `maxlength=${f.maxlength}`, f.pattern && `pattern=${f.pattern}`,
        f.placeholder && `placeholder=${JSON.stringify(f.placeholder)}`, f.inputmode && `inputmode=${f.inputmode}`]
        .filter(Boolean).join('  ');
      if (hints) console.log(`       ${hints}`);
    }

    console.log(`\n  ---- FILE INPUTS (${report.files.length}) ----`);
    for (const f of report.files) console.log(`    #${f.id || '(no id)'}  label=${JSON.stringify(f.label)}`);

    console.log(`\n  ${report.total} painted control(s) on the form.`);

    if (!process.argv.includes('--try-save')) {
      console.log('\n  SAVE WAS NOT PRESSED. The record is untouched and TS01.8 can still be filmed.');
      console.log('  Pass --try-save to ask the form whether it is satisfied, WITHOUT creating anything.');
      return;
    }

    /* ---------------------------------------------------------------------
     * ASK THE FORM WHETHER IT IS SATISFIED — WITHOUT CREATING ANYTHING.
     *
     * This form answers in exactly two ways, and TS37/TS40/TS01.8 have shown both:
     *
     *   alert:   "Director / Owner Password must at least 6 char."   -> REFUSED
     *   confirm: "Sure to create ?"                                  -> SATISFIED
     *
     * A confirm means validation PASSED and the page is asking to proceed. Answering
     * NO aborts it, so pressing Save and dismissing the confirm tells us the form is
     * complete while creating nothing. That is the whole trick here.
     *
     * EVERY dialog is DISMISSED — never accepted. Dismissing a confirm is "No".
     *
     * And it is verified afterwards rather than assumed: the record is re-read from the
     * listing, and if it has become Registered this probe says so loudly. A safety
     * claim nobody checks is the kind that turns out to be false once. */
    console.log('\n  ---- asking the form, dismissing whatever it says ----');
    const seen = [];
    page.on('dialog', async (d) => {
      seen.push(`${d.type()}: ${d.message().replace(/\s+/g, ' ').trim()}`);
      await d.dismiss().catch(() => {});
    });

    const save = page.locator('#to-create-company').first();
    if (!(await save.count())) {
      console.log('    no #to-create-company control on the form');
      return;
    }
    await save.click({ timeout: 15_000 }).catch((e) => console.log(`    Save threw: ${String(e).split('\n')[0]}`));
    await page.waitForTimeout(3000);

    console.log(`    the form said: ${seen.length ? JSON.stringify(seen) : '(nothing)'}`);
    const refusals = seen.filter((a) => /^alert:/i.test(a));
    const confirms = seen.filter((a) => /^confirm:/i.test(a));

    if (refusals.length) {
      console.log('\n    STILL REFUSING. Fix this and ask again:');
      refusals.forEach((r) => console.log(`      ${r}`));
    } else if (confirms.length) {
      console.log('\n    THE FORM IS SATISFIED — it went straight to the confirmation, which is what');
      console.log('    TS37 and TS40 show on the runs that registered. It was answered NO, so nothing');
      console.log('    was created. TS01.8 can now be filmed and its Save will land.');
    } else {
      console.log('\n    NOTHING WAS SAID AT ALL, which is the state this form was in before anyone');
      console.log('    listened for dialogs. Do not read that as success.');
    }

    // THE SAFETY CHECK, MEASURED. Dismissing a confirm SHOULD abort — verify it did.
    const row = await listing.findByApplicationNo(page, APP_NO).catch(() => null);
    const hardcopy = row ? String(row.hardcopyAccCreated || row.hardcopyDoc || '') : '(could not re-read)';
    console.log(`\n    record after this probe: Hardcopy & Acc Created = ${JSON.stringify(hardcopy)}`);
    if (/registered/i.test(hardcopy)) {
      console.log('    *** THIS PROBE CREATED THE ACCOUNT. Dismissing the confirm did NOT abort.');
      console.log('    *** The record is spent and R9 has removed the Extend control. Do not run this again.');
      process.exitCode = 1;
    } else {
      console.log('    unchanged — nothing was created, as intended.');
    }
  } finally {
    await browser.close();
  }
})();
