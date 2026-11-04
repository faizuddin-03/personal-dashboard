// Secarang mockup 20261015: open the FAQs and Support tabs (and the Allianz parts) and save text + screenshots.
import { chromium, SCRATCH, OUT } from './cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';
const f = 'file:///C:/Users/Azfar/Documents/Github Pro/eauto-qa-azfar/cr/EAINT-12406/00-input/Mock Up_EAINT-12406_Secarang_20261015.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(f); await page.waitForTimeout(1000);
const out = {};
await page.screenshot({ path: path.join(OUT, 'mockup-secarang-20261015-about-us.png'), fullPage: true });
out.aboutUs = await page.evaluate(() => document.body.innerText);
for (const tab of ['FAQs', 'Support']) {
  await page.getByText(tab, { exact: true }).first().click(); await page.waitForTimeout(800);
  // open everything that looks closed (the mockup marks changed items)
  const heads = page.locator('text=/\+$/');
  out[tab + '-clickables'] = await page.evaluate(() => [...document.querySelectorAll('a,button,[onclick]')].filter(e=>e.offsetParent).map((e) => (e.innerText || '').trim()).filter(Boolean));
  out[tab] = await page.evaluate(() => document.body.innerText);
  await page.screenshot({ path: path.join(OUT, `mockup-secarang-20261015-${tab.toLowerCase()}.png`), fullPage: true });
}
fs.writeFileSync(path.join(SCRATCH, 'mock-secarang-tabs.json'), JSON.stringify(out, null, 1));
await browser.close();
