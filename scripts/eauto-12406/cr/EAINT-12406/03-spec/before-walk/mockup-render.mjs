// Render the two mockups (they are JS-built pages) and save their text + full-page screenshots to the scratchpad.
import { chromium, SCRATCH } from './cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';

const DIR = 'C:/Users/Azfar/Documents/Github Pro/eauto-qa-azfar/cr/EAINT-12406/00-input/';
const files = {
  'mock-cibo': 'Mock Up_EAINT-12406_CIBO Transaction Management_20261006.html',
  'mock-secarang': 'Mock Up_EAINT-12406_Secarang_20261015.html',
};
const browser = await chromium.launch();
for (const [k, f] of Object.entries(files)) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file:///' + DIR + f);
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => ({
    text: document.body.innerText,
    clickables: [...document.querySelectorAll('a,button,[onclick],.tab,[role=tab]')].map((e) => (e.innerText || '').trim()).filter(Boolean).slice(0, 80),
  }));
  fs.writeFileSync(path.join(SCRATCH, k + '.json'), JSON.stringify(info, null, 1));
  await page.screenshot({ path: path.join(SCRATCH, k + '.png'), fullPage: true });
}
await browser.close();
