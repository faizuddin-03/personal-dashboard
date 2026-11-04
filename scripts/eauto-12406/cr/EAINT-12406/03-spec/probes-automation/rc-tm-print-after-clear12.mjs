// EAINT-12406 probe 12 (29.10.2026, cr-author sheet RC, RC_TS10 E5 Print): how long Print takes after Clear all on
// Transaction Management (probe 11: its POST …/main-page with no filter had not answered after 60 s). READ ONLY: Clear
// all and Print with window.print() replaced (no dialog). The sign-in request is never logged.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const out = (k, v) => console.log(k, JSON.stringify(v));
const t0 = Date.now();
const ms = () => Date.now() - t0;
const isMain = (r) => r.method() === 'POST' && /\/insurance-transactions\/main-page$/.test(r.url());
page.on('request', (r) => { if (isMain(r)) out('PRINT_REQ', { at: ms() }); });
page.on('requestfinished', async (r) => { if (isMain(r)) out('PRINT_RES', { at: ms(), status: (await r.response())?.status() }); });
page.on('requestfailed', (r) => { if (isMain(r)) out('PRINT_FAILED', { at: ms(), err: r.failure()?.errorText }); });
await ciboLogin(page);
await page.locator('a[href="/cibo/transaction-management"]').first().click();
await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(4000);
await page.getByRole('button', { name: 'Clear all' }).click();
await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(2500);
out('ROWS_AFTER_CLEAR', await page.locator('table tbody tr').count());
await page.evaluate(() => { window.__calls = 0; window.print = () => { window.__calls++; }; });
const c0 = ms();
await page.locator('button').filter({ hasText: /^\s*Print\s*$/ }).filter({ visible: true }).first().click();
for (let i = 0; i < 72; i++) {
  const s = await page.evaluate(() => ({ calls: window.__calls, rows: [...document.querySelectorAll('.d-print-block tr')].length, spinner: [...document.querySelectorAll('.ia-spinner, .spinner-border')].filter((e) => e.offsetParent !== null).length }));
  if (i % 6 === 0 || s.calls) out('T', { since_click: ms() - c0, ...s });
  if (s.calls) break;
  await page.waitForTimeout(5000);
}
await browser.close();
