// EAINT-12406 probe (29.10.2026, cr-author, sheet CP): read the markup of Home logos, the top menu, About Us,
// FAQs and Support on Secarang staging /ia/ AFTER the deploy, for the page objects the CP specs use.
// Read only: the site password is typed, the promo pop-up closed, accordions opened / closed (UI only). No form
// is filled, Get quotation is never pressed. Output: JSON to stdout (no personal data on these pages).
import { chromium, siteGate, IA } from '../before-walk/cibo-lib.mjs';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const out = {};
const settle = async (ms = 1500) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
const closePromo = async () => {
  await page.locator('ngb-modal-window').first().waitFor({ timeout: 6000 }).catch(() => {});
  const x = page.locator('ngb-modal-window button.close, ngb-modal-window [aria-label="Close"], ngb-modal-window .btn-close').first();
  if (await x.isVisible().catch(() => false)) await x.click(); else await page.keyboard.press('Escape');
  await page.locator('ngb-modal-window').first().waitFor({ state: 'detached', timeout: 6000 }).catch(() => {});
};
const styleOf = (sel) => (e) => { const s = getComputedStyle(e); return { tag: e.tagName, cls: e.className, ff: s.fontFamily, fs: s.fontSize, fw: s.fontWeight, color: s.color, align: s.textAlign, bg: s.backgroundColor, ls: s.listStyleType }; };

await siteGate(page); await settle(); await closePromo();
out.url = page.url();
// Home logos
await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); } window.scrollTo(0, 0); });
out.logosAll = await page.locator('img[src*="insurance-logo"]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { src: e.getAttribute('src'), alt: e.getAttribute('alt'), vis: !!e.offsetParent, nw: e.naturalWidth, nh: e.naturalHeight, complete: e.complete, x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height), parent: e.parentElement.className } }));
out.logoSection = await page.getByText('Great teamwork makes the dream work').first().locator('xpath=ancestor::*[.//img[contains(@src,"insurance-logo")]][1]').evaluate((e) => ({ tag: e.tagName, cls: e.className, imgs: e.querySelectorAll('img').length })).catch((e) => String(e));
out.otherImgsNearLogos = await page.locator('img').evaluateAll((els) => els.map((e) => e.getAttribute('src')).filter((s) => s && /allianz|rhb|chubb|zurich|etiqa|takaful|lonpac|tokio/i.test(s)));
// Menu links
out.menu = await page.locator('a').evaluateAll((els) => els.filter((a) => /^(About Us|FAQs|Support)$/.test((a.innerText || '').trim())).map((a) => { const r = a.getBoundingClientRect(); return { t: a.innerText.trim(), href: a.getAttribute('href'), rl: a.getAttribute('routerlink'), vis: !!a.offsetParent, cls: a.className, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), anc: [a.parentElement?.className, a.parentElement?.parentElement?.className, a.closest('nav, header, [class*=offcanvas], [class*=mobile], [class*=sidebar]')?.className] }; }));
console.error('MENU', JSON.stringify(out.menu));
const menuLink = async (name) => page.locator('nav.main-navbar a.nav-link').filter({ hasText: new RegExp('^\s*' + name + '\s*$') }).first();

// About Us via menu
await (await menuLink('About Us')).click(); await settle(2000);
out.aboutUrl = page.url();
out.aboutHeading = await page.getByText('Our partnership', { exact: true }).evaluateAll((els) => els.map((e) => ({ tag: e.tagName, cls: e.className, vis: !!e.offsetParent })));
out.partnership = await page.getByText('Our partnership', { exact: true }).filter({ visible: true }).first().evaluate((h) => {
  const box = h.parentElement; const sib = h.nextElementSibling;
  const s = (e) => { if (!e) return null; const c = getComputedStyle(e); return { tag: e.tagName, cls: e.className, text: e.innerText, ff: c.fontFamily, fs: c.fontSize, fw: c.fontWeight, color: c.color, align: c.textAlign, hl: c.backgroundColor }; };
  return { boxTag: box.tagName, boxCls: box.className, boxHtml: box.outerHTML.slice(0, 1500), next: s(sib), allP: [...box.querySelectorAll('p')].map(s) };
});
out.aboutAllP = await page.locator('p').filter({ visible: true }).evaluateAll((els) => els.map((e) => { const c = getComputedStyle(e); return { cls: e.className, t: e.innerText.slice(0, 50), ff: c.fontFamily, fs: c.fontSize, color: c.color, align: c.textAlign }; }));
out.aboutMarks = await page.locator('mark, [class*="pill"], [class*="badge"], [class*="highlight"], [class*="new"]').evaluateAll((els) => els.map((e) => [e.tagName, e.className, (e.innerText || '').slice(0, 40)]));

// FAQs via menu
await (await menuLink('FAQs')).click(); await settle(2000);
out.faqUrl = page.url();
out.faqHeaders = await page.locator('.collapsable-header').evaluateAll((els) => els.map((e) => ({ t: e.innerText.trim().slice(0, 60), exp: e.getAttribute('aria-expanded'), tag: e.tagName, cls: e.className, vis: !!e.offsetParent })));
const q = page.locator('.collapsable-header').filter({ hasText: 'Which insurers can I get instant quotation from?' });
out.faqQCount = await q.count();
out.faqQ = await q.first().evaluate((h) => ({ headerHtml: h.outerHTML.slice(0, 800), parentHtml: h.parentElement.outerHTML.slice(0, 2500), parentCls: h.parentElement.className }));
if ((await q.first().getAttribute('aria-expanded')) !== 'true') { await q.first().click(); await page.waitForTimeout(800); }
out.faqQOpen = await q.first().evaluate((h) => {
  const p = h.parentElement; const lists = [...p.querySelectorAll('ul, ol')];
  const st = (e) => { const c = getComputedStyle(e); return { tag: e.tagName, cls: e.className, t: e.innerText.trim(), ff: c.fontFamily, fs: c.fontSize, fw: c.fontWeight, color: c.color, ls: c.listStyleType, vis: !!e.offsetParent }; };
  return { exp: h.getAttribute('aria-expanded'), headerText: h.innerText, headerIcon: [...h.querySelectorAll('*')].map((x) => [x.tagName, x.className, (x.innerText || '').trim()]).slice(0, 10), lists: lists.map((l) => ({ tag: l.tagName, cls: l.className, items: [...l.querySelectorAll('li')].map(st) })), bodyText: p.innerText };
});
// other questions' icons for comparison
out.faqIcons = await page.locator('.collapsable-header').evaluateAll((els) => els.slice(0, 5).map((h) => ({ t: h.innerText.trim().slice(0, 40), exp: h.getAttribute('aria-expanded'), after: getComputedStyle(h, '::after').content, before: getComputedStyle(h, '::before').content, kids: [...h.querySelectorAll('*')].map((x) => [x.tagName, x.className, (x.innerText || '').trim(), getComputedStyle(x, '::before').content]) })));
await q.first().click(); await page.waitForTimeout(800);
out.faqQClosed = await q.first().evaluate((h) => ({ exp: h.getAttribute('aria-expanded'), text: h.innerText, lists: [...h.parentElement.querySelectorAll('li')].map((l) => !!l.offsetParent) }));

// Support via menu
await (await menuLink('Support')).click(); await settle(2000);
out.supportUrl = page.url();
out.supportHeadersOnLoad = await page.locator('.collapsable-header').evaluateAll((els) => els.map((e) => ({ t: e.innerText.trim(), exp: e.getAttribute('aria-expanded'), tag: e.tagName, cls: e.className, vis: !!e.offsetParent, kids: [...e.querySelectorAll('*')].map((x) => [x.tagName, x.className]) })));
out.supportBlock = await page.getByText('Need to contact insurance company?').first().evaluate((h) => { let b = h; for (let i = 0; i < 4 && b && !b.querySelector('.collapsable-header'); i++) b = b.parentElement; return { tag: b?.tagName, cls: b?.className, html: (b?.outerHTML || '').slice(0, 6000) }; });
const all = page.locator('.collapsable-header');
const n = await all.count();
for (let k = 0; k < n; k++) { const h = all.nth(k); if ((await h.getAttribute('aria-expanded')) !== 'true') { await h.click(); await page.waitForTimeout(400); } }
out.supportOpen = await all.evaluateAll((els) => els.map((h) => {
  const p = h.parentElement;
  const st = (e) => { const c = getComputedStyle(e); return { tag: e.tagName, cls: e.className, t: (e.innerText || '').trim().slice(0, 200), ff: c.fontFamily, fs: c.fontSize, fw: c.fontWeight, color: c.color, bg: c.backgroundColor, border: c.border, ls: c.listStyleType, display: c.display, w: Math.round(e.getBoundingClientRect().width) }; };
  return { header: st(h), parent: st(p), body: [...p.children].filter((c) => c !== h).map((c) => ({ ...st(c), kids: [...c.querySelectorAll('*')].filter((x) => x.children.length === 0 && (x.innerText || '').trim()).map(st) })) };
}));
await browser.close();
console.log(JSON.stringify(out, null, 1));
