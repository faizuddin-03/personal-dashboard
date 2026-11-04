// A TOOL wearing a spec's clothes. READ ONLY in BackOffice (staging).
//
// Signs in as the `bo` persona and dumps: every menu link (href + label), the
// Company Accounts listing (to pick a UCD company's name + ROC for UCD to UCD
// tests), and any STMS / UCD-to-UCD related screens it can open without acting.
// Output: explore-output/bo-stms/.
//
//   npm run probe -- --grep "BO STMS look"

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";

const OUT = path.join(__dirname, "..", "..", "explore-output", "bo-stms");

async function dump(page: Page, name: string, bodyChars = 4000) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.waitForTimeout(1500);
  const s = await page.evaluate((n) => ({
    url: location.href,
    body: document.body.innerText.slice(0, n),
    links: Array.from(document.querySelectorAll("a"))
      .map((a) => ({ text: (a.textContent || "").trim().replace(/\s+/g, " "), href: a.getAttribute("href") || "" }))
      .filter((l) => l.text && l.href && !l.href.startsWith("javascript:void")),
  }), bodyChars);
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(s, null, 2), "utf8");
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  console.log(`\n=== ${name} — ${s.url}`);
  console.log(s.body.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 60).join(" | ").slice(0, 2500));
  return s;
}

test("BO STMS look — menu, company accounts, STMS screens", async ({ page }) => {
  test.setTimeout(6 * 60 * 1000);
  await new LoginPage(page).as("bo");
  const home = await dump(page, "00-home", 1500);

  const menu = home.links.filter((l) => /view\//.test(l.href));
  fs.writeFileSync(path.join(OUT, "menu.json"), JSON.stringify(menu, null, 2), "utf8");
  const pick = (re: RegExp) => menu.filter((l) => re.test(l.text) || re.test(l.href));
  console.log("\nMENU items matching stms/ucd/company/reset/interstate:");
  for (const l of pick(/stms|ucd|company|reset|interstate|apt|support/i)) console.log("  ", l.text, "->", l.href);

  const base = new URL(page.url());
  const open = async (href: string, name: string) => {
    await page.goto(new URL(href, base).toString());
    return dump(page, name);
  };

  const company = pick(/company account/i)[0];
  if (company) {
    await open(company.href, "10-company-accounts");
    // try a search with no filter to show rows
    await page.getByRole("button", { name: /search/i }).first().click().catch(() => {});
    await page.locator("input[type=submit][value*=Search], #to-search").first().click().catch(() => {});
    await dump(page, "11-company-accounts-searched", 6000);
  }
  for (const [re, name] of [
    [/ucd.?to.?ucd/i, "20-ucd-to-ucd-limited"],
    [/stms/i, "30-stms-first"],
    [/reset payment/i, "40-reset-payment"],
  ] as [RegExp, string][]) {
    const l = pick(re)[0];
    if (l) await open(l.href, name);
  }
});
