// read only: what the Referred Risk Log "Till" picker allows after From = 01-01-2016
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1000 } })).newPage();
await ciboLogin(page);
await page.locator('a[href="/cibo/referred-risk-log"]').first().click(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(2000);
const yearSel = 'ngb-datepicker select[title="Select year"], ngb-datepicker select[aria-label="Select year"]';
const monthSel = 'ngb-datepicker select[title="Select month"], ngb-datepicker select[aria-label="Select month"]';
// default Till picker
await page.locator('input[formcontrolname="toLogDate"]').click(); await page.waitForTimeout(800);
console.log('default Till years', JSON.stringify(await page.locator(yearSel).evaluate((s) => [...s.options].map((o) => o.value))));
await page.keyboard.press('Escape');
await page.locator('input[formcontrolname="fromLogDate"]').click(); await page.waitForTimeout(800);
console.log('default From years', JSON.stringify(await page.locator(yearSel).evaluate((s) => [...s.options].map((o) => o.value))));
await page.locator(yearSel).selectOption('2025'); await page.locator(monthSel).selectOption('1'); await page.waitForTimeout(400);
await page.locator('ngb-datepicker [ngbdatepickerdayview], ngb-datepicker .btn-light').filter({ hasText: /^\s*1\s*$/ }).first().click(); await page.waitForTimeout(800);
console.log('after From=01-01-2025', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('input[readonly]')].map((i) => i.value))));
await page.locator('input[formcontrolname="toLogDate"]').click(); await page.waitForTimeout(800);
const info = await page.evaluate(() => { const d = document.querySelector('ngb-datepicker'); const ys = d.querySelector('select[title="Select year"], select[aria-label="Select year"]'); const ms = d.querySelector('select[title="Select month"], select[aria-label="Select month"]'); return { years: [...ys.options].map((o) => o.value), months: [...ms.options].map((o) => o.value + (o.disabled ? 'x' : '')), disabledDays: [...d.querySelectorAll('.ngb-dp-day.disabled')].map((x) => x.innerText.trim()).join(',') }; });
console.log('Till picker after From set', JSON.stringify(info));
await browser.close();
