// A TOOL. BackOffice > Manage Company Accounts: reads a UCD company's address
// (the APT region follows it — QA, 2026-09-28) and, only when PROBE_SET_STATE
// is given, changes the address to that state and saves.
//
//   read : TEST_ENV=preprod1 PROBE_ROC=JM0570913-X npm run probe -- --grep "BO company address"
//   write: TEST_ENV=preprod1 PROBE_ROC=JM0570913-X PROBE_SET_STATE=SABAH PROBE_SET_POSTCODE=88000 PROBE_SET_CITY="KOTA KINABALU" npm run probe -- --grep "BO company address"
//
// Only ever point it at a company QA owns (AZFARAZO for Azfar1).

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";

// PROBE_TS puts the screenshots in that TS's evidence folder (one folder per TS).
const OUT = process.env.PROBE_TS
  ? path.join(__dirname, "..", "..", "..", "cr", "EAINT-12403", "05-evidence", "pre-push", process.env.PROBE_TS)
  : path.join(__dirname, "..", "..", "explore-output", "company-address");

async function fieldsOf(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("input,select,textarea"))
      .filter((e: any) => (e.offsetWidth || e.offsetHeight) && e.type !== "hidden")
      .map((e: any) => ({
        id: e.id, name: e.name, type: e.type,
        value: e.tagName === "SELECT" ? (e.options[e.selectedIndex]?.text ?? "") : e.value,
        disabled: !!e.disabled, readonly: !!e.readOnly,
        label: (e.closest("tr")?.querySelector("td,th")?.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
      })));
}

test("BO company address", async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });
  const roc = process.env.PROBE_ROC ?? "JM0570913-X";
  const stamp = "address-" + new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + (process.env.PROBE_SET_STATE ? `-set-${process.env.PROBE_SET_STATE}` : "-read");
  await new LoginPage(page).as("bo");
  await page.goto("view/account/company/");
  await page.locator("#registrationCompany").fill(roc);
  await page.locator("#to-search, input[value*=Search i]").first().click();
  await page.locator("table tr", { hasText: roc }).first().waitFor({ timeout: 20_000 });
  const row = page.locator("table tr", { hasText: roc }).first();
  console.log("row:", (await row.innerText()).replace(/\s+/g, " ").slice(0, 300));
  const links = await row.locator("a").evaluateAll((as) => as.map((a) => `${(a.textContent || "").trim()} -> ${a.getAttribute("href")}`));
  console.log("row links:", links.join(" | "));
  await page.screenshot({ path: path.join(OUT, `${stamp}-listing.png`) });
  // open the company (name link or first link in the row)
  await row.locator("a").first().click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const edit = page.locator("a, button, input[type=button], input[type=submit]").filter({ hasText: /^\s*Edit\s*$/i }).first();
  const editVal = page.locator("input[value=Edit i], input[value='Edit']").first();
  if (await edit.isVisible().catch(() => false)) await edit.click();
  else if (await editVal.isVisible().catch(() => false)) await editVal.click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  console.log("page:", page.url());
  const before = await fieldsOf(page);
  const addr = before.filter((f) => /addr|state|postcode|poscode|city|town|negeri|bandar/i.test(`${f.id} ${f.name} ${f.label}`));
  console.log("ADDRESS FIELDS:");
  for (const f of addr) console.log("  ", JSON.stringify(f));
  fs.writeFileSync(path.join(OUT, `${stamp}-fields.json`), JSON.stringify(before, null, 2));
  await page.screenshot({ path: path.join(OUT, `${stamp}-company-before.png`), fullPage: true });

  const state = process.env.PROBE_SET_STATE;
  if (!state) return;
  // WRITE — only when asked.
  // Exact ids read off the page 2026-09-28 (mailing address; showroom uses showroom*).
  const pre = process.env.PROBE_FIELDS === "showroom" ? "showroom" : "";
  const byId = (id: string) => addr.find((f) => f.id === id && !f.disabled && !f.readonly);
  const st = byId(pre ? "showroomState" : "state"), pc = byId(pre ? "showroomPostcode" : "postCode"), city = byId(pre ? "showroomCity" : "city");
  if (!st) throw new Error("no editable state field found — refusing to guess");
  const sel = (f: { id: string; name: string }) => (f.id ? `#${f.id}` : `[name="${f.name}"]`);
  await page.selectOption(sel(st), { label: new RegExp(`^${state}`, "i") as any }).catch(async () => {
    const opt = await page.locator(`${sel(st)} option`).filter({ hasText: new RegExp(state, "i") }).first().getAttribute("value");
    await page.selectOption(sel(st), opt!);
  });
  await page.waitForTimeout(1500); // city lists often reload by AJAX after the state
  if (pc && process.env.PROBE_SET_POSTCODE) await page.fill(sel(pc), process.env.PROBE_SET_POSTCODE);
  if (city && process.env.PROBE_SET_CITY) {
    const c = page.locator(sel(city));
    if ((await c.evaluate((e) => e.tagName)) === "SELECT") {
      const opt = await page.locator(`${sel(city)} option`).filter({ hasText: new RegExp(process.env.PROBE_SET_CITY, "i") }).first().getAttribute("value").catch(() => null);
      if (opt) await page.selectOption(sel(city), opt); else await page.selectOption(sel(city), { index: 1 });
    } else await c.fill(process.env.PROBE_SET_CITY);
  }
  // District cascades from city; take the named one or the first real option.
  const distId = pre ? "showroomDistrict" : "district";
  if (addr.find((f) => f.id === distId)) {
    await page.waitForTimeout(1500);
    const want = process.env.PROBE_SET_DISTRICT;
    const opt = want ? await page.locator(`#${distId} option`).filter({ hasText: new RegExp(want, "i") }).first().getAttribute("value").catch(() => null) : null;
    if (opt) await page.selectOption(`#${distId}`, opt); else await page.selectOption(`#${distId}`, { index: 1 }).catch(() => undefined);
  }
  const after = (await fieldsOf(page)).filter((f) => /addr|state|postcode|city|district/i.test(f.id));
  console.log("EDITED TO:"); for (const f of after) console.log("  ", f.id, "=", f.value);
  await page.screenshot({ path: path.join(OUT, `${stamp}-company-edited.png`), fullPage: true });
  page.on("dialog", (d) => { console.log("  dialog:", d.message()); d.accept(); });
  await page.locator("input[type=submit], input[type=button], button").filter({ hasText: /Save|Update|Submit/i }).first().click()
    .catch(async () => { await page.locator("input[value*=Save i], input[value*=Update i]").first().click(); });
  const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm)$/i }).first();
  if (await yes.isVisible({ timeout: 6000 }).catch(() => false)) { console.log("  confirm:", (await page.locator(".ui-dialog:visible").innerText()).replace(/\s+/g, " ")); await yes.click(); }
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(2000);
  console.log("after save:", (await page.locator(".ui-dialog:visible, .alert:visible, .message:visible, .success:visible, .error:visible").allInnerTexts().catch(() => [])).join(" ").replace(/\s+/g, " ").slice(0, 300));
  await page.screenshot({ path: path.join(OUT, `${stamp}-company-saved.png`), fullPage: true });
});
