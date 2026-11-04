// EAINT-12406 probe (29.10.2026, fix of SecarangHomePage.logoRow()): READ ONLY. Secarang staging /ia/ Home: how the
// insurer logos move in (animations, boxes over time) and which element holds the visible logo row (for the outline).
// The site password is typed and the promo closed; no form is filled. Output: JSON to stdout (no personal data).
import { chromium, siteGate } from '../before-walk/cibo-lib.mjs';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await siteGate(page);
await page.locator('ngb-modal-window').first().waitFor({ timeout: 6000 }).catch(() => {});
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
const vis = page.locator("img[src*='insurance-logo']").filter({ visible: true });
const read = () => vis.evaluateAll((els) => ({
  t: Math.round(performance.now()),
  boxes: els.map((e) => { const r = e.getBoundingClientRect(); return `${e.getAttribute('src').split('/').pop()} ${Math.round(r.x + scrollX)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)} op${getComputedStyle(e.closest('[class*=aos], [data-aos]') || e).opacity}`; }),
  anims: document.getAnimations().map((a) => { const t = a.effect?.target; return { kind: a.constructor.name, name: a.animationName || a.transitionProperty || '', state: a.playState, target: t ? `${t.tagName}.${String(t.className).slice(0, 60)}` : '', holdsLogo: !!(t && els.some((e) => t === e || t.contains(e))) }; }),
}));
const out = { before: await read() };
await vis.first().scrollIntoViewIfNeeded();
out.timeline = [];
for (let i = 0; i < 16; i++) { out.timeline.push(await read()); await page.waitForTimeout(150); }
out.chain = await vis.evaluateAll((els) => {
  const anc = (e) => { const a = []; for (let p = e; p; p = p.parentElement) a.push(p); return a; };
  const chains = els.map(anc);
  const common = chains[0].find((p) => chains.every((c) => c.includes(p)));
  const d = (e) => { const r = e.getBoundingClientRect(); return { tag: e.tagName, cls: String(e.className), id: e.id, attrs: [...e.attributes].map((a) => a.name).filter((n) => /aos|ng|data/.test(n)).slice(0, 8), box: `${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}`, imgsInside: e.querySelectorAll("img[src*='insurance-logo']").length }; };
  return { common: d(common), commonParent: d(common.parentElement), perLogo: chains.map((c) => c.slice(0, 5).map(d)) };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
