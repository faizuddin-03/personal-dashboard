// EAINT-12406 probe 3 (29.10.2026, cr-author sheet RC): the Transaction Listing CSV's structure (one old row, values
// masked, file deleted) and the Payment Listing row cells. READ ONLY (search + one Export download).
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true })).newPage();
const out = (k, v) => console.log(k, JSON.stringify(v));
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
await ciboLogin(page);
await page.locator('a[href="/cibo/transaction-management"]').first().click(); await settle(4000);
await page.locator('input[formcontrolname="search"]').fill('BR55004010');
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(5000);
const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('button').filter({ hasText: /^\s*Export\s*$/ }).first().click()]);
const f = path.join(os.tmpdir(), 'claude-12406-tm-export.csv'); await dl.saveAs(f);
const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/); fs.rmSync(f);
lines.forEach((l, i) => out(`CSV${i}`, i < 3 && !/BR\d/.test(l) ? l.slice(0, 1200) : l.replace(/[0-9]/g, '9').replace(/[A-Z]{3,}( [A-Z]{2,})+/g, 'NAME').slice(0, 1200)));
await page.locator('a[href="/cibo/payment-management"]').first().click(); await settle(15000);
await page.locator('input[formcontrolname="search"]').fill('BR69005852');
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(10000);
out('PM_ROW', await page.evaluate(() => { const heads = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.trim()); const tr = document.querySelector('table tbody tr'); return tr ? [...tr.children].map((td, i) => [heads[i], td.innerHTML.replace(/>[^<]{1,}</g, (m) => m.replace(/[0-9]/g, '9')).slice(0, 250)]).filter(([h]) => /Channel|Payment Ref|Response|Transaction Ref|Payment$/.test(h)) : null; }));
await browser.close();
