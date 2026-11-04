// CIBO map 28.10.2026: discovery pass, read only. Clicks sidebar links only; dumps structure to scratch.
import { chromium, ciboLogin, SCRATCH, env } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUTD = path.join(SCRATCH, 'cibo-map-discover');
fs.mkdirSync(OUTD, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 } });
const page = await ctx.newPage();
const net = [];
page.on('response', (r) => { if (r.url().includes('/ins-api')) net.push([r.request().method(), r.status(), r.url().replace(/\?.*/, ''), Date.now()]); });
const r = await ciboLogin(page);
console.log('login ->', r.url);
const menu = await page.evaluate(() => [...document.querySelectorAll('a[href^="/cibo/"]')].map((a) => [a.innerText.trim(), a.getAttribute('href')]));
console.log(JSON.stringify(menu));
const routes = process.argv.slice(2).length ? process.argv.slice(2) : [...new Set(menu.map((m) => m[1].replace('/cibo/', '')))];
const e = env();
for (const rt of routes) {
  const t0 = Date.now();
  net.length = 0;
  await page.locator(`a[href="/cibo/${rt}"]`).first().click().catch((err) => console.log('noclick', rt, err.message));
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(5000);
  const d = await page.evaluate(() => ({
    url: location.href,
    h: [...document.querySelectorAll('h1,h2,h3,h4,h5,.card-title,.page-title')].map((x) => x.innerText.trim()).filter(Boolean),
    th: [...document.querySelectorAll('table')].map((t) => [...t.querySelectorAll('thead th, thead td')].map((x) => x.innerText.trim())),
    rows: [...document.querySelectorAll('table tbody tr')].length,
    buttons: [...document.querySelectorAll('button, a.btn, [role=button]')].map((b) => (b.innerText || b.getAttribute('title') || b.getAttribute('aria-label') || b.className).trim().slice(0, 60)).filter(Boolean),
    ngselects: [...document.querySelectorAll('ng-select')].map((s) => [s.getAttribute('formcontrolname'), s.innerText.trim().slice(0, 80)]),
    inputs: [...document.querySelectorAll('input, select, textarea')].map((i) => [i.tagName, i.type, i.getAttribute('formcontrolname'), i.getAttribute('placeholder'), i.readOnly]),
    labels: [...document.querySelectorAll('label')].map((l) => l.innerText.trim()).filter(Boolean),
    pag: [...document.querySelectorAll('.pagination, ngb-pagination, pagination-controls, .page-info')].map((p) => p.innerText.replace(/\s+/g, ' ').trim()),
    text: document.body.innerText,
  }));
  d.ms = Date.now() - t0;
  d.api = net.map((n) => n.slice(0, 3));
  let s = JSON.stringify(d, null, 1);
  if (e.CIBO_PASSWORD) s = s.split(e.CIBO_PASSWORD).join('***');
  fs.writeFileSync(path.join(OUTD, rt + '.json'), s);
  await page.screenshot({ path: path.join(OUTD, rt + '.png'), fullPage: true });
  console.log(rt, d.url, d.ms + 'ms', 'tables', JSON.stringify(d.th), 'rows', d.rows);
}
await browser.close();
