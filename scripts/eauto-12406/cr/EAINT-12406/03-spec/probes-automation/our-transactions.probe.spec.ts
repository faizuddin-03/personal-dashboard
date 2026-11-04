// EAINT-12406 probe (29.10.2026): the CIBO records our verify runs of today created, READ ONLY. Transaction Management
// searched by each verify plate (made up), rows created since 11:00 today: Ref. No., created, status, payment, insurer.
// No personal data printed (the plates and the owner name are made up; the Insured column is not printed).
//
//   CR_TICKET=EAINT-12406 RUN_ID=EAINT-12406-probe-ourtx-<stamp> npx playwright test --project=cr-tools our-transactions.probe

import { test } from "@fixtures";
import { CiboLoginPage } from "@pages/cibo/cibo-login.page";
import { CiboSidebar } from "@pages/cibo/cibo-sidebar.page";
import { CiboTransactionManagementPage, TM_REF_COLUMN } from "@pages/cibo/transaction-management.page";

test("probe: our CIBO records of today, by verify plate (read only)", async ({ page }) => {
  test.setTimeout(10 * 60_000);
  await new CiboLoginPage(page).as();
  const tm = new CiboTransactionManagementPage(page);
  // OURTX_PLATES / OURTX_SINCE (HH:MM today, MYT) narrow the look (29.10.2026: the card verify run's HXA0007A).
  const [sh, sm] = (process.env.OURTX_SINCE ?? "11:00").split(":").map(Number);
  const since = new Date(2026, 9, 29, sh, sm);
  const plates = process.env.OURTX_PLATES ? process.env.OURTX_PLATES.split(",").map((x) => x.trim()) : ["HXA0006A", "HXA0007A", "HXA0008A", "HXA0009A", "HXA0010A", "HXA0016A"];
  for (const plate of plates) {
    await new CiboSidebar(page).open("transactions");
    const rows = await tm.findByPlate(plate, since).catch(() => []);
    for (const r of rows) {
      const line = `${plate} | ${(r[TM_REF_COLUMN] ?? "").split(" ")[0]} | created ${r["Transaction Created Date"]} | ${r["Transaction Status"]} | payment ${r["Payment"]} | ${r["Payment Mode"] ?? ""} | ${r["Ins. Co."]}`;
      console.log("TX", line);
      test.info().annotations.push({ type: "tx", description: line });
    }
    if (!rows.length) console.log("TX", plate, `| none since ${sh}:${String(sm).padStart(2, "0")}`);
  }
});
