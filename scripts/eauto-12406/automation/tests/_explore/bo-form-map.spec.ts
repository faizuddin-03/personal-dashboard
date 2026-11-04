// A TOOL. READ ONLY. Dumps the search-form controls of a BO listing page.
//   TEST_ENV=preprod1 PROBE_PATH=view/stms/enquiry npm run probe -- --grep "BO form map"
import { test } from "@fixtures";
import { LoginPage } from "@auth/login";

test("BO form map", async ({ page }) => {
  await new LoginPage(page).as("bo");
  for (const p of (process.env.PROBE_PATH ?? "view/stms/enquiry").split(",")) {
    await page.goto(p);
    await page.waitForLoadState("networkidle").catch(() => undefined);
    console.log("\n===", page.url());
    const els = await page.evaluate(() => Array.from(document.querySelectorAll("input,select,button,a"))
      .filter((e: any) => (e.offsetWidth || e.offsetHeight) && !/menu|logout|home|my account|contact|terms|privacy/i.test(e.innerText || ""))
      .map((e: any) => `${e.tagName}#${e.id} name=${e.name ?? ""} type=${e.type ?? ""} [${(e.innerText || e.value || "").trim().replace(/\s+/g, " ").slice(0, 80)}]${e.tagName === "SELECT" ? " multiple=" + e.multiple : ""}`));
    for (const e of els) console.log("  ", e);
  }
});
