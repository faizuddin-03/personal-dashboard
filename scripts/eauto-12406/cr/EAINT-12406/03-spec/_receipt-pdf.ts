// EAINT-12406 — reading a Secarang / CIBO receipt PDF, for the gated specs of this ticket (sheet RG first,
// 29.10.2026). Not a test file (the `cr` project runs only *.cr.spec.ts).
//
// The receipt is read with `pdftotext -layout`, exactly as the BEFORE half read it on 28.10.2026
// (03-spec/before-run/ts-before.mjs `openReceipt`), so a BEFORE / AFTER comparison compares like with like.
// Probe 29.10.2026 (03-spec/probes-automation/rg-insurer-box.mjs, read only) on the CIBO receipts of
// BR69005852 / BR60006309 / BR55004008: the block is the line "Insurer", the insurer's line(s), a blank line,
// then "Coverage Type".
//
// A receipt shows the customer's name, IC, phone and address: its full text is shown on screen only for the
// video (git-ignored); proof screenshots show the Insurer block alone.
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import type { TsRun } from "@fixtures";

/** pdftotext: PDFTOTEXT, else Git for Windows' copy, else the one on PATH. */
function pdftotextBin(): string {
  if (process.env.PDFTOTEXT) return process.env.PDFTOTEXT;
  const git = "C:/Program Files/Git/mingw64/bin/pdftotext.exe";
  return fs.existsSync(git) ? git : "pdftotext";
}

/** The PDF's text, layout kept. */
export function receiptText(file: string): string {
  return execFileSync(pdftotextBin(), ["-layout", file, "-"], { encoding: "utf8" });
}

/**
 * The Insurer block: the line "Insurer" and the non-empty lines after it, up to (not including) "Coverage Type",
 * at most 6 lines. [] when the receipt has no "Insurer" line. Works on a whole text or on lines already split
 * (the BEFORE run logged `lines.slice(i, i + 4)` filtered, which can end with "Coverage Type": cut the same way).
 */
export function insurerBlock(textOrLines: string | string[]): string[] {
  const lines = (Array.isArray(textOrLines) ? textOrLines : textOrLines.split(/\r?\n/)).map((l) => l.replace(/\s+$/, ""));
  const i = lines.findIndex((l) => /^\s*Insurer\s*$/.test(l) || /^\s*Insurer\s{2,}/.test(l));
  if (i < 0) return [];
  const out: string[] = [];
  for (const raw of lines.slice(i, i + 7)) {
    const l = raw.trim();
    if (/^Coverage Type\b/.test(l)) break;
    if (l) out.push(l);
  }
  return out;
}

export const sameLines = (a: string[], b: string[]) => a.length === b.length && a.every((x, k) => x === b[k]);
export const quoteLines = (a: string[]) => (a.length ? a.map((x) => `"${x}"`).join(" / ") : "(no Insurer block found)");

/**
 * Show a receipt in this tab for the video (its full text, as `pdftotext -layout` reads it), then its Insurer
 * block alone, and return that block plus a locator to outline in the proof screenshot.
 */
export async function showReceiptInsurerBlock(ts: TsRun, file: string, what: string) {
  const text = receiptText(file);
  const block = insurerBlock(text);
  await ts.showFile(file, `${what} (whole receipt, pdftotext)`, text);
  await ts.showFile(file, `${what}: Insurer block`, block.length ? block.join("\n") : "(no 'Insurer' line in this receipt)");
  return { block, hl: ts.page.locator("pre").first(), file: path.basename(file) };
}
