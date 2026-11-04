// @ticket   EAINT-12406
// @sheet    E2E (3 Allianz Purchase)
// @cases    12406_E2E_TS1, 12406_E2E_TS2, 12406_E2E_TS3, 12406_E2E_TS4, 12406_E2E_TS5, 12406_E2E_TS9, 12406_E2E_TS10, 12406_E2E_TS12
// @env      Secarang staging /ia/ + CIBO staging (INSTANCE=ia)
// @status   draft
//
// Written 29.10.2026 by cr-author from the approved TS (scenarios.yaml meta.approved_by: Azfar 29.10.2026, "Dev push
// the changes ady you may start"; ts.json 29.10 09:56). NOT run. Every expected point of 01-intake/ts.json is
// proved with ts.prove(); the wording of each check is the TS's own.
// Revised 29.10.2026 (afternoon) by cr-author for TS v5 (ts.json 29.10 13:00): 12406_E2E_TS5 no longer looks in
// CIBO between the attempts or reopens the payment page (Azfar 29.10: "for secarang memang cannot do anything as
// pending or resubmit"): CIBO is checked after the final payment; 12406_E2E_TS10 written (the Confirmation [Edit]
// links read from the site's code, flow `switchTo`); 12406_E2E_TS1 step 6 hands its [Print receipt] view on to
// 12406_RC_TS1 E9.
// Re-checked 29.10.2026 (evening) by cr-author against scenarios.yaml 15:16 (points unchanged, ts.json 13:00 = yaml):
// 12406_E2E_TS8 is now ON HOLD (kiv: Azfar 29.10 "the production one put on hold first"), so its production test
// was taken out of this file. Nothing else changed.
// Fixed 29.10.2026 (evening) after triage of run sE2E-1545-c1 (cr-author): receipt Total Premium read with
// pdftotext -raw (label and amount on one line; E2E_TS1 E5, TS2/TS3/TS4 E1; the four receipts of that run read
// "Total Premium RM 941.13" this way, TS4 rerun VALID); 12406_E2E_TS5 E1 reads the whole message box
// (div.card.error-bg: "Unsuccessful payment" + "You may try again."), not only the heading. E2 unchanged (KIV, Azfar).
//
// Brought to TS v6 (29.10.2026 evening; scenarios.yaml v6, ts.json regenerated from it; decisions under Azfar's full
// permission, STATUS.md):
//   - 12406_E2E_TS5 E2: the failed FPX attempt is looked for in CIBO > Payment Management with Payment Status "Failed"
//     (plate searched, the TS's day(s)); Transaction Management's row(s) of the plate and their final status recorded.
//     No pending payment is reopened. Read-only probe 03-spec/probes-author/pm-failed15.mjs (29.10): BR60006353 (this
//     TS's run of 16:47) shows ONE Payment Management row, "Paid", and none with Status "Failed" (a Failed row exists
//     only for transactions whose last payment failed, e.g. BR60006327): E2 as written is expected to come back
//     DOES NOT MATCH; question to the QA in the hand-back.
//   - 12406_E2E_TS1 now also hands on Confirmation's price box (`confirmation`) for 12406_RC_TS1 E10.
//   - 12406_E2E_TS9 written (the e-Invoice / TIN part dropped in v6): Tokio Marine's Add-ons first, then Allianz
//     (flow `lookFirst`, NEW: secarang flow UNVERIFIED for it until its verify test runs).
//   - 12406_E2E_TS12 written (approved in v6): every add-on looked at, then all ticked and paid.
//
// Changed 30.10.2026 (just after midnight) by cr-author, on the main session's decision under Azfar's full permission
// (29.10 evening, STATUS.md):
//   - 12406_E2E_TS12 now pays by Credit or Debit Card (Fiuu sandbox Visa, @data/secarang FIUU_SANDBOX_CARDS, 3D Secure
//     OTP 123456) instead of FPX. Run retest-sretest-20261029-1950-B-c2 (trace): the all-add-ons total was RM2,510.87
//     and the Fiuu sandbox refused the FPX request (merchant SB_newserbasentral, channel fpx_rhb, amount 2510.87) with
//     "P15 : Transaction amount must be less than or equal to MYR 2,000.00.", so the run timed out after 90 s. The TS's
//     step 5 and precondition name FPX, but no expected point of the TS is about the payment channel (E1 Success +
//     CIBO Paid / Allianz / Insurance created, E2 add-ons on Confirmation / receipt / CIBO, E3 receipt total =
//     Confirmation): the channel is only the means to finish the purchase. No card ceiling is known: the team doc §5
//     lists none, Fiuu's public cheat-sheet does not list P15, and every card payment of 29.10 was under RM1,000 (E2E_TS2).
//     If the card window also refuses the amount, payCard times out waiting for the card form (90 s): read the trace.
//     SUPERSEDED the same morning: card hit the same ceiling (run retest-sretest-20261030-0920-D-c1, card window
//     "Transaction amount must be less than or equal to MYR 2,000.00. (P15)"). The main session then decided, under
//     Azfar's full permission, to pay by PayLater by Grab (GrabPay simulator: select#status_code Success, Pay; the
//     verified flow path E2E_TS3 uses). Team doc §5: the e-wallet rails have NO amount limit (SRD EAINT-12107
//     REQ-004). E1's Payment Method is checked against "GrabPay" (team doc §5, as E2E_TS3). If GrabPay also refuses
//     above MYR 2,000, the TS stays blocked and goes to Dev (raise the sandbox limit): no fourth channel is tried.
//   - 12406_E2E_TS12 step 4 screenshot (25-confirmation-add-ons-total): the outline landed on the "Discount" heading
//     under Total Premium. Seen in that run's 25-…png and in E2E_TS1's 03-confirmation-allianz.png (first outline
//     ~30-45 px low, the second one right): the first outline is drawn just after the scroll, before the page settles.
//     The Total Premium label is now scrolled into place and the page left to settle before the shot.
//   - 12406_E2E_TS1: when E8 finds no e-Certificate button, it is not pressed (it waited 90 s for a button that is not
//     there); the second E8 proof records "no e-Certificate button, nothing to open". E7 is proved in two parts, each
//     judged on its own: Cover Note No + Policy No filled, and the Payment Ref ID ('SFX', Allianz's own insurer code).
//
// Not in this file (see 02-plan/coverage.md):
//   ON HOLD: 12406_E2E_TS6, TS7, TS11 (orange, kept on hold in v6); 12406_E2E_TS8 (production, Azfar 29.10)
//
// Flows: secarang (VERIFIED 29.10.2026 ~15:50, runs all1 / sw2 / cd5, `switchTo` included; `lookFirst` and the new
// add-on / Gender page-object methods added 29.10 evening: run the verify test "lookFirst + add-on controls + gender"
// before TS9 / TS12) and cibo (VERIFIED 29.10.2026 ~18:45, run c4). Every Secarang step between screens lives in the
// flow; this file proves the points through the flow's onStep / onSwitch hooks on the screen each point is about. On
// Add-ons and Confirmation TS9 / TS12 work the screen's own controls through page-object methods (add-on options,
// More Info, Sum Insured, MPA plan, ADD / REMOVE, Gender, the PIAM 'i'): the TS's steps on that one screen.
//
// Data. Quote inputs: @data/secarang secarangQuoteForm(plate) (IC = SECARANG_QUOTE_IC from env when set). One plate
// per TS, from the team's made-up range HXA0001A–HXA0020A (team doc §13), overridable per TS with
// SECARANG_PLATE_<TS id> (e.g. SECARANG_PLATE_12406_E2E_TS1) because a plate bought once may no longer quote
// (two-month rule). Whether Allianz quotes these plates is open (Q12): if it does not, the run stops at Buy.
// Owner on Confirmation: secarangOwner() (the QA's own phone / email from env; made-up name and address).
// The CIBO record is found by plate, created since the TS started, carrying the Success page's Receipt No.
// Personal data: CIBO Transaction Details and the receipts show the QA's phone / email: evidence stays out of git.

import { test, type TsRun } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import type { Locator, Page } from "@playwright/test";
import { runSecarangFlow, type SecarangResult, type SecarangScenario, type SecarangStep } from "@flows/secarang.flow";
import { runCiboFlow, type CiboResult } from "@flows/cibo.flow";
import { SecarangQuotationsPage } from "@pages/secarang/quotations.page";
import { SecarangConfirmationPage } from "@pages/secarang/confirmation.page";
import { SecarangPaymentPage, FPX_BANK, type SecarangPayChannel } from "@pages/secarang/payment.page";
import { SecarangSuccessPage } from "@pages/secarang/success.page";
import { CiboTransactionManagementPage } from "@pages/cibo/transaction-management.page";
import { CiboTransactionDetailsPage } from "@pages/cibo/transaction-details.page";
import { secarangOwner, secarangQuoteForm } from "@data/secarang";
import { ciboBaseURL } from "@config/environments";
import { handOff } from "@fixtures/ts-handoff";
import { SecarangAddOnsPage } from "@pages/secarang/add-ons.page";
import { CiboSidebar } from "@pages/cibo/cibo-sidebar.page";
import { CiboPaymentManagementPage } from "@pages/cibo/payment-management.page";
import { ALLIANZ_NAME as ALLIANZ_NAME_RC } from "./_rc";
import { addOnRows, ciboRows, confirmationRows, receiptRows, receiptTable, rowsText, sameAddOns, showColumns, valueKey, type PriceRow } from "./_receipt-summary";

// ------------------------------------------------------------------ data

/** Made-up team plates (team doc §13), one per TS; SECARANG_PLATE_<TS id> overrides. */
const PLATE: Record<string, string> = {
  "12406_E2E_TS1": "HXA0011A",
  "12406_E2E_TS2": "HXA0012A",
  "12406_E2E_TS3": "HXA0013A",
  "12406_E2E_TS4": "HXA0014A",
  "12406_E2E_TS5": "HXA0015A",
  "12406_E2E_TS9": "HXA0003A",
  "12406_E2E_TS10": "HXA0004A",
  "12406_E2E_TS12": "HXA0020A",
};

/** Tokio Marine as REQ-010 / REQ-011 write it ("Tokio Marine (current)"). */
const TM_NAME = "Tokio Marine Insurans (Malaysia) Berhad";
const TM_NUMBER = "198601000381 (149520-U)";
/** Allianz's company number (REQ-010 / REQ-011): must not be on a Tokio Marine document. */
const ALLIANZ_NUMBER_RE = /200601015674|735426-V/;
const plateOf = (ts: TsRun) => (process.env[`SECARANG_PLATE_${ts.id}`] ?? PLATE[ts.id] ?? "").trim().toUpperCase();

/** A valid discount code on /ia/ (team doc §9: RJC7 7%, COTEAM 5%, SCW5 5%); SECARANG_DISCOUNT_CODE overrides. */
const DISCOUNT = (process.env.SECARANG_DISCOUNT_CODE ?? "RJC7").trim();

// ------------------------------------------------------------------ reading helpers (no journey here)

const n = (s?: string | null) => String(s ?? "").replace(/\s+/g, " ").trim();
/** "RM 1,171.22" → 1171.22 (NaN when none). */
const rm = (s?: string | null) => {
  const m = /RM\s?(-?[\d,]+\.\d{2})/.exec(String(s ?? ""));
  return m ? Number(m[1].replace(/,/g, "")) : NaN;
};
/** Every RM amount in a text, as numbers. */
const allRm = (s: string) => [...s.matchAll(/RM\s?([\d,]+\.\d{2})/g)].map((m) => Number(m[1].replace(/,/g, "")));
/** The value of the first key matching `re` in a label → value map. */
const valueOf = (o: Record<string, string> | undefined, re: RegExp) => n(Object.entries(o ?? {}).find(([k]) => re.test(k))?.[1]);
/** The path of an address, for a caption ("/ia/car-insurance/choose-addons/…"). */
const pathOfUrl = (u: string) => {
  try {
    return new URL(u).pathname;
  } catch {
    return u;
  }
};
/** A CIBO value that is filled in: not empty and not the literal "-". */
const filled = (v: string) => !!v && v !== "-";
/** Payment Ref ID: insurer code + yyyymmdd + channel + number, e.g. TMIM20260917SFX0002 (team doc §9). */
const refIdOk = (v: string, channel: "SFX" | "SEW") => {
  const m = new RegExp(`^([A-Z]+)\\d{8}${channel}\\d+$`).exec(v);
  return { ok: !!m && !["LON", "TMIM"].includes(m[1]), code: m?.[1] ?? "" };
};

/**
 * A PDF's text. "-raw" keeps reading order: each receipt label with its value ("Total Premium RM 941.13"), the
 * Insurer value on the lines after "Insurer" up to "Coverage Type" (seen on the fx5 and HXA0014A Allianz receipts
 * 29.10.2026; same reading as _rc.ts). "-layout" splits the Receipt Summary labels from their values.
 */
function pdfText(file: string, mode: "-layout" | "-raw" = "-layout"): string {
  for (const bin of ["pdftotext", "C:/Program Files/Git/mingw64/bin/pdftotext.exe"]) {
    try {
      return execFileSync(bin, [mode, file, "-"], { encoding: "utf8" });
    } catch {
      /* next */
    }
  }
  throw new Error(`pdftotext not found to read ${file}`);
}

/** The page's text without its footer (the footer names every insurer after the deploy). */
async function textNoFooter(page: Page): Promise<string> {
  return page.evaluate(() => {
    const c = document.body.cloneNode(true) as HTMLElement;
    c.querySelectorAll("footer, app-footer").forEach((e) => e.remove());
    return (c.textContent || "").replace(/\s+/g, " ").trim();
  });
}

const PAYMENT_METHOD: Record<SecarangPayChannel, string> = {
  fpx: "Online Banking - RHB Bank", // team doc §5, receipt on /ia/ 19.10
  card: "Credit", // team doc §5, 20.10
  grabpay: "GrabPay", // team doc §5, 19.10
  shopeepay: "ShopeePay", // team doc §5, 20.10
};

// ------------------------------------------------------------------ proofs shared by the TS (each says which point)

/** All Quotations: the Allianz card, with the Allianz logo, available. */
async function proveAllianzCard(ts: TsRun, point: string, r: SecarangResult) {
  const quotes = new SecarangQuotationsPage(ts.page);
  const cards = r.quotations ?? [];
  const c = cards.find((x) => /allianz/i.test(x.insurer));
  const card = await quotes.card("Allianz").catch(() => null);
  const alt = card ? n(await card.locator("img[alt]").first().getAttribute("alt").catch(() => "")) : "";
  const shows = c
    ? `All Quotations: Allianz card, logo "${alt}", ${c.available ? `premium ${c.prices.join(" / ")}, Buy offered` : `UNAVAILABLE "${c.unavailableReason}"`} (cards: ${cards.map((x) => x.insurer).join(" > ")})`
    : `All Quotations: NO Allianz card (cards: ${cards.map((x) => `${x.insurer}${x.available ? "" : " unavailable"}`).join(" > ") || "none"})`;
  await ts.prove(point, { shows, match: !!c && c.available && /allianz/i.test(alt), hl: card, name: "all-quotations-allianz-card", expected: "Allianz quotation with the Allianz logo, selectable" });
}

/** Add-ons opened after Buy on the Allianz card, and it is Allianz's (Allianz named outside the footer). */
async function proveAddOnsForAllianz(ts: TsRun, point: string, r: SecarangResult) {
  const offered = r.addOns?.offered ?? [];
  const text = await textNoFooter(ts.page);
  const shows = `Add-ons after Buy on Allianz: ${offered.length} add-on card(s) [${offered.map((a) => `${a.name}${a.added ? " (in plan)" : ""}`).join("; ")}]; page names Allianz: ${/allianz/i.test(text) ? "yes" : "NO"}`;
  ts.note(`Add-ons amounts (recorded): ${offered.map((a) => a.text).join(" | ").slice(0, 900)}`);
  await ts.prove(point, { shows, match: offered.length > 0 && /allianz/i.test(text), hl: ts.page.locator(".addon-card").filter({ visible: true }).first(), name: "add-ons-allianz", expected: "Add-ons opens for Allianz" });
}

/** Confirmation names Allianz and shows its Total Premium. Returns the total (number). */
async function proveConfirmationAllianz(ts: TsRun, point: string, r: SecarangResult): Promise<number> {
  const conf = r.confirmation ?? {};
  const total = rm(conf["Total Premium"]);
  const text = await textNoFooter(ts.page);
  const others = ["Tokio Marine", "Lonpac"].filter((x) => text.includes(x));
  ts.note(`Confirmation summary (recorded): ${JSON.stringify(Object.fromEntries(Object.entries(conf).filter(([k]) => !/Email|Mobile|Full Name|IC No/i.test(k))))}`);
  const shows = `Confirmation names Allianz: ${/allianz/i.test(text) ? "yes" : "NO"}; other insurer named: ${others.join(", ") || "none"}; Total Premium ${conf["Total Premium"] ?? "(no 'Total Premium' row)"}`;
  await ts.prove(point, {
    shows,
    match: /allianz/i.test(text) && !others.length && !Number.isNaN(total),
    hl: [ts.page.getByText(/Allianz/).filter({ visible: true }).first(), ts.page.getByText("Total Premium", { exact: true }).filter({ visible: true }).first()],
    name: "confirmation-allianz",
    expected: "Confirmation for Allianz, with its premium",
  });
  return total;
}

/** Success page: "Thank you for your purchase!", Receipt No., Purchase Date, Payment Method, [Receipt]. Returns the Receipt No. */
async function proveSuccess(ts: TsRun, point: string, r: SecarangResult, method: string): Promise<string> {
  const ok = new SecarangSuccessPage(ts.page);
  const thanks = await ok.marker().isVisible().catch(() => false);
  const receiptBtn = await ok.receiptButton().isVisible().catch(() => false);
  const receiptNo = valueOf(r.success, /^Receipt No/i);
  const date = valueOf(r.success, /^Purchase Date/i);
  const shown = valueOf(r.success, /^Payment Method/i);
  const shows = `Success: "Thank you for your purchase!" ${thanks ? "shown" : "NOT shown"}; Receipt No. "${receiptNo}"; Purchase Date "${date}"; Payment Method "${shown}"; [Receipt] ${receiptBtn ? "shown" : "NOT shown"}`;
  await ts.prove(point, {
    shows,
    match: thanks && receiptBtn && !!receiptNo && !!date && shown.toLowerCase() === method.toLowerCase(),
    hl: [ok.marker(), ok.receiptButton()],
    name: "success-page",
    expected: `Success page 'Thank you for your purchase!' with Receipt No., Purchase Date, Payment Method '${method}' and a [Receipt] download`,
  });
  return receiptNo;
}

/** The Secarang receipt PDF saved, shown on screen, its Total Premium = the Confirmation total. Returns its text and file. */
async function proveReceiptTotal(ts: TsRun, point: string, r: SecarangResult, confTotal: number): Promise<{ txt: string; file: string }> {
  const file = await ts.download(r.receipt!, `secarang-receipt-${r.form.plateNo}-PERSONAL-DATA.pdf`);
  // Reading order ("-raw"), as _rc.ts totalPremium: "-layout" puts the Receipt Summary values in a column away from
  // their labels (HXA0014A receipt 29.10.2026: "Total Premium" on line 25, "RM 941.13" on line 17), so the total
  // was never found; "-raw" gives "Total Premium RM 941.13" on one line.
  const txt = pdfText(file, "-raw");
  const total = rm((/^Total Premium\s+(RM\s?[\d,]+\.\d{2})/m.exec(txt) || ["", ""])[1]);
  await ts.showFile(file, "Secarang receipt", txt);
  await ts.prove(point, {
    shows: `Receipt Total Premium ${Number.isNaN(total) ? "(not found in the PDF)" : `RM ${total.toFixed(2)}`}; Confirmation Total Premium ${Number.isNaN(confTotal) ? "(not read)" : `RM ${confTotal.toFixed(2)}`}`,
    match: !Number.isNaN(total) && !Number.isNaN(confTotal) && Math.abs(total - confTotal) < 0.005,
    hl: ts.page.locator("pre").first(),
    name: "receipt-total-premium",
    expected: "Receipt Total Premium = the total on the Confirmation page",
  });
  return { txt, file };
}

/**
 * Hand this Allianz purchase on to the later sheets that read it (RC receipts / CIBO): the contract written by the
 * RG author in 02-plan/coverage.md (ref, plate, receiptNo, since, secarangReceipt). Key "allianzPurchase" from
 * E2E_TS1 (FPX), "allianzPurchase:<channel>" from the others.
 */
type PrintView = { offered: boolean; text?: string; shot?: string };
function handOnPurchase(ts: TsRun, key: string, v: { ref?: string; plate: string; receiptNo: string; since: Date; secarangReceipt?: string; printView?: PrintView; confirmation?: Record<string, string> }) {
  handOff(ts, key, {
    ref: v.ref ?? "",
    plate: v.plate,
    receiptNo: v.receiptNo,
    since: v.since.toISOString(),
    secarangReceipt: v.secarangReceipt ?? "",
    ...(v.printView ? { printView: v.printView } : {}),
    ...(v.confirmation && Object.keys(v.confirmation).length ? { confirmation: v.confirmation } : {}),
  });
}

/** Confirmation's price box only ("Basic Premium" … "Total Premium"): what a later TS compares, no personal data. */
const confirmationPrices = (conf?: Record<string, string>) => Object.fromEntries(confirmationRows(conf).map((r) => [r.label, r.value]));

/**
 * 12406_E2E_TS1 step 6: "if the Success page offers [Print receipt], open it and screenshot the print view (judged in
 * RC_TS1)". `SecarangSuccessPage.printView` (window.print recorded, print CSS; fx5 29.10.2026: "Print" offered,
 * window.print called once, no new window). Recorded here, handed on as `printView { offered, text, shot }` for
 * 12406_RC_TS1 E9 (_rc.ts). Back to the screen view before the flow presses [Receipt].
 */
async function recordPrintView(ts: TsRun): Promise<PrintView> {
  const ok = new SecarangSuccessPage(ts.page);
  const pv = await ok.printView();
  if (!pv.offered) {
    ts.note("step 6: the Success page offers no [Print receipt] (recorded for 12406_RC_TS1 E9)");
    return { offered: false };
  }
  if (pv.popup) {
    const text = await pv.popup.evaluate(() => document.body.innerText).catch(() => "");
    ts.note(`step 6: [Print receipt] ("${pv.label}") opened a window ${pv.popup.url()}; its text kept, no screenshot (recorded)`);
    await pv.popup.close().catch(() => undefined);
    return { offered: true, text };
  }
  const text = await ts.page.evaluate(() => document.body.innerText).catch(() => "");
  const file = await ts.shot("success-print-receipt-view-PERSONAL-DATA", `step 6: [Print receipt] ("${pv.label}") print view, window.print called ${pv.printCalls}x (recorded for 12406_RC_TS1 E9)`);
  await ok.endPrintView();
  return { offered: true, text, shot: path.join(ts.dir, file) };
}

/** CIBO Transaction Management row of this purchase (found by plate + Receipt No), outlined. */
async function ciboRow(ts: TsRun, plate: string, since: Date, receiptNo: string | undefined, why: string): Promise<CiboResult> {
  await ts.portal("cibo", why);
  return runCiboFlow(ts.page, { signedIn: true, plate, since, receiptNo, stopAfter: "listing" });
}

function rowSays(c: CiboResult) {
  const row = c.row ?? {};
  return {
    insCo: n(row["Ins. Co."]),
    payment: n(row["Payment"]),
    mode: n(row["Payment Mode"]),
    status: n(row["Transaction Status"]),
    text: `Ref ${c.ref}: Ins. Co. "${n(row["Ins. Co."])}", Payment "${n(row["Payment"]).replace(/^RM[\d,.]+/, "RM…")}", Payment Mode "${n(row["Payment Mode"])}", Transaction Status "${n(row["Transaction Status"])}"`,
  };
}

/** Open Transaction Details of `ref` from the listing (cibo flow, already signed in). */
async function ciboDetails(ts: TsRun, ref: string) {
  const c = await runCiboFlow(ts.page, { signedIn: true, ref, stopAfter: "details" });
  return { c, d: new CiboTransactionDetailsPage(ts.page) };
}

/** Press a document button; keep what it gives (a download, or a new tab's file) and show it. */
async function openDocument(ts: TsRun, btn: Locator, label: string, name: string): Promise<{ file?: string; how: string }> {
  const dlP = ts.page.waitForEvent("download", { timeout: 30_000 }).catch(() => null);
  const o = await ts.open(btn, label);
  const dl = await Promise.race([dlP, ts.page.waitForTimeout(6_000).then(() => null)]);
  if (dl) return { file: await ts.download(dl, name), how: "download" };
  if (o.newTab && /^https?:/.test(o.url)) {
    const res = await ts.page.request.get(o.url).catch(() => null);
    // the document may live on another host: come back to CIBO before the next screenshot (the ts guard checks the host)
    const root = ciboBaseURL() ?? "";
    if (root && ts.page.url().startsWith("http") && !ts.page.url().startsWith(root)) await ts.back();
    if (res?.ok()) {
      const file = path.join(ts.dir, "downloadable", name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, await res.body());
      return { file, how: `new tab ${o.url}` };
    }
    return { how: `new tab ${o.url} (could not be fetched)` };
  }
  return { how: `no download and no new tab (now on ${ts.page.url()})` };
}

/** One Allianz purchase through the flow, with the TS's hook. */
function buy(ts: TsRun, plate: string, s: Omit<SecarangScenario, "form" | "insurer" | "owner" | "aroundPayment">) {
  return runSecarangFlow(ts.page, {
    form: secarangQuoteForm(plate),
    insurer: "Allianz",
    owner: secarangOwner(),
    aroundPayment: (what, fn) => ts.payWindow(what, fn),
    ...s,
  });
}

// ------------------------------------------------------------------ TS9 / TS12 helpers (reading and recording only)

/** Two amounts equal to the sen. */
const near = (x: number, y: number) => !Number.isNaN(x) && !Number.isNaN(y) && Math.abs(x - y) < 0.005;
/** A name for a screenshot file. */
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
/** An add-on name as compared across pages (any case, spacing). */
const nameKey = (s: string) => n(s).toLowerCase().replace(/[:*]/g, "").trim();
/** The last "RM n.nn" amount in a text (a quotation card's premium), NaN when none. */
const lastRm = (s: string) => { const all = allRm(s); return all.length ? all[all.length - 1] : NaN; };

/**
 * The page's text for an "is this page about Allianz, nothing of Tokio Marine?" check: the footer (it names every
 * insurer) and the Add-ons line "Your current insurance is from <insurer>" (the car's CURRENT policy, the site's code,
 * not the plan being bought) are left out; both are named in the proof.
 */
async function textForInsurer(page: Page): Promise<{ text: string; current: string }> {
  return page.evaluate(() => {
    const c = document.body.cloneNode(true) as HTMLElement;
    c.querySelectorAll("footer, app-footer").forEach((e) => e.remove());
    let current = "";
    c.querySelectorAll("*").forEach((e) => {
      if (e.children.length === 0 && /^\s*Your current insurance is from\b/i.test(e.textContent || "")) {
        current = (e.textContent || "").replace(/\s+/g, " ").trim();
        e.remove();
      }
    });
    return { text: (c.textContent || "").replace(/\s+/g, " ").trim(), current };
  });
}

type AddOnInfo = Awaited<ReturnType<SecarangAddOnsPage["options"]>>[number];
/** An add-on that can be ticked on its own: ADD enabled, a price above RM0.00, no option dropdown, no Sum Insured / Plan link. */
const simpleAddOn = (o: AddOnInfo) => o.addEnabled === true && !o.selects.length && !o.links.some((l) => /RM|Plan/.test(l)) && /^RM[\d,]+\.\d{2}$/.test(o.price) && rm(o.price) > 0;

/** Press ADD (or REMOVE) on one card; a pop-up it raises is recorded and closed with its X. Returns the pop-up text. */
async function pressAddOn(ts: TsRun, a: SecarangAddOnsPage, name: string, what: "add" | "remove"): Promise<string> {
  const btn = what === "add" ? a.addButton(name) : a.removeButton(name);
  await btn.scrollIntoViewIfNeeded().catch(() => undefined);
  await btn.click();
  await ts.page.waitForTimeout(800);
  const pop = await a.modalText();
  if (pop) {
    await ts.shot(`popup-after-${what}-${slug(name)}`, `${what.toUpperCase()} on ${name} raised a pop-up: "${pop.slice(0, 120)}" (recorded; closed with its X)`, a.modal());
    await a.closePopup();
  }
  return pop;
}

/**
 * 12406_E2E_TS12 steps 1-4 on the Add-ons screen, all recorded (SRD silent, Q32): every add-on with its price and More
 * Info; each option dropdown changed once; the windscreen Sum Insured tried inside, below and above its range (nothing
 * applied); the MPA plan changed; the add-ons already in the plan tried for removal; then EVERY add-on ticked.
 */
async function everyAddOn(ts: TsRun, a: SecarangAddOnsPage): Promise<{ ticked: string[]; notTicked: string[]; onPage: Record<string, string> }> {
  // step 1
  const opts = await a.options();
  ts.note(`step 1: ${opts.length} add-on(s) offered (recorded, Q32): ${opts.map((o) => `${o.name} ${o.price}${o.selects.length ? ` [${o.selects.map((s) => s.options.map((p) => p.text).join(" / ")).join("; ")}]` : ""}${o.links.length ? ` (${o.links.join(", ")})` : ""}${o.addEnabled === false ? " ADD disabled" : ""}${o.removeEnabled === false ? " REMOVE disabled" : ""}`).join(" | ")}`);
  for (const o of opts) {
    let info = "";
    try {
      const i = await a.openInfo(a.moreInfoLink(o.name), `More Info of ${o.name}`);
      info = i.kind === "none" ? "(the 'i' opened nothing)" : i.text;
      await ts.shot(`more-info-${slug(o.name)}`, `step 1: ${o.name} ${o.price}; More Info: "${info.slice(0, 110)}" (recorded)`, i.kind === "none" ? a.card(o.name) : a.infoBox());
    } catch (e) {
      info = `More Info not opened: ${String(e).split("\n")[0].slice(0, 160)}`;
      await ts.shot(`more-info-${slug(o.name)}`, `step 1: ${o.name} ${o.price}; ${info} (recorded)`, a.card(o.name));
    }
    await a.closeInfo();
    ts.note(`step 1: ${o.name}: More Info "${info.slice(0, 400)}"`);
  }
  // step 2: option dropdowns, once each
  for (const o of opts) {
    for (const [i, s] of o.selects.entries()) {
      const was = s.options.find((p) => p.value === s.value)?.text ?? s.value;
      const next = s.options.find((p) => p.value !== s.value);
      if (!next) { ts.note(`step 2: ${o.name} option ${i + 1} offers one value only ("${was}") (recorded)`); continue; }
      const ch = await a.chooseOption(o.name, i, next.value);
      await ts.shot(`option-${slug(o.name)}-${i + 1}`, `step 2: ${o.name}: "${was}" -> "${next.text}": add-on price ${ch.before} -> ${ch.after}; premium ${(await a.premium()).text} (recorded)`, a.card(o.name));
    }
  }
  // step 2: the windscreen Sum Insured typed below, above and inside its range (what the site accepts recorded), then
  // the INSIDE value APPLIED (coordinator's answer, 29.10 evening), so the all-add-ons purchase carries the windscreen
  // add-on with that sum insured and E2 checks its amount on Confirmation, the receipt and CIBO. The add-on is ADDed
  // first: the site re-prices a new sum insured only for an add-on already in the plan (its code, onSubmit of the
  // Sum Insured pop-up).
  if (await a.sumInsuredLink().count()) {
    const ws = opts.find((o) => /Windscreen/i.test(o.name))?.name ?? "Windscreen";
    if (await a.addButton(ws).isVisible().catch(() => false)) await pressAddOn(ts, a, ws, "add");
    const priceBefore = await a.priceOf(ws);
    const si = await a.openSumInsured(ws);
    const range = /between RM([\d,]+) and RM([\d,]+)/i.exec(si.hints.join(" "));
    if (!range) {
      await ts.shot("windscreen-sum-insured", `step 2: windscreen Sum Insured shows "${si.text.slice(0, 120)}": no range read, only the shown value ${si.value}; nothing applied (recorded)`, a.sumInsuredModal());
      await a.closePopup();
    } else {
      const min = Number(range[1].replace(/,/g, ""));
      const max = Number(range[2].replace(/,/g, ""));
      const shown = Number(si.value);
      const mid = Math.round((min + max) / 20) * 10;
      const inside = mid > min && mid < max && mid !== shown ? mid : shown >= min && shown <= max ? shown : mid;
      let applyInside = false;
      for (const [what, v] of [["below", Math.max(1, min - 100)], ["above", max + 100], ["inside", inside]] as const) {
        const t = await a.trySumInsured(v);
        if (what === "inside") applyInside = t.applyEnabled;
        await ts.shot(`windscreen-sum-insured-${what}`, `step 2: windscreen Sum Insured ${what} the range RM${min}-RM${max}: typed ${t.typed}; Apply ${t.applyEnabled ? "enabled" : "DISABLED"}; box ${t.invalid ? "marked invalid" : "not marked"}; hint "${t.hint}" (recorded, Q32)`, a.sumInsuredModal());
      }
      if (applyInside) {
        await a.applySumInsured();
        await ts.page.waitForTimeout(1_500);
        await ts.shot("windscreen-sum-insured-applied", `step 2: windscreen Sum Insured RM${inside} applied: link "${n(await a.sumInsuredLink(ws).innerText().catch(() => ""))}", add-on price ${priceBefore} -> ${await a.priceOf(ws)}; premium ${(await a.premium()).text} (recorded)`, a.card(ws));
      } else {
        ts.note(`step 2: the inside value RM${inside} left Apply disabled, so nothing was applied (the purchase keeps RM${si.value})`);
        await a.closePopup();
      }
    }
  } else ts.note("step 2: no add-on shows an editable Sum Insured (recorded)");
  // step 2: the MPA plan
  if (await a.mpaPlanLink().count()) {
    const cur = n(await a.mpaPlanLink().innerText());
    const mp = await a.openMpaPlans();
    const other = mp.plans.find((p) => p !== cur);
    if (!other) {
      await ts.shot("mpa-plans", `step 2: MPA plans ${mp.plans.join(", ")}: no other plan than "${cur}" (recorded)`, a.modal());
      await a.closePopup();
    } else {
      const picked = await a.pickMpaPlan(other);
      await ts.shot("mpa-plan-picked", `step 2: MPA ${cur} -> ${other}: "${picked.text.slice(0, 120)}" (recorded)`, a.modal());
      const label = await a.selectMpaPlan();
      await ts.shot("mpa-plan-selected", `step 2: "${label}" pressed: MPA card price ${await a.priceOf(/Motorist Personal Accident/i)} (recorded)`, a.card(/Motorist Personal Accident/i));
    }
  }
  // step 3: the add-ons in the plan when the page opened (Road Rangers …): can they be removed?
  for (const o of opts.filter((x) => x.removeEnabled !== null)) {
    if (o.removeEnabled === false) {
      await ts.shot(`mandatory-${slug(o.name)}`, `step 3: ${o.name}: REMOVE shown but disabled, it cannot be removed (recorded)`, a.removeButton(o.name));
      continue;
    }
    await pressAddOn(ts, a, o.name, "remove");
    const still = await a.removeButton(o.name).isVisible().catch(() => false);
    await ts.shot(`remove-${slug(o.name)}`, `step 3: REMOVE pressed on ${o.name}: ${still ? "still in the plan" : "taken out of the plan (it is added again in step 4)"} (recorded)`, a.card(o.name));
  }
  // step 4: tick EVERY add-on
  const p0 = await a.premium();
  const reasons: Record<string, string> = {};
  for (const o of await a.read()) {
    if (o.added) continue;
    const add = a.addButton(o.name);
    if (!(await add.count())) { reasons[o.name] = "no ADD shown"; continue; }
    if (!(await add.isEnabled())) { reasons[o.name] = "ADD disabled"; continue; }
    const pop = await pressAddOn(ts, a, o.name, "add");
    if (pop) reasons[o.name] = `pop-up "${pop.slice(0, 80)}"`;
  }
  const final = await a.read();
  const ticked = final.filter((o) => o.added).map((o) => o.name);
  const notTicked = final.filter((o) => !o.added).map((o) => `${o.name}${reasons[o.name] ? ` (${reasons[o.name]})` : ""}`);
  const onPage: Record<string, string> = {};
  for (const o of final) onPage[o.name] = await a.priceOf(o.name);
  const p1 = await a.premium();
  await ts.shot("every-add-on-ticked", `step 4: ${ticked.length} of ${final.length} add-on(s) in the plan${notTicked.length ? `; NOT in the plan: ${notTicked.join(", ")}` : ""}; premium ${p0.text} -> ${p1.text} (recorded)`, a.premiumLink());
  ts.note(`step 4: in the plan with their prices on Add-ons: ${Object.entries(onPage).map(([k, v]) => `${k} ${v}`).join(" | ")}`);
  return { ticked, notTicked, onPage };
}

const TAGS = (p: "@P1" | "@P2" | "@P3") => [p, "@e2e", "@sheet-E2E", "@destructive"];

test.describe("EAINT-12406 E2E — Allianz purchase on Secarang /ia/ (staging)", () => {
  test.skip(process.env.TEST_ENV === "production", "staging rows: never pay on production (team doc §2)");

  // ---------------------------------------------------------------------------------------------- TS1
  test("12406_E2E_TS1 — Allianz purchase by FPX Online banking (RHB): Success, receipt, CIBO row, cover note, e-Certificate", { tag: TAGS("@P1") }, async ({ ts }) => {
    test.setTimeout(20 * 60_000);
    const plate = plateOf(ts);
    const t0 = new Date();
    let confTotal = NaN;
    let receiptNo = "";
    let receiptFile = "";
    let printView: PrintView | undefined;
    let confPrices: Record<string, string> = {};
    await ts.site("Secarang", `Allianz purchase, FPX Online banking (RHB), car ${plate}`);
    const r = await buy(ts, plate, {
      payment: { channel: "fpx", bank: FPX_BANK.rhb },
      stopAfter: "receipt",
      onStep: async (st: SecarangStep, x: SecarangResult) => {
        if (st === "quotations") await proveAllianzCard(ts, "E1", x);
        if (st === "addOns") await proveAddOnsForAllianz(ts, "E1", x);
        if (st === "confirmation") {
          confTotal = await proveConfirmationAllianz(ts, "E2", x);
          // TS v6: Confirmation's price box is handed on for 12406_RC_TS1 E10 ("Premium After NCD" of the same purchase)
          confPrices = confirmationPrices(x.confirmation);
          if (!Object.keys(confPrices).length) ts.note("Confirmation price box not read (no 'Basic Premium' … 'Total Premium' rows): 12406_RC_TS1 E10 will lack it");
        }
        if (st === "paymentPage") {
          const tiles = x.tiles ?? [];
          const want = [/Credit or Debit Card/i, /FPX Online banking/i, /SPayLater|ShopeePay/i, /PayLater by Grab|GrabPay/i];
          const pay = new SecarangPaymentPage(ts.page);
          await ts.prove("E3", {
            shows: `Payment page tiles: ${tiles.map((t) => `"${n(t)}"`).join(", ")}`,
            match: tiles.length === 4 && want.every((re) => tiles.some((t) => re.test(t))),
            hl: await Promise.all((["card", "fpx", "shopeepay", "grabpay"] as const).map((c) => pay.tile(c).catch(() => ts.page.locator("#none")))),
            name: "payment-tiles",
          });
        }
        if (st === "paid") {
          receiptNo = await proveSuccess(ts, "E4", x, PAYMENT_METHOD.fpx);
          printView = await recordPrintView(ts);
        }
        if (st === "receipt") receiptFile = (await proveReceiptTotal(ts, "E5", x, confTotal)).file;
      },
    });
    ts.note(`purchase: ${r.payment?.detail}; Receipt No ${receiptNo}`);

    const c = await ciboRow(ts, plate, t0, receiptNo, `the Allianz purchase of ${plate} in Transaction Management`);
    handOnPurchase(ts, "allianzPurchase", { ref: c.ref, plate, receiptNo, since: t0, secarangReceipt: receiptFile, printView, confirmation: confPrices });
    const row = rowSays(c);
    // Payment Mode: as a Lonpac FPX payment on /ia/: bare "Fiuu" today, or the SA format (EAINT-12566, On Hold: not a 12406 failure)
    const modeOk = row.mode === "Fiuu" || /^Fiuu \| Online Banking [–-] FPX-RHB Bank$/.test(row.mode);
    await ts.prove("E6", {
      shows: row.text,
      match: /^Allianz\b/.test(row.insCo) && /Serba Sentral/.test(row.insCo) && /Paid/.test(row.payment) && /^Insurance created/.test(row.status) && modeOk,
      hl: new CiboTransactionManagementPage(ts.page).row(c.ref!),
      name: "cibo-listing-row",
    });

    const { c: dc, d } = await ciboDetails(ts, c.ref!);
    const cover = await d.value("Cover Note No");
    const policy = await d.value("Policy No");
    const refId = await d.value("Payment Ref ID");
    const ref = refIdOk(refId, "SFX");
    ts.note(`Allianz insurer code in the Payment Ref ID (recorded, Q30): "${ref.code}"`);
    // E7 in two parts, each judged on its own (30.10.2026): the cover note / policy part (Q44, none on any paid Allianz
    // purchase of 29.10) must not hide whether the Payment Ref ID part holds.
    await ts.prove("E7", {
      shows: `Cover Note No "${cover}", Policy No "${policy}"`,
      match: filled(cover) && filled(policy),
      hl: [d.label("Cover Note No"), d.label("Policy No")],
      name: "cibo-details-cover-note-policy",
      expected: 'CIBO Transaction Details: Cover Note No and Policy No filled (not "-")',
    });
    await ts.prove("E7", {
      shows: `Payment Ref ID "${refId}" (insurer code "${ref.code || "none read"}")`,
      match: ref.ok,
      hl: d.label("Payment Ref ID"),
      name: "cibo-details-payment-ref-id",
      expected: "CIBO Transaction Details: Payment Ref ID with 'SFX' like a Lonpac FPX payment (e.g. LON<yyyymmdd>SFX<nnnn>), with Allianz's own insurer code (not LON / TMIM)",
    });
    ts.note(`More Info (recorded): Submission status to JPJ "${await d.value("Submission status to JPJ")}"; step 8 (JPJ status after the job, Check JPJ Status) is a later manual look`);

    const buttons = dc.documentButtons ?? [];
    const hasCert = buttons.some((b) => /e-Certificate/i.test(b));
    await ts.prove("E8", {
      shows: `document buttons: ${buttons.join(", ") || "none"}`,
      match: hasCert && buttons.some((b) => /^Receipt$/i.test(n(b))),
      hl: [d.documentButton(/e-Certificate/i), d.documentButton(/Receipt/)],
      name: "cibo-document-buttons",
      expected: "e-Certificate and Receipt buttons shown",
    });
    if (!hasCert) {
      // No e-Certificate button: nothing to press (pressing it waited 90 s for a button that is not there, 29.10).
      await ts.prove("E8", {
        shows: "no e-Certificate button in Transaction Details, so no document to open (not pressed)",
        match: false,
        hl: null,
        name: "e-certificate-document",
        expected: "e-Certificate opens a document for this vehicle plate",
      });
      return;
    }
    const doc = await openDocument(ts, d.documentButton(/e-Certificate/i), "e-Certificate", `e-certificate-${plate}-PERSONAL-DATA.pdf`);
    const docText = doc.file ? (/\.pdf$/i.test(doc.file) ? pdfText(doc.file) : "") : "";
    if (doc.file) await ts.showFile(doc.file, "CIBO e-Certificate", docText || undefined);
    await ts.prove("E8", {
      shows: `e-Certificate: ${doc.how}${doc.file ? `, ${path.basename(doc.file)}; plate ${plate} in it: ${docText.replace(/\s+/g, "").toUpperCase().includes(plate) ? "yes" : "NO"}` : ""}`,
      match: !!doc.file && docText.replace(/\s+/g, "").toUpperCase().includes(plate),
      hl: doc.file ? ts.page.locator("pre").first() : null,
      name: "e-certificate-document",
      expected: "e-Certificate opens a document for this vehicle plate",
    });
  });

  // ---------------------------------------------------------------------------------------------- TS2
  test("12406_E2E_TS2 — Allianz purchase by Credit or Debit Card with a discount code: Success, receipt, CIBO", { tag: TAGS("@P2") }, async ({ ts }) => {
    test.setTimeout(20 * 60_000);
    const plate = plateOf(ts);
    const t0 = new Date();
    let confTotal = NaN;
    let receiptNo = "";
    let receiptText = "";
    let receiptFile = "";
    await ts.site("Secarang", `Allianz purchase, Credit or Debit Card + discount code ${DISCOUNT}, car ${plate}`);
    ts.note(`precondition: discount code ${DISCOUNT} (team doc §9 live codes); whether it applies to Allianz is recorded (Q25)`);
    const r = await buy(ts, plate, {
      discountCode: DISCOUNT,
      payment: { channel: "card" },
      stopAfter: "receipt",
      onStep: async (st, x) => {
        if (st === "confirmation") {
          confTotal = rm(x.confirmation?.["Total Premium"]);
          await ts.shot("confirmation-discount", `discount code ${DISCOUNT}: ${x.discountApplied ? "Apply pressed" : "Apply stayed disabled"}; Total Premium ${x.confirmation?.["Total Premium"] ?? "-"} (recorded, Q25)`,
            new SecarangConfirmationPage(ts.page).confirmAndPayButton());
        }
        if (st === "paid") receiptNo = await proveSuccess(ts, "E1", x, PAYMENT_METHOD.card);
        if (st === "receipt") ({ txt: receiptText, file: receiptFile } = await proveReceiptTotal(ts, "E1", x, confTotal));
      },
    });
    const applied = !!r.discountApplied;
    ts.note(`discount ${DISCOUNT}: ${applied ? "applied" : "NOT applied"} (recorded, Q25)`);

    // E4 on the receipt already on screen: a discount line only for codes MF / EAUTO / ER (team doc §3)
    const discountLine = (/^.*Discount.*$/im.exec(receiptText) || [""])[0].trim();
    const wantLine = applied && /^(MF|EAUTO|ER)/i.test(DISCOUNT);
    await ts.prove("E4", {
      shows: `code ${DISCOUNT} (${applied ? "applied" : "not applied"}); receipt discount line: ${discountLine ? `"${n(discountLine)}"` : "none"}`,
      match: !!discountLine === wantLine,
      hl: ts.page.locator("pre").first(),
      name: "receipt-discount-line",
    });

    const c = await ciboRow(ts, plate, t0, receiptNo, `the Allianz card purchase of ${plate} in Transaction Management`);
    handOnPurchase(ts, "allianzPurchase:card", { ref: c.ref, plate, receiptNo, since: t0, secarangReceipt: receiptFile });
    const row = rowSays(c);
    await ts.prove("E2", {
      shows: row.text,
      match: /^Allianz\b/.test(row.insCo) && /Paid/.test(row.payment) && /^Insurance created/.test(row.status) && row.mode === "Fiuu",
      hl: new CiboTransactionManagementPage(ts.page).row(c.ref!),
      name: "cibo-listing-row",
    });
    const { d } = await ciboDetails(ts, c.ref!);
    const cover = await d.value("Cover Note No");
    await ts.prove("E3", { shows: `Cover Note No "${cover}"`, match: filled(cover), hl: d.label("Cover Note No"), name: "cibo-details-cover-note" });
  });

  // ---------------------------------------------------------------------------------------------- TS3
  test("12406_E2E_TS3 — Allianz purchase by PayLater by Grab: Success, receipt, CIBO row and Payment Ref ID", { tag: TAGS("@P2") }, async ({ ts }) => {
    test.setTimeout(20 * 60_000);
    const plate = plateOf(ts);
    const t0 = new Date();
    let confTotal = NaN;
    let receiptNo = "";
    let receiptFile = "";
    await ts.site("Secarang", `Allianz purchase, PayLater by Grab (GrabPay sandbox), car ${plate}`);
    await buy(ts, plate, {
      payment: { channel: "grabpay" },
      stopAfter: "receipt",
      onStep: async (st, x) => {
        if (st === "confirmation") confTotal = rm(x.confirmation?.["Total Premium"]);
        if (st === "paid") receiptNo = await proveSuccess(ts, "E1", x, PAYMENT_METHOD.grabpay);
        if (st === "receipt") receiptFile = (await proveReceiptTotal(ts, "E1", x, confTotal)).file;
      },
    });
    const c = await ciboRow(ts, plate, t0, receiptNo, `the Allianz GrabPay purchase of ${plate} in Transaction Management`);
    handOnPurchase(ts, "allianzPurchase:grabpay", { ref: c.ref, plate, receiptNo, since: t0, secarangReceipt: receiptFile });
    const row = rowSays(c);
    ts.note(`Payment Mode exact text (recorded): "${row.mode}"`);
    await ts.prove("E2", {
      shows: row.text,
      match: /^Allianz\b/.test(row.insCo) && /Paid/.test(row.payment) && /^Insurance created/.test(row.status) && /^Fiuu \| eWallet [–-] GrabPay\b/.test(row.mode),
      hl: new CiboTransactionManagementPage(ts.page).row(c.ref!),
      name: "cibo-listing-row",
    });
    const { d } = await ciboDetails(ts, c.ref!);
    const cover = await d.value("Cover Note No");
    const refId = await d.value("Payment Ref ID");
    const ref = refIdOk(refId, "SEW");
    ts.note(`Allianz insurer code in the Payment Ref ID (recorded, Q30): "${ref.code}"`);
    await ts.prove("E3", {
      shows: `Cover Note No "${cover}", Payment Ref ID "${refId}" (insurer code "${ref.code}")`,
      match: filled(cover) && ref.ok,
      hl: [d.label("Cover Note No"), d.label("Payment Ref ID")],
      name: "cibo-details-cover-note-ref",
    });
  });

  // ---------------------------------------------------------------------------------------------- TS4
  test("12406_E2E_TS4 — Allianz purchase by SPayLater (ShopeePay simulator): Success, receipt, CIBO row and Payment Ref ID", { tag: TAGS("@P3") }, async ({ ts }) => {
    test.setTimeout(20 * 60_000);
    const plate = plateOf(ts);
    const t0 = new Date();
    let confTotal = NaN;
    let receiptNo = "";
    let receiptFile = "";
    await ts.site("Secarang", `Allianz purchase, SPayLater (ShopeePay simulator), car ${plate}`);
    await buy(ts, plate, {
      payment: { channel: "shopeepay" },
      stopAfter: "receipt",
      onStep: async (st, x) => {
        if (st === "confirmation") confTotal = rm(x.confirmation?.["Total Premium"]);
        if (st === "paid") receiptNo = await proveSuccess(ts, "E1", x, PAYMENT_METHOD.shopeepay);
        if (st === "receipt") receiptFile = (await proveReceiptTotal(ts, "E1", x, confTotal)).file;
      },
    });
    const c = await ciboRow(ts, plate, t0, receiptNo, `the Allianz SPayLater purchase of ${plate} in Transaction Management`);
    handOnPurchase(ts, "allianzPurchase:shopeepay", { ref: c.ref, plate, receiptNo, since: t0, secarangReceipt: receiptFile });
    const row = rowSays(c);
    await ts.prove("E2", {
      shows: row.text,
      match: /^Allianz\b/.test(row.insCo) && /Paid/.test(row.payment) && /^Insurance created/.test(row.status) && /^Fiuu \| eWallet [–-] ShopeePay$/.test(row.mode),
      hl: new CiboTransactionManagementPage(ts.page).row(c.ref!),
      name: "cibo-listing-row",
    });
    const { d } = await ciboDetails(ts, c.ref!);
    const refId = await d.value("Payment Ref ID");
    const ref = refIdOk(refId, "SEW");
    ts.note(`Allianz insurer code in the Payment Ref ID (recorded, Q30): "${ref.code}"`);
    await ts.prove("E3", { shows: `Payment Ref ID "${refId}" (insurer code "${ref.code}")`, match: ref.ok, hl: d.label("Payment Ref ID"), name: "cibo-details-ref" });
  });

  // ---------------------------------------------------------------------------------------------- TS5
  // v5 (29.10.2026): no look in CIBO between the attempts and no coming back to the payment page by its address
  // ("on Secarang a pending payment cannot be continued and nothing is resubmitted", Azfar 29.10): the run stays on
  // the payment page from the failed FPX to the final FPX, and CIBO is checked once, after the final payment.
  test("12406_E2E_TS5 — Allianz payment fails (FPX status 51), is cancelled (SPayLater), then paid by FPX; CIBO checked after the final payment", { tag: TAGS("@P2") }, async ({ ts }) => {
    test.setTimeout(25 * 60_000);
    const plate = plateOf(ts);
    const t0 = new Date();
    let confTotal = NaN;
    let receiptNo = "";
    await ts.site("Secarang", `Allianz: FPX fails (51), SPayLater cancelled, then FPX approved, car ${plate}`);
    await buy(ts, plate, {
      failFirst: [
        { channel: "fpx", bank: FPX_BANK.rhb, outcome: "failed", fpxFailCode: "51" },
        { channel: "shopeepay", outcome: "cancelled" },
      ],
      payment: { channel: "fpx", bank: FPX_BANK.rhb },
      stopAfter: "receipt",
      onStep: async (st, x) => {
        if (st === "confirmation") confTotal = rm(x.confirmation?.["Total Premium"]);
        if (st === "paid" && x.payment?.outcome === "failed") {
          // E1 on the payment page the failed attempt came back to
          const pay = new SecarangPaymentPage(ts.page);
          const tiles = await pay.tiles();
          const receiptShown = await new SecarangSuccessPage(ts.page).receiptButton().isVisible().catch(() => false);
          // The whole message box, heading AND line (29.10.2026 triage of run sE2E-1545-c1: the flow's
          // `unsuccessful` keeps only the heading, the box's <p> comes after a blank line in the page text). Markup from
          // the deployed /ia/ code (chunk 112.37aeef668bd97567781b.js, probe 03-spec/probes-author/unsuccessful-box13.mjs):
          // div.card.error-bg > div.card-body > h6 "Unsuccessful payment" + p "You may try again." (the pink box on
          // 01-failed-fpx-payment-page.png). The same card class also carries "We could not confirm your payment" and
          // the server-error box, hence the text filter.
          const box = ts.page.locator(".card.error-bg").filter({ visible: true }).filter({ hasText: /Unsuccessful payment/i });
          const boxes = await box.count();
          const msg = boxes ? n(await box.first().innerText()) : "";
          ts.note(`failed attempt: the flow read "${n(x.payment.unsuccessful)}"; message boxes with "Unsuccessful payment": ${boxes}`);
          await ts.prove("E1", {
            shows: `payment page message box: "${msg || "(no 'Unsuccessful payment' box)"}"; receipt ${receiptShown ? "SHOWN" : "none"}; tiles still offered: ${tiles.map((t) => `"${n(t)}"`).join(", ")}`,
            match: boxes === 1 && /^Unsuccessful payment\s+You may try again\.?$/i.test(msg) && !receiptShown && tiles.length === 4,
            hl: boxes ? box.first() : ts.page.getByText(/Unsuccessful payment/i).filter({ visible: true }).first(),
            name: "failed-fpx-payment-page",
          });
        }
        if (st === "paid" && x.payment?.outcome === "cancelled") {
          const pay = new SecarangPaymentPage(ts.page);
          const tiles = await pay.tiles();
          const text = await textNoFooter(ts.page);
          const hasPlate = text.toUpperCase().includes(plate);
          const hasPremium = !Number.isNaN(confTotal) && allRm(text).some((v) => Math.abs(v - confTotal) < 0.005);
          await ts.prove("E3", {
            shows: `after [OK]: "How would you like to pay?" ${/How would you like to pay/i.test(text) ? "shown" : "NOT shown"}, ${tiles.length} tiles; plate ${plate} ${hasPlate ? "shown" : "NOT shown"}; premium RM ${Number.isNaN(confTotal) ? "?" : confTotal.toFixed(2)} ${hasPremium ? "shown" : "NOT shown"}`,
            match: /How would you like to pay/i.test(text) && tiles.length === 4 && hasPlate && hasPremium,
            hl: ts.page.getByText(/How would you like to pay/i).filter({ visible: true }).first(),
            name: "after-spaylater-cancel",
          });
        }
        if (st === "paid" && x.payment?.outcome === "success") receiptNo = await proveSuccess(ts, "E4", x, PAYMENT_METHOD.fpx);
        if (st === "receipt") {
          const file = await ts.download(x.receipt!, `secarang-receipt-${plate}-PERSONAL-DATA.pdf`);
          ts.note(`receipt downloaded: ${path.basename(file)}`);
        }
      },
    });
    // step 5, after the final payment: the paid transaction (found by the Success page's Receipt No.) ...
    const c = await ciboRow(ts, plate, t0, receiptNo, `after the final payment: the Allianz transactions of ${plate} in Transaction Management`);
    const row = rowSays(c);
    await ts.prove("E4", {
      shows: row.text,
      match: /^Allianz\b/.test(row.insCo) && /Paid/.test(row.payment),
      hl: new CiboTransactionManagementPage(ts.page).row(c.ref!),
      name: "cibo-paid-row",
      expected: "CIBO shows the transaction with Payment Paid, Ins. Co. Allianz",
    });

    // ... then (TS v6, step 5; E2 RECORDED since the coordinator's answer of 29.10 evening, decided under Azfar's full
    // permission): CIBO keeps ONE Payment Management row per transaction with its final status, so a failed attempt
    // that is later paid is not listed on its own. E2 records what Payment Management and Transaction Management show
    // and does NOT fail on the absence of a "Failed" row. Searched by the plate (a failed attempt filed under its own
    // Ref. No. would show too) from the TS's start day to today (the Till calendar greys out future days, RC_TS5 triage
    // 29.10). Columns from the read-only probe pm-failed15.mjs (29.10): Payment "RM941.13 Paid 29-10-2026 16:48",
    // Payment Channel "Online Banking RHB Bank".
    const E2_RECORDED = "recorded: CIBO Payment Management and Transaction Management each show one row for the transaction, final status Paid / Insurance created; the failed FPX attempt is not listed separately";
    const t0Day = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate());
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const pm = new CiboPaymentManagementPage(ts.page);
    const pmRow = (x: Record<string, string>) => ({ ref: n(x["Transaction Ref. No."]).split(" ")[0], channel: n(x["Payment Channel"]), payment: n(x["Payment"]), refId: n(x["Payment Ref ID"]) });
    const pmText = (xs: ReturnType<typeof pmRow>[]) => xs.map((x) => `${x.ref} "${x.channel}" "${x.payment}" ${x.refId}`).join("; ") || "none";
    await new CiboSidebar(ts.page).open("payments");
    const allPm = (await pm.searchListing({ status: [], from: t0Day, till: today, text: plate })).map(pmRow).filter((x) => x.ref);
    const failedListed = allPm.filter((x) => /Failed/i.test(x.payment));
    await pm.blurPersonalData();
    await ts.prove("E2", {
      shows: `Payment Management, any Payment Status, plate ${plate}, ${t0Day.toDateString()} - today: ${allPm.length} row(s): ${pmText(allPm)}; rows of the paid transaction ${c.ref}: ${allPm.filter((x) => x.ref === c.ref).length}; a separate "Failed" row: ${failedListed.length ? pmText(failedListed) : "none"} (recorded)`,
      match: allPm.some((x) => x.ref === c.ref),
      hl: allPm.length ? allPm.map((x) => ts.page.locator("table tbody tr").filter({ visible: true }).filter({ hasText: x.ref }).first()) : null,
      name: "payment-management-rows",
      expected: E2_RECORDED,
    });
    // recorded beside it: the same search with Payment Status "Failed" only
    await new CiboSidebar(ts.page).open("payments");
    const failedRows = (await pm.searchListing({ status: ["Failed"], from: t0Day, till: today, text: plate })).map(pmRow).filter((x) => x.ref);
    await pm.blurPersonalData();
    await ts.shot("payment-management-status-failed", `Payment Management, Payment Status "Failed", plate ${plate}: ${failedRows.length} row(s)${failedRows.length ? `: ${pmText(failedRows)}` : (await pm.noResult()) ? ' ("Ops, no search result found")' : ""} (recorded)`);

    // ... and Transaction Management (recorded): the row(s) of this plate since the TS started, with their final status
    await new CiboSidebar(ts.page).open("transactions");
    const tm = new CiboTransactionManagementPage(ts.page);
    const rows = (await tm.findByPlate(plate, t0)).map((x) => ({
      ref: n(x["Transaction Ref. No."]).split(" ")[0],
      status: n(x["Transaction Status"]),
      payment: n(x["Payment"]).replace(/^RM[\d,.]+\s*/, ""),
    }));
    await tm.blurPersonalData();
    await ts.prove("E2", {
      shows: `Transaction Management, plate ${plate} since the TS started: ${rows.length} row(s): ${rows.map((x) => `${x.ref} "${x.status}" / "${x.payment}"`).join("; ") || "none"} (recorded)`,
      match: rows.some((x) => x.ref === c.ref),
      hl: rows.length ? rows.map((x) => tm.row(x.ref)) : null,
      name: "transaction-management-rows",
      expected: E2_RECORDED,
    });
  });

  // ---------------------------------------------------------------------------------------------- TS10
  // Allianz to Confirmation, [Edit] on the add-ons and back, [Edit] on the insurance plan > "Change your insurance
  // plan?" > Change > All Quotations > Tokio Marine, paid by FPX (flow `switchTo`). Also the Tokio Marine purchase
  // RG_TS1, RC_TS1, RC_TS3, RC_TS4 read: handed on as "tokioMarinePurchase".
  test("12406_E2E_TS10 — Allianz chosen, then changed on Confirmation to Tokio Marine and paid by FPX: Tokio Marine Confirmation, Success, receipt and CIBO, nothing of Allianz", { tag: TAGS("@P2") }, async ({ ts }) => {
    test.setTimeout(25 * 60_000);
    const plate = plateOf(ts);
    const t0 = new Date();
    let allianzTotal = NaN;
    let tmTotal = NaN;
    let receiptNo = "";
    let receiptFile = "";
    const conf = new SecarangConfirmationPage(ts.page);
    await ts.site("Secarang", `Allianz chosen, then Tokio Marine from Confirmation, FPX Online banking (RHB), car ${plate}`);
    const r = await buy(ts, plate, {
      switchTo: { insurer: "Tokio Marine" },
      payment: { channel: "fpx", bank: FPX_BANK.rhb },
      stopAfter: "receipt",
      onStep: async (st, x) => {
        if (st === "addOns" && x.insurerNow === "Allianz") {
          await ts.shot("add-ons-allianz", `step 1: Add-ons for Allianz, ${(x.addOns?.offered ?? []).length} add-on(s) (recorded)`, ts.page.locator(".addon-card").filter({ visible: true }).first());
        }
        if (st === "confirmation" && x.insurerNow === "Allianz") {
          allianzTotal = rm(x.confirmation?.["Total Premium"]);
          await ts.shot("confirmation-allianz", `step 1: Confirmation for Allianz, Total Premium ${x.confirmation?.["Total Premium"] ?? "-"} (recorded)`, [conf.planEditLink("Allianz"), conf.addOnsEditLink()]);
        }
        if (st === "quotations" && x.insurerNow === "Tokio Marine") {
          const cards = (x.quotations ?? []).map((q) => `${q.insurer}${q.available ? ` ${q.prices[0] ?? ""}` : " unavailable"}`).join(" > ");
          await ts.shot("all-quotations-after-change", `step 3: All Quotations after Change: ${cards} (recorded)`, await new SecarangQuotationsPage(ts.page).card("Tokio Marine").catch(() => null));
        }
        if (st === "confirmation" && x.insurerNow === "Tokio Marine") {
          tmTotal = rm(x.confirmation?.["Total Premium"]);
          const text = await textNoFooter(ts.page);
          const insurer = n(x.confirmation?.["Insurer"]);
          const allianzPrice = !Number.isNaN(allianzTotal) && allRm(text).some((v) => Math.abs(v - allianzTotal) < 0.005);
          await ts.prove("E1", {
            shows: `Confirmation after the change: Insurer "${insurer}"; Total Premium ${x.confirmation?.["Total Premium"] ?? "(none)"}; "Allianz" on the page: ${/allianz/i.test(text) ? "YES" : "no"}; Allianz's total RM ${Number.isNaN(allianzTotal) ? "?" : allianzTotal.toFixed(2)} on the page: ${allianzPrice ? "YES" : "no"}`,
            match: /Tokio Marine/i.test(insurer) && !/allianz/i.test(text) && !allianzPrice && !Number.isNaN(tmTotal),
            hl: [ts.page.getByText(/Tokio ?Marine/).filter({ visible: true }).first(), ts.page.getByText("Total Premium", { exact: true }).filter({ visible: true }).first()],
            name: "confirmation-tokio-marine",
            expected: "Confirmation is for Tokio Marine (no Allianz name or price)",
          });
        }
        if (st === "paid") {
          const ok = new SecarangSuccessPage(ts.page);
          const thanks = await ok.marker().isVisible().catch(() => false);
          receiptNo = valueOf(x.success, /^Receipt No/i);
          const text = await textNoFooter(ts.page);
          const amounts = allRm(text);
          const tmPrice = !Number.isNaN(tmTotal) && amounts.some((v) => Math.abs(v - tmTotal) < 0.005);
          const allianzPrice = !Number.isNaN(allianzTotal) && amounts.some((v) => Math.abs(v - allianzTotal) < 0.005);
          ts.note(`Success page names Tokio Marine: ${/Tokio ?Marine/i.test(text) ? "yes" : "no"} (recorded)`);
          await ts.prove("E1", {
            shows: `Success: "Thank you for your purchase!" ${thanks ? "shown" : "NOT shown"}; Receipt No. "${receiptNo}"; Tokio Marine total RM ${Number.isNaN(tmTotal) ? "?" : tmTotal.toFixed(2)} shown: ${tmPrice ? "yes" : "NO"}; "Allianz" on the page: ${/allianz/i.test(text) ? "YES" : "no"}; Allianz's total shown: ${allianzPrice ? "YES" : "no"}`,
            match: thanks && !!receiptNo && tmPrice && !allianzPrice && !/allianz/i.test(text),
            hl: [ok.marker(), ok.receiptButton()],
            name: "success-tokio-marine",
            expected: "the Success page is for Tokio Marine (no Allianz name or price)",
          });
        }
        if (st === "receipt") {
          receiptFile = await ts.download(x.receipt!, `secarang-receipt-${plate}-tokio-marine-PERSONAL-DATA.pdf`);
          const raw = pdfText(receiptFile, "-raw");
          await ts.showFile(receiptFile, "Secarang receipt (Tokio Marine)", raw);
          const lines = raw.split(/\r?\n/).map(n).filter(Boolean);
          const i = lines.indexOf("Insurer");
          const j = lines.findIndex((l, k) => k > i && /^Coverage Type$/i.test(l));
          const blk = i < 0 ? [] : lines.slice(i + 1, j > i ? j : i + 4);
          const k = blk.findIndex((l) => l === TM_NUMBER);
          const nameFirst = k > 0 && n(blk.slice(0, k).join(" ")) === TM_NAME;
          const allianzNo = ALLIANZ_NUMBER_RE.test(raw);
          await ts.prove("E2", {
            shows: `receipt Insurer lines: ${blk.map((l) => `"${l}"`).join(" / ") || "(no Insurer block)"}; Allianz company number in the receipt: ${allianzNo ? "YES" : "no"}`,
            match: nameFirst && !allianzNo,
            hl: ts.page.locator("pre").first(),
            name: "receipt-insurer-tokio-marine",
          });
        }
      },
      onSwitch: async (at, x) => {
        if (at === "addOnsEdit") {
          await ts.shot("add-ons-after-edit", `step 2: [Edit] on the add-ons lands here: ${pathOfUrl(ts.page.url())} (recorded)`, ts.page.locator(".addon-card").filter({ visible: true }).first());
        }
        if (at === "planEditPopup") {
          await ts.shot("change-plan-popup", `step 3: [Edit] on the insurance plan: pop-up "${(x.switched?.popup ?? "").slice(0, 160)}" (recorded)`, [conf.changePlanModal(), conf.changePlanButton()]);
        }
      },
    });
    ts.note(`switch: ${JSON.stringify(r.switched)}; purchase: ${r.payment?.detail}; Receipt No ${receiptNo}`);

    // step 6: CIBO
    const c = await ciboRow(ts, plate, t0, receiptNo, `the Tokio Marine purchase of ${plate} in Transaction Management`);
    handOnPurchase(ts, "tokioMarinePurchase", { ref: c.ref, plate, receiptNo, since: t0, secarangReceipt: receiptFile });
    const row = rowSays(c);
    await ts.prove("E3", {
      shows: row.text,
      match: /^Tokio ?Marine\b/i.test(row.insCo) && /Pemaju Eksklusif/.test(row.insCo) && !/Allianz|Serba Sentral/i.test(row.insCo),
      hl: new CiboTransactionManagementPage(ts.page).row(c.ref!),
      name: "cibo-listing-row-tokio-marine",
      expected: "CIBO row Ins. Co. Tokio Marine with agency badge Pemaju Eksklusif",
    });
    const { d } = await ciboDetails(ts, c.ref!);
    const lay = await d.insurerLayout();
    await ts.prove("E3", {
      shows: `Transaction Details Insurer "${lay.text}"; number in its own element / after a line break: ${lay.numberSeparate ? "YES" : "no"}; drawn lower than the start of the name (wrapping): ${lay.numberOnLowerLine ? "yes" : "no"}`,
      match: lay.text === `${TM_NAME} ${TM_NUMBER}` && !lay.numberSeparate,
      hl: (await d.field("Insurer")).locator,
      name: "cibo-details-insurer-tokio-marine",
      expected: `Transaction Details insurer "${TM_NAME} ${TM_NUMBER}", number on the same line as the name (wrapping), as captured on 28.10`,
    });
    // step 6 "open ... Receipt; screenshot" (recorded): the CIBO receipt of this transaction
    const cr = await ts.download(await d.downloadReceipt(), `cibo-receipt-${plate}-tokio-marine-PERSONAL-DATA.pdf`);
    await ts.showFile(cr, "CIBO receipt (Tokio Marine), recorded", pdfText(cr, "-raw"));
  });

  // ---------------------------------------------------------------------------------------------- TS9
  // TS v6 (29.10.2026 evening): the e-Invoice / TIN part is dropped (no TIN field for a private owner). Tokio Marine's
  // Add-ons first and back (flow `lookFirst`), the Allianz card's sum insured changed once, Allianz bought; two add-ons
  // ticked and one unticked against the price bar; Gender changed and set back; the PIAM 'i'; paid by FPX; the add-on
  // left ticked compared on Confirmation, the Secarang receipt and CIBO.
  test("12406_E2E_TS9 — Allianz after looking at Tokio Marine: add-ons ticked and unticked against the premium, gender re-prices, the PIAM 'i' names Serba Sentral; the add-on left ticked on Confirmation, receipt and CIBO", { tag: TAGS("@P2") }, async ({ ts }) => {
    test.setTimeout(25 * 60_000);
    const plate = plateOf(ts);
    const t0 = new Date();
    const a = new SecarangAddOnsPage(ts.page);
    const q = new SecarangQuotationsPage(ts.page);
    const conf = new SecarangConfirmationPage(ts.page);
    let tmPrice = NaN;
    let leftTicked: { name: string; price: string } | undefined;
    let confNow: Record<string, string> = {};
    let receiptNo = "";
    let receiptFile = "";
    /** E1 on the Allianz Add-ons / Confirmation page: Allianz named, Tokio Marine's name and premium nowhere. */
    const proveNoTokio = async (where: string, hl: Locator) => {
      const { text, current } = await textForInsurer(ts.page);
      const tmName = /Tokio ?Marine/i.test(text);
      const tmAmount = !Number.isNaN(tmPrice) && allRm(text).some((v) => near(v, tmPrice));
      await ts.prove("E1", {
        shows: `${where}: names Allianz ${/allianz/i.test(text) ? "yes" : "NO"}; "Tokio Marine" ${tmName ? "SHOWN" : "not shown"}; Tokio Marine's premium RM ${Number.isNaN(tmPrice) ? "?" : tmPrice.toFixed(2)} ${tmAmount ? "SHOWN" : "not shown"} (page footer${current ? ` and "${current}"` : ""} left out)`,
        match: /allianz/i.test(text) && !tmName && !tmAmount && !Number.isNaN(tmPrice),
        hl,
        name: `${slug(where)}-allianz-not-tokio-marine`,
        expected: `${where} is for Allianz (no Tokio Marine name or price)`,
      });
    };
    await ts.site("Secarang", `Tokio Marine's Add-ons first, back, then Allianz with add-ons, gender and the PIAM 'i', FPX (RHB), car ${plate}`);
    await buy(ts, plate, {
      lookFirst: { insurer: "Tokio Marine" },
      payment: { channel: "fpx", bank: FPX_BANK.rhb },
      stopAfter: "receipt",
      onStep: async (st, x) => {
        if (st === "quotations" && !x.lookedFirst) {
          const tm = (x.quotations ?? []).find((c) => /tokio/i.test(c.insurer));
          tmPrice = lastRm(tm?.text ?? "");
          await ts.shot("all-quotations", `step 1: All Quotations ${(x.quotations ?? []).map((c) => `${c.insurer} ${c.available ? c.prices.slice(-1)[0] ?? "" : "unavailable"}`).join(" > ")}; Tokio Marine selected next (recorded)`, await q.card("Tokio Marine").catch(() => null));
        }
        if (st === "addOns" && x.insurerNow === "Tokio Marine") {
          await ts.shot("add-ons-tokio-marine", `step 1: Add-ons after Buy on Tokio Marine (${(x.addOns?.offered ?? []).length} add-on(s)); next "Back to insurance selection" (recorded)`, a.backButton());
        }
        if (st === "quotations" && x.lookedFirst) {
          ts.note(`step 1: pop-up on "Back to insurance selection": ${x.lookedFirst.popup ? `"${x.lookedFirst.popup}"` : "none"} (recorded)`);
          // E2 (RECORDED since the coordinator's answer of 29.10 evening): the sum insured options the Allianz card offers
          // (seen 29.10 for the made-up cars: one value, RM20,200); only when there is more than one is it changed once and
          // the re-price proved.
          const card = await q.card("Allianz");
          const sel = card.locator(".sum-insured select").first();
          const values = (await sel.count()) ? await sel.evaluate((e) => Array.from((e as HTMLSelectElement).options).map((o) => o.text.trim())) : [];
          if (values.length <= 1) {
            await ts.prove("E2", {
              shows: `the Allianz card's sum insured offers ${values.length} value(s): ${values.join(", ") || "(no dropdown read)"} for ${plate}; nothing to change to (recorded)`,
              match: values.length === 1,
              hl: values.length ? sel : card,
              name: "allianz-sum-insured-options",
              expected: "recorded: the sum insured options offered (one value, RM20,200, for this car); if more than one, changing it re-prices",
            });
          } else {
            const before = lastRm(await card.innerText());
            const si = await q.chooseSumInsured("Allianz", "max");
            let after = lastRm(await card.innerText());
            for (let i = 0; near(after, before) && i < 20; i++) { await ts.page.waitForTimeout(500); after = lastRm(await card.innerText()); }
            await ts.prove("E2", {
              shows: `sum insured offers ${values.join(", ")}; changed to ${si.applied ? si.value : "(the change did not take)"}; Allianz premium RM ${Number.isNaN(before) ? "?" : before.toFixed(2)} -> RM ${Number.isNaN(after) ? "?" : after.toFixed(2)}`,
              match: si.applied && !Number.isNaN(before) && !Number.isNaN(after) && !near(before, after),
              hl: card,
              name: "allianz-sum-insured-price",
              expected: "more than one sum insured offered: changing it re-prices the Allianz card",
            });
          }
        }
        if (st === "addOns" && x.insurerNow === "Allianz") {
          await proveNoTokio("Add-ons", a.cards().first());
          // step 2: what is offered (recorded), then two ticked and one unticked against the price bar (E3)
          const opts = await a.options();
          ts.note(`step 2: add-ons offered for Allianz (recorded, Q32): ${opts.map((o) => `${o.name} ${o.price}`).join(" | ")}`);
          await ts.shot("add-ons-offered", `step 2: ${opts.length} add-on(s) offered for Allianz (recorded, Q32)`, a.cards().first());
          const pick = opts.filter(simpleAddOn).sort((m, k) => rm(m.price) - rm(k.price)).slice(0, 2);
          if (pick.length < 2) {
            ts.note(`E3 NOT proved: fewer than two add-ons that can be ticked alone with a price (${opts.map((o) => `${o.name} ${o.price}`).join(", ")})`);
          } else {
            const [one, two] = pick;
            const p0 = await a.premium();
            await pressAddOn(ts, a, one.name, "add");
            const p1 = await a.premiumAfter(p0.value);
            await pressAddOn(ts, a, two.name, "add");
            const p2 = await a.premiumAfter(p1.value);
            await ts.prove("E3", {
              shows: `premium ${p0.text}; ADD ${one.name} ${one.price} -> ${p1.text}; ADD ${two.name} ${two.price} -> ${p2.text}`,
              match: near(p1.value, p0.value + rm(one.price)) && near(p2.value, p1.value + rm(two.price)),
              hl: [a.premiumLink(), a.card(one.name), a.card(two.name)],
              name: "add-ons-tick-two",
              expected: "ticking an add-on adds its shown price to the premium",
            });
            await pressAddOn(ts, a, two.name, "remove");
            const p3 = await a.premiumAfter(p2.value);
            await ts.prove("E3", {
              shows: `REMOVE ${two.name} ${two.price}: premium ${p2.text} -> ${p3.text} (before it was ticked: ${p1.text})`,
              match: near(p3.value, p2.value - rm(two.price)) && near(p3.value, p1.value),
              hl: [a.premiumLink(), a.card(two.name)],
              name: "add-ons-untick-one",
              expected: "unticking it takes the price off again",
            });
            leftTicked = { name: one.name, price: one.price };
          }
        }
        if (st === "confirmation") {
          await proveNoTokio("Confirmation", ts.page.getByText("Total Premium", { exact: true }).filter({ visible: true }).first());
          // step 3 (recorded): the fields marked "*" with their colour, the agent line and commission %
          const marks = await ts.page.evaluate(() =>
            Array.from(document.querySelectorAll("span, label, small, p"))
              .filter((e) => !!(e as HTMLElement).offsetParent && Array.from(e.childNodes).some((c) => c.nodeType === 3 && /\*/.test(c.textContent || "")))
              .map((e) => `"${(e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40)}" ${getComputedStyle(e).color}`),
          );
          const al = await conf.agentLine();
          ts.note(`step 3: fields marked "*": ${marks.join(", ") || "none"}; agent line "${al.agent}"; commission "${al.commission}" (recorded, Q37)`);
          await ts.shot("confirmation-agent-line", `step 3: agent line "${al.agent}" | "${al.commission}"; "*" marks ${marks.length} (recorded, Q37)`, ts.page.locator("small.agent-text").filter({ visible: true }).first());
          // 3a / E4: a gender change re-prices; then set back
          if (!(await conf.genderSelect().count())) ts.note("E4 NOT proved: Confirmation shows no Gender dropdown");
          else {
            const g0 = await conf.gender();
            const other = g0 === "FEMALE" ? "MALE" : "FEMALE";
            const ch = await conf.setGender(other);
            await ts.prove("E4", {
              shows: `Gender ${g0 || "(empty)"} -> ${other}: Total Premium ${ch.before["Total Premium"] ?? "(none)"} -> ${ch.after["Total Premium"] ?? "(none)"}`,
              match: !!ch.before["Total Premium"] && !!ch.after["Total Premium"] && ch.before["Total Premium"] !== ch.after["Total Premium"],
              hl: [conf.genderSelect(), ts.page.getByText("Total Premium", { exact: true }).filter({ visible: true }).first()],
              name: "confirmation-gender-reprice",
            });
            const back = await conf.setGender(g0 === "FEMALE" ? "FEMALE" : "MALE");
            ts.note(`3a: Gender set back to ${g0 || "MALE"}: Total Premium ${back.after["Total Premium"] ?? "(none)"} (recorded)`);
          }
          // 3b / E5: the PIAM ID 'i'
          const info = await conf.agentInfo();
          await ts.prove("E5", {
            shows: `PIAM ID 'i' (${info.kind}): "${info.text.slice(0, 300)}"`,
            match: info.kind !== "none" && /Serba Sentral Sdn Bhd/i.test(info.text) && !/Pemaju Eksklusif|Bintang Prospek/i.test(info.text),
            hl: conf.infoBox(),
            name: "confirmation-piam-popup",
          });
          await conf.closeInfo();
          confNow = await conf.read();
        }
        if (st === "paid") {
          receiptNo = valueOf(x.success, /^Receipt No/i);
          await ts.shot("success-page", `step 4: Success, Receipt No. "${receiptNo}" (recorded)`, new SecarangSuccessPage(ts.page).receiptButton());
        }
        if (st === "receipt") receiptFile = await ts.download(x.receipt!, `secarang-receipt-${plate}-PERSONAL-DATA.pdf`);
      },
    });

    // step 5: CIBO, the transaction and its Transaction Details (premium breakdown)
    const c = await ciboRow(ts, plate, t0, receiptNo, `the Allianz purchase of ${plate} (after Tokio Marine) in Transaction Management`);
    const row = rowSays(c);
    const { d } = await ciboDetails(ts, c.ref!);
    const ins = await d.insurer();
    const boxText = await d.insurerBox().innerText();
    await d.blurPersonalData();
    await ts.prove("E7", {
      shows: `CIBO ${row.text}; Transaction Details Insurer "${ins.text}"`,
      match: /^Allianz\b/.test(row.insCo) && ins.text.startsWith(ALLIANZ_NAME_RC) && !/Tokio/i.test(`${row.insCo} ${boxText}`),
      hl: [d.insurerRow(), d.insurerBox()],
      name: "cibo-allianz-not-tokio-marine",
      expected: "CIBO shows Allianz as the insurer (no Tokio Marine)",
    });
    const rows = { conf: addOnRows(confirmationRows(confNow)), cibo: addOnRows(ciboRows(boxText)), receipt: [] as PriceRow[] };
    if (!receiptFile) ts.note("E7 (receipt) and E6 NOT proved: no Secarang receipt was downloaded");
    else {
      const table = receiptTable(receiptFile);
      rows.receipt = addOnRows(receiptRows(table));
      await ts.showFile(receiptFile, "Secarang receipt", table);
      const insurerLines = (table.split(/\r?\n/).find((l) => /Allianz General Insurance|Tokio Marine/i.test(l)) ?? "").trim();
      await ts.prove("E7", {
        shows: `receipt: "${insurerLines.slice(0, 120)}"; "Tokio Marine" anywhere in the receipt: ${/Tokio/i.test(table) ? "YES" : "no"}`,
        match: /Allianz General Insurance Company/i.test(table) && !/Tokio/i.test(table),
        hl: ts.page.locator("pre").first(),
        name: "receipt-allianz-not-tokio-marine",
        expected: "the receipt shows Allianz as the insurer (no Tokio Marine)",
      });
    }
    if (!leftTicked) ts.note("E6 NOT proved: no add-on was left ticked (E3 could not tick two add-ons)");
    else if (receiptFile) {
      const lt = leftTicked;
      const find = (rs: PriceRow[]) => rs.find((r) => nameKey(r.label) === nameKey(lt.name));
      const got = { conf: find(rows.conf), receipt: find(rows.receipt), cibo: find(rows.cibo) };
      const want = valueKey(lt.price);
      const cols = await showColumns(ts.page, `The add-on left ticked: ${lt.name} ${lt.price} (Add-ons page)`, [
        { title: "Confirmation (add-on lines)", text: rowsText(rows.conf) },
        { title: "Secarang receipt (add-on lines)", text: rowsText(rows.receipt) },
        { title: `CIBO ${c.ref} Transaction Details (add-on lines)`, text: rowsText(rows.cibo) },
      ]);
      await ts.prove("E6", {
        shows: `${lt.name} ${lt.price} on Add-ons; Confirmation ${got.conf?.value ?? "NOT listed"}; receipt ${got.receipt?.value ?? "NOT listed"}; CIBO ${got.cibo?.value ?? "NOT listed"}`,
        match: [got.conf, got.receipt, got.cibo].every((r) => !!r && valueKey(r.value) === want),
        hl: cols,
        name: "add-on-left-ticked-everywhere",
      });
    }
  });

  // ---------------------------------------------------------------------------------------------- TS12
  // TS v6 (29.10.2026 evening, approved): every Allianz add-on looked at (steps 1-3 recorded: SRD silent, Q32), then
  // EVERY add-on ticked and paid (Zurich's all-add-ons purchase failed, trap T1); the add-ons and amounts compared on
  // Confirmation, the Secarang receipt and CIBO.
  // Paid by PayLater by Grab, not FPX (30.10.2026, main session under Azfar's full permission): the Fiuu sandbox
  // refuses FPX (29.10) and Credit or Debit Card (30.10, run D-c1) above MYR 2,000.00 (P15; the all-add-ons total was
  // RM2,510.87); team doc §5: the e-wallet rails have no amount limit. The TS checks the add-ons, not the payment
  // channel (see the file header). If GrabPay refuses too, the TS is blocked for Dev: no fourth channel.
  test("12406_E2E_TS12 — Allianz add-ons one by one (recorded), then a purchase with every add-on ticked: Success, receipt and CIBO carry the same add-ons and amounts", { tag: TAGS("@P2") }, async ({ ts }) => {
    test.setTimeout(35 * 60_000);
    const plate = plateOf(ts);
    const t0 = new Date();
    const a = new SecarangAddOnsPage(ts.page);
    let all: { ticked: string[]; notTicked: string[]; onPage: Record<string, string> } = { ticked: [], notTicked: [], onPage: {} };
    let confRows: PriceRow[] = [];
    let confTotal = NaN;
    let receiptNo = "";
    let receiptFile = "";
    await ts.site("Secarang", `Allianz, every add-on looked at, then all ticked and paid by PayLater by Grab (FPX and card refuse above MYR 2,000), car ${plate}`);
    ts.note("payment channel: PayLater by Grab instead of the TS's FPX (main session, 30.10.2026, under Azfar's full permission): the Fiuu sandbox refused RM2,510.87 by FPX (run retest-sretest-20261029-1950-B-c2) and by Credit or Debit Card (run retest-sretest-20261030-0920-D-c1) with P15 'Transaction amount must be less than or equal to MYR 2,000.00'; team doc §5: e-wallet rails have no amount limit; no expected point of this TS is about the channel");
    await buy(ts, plate, {
      payment: { channel: "grabpay" },
      stopAfter: "receipt",
      onStep: async (st, x) => {
        if (st === "addOns") all = await everyAddOn(ts, a);
        if (st === "confirmation") {
          confRows = confirmationRows(x.confirmation);
          confTotal = rm(x.confirmation?.["Total Premium"]);
          // The outline is drawn right after ts.shot scrolls (25-confirmation-add-ons-total.png of 29.10 framed the
          // "Discount" heading below Total Premium): scroll the label to the middle first and let the page settle, so
          // the shot's own scroll does nothing and the outline lands on Total Premium.
          const totalLabel = ts.page.getByText("Total Premium", { exact: true }).filter({ visible: true }).first();
          await totalLabel.evaluate((e) => e.scrollIntoView({ block: "center", inline: "center" })).catch(() => undefined);
          await ts.page.waitForTimeout(1_000);
          await ts.shot("confirmation-add-ons-total", `step 4: Confirmation add-ons ${addOnRows(confRows).map((r) => `${r.label} ${r.value}`).join(", ") || "(none read)"}; Total Premium ${x.confirmation?.["Total Premium"] ?? "-"} (recorded)`, totalLabel);
        }
        if (st === "paid") receiptNo = await proveSuccess(ts, "E1", x, PAYMENT_METHOD.grabpay);
        if (st === "receipt") receiptFile = (await proveReceiptTotal(ts, "E3", x, confTotal)).file;
      },
    });

    // step 6: CIBO
    const c = await ciboRow(ts, plate, t0, receiptNo, `the all-add-ons Allianz purchase of ${plate} in Transaction Management`);
    const row = rowSays(c);
    await ts.prove("E1", {
      shows: `${row.text}; add-ons in the plan before Continue: ${all.ticked.length}${all.notTicked.length ? `, NOT in the plan: ${all.notTicked.join(", ")}` : " (every add-on)"}`,
      match: /^Allianz\b/.test(row.insCo) && /Paid/.test(row.payment) && /^Insurance created/.test(row.status) && all.ticked.length > 0 && !all.notTicked.length,
      hl: new CiboTransactionManagementPage(ts.page).row(c.ref!),
      name: "cibo-listing-row",
      expected: 'the purchase with EVERY add-on ticked: CIBO shows it Paid, Ins. Co. Allianz, Transaction Status "Insurance created"',
    });
    const { d } = await ciboDetails(ts, c.ref!);
    const boxText = await d.insurerBox().innerText();
    await d.blurPersonalData();
    await ts.shot("cibo-transaction-details-add-ons", `step 6: CIBO Transaction Details ${c.ref}: premium breakdown with Add-ons (recorded)`, d.insurerBox());

    // E2: the same add-ons and amounts on Confirmation, the Secarang receipt and CIBO Transaction Details
    const confAdd = addOnRows(confRows);
    const ciboAdd = addOnRows(ciboRows(boxText));
    const rcptAdd = receiptFile ? addOnRows(receiptRows(receiptTable(receiptFile))) : [];
    if (!receiptFile) ts.note("E2 NOT proved: no Secarang receipt was downloaded");
    else {
      const cr = sameAddOns(confAdd, rcptAdd);
      const cc = sameAddOns(confAdd, ciboAdd);
      const onPageVsConf = confAdd.filter((r) => { const k = Object.keys(all.onPage).find((p) => nameKey(p) === nameKey(r.label)); return k && valueKey(all.onPage[k]) !== valueKey(r.value); }).map((r) => r.label);
      ts.note(`recorded: Add-ons page vs Confirmation: ${Object.keys(all.onPage).filter((p) => !confAdd.some((r) => nameKey(r.label) === nameKey(p))).map((p) => `"${p}" not on Confirmation by that name`).join("; ") || "every add-on name on Confirmation"}${onPageVsConf.length ? `; amount differs for ${onPageVsConf.join(", ")}` : ""}`);
      const cols = await showColumns(ts.page, "Add-on lines: Confirmation, Secarang receipt, CIBO Transaction Details", [
        { title: "Confirmation", text: rowsText(confAdd) },
        { title: "Secarang receipt", text: rowsText(rcptAdd) },
        { title: `CIBO ${c.ref}`, text: rowsText(ciboAdd) },
      ]);
      const diff = (x: ReturnType<typeof sameAddOns>, what: string) => [...x.onlyA.map((s) => `${s} only on Confirmation (vs ${what})`), ...x.onlyB.map((s) => `${s} only on ${what}`), ...x.differ.map((s) => `${s} (${what})`)];
      await ts.prove("E2", {
        shows: `Confirmation ${confAdd.length} add-on line(s), receipt ${rcptAdd.length}, CIBO ${ciboAdd.length}; differences: ${[...diff(cr, "the receipt"), ...diff(cc, "CIBO")].join("; ") || "none"}`,
        match: cr.ok && cc.ok,
        hl: cols,
        name: "add-ons-confirmation-receipt-cibo",
      });
    }
  });
});
