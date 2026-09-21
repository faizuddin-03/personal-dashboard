// Render OUR app's shell (auth mocked) and screenshot the sidebar to compare to the design.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), '..');
const OUT = path.join(ROOT, '.design-render');
mkdirSync(OUT, { recursive: true });

const USER = { id: 'u1', email: 'aiman@eauto.my', role: 'ADMIN', name: 'Aiman Tan' };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Mock auth refresh so the shell mounts; everything else returns empty so pages don't hang.
// Match only the ORIGIN /api/ path — NOT Vite's /src/api/ module requests.
await page.route('http://localhost:5173/api/auth/refresh', (r) =>
  r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ accessToken: 'mock', user: USER }) }));
await page.route('http://localhost:5173/api/**', (r) => {
  if (r.request().url().includes('/auth/refresh')) return r.fallback();
  return r.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});

page.on('console', (m) => console.log('  [console]', m.type(), m.text().slice(0, 200)));
page.on('pageerror', (e) => console.log('  [pageerror]', e.message.slice(0, 200)));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

await page.screenshot({ path: path.join(OUT, 'app-full.png') });
const hasSidebar = await page.locator('aside.sidebar').count();
console.log('sidebar present?', hasSidebar);
console.log('body text head:', (await page.locator('body').innerText()).slice(0, 200).replace(/\n/g, ' | '));
if (hasSidebar) {
  await page.locator('aside.sidebar').first().screenshot({ path: path.join(OUT, 'app-sidebar.png') });
}
console.log('done →', OUT);
await browser.close();
