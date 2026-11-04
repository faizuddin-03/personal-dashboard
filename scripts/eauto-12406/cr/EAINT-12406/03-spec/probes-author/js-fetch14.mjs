// EAINT-12406 probe (29.10.2026, cr-author): READ ONLY. Saves one /ia/ JavaScript chunk to the scratch folder so its
// templates can be read (no form filled, nothing pressed). Usage: node js-fetch14.mjs <chunk file name>
import { chromium, siteGate, SCRATCH } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
const name = process.argv[2];
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
let base = '';
page.on('response', (r) => { if (/main\.[0-9a-f]+\.js/.test(r.url())) base = r.url(); });
await siteGate(page);
const body = await (await ctx.request.get(new URL(name, base).href)).text();
fs.writeFileSync(path.join(SCRATCH, name), body);
console.log(path.join(SCRATCH, name), body.length);
await browser.close();
