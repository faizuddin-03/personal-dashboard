// EAINT-12406 probe 17 (29.10.2026 evening, cr-author, TS v6 E2E_TS9 E6 / E2E_TS12 E2). READ ONLY: CIBO Transaction
// Details of an Allianz purchase with add-ons (default BR60006357, E2E_TS1 retest 29.10: All Drivers RM20.00, Allianz
// Road Rangers FREE). Search, open, read: prints the price block from "Basic Premium" to "Total Premium" as rows
// (class names + texts) so the Add-ons lines can be read by label. Nothing pressed beyond the Ref. No. link.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
const REF = process.argv[2] || 'BR60006357';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
await ciboLogin(page);
await page.locator('a[href="/cibo/transaction-management"]').first().click(); await settle(4000);
await page.locator('input[formcontrolname="search"]').fill(REF);
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(6000);
await page.locator('table tbody').getByText(REF, { exact: true }).first().click(); await settle(6000);
const r = await page.evaluate(() => {
  const leaf = [...document.querySelectorAll('body *')].find((e) => e.children.length === 0 && (e.textContent || '').trim() === 'Basic Premium');
  if (!leaf) return { error: 'no Basic Premium label' };
  // the smallest ancestor that also holds "Total Premium"
  let box = leaf.parentElement;
  while (box && !(box.innerText || '').includes('Total Premium')) box = box.parentElement;
  const rows = [...box.querySelectorAll('.row, h6, h5')].filter((e) => !!e.offsetParent).map((e) => ({ tag: e.tagName, cls: e.className, kids: [...e.children].map((c) => `${c.tagName}.${c.className}`).join(' | ').slice(0, 160), text: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 100) }));
  return { boxCls: box.className, boxTag: box.tagName, text: box.innerText.replace(/[0-9]{6}-[0-9]{2}-[0-9]{4}/g, '<IC>').slice(0, 1500), rows };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
