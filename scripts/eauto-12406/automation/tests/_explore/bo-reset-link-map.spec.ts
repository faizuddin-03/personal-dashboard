// A TOOL. READ ONLY. Dumps the Action cell HTML of a Failed STMS and a Failed
// APT in BO, so the Reset link selector is read off the page.
import { test } from "@fixtures";
import { LoginPage } from "@auth/login";
test("BO reset link map", async ({ page }) => {
  await new LoginPage(page).as("bo");
  for (const [p, v] of [["view/stms/enquiry", "OQ000002"], ["view/apt/enquiry", "OQ000006"]]) {
    await page.goto(p);
    await page.fill("#vehicleNo", v);
    await page.click("#to-search");
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(2500);
    const html = await page.evaluate((vv) => {
      const own = (tr: Element) => Array.from(tr.children).filter((c) => c.tagName === "TD");
      const tr = Array.from(document.querySelectorAll("tr")).find((t) => own(t).length > 6 && (t.textContent || "").includes(vv));
      return tr ? (own(tr).slice(-1)[0] as HTMLElement).outerHTML : "(no row)";
    }, v);
    console.log(`\n=== ${p} ${v}\n${html}`);
  }
  await page.goto("view/report/reset-payment-report");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  console.log("\n=== reset report\n" + (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 900));
  console.log(await page.evaluate(() => Array.from(document.querySelectorAll("script:not([src])")).map((s) => s.textContent || "").filter((t) => /reset|export|search/i.test(t)).join("\n---\n").slice(0, 2500)));
});
