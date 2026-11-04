// CIBO map 28.10.2026, pass 5 (read only): Referred Risk Log, Plan Code = Allianz, one 30-day window per month
// (the page allows From .. From+29 only). Jan 2022 .. Oct 2026; the 31st of a month is not covered. Scratch output only.
import { chromium, ciboLogin, SCRATCH, env } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUTD = path.join(SCRATCH, 'cibo-map-pass5');
fs.mkdirSync(OUTD, { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1000 } })).newPage();
await ciboLogin(page);
const E = env();
const save = (name, obj) => { let s = JSON.stringify(obj, null, 1); if (E.CIBO_PASSWORD) s = s.split(E.CIBO_PASSWORD).join('***'); fs.writeFileSync(path.join(OUTD, name + '.json'), s); };
const settle = async (ms = 1200) => { await page.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {}); await page.waitForTimeout(ms); };
const yearSel = 'ngb-datepicker select[title="Select year"], ngb-datepicker select[aria-label="Select year"]';
const monthSel = 'ngb-datepicker select[title="Select month"], ngb-datepicker select[aria-label="Select month"]';
const plan = process.argv[2] || 'Allianz';
await page.locator('a[href="/cibo/referred-risk-log"]').first().click(); await settle(2000);
if (plan !== 'ALL') {
  await page.locator('ng-select[formcontrolname="selectedPlanCode"] .ng-select-container').click(); await page.waitForTimeout(800);
  await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: new RegExp(`^\\s*${plan}\\s*$`) }).first().click();
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
}
const rows = []; const perMonth = {};
for (let y = 2022; y <= 2026; y++) {
  for (let m = 1; m <= 12; m++) {
    if (y === 2026 && m > 10) break;
    await page.locator('input[formcontrolname="fromLogDate"]').click(); await page.waitForTimeout(500);
    await page.locator(yearSel).selectOption(String(y)); await page.locator(monthSel).selectOption(String(m)); await page.waitForTimeout(300);
    await page.locator('ngb-datepicker [ngbdatepickerdayview], ngb-datepicker .btn-light').filter({ hasText: /^\s*1\s*$/ }).first().click(); await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Search', exact: true }).first().click(); await page.waitForTimeout(1200); await settle();
    const r = await page.evaluate(() => ({ dates: [...document.querySelectorAll('input[readonly]')].map((i) => i.value), pag: (document.querySelector('ngb-pagination') || {}).innerText?.replace(/\s+/g, ' ').trim() || '', rows: [...document.querySelectorAll('table tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((c) => c.innerText.trim().replace(/\s+/g, ' '))).filter((x) => x.length > 3) }));
    let got = r.rows;
    for (let n = 2; n <= 30 && r.pag; n++) {
      const link = page.locator('ngb-pagination a.page-link').filter({ hasText: new RegExp(`^\\s*${n}\\s*`) });
      if (!(await link.count())) break;
      await link.first().click(); await page.waitForTimeout(1200); await settle(600);
      got = got.concat(await page.evaluate(() => [...document.querySelectorAll('table tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((c) => c.innerText.trim().replace(/\s+/g, ' '))).filter((x) => x.length > 3)));
    }
    perMonth[`${y}-${String(m).padStart(2, '0')}`] = got.length;
    rows.push(...got.map((x) => [r.dates.join(' .. '), ...x]));
  }
}
save(`rrl-${plan}-by-month`, { perMonth, rows });
const remarks = {}; const from = {};
for (const r of rows) { remarks[r[7]] = (remarks[r[7]] || 0) + 1; const f = /eAuto/.test(r[3]) ? 'eAuto' : r[3]; from[f] = (from[f] || 0) + 1; }
console.log(plan, 'rows', rows.length, 'perMonth', JSON.stringify(Object.fromEntries(Object.entries(perMonth).filter((e) => e[1]))));
console.log('from', JSON.stringify(from));
console.log('remarks', JSON.stringify(remarks).slice(0, 2000));
await browser.close();
