// CIBO map 28.10.2026 (read only): CRM tooltips (hover) and the vehicle card Edit view, closed with Cancel (never Save Update).
// Duplicate is NOT clicked. Also reads the hidden "Payee" header on Payment Management. Video recorded.
import { chromium, ciboLogin, SCRATCH } from '../before-walk/cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';

const OUT = 'C:/Users/Azfar/Documents/Github Pro/eauto-qa-azfar/cr/EAINT-12406/04-explore/2026-10-28-cibo-map';
const VT = path.join(SCRATCH, 'map-video-crm-edit');
fs.rmSync(VT, { recursive: true, force: true });
const browser = await chromium.launch({ slowMo: 120 });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 }, recordVideo: { dir: VT, size: { width: 1920, height: 1000 } } });
const page = await ctx.newPage();
const writes = [];
page.on('request', (r) => { if (r.url().includes('/ins-api') && !r.url().includes('/authenticate') && r.method() !== 'GET' && !/\/(page|summary)(\?|$)/.test(r.url())) writes.push(r.method() + ' ' + r.url()); });
const settle = async (ms = 1500) => { await page.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {}); await page.waitForTimeout(ms); };
const waitSpinner = async () => { for (let i = 0; i < 200 && (await page.locator('.ia-spinner, .spinner-border').count()); i++) await page.waitForTimeout(800); };
await ciboLogin(page);
await page.locator('a[href="/cibo/crm"]').first().click(); await settle(2000);
await page.getByRole('button', { name: 'Search', exact: true }).first().click(); await page.waitForTimeout(1500); await waitSpinner(); await settle();
const tip = async (loc) => { await loc.hover(); await page.waitForTimeout(900); return page.evaluate(() => [...document.querySelectorAll('ngb-tooltip-window, .tooltip, [role=tooltip]')].map((t) => t.innerText.trim()).join(' | ')); };
const listTip = await tip(page.locator('table thead th', { hasText: 'Latest Coverage Period' }).locator('i, svg, span').last());
console.log('CRM list tooltip:', listTip);
await page.locator('table tbody tr a[href*="customer-details"]').first().click(); await settle(3000); await waitSpinner();
const icons = page.locator('i.bi-info-circle, [ngbtooltip], [placement]');
const tips = [];
for (let i = 0; i < Math.min(await icons.count(), 2); i++) tips.push(await tip(icons.nth(i)));
console.log('CRM detail tooltips:', JSON.stringify(tips));
// Edit on the first vehicle card, then Cancel
await page.getByRole('button', { name: 'Edit', exact: true }).first().click(); await page.waitForTimeout(1500);
const ed = await page.evaluate(() => ({ editable: [...document.querySelectorAll('input:not([type=checkbox]), textarea, select, ng-select')].filter((e) => e.offsetParent).map((e) => [e.tagName, e.getAttribute('formcontrolname'), e.disabled || e.readOnly]), buttons: [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => b.innerText.trim()).filter(Boolean) }));
console.log('Edit view fields:', JSON.stringify(ed.editable), 'visible buttons:', JSON.stringify([...new Set(ed.buttons)]));
await page.screenshot({ path: path.join(OUT, 'map-06h-crm-vehicle-card-edit-view-PERSONAL-DATA.png') });
await page.getByRole('button', { name: 'Cancel', exact: true }).first().click(); await page.waitForTimeout(1200);
const after = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => b.innerText.trim()).filter(Boolean));
console.log('after Cancel visible buttons:', JSON.stringify([...new Set(after)]));
// Payment Management: hidden header?
await page.locator('a[href="/cibo/payment-management"]').first().click(); await settle(2000);
await page.getByRole('button', { name: 'Search', exact: true }).first().click(); await page.waitForTimeout(1500); await waitSpinner(); await settle();
console.log('PM headers (text, visible):', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('table thead th')].map((t) => [t.textContent.trim(), !!t.offsetParent && getComputedStyle(t).display !== 'none']))));
const video = page.video();
await ctx.close(); await browser.close();
fs.copyFileSync(await video.path(), path.join(OUT, 'video-crm-edit-and-tooltips.webm'));
fs.appendFileSync(path.join(OUT, 'capture-log.txt'), `## crm-edit ${new Date().toISOString()}\nmap-06h-crm-vehicle-card-edit-view-PERSONAL-DATA.png  <- https://staging.secarang.com/cibo/crm/customer-details/i/<ID No> (Edit opened, then Cancel)\nvideo-crm-edit-and-tooltips.webm\nnon-read requests: ${writes.length ? writes.join(', ') : 'none'}\n\n`);
console.log('non-read requests', JSON.stringify(writes));
