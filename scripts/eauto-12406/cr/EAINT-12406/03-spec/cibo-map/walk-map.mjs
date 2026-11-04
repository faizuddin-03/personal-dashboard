// CIBO map walk, 28.10.2026 (EAINT-12406, cr-explore). STRICT read only:
//  only sidebar links, filter dropdowns, [Search], pager links and row links that open a view are clicked.
//  Never clicked: Create account / Save update / Save / Edit / Duplicate / Send Quotation Link / Print / Export / Logout.
//  The Create New user form is opened and left through the sidebar without saving.
// One browser context = one continuous video per module group.
// usage: node walk-map.mjs <admin|customers|transactions|reports>
import { chromium, ciboLogin, SCRATCH } from '../before-walk/cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';

const REPO = 'C:/Users/Azfar/Documents/Github Pro/eauto-qa-azfar';
const OUT = path.join(REPO, 'cr/EAINT-12406/04-explore/2026-10-28-cibo-map');
fs.mkdirSync(OUT, { recursive: true });
const group = process.argv[2];
const VIDEO_TMP = path.join(SCRATCH, 'map-video-' + group);
fs.rmSync(VIDEO_TMP, { recursive: true, force: true });
const browser = await chromium.launch({ slowMo: 120 });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1000 }, recordVideo: { dir: VIDEO_TMP, size: { width: 1920, height: 1000 } } });
const page = await ctx.newPage();
const writes = [];
page.on('request', (r) => {
  if (!r.url().includes('/ins-api') || r.url().includes('/authenticate')) return;
  if (r.method() !== 'GET' && !/\/(page|summary)(\?|$)/.test(r.url())) writes.push(r.method() + ' ' + r.url());
});
const log = [];
const settle = async (ms = 1500) => { await page.waitForLoadState('networkidle', { timeout: 180000 }).catch(() => {}); await page.waitForTimeout(ms); };
const waitSpinner = async (to = 300000) => { const t0 = Date.now(); while (Date.now() - t0 < to) { if (!(await page.locator('.ia-spinner, .spinner-border').count())) break; await page.waitForTimeout(800); } };
const go = async (rt) => { await page.locator(`a[href="/cibo/${rt}"]`).first().click(); await settle(2500); };
const search = async () => { await page.getByRole('button', { name: 'Search', exact: true }).first().click(); await page.waitForTimeout(1500); await waitSpinner(); await settle(1500); };
const shot = async (name, opts = {}) => {
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: opts.full ?? false, ...(opts.clip ? { clip: opts.clip } : {}) });
  log.push(name + '.png  <- ' + page.url().replace(/customer-details\/(\w)\/\w+/, 'customer-details/$1/<ID No>'));
};
// page title down to the bottom of the table header row (no data rows)
const headClip = async () => page.evaluate(() => {
  window.scrollTo(0, 0);
  const th = document.querySelector('table thead');
  const b = th ? th.getBoundingClientRect().bottom : (document.querySelector('button.btn-primary, .btn')?.getBoundingClientRect().bottom || 500) + 20;
  return { x: 0, y: 0, width: 1920, height: Math.min(1000, Math.ceil(b) + 2) };
});
// open an ng-select and clip the control + its panel
const dropShot = async (control, name) => {
  await page.locator(`ng-select[formcontrolname="${control}"] .ng-select-container`).click(); await page.waitForTimeout(900);
  const clip = await page.evaluate((c) => {
    const a = document.querySelector(`ng-select[formcontrolname="${c}"]`).getBoundingClientRect();
    const p = document.querySelector('ng-dropdown-panel'); const b = p ? p.getBoundingClientRect() : a;
    const x = Math.min(a.x, b.x) - 10, y = Math.min(a.y, b.y) - 10;
    return { x: Math.max(0, x), y: Math.max(0, y + scrollY), width: Math.max(a.right, b.right) - x + 20, height: Math.max(a.bottom, b.bottom) - y + 20 };
  }, control);
  await shot(name, { clip });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
};
// columns fromHeader .. last column, header + first n rows (amount / code columns, no names or IC)
const colClip = async (fromHeader, toHeader, n = 20) => page.evaluate(([f, t, n]) => {
  const ths = [...document.querySelectorAll('table thead th')];
  const a = ths.find((x) => x.innerText.trim() === f); const z = t ? ths.find((x) => x.innerText.trim() === t) : ths[ths.length - 1];
  z.scrollIntoView({ inline: 'end', block: 'nearest' }); a.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  const ra = a.getBoundingClientRect(), rz = z.getBoundingClientRect();
  const rows = [...document.querySelectorAll('table tbody tr')].slice(0, n);
  const bottom = rows.length ? rows[rows.length - 1].getBoundingClientRect().bottom : rz.bottom;
  return { x: Math.max(0, ra.x - 2), y: ra.y + scrollY - 2, width: rz.right - ra.x + 4, height: bottom - ra.y + 4 };
}, [fromHeader, toHeader, n]);
const yearSel = 'ngb-datepicker select[title="Select year"], ngb-datepicker select[aria-label="Select year"]';
const monthSel = 'ngb-datepicker select[title="Select month"], ngb-datepicker select[aria-label="Select month"]';
const pickDay1 = async (input, y, m) => {
  await page.locator(`input[formcontrolname="${input}"]`).click(); await page.waitForTimeout(600);
  await page.locator(yearSel).selectOption(String(y)); await page.locator(monthSel).selectOption(String(m)); await page.waitForTimeout(300);
  await page.locator('ngb-datepicker [ngbdatepickerdayview], ngb-datepicker .btn-light').filter({ hasText: /^\s*1\s*$/ }).first().click(); await page.waitForTimeout(500);
};
const pickOpt = async (control, text) => {
  await page.locator(`ng-select[formcontrolname="${control}"] .ng-select-container`).click(); await page.waitForTimeout(700);
  await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: new RegExp(`^\\s*${text}\\s*$`) }).first().click();
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
};
const gotoPage = async (n) => { await page.locator('ngb-pagination a.page-link').filter({ hasText: new RegExp(`^\\s*${n}\\s*`) }).first().click(); await page.waitForTimeout(1200); await waitSpinner(); await settle(800); };

await ciboLogin(page);

if (group === 'admin') {
  await shot('map-01-dashboard');
  // User Account Management
  await go('user-account-management');
  await shot('map-02a-user-account-management-filters');
  await dropShot('role', 'map-02b-user-account-management-role-filter-values');
  await dropShot('status', 'map-02c-user-account-management-account-status-filter-values');
  await dropShot('dateRange', 'map-02d-user-account-management-date-range-type-values');
  await search();
  await shot('map-02e-user-account-management-listing-header', { clip: await headClip() });
  await shot('map-02f-user-account-management-listing-PERSONAL-DATA', { full: true });
  await page.locator('table tbody tr a[href*="user-details"]').first().click(); await settle(2500);
  await shot('map-02g-user-details-edit-form-PERSONAL-DATA', { full: true });
  // lower half of the form (role, status, created by) carries no personal data
  const lower = await page.evaluate(() => { const el = [...document.querySelectorAll('*')].find((e) => e.childElementCount === 0 && e.innerText?.trim() === 'Role'); const r = el.getBoundingClientRect(); return { x: 300, y: r.y + scrollY - 20, width: 1620, height: Math.min(600, document.body.scrollHeight - r.y - scrollY + 20) }; });
  await shot('map-02h-user-details-role-status-and-save-update-button', { clip: lower, full: true });
  await go('user-account-management');
  await page.getByText('Create New').first().click(); await settle(2000);
  await shot('map-02i-create-new-user-form-empty', { full: true });
  // Pick the role on the unsaved form only, to show the Insurance Company field; the form is left through the sidebar, never submitted.
  await page.locator('label', { hasText: 'Insurance Company User' }).first().click(); await page.waitForTimeout(800);
  await page.locator('select[formcontrolname="insuranceComp"]').evaluate((s) => { s.size = s.options.length + 1; }); // show the native list as a list box for the screenshot (display only)
  await page.waitForTimeout(400);
  await shot('map-02j-create-new-user-insurance-company-user-role-insurer-list', { full: true });
  // Agent Management
  await go('agent-management');
  await shot('map-03a-agent-management-filters');
  await dropShot('platform', 'map-03b-agent-management-platform-filter-values');
  await dropShot('entityType', 'map-03c-agent-management-entity-type-filter-values');
  await dropShot('bankAccount', 'map-03d-agent-management-bank-filter-values');
  await search();
  await shot('map-03e-agent-management-listing-header', { clip: await headClip() });
  await shot('map-03f-agent-management-listing-PERSONAL-DATA', { full: true });
  // Discount Code Management
  await go('discount-management');
  await shot('map-04a-discount-code-management-filters');
  await dropShot('platform', 'map-04b-discount-code-management-platform-filter-values');
  await dropShot('discountStatus', 'map-04c-discount-code-management-status-filter-values');
  await search();
  await shot('map-04d-discount-code-management-listing-header', { clip: await headClip() });
  for (const n of [1, 2, 3]) {
    if (n > 1) await gotoPage(n);
    await shot(`map-04e-discount-codes-page${n}-code-discount-commission-columns`, { clip: await colClip('Discount Code', 'Commission'), full: true });
    await shot(`map-04f-discount-code-management-page${n}-PERSONAL-DATA`, { full: true });
  }
  // Macrokiosk Template Management (settings: looked at only, never saved)
  await go('macrokiosk-template-management');
  await shot('map-05-macrokiosk-template-management-settings', { full: true });
}

if (group === 'customers') {
  await go('crm');
  await shot('map-06a-crm-filters');
  await dropShot('ownershipType', 'map-06b-crm-ownership-type-filter-values');
  await search();
  await shot('map-06c-crm-listing-header', { clip: await headClip() });
  await shot('map-06d-crm-listing-PERSONAL-DATA', { full: true });
  const pager = await page.evaluate(() => { const p = document.querySelector('ngb-pagination'); p.scrollIntoView({ block: 'center' }); const r = p.getBoundingClientRect(); return { x: r.x - 20, y: r.y + scrollY - 10, width: r.width + 40, height: r.height + 20 }; });
  await shot('map-06e-crm-pager', { clip: pager, full: true });
  await page.locator('table tbody tr a[href*="customer-details"]').first().click(); await settle(3000); await waitSpinner();
  await shot('map-06f-crm-customer-details-PERSONAL-DATA', { full: true });
  await shot('map-06g-crm-customer-details-top-PERSONAL-DATA');
  await go('visitor-management');
  await shot('map-07a-visitor-management-filters');
  await search();
  await shot('map-07b-visitor-management-listing-header', { clip: await headClip() });
  await shot('map-07c-visitor-management-listing-PERSONAL-DATA', { full: true });
}

if (group === 'transactions') {
  await go('transaction-management');
  await search();
  await shot('map-08a-transaction-management-listing-header-print-export', { clip: await headClip() });
  await shot('map-08b-transaction-management-listing-PERSONAL-DATA', { full: true });
  await go('payment-management');
  await shot('map-09a-payment-management-filters');
  await dropShot('selectedPaymentStatus', 'map-09b-payment-management-payment-status-filter-values');
  await search();
  await shot('map-09c-payment-management-listing-header', { clip: await headClip() });
  await shot('map-09d-payment-management-listing-PERSONAL-DATA', { full: true });
  await go('referred-risk-log');
  await shot('map-10a-referred-risk-log-filters-default-dates');
  await dropShot('selectedPlatform', 'map-10b-referred-risk-log-platform-filter-values');
  await dropShot('selectedPlanCode', 'map-10c-referred-risk-log-plan-code-filter-values');
  await search();
  await shot('map-10d-referred-risk-log-listing-header', { clip: await headClip() });
  await shot('map-10e-referred-risk-log-listing-this-month-PERSONAL-DATA', { full: true });
  // 30-day window: From 01-05-2025 sets Till to 30-05-2025 and the Till calendar greys out later days
  await pickDay1('fromLogDate', 2025, 5);
  await page.locator('input[formcontrolname="toLogDate"]').click(); await page.waitForTimeout(800);
  await shot('map-10f-referred-risk-log-till-limited-to-30-days');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await pickOpt('selectedPlanCode', 'Allianz');
  await search();
  await shot('map-10g-referred-risk-log-allianz-may-2025-insurer-and-remark-columns', { clip: await colClip('Insurance Company', 'Remark'), full: true });
  await shot('map-10h-referred-risk-log-allianz-may-2025-PERSONAL-DATA', { full: true });
}

if (group === 'reports') {
  await go('payment-report');
  await pickOpt('insuranceComp', 'Allianz');
  await shot('map-11a-payment-report-filters-allianz');
  await dropShot('state', 'map-11b-payment-report-state-filter-values');
  await dropShot('coverageType', 'map-11c-payment-report-coverage-type-filter-values');
  await dropShot('roadTax', 'map-11d-payment-report-road-tax-filter-values');
  await dropShot('discountCode', 'map-11e-payment-report-discount-code-filter-values');
  await search();
  await shot('map-11f-payment-report-allianz-summary-and-header', { clip: await headClip() });
  await shot('map-11g-payment-report-allianz-payment-mode-to-commission-columns', { clip: await colClip('Payment Mode', null), full: true });
  await shot('map-11h-payment-report-allianz-PERSONAL-DATA', { full: true });
  await go('commission-report');
  await pickOpt('insuranceComp', 'Allianz');
  await dropShot('roadTax', 'map-12a-commission-report-road-tax-filter-values');
  await search();
  await shot('map-12b-commission-report-allianz-summary-and-header', { clip: await headClip() });
  await shot('map-12c-commission-report-allianz-insurer-to-commission-columns', { clip: await colClip('Insurance Company', null), full: true });
  await shot('map-12d-commission-report-allianz-PERSONAL-DATA', { full: true });
}

const video = page.video();
await ctx.close(); await browser.close();
const vname = `video-${group}.webm`;
fs.copyFileSync(await video.path(), path.join(OUT, vname));
fs.appendFileSync(path.join(OUT, 'capture-log.txt'), `## ${group} ${new Date().toISOString()}\n${log.join('\n')}\n${vname}\nnon-read requests: ${writes.length ? writes.join(', ') : 'none'}\n\n`);
console.log(group, 'shots', log.length, 'non-read requests', JSON.stringify(writes));
