// Probe 3: list every ng-select's values on a CIBO listing, then Search with no filter and dump the table.
// usage: node cibo-probe3.mjs <menu href after /cibo/> <name>
import { chromium, dump, SCRATCH, ciboLogin } from './cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';

const [p, name] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await ciboLogin(page);
await page.locator(`a[href="/cibo/${p}"]`).first().click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);
const selects = page.locator('ng-select');
const n = await selects.count();
const values = {};
for (let i = 0; i < n; i++) {
  const s = selects.nth(i);
  const label = (await s.getAttribute('formcontrolname')) || (await s.getAttribute('placeholder')) || String(i);
  await s.locator('.ng-select-container').click();
  await page.waitForTimeout(700);
  values[label] = await page.locator('ng-dropdown-panel .ng-option').allInnerTexts();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}
fs.writeFileSync(path.join(SCRATCH, name + '-filters.json'), JSON.stringify(values, null, 1));
console.log(JSON.stringify(values, null, 1));
const search = page.getByRole('button', { name: 'Search', exact: true });
if (await search.count()) {
  await search.first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
}
await page.screenshot({ path: path.join(SCRATCH, name + '-searched.png'), fullPage: true });
const d = await dump(page, name + '-searched');
console.log('HEADERS', JSON.stringify(d.headers));
await browser.close();
