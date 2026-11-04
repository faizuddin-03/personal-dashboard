// Probe 1: log in, map the menu, save the session to the scratchpad (outside the repo).
import { chromium, ciboLogin, dump, SCRATCH, STATE } from './cibo-lib.mjs';
import path from 'node:path';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const r = await ciboLogin(page);
console.log('password field pre-filled length on a fresh browser:', r.prefilledLen, '| after login:', r.url);
await page.screenshot({ path: path.join(SCRATCH, 'p1-after-login.png') });
const d = await dump(page, 'p1-after-login');
console.log('links:', JSON.stringify(d.links));
await ctx.storageState({ path: STATE });
await browser.close();
