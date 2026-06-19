// Capture our login page (refresh fails → unauthenticated) to compare with login.png.
import { chromium } from '@playwright/test';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '..', '.design-render');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
await page.route('http://localhost:5173/api/auth/refresh', (r) =>
  r.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"no"}' }));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(OUT, 'app-login.png') });
console.log('login text:', (await page.locator('body').innerText()).slice(0, 240).replace(/\n/g, ' | '));
await browser.close();
