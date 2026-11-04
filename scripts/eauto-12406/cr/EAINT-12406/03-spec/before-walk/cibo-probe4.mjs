// Probe 4: Transaction Management filtered by one Insurance Company (and optional Platform), Search, read rows.
// usage: node cibo-probe4.mjs <insurer option text> <name> [platform option text] [rowIndexToOpen]
import { chromium, dump, SCRATCH, ciboLogin } from './cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';

const [ins, name, platform, openIdx] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 } });
const page = await ctx.newPage();
await ciboLogin(page);
await page.locator('a[href="/cibo/transaction-management"]').first().click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);

async function pick(control, text) {
  await page.locator(`ng-select[formcontrolname="${control}"] .ng-select-container`).click();
  await page.waitForTimeout(500);
  await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: new RegExp(`^\\s*${text}\\s*$`) }).first().click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}
await pick('insuranceComp', ins);
if (platform && platform !== '-') await pick('platform', platform);
for (const st of (process.env.STATUS || '').split(',').filter(Boolean)) await pick('status', st);
await page.getByRole('button', { name: 'Search', exact: true }).click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(SCRATCH, name + '-list.png'), fullPage: true });
const rows = await page.locator('table tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
const pager = await page.locator('.pagination, ngb-pagination').allInnerTexts().catch(() => []);
fs.writeFileSync(path.join(SCRATCH, name + '-rows.json'), JSON.stringify({ rows, pager }, null, 1));
console.log('rows on page 1:', rows.length, '| pager:', JSON.stringify(pager));
for (const r of rows.slice(0, 25)) console.log(JSON.stringify([r[1], r[2], r[3], r[7], r[11], r[12], r[13], r[14], r[15], r[16]]));

if (openIdx !== undefined && rows.length) {
  const i = Number(openIdx);
  const link = page.locator('table tbody tr').nth(i).locator('td').nth(1).locator('a, span, div').first();
  const [maybeNew] = await Promise.all([
    ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null),
    link.click(),
  ]);
  const dp = maybeNew || page;
  await dp.waitForLoadState('networkidle');
  await dp.waitForTimeout(3000);
  await dp.screenshot({ path: path.join(SCRATCH, name + '-details.png'), fullPage: true });
  const d = await dump(dp, name + '-details');
  console.log('DETAILS URL', d.url);
  console.log(d.text.slice(0, 4000));
  const btns = await dp.locator('button, a.btn').allInnerTexts();
  console.log('BUTTONS', JSON.stringify(btns));
}
await browser.close();
