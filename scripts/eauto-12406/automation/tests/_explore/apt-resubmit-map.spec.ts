// A TOOL. Opens UCD APT Transaction Listing, presses Resubmit on one vehicle
// and dumps each wizard screen UP TO the payment button. Never pays.
//
//   TEST_ENV=preprod1 PROBE_VEHICLE=ON000010 npm run probe -- --grep "APT resubmit map"

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const OUT = path.join(__dirname, "..", "..", "explore-output", "apt-resubmit");

async function dump(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.waitForTimeout(1500);
  const s = await page.evaluate(() => ({
    url: location.href,
    body: document.body.innerText.slice(0, 3000),
    ctl: Array.from(document.querySelectorAll("input,button,select,div.next-btn,a"))
      .filter((e: any) => (e.offsetWidth || e.offsetHeight) && (e.id || /btn/.test(String(e.className))))
      .map((e: any) => `${e.tagName}#${e.id}[${(e.innerText || e.value || "").trim().slice(0, 30)}]`),
  }));
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  const lines = s.body.split("\n").map((l) => l.trim()).filter(Boolean);
  const cut = lines.findIndex((l) => /^HOME INSURANCE REPORTS/.test(l));
  console.log(`\n=== ${name} — ${s.url}\n${lines.slice(0, cut > 0 ? cut : 40).join(" | ").slice(0, 1800)}\n   ctl: ${s.ctl.join(" ")}`);
}

test("APT resubmit map", async ({ page, ucdSession }) => {
  const v = process.env.PROBE_VEHICLE ?? "ON000010";
  await ucdSession("ucdE2E");
  const root = page.url().replace(/\/view\/.*/, "");
  await page.goto(root + "/view/ucd/apt/enquiry/");
  await page.locator("#vehicleNo, input[name*=ehicle i]").first().fill(v);
  await page.click("#to-search");
  await page.waitForTimeout(2500);
  await dump(page, "00-listing");
  page.on("dialog", (d) => { console.log("  browser dialog:", d.message()); d.accept(); });
  await page.locator("table tr", { hasText: v }).locator("a, button, input").filter({ hasText: /Resubmit/i }).first().click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm)$/ }).first();
  if (await yes.isVisible({ timeout: 5000 }).catch(() => false)) { console.log("  dialog:", (await page.locator(".ui-dialog:visible").innerText()).replace(/\s+/g, " ")); await yes.click(); }
  await dump(page, "01-after-resubmit");
});
