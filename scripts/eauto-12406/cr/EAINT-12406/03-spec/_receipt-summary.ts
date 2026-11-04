// EAINT-12406 — the price breakdown (Basic Premium … Total Premium) as Confirmation, the Secarang receipt and CIBO
// Transaction Details print it, read into rows so the TS can compare them. Not a test file (the `cr` project runs only
// *.cr.spec.ts). Written 29.10.2026 evening by cr-author for TS v6 (12406_RC_TS1 E10, 12406_E2E_TS9 E6,
// 12406_E2E_TS12 E2). Reading only: no page is driven here.
//
// Where each source was seen (29.10.2026):
//  - RECEIPT: `pdftotext -table` (Xpdf 4.00 in Git for Windows) keeps each Receipt Summary row on one line, label then
//    amount: "Basic Premium   RM 1,203.08", "NCD 30.0%   - RM 360.92", "All Drivers   RM 20.00", "Premium after NCD
//    RM 882.16", "Add-ons" (a heading, no amount), "Allianz Road Rangers   FREE", "Gross Premium …", "Total Premium …",
//    then "Exclusively by agent …" (E2E_TS1 receipt of run sretest-1835-A-c1, HXA0011A). "-layout" puts the amounts in
//    a column away from their labels; "-raw" mixes the order.
//  - CONFIRMATION: SecarangConfirmationPage.read() gives the price box rows in page order ("Basic Premium",
//    "NCD 30%", "All Drivers", "Premium After NCD", "Allianz Road Rangers", "Gross Premium", …, "Total Premium"); the
//    "Add-Ons" heading is not a row (E2E_TS1 run notes, same run).
//  - CIBO: the insurer box text (CiboTransactionDetailsPage.insurerBox()) holds "Basic Premium\nRM1,203.08\nNCD 30%\n
//    -RM360.92\nAll Drivers\nRM20.00\nPremium After NCD\nRM882.16\nAdd-ons\nAllianz Road Rangers\nFREE\nGross Premium
//    …" (read-only probe 03-spec/probes-author/details-addons17.mjs, BR60006357).
import { execFileSync } from "node:child_process";
import type { Page } from "@playwright/test";

export interface PriceRow { label: string; value: string }

const n = (s?: string | null) => String(s ?? "").replace(/\s+/g, " ").trim();
const key = (s: string) => n(s).toLowerCase().replace(/[:*]/g, "").trim();
const isAmount = (v: string) => /^-?\s*RM\s?[\d,]+\.\d{2}$|^FREE$/i.test(n(v));

/** A shown amount as a number: "RM 1,203.08" → 1203.08, "- RM 360.92" / "-RM360.92" → -360.92, "FREE" → 0, else NaN. */
export function amountOf(v: string): number {
  const t = n(v);
  if (/^FREE$/i.test(t)) return 0;
  const m = /^(-)?\s*RM\s?([\d,]+\.\d{2})$/i.exec(t);
  return m ? (m[1] ? -1 : 1) * Number(m[2].replace(/,/g, "")) : NaN;
}

/** The value as compared across sources: "FREE", or the amount with two decimals ("" when not an amount). */
export const valueKey = (v: string) => (/^FREE$/i.test(n(v)) ? "FREE" : Number.isNaN(amountOf(v)) ? "" : amountOf(v).toFixed(2));

function pdftotext(args: string[]): string {
  const bins = [process.env.PDFTOTEXT, "C:/Program Files/Git/mingw64/bin/pdftotext.exe", "pdftotext"].filter(Boolean) as string[];
  for (const bin of bins) {
    try { return execFileSync(bin, args, { encoding: "utf8" }); } catch { /* next */ }
  }
  throw new Error(`pdftotext could not read ${args[args.length - 2]}`);
}

/** The receipt as `pdftotext -table` prints it (rows kept whole). */
export const receiptTable = (file: string) => pdftotext(["-table", file, "-"]);

/**
 * The Receipt Summary rows of a receipt read with `-table`: the right-hand column from the "Receipt Summary" line down
 * to the agent line. A row is "label  amount"; a label alone is either the "Add-ons" heading (kept, value "") or a
 * label wrapped onto two lines (joined with the row that carries its amount).
 */
export function receiptRows(table: string): PriceRow[] {
  const lines = table.split(/\r?\n/);
  const i = lines.findIndex((l) => /Receipt Summary/.test(l));
  if (i < 0) return [];
  const col = Math.max(0, lines[i].indexOf("Receipt Summary") - 1);
  const rows: PriceRow[] = [];
  let pending = "";
  for (const l of lines.slice(i + 1)) {
    const right = n(l.slice(col));
    if (!right) continue;
    if (/^(Exclusively by agent|PIAM ID)/i.test(right)) break;
    const parts = l.slice(col).trim().split(/\s{2,}/).map(n).filter(Boolean);
    const value = parts.length > 1 && isAmount(parts[parts.length - 1]) ? parts[parts.length - 1] : "";
    const label = n((value ? parts.slice(0, -1) : parts).join(" "));
    if (!value) {
      if (/^Add-ons$/i.test(label)) rows.push({ label, value: "" });
      else pending = n(`${pending} ${label}`);
      continue;
    }
    rows.push({ label: n(`${pending} ${label}`), value });
    pending = "";
  }
  return rows;
}

/** Confirmation's price box rows, in page order, from "Basic Premium" to "Total Premium" (SecarangConfirmationPage.read()). */
export function confirmationRows(conf: Record<string, string> | undefined): PriceRow[] {
  const entries = Object.entries(conf ?? {});
  const a = entries.findIndex(([k]) => /^Basic Premium$/i.test(n(k)));
  const b = entries.findIndex(([k]) => /^Total Premium$/i.test(n(k)));
  if (a < 0 || b < a) return [];
  return entries.slice(a, b + 1).map(([label, value]) => ({ label: n(label), value: n(value) }));
}

/** CIBO Transaction Details' insurer box text → its price rows from "Basic Premium" to "Total Premium". */
export function ciboRows(boxText: string): PriceRow[] {
  const ls = boxText.split(/\r?\n/).map(n).filter(Boolean);
  const a = ls.findIndex((l) => /^Basic Premium$/i.test(l));
  if (a < 0) return [];
  const rows: PriceRow[] = [];
  for (let i = a; i < ls.length; i++) {
    const label = ls[i];
    const next = ls[i + 1] ?? "";
    if (isAmount(next)) {
      rows.push({ label, value: next });
      i++;
      if (/^Total Premium$/i.test(label)) break;
    } else rows.push({ label, value: "" }); // the "Add-ons" heading
  }
  return rows;
}

/**
 * The add-on lines of a breakdown: every amount row after the NCD row and before "Gross Premium", except "Premium
 * After NCD" and the "Add-ons" heading (an add-on such as All Drivers is printed ABOVE "Premium After NCD", the others
 * under "Add-ons").
 */
export function addOnRows(rows: PriceRow[]): PriceRow[] {
  const a = rows.findIndex((r) => /^NCD\b/i.test(r.label));
  const b = rows.findIndex((r) => /^Gross Premium$/i.test(r.label));
  if (a < 0 || b < a) return [];
  return rows.slice(a + 1, b).filter((r) => r.value && !/^Premium After NCD$/i.test(r.label));
}

/** Compare two add-on lists by name (any case) and value. */
export function sameAddOns(a: PriceRow[], b: PriceRow[]): { ok: boolean; onlyA: string[]; onlyB: string[]; differ: string[] } {
  const ma = new Map(a.map((r) => [key(r.label), r]));
  const mb = new Map(b.map((r) => [key(r.label), r]));
  const onlyA = a.filter((r) => !mb.has(key(r.label))).map((r) => `${r.label} ${r.value}`);
  const onlyB = b.filter((r) => !ma.has(key(r.label))).map((r) => `${r.label} ${r.value}`);
  const differ = a.filter((r) => mb.has(key(r.label)) && valueKey(mb.get(key(r.label))!.value) !== valueKey(r.value)).map((r) => `${r.label}: ${r.value} vs ${mb.get(key(r.label))!.value}`);
  return { ok: a.length > 0 && a.length === b.length && !onlyA.length && !onlyB.length && !differ.length, onlyA, onlyB, differ };
}

/** The row named `label` (any case) in a list, undefined when none. */
export const rowOf = (rows: PriceRow[], label: RegExp) => rows.find((r) => label.test(r.label));

/**
 * 12406_RC_TS1 E10 on one breakdown: Basic Premium − NCD + the add-on lines listed between the NCD row and "Premium
 * After NCD", against the "Premium After NCD" shown.
 */
export function premiumAfterNcd(rows: PriceRow[]): { basic: number; ncd: number; above: PriceRow[]; sum: number; stated: number; ok: boolean; shows: string } {
  const iN = rows.findIndex((r) => /^NCD\b/i.test(r.label));
  const iP = rows.findIndex((r) => /^Premium After NCD$/i.test(r.label));
  const basic = amountOf(rowOf(rows, /^Basic Premium$/i)?.value ?? "");
  const ncd = Math.abs(amountOf(iN >= 0 ? rows[iN].value : ""));
  const above = iN >= 0 && iP > iN ? rows.slice(iN + 1, iP).filter((r) => r.value) : [];
  const sum = Math.round((basic - ncd + above.reduce((t, r) => t + amountOf(r.value), 0)) * 100) / 100;
  const stated = amountOf(iP >= 0 ? rows[iP].value : "");
  const ok = ![basic, ncd, sum, stated].some(Number.isNaN) && iP > iN && Math.abs(sum - stated) < 0.005;
  const shows = `Basic Premium ${Number.isNaN(basic) ? "?" : basic.toFixed(2)} − NCD ${Number.isNaN(ncd) ? "?" : ncd.toFixed(2)}${above.map((r) => ` + ${r.label} ${valueKey(r.value) || r.value}`).join("")} = ${Number.isNaN(sum) ? "?" : sum.toFixed(2)}; 'Premium After NCD' shown ${Number.isNaN(stated) ? "(not found)" : stated.toFixed(2)}`;
  return { basic, ncd, above, sum, stated, ok, shows };
}

/** Rows as text, one per line ("label  value"), for a box on screen. */
export const rowsText = (rows: PriceRow[]) => rows.map((r) => `${r.label}${r.value ? `  ${r.value}` : ""}`).join("\n") || "(none read)";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Show up to three texts side by side in this tab (for the video and the proof screenshot); returns the boxes. */
export async function showColumns(page: Page, heading: string, cols: { title: string; text: string }[]) {
  await page.setContent(`<html><body style="margin:20px;font-family:Arial"><h2 style="background:#172B4D;color:#fff;padding:10px">${esc(heading)}</h2>
    <div style="display:flex;gap:20px">${cols.map((b, i) => `<div style="flex:1"><h3>${esc(b.title)}</h3><pre id="qa-col-${i}" style="white-space:pre-wrap;font:15px Consolas;border:1px solid #999;padding:10px">${esc(b.text)}</pre></div>`).join("")}</div></body></html>`);
  await page.waitForTimeout(2500);
  return cols.map((_, i) => page.locator(`#qa-col-${i}`));
}
