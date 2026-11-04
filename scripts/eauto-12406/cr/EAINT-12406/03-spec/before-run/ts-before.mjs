// EAINT-12406: BEFORE half of the pre-deploy TS, run on Secarang staging /ia/ and CIBO staging /cibo (28.10.2026).
// One tab and one continuous video per TS. Read only on CIBO; on Secarang the quotation goes no further than
// All Quotations (no Add-ons, no Confirmation, no payment). Passwords come from automation/env/.staging.env-local.
//
// usage: node ts-before.mjs <12406_CP_TS8|12406_QT_TS3|12406_RC_TS8|12406_RG_TS1|12406_RG_TS2|12406_RG_TS3>
// AFTER half: set PHASE=after and EVID_DIR=<new folder>; the same screens are captured again.
import { chromium, ciboLogin, siteGate, env, HOST, IA, SCRATCH } from '../before-walk/cibo-lib.mjs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const TS = process.argv[2];
const PHASE = process.env.PHASE || 'before';
const ROOT = process.env.EVID_DIR || 'C:/Users/Azfar/Documents/Github Pro/eauto-qa-azfar/cr/EAINT-12406/05-evidence/pre-push';
const DIR = path.join(ROOT, TS);
const DL = path.join(DIR, `downloadable (${PHASE})`);
fs.mkdirSync(DL, { recursive: true });
const VID = path.join(SCRATCH, 'vid-' + TS); fs.rmSync(VID, { recursive: true, force: true });

// Test data for the quotation TS (made up; /ia/ is on the simulator, Azfar 28.10.2026)
const DATA = {
  plate: process.env.QA_PLATE || 'HXA0001A',
  ic: process.env.QA_IC || '900101145671', // made-up IC 900101-14-5671, typed without dashes
  postcode: '55000',
  companyPlate: process.env.QA_CO_PLATE || 'HXA0002A',
  ssm: process.env.QA_SSM || '202501999999', // made-up SSM
};

const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-position=-2400,0', '--force-device-scale-factor=1'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, acceptDownloads: true, recordVideo: { dir: VID, size: { width: 1920, height: 1080 } } });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept().catch(() => {}));
const notes = [];
const shots = [];
const note = (s) => { notes.push(s); console.log(s); };
const myt = () => new Date(Date.now() + 8 * 3600e3).toISOString().replace('T', ' ').slice(0, 19) + ' MYT';
const settle = async (ms = 2000) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };

// ------------------------------------------------------------------ evidence helpers
async function mark(locs) {
  for (const l of [].concat(locs || [])) {
    if (!(await l.count().catch(() => 0))) continue;
    await l.first().scrollIntoViewIfNeeded().catch(() => {});
    await l.evaluateAll((els) => els.forEach((e) => { e.setAttribute('data-qa-mark', e.getAttribute('style') || ''); e.style.outline = '3px solid #e11d48'; e.style.outlineOffset = '2px'; e.style.backgroundColor = 'rgba(250,204,21,.30)'; })).catch(() => {});
  }
}
async function unmark() {
  await page.evaluate(() => { document.querySelectorAll('[data-qa-mark]').forEach((e) => { e.setAttribute('style', e.getAttribute('data-qa-mark')); e.removeAttribute('data-qa-mark'); }); document.querySelectorAll('.qa-banner').forEach((b) => b.remove()); }).catch(() => {});
}
async function banner(text) {
  await page.evaluate((t) => { const b = document.createElement('div'); b.className = 'qa-banner'; b.textContent = t; Object.assign(b.style, { position: 'fixed', left: 0, right: 0, bottom: 0, background: '#172B4D', color: '#fff', font: 'bold 13px Arial', padding: '5px 10px', zIndex: 2147483647 }); document.body.appendChild(b); }, text).catch(() => {});
}
// <TS>_<point>_<what>[_PERSONAL-DATA].png
async function shot(point, what, opts = {}) {
  const name = `${TS}_${point}_${what}${opts.personal ? '_PERSONAL-DATA' : ''}.png`;
  await mark(opts.mark);
  if (!opts.noBanner) await banner(`${TS} ${PHASE.toUpperCase()} | ${point} | ${what} | ${page.url().split('?')[0]} | ${myt()}`);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(DIR, name), fullPage: !!opts.full, ...(opts.clip ? { clip: opts.clip } : {}) });
  await page.waitForTimeout(800);
  await unmark();
  shots.push(name);
  return name;
}
async function clipOf(loc, pad = 16) {
  await loc.first().scrollIntoViewIfNeeded();
  const b = await loc.first().evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; });
  return { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.w + 2 * pad, height: b.h + 2 * pad };
}

// ------------------------------------------------------------------ CIBO helpers
async function ciboEnsureLoggedIn() {
  if (!page.url().includes('/cibo/') || page.url().includes('/auth/login')) await ciboLogin(page);
  await settle(1000);
  if (page.url().includes('/auth/login')) await ciboLogin(page);
}
async function pick(control, text) {
  await page.locator(`ng-select[formcontrolname="${control}"] .ng-select-container`).click();
  await page.waitForTimeout(600);
  await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: new RegExp(`^\\s*${text}\\s*$`) }).first().click();
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
}
// Blur the customer's name / IC / contact / plate on CIBO screens before a screenshot (the video still shows them).
async function blurPersonal() {
  await page.evaluate(() => {
    const blur = (el) => { if (el) el.style.filter = 'blur(7px)'; };
    const smallest = (must, mustNot = []) => {
      let best = null;
      for (const el of document.querySelectorAll('div, section, table, tbody')) {
        const t = el.innerText || '';
        if (must.every((m) => t.includes(m)) && !mustNot.some((m) => t.includes(m))) {
          const r = el.getBoundingClientRect();
          if (r.width > 50 && (!best || r.width * r.height < best.a)) best = { el, a: r.width * r.height };
        }
      }
      return best && best.el;
    };
    if (location.pathname.includes('transaction-details')) {
      // the whole left column (Car Owner Details, Car Details, Payment Details); the insurer box on the right stays sharp
      blur(smallest(['Car Owner Details', 'Payment Details'], ['More Info', 'Policy No']));
      const ref = [...document.querySelectorAll('body *')].find((e) => e.children.length === 0 && /^Ref\. No:/.test((e.textContent || '').trim()));
      if (ref) { let p = ref.previousElementSibling; if (!p && ref.parentElement) p = ref.parentElement.previousElementSibling; blur(p); }
    }
    const ths = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.replace(/\s+/g, ' ').trim());
    for (const col of ['Insured', 'Vehicle No', 'UCD Name']) {
      const i = ths.indexOf(col);
      if (i >= 0) document.querySelectorAll('table tbody tr').forEach((tr) => blur(tr.children[i]));
    }
  });
  await page.waitForTimeout(400);
}
async function openTransaction(point, ref, insurer, platform) {
  await ciboEnsureLoggedIn();
  await page.locator('a[href="/cibo/transaction-management"]').first().click();
  await settle(2500);
  await pick('insuranceComp', insurer);
  if (platform) await pick('platform', platform);
  await page.locator('input[formcontrolname="search"]').fill(ref);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await settle(3500);
  const row = page.locator('table tbody tr').filter({ hasText: ref });
  const rowText = (await row.first().innerText().catch(() => '')).replace(/\s+/g, ' ');
  await blurPersonal();
  await shot(point, `01-listing-${ref}`, { mark: row });
  await page.getByText(ref, { exact: true }).first().click();
  await settle(3500);
  const insurerLine = await page.evaluate(() => { const t = document.body.innerText; const k = t.indexOf('\nInsurer\n'); return k < 0 ? null : t.slice(k + 9, t.indexOf('\nPlan', k)).trim(); });
  const status = (await page.locator('text=/Insurance created|Pending payment|Pending approval|Quotation expired|Cancelled|Failed/').first().innerText().catch(() => '')).trim();
  const buttons = (await page.locator('button:visible, a.btn:visible').allInnerTexts()).map((b) => b.trim()).filter(Boolean);
  note(`- ${ref}: found in the listing (${rowText ? 'one row' : 'NOT found'}); Transaction Details at ${page.url()}; status "${status}"; buttons ${JSON.stringify(buttons)}`);
  note(`  - Transaction Details Insurer: "${insurerLine}"`);
  await blurPersonal();
  const insurerRow = page.locator('xpath=//*[normalize-space(text())="Insurer"]/..').first();
  await shot(point, `02-transaction-details-${ref}-blurred`, { full: true, mark: insurerRow });
  const box = page.locator('xpath=//*[normalize-space(text())="Insurer"]/ancestor::*[.//*[normalize-space(text())="Policy No"]][1]').first();
  await shot(point, `03-insurer-box-${ref}`, { full: true, clip: await clipOf(box, 12), mark: insurerRow, noBanner: true });
  return { insurerLine, buttons, status };
}
async function openReceipt(point, ref) {
  const btn = page.getByRole('button', { name: /Receipt/ }).first();
  if (!(await btn.count())) { note(`  - ${ref}: no Receipt button`); return null; }
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }).catch(() => null), btn.click()]);
  if (!dl) { note(`  - ${ref}: Receipt clicked, no download within 20 s`); return null; }
  const file = path.join(DL, `${ref}_receipt_PERSONAL-DATA.pdf`);
  await dl.saveAs(file);
  const txt = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
  const lines = txt.split(/\r?\n/);
  const i = lines.findIndex((l) => /^\s*Insurer\s*$/.test(l) || /^\s*Insurer\s{2,}/.test(l));
  const block = lines.slice(i, i + 4).map((l) => l.trim()).filter(Boolean);
  note(`  - Receipt ${path.basename(file)} (downloaded, shown on screen in this tab). Insurer block lines (pdftotext): ${JSON.stringify(block)}`);
  // show the PDF itself in this tab so the video shows it
  await page.goto('file:///' + file.split(path.sep).join('/') + '#zoom=100');
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(DIR, `${TS}_${point}_04-receipt-${ref}-full_PERSONAL-DATA.png`) });
  shots.push(`${TS}_${point}_04-receipt-${ref}-full_PERSONAL-DATA.png`);
  // Insurer block only (Ownership Type .. Coverage Period + the agent line): no name, no plate
  await page.screenshot({ path: path.join(DIR, `${TS}_${point}_05-receipt-${ref}-insurer-block.png`), clip: { x: 720, y: 595, width: 770, height: 270 } });
  shots.push(`${TS}_${point}_05-receipt-${ref}-insurer-block.png`);
  await page.goto(HOST + '/cibo/dashboard'); await settle(1500);
  return block;
}

// ------------------------------------------------------------------ Secarang helpers
async function closePopup() {
  const x = page.locator('ngb-modal-window button.close, ngb-modal-window [aria-label="Close"], ngb-modal-window .btn-close').first();
  if (await x.isVisible().catch(() => false)) { await x.click(); await page.waitForTimeout(800); }
}
async function autoScroll() {
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(600);
}
const bodyText = () => page.evaluate(() => document.body.innerText);
// Home form > Get quotation > (Car Details) > All Quotations. Stops at All Quotations or at any pop-up.
async function quote(point, tab, plate, idOrSsm, postcode) {
  await page.goto(IA + '/car-insurance'); await settle(2000); await closePopup();
  await page.getByText(tab, { exact: true }).first().click(); await page.waitForTimeout(600);
  const form = page.locator('form:visible').filter({ has: page.getByRole('button', { name: 'Get quotation' }) }).first();
  const inputs = form.locator('input:visible');
  const n = await inputs.count();
  const vals = [plate, idOrSsm, postcode];
  for (let k = 0; k < Math.min(n, 3); k++) { await inputs.nth(k).click(); await inputs.nth(k).fill(vals[k]); await page.waitForTimeout(200); }
  const readBack = [];
  for (let k = 0; k < Math.min(n, 3); k++) readBack.push(await inputs.nth(k).inputValue());
  note(`- Home form, tab "${tab}": typed ${JSON.stringify(vals)}; field values read back ${JSON.stringify(readBack)}`);
  await shot(point, `01-home-form-filled-${tab.toLowerCase().replace(/ /g, '-')}`, { mark: form });
  await page.getByRole('button', { name: 'Get quotation' }).first().click();
  const seen = [];
  const t0 = Date.now();
  let carDetailsDone = false;
  while (Date.now() - t0 < 150000) {
    await page.waitForTimeout(2500);
    const t = await bodyText();
    const visibleModal = await page.locator('ngb-modal-window:visible').innerText().catch(() => '');
    if (visibleModal && /unable to retrieve|no instant quotation|Sorry|Ops/i.test(visibleModal)) {
      note(`- Pop-up after Get quotation: "${visibleModal.replace(/\s+/g, ' ').trim()}"`);
      await shot(point, '02-popup-after-get-quotation', { mark: page.locator('ngb-modal-window .modal-content').first() });
      return { state: 'popup', text: visibleModal.replace(/\s+/g, ' ').trim(), url: page.url() };
    }
    if (await page.locator('ngb-modal-window input[formcontrolname="mobileNo"], ngb-modal-window input[formcontrolname="email"]').first().isVisible().catch(() => false)) {
      note(`- Two-month-rule pop-up (name / email / mobile) shown: "${visibleModal.replace(/\s+/g, ' ').trim().slice(0, 400)}". Mobile is required, so stopped here (no phone typed)`);
      await shot(point, '02-two-month-rule-popup', { mark: page.locator('ngb-modal-window .modal-content').first() });
      return { state: 'visitor-form', text: visibleModal.replace(/\s+/g, ' ').trim(), url: page.url() };
    }
    if (/Are these your vehicle details/i.test(t) && !carDetailsDone) {
      note(`- Car Details page ("Are these your vehicle details?") at ${page.url()}`);
      await shot(point, '02-car-details', { full: true });
      // a variant dropdown left empty would need a choice: stop and report instead of guessing
      const emptySelect = await page.locator('select:visible').evaluateAll((s) => s.some((x) => !x.value)).catch(() => false);
      if (emptySelect) { note('- Car Details has an empty dropdown (variant?): stopped, not guessed'); return { state: 'car-details-dropdown', url: page.url() }; }
      const boxes = page.locator('input[type=checkbox]:visible');
      const nb = await boxes.count();
      for (let k = 0; k < nb; k++) if (!(await boxes.nth(k).isChecked())) await boxes.nth(k).check({ force: true }).catch(async () => boxes.nth(k).click({ force: true }));
      note(`- Car Details: ticked ${nb} declaration box(es)`);
      const go = page.getByRole('button', { name: /Get quotation|Continue|Next/i }).filter({ visible: true }).last();
      await go.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
      for (let w = 0; w < 20 && (await go.isDisabled().catch(() => false)); w++) await page.waitForTimeout(1000);
      await go.click();
      carDetailsDone = true;
      continue;
    }
    const cards = await page.locator(':is(.card, [class*="quotation"]):visible').filter({ hasText: /Lonpac|Tokio|Allianz|Quotation unavailable|RM\s?\d/ }).count().catch(() => 0);
    const loading = /Bear with us|Loading|Please wait/i.test(t);
    if (cards && !loading && /quotation|insurance/i.test(t) && !/Buy your car insurance here/.test(t)) {
      await page.waitForTimeout(6000); // cards can arrive one by one
      const t2 = await bodyText();
      if (/Bear with us|Loading/i.test(t2)) continue;
      return { state: 'quotations', text: t2, url: page.url() };
    }
    seen.push(page.url());
  }
  note(`- No known page within 150 s (last address ${page.url()})`);
  await shot(point, '02-unknown-state', { full: true });
  return { state: 'timeout', url: page.url() };
}

// ------------------------------------------------------------------ the TS
note(`# ${TS} — ${PHASE.toUpperCase()} half, ${myt()}`);
note(`Staging: Secarang /ia/ (${IA}) and CIBO (${HOST}/cibo). EAINT-12406 not deployed (Azfar, 28.10.2026). Video: video_${TS}.webm (one tab, one continuous recording).`);
note('');

try {
  if (TS === '12406_CP_TS8') {
    await page.goto(IA + '/car-insurance'); await settle(1500);
    await shot('E1', '00-site-password-page');
    await siteGate(page); await settle(2000); await closePopup();
    const texts = {};
    // Step 1 / E1: Home logos
    await autoScroll();
    const logos = page.locator('img[src*="insurance-logo"]:visible');
    texts.homeLogos = await logos.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { src: e.getAttribute('src'), x: Math.round(r.x), y: Math.round(r.y + scrollY) }; }).sort((a, b) => a.y - b.y || a.x - b.x));
    note(`E1 Home logos left to right: ${texts.homeLogos.map((l) => l.src.split('/').pop()).join(', ')}`);
    const section = page.getByText('Great teamwork makes the dream work').first().locator('xpath=ancestor::*[.//img[contains(@src,"insurance-logo")]][1]');
    await shot('E1', 'home-insurer-logos', { full: true, clip: await clipOf(section, 24), mark: logos, noBanner: true });
    await shot('E1', 'home-full-page', { full: true });
    texts.home = await bodyText();
    // Step 2 / E2: quotation to All Quotations
    const q = await quote('E2', 'Private Car', DATA.plate, DATA.ic, DATA.postcode);
    texts.quotation = q;
    if (q.state === 'quotations') {
      await autoScroll();
      const insurers = ['Lonpac', 'Allianz', 'Tokio', 'RHB', 'Chubb', 'Zurich', 'Takaful', 'Etiqa'].filter((n) => new RegExp(n, 'i').test(q.text));
      note(`E2 All Quotations at ${q.url}; insurer names on the page: ${insurers.join(', ') || 'none'}`);
      const cardTexts = await page.locator(':is(.card, [class*="quotation"]):visible').filter({ hasText: /Lonpac|Tokio|Allianz|Quotation unavailable/ }).allInnerTexts().catch(() => []);
      note(`E2 card texts: ${JSON.stringify(cardTexts.map((c) => c.replace(/\s+/g, ' ').slice(0, 160)))}`);
      await shot('E2', '03-all-quotations-cards', { full: true });
    } else note(`E2 not reached: state ${q.state}`);
    // Step 3 / E3: About Us
    await page.goto(IA + '/about-us'); await settle(2000);
    if (page.url().includes('/auth/login')) { await siteGate(page, '/about-us'); await settle(2000); }
    await autoScroll();
    const partnership = page.getByText(/collaborates with other partners/).first();
    texts.aboutUs = await bodyText();
    const p = (await partnership.innerText()).replace(/\s+/g, ' ');
    note(`E3 About Us > Our partnership: "${p}"`);
    const para = page.getByText(/collaborates with other partners/).first();
    await shot('E3', 'about-us-our-partnership', { full: true, clip: await clipOf(page.getByText('Our partnership', { exact: true }).first().locator('xpath=..'), 24), mark: para, noBanner: true });
    await shot('E3', 'about-us-full-page', { full: true });
    // Step 4 / E4: FAQs, every question open
    await page.goto(IA + '/faq'); await settle(2000);
    const qs = page.locator('.collapsable-header');
    const nq = await qs.count();
    for (let k = 0; k < nq; k++) { const h = qs.nth(k); if ((await h.getAttribute('aria-expanded')) !== 'true') { await h.scrollIntoViewIfNeeded(); await h.click(); await page.waitForTimeout(300); } }
    texts.faqOpen = await qs.evaluateAll((els) => els.map((e) => [e.innerText.trim(), e.getAttribute('aria-expanded')]));
    texts.faq = await bodyText();
    const instant = qs.filter({ hasText: 'Which insurers can I get instant quotation from?' }).first().locator('xpath=..');
    note(`E4 FAQ: ${nq} questions, ${texts.faqOpen.filter((x) => x[1] === 'true').length} open. "Which insurers…": "${(await instant.innerText()).replace(/\s+/g, ' ')}"`);
    await shot('E4', 'faq-which-insurers-instant-quotation', { full: true, clip: await clipOf(instant, 12), mark: instant.locator('li'), noBanner: true });
    await autoScroll();
    await shot('E4', 'faq-all-questions-open-full-page', { full: true });
    // Step 5 / E5: Support, every section open
    await page.goto(IA + '/support'); await settle(2000);
    const ss = page.locator('.collapsable-header');
    const ns = await ss.count();
    for (let k = 0; k < ns; k++) { const h = ss.nth(k); if ((await h.getAttribute('aria-expanded')) !== 'true') { await h.scrollIntoViewIfNeeded(); await h.click(); await page.waitForTimeout(400); } }
    texts.supportSections = await ss.evaluateAll((els) => els.map((e) => ({ insurer: e.innerText.trim(), open: e.getAttribute('aria-expanded'), body: (e.parentElement.innerText || '').replace(e.innerText, '').replace(/\s+/g, ' ').trim() })));
    texts.support = await bodyText();
    note(`E5 Support sections: ${JSON.stringify(texts.supportSections)}`);
    const top = await clipOf(page.getByText('Need to contact insurance company?').first(), 24);
    const last = await clipOf(ss.last().locator('xpath=..'), 24);
    const region = { x: Math.min(top.x, last.x) - 200, y: top.y, width: Math.max(top.width, last.width) + 400, height: last.y + last.height - top.y };
    await shot('E5', 'support-need-to-contact-insurance-company-all-open', { full: true, clip: region, mark: ss, noBanner: true });
    await shot('E5', 'support-full-page-all-open', { full: true, mark: ss });
    // insurer names per page
    const names = ['Lonpac', 'Allianz', 'Tokio', 'RHB', 'Chubb', 'Zurich', 'Takaful', 'Etiqa'];
    texts.insurerMentions = Object.fromEntries(['home', 'aboutUs', 'faq', 'support'].map((k) => [k, Object.fromEntries(names.map((n) => [n, (texts[k].match(new RegExp(n, 'gi')) || []).length]).filter((x) => x[1]))]));
    note(`Insurer names per page: ${JSON.stringify(texts.insurerMentions)}`);
    fs.writeFileSync(path.join(DIR, `${TS}_page-texts-${PHASE}.json`), JSON.stringify(texts, null, 1));
  }

  if (TS === '12406_QT_TS3') {
    await siteGate(page); await settle(2000); await closePopup();
    const q = await quote('E1', 'Company Car', DATA.companyPlate, DATA.ssm, DATA.postcode);
    note(`E1 company owner answer: state "${q.state}" at ${q.url}${q.text ? `; text "${q.text.slice(0, 300)}"` : ''}`);
    if (q.state === 'quotations') { await autoScroll(); await shot('E1', '03-all-quotations-cards', { full: true }); }
  }

  if (TS === '12406_RC_TS8') {
    await ciboLogin(page); await settle(1000);
    const r1 = await openTransaction('E2', 'BR55004010', 'Allianz', 'Secarang');
    const rec = await openReceipt('E1', 'BR55004010');
    note(`E1 BR55004010 receipt Insurer block: ${JSON.stringify(rec)}`);
    note(`E2 BR55004010 Transaction Details Insurer: "${r1.insurerLine}"`);
    for (const ref of ['BR44003678', 'BR3D003430']) {
      const r = await openTransaction('E2', ref, 'Allianz', 'Secarang');
      note(`E2 ${ref} Transaction Details Insurer: "${r.insurerLine}" (status ${r.status}; Receipt button: ${r.buttons.some((b) => /Receipt/.test(b)) ? 'yes' : 'no'})`);
    }
  }

  if (TS === '12406_RG_TS1') {
    await ciboLogin(page); await settle(1000);
    const r = await openTransaction('E1', 'BR69005852', 'TokioMarine');
    note(`E1 BR69005852 Transaction Details Insurer: "${r.insurerLine}"`);
    const rec = await openReceipt('E2', 'BR69005852');
    note(`E2 BR69005852 receipt Insurer block: ${JSON.stringify(rec)}`);
  }

  if (TS === '12406_RG_TS2') {
    await ciboLogin(page); await settle(1000);
    const r = await openTransaction('E1', 'BR60006309', 'Lonpac', 'Secarang');
    note(`E1 BR60006309 Transaction Details Insurer: "${r.insurerLine}"`);
    const rec = await openReceipt('E1', 'BR60006309');
    note(`E1 BR60006309 receipt Insurer block: ${JSON.stringify(rec)}`);
  }

  if (TS === '12406_RG_TS3') {
    await ciboLogin(page); await settle(1000);
    const r = await openTransaction('E1', 'BR55004008', 'RHB');
    note(`E1 BR55004008 Transaction Details Insurer: "${r.insurerLine}"`);
    const rec = await openReceipt('E1', 'BR55004008');
    note(`E1 BR55004008 receipt Insurer block: ${JSON.stringify(rec)}`);
  }
} catch (e) {
  note(`ERROR: ${e.message.split('\n')[0]}`);
  await page.screenshot({ path: path.join(SCRATCH, `${TS}-error.png`), fullPage: true }).catch(() => {});
}

const v = page.video();
await ctx.close(); await browser.close();
fs.copyFileSync(await v.path(), path.join(DIR, `video_${TS}.webm`));
note('');
note(`Screenshots: ${shots.join(', ')}`);
// never write a password into the run log
let log = notes.join('\n');
const e = env();
for (const k of ['CIBO_PASSWORD', 'SECARANG_SITE_PASSWORD']) if (e[k]) log = log.split(e[k]).join('***');
fs.writeFileSync(path.join(DIR, `${TS}_run-log-${PHASE}.txt`), log + '\n');
