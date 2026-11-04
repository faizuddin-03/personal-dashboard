// @ticket   EAINT-12406
// @sheet    QT (2 Quotation)
// @cases    12406_QT_TS2, 12406_QT_TS4
// @env      Secarang staging /ia/ (INSTANCE=ia; SECARANG_BASE_URL / SECARANG_BASE_PATH from env/.staging.env-local)
// @status   draft
//
// Written 29.10.2026 by cr-author from the approved TS (scenarios.yaml meta.approved_by: Azfar 29.10.2026, "Dev push
// the changes ady you may start"; points from 01-intake/ts.json). NOT run. Each expected point is proved with
// ts.prove(), in the TS's words; shared proofs and data in ./_qt.ts.
//
// Changes records (so @destructive): QT_TS2 presses Buy on Lonpac and on Tokio Marine (Add-ons: CIBO records the
// transaction from here, team doc §6; nothing paid); QT_TS4 buys Lonpac to the end with FPX (sandbox money, a real
// CIBO record, the receipts go to the QA's own phone / email: secarangOwner()).
// Flow: secarang (VERIFIED 29.10.2026, src/flows/README.md): stops "quotations", "addOns", "receipt". The Fiuu payment
// window is kept open by ts.payWindow (flow hook aroundPayment); the flow's onStep hook lets this file prove a point on
// the screen it is about without walking the wizard itself.
// Selectors of All Quotations: probe 03-spec/probes-automation/quotations-dom.mjs, staging /ia/, 29.10.2026.
//
// DATA (Q12, open): both TS need Dev's simulator set-up (Allianz gives no quotation; a non-renewal), so no plate is
// guessed: since Dev's eSim fix of 29.10.2026 a plain made-up car quotes all three insurers. Azfar 29.10.2026: run these
// LAST, tell him just before and he asks Dev. Without SECARANG_PLATE_<TS id> the TS is SKIPPED with the reason (_qt.ts).
// QT_TS2 also needs the car of 12406_QT_TS5 or QT_TS6 (the TS says "compare with 12406_QT_TS5 and QT_TS6").
//
// Revised 29.10.2026 (cr-author) for scenarios v5 (review/2026-10-29-proposed-changes.md C7, C8, Azfar 29.10):
// QT_TS2 selects Lonpac on the first All Quotations, then quotes the same car AGAIN from Home and selects Tokio Marine
// (no back control); E3 compares the cards on text, contents, width, border and font only (the rest recorded).
//
// Hand-off: QT_TS4's Lonpac purchase is handed on as "lonpacPurchase" for 12406_RG_TS2 (contract in 02-plan/coverage.md).
import { test, expect, type TsRun } from "@fixtures";
import * as fs from "node:fs";
import { execFileSync } from "node:child_process";
import { runSecarangFlow, type SecarangResult, type SecarangStep } from "@flows/secarang.flow";
import { SecarangQuotationsPage, type SecarangQuoteCard } from "@pages/secarang/quotations.page";
import { SecarangAddOnsPage } from "@pages/secarang/add-ons.page";
import { SecarangSuccessPage } from "@pages/secarang/success.page";
import { FPX_BANK } from "@pages/secarang/payment.page";
import { secarangOwner } from "@data/secarang";
import { handOff } from "@fixtures/ts-handoff";
import {
  ALLIANZ, LONPAC, TOKIO, quoteData, noData, cardsLine, same, sameList, allCards, isUnavailableCard,
  proveQuotedOrder, proveUnavailable,
} from "./_qt";

const TAGS = (p: "@P1" | "@P2") => [p, "@e2e", "@sheet-QT", "@destructive"];

/**
 * 12406_QT_TS2 step 2 (v5 C8): the Allianz unavailable card is compared with the Lonpac / Tokio Marine one "on text,
 * contents, width, border and font" (SecarangQuotationsPage.unavailableLook keys text, holds, width, border, font).
 */
const LOOK_COMPARED = ["text", "holds", "width", "border", "font"] as const;

function pdfText(file: string): string | undefined {
  for (const bin of ["pdftotext", "C:/Program Files/Git/mingw64/bin/pdftotext.exe"]) {
    try {
      return execFileSync(bin, ["-layout", file, "-"], { encoding: "utf8" });
    } catch {
      /* next */
    }
  }
  return undefined;
}

/** The car QT_TS2 compares its Allianz card with: QT_TS5's (Lonpac unavailable) or else QT_TS6's (Tokio Marine unavailable). */
function referenceCar() {
  for (const [id, insurer] of [["12406_QT_TS5", LONPAC], ["12406_QT_TS6", TOKIO]] as const) {
    const form = quoteData(id);
    if (form) return { id, insurer, form };
  }
  return undefined;
}

test.describe("EAINT-12406 QT — No Allianz quotation (staging /ia/)", () => {
  test.skip(process.env.TEST_ENV === "production", "staging rows (QT sheet): never buy on production (team doc §2)");

  // ---------------------------------------------------------------------------------------------- TS2
  test.describe(() => {
    const ID = "12406_QT_TS2";
    test.skip(!quoteData(ID), noData(ID, "a private car, individual owner, renewal, that Lonpac and Tokio Marine quote and Allianz does not"));
    test.skip(!referenceCar(), noData("12406_QT_TS5", "the car of 12406_QT_TS5 (or SECARANG_PLATE_12406_QT_TS6, the car of QT_TS6): QT_TS2 compares its Allianz card with their unavailable cards"));

    test("12406_QT_TS2 — Allianz gives no quotation: Lonpac, Tokio Marine, then the 'Allianz – Quotation unavailable' card; Lonpac and Tokio Marine selectable", { tag: TAGS("@P1") }, async ({ ts }) => {
      test.setTimeout(20 * 60_000);
      const form = quoteData(ID)!;
      const ref = referenceCar()!;
      const q = new SecarangQuotationsPage(ts.page);

      // Reference for E3 (the TS: "compare with 12406_QT_TS5 and QT_TS6"): an existing unavailable card, as it looks today
      await ts.site("Secarang", `reference for E3: the car of ${ref.id}, where ${ref.insurer} gives no quotation (${ref.form.plateNo})`);
      const rr = await runSecarangFlow(ts.page, { form: ref.form, stopAfter: "quotations" });
      ts.note(`reference cards (${ref.id} car ${ref.form.plateNo}): ${cardsLine(rr.quotations ?? [])}`);
      const refCard = (rr.quotations ?? []).find((c) => same(c.insurer, ref.insurer));
      expect(isUnavailableCard(refCard), `the reference car of ${ref.id} (${ref.form.plateNo}) does not show a "${ref.insurer} – Quotation unavailable" card (cards: ${cardsLine(rr.quotations ?? [])}): wrong reference data`).toBe(true);
      const refLook = await q.unavailableLook(ref.insurer);
      ts.note(`reference look, ${ref.insurer} unavailable card: ${JSON.stringify(refLook)}`);
      await ts.shot(`reference-${ref.insurer.toLowerCase().replace(/\W+/g, "-")}-unavailable-card`, `reference for E3: the ${ref.insurer} "Quotation unavailable" card today`, await q.card(ref.insurer));

      // Steps 1-2 on the first All Quotations (E1-E3), then step 3: Buy on Lonpac there (E4); then, as the TS says (v5 C7),
      // the same car is quoted AGAIN from Home (not the back control) and Tokio Marine is selected (E4). Each Buy
      // opens Add-ons and creates a CIBO record either way (TS step 3). The flow walks; this file only proves.
      const proveCards = async (cards: SecarangQuoteCard[]) => {
        ts.note(`All Quotations cards (left to right): ${cardsLine(cards)}`);
        expect(cards.length, "All Quotations shows no card at all").toBeGreaterThan(0);
        await proveQuotedOrder(ts, "E1", cards, [LONPAC, TOKIO]);
        await proveUnavailable(ts, "E2", cards, ALLIANZ, { after: TOKIO, name: "allianz-quotation-unavailable-after-tokio-marine" });

        // E3 (v5 C8): "compare ... on text, contents, width, border and font"; the other readings are recorded only
        const az = cards.find((c) => same(c.insurer, ALLIANZ));
        const look = isUnavailableCard(az) ? await q.unavailableLook(ALLIANZ) : undefined;
        const differs = look ? LOOK_COMPARED.filter((k) => look[k] !== refLook[k]) : [];
        if (look) ts.note(`Allianz unavailable card, also recorded (not compared): ${["classes", "box", "line"].map((k) => `${k}: ${look[k]}`).join("; ")}`);
        await ts.prove("E3", {
          shows: !look
            ? `no Allianz "Quotation unavailable" card to compare (cards: ${cardsLine(cards)})`
            : differs.length
              ? `Allianz unavailable card differs from the ${ref.insurer} one in: ${differs.map((k) => `${k} "${look[k]}" vs "${refLook[k]}"`).join("; ")}`
              : `Allianz unavailable card the same as the ${ref.insurer} one (${ref.id} car) on ${LOOK_COMPARED.join(", ")}: ${LOOK_COMPARED.map((k) => `${k}: ${look[k]}`).join("; ")}`,
          match: !!look && !differs.length,
          hl: look ? await q.card(ALLIANZ) : allCards(ts),
          name: "allianz-unavailable-card-same-look",
        });
      };

      for (const [k, insurer] of ([[0, LONPAC], [1, TOKIO]] as const)) {
        await ts.site(
          "Secarang",
          k === 0
            ? `Allianz gives no quotation: car ${form.plateNo}, postcode ${form.postalCode}; then select Lonpac`
            : `quote the same car again from Home (${form.plateNo}) and select Tokio Marine`,
        );
        let buyShown = "";
        try {
          const s = await runSecarangFlow(ts.page, {
            form,
            insurer,
            stopAfter: "addOns",
            onStep: async (st: SecarangStep, x: SecarangResult) => {
              if (st !== "quotations") return;
              if (k === 0) await proveCards(x.quotations ?? []);
              else ts.note(`All Quotations cards, quoted again (left to right): ${cardsLine(x.quotations ?? [])}`);
              const c = (x.quotations ?? []).find((cc) => same(cc.insurer, insurer));
              const buy = await q.buyButton(insurer).catch(() => null);
              buyShown = `${insurer} card ${c ? (c.available ? `quotation ${c.prices.slice(-1)[0] ?? ""}` : `"${c.unavailableReason}"`) : "missing"}, Buy ${buy && (await buy.isVisible().catch(() => false)) ? "shown" : "NOT shown"}`;
              await ts.shot(`select-${insurer.toLowerCase().replace(/\W+/g, "-")}-card`, `before Buy: ${buyShown}`, buy ?? allCards(ts));
            },
          });
          const addOns = new SecarangAddOnsPage(ts.page);
          await ts.prove("E4", {
            shows: `${buyShown}; Buy pressed: Add-ons opened with ${s.addOns?.offered.length ?? 0} add-on(s) (${(s.addOns?.offered ?? []).map((a) => a.name).join("; ").slice(0, 200)})`,
            match: (s.addOns?.offered.length ?? 0) > 0,
            expected: `${insurer} quotation can be selected as usual`,
            hl: addOns.cards().first(),
            name: `select-${insurer.toLowerCase().replace(/\W+/g, "-")}-add-ons`,
          });
        } catch (e) {
          // Only a Buy that did not lead to Add-ons is the product's answer; anything earlier is the script's.
          if (!buyShown) throw e;
          await ts.prove("E4", {
            shows: `${buyShown}; selecting it did not open Add-ons: ${String((e as Error).message).split("\n")[0].slice(0, 200)}`,
            match: false,
            expected: `${insurer} quotation can be selected as usual`,
            hl: allCards(ts),
            name: `select-${insurer.toLowerCase().replace(/\W+/g, "-")}-failed`,
          });
        }
      }
    });
  });

  // ---------------------------------------------------------------------------------------------- TS4
  test.describe(() => {
    const ID = "12406_QT_TS4";
    test.skip(!quoteData(ID), noData(ID, "a private car, individual owner, NOT a renewal (what counts as non-renewal on Secarang: Q12 e), that Lonpac quotes"));

    test("12406_QT_TS4 — Non-renewal: 'Allianz – Quotation unavailable' after Tokio Marine; Lonpac, Tokio Marine as usual; the Lonpac purchase completes (FPX RHB)", { tag: TAGS("@P1") }, async ({ ts }) => {
      test.setTimeout(20 * 60_000);
      const form = quoteData(ID)!;
      const t0 = new Date();
      let receiptNo = "";
      let receiptFile = "";
      await ts.site("Secarang", `non-renewal, buy Lonpac by FPX Online banking (RHB): car ${form.plateNo}`);
      const r = await runSecarangFlow(ts.page, {
        form,
        insurer: LONPAC,
        owner: secarangOwner(),
        payment: { channel: "fpx", bank: FPX_BANK.rhb },
        aroundPayment: (what, fn) => ts.payWindow(what, fn),
        stopAfter: "receipt",
        onStep: async (st: SecarangStep, x: SecarangResult) => {
          if (st === "quotations") {
            // Steps 1-2: All Quotations, every card read
            const cards = x.quotations ?? [];
            ts.note(`All Quotations cards (left to right): ${cardsLine(cards)}`);
            await proveUnavailable(ts, "E1", cards, ALLIANZ, { after: TOKIO, name: "allianz-quotation-unavailable-after-tokio-marine" });
            // "The Lonpac and Tokio Marine quotations that are available are shown as usual, in the order Lonpac, Tokio Marine"
            const avail = cards.filter((c) => c.available && (same(c.insurer, LONPAC) || same(c.insurer, TOKIO)));
            const names = avail.map((c) => c.insurer);
            const orderOk = sameList(names, [LONPAC, TOKIO].filter((n) => names.some((a) => same(a, n))));
            const others = cards.filter((c) => c.available && !same(c.insurer, LONPAC) && !same(c.insurer, TOKIO));
            const usual = avail.every((c) => c.prices.length > 0);
            await ts.prove("E2", {
              shows: `quotations shown: ${avail.map((c) => `${c.insurer} ${c.prices.slice(-1)[0] ?? "(no price)"}`).join(", ") || "none"}; other quotations: ${others.map((c) => c.insurer).join(", ") || "none"} (all cards: ${cardsLine(cards)})`,
              // Lonpac must quote here (it is bought next); Tokio Marine is shown "that are available"
              match: avail.some((c) => same(c.insurer, LONPAC)) && orderOk && usual && !others.length,
              hl: allCards(ts),
              name: "lonpac-tokio-marine-as-usual",
            });
          }
          if (st === "paid") receiptNo = Object.entries(x.success ?? {}).find(([k]) => /^Receipt No/i.test(k))?.[1] ?? "";
          if (st === "receipt") {
            // the flow has pressed [Receipt]: keep the file, then prove on the Success page, then show the file
            const ok = new SecarangSuccessPage(ts.page);
            receiptFile = await ts.download(x.receipt!, `secarang-receipt-lonpac-${form.plateNo}-PERSONAL-DATA.pdf`);
            const isPdf = fs.readFileSync(receiptFile).subarray(0, 4).toString() === "%PDF";
            const thanks = await ok.marker().isVisible().catch(() => false);
            const btn = await ok.receiptButton().isVisible().catch(() => false);
            await ts.prove("E3", {
              shows: `Success page "Thank you for your purchase!" ${thanks ? "shown" : "NOT shown"} (Receipt No "${receiptNo}"); [Receipt] ${btn ? "shown" : "NOT shown"}, downloaded ${fs.statSync(receiptFile).size} bytes, ${isPdf ? "a PDF" : "NOT a PDF"}`,
              match: thanks && btn && isPdf && !!receiptNo,
              hl: [ok.marker(), ok.receiptButton()],
              name: "lonpac-success-and-receipt",
            });
            await ts.showFile(receiptFile, "Secarang receipt (Lonpac)", pdfText(receiptFile));
          }
        },
      });
      ts.note(`purchase: ${r.payment?.detail}; Receipt No ${receiptNo}`);
      // for 12406_RG_TS2 (contract in 02-plan/coverage.md): CIBO finds it by plate + Receipt No, made since t0
      handOff(ts, "lonpacPurchase", { ref: "", plate: form.plateNo, receiptNo, since: t0.toISOString(), secarangReceipt: receiptFile });
    });
  });
});
