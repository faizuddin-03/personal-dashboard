// A TOOL. READ ONLY. Finds out what BO "Export CSV" does on a listing: reads
// its click handler, then searches (Tx Status = Failed, date range) and clicks
// it while watching downloads, popups and network requests.
//
//   TEST_ENV=preprod1 PROBE_PATH=view/stms/enquiry npm run probe -- --grep "BO export probe"

import { test } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";

const OUT = path.join(__dirname, "..", "..", "explore-output", "bo-export");

test("BO export probe", async ({ page }) => {
  test.setTimeout(10 * 60 * 1000);
  fs.mkdirSync(OUT, { recursive: true });
  await new LoginPage(page).as("bo");
  const p = process.env.PROBE_PATH ?? "view/stms/enquiry";
  await page.goto(p);
  await page.waitForLoadState("networkidle").catch(() => undefined);

  const js = await page.evaluate(() => Array.from(document.querySelectorAll("script:not([src])"))
    .map((x) => x.textContent || "").filter((t) => /to-export|export/i.test(t))
    .map((t) => { const i = t.search(/to-export/); return t.slice(Math.max(0, i - 300), i + 2500); }).join("\n-----\n"));
  console.log("=== export handler ===\n" + js.slice(0, 5000));
  const dateInfo = await page.evaluate(() => ["fromDate", "toDate"].map((id) => {
    const e = document.getElementById(id) as HTMLInputElement | null;
    return e ? `${id}: class=${e.className} readonly=${e.readOnly} value=${e.value}` : `${id}: missing`;
  }));
  console.log("dates:", dateInfo.join(" | "));

  // fill the search
  for (const [id, d] of [["fromDate", new Date(2026, 0, 1)], ["toDate", new Date()]] as const) {
    await page.locator(`#${id}`).evaluate((el, iso) => {
      const $ = (window as any).jQuery; const dt = new Date(iso);
      if ($ && $(el).hasClass("hasDatepicker")) $(el).datepicker("setDate", dt);
      else (el as HTMLInputElement).value = `${String(dt.getDate()).padStart(2, "0")}-${String(dt.getMonth() + 1).padStart(2, "0")}-${dt.getFullYear()}`;
    }, d.toISOString());
  }
  await page.selectOption("#to-filter", { label: "Failed" });
  console.log("dates now:", await page.locator("#fromDate").inputValue(), "→", await page.locator("#toDate").inputValue());
  await page.click("#to-search");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(3000);
  console.log("result:", ((await page.locator("body").innerText()).match(/\d+ record\(s\) in total/) ?? ["(no count)"])[0]);

  const reqs: string[] = [];
  page.context().on("request", (r) => { if (!/\.(png|gif|css|js)(\?|$)/.test(r.url())) reqs.push(`${r.method()} ${r.url()} ${(r.postData() ?? "").slice(0, 300)}`); });
  page.context().on("response", (r) => { const cd = r.headers()["content-disposition"]; if (cd) reqs.push(`  RESPONSE ${r.status()} ${r.url()} content-disposition=${cd} type=${r.headers()["content-type"]}`); });
  page.on("dialog", (d) => { reqs.push(`  DIALOG ${d.message()}`); d.accept().catch(() => undefined); });
  const dl = page.waitForEvent("download", { timeout: 180_000 }).catch(() => null);
  const pop = page.context().waitForEvent("page", { timeout: 180_000 }).catch(() => null);
  await page.click("#to-export");
  const ui = page.locator(".ui-dialog:visible").first();
  if (await ui.isVisible({ timeout: 5000 }).catch(() => false)) {
    reqs.push("  UI-DIALOG " + (await ui.innerText()).replace(/\s+/g, " ").slice(0, 300));
    const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm|Export)$/i }).first();
    if (await yes.isVisible().catch(() => false)) await yes.click();
  }
  const got = await Promise.race([dl.then((d) => ({ d })), pop.then((p2) => ({ p2 })), page.waitForTimeout(180_000).then(() => null)]);
  if (got && "d" in got && got.d) {
    const f = path.join(OUT, got.d.suggestedFilename());
    await got.d.saveAs(f);
    console.log("DOWNLOADED", f, fs.statSync(f).size, "bytes");
  } else if (got && "p2" in got && got.p2) {
    console.log("POPUP", got.p2.url());
  } else console.log("nothing after 180 s");
  console.log("=== traffic after click ===\n" + reqs.slice(0, 40).join("\n"));
  await page.screenshot({ path: path.join(OUT, "after-export.png") });
});
