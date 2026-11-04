// A TOOL. READ ONLY in BackOffice (staging).
// Opens JPJ XML Log (STMS) for a vehicle and dumps the enquiry / submission
// XML — the exact request and response eAuto exchanged with JPJ (eSim on
// staging): usage code, body type, response code, amounts.
// Output: explore-output/bo-stms/xml-<vehicle>-*.txt
//
//   PROBE_VEHICLE=TE000004 npm run probe -- --grep "BO JPJ XML log"

import { test } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";

const OUT = path.join(__dirname, "..", "..", "explore-output", "bo-stms");

test("BO JPJ XML log — enquiry and submission for one vehicle", async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);
  const vehicle = process.env.PROBE_VEHICLE ?? "TE000004";
  const logPath = process.env.PROBE_LOG_PATH ?? "/eauto/view/stms/jpj/log";
  await new LoginPage(page).as("bo");
  const base = new URL(page.url());
  fs.mkdirSync(OUT, { recursive: true });
  await page.goto(new URL(logPath, base).toString());
  await page.waitForTimeout(1500);
  const form = await page.evaluate(() => Array.from(document.querySelectorAll("input,select")).map((e: any) => `${e.tagName}#${e.id}[${e.name}] ${e.type}`).join(" | "));
  console.log("form:", form.slice(0, 800));
  const box = page.locator("input[id*=ehicle i], input[name*=ehicle i], input[id*=vehNo i]").first();
  await box.fill(vehicle).catch(() => console.log("  no vehicle box"));
  await page.locator("#to-search, input[value*=Search i], button:has-text('Search')").first().click().catch(() => {});
  await page.waitForTimeout(3000);
  const rows = await page.evaluate(() => Array.from(document.querySelectorAll("table tr")).map((tr) =>
    Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120))).filter((r) => r.length > 3));
  for (const r of rows.slice(0, 10)) console.log("  row:", r.join(" | ").slice(0, 400));

  // open each "View"/xml link in turn and save its text
  const links = page.locator("table a").filter({ hasText: /view|xml|request|response/i });
  const n = Math.min(await links.count(), 6);
  for (let i = 0; i < n; i++) {
    const [popup] = await Promise.all([
      page.context().waitForEvent("page", { timeout: 5000 }).catch(() => null),
      links.nth(i).click(),
    ]);
    const target = popup ?? page;
    await target.waitForTimeout(2000);
    const txt = await target.evaluate(() => {
      const dlg = document.querySelector(".ui-dialog:not([style*='display: none'])") as HTMLElement | null;
      return (dlg ?? document.body).innerText;
    });
    fs.writeFileSync(path.join(OUT, `xml-${vehicle}-${i}.txt`), txt);
    const hits = txt.match(/<[^>]*(usage|body|kod|jenis|response|status|amaun|amount|fee)[^>]*>[^<]{0,40}/gi) ?? [];
    console.log(`\n--- link ${i}: ${txt.length} chars; tags of interest:`, hits.slice(0, 25).join(" "));
    if (!hits.length) console.log(txt.slice(0, 600));
    if (popup) await popup.close(); else { await page.keyboard.press("Escape"); await page.locator(".ui-dialog-titlebar-close:visible").first().click().catch(() => {}); }
  }
});
