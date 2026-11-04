// A TOOL. EAINT-12403 POST-PUSH runs, and their dry runs.
//
//   dry run (default): read-only against the seeds; evidence -> 05-evidence/_dryrun/
//   POST_PUSH=1      : after Dev's push + reset; evidence -> 05-evidence/post-push/<TS>/
//
// Guards (eaint-12403-lib.ts): nothing on the Dev reset list is paid / reset
// outside POST_PUSH=1, and even then only when Step 5 shows the expected NEW
// amount. eSim flips touch only our records and always flip back to IF.
//
//   RECORD=1 TEST_ENV=preprod1 [POST_PUSH=1] npx playwright test --project=explore --grep "12403 post — reset check"
//   ... POST_RESUBMIT="12403_STMS_PAY1:OQ000002:S694494103:stms:ucdE2E:OQ:37.00" --grep "12403 post — resubmit and pay"
//   ... POST_BO_RESET="<ts>:<vehicle>:<tx>:<stms|apt>" --grep "12403 post — BO reset"
//   ... POST_DOCS="<ts>:<vehicle>:<stms|apt>" --grep "12403 post — documents"
//   ... --grep "12403 post — reports" | "12403 post — UI" | "12403 post — reset population" | "12403 post — reset payment report"
//   ... --grep "12403 post — throwaway"      (dry run of BO Reset -> Resubmit -> pay, on a fresh OU vehicle)

import { test } from "@fixtures";
import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { runStmsFlow, closeStmsFlow } from "@flows/stms.flow";
import { StmsWizardPage } from "@pages/ucd/stms-wizard.page";
import type { PersonaKey } from "@config/personas";
import { nextVehicleNumber, nextMobile, nextEmail, randomEngineNo, randomChassisNo } from "@data/generator";
import { UcdHomePage, UCD_MENU } from "@pages/ucd/ucd-home.page";
import { CARDS } from "@data/cards";
import type { CardLike } from "@pages/wizard.page";
import type { MyKadClient } from "@fixtures/mykad";
import {
  EVID, PRE, POST_PUSH, Shots, record, saveVideo, touched, paymentSummary, totalOf, home, confirmDialog, shootStep5,
  boPage, rowFor, ucdListing, boListing, highlight, highlightRowCells, clearHighlights, UCD_COLS, BO_COLS,
  devList, onDevList, withRhbOk, mayPay, text, clean, highlightText, withSabah,
} from "./eaint-12403-lib";

test.describe("12403 post", () => {
  test.setTimeout(25 * 60 * 1000);
  test.beforeEach(() => touched.clear());
  test.afterEach(async ({ page }) => { await saveVideo(page); });

  // ---------------------------------------------------------------- 1. reset check (all 31)
  test("12403 post — reset check", async ({ page, ucdSession, browser }) => {
    const BASE = path.join(PRE, "reset-check-baseline.json");
    const items = devList();
    const base: Record<string, Record<string, string> | null> = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, "utf8")) : {};
    const now: Record<string, Record<string, string> | null> = {};
    await ucdSession("ucdE2E");
    const { bo, close } = await boPage(browser);
    const lines: string[] = ["| TS | Vehicle / Tx | Expected | Before (Payment / Tx) | Now (Payment / Tx / Reset link) | Verdict |", "|---|---|---|---|---|---|"];
    try {
      for (const it of items) {
        const shots = new Shots(it.ts || "12403_UNMAPPED", "reset-check");
        let row: Record<string, string> | null;
        if (it.tx.startsWith("E")) {
          await ucdListing(page, "estm", it.vehicle);
          row = await rowFor(page, it.vehicle, it.tx);
          await highlightRowCells(page, it.tx, UCD_COLS, `${it.tx} — expected ${it.expected}`);
          await shots.take(page, `ucd-estm-${it.vehicle}-${it.tx}`, false);
          await clearHighlights(page);
        } else {
          await boListing(bo, it.tx.startsWith("A") ? "apt" : "stms", it.vehicle);
          row = await rowFor(bo, it.vehicle, it.tx);
          if (row) row["Reset link"] = String(await bo.locator(`a.resetPayment[title*="${it.tx}"]`).count() > 0);
          await highlightRowCells(bo, it.tx, BO_COLS, `${it.tx} — expected ${it.expected}`);
          await shots.take(bo, `bo-${it.vehicle}-${it.tx}`, false);
          await clearHighlights(bo);
        }
        now[it.tx] = row;
        const b = base[it.tx];
        const pay = (r: Record<string, string> | null | undefined) => clean(r?.["Payment"]) || "?";
        const tx = (r: Record<string, string> | null | undefined) => clean(r?.["Tx Status"]) || "?";
        let verdict: "PASS" | "FAIL" | "NOT RUN" = "NOT RUN";
        let expected = it.expected === "RESET" ? "Payment - / Pending, no Reset link" : `unchanged (${pay(b)} / ${tx(b)})`;
        if (POST_PUSH) {
          if (!row) verdict = "FAIL";
          else if (it.expected === "RESET") verdict = pay(row) === "-" && tx(row) === "Pending" && row["Reset link"] !== "true" ? "PASS" : "FAIL";
          else verdict = b && pay(row) === pay(b) && tx(row) === tx(b) ? "PASS" : "FAIL";
        } else expected += " (dry run: baseline taken, nothing compared)";
        const actual = row ? `${pay(row)} / ${tx(row)} / Reset link ${row["Reset link"] ?? "n/a"}` : "(row not found)";
        record({ ts: it.ts, check: "reset check", vehicle: it.vehicle, tx: it.tx, expected, actual, verdict, screenshots: shots.files });
        lines.push(`| ${it.ts} | ${it.vehicle} / ${it.tx} | ${it.expected} | ${pay(b)} / ${tx(b)} | ${actual} | ${verdict} |`);
      }
    } finally { await close(); }
    if (!POST_PUSH) fs.writeFileSync(BASE, JSON.stringify(now, null, 2) + "\n", "utf8");
    fs.writeFileSync(path.join(EVID, "RESET-CHECK.md"), `# Reset check — ${POST_PUSH ? "after Dev's reset" : "DRY RUN (baseline)"} — ${new Date().toISOString()}\n\n${lines.join("\n")}\n`, "utf8");
  });

  // ---------------------------------------------------------------- 2. resubmit and pay
  // POST_RESUBMIT="<ts>:<vehicle>:<tx>:<stms|apt>:<persona>:<flip prefix|->:<expected total>[:sabah]"
  test("12403 post — resubmit and pay", async ({ page, ucdSession, browser }) => {
    const spec = process.env.POST_RESUBMIT;
    test.skip(!spec, "set POST_RESUBMIT");
    const [ts, vehicle, tx, kind, persona, flip, expected, region] = spec!.split(":");
    await ucdSession(persona as PersonaKey);
    const shots = new Shots(ts, POST_PUSH ? "after" : "");
    // Sabah rows: switch only when we will really pay (POST_PUSH), restore after.
    await withSabah(browser, shots, region === "sabah" && POST_PUSH, () =>
      resubmitAndPay(page, browser, { ts, vehicle, tx, kind: kind as "stms" | "apt", flip: flip === "-" ? undefined : flip, expected,
        // ALLOW_DRY_PAY=1 lets a dry run pay a throwaway — never a Dev-list transaction (mayPay refuses those).
        allowDryPay: process.env.ALLOW_DRY_PAY === "1" && !onDevList(tx) }));
  });

  // ---------------------------------------------------------------- 2b. RHB debit only (read-only, for rows already paid)
  // POST_RHB="<ts>:<vehicle>:<expected total>"
  test("12403 post — rhb debit", async ({ browser }) => {
    const spec = process.env.POST_RHB;
    test.skip(!spec, "set POST_RHB");
    const [ts, vehicle, expected, tx] = spec!.split(":");
    const shots = new Shots(ts, POST_PUSH ? "after" : "");
    const debit = await rhbDebit(browser, shots, vehicle, tx);
    record({ ts, check: "RHB debit", vehicle, tx, expected: `RHB debit = RM${expected}`, actual: `RHB ${debit}`,
      verdict: debitTotal(debit) === expected ? "PASS" : "FAIL", screenshots: shots.files });
  });

  // ---------------------------------------------------------------- 3. BO reset (PAY4, and the throwaway)
  // POST_BO_RESET="<ts>:<vehicle>:<tx>:<stms|apt>"
  test("12403 post — BO reset", async ({ browser }) => {
    const spec = process.env.POST_BO_RESET;
    test.skip(!spec, "set POST_BO_RESET");
    const [ts, vehicle, tx, kind] = spec!.split(":");
    await boReset(browser, { ts, vehicle, tx, kind: kind as "stms" | "apt" });
  });

  // ---------------------------------------------------------------- 4. throwaway dry run
  test("12403 post — throwaway", async ({ page, ucdSession, mykad, browser }) => {
    test.skip(POST_PUSH, "dry run only");
    const ts = "THROWAWAY_OU";
    const shots = new Shots(ts);
    await ucdSession("ucdE2E");
    // 1) fail a fresh OU STMS (OU is at RHB IF)
    const run = await runStmsFlow(page, { mykad, vehiclePrefix: "OU", vehicleRegNo: nextVehicleNumber("OU"), stopAfter: "payment" });
    await shootStep5(page, shots, "1-step5");
    const pay = await run.stms.submitPaymentAndReadResult();
    await page.waitForTimeout(2000);
    await shots.take(page, "1-payment-result");
    await closeStmsFlow(run);
    await ucdListing(page, "stms", run.vehicleRegNo);
    const r1 = await rowFor(page, run.vehicleRegNo);
    const tx = r1?.["Transaction No"] ?? "";
    record({ ts, check: "throwaway failed", vehicle: run.vehicleRegNo, tx, expected: "Payment Failed / Tx Failed", actual: `${r1?.["Payment"]} / ${r1?.["Tx Status"]} (${pay.outcome})`,
      verdict: r1?.["Payment"] === "Failed" && r1?.["Tx Status"] === "Failed" ? "PASS" : "FAIL", screenshots: shots.files });
    if (!tx || onDevList(tx)) throw new Error("throwaway tx missing or on the Dev list — stopping");
    // 2) BO reset it
    await boReset(browser, { ts, vehicle: run.vehicleRegNo, tx, kind: "stms" });
    // 3) resubmit + pay with OU flipped to OK
    await home(page);
    await resubmitAndPay(page, browser, { ts, vehicle: run.vehicleRegNo, tx, kind: "stms", flip: "OU", expected: "", allowDryPay: true });
  });

  // ---------------------------------------------------------------- 4b. address switch dry run
  test("12403 post — address switch", async ({ page, ucdSession, browser }) => {
    test.skip(POST_PUSH, "dry run only");
    const shots = new Shots("ADDRESS_SWITCH");
    await ucdSession("ucdE2E");
    let sabahTotal = "";
    await withSabah(browser, shots, true, async () => {
      // read (not pay) a Pending APT's Step 5 while at SABAH: JPJ must be RM40
      await ucdListing(page, "apt", "OT000005");
      await page.locator("table tr", { hasText: "A69347798" }).locator("a").filter({ hasText: /Resubmit/i }).first().click();
      await page.waitForURL(/apt\/transaction\/payment\.do/, { timeout: 60_000 });
      sabahTotal = totalOf(await paymentSummary(page));
      await shootStep5(page, shots, "pending-apt-step5-at-SABAH");
    });
    record({ ts: "ADDRESS_SWITCH", check: "SABAH switch + JOHOR restore", vehicle: "OT000005", tx: "A69347798", expected: "Step 5 RM61.60 at SABAH, then JOHOR restored",
      actual: `Step 5 RM${sabahTotal} at SABAH; restore ran (see address-set-JOHOR)`, verdict: sabahTotal === "61.60" ? "PASS" : "FAIL", screenshots: shots.files });
  });

  // ---------------------------------------------------------------- 5. documents after
  // POST_DOCS="<ts>:<vehicle>:<stms|apt>[,...]"
  test("12403 post — documents", async ({ page, ucdSession }) => {
    const list = (process.env.POST_DOCS ?? "").split(",").filter(Boolean);
    test.skip(!list.length, "set POST_DOCS");
    await ucdSession((process.env.POST_DOCS_PERSONA ?? "ucdE2E") as PersonaKey);
    for (const spec of list) {
      const [ts, vehicle, kind] = spec.split(":");
      await downloadDocs(page, ts, vehicle, kind as "stms" | "apt" | "estm");
    }
  });

  // ---------------------------------------------------------------- 5b. UCD A Interstate listing (read-only)
  // POST_INTERSTATE_LISTING="<ts>:<vehicle>"   e.g. UTU_PAY2 step 9: UCD A sees the Interstate Approved
  test("12403 post — interstate listing", async ({ page, ucdSession }) => {
    const spec = process.env.POST_INTERSTATE_LISTING;
    test.skip(!spec, "set POST_INTERSTATE_LISTING");
    const [ts, vehicle] = spec!.split(":");
    await ucdSession("ucdE2E");
    const shots = new Shots(ts, "after");
    const root = page.url().replace(/\/view\/.*/, "");
    await page.goto(root + "/view/ucd/stms/interstate/enquiry.do");
    await page.fill("#vehicleNo", vehicle).catch(() => undefined);
    await page.click("#to-search").catch(() => undefined);
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(2500);
    const row = page.locator("table tr", { hasText: vehicle }).first();
    const txt = (await row.innerText().catch(() => "(not listed)")).replace(/\s+/g, " ");
    await highlight(page, row, `UCD A Interstate listing — ${vehicle}`).catch(() => undefined);
    await shots.take(page, `ucdA-interstate-listing-${vehicle}`, false);
    await clearHighlights(page);
    record({ ts, check: "UCD A Interstate listing", vehicle, expected: "Tx Status Approved", actual: txt.slice(0, 300),
      verdict: /Approved/.test(txt) ? "PASS" : "FAIL", screenshots: shots.files });
  });

  // ---------------------------------------------------------------- 6. Reset Payment Report
  test("12403 post — reset payment report", async ({ browser }) => {
    const { bo, close } = await boPage(browser);
    const shots = new Shots("12403_RESET_REPORT");
    try {
      await bo.goto("view/report/reset-payment-report");
      await bo.waitForLoadState("networkidle").catch(() => undefined);
      for (const id of ["#paymentFrom", "#paymentTo"]) await setDate(bo, id, process.env.POST_REPORT_FROM && id === "#paymentFrom" ? parseDmy(process.env.POST_REPORT_FROM)
        : process.env.POST_REPORT_TO && id === "#paymentTo" ? parseDmy(process.env.POST_REPORT_TO) : new Date());
      bo.on("response", (r) => { if (!/\.(js|css|png|gif|jpg|woff2?)(\?|$)/.test(r.url())) console.log(`[net] ${r.status()} ${r.request().method()} ${r.url()}`); });
      bo.on("console", (m) => { if (m.type() === "error") console.log(`[console] ${m.text()}`); });
      await bo.locator("#select_all").check().catch(() => undefined);
      await shots.take(bo, "reset-payment-report-filter", false);
      const pop = bo.context().waitForEvent("page", { timeout: 20_000 }).catch(() => null);
      await bo.click("#to-generate");
      // The report shows a "Working..." box while it builds — wait it out.
      await bo.getByText("Working...").waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
      await bo.getByText("Working...").waitFor({ state: "hidden", timeout: 150_000 }).catch(() => undefined);
      await bo.waitForTimeout(1500);
      const tab = await Promise.race([pop, bo.waitForTimeout(2_000).then(() => null)]);
      const view = tab ?? bo;
      if (tab) await tab.waitForLoadState("load").catch(() => undefined);
      const body = (await text(view)).replace(/\s+/g, " ");
      const probe = process.env.POST_REPORT_PROBE_TX;   // e.g. the dry-run throwaway reset
      const want = devList().filter((d) => d.expected === "RESET");
      const found = want.filter((d) => body.includes(d.tx));
      await highlight(view, view.locator("table").filter({ hasText: /Reset By/ }).last(), `Reset Payment Report — ${found.length}/${want.length} expected resets listed`);
      await shots.take(view, "reset-payment-report");
      await clearHighlights(view);
      const notes = [`opened in ${tab ? "a new tab" : "the same page"}`, `rows text: ${body.slice(0, 300)}`];
      if (probe) notes.push(`probe ${probe}: ${body.includes(probe) ? "LISTED" : "not listed"}`);
      record({ ts: "12403_RESET_REPORT", check: "Reset Payment Report lists the resets", expected: want.map((d) => d.tx).join(" "),
        actual: `listed: ${found.map((d) => d.tx).join(" ") || "none"}${probe ? ` · probe ${probe} ${body.includes(probe) ? "listed" : "NOT listed"}` : ""}`,
        verdict: POST_PUSH ? (found.length === want.length ? "PASS" : "FAIL") : "NOT RUN", notes, screenshots: shots.files });
      if (tab) await tab.close().catch(() => undefined);
    } finally { await close(); }
  });

  // ---------------------------------------------------------------- 6b. Reset Payment Report by vehicle no. (Dev 29.09: no date filter)
  // Every Dev-list vehicle: RESET ones must be listed, NO ones must not.
  test("12403 post — reset payment report by vehicle", async ({ browser }) => {
    const { bo, close } = await boPage(browser);
    try {
      for (const it of devList().filter((d) => !d.tx.startsWith("E"))) {
        const shots = new Shots(it.ts || "12403_UNMAPPED", "reset-report");
        await bo.goto("view/report/reset-payment-report");
        await bo.waitForLoadState("networkidle").catch(() => undefined);
        for (const id of ["#paymentFrom", "#paymentTo"]) await bo.locator(id).evaluate((el) => {
          const $ = (window as any).jQuery; if ($ && $(el).hasClass("hasDatepicker")) $(el).datepicker("setDate", null); (el as HTMLInputElement).value = "";
        });
        await bo.locator("#vehicleNo").fill(it.vehicle);
        await bo.locator("#select_all").check().catch(() => undefined);
        await bo.click("#to-generate");
        await bo.getByText("Working...").waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
        await bo.getByText("Working...").waitFor({ state: "hidden", timeout: 150_000 }).catch(() => undefined);
        await bo.waitForTimeout(1500);
        const body = (await text(bo)).replace(/\s+/g, " ");
        const listed = body.includes(it.tx);
        const want = it.expected === "RESET";
        await highlight(bo, bo.locator("table").filter({ hasText: /Reset By/ }).last(), `${it.vehicle} / ${it.tx} — expected ${want ? "LISTED" : "not listed"}`).catch(() => undefined);
        await shots.take(bo, `reset-report-${it.vehicle}-${it.tx}`, false);
        await clearHighlights(bo);
        record({ ts: it.ts, check: "Reset Payment Report by vehicle no.", vehicle: it.vehicle, tx: it.tx,
          expected: want ? "listed" : "not listed", actual: listed ? "listed" : "not listed",
          verdict: listed === want ? "PASS" : "FAIL", notes: [`rows: ${body.slice(body.indexOf("Reset Payment Report"), body.indexOf("Reset Payment Report") + 400)}`], screenshots: shots.files });
      }
    } finally { await close(); }
  });

  // ---------------------------------------------------------------- 6c. BO > <STMS|APT> Transaction > View (read-only)
  // POST_BO_VIEW="<ts>:<vehicle>:<tx>:<stms|apt>[,...]"  (STMS_INV1 stored amount; DSP2 no APT pricing)
  test("12403 post — bo view", async ({ browser }) => {
    const list = (process.env.POST_BO_VIEW ?? "").split(",").filter(Boolean);
    test.skip(!list.length, "set POST_BO_VIEW");
    const { bo, close } = await boPage(browser);
    try {
      for (const spec of list) {
        const [ts, vehicle, tx, kind] = spec.split(":");
        const shots = new Shots(ts, "after");
        await boListing(bo, kind as "stms" | "apt", vehicle);
        const pop = bo.context().waitForEvent("page", { timeout: 8_000 }).catch(() => null);
        await bo.locator("table tr", { hasText: tx }).first().locator("a").filter({ hasText: /^\s*View\s*$/ }).first().click();
        const tab = await pop; const view = tab ?? bo;
        await view.waitForLoadState("networkidle").catch(() => undefined);
        await view.waitForTimeout(1500);
        const body = (await text(view)).replace(/\s+/g, " ");
        const money = [...new Set(body.match(/\b\d{1,4}\.\d{2}\b/g) ?? [])];
        await shots.take(view, `bo-${kind}-view-${vehicle}-${tx}`, true);
        record({ ts, check: `BO ${kind.toUpperCase()} View`, vehicle, tx, expected: "(reviewed from the screenshot)", actual: `amounts on page: ${money.join(" ") || "none"}`,
          verdict: "CHECK", notes: [body.slice(0, 1500)], screenshots: shots.files });
        if (tab) await tab.close(); else await bo.goBack().catch(() => undefined);
      }
    } finally { await close(); }
  });

  // ---------------------------------------------------------------- 7. reset population (Failed export diff)
  test("12403 post — reset population", async ({ browser }) => {
    const { bo, close } = await boPage(browser);
    const shots = new Shots("12403_STMS_PRE1", "reset-population");
    try {
      for (const [kind, p, before] of [["STMS", "view/stms/enquiry", "export-STMS-202609281518.csv"], ["APT", "view/apt/enquiry", "export-APT-202609281519.csv"]] as const) {
        await bo.goto(p);
        await bo.waitForLoadState("networkidle").catch(() => undefined);
        await setDate(bo, "#fromDate", new Date(2026, 0, 1));
        await setDate(bo, "#toDate", new Date());
        await bo.selectOption("#to-filter", { label: "Failed" });
        await bo.click("#to-search");
        await bo.waitForLoadState("networkidle").catch(() => undefined);
        await bo.waitForTimeout(2500);
        bo.once("dialog", (d) => d.accept().catch(() => undefined));
        const [dl] = await Promise.all([bo.waitForEvent("download", { timeout: 90_000 }), bo.click("#to-export")]);
        const f = shots.download(`export-${kind}-Failed-${POST_PUSH ? "after" : "dryrun"}.csv`);
        await dl.saveAs(f);
        const a = parseCsv(path.join(PRE, "12403_STMS_PRE1", before));
        const b = parseCsv(f);
        const gone = a.filter((x) => !b.some((y) => y.tx === x.tx));
        const added = b.filter((y) => !a.some((x) => x.tx === y.tx));
        // Dev resets OUR list only (QA 2026-09-28): the RESET items must leave the
        // Failed list, and nothing else may — ours or other testers'.
        const resetTx = new Set(devList().filter((d) => d.expected === "RESET").map((d) => d.tx));
        const wrong = gone.filter((x) => !resetTx.has(x.tx));                       // left, but was not to be reset
        const stuck = a.filter((x) => resetTx.has(x.tx) && b.some((y) => y.tx === x.tx)); // to be reset, still Failed
        const verdict = POST_PUSH ? (wrong.length === 0 && stuck.length === 0 ? "PASS" : "FAIL") : "NOT RUN";
        record({ ts: "12403_STMS_PRE1", check: `reset population ${kind} (Failed list before vs now)`,
          expected: `only our RESET items leave the Failed list (${a.filter((x) => resetTx.has(x.tx)).length} of ${a.length}); every other row stays`,
          actual: `now ${b.length}; left ${gone.length} (${wrong.length} that should have stayed); RESET items still Failed ${stuck.length}; new ${added.length}`,
          verdict, notes: [`left: ${gone.map((x) => x.tx).join(" ")}`, `wrongly left: ${wrong.map((x) => x.tx).join(" ")}`, `still failed: ${stuck.map((x) => x.tx).join(" ")}`, `new: ${added.map((x) => x.tx).join(" ")}`], screenshots: shots.files });
      }
    } finally { await close(); }
  });

  // ---------------------------------------------------------------- 8. reports
  test("12403 post — reports", async ({ browser }) => {
    const { bo, close } = await boPage(browser);
    try {
      for (const [ts, type] of [["12403_STMS_RPT1", "STMS"], ["12403_RPT1", "APT"]] as const) {
        const shots = new Shots(ts);
        const notes: string[] = [];
        await bo.goto("view/jpj/report/stms-apt-estm/list.do");
        await bo.waitForLoadState("networkidle").catch(() => undefined);
        await setDate(bo, "#fromDate", parseDmy(process.env.POST_REPORT_FROM ?? "28/09/2026"));
        await setDate(bo, "#toDate", new Date());
        const range = `${await bo.inputValue("#fromDate")} → ${await bo.inputValue("#toDate")}`;
        notes.push(`date range as accepted by the page: ${range} (the picker stops at yesterday)`);
        for (const t of ["STMS", "APT", "eSTM", "eHak"]) { const cb = bo.locator(`#${t}`); if (t === type) await cb.check(); else await cb.uncheck().catch(() => undefined); }
        await bo.click("#to-generate");
        await bo.waitForLoadState("networkidle").catch(() => undefined);
        await bo.waitForTimeout(3000);
        const listing = bo.locator("table").filter({ hasText: /NO\. PENDAFTARAN|TARIKH EFT/ }).last();
        await highlight(bo, listing, `Transaction Listing — ${type}, ${range}`);
        await shots.take(bo, `transaction-listing-${type}`);
        await clearHighlights(bo);
        const ex = bo.getByText("Export Excel", { exact: true });
        if (await ex.isVisible().catch(() => false)) {
          bo.once("dialog", (d) => d.accept().catch(() => undefined));
          const dl = await Promise.all([bo.waitForEvent("download", { timeout: 60_000 }).catch(() => null), ex.click()]).then(([d]) => d);
          if (dl) { const f = shots.download(`transaction-listing-${type}.${(dl.suggestedFilename().split(".").pop() || "xls")}`); await dl.saveAs(f); notes.push(`exported ${path.basename(f)}`); }
          else notes.push("Export Excel clicked — no download");
        }
        await bo.goto("view/jpj/report/consolidated-reconcile/eauto-report.jsp");
        await bo.waitForLoadState("networkidle").catch(() => undefined);
        await setDate(bo, "#paymentDateFrom", parseDmy(process.env.POST_REPORT_FROM ?? "28/09/2026"));
        await setDate(bo, "#paymentDateTo", new Date());
        await bo.click("#to-recon");
        await bo.waitForLoadState("networkidle").catch(() => undefined);
        await bo.waitForTimeout(3000);
        await highlight(bo, bo.locator("table").filter({ hasText: /Payment Ref No|Total Approved/ }).last(), "Reconciliation Summary Listing");
        await shots.take(bo, "reconciliation-summary-listing");
        await clearHighlights(bo);
        const body = (await text(bo)).replace(/\s+/g, " ");
        record({ ts, check: `reports (${type})`, expected: "pre-push rows at RM21.60 and post-push rows at RM27.00 in one range",
          actual: `range ${range}; reconciliation: ${(body.match(/No records found|Total Approved Transaction in eAuto \d+/) ?? ["see screenshot"])[0]}`,
          verdict: "CHECK", notes, screenshots: shots.files });
      }
    } finally { await close(); }
  });

  // ---------------------------------------------------------------- 9. UI after the change
  test("12403 post — UI", async ({ page, ucdSession }) => {
    await ucdSession("ucdE2E");
    const root = page.url().replace(/\/view\/.*/, "");
    // [ts, page, label, what must be on the page, the element to box, caption]
    const checks: [string, string, string, RegExp, RegExp, string][] = [
      ["12403_STMS_DSP1", "/view/ucd/home.do", "home-tile-stms", /From RM35\*\s*STMS/, /^\s*From RM35\*?\s*$/, "STMS tile From RM35"],
      ["12403_STMS_DSP1", "/view/ucd/stms/view.do", "stms-module-page", /RM35\*/, /RM35\*/, "STMS page RM35*"],
      ["12403_UTU_DSP1", "/view/ucd/home.do", "home-tile-ucd-to-ucd", /RM35 only\*\s*UCD TO UCD/, /^\s*RM35 only\*?\s*$/, "UCD TO UCD tile RM35 only"],
      ["12403_UTU_DSP1", "/view/ucd/stms/interstate/ucd-view.do", "ucd-to-ucd-page", /RM35\* only/, /RM35\* only/, "UCD to UCD page RM35* only"],
      ["12403_DSP1", "/view/ucd/home.do", "home-tile-apt", /RM125 only\*\s*APT/, /^\s*RM125 only\*?\s*$/, "APT tile RM125 only"],
    ];
    for (const [ts, p, label, re, box, what] of checks) {
      const shots = new Shots(ts);
      await page.goto(root + p);
      await new StmsWizardPage(page).dismissAnnouncements();
      await page.waitForLoadState("networkidle").catch(() => undefined);
      const body = await text(page);
      await highlightText(page, box, what);
      await shots.take(page, label);
      await clearHighlights(page);
      record({ ts, check: what, expected: what, actual: re.test(body.replace(/\n/g, " ")) ? "shown" : "NOT shown", verdict: re.test(body.replace(/\n/g, " ")) ? "PASS" : "FAIL", screenshots: shots.files });
    }
  });
});


// ================================================================== new transactions (post-push)
// Each pays ONLY with POST_PUSH=1 and Step 5 == expected; a dry run stops at Step 5.

test.describe("12403 post new", () => {
  test.setTimeout(30 * 60 * 1000);
  test.beforeEach(() => touched.clear());
  test.afterEach(async ({ page }) => { await saveVideo(page); });

  // POST_NEW_STMS="<ts>:<prefix>:<expected total>[:sabah]"   e.g. 12403_STMS_E2E1:OE:37.00
  test("12403 post — new STMS", async ({ page, ucdSession, mykad, browser }) => {
    const spec = process.env.POST_NEW_STMS;
    test.skip(!spec, "set POST_NEW_STMS");
    const [ts, prefix, expected] = spec!.split(":");
    await ucdSession("ucdE2E");
    await home(page);
    const shots = new Shots(ts, POST_PUSH ? "after" : "");
    const run = await runStmsFlow(page, { mykad, vehiclePrefix: prefix, stopAfter: "payment" });
    const s5 = await paymentSummary(page);
    await shootStep5(page, shots);
    await finishPayment(page, browser, shots, { ts, vehicle: run.vehicleRegNo, kind: "stms", expected, s5 });
    await closeStmsFlow(run);
  });

  // POST_NEW_UTU="<ts>:<prefix>:<expected total>"   UCD to UCD Standard, buyer Azfar1, seller RICH BOYZ
  test("12403 post — new UCD to UCD Standard", async ({ page, ucdSession, mykad, browser }) => {
    const spec = process.env.POST_NEW_UTU;
    test.skip(!spec, "set POST_NEW_UTU");
    const [ts, prefix, expected] = spec!.split(":");
    await ucdSession("ucdE2E");
    const shots = new Shots(ts, POST_PUSH ? "after" : "");
    const vehicle = nextVehicleNumber(prefix);
    await utuStandardToStep5(page, mykad, shots, vehicle);
    const s5 = await paymentSummary(page);
    await shootStep5(page, shots);
    await finishPayment(page, browser, shots, { ts, vehicle, kind: "stms", expected, s5 });
  });

  // POST_INTERSTATE_ACCEPT="<ts>:<vehicle>:<expected total>"   buyer faizuddin2 accepts + pays (UTU_DEP1, UTU_E2E2)
  test("12403 post — interstate accept and pay", async ({ page, ucdSession, mykad, browser }) => {
    const spec = process.env.POST_INTERSTATE_ACCEPT;
    test.skip(!spec, "set POST_INTERSTATE_ACCEPT");
    const [ts, vehicle, expected] = spec!.split(":");
    test.skip(!POST_PUSH, "accepting uses up the Interstate transaction — post-push only");
    await ucdSession("ucdE2E2");
    const shots = new Shots(ts, "after");
    await ucdListing(page, "stms", vehicle);
    await highlightRowCells(page, vehicle, UCD_COLS, `UCD B listing — ${vehicle}`);
    await shots.take(page, "buyer-listing-to-accept", false);
    await clearHighlights(page);
    await page.locator("table tr", { hasText: vehicle }).locator("a, button, input").filter({ hasText: /accept/i }).first().click();
    await confirmDialog(page);
    const stms = new StmsWizardPage(page);
    await mykad.removeCard();
    await mykad.setMatchResult("Identical");
    await tickConsent(page, "#buyer-consent", nextEmail());
    await (stms as any).readMyKad(mykad, FAIZ_CARD);
    await shots.take(page, "buyer-verified");
    await stms.continueToJpjCheck();
    await stms.runJpjEnquiry();
    await stms.goToPayment();
    const s5 = await paymentSummary(page);
    await shootStep5(page, shots);
    await finishPayment(page, browser, shots, { ts, vehicle, kind: "stms", expected, s5 });
    // UCD A (seller) Interstate listing: Buyer Auth time + Tx Status Approved
    if (process.env.POST_INTERSTATE_SELLER_CHECK) {
      await ucdSession("ucdE2E");
      const root = page.url().replace(/\/view\/.*/, "");
      await page.goto(root + "/view/ucd/stms/interstate/enquiry.do");
      await page.fill("#vehicleNo", vehicle).catch(() => undefined);
      await page.click("#to-search").catch(() => undefined);
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(2500);
      const row = page.locator("table tr", { hasText: vehicle }).first();
      const txt = (await row.innerText().catch(() => "(not listed)")).replace(/\s+/g, " ");
      await highlight(page, row, `UCD A Interstate listing — ${vehicle}`).catch(() => undefined);
      await shots.take(page, "ucdA-interstate-listing-after", false);
      await clearHighlights(page);
      record({ ts, check: "UCD A Interstate listing", vehicle, expected: "Buyer Auth time shown; Tx Status Approved", actual: txt.slice(0, 300),
        verdict: /Approved/.test(txt) ? "PASS" : "FAIL", screenshots: shots.files });
    }
  });

  // POST_TRIGGER="<ts>:<vehicle>:<expected APT total>[:sabah]"   existing Approved STMS -> BO 5.5/6.0 -> APT pay (DEP1)
  test("12403 post — trigger and pay", async ({ page, ucdSession, browser }) => {
    const spec = process.env.POST_TRIGGER;
    test.skip(!spec, "set POST_TRIGGER");
    test.skip(!POST_PUSH, "triggers a real APT — post-push only");
    const [ts, vehicle, expected, region] = spec!.split(":");
    await ucdSession("ucdE2E");
    const shots = new Shots(ts, "after");
    await ucdListing(page, "apt", vehicle);
    if (await rowFor(page, vehicle)) throw new Error(`${vehicle} already has an APT — not triggering a second one`);
    await boTriggerApt(browser, shots, vehicle);
    await ucdListing(page, "apt", vehicle);
    const r = await rowFor(page, vehicle);
    const tx = r?.["Transaction No."] ?? r?.["Transaction No"] ?? "";
    if (!tx) throw new Error(`no APT row for ${vehicle} after the BO trigger`);
    await withSabah(browser, shots, region === "sabah", () => resubmitAndPay(page, browser, { ts, vehicle, tx, kind: "apt", expected }));
  });

  // PAY4: a Failed APT made the same way as PAY1 (OQ, RHB IF) AFTER the push -> BO [Reset] -> resubmit + pay RM127.
  test("12403 post — PAY4 BO reset", async ({ page, ucdSession, mykad, browser }) => {
    test.skip(!process.env.POST_PAY4, "set POST_PAY4=1");
    test.skip(!POST_PUSH, "post-push only");
    const ts = "12403_PAY4";
    await ucdSession("ucdE2E");
    await home(page);
    const shots = new Shots(ts, "after");
    // 1) Approved source STMS on OQ (OQ to OK only for this payment)
    const vehicle = nextVehicleNumber("OQ");
    const src = await withRhbOk("OQ", async () => {
      const run = await runStmsFlow(page, { mykad, vehiclePrefix: "OQ", vehicleRegNo: vehicle, stopAfter: "payment" });
      await shootStep5(page, shots, "source-stms-step5");
      const p = await run.stms.submitPaymentAndReadResult();
      await page.waitForTimeout(3000);
      await closeStmsFlow(run);
      return p;
    });
    if (src.outcome !== "transferred") throw new Error(`source STMS not approved: ${src.outcome}`);
    // 2) BO manual trigger 5.5 then 6.0
    await boTriggerApt(browser, shots, vehicle);
    await ucdListing(page, "apt", vehicle);
    const r0 = await rowFor(page, vehicle);
    const tx = r0?.["Transaction No."] ?? r0?.["Transaction No"] ?? "";
    if (!tx || onDevList(tx)) throw new Error(`no fresh APT for ${vehicle}`);
    // 3) pay with OQ at RHB IF -> Payment Failed / Tx Failed
    await page.locator("table tr", { hasText: tx }).first().locator("a").filter({ hasText: /Resubmit/i }).first().click();
    await confirmDialog(page);
    await page.waitForTimeout(2000);
    await shootStep5(page, shots, "fail-step5");
    const fail = await new StmsWizardPage(page).submitPaymentAndReadResult();
    await page.waitForTimeout(3000);
    await highlight(page, page.locator(".ui-dialog:visible").last(), "Payment result", 800).catch(() => undefined);
    await shots.take(page, "fail-payment-result");
    await clearHighlights(page);
    await ucdListing(page, "apt", vehicle);
    const r1 = await rowFor(page, vehicle, tx);
    await highlightRowCells(page, tx, UCD_COLS, `UCD — ${tx} after the failed payment`);
    await shots.take(page, "ucd-listing-failed", false);
    await clearHighlights(page);
    record({ ts, check: "Failed APT created (RHB IF)", vehicle, tx, expected: "Payment Failed / Tx Failed", actual: `${r1?.["Payment"]} / ${r1?.["Tx Status"]} (${fail.outcome})`,
      verdict: r1?.["Payment"] === "Failed" && /Failed/.test(r1?.["Tx Status"] ?? "") ? "PASS" : "FAIL", screenshots: shots.files });
    if (r1?.["Payment"] !== "Failed") return;
    // 4) BO [Reset] in the Action column
    await boReset(browser, { ts, vehicle, tx, kind: "apt" });
    // 5) resubmit and pay with OQ to OK -> RM127.00
    await home(page);
    await resubmitAndPay(page, browser, { ts, vehicle, tx, kind: "apt", flip: "OQ", expected: "127.00" });
  });

  // STMS with a COMPANY seller (Syarikat), main user Azfar1.
  // POST_STMS_COMPANY="<ts>:<prefix>:<expected>:<companyName>:<roc>[:ssm]"
  //   without :ssm — company SSM permission unticked: Type of Business + 3 uploads at Step 2, no SSM purchase.
  //   with :ssm    — "STMS - Company Category" ticked: Board Resolution only, Purchase SSM at Step 4 (eSim ROC seeded with
  //                  the Step 1 representative as director).
  // Representative = the simulator's default card (a UCD user's IC is refused as a company representative).
  test("12403 post — STMS company", async ({ page, ucdSession, mykad, browser }) => {
    const spec = process.env.POST_STMS_COMPANY;
    test.skip(!spec, "set POST_STMS_COMPANY");
    test.skip(!POST_PUSH, "post-push only");
    const [ts, prefix, expected, companyName, roc, mode] = spec!.split(":");
    const UPLOADS = path.join(__dirname, "..", "..", "assets", "uploads");
    await ucdSession("ucdE2E");
    const shots = new Shots(ts, "after");
    const stms = new StmsWizardPage(page);
    const vehicle = process.env.POST_VEHICLE ?? nextVehicleNumber(prefix);
    await stms.startNewTransaction();
    await stms.chooseSellerCategory("SYARIKAT" as any);
    // Step 1 — company + representative
    await page.fill("#companyName", companyName);
    await page.fill("#companyRegNo", roc);
    await mykad.removeCard();
    await mykad.setMatchResult("Identical");
    await stms.authenticateSeller({ vehicleRegNo: vehicle, mykad, card: CARDS.emulatorDefault, sellerEmail: nextEmail() });
    await shots.take(page, "step1-company-rep-verified");
    await stms.continueToVehicle();
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(1500);
    // Step 2 — Type of Business + uploads + details
    await page.getByText("Sdn Bhd or Bhd", { exact: true }).click();
    await page.waitForTimeout(2000);
    const inputs = page.locator("input[type=file]");
    const n = await inputs.count();
    const files = ["mva-receipt.pdf", "auction-deposit-receipt.pdf", "mva-receipt.pdf"];
    for (let i = 0; i < n; i++) await inputs.nth(i).setInputFiles(path.join(UPLOADS, files[i % files.length])).catch(() => undefined);
    await page.waitForTimeout(2500);
    await page.fill("#contactNo", nextMobile());
    const em = page.locator("#email"); if (await em.isEditable().catch(() => false)) await em.fill(nextEmail());
    await page.fill("#mailingAddress", "NO 1 JALAN QA, 81100 JOHOR BAHRU, JOHOR");
    await page.fill("#vehicleEngineNo", randomEngineNo());
    await page.fill("#vehicleChassisNo", randomChassisNo());
    await page.selectOption("#vehicleMake", { label: "Chery" });
    await page.locator("#vehicleModel option").nth(1).waitFor({ timeout: 15_000 }).catch(() => undefined);
    await page.selectOption("#vehicleModel", { index: 1 });
    await page.selectOption("#vehicleYear", { label: "2012" });
    await shots.take(page, `step2-company-details-${n}-uploads`);
    record({ ts, check: "Step 2 company uploads", vehicle, expected: mode === "ssm" ? "Board Resolution only (SSM purchased at Step 4)" : "3 uploads (SSM profile, Board Resolution, Employment Pass & MyKad)",
      actual: `${n} upload field(s)`, verdict: (mode === "ssm" ? n === 1 : n === 3) ? "PASS" : "CHECK", screenshots: shots.files });
    await page.click("#to-continue-company");
    // "Sure to continue?" can take a moment to appear — wait for Yes, then click it.
    const yes2 = page.locator(".ui-dialog:visible .ui-dialog-buttonpane button", { hasText: /^\s*Yes\s*$/ }).first();
    await yes2.waitFor({ state: "visible", timeout: 20_000 }).catch(() => undefined);
    if (await yes2.isVisible().catch(() => false)) await yes2.click(); else await confirmDialog(page).catch(() => undefined);
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(2000);
    // Step 3 — UCD (buyer) authentication
    await stms.authenticateBuyer({ jpjReceiptEmail: nextEmail(), mykad, card: CARDS.malaysianIndividual });
    await shots.take(page, "step3-buyer-verified");
    await stms.continueToJpjCheck();
    await stms.runJpjEnquiry();
    await shots.take(page, "step4-jpj-result");
    if (mode === "ssm") {
      const buy = page.locator("a, button, input, div").filter({ hasText: /Purchase SSM/i }).last();
      const offered = await buy.isVisible().catch(() => false);
      await highlight(page, buy, "Purchase SSM").catch(() => undefined);
      await shots.take(page, "step4-purchase-ssm-offered");
      await clearHighlights(page);
      const s4 = (await page.locator("body").innerText()).split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join(" | ");
      record({ ts, check: "Step 4 Purchase SSM", vehicle, expected: "Purchase SSM offered", actual: offered ? "offered" : "NOT offered", verdict: offered ? "PASS" : "FAIL", notes: [s4.slice(0, 2500)], screenshots: shots.files });
      if (!offered || !process.env.POST_SSM_CONTINUE) return;
      await buy.click();
      await confirmDialog(page).catch(() => undefined);
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(5000);
      await shots.take(page, "step4-after-ssm-purchase");
    }
    await stms.goToPayment();
    const s5 = await paymentSummary(page);
    await shootStep5(page, shots);
    // POST_STMS_FLIP=<prefix>: a switchable (RHB IF) prefix goes to OK for this payment only
    await withRhbOk(process.env.POST_STMS_FLIP || undefined, () => finishPayment(page, browser, shots, { ts, vehicle, kind: "stms", expected, s5 }));
  });

  // APT E2E2: an APT that FAILS first, then pays after eSim goes to OK — at the SABAH address throughout.
  // POST_APT_FAILPAY="<ts>:<vehicle>:<flip prefix>:<expected>"   (the vehicle's STMS must already be Approved)
  test("12403 post — APT fail then pay", async ({ page, ucdSession, browser }) => {
    const spec = process.env.POST_APT_FAILPAY;
    test.skip(!spec, "set POST_APT_FAILPAY");
    test.skip(!POST_PUSH, "post-push only");
    const [ts, vehicle, flip, expected] = spec!.split(":");
    await ucdSession("ucdE2E");
    const shots = new Shots(ts, "after");
    if (!process.env.POST_RETRY_ONLY) await boTriggerApt(browser, shots, vehicle);
    await ucdListing(page, "apt", vehicle);
    const r0 = await rowFor(page, vehicle);
    const tx = r0?.["Transaction No."] ?? r0?.["Transaction No"] ?? "";
    if (!tx || onDevList(tx)) throw new Error(`no fresh APT for ${vehicle}`);
    await withSabah(browser, shots, true, async () => {
      let r1: Record<string, string> | null = null;
      if (!process.env.POST_RETRY_ONLY) {
      // 1) pay with the prefix at RHB IF -> Failed
      await ucdListing(page, "apt", vehicle);
      await page.locator("table tr", { hasText: tx }).first().locator("a").filter({ hasText: /Resubmit|Retry/i }).first().click();
      await confirmDialog(page).catch(() => undefined);
      await page.waitForTimeout(2000);
      const s5a = await paymentSummary(page);
      await shootStep5(page, shots, "fail-step5");
      const fail = await new StmsWizardPage(page).submitPaymentAndReadResult();
      await page.waitForTimeout(3000);
      await highlight(page, page.locator(".ui-dialog:visible").last(), "Payment result", 800).catch(() => undefined);
      await shots.take(page, "fail-payment-result");
      await clearHighlights(page);
      await ucdListing(page, "apt", vehicle);
      r1 = await rowFor(page, vehicle, tx);
      await highlightRowCells(page, tx, UCD_COLS, `UCD — ${tx} after the failed payment`);
      await shots.take(page, "ucd-listing-failed", false);
      await clearHighlights(page);
      record({ ts, check: "APT payment Failed (RHB IF)", vehicle, tx, expected: `Step 5 RM${expected}; Payment Failed / Tx Failed`,
        actual: `Step 5 RM${totalOf(s5a)}; ${r1?.["Payment"]} / ${r1?.["Tx Status"]} (${fail.outcome})`,
        verdict: totalOf(s5a) === expected && r1?.["Payment"] === "Failed" ? "PASS" : "FAIL", notes: [s5a], screenshots: shots.files });
      if (r1?.["Payment"] !== "Failed") return;
      }
      // 2) prefix to OK -> listing Resubmit -> Step 5 (Payment Status Failed, amount kept) -> Retry
      await ucdListing(page, "apt", vehicle);
      await page.locator("table tr", { hasText: tx }).first().locator("a").filter({ hasText: /Resubmit|Retry/i }).first().click();
      await confirmDialog(page).catch(() => undefined);
      await page.waitForTimeout(2000);
      const s5b = await paymentSummary(page);
      await shootStep5(page, shots, "retry-step5");
      if (totalOf(s5b) !== expected) {
        record({ ts, check: "APT Retry after eSim OK", vehicle, tx, expected: `Step 5 RM${expected}`, actual: `Step 5 RM${totalOf(s5b)} — NOT paid`, verdict: "FAIL", notes: [s5b], screenshots: shots.files });
        return;
      }
      let outcome = "";
      await withRhbOk(flip, async () => {
        const retry = page.locator("input[type=button], button, a, div.next-btn").filter({ hasText: /^\s*Retry\s*$/i }).first();
        await retry.click();
        const yes = page.locator(".ui-dialog:visible .ui-dialog-buttonpane button", { hasText: /^\s*(Make Payment|Yes|OK|Next|Confirm)\s*$/ }).first();
        if (await yes.isVisible({ timeout: 8000 }).catch(() => false)) await yes.click();
        await page.waitForLoadState("networkidle").catch(() => undefined);
        await page.waitForTimeout(5000);
        outcome = (await page.locator(".ui-dialog:visible").allInnerTexts().catch(() => [])).join(" ").replace(/\s+/g, " ");
        await highlight(page, page.locator(".ui-dialog:visible").last(), "Retry result", 800).catch(() => undefined);
        await shots.take(page, "retry-result");
        await clearHighlights(page);
        const ok = page.locator(".ui-dialog:visible .ui-dialog-buttonpane button", { hasText: /^\s*OK\s*$/ }).first();
        if (await ok.isVisible().catch(() => false)) await ok.click();
        await page.waitForTimeout(3000);
      });
      await ucdListing(page, "apt", vehicle);
      const r2 = await rowFor(page, vehicle, tx);
      await highlightRowCells(page, tx, UCD_COLS, `UCD — ${tx} after Retry`);
      await shots.take(page, "ucd-listing-after-retry", false);
      await clearHighlights(page);
      const debit = await rhbDebit(browser, shots, vehicle, tx);
      const okDebit = debitTotal(debit);
      record({ ts, check: "APT Retry after eSim OK", vehicle, tx, expected: `Step 5 RM${expected}; Payment OK; Approved; RHB OK debit = RM${expected}`,
        actual: `Step 5 RM${totalOf(s5b)}; ${r2?.["Payment"]} / ${r2?.["Tx Status"]}; RHB ${debit}; dialog: ${outcome.slice(0, 120)}`,
        verdict: r2?.["Payment"] === "OK" && /Approved/.test(r2?.["Tx Status"] ?? "") && okDebit === expected ? "PASS" : "FAIL", notes: [s5b], screenshots: shots.files });
    });
  });

  // R5: eSerahan after the push — fee must stay RM35.00 (pre-push: TE900001, eSerahan Fee RM35.00).
  // Our own AB+MKR JPJ-OK prefix (ON) instead of TE, which belongs to another team. Add-ons off.
  test("12403 post — R5 eSerahan", async ({ page, ucdSession, mykad, browser }) => {
    test.skip(!process.env.POST_R5, "set POST_R5=1");
    test.skip(!POST_PUSH, "post-push only");
    const ts = "12403_R5";
    const { EstmWizardPage } = await import("@pages/ucd/estm-wizard.page");
    const { IdCategory } = await import("@pages/wizard.page");
    await ucdSession("ucdE2E");
    const shots = new Shots(ts, "after");
    const estm = new EstmWizardPage(page);
    const vehicle = nextVehicleNumber("ON");
    await home(page);
    await estm.startNewTransaction();
    await estm.chooseBuyerCategory(IdCategory.MALAYSIAN);
    await estm.authenticateBuyer({ vehicleRegNo: vehicle, email: nextEmail(), mykad, card: CARDS.malaysianIndividual });
    await estm.continueToVehicle();
    await estm.fillBuyerAndVehicleDetails({ buyerEmail: nextEmail(), contactNo: nextMobile(), engineNo: randomEngineNo(), chassisNo: randomChassisNo() });
    await estm.continueToSeller();
    await estm.authenticateSeller({ mykad, card: CARDS.malaysianIndividual });
    await estm.continueToJpjCheck();
    await estm.runJpjEnquiry();
    const where = await estm.goToPayment();
    if (where !== "payment") throw new Error(`eSerahan went to ${where}, not the payment screen`);
    await estm.configureAddOns({ lkm: false, evoc: false });
    await page.waitForTimeout(1500);
    const s5 = await paymentSummary(page);
    await shootStep5(page, shots, "estm-step5-payment-summary");
    const fee = (s5.match(/eSerahan Fee\s*:?\s*(?:RM\s*)?([\d.]+)/i) ?? [])[1] ?? "?";
    const total = await estm.totalPayable().catch(() => "?");
    record({ ts, check: "eSerahan fee at payment", vehicle, expected: "eSerahan Fee RM35.00 (same as before the push)", actual: `eSerahan Fee RM${fee}; total ${total}`,
      verdict: fee === "35.00" ? "PASS" : "FAIL", notes: [s5], screenshots: shots.files });
    if (fee !== "35.00") return;
    const url = await estm.submitPayment();
    await page.waitForTimeout(3000);
    await shots.take(page, "estm-after-payment");
    await ucdListing(page, "estm", vehicle);
    const r = await rowFor(page, vehicle);
    await highlightRowCells(page, vehicle, UCD_COLS, `UCD eSTM listing — ${vehicle}`);
    await shots.take(page, "ucd-estm-listing-after", false);
    await clearHighlights(page);
    const tx = r?.["Transaction No"] ?? r?.["Transaction No."] ?? "";
    const debit = await rhbDebit(browser, shots, vehicle, tx || undefined);
    record({ ts, check: "eSerahan paid", vehicle, tx, expected: `Payment OK; debit = ${total}`, actual: `${r?.["Payment"]} / ${r?.["Tx Status"]}; RHB ${debit}; landed ${url.replace(/\?.*/, "")}`,
      verdict: r?.["Payment"] === "OK" ? "CHECK" : "FAIL", notes: ["debit vs total reviewed from the screenshots"], screenshots: shots.files });
    await downloadDocs(page, ts, vehicle, "estm");
  });

  // E2E3: APT raised through the eSTM route. STMS Approved on OV (AD, eSTM VEL000392E) -> eSTM on the
  // same vehicle -> VEL000392E -> APT listed -> Resubmit -> pay at the SABAH address, RM67.00.
  test("12403 post — E2E3 eSTM route", async ({ page, ucdSession, mykad, browser }) => {
    test.skip(!process.env.POST_E2E3, "set POST_E2E3=1");
    test.skip(!POST_PUSH, "post-push only");
    const ts = "12403_E2E3";
    const { EstmWizardPage } = await import("@pages/ucd/estm-wizard.page");
    const { IdCategory } = await import("@pages/wizard.page");
    await ucdSession("ucdE2E");
    await home(page);
    const shots = new Shots(ts, "after");
    // POST_E2E3_VEHICLE resumes a vehicle whose STMS is Approved and whose eSTM already hit VEL000392E.
    const resume = process.env.POST_E2E3_VEHICLE;
    let vehicle = resume ?? "";
    if (!resume) {
    // 1) STMS until Approved
    const run = await runStmsFlow(page, { mykad, vehiclePrefix: "OV", stopAfter: "payment" });
    vehicle = run.vehicleRegNo;
    await shootStep5(page, shots, "source-stms-step5");
    const src = await run.stms.submitPaymentAndReadResult();
    await page.waitForTimeout(3000);
    await closeStmsFlow(run);
    if (src.outcome !== "transferred") throw new Error(`source STMS not approved: ${src.outcome}`);
    // 2-4) eSTM on the same vehicle; eSim OV answers VEL000392E
    const estm = new EstmWizardPage(page);
    await home(page);
    await estm.startNewTransaction();
    await estm.chooseBuyerCategory(IdCategory.MALAYSIAN);
    await estm.authenticateBuyer({ vehicleRegNo: vehicle, email: nextEmail(), mykad, card: CARDS.malaysianIndividual });
    await estm.continueToVehicle();
    await estm.fillBuyerAndVehicleDetails({ buyerEmail: nextEmail(), contactNo: nextMobile(), engineNo: randomEngineNo(), chassisNo: randomChassisNo() });
    await estm.continueToSeller();
    await estm.authenticateSeller({ mykad, card: CARDS.malaysianIndividual });
    await estm.continueToJpjCheck();
    await page.locator("#to-agree").click();
    await page.locator("#to-enquiry").click();
    const yes = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Setuju|Confirm|Next)$/ }).first();
    if (await yes.isVisible({ timeout: 8000 }).catch(() => false)) await yes.click();
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(8000);
    const body = (await text(page)).replace(/\s+/g, " ");
    const hit = /VEL000392E|melebihi 6 bulan|bayar APT/i.test(body);
    await highlight(page, page.locator(".ui-dialog:visible").last(), "eSTM JPJ enquiry result").catch(() => undefined);
    await shots.take(page, "estm-enquiry-result");
    await clearHighlights(page);
    record({ ts, check: "eSTM enquiry VEL000392E", vehicle, expected: "VEL000392E / pay APT message", actual: hit ? "shown" : "NOT shown", verdict: hit ? "PASS" : "FAIL", screenshots: shots.files });
    } else {
      // resume: eSTM listing -> Resubmit -> back on the JPJ check with the VEL000392E message
      await ucdListing(page, "estm", vehicle);
      await highlightRowCells(page, vehicle, UCD_COLS, `UCD eSTM listing — ${vehicle}`);
      await shots.take(page, "estm-listing-before-link", false);
      await clearHighlights(page);
      await page.locator("table tr", { hasText: vehicle }).locator("a").filter({ hasText: /Resubmit/i }).first().click();
      await page.waitForLoadState("networkidle").catch(() => undefined);
      const y = page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm)$/ }).first();
      if (await y.isVisible({ timeout: 4000 }).catch(() => false)) await y.click();
      await page.waitForTimeout(2500);
    }
    // 4) "Proceed until the vehicle is flagged for permanent transfer": Click here to pay APT fees
    const link = page.locator("a, button, input, div").filter({ hasText: /^\s*Click here to pay APT fees\s*$/i }).last();
    if (!(await link.isVisible().catch(() => false))) {
      await shots.take(page, "estm-no-pay-apt-link-STOPPED");
      record({ ts, check: "pay APT fees link", vehicle, expected: "link offered", actual: "not on the page", verdict: "FAIL", screenshots: shots.files });
      return;
    }
    await highlight(page, link, "Click here to pay APT fees");
    await shots.take(page, "estm-pay-apt-fees-link");
    await clearHighlights(page);
    await link.click();
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(3000);
    await shots.take(page, "estm-link-landed");
    // 5) APT listed
    await ucdListing(page, "apt", vehicle);
    const r = await rowFor(page, vehicle);
    const tx = r?.["Transaction No."] ?? r?.["Transaction No"] ?? "";
    await highlightRowCells(page, vehicle, UCD_COLS, `UCD APT listing — ${vehicle} after the eSTM`);
    await shots.take(page, "ucd-apt-listing-after-estm", false);
    await clearHighlights(page);
    record({ ts, check: "APT listed after VEL000392E", vehicle, tx, expected: "APT transaction listed", actual: tx ? `${tx} ${r?.["Payment"]} / ${r?.["Tx Status"]}` : "no APT row",
      verdict: tx ? "PASS" : "FAIL", screenshots: shots.files });
    if (!tx) return;
    // 6) Resubmit, Step 5 at SABAH, pay
    await home(page);
    await withSabah(browser, shots, true, () => resubmitAndPay(page, browser, { ts, vehicle, tx, kind: "apt", expected: "67.00" }));
  });

  // POST_NEW_APT="<ts>:<prefix>:<expected APT total>[:sabah]"   STMS -> BO 5.5/6.0 -> APT pay
  test("12403 post — new APT", async ({ page, ucdSession, mykad, browser }) => {
    const spec = process.env.POST_NEW_APT;
    test.skip(!spec, "set POST_NEW_APT");
    test.skip(!POST_PUSH, "creates and pays an STMS first — post-push only");
    const [ts, prefix, expected, region] = spec!.split(":");
    await ucdSession("ucdE2E");
    await home(page);
    const shots = new Shots(ts, "after");
    // source STMS at the new STMS price
    const run = await runStmsFlow(page, { mykad, vehiclePrefix: prefix, stopAfter: "payment" });
    const vehicle = run.vehicleRegNo;
    await shootStep5(page, shots, "source-stms-step5");
    const src = await run.stms.submitPaymentAndReadResult();
    await closeStmsFlow(run);
    if (src.outcome !== "transferred") {
      record({ ts, check: "new APT — source STMS", vehicle, expected: "source STMS approved", actual: `payment ${src.outcome}`, verdict: "FAIL", screenshots: shots.files });
      return;
    }
    await boTriggerApt(browser, shots, vehicle);
    await ucdListing(page, "apt", vehicle);
    const r = await rowFor(page, vehicle);
    const tx = r?.["Transaction No."] ?? r?.["Transaction No"] ?? "";
    await withSabah(browser, shots, region === "sabah", () => resubmitAndPay(page, browser, { ts, vehicle, tx, kind: "apt", expected }));
  });
});

const FAIZ_CARD: CardLike = { ...CARDS.malaysianIndividual, NRIC: "030217141005", GMPCName: "MUHAMMAD FAIZUDDIN BIN BIDI", OriginalName: "MUHAMMAD FAIZUDDIN BIN BIDI" };

async function tickConsent(page: Page, sel: string, email: string) {
  const c = page.locator(sel);
  await c.waitFor({ state: "visible", timeout: 30_000 });
  for (const e of ["#sellerEmail", "#jpjReceiptEmail"]) {
    const f = page.locator(e);
    if ((await f.isVisible().catch(() => false)) && (await f.isEditable().catch(() => false)) && !(await f.inputValue())) await f.fill(email);
  }
  if (!(await c.isChecked())) await c.click();
  await page.waitForFunction((q) => (document.querySelector(q) as HTMLInputElement)?.checked, sel, { timeout: 10_000 });
}

async function utuStandardToStep5(page: Page, mykad: MyKadClient, shots: Shots, vehicle: string) {
  const stms = new StmsWizardPage(page);
  const email = nextEmail();
  await home(page);
  await new UcdHomePage(page).goTo(UCD_MENU.ucdToUcd);
  await page.locator("a, button, div, li").filter({ hasText: /^\s*STANDARD\s*$/i }).first().click();
  await page.waitForLoadState("domcontentloaded");
  await mykad.removeCard();
  await mykad.setMatchResult("Identical");
  await tickConsent(page, "#seller-consent", email);
  await (stms as any).readMyKad(mykad, CARDS.malaysianIndividual);
  await shots.take(page, "step1-seller-verified");
  await stms.continueToVehicle();
  await page.fill("#companyName", "RICH BOYZ");
  await page.fill("#companyRocNo", "1231165-A");
  await page.fill("#contactNo", nextMobile());
  const em = page.locator("#email");
  if (await em.isEditable().catch(() => false)) await em.fill(email);
  await page.fill("#mailingAddress", "NO 1 JALAN SEED, 81100 JOHOR BAHRU, JOHOR").catch(() => undefined);
  await page.getByText("Single Transaction", { exact: true }).click().catch(async () => { await page.locator("input[type=radio]").first().check(); });
  await page.fill("#vehicleRegNo", vehicle);
  await page.fill("#vehicleEngineNo", randomEngineNo());
  await page.fill("#vehicleChassisNo", randomChassisNo());
  await page.selectOption("#vehicleMake", { label: "Chery" });
  await page.locator("#vehicleModel option").nth(1).waitFor({ timeout: 15000 }).catch(() => undefined);
  await page.selectOption("#vehicleModel", { index: 1 });
  await page.selectOption("#vehicleYear", { label: "2012" });
  await shots.take(page, "step2-filled");
  await page.click("#to-continue-company");
  await confirmDialog(page);
  await tickConsent(page, "#buyer-consent", email);
  await (stms as any).readMyKad(mykad, CARDS.malaysianIndividual);
  await shots.take(page, "step3-buyer-verified");
  await stms.continueToJpjCheck();
  await stms.runJpjEnquiry();
  await shots.take(page, "step4-jpj-result");
  await stms.goToPayment();
}

/** After Step 5 of a NEW transaction: guard, pay, and capture the listings + RHB debit. */
async function finishPayment(page: Page, browser: import("@playwright/test").Browser, shots: Shots,
  o: { ts: string; vehicle: string; kind: "stms" | "apt"; expected: string; s5: string }) {
  const total = totalOf(o.s5);
  if (!POST_PUSH || total !== o.expected) {
    record({ ts: o.ts, check: "new transaction — Step 5", vehicle: o.vehicle, expected: `RM${o.expected}`, actual: `RM${total}${POST_PUSH ? "" : " (dry run — not paid)"}`,
      verdict: POST_PUSH ? "FAIL" : "NOT RUN", notes: [o.s5], screenshots: shots.files });
    return;
  }
  const stms = new StmsWizardPage(page);
  const pay = await stms.submitPaymentAndReadResult();
  await page.waitForTimeout(3000);
  await shots.take(page, pay.outcome === "rejected" ? "payment-rejected" : "payment-accepted");
  if (pay.outcome === "transferred") {
    await page.locator("body").filter({ hasText: /Transfer Status|SUCCESSFUL/i }).waitFor({ timeout: 90_000 }).catch(() => undefined);
    await shots.take(page, "step6-transfer");
  }
  await ucdListing(page, o.kind, o.vehicle);
  const r = await rowFor(page, o.vehicle);
  await highlightRowCells(page, o.vehicle, UCD_COLS, `UCD listing — ${o.vehicle}`);
  await shots.take(page, "ucd-listing-after", false);
  await clearHighlights(page);
  const debit = await rhbDebit(browser, shots, o.vehicle, r?.["Transaction No"] ?? r?.["Transaction No."]);
  const ok = pay.outcome === "transferred" && r?.["Payment"] === "OK" && /Approved/.test(r?.["Tx Status"] ?? "");
  record({ ts: o.ts, check: "new transaction paid at the new price", vehicle: o.vehicle, tx: r?.["Transaction No"] ?? r?.["Transaction No."],
    expected: `Step 5 RM${o.expected}; Approved; RHB debit = RM${o.expected}`, actual: `Step 5 RM${total}; ${r?.["Payment"]} / ${r?.["Tx Status"]}; RHB ${debit}`,
    verdict: ok && debitTotal(debit) === o.expected ? "PASS" : "FAIL", notes: [o.s5], screenshots: shots.files });
}

/** BO > RHB Payment Transaction: the split debits for a vehicle (today). */
async function rhbDebit(browser: import("@playwright/test").Browser, shots: Shots, vehicle: string, tx?: string): Promise<string> {
  const { bo, close } = await boPage(browser);
  try {
    await bo.goto("view/payment/rhb-payment-transaction");
    // The page searches today by default; a payment from an earlier day needs its date
    // (POST_RHB_DATE=dd/mm/yyyy). Without it a re-check on a later day reads "not found".
    // POST_RHB_DATE=dd/mm/yyyy, or a range dd/mm/yyyy-dd/mm/yyyy ("no second debit" checks).
    const day = process.env.POST_RHB_DATE;
    if (day) {
      const [from, to = from] = day.split("-");
      await bo.locator("input[name=fromDate]").evaluate((el, v) => { (el as HTMLInputElement).value = v; }, from);
      await bo.locator("input[name=toDate]").evaluate((el, v) => { (el as HTMLInputElement).value = v; }, to);
    }
    // Filter by vehicle so a long range does not push the row onto a later page.
    await bo.locator("#vehicleNo").fill(vehicle).catch(() => undefined);
    await bo.click("#to-search");
    await bo.waitForLoadState("networkidle").catch(() => undefined);
    await bo.waitForTimeout(2500);
    const amounts = await bo.evaluate(({ v, t }) => {
      const norm = (x: string) => x.replace(/\s+/g, " ").trim();
      const own = (tr: Element) => Array.from(tr.children).filter((c) => c.tagName === "TD");
      const all = Array.from(document.querySelectorAll("tr")).filter((tr) => own(tr).length > 4);
      const out: string[] = [];
      all.forEach((tr, k) => {
        const txt = norm(tr.textContent || ""); if (!txt.includes(v) || (t && !txt.includes(t))) return;
        const group = [tr];
        for (let n = k + 1; n < all.length && own(all[n]).length < own(tr).length; n++) group.push(all[n]);
        for (const g of group) {
          (g as HTMLElement).style.boxShadow = "inset 0 0 0 3px #e11d48";
          const m = norm(g.textContent || "").match(/Split Debit to (eAuto|JPJ) ([\d.]+) (OK|Failed)/);
          if (m) out.push(`${m[1]} ${m[2]} ${m[3]}`);
        }
        (tr as HTMLElement).scrollIntoView({ block: "center" });
      });
      return out;
    }, { v: vehicle, t: tx });
    await shots.take(bo, `bo-rhb-debit-${vehicle}${tx ? "-" + tx : ""}`, false);
    return amounts.join(" + ") || "(not found)";
  } finally { await close(); }
}
const debitTotal = (d: string) => { const ok = [...d.matchAll(/(eAuto|JPJ) ([\d.]+) OK/g)].map((m) => Number(m[2])); return ok.length ? ok.reduce((a, b) => a + b, 0).toFixed(2) : ""; };

/** BO > Manual APT Trigger: 5.5 then 6.0 with the STMS 6-month expiry date. */
async function boTriggerApt(browser: import("@playwright/test").Browser, shots: Shots, vehicle: string) {
  const { bo, close } = await boPage(browser);
  try {
    bo.on("dialog", (d) => d.accept().catch(() => undefined));
    for (const [btn, label] of [["#jpjNotice", "5.5"], ["#jpjPermanent", "6.0"]] as const) {
      await bo.goto("view/stms/manual-trigger-apt");
      await bo.fill("#vehicleRegNo", vehicle);
      await bo.fill("#companyRoc", "JM0570913-X");
      await bo.click("#to-search");
      await bo.waitForLoadState("networkidle").catch(() => undefined);
      await bo.waitForTimeout(1500);
      const exp = new Date(); exp.setMonth(exp.getMonth() + 6);
      await bo.locator("input.hasDatepicker:visible").first().evaluate((el, iso) => { (window as any).jQuery(el).datepicker("setDate", new Date(iso)); }, exp.toISOString());
      await bo.locator(btn).first().click();
      await bo.waitForLoadState("networkidle").catch(() => undefined);
      await bo.waitForTimeout(2500);
      await shots.take(bo, `bo-trigger-${label}`);
    }
  } finally { await close(); }
}

// ================================================================== building blocks

function parseDmy(s: string) { const [d, m, y] = s.split("/").map(Number); return new Date(y, m - 1, d); }

async function setDate(page: Page, sel: string, dt: Date) {
  await page.locator(sel).evaluate((el, iso) => {
    const $ = (window as any).jQuery; const x = new Date(iso);
    if ($ && $(el).hasClass("hasDatepicker")) $(el).datepicker("setDate", x);
    else (el as HTMLInputElement).value = `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
  }, dt.toISOString());
}

function parseCsv(file: string): { tx: string; payment: string; status: string }[] {
  const lines = fs.readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const split = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim());
  const hi = lines.findIndex((l) => split(l).includes("Payment"));
  const head = split(lines[hi]);
  const ti = head.findIndex((h) => /^Transaction No/.test(h)), pi = head.indexOf("Payment"), si = head.indexOf("Tx Status");
  return lines.slice(hi + 1).map(split).filter((r) => r[ti]).map((r) => ({ tx: r[ti], payment: r[pi], status: r[si] }));
}

async function resubmitAndPay(page: Page, browser: import("@playwright/test").Browser,
  o: { ts: string; vehicle: string; tx: string; kind: "stms" | "apt"; flip?: string; expected: string; allowDryPay?: boolean }) {
  const shots = new Shots(o.ts, POST_PUSH ? "after" : "");
  const notes: string[] = [];
  // A seed is never even resubmitted outside POST_PUSH=1: Resubmit can re-run
  // the JPJ enquiry, which already touches the transaction.
  if (onDevList(o.tx) && !POST_PUSH) {
    record({ ts: o.ts, check: "resubmit and pay", vehicle: o.vehicle, tx: o.tx, expected: `Step 5 RM${o.expected}`,
      actual: "REFUSED before any click — on the Dev list and POST_PUSH is not set", verdict: "NOT RUN", notes, screenshots: [] });
    return;
  }
  await ucdListing(page, o.kind, o.vehicle);
  await highlightRowCells(page, o.tx, UCD_COLS, `UCD listing — ${o.tx} before resubmit`);
  await shots.take(page, "ucd-listing-before-resubmit", false);
  await clearHighlights(page);
  const row = page.locator("table tr", { hasText: o.tx }).first();
  await row.locator("a").filter({ hasText: /Resubmit|Retry/i }).first().click();
  await confirmDialog(page);
  await page.waitForTimeout(2000);
  notes.push("Resubmit landed on " + page.url().replace(/\?.*/, ""));
  // A Failed/reset STMS may land on Step 4 (JPJ check) — go on to Step 5.
  if (o.kind === "stms" && !/payment\.do/.test(page.url())) {
    const stms = new StmsWizardPage(page);
    if (await page.locator("#to-enquiry").isVisible().catch(() => false)) await stms.runJpjEnquiry();
    if (await page.locator("#to-payment").isVisible().catch(() => false)) await stms.goToPayment();
  }
  if (!/payment\.do/.test(page.url())) {
    await shots.take(page, "resubmit-did-not-reach-step5-STOPPED");
    record({ ts: o.ts, check: "resubmit and pay", vehicle: o.vehicle, tx: o.tx, expected: `Step 5 RM${o.expected || "?"}`, actual: `stopped at ${page.url().replace(/\?.*/, "")}`, verdict: "FAIL", notes, screenshots: shots.files });
    return;
  }
  const s5 = await paymentSummary(page);
  const total = totalOf(s5);
  await shootStep5(page, shots);
  const guard = !POST_PUSH && !o.allowDryPay ? { ok: false, why: "dry run — stops at Step 5" } : mayPay(o.tx, total, o.expected || undefined);
  notes.push(`Step 5: ${s5}`, `guard: ${guard.why}`);
  if (!guard.ok) {
    record({ ts: o.ts, check: "resubmit and pay", vehicle: o.vehicle, tx: o.tx, expected: `Step 5 RM${o.expected}`, actual: `Step 5 RM${total} — NOT paid`, verdict: POST_PUSH ? "FAIL" : "NOT RUN", notes, screenshots: shots.files });
    return;
  }
  const stms = new StmsWizardPage(page);
  let outcome = "";
  await withRhbOk(o.flip, async () => {
    let pay = await stms.submitPaymentAndReadResult();
    if (pay.outcome === "rejected" && /Payment request sent/i.test(pay.message)) pay = { outcome: "transferred", url: page.url() };
    outcome = pay.outcome === "rejected" ? `rejected: ${pay.message}` : "accepted";
    await page.waitForTimeout(3000);
    await highlight(page, page.locator(".ui-dialog:visible").last(), "Payment result", 800).catch(() => undefined);
    await shots.take(page, pay.outcome === "rejected" ? "payment-rejected" : "payment-accepted");
    await clearHighlights(page);
    if (pay.outcome === "transferred") {
      // Dismiss "Payment request sent" so the capture is the real Step 6 page, not Step 5 under a dialog.
      const ok = page.locator(".ui-dialog:visible button, .ui-dialog:visible a").filter({ hasText: /^\s*OK\s*$/i }).first();
      if (await ok.isVisible().catch(() => false)) { await ok.click(); await page.waitForLoadState("networkidle").catch(() => undefined); }
      await page.locator("body").filter({ hasText: /Transfer Status|SUCCESSFUL|Approved/i }).waitFor({ timeout: 90_000 }).catch(() => undefined);
      await page.waitForTimeout(1500);
      await shots.take(page, "step6-transfer");
    }
  });
  await ucdListing(page, o.kind, o.vehicle);
  const after = await rowFor(page, o.vehicle, o.tx);
  await highlightRowCells(page, o.tx, UCD_COLS, `UCD listing — ${o.tx} after payment`);
  await shots.take(page, "ucd-listing-after-payment", false);
  await clearHighlights(page);
  const { bo, close } = await boPage(browser);
  try {
    await boListing(bo, o.kind, o.vehicle);
    await highlightRowCells(bo, o.tx, BO_COLS, `BO — ${o.tx}`);
    await shots.take(bo, `bo-${o.kind}-enquiry-after`, false);
    await clearHighlights(bo);
  } finally { await close(); }
  const debit = await rhbDebit(browser, shots, o.vehicle, o.tx);
  const ok = outcome === "accepted" && after?.["Payment"] === "OK" && /Approved/.test(after?.["Tx Status"] ?? "") && (!o.expected || total === o.expected)
    && (!o.expected || debitTotal(debit) === o.expected);
  record({ ts: o.ts, check: "resubmit and pay", vehicle: o.vehicle, tx: o.tx, expected: `Step 5 RM${o.expected || "(any)"}; Payment OK; Approved; RHB debit = RM${o.expected || "(any)"}`,
    actual: `Step 5 RM${total}; ${outcome}; ${after?.["Payment"]} / ${after?.["Tx Status"]}; RHB ${debit}`, verdict: ok ? "PASS" : "FAIL", notes, screenshots: shots.files });
}

async function boReset(browser: import("@playwright/test").Browser, o: { ts: string; vehicle: string; tx: string; kind: "stms" | "apt" }) {
  if (onDevList(o.tx)) throw new Error(`${o.tx} is on the Dev list — Dev's script resets those; BO Reset refused`);
  const shots = new Shots(o.ts, POST_PUSH ? "after" : "");
  const notes: string[] = [];
  const { bo, close } = await boPage(browser);
  try {
    await boListing(bo, o.kind, o.vehicle);
    const link = bo.locator(`a.resetPayment[title*="${o.tx}"]`);
    await highlightRowCells(bo, o.tx, BO_COLS, `BO — ${o.tx} before Reset`);
    await highlight(bo, link, "Reset", 600);
    await shots.take(bo, "bo-before-reset", false);
    await clearHighlights(bo);
    if (!(await link.count())) {
      record({ ts: o.ts, check: "BO reset", vehicle: o.vehicle, tx: o.tx, expected: "[Reset] offered", actual: "no Reset link", verdict: "FAIL", screenshots: shots.files });
      return;
    }
    bo.on("dialog", (d) => { notes.push(`browser dialog: ${d.message()}`); d.accept().catch(() => undefined); });
    await link.first().click();
    const yes = bo.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm)$/ }).first();
    if (await yes.isVisible({ timeout: 6000 }).catch(() => false)) {
      notes.push("dialog: " + (await bo.locator(".ui-dialog:visible").first().innerText()).replace(/\s+/g, " ").slice(0, 200));
      await shots.take(bo, "bo-reset-confirm", false);
      await yes.click();
    }
    await bo.waitForLoadState("networkidle").catch(() => undefined);
    await bo.waitForTimeout(2500);
    const msg = (await bo.locator(".ui-dialog:visible").allInnerTexts().catch(() => [])).join(" ").replace(/\s+/g, " ");
    if (msg) notes.push("after: " + msg.slice(0, 200));
    const okBtn = bo.locator(".ui-dialog-buttonpane button").first();
    if (await okBtn.isVisible().catch(() => false)) await okBtn.click();
    await boListing(bo, o.kind, o.vehicle);
    const r = await rowFor(bo, o.vehicle, o.tx);
    const resetLink = await bo.locator(`a.resetPayment[title*="${o.tx}"]`).count();
    await highlightRowCells(bo, o.tx, BO_COLS, `BO — ${o.tx} after Reset`);
    await shots.take(bo, "bo-after-reset", false);
    await clearHighlights(bo);
    const ok = r?.["Payment"] === "-" && r?.["Tx Status"] === "Pending" && !resetLink;
    record({ ts: o.ts, check: "BO reset", vehicle: o.vehicle, tx: o.tx, expected: "Payment - / Pending, Reset gone", actual: `${r?.["Payment"]} / ${r?.["Tx Status"]} / Reset link ${resetLink > 0}`, verdict: ok ? "PASS" : "FAIL", notes, screenshots: shots.files });
  } finally { await close(); }
}

async function downloadDocs(page: Page, ts: string, vehicle: string, kind: "stms" | "apt" | "estm") {
  const shots = new Shots(ts, POST_PUSH ? "after" : "");
  const notes: string[] = [];
  await ucdListing(page, kind, vehicle);
  await page.locator("table tr", { hasText: vehicle }).locator("a").filter({ hasText: /^View$/ }).first().click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await shots.take(page, `${vehicle}-details`);
  for (const [id, name] of [["#to-print-invoice", "invoice"], ["#to-print-e-invoice", "e-invoice"], ["#to-print", "slip-pengesahan"], ["#to-print-jpj-receipt", "jpj-official-receipt"]]) {
    const b = page.locator(id).first();
    if (!(await b.isVisible().catch(() => false))) { notes.push(`${name}: not shown`); continue; }
    const dl = page.waitForEvent("download", { timeout: 25_000 }).catch(() => null);
    await b.click();
    const d = await dl;
    if (d) { const f = shots.download(`${vehicle}${kind === "apt" ? "_APT" : kind === "estm" ? "_ESTM" : ""}_${name}.pdf`); await d.saveAs(f); notes.push(`${name}: saved`); }
    else notes.push(`${name}: no download`);
  }
  record({ ts, check: "documents", vehicle, expected: "invoice, e-invoice, slip pengesahan, JPJ receipt", actual: notes.join("; "), verdict: notes.every((n) => /saved/.test(n)) ? "PASS" : "CHECK", screenshots: shots.files });
}
