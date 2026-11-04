// EAINT-12406 probe 9 (29.10.2026, fault 2 of the 29.10 pipeline): why the Payment Channel list does not open on a
// second Payment Management visit. Ticks the FPX group, leaves for Transaction Management, comes back, and reads the
// ng-select (classes, chips, clear button) and which click opens the panel. READ ONLY: filters only, no search.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const out = (k, v) => console.log(k, JSON.stringify(v));
const settle = async (ms) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
const exact = (t) => new RegExp('^\\s*' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$');
const sel = 'ng-select[formcontrolname="selectedBank"]';
const info = () => page.evaluate((s) => { const e = document.querySelector(s); return e && { cls: e.className, chips: e.querySelectorAll('.ng-value').length, clear: !!e.querySelector('.ng-clear-wrapper'), arrow: !!e.querySelector('.ng-arrow-wrapper'), panel: !!document.querySelector('ng-dropdown-panel'), contH: e.querySelector('.ng-select-container')?.getBoundingClientRect().height }; }, sel);
await ciboLogin(page);
await page.locator('a[href="/cibo/payment-management"]').first().click(); await settle(15000);
out('FIRST', await info());
await page.locator(`${sel} .ng-select-container`).click();
out('PANEL_AFTER_CONTAINER_CLICK_1', await page.locator('ng-dropdown-panel').isVisible());
await page.locator('ng-dropdown-panel .ng-optgroup').filter({ hasText: exact('FPX Online Banking') }).first().click();
await page.keyboard.press('Escape');
out('AFTER_PICK', await info());
await page.locator('a[href="/cibo/transaction-management"]').first().click(); await settle(4000);
await page.locator('a[href="/cibo/payment-management"]').first().click(); await settle(15000);
out('SECOND', await info());
const box = await page.locator(`${sel} .ng-select-container`).boundingBox();
out('CONTAINER_BOX', box);
// what is under the centre of the container (where Playwright clicks)
out('AT_CENTRE', await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e && { tag: e.tagName, cls: e.className, text: (e.textContent || '').trim().slice(0, 40) }; }, { x: box.x + box.width / 2, y: box.y + box.height / 2 }));
await page.locator(`${sel} .ng-select-container`).click();
await page.waitForTimeout(800);
out('PANEL_AFTER_CONTAINER_CLICK_2', await page.locator('ng-dropdown-panel').isVisible().catch(() => false));
out('AFTER_CLICK_2', await info());
await page.keyboard.press('Escape');
await page.locator(`${sel} .ng-arrow-wrapper`).click();
await page.waitForTimeout(800);
out('PANEL_AFTER_ARROW_CLICK', await page.locator('ng-dropdown-panel').isVisible().catch(() => false));
out('GROUP_CLASSES', await page.evaluate(() => [...document.querySelectorAll('ng-dropdown-panel .ng-optgroup')].map((g) => [g.textContent.trim(), g.className])));
await page.keyboard.press('Escape');
// B: the verify test's order: FPX group ticked, [Search], then the sidebar's Payment Management link clicked AGAIN
// from Payment Management itself (no other page in between).
await page.locator(`${sel} .ng-select-container`).click();
await page.locator('ng-dropdown-panel .ng-optgroup').filter({ hasText: exact('FPX Online Banking') }).first().click();
await page.keyboard.press('Escape');
await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(8000);
await page.locator('a[href="/cibo/payment-management"]').first().click(); await settle(8000);
out('B_SAME_ROUTE_AGAIN', await info());
const box2 = await page.locator(`${sel} .ng-select-container`).boundingBox();
out('B_AT_CENTRE', await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e && { tag: e.tagName, cls: e.className, text: (e.textContent || '').trim().slice(0, 40) }; }, { x: box2.x + box2.width / 2, y: box2.y + box2.height / 2 }));
await page.locator(`${sel} .ng-select-container`).click({ timeout: 10000 }).catch((e) => out('B_CONTAINER_CLICK_ERR', String(e).slice(0, 200)));
await page.waitForTimeout(800);
out('B_PANEL_AFTER_CONTAINER_CLICK', await page.locator('ng-dropdown-panel').isVisible().catch(() => false));
out('B_AFTER', await info());
await page.keyboard.press('Escape');
out('B_CLEAR_WRAPPER', await page.locator(`${sel} .ng-clear-wrapper`).evaluate((e) => ({ display: getComputedStyle(e).display, vis: getComputedStyle(e).visibility, w: e.getBoundingClientRect().width })).catch((e) => String(e).slice(0, 80)));
// the chips' own "x" (span.ng-value-icon), one by one, as a user would
for (let i = 0; i < 40 && (await page.locator(`${sel} .ng-value .ng-value-icon`).count()); i++) {
  await page.locator(`${sel} .ng-value .ng-value-icon`).first().click();
}
await page.keyboard.press('Escape');
out('B_AFTER_CLEAR', await info());
await page.keyboard.press('Escape');
await page.locator(`${sel} .ng-arrow-wrapper`).click(); await page.waitForTimeout(800);
out('B_PANEL_AFTER_ARROW', await page.locator('ng-dropdown-panel').isVisible().catch(() => false));
await page.keyboard.press('Escape');
await browser.close();
