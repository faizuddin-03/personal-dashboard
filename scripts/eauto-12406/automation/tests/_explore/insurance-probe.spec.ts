// A TOOL wearing a spec's clothes — exploration, not coverage.
//
// Maps the Insurance module: its own entry point from the dealer home, and the
// screens behind it. Insurance on staging is wired to eSim, not to a real
// insurer API, so every premium and quotation here is simulated.

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const OUT = path.join(__dirname, "..", "..", "explore-output", "insurance");

const SNAP = `(function(){
  var out=[]; var els=document.querySelectorAll('input,select,textarea,button,div,a');
  for(var i=0;i<els.length;i++){
    var e=els[i]; var c=(e.className||'').toString();
    var t=(e.innerText||e.value||'').trim();
    var isCtl=e.tagName==='INPUT'||e.tagName==='SELECT'||e.tagName==='TEXTAREA';
    if(isCtl||/btn/.test(c)||e.tagName==='BUTTON'){
      if(t.length<=70) out.push({tag:e.tagName,type:e.type||null,id:e.id||null,name:e.name||null,
        cls:c.slice(0,34),text:t||null,
        vis:!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length),
        opts:e.tagName==='SELECT'?e.options.length:null});
    }
  }
  return {url:location.href,title:document.title,controls:out,body:document.body.innerText.slice(0,2200)};
})()`;

async function dump(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  const s = (await page.evaluate(SNAP)) as any;
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(s, null, 2), "utf8");
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`\n=== ${name} — ${s.url}`);
  for (const c of (s.controls as any[]).filter((x) => x.vis && (x.id || x.text))) {
    console.log("  ", String(c.tag).padEnd(7), String(c.type || "").padEnd(8),
      "#" + String(c.id || "-").padEnd(22), c.opts != null ? `opts=${c.opts}` : String(c.text || "").slice(0, 34));
  }
  return s;
}

import { InsurancePage } from "@pages/ucd/insurance.page";
import { CARDS } from "@data/cards";
import { nextVehicleNumber } from "@data/generator";

test("insurance — map the module from its own entry point", async ({ page, ucdSession }) => {
  test.setTimeout(10 * 60 * 1000);
  await ucdSession("ucd");
  const ins = new InsurancePage(page);

  await ins.openFreeQuote();
  await dump(page, "02-free-quote");

  // VV is the prefix eSim knows for this dealer's eSTM enquiries; insurance is
  // eSim-driven too, so a known prefix is the likeliest to return a quote.
  const vehicleRegNo = nextVehicleNumber("VV");
  console.log("  asking for a quote on:", vehicleRegNo);
  await ins.requestQuote({ vehicleRegNo, buyerRef: CARDS.malaysianIndividual.NRIC });
  await page.waitForTimeout(8000);

  const r = await dump(page, "03-quote-result");
  console.log("  stage:", await ins.quoteStage());
  console.log("  complaints:", JSON.stringify(await ins.validationMessages()));
  console.log("  body:", String(r.body).split(String.fromCharCode(10)).map((x: string) => x.trim()).filter(Boolean).slice(0, 26).join(" | "));
});
