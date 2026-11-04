// @ticket   EAINT-12406
// @sheet    RC (4 Receipt / CIBO): CIBO listing, search / filters, Payment Report, Payment Management, Commission Report
// @cases    12406_RC_TS4, 12406_RC_TS10, 12406_RC_TS5, 12406_RC_TS6, 12406_RC_TS11
// @env      CIBO staging https://staging.secarang.com/cibo (INSTANCE=ia: the purchases are on Secarang staging /ia/)
// @status   draft
//
// Written 29.10.2026 by cr-author from the approved TS (scenarios.yaml meta.approved_by: Azfar 29.10.2026; ts.json
// 29.10 09:56). NOT run. Every expected point is proved with ts.prove() in the TS's words; a point whose data is
// missing (a purchase another sheet did not hand on) is left unproved with the reason in checks.txt (gate:
// EVIDENCE, never PASS).
// Brought to TS v5 (ts.json 29.10 13:00, Azfar's 29.10 decisions; rule B "same as before the deploy" on RC_TS4 E1/E3/E5,
// RC_TS10 E2/E3/E5, RC_TS5 E2/E3, RC_TS6 E2, whose values were already the ones asserted): RC_TS10 E1 also searches the
// owner ID as plain digits; E3 asserts the exact "Ops, no search result found" for Allianz + eAuto; E5 asserts Clear
// all puts every filter back to its first-load value with Date Range Type "Transaction Creation Date" (it was
// "nothing left filled", which the 29.10 behaviour would fail). RC_TS4 / TS5 / TS6: no code change.
// Fixed 29.10.2026 after triage of run sRC-1330-c1 (RC_TS4, verdict "spec": step 3's Ref. No. stayed in the Search
// box, step 4 listed nothing and Export waited 120 s for a file): every RC_TS4 search goes through searchAfresh()
// (Transaction Management opened, then tm.resetFilters() empties every filter and the Search box), the Insurance
// Company ticks and the Search box are read back after each search (retried once; a point fed by a search whose
// filter did not take is left unproved), Export is pressed only when the listing has rows ("E4 NOT proved: no
// rows" otherwise), and the "Ops, no search result found" line is no longer counted as a row. RC_TS4's points and
// their checks are unchanged.
// Fixed again 29.10.2026 (afternoon) after rerun sRC-1330 (RC_TS4 SCRIPT: "Could not find CIBO sidebar dashboard"
// after the CSV was shown in the tab): every sidebar step goes through fresh(), which first opens the CIBO dashboard
// again when a shown file replaced the app (_rc.ts backToCibo; probe rc-back-to-cibo10.mjs). Same in RC_TS5 (E3
// after the Payment Report export). Points and their checks unchanged.
// Fixed 29.10.2026 (evening) after triage of runs sRC-1545-c1 / -c2 (verdict "spec" on RC_TS5, RC_TS6, RC_TS10):
//   - the file is no longer serial (mode "default"): RC_TS6 was skipped in 0 ms because RC_TS10 failed before it;
//   - RC_TS5 E3: Payment Management "Till" = today (the calendar greys out future days; Till 30.10 on 29.10 timed
//     out; "use today", 29.10 evening). The channel loop is unchanged;
//   - RC_TS10: every search goes through searchClean() (module opened, every filter and the Search box emptied, then
//     EVERY filter read back; a search that did not take leaves its point unproved). E2's made-up plate stayed in the
//     Search box for E3 / E4 and eAuto stayed ticked into E4. E5 Clear all now checks the TS's words: Date Range Type
//     "Transaction Creation Date", the Search box and every other filter as on first load (it compared Date Range Type
//     with the first load, which is empty). E5 Print waits for window.print() (up to 4 min) instead of reading after
//     1.5 s (cibo.page.ts printView waitForPrintMs; probes rc-tm-discount-print11.mjs, rc-tm-print-after-clear12.mjs).
//     Step 4's Discount Code search is recorded, not run: the filter offers only "Included" / "Exempted" (question to
//     the QA). Points and their checks otherwise unchanged; RC_TS4 untouched.
//
// TS v6 (29.10.2026 evening, cr-author; decisions under Azfar's full permission, STATUS.md):
//   - RC_TS10 E5: Print on the FILTERED listing (Allianz, Transaction Creation Date today - today); nothing printed or
//     recorded for the whole listing (its fetch answered HTTP 404 after 124 s on 29.10: noted for Dev, not 12406).
//   - RC_TS6 E1: the Commission Report lists only transactions with a discount code: E2E_TS2 (RJC7) listed under
//     Serba Sentral with its commission; E2E_TS1, TS3, TS4 NOT listed; commission % worked out and recorded (Q16).
//   - RC_TS11 written (approved in v6): CIBO > CRM, E2E_TS1's owner and vehicle card (recorded, Q43); E2 (QT_TS4's
//     Lonpac buyer) left unproved with its reason until QT_TS4 has run.
// Fixed 30.10.2026 (cr-author) after run eaint-12406-retest-sretest-20261030-0040-C (evidence 05-evidence/FAILED/):
//   - RC_TS6 E2: only the export's DATA rows (numbered in "#") are counted; the blank totals line (no "#", no Recipient
//     Reference, 0.00) is set aside, and any other line fails the point.
//   - RC_TS10 E5: Clear all alone never proves E5 (a matching Clear all is a screenshot + note; E5 is proved once,
//     at Print, with both halves in its match). Print filters Allianz on the date range of the E2E_TS1–TS4 purchases
//     handed on (TS v6c), not "today" (which listed nothing on 30.10), and checks every listed Ref. No. and every
//     handed-on E2E_TS1–TS4 Ref. No. is in the print. Step 4's discount search now runs as TS v6c words it: Allianz +
//     Discount Code "Included" (recorded; E4 says nothing about it).
// READ ONLY on CIBO: searches, filters, Clear all, Print (window.print recorded, page shown with print CSS) and
// Export (a CSV of the narrow search; a read, nothing changes). No @destructive.
// Data from other sheets (02-plan/coverage.md hand-off contract): "allianzPurchase", "allianzPurchase:card",
// "allianzPurchase:grabpay", "allianzPurchase:shopeepay" (12406_E2E_TS1..TS4), "lonpacPurchase" (12406_QT_TS4),
// "tokioMarinePurchase" (12406_E2E_TS10), "allianzUnpaid" (12406_RC_TS9, 4-secarang-unpaid-cibo.e2e.cr.spec.ts).
// Run sheet E2E, QT_TS4 and RC_TS9 first.
// Searches are kept to the purchases' own week (team doc §8, §10: Payment Report is slow on wide windows) and
// every module is opened from the sidebar before each search. That alone does NOT reset the filters (the filter
// state outlives a search; cibo.page.ts clearSelect); RC_TS4 also empties them (searchAfresh), the other tests rely
// on searchListing / pick setting every filter they use.
// Flows: cibo (VERIFIED 29.10.2026, run c3 15:41, incl. the "RC methods" test). Page objects pages/cibo/ (RC methods
// added 29.10.2026 from the read-only probes 03-spec/probes-automation/rc-*.mjs).
// Personal data: listing shots are blurred (Insured, Vehicle No, UCD Name) unless the point is about that column;
// the CSV exports and the video are not: evidence stays out of git.

import { test, type TsRun } from "@fixtures";
import * as fs from "node:fs";
import type { Locator } from "@playwright/test";
import { CiboSidebar, type CiboModule } from "@pages/cibo/cibo-sidebar.page";
import { CiboTransactionManagementPage, TM_REF_COLUMN, type CiboTransactionFilter } from "@pages/cibo/transaction-management.page";
import { CiboPaymentReportPage } from "@pages/cibo/payment-report.page";
import { CiboCommissionReportPage } from "@pages/cibo/commission-report.page";
import { CiboPaymentManagementPage } from "@pages/cibo/payment-management.page";
import { readCiboCsv, type CiboRow } from "@pages/cibo/cibo.page";
import { CiboCrmPage } from "@pages/cibo/crm.page";
import { secarangOwner, secarangQuoteForm } from "@data/secarang";
import { addDays, backToCibo, ciboLookUp, day, dmy, n, needPurchase, purchase, receiptFile, receiptRaw, unblurColumn, weekWindow, type Purchase } from "./_rc";

const TAGS = (p: "@P1" | "@P2" | "@P3") => [p, "@func", "@sheet-RC"];
/** Tokio Marine transaction of 12406_RG_TS1 (17.09.2026): the STYLE reference for a Tokio Marine row (RC_TS4 E3). */
const TM_STYLE_REF = "BR69005852";
const ALLIANZ_FOUR = [
  ["allianzPurchase", "12406_E2E_TS1", "FPX Online banking"],
  ["allianzPurchase:card", "12406_E2E_TS2", "Credit or Debit Card"],
  ["allianzPurchase:grabpay", "12406_E2E_TS3", "PayLater by Grab"],
  ["allianzPurchase:shopeepay", "12406_E2E_TS4", "SPayLater"],
] as const;

interface Bought { key: string; by: string; channel: string; p: Purchase; ref: string }

const refOf = (r: CiboRow, col = TM_REF_COLUMN) => n(r[col]).split(" ")[0];
const listed = (rows: CiboRow[], col = TM_REF_COLUMN) => rows.map((r) => refOf(r, col));

/**
 * Open a module fresh from the sidebar (signed in once by ts.portal). After a CSV was shown in the tab
 * (ts.showFile) the CIBO app is gone: backToCibo() opens the dashboard again first (RC_TS4 rerun sRC-1330 stopped
 * on "CIBO sidebar dashboard" after its export; RC_TS5 E3 would have stopped the same way after its export).
 */
async function fresh(ts: TsRun, module: CiboModule) {
  await backToCibo(ts);
  await new CiboSidebar(ts.page).open(module);
}

/**
 * The four Allianz purchases of E2E_TS1..TS4 with their CIBO Ref. No. (from the hand-off, else looked up by plate +
 * Receipt No.). `all` is false when one was not handed on: a point about "the four" is then not proved.
 */
async function allianzFour(ts: TsRun): Promise<{ got: Bought[]; all: boolean; missing: string[] }> {
  const got: Bought[] = [];
  const missing: string[] = [];
  for (const [key, by, channel] of ALLIANZ_FOUR) {
    const p = purchase(ts, key);
    if (!p) { missing.push(`${by} (${channel})`); continue; }
    const ref = p.ref || (await ciboLookUp(ts, p, "Allianz", "listing")).ref || "";
    if (!ref) { missing.push(`${by} (no CIBO row found)`); continue; }
    got.push({ key, by, channel, p, ref });
  }
  return { got, all: !missing.length, missing };
}

/** Outline the rows of these refs in the visible table. */
const rowsOf = (ts: TsRun, refs: string[]): Locator[] => refs.map((r) => ts.page.locator("table tbody tr").filter({ visible: true }).filter({ hasText: r }).first());

const multiPage = (pager: string) => /\b2\b/.test(pager);
/** Transaction rows only (the "Ops, no search result found" line has no Ref. No.). */
const txRows = (rows: CiboRow[]) => rows.filter((r) => !!n(r[TM_REF_COLUMN]));

/**
 * RC_TS4: one Transaction Management search that inherits nothing. Opens the module, empties every filter and the
 * Search box (`tm.resetFilters()`: the filter state outlives a search and the sidebar link does not reset it; run
 * sRC-1330-c1 searched "Allianz only" with the step-3 Ref. No. still in the box and listed nothing), searches, then
 * reads the Insurance Company ticks and the Search box back. A tick that did not take is retried once; `took` false
 * means the search was not the one the TS step asks for, and the point it feeds is left unproved.
 */
async function searchAfresh(ts: TsRun, tm: CiboTransactionManagementPage, f: CiboTransactionFilter, label: string): Promise<{ rows: CiboRow[]; took: boolean; state: string }> {
  const norm = (v: string) => v.replace(/\s+/g, "").toLowerCase();
  for (let attempt = 1; ; attempt++) {
    await fresh(ts, "transactions");
    await tm.resetFilters();
    const rows = await tm.searchListing(f);
    const st = await tm.filterState();
    const ins = st.selects.find((s) => s.control === "insuranceComp")?.values ?? [];
    const box = st.inputs.find((i) => i.control === "search")?.value ?? "";
    const want = f.insuranceCompany ?? [];
    const insOk = ins.length === want.length && want.every((w) => ins.some((v) => norm(v) === norm(w)));
    const took = insOk && box === (f.text ?? "");
    const state = `Insurance Company ticked "${ins.join(", ") || "(none)"}", Search box "${box}"`;
    ts.note(`${label} (attempt ${attempt}): asked Insurance Company "${want.join(" + ") || "(none)"}", Search box "${f.text ?? ""}"; read back: ${state}; ${txRows(rows).length} transaction row(s)${(await tm.noResult()) ? ', "Ops, no search result found"' : ""}${took ? "" : "; THE FILTER DID NOT TAKE"}`);
    if (took || attempt >= 2) return { rows, took, state };
  }
}

/**
 * Platform values that tick their children too (knowledge/portals/cibo/portal.md: "Secarang (> Secarang only,
 * Secarang-MK)"; read back in run sRC-1545-c2: picking "Secarang" shows "Secarang, Secarang only, Secarang-MK").
 */
const PLATFORM_CHILDREN: Record<string, string[]> = { Secarang: ["Secarang only", "Secarang-MK"] };

/** dd-mm-yyyy as the CIBO date inputs show it ("Thu, 29-10-2026", run sRC-1545-c2). */
const dmyDash = (d: Date) => dmy(d).replace(/\./g, "-");

/**
 * RC_TS10: one Transaction Management search that inherits nothing and is read back IN FULL. Run sRC-1545-c2 kept
 * E2's made-up plate in the Search box for every later search (all "Ops, no search result found") and kept eAuto
 * ticked into E4 (triage 29.10.2026). So: open the module, `tm.resetFilters()` (Clear all + every chip and the
 * Search box emptied), search, then read back EVERY filter: each select holds exactly what was asked (Platform
 * "Secarang" with its two children; Date Range Type the asked one, else "Transaction Creation Date" that Clear all
 * leaves), every other select empty, the dates the asked days (else empty) and the Search box exactly `text` (else
 * empty). Retried once; `took` false means the search was not the one the TS step asks for, and the point it feeds
 * is left unproved (gate: EVIDENCE).
 */
async function searchClean(ts: TsRun, tm: CiboTransactionManagementPage, f: CiboTransactionFilter, label: string): Promise<{ rows: CiboRow[]; took: boolean; state: string }> {
  const norm = (v: string) => v.replace(/\s+/g, "").toLowerCase();
  const want: Record<string, string[]> = {
    platform: (f.platform ?? []).flatMap((p) => [p, ...(PLATFORM_CHILDREN[p] ?? [])]),
    insuranceComp: f.insuranceCompany ?? [],
    dateRange: [f.dateRangeType ?? "Transaction Creation Date"],
    status: f.status ?? [],
    jpjStatus: f.jpjStatus ?? [],
    roadTax: f.roadTax ?? [],
    discountCode: f.discountCode ?? [],
  };
  for (let attempt = 1; ; attempt++) {
    await fresh(ts, "transactions");
    await tm.resetFilters();
    const rows = await tm.searchListing(f);
    const st = await tm.filterState();
    const wrong: string[] = [];
    for (const [control, w] of Object.entries(want)) {
      const got = st.selects.find((s) => s.control === control)?.values ?? [];
      const same = got.length === w.length && w.every((v) => got.some((g) => norm(g) === norm(v)));
      if (!same) wrong.push(`${control} = ${got.join(", ") || "(empty)"} (asked ${w.join(", ") || "(empty)"})`);
    }
    const input = (c: string) => st.inputs.find((i) => i.control === c)?.value ?? "";
    for (const [control, d] of [["fromDate", f.from], ["toDate", f.till]] as const) {
      const v = input(control);
      if (d ? !v.includes(dmyDash(d)) : v !== "") wrong.push(`${control} = "${v}" (asked ${d ? dmyDash(d) : "(empty)"})`);
    }
    if (input("search") !== (f.text ?? "")) wrong.push(`Search box = "${input("search")}" (asked "${f.text ?? ""}")`);
    const took = !wrong.length;
    const state = st.selects.map((s) => `${s.control} = ${s.values.join(", ") || "(empty)"}`).concat(st.inputs.map((i) => `${i.control} = "${i.control === "search" && f.text && i.value === f.text ? "<as asked>" : i.value}"`)).join("; ");
    ts.note(`${label} (attempt ${attempt}): read back ${state}; ${txRows(rows).length} transaction row(s)${(await tm.noResult()) ? ', "Ops, no search result found"' : ""}${took ? "" : `; THE SEARCH IS NOT THE ONE ASKED: ${wrong.join("; ")}`}`);
    if (took || attempt >= 2) return { rows, took, state: took ? state : wrong.join("; ") };
  }
}

// In file order, one worker, but NOT serial: each TS reads only the hand-offs of other sheets, never another test of
// this file, so a failed TS must not skip the next ones (run sRC-1545-c2: RC_TS10 failed and Playwright skipped
// RC_TS6 in 0 ms, triage 29.10.2026). "default" keeps the order and runs the rest after a failure.
test.describe.configure({ mode: "default" });

test.describe("EAINT-12406 RC — CIBO listing and reports (CIBO staging)", () => {
  test("12406_RC_TS4 — CIBO Transaction Management: Allianz under Serba Sentral; the Allianz rows (Ins. Co. over the Serba Sentral badge, styled like Tokio Marine) and their CSV export; Lonpac / Tokio Marine unchanged", { tag: TAGS("@P2") }, async ({ ts }) => {
    test.setTimeout(30 * 60_000);
    await ts.portal("cibo", "Transaction Management: Insurance Company filter, the Allianz rows, Export");
    const tm = new CiboTransactionManagementPage(ts.page);
    const { got, all, missing } = await allianzFour(ts);

    // ---- E1: the Insurance Company filter's groups
    await fresh(ts, "transactions");
    const groups = await tm.filterGroups("insuranceComp");
    const panel = await tm.openFilter("insuranceComp");
    const serba = groups.find((g) => g.group === "Serba Sentral");
    const elsewhere = groups.filter((g) => g.group !== "Serba Sentral" && g.options.includes("Allianz")).map((g) => g.group);
    await ts.prove("E1", {
      shows: `Insurance Company filter: ${groups.map((g) => `${g.group} (${g.options.join(", ")})`).join(" · ")}`,
      match: !!serba && serba.options.includes("Allianz") && !elsewhere.length,
      hl: [panel.locator(".ng-optgroup").filter({ hasText: /^\s*Serba Sentral\s*$/ }), panel.locator(".ng-option").filter({ hasText: /^\s*Allianz\s*$/ })],
      name: "insurance-company-filter-groups",
    });
    await tm.closeFilter();

    // ---- E2: Allianz ticked (Platform Secarang, Transaction Creation Date, the purchases' days)
    const w = weekWindow(got.map((g) => g.p));
    const allianzFilter: CiboTransactionFilter = { platform: ["Secarang"], insuranceCompany: ["Allianz"], dateRangeType: "Transaction Creation Date", from: w.from, till: day(new Date()) };
    const sA = await searchAfresh(ts, tm, allianzFilter, "step 2, Allianz ticked");
    const rowsA = txRows(sA.rows);
    const pagerA = await tm.pagerText();
    const refsA = listed(rowsA);
    const nonAllianz = rowsA.filter((r) => !/^Allianz\b/.test(n(r["Ins. Co."]))).map((r) => `${refOf(r)} "${n(r["Ins. Co."])}"`);
    await tm.blurPersonalData();
    if (!all) ts.note(`E2 / E3 NOT proved: the four Allianz purchases are needed, missing ${missing.join(", ")}`);
    else if (!sA.took) ts.note(`E2 NOT proved: step 2's filter did not take (${sA.state}), so the list is not "Allianz ticked"`);
    else {
      const absent = got.filter((g) => !refsA.includes(g.ref)).map((g) => `${g.by} ${g.ref}`);
      await ts.prove("E2", {
        shows: `Allianz, Secarang, created ${dmy(w.from)} - today: ${rowsA.length} row(s)${multiPage(pagerA) ? ` (pager "${pagerA}")` : ""}; E2E_TS1..TS4 ${absent.length ? `MISSING ${absent.join(", ")}` : `all listed (${got.map((g) => g.ref).join(", ")})`}; rows of another insurer: ${nonAllianz.join(", ") || "none"}`,
        match: !absent.length && !nonAllianz.length && rowsA.length > 0,
        hl: rowsOf(ts, got.map((g) => g.ref)),
        name: "listing-allianz-ticked",
      });
    }

    // ---- E3: each new Allianz row, beside a Tokio Marine row (step 3: Allianz + TokioMarine ticked)
    const tmP = purchase(ts, "tokioMarinePurchase");
    const tmRef = tmP?.ref || TM_STYLE_REF;
    const sT = await searchAfresh(ts, tm, { insuranceCompany: ["TokioMarine"], text: tmRef }, `Tokio Marine style reference ${tmRef}`);
    const tmFound = txRows(sT.rows).some((r) => refOf(r) === tmRef);
    const tmBadges = await tm.rowBadges(tmRef);
    ts.note(`Tokio Marine style reference ${tmRef}${tmP?.ref ? " (12406_E2E_TS10)" : " (12406_RG_TS1's existing Tokio Marine transaction: E2E_TS10 handed on none)"}: ${JSON.stringify(tmBadges)}; row found: ${tmFound}`);
    if (tmFound) {
      await tm.blurPersonalData();
      await ts.shot(`tokio-marine-style-reference-${tmRef}`, `Tokio Marine row ${tmRef}: the style reference for the Allianz rows' platform and Paid badges (E3)`, rowsOf(ts, [tmRef]));
    }
    const sAT = await searchAfresh(ts, tm, { ...allianzFilter, insuranceCompany: ["Allianz", "TokioMarine"], from: tmP?.since ? day(new Date(Math.min(new Date(tmP.since).getTime(), w.from.getTime()))) : w.from }, "step 3, Allianz + TokioMarine ticked");
    const rowsAT = txRows(sAT.rows);
    const tmBeside = rowsAT.filter((r) => /^TokioMarine\b/.test(n(r["Ins. Co."]))).map((r) => refOf(r));
    ts.note(`Allianz + TokioMarine ticked: ${rowsAT.length} row(s): ${rowsAT.map((r) => `${refOf(r)} ${n(r["Ins. Co."])}`).join("; ").slice(0, 900)}; Tokio Marine rows on this screen: ${tmBeside.join(", ") || "none (the style reference is compared from its own search above)"}`);
    await tm.blurPersonalData();
    await unblurColumn(ts.page, "UCD Name");
    if (all && !sAT.took) ts.note(`E3 NOT proved: step 3's filter did not take (${sAT.state}), so the screen is not "Allianz + TokioMarine ticked"`);
    else if (all && !tmFound) ts.note(`E3 NOT proved: the Tokio Marine style reference ${tmRef} was not found, so there is no Tokio Marine row to compare the badges with`);
    else if (all) {
      const style = (b?: { cls: string; background: string; color: string }[]) => (b ?? []).map((x) => `${x.cls}|${x.background}|${x.color}`).join(";");
      const platformTm = style(tmBadges[TM_REF_COLUMN]);
      const paidTm = style(tmBadges["Payment"]);
      for (const g of got) {
        const row = rowsAT.find((r) => refOf(r) === g.ref) ?? rowsA.find((r) => refOf(r) === g.ref);
        const b = rowsAT.some((r) => refOf(r) === g.ref) ? await tm.rowBadges(g.ref) : {};
        const ins = n(row?.["Ins. Co."]);
        const agency = (b["Ins. Co."] ?? []).map((x) => `${x.text} (${x.cls})`).join(", ");
        const plat = (b[TM_REF_COLUMN] ?? []).map((x) => x.text).join(", ");
        const paid = (b["Payment"] ?? []).map((x) => x.text).join(", ");
        const ok =
          ins === "Allianz Serba Sentral" &&
          (b["Ins. Co."] ?? []).some((x) => x.text === "Serba Sentral" && /serba-sentral-badge/.test(x.cls)) &&
          plat === "Secarang" && paid === "Paid" &&
          !!platformTm && style(b[TM_REF_COLUMN]) === platformTm && !!paidTm && style(b["Payment"]) === paidTm &&
          n(row?.["UCD"]) === "-" && n(row?.["UCD Name"]) === "-";
        await ts.prove("E3", {
          shows: `${g.by} ${g.ref}: Ins. Co. "${ins}" (badge ${agency || "none"}); Ref. No. badge "${plat}", Payment badge "${paid}" (style ${style(b[TM_REF_COLUMN])} / ${style(b["Payment"])} vs Tokio Marine ${tmRef} ${platformTm} / ${paidTm}); UCD "${n(row?.["UCD"])}", UCD Name "${n(row?.["UCD Name"])}"`,
          match: ok,
          hl: rowsOf(ts, [g.ref, ...(tmBeside.includes(tmRef) ? [tmRef] : tmBeside.slice(0, 1))]),
          name: `row-${g.ref}-beside-tokio-marine`,
          expected: `${g.by}: Ins. Co. "Allianz" over "Serba Sentral"; platform and Paid badges styled like the Tokio Marine row; UCD and UCD Name "-"`,
        });
      }
    }

    // ---- E4: Allianz only again, Export, the CSV = the screen
    const sE = await searchAfresh(ts, tm, allianzFilter, "step 4, Allianz only again");
    const rowsE = txRows(sE.rows);
    const pagerE = await tm.pagerText();
    // Export only on a listing with rows: Export on "Ops, no search result found" produces no file (run sRC-1330-c1
    // waited 120 s for one). No TS covers that, so it is not a finding; E4 is left unproved.
    if (!sE.took) ts.note(`E4 NOT proved: step 4's filter did not take (${sE.state}); Export not pressed`);
    else if (!rowsE.length) ts.note(`E4 NOT proved: no rows (Allianz, Secarang, created ${dmy(w.from)} - today listed nothing${(await tm.noResult()) ? ': "Ops, no search result found"' : ""}); Export not pressed`);
    else {
      const dl = await tm.exportCsv();
      const file = await ts.download(dl, `Transaction_Management_allianz_${dmy(w.from)}-PERSONAL-DATA.csv`);
      const csv = readCiboCsv(fs.readFileSync(file, "utf8"));
      await ts.showFile(file, "Transaction Management export (Allianz, Secarang)");
      const csvRefs = csv.rows.map((r) => n(r["Transaction Ref. No."]));
      const screenRefs = listed(rowsE);
      const notInCsv = screenRefs.filter((r) => !csvRefs.includes(r));
      const notOnScreen = multiPage(pagerE) ? [] : csvRefs.filter((r) => !screenRefs.includes(r));
      const badCsv = csv.rows.filter((r) => n(r["Insurance Company"]) !== "Allianz" || n(r["Agency"]) !== "Serba Sentral").map((r) => `${n(r["Transaction Ref. No."])} "${n(r["Insurance Company"])}" / "${n(r["Agency"])}"`);
      const ours = got.filter((g) => !csvRefs.includes(g.ref)).map((g) => g.ref);
      await ts.prove("E4", {
        shows: `screen ${screenRefs.length} row(s)${multiPage(pagerE) ? ` (more pages: "${pagerE}", screen page 1 checked against the CSV)` : ""}, CSV ${csv.rows.length} row(s); on screen not in CSV: ${notInCsv.join(", ") || "none"}; in CSV not on screen: ${notOnScreen.join(", ") || "none"}; CSV rows not Allianz / Serba Sentral: ${badCsv.join(", ") || "none"}; E2E_TS1..TS4 missing from CSV: ${all ? ours.join(", ") || "none" : "(not all handed on)"}`,
        match: csv.rows.length > 0 && !notInCsv.length && !notOnScreen.length && !badCsv.length && (!all || !ours.length),
        hl: ts.page.locator("table").first(),
        name: "transaction-management-export-csv",
      });
    }

    // ---- E5: Lonpac and TokioMarine ticked: the QT_TS4 / E2E_TS10 transactions, agency Pemaju Eksklusif
    const lon = purchase(ts, "lonpacPurchase");
    if (!lon || !tmP) ts.note(`E5 NOT proved: needs 12406_QT_TS4 ("lonpacPurchase": ${lon ? "ok" : "none"}) and 12406_E2E_TS10 ("tokioMarinePurchase": ${tmP ? "ok" : "none"})`);
    else {
      for (const [ins, p, by] of [["Lonpac", lon, "12406_QT_TS4"], ["TokioMarine", tmP, "12406_E2E_TS10"]] as const) {
        const ref = p.ref || (await ciboLookUp(ts, p, ins, "listing")).ref || "";
        const s5 = await searchAfresh(ts, tm, { platform: ["Secarang"], insuranceCompany: [ins], dateRangeType: "Transaction Creation Date", from: day(new Date(p.since)), till: day(new Date()) }, `step 5, ${ins} ticked`);
        const rows = txRows(s5.rows);
        const row = rows.find((r) => refOf(r) === ref);
        if (!s5.took) { ts.note(`E5 (${ins}) NOT proved: step 5's filter did not take (${s5.state})`); continue; }
        const others = rows.filter((r) => !new RegExp(`^${ins}\\b`).test(n(r["Ins. Co."]))).length;
        await tm.blurPersonalData();
        await ts.prove("E5", {
          shows: `${ins} ticked: ${rows.length} row(s); ${by} ${ref || "(no ref)"} ${row ? `listed, Ins. Co. "${n(row["Ins. Co."])}"` : "NOT listed"}; rows of another insurer: ${others}`,
          match: !!row && n(row["Ins. Co."]) === `${ins} Pemaju Eksklusif` && !others,
          hl: ref ? rowsOf(ts, [ref]) : null,
          name: `listing-${ins.toLowerCase()}-ticked`,
          expected: `${ins} ticked: ${by}'s transaction, agency Pemaju Eksklusif`,
        });
      }
    }

    // ---- step 6 (recorded): Dashboard
    await fresh(ts, "dashboard");
    const dash = await ts.page.locator("body").innerText();
    await ts.shot("dashboard", `Dashboard (recorded): mentions Allianz: ${/allianz/i.test(dash) ? "yes" : "no"}`);
  });

  test("12406_RC_TS10 — CIBO Transaction Management with Allianz rows: search by Ref. No., plate, owner name and ID; no result; Platform; Allianz + Transaction Status; Clear all; Print of the filtered listing", { tag: TAGS("@P2") }, async ({ ts }) => {
    test.setTimeout(30 * 60_000);
    const p1 = needPurchase(ts, "allianzPurchase", "12406_E2E_TS1", "RC_TS10 searches for its transaction");
    const unpaid = purchase(ts, "allianzUnpaid");
    await ts.portal("cibo", "Transaction Management: search, filters, Clear all, Print");
    const tm = new CiboTransactionManagementPage(ts.page);
    // The filter block as Transaction Management first draws it in this tab, before any search: E5 compares every
    // control EXCEPT Date Range Type with it (on first load Date Range Type is empty; the TS's default for it is
    // "Transaction Creation Date", which is what Clear all puts there: verify run c2 29.10, run sRC-1545-c2 13-clear-all.png).
    await fresh(ts, "transactions");
    const defaults = await tm.filterState();
    if (!defaults.selects.length) throw new Error("12406_RC_TS10: Transaction Management drew no filter (no ng-select read): the default filter state could not be taken");
    const stateText = (s: typeof defaults) => [...s.selects.map((x) => `${x.control} = ${x.values.join(", ") || "(empty)"}`), ...s.inputs.map((i) => `${i.control} = "${i.value}"`)].join("; ");
    ts.note(`Transaction Management on first load: ${stateText(defaults)}`);
    const ref = p1.ref || (await ciboLookUp(ts, p1, "Allianz", "listing")).ref || "";
    if (!ref) throw new Error(`12406_RC_TS10: 12406_E2E_TS1's transaction (plate ${p1.plate}) was not found in CIBO`);
    const since = day(new Date(p1.since));
    // The searches are narrowed to Allianz and the purchase day: the made-up owner name / IC are on every purchase of
    // this ticket, so an unnarrowed search would page past it.
    const narrow: CiboTransactionFilter = { insuranceCompany: ["Allianz"], dateRangeType: "Transaction Creation Date", from: since, till: day(new Date()) };
    const noMsg = () => ts.page.getByText(/no search result found/i).filter({ visible: true }).first();
    const noMsgText = async () => ((await noMsg().count()) ? n(await noMsg().innerText()) : "");

    // ---- E1: Ref. No., plate, owner name, owner ID (v5 step 1: the ID as CIBO shows it, 999999-99-9999, and as plain digits)
    const icDigits = secarangQuoteForm(p1.plate).idNo.replace(/\D/g, "");
    const ic = icDigits.replace(/^(\d{6})(\d{2})(\d{4})$/, "$1-$2-$3");
    for (const [what, text] of [["Ref. No.", ref], ["plate", p1.plate], ["owner name", secarangOwner().name], ["owner ID", ic], ["owner ID digits", icDigits]] as const) {
      const s = await searchClean(ts, tm, { ...narrow, text }, `step 1, search by ${what}`);
      if (!s.took) { ts.note(`E1 (${what}) NOT proved: the search is not the one step 1 asks for (${s.state})`); continue; }
      const rows = txRows(s.rows);
      const hit = rows.some((r) => refOf(r) === ref);
      await tm.blurPersonalData();
      const shown = what === "owner ID" ? "<owner ID as CIBO shows it, 999999-99-9999>" : what === "owner ID digits" ? "<owner ID as plain digits, 999999999999>" : text;
      await ts.prove("E1", {
        shows: `search "${shown}" (${what}, Allianz, created ${dmy(since)} - today): ${rows.length} transaction row(s); ${ref} ${hit ? "returned" : "NOT returned"}${(await tm.noResult()) ? ' ("no search result found")' : ""}`,
        match: hit,
        hl: rowsOf(ts, [ref]),
        name: `search-by-${what.replace(/\W+/g, "-")}`,
        expected: `search by ${what} returns the E2E_TS1 transaction`,
      });
    }

    // ---- E2: a plate that does not exist
    const nowhere = `ZQ${String(Date.now()).slice(-5)}Q`;
    const s2 = await searchClean(ts, tm, { text: nowhere }, "step 2, a plate that does not exist");
    if (!s2.took) ts.note(`E2 NOT proved: the search is not the one step 2 asks for (${s2.state})`);
    else {
      const msgText = await noMsgText();
      await ts.prove("E2", { shows: `search "${nowhere}" (no such plate): ${txRows(s2.rows).length} transaction row(s); message "${msgText}"`, match: msgText === "Ops, no search result found" && !txRows(s2.rows).length, hl: noMsg(), name: "search-no-result" });
    }

    // ---- E3: Platform values; Secarang lists the Allianz transactions; Allianz + eAuto none
    await fresh(ts, "transactions");
    await tm.resetFilters();
    const platforms = await tm.filterOptions("platform");
    const panel = await tm.openFilter("platform");
    const wantPlatforms = ["Secarang", "Secarang only", "Secarang-MK", "eAuto"];
    await ts.prove("E3", { shows: `Platform offers: ${platforms.join(", ")}`, match: platforms.length === wantPlatforms.length && wantPlatforms.every((x) => platforms.includes(x)), hl: panel, name: "platform-values", expected: "Platform offers Secarang, Secarang only, Secarang-MK, eAuto" });
    await tm.closeFilter();
    const sS = await searchClean(ts, tm, { ...narrow, platform: ["Secarang"] }, "step 3, Platform Secarang + Allianz");
    if (!sS.took) ts.note(`E3 (Secarang) NOT proved: the search is not the one step 3 asks for (${sS.state})`);
    else {
      const rowsS = txRows(sS.rows);
      await tm.blurPersonalData();
      await ts.prove("E3", { shows: `Platform Secarang + Allianz (created ${dmy(since)} - today): ${rowsS.length} transaction row(s); ${ref} ${rowsS.some((r) => refOf(r) === ref) ? "listed" : "NOT listed"}`, match: rowsS.some((r) => refOf(r) === ref), hl: rowsOf(ts, [ref]), name: "platform-secarang-allianz", expected: "Secarang lists the new Allianz transactions" });
    }
    const sOnly = await searchClean(ts, tm, { ...narrow, platform: ["Secarang only"] }, "step 3, Platform Secarang only + Allianz (recorded)");
    await tm.blurPersonalData();
    await ts.shot("platform-secarang-only-allianz", `Platform "Secarang only" + Allianz (recorded): ${txRows(sOnly.rows).length} transaction row(s)${sOnly.took ? "" : `; the filter read back differently: ${sOnly.state}`}`);
    const eFrom = addDays(since, -6);
    const sE = await searchClean(ts, tm, { ...narrow, platform: ["eAuto"], from: eFrom }, "step 3, Platform eAuto + Allianz");
    if (!sE.took) ts.note(`E3 (eAuto) NOT proved: the search is not the one step 3 asks for (${sE.state})`);
    else {
      const eMsgText = await noMsgText();
      await ts.prove("E3", { shows: `Platform eAuto + Allianz (created ${dmy(eFrom)} - today): ${txRows(sE.rows).length} transaction row(s); message "${eMsgText}"`, match: !txRows(sE.rows).length && eMsgText === "Ops, no search result found", hl: noMsg(), name: "platform-eauto-allianz-none", expected: 'Allianz + eAuto gives "Ops, no search result found" (same as before the deploy)' });
    }

    // ---- E4: Allianz + Transaction Status (Insurance created: E2E_TS1; Pending payment: RC_TS9)
    if (!unpaid) ts.note('E4 NOT proved: 12406_RC_TS9 handed on no unpaid Allianz transaction ("allianzUnpaid"); run 4-secarang-unpaid-cibo.e2e.cr.spec.ts first');
    else {
      const uref = unpaid.ref || (await ciboLookUp(ts, unpaid, "Allianz", "listing")).ref || "";
      const from = day(new Date(Math.min(new Date(p1.since).getTime(), new Date(unpaid.since).getTime())));
      for (const [status, want, by] of [["Insurance created", ref, "12406_E2E_TS1"], ["Pending payment", uref, "12406_RC_TS9"]] as const) {
        const s4 = await searchClean(ts, tm, { ...narrow, from, status: [status] }, `step 4, Allianz + "${status}"`);
        if (!s4.took) { ts.note(`E4 ("${status}") NOT proved: the search is not the one step 4 asks for (${s4.state})`); continue; }
        const rows = txRows(s4.rows);
        const odd = rows.filter((r) => n(r["Transaction Status"]) !== status || !/^Allianz\b/.test(n(r["Ins. Co."]))).map((r) => `${refOf(r)} "${n(r["Ins. Co."])}" "${n(r["Transaction Status"])}"`);
        await tm.blurPersonalData();
        await ts.prove("E4", {
          shows: `Allianz + "${status}" (created ${dmy(from)} - today): ${rows.length} transaction row(s); ${by} ${want || "(no ref)"} ${rows.some((r) => refOf(r) === want) ? "listed" : "NOT listed"}; rows of another insurer or status: ${odd.join(", ") || "none"}`,
          match: !!want && rows.some((r) => refOf(r) === want) && !odd.length,
          hl: want ? rowsOf(ts, [want]) : null,
          name: `allianz-status-${status.replace(/\W+/g, "-").toLowerCase()}`,
          expected: `Allianz + Transaction Status "${status}": only Allianz rows with that status, ${by} among them`,
        });
      }
    }
    // Step 4's third search: Allianz ticked + Discount Code filter "Included". The filter offers only "Included" /
    // "Exempted", not the code itself (read-only probe rc-tm-discount-print11.mjs, 29.10.2026; run 0040-C-c2
    // 14-discount-code-filter-values.png); TS v6c step 4 reads "Included" (decided 30.10 under Azfar's full permission,
    // main session). E4's expected result says nothing about it, so it is RECORDED (screenshot + note), never a proof:
    // whether E2E_TS2's row (code RJC7) is listed and what every listed row's Discount Code reads.
    const p2 = purchase(ts, "allianzPurchase:card");
    if (!p2) ts.note("step 4, + Discount Code 'Included': not recorded (12406_E2E_TS2 handed on no purchase)");
    else {
      const ref2 = p2.ref || (await ciboLookUp(ts, p2, "Allianz", "listing")).ref || "";
      const s4d = await searchClean(ts, tm, { ...narrow, from: day(new Date(Math.min(new Date(p1.since).getTime(), new Date(p2.since).getTime()))), discountCode: ["Included"] }, `step 4, Allianz + Discount Code "Included"`);
      const rowsD = txRows(s4d.rows);
      const row2 = rowsD.find((r) => refOf(r) === ref2);
      const codes = [...new Set(rowsD.map((r) => n(r["Discount Code"]) || "(empty)"))];
      await tm.blurPersonalData();
      await ts.shot("allianz-discount-code-included", `Allianz + Discount Code "Included" (recorded): ${rowsD.length} row(s); 12406_E2E_TS2 ${ref2 || "(no ref)"} ${row2 ? `listed, Discount Code "${n(row2["Discount Code"])}"` : "NOT listed"}`, ref2 && row2 ? rowsOf(ts, [ref2]) : null);
      ts.note(`step 4, Allianz + Discount Code "Included" (recorded, no expected point)${s4d.took ? "" : ` — the filter read back differently: ${s4d.state}`}: ${rowsD.length} transaction row(s); 12406_E2E_TS2 ${ref2 || "(no ref)"} ${row2 ? "listed" : "NOT listed"}; Discount Code values on the listed rows: ${codes.join(", ") || "none"}`);
    }

    // ---- E5: Clear all sets every filter back to its default (Date Range Type "Transaction Creation Date") and
    //      empties the search box; Print opens a print view of the listing
    const s5 = await searchClean(ts, tm, { ...narrow, platform: ["Secarang"], status: ["Insurance created"], text: ref }, "step 5, filters filled before Clear all");
    const filled = await tm.filterState();
    ts.note(`before Clear all: ${stateText(filled)}${s5.took ? "" : ` (read back differently from what was asked: ${s5.state})`}`);
    await tm.clearAll();
    const st = await tm.filterState();
    const sel = (s: typeof st, c: string) => s.selects.find((x) => x.control === c)?.values ?? [];
    const inp = (s: typeof st, c: string) => s.inputs.find((x) => x.control === c)?.value;
    // Every select other than Date Range Type back to its first-load value (all empty on first load) and every input
    // (dates, Search box) back to its first-load value; Date Range Type = the TS's default "Transaction Creation Date"
    const notDefault = [
      ...[...new Set([...defaults.selects, ...st.selects].map((x) => x.control))].filter((c) => c !== "dateRange" && sel(st, c).join("|") !== sel(defaults, c).join("|")).map((c) => `${c} = ${sel(st, c).join(", ") || "(empty)"} (on load: ${sel(defaults, c).join(", ") || "(empty)"})`),
      ...[...new Set([...defaults.inputs, ...st.inputs].map((x) => x.control))].filter((c) => (inp(st, c) ?? "") !== (inp(defaults, c) ?? "")).map((c) => `${c} = "${inp(st, c) ?? ""}" (on load: "${inp(defaults, c) ?? ""}")`),
    ];
    const dateRange = sel(st, "dateRange");
    const searchBox = inp(st, "search");
    const wasFilled = filled.selects.some((x) => x.control !== "dateRange" && x.values.length > 0) && !!inp(filled, "search");
    const clearOk = dateRange.length === 1 && dateRange[0] === "Transaction Creation Date" && searchBox === "" && !notDefault.length;
    const clearWords = `Clear all: ${stateText(st)}. Date Range Type "${dateRange.join(", ")}"; search box "${searchBox ?? "(not found)"}"; other filters not back to their first-load value: ${notDefault.join("; ") || "none"}`;
    const clearHl = [ts.page.locator("ng-select[formcontrolname=dateRange]").first(), ts.page.locator("input[formcontrolname=search]").first(), tm.clearAllButton()];
    // E5 is Clear all AND Print. Clear all alone NEVER proves it (run 0040-C-c2 filed E5 proved from the Clear all
    // line while Print was never tried, evidence review 30.10.2026). So: a Clear all that does not match is proved at
    // once (a mismatch is a defect whatever Print does); one that matches is a screenshot + note, and E5 is proved
    // only below, once Print was done, with both halves in its match. Clear all on an empty filter tests nothing:
    // E5 is then left unproved.
    let clearHalf: "ok" | "bad" | "untested";
    if (!wasFilled) {
      clearHalf = "untested";
      ts.note(`E5 NOT proved: BEFORE Clear all nothing was filled (${stateText(filled)}), so Clear all was not tested`);
      await ts.shot("clear-all", `Clear all (NOT counted: nothing was filled before it): ${clearWords}`.slice(0, 160), clearHl);
    } else if (!clearOk) {
      clearHalf = "bad";
      await ts.prove("E5", {
        shows: `after ${clearWords}`,
        match: false,
        hl: clearHl,
        name: "clear-all",
        expected: "Clear all sets every filter back to its default (Date Range Type 'Transaction Creation Date') and empties the search box (same as before the deploy)",
      });
    } else {
      clearHalf = "ok";
      await ts.shot("clear-all", `E5 Clear all half (matches; E5 counted only with the Print half): ${clearWords}`.slice(0, 160), clearHl);
      ts.note(`E5 Clear all half matches, NOT counted on its own (E5 also needs Print): after ${clearWords}`);
    }
    // Print (TS v6c step 5): on the FILTERED listing, Allianz + the date range of the E2E_TS1–TS4 purchases handed on
    // (Transaction Creation Date, the first purchase's day - the last one's). "Today" listed nothing when the purchases
    // were made on an earlier day (run 0040-C-c2, 30.10.2026: purchases of 29.10), so Print was never tried. Nothing is
    // printed or recorded for the whole unfiltered listing (29.10: its fetch answered HTTP 404 after 124 s; not a 12406
    // change, noted for Dev). Print fetches the whole filtered listing without paging (POST …/main-page), fills the
    // `.d-print-block` layout and calls window.print(): wait for that call, up to 4 minutes (read-only probes
    // rc-tm-print-after-clear12.mjs and rc-tm-discount-print11.mjs 29.10.2026). Every Ref. No. listed on screen, and
    // every handed-on E2E_TS1–TS4 Ref. No., must be in the print.
    const four = ALLIANZ_FOUR.map(([key, by]) => ({ by, p: purchase(ts, key) }));
    const gotFour = four.filter((x): x is { by: (typeof ALLIANZ_FOUR)[number][1]; p: Purchase } => !!x.p);
    const missingFour = four.filter((x) => !x.p).map((x) => x.by);
    const today = day(new Date());
    const startDays = gotFour.map((x) => day(new Date(x.p.since))).filter((d) => !Number.isNaN(d.getTime()));
    const endDays = gotFour.map((x) => day(new Date(x.p.at ?? x.p.since))).filter((d) => !Number.isNaN(d.getTime()));
    const pFrom = startDays.length ? new Date(Math.min(...startDays.map((d) => d.getTime()))) : undefined;
    const lastDay = endDays.length ? new Date(Math.max(...endDays.map((d) => d.getTime()))) : undefined;
    const pTill = lastDay && lastDay < today ? lastDay : today;
    const fourRefs = gotFour.map((x) => ({ by: x.by, ref: x.p.ref || "" })).filter((x) => x.ref);
    const answersText = (a?: { url: string; status: number; afterMs: number }[]) => (a ?? []).filter((x) => /main-page/.test(x.url)).map((x) => `${x.url.replace(/^.*\/cibo\//, "")} HTTP ${x.status} after ${Math.round(x.afterMs / 1000)} s`).join(", ") || "none";
    if (missingFour.length) ts.note(`step 5 Print: not handed on: ${missingFour.join(", ")}; the date range is taken from the others`);
    if (clearHalf !== "ok") ts.note(`E5 (Print) still done and recorded, but E5 is ${clearHalf === "bad" ? "already a mismatch (Clear all)" : "not counted (Clear all not tested)"}`);
    if (!pFrom) ts.note("E5 NOT proved: none of E2E_TS1–TS4 handed on a purchase, so there is no date range to filter for Print (run sheet E2E first)");
    else {
      const range = `${dmy(pFrom)} - ${dmy(pTill)}`;
      const sP = await searchClean(ts, tm, { insuranceCompany: ["Allianz"], dateRangeType: "Transaction Creation Date", from: pFrom, till: pTill }, `step 5, the filtered listing to Print (Allianz, ${range})`);
      const listedRefs = listed(txRows(sP.rows));
      const pagerP = await tm.pagerText();
      await tm.blurPersonalData();
      if (!sP.took) ts.note(`E5 NOT proved: the filtered search for Print is not the one step 5 asks for (${sP.state})`);
      else if (!listedRefs.length) ts.note(`E5 NOT proved: the filtered listing (Allianz, ${range}) holds no transaction to print${(await tm.noResult()) ? ' ("Ops, no search result found")' : ""}`);
      else {
        await ts.shot("print-filtered-listing", `step 5: Allianz, Transaction Creation Date ${range}: ${listedRefs.length} row(s) on screen${multiPage(pagerP) ? ` (pager "${pagerP}")` : ""}, before Print`, ts.page.locator("table").first());
        const pv = await tm.printView({ waitForPrintMs: 240_000 });
        const table = ts.page.locator("table").filter({ visible: true }).first();
        const tableRows = (await table.count()) ? await table.locator("tbody tr").count() : 0;
        // The print layout's own text (`.d-print-block`, rc-cibo-markup / probe rc-tm-discount-print11.mjs), else the visible table
        const blocks = await ts.page.locator(".d-print-block").allTextContents().catch(() => [] as string[]);
        const printedText = n(blocks.join(" ")) || ((await table.count()) ? n(await table.innerText()) : "");
        const missing = listedRefs.filter((r) => !printedText.includes(r));
        const fourMissing = fourRefs.filter((x) => !printedText.includes(x.ref)).map((x) => `${x.by} ${x.ref}`);
        const sidebarHidden = !(await ts.page.locator("nav.sidebar").filter({ visible: true }).count());
        const printOk = pv.printCalls > 0 && tableRows > 0 && !missing.length && !fourMissing.length;
        if (clearHalf === "untested") {
          await ts.shot("print-view-filtered", `Print (recorded, E5 not counted: Clear all not tested): print called ${pv.printCalls}x; listed not printed: ${missing.join(", ") || "none"}`.slice(0, 160), table);
          ts.note(`E5 Print half (recorded, not counted): print called ${pv.printCalls} time(s); fetch ${answersText(pv.answers)}; table ${tableRows} row(s); listed not in the print: ${missing.join(", ") || "none"}; E2E_TS1–TS4 not in the print: ${fourMissing.join(", ") || "none"}`);
        } else {
          await ts.prove("E5", {
            shows: `${clearHalf === "ok" ? "Clear all half matches (see clear-all screenshot)" : "Clear all half DOES NOT MATCH (proved above)"}; Print on the filtered listing (Allianz, Transaction Creation Date ${range}, the E2E_TS1–TS4 purchases' days: ${listedRefs.length} transaction(s) on screen${multiPage(pagerP) ? `, pager "${pagerP}"` : ""}): browser print called ${pv.printCalls} time(s) within ${Math.round((pv.waitedMs ?? 0) / 1000)} s of the click; listing fetch for Print: ${answersText(pv.answers)}; page as printed (print CSS): listing table ${tableRows ? `shown, ${tableRows} row(s)` : "NOT shown"}; Ref. No. listed on screen not in the print: ${missing.join(", ") || "none"}; E2E_TS1–TS4 (${fourRefs.map((x) => x.ref).join(", ") || "no refs handed on"}) not in the print: ${fourMissing.join(", ") || "none"}; sidebar ${sidebarHidden ? "hidden" : "shown"}`,
            match: clearHalf === "ok" && printOk,
            hl: table,
            name: "print-view-filtered",
            expected: "Clear all sets every filter back to its default (Date Range Type 'Transaction Creation Date') and empties the search box; Print on the filtered listing (Allianz, the date range of the E2E_TS1–TS4 purchases) opens a print view of that listing",
          });
        }
        await tm.endPrintView();
      }
    }
  });

  test("12406_RC_TS5 — CIBO Payment Report: the Allianz payments under agency Serba Sentral and in the export; Payment Management: each under its own channel", { tag: TAGS("@P2") }, async ({ ts }) => {
    test.setTimeout(35 * 60_000);
    await ts.portal("cibo", "Payment Report (Allianz, one week) and Payment Management (by channel)");
    const { got, all, missing } = await allianzFour(ts);
    const w = weekWindow(got.map((g) => g.p));
    const pr = new CiboPaymentReportPage(ts.page);

    // ---- E1: Payment Report, Platform Secarang, Allianz (under Serba Sentral, not the group), one week
    await fresh(ts, "paymentReport");
    const { summary, rows } = await pr.searchReport({ platform: ["Secarang"], insuranceCompany: ["Allianz"], from: w.from, till: w.till });
    const pager = await pr.pagerText();
    const refs = listed(rows, "Reference No");
    await pr.blurPersonalData();
    if (!all) ts.note(`E1 NOT proved: the four Allianz payments are needed, missing ${missing.join(", ")}`);
    else {
      const bad = got.map((g) => ({ g, row: rows.find((r) => refOf(r, "Reference No") === g.ref) })).filter(({ row }) => !row || n(row["Insurance Company"]) !== "Allianz Serba Sentral");
      await ts.prove("E1", {
        shows: `Payment Report ${summary.period || `${dmy(w.from)} - ${dmy(w.till)}`}: ${rows.length} row(s)${multiPage(pager) ? ` (pager "${pager}")` : ""}; ${got.map((g) => { const r = rows.find((x) => refOf(x, "Reference No") === g.ref); return `${g.by} ${g.ref}: ${r ? `"${n(r["Insurance Company"])}"` : "NOT listed"}`; }).join("; ")}`,
        match: !bad.length,
        hl: rowsOf(ts, got.map((g) => g.ref)),
        name: "payment-report-allianz-serba-sentral",
      });
    }

    // ---- E2: Export = the screen; amounts recorded beside the receipts (Q16)
    const dl = await pr.exportCsv();
    const file = await ts.download(dl, `Payment_Report_allianz_${dmy(w.from)}-PERSONAL-DATA.csv`);
    const csv = readCiboCsv(fs.readFileSync(file, "utf8"));
    await ts.showFile(file, "Payment Report export (Allianz, Secarang)");
    const csvRefs = csv.rows.map((r) => n(r["Transaction Ref. No."]));
    const notInCsv = refs.filter((r) => !csvRefs.includes(r));
    const notOnScreen = multiPage(pager) ? [] : csvRefs.filter((r) => !refs.includes(r));
    const badCsv = csv.rows.filter((r) => n(r["Insurance Company"]) !== "Allianz" || n(r["Agency"]) !== "Serba Sentral").map((r) => n(r["Transaction Ref. No."]));
    await ts.prove("E2", {
      shows: `screen ${refs.length} row(s), export ${csv.rows.length}; on screen not in export: ${notInCsv.join(", ") || "none"}; in export not on screen: ${notOnScreen.join(", ") || "none"}; export rows not Allianz / Serba Sentral: ${badCsv.join(", ") || "none"}`,
      match: refs.length > 0 && !notInCsv.length && !notOnScreen.length && !badCsv.length,
      hl: ts.page.locator("table").first(),
      name: "payment-report-export",
    });
    for (const g of got) {
      const r = csv.rows.find((x) => n(x["Transaction Ref. No."]) === g.ref);
      ts.note(`Q16 (recorded) ${g.by} ${g.ref}: Payment Report Total Premium ${r?.["Total Premium (RM)"] ?? "-"}, Payment Amount ${r?.["Payment Amount (RM)"] ?? "-"}, Insurance Commission ${r?.["Insurance Commission Amount (RM)"] ?? "-"}, Discount Code ${r?.["Discount Code"] ?? "-"}`);
    }

    // ---- E3: Payment Management, each payment under its own channel
    const CHANNEL: Record<string, { group: string; option?: string }[]> = {
      "FPX Online banking": [{ group: "FPX Online Banking" }],
      "Credit or Debit Card": [{ group: "Credit / Debit Card" }],
      "PayLater by Grab": [{ group: "Fiuu - eWallet", option: "GrabPay - PayLater by Grab" }, { group: "Fiuu - eWallet", option: "GrabPay" }],
      SPayLater: [{ group: "Fiuu - eWallet", option: "ShopeePay" }],
    };
    if (!all) ts.note(`E3 NOT proved: the four Allianz payments are needed, missing ${missing.join(", ")}`);
    else {
      const pm = new CiboPaymentManagementPage(ts.page);
      const today = day(new Date());
      for (const g of got) {
        const paid = day(new Date(g.p.since));
        // Till = today: the Till calendar greys out future days, and a click on one waited 90 s and timed out (run
        // sRC-1545-c1, Till 30.10 on 29.10; triage 29.10.2026: "use today"). From = the payment day, so the window
        // still holds the payment; the search is by its Ref. No. as well.
        const till = today;
        let found: { opt: string; row: CiboRow } | undefined;
        const tried: string[] = [];
        for (const c of CHANNEL[g.channel]) {
          await fresh(ts, "payments");
          const rows = await pm.searchListing({ channelIn: [c], from: paid, till, text: g.ref });
          const row = rows.find((r) => refOf(r) === g.ref);
          const opt = `${c.group}${c.option ? ` > ${c.option}` : ""}`;
          tried.push(`${opt}: ${row ? "found" : "not found"}`);
          if (row) { found = { opt, row }; break; }
        }
        await pm.blurPersonalData();
        await ts.prove("E3", {
          shows: `${g.by} ${g.ref} (${g.channel}): ${tried.join("; ")}${found ? `; Payment Channel "${n(found.row["Payment Channel"])}", Payment Ref ID "${n(found.row["Payment Ref ID"])}"` : ""}`,
          match: !!found,
          hl: rowsOf(ts, [g.ref]),
          name: `payment-management-${g.channel.replace(/\W+/g, "-").toLowerCase()}`,
          expected: `${g.by}'s payment under its own channel (${g.channel})${g.channel === "PayLater by Grab" ? "; which GrabPay option recorded" : ""}`,
        });
      }
    }
  });

  test("12406_RC_TS6 — CIBO Commission Report: the Allianz purchase with a discount code under Serba Sentral with its commission, those without a code not listed; the export holds the same rows", { tag: TAGS("@P2") }, async ({ ts }) => {
    test.setTimeout(20 * 60_000);
    await ts.portal("cibo", "Commission Report (Platform Secarang, Allianz, one week)");
    const { got, all, missing } = await allianzFour(ts);
    const w = weekWindow(got.map((g) => g.p));
    const cr = new CiboCommissionReportPage(ts.page);
    await fresh(ts, "commissionReport");
    const { summary, rows } = await cr.searchReport({ platform: ["Secarang"], insuranceCompany: ["Allianz"], from: w.from, till: w.till });
    const pager = await cr.pagerText();
    await cr.blurPersonalData();
    // Commission % (recorded, Q16): Commission (RM) ÷ Gross (RM), worked out here (the report shows amounts only)
    const pct = (r: CiboRow) => { const c = Number(n(r["Commission (RM)"]).replace(/[^\d.]/g, "")); const g = Number(n(r["Gross (RM)"]).replace(/[^\d.]/g, "")); return g > 0 && !Number.isNaN(c) ? `${((c / g) * 100).toFixed(2)}%` : "-"; };
    for (const r of rows) ts.note(`commission (recorded, Q16) ${refOf(r, "Reference No.")}: Commission ${n(r["Commission (RM)"])} (${pct(r)} of Gross, worked out), Discount ${n(r["Discount (RM)"])}, Gross ${n(r["Gross (RM)"])}`);
    // TS v6 E1: the Commission Report lists only transactions WITH a discount code. E2E_TS2 (code RJC7) is listed under
    // Serba Sentral with its commission; E2E_TS1, TS3, TS4 (no code) are NOT listed.
    const withCode = got.find((g) => g.key === "allianzPurchase:card");
    const noCode = got.filter((g) => g.key !== "allianzPurchase:card");
    if (!all || !withCode) ts.note(`E1 NOT proved: the four Allianz transactions are needed (E2E_TS2 with the code, TS1 / TS3 / TS4 without), missing ${missing.join(", ") || "E2E_TS2"}`);
    else if (multiPage(pager)) ts.note(`E1 NOT proved: the report runs over more than one page ("${pager}"), so "not listed" cannot be read from page 1; narrow the window`);
    else {
      const r2 = rows.find((x) => refOf(x, "Reference No.") === withCode.ref);
      const commission = r2 ? n(r2["Commission (RM)"]) : "";
      const listedNoCode = noCode.filter((g) => rows.some((x) => refOf(x, "Reference No.") === g.ref));
      await ts.prove("E1", {
        shows: `Commission Report ${summary.period || `${dmy(w.from)} - ${dmy(w.till)}`}: ${rows.length} row(s)${multiPage(pager) ? ` (pager "${pager}")` : ""}; ${withCode.by} ${withCode.ref} (code ${r2 ? n(r2["Discount (RM)"]).replace(/^[\d.,\s]+/, "") || "?" : "-"}): ${r2 ? `"${n(r2["Insurance Company"])}", Commission "${commission}" (${pct(r2)}, recorded)` : "NOT listed"}; without a code: ${noCode.map((g) => `${g.by} ${g.ref} ${rows.some((x) => refOf(x, "Reference No.") === g.ref) ? "LISTED" : "not listed"}`).join(", ")}`,
        match: !!r2 && n(r2["Insurance Company"]) === "Allianz Serba Sentral" && /^-?[\d,]+\.\d{2}$/.test(commission.replace(/^RM\s?/, "")) && !listedNoCode.length,
        hl: rowsOf(ts, [withCode.ref, ...listedNoCode.map((g) => g.ref)]),
        name: "commission-report-discount-code-only",
        expected: "the E2E_TS2 purchase (RJC7) under Serba Sentral with its commission; E2E_TS1, TS3, TS4 (no code) not listed; commission % recorded",
      });
    }
    // ---- E2: the export (a payout file: "Recipient Reference" = "<plate>-ALLIANZ") holds the same rows
    if (!rows.length) ts.note("E2 NOT proved: the Commission Report lists no row for this window, so there is nothing to compare (and Export is not offered)");
    else {
      const dl = await cr.exportCsv();
      const file = await ts.download(dl, `Commission_Report_allianz_${dmy(w.from)}-PERSONAL-DATA.csv`);
      const csv = readCiboCsv(fs.readFileSync(file, "utf8"));
      await ts.showFile(file, "Commission Report export (Allianz, Secarang)");
      // The export ends with a total line: empty "#", empty Recipient Reference, only the amount ("0.00"). It is not a
      // transaction, so it is not counted (run eaint-12406-retest-sretest-20261030-0040-C-c1, 30.10.2026: the export
      // held the 2 listed rows "1", "2" + that line and was counted as 3). Only DATA rows are counted: a row numbered in
      // "#" (1, 2, …). The blank totals line is set aside; any other line that is neither (no number, but some other
      // value filled) is reported and fails the point, so a broken export is not hidden by the filter.
      const isData = (r: CiboRow) => /^\d+$/.test(n(r["#"]));
      const isTotal = (r: CiboRow) => !n(r["#"]) && !n(r["Recipient Reference"]);
      const txRows = csv.rows.filter(isData);
      const totals = csv.rows.filter(isTotal).length;
      const oddLines = csv.rows.filter((r) => !isData(r) && !isTotal(r)).map((r) => `"#" "${n(r["#"])}" / Recipient Reference "${n(r["Recipient Reference"])}"`);
      const csvRefs = txRows.map((r) => n(r["Recipient Reference"]).toUpperCase());
      const screen = rows.map((r) => `${n(r["Vehicle No."]).split(" ")[0].toUpperCase()}-ALLIANZ`);
      const notInCsv = screen.filter((s) => !csvRefs.includes(s));
      const countOk = multiPage(pager) ? txRows.length >= rows.length : txRows.length === rows.length;
      await ts.prove("E2", {
        shows: `screen ${rows.length} row(s)${multiPage(pager) ? ` (more pages: "${pager}")` : ""}, export ${txRows.length} data row(s) (numbered in "#")${totals ? ` + ${totals} totals line(s) (no "#", no Recipient Reference; not counted)` : ""}${oddLines.length ? `; OTHER lines neither data nor totals: ${oddLines.join(", ")}` : ""}; screen rows (as "<plate>-ALLIANZ") not in the export's Recipient Reference: ${notInCsv.join(", ") || "none"}`,
        match: !notInCsv.length && countOk && !oddLines.length && txRows.length > 0,
        hl: ts.page.locator("table").first(),
        name: "commission-report-export",
      });
    }
  });

  // TS v6 (29.10.2026 evening, approved; RECORDED points, SRD silent, Q43): CIBO > CRM, read only. Never pressed: Edit,
  // Duplicate, Save Update, Send quotation link. Read-only probe 03-spec/probes-author/crm-record18.mjs (29.10): the
  // listing's Search box finds a customer by plate (Vehicle "HXA0011A", Ownership Type "Private", Latest Coverage Period
  // "11-11-2026 - 10-11-2027"); Customer Details holds one card per vehicle: header `div.row.align-items-end` "<plate>
  // <model>" with Edit / Duplicate, inside `div.col` with Plate No … Latest Policy Purchase, Latest Policy Coverage
  // Period, Email, Mobile Phone No, Correspondence Address, Last Updated By. The QA's own e-mail / phone are blurred
  // before each screenshot; the video is personal data.
  test("12406_RC_TS11 — CIBO CRM: the record of the E2E_TS1 owner and the vehicle card of its plate (recorded); the QT_TS4 Lonpac buyer beside it", { tag: TAGS("@P2") }, async ({ ts }) => {
    test.setTimeout(20 * 60_000);
    const p1 = needPurchase(ts, "allianzPurchase", "12406_E2E_TS1", "RC_TS11 looks its owner and vehicle up in CRM");
    const lonpac = purchase(ts, "lonpacPurchase");
    await ts.portal("cibo", "CRM: the E2E_TS1 owner and the vehicle card of its plate (read only)");
    const crm = new CiboCrmPage(ts.page);
    const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    /** The end of the new cover, from the Secarang receipt's Coverage Period ("11 NOV 2026 - 10 NOV 2027"). */
    const coverEnd = (p: Purchase): Date | undefined => {
      const f = receiptFile(p);
      const m = f ? /\d{1,2} [A-Z]{3} \d{4} - (\d{1,2}) ([A-Z]{3}) (\d{4})/.exec(receiptRaw(f)) : null;
      return m && MONTHS.includes(m[2]) ? new Date(Number(m[3]), MONTHS.indexOf(m[2]), Number(m[1])) : undefined;
    };
    /** Blur the QA's own contact details on the CRM pages (style only). */
    const blurContacts = () => ts.page.evaluate(() => {
      const ths = Array.from(document.querySelectorAll("table thead th")).map((t) => (t as HTMLElement).innerText.replace(/\s+/g, " ").trim());
      for (const col of ["Insured", "Contact Details"]) {
        const i = ths.indexOf(col);
        if (i >= 0) document.querySelectorAll("table tbody tr").forEach((tr) => { const td = tr.children[i] as HTMLElement | undefined; if (td) td.style.filter = "blur(7px)"; });
      }
      document.querySelectorAll("body *").forEach((e) => {
        if (e.children.length === 0 && /^(Email|Mobile Phone No|Correspondence Address|ID No|IC No|Full Name)$/.test((e.textContent || "").trim())) {
          const v = e.nextElementSibling as HTMLElement | null;
          if (v) v.style.filter = "blur(7px)";
        }
      });
    });
    /** One buyer: the CRM row found by plate (Private, coverage ending around the new cover's end), then its vehicle card. */
    const lookUp = async (point: "E1" | "E2", who: string, p: Purchase) => {
      const end = coverEnd(p);
      await fresh(ts, "crm");
      let rows: CiboRow[] = [];
      let how = "";
      try {
        rows = await crm.searchListing({ ownershipType: ["Private"], ...(end ? { from: addDays(end, -7), till: addDays(end, 7) } : {}), text: p.plate });
        how = `Ownership Type Private, Latest Coverage Expires ${end ? `${dmy(addDays(end, -7))} - ${dmy(addDays(end, 7))}` : "(no cover end read from the receipt: not set)"}, search "${p.plate}"`;
      } catch (e) {
        ts.note(`${point}: the search with the coverage dates failed (${String(e).split("\n")[0].slice(0, 160)}); searched again by Ownership Type and plate only`);
        await fresh(ts, "crm");
        rows = await crm.searchListing({ ownershipType: ["Private"], text: p.plate });
        how = `Ownership Type Private, search "${p.plate}" (no dates)`;
      }
      const i = rows.findIndex((r) => n(r["Vehicle"]).toUpperCase().includes(p.plate.toUpperCase()));
      const r = i >= 0 ? rows[i] : undefined;
      await blurContacts();
      await ts.prove(point, {
        shows: `CRM listing (${how}): ${rows.filter((x) => n(x["Vehicle"])).length} row(s); ${who} (${p.plate}): ${r ? `Vehicle "${n(r["Vehicle"])}", Ownership Type "${n(r["Ownership Type"])}", Latest Coverage Period "${n(r["Latest Coverage Period"])}", Last Update "${n(r["Last Update"])}"` : "NOT found"} (recorded, Q43)`,
        match: !!r,
        hl: r ? ts.page.locator("table tbody tr").filter({ visible: true }).filter({ hasText: p.plate }).first() : null,
        name: `crm-row-${p.plate.toLowerCase()}`,
        expected: `recorded: the CRM record of ${who}`,
      });
      if (!r) return;
      await crm.openCustomer(i);
      const head = await crm.readCustomer();
      ts.note(`${point}: Customer Details: ${head.vehicleCards} vehicle card(s) for this ID (recorded)`);
      const esc = p.plate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const card = ts.page.locator("div.row.align-items-end").filter({ hasText: new RegExp(`^\\s*${esc}\\b`) }).first().locator("xpath=..");
      const text = (await card.count()) ? n(await card.innerText()) : "";
      const val = (label: string) => (new RegExp(`${label}\\s+(.+?)(?=\\s+(Send quotation link|Email|Mobile Phone No|Correspondence Address|Last Updated By|Latest Policy)|$)`).exec(text) || ["", ""])[1].trim();
      await card.scrollIntoViewIfNeeded().catch(() => undefined);
      await blurContacts();
      await ts.prove(point, {
        shows: text ? `vehicle card ${p.plate}: Latest Policy Purchase "${val("Latest Policy Purchase")}", Latest Policy Coverage Period "${val("Latest Policy Coverage Period")}", Last Updated By "${(/Last Updated By\s+(.*)$/.exec(text) || ["", ""])[1].trim()}" (recorded, Q43)` : `Customer Details: no vehicle card for ${p.plate}`,
        match: !!text,
        hl: card,
        name: `crm-vehicle-card-${p.plate.toLowerCase()}`,
        expected: `recorded: the vehicle card of ${p.plate} (latest policy purchase, coverage period, Last Updated By)`,
      });
    };
    await lookUp("E1", "the Allianz buyer of 12406_E2E_TS1", p1);
    if (!lonpac) ts.note('E2 NOT proved: 12406_QT_TS4 (the Lonpac purchase, "lonpacPurchase") has not run yet: it waits for Dev\'s simulator set-up (Q12). Run QT_TS4, then this TS again');
    else await lookUp("E2", "the Lonpac buyer of 12406_QT_TS4", lonpac);
  });
});
