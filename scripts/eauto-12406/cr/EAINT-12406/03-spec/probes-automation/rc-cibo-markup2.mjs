// EAINT-12406 probe 2 (29.10.2026, cr-author sheet RC): reports' rows + Export, a Pending payment Transaction
// Details, the Export of a ONE-row Transaction Listing search. READ ONLY: searches and one Export (a CSV download of
// one old row, read for its header only, then deleted). Nothing created, saved, edited or sent. Values are masked.
import { chromium, ciboLogin } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true });
const page = await ctx.newPage();
const dialogs = [];
page.on('dialog', async (d) => { dialogs.push(`${d.type()}: ${d.message()}`); await d.dismiss(); });
const out = (k, v) => console.log(k, JSON.stringify(v));
const settle = async (ms = 1500) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
const maskHtml = (s) => s.replace(/>[^<]{1,}</g, (m) => m.replace(/[0-9]/g, '9'));

async function pickOpt(control, text) {
  await page.locator(`ng-select[formcontrolname="${control}"] .ng-select-container`).click();
  await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: new RegExp(`^\\s*${text}\\s*$`) }).first().click();
  await page.keyboard.press('Escape');
}
async function pickDate(control, y, m, d) {
  await page.locator(`input[formcontrolname="${control}"]`).click();
  const dp = page.locator('ngb-datepicker').filter({ visible: true }).first();
  await dp.locator("select[title='Select year'], select[aria-label='Select year']").selectOption(String(y));
  await dp.locator("select[title='Select month'], select[aria-label='Select month']").selectOption(String(m));
  await dp.locator('[ngbdatepickerdayview]:not(.outside), .ngb-dp-day:not(.hidden) .btn-light:not(.outside)').filter({ hasText: new RegExp(`^\\s*${d}\\s*$`) }).first().click();
}
const rowHtml = (col) => page.evaluate((col) => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const t = [...document.querySelectorAll('table')].find((t) => [...t.querySelectorAll('thead th')].some((th) => norm(th.textContent) === col));
  if (!t) return null;
  const heads = [...t.querySelectorAll('thead th')].map((th) => norm(th.textContent));
  const tr = t.querySelector('tbody tr');
  return { heads, cells: tr ? [...tr.children].map((td, i) => ({ h: heads[i], html: td.innerHTML.slice(0, 300) })) : [] };
}, col);
const buttons = () => page.evaluate(() => [...document.querySelectorAll('button')].filter((e) => e.offsetParent && /print|export/i.test(e.innerText || '')).map((e) => ({ cls: e.className, text: (e.innerText || '').trim() })));

await ciboLogin(page);

// ---- Transaction Listing: one-row search, Export once
await page.locator('a[href="/cibo/transaction-management"]').first().click();
await settle(4000);
await page.locator('input[formcontrolname="search"]').fill('BR55004010');
await page.getByRole('button', { name: 'Search', exact: true }).click();
await settle(5000);
const dlP = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
await page.locator('button').filter({ hasText: /^\s*Export\s*$/ }).first().click();
const dl = await dlP;
await page.waitForTimeout(1500);
out('TM_EXPORT_DIALOGS', dialogs.splice(0));
if (dl) {
  const f = path.join(os.tmpdir(), 'claude-12406-tm-export.csv');
  await dl.saveAs(f);
  const txt = fs.readFileSync(f, 'utf8');
  const lines = txt.split(/\r?\n/);
  out('TM_EXPORT', { name: dl.suggestedFilename(), lines: lines.length, header: lines[0], row1masked: (lines[1] || '').replace(/[0-9]/g, '9').replace(/"[A-Z][A-Z ]{6,}"/g, '"NAME"') });
  fs.rmSync(f);
} else out('TM_EXPORT', 'no download within 30 s');
// the modal / toast after export, if any
out('TM_AFTER_EXPORT_MODAL', await page.locator('ngb-modal-window, .toast, .swal2-popup').allInnerTexts().catch(() => []));

// ---- Pending payment details
await page.locator('input[formcontrolname="search"]').fill('BR44003678');
await page.getByRole('button', { name: 'Search', exact: true }).click();
await settle(5000);
out('PENDING_ROW_PAYMENT', await page.evaluate(() => { const heads = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.trim()); const tr = document.querySelector('table tbody tr'); const i = heads.indexOf('Payment'); const s = heads.indexOf('Transaction Status'); return tr ? { pay: tr.children[i].innerHTML.replace(/>[^<]{1,}</g, (m) => m.replace(/[0-9]/g, '9')), status: tr.children[s].innerText } : null; }));
await page.locator('table tbody').getByText('BR44003678', { exact: true }).first().click();
await settle(5000);
out('PENDING_BADGES', await page.evaluate(() => [...document.querySelectorAll('span.badge')].filter((e) => e.offsetParent).map((e) => ({ cls: e.className, html: e.innerHTML.trim().slice(0, 200), bg: getComputedStyle(e).backgroundColor, color: getComputedStyle(e).color }))));
out('PENDING_BUTTONS', await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => (b.innerText || '').trim())));
out('PENDING_LABELS', await page.evaluate(() => [...document.querySelectorAll('.row .text-muted')].map((e) => { const v = e.nextElementSibling; return [e.innerText.trim(), v ? v.innerText.trim().replace(/[0-9]/g, '9').slice(0, 30) : null]; }).filter(([l]) => /Cover Note|Policy No|Insurer/.test(l))));
out('OK_BADGE_REF', 'see probe 1: Insurance created = span.badge.ok-badge');

// ---- Payment Report: Allianz, 01.05.2025 - 07.05.2025
await page.locator('a[href="/cibo/payment-report"]').first().click();
await settle(5000);
await pickOpt('insuranceComp', 'Allianz');
await pickDate('toDate', 2025, 5, 7);
await pickDate('fromDate', 2025, 5, 1);
await page.getByRole('button', { name: 'Search', exact: true }).click();
await settle(6000);
out('PR_BUTTONS', await buttons());
const pr = await rowHtml('Vehicle No');
out('PR_ROW', pr && { heads: pr.heads, cells: pr.cells.filter((c) => /Insurance Company|Payment Ref|Payment Mode|Payment To|Reference No|Invoice/.test(c.h || '')).map((c) => ({ h: c.h, html: maskHtml(c.html) })) });

// ---- Commission Report: Allianz, same week
await page.locator('a[href="/cibo/commission-report"]').first().click();
await settle(5000);
await pickOpt('insuranceComp', 'Allianz');
await pickDate('toDate', 2025, 5, 7);
await pickDate('fromDate', 2025, 5, 1);
await page.getByRole('button', { name: 'Search', exact: true }).click();
await settle(6000);
out('CR_BUTTONS', await buttons());
const cr = await rowHtml('Vehicle No.');
out('CR_ROW', cr && { heads: cr.heads, n: cr.cells.length, cells: cr.cells.filter((c) => /Insurance Company|Reference No|Discount|Commission/.test(c.h || '')).map((c) => ({ h: c.h, html: maskHtml(c.html) })) });
out('CR_NO_RESULT', await page.getByText(/no search result found/i).count());

// ---- Payment Management: one row's channel cell
await page.locator('a[href="/cibo/payment-management"]').first().click();
await settle(9000);
await page.locator('input[formcontrolname="search"]').fill('BR69005852');
await page.getByRole('button', { name: 'Search', exact: true }).click();
await settle(6000);
const pm = await rowHtml('Transaction Ref. No.');
out('PM_ROW', pm && { heads: pm.heads, cells: pm.cells.filter((c) => /Channel|Payment Ref|Response|Transaction Ref/.test(c.h || '')).map((c) => ({ h: c.h, html: maskHtml(c.html) })) });
out('PM_BUTTONS', await buttons());

// ---- Dashboard text (labels only)
await page.locator('a[href="/cibo/dashboard"]').first().click();
await settle(5000);
out('DASHBOARD_HEADINGS', await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,.card-title,.card-header')].filter((e) => e.offsetParent).map((e) => e.innerText.trim().slice(0, 60))));
out('DASHBOARD_HAS_ALLIANZ', await page.evaluate(() => /Allianz/i.test(document.body.innerText)));
await browser.close();
