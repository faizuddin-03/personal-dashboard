// A TOOL, READ-ONLY. BackOffice SSM settings for one UCD company:
//  1. Manage Company Accounts > <company> > edit page: every SSM / category / purchase field
//  2. Settings > Bypass Purchase SSM (STMS & eSTM): the company's user rows
// Never saves.
//
//   INSTANCE=preprod1 TEST_ENV=preprod1 PROBE_ROC=JM0570913-X npx playwright test --project=explore --grep "BO SSM settings"

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";
import { instance } from "@config/environments";

const OUT = path.join(__dirname, "..", "..", "explore-output", "ssm-settings");

async function fieldsOf(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("input,select,textarea"))
      .filter((e: any) => (e.offsetWidth || e.offsetHeight) && e.type !== "hidden")
      .map((e: any) => ({
        id: e.id, name: e.name, type: e.type,
        value: e.tagName === "SELECT" ? (e.options[e.selectedIndex]?.text ?? "") : e.type === "checkbox" || e.type === "radio" ? String(e.checked) : e.value,
        disabled: !!e.disabled,
        label: ((e.closest("label")?.textContent || "") + " | " + (e.closest("tr")?.textContent || e.parentElement?.textContent || "")).trim().replace(/\s+/g, " ").slice(0, 160),
      })));
}

test("BO SSM settings", async ({ page }) => {
  if (instance() !== "preprod1") throw new Error(`preprod1 only — resolved "${instance()}"`);
  fs.mkdirSync(OUT, { recursive: true });
  const roc = process.env.PROBE_ROC ?? "JM0570913-X";
  await new LoginPage(page).as("bo");

  // 1) company page
  await page.goto("view/account/company/");
  await page.locator("#registrationCompany").fill(roc);
  await page.locator("#to-search, input[value*=Search i]").first().click();
  const row = page.locator("table tr", { hasText: roc }).first();
  await row.waitFor({ timeout: 20_000 });
  await row.locator("a").first().click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.screenshot({ path: path.join(OUT, "1-company-view.png"), fullPage: true });
  const viewText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  for (const m of viewText.matchAll(/.{0,120}(SSM|Company Category|Purchase)[^.]{0,160}/gi)) console.log("VIEW:", m[0]);
  const edit = page.locator("a, button, input[type=button], input[type=submit]").filter({ hasText: /^\s*Edit\s*$/i }).first();
  const editVal = page.locator("input[value='Edit']").first();
  if (await edit.isVisible().catch(() => false)) await edit.click();
  else if (await editVal.isVisible().catch(() => false)) await editVal.click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const fields = await fieldsOf(page);
  const ssm = fields.filter((f) => /ssm|category|purchase|bypass/i.test(`${f.id} ${f.name} ${f.label}`));
  console.log("EDIT PAGE:", page.url().replace(/\?.*/, ""));
  for (const f of ssm) console.log("  SSM FIELD", JSON.stringify(f));
  fs.writeFileSync(path.join(OUT, "company-edit-fields.json"), JSON.stringify(fields, null, 2));
  await page.screenshot({ path: path.join(OUT, "2-company-edit.png"), fullPage: true });

  // WRITE — only when asked: PROBE_SET_SSM="ssmPermission=on" (or =off). One checkbox, nothing else.
  const set = process.env.PROBE_SET_SSM;
  if (set) {
    const [name, onoff] = set.split("=");
    if (!["ssmPermission", "estmSsmPermission", "bypassPurchaseSsmPermission"].includes(name)) throw new Error(`refusing to touch "${name}"`);
    const cb = page.locator(`input[type=checkbox][name="${name}"]`).first();
    const want = onoff === "on";
    if ((await cb.isChecked()) !== want) await cb.click();
    await page.screenshot({ path: path.join(OUT, `4-set-${name}-${onoff}.png`), fullPage: true });
    page.on("dialog", (d) => { console.log("  dialog:", d.message()); d.accept(); });
    await page.locator("input[type=submit], input[type=button], button").filter({ hasText: /Save|Update|Submit/i }).first().click()
      .catch(async () => { await page.locator("input[value*=Save i], input[value*=Update i]").first().click(); });
    const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm)$/i }).first();
    if (await yes.isVisible({ timeout: 6000 }).catch(() => false)) { console.log("  confirm:", (await page.locator(".ui-dialog:visible").innerText()).replace(/\s+/g, " ")); await yes.click(); }
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT, `5-saved-${name}-${onoff}.png`), fullPage: true });
    // re-open and compare
    await page.goto("view/account/company/");
    await page.locator("#registrationCompany").fill(roc);
    await page.locator("#to-search, input[value*=Search i]").first().click();
    await page.locator("table tr", { hasText: roc }).first().waitFor({ timeout: 20_000 });
    await page.locator("table tr", { hasText: roc }).first().locator("a").first().click();
    await page.waitForLoadState("networkidle").catch(() => undefined);
    const e2 = page.locator("a, button, input[type=button], input[type=submit]").filter({ hasText: /^\s*Edit\s*$/i }).first();
    if (await e2.isVisible().catch(() => false)) await e2.click();
    await page.waitForLoadState("networkidle").catch(() => undefined);
    const after = await fieldsOf(page);
    const key = (f: any, i?: number) => `${f.id}|${f.name}|${f.type}|${f.label.slice(0, 40)}|${f.id || f.name ? "" : i}`;
    const beforeMap = new Map(fields.map((f, i) => [key(f, i), f.value]));
    const diffs = after.map((f, i) => ({ f, k: key(f, i) })).filter(({ f, k }) => beforeMap.has(k) && beforeMap.get(k) !== f.value).map(({ f, k }) => `${f.name || f.id}: ${beforeMap.get(k)} -> ${f.value}`);
    console.log("CHANGED AFTER SAVE:", JSON.stringify(diffs));
    const now = after.find((f) => f.name === name)?.value;
    console.log(`${name} is now ${now}`);
    await page.screenshot({ path: path.join(OUT, `6-reopened-${name}-${onoff}.png`), fullPage: true });
    if (diffs.some((d) => !d.startsWith(name + ":"))) throw new Error(`Save changed more than ${name}: ${diffs.join("; ")}`);
    return;
  }

  // 2) Bypass Purchase SSM page, found from the menu
  await page.goto("view/home").catch(() => undefined);
  const links = await page.locator("a").evaluateAll((as) => as.map((a) => ({ t: (a.textContent || "").trim().replace(/\s+/g, " "), h: a.getAttribute("href") || "" })));
  const hits = links.filter((l) => /bypass|ssm/i.test(l.t + " " + l.h));
  console.log("MENU LINKS:", JSON.stringify(hits));
  const target = hits.find((l) => /bypass/i.test(l.t + l.h) && !/audit|log/i.test(l.t + l.h));
  // The menu is built by script; the portal map (knowledge/portals/backoffice) gives the area directly.
  await page.goto(target ? target.h.replace(/^\//, "").replace(/^.*?\/view\//, "view/") : "view/bypass-purchase-ssm");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  console.log("BYPASS PAGE:", page.url().replace(/\?.*/, ""));
  const bf = await fieldsOf(page);
  console.log("BYPASS FILTERS:", JSON.stringify(bf.filter((f) => f.type !== "checkbox").slice(0, 12)));
  const search = bf.find((f) => /roc|registration|company/i.test(`${f.id} ${f.name} ${f.label}`) && f.type === "text");
  if (search) {
    await page.fill(search.id ? `#${search.id}` : `[name="${search.name}"]`, process.env.PROBE_BYPASS_NAME ?? roc);
    await page.locator("#to-search, input[value*=Search i], button:has-text('Search')").first().click().catch(() => undefined);
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(2000);
  }
  const rows = await page.locator("table tr").evaluateAll((trs) => trs.map((tr) => Array.from(tr.children).map((c: any) => {
    const cb = c.querySelector("input[type=checkbox]"); return cb ? `[${cb.checked ? "x" : " "}]${(c.textContent || "").trim()}` : (c.textContent || "").trim().replace(/\s+/g, " ");
  }).join(" | ")));
  for (const r of rows.filter((r) => /Bypass|User|Category|AZFAR|JM0570913/i.test(r)).slice(0, 25)) console.log("  ROW", r);
  await page.screenshot({ path: path.join(OUT, "3-bypass-page.png"), fullPage: true });
});

// Read-only: open the company's Edit on the Bypass Purchase SSM page and list each user's STMS / eSTM boxes.
test("BO bypass users", async ({ page }) => {
  if (instance() !== "preprod1") throw new Error(`preprod1 only — resolved "${instance()}"`);
  fs.mkdirSync(OUT, { recursive: true });
  const name = process.env.PROBE_BYPASS_NAME ?? "AZFARAZO";
  await new LoginPage(page).as("bo");
  await page.goto("view/bypass-purchase-ssm/view.do");
  await page.fill('[name="name"]', name);
  await page.click("#to-search");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.locator("table tr", { hasText: name }).first().locator("a", { hasText: /Edit/ }).first().click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(1500);
  console.log("EDIT URL:", page.url().replace(/\?.*/, ""));
  const rows = await page.locator("table tr").evaluateAll((trs) => trs.map((tr) => Array.from(tr.children).map((c: any) => {
    const cbs = Array.from(c.querySelectorAll("input[type=checkbox]")) as any[];
    return (cbs.length ? cbs.map((cb) => `[${cb.checked ? "x" : " "}]${cb.name || cb.id}`).join(" ") + " " : "") + (c.textContent || "").trim().replace(/\s+/g, " ");
  }).join(" | ")));
  for (const r of rows.filter((r) => r.trim()).slice(0, 30)) console.log("  ROW", r.slice(0, 220));
  await page.screenshot({ path: path.join(OUT, "7-bypass-edit.png"), fullPage: true });
});
