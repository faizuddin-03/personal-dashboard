// EAINT-12406 probe 8 (29.10.2026, cr-author sheet RC): markup of "Total Premium" and "Receipt No" on Transaction
// Details of BR55004010. READ ONLY (search, open). Digits masked.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
await ciboLogin(page);
await page.locator('a[href="/cibo/transaction-management"]').first().click(); await settle(4000);
await page.locator('input[formcontrolname="search"]').fill('BR55004010');
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(5000);
await page.locator('table tbody').getByText('BR55004010', { exact: true }).first().click(); await settle(5000);
for (const lab of ['Total Premium', 'Receipt No', 'Payment Method', 'Payment Ref ID']) {
  const r = await page.evaluate((lab) => {
    const els = [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && (e.textContent || '').trim() === lab);
    return els.map((e) => ({ tag: e.tagName, cls: e.className, parent: e.parentElement.outerHTML.replace(/>[^<]{1,}</g, (m) => m.replace(/[0-9]/g, '9')).replace(/_ngcontent-[a-z0-9-]+=""/g, '').slice(0, 500) }));
  }, lab);
  console.log(lab, JSON.stringify(r));
}
await browser.close();
