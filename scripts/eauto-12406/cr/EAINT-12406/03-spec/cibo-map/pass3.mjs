// CIBO map 28.10.2026, pass 3 (read only): row structure, clickable cells, detail views. Scratch output only.
import { chromium, ciboLogin, SCRATCH, env } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUTD = path.join(SCRATCH, 'cibo-map-pass3');
fs.mkdirSync(OUTD, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 } });
const page = await ctx.newPage();
const net = [];
page.on('request', (r) => { if (r.url().includes('/ins-api') && !r.url().includes('/authenticate')) net.push([r.method(), r.url().replace('https://staging.secarang.com', ''), r.method() !== 'GET' ? (r.postData() || '').slice(0, 400) : '']); });
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
  return {
    headers: [...t.querySelectorAll('thead th')].map((x) => x.innerText.trim()),
    rows: rows.map((r) => [...r.querySelectorAll('td')].map((c) => c.innerText.trim().replace(/\s+/g, ' '))),
    rowHtml0: rows[0] ? rows[0].outerHTML.replace(/<!--.*?-->/g, '').slice(0, 3000) : '',
    clickables,
    pag: [...document.querySelectorAll('ngb-pagination')].map((p) => p.innerText.replace(/\s+/g, ' ').trim())[0] || '',
  };
});
const pageText = () => page.evaluate(() => document.body.innerText);
const dateVals = () => page.evaluate(() => [...document.querySelectorAll('input[readonly]')].map((i) => [i.getAttribute('formcontrolname'), i.value]));
const step = process.argv[2];

if (step === 'admin') {
  // User Account Management: listing, one user detail, Create New form (Cancel)
  await go('user-account-management'); net.length = 0;
  const ms = await search();
  const ti = await tableInfo();
  save('uam-list', { ms, ti });
  console.log('UAM', ms, ti.pag, JSON.stringify(ti.clickables));
  await page.locator('table tbody tr a[href*="user-details"]').first().click(); await settle(3000);
  save('uam-detail', { url: page.url(), text: await pageText(), buttons: await page.locator('button').allInnerTexts(), inputs: await page.evaluate(() => [...document.querySelectorAll('input,ng-select,select,textarea')].map((i) => [i.tagName, i.type, i.getAttribute('formcontrolname'), i.disabled, i.readOnly])) });
  await page.screenshot({ path: path.join(OUTD, 'uam-detail.png'), fullPage: true });
  console.log('UAM detail', page.url(), JSON.stringify(await page.locator('button').allInnerTexts()));
  await go('user-account-management');
  await page.getByRole('button', { name: /Create New/ }).first().click(); await settle(2500);
  save('uam-create', { url: page.url(), text: await pageText(), buttons: await page.locator('button').allInnerTexts(), inputs: await page.evaluate(() => [...document.querySelectorAll('input,ng-select,select,textarea')].map((i) => [i.tagName, i.type, i.getAttribute('formcontrolname'), i.getAttribute('placeholder')])) });
  await page.screenshot({ path: path.join(OUTD, 'uam-create.png'), fullPage: true });
  console.log('UAM create', page.url(), JSON.stringify(await page.locator('button').allInnerTexts()));
  const cancel = page.getByRole('button', { name: /Cancel|Back|Close/i });
  if (await cancel.count()) { await cancel.first().click(); await settle(1500); console.log('cancelled ->', page.url()); }

  // Referred Risk Log: default dates, Clear all effect
  await go('referred-risk-log');
  const before = await dateVals();
  await page.getByText('Clear all', { exact: true }).first().click(); await page.waitForTimeout(1500);
  const after = await dateVals();
  console.log('RRL dates before', JSON.stringify(before), 'after Clear all', JSON.stringify(after));
  net.length = 0;
  const ms2 = await search();
  const rrl = await tableInfo();
  save('rrl-all', { ms: ms2, before, after, ti: rrl, api: net.slice() });
  console.log('RRL all', ms2, rrl.pag, rrl.rows.length, JSON.stringify(rrl.clickables), JSON.stringify(net.filter((n) => n[0] !== 'GET')));

  // Agent Management + Discount Code: rows, clickables
  for (const rt of ['agent-management', 'discount-management']) {
    await go(rt); await search();
    const ti2 = await tableInfo();
    save(rt + '-list', ti2);
    console.log(rt, ti2.pag, ti2.rows.length, JSON.stringify(ti2.clickables));
  }
  // Macrokiosk: checkbox states, tabs, any other text
  await go('macrokiosk-template-management');
  const mk = await page.evaluate(() => ({ text: document.body.innerText, checks: [...document.querySelectorAll('input[type=checkbox]')].map((c) => c.checked), tabs: [...document.querySelectorAll('[role=tab], .nav-link, .nav-item')].map((t) => t.innerText.trim()), html: document.querySelector('app-macrokiosk-template-management, main, .content')?.innerHTML.replace(/<!--.*?-->/g, '').slice(0, 6000) }));
  save('macrokiosk', mk);
  console.log('MK checks', JSON.stringify(mk.checks), 'tabs', JSON.stringify(mk.tabs));
}

if (step === 'crm') {
  await go('crm'); net.length = 0;
  const ms = await search();
  const ti = await tableInfo();
  save('crm-list', { ms, ti, api: net.slice() });
  console.log('CRM', ms, ti && ti.pag, ti && ti.rows.length, JSON.stringify(ti && ti.headers), JSON.stringify(ti && ti.clickables));
}
await browser.close();
