// EAINT-12406 sheet QT (2 Quotation): data and the All Quotations proofs shared by the QT specs.
// Not a spec (no `.spec.ts`): imported by 2-secarang-*.cr.spec.ts only.
//
// Expected values: cr/EAINT-12406/01-intake/scenarios.yaml (approved 29.10.2026), which quotes SRD v1.1 (26.10.2026)
// §2.2.5 REQ-003 ("Allianz – Quotation unavailable" card, "same as Lonpac and Tokio Marine today", "Card appears after
// Tokio Marine"), REQ-004 (Lonpac > Allianz > Tokio Marine; an insurer without a quotation is skipped, the rest keep
// the same order) and REQ-005 (the Allianz logo on the Allianz quotation).
// "Same as Lonpac and Tokio Marine today" (REQ-003): today's unavailable card is the insurer's LOGO with the words
// "Quotation unavailable" (seen 29.10.2026, probe 03-spec/probes-automation/quotations-dom.mjs), so a card is
// "<insurer> – Quotation unavailable" when its logo names the insurer and its line says "Quotation unavailable".
//
// Selectors: SecarangQuotationsPage (automation/src/pages/secarang/quotations.page.ts), seen by that probe.
import type { TsRun } from "@fixtures";
import type { SecarangQuoteForm } from "@pages/secarang/home.page";
import { SecarangQuotationsPage, type SecarangQuoteCard } from "@pages/secarang/quotations.page";
import { secarangQuoteForm } from "@data/secarang";

export const LONPAC = "Lonpac";
export const ALLIANZ = "Allianz";
export const TOKIO = "Tokio Marine";
/** REQ-004: the order of the quotations. */
export const ORDER = [LONPAC, ALLIANZ, TOKIO];

/** "Tokio Marine" / "TokioMarine" are the same insurer. */
export const same = (a: string, b: string) => a.toLowerCase().replace(/[^a-z]/g, "") === b.toLowerCase().replace(/[^a-z]/g, "");
export const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => same(x, b[i]));

/**
 * The quote inputs a QT TS needs, from env/.staging.env-local (never written in the repo: the IC may be a real
 * person's, team doc §13).
 *   SECARANG_PLATE_<TS id>     the plate, e.g. SECARANG_PLATE_12406_QT_TS5=...
 *   SECARANG_IC_<TS id>        the owner IC for that car (optional; else SECARANG_QUOTE_IC, else the made-up IC)
 *   SECARANG_POSTCODE_<TS id>  the postcode (optional; else 55000, team doc §13)
 * `fallbackPlate`: only for a TS whose car needs nothing special. Since Dev's eSim fix of 29.10.2026 all three
 * insurers quote any made-up car on /ia/ (flow runs, STATUS.md 29.10), so 12406_QT_TS1 has one. The "one insurer gives no
 * quotation" / non-renewal TS (QT_TS2, TS4, TS5, TS6) have NONE: they need Dev's simulator set-up (Q12; Azfar
 * 29.10.2026: run them last, tell him just before and he asks Dev), and a plain made-up car would quote all three and
 * look like a defect. Without SECARANG_PLATE_<TS id> those are skipped.
 */
export function quoteData(tsId: string, fallbackPlate = ""): SecarangQuoteForm | undefined {
  const plate = (process.env[`SECARANG_PLATE_${tsId}`] ?? fallbackPlate).trim().toUpperCase();
  if (!plate) return undefined;
  const f = secarangQuoteForm(plate);
  const ic = (process.env[`SECARANG_IC_${tsId}`] ?? "").replace(/\D/g, "");
  const pc = (process.env[`SECARANG_POSTCODE_${tsId}`] ?? "").trim();
  return { ...f, ...(ic ? { idNo: ic } : {}), ...(pc ? { postalCode: pc } : {}) };
}

export const noData = (tsId: string, what: string) =>
  `Q12 (test data, Dev's simulator set-up): run only after Dev has set the insurer simulator for this case (Azfar 29.10.2026: ` +
  `tell him just before; he asks Dev), then set SECARANG_PLATE_${tsId} (and SECARANG_IC_${tsId} if the car needs its own IC) ` +
  `in env/.staging.env-local to ${what}`;

/** The cards as a line for `shows`: "Lonpac RM 862.16 > Allianz (Quotation unavailable) > …". */
export const cardsLine = (cards: SecarangQuoteCard[]) =>
  cards.map((c) => (c.available ? `${c.insurer} ${c.prices.slice(-1)[0] ?? "(no price)"}` : `${c.insurer} ("${c.unavailableReason}")`)).join(" > ") || "no card";

/** The available quotations, in screen order. */
export const quoted = (cards: SecarangQuoteCard[]) => cards.filter((c) => c.available).map((c) => c.insurer);

/** A card that is "<insurer> – Quotation unavailable": the insurer's logo and the words "Quotation unavailable". */
export const isUnavailableCard = (c: SecarangQuoteCard | undefined) => !!c && !c.available && /^Quotation unavailable$/i.test(c.unavailableReason.trim());

/** Every visible card's outline, for a screenshot of the whole row. */
export const allCards = (ts: TsRun) => new SecarangQuotationsPage(ts.page).cards();

/** E: "Quotations shown in this order: …" — the AVAILABLE quotations, left to right, are exactly `want`. */
export async function proveQuotedOrder(ts: TsRun, point: string, cards: SecarangQuoteCard[], want: string[], name = "all-quotations-order") {
  const got = quoted(cards);
  await ts.prove(point, {
    shows: `quotations, left to right: ${got.join(", ") || "none"} (all cards: ${cardsLine(cards)})`,
    match: sameList(got, want),
    hl: allCards(ts),
    name,
  });
}

/** E: "The Allianz quotation shows the Allianz logo" — the Allianz card is a quotation and its logo image is Allianz's and loaded. */
export async function proveAllianzLogo(ts: TsRun, point: string, cards: SecarangQuoteCard[], name = "allianz-card-logo") {
  const q = new SecarangQuotationsPage(ts.page);
  const card = cards.find((c) => same(c.insurer, ALLIANZ));
  const logo = card ? await q.logoOf(ALLIANZ) : undefined;
  await ts.prove(point, {
    shows: !card
      ? `no Allianz card (cards: ${cardsLine(cards)})`
      : `Allianz card ${card.available ? `quotation ${card.prices.slice(-1)[0] ?? ""}` : `UNAVAILABLE ("${card.unavailableReason}")`}; logo alt "${logo!.alt}", file ${logo!.file}, image loaded ${logo!.loaded}, drawn ${logo!.width}x${logo!.height}px`,
    match: !!card && card.available && !!logo && /allianz/i.test(logo.alt) && /allianz/i.test(logo.file) && logo.loaded && logo.width >= 20 && logo.height >= 10,
    hl: logo ? [await q.card(ALLIANZ), logo.logo] : allCards(ts),
    name,
  });
}

/**
 * E: "A '<insurer> – Quotation unavailable' card is shown" (+ where it is, recorded) — or with `after`, "… shown after the
 * <after> quotation" (its position is then part of the check).
 */
export async function proveUnavailable(ts: TsRun, point: string, cards: SecarangQuoteCard[], insurer: string, opts: { after?: string; name?: string } = {}) {
  const i = cards.findIndex((c) => same(c.insurer, insurer));
  const card = cards[i];
  const j = opts.after ? cards.findIndex((c) => same(c.insurer, opts.after!)) : -1;
  const position = i < 0 ? "-" : `card ${i + 1} of ${cards.length}${i > 0 ? `, after ${cards[i - 1].insurer}` : ", first"}`;
  ts.note(`${insurer} card position (recorded): ${position}; all cards: ${cardsLine(cards)}`);
  const q = new SecarangQuotationsPage(ts.page);
  await ts.prove(point, {
    shows: !card
      ? `no ${insurer} card at all (cards: ${cardsLine(cards)})`
      : `${insurer} card: ${card.available ? `a QUOTATION ${card.prices.slice(-1)[0] ?? ""}` : `"${card.unavailableReason}"`}, ${position}${opts.after ? (j < 0 ? `; no ${opts.after} card` : `; ${opts.after} is card ${j + 1}`) : ""}`,
    match: isUnavailableCard(card) && (!opts.after || (j >= 0 && i > j)),
    hl: card ? await q.card(insurer) : allCards(ts),
    name: opts.name ?? `${insurer.toLowerCase().replace(/\W+/g, "-")}-quotation-unavailable`,
  });
}
