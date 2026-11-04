// EAINT-12406 probe 5 (29.10.2026, cr-author sheet RC): what a ticked filter looks like in the ng-select (the chip
// markup), what "Clear all" empties, and a Payment Listing search with a channel group ticked. READ ONLY: filters,
// searches and Clear all only. Values masked.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const out = (k, v) => console.log(k, JSON.stringify(v));
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
const exact = (t) => new RegExp('^\\s*' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$');
async function pickOpt(control, text) {
  await page.locator(`ng-select[formcontrolname="${control}"] .ng-select-container`).click();
  await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: exact(text) }).first().click();
  await page.keyboard.press('Escape');
}
async function pickDate(control, y, m, d) {
  await page.locator(`input[formcontrolname="${control}"]`).click();
  const dp = page.locator('ngb-datepicker').filter({ visible: true }).first();
  await dp.locator("select[title='Select year'], select[aria-label='Select year']").selectOption(String(y));
  await dp.locator("select[title='Select month'], select[aria-label='Select month']").selectOption(String(m));
  await dp.locator('[ngbdatepickerdayview]:not(.outside), .ngb-dp-day:not(.hidden) .btn-light:not(.outside)').filter({ hasText: exact(String(d)) }).first().click();
}
const state = () => page.evaluate(() => ({
  selects: [...document.querySelectorAll('ng-select')].map((s) => ({ fcn: s.getAttribute('formcontrolname'), chips: [...s.querySelectorAll('.ng-value')].map((v) => ({ cls: v.className, text: v.innerText.trim() })), hasValueCls: s.classList.contains('ng-select-filtered') || s.classList.contains('ng-has-value') })),
  inputs: [...document.querySelectorAll('input[formcontrolname]')].map((i) => ({ fcn: i.getAttribute('formcontrolname'), value: i.value.replace(/[0-9]/g, '9') })),
}));
await ciboLogin(page);
await page.locator('a[href="/cibo/transaction-management"]').first().click(); await settle(4000);
await pickOpt('platform', 'Secarang');
await pickOpt('insuranceComp', 'Allianz');
await pickOpt('dateRange', 'Transaction Creation Date');
await pickDate('toDate', 2025, 5, 9); await pickDate('fromDate', 2025, 5, 9);
await pickOpt('status', 'Insurance created');
await page.locator('input[formcontrolname="search"]').fill('BR55004010');
out('CHIP_HTML', await page.locator('ng-select[formcontrolname="insuranceComp"] .ng-value').first().evaluate((e) => e.outerHTML.slice(0, 400)).catch((e) => String(e)));
out('STATE_FILLED', await state());
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(5000);
out('ROWS_AFTER_SEARCH', await page.locator('table tbody tr').count());
await page.getByRole('button', { name: 'Clear all' }).click(); await settle(2500);
out('STATE_CLEARED', await state());
out('ROWS_AFTER_CLEAR', await page.locator('table tbody tr').count());
out('PRINT_AFTER_CLEAR', await page.locator('button').filter({ hasText: /^\s*Print\s*$/ }).filter({ visible: true }).count());
// Payment Listing: channel group FPX Online Banking, a known payment date of BR69005852 (17.09.2026)
await page.locator('a[href="/cibo/payment-management"]').first().click(); await settle(15000);
await page.locator('ng-select[formcontrolname="selectedBank"] .ng-select-container').click();
await page.locator('ng-dropdown-panel .ng-optgroup').filter({ hasText: exact('FPX Online Banking') }).first().click();
await page.keyboard.press('Escape');
out('PM_DATE_INPUTS', await page.evaluate(() => [...document.querySelectorAll('input[formcontrolname]')].map((i) => [i.getAttribute('formcontrolname'), i.value.replace(/[0-9]/g, '9')])));
await pickDate('toPaymentDate', 2026, 9, 17); await pickDate('fromPaymentDate', 2026, 9, 17);
await page.locator('input[formcontrolname="search"]').fill('BR69005852');
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(10000);
out('PM_ROW', await page.evaluate(() => { const heads = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.trim()); return [...document.querySelectorAll('table tbody tr')].slice(0, 2).map((tr) => [...tr.children].map((td, i) => [heads[i], td.innerText.replace(/\s+/g, ' ').trim().replace(/[0-9]/g, '9').slice(0, 60)]).filter(([h]) => /Channel|Payment Ref|Response|Transaction Ref|^Payment$/.test(h))); }));
out('PM_CHIP', await page.locator('ng-select[formcontrolname="selectedBank"] .ng-value').allInnerTexts().catch(() => []));
await browser.close();
