// EAINT-12406 probe (29.10.2026, verify run fx2): on /ia/ the FPX bank click was registered (RHB radio checked) but
// no Fiuu window opened and the page said "Kindly select payment option" with a spinner on the FPX tile. This takes
// ONE transaction of ours (HXA0006A, Allianz) to the payment page and tries the bank click in a few ways, one after
// the other, recording for each: a new window?, requests sent, the message, the radios. A Fiuu window that opens is
// CLOSED unpaid (nothing typed in it). The transaction stays unpaid (a pending CIBO record of ours).
//
//   CR_TICKET=EAINT-12406 RUN_ID=EAINT-12406-probe-fpxclick-<stamp> npx playwright test --project=cr-tools fpx-bank-click.probe

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import { runSecarangFlow } from "@flows/secarang.flow";
import { secarangOwner, secarangQuoteForm } from "@data/secarang";

async function state(page: Page) {
  return page.evaluate(() => ({
    msg: Array.from(document.querySelectorAll(".alert, [class*='error'], [class*='danger']"))
      .filter((e) => (e as HTMLElement).offsetParent)
      .map((e) => ((e as HTMLElement).innerText || "").trim())
      .filter(Boolean),
    radios: Array.from(document.querySelectorAll("input[type=radio]")).map((r) => `${r.getAttribute("formcontrolname")}:${(r as HTMLInputElement).checked ? 1 : 0}`).join(" "),
    spinner: document.querySelectorAll(".spinner-border, .spinner-grow, [class*='spin']").length,
    imgsLoaded: Array.from(document.querySelectorAll("label img")).filter((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0).length,
    imgs: document.querySelectorAll("label img").length,
  }));
}

test("probe: FPX bank click variants (no payment made)", async ({ page, context }) => {
  test.setTimeout(15 * 60_000);
  const reqs: string[] = [];
  page.on("request", (r) => { if (!/\.(png|jpe?g|svg|woff2?|css|js)(\?|$)/i.test(r.url())) reqs.push(`${r.method()} ${r.url().slice(0, 140)}`); });
  page.on("console", (m) => console.log("CONSOLE", m.type(), m.text().slice(0, 200)));
  page.on("dialog", (d) => { console.log("DIALOG", d.type(), d.message()); void d.dismiss(); });
  await runSecarangFlow(page, {
    form: secarangQuoteForm(process.env.PROBE_PLATE || "HXA0006A"),
    insurer: "Allianz",
    owner: secarangOwner(),
    stopAfter: "paymentPage",
  });
  console.log("PAYMENT PAGE", page.url());
  const tryOnce = async (name: string, act: () => Promise<void>) => {
    reqs.length = 0;
    const win = context.waitForEvent("page", { timeout: 20_000 }).catch(() => null);
    await act();
    const w = await win;
    await page.waitForTimeout(1_500);
    console.log(`== ${name}: window ${w ? w.url() : "none"}; requests ${JSON.stringify(reqs)}; ${JSON.stringify(await state(page))}`);
    await test.info().attach(name, { body: await page.screenshot(), contentType: "image/png" });
    if (w) {
      await w.waitForLoadState("domcontentloaded").catch(() => undefined);
      console.log(`   window now ${w.url()}`);
      await test.info().attach(`${name}-window`, { body: await w.screenshot(), contentType: "image/png" });
      await w.close();
      return true;
    }
    return false;
  };
  const fpx = page.locator("label").filter({ visible: true }).filter({ hasText: /FPX/i }).first();
  const rhbLabel = page.locator("label").filter({ has: page.locator("input[formcontrolname='bank']") }).filter({ has: page.getByAltText("RHB", { exact: true }) }).filter({ visible: true }).first();
  console.log("START", JSON.stringify(await state(page)));
  // A: FPX tile, wait until the grid's logos are loaded and the network is quiet, then the RHB tile
  if (await tryOnce("A-tile-wait-then-bank", async () => {
    await fpx.click();
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForFunction(() => Array.from(document.querySelectorAll("label img")).every((i) => (i as HTMLImageElement).complete), null, { timeout: 30_000 }).catch(() => undefined);
    await page.waitForTimeout(2_000);
    console.log("   before bank", JSON.stringify(await state(page)));
    await rhbLabel.click();
  })) return;
  // B: the RHB logo image itself
  if (await tryOnce("B-bank-img", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5_000);
    console.log("   after reload", page.url(), JSON.stringify(await state(page)));
    await fpx.click();
    await page.waitForTimeout(3_000);
    await page.getByAltText("RHB", { exact: true }).filter({ visible: true }).first().click();
  })) return;
  // C: check the bank radio through the page (as a user's click on the hidden input would)
  await tryOnce("C-bank-radio-check", async () => {
    await page.locator("input[formcontrolname='bank']").nth(4).check({ force: true });
  });
});
