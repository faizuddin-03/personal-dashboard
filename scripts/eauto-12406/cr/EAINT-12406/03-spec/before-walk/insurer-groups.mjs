// Insurance Company filter: agency groups + the lower half of the list (scrolled), on the three pages that have it.
import { chromium, ciboLogin, OUT, SCRATCH } from './cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';
const VID = path.join(SCRATCH, 'video-insurer-groups'); fs.rmSync(VID, { recursive: true, force: true });
const browser = await chromium.launch({ slowMo: 150 });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 }, recordVideo: { dir: VID, size: { width: 1920, height: 1000 } } });
const page = await ctx.newPage();
await ciboLogin(page);
const out = {};
for (const [href, n] of [['transaction-management', '04b'], ['payment-report', '24b'], ['commission-report', '26b']]) {
  await page.locator(`a[href="/cibo/${href}"]`).first().click();
  await page.waitForLoadState('networkidle'); await page.waitForTimeout(3000);
  await page.locator('ng-select[formcontrolname="insuranceComp"] .ng-select-container').click();
  await page.waitForTimeout(800);
  out[href] = await page.locator('ng-dropdown-panel .ng-option, ng-dropdown-panel .ng-optgroup').evaluateAll((els) => els.map((e) => (e.classList.contains('ng-optgroup') ? 'GROUP: ' : '  ') + e.innerText.trim()));
  await page.locator('ng-dropdown-panel .scroll-host, ng-dropdown-panel .ng-dropdown-panel-items').first().evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, `cibo-${n}-${href}-insurance-company-filter-values-scrolled-down.png`) });
  await page.keyboard.press('Escape');
}
fs.writeFileSync(path.join(OUT, 'cibo-insurance-company-filter-groups.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
const v = page.video(); await ctx.close(); await browser.close();
await v.saveAs(path.join(OUT, 'video-insurer-filter-groups.webm'));
