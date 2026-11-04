// EAINT-12406 probe 7 (29.10.2026, cr-author sheet RC): the CIBO receipt of BR55004010 (old Allianz transaction)
// downloaded once, to try the RC receipt parser on the post-deploy receipt. READ ONLY (search, open, Receipt
// download). The PDF goes to the temp folder and is deleted; only the Insurer block and labels are printed.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true })).newPage();
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
await ciboLogin(page);
await page.locator('a[href="/cibo/transaction-management"]').first().click(); await settle(4000);
await page.locator('input[formcontrolname="search"]').fill('BR55004010');
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(5000);
await page.locator('table tbody').getByText('BR55004010', { exact: true }).first().click(); await settle(5000);
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Receipt/ }).first().click()]);
const f = path.join(os.tmpdir(), 'claude-12406-br55004010-after.pdf'); await dl.saveAs(f);
const raw = execFileSync('pdftotext', ['-raw', f, '-'], { encoding: 'utf8' }).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const i = raw.indexOf('Insurer');
console.log('INSURER_BLOCK', JSON.stringify(raw.slice(i, i + 5)));
console.log('AGENT', JSON.stringify(raw.filter((l) => /Exclusively|PIAM/.test(l)).map((l) => l.replace(/[0-9]/g, '9'))));
const lay = execFileSync('pdftotext', ['-layout', f, '-'], { encoding: 'utf8' }).split(/\r?\n/);
const j = lay.findIndex((l) => /^\s*Insurer\b/.test(l));
console.log('LAYOUT_INSURER', JSON.stringify(lay.slice(j, j + 4).map((l) => l.replace(/[0-9]/g, '9'))));
fs.rmSync(f);
await browser.close();
