// @ticket   EAINT-12406
// @sheet    QT (2 Quotation)
// @cases    12406_QT_TS1, 12406_QT_TS5, 12406_QT_TS6
// @env      Secarang staging /ia/ (INSTANCE=ia; SECARANG_BASE_URL / SECARANG_BASE_PATH from env/.staging.env-local)
// @status   draft
//
// Written 29.10.2026 by cr-author from the approved TS (scenarios.yaml meta.approved_by: Azfar 29.10.2026, "Dev push
// the changes ady you may start"; points from 01-intake/ts.json). NOT run. Each expected point is proved with
// ts.prove(), in the TS's words; shared proofs and data in ./_qt.ts.
//
// One screen, read only: Home > Get quotation > [Car Details] > All Quotations, nothing bought (a quotation is a
// request to the insurer simulator, not a purchase), so no @destructive. No user login on Secarang.
// Flow: secarang (VERIFIED 29.10.2026 ~15:50, src/flows/README.md): runSecarangFlow stopAfter "quotations".
// Selectors: probe 03-spec/probes-automation/quotations-dom.mjs, staging /ia/ after the deploy, 29.10.2026.
//
// DATA. 12406_QT_TS1: since Dev's eSim fix of 29.10.2026 all three insurers quote any made-up car on /ia/ (flow runs,
// STATUS.md 29.10: Lonpac RM819.07, Allianz RM862.16, Tokio Marine RM1,355.08 on HXA0001A), and the TS says "the same car is
// used by 12406_E2E_TS1", so it quotes E2E_TS1's car: SECARANG_PLATE_12406_QT_TS1, else SECARANG_PLATE_12406_E2E_TS1, else
// HXA0011A (E2E_TS1's default). Run it BEFORE E2E_TS1 buys that car (a bought car may stop quoting, two-month rule) and
// BEFORE Dev switches an insurer off for QT_TS5 / QT_TS6.
// 12406_QT_TS5 / QT_TS6 need Dev's simulator set-up (one insurer gives no quotation, Q12; Azfar 29.10.2026: run them last,
// tell him just before): without SECARANG_PLATE_<TS id> they are SKIPPED with the reason (_qt.ts quoteData / noData).
//
// Not in this file (02-plan/coverage.md): 12406_QT_TS2, QT_TS4 (2-secarang-no-allianz-quotation.e2e.cr.spec.ts);
// 12406_QT_TS7 (2-secarang-allianz-documents.e2e.cr.spec.ts); 12406_QT_TS3, TS8, TS9, TS10 (ON HOLD, orange, Azfar 29.10.2026).
//
// Revised 29.10.2026 (cr-author, after scenarios v5): QT_TS1 no longer skipped for want of data (see DATA).
import { test, expect, type TsRun } from "@fixtures";
import { runSecarangFlow, type SecarangResult } from "@flows/secarang.flow";
import { SecarangQuotationsPage } from "@pages/secarang/quotations.page";
import {
  ALLIANZ, LONPAC, TOKIO, ORDER, quoteData, noData, cardsLine, quoted, sameList, same, allCards,
  proveQuotedOrder, proveAllianzLogo, proveUnavailable,
} from "./_qt";

const TAGS = (p: "@P1" | "@P2") => [p, "@func", "@sheet-QT"];

/** 12406_QT_TS1's car: the car of 12406_E2E_TS1 (the TS's precondition), see DATA above. */
const QT_TS1_CAR = (process.env.SECARANG_PLATE_12406_E2E_TS1 ?? "").trim() || "HXA0011A";

/** Home > Get quotation > All Quotations for this TS's car (the flow); returns its cards. */
async function quote(ts: TsRun, tsId: string, what: string, fallbackPlate = ""): Promise<SecarangResult> {
  const form = quoteData(tsId, fallbackPlate)!;
  await ts.site("Secarang", `${what}: car ${form.plateNo}, postcode ${form.postalCode}`);
  const r = await runSecarangFlow(ts.page, { form, stopAfter: "quotations" });
  ts.note(`screens: ${(r.screens ?? []).join(" > ")}; Car Details: ${(r.carDetails ?? []).join(" | ").replace(/\d{6}-?\d{2}-?\d{4}/g, "<IC>").slice(0, 300)}`);
  ts.note(`All Quotations cards (left to right): ${cardsLine(r.quotations ?? [])}`);
  expect(r.quotations?.length ?? 0, "All Quotations shows no card at all").toBeGreaterThan(0);
  return r;
}

test.describe("EAINT-12406 QT — All Quotations: insurer order and the Allianz quotation (staging /ia/)", () => {
  test.skip(process.env.TEST_ENV === "production", "staging rows (QT sheet): /ia/ only");

  // ---------------------------------------------------------------------------------------------- TS1
  test.describe(() => {
    const ID = "12406_QT_TS1";

    test("12406_QT_TS1 — All three quote: Lonpac, Allianz (with its logo), Tokio Marine; no other card; same after [Edit] postcode", { tag: TAGS("@P1") }, async ({ ts }) => {
      test.setTimeout(10 * 60_000);
      // Steps 1-2: Home > Car tab > plate + owner > All Quotations; every card read
      const r = await quote(ts, ID, "All three insurers quote (the car of 12406_E2E_TS1)", QT_TS1_CAR);
      const cards = r.quotations!;
      await proveQuotedOrder(ts, "E1", cards, ORDER);
      await proveAllianzLogo(ts, "E2", cards);
      const others = cards.filter((c) => !ORDER.some((o) => same(o, c.insurer)));
      const unavailable = cards.filter((c) => !c.available);
      await ts.prove("E3", {
        shows: `${cards.length} card(s): ${cardsLine(cards)}; "Quotation unavailable" cards: ${unavailable.map((c) => c.insurer).join(", ") || "none"}; other insurers: ${others.map((c) => c.insurer).join(", ") || "none"}`,
        match: cards.length === ORDER.length && !unavailable.length && !others.length,
        hl: allCards(ts),
        name: "no-other-card",
      });

      // Step 3: [Edit] the postcode to another West Malaysia postcode; the cards quote again
      const q = new SecarangQuotationsPage(ts.page);
      const priceBefore = cards.find((c) => same(c.insurer, ALLIANZ))?.prices.slice(-1)[0] ?? "(none)";
      const newPostcode = r.form.postalCode === "50450" ? "55000" : "50450";
      const edit = await q.editPostcode(newPostcode);
      const after = await q.readCards();
      const priceAfter = after.find((c) => same(c.insurer, ALLIANZ))?.prices.slice(-1)[0] ?? "(none)";
      ts.note(`Allianz price (recorded, SRD silent): postcode ${r.form.postalCode} ${priceBefore} -> postcode ${edit.value} ${priceAfter}`);
      const logo = after.some((c) => same(c.insurer, ALLIANZ)) ? await q.logoOf(ALLIANZ) : undefined;
      await ts.prove("E4", {
        shows: `after [Edit] postcode ${r.form.postalCode} -> ${edit.value}: cards ${edit.requoted ? "quoted again" : "NOT seen to re-quote"}; quotations ${quoted(after).join(", ") || "none"} (all cards: ${cardsLine(after)}); Allianz logo ${logo ? `"${logo.alt}" ${logo.file}, loaded ${logo.loaded}` : "none"}; Allianz price ${priceBefore} -> ${priceAfter} (recorded)`,
        match:
          edit.requoted && edit.value === newPostcode && sameList(quoted(after), ORDER) && after.length === ORDER.length &&
          !!logo && /allianz/i.test(logo.alt) && logo.loaded && logo.width >= 20,
        hl: [q.postcodeField(), allCards(ts)],
        name: "after-edit-postcode",
      });
    });
  });

  // ---------------------------------------------------------------------------------------------- TS5
  test.describe(() => {
    const ID = "12406_QT_TS5";
    test.skip(!quoteData(ID), noData(ID, "an individual-owner renewal that Allianz and Tokio Marine quote and Lonpac does not"));

    test("12406_QT_TS5 — Lonpac gives no quotation: Allianz (with its logo) then Tokio Marine; Lonpac unavailable card shown", { tag: TAGS("@P2") }, async ({ ts }) => {
      test.setTimeout(8 * 60_000);
      const r = await quote(ts, ID, "Lonpac gives no quotation");
      const cards = r.quotations!;
      await proveQuotedOrder(ts, "E1", cards, [ALLIANZ, TOKIO]);
      await proveAllianzLogo(ts, "E2", cards);
      // its position is recorded (Q13), not judged
      await proveUnavailable(ts, "E3", cards, LONPAC);
    });
  });

  // ---------------------------------------------------------------------------------------------- TS6
  test.describe(() => {
    const ID = "12406_QT_TS6";
    test.skip(!quoteData(ID), noData(ID, "an individual-owner renewal that Lonpac and Allianz quote and Tokio Marine does not"));

    test("12406_QT_TS6 — Tokio Marine gives no quotation: Lonpac then Allianz (with its logo); Tokio Marine unavailable card shown", { tag: TAGS("@P2") }, async ({ ts }) => {
      test.setTimeout(8 * 60_000);
      const r = await quote(ts, ID, "Tokio Marine gives no quotation");
      const cards = r.quotations!;
      await proveQuotedOrder(ts, "E1", cards, [LONPAC, ALLIANZ]);
      await proveAllianzLogo(ts, "E2", cards);
      // its position is recorded (Q13), not judged
      await proveUnavailable(ts, "E3", cards, TOKIO);
    });
  });
});
