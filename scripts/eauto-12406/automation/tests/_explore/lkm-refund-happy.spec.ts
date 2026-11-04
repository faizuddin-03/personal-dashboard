// A TOOL. LKM Refund happy flow, end to end, with a screenshot at every stage:
// Step 5 add-on → pop-up filled → document check → preview → signed → confirmed (fee) → paid →
// Step 6 → UCD LKM Refund Status. Uses lkm-refund.flow + lkm-refund.page; nothing journey-specific here.
//
// The document check is a REAL AI read (Dev, 07.10.2026), so it needs a real person's matching
// documents. They are passed in, never stored in the repo, and the screenshots go to the
// git-ignored .artifacts/lkm-happy/<vehicle>/ because they show them:
//
//   LKM_BANK="BANK ISLAM MALAYSIA BERHAD" LKM_ACCOUNT_NO=<on the statement> \
//   LKM_COPY_OF_IC=<path> LKM_BANK_STATEMENT=<path> \
//   INSTANCE=preprod1 TEST_ENV=preprod1 npx playwright test --project=explore lkm-refund-happy
//
// STOP=confirmed stops before paying. SELLER_NAME overrides the card's name (what the pop-up shows
// as Seller's Name and the check compares with the IC).

import { test } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { runLkmRefundFlow, closeLkmRefundFlow } from "@flows/lkm-refund.flow";
import { LkmRefundStatusPage } from "@pages/ucd/lkm-refund.page";
import { CARDS } from "@data/cards";

test("LKM Refund happy flow", async ({ page, ucdSession, mykad }) => {
  test.setTimeout(30 * 60 * 1000);
  for (const k of ["LKM_BANK", "LKM_ACCOUNT_NO", "LKM_COPY_OF_IC", "LKM_BANK_STATEMENT"]) if (!process.env[k]) throw new Error(`set ${k}`);
  await page.setViewportSize({ width: 1920, height: 1080 });
  const checks: string[] = [];
  page.on("response", async (r) => {
    if (r.url().includes("validate-document")) checks.push(`${r.status()} ${(await r.text().catch(() => "")).slice(0, 1500)}`);
  });

  await ucdSession("ucdE2E");
  const seller = process.env.SELLER_NAME ? { ...CARDS.malaysianIndividual, GMPCName: process.env.SELLER_NAME } : undefined;
  const r = await runLkmRefundFlow(page, { mykad, seller, stopAfter: "preview" });
  const out = path.resolve(".artifacts", "lkm-happy", r.vehicleRegNo);
  fs.mkdirSync(out, { recursive: true });
  let n = 0;
  const shot = async (what: string, full = false) => page.screenshot({ path: path.join(out, `${String(++n).padStart(2, "0")}-${what}.png`), fullPage: full });
  const log: string[] = [`vehicle ${r.vehicleRegNo}`, `tx ${r.transactionId}`, `document check attempts ${r.aiAttempts}`, ...r.aiRefusals.map((m) => `  refused: ${m}`)];

  try {
    await shot("preview-documents");
    log.push(`preview pages ${await r.lkm.previewPageCount()}`);

    const ink = await r.lkm.sign();
    await shot("signed");
    log.push(`signature ink ${ink} px`);

    await r.lkm.confirm();
    const fee = await r.lkm.processingFee();
    await r.lkm.summaryTable.scrollIntoViewIfNeeded().catch(() => undefined);
    await shot("confirmed-payment-summary", true);
    log.push(`committed ${await r.lkm.isCommitted()}, LKM Refund fee RM${fee}`);

    if (process.env.STOP !== "confirmed") {
      const pay = await r.stms.submitPaymentAndReadResult();
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(3000);
      await shot("after-payment-step6", true);
      log.push(`payment ${pay.outcome} ${"url" in pay ? pay.url : pay.message}`);

      const status = new LkmRefundStatusPage(page);
      const row = await status.find(r.vehicleRegNo);
      await shot("lkm-refund-status", true);
      log.push(`LKM Refund Status row: ${JSON.stringify(row)}`);
    }
  } finally {
    log.push("validate-document replies:", ...checks.map((c) => `  ${c}`));
    fs.writeFileSync(path.join(out, "run.txt"), log.join("\n") + "\n");
    console.log(log.join("\n"));
    await closeLkmRefundFlow(r);
  }
});
