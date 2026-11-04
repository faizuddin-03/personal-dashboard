// EAINT-12406 probe (29.10.2026, fault 1 follow-up): where Plan Details, the Excess 'i' and the PIAM 'i' sit on the
// Allianz quotation card and on Confirmation, before the verify spec captures them. Runs the flow to `confirmation`
// (HXA0006A, Allianz; Confirm and Pay NOT pressed) and dumps, READ ONLY, every visible element whose text or nearby
// text says Plan Details / Excess / PIAM / More Info / Print / Policy wording / Product Disclosure, plus the 'i'
// icons with their row text. No values typed beyond the flow's own. Personal data: the run folder is git-ignored.
//
//   CR_TICKET=EAINT-12406 RUN_ID=EAINT-12406-probe-confirmation-<stamp> npx playwright test --project=cr-tools confirmation-controls.probe

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import { runSecarangFlow } from "@flows/secarang.flow";
import { secarangOwner, secarangQuoteForm } from "@data/secarang";

async function dump(page: Page, name: string) {
  const list = await page.evaluate(() => {
    const vis = (e: Element) => !!(e as HTMLElement).offsetParent || getComputedStyle(e).position === "fixed";
    const t = (e: Element | null) => ((e as HTMLElement | null)?.innerText || "").replace(/\s+/g, " ").trim();
    const re = /Plan Details|Excess|PIAM|More Info|Print|Policy wording|Product Disclosure|Privacy|Claim/i;
    const out: unknown[] = [];
    for (const e of Array.from(document.querySelectorAll("body *"))) {
      if (!vis(e)) continue;
      const own = Array.from(e.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent || "").join(" ").trim();
      const isIcon = e.tagName === "I" || /info|tooltip/i.test(e.getAttribute("class") || "") || e.hasAttribute("ngbtooltip") || e.hasAttribute("ngbpopover");
      if (!(re.test(own) || (isIcon && re.test(t(e.closest(".row, .d-flex, li, tr, div")))))) continue;
      out.push({
        tag: e.tagName.toLowerCase(),
        cls: (e.getAttribute("class") || "").slice(0, 90),
        attrs: Array.from(e.attributes).filter((a) => !/^(class|style|_ngcontent|_nghost)/.test(a.name)).map((a) => `${a.name}=${a.value.slice(0, 60)}`),
        own: own.slice(0, 80),
        row: t(e.closest(".row, .d-flex, li, tr, div")).slice(0, 160),
        parents: (() => { const p: string[] = []; for (let x = e.parentElement, i = 0; x && i < 4; x = x.parentElement, i++) p.push(`${x.tagName.toLowerCase()}.${(x.getAttribute("class") || "").split(/\s+/).slice(0, 3).join(".")}`); return p; })(),
      });
    }
    return out;
  });
  console.log(`=== ${name}: ${list.length}`);
  for (const x of list) console.log(JSON.stringify(x));
  await test.info().attach(`${name}.json`, { body: JSON.stringify(list, null, 1), contentType: "application/json" });
  await test.info().attach(`${name}-full`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}

test("probe: Plan Details / Excess / PIAM controls on the Allianz card and on Confirmation (read only)", async ({ page }) => {
  test.setTimeout(10 * 60_000);
  await runSecarangFlow(page, {
    form: secarangQuoteForm(process.env.PROBE_PLATE || "HXA0006A"),
    insurer: "Allianz",
    owner: secarangOwner(),
    stopAfter: "confirmation",
    onStep: async (st) => {
      if (st === "quotations") await dump(page, "quotations");
      if (st === "addOns") await dump(page, "add-ons");
      if (st === "confirmation") await dump(page, "confirmation-PERSONAL-DATA");
    },
  });
});
