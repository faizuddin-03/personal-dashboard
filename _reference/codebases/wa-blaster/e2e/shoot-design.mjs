// Render the blue "Aurora / eAuto" design bundle and screenshot it for visual reference.
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), '..');
const BUNDLE = path.join(ROOT, 'docs/design/WhatsApp Blaster (offline).html');
const OUT = path.join(ROOT, '.design-render');
mkdirSync(OUT, { recursive: true });

const url = pathToFileURL(BUNDLE).href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1800); // let React mount

await page.screenshot({ path: path.join(OUT, '01-boot.png') });

// Try to enter the app from the login screen (demo role or sign in).
const entryAttempts = [
  () => page.getByRole('button', { name: /^admin$/i }).click({ timeout: 1500 }),
  () => page.getByRole('button', { name: /sign in/i }).click({ timeout: 1500 }),
  () => page.getByText(/skip.*dashboard|explore the dashboard/i).click({ timeout: 1500 }),
];
for (const attempt of entryAttempts) {
  try { await attempt(); break; } catch { /* try next */ }
}
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, '02-dashboard.png'), fullPage: false });

// Crop the sidebar specifically.
for (const sel of ['aside', '.sidebar', '[class*="sidebar"]', 'nav']) {
  const el = page.locator(sel).first();
  if (await el.count()) {
    try { await el.screenshot({ path: path.join(OUT, '03-sidebar.png') }); break; } catch { /* next */ }
  }
}

// Try navigating to Inbox for a second screen reference.
try {
  await page.getByRole('link', { name: /inbox/i }).first().click({ timeout: 1500 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, '04-inbox.png') });
} catch { /* ignore */ }

console.log('done →', OUT);
await browser.close();
