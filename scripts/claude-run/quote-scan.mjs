#!/usr/bin/env node
// Quick, UNRECORDED quote scan on Secarang /ia/ (real API): which insurers quote each car. Used only to choose test
// data for the recorded QT / E2E TS (EAINT-12406, 04.11.2026). No purchase, nothing past All Quotations.
//   node scripts/claude-run/quote-scan.mjs '[[row,"PLATE","IC"],...]'  → prints one JSON line per car
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const require = createRequire(path.join(REPO, 'scripts/eauto-12406/automation/package.json'));
const { chromium } = require('playwright');
const src = fs.readFileSync(path.join(REPO, 'app/eauto/12107/page.tsx'), 'utf8');
const site = (src.match(/sitePassword: "([^"]*)"/) || [])[1];
const cars = JSON.parse(process.argv[2]);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [row, plate, ic] of cars) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } }); const p = await ctx.newPage();
  const out = { row, plate };
  try {
    await p.goto('https://staging.secarang.com/ia/car-insurance', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
    const pw = p.locator('input[type=password]').filter({ visible: true }).first();
    if (await pw.isVisible().catch(() => false)) { await pw.fill(site); await p.getByRole('button', { name: /^\s*Login\s*$/i }).first().click(); await p.waitForTimeout(4000); }
    await p.getByText('Buy your car insurance here').first().waitFor({ timeout: 60000 }); await p.waitForTimeout(2000);
    const close = p.locator('ngb-modal-window button[aria-label=Close]').first(); if (await close.isVisible().catch(() => false)) await close.click();
    await p.getByText('Private Car', { exact: true }).first().click();
    await p.locator('input[formcontrolname=plateNo]').fill(plate); await p.locator('input[formcontrolname=idNo]').fill(ic); await p.locator('input[formcontrolname=postalCode]').fill('55000');
    await p.getByRole('button', { name: /Get quotation/i }).filter({ visible: true }).first().click();
    let st = '';
    for (let t = 0; t < 40 && !st; t++) {
      await p.waitForTimeout(3000);
      const b = await p.locator('body').innerText().catch(() => '');
      if (await p.locator('.insurance-card').filter({ visible: true }).count()) st = 'quotations';
      else if (/You may renew as early as 2 months/.test(b)) st = '2-month rule';
      else if (/no instant quotation|do not match|unable to retrieve/i.test(b)) st = 'refused: ' + (b.match(/(no instant quotation|do not match|unable to retrieve)[^\n]*/i) || [''])[0];
      else if (await p.locator('app-confirm-details').filter({ visible: true }).count()) {
        const root = p.locator('app-confirm-details').first(); const txt = await root.innerText();
        out.car = txt.replace(/\s+/g, ' ').match(/Model (.*?) Year (\d+)/)?.slice(1).join(' ');
        if (/Variant\s*\n\s*-\s*\n/.test(txt)) { await root.locator('a.text-primary.pointer').filter({ hasText: /^\s*Select\s*$/ }).first().click(); const m = p.locator('ngb-modal-window').filter({ visible: true }).last(); await m.locator('label.variant-font').first().click(); await m.getByRole('button', { name: /^\s*Save\s*$/ }).click(); await p.waitForTimeout(1000); }
        await root.getByRole('button', { name: /Get quotation/i }).last().click(); await p.waitForTimeout(3000);
      }
    }
    out.state = st || 'timeout';
    if (st === 'quotations') {
      await p.waitForTimeout(8000);
      out.cards = await p.locator('.insurance-card').filter({ visible: true }).evaluateAll((cs) => cs.map((c) => ([...c.querySelectorAll('img[alt]')].map((i) => i.alt)[0] || '').replace(/ logo$/i, '') + ': ' + (/Quotation unavailable/i.test(c.innerText) ? 'UNAVAILABLE' : (c.innerText.match(/RM[\d,.]+/g) || []).join(' '))));
    }
  } catch (e) { out.error = e.message.split('\n')[0]; }
  console.log(JSON.stringify(out));
  await ctx.close();
}
await browser.close();
