// EAINT-12406 BEFORE / AFTER-deploy walk (28.10.2026). Read only: no quotation, no payment, no export, nothing changed.
// AFTER run: set WALK_OUT=<new folder> and run the same areas; compare secarang-page-texts.json before / after.
// One browser context = one continuous video per area. Output: cr/EAINT-12406/04-explore/2026-10-28-before-deploy/
// usage: node walk.mjs <secarang|listing|transactions|reports>
import { chromium, ciboLogin, siteGate, OUT, HOST, SCRATCH } from './cibo-lib.mjs';
import path from 'node:path';
import fs from 'node:fs';

const area = process.argv[2];
const VIDEO_TMP = path.join(SCRATCH, 'video-' + area);
fs.rmSync(VIDEO_TMP, { recursive: true, force: true });
const browser = await chromium.launch({ slowMo: 150 });
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1000 }, acceptDownloads: true,
  recordVideo: { dir: VIDEO_TMP, size: { width: 1920, height: 1000 } },
});
const page = await ctx.newPage();
const log = [];
const shot = async (name, opts = {}) => {
  const f = path.join(OUT, name + '.png');
  await (opts.target || page).screenshot({ path: f, fullPage: opts.full ?? false, ...(opts.clip ? { clip: opts.clip } : {}) });
  log.push(name + '.png  <- ' + page.url());
};
const settle = async (ms = 2000) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };

async function openMenu(href) {
  await page.locator(`a[href="/cibo/${href}"]`).first().click();
  await settle(3000);
}
async function openDropdown(control) {
  await page.locator(`ng-select[formcontrolname="${control}"] .ng-select-container`).click();
  await page.waitForTimeout(800);
  const vals = await page.locator('ng-dropdown-panel .ng-option').allInnerTexts();
  return vals.map((v) => v.trim());
}
const closeDropdown = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(300); };
async function pick(control, text) {
  await openDropdown(control);
  await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: new RegExp(`^\\s*${text}\\s*$`) }).first().click();
  await closeDropdown();
}
// the right-hand insurer box on Transaction Details: smallest element holding both "Insurer" and "Total Premium"
async function insurerBoxClip() {
  return page.evaluate(() => {
    let best = null;
    for (const el of document.querySelectorAll('div, section')) {
      const t = el.innerText || '';
      if (t.includes('Insurer') && t.includes('Policy No') && !t.includes('Car Owner Details')) {
        const r = el.getBoundingClientRect();
        if (r.width > 100 && (!best || r.width * r.height < best.w * best.h)) best = { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height };
      }
    }
    return best && { x: best.x, y: best.y, width: best.w, height: Math.min(best.h, 420) };
  });
}

if (area === 'secarang') {
  // Public site /ia/. Read only: the home form is looked at, nothing typed, Get quotation never clicked.
  const texts = {};
  const autoScroll = async () => {
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
  };
  const saveText = async (key) => { texts[key] = await page.evaluate(() => document.body.innerText); };
  const clipOf = async (locator, pad = 16) => {
    await locator.first().scrollIntoViewIfNeeded();
    const b = await locator.first().evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; });
    return { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.w + 2 * pad, height: b.h + 2 * pad };
  };

  // 0. site password page (screenshot before anything is typed), then pass it
  await page.goto(`${HOST}/ia/car-insurance`); await settle(1500);
  await shot('secarang-00-site-password-page');
  await siteGate(page); await settle(2000);

  // 1. Home = /ia/car-insurance (the Secarang logo goes here): pop-up, form, insurer logos
  await shot('secarang-01-home-on-arrival-with-popup');
  const closeBtn = page.locator('ngb-modal-window button.close, ngb-modal-window [aria-label="Close"], ngb-modal-window .btn-close, .modal button.close').first();
  if (await closeBtn.count()) { await closeBtn.click(); await page.waitForTimeout(1000); }
  else { await page.keyboard.press('Escape'); await page.waitForTimeout(1000); }
  await shot('secarang-02-home-form-private-car');
  const companyTab = page.getByText('Company Car', { exact: true }).first();
  if (await companyTab.isVisible().catch(() => false)) {
    await companyTab.click(); await page.waitForTimeout(800);
    await shot('secarang-03-home-form-company-car-tab');
    await page.getByText('Private Car', { exact: true }).first().click(); await page.waitForTimeout(500);
  }
  await autoScroll();
  const logos = page.locator('img[src*="insurance-logo"]:visible');
  texts.homeLogos = await logos.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { src: e.getAttribute('src'), alt: e.alt, x: Math.round(r.x), y: Math.round(r.y + scrollY) }; }).sort((a, b) => a.y - b.y || a.x - b.x));
  const teamwork = page.getByText('Great teamwork makes the dream work').first();
  if (await teamwork.count()) {
    const section = teamwork.locator('xpath=ancestor::*[.//img[contains(@src,"insurance-logo")]][1]');
    await shot('secarang-04-home-insurer-logos', { full: true, clip: await clipOf((await section.count()) ? section : teamwork, 24) });
  }
  await shot('secarang-05-home-full-page', { full: true });
  await saveText('home');

  // 2. motorcycle-insurance (exists?)
  await page.goto(`${HOST}/ia/motorcycle-insurance`); await settle(2000);
  texts.motorcycleUrl = page.url();
  await shot('secarang-06-motorcycle-insurance-address');

  // 3. About Us
  await page.goto(`${HOST}/ia/about-us`); await settle(2000); await autoScroll();
  await shot('secarang-07-about-us-full-page', { full: true });
  const partnership = page.getByText('Our partnership', { exact: true }).first();
  if (await partnership.count()) await shot('secarang-08-about-us-our-partnership', { full: true, clip: await clipOf(partnership.locator('xpath=..'), 24) });
  await saveText('aboutUs');

  // 4. FAQ: open every question
  await page.goto(`${HOST}/ia/faq`); await settle(2000);
  const qs = page.locator('.collapsable-header');
  const nq = await qs.count();
  for (let k = 0; k < nq; k++) {
    const q = qs.nth(k);
    if ((await q.getAttribute('aria-expanded')) !== 'true') { await q.scrollIntoViewIfNeeded(); await q.click(); await page.waitForTimeout(400); }
  }
  texts.faqOpened = await qs.evaluateAll((els) => els.map((e) => [e.innerText.trim(), e.getAttribute('aria-expanded')]));
  await autoScroll();
  await shot('secarang-09-faq-all-questions-open-full-page', { full: true });
  const instant = qs.filter({ hasText: 'Which insurers can I get instant quotation from?' }).first();
  if (await instant.count()) await shot('secarang-10-faq-which-insurers-instant-quotation', { full: true, clip: await clipOf(instant.locator('xpath=..'), 12) });
  await saveText('faq');

  // 5. Support: open every insurer section
  await page.goto(`${HOST}/ia/support`); await settle(2000);
  await shot('secarang-11-support-sections-closed', { full: true });
  const ss = page.locator('.collapsable-header');
  const ns = await ss.count();
  for (let k = 0; k < ns; k++) {
    const h = ss.nth(k);
    if ((await h.getAttribute('aria-expanded')) !== 'true') { await h.scrollIntoViewIfNeeded(); await h.click(); await page.waitForTimeout(500); }
  }
  texts.supportOpened = await ss.evaluateAll((els) => els.map((e) => [e.innerText.trim(), e.getAttribute('aria-expanded')]));
  texts.supportSections = await ss.evaluateAll((els) => els.map((e) => ({ insurer: e.innerText.trim(), body: (e.parentElement.innerText || '').replace(e.innerText, '').trim() })));
  await autoScroll();
  const need = page.getByText('Need to contact insurance company?').first();
  if (await need.count()) await shot('secarang-12-support-need-to-contact-insurance-company-all-open', { full: true, clip: await clipOf(need.locator('xpath=..'), 24) });
  await shot('secarang-13-support-full-page-all-open', { full: true });
  await saveText('support');

  // 6. Terms of Use, Privacy Policy, Refund Policy
  let n = 14;
  for (const [p, k] of [['terms-of-use', 'termsOfUse'], ['privacy-policy', 'privacyPolicy'], ['refund-policy', 'refundPolicy']]) {
    await page.goto(`${HOST}/ia/${p}`); await settle(2000); await autoScroll();
    await shot(`secarang-${n++}-${p}-full-page`, { full: true });
    await saveText(k);
  }

  // which insurer / agency names appear on which page
  const names = ['Lonpac', 'Allianz', 'Tokio', 'RHB', 'Chubb', 'Zurich', 'Takaful', 'Etiqa', 'AIG', 'MSIG', 'AXA', 'Liberty', 'Berjaya Sompo', 'Pacific', 'Generali', 'Bintang Prospek', 'Pemaju'];
  texts.insurerMentions = {};
  for (const [k, v] of Object.entries(texts)) {
    if (typeof v !== 'string') continue;
    texts.insurerMentions[k] = Object.fromEntries(names.map((nm) => [nm, (v.match(new RegExp(nm, 'gi')) || []).length]).filter((x) => x[1]));
  }
  fs.writeFileSync(path.join(OUT, 'secarang-page-texts.json'), JSON.stringify(texts, null, 1));
}

if (area === 'listing') {
  await page.goto(HOST + '/cibo/auth/login'); await settle(1500);
  await shot('cibo-01-login-page-empty');
  await ciboLogin(page); await settle(1500);
  await shot('cibo-02-dashboard-and-menu');
  await openMenu('transaction-management');
  await shot('cibo-03-transaction-management-filters');
  const filters = {};
  for (const c of ['platform', 'insuranceComp', 'dateRange', 'status', 'jpjStatus']) {
    filters[c] = await openDropdown(c);
    if (c === 'platform' || c === 'insuranceComp') await shot(`cibo-04-transaction-management-${c === 'platform' ? 'platform' : 'insurance-company'}-filter-values`);
    await closeDropdown();
  }
  fs.writeFileSync(path.join(OUT, 'cibo-transaction-management-filter-values.json'), JSON.stringify(filters, null, 1));
  await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(4000);
  await shot('cibo-05-transaction-listing-unfiltered-PERSONAL-DATA', { full: true });
  const headers = await page.locator('table thead th').allInnerTexts();
  fs.writeFileSync(path.join(OUT, 'cibo-transaction-listing-columns.json'), JSON.stringify(headers.map((h) => h.replace(/\s+/g, ' ').trim()), null, 1));
  await pick('insuranceComp', 'Allianz');
  await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(4000);
  await shot('cibo-06-transaction-listing-allianz-all-platforms-PERSONAL-DATA', { full: true });
  await pick('platform', 'eAuto');
  await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(4000);
  await shot('cibo-07-transaction-listing-allianz-eauto-platform-no-rows', { full: true });
}

if (area === 'transactions') {
  await ciboLogin(page); await settle(1000);
  const items = [
    ['BR69005852', 'TokioMarine', 'tokio-marine'],
    ['BR60006309', 'Lonpac', 'lonpac'],
    ['BR55004008', 'RHB', 'rhb'],
    ['BR55004010', 'Allianz', 'allianz-old-insurance-created'],
    ['BR44003678', 'Allianz', 'allianz-pending-payment'],
    ['BR3D003430', 'Allianz', 'allianz-pending-payment-with-cover-note'],
  ];
  let i = 10;
  const found = {};
  for (const [ref, ins, label] of items) {
    i++;
    await openMenu('transaction-management');
    await pick('insuranceComp', ins);
    await page.locator('input[formcontrolname="search"]').fill(ref);
    await page.getByRole('button', { name: 'Search', exact: true }).click(); await settle(3500);
    await shot(`cibo-${i}a-${label}-${ref}-listing-row-PERSONAL-DATA`);
    await page.getByText(ref, { exact: true }).first().click(); await settle(3500);
    await shot(`cibo-${i}b-${label}-${ref}-transaction-details-PERSONAL-DATA`, { full: true });
    const clip = await insurerBoxClip();
    if (clip) await shot(`cibo-${i}c-${label}-${ref}-insurer-box`, { full: true, clip });
    const insurerLine = await page.evaluate(() => {
      const t = document.body.innerText; const k = t.indexOf('\nInsurer\n'); return k < 0 ? null : t.slice(k + 9, t.indexOf('\nPlan', k));
    });
    const buttons = (await page.locator('button, a.btn').allInnerTexts()).map((b) => b.trim()).filter(Boolean);
    found[ref] = { ins, label, url: page.url(), insurerLine, buttons };
    const receipt = page.getByRole('button', { name: /Receipt/ });
    if (await receipt.count()) {
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }).catch(() => null), receipt.first().click()]);
      if (dl) {
        const f = `cibo-${i}d-${label}-${ref}-receipt-PERSONAL-DATA.pdf`;
        await dl.saveAs(path.join(OUT, f));
        found[ref].receipt = f;
        log.push(f + '  <- Receipt button, ' + page.url());
      } else found[ref].receipt = 'button clicked, no download within 15 s';
      await page.waitForTimeout(1500);
    }
  }
  fs.writeFileSync(path.join(OUT, 'cibo-transactions-opened.json'), JSON.stringify(found, null, 1));
}

if (area === 'reports') {
  await ciboLogin(page); await settle(1000);
  const vals = {};
  await openMenu('payment-management');
  await shot('cibo-21-payment-management-page');
  for (const c of ['selectedPlatform', 'selectedBank']) {
    vals['payment-management ' + c] = await openDropdown(c);
    await shot(`cibo-22-payment-management-${c === 'selectedBank' ? 'payment-channel' : 'platform'}-filter-values`);
    await closeDropdown();
  }
  await openMenu('payment-report');
  await shot('cibo-23-payment-report-page');
  for (const c of ['platform', 'insuranceComp']) {
    vals['payment-report ' + c] = await openDropdown(c);
    await shot(`cibo-24-payment-report-${c === 'insuranceComp' ? 'insurance-company' : 'platform'}-filter-values`);
    await closeDropdown();
  }
  await openMenu('commission-report');
  await shot('cibo-25-commission-report-page');
  for (const c of ['platform', 'insuranceComp']) {
    vals['commission-report ' + c] = await openDropdown(c);
    await shot(`cibo-26-commission-report-${c === 'insuranceComp' ? 'insurance-company' : 'platform'}-filter-values`);
    await closeDropdown();
  }
  fs.writeFileSync(path.join(OUT, 'cibo-report-filter-values.json'), JSON.stringify(vals, null, 1));
}

const video = page.video();
await ctx.close();
await browser.close();
if (video) {
  const vf = path.join(OUT, `video-${area}.webm`);
  await video.saveAs(vf).catch(async () => fs.copyFileSync(await video.path(), vf));
  log.push(`video-${area}.webm`);
}
fs.appendFileSync(path.join(OUT, 'capture-log.txt'), `## ${area} ${new Date().toISOString()}\n` + log.join('\n') + '\n\n');
console.log(log.join('\n'));
