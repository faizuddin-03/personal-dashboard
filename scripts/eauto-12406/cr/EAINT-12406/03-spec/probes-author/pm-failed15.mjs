// EAINT-12406 probe 15 (29.10.2026 evening, cr-author, TS v6 E2E_TS5 E2). READ ONLY: CIBO Payment Management, the
// payments of BR60006353 (E2E_TS5's run of 29.10: FPX failed 51, SPayLater cancelled, FPX paid) searched by Ref. No.
// with no filter, then with Payment Status "Failed". Prints the column headers, every row (Insured / Vehicle masked)
// and the Payment Status filter's options. Searches only: nothing is changed.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
const REF = process.argv[2] || 'BR60006353';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const out = (k, v) => console.log(k, JSON.stringify(v));
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
const exact = (t) => new RegExp('^\\s*' + t + '\\s*$');
const rows = () => page.evaluate(() => {
  const heads = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.replace(/\s+/g, ' ').trim());
  return { heads, rows: [...document.querySelectorAll('table tbody tr')].map((tr) => Object.fromEntries([...tr.children].map((td, i) => [heads[i] || 'c' + i, (/Insured/.test(heads[i] || '') || (/Vehicle/.test(heads[i] || '') && !/^HXA/.test(td.innerText.trim()))) ? '<masked>' : td.innerText.replace(/\s+/g, ' ').trim().slice(0, 120)]))) };
});
async function search() {
  const req = page.waitForRequest((r) => r.method() === 'POST' && /\/page(\?|$)/.test(r.url()), { timeout: 60000 });
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const res = await (await req).response();
  await settle(3000);
  out('SEARCH_STATUS', res && res.status());
}
async function fresh() { await page.locator('a[href="/cibo/dashboard"]').first().click(); await settle(2000); await page.locator('a[href="/cibo/payment-management"]').first().click(); await settle(15000); }
await ciboLogin(page);
await fresh();
await page.locator('input[formcontrolname="search"]').fill(REF);
await search();
out('BY_REF_NO_FILTER', await rows());
await fresh();
await page.locator('ng-select[formcontrolname="selectedPaymentStatus"] .ng-select-container').click();
await page.waitForTimeout(800);
out('STATUS_OPTIONS', await page.locator('ng-dropdown-panel .ng-option').allInnerTexts());
await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: exact('Failed') }).first().click();
await page.keyboard.press('Escape');
await page.locator('input[formcontrolname="search"]').fill(REF);
await search();
out('BY_REF_FAILED', await rows());
// by plate (our own made-up plate, not personal data), no filter, then Failed only
const PLATE = process.argv[3] || 'HXA0015A';
await fresh();
await page.locator('input[formcontrolname="search"]').fill(PLATE);
await search();
out('BY_PLATE_NO_FILTER', await rows());
await fresh();
await page.locator('ng-select[formcontrolname="selectedPaymentStatus"] .ng-select-container').click();
await page.waitForTimeout(800);
await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: exact('Failed') }).first().click();
await page.keyboard.press('Escape');
await page.locator('input[formcontrolname="search"]').fill(PLATE);
await search();
out('BY_PLATE_FAILED', await rows());
// Failed only, no text: the first rows (to see what a Failed row looks like)
await fresh();
await page.locator('ng-select[formcontrolname="selectedPaymentStatus"] .ng-select-container').click();
await page.waitForTimeout(800);
await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: exact('Failed') }).first().click();
await page.keyboard.press('Escape');
await search();
const all = await rows();
out('FAILED_ONLY_FIRST5', { heads: all.heads, rows: all.rows.slice(0, 5) });
await browser.close();
