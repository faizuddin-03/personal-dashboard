// EAINT-12406 probe (29.10.2026, verify run fx1): the markup of the payment page's tiles and the FPX bank grid, and
// whether /ia/ re-opens a pending payment from its address (SecarangPaymentPage.reopen). READ ONLY: the payment page
// is opened from PROBE_PAY_URL (the address of our own pending HXA0006A payment from run fx1), the FPX tile is
// clicked to show the grid, NO bank is clicked, nothing is paid.
//
//   PROBE_PAY_URL=<url> CR_TICKET=EAINT-12406 RUN_ID=EAINT-12406-probe-paygrid-<stamp> npx playwright test --project=cr-tools payment-grid.probe

import { test } from "@fixtures";
import { SecarangPaymentPage } from "@pages/secarang/payment.page";

test("probe: payment tiles and FPX bank grid markup (read only, nothing paid)", async ({ page }) => {
  const url = process.env.PROBE_PAY_URL;
  test.skip(!url, "PROBE_PAY_URL not set");
  const pay = new SecarangPaymentPage(page);
  await pay.reopen(url!);
  console.log("REOPENED", page.url());
  const dump = () =>
    page.evaluate(() => {
      const vis = (e: Element) => !!(e as HTMLElement).offsetParent;
      return Array.from(document.querySelectorAll("input, label, img, [class*='bank'], [class*='payment']"))
        .filter(vis)
        .slice(0, 80)
        .map((e) => ({
          tag: e.tagName.toLowerCase(),
          cls: (e.getAttribute("class") || "").slice(0, 80),
          attrs: Array.from(e.attributes).filter((a) => !/^(class|style|_ngcontent|_nghost|src)/.test(a.name)).map((a) => `${a.name}=${a.value.slice(0, 50)}`),
          alt: e.getAttribute("alt"),
          text: ((e as HTMLElement).innerText || "").replace(/\s+/g, " ").trim().slice(0, 50),
          parent: `${e.parentElement?.tagName.toLowerCase()}.${(e.parentElement?.getAttribute("class") || "").split(/\s+/).slice(0, 3).join(".")}`,
        }));
    });
  console.log("=== BEFORE FPX TILE");
  for (const x of await dump()) console.log(JSON.stringify(x));
  await (await pay.tile("fpx")).click();
  await page.waitForTimeout(1500);
  console.log("=== AFTER FPX TILE");
  for (const x of await dump()) console.log(JSON.stringify(x));
  const rhb = page.getByAltText("RHB", { exact: true }).filter({ visible: true }).first();
  console.log("RHB_IMG_ANCESTORS", await rhb.evaluate((e) => { const p: string[] = []; for (let x: Element | null = e, i = 0; x && i < 5; x = x.parentElement, i++) p.push(x.outerHTML.replace(/\s+/g, " ").slice(0, 260)); return p; }).catch((e) => String(e)));
  await test.info().attach("payment-grid", { body: await page.screenshot(), contentType: "image/png" });
});
