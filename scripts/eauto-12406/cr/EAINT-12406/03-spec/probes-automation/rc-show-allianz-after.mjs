// EAINT-12406 probe (29.10.2026, main session): show Azfar the post-deploy Allianz company-number layout.
// READ ONLY: CIBO search BR55004010, Transaction Details insurer box screenshot, receipt PDF rendered to PNG.
// Output goes to the OS temp folder (receipt holds personal data); only cropped insurer blocks are kept.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
import { execFileSync } from 'node:child_process';
import os from 'node:os'; import path from 'node:path';
const out = path.join(os.tmpdir(), 'claude-12406-show');
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true })).newPage();
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
await ciboLogin(page);
await page.locator('a[href="/cibo/transaction-management"]').first().click(); await settle(4000);
await page.locator('input[formcontrolname="search"]').fill('BR55004010');
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(5000);
await page.locator('table tbody').getByText('BR55004010', { exact: true }).first().click(); await settle(5000);
const ins = page.getByText('Insurer', { exact: true }).first();
const box = await ins.locator('xpath=ancestor::*[contains(@class,"row") or self::tr][1]').boundingBox().catch(() => null) || await ins.boundingBox();
await page.screenshot({ path: path.join(out, 'details-insurer.png'), clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: 1100, height: 140 } });
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Receipt/ }).first().click()]);
const f = path.join(out, 'receipt.pdf'); await dl.saveAs(f);
execFileSync('pdftoppm', ['-png', '-r', '110', '-f', '1', '-l', '1', f, path.join(out, 'receipt')]);
await browser.close();
console.log('saved to', out);
