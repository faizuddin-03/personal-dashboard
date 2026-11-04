// A TOOL. READ ONLY in BackOffice: lists every APT-related BO link on the
// configured instance, then opens Manual APT Trigger and dumps its controls.
// Presses nothing that triggers.
//
//   TEST_ENV=preprod1 npm run probe -- --grep "BO APT trigger map"

import { test } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";

const OUT = path.join(__dirname, "..", "..", "explore-output", "bo-apt");

test("BO APT trigger map", async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });
  await new LoginPage(page).as("bo");
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a")).map((a) => ({ t: (a.textContent || "").trim().replace(/\s+/g, " "), h: a.getAttribute("href") || "" }))
      .filter((l) => /apt|reset|trigger|pending|failed/i.test(l.t + l.h)));
  for (const l of links) console.log(`  ${l.t}  ->  ${l.h}`);
  const trig = links.find((l) => /manual.*apt.*trigger|apt.*trigger/i.test(l.t));
  if (!trig) return;
  await page.goto(new URL(trig.h, page.url()).toString());
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const ctl = await page.evaluate(() =>
    Array.from(document.querySelectorAll("input,select,button,a.btn,div.next-btn")).map((e: any) => ({
      tag: e.tagName, id: e.id, name: e.name, type: e.type, value: e.value, text: (e.innerText || "").trim().slice(0, 40),
      vis: !!(e.offsetWidth || e.offsetHeight) })).filter((x) => x.vis));
  console.log("\n=== trigger page", page.url());
  for (const c of ctl) console.log("  ", JSON.stringify(c));
  console.log((await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 1200));
  await page.screenshot({ path: path.join(OUT, "manual-apt-trigger.png"), fullPage: true });
  const v = process.env.PROBE_VEHICLE;
  if (!v) return;
  await page.fill("#vehicleRegNo", v);
  await page.fill("#companyRoc", process.env.PROBE_ROC ?? "JM0570913-X");
  await page.click("#to-search");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(2000);
  const after = await page.evaluate(() =>
    Array.from(document.querySelectorAll("input,select,button,a")).map((e: any) => ({
      tag: e.tagName, id: e.id, cls: String(e.className).slice(0, 40), type: e.type, value: e.value, text: (e.innerText || "").trim().slice(0, 40), href: e.getAttribute("href"),
      vis: !!(e.offsetWidth || e.offsetHeight), dis: !!e.disabled })).filter((x) => x.vis && !/menu|logout|home/i.test(x.text)));
  console.log("\n=== after search", v);
  for (const c of after) console.log("  ", JSON.stringify(c));
  console.log((await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 1500));
  await page.screenshot({ path: path.join(OUT, `manual-apt-trigger-${v}.png`), fullPage: true });
  console.log(await page.evaluate(() => (document.querySelector("table") as HTMLElement)?.outerHTML.slice(0, 5000)));
  const js = await page.evaluate(() => Array.from(document.querySelectorAll("script:not([src])")).map((x) => x.textContent || "").filter((t) => /jpjNotice|expiry|datepicker/i.test(t)).join("\n----\n").slice(0, 6000));
  console.log(js);
});
