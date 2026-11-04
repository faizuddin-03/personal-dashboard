// A TOOL wearing a spec's clothes — exploration, not coverage.
//
// Maps APT (Automatik Permanent Transfer): the screens a dealer sees, and what
// state a transaction has to be in before one exists at all.

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const OUT = path.join(__dirname, "..", "..", "explore-output", "apt");

const SNAP = `(function(){
  var out=[]; var els=document.querySelectorAll('input,select,textarea,button,div,a');
  for(var i=0;i<els.length;i++){
    var e=els[i]; var c=(e.className||'').toString();
    var t=(e.innerText||e.value||'').trim();
    var isCtl=e.tagName==='INPUT'||e.tagName==='SELECT'||e.tagName==='TEXTAREA';
    if(isCtl||/btn/.test(c)||e.tagName==='BUTTON'){
      if(t.length<=70) out.push({tag:e.tagName,type:e.type||null,id:e.id||null,name:e.name||null,
        cls:c.slice(0,30),text:t||null,
        vis:!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length),
        opts:e.tagName==='SELECT'?e.options.length:null});
    }
  }
  return {url:location.href,title:document.title,controls:out,
    headers:Array.prototype.map.call(document.querySelectorAll('th'),function(t){return t.innerText.trim();}),
    rowCount:document.querySelectorAll('tbody tr').length,
    body:document.body.innerText.slice(0,2000)};
})()`;

async function dump(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  const s = (await page.evaluate(SNAP)) as any;
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(s, null, 2), "utf8");
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`\n=== ${name} — ${s.url}`);
  console.log("   columns:", (s.headers as string[]).join(" | ") || "(no table)");
  console.log("   rows:", s.rowCount);
  for (const c of (s.controls as any[]).filter((x) => x.vis && x.id && !/-link$/.test(x.id))) {
    console.log("  ", String(c.tag).padEnd(7), String(c.type || "").padEnd(8),
      "#" + String(c.id).padEnd(22), c.opts != null ? `opts=${c.opts}` : String(c.text || "").slice(0, 32));
  }
  return s;
}

test("APT — map the module", async ({ page, ucdSession }) => {
  test.setTimeout(8 * 60 * 1000);
  await ucdSession("ucd");

  await page.goto("view/ucd/apt/enquiry/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const s = await dump(page, "01-enquiry");
  console.log("   body:", String(s.body).split(String.fromCharCode(10)).map((x: string) => x.trim()).filter(Boolean).slice(0, 22).join(" | "));
});
