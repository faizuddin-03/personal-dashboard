// A TOOL, exploration. STMS with a COMPANY seller (Syarikat), main user Azfar1:
// walks Step 1 -> Step 2 and dumps what each step asks for. Stops at Step 2 —
// no uploads, nothing submitted (a draft may be left on the vehicle).
//
//   INSTANCE=preprod1 TEST_ENV=preprod1 PROBE_TAG=unticked npx playwright test --project=explore --grep "STMS company explore"

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { instance } from "@config/environments";
import { StmsWizardPage, SellerCategory } from "@pages/ucd/stms-wizard.page";
import { CARDS } from "@data/cards";
import { nextVehicleNumber, nextEmail } from "@data/generator";

const OUT = path.join(__dirname, "..", "..", "explore-output", "stms-company", process.env.PROBE_TAG ?? "run");

async function dump(page: Page, name: string) {
  const f = await page.evaluate(() =>
    Array.from(document.querySelectorAll("input,select,textarea,button,a.btn,div.next-btn"))
      .filter((e: any) => (e.offsetWidth || e.offsetHeight) && e.type !== "hidden")
      .map((e: any) => ({
        tag: e.tagName, id: e.id, name: e.name, type: e.type,
        value: e.tagName === "SELECT" ? Array.from(e.options).map((o: any) => o.text).slice(0, 8).join(" / ") : e.type === "checkbox" || e.type === "radio" ? String(e.checked) : (e.value ?? e.textContent ?? "").toString().trim().slice(0, 60),
        label: ((e.closest("label")?.textContent || "") + " | " + (e.closest("tr,div.form-group,div.row")?.textContent || "")).trim().replace(/\s+/g, " ").slice(0, 140),
      })));
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({ url: page.url(), fields: f }, null, 2));
  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  fs.writeFileSync(path.join(OUT, `${name}.txt`), text);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`== ${name} ${page.url().replace(/\?.*/, "")}`);
  for (const x of f) console.log(`   ${x.tag} #${x.id} [${x.name}] ${x.type} = ${x.value} :: ${x.label.slice(0, 90)}`);
}

test("STMS company explore", async ({ page, ucdSession, mykad }) => {
  if (instance() !== "preprod1") throw new Error(`preprod1 only — resolved "${instance()}"`);
  fs.mkdirSync(OUT, { recursive: true });
  await ucdSession("ucdE2E");
  const stms = new StmsWizardPage(page);
  await stms.startNewTransaction();
  await stms.chooseSellerCategory(SellerCategory.SYARIKAT);
  await dump(page, "1-step1-company");
  const vehicle = process.env.PROBE_VEHICLE ?? nextVehicleNumber("OL");
  console.log("vehicle:", vehicle);
  try {
    await mykad.removeCard();
    await mykad.setMatchResult("Identical");
    // Company seller: name + reg no must be in before the consent enables.
    await page.fill("#companyName", process.env.PROBE_COMPANY_NAME ?? "QA SELLER 12403 SDN BHD");
    await page.fill("#companyRegNo", process.env.PROBE_COMPANY_ROC ?? "540323-T");
    await stms.authenticateSeller({ vehicleRegNo: vehicle, mykad, card: (CARDS as any)[process.env.PROBE_CARD ?? "emulatorDefault"], sellerEmail: nextEmail() });
    await dump(page, "2-step1-after-auth");
    await stms.continueToVehicle();
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(2000);
    await dump(page, "3-step2-company-details");
    if (process.env.PROBE_TOB) {
      await page.getByText(process.env.PROBE_TOB, { exact: true }).click();
      await page.waitForTimeout(2500);
      await dump(page, "4-step2-after-type-of-business");
    }
  } catch (e) {
    console.log("STOPPED:", String(e).slice(0, 400));
    await dump(page, "9-stopped");
  }
});

// Resume a company STMS from the listing and dump the step it lands on (read-only).
test("STMS company resume dump", async ({ page, ucdSession }) => {
  if (instance() !== "preprod1") throw new Error(`preprod1 only — resolved "${instance()}"`);
  fs.mkdirSync(OUT, { recursive: true });
  const vehicle = process.env.PROBE_VEHICLE!;
  await ucdSession("ucdE2E");
  const root = page.url().replace(/\/view\/.*/, "");
  await page.goto(root + "/view/ucd/stms/enquiry/main.do");
  await page.fill("#vehicleNo", vehicle);
  await page.click("#to-search");
  await page.locator("table tr", { hasText: vehicle }).first().waitFor({ timeout: 20_000 });
  await page.locator("table tr", { hasText: vehicle }).first().locator("a").filter({ hasText: /Resubmit/i }).first().click();
  const yes = page.locator(".ui-dialog:visible .ui-dialog-buttonpane button", { hasText: /^\s*(Yes|OK)\s*$/ }).first();
  if (await yes.isVisible({ timeout: 5000 }).catch(() => false)) await yes.click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(3000);
  await dump(page, `resume-${vehicle}`);
  const text = (await page.locator("body").innerText());
  console.log("TEXT:\n" + text.split("\n").map((l) => l.trim()).filter(Boolean).join("\n").slice(0, 4000));
});

// BO STMS View for a vehicle (read-only): SSM section + everything around it.
test("STMS company BO view dump", async ({ browser }) => {
  if (instance() !== "preprod1") throw new Error(`preprod1 only — resolved "${instance()}"`);
  fs.mkdirSync(OUT, { recursive: true });
  const vehicle = process.env.PROBE_VEHICLE!;
  const { LoginPage } = await import("@auth/login");
  const { baseURL } = await import("@config/environments");
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, baseURL: baseURL() });
  const bo = await ctx.newPage();
  await new LoginPage(bo).as("bo");
  await bo.goto("view/stms/enquiry");
  await bo.fill("#vehicleNo", vehicle);
  await bo.click("#to-search");
  await bo.waitForLoadState("networkidle").catch(() => undefined);
  await bo.waitForTimeout(2000);
  const row = bo.locator("table tr", { hasText: vehicle }).first();
  console.log("BO ROW:", (await row.innerText()).replace(/\s+/g, " "));
  await bo.screenshot({ path: path.join(OUT, `bo-listing-${vehicle}.png`), fullPage: true });
  const pop = bo.context().waitForEvent("page", { timeout: 8000 }).catch(() => null);
  await row.locator("a").filter({ hasText: /^\s*View\s*$/ }).first().click();
  const view = (await pop) ?? bo;
  await view.waitForLoadState("networkidle").catch(() => undefined);
  await view.waitForTimeout(1500);
  await view.screenshot({ path: path.join(OUT, `bo-view-${vehicle}.png`), fullPage: true });
  const t = (await view.locator("body").innerText()).split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
  console.log("BO VIEW:\n" + t.slice(0, 3500));
  await ctx.close();
});

// BO SSM pages (read-only): find the view/ssm links and look for a ROC.
test("BO SSM log dump", async ({ browser }) => {
  if (instance() !== "preprod1") throw new Error(`preprod1 only — resolved "${instance()}"`);
  fs.mkdirSync(OUT, { recursive: true });
  const roc = process.env.PROBE_ROC ?? "597436-Q";
  const { LoginPage } = await import("@auth/login");
  const { baseURL } = await import("@config/environments");
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true, baseURL: baseURL() });
  const bo = await ctx.newPage();
  await new LoginPage(bo).as("bo");
  const links = await bo.locator("a").evaluateAll((as) => as.map((a) => ({ t: (a.textContent || "").trim().replace(/\s+/g, " "), h: a.getAttribute("href") || "" })));
  const ssm = links.filter((l) => /\/ssm\/|ssm/i.test(l.h) || /SSM/i.test(l.t));
  console.log("SSM LINKS:", JSON.stringify(ssm));
  for (const l of ssm.filter((x) => /view\//.test(x.h)).slice(0, 4)) {
    const p = l.h.replace(/^.*?\/view\//, "view/");
    await bo.goto(p); await bo.waitForLoadState("networkidle").catch(() => undefined);
    const inputs = await bo.locator("input[type=text]:visible").count();
    if (inputs) { await bo.locator("input[type=text]:visible").first().fill(roc).catch(() => undefined); await bo.locator("#to-search, input[value*=Search i]").first().click().catch(() => undefined); await bo.waitForLoadState("networkidle").catch(() => undefined); await bo.waitForTimeout(2000); }
    const t = (await bo.locator("body").innerText()).replace(/\s+/g, " ");
    console.log(`== ${l.t} (${p}) hit=${t.includes(roc)} :: ${t.slice(0, 500)}`);
    await bo.screenshot({ path: path.join(OUT, `bo-${p.replace(/[\/]/g, "_")}.png`), fullPage: true });
  }
  await ctx.close();
});
