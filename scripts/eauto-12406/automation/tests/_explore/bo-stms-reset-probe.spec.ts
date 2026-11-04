// A TOOL. DESTRUCTIVE (staging only): presses BackOffice [Reset] on ONE failed
// STMS transaction, then records how BO and the UCD listing show it afterwards.
//
//   PROBE_TXN=S694494082 PROBE_VEHICLE=ZA000001 npm run probe -- --grep "BO STMS reset"

import { test } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";

const OUT = path.join(__dirname, "..", "..", "explore-output", "bo-stms");

test("BO STMS reset — one failed payment", async ({ page, browser }) => {
  test.setTimeout(6 * 60 * 1000);
  const txn = process.env.PROBE_TXN ?? "S694494082";
  const vehicle = process.env.PROBE_VEHICLE ?? "ZA000001";
  await new LoginPage(page).as("bo");
  const base = new URL(page.url());
  const rowsOf = () => page.evaluate(() =>
    Array.from(document.querySelectorAll("table tr"))
      .map((tr) => Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent || "").trim().replace(/\s+/g, " ")))
      .filter((r) => r.length > 8));
  const searchBo = async () => {
    await page.goto(new URL("/eauto/view/stms/enquiry", base).toString());
    await page.locator("input[id*=ehicle i], input[name*=ehicle i]").first().fill(vehicle);
    await page.locator("#to-search, input[value*=Search i], button:has-text('Search')").first().click();
    await page.waitForTimeout(3000);
  };

  await searchBo();
  const before = await rowsOf();
  console.log("BO BEFORE:"); for (const r of before) console.log("  ", r.join(" | ").slice(0, 400));

  const row = page.locator("table tr", { hasText: txn });
  page.once("dialog", (d) => { console.log("  browser dialog:", d.message()); d.accept(); });
  await page.locator(`a.resetPayment[title$="${txn}"]`).click();
  const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm)$/ }).first();
  if (await yes.isVisible({ timeout: 6000 }).catch(() => false)) {
    console.log("  dialog:", (await page.locator(".ui-dialog").first().innerText()).replace(/\s+/g, " ").slice(0, 300));
    await yes.click();
  }
  await page.waitForTimeout(3000);
  const msg = await page.locator(".ui-dialog:visible, .alert:visible, .message:visible").allInnerTexts().catch(() => []);
  console.log("  after reset messages:", JSON.stringify(msg).slice(0, 400));
  await page.screenshot({ path: path.join(OUT, `reset-${txn}.png`) });

  await searchBo();
  console.log("BO AFTER:"); for (const r of await rowsOf()) console.log("  ", r.join(" | ").slice(0, 400));

  // Reset Payment Report
  await page.goto(new URL("/eauto/view/report/reset-payment-report", base).toString());
  await page.waitForTimeout(2000);
  fs.writeFileSync(path.join(OUT, "reset-payment-report.txt"), await page.evaluate(() => document.body.innerText.slice(0, 3000)));
  console.log("reset report form:", (await page.evaluate(() => document.body.innerText.slice(0, 600))).replace(/\s+/g, " "));
});
