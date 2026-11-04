// EAINT-12406 probe 4 (29.10.2026, cr-author sheet RC): Payment Report and Commission Report CSV structure (old
// Allianz rows, values masked, files deleted) + the Commission Report row cells. READ ONLY (searches + Export downloads).
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true })).newPage();
page.on('dialog', async (d) => { console.log('DIALOG', d.type(), d.message()); await d.dismiss(); });
const out = (k, v) => console.log(k, JSON.stringify(v));
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
async function pickOpt(control, text) {
  await page.locator(`ng-select[formcontrolname="${control}"] .ng-select-container`).click();
  await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: new RegExp(`^\\s*${text}\\s*$`) }).first().click();
  await page.keyboard.press('Escape');
}
async function pickDate(control, y, m, d) {
  await page.locator(`input[formcontrolname="${control}"]`).click();
  const dp = page.locator('ngb-datepicker').filter({ visible: true }).first();
  await dp.locator("select[title='Select year'], select[aria-label='Select year']").selectOption(String(y));
  await dp.locator("select[title='Select month'], select[aria-label='Select month']").selectOption(String(m));
  await dp.locator('[ngbdatepickerdayview]:not(.outside), .ngb-dp-day:not(.hidden) .btn-light:not(.outside)').filter({ hasText: new RegExp(`^\\s*${d}\\s*$`) }).first().click();
}
const mask = (l) => l.replace(/[0-9]/g, '9').replace(/[A-Z]{3,}( [A-Z@.]{2,})+/g, 'NAME').slice(0, 900);
async function exportCsv(tag) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.locator('button').filter({ hasText: /^\s*Export\s*$/ }).first().click()]);
  const f = path.join(os.tmpdir(), `claude-12406-${tag}.csv`); await dl.saveAs(f);
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/); fs.rmSync(f);
  out(`${tag}_NAME`, dl.suggestedFilename());
  lines.slice(0, 7).forEach((l, i) => out(`${tag}${i}`, /BR\d/.test(l) ? mask(l) : l.slice(0, 900)));
  out(`${tag}_LINES`, lines.length);
}
await ciboLogin(page);
await page.locator('a[href="/cibo/payment-report"]').first().click(); await settle(5000);
await pickOpt('insuranceComp', 'Allianz'); await pickDate('toDate', 2025, 5, 7); await pickDate('fromDate', 2025, 5, 1);
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(6000);
await exportCsv('PR');
await page.locator('a[href="/cibo/commission-report"]').first().click(); await settle(5000);
await pickOpt('insuranceComp', 'Allianz');
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(8000);
out('CR_ROW', await page.evaluate(() => { const heads = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.trim()); const tr = document.querySelector('table tbody tr'); return tr ? [...tr.children].map((td, i) => [heads[i], td.innerHTML.replace(/>[^<]{1,}</g, (m) => m.replace(/[0-9]/g, '9')).slice(0, 250)]).filter(([h]) => /Insurance Company|Reference No|Discount/.test(h)) : null; }));
out('CR_SUMMARY', (await page.getByText(/Summary Report for/).first().innerText().catch(() => '')).replace(/[0-9]/g, '9'));
await exportCsv('CR');
await browser.close();
