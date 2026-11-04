// CIBO map 28.10.2026, pass 2 (read only): dropdown values, then [Search] with default filters; columns, paging, row actions.
// Logs every /ins-api request method so we can prove nothing but reads were sent. Output to scratch only (personal data).
import { chromium, ciboLogin, SCRATCH, env } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUTD = path.join(SCRATCH, 'cibo-map-pass2');
fs.mkdirSync(OUTD, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 } });
const page = await ctx.newPage();
const net = [];
page.on('request', (r) => { if (r.url().includes('/ins-api') && !r.url().includes('/authenticate')) net.push({ m: r.method(), u: r.url(), body: r.method() !== 'GET' ? (r.postData() || '').slice(0, 300) : undefined, t: Date.now() }); });
page.on('response', (r) => { const n = net.find((x) => x.u === r.url() && !x.s); if (n) { n.s = r.status(); n.dt = Date.now() - n.t; } });
await ciboLogin(page);
const e = env();
const routes = process.argv.slice(2);
for (const rt of routes) {
  net.length = 0;
  await page.locator(`a[href="/cibo/${rt}"]`).first().click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(3000);
  const out = { route: rt, dropdowns: {} };
  for (const fc of await page.locator('ng-select').evaluateAll((els) => els.map((x) => x.getAttribute('formcontrolname')))) {
    await page.locator(`ng-select[formcontrolname="${fc}"] .ng-select-container`).click();
    await page.waitForTimeout(1000);
    out.dropdowns[fc] = await page.evaluate(() => [...document.querySelectorAll('ng-dropdown-panel .ng-optgroup, ng-dropdown-panel .ng-option')].map((o) => (o.classList.contains('ng-optgroup') ? '[group] ' : '') + o.innerText.trim()));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  const t0 = Date.now();
  const sb = page.getByRole('button', { name: 'Search', exact: true });
  if (await sb.count()) {
    await sb.first().click();
    await page.waitForLoadState('networkidle', { timeout: 180000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }
  out.searchMs = Date.now() - t0;
  Object.assign(out, await page.evaluate(() => {
    const t = document.querySelector('table');
    const rows = t ? [...t.querySelectorAll('tbody tr')] : [];
    const r0 = rows[0];
    return {
      url: location.href,
      headers: t ? [...t.querySelectorAll('thead th')].map((x) => x.innerText.trim()) : null,
      rowCount: rows.length,
      row0cells: r0 ? [...r0.querySelectorAll('td')].map((c) => c.innerText.trim().replace(/\s+/g, ' ')) : null,
      row0actions: r0 ? [...r0.querySelectorAll('a, button, i, svg, img, [title], [ngbtooltip]')].map((a) => [a.tagName, a.getAttribute('title') || a.getAttribute('ngbtooltip') || '', a.getAttribute('href') || '', (a.className && a.className.baseVal !== undefined ? a.className.baseVal : a.className) || '', a.innerText ? a.innerText.trim().slice(0, 30) : '']) : null,
      pagText: [...document.querySelectorAll('ngb-pagination, .pagination, [class*=pagina], [class*=total], [class*=record]')].map((p) => p.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean),
      pageButtons: [...document.querySelectorAll('button, a.btn')].map((b) => b.innerText.trim()).filter(Boolean),
      text: document.body.innerText.slice(0, 4000),
    };
  }));
  out.api = net.map((n) => [n.m, n.s, n.dt, n.u.replace('https://staging.secarang.com', ''), n.body]);
  let s = JSON.stringify(out, null, 1);
  if (e.CIBO_PASSWORD) s = s.split(e.CIBO_PASSWORD).join('***');
  fs.writeFileSync(path.join(OUTD, rt + '.json'), s);
  await page.screenshot({ path: path.join(OUTD, rt + '.png'), fullPage: true });
  console.log('==', rt, 'search', out.searchMs + 'ms', 'rows', out.rowCount, JSON.stringify(out.headers));
  console.log('   dropdowns', JSON.stringify(out.dropdowns));
  console.log('   pag', JSON.stringify(out.pagText).slice(0, 300));
  console.log('   nonGET', JSON.stringify(out.api.filter((a) => a[0] !== 'GET')));
}
await browser.close();
