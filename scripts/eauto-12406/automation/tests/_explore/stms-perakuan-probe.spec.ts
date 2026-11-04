// A TOOL. Opens STMS Step 1 (Malaysian seller) on the configured instance and
// dumps every input in the Perakuan, so a changed consent block (e.g. the LKM
// refund email on preprod1) is read off the page, not guessed. Creates nothing.
//
//   TEST_ENV=preprod1 npm run probe -- --grep "STMS perakuan"

import { test } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { StmsWizardPage, SellerCategory } from "@pages/ucd/stms-wizard.page";

const OUT = path.join(__dirname, "..", "..", "explore-output", "stms-perakuan");

test("STMS perakuan — dump Step 1 inputs", async ({ page, ucdSession }) => {
  fs.mkdirSync(OUT, { recursive: true });
  await ucdSession("ucdE2E");
  const stms = new StmsWizardPage(page);
  await stms.startNewTransaction();
  await stms.chooseSellerCategory(SellerCategory.MALAYSIAN);
  await page.fill("#vehicleRegNo", "ON999999");
  await page.waitForTimeout(1500);
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("input, select, textarea")).map((e) => {
      const el = e as HTMLInputElement;
      const row = el.closest("li, tr, p, div");
      return {
        tag: el.tagName, type: el.type, id: el.id, name: el.name, value: el.value,
        visible: el.offsetParent !== null, disabled: el.disabled, required: el.required,
        cls: el.className, near: (row?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 140),
      };
    }));
  fs.writeFileSync(path.join(OUT, "inputs.json"), JSON.stringify(inputs, null, 2));
  for (const i of inputs.filter((x) => x.visible)) console.log(JSON.stringify(i));
  const scripts = await page.evaluate(() =>
    Array.from(document.querySelectorAll("script:not([src])")).map((s) => s.textContent || "")
      .filter((t) => /consent|lkm|refund/i.test(t)).map((t) => t.slice(0, 4000)));
  fs.writeFileSync(path.join(OUT, "scripts.txt"), scripts.join("\n\n-----\n\n"));
  await page.screenshot({ path: path.join(OUT, "step1.png"), fullPage: true });
});
