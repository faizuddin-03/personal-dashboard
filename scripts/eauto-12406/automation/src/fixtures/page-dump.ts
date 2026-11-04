// Read-only probe helper: dump what a screen offers (controls, dialogs, step headings, page text) as <name>.json +
// <name>.png, and print the controls to the log. For probes that learn a screen before a page object is written;
// nothing it writes is evidence.
//
// Moved here 27.10.2026 from two identical copies in cr/EAINT-12253/03-spec/probes-2010/_dump.ts and probes-2110/_dump.ts.
// A probe folder keeps a two-line _dump.ts: `export const { dump, outDir } = pageDumper(__dirname); export { bodyLines }`,
// so its output stays in that folder's out/<probe>/ (gitignored: cr/**/probes*/out/).
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const SNAP = `(function(){
  function vis(e){return !!(e.offsetWidth||e.offsetHeight||e.getClientRects().length);}
  var out=[]; var els=document.querySelectorAll('input,select,textarea,button,a,[role=button],.btn,.next-btn,label');
  for(var i=0;i<els.length;i++){
    var e=els[i]; var c=(e.className||'').toString();
    var t=(e.innerText||e.value||'').replace(/\\s+/g,' ').trim();
    if(e.tagName==='A' && !e.id && !/btn|tile|menu|next|step|tab/.test(c) && !(e.getAttribute('href')||'').match(/\\.do|#/)) continue;
    if(!vis(e) && e.tagName!=='INPUT' && e.tagName!=='SELECT') continue;
    out.push({tag:e.tagName,type:e.type||null,id:e.id||null,name:e.getAttribute('name'),cls:c.slice(0,60),
      text:t.slice(0,90)||null,vis:vis(e),dis:!!e.disabled,href:e.getAttribute('href'),
      onclick:(e.getAttribute('onclick')||'').slice(0,90)||null,
      opts:e.tagName==='SELECT'?Array.from(e.options).slice(0,25).map(function(o){return o.value+'='+o.text.trim();}):null,
      checked:(e.type==='checkbox'||e.type==='radio')?e.checked:null});
  }
  var dialogs=[]; var ds=document.querySelectorAll('.ui-dialog,.modal,.swal2-popup,[role=dialog]');
  for(var j=0;j<ds.length;j++){ if(vis(ds[j])) dialogs.push({id:ds[j].id||null,cls:(ds[j].className||'').toString().slice(0,60),text:(ds[j].innerText||'').replace(/\\s+/g,' ').trim().slice(0,600)}); }
  var heads=Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,.step,.stepper li,.wizard-step,.progressbar li,[class*=step]')).filter(vis).map(function(h){return (h.tagName+'.'+(h.className||'').toString().slice(0,30)+': '+(h.innerText||'').replace(/\\s+/g,' ').trim()).slice(0,140);}).slice(0,40);
  return {url:location.href,title:document.title,heads:heads,dialogs:dialogs,controls:out,body:document.body.innerText.slice(0,5000)};
})()`;

/** A dumper writing under `<baseDir>/out/<probe>/` (pass the probe folder's own __dirname). */
export function pageDumper(baseDir: string) {
  const outDir = (probe: string): string => {
    const d = path.join(baseDir, "out", probe);
    fs.mkdirSync(d, { recursive: true });
    return d;
  };
  const dump = async (page: Page, probe: string, name: string): Promise<any> => {
    const dir = outDir(probe);
    await page.waitForLoadState("networkidle").catch(() => undefined);
    let s: any;
    for (let i = 0; ; i++) {
      try { s = await page.evaluate(SNAP); break; } catch (e) {
        if (i >= 3) throw e;
        await page.waitForLoadState("load").catch(() => undefined);
        await page.waitForTimeout(1500);
      }
    }
    fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(s, null, 2), "utf8");
    await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true }).catch(() => undefined);
    const lines = [`\n=== ${probe}/${name} — ${s.url}`, `  heads: ${s.heads.join(" | ").slice(0, 600)}`];
    for (const d of s.dialogs) lines.push(`  DIALOG #${d.id} .${d.cls}: ${d.text.slice(0, 300)}`);
    for (const c of (s.controls as any[]).filter((x) => x.vis && (x.id || x.text || x.name))) {
      lines.push(
        `   ${String(c.tag).padEnd(6)} ${String(c.type || "").padEnd(8)} #${String(c.id || "-").padEnd(26)} n=${String(c.name || "-").padEnd(20)} ${c.dis ? "[dis] " : ""}${c.checked != null ? `[${c.checked ? "x" : " "}] ` : ""}${c.opts ? "opts=" + c.opts.join(";").slice(0, 160) : String(c.text || "").slice(0, 70)}${c.onclick ? "  onclick=" + c.onclick : ""}`,
      );
    }
    console.log(lines.join("\n"));
    return s;
  };
  return { outDir, dump };
}

/** First N non-empty lines of the page text, for the log. */
export async function bodyLines(page: Page, n = 40): Promise<string> {
  const t = await page.locator("body").innerText();
  return t.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, n).join(" | ");
}
