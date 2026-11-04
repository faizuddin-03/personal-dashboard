// EAINT-12406 probe (29.10.2026 evening, cr-author, fix E2E_TS5 E1). READ ONLY: opens /ia/ behind the site password,
// reads the site's own JavaScript (no form filled, nothing pressed) and prints the template around
// "Unsuccessful payment" (the payment page's message box) and around window.open in the documents links.
import { chromium, siteGate, SCRATCH } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const words = process.argv.slice(2).length ? process.argv.slice(2) : ['Unsuccessful payment'];
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const scripts = new Set();
page.on('response', (r) => { if (/\.js(\?|$)/.test(r.url())) scripts.add(r.url()); });
await siteGate(page);
await page.waitForTimeout(3000);
// lazy chunks: the main bundle names them; fetch every .js it references (read only)
const main = [...scripts];
for (const u of main) {
  const body = await (await ctx.request.get(u)).text().catch(() => '');
  for (const m of body.matchAll(/["']([\w.-]+\.js)["']/g)) scripts.add(new URL(m[1], u).href);
  for (const m of body.matchAll(/(\d+):["']([0-9a-f]{12,})["']/g)) scripts.add(new URL(`${m[1]}.${m[2]}.js`, u).href);
}
console.error('scripts', scripts.size, [...scripts].map((u) => path.basename(new URL(u).pathname)).join(' ').slice(0, 1500));
const out = {};
for (const u of scripts) {
  const body = await (await ctx.request.get(u)).text().catch(() => '');
  for (const w of words) {
    let i = body.indexOf(w);
    let k = 0;
    while (i >= 0 && k < 4) {
      (out[w] ??= []).push({ file: path.basename(new URL(u).pathname), at: i, ctx: body.slice(Math.max(0, i - 900), i + 700) });
      i = body.indexOf(w, i + 1);
      k++;
    }
  }
}
fs.writeFileSync(path.join(SCRATCH, 'unsuccessful-box13.json'), JSON.stringify(out, null, 1));
for (const [w, hits] of Object.entries(out)) for (const h of hits) console.log(`=== ${w} @ ${h.file}:${h.at}\n${h.ctx}\n`);
await browser.close();
