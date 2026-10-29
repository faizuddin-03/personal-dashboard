// Copies Elf's TS workbook into the synced QA Team "CR Test Scenarios" folder
// (data/agents/setup.json → sharepointDir), only when Faizuddin presses the
// button in the Elf panel (2026-10-29: "i want to have button in elf so that i
// can tell it to put in the QA sharepoint folder"). Never automatic: the QA
// Team site is shared, and the standing rule is to touch it only when he names it.
//
// The ticket's existing folder there is reused ("EAINT-10089, 10937, 11175 -
// ..." style names count); otherwise a new "<KEY> - <title>" folder is made.
// Nothing there is deleted, renamed or overwritten: a taken name gets " (v2)".

import fs from "node:fs";
import path from "node:path";
import { setupInfo, repoPath } from "../store.mjs";
import { digitsOf, nameHasTicket } from "../prompts-common.mjs";
import { freeName } from "./my-folder.mjs";

// Short folder names: OneDrive cannot sync paths over 260 characters.
const FOLDER_MAX = 80;

/** The ticket's folder in the QA Team folder: { dir, existed }, or { error }. */
export function qaTicketDir(key, title) {
  const root = setupInfo().sharepointDir;
  if (!root || !fs.existsSync(root)) return { error: "The synced QA Team folder is not set up on this PC (data/agents/setup.json → sharepointDir)." };
  const digits = digitsOf(key);
  let entries = [];
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch (e) { return { error: e.message }; }
  const hit = entries.find(e => e.isDirectory() && nameHasTicket(e.name, digits));
  if (hit) return { dir: path.join(root, hit.name), existed: true };
  const clean = String(title ?? "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  const name = `${key}${clean ? ` - ${clean}` : ""}`.slice(0, FOLDER_MAX).replace(/[. ]+$/, "");
  return { dir: path.join(root, name), existed: false };
}

/** Copies the ticket's workbook (repo path in ticket.files.workbook) into its QA Team folder. */
export function copyWorkbookToQa(ticket) {
  const rel = ticket.files?.workbook;
  const src = rel ? repoPath(rel) : null;
  if (!src || !fs.existsSync(src)) return { error: "Elf has not built the TS workbook yet." };
  const where = qaTicketDir(ticket.key, ticket.title);
  if (where.error) return where;
  fs.mkdirSync(where.dir, { recursive: true });
  const ext = path.extname(src);
  const target = freeName(where.dir, path.basename(src, ext), ext);
  fs.copyFileSync(src, target);
  return { file: target, folderExisted: where.existed };
}
