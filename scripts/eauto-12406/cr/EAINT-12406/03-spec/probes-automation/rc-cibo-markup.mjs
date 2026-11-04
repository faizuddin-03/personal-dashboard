// EAINT-12406 probe (29.10.2026, cr-author sheet RC): read the CIBO markup the RC specs need. READ ONLY.
// Nothing is created, saved, edited or sent. Export is NEVER pressed (only its button is read). Print is pressed
// once with window.print / window.open replaced by recorders, so no print dialog or tab opens; that is a read.
// Output: counts, classes and label texts only; customer values are not printed (masked to their length).
import { chromium, ciboLogin, CIBO } from '../before-walk/cibo-lib.mjs';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: false });
await ctx.addInitScript(() => {
  window.__printCalls = 0; window.__openCalls = [];
  window.print = () => { window.__printCalls += 1; };
  const o = window.open; window.open = (u, ...r) => { window.__openCalls.push(String(u)); return null; };
});
const page = await ctx.newPage();
const out = (k, v) => console.log(k, JSON.stringify(v));
const settle = async (ms = 1500) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
const mask = (s) => String(s ?? '').replace(/[A-Za-z0-9]/g, 'x');

await ciboLogin(page);
out('LOGIN', page.url());
await page.locator('a[href="/cibo/transaction-management"]').first().click();
await settle(4000);

// ---- buttons / links on the listing page before Search
const btns = async (tag) => out(tag, await page.evaluate(() => [...document.querySelectorAll('button, a.btn, a, span.clear, .clear-all, [role=button]')]
  .filter((e) => e.offsetParent && /print|export|clear|search/i.test(e.innerText || ''))
  .map((e) => ({ tag: e.tagName, cls: e.className, text: (e.innerText || '').trim().slice(0, 30), href: e.getAttribute('href'), type: e.getAttribute('type') }))));
await btns('LISTING_BUTTONS_BEFORE_SEARCH');

// ---- insuranceComp panel structure
await page.locator('ng-select[formcontrolname="insuranceComp"] .ng-select-container').click();
await page.locator('ng-dropdown-panel').waitFor();
out('INSCOMP_PANEL', await page.evaluate(() => [...document.querySelectorAll('ng-dropdown-panel .ng-dropdown-panel-items *')]
  .filter((e) => /ng-optgroup|ng-option/.test(e.className))
  .map((e) => ({ cls: e.className, text: (e.innerText || '').replace(/\s+/g, ' ').trim(), checkbox: !!e.querySelector('input[type=checkbox]') }))));
await page.keyboard.press('Escape');

// ---- platform panel
await page.locator('ng-select[formcontrolname="platform"] .ng-select-container').click();
await page.locator('ng-dropdown-panel').waitFor();
out('PLATFORM_PANEL', await page.evaluate(() => [...document.querySelectorAll('ng-dropdown-panel .ng-dropdown-panel-items *')]
  .filter((e) => /ng-optgroup|ng-option/.test(e.className)).map((e) => ({ cls: e.className, text: (e.innerText || '').replace(/\s+/g, ' ').trim() }))));
await page.keyboard.press('Escape');

// ---- search an old Allianz transaction
await page.locator('input[formcontrolname="search"]').fill('BR55004010');
await page.getByRole('button', { name: 'Search', exact: true }).click();
await settle(5000);
await btns('LISTING_BUTTONS_AFTER_SEARCH');
out('ROW_CELLS', await page.evaluate(() => {
  const heads = [...document.querySelectorAll('table thead th')].map((t) => t.innerText.replace(/\s+/g, ' ').trim());
  const tr = document.querySelector('table tbody tr');
  if (!tr) return { heads, none: true };
  return { heads, cells: [...tr.children].map((td, i) => ({ h: heads[i], html: td.innerHTML.replace(/>[^<]{1,}</g, (m) => m.replace(/[A-Za-z0-9]/g, 'x')).slice(0, 400), text: (td.innerText || '').replace(/\s+/g, ' ').trim().replace(/[0-9]/g, '9') })) };
}));
// The selected-chip text of the filters (to know how a cleared filter looks)
out('FILTER_VALUES', await page.evaluate(() => [...document.querySelectorAll('ng-select')].map((s) => ({ fcn: s.getAttribute('formcontrolname'), value: (s.querySelector('.ng-value-container')?.innerText || '').trim(), placeholder: (s.querySelector('.ng-placeholder')?.innerText || '').trim() }))));
out('DATE_INPUTS', await page.evaluate(() => [...document.querySelectorAll('input[formcontrolname]')].map((i) => ({ fcn: i.getAttribute('formcontrolname'), value: i.value.replace(/[0-9]/g, '9'), ro: i.readOnly }))));

// ---- Print with recorders
const print = page.locator('button, a').filter({ hasText: /^\s*Print\s*$/ }).filter({ visible: true });
out('PRINT_COUNT', await print.count());
if (await print.count()) {
  await print.first().click();
  await page.waitForTimeout(2500);
  out('PRINT_RESULT', await page.evaluate(() => ({ printCalls: window.__printCalls, opens: window.__openCalls, url: location.pathname })));
  out('PRINT_DOM', await page.evaluate(() => [...document.querySelectorAll('iframe, .print, [class*=print]')].map((e) => ({ tag: e.tagName, cls: e.className, id: e.id }))));
}
const exp = page.locator('button, a').filter({ hasText: /^\s*Export\s*$/ }).filter({ visible: true });
out('EXPORT_COUNT', await exp.count());
if (await exp.count()) out('EXPORT_HTML', await exp.first().evaluate((e) => e.outerHTML.slice(0, 300)));
const clr = page.getByText(/^\s*Clear all\s*$/i).filter({ visible: true });
out('CLEAR_COUNT', await clr.count());
if (await clr.count()) out('CLEAR_HTML', await clr.first().evaluate((e) => e.outerHTML.slice(0, 300)));

// ---- no result
await page.locator('input[formcontrolname="search"]').fill('QQZ0000Q');
await page.getByRole('button', { name: 'Search', exact: true }).click();
await settle(4000);
out('NO_RESULT', await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && /no search result|no record/i.test(e.textContent || '')).map((e) => ({ tag: e.tagName, cls: e.className, text: e.textContent.trim() }))));

// ---- Transaction Details of BR55004010
await page.locator('input[formcontrolname="search"]').fill('BR55004010');
await page.getByRole('button', { name: 'Search', exact: true }).click();
await settle(5000);
await page.locator('table tbody').getByText('BR55004010', { exact: true }).first().click();
await settle(5000);
out('DETAILS_URL', page.url().replace(/[0-9a-f-]{36}/, '<id>'));
out('DETAILS_INSURER_BOX', await page.evaluate(() => {
  const lab = [...document.querySelectorAll('body *')].find((e) => e.children.length === 0 && (e.textContent || '').trim() === 'Insurer');
  if (!lab) return null;
  let box = lab; for (let i = 0; i < 6 && box.parentElement; i++) { box = box.parentElement; if (/Policy No/.test(box.innerText)) break; }
  return { labTag: lab.tagName, labCls: lab.className, parentHtml: lab.parentElement.outerHTML.replace(/>[^<]{1,}</g, (m) => m.replace(/[0-9]/g, '9')).slice(0, 600),
    imgs: [...box.querySelectorAll('img')].map((i) => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), cls: i.className, w: i.width })), boxCls: box.className,
    boxText: box.innerText.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => (/^[A-Z][A-Za-z .()/-]*$/.test(l) && l.length < 40 ? l : `<${l.length}>`)) };
}));
out('DETAILS_MORE_INFO', await page.evaluate(() => {
  const lab = [...document.querySelectorAll('body *')].find((e) => e.children.length === 0 && /^More Info$/i.test((e.textContent || '').trim()));
  if (!lab) return null;
  let box = lab; for (let i = 0; i < 5 && box.parentElement; i++) { box = box.parentElement; if (/Agency/.test(box.innerText)) break; }
  return { labTag: lab.tagName, labCls: lab.className, lines: box.innerText.split('\n').map((l) => l.trim()).filter(Boolean),
    html: box.outerHTML.replace(/>[^<]{1,}</g, (m) => m.replace(/[0-9]/g, '9')).slice(0, 1200) };
}));
out('DETAILS_STATUS', await page.evaluate(() => [...document.querySelectorAll('.badge, [class*=badge], [class*=status]')].filter((e) => e.offsetParent).map((e) => ({ tag: e.tagName, cls: e.className, text: (e.innerText || '').trim().slice(0, 40) }))));
out('DETAILS_COVER_POLICY', await page.evaluate(() => { const t = document.body.innerText; return ['Cover Note No', 'Policy No', 'Agency', 'Agency No.', 'Agency PIAM ID', 'Platform'].map((l) => { const k = t.indexOf('\n' + l + '\n'); return [l, k >= 0 ? t.slice(k + l.length + 2, t.indexOf('\n', k + l.length + 2)).replace(/[0-9]/g, '9') : null]; }); }));
out('DETAILS_BUTTONS', await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => ({ cls: b.className, text: (b.innerText || '').trim() }))));

// ---- Payment Management: the Payment Channel control
await page.locator('a[href="/cibo/payment-management"]').first().click();
await settle(8000);
out('PM_CONTROLS', await page.evaluate(() => [...document.querySelectorAll('[formcontrolname]')].map((e) => ({ tag: e.tagName, fcn: e.getAttribute('formcontrolname'), cls: e.className.slice(0, 80) }))));
const bank = page.locator('[formcontrolname="selectedBank"]').first();
if (await bank.count()) {
  await bank.locator('.ng-select-container').first().click().catch(async () => bank.click());
  await page.waitForTimeout(1500);
  out('PM_BANK_PANEL', await page.evaluate(() => [...document.querySelectorAll('ng-dropdown-panel *, .dropdown-menu.show *, ngx-treeview *, .treeview *')]
    .filter((e) => e.children.length <= 2 && (e.innerText || '').trim() && /option|item|group|tree|form-check|label/i.test(e.className + e.tagName))
    .slice(0, 60).map((e) => ({ tag: e.tagName, cls: String(e.className).slice(0, 60), text: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50) }))));
  await page.keyboard.press('Escape');
}

// ---- Payment Report / Commission Report: Export buttons (not pressed)
for (const r of ['payment-report', 'commission-report']) {
  await page.locator(`a[href="/cibo/${r}"]`).first().click();
  await settle(4000);
  out(`${r}_BUTTONS`, await page.evaluate(() => [...document.querySelectorAll('button, a')].filter((e) => e.offsetParent && /print|export|search|clear/i.test(e.innerText || '')).map((e) => ({ tag: e.tagName, cls: e.className, text: (e.innerText || '').trim() }))));
}
await browser.close();
