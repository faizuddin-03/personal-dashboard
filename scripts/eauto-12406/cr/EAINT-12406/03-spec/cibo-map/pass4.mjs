// CIBO map 28.10.2026, pass 4 (read only). Scratch output only.
//  node pass4.mjs misc     -> datepicker shape, Discount / Agent / Visitor / User later pages, CRM customer detail
//  node pass4.mjs reports  -> Payment Management default search; Payment Report + Commission Report with Insurance Company = Allianz
import { chromium, ciboLogin, SCRATCH, env } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUTD = path.join(SCRATCH, 'cibo-map-pass4');
fs.mkdirSync(OUTD, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 } });
const page = await ctx.newPage();
const nonGet = [];
page.on('request', (r) => { if (r.url().includes('/ins-api') && !r.url().includes('/authenticate') && r.method() !== 'GET') nonGet.push([r.method(), r.url().replace('https://staging.secarang.com', ''), (r.postData() || '').slice(0, 500), Date.now()]); });
await ciboLogin(page);
const E = env();
const save = (name, obj) => { let s = JSON.stringify(obj, null, 1); if (E.CIBO_PASSWORD) s = s.split(E.CIBO_PASSWORD).join('***'); fs.writeFileSync(path.join(OUTD, name + '.json'), s); };
const settle = async (ms = 2500, to = 240000) => { await page.waitForLoadState('networkidle', { timeout: to }).catch(() => {}); await page.waitForTimeout(ms); };
const waitSpinner = async (to = 300000) => { const t0 = Date.now(); while (Date.now() - t0 < to) { if (!(await page.locator('.ia-spinner, .spinner-border').count())) break; await page.waitForTimeout(1000); } return Date.now() - t0; };
const go = async (rt) => { await page.locator(`a[href="/cibo/${rt}"]`).first().click(); await settle(); };
const search = async () => { const t0 = Date.now(); await page.getByRole('button', { name: 'Search', exact: true }).first().click(); await page.waitForTimeout(1500); await waitSpinner(); await settle(1500); return Date.now() - t0; };
const tableInfo = () => page.evaluate(() => {
  const t = document.querySelector('table');
  if (!t) return null;
  const rows = [...t.querySelectorAll('tbody tr')];
  const clickables = rows.slice(0, 2).map((r) => [...r.querySelectorAll('td *, td')].filter((el) => getComputedStyle(el).cursor === 'pointer' || el.tagName === 'A' || el.tagName === 'BUTTON').map((el) => [el.tagName, el.getAttribute('href') || '', (el.innerText || '').trim().slice(0, 40)]));
  return { headers: [...t.querySelectorAll('thead th')].map((x) => x.innerText.trim()), rows: rows.map((r) => [...r.querySelectorAll('td')].map((c) => c.innerText.trim().replace(/\s+/g, ' '))), clickables, pag: [...document.querySelectorAll('ngb-pagination')].map((p) => p.innerText.replace(/\s+/g, ' ').trim())[0] || '', text: document.body.innerText.slice(0, 3000) };
});
async function pick(control, text) {
  await page.locator(`ng-select[formcontrolname="${control}"] .ng-select-container`).click();
  await page.waitForTimeout(800);
  await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: new RegExp(`^\\s*${text}\\s*$`) }).first().click();
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
}
async function gotoPage(n) { await page.locator('ngb-pagination a.page-link').filter({ hasText: new RegExp(`^\\s*${n}\\s*`) }).first().click(); await page.waitForTimeout(1500); await waitSpinner(); await settle(1000); }
const step = process.argv[2];

if (step === 'misc') {
  await go('referred-risk-log');
  await page.locator('input[formcontrolname="fromLogDate"]').click(); await page.waitForTimeout(1000);
  const dp = await page.evaluate(() => { const d = document.querySelector('ngb-datepicker, .ngb-dp, bs-datepicker-container, mat-calendar, .owl-dt-container, [class*=datepicker]'); return d ? { tag: d.tagName, cls: String(d.className), html: d.outerHTML.replace(/<!--.*?-->/g, '').replace(/_ngcontent-[a-z0-9-]+=""/g, '').slice(0, 2500), selects: [...d.querySelectorAll('select')].map((s) => [s.getAttribute('aria-label') || s.title, [...s.options].map((o) => o.value).slice(0, 15)]) } : null; });
  save('datepicker', dp);
  await page.screenshot({ path: path.join(OUTD, 'datepicker.png') });
  console.log('DP', dp && dp.tag, dp && dp.cls, JSON.stringify(dp && dp.selects));
  await page.keyboard.press('Escape');
  for (const [rt, pages] of [['discount-management', [2, 3]], ['agent-management', [2]], ['visitor-management', [2, 3]], ['user-account-management', [2, 3, 4]]]) {
    await go(rt); await search();
    const all = [(await tableInfo()).rows];
    for (const n of pages) { await gotoPage(n); all.push((await tableInfo()).rows); }
    save(rt + '-allpages', all);
    console.log(rt, all.map((a) => a.length));
  }
  await go('crm'); const ms = await search();
  const ti = await tableInfo(); save('crm-list', ti);
  console.log('CRM search ms', ms, ti.pag);
  await page.locator('table tbody tr a[href*="customer-details"]').first().click(); await settle(4000); await waitSpinner();
  const det = await page.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(document.body.innerText.indexOf('Logout')), buttons: [...document.querySelectorAll('button, a.btn')].map((b) => b.innerText.trim()), links: [...document.querySelectorAll('a')].map((a) => [a.innerText.trim().slice(0, 40), a.getAttribute('href')]).filter((l) => l[1] && !/^\/cibo\/(dashboard|user-account|crm$|transaction-management$|payment|referred|commission|visitor|agent|discount|macrokiosk|auth)/.test(l[1])), tables: [...document.querySelectorAll('table')].map((t) => [...t.querySelectorAll('thead th')].map((x) => x.innerText.trim())), tabs: [...document.querySelectorAll('[role=tab], .nav-tabs .nav-link')].map((t) => t.innerText.trim()), inputs: [...document.querySelectorAll('input,select,textarea')].map((i) => [i.type, i.getAttribute('formcontrolname'), i.disabled, i.readOnly]) }));
  save('crm-detail', det);
  await page.screenshot({ path: path.join(OUTD, 'crm-detail.png'), fullPage: true });
  console.log('CRM detail tables', JSON.stringify(det.tables), 'tabs', JSON.stringify(det.tabs), 'buttons', JSON.stringify(det.buttons), 'links', JSON.stringify(det.links.map((l) => l[1].replace(/\d{6,}/g, '<n>'))).slice(0, 800));
  console.log('NON-GET', JSON.stringify(nonGet.map((n) => [n[0], n[1]])));
}

if (step === 'reports') {
  await go('payment-management'); await waitSpinner(); await settle(2000);
  let ti = await tableInfo();
  console.log('PM on arrival', ti && ti.pag, ti && ti.rows.length, JSON.stringify(ti && ti.headers));
  let ms = await search(); ti = await tableInfo(); save('pm-default', { ms, ...ti });
  console.log('PM search', ms, ti && ti.pag, JSON.stringify(ti && ti.headers), JSON.stringify(ti && ti.clickables));
  await go('payment-report'); await pick('insuranceComp', 'Allianz');
  ms = await search(); ti = await tableInfo(); save('pr-allianz', { ms, ...ti });
  console.log('PR Allianz', ms, ti && ti.pag, ti && ti.rows.length, JSON.stringify(ti && ti.headers), JSON.stringify(ti && ti.clickables));
  await go('commission-report'); await pick('insuranceComp', 'Allianz');
  ms = await search(); ti = await tableInfo(); save('cr-allianz', { ms, ...ti });
  console.log('CR Allianz', ms, ti && ti.pag, ti && ti.rows.length, JSON.stringify(ti && ti.headers));
  console.log('NON-GET', JSON.stringify(nonGet.map((n) => [n[0], n[1], n[2].slice(0, 200)])));
}
await browser.close();
