// A TOOL. READ ONLY. Searches the UCD portal's STMS and Interstate listings for
// a vehicle as a persona and prints the rows. Output: console only.
//
//   PROBE_VEHICLES=TE000004 PROBE_PERSONA=ucdE2E npm run probe -- --grep "UCD listing lookup"

import { test } from "@fixtures";
import type { PersonaKey } from "../../config/personas";

test("UCD listing lookup — STMS and Interstate listings", async ({ page, ucdSession }) => {
  test.setTimeout(4 * 60 * 1000);
  const who = (process.env.PROBE_PERSONA ?? "ucdE2E") as PersonaKey;
  await ucdSession(who);
  const root = page.url().replace(/\/view\/.*/, "");
  for (const v of (process.env.PROBE_VEHICLES ?? "TE000004").split(",")) {
    for (const [name, p] of [
      ["interstate", "/view/ucd/stms/interstate/enquiry.do"],
      ["stms", "/view/ucd/stms/enquiry/main.do"],
    ]) {
      await page.goto(root + p);
      await page.fill("#vehicleNo", v);
      await page.click("#to-search");
      await page.waitForTimeout(2500);
      const rows = await page.evaluate(() =>
        Array.from(document.querySelectorAll("table tr"))
          .map((tr) => Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent || "").trim().replace(/\s+/g, " ")))
          .filter((r) => r.length > 4),
      );
      console.log(`\n=== ${who} / ${name} / ${v}`);
      for (const r of rows.slice(0, 6)) console.log("   ", r.join(" | ").slice(0, 600));
      if (!rows.length) console.log("    (no rows)");
    }
  }
});
