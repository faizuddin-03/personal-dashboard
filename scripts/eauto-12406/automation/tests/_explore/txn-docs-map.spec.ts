// A TOOL. READ ONLY. Opens the UCD transaction details (View) for one vehicle
// in the STMS or APT listing and lists every download button / link on it.
//
//   TEST_ENV=preprod1 PROBE_VEHICLE=ON000005 PROBE_KIND=stms npm run probe -- --grep "txn docs map"

import { test } from "@fixtures";

test("txn docs map", async ({ page, ucdSession }) => {
  const v = process.env.PROBE_VEHICLE ?? "ON000005";
  const kind = process.env.PROBE_KIND ?? "stms";
  await ucdSession("ucdE2E");
  const root = page.url().replace(/\/view\/.*/, "");
  await page.goto(root + (kind === "apt" ? "/view/ucd/apt/enquiry/" : "/view/ucd/stms/enquiry/main.do"));
  await page.fill("#vehicleNo", v);
  await page.click("#to-search");
  await page.waitForTimeout(2500);
  await page.locator("table tr", { hasText: v }).locator("a").filter({ hasText: /^View$/ }).first().click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(1500);
  console.log("url:", page.url());
  const els = await page.evaluate(() => Array.from(document.querySelectorAll("a,button,input[type=button],input[type=submit]"))
    .filter((e: any) => e.offsetWidth || e.offsetHeight)
    .map((e: any) => `${e.tagName}#${e.id} .${String(e.className).slice(0, 30)} [${(e.innerText || e.value || "").trim().slice(0, 40)}] href=${e.getAttribute("href") ?? ""} onclick=${(e.getAttribute("onclick") ?? "").slice(0, 80)}`));
  for (const e of els) if (!/-link|Logout|Contact Us|Terms|Privacy/.test(e)) console.log("  ", e);
});
