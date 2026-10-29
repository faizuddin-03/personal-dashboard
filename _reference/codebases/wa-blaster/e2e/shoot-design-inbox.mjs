// Capture the DESIGN bundle's Inbox screen for background reference.
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), '..');
const BUNDLE = path.join(ROOT, 'docs/design/WhatsApp Blaster (offline).html');
const OUT = path.join(ROOT, '.design-render');
const url = pathToFileURL(BUNDLE).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1800);
for (const a of [
  () => page.getByRole('button', { name: /^admin$/i }).click({ timeout: 1500 }),
  () => page.getByRole('button', { name: /sign in/i }).click({ timeout: 1500 }),
]) { try { await a(); break; } catch {} }
await page.waitForTimeout(1200);

for (const sel of [
  () => page.getByRole('button', { name: /open inbox/i }).click({ timeout: 1500 }),
  () => page.locator('[aria-label="Inbox"]').first().click({ timeout: 1500 }),
  () => page.getByText('Inbox', { exact: true }).last().click({ timeout: 1500 }),
]) { try { await sel(); break; } catch {} }
await page.waitForTimeout(1800);
await page.screenshot({ path: path.join(OUT, 'design-inbox.png') });
console.log('inbox text:', (await page.locator('body').innerText()).slice(0, 160).replace(/\n/g, ' | '));
await browser.close();
