// EAINT-12406 probe (29.10.2026, after Dev fixed an eSim config error, "okey ady you can try"): which insurers quote
// which made-up car on /ia/ now. For the QT sheet, which needs cars giving: all three quoting / Allianz alone missing /
// Lonpac alone missing / Tokio Marine alone missing / a non-renewal that Lonpac quotes. READ ONLY up to All Quotations
// (a quotation is a request to the insurer simulator, nothing is bought). Plates: the verify-reserved made-up ones
// (HXA0001A, HXA0006A-HXA0010A, HXA0016A; 0006-0010 were BOUGHT today, so the two-month rule may answer them).
// ICs: made-up. Each combination is recorded: the screens, the Car Details coverage line, every card, or the refusal.
//
//   CR_TICKET=EAINT-12406 RUN_ID=EAINT-12406-probe-quotes-<stamp> npx playwright test --project=cr-tools quote-matrix.probe

import { test } from "@fixtures";
import { runSecarangFlow, SecarangQuoteRefused } from "@flows/secarang.flow";

const IC = ["900101145671", "850615105523", "780322086011"];
const COMBOS: [string, string][] = [
  ["HXA0001A", IC[0]], ["HXA0001A", IC[1]], ["HXA0001A", IC[2]],
  ["HXA0016A", IC[0]], ["HXA0016A", IC[1]], ["HXA0016A", IC[2]],
  ["HXA0006A", IC[0]], ["HXA0007A", IC[0]], ["HXA0008A", IC[0]], ["HXA0009A", IC[0]], ["HXA0010A", IC[0]],
  ["HXA0007A", IC[1]], ["HXA0009A", IC[2]],
];

test("probe: quote matrix on /ia/ after the eSim fix (read only, nothing bought)", async ({ page }) => {
  test.setTimeout(40 * 60_000);
  const rows: string[] = [];
  for (const [plate, ic] of (process.env.PROBE_COMBOS ? JSON.parse(process.env.PROBE_COMBOS) : COMBOS) as [string, string][]) {
    const form = { plateNo: plate, idNo: ic, postalCode: "55000" };
    const icShow = `${ic.slice(0, 6)}-${ic.slice(6, 8)}-${ic.slice(8)}`;
    try {
      const r = await runSecarangFlow(page, { form, stopAfter: "quotations" });
      const cd = r.carDetails ?? [];
      const at = cd.indexOf("Current Coverage");
      const coverage = at >= 0 ? `${cd[at + 1] ?? ""} ${cd[at + 2] ?? ""}`.trim() : "(no Car Details step)";
      const model = cd[cd.indexOf("Model") + 1] ?? "";
      const cards = (r.quotations ?? []).map((c) => `${c.insurer}: ${c.available ? (c.prices.filter((p) => /RM[\d,]+\.\d\d/.test(p)).slice(-1)[0] ?? "quoted") : "unavailable"}`).join(" | ");
      rows.push(`${plate} | IC ${icShow} | ${model} | coverage ${coverage} | ${cards}`);
    } catch (e) {
      if (!(e instanceof SecarangQuoteRefused)) throw e;
      rows.push(`${plate} | IC ${icShow} | REFUSED ${e.kind}: "${e.popupText.slice(0, 140)}"`);
      await page.keyboard.press("Escape").catch(() => undefined);
    }
    console.log("QUOTE", rows[rows.length - 1]);
    test.info().annotations.push({ type: "quote", description: rows[rows.length - 1] });
    await test.info().attach(`quote-${plate}-${ic.slice(0, 6)}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  }
});
