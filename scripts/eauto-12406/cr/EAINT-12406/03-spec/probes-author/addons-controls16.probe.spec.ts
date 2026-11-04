// EAINT-12406 probe 16 (29.10.2026 evening, cr-author, TS v6 E2E_TS9 / E2E_TS12). READ ONLY past Buy: runs the flow to
// `addOns` (HXA0001A, the verify / CP_TS8 quote plate; Allianz; no add-on ADDed, no option changed, Continue NOT
// pressed: no Confirmation, so no CIBO record from Step 4) and dumps:
//   - the Allianz card on All Quotations: every select / button / "coverage" element with its options (E2E_TS9 E2);
//   - the Add-ons page: the price bar, and per add-on card its name, price, buttons (text, disabled), selects with
//     their options and current value, info 'i' buttons (E2E_TS9 E3, E2E_TS12 steps 1-3);
//   - three pop-ups opened and closed with their own close button, never submitted: the windscreen Sum Insured
//     editor, the MPA plan chooser, and one add-on 'i' (More Info).
//
//   cd automation; CR_TICKET=EAINT-12406 RUN_ID=EAINT-12406-probe-addons16-<stamp> INSTANCE=ia npx playwright test --project=cr-tools addons-controls16

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import { runSecarangFlow } from "@flows/secarang.flow";
import { secarangQuoteForm } from "@data/secarang";

const log = (k: string, v: unknown) => console.log(`${k} ${JSON.stringify(v)}`);

async function cardControls(page: Page, sel: string) {
  return page.evaluate((s) => {
    const vis = (e: Element) => !!(e as HTMLElement).offsetParent;
    const t = (e: Element | null) => ((e as HTMLElement | null)?.innerText || "").replace(/\s+/g, " ").trim();
    return Array.from(document.querySelectorAll(s)).filter(vis).map((c) => ({
      text: t(c).slice(0, 260),
      selects: Array.from(c.querySelectorAll("select")).filter(vis).map((x) => ({ cls: x.className, value: (x as HTMLSelectElement).value, options: Array.from((x as HTMLSelectElement).options).map((o) => `${o.value}=${o.text.trim()}`) })),
      buttons: Array.from(c.querySelectorAll("button, a")).filter(vis).map((b) => ({ tag: b.tagName, text: t(b).slice(0, 60), cls: b.className.slice(0, 110), disabled: (b as HTMLButtonElement).disabled === true, icon: b.querySelector("i")?.className ?? "" })),
      inputs: Array.from(c.querySelectorAll("input")).map((i) => ({ type: (i as HTMLInputElement).type, cls: i.className.slice(0, 80), vis: vis(i), fcn: i.getAttribute("formcontrolname") })),
    }));
  }, sel);
}

async function modal(page: Page, name: string) {
  const m = page.locator("ngb-modal-window").filter({ visible: true }).last();
  await m.waitFor({ timeout: 15_000 });
  const d = await m.evaluate((w) => {
    const t = (e: Element | null) => ((e as HTMLElement | null)?.innerText || "").replace(/\s+/g, " ").trim();
    return {
      cls: w.className,
      text: t(w).slice(0, 900),
      inputs: Array.from(w.querySelectorAll("input")).map((i) => ({ type: (i as HTMLInputElement).type, fcn: i.getAttribute("formcontrolname"), value: (i as HTMLInputElement).value, cls: i.className.slice(0, 80), visible: !!(i as HTMLElement).offsetParent })),
      labels: Array.from(w.querySelectorAll("label")).map((l) => ({ text: t(l).slice(0, 60), cls: l.className })),
      tiles: Array.from(w.querySelectorAll(".plan-label-card")).map((x) => t(x)),
      buttons: Array.from(w.querySelectorAll("button")).map((b) => ({ text: t(b), type: (b as HTMLButtonElement).type, cls: b.className.slice(0, 90), disabled: (b as HTMLButtonElement).disabled })),
      smalls: Array.from(w.querySelectorAll("small")).map((s) => t(s)),
    };
  });
  log(`MODAL ${name}`, d);
  await test.info().attach(`modal-${name}`, { body: await page.screenshot(), contentType: "image/png" });
  const close = m.locator("button.close").first();
  await close.click();
  await m.waitFor({ state: "hidden", timeout: 10_000 });
}

test("probe 16: Allianz card sum insured and the Add-ons controls (read only, nothing added or submitted)", async ({ page }) => {
  test.setTimeout(10 * 60_000);
  await runSecarangFlow(page, {
    form: secarangQuoteForm(process.env.PROBE_PLATE || "HXA0001A"),
    insurer: "Allianz",
    stopAfter: "addOns",
    onStep: async (st) => {
      if (st === "quotations") {
        const all = await cardControls(page, ".insurance-card");
        log("QUOTATION_CARDS", all.map((c) => ({ text: c.text.slice(0, 90), selects: c.selects, buttons: c.buttons })));
        // where the "Your coverage" amount sits in the Allianz card
        log("ALLIANZ_COVERAGE", await page.evaluate(() => {
          const card = Array.from(document.querySelectorAll(".insurance-card")).find((c) => !!(c as HTMLElement).offsetParent && c.querySelector("img[alt*='Allianz']"));
          if (!card) return null;
          const hits = Array.from(card.querySelectorAll("*")).filter((e) => /coverage/i.test(e.textContent || "") && e.children.length < 4);
          return hits.slice(0, 8).map((e) => ({ tag: e.tagName, cls: e.className, text: (e as HTMLElement).innerText?.replace(/\s+/g, " ").trim().slice(0, 80), parent: e.parentElement?.className }));
        }));
        log("SUM_INSURED_SELECT_COUNT", await page.locator(".insurance-card").filter({ visible: true }).locator(".sum-insured select").count());
        log("SELECT_PARENTS", await page.locator(".insurance-card select").evaluateAll((xs) => xs.filter((x) => !!(x as HTMLElement).offsetParent).map((x) => [x.parentElement?.className, x.parentElement?.parentElement?.className])));
        await test.info().attach("quotations", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
      }
      if (st === "addOns") {
        log("PRICE_TOPBAR", await page.locator("app-price-topbar").evaluateAll((xs) => xs.map((x) => ({ text: (x as HTMLElement).innerText.replace(/\s+/g, " ").trim().slice(0, 300), links: Array.from(x.querySelectorAll("a")).filter((a) => !!(a as HTMLElement).offsetParent).map((a) => ({ text: (a as HTMLElement).innerText.trim(), cls: a.className })) }))));
        const cards = await cardControls(page, ".addon-card");
        log("ADDON_CARD_COUNT", cards.length);
        cards.forEach((c, i) => log(`ADDON_CARD ${i}`, c));
        await test.info().attach("add-ons", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
        const card = (re: RegExp) => page.locator(".addon-card").filter({ visible: true }).filter({ hasText: re }).first();
        // windscreen: the "Sum Insured RM…" link
        const ws = card(/Windscreen/i).locator("a.btn-link").filter({ hasText: /RM/ });
        log("WINDSCREEN_LINK_COUNT", await ws.count());
        if (await ws.count()) { await ws.first().click(); await modal(page, "windscreen-sum-insured"); }
        // MPA: the plan link
        const mpaCard = card(/Motorist Personal Accident/i);
        const mpa = mpaCard.locator("a.btn-link").filter({ hasText: /Plan/ });
        log("MPA_LINKS", await mpa.allInnerTexts());
        if (await mpa.count()) { await mpa.first().click(); await modal(page, "mpa-plans"); }
        // one 'i' (More Info) of Road Rangers
        const info = card(/Road Rangers/i).locator("a.btn-link:has(i.bi-info-circle)");
        log("RR_INFO_COUNT", await info.count());
        if (await info.count()) { await info.first().click(); await modal(page, "road-rangers-info"); }
        const back = page.getByRole("button", { name: /Back to insurance selection/i }).filter({ visible: true });
        log("BACK_BUTTON_COUNT", await back.count());
        log("ADDON_CARDS_AFTER", (await cardControls(page, ".addon-card")).map((c) => c.text.slice(0, 120)));
        if (await back.count()) {
          await back.first().click();
          await page.waitForTimeout(3000);
          const pop = page.locator("ngb-modal-window").filter({ visible: true });
          log("AFTER_BACK", { url: page.url().replace(/[0-9a-f-]{36}/, "<tx>"), popup: (await pop.count()) ? (await pop.first().innerText()).replace(/\s+/g, " ").slice(0, 300) : "" });
          await test.info().attach("after-back", { body: await page.screenshot(), contentType: "image/png" });
        }
      }
    },
  });
});
