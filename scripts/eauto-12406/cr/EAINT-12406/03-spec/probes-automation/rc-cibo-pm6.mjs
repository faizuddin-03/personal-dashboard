// EAINT-12406 probe 6 (29.10.2026, cr-author sheet RC): Payment Listing, BR69005852 searched with no filter, then
// with only the payment date, then with only the channel group. READ ONLY (searches). Values masked.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const out = (k, v) => console.log(k, JSON.stringify(v));
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
const exact = (t) => new RegExp('^\\s*' + t + '\\s*$');
async function pickDate(control, y, m, d) {
  await page.locator(`input[formcontrolname="${control}"]`).click();
  const dp = page.locator('ngb-datepicker').filter({ visible: true }).first();
  await dp.locator("select[title='Select year'], select[aria-label='Select year']").selectOption(String(y));
  await dp.locator("select[title='Select month'], select[aria-label='Select month']").selectOption(String(m));
  await dp.locator('[ngbdatepickerdayview]:not(.outside), .ngb-dp-day:not(.hidden) .btn-light:not(.outside)').filter({ hasText: exact(String(d)) }).first().click();
}
const rows = () => page.evaluate(() => { const heads = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.trim()); return [...document.querySelectorAll('table tbody tr')].slice(0, 3).map((tr) => Object.fromEntries([...tr.children].map((td, i) => [heads[i] || 'c' + i, td.innerText.replace(/\s+/g, ' ').trim().replace(/[0-9]/g, '9').slice(0, 60)]).filter(([h]) => !/Insured|Payee|Vehicle/.test(h)))); });
async function search() {
  const req = page.waitForRequest((r) => r.method() === 'POST' && /\/page(\?|$)/.test(r.url()), { timeout: 60000 });
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const res = await (await req).response();
  await settle(3000);
  out('SEARCH_STATUS', [res && res.status(), (await res.text().catch(() => '')).replace(/[0-9]/g, '9').slice(0, 300)]);
}
const rowsAll = () => page.locator('table tbody tr').allInnerTexts();
async function fresh() { await page.locator('a[href="/cibo/dashboard"]').first().click(); await settle(2000); await page.locator('a[href="/cibo/payment-management"]').first().click(); await settle(15000); }
await ciboLogin(page);
await fresh();
await page.locator('input[formcontrolname="search"]').fill('BR69005852');
await search();
out('NO_FILTER', await rows()); out('NO_FILTER_TEXT', (await rowsAll()).map((t) => t.replace(/[0-9]/g, '9').slice(0, 200)));
await fresh();
await pickDate('toPaymentDate', 2026, 9, 17); await pickDate('fromPaymentDate', 2026, 9, 17);
await page.locator('input[formcontrolname="search"]').fill('BR69005852');
await search();
out('DATE_ONLY', await rows());
await fresh();
await page.locator('ng-select[formcontrolname="selectedBank"] .ng-select-container').click();
await page.locator('ng-dropdown-panel .ng-optgroup').filter({ hasText: exact('FPX Online Banking') }).first().click();
await page.keyboard.press('Escape');
await page.locator('input[formcontrolname="search"]').fill('BR69005852');
await search();
out('FPX_GROUP_ONLY', await rows());
await browser.close();
