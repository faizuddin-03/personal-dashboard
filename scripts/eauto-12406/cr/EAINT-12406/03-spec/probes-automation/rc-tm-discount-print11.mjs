// EAINT-12406 probe 11 (29.10.2026, cr-author sheet RC, after triage of run sRC-1545-c2 RC_TS10): on Transaction
// Management (1) the Discount Code filter's options and the Discount Code cell of E2E_TS2's row BR60006350, (2) what
// Print sends and when window.print() is called and the print layout is filled, on a narrow search and after Clear
// all. READ ONLY: filters, searches, Clear all, Print with window.print() replaced (no dialog). Nothing saved.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const out = (k, v) => console.log(k, JSON.stringify(v));
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
const exact = (t) => new RegExp('^\\s*' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$');
const t0 = Date.now();
const ms = () => Date.now() - t0;
page.on('request', (r) => { if (r.method() === 'POST' && /ins-api/.test(r.url()) && !/authenticate/.test(r.url())) out('REQ', { at: ms(), url: r.url().replace(/^.*ins-api/, ''), body: (r.postData() || '').replace(/[0-9]{6,}/g, '9…').slice(0, 300) }); });
page.on('requestfinished', async (r) => { if (r.method() === 'POST' && /ins-api/.test(r.url())) out('RES', { at: ms(), url: r.url().replace(/^.*ins-api/, ''), status: (await r.response())?.status() }); });
await ciboLogin(page);
await page.locator('a[href="/cibo/transaction-management"]').first().click(); await settle(4000);

// (1) Discount Code filter
await page.locator('ng-select[formcontrolname="discountCode"] .ng-arrow-wrapper').click();
out('DISCOUNT_OPTIONS', (await page.locator('ng-dropdown-panel .ng-option, ng-dropdown-panel .ng-optgroup').allInnerTexts()).map((s) => s.trim()).slice(0, 80));
out('DISCOUNT_PANEL_HAS_SEARCH', await page.locator('ng-select[formcontrolname="discountCode"] input[type=text]').count());
await page.keyboard.press('Escape');
await page.locator('input[formcontrolname="search"]').fill('BR60006350');
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(4000);
out('E2E_TS2_ROW', await page.evaluate(() => { const heads = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.trim()); return [...document.querySelectorAll('table tbody tr')].slice(0, 2).map((tr) => [...tr.children].map((td, i) => [heads[i], td.innerText.replace(/\s+/g, ' ').trim().slice(0, 60)]).filter(([h]) => /Ref|Discount|Ins\. Co|Status/.test(h))); }));

// (2) Print on this narrow search
const printProbe = async (label) => {
  await page.evaluate(() => { window.__calls = []; window.print = () => { window.__calls.push(performance.now()); }; });
  const pb = page.locator('button').filter({ hasText: /^\s*Print\s*$/ }).filter({ visible: true }).first();
  out(label + '_PRINT_BUTTON', await pb.count());
  const c0 = ms();
  await pb.click();
  for (let i = 0; i < 120; i++) {
    const s = await page.evaluate(() => ({ calls: window.__calls.length, printBlocks: [...document.querySelectorAll('.d-print-block')].map((e) => ({ tag: e.tagName, cls: e.className.slice(0, 80), rows: e.querySelectorAll('tr').length, len: (e.innerText || e.textContent || '').length })) }));
    if (i % 4 === 0 || s.calls) out(label + '_T', { since_click: ms() - c0, ...s });
    if (s.calls) break;
    await page.waitForTimeout(500);
  }
};
await printProbe('NARROW');
await page.getByRole('button', { name: 'Clear all' }).click(); await settle(2500);
await printProbe('AFTER_CLEAR_ALL');
await browser.close();
