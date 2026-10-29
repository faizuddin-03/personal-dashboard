// Faizuddin's personal OneDrive ticket folders (2026-10-29: "i want the
// characters to be able to access my personal sharepoint folder ... elf should
// create excel TS in the personal onedrive folder"). Same place as the standing
// "my SharePoint" rule: <OneDrive - MODE FAIR SDN BHD>/eAuto Documents/<KEY>/.
// It syncs to his personal SharePoint, never the QA Team site.
//
// Files there are his: nothing here deletes, renames or overwrites one. A name
// already taken gets " (v2)", " (v3)" … instead, so an open workbook never
// blocks a save.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** The "eAuto Documents" main folder (PIPELINE_MY_FOLDER overrides it, for tests). */
export const MY_DOCS = process.env.PIPELINE_MY_FOLDER
  || path.join(/*turbopackIgnore: true*/ os.homedir(), "OneDrive - MODE FAIR SDN BHD", "eAuto Documents");

/** True when OneDrive is set up on this PC (its root folder exists). */
export function myDocsAvailable() {
  try { return fs.statSync(path.dirname(MY_DOCS)).isDirectory(); } catch { return false; }
}

/** <eAuto Documents>/<KEY>, bare key as the folder name. */
export function myTicketDir(key) {
  return path.join(/*turbopackIgnore: true*/ MY_DOCS, String(key).toUpperCase());
}

/** Creates the ticket folder (and "eAuto Documents") when missing. Returns its path, or null without OneDrive. */
export function ensureMyTicketDir(key) {
  if (!myDocsAvailable()) return null;
  const dir = myTicketDir(key);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** First free "<base><ext>", "<base> (v2)<ext>", … in dir. */
export function freeName(dir, base, ext) {
  if (!fs.existsSync(path.join(dir, `${base}${ext}`))) return path.join(dir, `${base}${ext}`);
  for (let n = 2; n < 1000; n++) {
    const p = path.join(dir, `${base} (v${n})${ext}`);
    if (!fs.existsSync(p)) return p;
  }
  return path.join(dir, `${base} (v${Date.now()})${ext}`);
}

/** Copies a file into the ticket folder under a free name. Returns the new path, or null without OneDrive. */
export function copyToMyTicketDir(key, src, base) {
  const dir = ensureMyTicketDir(key);
  if (!dir) return null;
  const ext = path.extname(src);
  const target = freeName(dir, base ?? path.basename(src, ext), ext);
  fs.copyFileSync(src, target);
  return target;
}
