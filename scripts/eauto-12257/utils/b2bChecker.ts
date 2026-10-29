import { expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PaymentPage } from '../pages/PaymentPage';
import { focus } from './focusTimeline';

// FPX B2B checker step (Faizuddin, 2026-10-22): open
// https://bank-simulator.fiuu.com/fpx-b2b/pending, enter the Order ID copied on
// the maker page, search, then approve. Captured so far: the empty page and the
// "not found" lookup (_reference/html/fiuu/bank-simulator-fpx-b2b-pending-*.html):
// input#tranId (name tranId), button "Look up my order". The result row and its
// Approve button are not captured yet — the page HTML is saved to evidence.

export const CHECKER_URL = 'https://bank-simulator.fiuu.com/fpx-b2b/pending';

async function saveHtml(p: Page, label: string): Promise<void> {
  const dir = process.env.PW_EVIDENCE_DIR;
  if (!dir) return;
  try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `${label}.html`), await p.content()); } catch { /* best effort */ }
}

/** Approve the order as the checker in a new tab of the same browser, then go back to eAuto. */
export async function b2bChecker(eauto: Page, orderId: string, label: string, decideCode?: string): Promise<void> {
  const tab = await eauto.context().newPage();
  focus(tab);
  const pg = new PaymentPage(tab);
  try {
    await tab.goto(CHECKER_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    if (/401|unauthori[sz]ed/i.test(await tab.title().catch(() => ''))) {
      throw new Error('The FPX B2B checker page asks for a simulator token (401) — see the simulator FAQ.');
    }
    const box = tab.locator('#tranId');
    await box.waitFor({ state: 'visible', timeout: 30_000 });
    await pg.demoHighlight(box);
    await box.click();
    await box.fill(orderId);
    const search = tab.getByRole('button', { name: /look up my order|search/i }).first();
    await pg.demoHighlight(search);
    await search.click();
    await tab.waitForLoadState('domcontentloaded').catch(() => undefined);
    await saveHtml(tab, `${label}-b2b-checker-lookup`);
    const empty = tab.locator('.empty:visible').first();
    if (await empty.isVisible().catch(() => false)) {
      throw new Error(`The checker page did not find Order ID ${orderId}: "${(await empty.innerText()).trim()}"`);
    }
    // Decide code (2026-10-23): the simulator says it is filled in automatically
    // in the same browser; type it only when its box is there and empty.
    // [unverified: the checker's decide-code box has not been captured]
    const decide = tab.locator('input[id*="decide" i], input[name*="decide" i], input[placeholder*="decide" i]').first();
    if (await decide.isVisible().catch(() => false)) {
      const has = (await decide.inputValue().catch(() => '')).trim();
      if (!has) {
        if (!decideCode) throw new Error(`The checker page asks for a decide code for Order ID ${orderId}, but none was read from the Fiuu "Order Authorized" page.`);
        await pg.demoHighlight(decide);
        await decide.click();
        await decide.fill(decideCode);
        console.log(`DETAIL: Checker decide code typed for Order ID ${orderId}`);
      } else {
        console.log(`DETAIL: Checker decide code already filled${decideCode && has !== decideCode ? ' (differs from the one read on Fiuu)' : ''}`);
      }
    }
    const approve = tab.getByRole('button', { name: /approve|authori[sz]e/i })
      .or(tab.locator('input[type=submit][value*="pprove" i], input[type=submit][value*="uthori" i]'))
      .first();
    await approve.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {
      throw new Error(`No Approve / Authorize button for Order ID ${orderId} on the checker page — its HTML is saved as ${label}-b2b-checker-lookup.html.`);
    });
    await pg.captureEvidence(`${label}-b2b-checker-found`);
    const name = (await approve.innerText().catch(() => '')).trim() || (await approve.getAttribute('value').catch(() => '')) || 'Approve';
    await pg.demoHighlight(approve);
    // Let the Approve request finish before the tab closes (same trap as BO
    // Verified, 12153_TS03 2026-10-23: closing a tab mid-request cancels it).
    const posted = tab.waitForResponse(r => r.request().method() === 'POST', { timeout: 30_000 }).catch(() => null);
    await approve.click();
    console.log(`DETAIL: Checker clicked "${name}" for Order ID ${orderId}`);
    await tab.waitForLoadState('domcontentloaded').catch(() => undefined);
    const res = await posted;
    if (!res) console.log(`   ⚠️ No reply to the checker's Approve for Order ID ${orderId} within 30 s`);
    else if (res.status() >= 400) console.log(`   ⚠️ Checker Approve for Order ID ${orderId} returned HTTP ${res.status()}`);
    await tab.waitForTimeout(1_500);
    await saveHtml(tab, `${label}-b2b-checker-after`);
    await pg.captureEvidence(`${label}-b2b-checker-after`);
    const after = (await tab.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
    console.log(`DETAIL: Checker page now says: ${after.slice(0, 200)}`);
    expect.soft(after, 'Checker page shows no error after Approve').not.toMatch(/error|failed|not found/i);
  } finally {
    await tab.close().catch(() => undefined);
    focus(eauto);
    await eauto.bringToFront().catch(() => undefined);
  }
}
