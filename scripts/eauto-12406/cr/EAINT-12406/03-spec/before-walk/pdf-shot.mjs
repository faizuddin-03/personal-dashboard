// Screenshot a PDF (receipt) as PNG through Chrome's built-in PDF viewer (window placed off-screen).
// usage: node pdf-shot.mjs <pdf with forward slashes> <png>
import { chromium } from './cibo-lib.mjs';
const [pdf, png] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-position=-2400,0'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 1300 } });
await page.goto('file:///' + pdf);
await page.waitForTimeout(3500);
await page.screenshot({ path: png });
await browser.close();
