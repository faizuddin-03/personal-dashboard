// EAINT-12406 probe 18 (29.10.2026 evening, cr-author, TS v6 RC_TS11). READ ONLY: CIBO > CRM. Searches (Ownership
// Type Private; Latest Coverage Expires around 10.11.2027, the end of E2E_TS1's cover on HXA0011A; then the free-text
// box with the plate), opens the matching customer's Customer Details and prints the listing columns, the row of that
// customer and the vehicle card of the plate (labels and structure; names, IC, phone, e-mail masked). Edit, Duplicate,
// Save update and the Send quotation link buttons are never pressed.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
const PLATE = process.argv[2] || 'HXA0011A';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const out = (k, v) => console.log(k, JSON.stringify(v));
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
const mask = (s) => String(s || '').replace(/\d{6}-?\d{2}-?\d{4}/g, '<IC>').replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g, '<EMAIL>').replace(/\+?6?01\d[\d -]{6,}/g, '<PHONE>').replace(/QA SECARANG TEST/gi, '<OWNER>');
async function search() {
  const req = page.waitForRequest((r) => r.method() === 'POST' && /\/page(\?|$)/.test(r.url()), { timeout: 60000 });
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const res = await (await req).response();
  await settle(4000);
  out('SEARCH_STATUS', res && res.status());
}
const rows = () => page.evaluate(() => {
  const heads = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.replace(/\s+/g, ' ').trim());
  return { heads, rows: [...document.querySelectorAll('table tbody tr')].slice(0, 8).map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim().slice(0, 140))) };
});
await ciboLogin(page);
await page.locator('a[href="/cibo/crm"]').first().click(); await settle(12000);
out('FILTERS', await page.evaluate(() => [...document.querySelectorAll('[formcontrolname]')].map((e) => `${e.tagName}:${e.getAttribute('formcontrolname')}`)));
await page.locator('input[formcontrolname="search"]').fill(PLATE);
await search();
const r1 = await rows();
out('BY_PLATE', { heads: r1.heads, rows: r1.rows.map((r) => r.map(mask)) });
const link = page.locator("table tbody tr a[href*='customer-details']").first();
out('DETAIL_LINKS', await page.locator("table tbody tr a[href*='customer-details']").count());
if (await link.count()) {
  await link.click(); await settle(6000);
  out('DETAILS_URL', page.url().replace(/\d{6,}/g, '<ID>'));
  // the vehicle cards: the smallest element holding the plate and an Edit button
  const cards = await page.evaluate((plate) => {
    const hits = [...document.querySelectorAll('div, section')].filter((e) => (e.innerText || '').includes(plate) && [...e.querySelectorAll('button')].some((b) => /^\s*Edit\s*$/.test(b.innerText)));
    hits.sort((a, b) => a.innerText.length - b.innerText.length);
    const c = hits[0];
    if (!c) return null;
    return { cls: c.className, tag: c.tagName, text: c.innerText.slice(0, 1200), buttons: [...c.querySelectorAll('button')].map((b) => b.innerText.trim()), labels: [...c.querySelectorAll('.text-muted, label, small')].map((l) => l.innerText.trim()).slice(0, 40) };
  }, PLATE);
  if (cards) cards.text = mask(cards.text);
  out('VEHICLE_CARD', cards);
  out('CARD_ANCESTORS', await page.evaluate(({ plate }) => {
    const head = [...document.querySelectorAll('div.row.align-items-end')].find((e) => (e.innerText || '').trim().startsWith(plate));
    const outl = [];
    for (let e = head, i = 0; e && i < 7; e = e.parentElement, i++) {
      const t = e.innerText || '';
      const plates = (t.match(/[A-Z]{2,3}\d{3,4}[A-Z]?/g) || []).filter((x, k, a) => a.indexOf(x) === k);
      outl.push({ i, tag: e.tagName, cls: e.className, plates: plates.length, hasLast: /Last Updated/i.test(t), len: t.length });
    }
    return outl;
  }, { plate: PLATE }));
  out('CARD_TEXT', await page.evaluate(({ plate }) => {
    const head = [...document.querySelectorAll('div.row.align-items-end')].find((e) => (e.innerText || '').trim().startsWith(plate));
    let e = head;
    while (e && !/Last Updated/i.test(e.innerText || '')) e = e.parentElement;
    return e ? { cls: e.className, text: e.innerText.slice(0, 1500) } : null;
  }, { plate: PLATE }).then((x) => x && { ...x, text: mask(x.text) }));
  out('CARD_COUNT_WITH_EDIT', await page.getByRole('button', { name: /^\s*Edit\s*$/ }).count());
}
await browser.close();
