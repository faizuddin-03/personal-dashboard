// Where do the home form's "Privacy Policy" / "Terms of Use" links land when clicked on /ia/? (No form typed or submitted.)
// The /preprod/ link seen in the site's code sits in the two-month-rule pop-up (app-two-month-rule-modal), which only
// opens after Get quotation, so it is not reachable without a quotation.
import { chromium, siteGate, OUT, SCRATCH } from './cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';
const VID = path.join(SCRATCH, 'video-links'); fs.rmSync(VID, { recursive: true, force: true });
const browser = await chromium.launch({ slowMo: 150 });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 }, recordVideo: { dir: VID, size: { width: 1920, height: 1000 } } });
const page = await ctx.newPage();
await siteGate(page);
const res = {};
for (const name of ['Privacy Policy', 'Terms of Use']) {
  await page.goto('https://staging.secarang.com/ia/car-insurance', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  const close = page.locator('ngb-modal-window button.close, ngb-modal-window [aria-label="Close"]').first();
  if (await close.count()) { await close.click(); await page.waitForTimeout(600); }
  const link = page.locator('small a, form a, .card a').filter({ hasText: new RegExp(`^${name}\.?$`) }).first();
  const href = await link.getAttribute('href');
  const [pop] = await Promise.all([ctx.waitForEvent('page', { timeout: 4000 }).catch(() => null), link.click()]);
  const landed = pop || page; await landed.waitForLoadState('networkidle').catch(() => {}); await landed.waitForTimeout(1500);
  res[name] = { href, newTab: !!pop, landedOn: landed.url() };
  await landed.screenshot({ path: path.join(OUT, `secarang-17-home-form-${name.toLowerCase().replace(/ /g, '-')}-link-lands-on.png`) });
  if (pop) await pop.close();
}
// read-only check of the site's own script: which links use the staging-only /preprod/ redirect
const code = await page.evaluate(async () => {
  const src = [...document.scripts].map((s) => s.src).find((s) => /main\.[a-f0-9]+\.js/.test(s));
  const t = await (await fetch(src)).text();
  const i = t.indexOf('staging.secarang.com/preprod');
  const comp = (t.slice(i, i + 9000).match(/selectors:\[\["([^"]+)"\]\]/) || [])[1];
  const calls = [...t.slice(i, i + 9000).matchAll(/navigateTo\("([^"]+)"\)/g)].map((m) => m[1]);
  return { mainScript: src, component: comp, navigateToTargets: [...new Set(calls)] };
});
res.preprodLinkInCode = code;
fs.writeFileSync(path.join(OUT, 'secarang-links-check.json'), JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
const v = page.video(); await ctx.close(); await browser.close();
fs.copyFileSync(await v.path(), path.join(OUT, 'video-secarang-links-check.webm'));
