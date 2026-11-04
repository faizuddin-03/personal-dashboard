import { test } from "@fixtures";

test("APT — trigger the JPJ notices for a completed STMS", async ({ page, ucdSession }) => {
  test.setTimeout(10 * 60 * 1000);

  // The id is not rendered into the HTML, but the portal's own AJAX calls send
  // it. Watch the wire rather than the DOM.
  const seen = new Set<string>();
  page.on("request", (r) => {
    const hay = r.url() + " " + (r.postData() ?? "");
    for (const m of hay.matchAll(/company(?:Account)?Id=([0-9]+)/gi)) seen.add(m[1]);
    for (const m of hay.matchAll(/"company(?:Account)?Id"\s*:\s*"?([0-9]+)/gi)) seen.add(m[1]);
  });

  await ucdSession("ucd");
  for (const u of ["view/ucd/home.do", "view/ucd/estm/view.do", "view/ucd/bmk/view.do", "view/ucd/settings/view.do"]) {
    await page.goto(u, { waitUntil: "networkidle" }).catch(() => undefined);
    await page.waitForTimeout(1500);
    if (seen.size) break;
  }
  console.log("  company ids seen on the wire:", JSON.stringify([...seen]));
  const cid = [...seen][0];
  if (!cid) { console.log("  still not found — the id never crosses the wire on these pages"); return; }

  for (const vehicle of ["ZU000001", "ZV000001"]) {
    const r = await page.evaluate(`(async function(){
      const res = await fetch('/eauto/ajax/estm/transaction/triggerAPT.do', {
        method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:'vehicleRegNo=${vehicle}&ucdCompanyId=${cid}'
      });
      return { status: res.status, body: (await res.text()).replace(/\s+/g,' ').slice(0,300) };
    })()`);
    console.log(`  triggerAPT ${vehicle} ->`, JSON.stringify(r));
  }

  await page.goto("view/ucd/apt/enquiry/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.locator("#to-search").click();
  await page.waitForTimeout(4000);
  const rows = await page.evaluate(`(function(){
    var out=[]; var trs=document.querySelectorAll('tbody tr');
    for(var i=0;i<trs.length && out.length<8;i++){var t=trs[i].innerText.replace(/\s+/g,' ').trim(); if(t) out.push(t.slice(0,170));}
    return out;
  })()`);
  console.log("  APT listing:");
  (rows as string[]).forEach((r) => console.log("    ", r));
});
