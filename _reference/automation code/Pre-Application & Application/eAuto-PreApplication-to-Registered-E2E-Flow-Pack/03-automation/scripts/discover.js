/**
 * Ground-truth capture. Logs in, walks the three surfaces the Extend feature
 * touches, and writes an ARIA snapshot + trimmed HTML for each into ./discovery.
 *
 * It also OPENS the Extend modal and dumps it — and never confirms. Opening is
 * free; confirming would spend the application's one and only extension (R1),
 * so this is how we learn the modal without burning a fixture.
 *
 *   npm run discover -- --app-no NA68001098
 *
 * Nothing here writes to the application. The only click that changes anything
 * is the one this script refuses to make.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { login } = require('../src/login');
const { ROLES, OBS } = require('../src/env');
const listing = require('../src/listing');
const app = require('../src/application');

const OUT = path.resolve(__dirname, '..', 'discovery');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const appNo = arg('app-no', process.env.APP_NO);
const role = arg('role', ROLES.assignee);
const headed = process.argv.includes('--headed');

async function dump(page, name) {
  await fs.mkdir(OUT, { recursive: true });
  const aria = await page.locator('body').ariaSnapshot().catch((e) => `ariaSnapshot failed: ${e.message}`);
  const html = await page.content();
  const text = await page.locator('body').innerText().catch(() => '');
  await fs.writeFile(path.join(OUT, `${name}.aria.yaml`), `# ${page.url()}\n${aria}\n`);
  await fs.writeFile(path.join(OUT, `${name}.txt`), `${page.url()}\n\n${text}\n`);
  await fs.writeFile(path.join(OUT, `${name}.html`), html);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }).catch(() => {});
  console.log(`  captured ${name}  (${page.url()})`);
}

(async () => {
  if (!appNo) {
    console.error('\n  Need an application number: npm run discover -- --app-no NA68001098\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: !headed });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  try {
    const who = await login(page, role);
    console.log(`\n  logged in as ${who.key} (${who.label})`);

    await listing.open(page);
    await dump(page, '01-application-listing-empty');

    const row = await listing.findByApplicationNo(page, appNo);
    await dump(page, '02-application-listing-result');
    console.log('\n  listing row:');
    for (const [k, v] of Object.entries(row)) {
      if (!k.startsWith('_')) console.log(`    ${k.padEnd(22)} ${v}`);
    }

    const uuid = await listing.openApplication(page, appNo);
    console.log(`\n  uuid: ${uuid}`);
    await dump(page, '03-application-tab');

    await page.goto(OBS.registrationDocs(uuid), { waitUntil: 'domcontentloaded' });
    await page.getByText(/Application No:/).first().waitFor();
    await dump(page, '04-registration-documents-tab');

    const side = await app.readSidebar(page);
    console.log('\n  sidebar:');
    for (const [k, v] of Object.entries(side)) {
      if (k !== 'raw') console.log(`    ${k.padEnd(22)} ${v}`);
    }

    const state = await app.extendState(page);
    console.log('\n  Extend button:', JSON.stringify(state, null, 2).replace(/\n/g, '\n  '));

    if (state.present && state.enabled) {
      console.log('\n  opening the Extend modal (will NOT confirm)…');
      const modal = await app.openExtendModal(page);
      await dump(page, '05-extend-modal');
      await fs.writeFile(
        path.join(OUT, '05-extend-modal.json'),
        JSON.stringify({ title: modal.title, text: modal.text, fields: modal.fields, buttons: modal.buttons }, null, 2)
      );
      console.log(`    title:   ${modal.title}`);
      console.log(`    buttons: ${modal.buttons.join(' | ')}`);
      console.log(`    fields:  ${modal.fields.map((f) => `${f.tag}${f.type ? ':' + f.type : ''}${f.name ? '[' + f.name + ']' : ''}`).join(', ')}`);
      await page.keyboard.press('Escape').catch(() => {});
    } else {
      console.log('\n  Extend not open-able in this state — nothing to dump for the modal.');
    }

    await fs.writeFile(
      path.join(OUT, 'summary.json'),
      JSON.stringify({ appNo, uuid, role: who.key, listingRow: row, sidebar: { ...side, raw: undefined }, extend: state }, null, 2)
    );
    console.log(`\n  Everything written to ${OUT}\n`);
  } catch (err) {
    console.error(`\n  FAILED: ${err.message}\n`);
    await dump(page, 'error-state').catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
