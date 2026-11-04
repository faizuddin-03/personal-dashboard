// EAINT-12406 probe (29.10.2026, cr-author sheet RG): READ ONLY. CIBO > Transaction Management, search the three
// RG transactions, open Transaction Details, read the insurer box markup (the locators the RG spec will use) and
// count their matches; download each Receipt to the scratch folder and read its Insurer block with pdftotext.
// Nothing is saved, edited, exported or sent. Output: counts and the insurer texts only (no customer data).
import { chromium, ciboLogin, SCRATCH } from '../before-walk/cibo-lib.mjs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const TX = [['BR69005852', 'TokioMarine'], ['BR60006309', 'Lonpac'], ['BR55004008', 'RHB']];
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true });
const page = await ctx.newPage();
const settle = async (ms = 2500) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms); };
await ciboLogin(page);
console.log('after login', page.url().replace(/\?.*/, ''));
for (const [ref, ins] of TX) {
  await page.locator('a[href="/cibo/transaction-management"]').first().click();
  await settle(4000);
  await page.locator('ng-select[formcontrolname="insuranceComp"] .ng-select-container').click();
  await page.locator('ng-dropdown-panel .ng-option').filter({ hasText: new RegExp(`^\\s*${ins}\\s*$`) }).first().click();
  await page.keyboard.press('Escape');
  await page.locator('input[formcontrolname="search"]').fill(ref);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await settle(4000);
  const rows = await page.locator('table tbody tr').filter({ hasText: ref }).count();
  await page.locator('table tbody').getByText(ref, { exact: true }).first().click();
  await page.waitForURL(/transaction-details/, { timeout: 60000 });
  await settle(3500);
  const r = await page.evaluate(() => {
    const t = document.body.innerText; const k = t.indexOf('\nInsurer\n');
    return k < 0 ? null : t.slice(k + 9, t.indexOf('\nPlan', k));
  });
  const label = page.locator('xpath=//*[normalize-space(text())="Insurer"]');
  const row = page.locator('xpath=//*[normalize-space(text())="Insurer"]/..');
  const box = page.locator('xpath=//*[normalize-space(text())="Insurer"]/ancestor::*[.//*[normalize-space(text())="Policy No"]][1]');
  const rowHtml = await row.first().evaluate((e) => e.outerHTML.replace(/\s+/g, ' ').slice(0, 900)).catch(() => '(none)');
  const rowLines = await row.first().evaluate((e) => e.innerText.split('\n').map((x) => x.trim()).filter(Boolean)).catch(() => []);
  const boxTag = await box.first().evaluate((e) => `${e.tagName}.${e.className}`).catch(() => '(none)');
  const receipts = await page.getByRole('button', { name: /Receipt/ }).filter({ visible: true }).count();
  console.log(JSON.stringify({ ref, listingRows: rows, insurerText: r, labelCount: await label.count(), rowCount: await row.count(), rowLines, boxCount: await box.count(), boxTag, receiptButtons: receipts }));
  console.log('ROW HTML', rowHtml);
  if (receipts) {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.getByRole('button', { name: /Receipt/ }).filter({ visible: true }).first().click()]);
    const f = path.join(SCRATCH, `probe-rg-${ref}.pdf`); await dl.saveAs(f);
    const lines = execFileSync('pdftotext', ['-layout', f, '-'], { encoding: 'utf8' }).split(/\r?\n/);
    const i = lines.findIndex((l) => /^\s*Insurer\s*$/.test(l) || /^\s*Insurer\s{2,}/.test(l));
    console.log('RECEIPT', ref, dl.suggestedFilename().replace(/[A-Z0-9]+\.pdf$/, '<plate>.pdf'), JSON.stringify(lines.slice(i, i + 6).map((l) => l.trim())));
  }
}
await browser.close();
