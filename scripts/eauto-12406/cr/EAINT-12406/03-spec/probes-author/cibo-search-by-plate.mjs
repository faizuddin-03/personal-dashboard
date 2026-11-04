// EAINT-12406 probe (29.10.2026, cr-author E2E sheet): does the CIBO Transaction Management free-text Search
// find a transaction by its PLATE (the E2E TS steps say "search the plate"), and how is the Ins. Co. / Payment
// cell laid out. READ ONLY: login, sidebar, Search (a read-only POST). Prints counts and column names only,
// no personal data. Uses the walk's helpers (credentials from env, never printed).
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
const REF = process.argv[2] || 'BR69005852';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await ciboLogin(page);
await page.locator('a[href$="/transaction-management"]').first().click();
await page.waitForLoadState('networkidle').catch(() => {});
await page.waitForTimeout(3000);
const rows = async () => page.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const t = [...document.querySelectorAll('table')].find((x) => [...x.querySelectorAll('thead th')].some((th) => norm(th.textContent) === 'Transaction Ref. No.'));
  if (!t) return { heads: [], rows: [] };
  const heads = [...t.querySelectorAll('thead th')].map((th) => norm(th.textContent));
  return { heads, rows: [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((td) => norm(td.innerText))) };
});
async function search(text) {
  await page.locator("input[formcontrolname='search']").first().fill(text);
  await page.getByRole('button', { name: 'Search', exact: true }).first().click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(3000);
  return rows();
}
const byRef = await search(REF);
const vi = byRef.heads.indexOf('Vehicle No');
const plate = (byRef.rows[0] || [])[vi] || '';
console.log('HEADS', JSON.stringify(byRef.heads));
console.log('BY_REF rows', byRef.rows.length, 'plate length', plate.length);
const ins = byRef.heads.indexOf('Ins. Co.'), pay = byRef.heads.indexOf('Payment'), mode = byRef.heads.indexOf('Payment Mode'), st = byRef.heads.indexOf('Transaction Status');
console.log('INS_CO', JSON.stringify((byRef.rows[0] || [])[ins]), 'PAYMENT has Paid', /Paid/.test((byRef.rows[0] || [])[pay] || ''), 'MODE', JSON.stringify((byRef.rows[0] || [])[mode]), 'STATUS', JSON.stringify((byRef.rows[0] || [])[st]));
const insCell = await page.locator('table tbody tr').first().locator('td').nth(ins).innerHTML().catch(() => '');
console.log('INS_CO_HTML', insCell.replace(/\s+/g, ' ').slice(0, 400));
const byPlate = await search(plate.split(' ')[0]);
const refs = byPlate.rows.map((r) => (r[1] || '').split(' ')[0]);
console.log('BY_PLATE rows', byPlate.rows.length, 'contains ref', refs.includes(REF), 'all same plate', byPlate.rows.every((r) => (r[vi] || '').startsWith(plate.split(' ')[0])));
console.log('BY_PLATE created dates (order)', JSON.stringify(byPlate.rows.map((r) => r[byPlate.heads.indexOf('Transaction Created Date')])));
await browser.close();
