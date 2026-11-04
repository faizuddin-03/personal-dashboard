// EAINT-12406 probe (29.10.2026, cr-author, sheet CP): what the review-mark scan of 12406_CP_TS6 E5 reads on the
// live pages (About Us partnership block, FAQ "Which insurers" block, Support insurer sections, the top menu), and the
// geometry of the Support Allianz block (label / number / towing sentence). Read only: site password, menu clicks,
// accordions opened. Output JSON to stdout.
import { chromium, siteGate } from '../before-walk/cibo-lib.mjs';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const settle = async (ms = 1500) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
await siteGate(page); await settle();
await page.locator('ngb-modal-window').first().waitFor({ timeout: 8000 }).catch(() => {});
console.error('MODAL', await page.locator('ngb-modal-window').evaluateAll((ms) => ms.map((m) => [m.className, [...m.querySelectorAll('button, [aria-label]')].map((b) => [b.tagName, b.className, b.getAttribute('aria-label'), (b.innerText || '').trim()])])));
const x = page.locator('ngb-modal-window button.close, ngb-modal-window [aria-label="Close"], ngb-modal-window .btn-close').first();
if (await x.isVisible().catch(() => false)) await x.click(); else await page.keyboard.press('Escape');
await page.locator('ngb-modal-window').first().waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
const scan = (roots) => {
  const found = []; const pill = /^(Changed:.*|New|New section|New sentence)$/i;
  for (const root of roots) for (const e of [root, ...root.querySelectorAll('*')]) {
    const c = getComputedStyle(e); const name = e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).trim().replace(/\s+/g, '.') : '');
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
    if (e.tagName === 'MARK') found.push('mark ' + name);
    if (own && pill.test(own)) found.push('pill ' + own);
    const bg = c.backgroundColor; if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(255, 255, 255)') found.push(`bg ${bg} ${name}`);
    if (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) found.push(`outline ${c.outlineStyle} ${name}`);
    for (const s of ['Top', 'Right', 'Bottom', 'Left']) if (c[`border${s}Style`] === 'dashed') { found.push('dashed ' + name); break; }
  }
  return found;
};
const out = {};
out.menuMarks = await page.locator('nav.main-navbar a.nav-link *').evaluateAll((els) => els.map((e) => [e.tagName, e.className, getComputedStyle(e).backgroundColor]));
await page.locator('nav.main-navbar a.nav-link', { hasText: 'About Us' }).click(); await settle();
out.about = await page.locator('div.about-us-content h4', { hasText: 'Our partnership' }).locator('xpath=following-sibling::*[1][self::p]').evaluateAll(scan);
out.aboutHeading = await page.locator('div.about-us-content h4', { hasText: 'Our partnership' }).evaluateAll(scan);
out.aboutPills = await page.locator('body').evaluateAll(scan);
await page.locator('nav.main-navbar a.nav-link', { hasText: 'FAQs' }).click(); await settle();
const q = page.locator('app-collapsable').filter({ has: page.locator('.collapsable-header', { hasText: 'Which insurers can I get instant quotation from?' }) }).first();
await q.locator('.collapsable-header').click(); await page.waitForTimeout(600);
out.faq = await q.evaluateAll(scan);
out.faqFirst = await page.locator('app-collapsable').first().evaluateAll(scan);
out.faqPills = await page.locator('body').evaluateAll(scan);
await page.locator('nav.main-navbar a.nav-link', { hasText: 'Support' }).click(); await settle();
const secs = page.locator('app-collapsable').filter({ has: page.locator('h5.insurance-company-name') });
for (let i = 0; i < await secs.count(); i++) { await secs.nth(i).locator('.collapsable-header').click(); await page.waitForTimeout(500); }
out.support = await secs.evaluateAll((els, scanSrc) => { const scan = eval(scanSrc); return els.map((e) => ({ name: e.querySelector('h5').innerText, marks: scan([e]) })); }, `(${scan.toString()})`);
out.supportPills = await page.locator('body').evaluateAll(scan);
out.geometry = await secs.evaluateAll((els) => els.map((e) => {
  const content = e.querySelector('[collapsable-content]'); const r = (x) => x && (({ top, bottom, left, width }) => ({ top: Math.round(top), bottom: Math.round(bottom), left: Math.round(left), width: Math.round(width) }))(x.getBoundingClientRect());
  return { name: e.querySelector('h5').innerText, content: r(content), lis: [...content.querySelectorAll('li')].map((li) => ({ li: r(li), display: getComputedStyle(li).display, ls: getComputedStyle(li).listStyleType, h6: r(li.querySelector('h6')), p: r(li.querySelector('p')) })), notes: [...content.querySelectorAll(':scope > p')].map((p) => ({ r: r(p), display: getComputedStyle(p).display, inLi: !!p.closest('li'), t: p.innerText })) };
}));
await browser.close();
console.log(JSON.stringify(out, null, 1));
