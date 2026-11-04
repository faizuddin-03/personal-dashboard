// Secarang /ia/ + CIBO steps for Claude-driven runs (recorder-azfar.js). Selectors proven live on 04.11.2026
// (real Allianz UAT API) and in Azfar's page objects (scripts/eauto-12406/automation/src/pages/secarang, cibo).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export const sleep = (p, ms) => p.waitForTimeout(ms);

/** Secarang home: site gate, promo pop-up, Private Car, plate / IC / postcode, Get quotation. Returns 'car-details' | 'quotations' | 'refused: <text>'. */
export async function quote(R, cfg, { plate, ic, postcode = '55000' }) {
  const p = R.page;
  await p.goto(cfg.base, { waitUntil: 'domcontentloaded' });
  await sleep(p, 2500);
  const pw = p.locator('input[type=password]').filter({ visible: true }).first();
  if (await pw.isVisible().catch(() => false)) {
    await R.fill(pw, cfg.site, 'Site password');
    await R.click(p.getByRole('button', { name: /^\s*Login\s*$/i }).first(), 'Login (site password page)');
    await sleep(p, 5000);
  }
  await p.getByText('Buy your car insurance here').first().waitFor({ timeout: 60000 });
  await sleep(p, 2500);
  const close = p.locator('ngb-modal-window button[aria-label=Close]').first();
  if (await close.isVisible().catch(() => false)) { await R.click(close, 'Close the promo pop-up'); await sleep(p, 800); }
  await R.click(p.getByText('Private Car', { exact: true }).first(), 'Private Car tab');
  await R.fill('input[formcontrolname=plateNo]', plate, 'Car Plate No.');
  await R.fill('input[formcontrolname=idNo]', ic, 'Owner IC No.');
  await R.fill('input[formcontrolname=postalCode]', postcode, 'Postal Code');
  await R.shot('home-form', `Home form: Private Car, plate ${plate}, IC, postcode ${postcode}`);
  await R.click(p.getByRole('button', { name: /Get quotation/i }).filter({ visible: true }).first(), 'Get quotation');
  return waitQuote(R);
}

async function waitQuote(R, ms = 110000, afterCar = false) {
  const p = R.page; const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await sleep(p, 3000);
    if (await p.locator('.insurance-card').filter({ visible: true }).count()) { await sleep(p, 8000); return 'quotations'; }
    if (!afterCar && await p.locator('app-confirm-details').filter({ visible: true }).count()) { await sleep(p, 1500); return 'car-details'; }
    const b = await p.locator('body').innerText().catch(() => '');
    const m = b.match(/(You may renew as early as 2 months[^\n]*|no instant quotation[^\n]*|do not match[^\n]*|unable to retrieve[^\n]*|Kindly select[^\n]*)/i);
    if (m) return 'refused: ' + m[1];
  }
  return 'timeout';
}

/** Car Details: pick the first variant if blank, then Get quotation; returns waitQuote's answer. */
export async function carDetails(R) {
  const p = R.page; const root = p.locator('app-confirm-details').first();
  const txt = await root.innerText();
  await R.shot('car-details', 'Car Details from the real API: ' + txt.replace(/\s+/g, ' ').match(/Model .*?No Claim Discount \S+/)?.[0], root);
  if (/Variant\s*\n\s*-\s*\n/.test(txt)) {
    await R.click(root.locator('a.text-primary.pointer').filter({ hasText: /^\s*Select\s*$/ }).first(), 'Variant: Select');
    const m = p.locator('ngb-modal-window').filter({ visible: true }).last();
    await m.locator('label.variant-font').first().waitFor();
    const names = (await m.locator('label.variant-font').allInnerTexts()).map((x) => x.trim());
    const avoid = process.env.VARIANT_AVOID ? new RegExp(process.env.VARIANT_AVOID, 'i') : null;
    const idx = Math.max(0, avoid ? names.findIndex((x) => !avoid.test(x)) : 0);
    R.note('Variants offered: ' + names.join(' | '));
    await R.click(m.locator('label.variant-font').nth(idx), 'Variant ' + names[idx]);
    await R.click(m.getByRole('button', { name: /^\s*Save\s*$/ }), 'Save variant');
    await sleep(p, 1200);
  }
  await R.click(root.getByRole('button', { name: /Get quotation/i }).last(), 'Get quotation');
  return waitQuote(R, 110000, true);
}

/** Visible cards: [{insurer, text}] */
export async function cards(R) {
  return R.page.locator('.insurance-card').filter({ visible: true }).evaluateAll((cs) => cs.map((c) => ({
    insurer: ([...c.querySelectorAll('img[alt]')].map((i) => i.alt)[0] || '').replace(/ logo$/i, ''),
    text: c.innerText.replace(/\s+/g, ' ').trim().slice(0, 240),
  })));
}
export const card = (R, insurer) => R.page.locator('.insurance-card').filter({ visible: true }).filter({ has: R.page.locator(`img[alt="${insurer} logo"]`) }).first();

export async function buy(R, insurer) {
  const p = R.page;
  await R.click(card(R, insurer).getByRole('button', { name: /Buy/i }).first(), `Buy (${insurer})`);
  await p.locator('.addon-card').filter({ visible: true }).first().waitFor({ timeout: 100000 });
  await sleep(p, 6000);
}
export const priceBar = async (R) => (await R.page.locator('app-price-topbar').filter({ visible: true }).first().innerText().catch(() => '')).replace(/\s+/g, ' ');
export const addonCards = (R) => R.page.locator('.addon-card').filter({ visible: true });

export async function continueToConfirmation(R) {
  const p = R.page;
  await R.click(p.getByRole('button', { name: /^\s*Continue\s*$/i }).filter({ visible: true }).last(), 'Continue');
  for (let i = 0; i < 40; i++) {
    await sleep(p, 1500);
    const m = p.locator('ngb-modal-window').filter({ visible: true }).last();
    if (await m.count()) {
      const t = (await m.innerText()).replace(/\s+/g, ' ');
      R.note('pop-up after Continue: ' + t.slice(0, 200));
      const b = m.getByRole('button', { name: /continue|proceed|yes|ok|no,? thanks|skip/i }).first();
      if (await b.count()) await R.click(b, 'Answer the pop-up');
    }
    if (/confirm-payment/.test(p.url()) && await p.locator('input[formcontrolname=name]').filter({ visible: true }).count()) break;
  }
  await p.locator('input[formcontrolname=name]').filter({ visible: true }).first().waitFor({ timeout: 60000 });
  await sleep(p, 3000);
}

export async function fillOwner(R, cfg, name) {
  const p = R.page; const f = (n) => p.locator(`input[formcontrolname=${n}]`).filter({ visible: true }).first();
  await R.fill(f('name'), name, 'Full Name (made up)');
  await R.fill(f('email'), cfg.email, 'Email (QA own)');
  await R.fill(f('phoneNo'), cfg.phone, 'Mobile, no leading 0');
  await R.fill(f('addr1'), 'NO 1 JALAN UJIAN QA', 'Address 1 (made up)');
  await R.fill(f('addr2'), 'TAMAN UJIAN', 'Address 2');
  await R.fill(f('addr3'), 'KUALA LUMPUR', 'Address 3');
  await sleep(p, 1500);
}
export const row = (R, label) => R.page.getByText(label, { exact: true }).filter({ visible: true }).first().locator('xpath=ancestor::*[contains(@class,"row")][1]');
export async function pricing(R) {
  const t = await R.page.locator('body').innerText();
  const g = (l) => (t.match(new RegExp(l + '\\s*\\n\\s*(-?\\s*RM[\\d,.]+|FREE)')) || [])[1]?.replace(/\s+/g, '');
  return { basic: g('Basic Premium'), ncd: (t.match(/NCD [\d.]+%\s*\n\s*-\s*RM[\d,.]+/) || [''])[0].replace(/\s+/g, ' '), allDrivers: g('All Drivers'),
    afterNcd: g('Premium After NCD'), gross: g('Gross Premium'), sst: g('Service Tax 8%'), stamp: g('Stamp Duty'), total: g('Total Premium'), amount: g('Total Amount'),
    agent: (t.match(/Exclusively by agent[^\n]*\n?[^\n]*PIAM ID: [\d-]+/) || [''])[0].replace(/\s+/g, ' '), commission: (t.match(/Commission \([\d.]+%\)\s*\n\s*RM[\d,.]+/) || [''])[0].replace(/\s+/g, ' ') };
}

export async function confirmAndPay(R) {
  const p = R.page;
  await R.click(p.getByRole('button', { name: /Confirm and Pay/i }).filter({ visible: true }).last(), 'Confirm and Pay');
  await p.locator("input[formcontrolname='paymentType']").first().waitFor({ state: 'attached', timeout: 90000 });
  await sleep(p, 3000);
}
export const tiles = (R) => R.page.locator('label').filter({ has: R.page.locator("input[formcontrolname='paymentType']") }).filter({ visible: true });

/** FPX through the Fiuu Bank Simulator; status '00' approves. Returns { where, amount }. */
export async function payFpx(R, cfg, bankAlt = 'RHB', status = '00') {
  const p = R.page;
  await R.click(tiles(R).filter({ hasText: 'FPX Online banking' }).first(), 'FPX Online banking');
  await sleep(p, 2500);
  const bank = p.locator('label').filter({ has: p.locator("input[formcontrolname='bank']") }).filter({ has: p.getByAltText(bankAlt, { exact: true }) }).filter({ visible: true }).first();
  const popP = R.ctx.waitForEvent('page', { timeout: 60000 });
  await R.click(bank, `${bankAlt} bank`);
  const w = await popP;
  await w.waitForLoadState('domcontentloaded', { timeout: 90000 }).catch(() => {});
  for (let i = 0; i < 45; i++) {
    await w.waitForTimeout(2000);
    const gate = w.locator('input[type=password]').filter({ visible: true }).first();
    if (/staging\.secarang\.com/.test(w.url()) && await gate.isVisible().catch(() => false)) { await gate.fill(cfg.site); await w.getByRole('button', { name: /^\s*Login\s*$/i }).first().click(); continue; }
    if (/bank-simulator\.fiuu\.com/.test(w.url()) && await w.locator('#username').isVisible().catch(() => false)) break;
    const err = await w.locator('body').innerText().catch(() => '');
    if (/P15|must be less than|not valid|error/i.test(err) && !/bank-simulator/.test(w.url())) { await R.shot('fiuu-window-error', 'Fiuu window: ' + err.slice(0, 140), null, w); return { where: 'fiuu-error: ' + err.replace(/\s+/g, ' ').slice(0, 200) }; }
  }
  const act = async (l, note, fn) => { await R.mark(l, note); await R.clear(w); await fn(l); R.note('Fiuu window: ' + note); };
  await act(w.locator('#username'), 'Username', (l) => l.fill(cfg.bankUser));
  await act(w.locator('#password'), 'Password', (l) => l.fill(cfg.bankPass));
  await act(w.locator('#login-btn'), 'Login', (l) => l.click());
  const st = w.locator('select#status_code'); await st.waitFor({ state: 'visible', timeout: 60000 });
  await act(st, 'Status ' + status, (l) => l.selectOption(status));
  await act(w.locator('button#tac-btn').or(w.getByRole('button', { name: /Request TAC/i })).filter({ visible: true }).first(), 'Request TAC', (l) => l.click());
  let tac = ''; for (let i = 0; i < 60 && !tac; i++) { tac = (/\d{6}/.exec(await w.locator('input#otp').inputValue().catch(() => '')) || [''])[0]; if (!tac) await w.waitForTimeout(1000); }
  await act(w.locator('input#tac_no, input#otp-input').filter({ visible: true }).first(), 'Enter TAC ' + tac, (l) => l.fill(tac));
  const amount = (await w.locator('body').innerText()).match(/(MYR|RM)\s*[\d,.]+/i)?.[0];
  await R.shot('fiuu-before-pay', `Fiuu Bank Simulator ${bankAlt}: status ${status}, TAC ${tac}, amount ${amount}`, [st, w.locator('input#tac_no').first()], w);
  await act(w.locator('button#pay-btn, button.pay-btn').or(w.getByRole('button', { name: /Pay Now/i })).filter({ visible: true }).first(), 'Pay now', (l) => l.click());
  return { where: await waitResult(R), amount };
}

/** Card through the Fiuu card form + 3D Secure OTP 123456 (Azfar fiuu-popup.page.ts). */
export async function payCard(R, cfg) {
  const p = R.page;
  const popP = R.ctx.waitForEvent('page', { timeout: 15000 }).catch(() => null);
  await R.click(tiles(R).filter({ hasText: 'Credit or Debit Card' }).first(), 'Credit or Debit Card');
  let w = await popP;
  if (!w) {
    const go = p.getByRole('button', { name: /^\s*(Pay|Pay Now|Proceed|Continue|Make Payment)\s*$/i }).filter({ visible: true }).last();
    const pp = R.ctx.waitForEvent('page', { timeout: 60000 });
    await R.click(go, 'Pay'); w = await pp;
  }
  await w.waitForLoadState('domcontentloaded', { timeout: 90000 }).catch(() => {});
  for (let i = 0; i < 30; i++) {
    await w.waitForTimeout(2000);
    const gate = w.locator('input[type=password]').filter({ visible: true }).first();
    if (/staging\.secarang\.com/.test(w.url()) && await gate.isVisible().catch(() => false)) { await gate.fill(cfg.site); await w.getByRole('button', { name: /^\s*Login\s*$/i }).first().click(); continue; }
    if (await w.locator('input#cardnumber').isVisible().catch(() => false)) break;
    const err = await w.locator('body').innerText().catch(() => '');
    if (/P1\d|must be less than|not valid/i.test(err)) { await R.shot('fiuu-window-error', 'Fiuu window: ' + err.slice(0, 140), null, w); return { where: 'fiuu-error: ' + err.replace(/\s+/g, ' ').slice(0, 200) }; }
  }
  const act = async (l, note, fn) => { await R.mark(l, note); await R.clear(w); await fn(l); R.note('Fiuu card window: ' + note); };
  await act(w.locator('input#cardnumber'), 'Card number', (l) => l.fill(cfg.card));
  await act(w.locator('input#expdate'), 'Expiry', async (l) => { await l.click(); await l.pressSequentially(cfg.cardExp.replace('/', ''), { delay: 80 }); });
  await act(w.locator('input#cvv-flip').first(), 'CVV', async (l) => { await l.click(); await l.pressSequentially(cfg.cardCvv, { delay: 80 }); });
  const amount = (await w.locator('body').innerText()).match(/(MYR|RM)\s*[\d,.]+/i)?.[0];
  await R.shot('fiuu-card-form', `Fiuu card form, amount ${amount}`, w.locator('input#cardnumber'), w);
  await act(w.locator('button#pay-online-btn').or(w.getByRole('button', { name: /^\s*Pay\b/i })).filter({ visible: true }).first(), 'Pay', (l) => l.click());
  for (let i = 0; i < 40; i++) {
    await w.waitForTimeout(2000).catch(() => {});
    if (w.isClosed()) break;
    for (const f of w.frames()) {
      if (await f.getByText(/use OTP\s*:?\s*123456/i).first().isVisible().catch(() => false)) {
        const inp = f.locator('input#otpInput').or(f.locator('input:not([type=hidden])')).filter({ visible: true }).first();
        await inp.fill('123456'); R.note('Fiuu 3D Secure: OTP 123456');
        await R.shot('fiuu-3ds', '3D Secure page, OTP 123456', null, w);
        await f.locator('#otpForm button[type=submit], button.pay-btn').or(f.getByRole('button', { name: /^\s*(PAY|Submit|Confirm|Verify|OK|Continue|Authenticate|Proceed)\s*$/i })).filter({ visible: true }).first().click();
        return { where: await waitResult(R), amount };
      }
    }
    const err = await w.locator('body').innerText().catch(() => '');
    if (/P1\d|must be less than|not valid|Please fill in required|there was an error/i.test(err)) { await R.shot('fiuu-window-error', 'Fiuu window: ' + err.replace(/\s+/g, ' ').slice(0, 140), null, w); return { where: 'fiuu-error: ' + err.replace(/\s+/g, ' ').slice(0, 200) }; }
  }
  return { where: await waitResult(R), amount };
}

/** PayLater by Grab: GrabPay sandbox, status Success, [Pay]. */
export async function payGrab(R, cfg) {
  const p = R.page;
  const popP = R.ctx.waitForEvent('page', { timeout: 15000 }).catch(() => null);
  await R.click(tiles(R).filter({ hasText: 'PayLater by Grab' }).first(), 'PayLater by Grab');
  let w = await popP;
  if (!w) {
    const go = p.getByRole('button', { name: /^\s*(Pay|Pay Now|Proceed|Continue|Make Payment)\s*$/i }).filter({ visible: true }).last();
    const pp = R.ctx.waitForEvent('page', { timeout: 60000 }).catch(() => null);
    if (await go.count()) await R.click(go, 'Pay'); w = await pp;
    if (!w) return { where: 'no Grab window opened' };
  }
  await w.waitForLoadState('domcontentloaded', { timeout: 90000 }).catch(() => {});
  for (let i = 0; i < 30; i++) {
    await w.waitForTimeout(2000);
    const gate = w.locator('input[type=password]').filter({ visible: true }).first();
    if (/staging\.secarang\.com/.test(w.url()) && await gate.isVisible().catch(() => false)) { await gate.fill(cfg.site); await w.getByRole('button', { name: /^\s*Login\s*$/i }).first().click(); continue; }
    if (await w.locator('select#status_code').isVisible().catch(() => false)) break;
  }
  const st = w.locator('select#status_code');
  if (!(await st.isVisible().catch(() => false))) { const t = (await w.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' '); await R.shot('grab-window', 'GrabPay window: ' + (t.slice(0, 140) || '(blank)'), null, w); return { where: 'grab window without status picker: ' + (t.slice(0, 160) || 'blank') }; }
  const opts = await st.locator('option').evaluateAll((os) => os.map((o) => o.value + '=' + o.text));
  const ok = opts.find((o) => /success/i.test(o))?.split('=')[0] || '00';
  await R.mark(st, 'Status Success'); await R.clear(w); await st.selectOption(ok);
  const amount = (await w.locator('body').innerText()).match(/(MYR|RM)\s*[\d,.]+/i)?.[0];
  await R.shot('grab-before-pay', `GrabPay sandbox: status Success, amount ${amount}`, st, w);
  await w.getByRole('button', { name: /^\s*Pay\s*$/i }).filter({ visible: true }).first().click(); R.note('GrabPay: Pay');
  return { where: await waitResult(R), amount };
}

async function waitResult(R, ms = 120000) {
  const p = R.page; const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await sleep(p, 2500);
    const b = await p.locator('body').innerText().catch(() => '');
    if (/Thank you for your purchase/i.test(b)) { await sleep(p, 3000); return 'success'; }
    if (/Unsuccessful payment|payment (failed|unsuccessful)/i.test(b)) return 'failed';
  }
  return 'timeout: ' + p.url();
}

export async function successInfo(R) {
  const b = await R.page.locator('body').innerText();
  const g = (re) => (b.match(re) || [])[1]?.trim();
  return { receiptNo: g(/Receipt No\s*\n\s*(\d+)/i), date: g(/Purchase Date\s*\n?\s*([^\n]+)/i), method: g(/Payment Method\s*\n?\s*([^\n]+)/i),
    afterNcd: g(/Premium After NCD\s*\n\s*(RM[\d,.]+)/), gross: g(/Gross Premium\s*\n\s*(RM[\d,.]+)/), total: g(/Total Premium\s*\n\s*(RM[\d,.]+)/) };
}
export const receiptBtn = (R) => R.page.getByRole('button', { name: /Receipt/i }).or(R.page.getByRole('link', { name: /Receipt/i })).filter({ visible: true }).first();

export function pdfText(file) {
  const r = spawnSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
  return r.stdout || '';
}
/** Parse the receipt PDF text into the fields the TS look at. */
export function receiptFields(t) {
  const lines = t.split(/\r?\n/);
  const ins = lines.findIndex((l) => /^\s*Insurer\b/.test(l) || /\bInsurer\s{2,}/.test(l));
  const left = (l) => (l || '').split(/\s{3,}/)[0].trim();
  const insurer = ins >= 0 ? [left(lines[ins + 1]), left(lines[ins + 2])] : [];
  const money = [...t.matchAll(/RM\s?[\d,]+\.\d\d|FREE/g)].map((m) => m[0].replace(/\s/g, ''));
  return { insurer, money, hasAgent: /Exclusively by agent Serba Sentral Sdn Bhd/.test(t), piam: (t.match(/PIAM ID: ([\d-]+)/) || [])[1],
    plate: (t.match(/Vehicle Plate No\.[^\n]*\n\s*(\S+)/) || [])[1], receiptNo: (t.match(/Receipt No\.[\s\S]{0,300}?(\d{14})/) || [])[1] };
}

/** Show a PDF on screen in the TS tab (the video shows what was downloaded): Chrome's PDF viewer via file://. */
export async function showPdf(R, file, heading) {
  const p = R.page;
  await R.card('Downloaded file', heading, file.split(/[\\/]/).pop(), 1500);
  await p.goto('file:///' + file.replace(/\\/g, '/') + '#zoom=110', { waitUntil: 'load' }).catch(() => {});
  await sleep(p, 3500);
}

/** Show text lines (e.g. PDF text read with pdftotext) as a page, so a proof can box a line. ids: line index → id. */
export async function showLines(R, heading, rows) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  await R.page.setContent(`<html><body style="margin:20px;font-family:Arial"><h2 style="background:#172B4D;color:#fff;padding:10px">${esc(heading)}</h2><table style="font:17px Arial;border-collapse:collapse">${rows.map(([k, v, id]) => `<tr id="${id || ''}"><td style="padding:6px 18px;border-bottom:1px solid #ddd;color:#555">${esc(k)}</td><td style="padding:6px 18px;border-bottom:1px solid #ddd;font-weight:bold;white-space:pre">${esc(v)}</td></tr>`).join('')}</table></body></html>`);
  await sleep(R.page, 2000);
}

/** CIBO login (own tab, behind a card), Transaction Management, search. Returns the listing heads + rows. */
export async function cibo(R, cfg, search, why = '') {
  const p = R.page;
  await R.portal('CIBO', why, cfg.ciboUser);
  await p.goto('https://staging.secarang.com/cibo/auth/login', { waitUntil: 'domcontentloaded' });
  await p.waitForURL(/\/(auth\/login|dashboard)/, { timeout: 60000 });
  if (/auth\/login/.test(p.url())) {
    const boxes = p.locator('input').filter({ visible: true }); await boxes.nth(1).waitFor({ timeout: 60000 }); await sleep(p, 2000);
    await R.fill(boxes.nth(0), cfg.ciboUser, 'Login ID'); await R.fill(boxes.nth(1), cfg.ciboPass, 'Password');
    await R.click(p.getByRole('button', { name: /^\s*Login\s*$/ }).filter({ visible: true }).first(), 'Login');
    await p.waitForURL(/\/dashboard/, { timeout: 60000 }); await sleep(p, 2500);
  }
  return ciboSearch(R, search);
}
export async function ciboSearch(R, search) {
  const p = R.page;
  if (!/transaction-management$/.test(p.url())) {
    const link = p.locator('a[href$="transaction-management"]').first();
    if (/\/cibo\//.test(p.url()) && await link.isVisible().catch(() => false)) await R.click(link, 'Transaction Management');
    else { await R.card('CIBO', 'Transaction Management', 'search ' + search, 1200); await p.goto('https://staging.secarang.com/cibo/transaction-management', { waitUntil: 'domcontentloaded' }); }
    await p.waitForURL(/transaction-management/, { timeout: 60000 });
  }
  const s = p.locator("input[formcontrolname='search']").filter({ visible: true }).first(); await s.waitFor({ timeout: 60000 }); await sleep(p, 2500);
  await R.fill(s, search, 'Search: ' + search);
  await R.click(p.getByRole('button', { name: 'Search', exact: true }).filter({ visible: true }).first(), 'Search');
  await sleep(p, 6000);
  const heads = await p.locator('table thead th').allInnerTexts();
  const rows = await p.locator('table tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s+/g, ' ').trim())));
  return { heads, rows };
}
export async function ciboOpen(R, ref) {
  const p = R.page;
  await R.click(p.locator('table tbody tr').filter({ hasText: ref }).first().locator('a').filter({ hasText: ref }).first(), 'Open Transaction Details ' + ref);
  await p.waitForURL(/transaction-details/, { timeout: 60000 }); await sleep(p, 5000);
  const body = await p.locator('body').innerText();
  const v = (l) => (body.match(new RegExp(l + '\\s*\\n\\s*([^\\n]+)')) || [])[1]?.trim();
  const btns = (await p.getByRole('button').filter({ visible: true }).allInnerTexts()).map((s) => s.trim()).filter(Boolean);
  return { body, v, btns, insurer: v('Insurer'), cover: v('Cover Note No'), policy: v('Policy No'), ref: v('Payment Ref ID'), afterNcd: v('Premium After NCD'), status: (body.match(/Ref\. No: \S+\s*\n\s*([^\n]+)/) || [])[1] };
}
export const lbl = (R, t) => R.page.getByText(t, { exact: true }).filter({ visible: true }).first().locator('xpath=..');

/** SPayLater / ShopeePay: the QR window gets the simulator link as a POSTed qr_data field; open it in a tab (as a
 * phone would), status Success (1), Proceed to Pay; the QR window then closes and the main tab shows the result.
 * Azfar fiuu-popup.page.ts payShopee (seen 29.10.2026). */
export async function payShopee(R, cfg) {
  const p = R.page; let link = '';
  const onReq = (rq) => { try { const d = rq.postData() || ''; const m = d.match(/qr_data=([^&]+)/); if (m) link = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch {} };
  R.ctx.on('request', onReq);
  const popP = R.ctx.waitForEvent('page', { timeout: 20000 }).catch(() => null);
  await R.click(tiles(R).filter({ hasText: 'SPayLater' }).first(), 'SPayLater');
  let w = await popP;
  if (!w) { const go = p.getByRole('button', { name: /^\s*(Pay|Pay Now|Proceed|Continue|Make Payment)\s*$/i }).filter({ visible: true }).last(); const pp = R.ctx.waitForEvent('page', { timeout: 60000 }).catch(() => null); if (await go.count()) await R.click(go, 'Pay'); w = await pp; }
  if (!w) { R.ctx.off('request', onReq); return { where: 'no ShopeePay window opened' }; }
  await w.waitForLoadState('domcontentloaded', { timeout: 90000 }).catch(() => {});
  for (let i = 0; i < 40; i++) {
    await w.waitForTimeout(2000);
    const gate = w.locator('input[type=password]').filter({ visible: true }).first();
    if (/staging\.secarang\.com/.test(w.url()) && await gate.isVisible().catch(() => false)) { await gate.fill(cfg.site); await w.getByRole('button', { name: /^\s*Login\s*$/i }).first().click(); continue; }
    if (await w.getByText(/scan the QR code/i).first().isVisible().catch(() => false)) break;
  }
  if (!link) link = (await w.locator("input[name='qr_data']").first().inputValue({ timeout: 2000 }).catch(() => '')) || (await w.locator("a[href*='spsimulator']").first().getAttribute('href', { timeout: 2000 }).catch(() => '')) || '';
  R.ctx.off('request', onReq);
  const amount = (await w.locator('body').innerText().catch(() => '')).match(/(MYR|RM)\s*[\d,.]+/i)?.[0];
  await R.shot('shopeepay-qr', `ShopeePay QR window, amount ${amount}; simulator link ${link ? 'found' : 'NOT found'}`, w.locator('img#qrcode_img').first(), w);
  if (!/spsimulator/.test(link)) return { where: 'ShopeePay simulator link not found', amount };
  const sim = await R.ctx.newPage();
  await sim.goto(new URL(link, w.url()).toString(), { waitUntil: 'domcontentloaded' });
  const st = sim.locator('select#status_code'); await st.waitFor({ timeout: 30000 });
  await R.mark(st, 'Status Success'); await R.clear(sim); await st.selectOption('1');
  await R.shot('shopeepay-simulator', 'ShopeePay simulator: Success', st, sim);
  await sim.locator('button#pay-btn').or(sim.getByRole('button', { name: /PROCEED TO PAY/i })).first().click(); R.note('ShopeePay simulator: Proceed to Pay');
  await sim.waitForTimeout(3000); await sim.close().catch(() => {});
  return { where: await waitResult(R), amount };
}
