// Probe: pass the site password page once, then dump each /ia/ page's structure to the scratchpad.
import { chromium, siteGate, IA, SCRATCH } from './cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 } });
const page = await ctx.newPage();
console.log('after gate:', await siteGate(page));
const out = {};
for (const p of ['/', '/car-insurance', '/motorcycle-insurance', '/about-us', '/faq', '/support', '/terms-of-use', '/privacy-policy', '/refund-policy']) {
  await page.goto(IA + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  out[p] = await page.evaluate(() => ({
    url: location.href,
    text: document.body.innerText.slice(0, 6000),
    imgs: [...document.querySelectorAll('img')].filter((i) => i.offsetParent).map((i) => [i.alt, i.getAttribute('src')]),
    links: [...document.querySelectorAll('a')].map((a) => [a.innerText.trim().slice(0, 60), a.getAttribute('href')]).filter((x) => x[0] || x[1]).slice(0, 80),
    buttons: [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => b.innerText.trim().slice(0, 80)),
    expanders: [...document.querySelectorAll('[data-toggle], [aria-expanded], .accordion button, .card-header, mat-expansion-panel-header, .panel-heading')].map((e) => [e.tagName, (e.className || '').toString().slice(0, 50), (e.innerText || '').trim().slice(0, 90), e.getAttribute('aria-expanded')]).slice(0, 80),
    inputs: [...document.querySelectorAll('input, select')].filter((i) => i.offsetParent).map((i) => [i.type, i.getAttribute('formcontrolname'), i.placeholder]),
  }));
  await page.screenshot({ path: path.join(SCRATCH, 'sec' + p.replace(/\//g, '_') + '.png'), fullPage: true });
  console.log(p, '->', out[p].url, '| imgs', out[p].imgs.length, '| expanders', out[p].expanders.length);
}
fs.writeFileSync(path.join(SCRATCH, 'sec-probe.json'), JSON.stringify(out, null, 1));
await browser.close();
