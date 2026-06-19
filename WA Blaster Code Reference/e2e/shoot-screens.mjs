// Render all of OUR app's screens (auth mocked, empty API) for visual sweep.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '..', '.design-render');
mkdirSync(OUT, { recursive: true });
const USER = { id: 'u1', email: 'aiman@eauto.my', role: 'ADMIN', name: 'Aiman Tan' };

const SCREENS = [
  ['blasts', '/blasts'],
  ['inbox', '/inbox'],
  ['dealers', '/contacts'],
  ['templates', '/templates'],
  ['performance', '/reports'],
  ['knowledge', '/knowledge'],
  ['settings', '/settings'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.route('http://localhost:5173/api/auth/refresh', (r) =>
  r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ accessToken: 'mock', user: USER }) }));
await page.route('http://localhost:5173/api/**', (r) => {
  const u = r.request().url();
  if (u.includes('/auth/refresh')) return r.fallback();
  // Paginated list endpoints expect { items, total }; everything else an array.
  const body = /\/api\/contacts(\?|$)/.test(u) ? '{"items":[],"total":0,"page":1,"pageSize":20}' : '[]';
  return r.fulfill({ status: 200, contentType: 'application/json', body });
});

for (const [name, route] of SCREENS) {
  try {
    await page.goto('http://localhost:5173' + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `app-${name}.png`) });
    const txt = (await page.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' | ');
    console.log(`${name}: ${txt}`);
  } catch (e) {
    console.log(`${name}: ERROR ${String(e).slice(0, 120)}`);
  }
}
await browser.close();
