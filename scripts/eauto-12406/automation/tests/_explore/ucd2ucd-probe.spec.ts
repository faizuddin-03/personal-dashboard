// A TOOL wearing a spec's clothes — the same role as estm-probe.
//
// LOOK ONLY. Opens UCD TO UCD as ucdE2E and dumps every screen it can reach
// WITHOUT submitting anything: the landing page, Standard, Interstate, their
// listings and the first screen of "create new". Output: explore-output/ucd2ucd/.
// It proves nothing about the product and must never be made to.
//
//   npm run probe -- --grep "UCD to UCD look"

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { UcdHomePage, UCD_MENU } from "@pages/ucd/ucd-home.page";

const OUT = path.join(__dirname, "..", "..", "explore-output", "ucd2ucd");

const SNAP = `(function(){
  var out=[]; var els=document.querySelectorAll('input,select,textarea,button,a,div');
  for(var i=0;i<els.length;i++){
    var e=els[i]; var c=(e.className||'').toString();
    var t=(e.innerText||e.value||'').trim().replace(/\\s+/g,' ');
    var isCtl=e.tagName==='INPUT'||e.tagName==='SELECT'||e.tagName==='TEXTAREA'||e.tagName==='BUTTON'||e.tagName==='A';
    if(isCtl || /btn|tile|menu-item/.test(c)){
      var vis=!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length);
      if(vis && t.length<=70) out.push({tag:e.tagName,type:e.type||null,id:e.id||null,name:e.name||null,
        cls:c.slice(0,40),text:t||null,href:e.getAttribute&&e.getAttribute('href')||null,
        onclick:(e.getAttribute&&e.getAttribute('onclick')||'').slice(0,120)||null});
    }
  }
  return {url:location.href,title:document.title,controls:out,body:document.body.innerText.slice(0,3000)};
})()`;

async function dump(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.waitForTimeout(1500);
  const s = (await page.evaluate(SNAP)) as any;
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(s, null, 2), "utf8");
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`\n=== ${name} — ${s.url}`);
  console.log(String(s.body).split("\n").map((l: string) => l.trim()).filter(Boolean).slice(0, 40).join(" | "));
  return s;
}

/** Click the first visible element whose text matches; report instead of failing. */
async function clickText(page: Page, re: RegExp, label: string): Promise<boolean> {
  const cands = page.locator("a, button, div.next-btn, div[onclick], span[onclick], li, td").filter({ hasText: re });
  const n = await cands.count();
  for (let i = 0; i < n; i++) {
    const el = cands.nth(i);
    if (await el.isVisible().catch(() => false)) {
      console.log(`  click "${label}" (${n} candidates, took #${i})`);
      await el.click();
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      return true;
    }
  }
  console.log(`  NOT FOUND: "${label}"`);
  return false;
}

test("UCD to UCD look — landing, Standard, Interstate (no submit)", async ({ page, ucdSession }) => {
  test.setTimeout(6 * 60 * 1000);
  await ucdSession("ucdE2E");
  const home = new UcdHomePage(page);
  const start = page.url();

  await home.goTo(UCD_MENU.ucdToUcd);
  await dump(page, "01-landing");

  // Standard
  if (await clickText(page, /^\s*STANDARD\s*$/i, "STANDARD")) {
    await dump(page, "02-standard");
    if (await clickText(page, /CREATE NEW/i, "CREATE NEW (standard)")) {
      await dump(page, "03-standard-create");
      // a confirm dialog may open on a category tile — do NOT press Yes; just record it
    }
  }

  // Back to the landing page and try Interstate
  await page.goto(start);
  await home.goTo(UCD_MENU.ucdToUcd);
  if (await clickText(page, /^\s*INTERSTATE\s*$/i, "INTERSTATE")) {
    await dump(page, "04-interstate");
    if (await clickText(page, /CREATE NEW INTERSTATE|CREATE NEW/i, "CREATE NEW (interstate)")) {
      await dump(page, "05-interstate-create");
    }
  }

  // STMS listing, where UCD to UCD transactions are said to appear
  await page.goto(start);
  await home.goTo(UCD_MENU.stms);
  await dump(page, "06-stms-landing");
  if (await clickText(page, /TRANSACTION LISTING/i, "STMS TRANSACTION LISTING")) {
    await dump(page, "07-stms-listing");
  }
});
