// Probe: how Chrome's PDF viewer lays out a Secarang receipt at 1920x1080, and whether the video shows it.
import { chromium, SCRATCH } from '../before-walk/cibo-lib.mjs';
import path from 'node:path';
const pdf = 'C:/Users/Azfar/Documents/Github Pro/eauto-qa-azfar/cr/EAINT-12406/04-explore/2026-10-28-before-deploy/cibo-11d-tokio-marine-BR69005852-receipt-PERSONAL-DATA.pdf';
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-position=-2400,0'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: path.join(SCRATCH, 'pdfvid'), size: { width: 1920, height: 1080 } } });
const page = await ctx.newPage();
await page.goto('about:blank');
await page.goto('file:///' + pdf + '#zoom=100');
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(SCRATCH, 'pdf-1920.png') });
await page.goBack().catch(() => {});
await ctx.close(); await browser.close();
