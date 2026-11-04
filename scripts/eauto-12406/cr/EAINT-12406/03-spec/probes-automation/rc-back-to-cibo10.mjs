// EAINT-12406 probe 10 (29.10.2026, cr-author sheet RC, after triage S1 / RC_TS4 rerun): after ts.showFile()
// (page.setContent: the CIBO app is replaced, the URL stays), can the run get back to CIBO WITHOUT signing in again
// by opening the CIBO dashboard address? READ ONLY: sign in, open Transaction Management (no search), replace the
// DOM, open /cibo/dashboard, read URL + sidebar. Nothing searched, pressed or saved.
import { chromium, ciboLogin, CIBO } from '../before-walk/cibo-lib.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const out = (k, v) => console.log(k, JSON.stringify(v));
const side = async () => ({ url: page.url(), dashLinks: await page.locator('a[href="/cibo/dashboard"]').count(), tmLinks: await page.locator('a[href="/cibo/transaction-management"]').count(), tmVisible: await page.locator('a[href="/cibo/transaction-management"]').first().isVisible().catch(() => false) });
await ciboLogin(page);
out('AFTER_LOGIN', await side());
await page.locator('a[href="/cibo/transaction-management"]').first().click();
await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(3000);
out('ON_TM', await side());
await page.setContent('<html><body><pre>showFile stand-in</pre></body></html>');
out('AFTER_SETCONTENT', await side());
await page.goto(CIBO + '/dashboard', { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(3000);
out('AFTER_GOTO_DASHBOARD', await side());
out('WELCOME', /Welcome,[^\n.]*\.?/.exec(await page.locator('body').innerText())?.[0] ?? '');
await page.locator('a[href="/cibo/transaction-management"]').first().click();
await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(3000);
out('TM_AGAIN', await side());
out('TM_SEARCH_BOX', await page.locator("input[formcontrolname='search']").filter({ visible: true }).count());
await browser.close();
