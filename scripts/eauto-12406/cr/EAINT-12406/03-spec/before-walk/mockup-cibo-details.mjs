// Open the CIBO mockup's Transaction Details views (click each Ref. No.) and save text + screenshots to the scratchpad.
import { chromium, SCRATCH } from './cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';
const f = 'file:///C:/Users/Azfar/Documents/Github Pro/eauto-qa-azfar/cr/EAINT-12406/00-input/Mock Up_EAINT-12406_CIBO Transaction Management_20261006.html';
const browser = await chromium.launch();
const out = {};
for (const ref of ['BR55009001', 'BR55009002']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(f);
  await page.waitForTimeout(800);
  await page.getByText(ref, { exact: true }).first().click();
  await page.waitForTimeout(1200);
  out[ref] = await page.evaluate(() => document.body.innerText);
  await page.screenshot({ path: path.join(SCRATCH, 'mock-cibo-' + ref + '.png'), fullPage: true });
}
fs.writeFileSync(path.join(SCRATCH, 'mock-cibo-details.json'), JSON.stringify(out, null, 1));
await browser.close();
