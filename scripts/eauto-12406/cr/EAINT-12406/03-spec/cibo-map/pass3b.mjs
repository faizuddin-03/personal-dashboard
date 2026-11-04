// CIBO map 28.10.2026, pass 3b (read only): Create New user form (opened, never saved), then the rest of pass 3 admin.
import { chromium, ciboLogin, SCRATCH, env } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUTD = path.join(SCRATCH, 'cibo-map-pass3');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 } });
const page = await ctx.newPage();
const nonGet = [];
page.on('request', (r) => { if (r.url().includes('/ins-api') && !r.url().includes('/authenticate') && r.method() !== 'GET') nonGet.push([r.method(), r.url().replace('https://staging.secarang.com', ''), (r.postData() || '').slice(0, 400)]); });
await ciboLogin(page);
const E = env();
const save = (name, obj) => { let s = JSON.stringify(obj, null, 1); if (E.CIBO_PASSWORD) s = s.split(E.CIBO_PASSWORD).join('***'); fs.writeFileSync(path.join(OUTD, name + '.json'), s); };
const settle = async (ms = 2500, to = 180000) => { await page.waitForLoadState('networkidle', { timeout: to }).catch(() => {}); await page.waitForTimeout(ms); };
const waitSpinner = async (to = 240000) => { const t0 = Date.now(); while (Date.now() - t0 < to) { if (!(await page.locator('.ia-spinner, .spinner-border').count())) break; await page.waitForTimeout(1000); } return Date.now() - t0; };
const go = async (rt) => { await page.locator(`a[href="/cibo/${rt}"]`).first().click(); await settle(); };
const search = async () => { const t0 = Date.now(); await page.getByRole('button', { name: 'Search', exact: true }).first().click(); await page.waitForTimeout(1500); await waitSpinner(); await settle(1500); return Date.now() - t0; };
const tableInfo = () => page.evaluate(() => {
  const t = document.querySelector('table');
  if (!t) return null;
  const rows = [...t.querySelectorAll('tbody tr')];
  const clickables = rows.slice(0, 2).map((r) => [...r.querySelectorAll('td *, td')].filter((el) => getComputedStyle(el).cursor === 'pointer' || el.tagName === 'A' || el.tagName === 'BUTTON').map((el) => [el.tagName, el.getAttribute('href') || '', (el.innerText || '').trim().slice(0, 40), (typeof el.className === 'string' ? el.className : '').slice(0, 60)]));
  return { headers: [...t.querySelectorAll('thead th')].map((x) => x.innerText.trim()), rows: rows.map((r) => [...r.querySelectorAll('td')].map((c) => c.innerText.trim().replace(/\s+/g, ' '))), rowHtml0: rows[0] ? rows[0].outerHTML.replace(/<!--.*?-->/g, '').slice(0, 3000) : '', clickables, pag: [...document.querySelectorAll('ngb-pagination')].map((p) => p.innerText.replace(/\s+/g, ' ').trim())[0] || '' };
});
const dateVals = () => page.evaluate(() => [...document.querySelectorAll('input[readonly]')].map((i) => [i.getAttribute('formcontrolname'), i.value]));

await go('user-account-management');
const cn = await page.evaluate(() => { const el = [...document.querySelectorAll('*')].filter((e) => e.childElementCount <= 1 && /Create New/.test(e.innerText || '')).pop(); return el ? [el.tagName, el.className, el.getAttribute('href'), el.outerHTML.slice(0, 300)] : null; });
console.log('CreateNew element', JSON.stringify(cn));
await page.getByText('Create New').first().click(); await settle(2500);
const form = await page.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(document.body.innerText.indexOf('Logout')), buttons: [...document.querySelectorAll('button')].map((b) => b.innerText.trim()), inputs: [...document.querySelectorAll('input,ng-select,select,textarea')].map((i) => [i.tagName, i.type, i.getAttribute('formcontrolname'), i.getAttribute('placeholder'), i.checked]) }));
save('uam-create', form);
await page.screenshot({ path: path.join(OUTD, 'uam-create.png'), fullPage: true });
console.log('CREATE form', form.url, JSON.stringify(form.buttons));
// Pick the "Insurance Company User" role on the unsaved Create form only, to see whether an insurer field appears; never saved.
const icu = page.locator('label', { hasText: 'Insurance Company User' });
if (await icu.count()) {
  await icu.first().click(); await page.waitForTimeout(1500);
  const f2 = await page.evaluate(() => ({ text: document.body.innerText.slice(document.body.innerText.indexOf('Logout')), inputs: [...document.querySelectorAll('input,ng-select,select,textarea')].map((i) => [i.tagName, i.type, i.getAttribute('formcontrolname'), i.getAttribute('placeholder')]) }));
  save('uam-create-insurance-company-user', f2);
  await page.screenshot({ path: path.join(OUTD, 'uam-create-icu.png'), fullPage: true });
  const ngs = await page.locator('ng-select').evaluateAll((els) => els.map((x) => x.getAttribute('formcontrolname')));
  for (const fc of ngs) { await page.locator(`ng-select[formcontrolname="${fc}"] .ng-select-container`).click(); await page.waitForTimeout(1000); console.log('  ng', fc, JSON.stringify(await page.locator('ng-dropdown-panel .ng-option, ng-dropdown-panel .ng-optgroup').allInnerTexts())); await page.keyboard.press('Escape'); }
  console.log('ICU inputs', JSON.stringify(f2.inputs));
}
// leave without saving: sidebar link
await go('referred-risk-log');
const before = await dateVals();
await page.getByText('Clear all', { exact: true }).first().click(); await page.waitForTimeout(1500);
const after = await dateVals();
console.log('RRL dates before', JSON.stringify(before), 'after Clear all', JSON.stringify(after));
const ms2 = await search();
const rrl = await tableInfo();
save('rrl-all', { ms: ms2, before, after, ti: rrl });
console.log('RRL all', ms2, rrl && rrl.pag, rrl && rrl.rows.length, JSON.stringify(rrl && rrl.clickables));
for (const rt of ['agent-management', 'discount-management', 'visitor-management']) {
  await go(rt); const ms = await search();
  const ti2 = await tableInfo();
  save(rt + '-list', { ms, ...ti2 });
  console.log(rt, ms, ti2.pag, ti2.rows.length, JSON.stringify(ti2.clickables));
}
await go('macrokiosk-template-management');
const mk = await page.evaluate(() => ({ text: document.body.innerText, checks: [...document.querySelectorAll('input[type=checkbox]')].map((c) => c.checked), tabs: [...document.querySelectorAll('[role=tab], .nav-link')].map((t) => t.innerText.trim()), html: (document.querySelector('app-macrokiosk-template-management') || document.body).innerHTML.replace(/<!--.*?-->/g, '').slice(0, 8000) }));
save('macrokiosk', mk);
console.log('MK checks', JSON.stringify(mk.checks), 'tabs', JSON.stringify(mk.tabs));
console.log('NON-GET requests', JSON.stringify(nonGet.map((n) => n.slice(0, 2))));
await browser.close();
