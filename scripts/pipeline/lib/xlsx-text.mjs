// Workbook helpers for the pipeline (2026-10-27). Same listing and text
// conversion as scripts/agents/run-agent.mjs (listWorkbooks, xlsxToMarkdown),
// kept here because run-agent.mjs runs its main() on import.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

/** Every .xlsx under dir (recursive), skipping Office lock files. */
export function listWorkbooks(dir) {
  const out = [];
  const walk = (d, depth) => {
    if (depth > 6) return;
    let entries; try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (/\.xlsx$/i.test(e.name) && !e.name.startsWith("~$")) {
        try {
          const st = fs.statSync(p);
          out.push({ path: p, rel: path.relative(dir, p).split(path.sep).join("/"), mtime: st.mtimeMs, size: st.size });
        } catch { /* vanished or cloud-only */ }
      }
    }
  };
  walk(dir, 0);
  return out;
}

/** Skip the blank template, scratch "Book" files and workbooks marked [OUTDATED] (same filter as the Scribe). */
export const isStudyableWorkbook = rel => !/\[(TEMPLATE|OUTDATED)\]|(^|\/)Book\d*\.xlsx$/i.test(rel);

/** Cell text only, row by row — the same mirror format the SharePoint Scribe writes. */
export async function xlsxToMarkdown(src, dest) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const out = [`# ${path.basename(src)} — text copy (${new Date().toLocaleString("en-MY")})`, "", "Cell text only, row by row; formatting and images are not kept.", ""];
  wb.eachSheet(ws => {
    out.push(`## Sheet: ${ws.name}`, "");
    let n = 0;
    ws.eachRow({ includeEmpty: false }, (row, r) => {
      if (n++ > 4000) return;
      const cells = (row.values ?? []).slice(1).map(v => {
        if (v == null) return "";
        if (typeof v === "object") return v.richText ? v.richText.map(t => t.text).join("") : v.text ?? v.result ?? (v instanceof Date ? v.toISOString().slice(0, 10) : JSON.stringify(v));
        return String(v);
      }).map(s => String(s).replace(/\r?\n/g, " ⏎ ").replace(/\|/g, "/").trim());
      if (cells.some(Boolean)) out.push(`R${r} | ${cells.join(" | ")}`);
    });
    out.push("");
  });
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.writeFile(dest, out.join("\n"));
}

/** True when dest exists and is newer than src. */
export function mirrorFresh(src, dest) {
  try { return fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs; } catch { return false; }
}

/**
 * OneDrive "cloud-only" files (not downloaded to this PC) fail to open with a
 * bare "UNKNOWN: unknown error, read". On 2026-10-27 all 7 such workbooks had
 * paths over 260 characters, which OneDrive cannot download on open while
 * Windows long paths are off. Turn that into a message Faizuddin can act on.
 */
export function explainReadError(src, err) {
  const code = err?.code ?? "";
  if (code === "UNKNOWN" || code === "EIO" || /unknown error, read/i.test(String(err?.message))) {
    const long = String(src).length > 259 ? ` Its path is ${String(src).length} characters (over 260), so OneDrive cannot download it when a program opens it.` : "";
    return `OneDrive has not downloaded this workbook to the PC (cloud-only).${long} Fix: in File Explorer right-click it (or its folder) → "Always keep on this device", wait for the green tick, then try again.`;
  }
  return String(err?.message ?? err);
}

/** Converts with a readable error for cloud-only files. */
export async function convertWorkbook(src, dest) {
  try { await xlsxToMarkdown(src, dest); }
  catch (e) { throw new Error(explainReadError(src, e)); }
}

/**
 * Every place past QA Team test scripts live, best first (2026-10-27: the
 * Secarang/CIBO scripts are in another SharePoint folder that is not synced,
 * and Scribe could not find them):
 *   1. the synced eAuto folder (data/agents/setup.json → sharepointDir)
 *   2. any other OneDrive shortcut whose name mentions "Test Scenario"
 *      (e.g. a Secarang & CIBO shortcut, once Faizuddin adds one)
 *   3. snapshot copies kept in the repo under _reference/sharepoint/
 * `prefix` keeps text copies from different sources apart under qa-team-ts/.
 */
export function tsSources(root) {
  const out = [];
  const seen = new Set();
  const add = (dir, label, prefix) => {
    if (!dir) return;
    const key = path.resolve(dir).toLowerCase();
    if (seen.has(key)) return;
    try { if (!fs.statSync(dir).isDirectory()) return; } catch { return; }
    seen.add(key);
    out.push({ dir, label, prefix });
  };
  let setup = null;
  try { setup = JSON.parse(fs.readFileSync(path.join(root, "data", "agents", "setup.json"), "utf8")); } catch { /* none yet */ }
  add(setup?.sharepointDir, "synced eAuto CR Test Scenarios", "");
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const shortcuts = path.join(home, "OneDrive - MODE FAIR SDN BHD", "Shortcuts");
  try {
    for (const name of fs.readdirSync(shortcuts)) {
      if (/test scenario/i.test(name)) add(path.join(shortcuts, name), `synced ${name}`, name);
    }
  } catch { /* no shortcuts folder */ }
  const snap = path.join(root, "_reference", "sharepoint");
  add(path.join(snap, "secarang-cibo-cr-test-scenarios"), "repo snapshot: Secarang & CIBO CR Test Scenarios", "secarang-cibo");
  add(path.join(snap, "eauto-cr-test-scenarios"), "repo snapshot: eAuto CR Test Scenarios", "eauto-snapshot");
  return out;
}

/** All studyable workbooks from every source; a file name seen in an earlier (fresher) source wins. */
export function listAllWorkbooks(root) {
  const files = [];
  const names = new Set();
  for (const s of tsSources(root)) {
    for (const f of listWorkbooks(s.dir)) {
      if (!isStudyableWorkbook(f.rel)) continue;
      const base = path.basename(f.rel).toLowerCase();
      if (names.has(base)) continue;
      names.add(base);
      files.push({ ...f, source: s.label, mirrorRel: (s.prefix ? `${s.prefix}/` : "") + f.rel.replace(/\.xlsx$/i, ".md") });
    }
  }
  return files;
}

// CLI (Scribe may run this from its chat, 2026-10-27):
//   node scripts/pipeline/lib/xlsx-text.mjs <EAINT-key or words from the file name>
// Converts every matching workbook from any test-script source (tsSources)
// into _reference/sharepoint/qa-team-ts/<source prefix>/<path>.md and prints the paths.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
if (isMain) {
  const query = process.argv.slice(2).join(" ").trim().toLowerCase();
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..", "..");
  if (!query) { console.log("Usage: node scripts/pipeline/lib/xlsx-text.mjs <EAINT-key or words from the file name>"); process.exit(2); }
  const hits = listAllWorkbooks(root).filter(f => f.rel.toLowerCase().includes(query));
  if (!hits.length) {
    console.log(`No workbook matches "${query}". Searched: ${tsSources(root).map(s => s.label).join("; ") || "nothing (no sources found)"}.`);
    process.exit(1);
  }
  let failed = 0;
  for (const f of hits.slice(0, 10)) {
    const dest = path.join(root, "_reference", "sharepoint", "qa-team-ts", f.mirrorRel);
    try { await convertWorkbook(f.path, dest); console.log(`OK  [${f.source}] ${f.rel} -> ${path.relative(root, dest).split(path.sep).join("/")}`); }
    catch (e) { failed++; console.log(`FAIL [${f.source}] ${f.rel}: ${e.message}`); }
  }
  process.exit(failed ? 1 : 0);
}
