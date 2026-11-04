// EAINT-12406 sheet RC (4 Receipt / CIBO) — helpers for the RC specs only. Not a test file (the `cr` project runs
// only *.cr.spec.ts). Written 29.10.2026 by cr-author. No journey here: the Secarang and CIBO steps are in the flows.
//
// 1. PURCHASES FROM OTHER SHEETS. RC reads the purchases made by the E2E / QT sheets, through the hand-off contract
//    in 02-plan/coverage.md (RG section): handOff(ts, key, { ref, plate, receiptNo, since, secarangReceipt }).
//    Keys used here: "allianzPurchase" (12406_E2E_TS1, FPX), "allianzPurchase:card" (E2E_TS2),
//    "allianzPurchase:grabpay" (E2E_TS3), "allianzPurchase:shopeepay" (E2E_TS4), "tokioMarinePurchase" (E2E_TS10),
//    "lonpacPurchase" (QT_TS4), and RC's own "allianzUnpaid" (RC_TS9). Optional extra fields read when present:
//    printView { offered, text, shot } (E2E_TS1's Success page [Print receipt], RC_TS1 E9).
//    The newest hand-off wins: this run's first, else any earlier run of the ticket (04-runs/*/handoff.json). A
//    purchase is real even when the TS that made it was filed DEFECT for another point, so the gate verdict of the
//    giving TS is not required; the run and TS it came from are written in checks.txt.
// 2. RECEIPTS. Read with `pdftotext -raw` (reading order): each label of the receipt on its own line, followed by
//    its value; "Total Premium RM x" on one line; the Insurer block = the lines between "Insurer" and
//    "Coverage Type". Seen on the CIBO receipts of BR69005852 (Tokio Marine) and BR55004010 (Allianz, 28.10, before
//    the deploy) on 29.10.2026. `-layout` (the RG helper _receipt-pdf.ts) mixes the Receipt Summary column into the
//    Insurer lines on the Allianz receipt ("Berhad (735426-V)   Exclusively by agent …"), so it is used here only to
//    find where the agent line sits in the Receipt Summary.
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import type { Page } from "@playwright/test";
import type { TsRun } from "@fixtures";
import { runCiboFlow, type CiboResult, type CiboStep } from "@flows/cibo.flow";
import { ciboURL } from "@config/environments";
import { CiboSidebar } from "@pages/cibo/cibo-sidebar.page";
import { CiboLoginPage } from "@pages/cibo/cibo-login.page";

// ------------------------------------------------------------------ the SRD values (SRD v1.1 REQ-010 / REQ-011)

export const ALLIANZ_NAME = "Allianz General Insurance Company (Malaysia) Berhad";
export const ALLIANZ_NUMBER = "200601015674 (735426-V)";
/** The old one-line form, REQ-010 "Existing". */
export const ALLIANZ_OLD = "Allianz General Insurance Company (Malaysia) Berhad (735426-V)";
/** Agent line on an Allianz receipt (mockup CIBO 20261006 receipt; agency Serba Sentral, SRD 2.1.3b). */
export const ALLIANZ_AGENT = "Exclusively by agent Serba Sentral Sdn Bhd";
/** A company registration number line as Tokio Marine prints it: 12 digits + the old number in brackets. */
export const COMPANY_NUMBER = /^\d{12}\s*\([0-9A-Z]+-[A-Z]\)$/;

export const n = (s?: string | null) => String(s ?? "").replace(/\s+/g, " ").trim();

// ------------------------------------------------------------------ purchases handed on by other sheets

export interface Purchase {
  ref?: string;
  plate: string;
  receiptNo?: string;
  /** ISO time the giving TS started (rows of the made-up plate created before it are someone else's). */
  since: string;
  /** Absolute path of the Secarang receipt PDF saved on the Success page. */
  secarangReceipt?: string;
  printView?: { offered: boolean; text?: string; shot?: string };
  /**
   * Confirmation's price box of the purchase, "Basic Premium" … "Total Premium" (label → value, page order; no personal
   * data), handed on by 12406_E2E_TS1 since TS v6 (29.10.2026 evening) for 12406_RC_TS1 E10.
   */
  confirmation?: Record<string, string>;
  by?: string;
  at?: string;
  /** The run folder it was read from. */
  run?: string;
}

/** The newest hand-off under `key` (this run first, else any earlier run), noted in checks.txt; undefined when none. */
export function purchase(ts: TsRun, key: string): Purchase | undefined {
  const runs = path.resolve(ts.dir, "..", "..", "..");
  const here = path.basename(path.resolve(ts.dir, "..", ".."));
  let best: Purchase | undefined;
  for (const run of fs.existsSync(runs) ? fs.readdirSync(runs) : []) {
    const f = path.join(runs, run, "handoff.json");
    if (!fs.existsSync(f)) continue;
    let v: Purchase | undefined;
    try { v = JSON.parse(fs.readFileSync(f, "utf8"))[key]; } catch { v = undefined; }
    if (!v?.plate && !v?.ref) continue;
    const mine = run === here;
    if (!best || (mine && best.run !== here) || ((mine || best.run !== here) && String(v.at ?? "") > String(best.at ?? ""))) best = { ...v, run };
  }
  ts.note(best
    ? `hand-off "${key}": ${best.by ?? "?"} in run ${best.run} at ${best.at ?? "?"} — ref ${best.ref || "(none)"}, plate ${best.plate}, receipt no ${best.receiptNo || "-"}, receipt file ${best.secarangReceipt ? path.basename(best.secarangReceipt) : "(none)"}`
    : `hand-off "${key}": none in any run of ${ts.ticket || "this ticket"}`);
  return best;
}

/**
 * Find a handed-on purchase in CIBO (already signed in, `ts.portal("cibo")`) with the cibo flow: by its Ref. No.
 * when the giving TS read it, else by plate + Receipt No. + `since` (the flow's look-up by plate).
 */
export async function ciboLookUp(ts: TsRun, p: Purchase, insurer: string, stopAfter: CiboStep): Promise<CiboResult> {
  await backToCibo(ts);
  const filter = { insuranceCompany: [insurer] };
  return p.ref
    ? runCiboFlow(ts.page, { signedIn: true, ref: p.ref, filter, stopAfter })
    : runCiboFlow(ts.page, { signedIn: true, plate: p.plate, since: new Date(p.since), receiptNo: p.receiptNo || undefined, filter, stopAfter });
}

/**
 * Back into CIBO after a file was shown in the tab. `ts.showFile()` / `showSideBySide()` replace the page with
 * `setContent`: the address stays on CIBO but the app (and its sidebar) is gone, so the next sidebar click failed —
 * RC_TS8 run sRC-1330-c2 ("Could not find CIBO sidebar transaction-management" on a transaction-details address) and
 * RC_TS4 rerun sRC-1330 ("CIBO sidebar dashboard" after the CSV was shown). Opening the CIBO dashboard address keeps
 * the session: dashboard "Welcome, Test Admin.", sidebar back, Transaction Management opens from it (read-only probe
 * 03-spec/probes-automation/rc-back-to-cibo10.mjs, 29.10.2026). Does nothing when the sidebar is already there.
 */
export async function backToCibo(ts: TsRun): Promise<void> {
  if (await new CiboSidebar(ts.page).link("dashboard").count()) return;
  await ts.page.goto(ciboURL("dashboard"), { waitUntil: "domcontentloaded" });
  const login = new CiboLoginPage(ts.page);
  if (!(await login.isSignedIn())) throw new Error(`Back to CIBO after showing a file: the dashboard did not open signed in (landed on ${ts.page.url()}).`);
  await login.settle(60_000);
  ts.note("back to CIBO: the dashboard opened again (still signed in) after a file was shown in the tab");
}

/** A hand-off that must be there for this TS to run at all: stops the TS with a plain reason (gate: SCRIPT). */
export function needPurchase(ts: TsRun, key: string, byTs: string, why: string): Purchase {
  const p = purchase(ts, key);
  if (!p) throw new Error(`${ts.id} needs the purchase that ${byTs} hands on as "${key}" (${why}). Run ${byTs} first (sheet ${byTs.split("_")[1]}); see 02-plan/coverage.md.`);
  return p;
}

/** The Secarang receipt file of a purchase, when it was handed on and still exists. */
export function receiptFile(p?: Purchase): string | undefined {
  return p?.secarangReceipt && fs.existsSync(p.secarangReceipt) ? p.secarangReceipt : undefined;
}

/** Local calendar day (the PC runs on Malaysia time, like CIBO's dates). */
export const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, k: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + k);
export const dmy = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

/**
 * A window of at most one week that holds every purchase (team doc §8: Payment / Commission Report searches are
 * slow, a week at most): from the earliest purchase day, till 6 days later or today, whichever is earlier.
 */
export function weekWindow(ps: Purchase[]): { from: Date; till: Date } {
  const today = day(new Date());
  const days = ps.map((p) => day(new Date(p.since))).filter((d) => !Number.isNaN(d.getTime()));
  const from = days.length ? new Date(Math.min(...days.map((d) => d.getTime()))) : addDays(today, -6);
  const sixOn = addDays(from, 6);
  return { from, till: sixOn < today ? sixOn : today };
}

// ------------------------------------------------------------------ receipts

function pdftotext(args: string[]): string {
  const bins = [process.env.PDFTOTEXT, "C:/Program Files/Git/mingw64/bin/pdftotext.exe", "pdftotext"].filter(Boolean) as string[];
  for (const bin of bins) {
    try { return execFileSync(bin, args, { encoding: "utf8" }); } catch { /* next */ }
  }
  throw new Error(`pdftotext could not read ${args[args.length - 2]}`);
}

/** The receipt in reading order, one label or value per line. */
export const receiptRaw = (file: string) => pdftotext(["-raw", file, "-"]);
/** The receipt laid out as printed (two columns side by side). */
export const receiptLayout = (file: string) => pdftotext(["-layout", file, "-"]);

const lines = (raw: string) => raw.split(/\r?\n/).map(n).filter(Boolean);

/** The Insurer block: the lines after "Insurer" up to "Coverage Type" (the name may wrap onto two lines). */
export function insurerLines(raw: string): string[] {
  const ls = lines(raw);
  const i = ls.indexOf("Insurer");
  if (i < 0) return [];
  const out: string[] = [];
  for (const l of ls.slice(i + 1, i + 8)) {
    if (/^Coverage Type\b/.test(l)) break;
    out.push(l);
  }
  return out;
}

/** The Insurer block split into the name (wrapped lines joined) and the lines after it (from the company-number line on). */
export function insurerParts(raw: string): { block: string[]; name: string; after: string[] } {
  const block = insurerLines(raw);
  const k = block.findIndex((l) => /^\d{12}\b/.test(l));
  const nameLines = k < 0 ? block : block.slice(0, k);
  return { block, name: n(nameLines.join(" ")), after: k < 0 ? [] : block.slice(k) };
}

/**
 * The REQ-010 checks on an Allianz receipt's Insurer block (each can fail on its own):
 *   nameFirst      the block starts with the full Allianz name (it may wrap onto two lines)
 *   numberNextLine "200601015674 (735426-V)" is a line of its own, straight after the name's last line
 *   oldGone        "Berhad (735426-V)" (the old one-line form) is nowhere in the block
 *   likeTokio      the block's shape is Tokio Marine's: name line(s), then ONE company-number line, nothing after
 * Seen 29.10.2026 on the CIBO receipt of BR55004010 after the deploy: "Allianz General Insurance Company
 * (Malaysia)" / "Berhad 200601015674 (735426-V)" (number on the same line as "Berhad").
 */
export function allianzBlock(raw: string) {
  const block = insurerLines(raw);
  const joined = n(block.join(" "));
  const k = block.findIndex((l) => l === ALLIANZ_NUMBER);
  const firstNo = block.findIndex((l) => /\d{12}/.test(l));
  return {
    block,
    // The name line(s) = everything before the first line holding a 12-digit number; they must read exactly the name
    // (run 0040-C, 30.10.2026: "…(Malaysia)" / "Berhad 200601015674 (735426-V)" passed a startsWith on the joined text).
    nameFirst: n(block.slice(0, firstNo < 0 ? block.length : firstNo).join(" ")) === ALLIANZ_NAME,
    numberNextLine: k > 0 && n(block.slice(0, k).join(" ")) === ALLIANZ_NAME,
    oldGone: !/Berhad\s*\(735426-V\)/.test(joined),
    likeTokio: shapeOf(block) === "name, then company number",
    shows: block.length ? block.map((l) => `"${l}"`).join(" / ") : "(no Insurer block)",
  };
}

/** "name, then company number" when the block is name line(s) + one last line that is a company number. */
export function shapeOf(block: string[]): string {
  if (!block.length) return "no block";
  const last = block[block.length - 1];
  const numberLines = block.filter((l) => COMPANY_NUMBER.test(l));
  if (numberLines.length === 1 && COMPANY_NUMBER.test(last) && block.length >= 2) return "name, then company number";
  if (block.some((l) => /\d{12}/.test(l))) return "company number on the same line as (part of) the name";
  return "name only, no company number";
}

/** The value line(s) after a Purchase Details label, up to the next label. */
export function receiptValue(raw: string, label: string): string {
  const LABELS = ["Receipt No.", "Purchase Date", "Payment Method", "For", "Vehicle Plate No.", "Ownership Type", "Insurer", "Coverage Type", "Coverage Period"];
  const ls = lines(raw);
  const i = ls.indexOf(label);
  if (i < 0) return "";
  const out: string[] = [];
  for (const l of ls.slice(i + 1, i + 4)) {
    if (LABELS.includes(l)) break;
    out.push(l);
  }
  return n(out.join(" "));
}

/** "Total Premium RM 1,171.22" → "RM 1,171.22" ("" when absent). */
export const totalPremium = (raw: string) => n((/^Total Premium\s+(RM\s?[\d,]+\.\d{2})/m.exec(raw) || ["", ""])[1]);
/** "1,171.22" / "RM1,171.22" → 1171.22 (NaN when none). */
export const money = (s: string) => { const m = /(-?[\d,]+\.\d{2})/.exec(s); return m ? Number(m[1].replace(/,/g, "")) : NaN; };

/** The agent line and the PIAM ID line of a receipt (raw reading order). */
export function agentOf(raw: string): { agent: string; piam: string } {
  const ls = lines(raw);
  return { agent: ls.find((l) => /^Exclusively by agent\b/.test(l)) ?? "", piam: ls.find((l) => /^PIAM ID:/.test(l)) ?? "" };
}

/**
 * Does the Receipt Summary END with the agent line? On the printed layout (`-layout`) the summary is the right-hand
 * column: take the column where "Exclusively by agent" starts, and read that column on every line below it up to
 * the footer (the company's address line "… Sdn Bhd (<number> …)"). Only its "PIAM ID: …" line may follow.
 * Seen 29.10.2026 on the Tokio Marine (BR69005852) and Allianz (BR55004010, before the deploy) receipts.
 */
export function agentEndsSummary(layout: string): { ok: boolean; after: string[] } {
  const ls = layout.split(/\r?\n/);
  const i = ls.findIndex((l) => /Exclusively by agent/.test(l));
  if (i < 0) return { ok: false, after: [] };
  const col = Math.max(0, ls[i].indexOf("Exclusively by agent") - 2);
  const after: string[] = [];
  for (const l of ls.slice(i + 1)) {
    if (/Sdn Bhd \(\d/.test(l)) break; // footer: the company's own address block
    const right = n(l.slice(col));
    if (right) after.push(right);
  }
  return { ok: after.every((l) => /^PIAM ID:/.test(l)), after };
}

/**
 * The receipt's labels, by presence: the headings and labels seen on the Tokio Marine and Allianz receipts
 * (29.10.2026), plus the known wrong variants (Zurich's receipt said "Car Plate No.": trap T4). Values, add-on names
 * and the NCD line are not labels.
 */
export const RECEIPT_LABELS = [
  "Official Receipt", "Thank you for your purchase!", "Purchase Details", "Receipt Summary", "Receipt No.", "Purchase Date", "Payment Method",
  "For", "Vehicle Plate No.", "Ownership Type", "Insurer", "Coverage Type", "Coverage Period", "Basic Premium", "Premium after NCD", "Add-ons",
  "Gross Premium", "Service Tax", "Stamp Duty", "Total Premium",
  "Car Plate No.", "Plate No.", "Car No.", "Vehicle No.", "Vehicle Number",
];
export function labelsOf(raw: string): string[] {
  const ls = lines(raw);
  return RECEIPT_LABELS.filter((lab) => ls.some((l) => l === lab || l.startsWith(`${lab} `)));
}

// ------------------------------------------------------------------ on screen (evidence rendering, like ts.showFile)

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * Show two texts side by side in this tab (e.g. the Allianz and the Tokio Marine Insurer blocks) for the video and
 * the proof screenshot; returns the two boxes to outline. Same kind of page as `ts.showFile` (a blank page with a
 * heading), never mistaken for a portal screen.
 */
export async function showSideBySide(page: Page, heading: string, left: { title: string; text: string }, right: { title: string; text: string }) {
  await page.setContent(`<html><body style="margin:20px;font-family:Arial"><h2 style="background:#172B4D;color:#fff;padding:10px">${esc(heading)}</h2>
    <div style="display:flex;gap:24px">${[left, right].map((b, i) => `<div style="flex:1"><h3>${esc(b.title)}</h3><pre id="qa-side-${i}" style="white-space:pre-wrap;font:16px Consolas;border:1px solid #999;padding:10px">${esc(b.text)}</pre></div>`).join("")}</div></body></html>`);
  await page.waitForTimeout(2500);
  return [page.locator("#qa-side-0"), page.locator("#qa-side-1")];
}

/** Undo `blurPersonalData()` on one listing column (a proof about that column, e.g. UCD Name "-", must be readable). */
export async function unblurColumn(page: Page, column: string) {
  await page.evaluate((col) => {
    const ths = Array.from(document.querySelectorAll("table thead th")).map((t) => (t as HTMLElement).innerText.replace(/\s+/g, " ").trim());
    const i = ths.indexOf(col);
    if (i >= 0) document.querySelectorAll("table tbody tr").forEach((tr) => { const td = tr.children[i] as HTMLElement | undefined; if (td) td.style.filter = ""; });
  }, column);
}
