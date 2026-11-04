// A TOOL wearing a spec's clothes — exploration of a defect candidate.
//
// `DP` is not a plain failure. Ask eAuto, 2026-09-18, citing
// FundTransferHandlerBean.java:141-175,203-274,427-493:
//
//   DP means "duplicate". eAuto re-queries RHB, and if that ENQUIRY answers
//   GD the money did move, so the result is rewritten to OK and marked Paid.
//
// And the claim worth testing:
//
//   "In the split-payment path used by STMS, if the code is DP and the
//    follow-up enquiry does NOT return GD, the payment is left neither Paid
//    nor Failed — its previous status stays."
//
// That would strand a transaction rather than rejecting it cleanly. Two
// prefixes, one per branch:
//
//   ZF  transfer DP + enquiry NF  -> must NOT confirm
//   ZV  transfer DP + enquiry GD  -> must confirm, expect Paid

import { test } from "@fixtures";
import { runStmsFlow, closeStmsFlow } from "@flows/stms.flow";

const BRANCHES = [
  { prefix: "ZF", enquiry: "NF", expectation: "the re-query does NOT confirm" },
  { prefix: "ZV", enquiry: "GD", expectation: "the re-query confirms, so it should complete" },
];

for (const b of BRANCHES) {
  test(`RHB DP — enquiry ${b.enquiry}: ${b.expectation}`, async ({ page, ucdSession, mykad }) => {
    test.setTimeout(12 * 60 * 1000);
    await ucdSession("ucdE2E");

    const run = await runStmsFlow(page, { mykad, vehiclePrefix: b.prefix, stopAfter: "payment" });
    try {
      console.log(`  ${run.vehicleRegNo}: transfer=DP, enquiry=${b.enquiry}`);
      const result = await run.stms.submitPaymentAndReadResult();
      console.log("  outcome:", result.outcome);
      console.log("  detail :", result.outcome === "rejected" ? JSON.stringify(result.message) : result.url);

      // Whatever happened, go and read what the LISTING says the payment is.
      // "Neither Paid nor Failed" is only visible there.
      await page.goto("view/ucd/stms/enquiry/main.do", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3000);
      const row = await page.evaluate(`(function(){
        var trs=document.querySelectorAll('tbody tr');
        for(var i=0;i<trs.length;i++){
          var t=trs[i].innerText.replace(/\s+/g,' ');
          if(t.indexOf('${run.vehicleRegNo}')!==-1) return t.slice(0,220);
        }
        return '(vehicle not in the first page of the listing)';
      })()`);
      console.log("  listing:", row);
    } finally {
      await closeStmsFlow(run);
    }
  });
}
