// Probe 2: open a CIBO page with the saved session and dump its controls.
// usage: node cibo-probe2.mjs <menu href after /cibo/> <name>
import { chromium, dump, SCRATCH, ciboLogin } from './cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';

const [p, name] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, });
const page = await ctx.newPage();
await ciboLogin(page);
await page.locator(`a[href="/cibo/${p}"]`).first().click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(SCRATCH, name + '.png'), fullPage: true });
await dump(page, name);
const controls = await page.evaluate(() =>
  [...document.querySelectorAll('input, select, button, ng-select, mat-select, [role=combobox], label')].map((el) => ({
    tag: el.tagName, type: el.getAttribute('type'), cls: (el.className || '').toString().slice(0, 60),
    placeholder: el.getAttribute('placeholder'), formcontrol: el.getAttribute('formcontrolname'),
    text: (el.innerText || el.value || '').trim().slice(0, 80),
  })));
fs.writeFileSync(path.join(SCRATCH, name + '-controls.json'), JSON.stringify(controls, null, 1));
console.log(page.url());
await browser.close();
