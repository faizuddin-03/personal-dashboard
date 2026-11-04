// EAINT-12406 probe (28.10.2026, for src/pages/secarang/home.page.ts): read the home form's input attributes on
// both tabs. Read only: nothing typed except the site password, Get quotation never pressed.
import { chromium, siteGate } from '../before-walk/cibo-lib.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await siteGate(page);
await page.locator('ngb-modal-window').first().waitFor({ timeout: 8000 }).catch(() => {});
console.log('MODAL', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('ngb-modal-window button, ngb-modal-window [aria-label]')].map((b) => [b.tagName, b.className, b.getAttribute('aria-label'), (b.innerText || '').trim()]))));
const x = page.locator('ngb-modal-window button.close, ngb-modal-window [aria-label="Close"], ngb-modal-window .btn-close').first();
if (await x.isVisible().catch(() => false)) await x.click(); else await page.keyboard.press('Escape');
await page.locator('ngb-modal-window').first().waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
const dump = () => page.evaluate(() => [...document.querySelectorAll('input')].filter((i) => i.offsetParent).map((i) => ({
  fcn: i.getAttribute('formcontrolname'), name: i.name, id: i.id, type: i.type, ph: i.placeholder, form: !!i.closest('form'),
  label: (i.closest('div')?.innerText || '').trim().slice(0, 40) })));
console.log('PRIVATE', JSON.stringify(await dump()));
await page.getByText('Company Car', { exact: true }).first().click(); await page.waitForTimeout(800);
console.log('COMPANY', JSON.stringify(await dump()));
await browser.close();
