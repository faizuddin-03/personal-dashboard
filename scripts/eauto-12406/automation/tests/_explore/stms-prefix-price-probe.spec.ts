// A TOOL. Runs STMS up to Step 5 (NO payment) for each QA prefix given and
// prints the Payment Summary plus the usage code / body type the page shows,
// so a prefix's eSim record is proven against the rate card.
//
//   PROBE_PREFIXES=OC,OD npm run probe -- --grep "STMS prefix price"

import { test } from "@fixtures";
import { runStmsFlow, closeStmsFlow } from "@flows/stms.flow";

for (const prefix of (process.env.PROBE_PREFIXES ?? "OC,OD").split(",")) {
  test(`STMS prefix price — ${prefix}`, async ({ page, ucdSession, mykad }) => {
    test.setTimeout(8 * 60 * 1000);
    await ucdSession("ucdE2E");
    const run = await runStmsFlow(page, { mykad, vehiclePrefix: prefix, stopAfter: "payment" });
    const body = await page.evaluate(() => document.body.innerText);
    const summary = (body.match(/Payment Summary[\s\S]*?Total Amount Payable[^\n]*\n?[^\n]*/) ?? [""])[0].replace(/\s+/g, " ");
    console.log(`\n${prefix} ${run.vehicleRegNo}: ${summary}`);
    const usage = (body.match(/Usage Code[^\n]*\n?[^\n]*/i) ?? [""])[0].replace(/\s+/g, " ");
    if (usage) console.log(`   ${usage}`);
    await closeStmsFlow(run).catch(() => {});
  });
}
