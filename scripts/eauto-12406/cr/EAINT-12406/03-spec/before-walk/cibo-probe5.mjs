// Probe 5: open a transaction by Ref. No. (Search box), then click Receipt and see what it does (popup, download, modal).
// usage: node cibo-probe5.mjs <RefNo> <name>
import { chromium, dump, SCRATCH, ciboLogin } from './cibo-lib.mjs';
import path from 'node:path';
const [ref, name] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
await ciboLogin(page);
await page.locator('a[href="/cibo/transaction-management"]').first().click();
await page.waitForLoadState('networkidle');
await page.locator('input[formcontrolname="search"]').fill(ref);
await page.getByRole('button', { name: 'Search', exact: true }).click();
await page.waitForLoadState('networkidle'); await page.waitForTimeout(2500);
await page.getByText(ref, { exact: true }).first().click();
await page.waitForLoadState('networkidle'); await page.waitForTimeout(2500);
console.log('details', page.url());
console.log('buttons', JSON.stringify(await page.locator('button, a.btn').allInnerTexts()));
const [pop, dl] = await Promise.all([
  ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null),
  page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
  page.getByRole('button', { name: /Receipt/ }).first().click(),
]);
await page.waitForTimeout(3000);
console.log('popup', pop && pop.url(), '| download', dl && dl.suggestedFilename());
if (dl) await dl.saveAs(path.join(SCRATCH, name + '-receipt-' + dl.suggestedFilename()));
if (pop) { await pop.waitForLoadState().catch(()=>{}); await pop.waitForTimeout(3000); await pop.screenshot({ path: path.join(SCRATCH, name + '-receipt-popup.png'), fullPage: true }); console.log((await pop.evaluate(()=>document.body.innerText)).slice(0,300)); }
await page.screenshot({ path: path.join(SCRATCH, name + '-after-receipt.png'), fullPage: true });
const d = await dump(page, name + '-after-receipt');
console.log(d.url);
await browser.close();
