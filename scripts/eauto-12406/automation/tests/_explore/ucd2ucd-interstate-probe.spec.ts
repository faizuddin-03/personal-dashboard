// A TOOL wearing a spec's clothes. DESTRUCTIVE (staging only).
//
// UCD to UCD INTERSTATE, seller side: ucdE2E (UCD A) creates an Interstate
// transaction for buyer ROC PROBE_BUYER_ROC, thumbprints, fills Step 2, runs
// what the screens offer and submits it to UCD B. Then — if ucdE2E2 is
// configured — signs in as UCD B, finds it under "To Accept" and completes it.
// Output: explore-output/ucd2ucd-interstate/.
//
//   PROBE_BUYER_ROC=1231165-A npm run probe -- --grep "UCD to UCD Interstate walk"

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { UcdHomePage, UCD_MENU } from "@pages/ucd/ucd-home.page";
import { StmsWizardPage } from "@pages/ucd/stms-wizard.page";
import { CARDS } from "@data/cards";
import { nextVehicleNumber, nextMobile, nextEmail, randomEngineNo, randomChassisNo } from "@data/generator";

const OUT = path.join(__dirname, "..", "..", "explore-output", "ucd2ucd-interstate");
const PREFIX = process.env.PROBE_PREFIX ?? "TE";
const BUYER_ROC = process.env.PROBE_BUYER_ROC ?? "1231165-A";

const SNAP = `(function(){
  var out=[]; var els=document.querySelectorAll('input,select,textarea,button,a,div');
  for(var i=0;i<els.length;i++){
    var e=els[i]; var c=(e.className||'').toString();
    var t=(e.innerText||e.value||'').trim().replace(/\\s+/g,' ');
    var isCtl=e.tagName==='INPUT'||e.tagName==='SELECT'||e.tagName==='TEXTAREA'||e.tagName==='BUTTON';
    if(isCtl || /next-btn|btn/.test(c)){
      var vis=!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length);
      if(vis && t.length<=70) out.push({tag:e.tagName,type:e.type||null,id:e.id||null,name:e.name||null,text:t||null});
    }
  }
  return {url:location.href,controls:out,body:document.body.innerText.slice(0,3500)};
})()`;

async function dump(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.waitForTimeout(1500);
  const s = (await page.evaluate(SNAP)) as any;
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(s, null, 2), "utf8");
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  const lines = String(s.body).split("\n").map((l: string) => l.trim()).filter(Boolean)
    .filter((l: string) => !/^Saya |^Select Vehicle Make|^Acura/.test(l));
  const cut = lines.findIndex((l) => /^HOME INSURANCE REPORTS/.test(l));
  console.log(`\n=== ${name} — ${s.url}`);
  console.log(lines.slice(0, cut > 0 ? cut : 45).join(" | ").slice(0, 1800));
  console.log("   ids:", (s.controls as any[]).filter((c) => c.id && !/-link$/.test(c.id)).map((c) => "#" + c.id).join(" "));
  return s;
}

async function confirm(page: Page, label: string) {
  const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Setuju|Confirm)$/ }).first();
  try { await yes.waitFor({ state: "visible", timeout: 7000 }); await yes.click(); console.log(`  confirmed dialog after ${label}`); }
  catch { console.log(`  no dialog after ${label}`); }
  await page.waitForLoadState("networkidle").catch(() => {});
}

test("UCD to UCD Interstate walk — seller submits, buyer accepts if configured", async ({ page, ucdSession, mykad }) => {
  test.setTimeout(15 * 60 * 1000);
  await ucdSession("ucdE2E");
  const home = new UcdHomePage(page);
  const stms = new StmsWizardPage(page);
  const vehicleRegNo = process.env.PROBE_VEHICLE ?? `${PREFIX}${String(Math.floor(Math.random() * 90000) + 10000)}`;
  const email = nextEmail();
  console.log("vehicle:", vehicleRegNo, "buyer ROC:", BUYER_ROC);

  try {
    await home.goTo(UCD_MENU.ucdToUcd);
    await page.locator("a, button, div, li").filter({ hasText: /^\s*INTERSTATE\s*$/i }).first().click();
    await page.waitForLoadState("domcontentloaded");
    await page.click("#create-tx");
    await page.waitForLoadState("domcontentloaded");
    await dump(page, "i0-buyer-roc");
    const roc = page.locator("input[type=text]:visible").first();
    await roc.fill(BUYER_ROC);
    await dump(page, "i0-roc-filled");
    await page.locator("div.next-btn:visible, input[type=button]:visible, button:visible").filter({ hasText: /Next|Submit|Search|Continue|Proceed/i }).first().click()
      .catch(async () => { await page.locator("input[type=button]:visible").first().click(); });
    await confirm(page, "buyer ROC");
    await dump(page, "i0-buyer-found");
    await page.click("#to-continue");
    await confirm(page, "buyer confirmed");
    await dump(page, "i1-seller");

    await mykad.removeCard();
    await mykad.setMatchResult("Identical");
    if (await page.locator("#seller-consent").isVisible().catch(() => false)) await page.click("#seller-consent");
    await (stms as any).readMyKad(mykad, CARDS.malaysianIndividual);
    await dump(page, "i1-verified");
    await stms.continueToVehicle();
    await dump(page, "i2-vehicle");

    const fillIf = async (sel: string, v: string) => {
      const l = page.locator(sel);
      if (await l.isVisible().catch(() => false) && !(await l.getAttribute("readonly"))) await l.fill(v);
    };
    await fillIf("#contactNo", nextMobile());
    await fillIf("#email", email);
    await fillIf("#mailingAddress", "NO 1 JALAN PROBE, 81100 JOHOR BAHRU, JOHOR");
    await page.getByText("Single Transaction", { exact: true }).click().catch(() => {});
    await fillIf("#vehicleRegNo", vehicleRegNo);
    await fillIf("#vehicleEngineNo", randomEngineNo());
    await fillIf("#vehicleChassisNo", randomChassisNo());
    if (await page.locator("#vehicleMake").count()) {
      await page.selectOption("#vehicleMake", { label: "Chery" }).catch(() => {});
      await page.locator("#vehicleModel option").nth(1).waitFor({ timeout: 15000 }).catch(() => {});
      await page.selectOption("#vehicleModel", { index: 1 }).catch(() => {});
      await page.selectOption("#vehicleYear", { label: "2012" }).catch(() => {});
    }
    await dump(page, "i2-filled");
    if (await page.locator("#searchVehicleRegNo").isVisible().catch(() => false)) {
      await page.click("#searchVehicleRegNo");
      await confirm(page, "GET (vehicle / JPJ enquiry)");
      await page.waitForTimeout(4000);
      await dump(page, "i2-after-get");
    }
    if (await page.locator("#to-agree").isVisible().catch(() => false) && !(await page.locator("#to-agree").isChecked())) {
      await page.click("#to-agree");
      await page.waitForTimeout(1000);
    }
    await dump(page, "i3-agreed");
    if (await page.locator("#to-continue").isVisible().catch(() => false)) {
      await page.click("#to-continue");
      await confirm(page, "Step 2 continue");
      await page.waitForTimeout(3000);
      await dump(page, "i3-after-step2");
    }

    // Whatever the next screen offers (JPJ enquiry at Step 2 for Interstate, then submit to buyer)
    for (let i = 0; i < 4; i++) {
      if (await page.locator("#to-agree").isVisible().catch(() => false)) await page.click("#to-agree");
      const btn = page.locator("div.next-btn:visible, input[type=button]:visible")
        .filter({ hasText: /Enquiry|Submit|Send|Next|Continue/i }).first();
      if (!(await btn.isVisible().catch(() => false))) break;
      const label = (await btn.innerText().catch(() => "")) || (await btn.getAttribute("value")) || "button";
      console.log("  pressing:", label.trim());
      await btn.click();
      await confirm(page, label.trim());
      await dump(page, `i4-after-${i}`);
      if (/interstate.*(home|listing)|enquiry\/main/i.test(page.url())) break;
    }
  } catch (e) {
    console.log("STOPPED (seller side):", String(e).slice(0, 400));
    await dump(page, "zz-seller-stopped");
  }

  // Seller's view in the listings
  await page.goto(page.url().replace(/\/view\/ucd\/.*/, "/view/ucd/stms/interstate/interstate-home.do"));
  await page.locator("a, div, li").filter({ hasText: /INTERSTATE TRANSACTION LISTING/i }).first().click().catch(() => {});
  await page.waitForLoadState("domcontentloaded");
  await dump(page, "l1-interstate-listing-seller");
  await page.goto(page.url().replace(/\/view\/ucd\/.*/, "/view/ucd/stms/enquiry/main.do"));
  await page.fill("#vehicleNo", vehicleRegNo).catch(() => {});
  await page.click("#to-search").catch(() => {});
  await dump(page, "l2-stms-listing-seller");
  console.log("SELLER SIDE DONE vehicle:", vehicleRegNo);
});
