// @ticket   EAINT-12406
// @sheet    5 Regression (RG)
// @cases    12406_RG_TS1, 12406_RG_TS2, 12406_RG_TS3   (all [post-push])
// @env      Secarang staging /ia/ + CIBO staging https://staging.secarang.com/cibo (INSTANCE=ia)
// @status   draft
//
// Sheet RG, written 29.10.2026 by cr-author after gate 0 (scenarios.yaml meta.approved_by: Azfar 29.10.2026,
// "Dev push the changes ady you may start"). 12406_RG_TS4 is DEPRIORITISED (Azfar 28.10.2026: eAuto and Secarang
// are different systems): no test.
//
// The three TS are yellow (phase: pre-deploy). Their BEFORE half (step 1, "Done 28.10") was captured on the old
// build on 28.10.2026 15:14-15:16 MYT by 03-spec/before-run/ts-before.mjs, outside the per-TS gate:
// 05-evidence/pre-push/<TS>/ (run log, insurer-box and receipt insurer-block screenshots, receipt PDF, video).
// EAINT-12406 is now deployed (Azfar 29.10.2026), so the BEFORE half cannot be redone: there is NO [pre-push]
// test here. The BEFORE points are proved BY REFERENCE from that capture's own run log and screenshots, copied
// into this TS's folder and named as such (as 12253_EX_TS4 did), and the AFTER points are compared with the same
// run log, read the same way (CIBO "Insurer" text between "Insurer" and "Plan"; receipt by `pdftotext -layout`).
//
// READ ONLY: CIBO searches, Transaction Details, Receipt downloads. Nothing is bought, saved or changed here.
// Flow: cibo (VERIFIED 29.10.2026, run EAINT-12406-verify-cibo-c3-20261029-1541, after the last pages/cibo edit at
// 14:25; stop `receipt`, `signedIn` after ts.portal("cibo")). No verify run needed first unless pages/cibo changes again.
//
// DATA FROM OTHER TS (hand-off contract, automation/src/fixtures/ts-handoff.ts):
//   12406_RG_TS1 E4/E5 read the Tokio Marine purchase of 12406_E2E_TS10:
//       handOff(ts, "tokioMarinePurchase", { ref: "<CIBO Transaction Ref. No.>", plate, receiptNo, since, secarangReceipt: "<abs path to the PDF from the Success page>" })
//       (`ref`, or `plate` + `receiptNo` [+ `since`] for the cibo flow's look-up by plate), or env RG_TS1_TM_REF (+ RG_TS1_TM_SECARANG_RECEIPT)
//   12406_RG_TS2 E3 reads the Lonpac purchase of 12406_QT_TS4:
//       handOff(ts, "lonpacPurchase", { ref, plate, receiptNo, since, secarangReceipt })
//       or env RG_TS2_LONPAC_REF (+ RG_TS2_LONPAC_SECARANG_RECEIPT)
//   Without it those points are left unproved and noted (the gate files the TS as EVIDENCE, never PASS).
//   A hand-off is taken from this run, else the newest earlier run of the ticket, whatever the giver's verdict (as
//   the RC sheet does, `_rc.ts`): a purchase is real even when its TS was filed DEFECT for another point.
//   RG_TS1 E4 and RG_TS2 E3 cover the Secarang receipt AND CIBO: without the Secarang receipt the CIBO part is
//   recorded but not counted (provePart), so half a point never makes the TS valid.
//
// Re-checked 29.10.2026 (afternoon) by cr-author against ts.json of 13:00 (v5: RG changed in preconditions only, both
// already handled: BEFORE evidence labelled FROM THE BEFORE CAPTURE; "Bhd" = "Berhad" for Lonpac, Azfar 29.10).
// Re-checked again 29.10.2026 (late afternoon): scenarios.yaml of 15:16 gives the same RG rows and points as ts.json;
// run sRG-1330-c1 filed RG_TS3 VALID and RG_TS1 (E4, E5) / RG_TS2 (E3) EVIDENCE for the missing hand-offs only.
// 12406_E2E_TS10 now has a spec (3-secarang-allianz-purchase.e2e.cr.spec.ts): it hands on "tokioMarinePurchase"
// { ref, plate, receiptNo, since, secarangReceipt } stamped by: "12406_E2E_TS10", the shape read below. No code change.
//
// PERSONAL DATA: Transaction Details and the receipts show a customer's name, IC, phone and address. The details
// page is blurred before each proof screenshot (insurer box stays sharp); a receipt's full text is shown only for
// the video; proof screenshots show its Insurer block alone. Receipts are saved as *_PERSONAL-DATA.pdf (git-ignored).
import { test, expect, type TsRun } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { runCiboFlow } from "@flows/cibo.flow";
import { CiboTransactionDetailsPage } from "@pages/cibo/transaction-details.page";
import { takeOver } from "@fixtures/ts-handoff";
import type { ProveOptions } from "@fixtures/ts-run";
import { insurerBlock, quoteLines, sameLines, showReceiptInsurerBlock } from "./_receipt-pdf";
import { backToCibo } from "./_rc";

const PRE = path.resolve(__dirname, "..", "05-evidence", "pre-push");

// SRD v1.1 REQ-010 'Tokio Marine (current)'; layout of Transaction Details as captured 28.10 (Q29)
const TM_NAME = "Tokio Marine Insurans (Malaysia) Berhad";
const TM_NO = "198601000381 (149520-U)";
// Lonpac: "Bhd" also accepted on the receipt and in CIBO (EAINT-12175 / EAINT-12422; the TS's precondition)
const LONPAC_NAME = /^Lonpac Insurance (Berhad|Bhd)$/;
const LONPAC_RECEIPT = /^Lonpac Insurance (Berhad|Bhd) \(307414-T\)$/;
const lonpacSame = (s: string) => s.replace(/^Lonpac Insurance Bhd\b/, "Lonpac Insurance Berhad");

// ------------------------------------------------------------------ the BEFORE capture (28.10.2026)

interface Before {
  ts: string;
  dir: string;
  at: string;
  /** Ref → the Transaction Details "Insurer" text as logged (one line when the log has no line break in it). */
  details: Record<string, string>;
  /** Ref → the receipt Insurer block as logged, cut the same way as the AFTER one. */
  receipt: Record<string, string[]>;
}

/**
 * The 28.10 capture of `ref` for `tsId`. A run log or a value missing from it is missing EVIDENCE, not a defect:
 * the test stops here with the reason (gate: SCRIPT), never compares the AFTER half with an empty BEFORE.
 */
function beforeOf(tsId: string, ref: string): Before & { bDetails: string; bReceipt: string[] } {
  const dir = path.join(PRE, tsId);
  const logFile = path.join(dir, `${tsId}_run-log-before.txt`);
  if (!fs.existsSync(logFile)) throw new Error(`${tsId}: the BEFORE capture's run log is missing (${path.relative(PRE, logFile)}); nothing to compare the AFTER half with.`);
  const log = fs.readFileSync(logFile, "utf8");
  const at = (/BEFORE half, ([0-9: -]+MYT)/.exec(log) ?? ["", "28.10.2026"])[1];
  const details: Record<string, string> = {};
  for (const m of log.matchAll(/^E\d (BR\w+) Transaction Details Insurer: "(.*)"$/gm)) details[m[1]] = m[2];
  const receipt: Record<string, string[]> = {};
  for (const m of log.matchAll(/^E\d (BR\w+) receipt Insurer block: (\[.*\])$/gm)) receipt[m[1]] = insurerBlock(JSON.parse(m[2]) as string[]);
  const bDetails = details[ref] ?? "";
  const bReceipt = receipt[ref] ?? [];
  if (!bDetails || !bReceipt.length)
    throw new Error(`${tsId}: the BEFORE run log (05-evidence/pre-push/${tsId}/) has no ${!bDetails ? "Transaction Details Insurer" : "receipt Insurer block"} line for ${ref}; nothing to compare the AFTER half with.`);
  return { ts: tsId, dir, at, details, receipt, bDetails, bReceipt };
}

/** Prove a BEFORE point from the 28.10 capture: its screenshot copied into this TS's folder, its logged value checked. */
async function proveBefore(ts: TsRun, point: string, b: Before, shot: string, shows: string, match: boolean) {
  const src = path.join(b.dir, shot);
  if (!fs.existsSync(src)) {
    ts.note(`${point} not proved: the BEFORE screenshot ${shot} is not in 05-evidence/pre-push/${b.ts}/`);
    return;
  }
  const copy = path.join(ts.dir, ts.numbered(`${point}-from-before-capture-${path.basename(shot, ".png")}`));
  fs.copyFileSync(src, copy);
  await ts.prove(point, {
    shows: `FROM THE BEFORE CAPTURE (${b.at}, old build, before Dev deployed EAINT-12406; not redone): ${shows} | screenshot ${shot}`,
    match,
    file: copy,
  });
}

// ------------------------------------------------------------------ CIBO

interface LookUp {
  ref: string;
  insurer: { text: string; lines: string[] };
  receipt: string;
  details: CiboTransactionDetailsPage;
}

/** Which transaction: a CIBO Ref. No., or a plate + the Secarang Receipt No. (the cibo flow's look-up by plate). */
type Target = string | { ref?: string; plate?: string; receiptNo?: string; since?: string };

/** The TS runs whose tab already signed in to CIBO (one sign-in per TS). */
const ciboSignedIn = new WeakSet<TsRun>();

/**
 * Find the transaction in CIBO, read Transaction Details, download its Receipt. Stays on Transaction Details.
 * Signs in ONCE per TS (ts.portal); a later look-up in the same TS only opens the CIBO dashboard again (backToCibo:
 * a receipt shown in the tab replaced the app). A second ts.portal("cibo") in the same tab waited 90 s on a Login ID
 * box that kept detaching: the CIBO session outlives clearCookies and the login page bounced to the dashboard (run
 * eaint-12406-retest-sretest-20261030-0040-C-c2, 12406_RG_TS1's look-up of E2E_TS10's BR60006354; trace: CiboLoginPage.as
 * `boxes.nth(0).fill("")`, called from this lookUp; video frozen 66-119 s). Same in RG_TS2's second look-up.
 */
async function lookUp(ts: TsRun, target: Target, insurer: string, why: string): Promise<LookUp> {
  if (!ciboSignedIn.has(ts)) {
    await ts.portal("cibo", why);
    ciboSignedIn.add(ts);
  } else {
    await ts.card("CIBO (still signed in)", why, "", 1800);
    await backToCibo(ts);
  }
  const t = typeof target === "string" ? { ref: target } : target;
  const r = await runCiboFlow(ts.page, {
    ...(t.ref ? { ref: t.ref } : { plate: t.plate, receiptNo: t.receiptNo, since: t.since ? new Date(t.since) : undefined }),
    filter: { insuranceCompany: [insurer] }, signedIn: true, stopAfter: "receipt",
  });
  const ref = r.ref ?? t.ref ?? "";
  expect(r.insurer, `${ref}: CIBO Transaction Details shows no "Insurer"`).toBeTruthy();
  const receipt = await ts.download(r.receipt!, `${ref}_receipt_PERSONAL-DATA.pdf`);
  ts.note(`${ref}: CIBO row Ins. Co. "${r.row?.["Ins. Co."] ?? ""}", status "${r.row?.["Transaction Status"] ?? ""}"; Transaction Details Insurer "${r.insurer!.text}" (${r.insurer!.lines.length} line(s)); buttons ${JSON.stringify(r.documentButtons ?? [])}`);
  const details = new CiboTransactionDetailsPage(ts.page);
  await details.blurPersonalData();
  return { ref, insurer: r.insurer!, receipt, details };
}

const detailsWords = (l: LookUp) => `${l.ref} CIBO Transaction Details Insurer "${l.insurer.text}" on ${l.insurer.lines.length} line(s)`;

// ------------------------------------------------------------------ data handed on by another TS

interface Purchase {
  ref?: string;
  plate?: string;
  receiptNo?: string;
  /** ISO time: rows of `plate` created before it are ignored. */
  since?: string;
  secarangReceipt?: string;
  by?: string;
  run?: string;
  at?: string;
}

const found = (p: Purchase) => !!(p.ref || (p.plate && p.receiptNo));
// QT_TS4 hands on ref "" (it never reads the CIBO Ref. No.): an empty ref falls back to plate + Receipt No.
const nameOf = (p: Purchase) => p.ref || `plate ${p.plate}, Receipt No ${p.receiptNo}`;
const fromWhere = (p: Purchase) => `${p.by ?? "?"}${p.run ? `, run ${p.run}` : ""}`;

/**
 * The purchase `byTs` handed on under `key`: this run's first, else the newest of any earlier run of the ticket.
 * As in the RC sheet (`_rc.ts` purchase()): a purchase is real even when the TS that made it was filed DEFECT for
 * another point, so the giver's gate verdict is not required; where it came from is written in checks.txt and in
 * every proof that uses it. `envRef` (+ `envReceipt`) lets the QA name the transaction by hand when the giving TS
 * has not run (both givers have specs since 29.10.2026); `notRef` is refused (the BEFORE transaction is not a new purchase).
 */
function purchaseOf(ts: TsRun, key: string, byTs: string, envRef: string, envReceipt: string, notRef: string): Purchase | undefined {
  const env = process.env[envRef];
  if (env) {
    if (env.trim().toUpperCase() === notRef) throw new Error(`${envRef}=${env} is the 28.10 BEFORE transaction, not the new purchase of ${byTs}: name the transaction ${byTs} made.`);
    return { ref: env.trim(), secarangReceipt: process.env[envReceipt], by: `env ${envRef} (named by the QA for ${byTs})` };
  }
  const here = takeOver<Purchase>(ts, key);
  if (here && here.by === byTs && found(here)) return here;
  const runs = path.resolve(ts.dir, "..", "..", "..");
  const thisRun = path.basename(path.resolve(ts.dir, "..", ".."));
  let best: Purchase | undefined;
  for (const run of fs.existsSync(runs) ? fs.readdirSync(runs) : []) {
    if (run === thisRun) continue;
    const f = path.join(runs, run, "handoff.json");
    if (!fs.existsSync(f)) continue;
    let v: Purchase | undefined;
    try { v = JSON.parse(fs.readFileSync(f, "utf8"))[key]; } catch { v = undefined; }
    if (!v || v.by !== byTs || !found(v)) continue;
    if (!best || String(v.at ?? "") > String(best.at ?? "")) best = { ...v, run };
  }
  return best;
}

/**
 * A point made of several parts (e.g. "Secarang AND CIBO receipts"): a part that matches counts as the point's proof
 * only when every part could be checked (`complete`); otherwise it is a screenshot + note and the point stays
 * unproved (gate: EVIDENCE, never PASS on half a point). A part that does NOT match is always proved: a mismatch is
 * a defect whether or not the other parts were checked.
 */
async function provePart(ts: TsRun, complete: boolean, point: string, o: ProveOptions & { name: string }) {
  if (complete || !o.match) return ts.prove(point, o);
  await ts.shot(o.name, `${point} (part, recorded, not counted: the other part could not be checked): ${o.shows}`.slice(0, 160), o.hl);
  ts.note(`${point} part checked and matching, NOT counted as the point's proof (the other part is missing): ${o.shows}`);
  return undefined;
}

/** Copy the Secarang receipt another TS downloaded into this TS's folder; undefined when there is none. */
function secarangReceiptOf(ts: TsRun, p: Purchase, byTs: string): string | undefined {
  if (!p.secarangReceipt || !fs.existsSync(p.secarangReceipt)) {
    ts.note(`${byTs}'s Secarang receipt not found (${p.secarangReceipt ?? "no path handed on"})`);
    return undefined;
  }
  const dir = path.join(ts.dir, "downloadable (after)");
  fs.mkdirSync(dir, { recursive: true });
  const copy = path.join(dir, `${byTs}_secarang-receipt_PERSONAL-DATA.pdf`);
  fs.copyFileSync(p.secarangReceipt, copy);
  ts.note(`${byTs}'s Secarang receipt (downloaded on its Success page) copied in: ${path.basename(copy)}`);
  return copy;
}

// ------------------------------------------------------------------ the TS

test.describe("@sheet-RG 5 Regression: other insurers unchanged on the receipt and CIBO Transaction Details (post-push)", () => {
  test("12406_RG_TS1 [post-push] — Tokio Marine: BR69005852 unchanged after the deploy, and the E2E_TS10 purchase's receipts and Transaction Details as captured", { tag: ["@P2", "@func", "@sheet-RG", "@post-push"] }, async ({ ts }) => {
    test.skip(ts.phase !== "post-push", "the AFTER half: run with CR_PHASE=post-push (the BEFORE half was captured 28.10.2026)");
    test.setTimeout(20 * 60 * 1000);
    const REF = "BR69005852";
    const b = beforeOf("12406_RG_TS1", REF);
    const { bDetails, bReceipt } = b;

    // E1, E2: BEFORE, by reference
    await proveBefore(ts, "E1", b, `12406_RG_TS1_E1_03-insurer-box-${REF}.png`,
      `${REF} Transaction Details Insurer "${bDetails}" (one line in the page text: the number on the same line as the name)`,
      bDetails === `${TM_NAME} ${TM_NO}`);
    await proveBefore(ts, "E2", b, `12406_RG_TS1_E2_05-receipt-${REF}-insurer-block.png`,
      `${REF} receipt Insurer block ${quoteLines(bReceipt)}`,
      sameLines(bReceipt, ["Insurer", TM_NAME, TM_NO]));

    // E3: BR69005852 after the deploy, against the 28.10 capture
    const a = await lookUp(ts, REF, "TokioMarine", `${REF} (Tokio Marine): Transaction Details and Receipt after the deploy`);
    await ts.prove("E3", {
      shows: `${detailsWords(a)} | 28.10 capture "${bDetails}" on 1 line`,
      match: !!bDetails && a.insurer.text === bDetails && a.insurer.lines.length === 1,
      expected: `${REF} Transaction Details insurer identical to the 28.10 capture: "${bDetails}", on one line`,
      hl: a.details.insurerRow(),
      name: `E3-${REF}-transaction-details-insurer`,
    });
    const ra = await showReceiptInsurerBlock(ts, a.receipt, `CIBO receipt of ${REF} after the deploy`);
    await ts.prove("E3", {
      shows: `${REF} CIBO receipt Insurer block ${quoteLines(ra.block)} | 28.10 capture ${quoteLines(bReceipt)}`,
      match: bReceipt.length > 0 && sameLines(ra.block, bReceipt),
      expected: `${REF} receipt Insurer block identical to the 28.10 capture: ${quoteLines(bReceipt)}`,
      hl: ra.hl,
      name: `E3-${REF}-receipt-insurer-block`,
    });

    // E4, E5: the Tokio Marine purchase made by 12406_E2E_TS10
    const tm = purchaseOf(ts, "tokioMarinePurchase", "12406_E2E_TS10", "RG_TS1_TM_REF", "RG_TS1_TM_SECARANG_RECEIPT", REF);
    if (!tm) {
      ts.note("E4, E5 not proved: no Tokio Marine purchase handed on by 12406_E2E_TS10 (hand-off key tokioMarinePurchase, or env RG_TS1_TM_REF). Run E2E_TS10 first");
      return;
    }
    ts.note(`12406_E2E_TS10's Tokio Marine purchase: ${nameOf(tm)} (from ${fromWhere(tm)})`);
    // E4 is BOTH receipts of E2E_TS10 (Secarang AND CIBO). The Secarang part never proves E4 on its own (run 0040-C-c2
    // filed E4 "proved" from the Secarang receipt while the CIBO receipt was never reached, evidence review 30.10.2026):
    // a matching Secarang part is a screenshot + note; a mismatching one is proved at once (a defect either way). E4 is
    // proved by the CIBO receipt below, with the Secarang part in its match and words.
    const secRcpt = secarangReceiptOf(ts, tm, "12406_E2E_TS10");
    let secPart: { ok: boolean; words: string } | undefined;
    if (secRcpt) {
      const rs = await showReceiptInsurerBlock(ts, secRcpt, `Secarang receipt of 12406_E2E_TS10 (${nameOf(tm)})`);
      secPart = { ok: sameLines(rs.block, ["Insurer", TM_NAME, TM_NO]), words: `Secarang receipt (E2E_TS10, ${nameOf(tm)}; from ${fromWhere(tm)}) Insurer block ${quoteLines(rs.block)}` };
      await provePart(ts, false, "E4", {
        shows: secPart.words,
        match: secPart.ok,
        expected: `Secarang receipt: "${TM_NAME}", next line "${TM_NO}"`,
        hl: rs.hl,
        name: "E4-e2e-ts10-secarang-receipt-insurer-block",
      });
    }
    const t = await lookUp(ts, tm, "TokioMarine", `${nameOf(tm)} (12406_E2E_TS10's Tokio Marine purchase): Transaction Details and Receipt`);
    await ts.prove("E5", {
      shows: `${detailsWords(t)} (E2E_TS10's purchase; from ${fromWhere(tm)}) | 28.10 capture of ${REF} "${bDetails}" on 1 line`,
      match: t.insurer.text === `${TM_NAME} ${TM_NO}` && t.insurer.lines.length === 1,
      expected: `Transaction Details "${TM_NAME} ${TM_NO}", name and number on the same line, as captured 28.10`,
      hl: t.details.insurerRow(),
      name: `E5-${t.ref}-transaction-details-insurer`,
    });
    const rc = await showReceiptInsurerBlock(ts, t.receipt, `CIBO receipt of ${t.ref} (12406_E2E_TS10)`);
    // E4 is BOTH receipts: counted only when the Secarang receipt was checked too, and matches only when both match
    const ciboOk = sameLines(rc.block, ["Insurer", TM_NAME, TM_NO]);
    await provePart(ts, !!secPart, "E4", {
      shows: `CIBO receipt (E2E_TS10, ${t.ref}; from ${fromWhere(tm)}) Insurer block ${quoteLines(rc.block)} | ${secPart ? `${secPart.words}: ${secPart.ok ? "matches" : "DOES NOT MATCH"}` : "Secarang receipt NOT checked"}`,
      match: ciboOk && (!secPart || secPart.ok),
      expected: `Secarang AND CIBO receipts of E2E_TS10: "${TM_NAME}", next line "${TM_NO}"`,
      hl: rc.hl,
      name: "E4-e2e-ts10-cibo-receipt-insurer-block",
    });
    if (!secRcpt) ts.note("E4 NOT proved: the Secarang receipt of E2E_TS10 was not handed on (or the file is gone), so only the CIBO receipt was checked (recorded above, not counted)");
  });

  test("12406_RG_TS2 [post-push] — Lonpac: BR60006309 unchanged after the deploy, and the QT_TS4 purchase's receipts and Transaction Details", { tag: ["@P2", "@func", "@sheet-RG", "@post-push"] }, async ({ ts }) => {
    test.skip(ts.phase !== "post-push", "the AFTER half: run with CR_PHASE=post-push (the BEFORE half was captured 28.10.2026)");
    test.setTimeout(20 * 60 * 1000);
    const REF = "BR60006309";
    const b = beforeOf("12406_RG_TS2", REF);
    const { bDetails, bReceipt } = b;

    // E1: BEFORE, by reference (Details and receipt)
    await proveBefore(ts, "E1", b, `12406_RG_TS2_E1_03-insurer-box-${REF}.png`,
      `${REF} Transaction Details Insurer "${bDetails}" (no number)`,
      bDetails === "Lonpac Insurance Berhad");
    await proveBefore(ts, "E1", b, `12406_RG_TS2_E1_05-receipt-${REF}-insurer-block.png`,
      `${REF} receipt Insurer block ${quoteLines(bReceipt)}`,
      sameLines(bReceipt, ["Insurer", "Lonpac Insurance Berhad (307414-T)"]));

    // E2: BR60006309 after the deploy, against the 28.10 capture ("Bhd" for "Berhad" accepted: EAINT-12422)
    const a = await lookUp(ts, REF, "Lonpac", `${REF} (Lonpac): Transaction Details and Receipt after the deploy`);
    await ts.prove("E2", {
      shows: `${detailsWords(a)} | 28.10 capture "${bDetails}" on 1 line`,
      match: !!bDetails && lonpacSame(a.insurer.text) === lonpacSame(bDetails) && a.insurer.lines.length === 1,
      expected: `${REF} Transaction Details insurer identical to the 28.10 capture: "${bDetails}", one line, no number ("Bhd" also accepted, EAINT-12422)`,
      hl: a.details.insurerRow(),
      name: `E2-${REF}-transaction-details-insurer`,
    });
    const ra = await showReceiptInsurerBlock(ts, a.receipt, `CIBO receipt of ${REF} after the deploy`);
    await ts.prove("E2", {
      shows: `${REF} CIBO receipt Insurer block ${quoteLines(ra.block)} | 28.10 capture ${quoteLines(bReceipt)}`,
      match: bReceipt.length > 0 && sameLines(ra.block.map(lonpacSame), bReceipt.map(lonpacSame)),
      expected: `${REF} receipt Insurer block identical to the 28.10 capture: ${quoteLines(bReceipt)} ("Bhd" also accepted, EAINT-12422)`,
      hl: ra.hl,
      name: `E2-${REF}-receipt-insurer-block`,
    });

    // E3: the Lonpac purchase made by 12406_QT_TS4
    const lp = purchaseOf(ts, "lonpacPurchase", "12406_QT_TS4", "RG_TS2_LONPAC_REF", "RG_TS2_LONPAC_SECARANG_RECEIPT", REF);
    if (!lp) {
      ts.note("E3 not proved: no Lonpac purchase handed on by 12406_QT_TS4 (hand-off key lonpacPurchase, or env RG_TS2_LONPAC_REF). Run QT_TS4 first");
      return;
    }
    ts.note(`12406_QT_TS4's Lonpac purchase: ${nameOf(lp)} (from ${fromWhere(lp)})`);
    // E3 is the Secarang receipt AND CIBO: the Secarang part never proves E3 on its own (as RG_TS1 E4, 30.10.2026);
    // a matching one is a screenshot + note, the CIBO parts below count only when it was checked and matched.
    const secRcpt = secarangReceiptOf(ts, lp, "12406_QT_TS4");
    let secOk = false;
    if (secRcpt) {
      const rs = await showReceiptInsurerBlock(ts, secRcpt, `Secarang receipt of 12406_QT_TS4 (${nameOf(lp)})`);
      secOk = rs.block.length === 2 && rs.block[0] === "Insurer" && LONPAC_RECEIPT.test(rs.block[1]);
      await provePart(ts, false, "E3", {
        shows: `Secarang receipt (QT_TS4, ${nameOf(lp)}; from ${fromWhere(lp)}) Insurer block ${quoteLines(rs.block)}`,
        match: secOk,
        expected: `Secarang receipt Insurer "Lonpac Insurance Berhad (307414-T)" ("Bhd" also accepted, EAINT-12422)`,
        hl: rs.hl,
        name: "E3-qt-ts4-secarang-receipt-insurer-block",
      });
    }
    const q = await lookUp(ts, lp, "Lonpac", `${nameOf(lp)} (12406_QT_TS4's Lonpac purchase): Transaction Details and Receipt`);
    // E3 is the Secarang receipt AND CIBO: the CIBO parts count only when the Secarang receipt was checked too (provePart)
    await provePart(ts, !!secRcpt && secOk, "E3", {
      shows: `${detailsWords(q)} (QT_TS4's purchase; from ${fromWhere(lp)})`,
      match: LONPAC_NAME.test(q.insurer.text) && q.insurer.lines.length === 1,
      expected: `Transaction Details Insurer "Lonpac Insurance Berhad" (no number; "Bhd" also accepted, EAINT-12422)`,
      hl: q.details.insurerRow(),
      name: `E3-${q.ref}-transaction-details-insurer`,
    });
    const rc = await showReceiptInsurerBlock(ts, q.receipt, `CIBO receipt of ${q.ref} (12406_QT_TS4)`);
    await provePart(ts, !!secRcpt && secOk, "E3", {
      shows: `CIBO receipt (QT_TS4, ${q.ref}) Insurer block ${quoteLines(rc.block)}`,
      match: rc.block.length === 2 && rc.block[0] === "Insurer" && LONPAC_RECEIPT.test(rc.block[1]),
      expected: `CIBO receipt Insurer "Lonpac Insurance Berhad (307414-T)" ("Bhd" also accepted, EAINT-12422)`,
      hl: rc.hl,
      name: "E3-qt-ts4-cibo-receipt-insurer-block",
    });
    if (!secRcpt) ts.note("E3 NOT proved: the Secarang receipt of QT_TS4 was not handed on (or the file is gone), so only CIBO was checked (recorded above, not counted)");
  });

  test("12406_RG_TS3 [post-push] — RHB: BR55004008 Transaction Details and receipt identical to the 28.10 capture, no company number line added", { tag: ["@P3", "@func", "@sheet-RG", "@post-push"] }, async ({ ts }) => {
    test.skip(ts.phase !== "post-push", "the AFTER half: run with CR_PHASE=post-push (the BEFORE half was captured 28.10.2026)");
    test.setTimeout(15 * 60 * 1000);
    const REF = "BR55004008";
    const b = beforeOf("12406_RG_TS3", REF);
    const { bDetails, bReceipt } = b;

    // E1: BEFORE, by reference
    await proveBefore(ts, "E1", b, `12406_RG_TS3_E1_03-insurer-box-${REF}.png`,
      `${REF} Transaction Details Insurer "${bDetails}" (no number)`,
      bDetails === "RHB Insurance Berhad");
    await proveBefore(ts, "E1", b, `12406_RG_TS3_E1_05-receipt-${REF}-insurer-block.png`,
      `${REF} receipt Insurer block ${quoteLines(bReceipt)}`,
      sameLines(bReceipt, ["Insurer", "RHB Insurance Berhad (38000-U)"]));

    // E2: after the deploy, identical, no company number line added
    const a = await lookUp(ts, REF, "RHB", `${REF} (RHB): Transaction Details and Receipt after the deploy`);
    await ts.prove("E2", {
      shows: `${detailsWords(a)} | 28.10 capture "${bDetails}" on 1 line`,
      match: !!bDetails && a.insurer.text === bDetails && a.insurer.lines.length === 1,
      expected: `${REF} Transaction Details "RHB Insurance Berhad", identical to the 28.10 capture, no company number line added`,
      hl: a.details.insurerRow(),
      name: `E2-${REF}-transaction-details-insurer`,
    });
    const ra = await showReceiptInsurerBlock(ts, a.receipt, `CIBO receipt of ${REF} after the deploy`);
    await ts.prove("E2", {
      shows: `${REF} CIBO receipt Insurer block ${quoteLines(ra.block)} | 28.10 capture ${quoteLines(bReceipt)}`,
      match: bReceipt.length > 0 && sameLines(ra.block, bReceipt),
      expected: `${REF} receipt "RHB Insurance Berhad (38000-U)", identical to the 28.10 capture (no company number line added)`,
      hl: ra.hl,
      name: `E2-${REF}-receipt-insurer-block`,
    });
  });
});
