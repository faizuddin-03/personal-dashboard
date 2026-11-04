// A TOOL wearing a spec's clothes. DESTRUCTIVE (staging only).
//
// UCD to UCD INTERSTATE, BUYER side: signs in as ucdE2E2 (UCD B), finds the
// transaction for PROBE_VEHICLE, accepts it, thumbprints (card built from the
// buyer user's BO record), runs JPJ, pays, and dumps every screen and listing.
// Output: explore-output/ucd2ucd-interstate-buyer/.
//
//   PROBE_VEHICLE=TE71349 npm run probe -- --grep "UCD to UCD Interstate buyer"

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { StmsWizardPage } from "@pages/ucd/stms-wizard.page";
import { CARDS } from "@data/cards";
import { nextEmail } from "@data/generator";

const OUT = path.join(__dirname, "..", "..", "explore-output", "ucd2ucd-interstate-buyer");
const VEHICLE = process.env.PROBE_VEHICLE ?? "TE71349";
// faizuddin2's user as BackOffice lists it (View UCD User Accounts, 2026-09-25)
const BUYER_CARD = {
  ...CARDS.malaysianIndividual,
  NRIC: process.env.PROBE_BUYER_NRIC ?? "030217141005",
  GMPCName: process.env.PROBE_BUYER_NAME ?? "MUHAMMAD FAIZUDDIN BIN BIDI",
  OriginalName: process.env.PROBE_BUYER_NAME ?? "MUHAMMAD FAIZUDDIN BIN BIDI",
};

async function dump(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.waitForTimeout(1500);
  const s = await page.evaluate(() => ({
    url: location.href,
    body: document.body.innerText.slice(0, 3500),
    ids: Array.from(document.querySelectorAll("[id]"))
      .filter((e: any) => (e.offsetWidth || e.offsetHeight) && /^(to-|#?continue|reread|buyer|jpj|seller|read)/i.test(e.id))
      .map((e) => "#" + e.id),
    rows: Array.from(document.querySelectorAll("table tr"))
      .map((tr) => Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent || "").trim().replace(/\s+/g, " ")))
      .filter((r) => r.length > 4).slice(0, 5),
  }));
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(s, null, 2), "utf8");
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  const lines = s.body.split("\n").map((l) => l.trim()).filter(Boolean).filter((l) => !/^Saya /.test(l));
  const cut = lines.findIndex((l) => /^HOME INSURANCE REPORTS/.test(l));
  console.log(`\n=== ${name} — ${s.url}`);
  console.log(lines.slice(0, cut > 0 ? cut : 40).join(" | ").slice(0, 1600));
  if (s.rows.length) for (const r of s.rows) console.log("   row:", r.join(" | ").slice(0, 500));
  console.log("   ids:", s.ids.join(" "));
  return s;
}

async function confirm(page: Page, label: string) {
  const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Setuju|Confirm|Accept)$/ }).first();
  try { await yes.waitFor({ state: "visible", timeout: 7000 });
        console.log(`  dialog after ${label}:`, (await page.locator(".ui-dialog:visible").first().innerText()).replace(/\s+/g, " ").slice(0, 250));
        await yes.click(); }
  catch { console.log(`  no dialog after ${label}`); }
  await page.waitForLoadState("networkidle").catch(() => {});
}

test("UCD to UCD Interstate buyer — accept, thumbprint, pay", async ({ page, ucdSession, mykad }) => {
  test.setTimeout(15 * 60 * 1000);
  await ucdSession("ucdE2E2");
  const root = page.url().replace(/\/view\/.*/, "");
  const stms = new StmsWizardPage(page);
  const email = nextEmail();

  // Where does UCD B see it?
  for (const [name, p] of [["b0-stms-listing", "/view/ucd/stms/enquiry/main.do"], ["b0-interstate-listing", "/view/ucd/stms/interstate/enquiry.do"]]) {
    await page.goto(root + p);
    await page.fill("#vehicleNo", VEHICLE);
    await page.click("#to-search");
    await page.waitForTimeout(2500);
    await dump(page, name);
  }

  try {
    await page.goto(root + "/view/ucd/stms/enquiry/main.do");
    await page.fill("#vehicleNo", VEHICLE);
    await page.click("#to-search");
    await page.waitForTimeout(2500);
    const accept = page.locator("table tr", { hasText: VEHICLE }).locator("a, button, input").filter({ hasText: /accept/i }).first();
    if (!(await accept.isVisible().catch(() => false))) {
      console.log("  no Accept on the STMS listing — trying the Interstate listing");
      await page.goto(root + "/view/ucd/stms/interstate/enquiry.do");
      await page.fill("#vehicleNo", VEHICLE);
      await page.click("#to-search");
      await page.waitForTimeout(2500);
    }
    const acc2 = page.locator("table tr", { hasText: VEHICLE }).locator("a, button, input").filter({ hasText: /accept/i }).first();
    console.log("  pressing:", (await acc2.innerText().catch(() => "?")).trim());
    await acc2.click();
    await confirm(page, "Accept");
    await dump(page, "b1-after-accept");

    await mykad.removeCard();
    await mykad.setMatchResult("Identical");
    if (await page.locator("#jpjReceiptEmail").isVisible().catch(() => false)) await page.fill("#jpjReceiptEmail", email);
    if (await page.locator("#buyer-consent").isVisible().catch(() => false)) await page.click("#buyer-consent");
    await dump(page, "b3-consented");
    await (stms as any).readMyKad(mykad, BUYER_CARD);
    await dump(page, "b3-verified");

    await stms.continueToJpjCheck();
    await dump(page, "b4-jpjcheck");
    const enq = await stms.runJpjEnquiry();
    console.log("  enquiry:", JSON.stringify(enq));
    await dump(page, "b4-result");
    await stms.goToPayment();
    await dump(page, "b5-payment");
    const pay = await stms.submitPaymentAndReadResult();
    console.log("  payment result:", JSON.stringify(pay));
    await dump(page, "b6-after-payment");
  } catch (e) {
    console.log("STOPPED:", String(e).slice(0, 500));
    await dump(page, "zz-stopped");
  }

  for (const [name, p] of [["b9-stms-listing", "/view/ucd/stms/enquiry/main.do"], ["b9-interstate-listing", "/view/ucd/stms/interstate/enquiry.do"]]) {
    await page.goto(root + p);
    await page.fill("#vehicleNo", VEHICLE);
    await page.click("#to-search");
    await page.waitForTimeout(2500);
    await dump(page, name);
  }
});
