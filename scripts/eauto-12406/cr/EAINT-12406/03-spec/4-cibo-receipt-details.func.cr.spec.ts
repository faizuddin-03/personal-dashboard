// @ticket   EAINT-12406
// @sheet    RC (4 Receipt / CIBO): receipts and Transaction Details
// @cases    12406_RC_TS1, 12406_RC_TS2, 12406_RC_TS3, 12406_RC_TS8 [post-push]
// @env      Secarang staging /ia/ + CIBO staging https://staging.secarang.com/cibo (INSTANCE=ia)
// @status   draft
//
// Written 29.10.2026 by cr-author from the approved TS (scenarios.yaml meta.approved_by: Azfar 29.10.2026, "Dev push
// the changes ady you may start"; ts.json 29.10 09:56). NOT run. Every expected point of 01-intake/ts.json is proved
// with ts.prove(), in the TS's own words; a point the data for it is missing is left unproved (gate: EVIDENCE, never
// PASS) and the reason is written in checks.txt.
//
// READ ONLY: CIBO searches, Transaction Details, Receipt downloads. Nothing is bought here (no @destructive).
// The purchases come from sheet E2E / QT through the hand-off contract (02-plan/coverage.md): run those first.
//   RC_TS1  the Secarang receipts of E2E_TS1..TS4 (files handed on) + a Tokio Marine Insurer block for the layout
//           (E2E_TS10's receipt when handed on, else the CIBO receipt of BR69005852, RG_TS1's Tokio Marine
//           transaction) + E2E_TS1's CIBO record for its Total Premium. E8 compares the labels with the same Tokio
//           Marine receipt (TS v5 step 4, 29.10: BR69005852's CIBO receipt until E2E_TS10 exists). E9 reads E2E_TS1's
//           [Print] view ("printView" in its hand-off), E10 its Confirmation prices ("confirmation"; see TS v6 below).
// TS v5 (ts.json 29.10 13:00): RC_TS2 / RC_TS3 unchanged; RC_TS8's BEFORE copies are named "FROM-THE-BEFORE-CAPTURE".
// TS v6 (29.10.2026 evening, cr-author): RC_TS1 E9 is RECORDED only (the Success page [Print] view is not a receipt
//   under SRD §2.2.3 #6 / REQ-010, N1): proved when E2E_TS1 recorded it, nothing judged. New RC_TS1 E10: on the E2E_TS1
//   receipt, 'Premium After NCD' = Basic Premium − NCD + the add-on lines above it, and = Confirmation's 'Premium
//   After NCD', read from the hand-off ("confirmation", added to E2E_TS1's hand-off in v6: E2E_TS1 must run again
//   before E10 can be proved). Receipt read with `pdftotext -table` (_receipt-summary.ts). Seen 29.10 on every
//   Allianz receipt: 882.16 against 862.16, so E10 is expected to come back DOES NOT MATCH.
//   RC_TS2  E2E_TS1's CIBO receipt, compared with its Secarang receipt.
//   RC_TS3  E2E_TS1's Transaction Details; BR69005852 (Tokio Marine) beside it for Q42, recorded.
//   RC_TS8  the AFTER half. Its BEFORE half ran 28.10.2026 on the old build (05-evidence/pre-push/12406_RC_TS8/,
//           outside the gate); EAINT-12406 is deployed now (Azfar 29.10.2026), so E1 / E2 are proved BY REFERENCE
//           from that capture's run log and screenshots, copied in and named as such. Runs only with
//           CR_PHASE=post-push. No [pre-push] test: the old build is gone.
// Fixed 29.10.2026 (afternoon) after triage S1 (05-evidence/issues/DRAFTS.md; run sRC-1330-c2 stopped after RC_TS8
//   E3 on "Could not find CIBO sidebar transaction-management": the receipt shown in the tab had replaced CIBO).
//   RC_TS8 now opens the CIBO dashboard again (_rc.ts backToCibo, probe rc-back-to-cibo10.mjs) before the two
//   Pending payment look-ups, so E5 is reached; ciboLookUp does the same. Points and their checks unchanged.
// Fixed 29.10.2026 (evening) after triage of run sRC-1545-c1 (RC_TS2, RC_TS3 "spec": skipped in 0 ms because the
//   file ran in serial mode and RC_TS1 failed before them): the file is no longer serial (mode "default": same order,
//   the rest still runs after a failure). No test code changed; points and their checks unchanged.
// Flows: cibo (VERIFIED 29.10.2026, run c3 15:41). Page objects: pages/cibo/ (RC methods added
// 29.10.2026 from read-only probes 03-spec/probes-automation/rc-*.mjs).
// Personal data: Transaction Details are blurred before each screenshot (insurer box and More Info stay sharp); the
// receipts and the video show the QA's own phone / email and the quote IC: evidence stays out of git.

import { test, type TsRun } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { runCiboFlow } from "@flows/cibo.flow";
import { CiboTransactionDetailsPage } from "@pages/cibo/transaction-details.page";
import { secarangOwner } from "@data/secarang";
import {
  ALLIANZ_AGENT, ALLIANZ_NAME, ALLIANZ_NUMBER, agentEndsSummary, agentOf, allianzBlock, backToCibo, ciboLookUp, insurerLines, labelsOf, money, n,
  needPurchase, purchase, receiptFile, receiptLayout, receiptRaw, receiptValue, shapeOf, showSideBySide, totalPremium,
} from "./_rc";
import { amountOf, confirmationRows, premiumAfterNcd, receiptRows, receiptTable, rowOf, rowsText, showColumns } from "./_receipt-summary";

const near = (x: number, y: number) => !Number.isNaN(x) && !Number.isNaN(y) && Math.abs(x - y) < 0.005;

/** Tokio Marine transaction of 12406_RG_TS1 (Secarang, Insurance created, 17.09.2026; read-only walks 28.10). */
const TM_REF = "BR69005852";
const TAGS = (p: "@P1" | "@P2" | "@P3", ...more: string[]) => [p, "@func", "@sheet-RC", ...more];

/** Show a receipt's text (reading order) on screen; returns the box to outline. */
async function showReceipt(ts: TsRun, file: string, what: string, raw: string) {
  await ts.showFile(file, what, raw);
  return ts.page.locator("pre").first();
}

// In file order, one worker, but NOT serial: each TS reads only the hand-offs of other sheets, never another test of
// this file, so a failed TS must not skip the next ones (run sRC-1545-c1: RC_TS1 failed on its proofs and Playwright
// skipped RC_TS2 / RC_TS3 in 0 ms, triage 29.10.2026). "default" keeps the order and runs the rest after a failure.
test.describe.configure({ mode: "default" });

test.describe("EAINT-12406 RC — receipts and CIBO Transaction Details (staging /ia/ + CIBO)", () => {
  test("12406_RC_TS1 — Secarang receipts of the Allianz purchases: the Allianz name, then 200601015674 (735426-V) on the next line, laid out as Tokio Marine, agent Serba Sentral; Premium After NCD adds up and equals Confirmation's", { tag: TAGS("@P1") }, async ({ ts }) => {
    test.setTimeout(25 * 60_000);
    const p1 = needPurchase(ts, "allianzPurchase", "12406_E2E_TS1", "RC_TS1 reads its Secarang receipt");
    const f1 = receiptFile(p1);
    if (!f1) throw new Error(`12406_RC_TS1: the hand-off of 12406_E2E_TS1 carries no Secarang receipt file that exists (${p1.secarangReceipt || "none"}): re-run E2E_TS1.`);
    const others = ([
      ["allianzPurchase:card", "12406_E2E_TS2", "Credit or Debit Card"],
      ["allianzPurchase:grabpay", "12406_E2E_TS3", "PayLater by Grab"],
      ["allianzPurchase:shopeepay", "12406_E2E_TS4", "SPayLater"],
    ] as const).map(([key, by, channel]) => ({ key, by, channel, p: purchase(ts, key) }));
    const tm = purchase(ts, "tokioMarinePurchase");

    // ---- CIBO: E2E_TS1's record (its Total Premium, for E5) and, without E2E_TS10's receipt, a Tokio Marine receipt
    await ts.portal("cibo", "E2E_TS1's record (Total Premium) and a Tokio Marine receipt for the layout");
    const c1 = await ciboLookUp(ts, p1, "Allianz", "details");
    const d = new CiboTransactionDetailsPage(ts.page);
    const ciboTotal = await d.totalPremium();
    await d.blurPersonalData();
    await ts.shot("cibo-e2e-ts1-total-premium", `CIBO Transaction Details ${c1.ref} (12406_E2E_TS1): Total Premium ${ciboTotal.text}`, ciboTotal.locator);
    let tmFile = receiptFile(tm);
    let tmWhat = tm ? `Secarang receipt of 12406_E2E_TS10 (${tm.plate})` : "";
    if (!tmFile) {
      const r = await runCiboFlow(ts.page, { signedIn: true, ref: TM_REF, filter: { insuranceCompany: ["TokioMarine"] }, stopAfter: "receipt" });
      tmFile = await ts.download(r.receipt!, `cibo-receipt-${TM_REF}-tokio-marine-PERSONAL-DATA.pdf`);
      tmWhat = `CIBO receipt of ${TM_REF} (Tokio Marine, 12406_RG_TS1)`;
      ts.note(`Tokio Marine layout from ${tmWhat}: 12406_E2E_TS10 handed on no Secarang receipt`);
    }

    // ---- E1-E3: the E2E_TS1 receipt's Insurer block
    const raw1 = receiptRaw(f1);
    const lay1 = receiptLayout(f1);
    const b1 = allianzBlock(raw1);
    const pre = await showReceipt(ts, f1, "Secarang receipt of 12406_E2E_TS1 (FPX Online banking)", raw1);
    await ts.prove("E1", { shows: `Insurer block: ${b1.shows}`, match: b1.nameFirst, hl: pre, name: "e2e-ts1-receipt-insurer-name" });
    await ts.prove("E2", { shows: `Insurer block: ${b1.shows}`, match: b1.numberNextLine, hl: pre, name: "e2e-ts1-receipt-company-number" });
    await ts.prove("E3", { shows: `Insurer block: ${b1.shows}; old form "Berhad (735426-V)" ${b1.oldGone ? "not shown" : "SHOWN"}`, match: b1.oldGone, hl: pre, name: "e2e-ts1-receipt-old-form-gone" });

    // ---- E4: laid out like the Tokio Marine Insurer block
    const tmBlock = insurerLines(receiptRaw(tmFile));
    const [hlA, hlT] = await showSideBySide(ts.page, "Insurer block: Allianz (E2E_TS1) beside Tokio Marine",
      { title: "Allianz — Secarang receipt of 12406_E2E_TS1", text: b1.block.join("\n") || "(no Insurer block)" },
      { title: `Tokio Marine — ${tmWhat}`, text: tmBlock.join("\n") || "(no Insurer block)" });
    const shapeA = shapeOf(b1.block);
    const shapeT = shapeOf(tmBlock);
    await ts.prove("E4", { shows: `Allianz: ${shapeA} (${b1.shows}); Tokio Marine: ${shapeT} (${tmBlock.map((l) => `"${l}"`).join(" / ")})`, match: shapeT === "name, then company number" && shapeA === shapeT, hl: [hlA, hlT], name: "insurer-block-allianz-vs-tokio-marine" });

    // ---- E5: plate, owner name, Total Premium = the E2E_TS1 purchase
    const plate = receiptValue(raw1, "Vehicle Plate No.");
    const forName = receiptValue(raw1, "For");
    const owner = secarangOwner().name;
    const total = totalPremium(raw1);
    const pre5 = await showReceipt(ts, f1, "Secarang receipt of 12406_E2E_TS1: Vehicle Plate No., For, Total Premium", raw1);
    await ts.prove("E5", {
      shows: `receipt Vehicle Plate No. "${plate}" (purchase: ${p1.plate}); For "${forName}" (typed on Confirmation: "${owner}"); Total Premium "${total}" (CIBO record ${c1.ref}: "${ciboTotal.text}")`,
      match: plate.toUpperCase() === p1.plate.toUpperCase() && n(forName).toUpperCase() === owner.toUpperCase() && !Number.isNaN(money(total)) && money(total) === money(ciboTotal.text),
      hl: pre5,
      name: "e2e-ts1-receipt-plate-owner-total",
    });

    // ---- E6: the Receipt Summary ends with the agent line (PIAM ID recorded)
    const ag = agentOf(raw1);
    const ends = agentEndsSummary(lay1);
    const preL = await showReceipt(ts, f1, "Secarang receipt of 12406_E2E_TS1 as printed (two columns): Receipt Summary", lay1);
    await ts.prove("E6", {
      shows: `agent line "${ag.agent}"; after it in the Receipt Summary: ${ends.after.map((l) => `"${l}"`).join(", ") || "nothing"} (PIAM ID recorded: "${ag.piam}")`,
      match: ag.agent === ALLIANZ_AGENT && ends.ok,
      hl: preL,
      name: "e2e-ts1-receipt-agent-line",
    });

    // ---- E7: the receipts of E2E_TS2, TS3, TS4 (proved only when all three are there)
    const missing = others.filter((o) => !receiptFile(o.p));
    if (missing.length) {
      ts.note(`E7 NOT proved: no Secarang receipt handed on by ${missing.map((o) => `${o.by} (${o.channel}, "${o.key}")`).join(", ")}; run them, then this TS again`);
    } else {
      for (const o of others) {
        const f = receiptFile(o.p)!;
        const b = allianzBlock(receiptRaw(f));
        const hl = await showReceipt(ts, f, `Secarang receipt of ${o.by} (${o.channel})`, receiptRaw(f));
        await ts.prove("E7", { shows: `${o.by} (${o.channel}) Insurer block: ${b.shows}`, match: b.nameFirst && b.numberNextLine && b.oldGone, hl, name: `${o.by}-receipt-insurer`, expected: `${o.by}: "${ALLIANZ_NAME}", next line "${ALLIANZ_NUMBER}"` });
      }
    }

    // ---- E8: every label the same as on the Tokio Marine receipt of E2E_TS10; v5 step 4 (29.10): until E2E_TS10's
    //      Tokio Marine purchase exists, the CIBO receipt of BR69005852 (Tokio Marine, 17.09.2026) stands in
    {
      const la = labelsOf(raw1);
      const lt = labelsOf(receiptRaw(tmFile));
      const onlyA = la.filter((x) => !lt.includes(x));
      const onlyT = lt.filter((x) => !la.includes(x));
      const [h1, h2] = await showSideBySide(ts.page, `Receipt labels: Allianz (E2E_TS1) beside Tokio Marine (${tmWhat})`, { title: "Allianz — Secarang receipt of 12406_E2E_TS1", text: la.join("\n") }, { title: `Tokio Marine — ${tmWhat}`, text: lt.join("\n") });
      await ts.prove("E8", {
        shows: `Tokio Marine receipt used: ${tmWhat}. Labels only on the Allianz receipt: ${onlyA.join(", ") || "none"}; only on the Tokio Marine receipt: ${onlyT.join(", ") || "none"} (${la.length} vs ${lt.length} labels: ${la.join(", ")})`,
        match: la.length > 0 && lt.length > 0 && la.includes("Vehicle Plate No.") && !onlyA.length && !onlyT.length,
        hl: [h1, h2],
        name: "receipt-labels-allianz-vs-tokio-marine",
      });
    }

    // ---- E9 (TS v6: RECORDED ONLY): what the Success page [Print] view of E2E_TS1 shows. Not a 'Receipt' under SRD
    //      §2.2.3 #6 / REQ-010 (N1 to the BA), so nothing in it is judged: the point is proved when the view (or the
    //      fact that no [Print] was offered) was recorded by E2E_TS1, with its screenshot.
    const pv = p1.printView;
    if (!pv) {
      ts.note("E9 NOT proved: 12406_E2E_TS1 handed on nothing about a [Print] on its Success page (printView); only that TS sees the Success page");
    } else if (!pv.offered) {
      await ts.card("E9", "12406_E2E_TS1's Success page offered no [Print]", `hand-off of run ${p1.run} (recorded)`);
      await ts.prove("E9", { shows: "recorded: the Success page of 12406_E2E_TS1 offered no [Print]", match: true, name: "e2e-ts1-no-print-view" });
    } else if (pv.shot && fs.existsSync(pv.shot)) {
      const lines = (pv.text ?? "").split(/\r?\n/).map(n).filter(Boolean);
      const i = lines.indexOf("Insurer");
      const blk = i < 0 ? [] : lines.slice(i + 1, i + 4);
      const copy = path.join(ts.dir, ts.numbered("E9-print-view-from-e2e-ts1"));
      fs.copyFileSync(pv.shot, copy);
      await ts.showFile(copy, "[Print] view of the Success page, taken by 12406_E2E_TS1 (recorded)");
      await ts.prove("E9", {
        shows: `recorded: [Print] view (12406_E2E_TS1, run ${p1.run}): ${i < 0 ? "no Insurer block" : `Insurer lines ${blk.map((l) => `"${l}"`).join(" / ")}`}; headings ${lines.filter((l) => /^(Purchase Details|Car Owner Details|Car Details|Add-Ons|Total Premium|Exclusively by agent.*)$/.test(l)).join(", ") || "none read"}`,
        match: true,
        file: copy,
      });
    } else ts.note("E9 NOT proved: the print view text was handed on without its screenshot");

    // ---- E10 (TS v6): 'Premium After NCD' on the E2E_TS1 receipt = Basic Premium − NCD + the add-on lines listed above
    //      it, and = Confirmation's 'Premium After NCD' of the same purchase (handed on by E2E_TS1 since v6).
    {
      const table = receiptTable(f1);
      const rows = receiptRows(table);
      const onReceipt = premiumAfterNcd(rows);
      const confRows = confirmationRows(p1.confirmation);
      const confPan = amountOf(rowOf(confRows, /^Premium After NCD$/i)?.value ?? "");
      const [hr, hc] = await showColumns(ts.page, "Premium After NCD: the E2E_TS1 receipt's Receipt Summary beside its Confirmation", [
        { title: `Secarang receipt of 12406_E2E_TS1 (${p1.plate})`, text: rowsText(rows) },
        { title: "Confirmation of the same purchase (handed on by 12406_E2E_TS1)", text: confRows.length ? rowsText(confRows) : "(not handed on)" },
      ]);
      if (!confRows.length) {
        ts.note(`E10 NOT proved: 12406_E2E_TS1 (run ${p1.run}) handed on no Confirmation price box ("confirmation"): it does since TS v6, re-run E2E_TS1, then this TS. Receipt alone: ${onReceipt.shows}`);
      } else {
        await ts.prove("E10", {
          shows: `receipt: ${onReceipt.shows}; Confirmation 'Premium After NCD' ${Number.isNaN(confPan) ? "(not read)" : confPan.toFixed(2)}`,
          match: onReceipt.ok && near(onReceipt.stated, confPan),
          hl: [hr, hc],
          name: "e2e-ts1-receipt-premium-after-ncd",
        });
      }
    }
  });

  test("12406_RC_TS2 — CIBO receipt of the Allianz transaction: the Allianz name, then 200601015674 (735426-V); same Receipt No., plate and total as the Secarang receipt", { tag: TAGS("@P1") }, async ({ ts }) => {
    test.setTimeout(15 * 60_000);
    const p1 = needPurchase(ts, "allianzPurchase", "12406_E2E_TS1", "RC_TS2 opens its CIBO receipt");
    const f1 = receiptFile(p1);
    await ts.portal("cibo", "Transaction Management > the E2E_TS1 transaction > Receipt");
    const r = await ciboLookUp(ts, p1, "Allianz", "receipt");
    const d = new CiboTransactionDetailsPage(ts.page);
    await d.blurPersonalData();
    await ts.shot("cibo-transaction-details-receipt-button", `CIBO Transaction Details ${r.ref}: Receipt pressed (PDF downloaded)`, d.documentButton(/Receipt/));
    const file = await ts.download(r.receipt!, `cibo-receipt-${r.ref}-PERSONAL-DATA.pdf`);
    const raw = receiptRaw(file);
    const b = allianzBlock(raw);
    const pre = await showReceipt(ts, file, `CIBO receipt of ${r.ref} (12406_E2E_TS1)`, raw);
    await ts.prove("E1", { shows: `Insurer block: ${b.shows}`, match: b.nameFirst, hl: pre, name: "cibo-receipt-insurer-name" });
    await ts.prove("E2", { shows: `Insurer block: ${b.shows}`, match: b.numberNextLine, hl: pre, name: "cibo-receipt-company-number" });

    if (!f1) ts.note(`E3 NOT proved: 12406_E2E_TS1 handed on no Secarang receipt file to compare with (${p1.secarangReceipt || "none"})`);
    else {
      const sraw = receiptRaw(f1);
      const pick = (x: string) => ({ no: receiptValue(x, "Receipt No."), plate: receiptValue(x, "Vehicle Plate No."), total: totalPremium(x) });
      const c = pick(raw);
      const s = pick(sraw);
      const [hc, hs] = await showSideBySide(ts.page, "Receipt No., Vehicle Plate No., Total Premium: CIBO receipt beside the Secarang receipt",
        { title: `CIBO receipt (${r.ref})`, text: `Receipt No.  ${c.no}\nVehicle Plate No.  ${c.plate}\nTotal Premium  ${c.total}` },
        { title: "Secarang receipt (12406_E2E_TS1)", text: `Receipt No.  ${s.no}\nVehicle Plate No.  ${s.plate}\nTotal Premium  ${s.total}` });
      await ts.prove("E3", {
        shows: `CIBO: Receipt No. "${c.no}", plate "${c.plate}", Total Premium "${c.total}"; Secarang: "${s.no}", "${s.plate}", "${s.total}"`,
        match: !!c.no && c.no === s.no && !!c.plate && c.plate === s.plate && !!c.total && c.total === s.total,
        hl: [hc, hs],
        name: "cibo-vs-secarang-receipt",
      });
    }
    const ag = agentOf(raw);
    const pre4 = await showReceipt(ts, file, `CIBO receipt of ${r.ref}: agent line`, raw);
    await ts.prove("E4", { shows: `agent line "${ag.agent}" (PIAM ID recorded: "${ag.piam}")`, match: ag.agent === ALLIANZ_AGENT, hl: pre4, name: "cibo-receipt-agent-line" });
  });

  test("12406_RC_TS3 — CIBO Transaction Details of the Allianz transaction: 200601015674 (735426-V) with the name, Allianz logo, Platform Secarang, Agency Serba Sentral", { tag: TAGS("@P1") }, async ({ ts }) => {
    test.setTimeout(15 * 60_000);
    const p1 = needPurchase(ts, "allianzPurchase", "12406_E2E_TS1", "RC_TS3 opens its Transaction Details");
    await ts.portal("cibo", "Transaction Management > the E2E_TS1 transaction > Transaction Details");
    const r = await ciboLookUp(ts, p1, "Allianz", "details");
    const d = new CiboTransactionDetailsPage(ts.page);
    const lay = await d.insurerLayout();
    const ins = await d.field("Insurer");
    await d.blurPersonalData();
    const layoutWords = lay.numberSeparate ? "on its own line below the name" : lay.numberOnLowerLine ? "after the name in the same text, drawn on the line below (wrapped)" : "on the same line as the name";
    await ts.prove("E1", {
      shows: `Insurer "${lay.text}"; the number is ${layoutWords} (layout recorded for Q42)`,
      match: lay.text.startsWith(ALLIANZ_NAME) && lay.text.includes(ALLIANZ_NUMBER),
      hl: [ins.locator, d.insurerRow()],
      name: "transaction-details-insurer",
    });
    const logo = await d.insurerLogo();
    await ts.prove("E2", { shows: logo ? `insurer box logo: src "${logo.src}", alt "${logo.alt}"` : "insurer box: NO logo image", match: !!logo && /allianz/i.test(`${logo.src} ${logo.alt}`), hl: logo?.locator ?? d.insurerBox(), name: "transaction-details-allianz-logo" });
    const platform = await d.field("Platform");
    const agency = await d.field("Agency");
    const agencyNo = await d.field("Agency No.");
    const piam = await d.field("Agency PIAM ID");
    await ts.prove("E3", {
      shows: `More Info: Platform "${platform.text}", Agency "${agency.text}" (recorded: Agency No. "${agencyNo.text}", Agency PIAM ID "${piam.text}")`,
      match: platform.text === "Secarang" && agency.text === "Serba Sentral",
      hl: [platform.locator, agency.locator, agencyNo.locator, piam.locator],
      name: "transaction-details-more-info",
    });
    // Step 3 (recorded): the page against the mockup, and whether "Check JPJ Status" is offered (never pressed)
    const jpj = ts.page.getByRole("button", { name: /Check JPJ Status/i }).filter({ visible: true });
    ts.note(`recorded: "Check JPJ Status" ${(await jpj.count()) ? "IS shown (not pressed: what it does is for the QA)" : "is not shown"}; document buttons: ${(r.documentButtons ?? []).join(", ") || "none"}`);
    await ts.shot("transaction-details-whole-page", `Transaction Details ${r.ref} (for the mockup comparison, recorded)`);
    // Step 2 (recorded, Q42): the Tokio Marine insurer box beside it
    const tm = purchase(ts, "tokioMarinePurchase");
    const tmRef = tm?.ref || TM_REF;
    await runCiboFlow(ts.page, { signedIn: true, ref: tmRef, filter: { insuranceCompany: ["TokioMarine"] }, stopAfter: "details" });
    const tmLay = await d.insurerLayout();
    await d.blurPersonalData();
    await ts.shot("tokio-marine-insurer-box-for-q42", `Tokio Marine ${tmRef}: Insurer "${tmLay.text}" (recorded for Q42)`, d.insurerRow());
    ts.note(`recorded for Q42: Allianz ${r.ref} number ${layoutWords}; Tokio Marine ${tmRef} "${tmLay.text}" number ${tmLay.numberSeparate ? "on its own line" : tmLay.numberOnLowerLine ? "wrapped onto the next line" : "on the same line"}`);
  });

  test("12406_RC_TS8 [post-push] — Existing Allianz transactions after the deploy: BR55004010 receipt and Transaction Details carry 200601015674 (735426-V); the 28.10 BEFORE capture by reference", { tag: TAGS("@P2", "@post-push") }, async ({ ts }) => {
    test.skip(ts.phase !== "post-push", "the AFTER half: run with CR_PHASE=post-push (cr-run.mjs --phase post-push)");
    test.setTimeout(20 * 60_000);
    const BEFORE = path.resolve(__dirname, "..", "05-evidence", "pre-push", "12406_RC_TS8");
    const log = fs.existsSync(path.join(BEFORE, "12406_RC_TS8_run-log-before.txt")) ? fs.readFileSync(path.join(BEFORE, "12406_RC_TS8_run-log-before.txt"), "utf8") : "";
    const byRef = (file: string) => {
      const src = path.join(BEFORE, file);
      if (!fs.existsSync(src)) return "";
      const copy = path.join(ts.dir, ts.numbered(`FROM-THE-BEFORE-CAPTURE-28.10-${path.basename(file, ".png")}`));
      fs.copyFileSync(src, copy);
      return copy;
    };

    // ---- E1, E2 by reference: the BEFORE half, old build, 28.10.2026 15:16 MYT
    const e1Line = (/^E1 BR55004010 receipt Insurer block: (.*)$/m.exec(log) || ["", ""])[1];
    const e1Shot = byRef("12406_RC_TS8_E1_05-receipt-BR55004010-insurer-block.png");
    if (!e1Line || !e1Shot) ts.note("E1 NOT proved: the 28.10 BEFORE run log / screenshot of BR55004010's receipt is missing from 05-evidence/pre-push/12406_RC_TS8/");
    else {
      await ts.showFile(e1Shot, "BEFORE 28.10.2026 (old build): receipt of BR55004010, Insurer block");
      await ts.prove("E1", { shows: `FROM THE BEFORE CAPTURE 28.10.2026 (old build, not redone: deployed): Insurer block (pdftotext -layout) ${e1Line}`, match: /Allianz General Insurance Company \(Malaysia\)/.test(e1Line) && /Berhad \(735426-V\)/.test(e1Line) && !/200601015674/.test(e1Line), file: e1Shot });
    }
    for (const ref of ["BR55004010", "BR44003678", "BR3D003430"]) {
      const line = (new RegExp(`^E2 ${ref} Transaction Details Insurer: "([^"]*)"`, "m").exec(log) || ["", ""])[1];
      const shot = byRef(`12406_RC_TS8_E2_03-insurer-box-${ref}.png`);
      if (!line || !shot) { ts.note(`E2 (${ref}) NOT proved: no BEFORE record / screenshot`); continue; }
      await ts.showFile(shot, `BEFORE 28.10.2026 (old build): Transaction Details of ${ref}, insurer box`);
      await ts.prove("E2", { shows: `FROM THE BEFORE CAPTURE 28.10.2026: ${ref} Insurer "${line}"`, match: line === ALLIANZ_NAME, file: shot, expected: `${ref}: the Allianz name only, no number` });
    }

    // ---- AFTER: BR55004010 receipt and Transaction Details, then the two Pending payment ones
    await ts.portal("cibo", "AFTER the deploy: the same three Allianz transactions (Allianz, Platform Secarang)");
    const d = new CiboTransactionDetailsPage(ts.page);
    const r = await runCiboFlow(ts.page, { signedIn: true, ref: "BR55004010", filter: { insuranceCompany: ["Allianz"], platform: ["Secarang"] }, stopAfter: "details" });
    const lay = await d.insurerLayout();
    const ins = await d.field("Insurer");
    await d.blurPersonalData();
    await ts.prove("E4", {
      shows: `BR55004010 Transaction Details Insurer "${lay.text}"; number ${lay.numberSeparate ? "on its own line below the name" : lay.numberOnLowerLine ? "after the name, wrapped onto the line below" : "on the same line as the name"} (layout recorded, Q42)`,
      match: lay.text.startsWith(ALLIANZ_NAME) && lay.text.includes(ALLIANZ_NUMBER),
      hl: [ins.locator, d.insurerRow()],
      name: "after-br55004010-transaction-details",
    });
    const dl = await d.downloadReceipt();
    const file = await ts.download(dl, "BR55004010_receipt_after_PERSONAL-DATA.pdf");
    const raw = receiptRaw(file);
    const b = allianzBlock(raw);
    const pre = await showReceipt(ts, file, "AFTER: CIBO receipt of BR55004010", raw);
    await ts.prove("E3", { shows: `BR55004010 receipt Insurer block: ${b.shows}`, match: b.nameFirst && b.numberNextLine && b.oldGone, hl: pre, name: "after-br55004010-receipt-insurer" });
    ts.note(`BR55004010 listing row: ${JSON.stringify(r.row ?? {}).replace(/"Insured":"[^"]*",?/, "")}`);

    // The receipt was shown in the tab (setContent): open CIBO again before the sidebar (triage S1, run sRC-1330-c2)
    await backToCibo(ts);
    for (const ref of ["BR44003678", "BR3D003430"]) {
      await runCiboFlow(ts.page, { signedIn: true, ref, filter: { insuranceCompany: ["Allianz"], platform: ["Secarang"] }, stopAfter: "details" });
      const l = await d.insurerLayout();
      const st = await d.statusBadgeInfo();
      const f = await d.field("Insurer");
      await d.blurPersonalData();
      // E5 is "recorded" (Q20: does REQ-011 apply to non-final rows?): proved when the insurer box was read
      await ts.prove("E5", {
        shows: `${ref} (${st.text}) Insurer "${l.text}" — company number ${l.text.includes(ALLIANZ_NUMBER) ? "SHOWN" : "not shown"} (recorded for Q20)`,
        match: l.text.startsWith(ALLIANZ_NAME),
        hl: [f.locator, d.insurerRow()],
        name: `after-${ref}-insurer-box`,
        expected: `${ref}: insurer box recorded (Q20)`,
      });
    }
  });
});
