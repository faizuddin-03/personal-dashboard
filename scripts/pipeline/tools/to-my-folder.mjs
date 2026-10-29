#!/usr/bin/env node
// Copies files into Faizuddin's personal OneDrive ticket folder
// (eAuto Documents/<KEY>/) — the one way a character puts a file there
// (2026-10-29). cp / PowerShell stay denied for the characters, and the Write
// tool cannot write an .xlsx, so Elf could not copy a workbook without this.
//
//   node scripts/pipeline/tools/to-my-folder.mjs <KEY> <file> [<file> ...]
//
// <file> must be inside the repo (repo-relative or absolute). Never overwrites:
// a taken name gets " (v2)", " (v3)" …. Prints one line per file: the new path.

import fs from "node:fs";
import path from "node:path";
import { ROOT, KEY_RE } from "../store.mjs";
import { copyToMyTicketDir, myDocsAvailable } from "../lib/my-folder.mjs";

const [rawKey, ...files] = process.argv.slice(2);
const key = String(rawKey ?? "").trim().toUpperCase();
if (!KEY_RE.test(key) || !files.length) {
  console.error("Usage: node scripts/pipeline/tools/to-my-folder.mjs <KEY> <file> [<file> ...]");
  process.exit(2);
}
if (!myDocsAvailable()) {
  console.error("OneDrive is not set up on this PC, so there is no personal folder to copy into. Tell Faizuddin.");
  process.exit(1);
}

let failed = 0;
for (const f of files) {
  const src = path.resolve(ROOT, f);
  const rel = path.relative(ROOT, src);
  if (rel.startsWith("..") || path.isAbsolute(rel)) { console.error(`Not copied (outside the repo): ${f}`); failed++; continue; }
  if (!fs.existsSync(src) || !fs.statSync(src).isFile()) { console.error(`Not copied (no such file): ${f}`); failed++; continue; }
  try {
    console.log(`Copied: ${copyToMyTicketDir(key, src)}`);
  } catch (e) {
    console.error(`Not copied (${e.message}): ${f}`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
