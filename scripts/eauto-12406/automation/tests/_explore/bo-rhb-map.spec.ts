// A TOOL. READ ONLY. What BO > RHB Payment Transaction shows after Search.
import { test } from "@fixtures";
import { LoginPage } from "@auth/login";
test("BO RHB map", async ({ page }) => {
  await new LoginPage(page).as("bo");
  await page.goto("view/payment/rhb-payment-transaction");
  const inputs = await page.evaluate(() => Array.from(document.querySelectorAll("input,select")).map((e: any) => `${e.tagName} name=${e.name} id=${e.id} type=${e.type} vis=${!!(e.offsetWidth||e.offsetHeight)}`));
  console.log(inputs.join("\n"));
  await page.click("#to-search");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => {
    const own = (tr: Element) => Array.from(tr.children).filter((c) => c.tagName === "TD");
    const rows = Array.from(document.querySelectorAll("tr")).filter((tr) => own(tr).length > 6);
    return { n: rows.length, first: rows.slice(0, 3).map((r) => (r.textContent || "").replace(/\s+/g, " ").slice(0, 160)), last: rows.slice(-2).map((r) => (r.textContent || "").replace(/\s+/g, " ").slice(0, 160)),
      paging: Array.from(document.querySelectorAll("a, .pagination *")).map((a) => (a.textContent || "").trim()).filter((t) => /^(\d+|Next|Prev|>|<|»|«|Last|First)$/.test(t)).slice(0, 30),
      total: (document.body.innerText.match(/\d+ record\(s\)[^\n]*/) || [""])[0] };
  });
  console.log(JSON.stringify(info, null, 1));
});
