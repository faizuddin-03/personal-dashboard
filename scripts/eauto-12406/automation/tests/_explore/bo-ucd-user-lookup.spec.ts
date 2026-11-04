// A TOOL. READ ONLY in BackOffice (staging).
// Finds which UCD companies have a user with a given MyKad — needed because a
// UCD to UCD seller representative must be a registered user of the seller
// company. Output: console + explore-output/bo-stms/user-lookup-*.json.
//
//   PROBE_MYKAD=020406081081 npm run probe -- --grep "BO UCD user lookup"

import { test } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";

const OUT = path.join(__dirname, "..", "..", "explore-output", "bo-stms");

test("BO UCD user lookup — by MyKad", async ({ page }) => {
  test.setTimeout(4 * 60 * 1000);
  const mykads = (process.env.PROBE_MYKAD ?? "020406081081,880101011234").split(",");
  await new LoginPage(page).as("bo");
  const base = new URL(page.url());
  fs.mkdirSync(OUT, { recursive: true });

  await page.goto(new URL("/eauto/view/account/user/ucd", base).toString());
  await page.waitForTimeout(1500);
  const form = await page.evaluate(() =>
    Array.from(document.querySelectorAll("input,select")).map((e: any) => ({
      id: e.id, name: e.name, type: e.type,
      label: (e.closest("td,div")?.previousElementSibling?.textContent || "").trim().slice(0, 40),
    })),
  );
  console.log("form:", JSON.stringify(form.filter((f) => f.type !== "hidden")));

  const byLogin = !!process.env.PROBE_LOGIN;
  for (const k of byLogin ? [process.env.PROBE_LOGIN as string] : mykads) {
    const box = page.locator(byLogin ? "#loginName" : "#refId");
    await box.fill(k).catch(() => console.log("  no MyKad box found"));
    await page.locator("#to-search, input[value*=Search i], button:has-text('Search')").first().click().catch(() => {});
    await page.waitForTimeout(2500);
    const body = await page.evaluate(() => document.body.innerText);
    const i = body.search(/User Account Listing|Listing/i);
    const snippet = body.slice(i, i + 3000);
    fs.writeFileSync(path.join(OUT, `user-lookup-${k}.json`), JSON.stringify({ url: page.url(), snippet }, null, 2));
    console.log(`\n=== MyKad ${k}\n` + snippet.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 30).join("\n"));
  }
});
