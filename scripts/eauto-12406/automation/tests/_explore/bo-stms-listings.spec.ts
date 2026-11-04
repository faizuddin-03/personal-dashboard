// A TOOL. READ ONLY in BackOffice (staging).
// Searches each STMS-related BO listing for given vehicle numbers and dumps
// what that listing shows (columns, statuses, actions). Presses Search only.
// Output: explore-output/bo-stms/listing-*.json
//
//   PROBE_VEHICLES=TE000004,ZA000001 npm run probe -- --grep "BO STMS listings"

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";

const OUT = path.join(__dirname, "..", "..", "explore-output", "bo-stms");
const LISTINGS: [string, string][] = [
  ["stms-enquiry", "/eauto/view/stms/enquiry"],
  ["support-stms", "/eauto/view/support/stms/"],
  ["rhb-payment", "/eauto/view/payment/rhb-payment-transaction"],
  ["jpj-report-stms-apt-estm", "/eauto/view/jpj/report/stms-apt-estm/list.do"],
  ["incomplete-txn", "/eauto/view/support/incomplete-txn/"],
];

async function search(page: Page, vehicle: string) {
  const box = page
    .locator("input[type=text]")
    .filter({ hasNot: page.locator("[readonly]") })
    .and(page.locator("[id*=ehicle i], [name*=ehicle i], [id*=vehNo i], [name*=vehNo i]"))
    .first();
  if (!(await box.isVisible().catch(() => false))) return "no vehicle box";
  await box.fill(vehicle);
  await page
    .locator("#to-search, input[type=submit][value*=Search i], input[type=button][value*=Search i], button:has-text('Search')")
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(3000);
  return "searched";
}

test("BO STMS listings — where the transactions show up", async ({ page }) => {
  test.setTimeout(8 * 60 * 1000);
  const vehicles = (process.env.PROBE_VEHICLES ?? "TE000004,ZA000001").split(",");
  await new LoginPage(page).as("bo");
  const base = new URL(page.url());
  fs.mkdirSync(OUT, { recursive: true });

  for (const [name, href] of LISTINGS) {
    for (const v of vehicles) {
      await page.goto(new URL(href, base).toString());
      await page.waitForTimeout(1500);
      const how = await search(page, v);
      const s = await page.evaluate(() => {
        const t = document.body.innerText;
        const rows = Array.from(document.querySelectorAll("table tr"))
          .map((tr) => Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent || "").trim().replace(/\s+/g, " ")))
          .filter((r) => r.length > 3);
        return { url: location.href, rows: rows.slice(0, 6), text: t.slice(0, 1500) };
      });
      fs.writeFileSync(path.join(OUT, `listing-${name}-${v}.json`), JSON.stringify({ how, ...s }, null, 2));
      console.log(`\n=== ${name} / ${v} (${how}) — ${s.url}`);
      for (const r of s.rows) console.log("   ", r.join(" | ").slice(0, 700));
      if (!s.rows.length) console.log("   (no table rows)", s.text.split("\n").filter(Boolean).slice(0, 12).join(" | ").slice(0, 500));
    }
  }
});
