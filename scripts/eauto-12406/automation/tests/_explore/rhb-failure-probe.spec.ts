// A TOOL wearing a spec's clothes — exploration, not coverage.
//
// Drives STMS to payment with an RHB failure code and records what the screen
// does. RHB is the payment gateway for EVERY module, so whatever this finds on
// STMS is what eSerahan, APT and BMK will show too.
//
//   npm run probe -- --grep "RHB failure"

import { test } from "@fixtures";
import { runStmsFlow, closeStmsFlow } from "@flows/stms.flow";
import { RHB_CODES } from "@data/rhb-codes";

// Start with the P1 that matters most: insufficient funds.
const UNDER_TEST = ["IF"];

for (const c of RHB_CODES.filter((x) => UNDER_TEST.includes(x.code))) {
  test(`RHB failure — ${c.code} (${c.priority}) at STMS payment`, async ({ page, ucdSession, mykad }) => {
    test.setTimeout(12 * 60 * 1000);
    await ucdSession("ucdE2E");

    const run = await runStmsFlow(page, { mykad, vehiclePrefix: c.prefix, stopAfter: "payment" });
    try {
      console.log(`  vehicle ${run.vehicleRegNo} — JPJ leg seeded to 00, RHB seeded to ${c.code}`);
      console.log("  at payment:", page.url());

      // Submit, and see what the gateway does rather than assuming it navigates.
      const before = page.url();
      await page.locator("#to-payment").click();
      await run.stms.confirmDialog().catch(() => undefined);
      await page.waitForTimeout(20000);

      console.log("  url after submit:", page.url());
      console.log("  moved?", page.url() !== before);

      const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      // The failure message, if the page printed one.
      for (const needle of ["TIDAK MENCUKUPI", "Resubmit", "RHB", "gagal", "Failed", "failed", "hubungi"]) {
        const i = body.indexOf(needle);
        if (i > -1) {
          console.log(`  ["${needle}"]`, JSON.stringify(body.slice(Math.max(0, i - 90), i + 130)));
          break;
        }
      }
      console.log("  tail:", body.slice(-260));
      await page.screenshot({ path: `explore-output/rhb-${c.code}.png`, fullPage: true });
    } finally {
      await closeStmsFlow(run);
    }
  });
}
