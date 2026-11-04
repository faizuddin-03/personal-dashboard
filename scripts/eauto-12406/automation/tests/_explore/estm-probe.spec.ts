// A TOOL wearing a spec's clothes — the same role as screen-probe.
//
// It walks eSerahan step by step and dumps each screen's controls to
// explore-output/estm/, so the page object is written from what the screen
// actually has rather than from memory. It proves nothing about the product
// and must never be made to: expectations read off a screen pin today's
// behaviour and defend whatever defect is in there.
//
//   npm run probe -- --grep eSerahan

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { EstmWizardPage } from "@pages/ucd/estm-wizard.page";
import { IdCategory } from "@pages/wizard.page";
import { CARDS } from "@data/cards";
import { nextVehicleNumber, nextEmail, nextMobile, randomEngineNo, randomChassisNo } from "@data/generator";

const OUT = path.join(__dirname, "..", "..", "explore-output", "estm");

const SNAP = `(function(){
  var out=[]; var els=document.querySelectorAll('input,select,textarea,button,div,a');
  for(var i=0;i<els.length;i++){
    var e=els[i]; var c=(e.className||'').toString();
    var t=(e.innerText||e.value||'').trim();
    var isCtl = e.tagName==='INPUT'||e.tagName==='SELECT'||e.tagName==='TEXTAREA';
    if(isCtl || /btn/.test(c) || e.tagName==='BUTTON'){
      if(t.length<=60) out.push({tag:e.tagName,type:e.type||null,id:e.id||null,name:e.name||null,
        cls:c.slice(0,34),text:t||null,
        vis:!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length),
        opts:e.tagName==='SELECT'?e.options.length:null});
    }
  }
  return {url:location.href, controls:out, body:document.body.innerText.slice(0,1800)};
})()`;


/** Confirm a jQuery UI dialog only if one actually opened. */
async function confirmIfPresent(page: Page, label: string): Promise<boolean> {
  const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Setuju|Confirm)$/ }).first();
  try {
    await yes.waitFor({ state: "visible", timeout: 6000 });
  } catch {
    console.log(`  no dialog after ${label}`);
    return false;
  }
  console.log(`  confirmed dialog after ${label}`);
  await yes.click();
  return true;
}

async function dump(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  const s = (await page.evaluate(SNAP)) as any;
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(s, null, 2), "utf8");
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`\n=== ${name} — ${s.url}`);
  for (const c of (s.controls as any[]).filter((x) => x.id && !/-link$/.test(x.id) && x.vis)) {
    console.log(
      "  ", String(c.tag).padEnd(8), String(c.type || "").padEnd(9), "#" + String(c.id).padEnd(24),
      c.opts != null ? `opts=${c.opts}` : c.text ? JSON.stringify(c.text).slice(0, 36) : "",
    );
  }
  return s;
}

test("eSerahan — walk the wizard and dump every step", async ({ page, ucdSession, mykad }) => {
  test.setTimeout(10 * 60 * 1000);
  await ucdSession("ucdE2E");

  const estm = new EstmWizardPage(page);
  await estm.startNewTransaction();
  await estm.chooseBuyerCategory(IdCategory.MALAYSIAN);

  const vehicleRegNo = nextVehicleNumber("TE");
  console.log("vehicle:", vehicleRegNo);
  await estm.authenticateBuyer({ vehicleRegNo, email: nextEmail(), mykad, card: CARDS.malaysianIndividual });
  await estm.continueToVehicle();
  await page.waitForTimeout(2000);
  await dump(page, "step2-vehicle");

  await estm.fillBuyerAndVehicleDetails({
    buyerEmail: nextEmail(),
    contactNo: nextMobile(),
    engineNo: randomEngineNo(),
    chassisNo: randomChassisNo(),
  });
  await dump(page, "step2-filled");

  await estm.continueToSeller();
  await page.waitForTimeout(2500);
  await dump(page, "step3-seller");

  await estm.authenticateSeller({ mykad, card: CARDS.malaysianIndividual });
  await dump(page, "step3-verified");

  await estm.continueToJpjCheck();
  await page.waitForTimeout(3000);
  await dump(page, "step4-jpjcheck");

  // Now driven through the page object — the screens have said what they are.
  await estm.runJpjEnquiry();
  await dump(page, "step4-result");

  await estm.goToPayment();
  await dump(page, "step5-payment");
  console.log("  total with add-ons on :", await estm.totalPayable());

  // Azfar, 2026-09-18: the flow lands on insurance when eLKM is NOT ticked.
  // Ticking it with a renewal period should keep the flow inside eSerahan.
  await estm.configureAddOns({ lkm: 12, evoc: false });
  await page.waitForTimeout(1500);
  console.log("  total with eLKM 12mo on:", await estm.totalPayable());

  const landed = await estm.submitPayment();
  console.log("  landed on:", landed);
  const p6 = await dump(page, "step6-transfer");
  console.log("  tail:", String(p6.body).slice(-300).split(String.fromCharCode(10)).filter(Boolean).join(" | "));
});
