// EAINT-12406 probe (29.10.2026, cr-author for sheet QT): read the All Quotations markup after the deploy, so the
// QT specs use locators seen on the page. READ ONLY: made-up data only, Get quotation pressed (a quotation is
// not a purchase), Buy / Add-ons / Confirmation never pressed, the two-month-rule visitor form never filled.
// Plan Details is opened only to read its links (a pop-up, nothing saved).
// Output: a JSON summary on stdout + full dumps in the scratch folder (outside the repo).
import { chromium, siteGate, SCRATCH } from '../before-walk/cibo-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const CANDIDATES = [
  ['HXA0001A', '900101145671', '55000'],
  ['ZZZ1A', '900101145671', '55000'],
  ['HXA0005A', '850615105523', '55000'],
  ['HXA0001A', '780322086011', '55000'],
];
const only = process.argv[2] ? [process.argv.slice(2, 5)] : CANDIDATES.slice(0, 1);
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const out = { tried: [] };
const visModal = () => page.locator('ngb-modal-window').filter({ visible: true }).last();
async function closeModal() {
  const m = visModal();
  if (!(await m.isVisible().catch(() => false))) return;
  const x = m.locator('button.close, [aria-label="Close"], .btn-close').first();
  const closeBtn = m.locator('button').filter({ hasText: /^\s*Close\s*$/ }).filter({ visible: true }).first(); // Plan Details pop-up (seen 29.10)
  if (await x.isVisible().catch(() => false)) await x.click();
  else if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
  else await page.keyboard.press('Escape');
  await m.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  out.closedModal = !(await page.locator('ngb-modal-window').filter({ visible: true }).count());
}

let reached = false;
for (const [plate, ic, pc] of only) {
  await siteGate(page);
  await visModal().waitFor({ timeout: 6000 }).catch(() => {});
  await closeModal();
  await page.getByText('Private Car', { exact: true }).filter({ visible: true }).first().click();
  const form = page.locator('form').filter({ visible: true }).filter({ has: page.getByRole('button', { name: /Get quotation/i }) }).first();
  await form.locator('input[formcontrolname="plateNo"]').filter({ visible: true }).first().fill(plate);
  await form.locator('input[formcontrolname="idNo"]').filter({ visible: true }).first().fill(ic);
  await form.locator('input[formcontrolname="postalCode"]').filter({ visible: true }).first().fill(pc);
  await form.getByRole('button', { name: /Get quotation/i }).filter({ visible: true }).first().click();
  const t0 = Date.now();
  let state = 'timeout';
  let carDone = false;
  while (Date.now() - t0 < 240000) {
    const m = visModal();
    if (await m.isVisible().catch(() => false)) {
      const txt = (await m.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
      if (await m.locator("input[formcontrolname='mobileNo'], input[formcontrolname='email']").first().isVisible().catch(() => false)) { state = 'visitor-form (not filled): ' + txt.slice(0, 200); break; }
      if (!/Renew your insurance/i.test(txt)) { state = 'popup: ' + txt.slice(0, 300); break; }
    }
    if (await page.locator('.insurance-card').filter({ visible: true }).count()) { state = 'quotations'; break; }
    const body = await page.locator('body').innerText().catch(() => '');
    if (/Are these your vehicle details/i.test(body) || (await page.locator('app-confirm-details').filter({ visible: true }).count())) {
      if (!carDone) {
        // Step 1 "Are these your car details?" (seen 29.10: no checkbox, no variant select, one Get quotation)
        fs.writeFileSync(path.join(SCRATCH, 'qt-car-details.html'), await page.locator('app-confirm-details').first().evaluate((e) => e.outerHTML));
        out.carDetails = (await page.locator('app-confirm-details').first().innerText()).replace(/\s+/g, ' ').slice(0, 400);
        const go = page.locator('app-confirm-details').getByRole('button', { name: /Get quotation/i }).filter({ visible: true }).last();
        await go.waitFor({ timeout: 30000 });
        for (let k = 0; k < 30 && !(await go.isEnabled()); k++) await page.waitForTimeout(1000);
        await go.click();
        carDone = true;
      }
    }
    await page.waitForTimeout(1500);
  }
  out.tried.push({ plate, pc, state, url: page.url() });
  if (state === 'quotations') { reached = true; break; }
}

if (reached) {
  // let the cards settle (they arrive one by one)
  let last = ''; let since = Date.now(); const t0 = Date.now();
  while (Date.now() - t0 < 150000) {
    const now = (await page.locator('.insurance-card').filter({ visible: true }).allInnerTexts()).join('|');
    const loading = /Bear with us/i.test(await page.locator('body').innerText());
    if (now !== last) { last = now; since = Date.now(); }
    if (now && !loading && Date.now() - since > 10000) break;
    await page.waitForTimeout(1000);
  }
  out.url = page.url();
  out.cards = await page.evaluate(() => {
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden';
    const all = [...document.querySelectorAll('.insurance-card')];
    return {
      total: all.length,
      visible: all.filter(vis).length,
      parentClasses: [...new Set(all.map((c) => c.parentElement?.className))],
      list: all.filter(vis).map((c, i) => ({
        i,
        cls: c.className,
        tag: c.tagName,
        host: c.closest('[_nghost-ng-c], app-root *')?.tagName,
        ancestors: (() => { const a = []; let p = c.parentElement; for (let k = 0; k < 5 && p; k++, p = p.parentElement) a.push(`${p.tagName.toLowerCase()}.${p.className}`); return a; })(),
        text: c.innerText.replace(/\s+/g, ' ').trim().slice(0, 400),
        imgs: [...c.querySelectorAll('img')].map((im) => ({ alt: im.alt, src: (im.getAttribute('src') || '').split('/').slice(-2).join('/'), vis: vis(im), cls: im.className })),
        buttons: [...c.querySelectorAll('button, a.btn, [role=button]')].map((b) => ({ tag: b.tagName, text: b.innerText.trim(), cls: b.className, vis: vis(b) })),
        links: [...c.querySelectorAll('a')].map((a) => ({ text: a.innerText.trim(), href: a.getAttribute('href'), target: a.target, vis: vis(a) })),
        rect: (() => { const r = c.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width) }; })(),
      })),
    };
  });
  // unavailable cards might not be .insurance-card: list every visible element whose own text says "Quotation unavailable"
  out.unavailable = await page.evaluate(() => {
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
    return [...document.querySelectorAll('body *')].filter((e) => vis(e) && /Quotation unavailable/i.test(e.textContent || '') && ![...e.children].some((ch) => /Quotation unavailable/i.test(ch.textContent || '')))
      .map((e) => {
        const box = e.closest('.insurance-card') || e.parentElement?.parentElement;
        return { tag: e.tagName, cls: e.className, text: e.textContent.trim(), inInsuranceCard: !!e.closest('.insurance-card'), boxCls: box?.className, boxText: box?.innerText.replace(/\s+/g, ' ').slice(0, 200), boxImgs: [...(box?.querySelectorAll('img') || [])].map((im) => im.alt + ' ' + (im.getAttribute('src') || '').split('/').pop()) };
      });
  });
  out.postcode = await page.evaluate(() => [...document.querySelectorAll('input')].filter((i) => i.offsetParent).map((i) => ({ fcn: i.getAttribute('formcontrolname'), cls: i.className, type: i.type, ph: i.placeholder, value: i.getAttribute('formcontrolname') === 'postalCode' || /postcode/.test(i.className) ? i.value : undefined })));
  out.pageButtons = await page.evaluate(() => [...document.querySelectorAll('button, a')].filter((b) => b.offsetParent && !b.closest('.insurance-card')).map((b) => `${b.tagName}.${b.className}: ${b.innerText.trim().slice(0, 40)}`).filter((s) => !/: $/.test(s)).slice(0, 80));
  fs.writeFileSync(path.join(SCRATCH, 'qt-quotations.html'), await page.content());
  await page.screenshot({ path: path.join(SCRATCH, 'qt-quotations.png'), fullPage: true });
  // Plan Details on the Allianz card (read the pop-up's links; nothing saved)
  const cards = page.locator('.insurance-card').filter({ visible: true });
  const n = await cards.count();
  out.planDetails = [];
  for (let i = 0; i < n; i++) {
    const c = cards.nth(i);
    const alts = await c.locator('img[alt]').evaluateAll((ims) => ims.map((im) => im.alt).join(' '));
    if (!/allianz/i.test(alts)) continue;
    const pd = c.getByText(/Plan Details/i).filter({ visible: true }).first();
    if (!(await pd.count())) { out.planDetails.push({ card: alts, found: false }); continue; }
    const pdInfo = await pd.evaluate((e) => ({ tag: e.tagName, cls: e.className, text: e.innerText.trim(), href: e.getAttribute('href') }));
    await pd.click();
    await page.waitForTimeout(2500);
    const m = visModal();
    const inModal = await m.isVisible().catch(() => false);
    const where = inModal ? m : c;
    out.planDetails.push({
      card: alts, pdInfo, inModal,
      modalTag: inModal ? await m.evaluate((e) => e.className) : null,
      text: (await where.innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 1500),
      links: await where.locator('a').evaluateAll((as) => as.map((a) => ({ text: a.innerText.trim(), href: a.getAttribute('href'), target: a.target, cls: a.className }))),
      buttons: await where.locator('button').evaluateAll((bs) => bs.map((b) => ({ text: b.innerText.trim(), cls: b.className, aria: b.getAttribute('aria-label') }))),
    });
    if (inModal) fs.writeFileSync(path.join(SCRATCH, 'qt-plan-details.html'), await m.evaluate((e) => e.outerHTML));
    await page.screenshot({ path: path.join(SCRATCH, 'qt-plan-details.png') });
    await closeModal();
  }
}
// EDIT_PC=<postcode>: how the All Quotations postcode [Edit] works (a re-quote, nothing bought)
if (reached && process.env.EDIT_PC) {
  const box = page.locator('input.postcode-field').filter({ visible: true }).first();
  const editBtn = page.locator('button.primary-light-btn').filter({ hasText: /^\s*Edit\s*$/ }).filter({ visible: true }).first();
  out.edit0 = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /Edit/.test(b.innerText)).map((b) => ({ html: b.outerHTML.replace(/ _ngcontent-[\w-]+=""/g, '').slice(0, 300), vis: !!b.offsetParent, aria: b.getAttribute('aria-label') })));
  console.error('EDIT0', JSON.stringify(out.edit0));
  const st = () => box.evaluate((i) => ({ value: i.value, readOnly: i.readOnly, disabled: i.disabled, cls: i.className, editable: document.activeElement === i }));
  out.edit = { before: await st(), editCount: await editBtn.count(), editHtml: await editBtn.evaluate((b) => b.outerHTML.replace(/ _ngcontent-[\w-]+=""/g, '')) };
  out.edit.boxParent = await box.evaluate((i) => i.parentElement.parentElement.outerHTML.replace(/ _ngcontent-[\w-]+=""/g, '').slice(0, 1500));
  await editBtn.click();
  await page.waitForTimeout(1500);
  out.edit.afterEditClick = await st();
  out.edit.modalAfterEdit = (await visModal().isVisible().catch(() => false)) ? (await visModal().innerText()).replace(/\s+/g, ' ').slice(0, 300) : '';
  out.edit.buttonsAfterEdit = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent && !b.closest('.insurance-card')).map((b) => `${b.className}: ${b.innerText.trim()}`));
  await box.click({ clickCount: 3 });
  await box.press('Control+A');
  await box.press('Backspace');
  await box.pressSequentially(process.env.EDIT_PC, { delay: 80 });
  await page.waitForTimeout(800);
  out.edit.afterType = await st();
  out.edit.modalAfterType = (await visModal().isVisible().catch(() => false)) ? (await visModal().innerText()).replace(/\s+/g, ' ').slice(0, 300) : '';
  const t1 = Date.now();
  await editBtn.click();
  const seen = [];
  for (let k = 0; k < 90; k++) {
    const body = await page.locator('body').innerText();
    const m = (await visModal().isVisible().catch(() => false)) ? 'MODAL:' + (await visModal().innerText()).replace(/\s+/g, ' ').slice(0, 200) : '';
    const sig = `${/Bear with us/i.test(body) ? 'loading ' : ''}${m} cards=${(await page.locator('.insurance-card').filter({ visible: true }).allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').slice(0, 40)).join(' / ')} url=${page.url().split('/').pop()}`;
    if (seen[seen.length - 1]?.sig !== sig) seen.push({ s: Math.round((Date.now() - t1) / 1000), sig });
    await page.waitForTimeout(1000);
  }
  out.edit.afterEditTimeline = seen;
  out.edit.afterFill = await st();
  out.edit.buttonsAfterFill = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent && !b.closest('.insurance-card')).map((b) => `${b.className}: ${b.innerText.trim()}`));
  fs.writeFileSync(path.join(SCRATCH, 'qt-edit-pc.html'), await box.evaluate((i) => i.closest('.row, .card, div').parentElement.outerHTML));
}
fs.writeFileSync(path.join(SCRATCH, 'qt-quotations.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 20000));
await browser.close();
