// A TOOL wearing a spec's clothes — the same role as estm-probe.
//
// DESTRUCTIVE (staging only): walks one UCD to UCD STANDARD transaction as
// ucdE2E through every step, pays, and dumps each screen plus the STMS listing
// and transaction details afterwards. Output: explore-output/ucd2ucd-standard/.
// Proves nothing about the product; expectations come from requirements.
//
//   npm run probe -- --grep "UCD to UCD Standard walk"

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { UcdHomePage, UCD_MENU } from "@pages/ucd/ucd-home.page";
import { StmsWizardPage } from "@pages/ucd/stms-wizard.page";
import { CARDS } from "@data/cards";
import { nextVehicleNumber, nextMobile, nextEmail, randomEngineNo, randomChassisNo } from "@data/generator";

const OUT = path.join(__dirname, "..", "..", "explore-output", "ucd2ucd-standard");
const PREFIX = process.env.PROBE_PREFIX ?? "TE";

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
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  const lines = String(s.body).split("\n").map((l: string) => l.trim()).filter(Boolean);
  const cut = lines.findIndex((l) => /^HOME INSURANCE REPORTS/.test(l));
  console.log(`\n=== ${name} — ${s.url}`);
  console.log(lines.slice(0, cut > 0 ? cut : 45).join(" | ").slice(0, 2200));
  console.log("   ids:", (s.controls as any[]).filter((c) => c.id).map((c) => "#" + c.id).join(" "));
  return s;
}

test("UCD to UCD Standard walk — full payment", async ({ page, ucdSession, mykad }) => {
  test.setTimeout(12 * 60 * 1000);
  await ucdSession("ucdE2E");
  const home = new UcdHomePage(page);
  const stms = new StmsWizardPage(page);
  const vehicleRegNo = process.env.PROBE_VEHICLE ?? `${PREFIX}${String(Math.floor(Math.random() * 90000) + 10000)}`;
  const email = nextEmail();
  console.log("vehicle:", vehicleRegNo);

  try {
    await home.goTo(UCD_MENU.ucdToUcd);
    await page.locator("a, button, div, li").filter({ hasText: /^\s*STANDARD\s*$/i }).first().click();
    await page.waitForLoadState("domcontentloaded");
    await dump(page, "s1-seller");

    await mykad.removeCard();
    await mykad.setMatchResult("Identical");
    // UCD to UCD Step 1 has no vehicle field: Perakuan first, then the MyKad.
    await page.click("#seller-consent");
    await dump(page, "s1-consented");
    await (stms as any).readMyKad(mykad, CARDS.malaysianIndividual);
    await dump(page, "s1-verified");

    await stms.continueToVehicle();
    await dump(page, "s2-vehicle");
    if (process.env.PROBE_STOP === "s2") { console.log("STOP at s2 as asked"); return; }
    // UCD to UCD Step 2: SELLER company (UCD A) + contact + Single/Bulk + vehicle.
    await page.fill("#companyName", process.env.PROBE_SELLER_NAME ?? "22 ST MOTOR SDN. BHD.");
    await page.fill("#companyRocNo", process.env.PROBE_SELLER_ROC ?? "1465855-D");
    await page.fill("#contactNo", nextMobile());
    await page.fill("#email", email);
    await page.fill("#mailingAddress", "NO 1 JALAN PROBE, 81100 JOHOR BAHRU, JOHOR");
    await page.getByText("Single Transaction", { exact: true }).click().catch(async () => {
      await page.locator("input[type=radio]").first().check();
    });
    await page.fill("#vehicleRegNo", vehicleRegNo);
    await page.fill("#vehicleEngineNo", randomEngineNo());
    await page.fill("#vehicleChassisNo", randomChassisNo());
    await page.selectOption("#vehicleMake", { label: "Chery" });
    await page.locator("#vehicleModel option").nth(1).waitFor({ timeout: 15000 }).catch(() => {});
    await page.selectOption("#vehicleModel", { index: 1 });
    await page.selectOption("#vehicleYear", { label: "2012" });
    await dump(page, "s2-filled");
    await page.click("#to-continue-company");
    const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Setuju|Confirm)$/ }).first();
    if (await yes.isVisible({ timeout: 6000 }).catch(() => false)) await yes.click();
    else await yes.waitFor({ state: "visible", timeout: 6000 }).then(() => yes.click()).catch(() => console.log("  no confirm dialog after Step 2"));
    await page.waitForLoadState("networkidle").catch(() => {});
    await dump(page, "s3-buyer");
    if (await page.locator("#jpjReceiptEmail").isVisible().catch(() => false)) await page.fill("#jpjReceiptEmail", email);
    if (await page.locator("#buyer-consent").isVisible().catch(() => false)) await page.click("#buyer-consent");
    await dump(page, "s3-consented");
    await (stms as any).readMyKad(mykad, CARDS.malaysianIndividual);
    await dump(page, "s3-verified");

    await stms.continueToJpjCheck();
    await dump(page, "s4-jpjcheck");
    const enq = await stms.runJpjEnquiry();
    console.log("  enquiry:", JSON.stringify(enq));
    await dump(page, "s4-result");

    await stms.goToPayment();
    await dump(page, "s5-payment");
    const pay = await stms.submitPaymentAndReadResult();
    console.log("  payment result:", JSON.stringify(pay));
    await dump(page, "s6-after-payment");
  } catch (e) {
    console.log("STOPPED:", String(e).slice(0, 400));
    await dump(page, "zz-stopped");
  }

  // Listing: where did it land, with what statuses?
  await page.goto(page.url().replace(/\/view\/ucd\/.*/, "/view/ucd/stms/enquiry/main.do"));
  await page.locator("input").first().waitFor({ timeout: 15000 }).catch(() => {});
  const vn = page.locator("input[type=text]").first();
  await vn.fill(vehicleRegNo).catch(() => {});
  await page.getByText(/Search Now/i).first().click().catch(() => {});
  await dump(page, "l1-stms-listing");
  console.log("DONE vehicle:", vehicleRegNo);
});
